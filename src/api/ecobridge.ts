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


// ─────────────────────────────────────────────────────────────────────────────
// Admin API Functions
// ─────────────────────────────────────────────────────────────────────────────

export interface AdminItem {
  id: string;
  name: string;
  section: string;
  listingStatus: string;
  condition: string;
  grade: string;
  price: number;
  originalPrice: number;
  listingImages: string[];
  source: string;
  adminNotes?: string;
  seller: string;
  sellerPinCode: string;
}

export type AdminAction = 'LIST_P2P' | 'UNLIST_P2P' | 'MOVE_TO_REFURBISHED' | 'MOVE_TO_P2P' | 'MOVE_TO_WAREHOUSE';

export async function adminGetItems(facilityPincode: string, section?: string, listingStatus?: string): Promise<AdminItem[]> {
  const params = new URLSearchParams({ facilityPincode });
  if (section) params.append('section', section);
  if (listingStatus) params.append('listingStatus', listingStatus);
  const res = await fetch(`${API_BASE_URL}/admin/items?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.items;
}

export async function adminUpdateItem(itemId: string, action: AdminAction, facilityPincode: string, adminNotes?: string): Promise<{ success: boolean; updatedItem: AdminItem }> {
  const res = await fetch(`${API_BASE_URL}/admin/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, facilityPincode, adminNotes }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function adminScanAndList(payload: { imageBase64: string; productName: string; facilityPincode: string; facilityId: string; estimatedPrice: number; originalPrice: number; adminNotes?: string }): Promise<{ itemId: string; grade: string; condition: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/scan-and-list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function getProductDetail(productId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/product/detail?id=${productId}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
