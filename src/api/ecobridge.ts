/**
 * EcoBridge Backend API Client
 *
 * Drop-in fetch utilities for calling the EcoBridge Lambda endpoints
 * through API Gateway. Replace API_BASE_URL with your deployed endpoint.
 */

// Replace this with your deployed API Gateway endpoint URL
// e.g., "https://abc123.execute-api.us-east-1.amazonaws.com/prod"
const API_BASE_URL = import.meta.env.VITE_ECOBRIDGE_API_URL || "https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface HealthCard {
  condition: "Like New" | "Good" | "Acceptable" | "Poor";
  detected_labels: string[];
  confidence: number;
}

export interface GradeResponse {
  health_card: HealthCard;
  routing_decision: "LOCAL_RESALE" | "WAREHOUSE_REFURB" | "RECYCLE";
  green_credits: number;
  item_id?: string;
  carbon_saved_estimate: string;
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

/**
 * Call the AI Grader endpoint to grade an item's condition.
 *
 * Usage in ViewA (Rahul's seller trade-in) or ViewB (Priya's return):
 * ```tsx
 * const webcamRef = useRef<Webcam>(null);
 * const imageSrc = webcamRef.current?.getScreenshot(); // "data:image/jpeg;base64,..."
 * const result = await gradeItem(imageSrc, "110001");
 * ```
 */
export async function gradeItem(
  imageBase64: string,
  zipCode: string
): Promise<GradeResponse> {
  const response = await fetch(`${API_BASE_URL}/grade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      image: imageBase64,
      zip_code: zipCode,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as ApiError).error || `HTTP ${response.status}`);
  }

  return data as GradeResponse;
}

/**
 * Call the Checkout Intercept endpoint to check for local matches.
 *
 * Usage in ViewC (Amit's buyer checkout):
 * ```tsx
 * const result = await interceptCheckout("110001", "Running Shoes");
 * if (result.match_found) {
 *   // Show the intercept modal with result.item details
 * }
 * ```
 */
export async function interceptCheckout(
  zipCode: string,
  cartItemName: string
): Promise<InterceptResponse> {
  const response = await fetch(`${API_BASE_URL}/intercept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      zip_code: zipCode,
      cart_item_name: cartItemName,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as ApiError).error || `HTTP ${response.status}`);
  }

  return data as InterceptResponse;
}
