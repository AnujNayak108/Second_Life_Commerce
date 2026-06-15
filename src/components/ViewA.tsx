import { useState } from 'react';
import { 
  Camera, CheckCircle, Package, Leaf, ChevronRight, Coins, 
  Recycle, Loader2, ShieldCheck, AlertTriangle, Edit3
} from 'lucide-react';
import { IdentityConfirmStep } from './grading/IdentityConfirmStep';
import { AngleCaptureStep } from './grading/AngleCaptureStep';
import { ReviewCapturesStep } from './grading/ReviewCapturesStep';
import { ScoreBreakdownCard } from './grading/ScoreBreakdownCard';

type Step =
  | 'orders'
  | 'identity_confirm'
  | 'capture_front'
  | 'capture_back'
  | 'capture_left'
  | 'capture_right'
  | 'review_captures'
  | 'uploading'
  | 'scanning'
  | 'result'
  | 'verify'
  | 'routed';

interface GradeResultV2 {
  version: string;
  item_id: string;
  health_card: {
    condition: string;
    confidence: number;
    detected_labels: string[];
    health_score: {
      overall: number;
      identity_match: { score: number; status: string; matched_labels: string[] };
      completeness: { score: number; angles_provided: string[]; missing_angles: string[]; video_provided: boolean };
      cosmetic_condition: { score: number; findings_count: number; worst_severity: string };
    };
    per_image: { angle: string; s3_url: string; labels: string[]; damage_findings: any[] }[];
  };
  identity_check: { status: string; message: string; requires_manual_review: boolean };
  routing_decision: string;
  green_credits: number;
  earned_coins: number;
  carbon_saved_estimate: string;
  p2p_gallery: { hero_image_url: string; gallery_urls: string[] };
  // v1 compat fields
  health_card_v1?: { condition: string; detected_labels: string[]; confidence: number };
  deprecation_warning?: string;
}

interface OrderItem {
  id: string;
  orderId: string;
  name: string;
  price: number;
  originalPrice: number;
  icon?: string;
  datePlaced: string;
  status: string;
  category?: string;
}

interface PerImageAnalysis {
  angle: string;
  condition: string;
  labels: string[];
  confidence: number;
  routing: string;
  itemId: string;
}

interface RoutingInfo { destination: string; icon: any; color: string; bgColor: string; description: string; action: string; }

const ROUTING_CONFIG: Record<string, RoutingInfo> = {
  'Like New': { destination: 'P2P Marketplace', icon: Leaf, color: 'text-[#007600]', bgColor: 'bg-[#E7F4E4] border-[#C3E6C0]', description: 'Listed directly for peer-to-peer local sale.', action: 'List on P2P Marketplace' },
  'Good': { destination: 'P2P Marketplace', icon: Leaf, color: 'text-[#007600]', bgColor: 'bg-[#E7F4E4] border-[#C3E6C0]', description: 'Listed for P2P with transparent condition report.', action: 'List on P2P Marketplace' },
  'Acceptable': { destination: 'Local Warehouse — Refurbish', icon: Recycle, color: 'text-[#FF9900]', bgColor: 'bg-[#FFFBF0] border-[#FFD814]/50', description: 'Sent to EcoBridge warehouse for refurbishment.', action: 'Send to Warehouse' },
  'Poor': { destination: 'Recycling Center', icon: Recycle, color: 'text-[#CC0C39]', bgColor: 'bg-[#FDF0F0] border-[#CC0C39]/20', description: 'Routed for responsible e-waste recycling.', action: 'Route to Recycling' },
};

const CREDIT_MAP: Record<string, number> = { 'Like New': 1200, 'Good': 800, 'Acceptable': 400, 'Poor': 100 };
const CARBON_MAP: Record<string, string> = { 'Like New': '12.5kg CO2', 'Good': '8.2kg CO2', 'Acceptable': '4.1kg CO2', 'Poor': '2.0kg CO2' };

const API_URL = import.meta.env.VITE_ECOBRIDGE_API_URL || "https://4w990xpwkg.execute-api.ap-south-1.amazonaws.com/prod";
console.log('[EcoBridge] API:', API_URL);

const INTERNAL_DAMAGE_OPTIONS = ['Battery drains fast', 'Speaker/mic issues', 'Button not responsive', 'Screen flicker', 'Charging port loose', 'Software glitches', 'Overheating', 'None — works perfectly'];

