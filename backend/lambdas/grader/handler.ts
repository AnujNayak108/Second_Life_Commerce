/**
 * EcoBridge AI Grader Lambda — v1 + v2 Multi-Image Pipeline
 *
 * v1 (backward compat): Single base64 image → DetectLabels → grade
 * v2 (new): 4 angle images on S3 → per-image DetectLabels → multi-axis health score
 */

import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

import {
  computeIdentityMatch,
  computeCompleteness,
  computeCosmeticCondition,
  computeHealthScore,
  conditionFromHealthScore,
  scoreDamageFromLabels,
  selectHeroImage,
  REQUIRED_ANGLES,
  CATEGORY_LABEL_MAP,
  type LabelResult,
  type PerImageResult,
  type ExpectedProduct,
} from "./scoring";

// ─── AWS Clients ──────────────────────────────────────────────────────────────
const rekognition = new RekognitionClient({ region: "ap-south-1" });
const s3 = new S3Client({ region: "ap-south-1" });
const ddbClient = new DynamoDBClient({ region: "ap-south-1" });
const ddb = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.TABLE_NAME || "SecondLifeCommerceDB";
const BUCKET = process.env.GRADING_MEDIA_BUCKET || "secondlife-grading-media";

// ─── Existing Constants (kept for v1 backward compat) ─────────────────────────
const DAMAGE_KEYWORDS = ["Damage", "Broken", "Stain", "Scratch", "Crack", "Dent", "Torn"];
const POSITIVE_KEYWORDS = ["Electronics", "Device", "Footwear", "Shoe", "Clothing", "Headphones", "Phone", "Computer", "Watch", "Keyboard", "Mouse", "Speaker", "Camera"];

