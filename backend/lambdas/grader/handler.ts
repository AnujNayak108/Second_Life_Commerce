/**
 * EcoBridge AI Grader Lambda
 *
 * Receives a base64-encoded image from the frontend, calls AWS Rekognition
 * DetectLabels, computes a condition grade, saves the result to DynamoDB,
 * and returns the health card to the caller.
 */

import {
  RekognitionClient,
  DetectLabelsCommand,
} from "@aws-sdk/client-rekognition";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

// ─── AWS Clients ──────────────────────────────────────────────────────────────
const rekognition = new RekognitionClient({ region: "ap-south-1" });
const ddbClient = new DynamoDBClient({ region: "ap-south-1" });
const ddb = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.TABLE_NAME || "SecondLifeCommerceDB";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAMAGE_KEYWORDS = ["Damage", "Broken", "Stain", "Scratch", "Crack", "Dent", "Torn"];
const POSITIVE_KEYWORDS = ["Electronics", "Device", "Footwear", "Shoe", "Clothing", "Headphones", "Phone", "Computer", "Watch", "Keyboard", "Mouse", "Speaker", "Camera"];

const CREDIT_MAP: Record<string, number> = {
  "Like New": 1200,
  "Good": 800,
  "Acceptable": 400,
  "Poor": 100,
};

const ROUTING_MAP: Record<string, string> = {
  "Like New": "LOCAL_RESALE",
  "Good": "LOCAL_RESALE",
  "Acceptable": "WAREHOUSE_REFURB",
  "Poor": "RECYCLE",
};

const CARBON_MAP: Record<string, string> = {
  "Like New": "12.5kg CO2",
  "Good": "8.2kg CO2",
  "Acceptable": "4.1kg CO2",
  "Poor": "2.0kg CO2",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripBase64Prefix(imageData: string): string {
  if (imageData.includes("base64,")) {
    return imageData.split("base64,")[1];
  }
  return imageData;
}

interface Label {
  name: string;
  confidence: number;
}

function gradeFromLabels(labels: Label[]): string {
  const hasPositive = labels.some((l) =>
    POSITIVE_KEYWORDS.some((kw) => l.name.includes(kw)) && l.confidence >= 75
  );
  const damageLabels = labels.filter((l) =>
    DAMAGE_KEYWORDS.some((kw) => l.name.includes(kw))
  );
  const maxDamageConfidence = damageLabels.length > 0
    ? Math.max(...damageLabels.map((d) => d.confidence))
    : 0;

  if (hasPositive && damageLabels.length === 0) return "Like New";
  if (hasPositive && maxDamageConfidence < 70) return "Good";
  if (maxDamageConfidence >= 70 && maxDamageConfidence < 85) return "Acceptable";
  if (maxDamageConfidence >= 85) return "Poor";

  // Default: if we see something recognizable but no clear damage
  return hasPositive ? "Good" : "Acceptable";
}

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

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (event: any) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return buildCorsResponse(200, {});
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const { image, zip_code, product_name } = body;

    if (!image) {
      return buildCorsResponse(400, { error: "Missing required field: image" });
    }
    if (!zip_code) {
      return buildCorsResponse(400, { error: "Missing required field: zip_code" });
    }

    // 1. Strip the data URI prefix and decode base64 → bytes
    const rawBase64 = stripBase64Prefix(image);
    const imageBytes = Buffer.from(rawBase64, "base64");

    // 2. Call Rekognition DetectLabels with raw bytes (no S3 needed)
    const detectResult = await rekognition.send(
      new DetectLabelsCommand({
        Image: { Bytes: imageBytes },
        MaxLabels: 20,
        MinConfidence: 60,
      })
    );

    const labels: Label[] = (detectResult.Labels || []).map((l) => ({
      name: l.Name || "Unknown",
      confidence: l.Confidence || 0,
    }));

    // 3. Determine condition grade from labels
    const condition = gradeFromLabels(labels);
    const greenCredits = CREDIT_MAP[condition] || 400;
    const routing = ROUTING_MAP[condition] || "WAREHOUSE_REFURB";
    const carbonSaved = CARBON_MAP[condition] || "4.1kg CO2";

    // Find the highest-confidence label for display
    const topLabel = labels.length > 0
      ? labels.reduce((a, b) => (a.confidence > b.confidence ? a : b))
      : { name: "Item", confidence: 0 };

    // 4. Save to DynamoDB
    const itemId = randomUUID();
    const now = new Date().toISOString();

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `ITEM#${itemId}`,
          SK: "GRADE",
          condition,
          topLabel: topLabel.name,
          topConfidence: Math.round(topLabel.confidence),
          allLabels: labels.map((l) => `${l.name} (${Math.round(l.confidence)}%)`),
          greenCredits,
          routing,
          carbonSaved,
          zipCode: zip_code,
          sellerPinCode: zip_code, // ★ PIN code for location-based intercept
          productName: product_name || topLabel.name, // ★ Product name for fuzzy matching
          productHint: topLabel.name,
          sellerName: "Rahul M.", // In production, from auth context
          originalPrice: 4000, // In production, from product catalog
          createdAt: now,
          status: "graded",
        },
      })
    );

    // 5. Return the health card response (matches frontend GradeResult interface)
    return buildCorsResponse(200, {
      health_card: {
        condition,
        detected_labels: labels.map((l) => `${l.name} (${Math.round(l.confidence)}%)`),
        confidence: Math.round(topLabel.confidence),
      },
      routing_decision: routing,
      green_credits: greenCredits,
      earned_coins: greenCredits,
      carbon_saved_estimate: carbonSaved,
      item_id: itemId,
    });
  } catch (err: any) {
    console.error("Grader error:", err);
    return buildCorsResponse(500, {
      error: "Internal server error during grading",
      detail: err.message,
    });
  }
};
