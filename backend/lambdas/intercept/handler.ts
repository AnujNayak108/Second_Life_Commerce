/**
 * EcoBridge Checkout Intercept Lambda
 *
 * Phase 3: Location-Based Intercept
 * When a buyer proceeds to checkout, queries DynamoDB for items matching:
 * 1. Fuzzy product name match (keyword overlap)
 * 2. Same PIN code (geographic proximity — buyer and seller in same area)
 */

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";

const ddbClient = new DynamoDBClient({ region: "ap-south-1" });
const ddb = DynamoDBDocumentClient.from(ddbClient);
const TABLE_NAME = process.env.TABLE_NAME || "SecondLifeCommerceDB";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCorsResponse(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function tokenize(name: string): string[] {
  const noise = new Set([
    "the","a","an","with","and","or","for","in","of","to","from","by","on","at",
    "is","it","its","this","that","gps","mm","inch","gb","ram","storage","display","size",
  ]);
  return name.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 1 && !noise.has(w));
}

function matchScore(cartTokens: string[], itemName: string): number {
  const itemTokens = new Set(tokenize(itemName));
  if (cartTokens.length === 0 || itemTokens.size === 0) return 0;
  let matches = 0;
  for (const token of cartTokens) {
    for (const itemToken of itemTokens) {
      if (itemToken.includes(token) || token.includes(itemToken)) { matches++; break; }
    }
  }
  return matches / cartTokens.length;
}

function estimateEcoPrice(condition: string, originalPrice?: number): number {
  const base = originalPrice || 4000;
  const multiplier: Record<string, number> = { "Like New": 0.75, "Good": 0.60, "Acceptable": 0.40, "Poor": 0.20 };
  return Math.round(base * (multiplier[condition] || 0.5));
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (event: any) => {
  if (event.httpMethod === "OPTIONS") return buildCorsResponse(200, {});

  try {
    const body = JSON.parse(event.body || "{}");
    const { zip_code, cart_item_name } = body;

    if (!zip_code) return buildCorsResponse(400, { error: "Missing required field: zip_code" });
    if (!cart_item_name) return buildCorsResponse(400, { error: "Missing required field: cart_item_name" });

    // Query all graded items from DynamoDB via GSI1
    const result = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: "GSI1",
        KeyConditionExpression: "SK = :sk",
        ExpressionAttributeValues: { ":sk": "GRADE" },
        Limit: 100,
        ScanIndexForward: false,
      })
    );

    const items = result.Items || [];
    if (items.length === 0) {
      return buildCorsResponse(200, { match_found: false, message: `No items found in PIN ${zip_code}.` });
    }

    const cartTokens = tokenize(cart_item_name);
    let bestMatch: any = null;
    let bestScore = 0;

    for (const item of items) {
      // ★ CONDITION 1: PIN code must match (geographic proximity)
      const itemPin = item.zipCode || item.sellerPinCode || "";
      if (itemPin !== zip_code) continue;

      // ★ CONDITION 2: Only items eligible for resale (not Poor/recycled)
      if (item.condition === "Poor") continue;

      // ★ CONDITION 3: Fuzzy name match
      const itemName = item.productName || item.productHint || item.topLabel || "";
      const labels = (item.allLabels as string[]) || [];
      const combinedName = `${itemName} ${labels.join(" ")}`;
      const score = matchScore(cartTokens, combinedName);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = item;
      }
    }

    const MATCH_THRESHOLD = 0.25;

    if (bestMatch && bestScore >= MATCH_THRESHOLD) {
      const condition = bestMatch.condition || "Good";
      const originalPrice = bestMatch.originalPrice || 4000;
      const ecoPrice = estimateEcoPrice(condition, originalPrice);
      const discountPercent = Math.round(((originalPrice - ecoPrice) / originalPrice) * 100);
      const sellerPin = bestMatch.zipCode || bestMatch.sellerPinCode || zip_code;

      return buildCorsResponse(200, {
        match_found: true,
        item: {
          item_id: bestMatch.PK?.replace("ITEM#", "") || bestMatch.id,
          product_name: bestMatch.productName || cart_item_name.split(" ").slice(0, 5).join(" ") + " (Certified Pre-Owned)",
          condition,
          price: ecoPrice,
          seller_id: bestMatch.sellerName || "EcoBridge Seller",
          seller_pin: sellerPin,
          carbon_saved_estimate: bestMatch.carbonSaved || "8.2kg CO2",
        },
        intercept_message: `Wait! A verified neighbor in PIN ${zip_code} is selling this exact item in "${condition}" condition. Buy locally to save money and reduce carbon emissions!`,
        eco_discount_percent: discountPercent,
      });
    }

    return buildCorsResponse(200, { match_found: false, message: `No matching items found in PIN ${zip_code}.` });
  } catch (err: any) {
    console.error("Intercept error:", err);
    return buildCorsResponse(500, { error: "Internal server error", detail: err.message });
  }
};
