/**
 * EcoBridge Multi-Image Scoring Engine
 * 
 * Pure functions — no AWS SDK calls. All Rekognition/S3 I/O happens in handler.ts
 * and results are passed here as plain data.
 * 
 * Health Score = 0.30 * Identity + 0.20 * Completeness + 0.50 * Cosmetic
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LabelResult {
  name: string;
  confidence: number;
}

export interface DamageFinding {
  type: string;
  severity: "minor" | "moderate" | "severe";
  confidence: number;
  boundingBox: { left: number; top: number; width: number; height: number } | null;
}

export interface PerImageResult {
  angle: string;
  labels: LabelResult[];
  damageFindings: DamageFinding[];
  imageDamageScore: number;
  qualityPassed: boolean;
  blurScore: number;
}

export interface ExpectedProduct {
  name: string;
  category: string;
  expectedLabels: string[];
  sellerConfirmedMatch: boolean;
}

export interface IdentityMatchResult {
  score: number;
  status: "match" | "uncertain" | "mismatch";
  matchedLabels: string[];
  confidence: number;
}

export interface CompletenessResult {
  score: number;
  anglesProvided: string[];
  missingAngles: string[];
  videoProvided: boolean;
}

export interface CosmeticResult {
  score: number;
  overallDamageScore: number;
  findingsCount: number;
  worstSeverity: "minor" | "moderate" | "severe" | "none";
}

export interface HealthScore {
  overall: number;
  identityMatch: IdentityMatchResult;
  completeness: CompletenessResult;
  cosmeticCondition: CosmeticResult;
  scoreVersion: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const CATEGORY_LABEL_MAP: Record<string, string[]> = {
  electronics: ["Electronics", "Device", "Gadget", "Hardware"],
  phone: ["Mobile Phone", "Phone", "Electronics", "Smartphone", "Cell Phone"],
  headphones: ["Headphones", "Electronics", "Audio Equipment", "Headset"],
  laptop: ["Computer", "Laptop", "Electronics", "Hardware", "Keyboard"],
  footwear: ["Shoe", "Footwear", "Clothing", "Sneaker", "Boot"],
  watch: ["Watch", "Wristwatch", "Accessory", "Wearable"],
  speaker: ["Speaker", "Electronics", "Audio", "Bluetooth"],
  keyboard: ["Keyboard", "Electronics", "Computer", "Peripheral", "Hardware"],
  mouse: ["Mouse", "Electronics", "Computer", "Peripheral"],
  camera: ["Camera", "Electronics", "Lens", "Photography"],
  tablet: ["Tablet", "Electronics", "Screen", "Computer"],
  monitor: ["Monitor", "Screen", "Display", "Electronics", "Computer"],
  powerbank: ["Electronics", "Battery", "Charger", "Power Bank"],
};

export const REQUIRED_ANGLES = ["front", "back", "left", "right"] as const;

const HEALTH_SCORE_WEIGHTS = { identity: 0.30, completeness: 0.20, cosmetic: 0.50 };
const CONDITION_CUTOFFS = { likeNew: 85, good: 65, acceptable: 40 };

const DAMAGE_KEYWORDS = [
  "Damage", "Broken", "Stain", "Scratch", "Crack", "Dent", "Torn",
  "Rust", "Mold", "Discoloration", "Wear", "Worn", "Chipped", "Faded"
];

const ANGLE_WEIGHTS: Record<string, number> = { front: 1.0, back: 1.0, left: 0.8, right: 0.8 };

// ─── Identity Match (§5.1) ────────────────────────────────────────────────────

export function computeIdentityMatch(
  perImageLabels: LabelResult[][],
  expectedProduct: ExpectedProduct
): IdentityMatchResult {
  // Build expected label set
  let expectedLabels = expectedProduct.expectedLabels;
  if (!expectedLabels || expectedLabels.length === 0) {
    const categoryKey = expectedProduct.category?.toLowerCase() || "electronics";
    expectedLabels = CATEGORY_LABEL_MAP[categoryKey] || CATEGORY_LABEL_MAP.electronics;
  }
  const expectedSet = new Set(expectedLabels.map(l => l.toLowerCase()));

  // Build detected label set (union across all images, confidence >= 70)
  const detectedSet = new Set<string>();
  for (const imageLabels of perImageLabels) {
    for (const label of imageLabels) {
      if (label.confidence >= 70) {
        detectedSet.add(label.name.toLowerCase());
      }
    }
  }

  // Overlap: fraction of expected labels found in detected
  let overlapCount = 0;
  const matchedLabels: string[] = [];
  for (const expected of expectedSet) {
    for (const detected of detectedSet) {
      if (detected.includes(expected) || expected.includes(detected)) {
        overlapCount++;
        matchedLabels.push(expected);
        break;
      }
    }
  }
  const overlap = expectedSet.size > 0 ? overlapCount / expectedSet.size : 0;

  // Per-image agreement: fraction of images whose top-3 include an expected label
  let agreementCount = 0;
  for (const imageLabels of perImageLabels) {
    const top3 = imageLabels.slice(0, 3).map(l => l.name.toLowerCase());
    const hasMatch = top3.some(t => 
      [...expectedSet].some(e => t.includes(e) || e.includes(t))
    );
    if (hasMatch) agreementCount++;
  }
  const perImageAgreement = perImageLabels.length > 0 ? agreementCount / perImageLabels.length : 0;

  const score = Math.round(100 * (0.6 * overlap + 0.4 * perImageAgreement));

  let status: "match" | "uncertain" | "mismatch";
  if (score >= 70) status = "match";
  else if (score >= 40) status = "uncertain";
  else status = "mismatch";

  return { score, status, matchedLabels, confidence: score };
}

// ─── Completeness (§5.2) ──────────────────────────────────────────────────────

export function computeCompleteness(
  providedAngles: string[],
  videoProvided: boolean
): CompletenessResult {
  const required = REQUIRED_ANGLES as readonly string[];
  const missingAngles = required.filter(a => !providedAngles.includes(a));

  return {
    score: missingAngles.length === 0 ? 100 : Math.round((providedAngles.length / required.length) * 100),
    anglesProvided: providedAngles,
    missingAngles,
    videoProvided,
  };
}

// ─── Cosmetic Condition — Damage Scoring (§5.3) ──────────────────────────────

/**
 * Score damage from Rekognition labels (Mode B heuristic).
 * Checks for damage-indicating keywords in label names.
 */