const CREDIT_MAP: Record<string, number> = { "Like New": 1200, "Good": 800, "Acceptable": 400, "Poor": 100 };
const ROUTING_MAP: Record<string, string> = { "Like New": "LOCAL_RESALE", "Good": "LOCAL_RESALE", "Acceptable": "WAREHOUSE_REFURB", "Poor": "RECYCLE" };
const CARBON_MAP: Record<string, string> = { "Like New": "12.5kg CO2", "Good": "8.2kg CO2", "Acceptable": "4.1kg CO2", "Poor": "2.0kg CO2" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stripBase64Prefix(imageData: string): string {
  if (imageData.includes("base64,")) return imageData.split("base64,")[1];
  return imageData;
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

// v1 legacy grading (single image, keyword matching)
function gradeFromLabelsLegacy(labels: LabelResult[]): string {
  const hasPositive = labels.some(l => POSITIVE_KEYWORDS.some(kw => l.name.includes(kw)) && l.confidence >= 75);
  const damageLabels = labels.filter(l => DAMAGE_KEYWORDS.some(kw => l.name.includes(kw)));
  const maxDamage = damageLabels.length > 0 ? Math.max(...damageLabels.map(d => d.confidence)) : 0;

  if (hasPositive && damageLabels.length === 0) return "Like New";
  if (hasPositive && maxDamage < 70) return "Good";
  if (maxDamage >= 70 && maxDamage < 85) return "Acceptable";
  if (maxDamage >= 85) return "Poor";
  return hasPositive ? "Good" : "Acceptable";
}

// ─── v2: Analyze a single image from S3 ──────────────────────────────────────

async function analyzeImageFromS3(s3Key: string, angle: string): Promise<PerImageResult> {
  // Call Rekognition with S3 reference (no need to download the image)
  const detectResult = await rekognition.send(
    new DetectLabelsCommand({
      Image: { S3Object: { Bucket: BUCKET, Name: s3Key } },
      MaxLabels: 20,
      MinConfidence: 60,
    })
  );

  const labels: LabelResult[] = (detectResult.Labels || []).map(l => ({
    name: l.Name || "Unknown",
    confidence: l.Confidence || 0,
  }));

  // Run damage detection (heuristic mode — label-based)
  const { imageDamageScore, findings } = scoreDamageFromLabels(labels);

  return {
    angle,
    labels,
    damageFindings: findings,
    imageDamageScore,
    qualityPassed: true, // basic check: if Rekognition returned labels, image is valid
    blurScore: labels.length > 0 ? Math.min(labels[0].confidence / 100, 1) : 0.5,
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export const handler = async (event: any) => {
  if (event.httpMethod === "OPTIONS") return buildCorsResponse(200, {});

  try {
    const body = JSON.parse(event.body || "{}");
    const version = body.version || "1";

    // ═══════════════════════════════════════════════════════════════════════════
    // v2 — Multi-Image Pipeline
    // ═══════════════════════════════════════════════════════════════════════════
    if (version === "2") {
      const { item_id, zip_code, expected_product, images, video } = body;

      // Validation
      if (!item_id) return buildCorsResponse(400, { error: "Missing required field: item_id" });
      if (!zip_code) return buildCorsResponse(400, { error: "Missing required field: zip_code" });
      if (!expected_product) return buildCorsResponse(400, { error: "Missing required field: expected_product" });
      if (!images) return buildCorsResponse(400, { error: "Missing required field: images" });

      // Check all 4 angles present
      const missingAngles = REQUIRED_ANGLES.filter(a => !images[a]?.s3Key);
      if (missingAngles.length > 0) {
        return buildCorsResponse(400, {
          error: "Missing required images. Front, back, left, and right photos are all required.",
          missing_angles: missingAngles,
        });
      }

      const startTime = Date.now();

      // Analyze each angle image via Rekognition
      const perImageResults: PerImageResult[] = await Promise.all(
        REQUIRED_ANGLES.map(angle => analyzeImageFromS3(images[angle].s3Key, angle))
      );

      // Build expected product data
      const expectedProd: ExpectedProduct = {
        name: expected_product.name || "",
        category: expected_product.category || "electronics",
        expectedLabels: expected_product.expected_labels || 
          CATEGORY_LABEL_MAP[expected_product.category?.toLowerCase()] || 
          CATEGORY_LABEL_MAP.electronics,
        sellerConfirmedMatch: expected_product.seller_confirmed_match ?? true,
      };

      // Compute sub-scores
      const perImageLabels = perImageResults.map(r => r.labels);
      const identityMatch = computeIdentityMatch(perImageLabels, expectedProd);
      const completeness = computeCompleteness(
        perImageResults.map(r => r.angle),
        !!video?.s3Key
      );
      const cosmeticCondition = computeCosmeticCondition(perImageResults);

      // Identity gate
      if (identityMatch.status === "mismatch") {
        // Save with pending_manual_review status but don't award credits
        await ddb.send(new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            PK: `ITEM#${item_id}`,
            SK: "GRADE",
            status: "pending_manual_review",
            identityMatch,
            expectedProduct: expected_product,
            zipCode: zip_code,
            createdAt: new Date().toISOString(),
          },
        }));
        return buildCorsResponse(422, {
          error: "identity_mismatch",
          identity_check: {
            status: "mismatch",
            message: `Detected labels don't match expected product "${expectedProd.name}" (${expectedProd.category}).`,
            requires_manual_review: true,
          },
          item_id,
        });
      }

      // Compute overall health score
      const healthScore = computeHealthScore(identityMatch, completeness, cosmeticCondition);
      const condition = conditionFromHealthScore(healthScore.overall);
      const greenCredits = CREDIT_MAP[condition] || 400;
      const routing = ROUTING_MAP[condition] || "WAREHOUSE_REFURB";
      const carbonSaved = CARBON_MAP[condition] || "4.1kg CO2";

      // Select hero image
      const heroAngle = selectHeroImage(perImageResults);
      const heroS3Key = images[heroAngle]?.s3Key || images.front.s3Key;
      const bucketUrl = `https://${BUCKET}.s3.ap-south-1.amazonaws.com`;

      const p2pGallery = {
        hero_image_s3_key: heroS3Key,
        hero_image_url: `${bucketUrl}/${heroS3Key}`,
        gallery_s3_keys: REQUIRED_ANGLES.map(a => images[a].s3Key),
        gallery_urls: REQUIRED_ANGLES.map(a => `${bucketUrl}/${images[a].s3Key}`),
      };

      // Persist to DynamoDB
      await ddb.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `ITEM#${item_id}`,
          SK: "GRADE",
          condition,
          healthScore,
          expectedProduct: expected_product,
          images: perImageResults.map((r, i) => ({
            angle: r.angle,
            s3Key: images[r.angle].s3Key,
            s3Url: `${bucketUrl}/${images[r.angle].s3Key}`,
            labels: r.labels.slice(0, 5),
            damage: { method: "heuristic", findings: r.damageFindings, imageDamageScore: r.imageDamageScore },
          })),
          video: video?.s3Key ? { s3Key: video.s3Key, s3Url: `${bucketUrl}/${video.s3Key}` } : null,
          p2pGallery,
          greenCredits,
          routing,
          carbonSaved,
          zipCode: zip_code,
          sellerPinCode: zip_code,
          productName: expectedProd.name,
          sellerName: "Rahul M.",
          originalPrice: 4000,
          createdAt: new Date().toISOString(),
          status: identityMatch.status === "uncertain" ? "graded_pending_identity_review" : "graded",
          audit: { pipelineVersion: "grader-v2", processingTimeMs: Date.now() - startTime },
        },
      }));

      // Build response
      const topLabels = perImageResults.flatMap(r => r.labels).slice(0, 5);
      return buildCorsResponse(200, {
        version: "2",
        item_id,
        health_card: {
          condition,
          confidence: identityMatch.confidence,
          detected_labels: topLabels.map(l => `${l.name} (${Math.round(l.confidence)}%)`),
          health_score: {
            overall: healthScore.overall,
            identity_match: { score: identityMatch.score, status: identityMatch.status, matched_labels: identityMatch.matchedLabels },
            completeness: { score: completeness.score, angles_provided: completeness.anglesProvided, missing_angles: completeness.missingAngles, video_provided: completeness.videoProvided },
            cosmetic_condition: { score: cosmeticCondition.score, findings_count: cosmeticCondition.findingsCount, worst_severity: cosmeticCondition.worstSeverity },
          },
          per_image: perImageResults.map(r => ({
            angle: r.angle,
            s3_url: `${bucketUrl}/${images[r.angle].s3Key}`,
            labels: r.labels.slice(0, 5).map(l => `${l.name} (${Math.round(l.confidence)}%)`),
            damage_findings: r.damageFindings,
          })),
        },
        identity_check: {
          status: identityMatch.status,
          message: identityMatch.status === "match"
            ? `Detected labels match expected product category (${expectedProd.category}).`
            : `Identity uncertain — grade capped pending review.`,
          requires_manual_review: identityMatch.status === "uncertain",
        },
        routing_decision: routing,
        green_credits: greenCredits,
        earned_coins: greenCredits,
        carbon_saved_estimate: carbonSaved,
        p2p_gallery: p2pGallery,
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // v1 — Legacy Single-Image (backward compatibility)
    // ═══════════════════════════════════════════════════════════════════════════
    const { image, zip_code, product_name } = body;
    if (!image) return buildCorsResponse(400, { error: "Missing required field: image" });
    if (!zip_code) return buildCorsResponse(400, { error: "Missing required field: zip_code" });

    const rawBase64 = stripBase64Prefix(image);
    const imageBytes = Buffer.from(rawBase64, "base64");

    const detectResult = await rekognition.send(
      new DetectLabelsCommand({ Image: { Bytes: imageBytes }, MaxLabels: 20, MinConfidence: 60 })
    );

    const labels: LabelResult[] = (detectResult.Labels || []).map(l => ({
      name: l.Name || "Unknown",
      confidence: l.Confidence || 0,
    }));

    const condition = gradeFromLabelsLegacy(labels);
    const greenCredits = CREDIT_MAP[condition] || 400;
    const routing = ROUTING_MAP[condition] || "WAREHOUSE_REFURB";
    const carbonSaved = CARBON_MAP[condition] || "4.1kg CO2";
    const topLabel = labels.length > 0 ? labels.reduce((a, b) => a.confidence > b.confidence ? a : b) : { name: "Item", confidence: 0 };

    const itemId = randomUUID();
    await ddb.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: `ITEM#${itemId}`, SK: "GRADE", condition,
        topLabel: topLabel.name, topConfidence: Math.round(topLabel.confidence),
        allLabels: labels.map(l => `${l.name} (${Math.round(l.confidence)}%)`),
        greenCredits, routing, carbonSaved, zipCode: zip_code,
        sellerPinCode: zip_code, productName: product_name || topLabel.name,
        productHint: topLabel.name, sellerName: "Rahul M.", originalPrice: 4000,
        createdAt: new Date().toISOString(), status: "graded",
      },
    }));

    return buildCorsResponse(200, {
      health_card: {
        condition,
        detected_labels: labels.map(l => `${l.name} (${Math.round(l.confidence)}%)`),
        confidence: Math.round(topLabel.confidence),
      },
      routing_decision: routing,
      green_credits: greenCredits,
      earned_coins: greenCredits,
      carbon_saved_estimate: carbonSaved,
      item_id: itemId,
      deprecation_warning: "v1 single-image grading is deprecated. Upgrade to version:2 for multi-image pipeline.",
    });
  } catch (err: any) {
    console.error("Grader error:", err);
    return buildCorsResponse(500, { error: "Internal server error during grading", detail: err.message });
  }
};