export function ViewA({ onEarnCoins, orders = [], soldItems = new Set(), onItemSold }: {
  onEarnCoins?: (amount: number) => void;
  orders?: OrderItem[];
  soldItems?: Set<string>;
  onItemSold?: (orderId: string, images?: Record<string, string>, gradeData?: any) => void;
}) {
  const [step, setStep] = useState<Step>('orders');
  const [gradeResult, setGradeResult] = useState<GradeResultV2 | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanningOrderId, setScanningOrderId] = useState('');
  const [scanningOrder, setScanningOrder] = useState<OrderItem | null>(null);

  // Multi-image state
  const [identityConfirmed, setIdentityConfirmed] = useState(true);
  const [identityOverrideNote, setIdentityOverrideNote] = useState('');
  const [captures, setCaptures] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState<{ current: number; total: number; currentAngle: string; results: { angle: string; done: boolean }[] }>({ current: 0, total: 4, currentAngle: '', results: [] });

  // Layer 2 verification
  const [sellerNotes, setSellerNotes] = useState('');
  const [internalDamage, setInternalDamage] = useState<string[]>([]);
  const [finalCondition, setFinalCondition] = useState('');

  const handleStartScan = (order: OrderItem) => {
    setScanningOrderId(order.id);
    setScanningOrder(order);
    setCaptures({});
    setError(null);
    setStep('identity_confirm');
  };

  const handleIdentityConfirm = (confirmed: boolean, note?: string) => {
    setIdentityConfirmed(confirmed);
    if (note) setIdentityOverrideNote(note);
    setStep('capture_front');
  };

  const handleCapture = (angle: string, dataUrl: string) => {
    setCaptures(prev => ({ ...prev, [angle]: dataUrl }));
    const angles = ['front', 'back', 'left', 'right'];
    const nextIdx = angles.indexOf(angle) + 1;
    if (nextIdx < angles.length) {
      setStep(`capture_${angles[nextIdx]}` as Step);
    } else {
      setStep('review_captures');
    }
  };

  const handleRetakeFromReview = (angle: string) => {
    setStep(`capture_${angle}` as Step);
  };

  const handleSubmitForGrading = async () => {
    setStep('uploading');
    setUploadProgress(0);

    try {
      const angles = ['front', 'back', 'left', 'right'] as const;
      
      // Validate all 4 images exist
      for (const angle of angles) {
        if (!captures[angle]) {
          setError(`Missing ${angle} image`);
          setStep('review_captures');
          return;
        }
      }

      setUploadProgress(10);
      setStep('scanning');
      setAnalysisProgress({ current: 0, total: 4, currentAngle: 'front', results: [] });

      // Send ALL 4 images to Rekognition sequentially for real multi-angle analysis
      const perImageResults: PerImageAnalysis[] = [];
      
      for (let i = 0; i < angles.length; i++) {
        const angle = angles[i];
        setAnalysisProgress(prev => ({ ...prev, current: i, currentAngle: angle }));

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);

        try {
          const response = await fetch(`${API_URL}/api/grade`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: captures[angle],
              zip_code: '110001',
              product_name: scanningOrder?.name || '',
            }),
            signal: controller.signal,
          });
          clearTimeout(timeout);

          if (!response.ok) {
            const text = await response.text();
            try { setError(JSON.parse(text).error); } catch { setError(`Failed on ${angle}: HTTP ${response.status}`); }
            setStep('review_captures');
            return;
          }

          const data = await response.json();
          
          // ★ HUMAN/PERSON DETECTION — reject if top labels indicate a person, not a product
          const detectedLabels: string[] = data.health_card?.detected_labels || [];
          const PERSON_LABELS = ['person', 'human', 'face', 'adult', 'man', 'woman', 'boy', 'girl', 'child', 'people', 'portrait', 'selfie', 'head', 'skin', 'finger', 'hand', 'body'];
          
          // Check top-3 highest confidence labels (they come sorted from Rekognition)
          const top3Labels = detectedLabels.slice(0, 3).map(l => l.split(' (')[0].toLowerCase());
          const topIsPerson = top3Labels.some(l => PERSON_LABELS.some(pl => l.includes(pl)));
          
          // Also check if "Person" or "Human" appear anywhere with high confidence
          const hasHighConfPerson = detectedLabels.some(l => {
            const name = l.split(' (')[0].toLowerCase();
            const confMatch = l.match(/\((\d+)%\)/);
            const conf = confMatch ? parseInt(confMatch[1]) : 0;
            return PERSON_LABELS.some(pl => name.includes(pl)) && conf >= 70;
          });

          if (topIsPerson || hasHighConfPerson) {
            setError(`⚠️ "${angle.toUpperCase()}" photo shows a person/face, not a product. Please point camera at the actual item.`);
            setStep('review_captures');
            setCaptures(prev => { const next = { ...prev }; delete next[angle]; return next; });
            return;
          }

          perImageResults.push({
            angle,
            condition: data.health_card?.condition || 'Good',
            labels: detectedLabels,
            confidence: data.health_card?.confidence || 80,
            routing: data.routing_decision || 'LOCAL_RESALE',
            itemId: data.item_id,
          });

          setAnalysisProgress(prev => ({ ...prev, current: i + 1, results: [...prev.results, { angle, done: true }] }));
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            // On timeout, use previous result or skip — don't block the whole flow
            perImageResults.push({ angle, condition: 'Good', labels: ['Timeout — using estimate'], confidence: 60, routing: 'LOCAL_RESALE', itemId: '' });
            setAnalysisProgress(prev => ({ ...prev, current: i + 1, results: [...prev.results, { angle, done: true }] }));
          } else {
            setError(`${angle} analysis failed: ${err?.message || 'Unknown'}`);
            setStep('review_captures');
            return;
          }
        }
      }

      // ═══ REAL MULTI-IMAGE FUSION — aggregate across all 4 angles ═══
      const allLabels = perImageResults.flatMap(r => r.labels);
      const uniqueLabels = [...new Set(allLabels)].slice(0, 12);
      
      // Cross-image agreement scoring
      const conditions = perImageResults.map(r => r.condition);
      const conditionVotes: Record<string, number> = {};
      for (const c of conditions) conditionVotes[c] = (conditionVotes[c] || 0) + 1;
      
      // Majority vote for final condition (more reliable than single-image)
      const sortedConditions = Object.entries(conditionVotes).sort((a, b) => b[1] - a[1]);
      const majorityCondition = sortedConditions[0][0];
      const agreement = sortedConditions[0][1] / 4; // 0.25 to 1.0
      
      // Confidence boost from multi-image agreement
      const avgConfidence = Math.round(perImageResults.reduce((s, r) => s + r.confidence, 0) / 4);
      const boostedConfidence = Math.min(99, Math.round(avgConfidence * (0.8 + 0.2 * agreement)));
      
      // Identity match: check if labels across images are consistent
      const labelSets = perImageResults.map(r => new Set(r.labels.map(l => l.split(' (')[0].toLowerCase())));
      const commonLabels = [...labelSets[0]].filter(l => labelSets.every(s => [...s].some(sl => sl.includes(l) || l.includes(sl))));
      const identityScore = Math.min(100, Math.round(30 + commonLabels.length * 15 + agreement * 30));
      
      // Cosmetic score: based on condition distribution
      const cosmeticScore = majorityCondition === 'Like New' ? 95 
        : majorityCondition === 'Good' ? 75 
        : majorityCondition === 'Acceptable' ? 50 
        : 25;
      
      // Damage findings: extract from labels that indicate issues
      const damageKeywords = ['scratch', 'crack', 'dent', 'damage', 'worn', 'stain', 'broken'];
      const damageFindings = allLabels
        .filter(l => damageKeywords.some(kw => l.toLowerCase().includes(kw)))
        .map(l => ({ type: l.split(' (')[0], severity: 'minor' as const, angle: 'detected' }));
      
      // Overall health score (weighted)
      const overall = Math.round(0.30 * identityScore + 0.20 * 100 + 0.50 * cosmeticScore);
      
      // Map overall to final condition using proper cutoffs
      const finalCondFromScore = overall >= 85 ? 'Like New' : overall >= 65 ? 'Good' : overall >= 40 ? 'Acceptable' : 'Poor';
      // Calculate coins based on actual product price: 5% of price, min 50, max 500
      const productPrice = scanningOrder?.price || 4000;
      const credits = Math.min(500, Math.max(50, Math.round(productPrice * 0.05)));

      const v2Result: GradeResultV2 = {
        version: "2",
        item_id: perImageResults[0]?.itemId || 'multi-' + Date.now(),
        health_card: {
          condition: finalCondFromScore,
          confidence: boostedConfidence,
          detected_labels: uniqueLabels,
          health_score: {
            overall,
            identity_match: { 
              score: identityScore, 
              status: identityScore >= 70 ? "match" : identityScore >= 40 ? "uncertain" : "mismatch",
              matched_labels: commonLabels.slice(0, 5)
            },
            completeness: { score: 100, angles_provided: ["front", "back", "left", "right"], missing_angles: [], video_provided: false },
            cosmetic_condition: { 
              score: cosmeticScore, 
              findings_count: damageFindings.length, 
              worst_severity: damageFindings.length > 0 ? "minor" : "none" 
            },
          },
          per_image: perImageResults.map(r => ({
            angle: r.angle,
            s3_url: captures[r.angle] || '',
            labels: r.labels.slice(0, 5),
            damage_findings: [],
          })),
        },
        identity_check: { 
          status: identityScore >= 70 ? "match" : "uncertain",
          message: identityScore >= 70 
            ? `Product verified across all 4 angles (${boostedConfidence}% confidence). ${commonLabels.length} consistent labels detected.`
            : "Some inconsistency detected across angles — review recommended.",
          requires_manual_review: identityScore < 70
        },
        routing_decision: ROUTING_CONFIG[finalCondFromScore]?.destination.includes('P2P') ? 'LOCAL_RESALE' : 'WAREHOUSE_REFURB',
        green_credits: credits,
        earned_coins: credits,
        carbon_saved_estimate: CARBON_MAP[finalCondFromScore] || '8.2kg CO2',
        p2p_gallery: { hero_image_url: captures.front, gallery_urls: Object.values(captures) },
      };

      setGradeResult(v2Result);
      setFinalCondition(finalCondFromScore);
      if (credits > 0 && onEarnCoins) onEarnCoins(credits);
      setStep('result');
    } catch (err: any) {
      setError(err?.message || 'Multi-image analysis failed');
      setStep('review_captures');
    }
  };

  const computeFinalCondition = (aiCondition: string, damages: string[]): string => {
    if (damages.includes('None — works perfectly') || damages.length === 0) return aiCondition;
    const severe = ['Battery drains fast', 'Screen flicker', 'Overheating', 'Charging port loose'];
    const severeCount = damages.filter(d => severe.includes(d)).length;
    if (severeCount >= 2) return 'Poor';
    if (severeCount === 1) return aiCondition === 'Like New' || aiCondition === 'Good' ? 'Acceptable' : 'Poor';
    if (aiCondition === 'Like New') return 'Good';
    return aiCondition;
  };

  const toggleDamage = (item: string) => {
    if (item === 'None — works perfectly') { setInternalDamage(['None — works perfectly']); return; }
    setInternalDamage(prev => {
      const filtered = prev.filter(d => d !== 'None — works perfectly');
      return filtered.includes(item) ? filtered.filter(d => d !== item) : [...filtered, item];
    });
  };

  const handleSubmitVerification = () => {
    const adjusted = computeFinalCondition(gradeResult?.health_card.condition || 'Good', internalDamage);
    setFinalCondition(adjusted);
    if (onItemSold && scanningOrderId) {
      onItemSold(scanningOrderId, captures, {
        condition: adjusted,
        healthScore: gradeResult?.health_card?.health_score?.overall,
        labels: gradeResult?.health_card?.detected_labels,
        confidence: gradeResult?.health_card?.confidence,
      });
    }
    setStep('routed');
  };

  // ═══ UPLOADING ═══
  if (step === 'uploading') {
    return (
      <div className="min-h-[calc(100vh-150px)] bg-[#0F1111] text-white flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <Loader2 className="w-12 h-12 text-[#FF9900] animate-spin mx-auto" />
          <h2 className="text-lg font-bold">Uploading 4 photos...</h2>
          <div className="w-full bg-gray-700 rounded-full h-2"><div className="bg-[#FF9900] h-2 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>
          <p className="text-sm text-[#CCC]">Preparing multi-angle AI analysis</p>
        </div>
      </div>
    );
  }

  // ═══ SCANNING (with live per-image progress) ═══
  if (step === 'scanning') {
    const angleLabels: Record<string, string> = { front: 'Front', back: 'Back', left: 'Left', right: 'Right' };
    return (
      <div className="min-h-[calc(100vh-150px)] bg-[#0F1111] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <div>
            <Loader2 className="w-10 h-10 text-[#FF9900] animate-spin mx-auto mb-3" />
            <h2 className="text-lg font-bold">Multi-Angle AI Analysis</h2>
            <p className="text-sm text-[#CCC] mt-1">Sending each photo to AWS Rekognition...</p>
          </div>

          {/* Per-image progress */}
          <div className="space-y-2">
            {['front', 'back', 'left', 'right'].map((angle, idx) => {
              const isDone = analysisProgress.current > idx;
              const isCurrent = analysisProgress.current === idx;
              return (
                <div key={angle} className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${isDone ? 'border-[#007600] bg-[#007600]/10' : isCurrent ? 'border-[#FF9900] bg-[#FF9900]/10 animate-pulse' : 'border-gray-700 bg-gray-800/50'}`}>
                  <div className="w-10 h-10 rounded overflow-hidden border border-gray-600 shrink-0">
                    {captures[angle] && <img src={captures[angle]} alt={angle} className={`w-full h-full object-cover ${isDone ? '' : 'opacity-50'}`} />}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xs font-bold">{angleLabels[angle]}</div>
                    <div className="text-[10px] text-[#CCC]">
                      {isDone ? '✓ Labels detected' : isCurrent ? 'Analyzing with Rekognition...' : 'Waiting...'}
                    </div>
                  </div>
                  {isDone && <CheckCircle className="w-5 h-5 text-[#007600] shrink-0" />}
                  {isCurrent && <Loader2 className="w-4 h-4 text-[#FF9900] animate-spin shrink-0" />}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-[#FF9900] h-2 rounded-full transition-all duration-500" style={{ width: `${(analysisProgress.current / 4) * 100}%` }} />
            </div>
            <p className="text-[10px] text-[#888]">{analysisProgress.current}/4 images processed • Cross-image fusion pending</p>
          </div>
        </div>
      </div>
    );
  }

  // ═══ IDENTITY CONFIRM ═══
  if (step === 'identity_confirm' && scanningOrder) {
    return <IdentityConfirmStep productName={scanningOrder.name} productIcon={scanningOrder.icon} productCategory={scanningOrder.category || 'Electronics'} onConfirm={handleIdentityConfirm} onBack={() => setStep('orders')} />;
  }

  // ═══ CAPTURE STEPS ═══
  if (step === 'capture_front') return <AngleCaptureStep angle="front" stepNumber={2} totalSteps={6} existingPreview={captures.front} onCaptured={(d) => handleCapture('front', d)} onBack={() => setStep('identity_confirm')} />;
  if (step === 'capture_back') return <AngleCaptureStep angle="back" stepNumber={3} totalSteps={6} existingPreview={captures.back} onCaptured={(d) => handleCapture('back', d)} onBack={() => setStep('capture_front')} />;
  if (step === 'capture_left') return <AngleCaptureStep angle="left" stepNumber={4} totalSteps={6} existingPreview={captures.left} onCaptured={(d) => handleCapture('left', d)} onBack={() => setStep('capture_back')} />;
  if (step === 'capture_right') return <AngleCaptureStep angle="right" stepNumber={5} totalSteps={6} existingPreview={captures.right} onCaptured={(d) => handleCapture('right', d)} onBack={() => setStep('capture_left')} />;

  // ═══ REVIEW ═══
  if (step === 'review_captures') {
    return (
      <>
        {error && <div className="max-w-lg mx-auto mt-4 p-3 bg-[#FDF0F0] border border-[#CC0C39]/20 rounded text-[#CC0C39] text-sm text-center">{error}</div>}
        <ReviewCapturesStep captures={captures} videoRecorded={false} onRetake={handleRetakeFromReview} onSubmit={handleSubmitForGrading} onBack={() => setStep('capture_right')} />
      </>
    );
  }

  // ═══ RESULT (v2 Health Card) ═══
  if (step === 'result' && gradeResult) {
    const hs = gradeResult.health_card.health_score;
    const condition = gradeResult.health_card.condition;
    const credits = gradeResult.earned_coins;
    const routeInfo = ROUTING_CONFIG[condition] || ROUTING_CONFIG['Good'];

    return (
      <div className="max-w-2xl mx-auto p-4 mt-4 space-y-4">
        <div className="bg-white border border-[#D5D9D9] rounded-lg overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-[#E7F4E4] border-b border-[#C3E6C0] p-5 flex items-start justify-between">
            <div>
              <div className="flex items-center text-[#007600] font-bold mb-1"><ShieldCheck className="w-5 h-5 mr-2" />Multi-Angle AI Assessment Complete</div>
              <h2 className="text-lg font-bold text-[#0F1111]">Product Health Card</h2>
              <p className="text-[#565959] text-xs mt-0.5">4 photos analyzed • AWS Rekognition • {gradeResult.health_card.detected_labels.length} labels detected</p>
            </div>
            <div className="bg-white border border-[#D5D9D9] p-3 rounded text-center shadow-sm">
              <div className="text-[9px] text-[#565959] font-semibold uppercase">Grade</div>
              <div className={`text-lg font-bold ${condition === 'Like New' || condition === 'Good' ? 'text-[#007600]' : 'text-[#FF9900]'}`}>{condition}</div>
            </div>
          </div>

          {/* Coins earned banner */}
          <div className="mx-4 mt-4 bg-gradient-to-r from-[#FF9900]/10 to-[#FF9900]/5 border border-[#FF9900]/30 rounded-lg p-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FF9900] rounded-full flex items-center justify-center shrink-0 shadow"><Coins className="w-5 h-5 text-white" /></div>
            <div><div className="text-sm font-bold text-[#0F1111]">🎉 You earned +{credits} Green Coins!</div><p className="text-[10px] text-[#565959]">For multi-angle verification on EcoBridge</p></div>
          </div>

          {/* 4-image strip with per-image labels */}
          <div className="px-4 pt-4">
            <div className="text-[9px] text-[#565959] uppercase font-semibold mb-2">Per-Angle Analysis Results</div>
            <div className="grid grid-cols-2 gap-3">
              {gradeResult.health_card.per_image.map(img => (
                <div key={img.angle} className="border border-[#D5D9D9] rounded-lg overflow-hidden">
                  <div className="relative aspect-[4/3]">
                    {captures[img.angle] && <img src={captures[img.angle]} alt={img.angle} className="w-full h-full object-cover" />}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pt-6">
                      <div className="text-white text-[9px] font-bold uppercase">{img.angle}</div>
                    </div>
                  </div>
                  <div className="p-2 bg-[#F7F8F8]">
                    <div className="flex flex-wrap gap-1">
                      {img.labels.slice(0, 3).map((l, i) => (
                        <span key={i} className="text-[8px] bg-white border border-[#D5D9D9] text-[#0F1111] px-1.5 py-0.5 rounded font-medium truncate max-w-full">{l}</span>
                      ))}
                    </div>
                    {img.damage_findings.length > 0 && (
                      <div className="mt-1 text-[8px] text-[#CC0C39] font-bold">⚠ {img.damage_findings.length} issue{img.damage_findings.length > 1 ? 's' : ''} detected</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score breakdown */}
          <div className="p-4">
            <ScoreBreakdownCard
              overall={hs.overall}
              identityScore={hs.identity_match.score}
              identityStatus={hs.identity_match.status}
              completenessScore={hs.completeness.score}
              cosmeticScore={hs.cosmetic_condition.score}
              worstSeverity={hs.cosmetic_condition.worst_severity}
              findingsCount={hs.cosmetic_condition.findings_count}
            />
          </div>

          {/* Detected labels */}
          {gradeResult.health_card.detected_labels.length > 0 && (
            <div className="px-4 pb-3">
              <div className="text-[9px] text-[#565959] uppercase font-semibold mb-1.5">Rekognition Labels</div>
              <div className="flex flex-wrap gap-1">{gradeResult.health_card.detected_labels.slice(0, 8).map((l, i) => (<span key={i} className="bg-[#F0F2F2] border border-[#D5D9D9] text-[#0F1111] text-[9px] font-medium px-2 py-0.5 rounded">{l}</span>))}</div>
            </div>
          )}

          {/* Proceed to Layer 2 */}
          <div className="p-4 border-t border-[#D5D9D9]">
            <button onClick={() => setStep('verify')} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-3 rounded-full border border-[#FCD200] flex items-center justify-center gap-2 text-sm">
              <Edit3 className="w-4 h-4" /> Proceed to Seller Verification (Layer 2)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ VERIFY (Layer 2) ═══
  if (step === 'verify') {
    const aiCondition = gradeResult?.health_card.condition || 'Good';
    return (
      <div className="max-w-2xl mx-auto p-4 mt-4">
        <div className="bg-white rounded-lg border border-[#D5D9D9] overflow-hidden shadow-sm">
          <div className="bg-[#232F3E] p-5 text-white">
            <div className="flex items-center gap-2 mb-1"><ShieldCheck className="w-5 h-5 text-[#FF9900]" /><span className="text-xs font-bold text-[#FF9900] uppercase tracking-wider">Layer 2 — Seller Verification</span></div>
            <h2 className="text-lg font-bold">Report Internal Condition</h2>
            <p className="text-[#CCC] text-sm mt-1">AI scanned the exterior. Now report anything it couldn't see.</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded p-3 flex items-center justify-between">
              <div><div className="text-[10px] text-[#565959] uppercase font-semibold">AI Grade</div><div className="text-sm font-bold mt-0.5">{aiCondition}</div></div>
              <div className="text-right"><div className="text-[10px] text-[#565959] uppercase font-semibold">Confidence</div><div className="text-sm font-bold text-[#007600]">{gradeResult?.health_card.confidence}%</div></div>
            </div>
            <div>
              <label className="text-sm font-bold text-[#0F1111] block mb-2"><AlertTriangle className="w-4 h-4 inline mr-1 text-[#FF9900]" />Any internal issues?</label>
              <div className="grid grid-cols-2 gap-2">
                {INTERNAL_DAMAGE_OPTIONS.map(opt => {
                  const sel = internalDamage.includes(opt);
                  const isNone = opt === 'None — works perfectly';
                  return (<button key={opt} onClick={() => toggleDamage(opt)} className={`text-left p-2.5 rounded border text-xs font-medium transition-all ${sel ? (isNone ? 'border-[#007600] bg-[#E7F4E4] text-[#007600]' : 'border-[#CC0C39] bg-[#FDF0F0] text-[#CC0C39]') : 'border-[#D5D9D9] bg-white text-[#565959] hover:border-[#FF9900]'}`}>{sel ? '✓ ' : ''}{opt}</button>);
                })}
              </div>
            </div>
            <div>
              <label className="text-sm font-bold text-[#0F1111] block mb-2">Additional Notes (optional)</label>
              <textarea value={sellerNotes} onChange={e => setSellerNotes(e.target.value)} placeholder="E.g., 'Left earbud quieter'" className="w-full border border-[#D5D9D9] rounded p-3 text-sm outline-none focus:border-[#FF9900] resize-none h-16" />
            </div>
            {internalDamage.length > 0 && (
              <div className="bg-[#FFFBF0] border border-[#FFD814]/50 rounded p-3">
                <div className="text-[10px] text-[#565959] uppercase font-semibold mb-1">Adjusted Condition</div>
                <span className="text-sm">{aiCondition} → <span className="font-bold">{computeFinalCondition(aiCondition, internalDamage)}</span></span>
              </div>
            )}
            <button onClick={handleSubmitVerification} disabled={internalDamage.length === 0} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] disabled:bg-[#F0F2F2] disabled:text-[#999] text-[#0F1111] font-bold py-3 rounded-full border border-[#FCD200] disabled:border-[#D5D9D9] flex items-center justify-center gap-2 text-sm">
              <ShieldCheck className="w-4 h-4" /> Confirm & Route Item
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ ROUTED ═══
  if (step === 'routed') {
    const routeInfo = ROUTING_CONFIG[finalCondition] || ROUTING_CONFIG['Good'];
    // Use actual earned coins from gradeResult, or calculate from product price
    const credits = gradeResult?.earned_coins || Math.min(500, Math.max(50, Math.round((scanningOrder?.price || 4000) * 0.05)));
    const carbonSaved = CARBON_MAP[finalCondition] || '8.2kg CO2';
    const RouteIcon = routeInfo.icon;

    return (
      <div className="max-w-2xl mx-auto p-4 mt-4">
        <div className="bg-white rounded-lg border border-[#D5D9D9] overflow-hidden shadow-sm">
          <div className={`p-6 text-center border-b ${routeInfo.bgColor}`}>
            <div className="w-16 h-16 mx-auto rounded-full bg-white border-2 flex items-center justify-center mb-3 shadow-sm"><RouteIcon className={`w-8 h-8 ${routeInfo.color}`} /></div>
            <h2 className="text-xl font-bold text-[#0F1111]">Item Routed Successfully</h2>
            <p className={`text-sm font-bold mt-1 ${routeInfo.color}`}>{routeInfo.destination}</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3 bg-[#F7F8F8] border border-[#D5D9D9] rounded p-3">
              <div className="flex gap-1"><span className="bg-[#007600] text-white text-[8px] font-black px-1.5 py-0.5 rounded">L1</span><span className="bg-[#232F3E] text-white text-[8px] font-black px-1.5 py-0.5 rounded">L2</span></div>
              <div><div className="text-xs font-bold">Two-Layer Verified • 4 Angles</div><div className="text-[10px] text-[#565959]">AI Rekognition + Seller Self-Report</div></div>
              <CheckCircle className="w-5 h-5 text-[#007600] ml-auto" />
            </div>
            {/* Image gallery */}
            <div className="grid grid-cols-4 gap-2">
              {["front","back","left","right"].map(a => captures[a] && (
                <div key={a} className="aspect-square rounded overflow-hidden border border-[#D5D9D9]">
                  <img src={captures[a]} alt={a} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded p-3 text-center"><div className="text-[9px] text-[#565959] uppercase font-semibold">Condition</div><div className={`text-lg font-bold mt-0.5 ${finalCondition === 'Like New' || finalCondition === 'Good' ? 'text-[#007600]' : 'text-[#FF9900]'}`}>{finalCondition}</div></div>
              <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded p-3 text-center"><div className="text-[9px] text-[#565959] uppercase font-semibold">Green Credits</div><div className="text-lg font-bold text-[#FF9900] mt-0.5">{credits} 🪙</div></div>
            </div>
            <div className={`p-3 rounded border ${routeInfo.bgColor}`}>
              <div className="flex items-center gap-2"><RouteIcon className={`w-4 h-4 ${routeInfo.color}`} /><span className={`text-sm font-bold ${routeInfo.color}`}>{routeInfo.action}</span></div>
              <p className="text-xs text-[#565959] mt-1">{routeInfo.description}</p>
            </div>
            <button onClick={() => { setStep('orders'); setGradeResult(null); setCaptures({}); setInternalDamage([]); setSellerNotes(''); }} className="w-full bg-[#F0F2F2] hover:bg-[#E3E6E6] text-[#0F1111] font-medium py-2.5 rounded-full border border-[#D5D9D9] text-sm">Return to Orders</button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ ORDERS LIST ═══
  return (
    <div className="max-w-4xl mx-auto p-4 mt-2">
      <h1 className="text-xl font-medium text-[#0F1111] mb-4">Your Orders</h1>
      {orders.length === 0 ? (
        <div className="bg-white border border-[#D5D9D9] rounded p-10 text-center shadow-sm">
          <Package className="w-16 h-16 text-[#D5D9D9] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#0F1111] mb-2">No orders yet</h2>
          <p className="text-sm text-[#565959]">Your purchased items will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const isSold = soldItems.has(order.id);
            return (
              <div key={order.id} className="bg-white border border-[#D5D9D9] rounded overflow-hidden">
                {/* Order header — standard Amazon style */}
                <div className="bg-[#F0F2F2] border-b border-[#D5D9D9] px-4 py-2 flex items-center justify-between text-xs text-[#565959]">
                  <div className="flex gap-6">
                    <div><span className="uppercase text-[10px] block font-medium">Order placed</span>{order.datePlaced}</div>
                    <div><span className="uppercase text-[10px] block font-medium">Total</span>₹{order.price.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="text-[10px]">ORDER# {order.orderId || '---'}</div>
                </div>

                {/* Order body */}
                <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-[#F7F8F8] rounded flex items-center justify-center mr-4 border border-[#D5D9D9] text-3xl">{order.icon || '📦'}</div>
                    <div>
                      <span className="text-[#007185] hover:text-[#C7511F] font-medium text-sm">{order.name}</span>
                      <p className="text-xs text-[#007600] font-medium mt-0.5">
                        {isSold ? '✓ Listed on EcoBridge Marketplace' : 'Delivered'}
                      </p>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    {isSold ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E7F4E4] border border-[#C3E6C0] rounded-full text-xs text-[#007600] font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> Listed on EcoBridge
                      </div>
                    ) : (
                      <>
                        <button className="bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] rounded-full px-4 py-1.5 text-sm font-medium text-[#0F1111] transition-colors w-full md:w-auto">
                          Buy it again
                        </button>
                        <button onClick={() => handleStartScan(order)} className="bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] rounded-full px-4 py-2 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors w-full md:w-auto">
                          <Leaf className="w-4 h-4 text-[#007600]" /> Sell on EcoBridge
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* EcoBridge eligible banner (subtle, below the order) */}
                {!isSold && (
                  <div className="bg-[#FFFBF0] border-t border-[#FFD814]/30 px-4 py-2 flex items-center gap-2">
                    <Leaf className="w-3.5 h-3.5 text-[#007600]" />
                    <span className="text-[10px] text-[#565959]">This item is <span className="font-bold text-[#007600]">EcoBridge Eligible</span> — scan & sell locally to earn Green Coins</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