export function scoreDamageFromLabels(labels: LabelResult[]): {
  imageDamageScore: number;
  findings: DamageFinding[];
} {
  const findings: DamageFinding[] = [];
  let maxDamageSignal = 0;

  for (const label of labels) {
    const isDamage = DAMAGE_KEYWORDS.some(kw => 
      label.name.toLowerCase().includes(kw.toLowerCase())
    );
    if (isDamage && label.confidence >= 50) {
      const severity = label.confidence >= 85 ? "severe" 
        : label.confidence >= 70 ? "moderate" 
        : "minor";
      
      findings.push({
        type: label.name,
        severity,
        confidence: label.confidence,
        boundingBox: null,
      });
      maxDamageSignal = Math.max(maxDamageSignal, label.confidence);
    }
  }

  // If no explicit damage labels found, check if we ONLY see generic labels
  // (e.g., "Electronics 99%") without any positive product identifiers at high conf
  // This is a weak heuristic signal that the item might have issues
  const hasHighConfPositive = labels.some(l => 
    l.confidence >= 90 && !DAMAGE_KEYWORDS.some(kw => l.name.toLowerCase().includes(kw.toLowerCase()))
  );
  
  let imageDamageScore = maxDamageSignal > 0 ? Math.min(maxDamageSignal, 100) : 0;
  
  // If we have damage findings, weight them
  if (findings.length > 0) {
    const severityWeights = { minor: 15, moderate: 35, severe: 60 };
    const totalWeight = findings.reduce((sum, f) => sum + severityWeights[f.severity], 0);
    imageDamageScore = Math.min(totalWeight, 100);
  } else if (!hasHighConfPositive && labels.length > 0) {
    // Weak signal: low-confidence detection might indicate wear
    imageDamageScore = 10;
  }

  return { imageDamageScore, findings };
}

