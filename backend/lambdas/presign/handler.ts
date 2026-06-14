/**
 * EcoBridge Presigned Upload Lambda
 * 
 * Issues S3 presigned PUT URLs for multi-angle image uploads.
 * The frontend PUTs directly to S3, bypassing API Gateway's 10MB limit.
 */

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: "ap-south-1" });
const BUCKET = process.env.GRADING_MEDIA_BUCKET || "secondlife-grading-media";

const VALID_ANGLES = ["front", "back", "left", "right", "video"];
const VALID_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const VALID_VIDEO_TYPES = ["video/mp4", "video/webm"];

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

export const handler = async (event: any) => {
  if (event.httpMethod === "OPTIONS") return buildCorsResponse(200, {});

  try {
    const body = JSON.parse(event.body || "{}");
    const { item_id, files } = body;

    if (!item_id) return buildCorsResponse(400, { error: "Missing required field: item_id" });
    if (!files || !Array.isArray(files) || files.length === 0) {
      return buildCorsResponse(400, { error: "Missing required field: files (non-empty array)" });
    }

    // Validate each file entry
    for (const file of files) {
      if (!file.angle || !VALID_ANGLES.includes(file.angle)) {
        return buildCorsResponse(400, { error: `Invalid angle: ${file.angle}. Must be one of: ${VALID_ANGLES.join(", ")}` });
      }
      if (!file.contentType) {
        return buildCorsResponse(400, { error: `Missing contentType for angle: ${file.angle}` });
      }
      const validTypes = file.angle === "video" ? VALID_VIDEO_TYPES : VALID_IMAGE_TYPES;
      if (!validTypes.includes(file.contentType)) {
        return buildCorsResponse(400, { error: `Invalid contentType for ${file.angle}: ${file.contentType}` });
      }
    }

    // Generate presigned URLs
    const uploads = await Promise.all(
      files.map(async (file: { angle: string; contentType: string }) => {
        const ext = file.angle === "video" 
          ? (file.contentType === "video/webm" ? "webm" : "mp4")
          : "jpg";
        const s3Key = file.angle === "video"
          ? `items/${item_id}/video-raw/walkaround.${ext}`
          : `items/${item_id}/${file.angle}.${ext}`;

        const command = new PutObjectCommand({
          Bucket: BUCKET,
          Key: s3Key,
          ContentType: file.contentType,
        });

        const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

        return {
          angle: file.angle,
          uploadUrl,
          s3Key,
          s3Url: `https://${BUCKET}.s3.ap-south-1.amazonaws.com/${s3Key}`,
        };
      })
    );

    return buildCorsResponse(200, {
      item_id,
      uploads,
      expiresInSeconds: 900,
    });
  } catch (err: any) {
    console.error("Presign error:", err);
    return buildCorsResponse(500, { error: "Failed to generate upload URLs", detail: err.message });
  }
};
