/**
 * EcoBridge Backend API Client
 */

const API_BASE_URL = import.meta.env.VITE_ECOBRIDGE_API_URL || "https://4w990xpwkg.execute-api.ap-south-1.amazonaws.com/prod/api";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface HealthCard {
  condition: "Like New" | "Good" | "Acceptable" | "Poor";
  detected_labels: string[];
  confidence: number;
}

export interface GradeResponse {
  conditionScore: number;
  cosmeticScore: number;
  functionalScore: number;
  grade: "A" | "B" | "C" | "D";
  routingDecision: string;
  estimatedResalePrice: number;
  greenCoinsAwarded: number;
  shortReason: string;
  p2pDescription: string;
}

export interface MatchedItem {
  item_id: string;
  product_name: string;
  condition: string;
  price: number;
  seller_id: string;
  carbon_saved_estimate: string;
}

export interface InterceptMatchResponse {
  match_found: true;
  item: MatchedItem;
  intercept_message: string;
  eco_discount_percent: number;
}

export interface InterceptNoMatchResponse {
  match_found: false;
  message: string;
}

export type InterceptResponse = InterceptMatchResponse | InterceptNoMatchResponse;

export interface ApiError {
  error: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Functions
// ─────────────────────────────────────────────────────────────────────────────

export async function initiateReturn(orderId: string, reason: string): Promise<{ returnId: string, status: string }> {
  const response = await fetch(`${API_BASE_URL}/returns/initiate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderId, reason }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function uploadReturnPhoto(returnId: string, imageBase64: string): Promise<{ success: boolean, message: string }> {
  const response = await fetch(`${API_BASE_URL}/returns/${returnId}/upload-photo`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64 }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function getScorecard(returnId: string): Promise<GradeResponse> {
  const response = await fetch(`${API_BASE_URL}/returns/${returnId}/scorecard`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export async function listOnP2P(returnId: string): Promise<{ success: boolean, greenCoinsEarned: number }> {
  const response = await fetch(`${API_BASE_URL}/returns/${returnId}/list-p2p`, {
    method: "POST"
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

/**
 * Kept for backward compatibility if `gradeItem` is still used directly in some components
 */
export async function gradeItem(
  imageBase64: string,
  zipCode: string
): Promise<any> {
  // Use zipCode to silence typescript unused variable error
  void zipCode;

  // Simulate the old flow using the new backend by initiating a return on the fly
  const { returnId } = await initiateReturn("DUMMY_ORDER", "Trade In");
  await uploadReturnPhoto(returnId, imageBase64);
  const scorecard = await getScorecard(returnId);
  return {
    health_card: {
      condition: scorecard.grade === "A" ? "Like New" : scorecard.grade === "B" ? "Good" : "Acceptable",
      detected_labels: [],
      confidence: 90
    },
    routing_decision: scorecard.routingDecision,
    green_credits: scorecard.greenCoinsAwarded,
    carbon_saved_estimate: "10kg CO2",
    scorecard: scorecard
  };
}

export async function interceptCheckout(
  zipCode: string,
  cartItemName: string
): Promise<InterceptResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/intercept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zip_code: zipCode, cart_item_name: cartItemName }),
    });
    if (!response.ok) {
      return { match_found: false, message: "No local matches found." };
    }
    return response.json();
  } catch {
    // Network error fallback — don't block checkout
    return { match_found: false, message: "No local matches found." };
  }
}