/**
 * Cross-image fusion (§5.3e) — combines per-image damage into overall cosmetic score
 */
export function computeCosmeticCondition(
  perImageResults: PerImageResult[]
): CosmeticResult {
  if (perImageResults.length === 0) {
    return { score: 100, overallDamageScore: 0, findingsCount: 0, worstSeverity: "none" };
  }

  // Weighted average
  let weightedSum = 0;
  let totalWeight = 0;
  let maxDamage = 0;
  let totalFindings = 0;
  let worstSeverity: "minor" | "moderate" | "severe" | "none" = "none";

  const severityRank = { none: 0, minor: 1, moderate: 2, severe: 3 };

  for (const img of perImageResults) {
    const weight = ANGLE_WEIGHTS[img.angle] || 0.8;
    weightedSum += img.imageDamageScore * weight;
    totalWeight += weight;
    maxDamage = Math.max(maxDamage, img.imageDamageScore);
    totalFindings += img.damageFindings.length;

    for (const f of img.damageFindings) {
      if (severityRank[f.severity] > severityRank[worstSeverity]) {
        worstSeverity = f.severity;
      }
    }
  }

  const weightedAvg = totalWeight > 0 ? weightedSum / totalWeight : 0;
  const overallDamageScore = Math.max(maxDamage, weightedAvg);
  const score = Math.round(Math.max(0, Math.min(100, 100 - overallDamageScore)));

  return { score, overallDamageScore: Math.round(overallDamageScore), findingsCount: totalFindings, worstSeverity };
}

// ─── Overall Health Score (§5) ────────────────────────────────────────────────

export function computeHealthScore(
  identityMatch: IdentityMatchResult,
  completeness: CompletenessResult,
  cosmeticCondition: CosmeticResult
): HealthScore {
  let overall = Math.round(
    HEALTH_SCORE_WEIGHTS.identity * identityMatch.score +
    HEALTH_SCORE_WEIGHTS.completeness * completeness.score +
    HEALTH_SCORE_WEIGHTS.cosmetic * cosmeticCondition.score
  );

  // Identity gate (§5.4): cap at 60 if uncertain, block if mismatch
  if (identityMatch.status === "uncertain") {
    overall = Math.min(overall, 60);
  }

  return {
    overall,
    identityMatch,
    completeness,
    cosmeticCondition,
    scoreVersion: "health-score-v1",
  };
}

// ─── Condition Mapping (§5.5) ─────────────────────────────────────────────────

export function conditionFromHealthScore(overall: number): "Like New" | "Good" | "Acceptable" | "Poor" {
  if (overall >= CONDITION_CUTOFFS.likeNew) return "Like New";
  if (overall >= CONDITION_CUTOFFS.good) return "Good";
  if (overall >= CONDITION_CUTOFFS.acceptable) return "Acceptable";
  return "Poor";
}

// ─── Hero Image Selection (§Task 5) ──────────────────────────────────────────

export function selectHeroImage(perImageResults: PerImageResult[]): string {
  if (perImageResults.length === 0) return "front";

  const bestBlur = Math.max(...perImageResults.map(r => r.blurScore));
  const front = perImageResults.find(r => r.angle === "front");
  
  // Prefer front if quality is within 80% of best and has fewest damage findings
  if (front && front.blurScore >= bestBlur * 0.8) {
    const minFindings = Math.min(...perImageResults.map(r => r.damageFindings.length));
    if (front.damageFindings.length === minFindings) {
      return "front";
    }
  }

  // Otherwise pick cleanest image with best quality
  const minFindings = Math.min(...perImageResults.map(r => r.damageFindings.length));
  const cleanest = perImageResults
    .filter(r => r.damageFindings.length === minFindings)
    .sort((a, b) => b.blurScore - a.blurScore);
  
  return cleanest[0]?.angle || "front";
}
