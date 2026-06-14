import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { 
  Camera, CheckCircle, Package, Leaf, ChevronRight, Coins, 
  Recycle, ArrowLeft, Loader2, AlertTriangle, ShieldCheck,
  Users, Wrench, Edit3
} from 'lucide-react';

type Step = 'orders' | 'details' | 'scanner' | 'scanning' | 'result' | 'verify' | 'routed';

interface GradeResult {
  health_card: { condition: string; detected_labels: string[]; confidence: number };
  routing_decision: string;
  green_credits: number;
  earned_coins: number;
  item_id?: string;
  carbon_saved_estimate: string;
}

// Routing destinations based on condition
interface RoutingInfo {
  destination: string;
  icon: any;
  color: string;
  bgColor: string;
  description: string;
  action: string;
}

const ROUTING_CONFIG: Record<string, RoutingInfo> = {
  'Like New': {
    destination: 'P2P Marketplace',
    icon: Users,
    color: 'text-[#007600]',
    bgColor: 'bg-[#E7F4E4] border-[#C3E6C0]',
    description: 'Listed directly for peer-to-peer sale. Buyers within 5km can purchase immediately.',
    action: 'List on P2P Marketplace',
  },
  'Good': {
    destination: 'P2P Marketplace',
    icon: Users,
    color: 'text-[#007600]',
    bgColor: 'bg-[#E7F4E4] border-[#C3E6C0]',
    description: 'Minor wear detected. Still eligible for peer-to-peer resale with transparent condition report.',
    action: 'List on P2P Marketplace',
  },
  'Acceptable': {
    destination: 'Local Warehouse — Refurbish',
    icon: Wrench,
    color: 'text-[#FF9900]',
    bgColor: 'bg-[#FFFBF0] border-[#FFD814]/50',
    description: 'Sent to the nearest EcoBridge warehouse for professional inspection and refurbishment before resale.',
    action: 'Send to Warehouse for Refurb',
  },
  'Poor': {
    destination: 'Recycling Center',
    icon: Recycle,
    color: 'text-[#CC0C39]',
    bgColor: 'bg-[#FDF0F0] border-[#CC0C39]/20',
    description: 'Item not suitable for resale. Sent for responsible material recycling and e-waste processing.',
    action: 'Route to Recycling',
  },
};

const API_URL = import.meta.env.VITE_ECOBRIDGE_API_URL || "https://4w990xpwkg.execute-api.ap-south-1.amazonaws.com/prod";
console.log('[EcoBridge ViewA] API_URL =', API_URL);

const VIDEO_CONSTRAINTS = {
  width: 640,
  height: 480,
  facingMode: "environment",
};

interface OrderItem {
  id: string;
  orderId: string;
  name: string;
  price: number;
  originalPrice: number;
  icon?: string;
  datePlaced: string;
  status: string;
}

export function ViewA({ onEarnCoins, orders = [], soldItems = new Set(), onItemSold }: { 
  onEarnCoins?: (amount: number) => void;
  orders?: OrderItem[];
  soldItems?: Set<string>;
  onItemSold?: (orderId: string) => void;
}) {
  const [step, setStep] = useState<Step>('orders');
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanningOrderId, setScanningOrderId] = useState<string>('');
  const [scanningOrderName, setScanningOrderName] = useState<string>('');
  const webcamRef = useRef<Webcam>(null);
  
  // Seller verification (Layer 2)
  const [sellerNotes, setSellerNotes] = useState('');
  const [internalDamage, setInternalDamage] = useState<string[]>([]);
  const [finalCondition, setFinalCondition] = useState<string>('');

  const INTERNAL_DAMAGE_OPTIONS = [
    'Battery drains fast',
    'Speaker/mic issues',
    'Button not responsive',
    'Screen flicker',
    'Charging port loose',
    'Software glitches',
    'Overheating',
    'None — works perfectly',
  ];

  const handleScanItem = async () => {
    try {
      setError(null);
      setStep('scanning');

      const imageSrc = webcamRef.current?.getScreenshot('image/jpeg');
      if (!imageSrc) {
        setError('Could not capture image. Please allow camera access and try again.');
        setStep('scanner');
        return;
      }

      const payloadSize = imageSrc.length;
      console.log(`[EcoBridge] Image captured: ${(payloadSize / 1024).toFixed(0)}KB`);

      if (payloadSize > 5_000_000) {
        setError('Image too large. Try with better lighting.');
        setStep('scanner');
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 45000);

      const response = await fetch(`${API_URL}/api/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc, zip_code: '110001', product_name: scanningOrderName }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text();
        let msg = 'Grading failed.';
        try { msg = JSON.parse(text).error || msg; } catch { msg = `HTTP ${response.status}`; }
        setError(msg);
        setStep('scanner');
        return;
      }

      const data = await response.json();
      setGradeResult(data as GradeResult);
      setFinalCondition(data.health_card.condition);
      
      // Trigger green coins earn animation
      const earned = data.earned_coins || data.green_credits || 0;
      if (earned > 0 && onEarnCoins) {
        onEarnCoins(earned);
      }
      
      setStep('result');
    } catch (err: any) {
      console.error('[EcoBridge] Scan error:', err);
      if (err?.name === 'AbortError') {
        setError('Timed out — try again (Lambda is now warm).');
      } else {
        setError(`${err?.message || 'Connection failed'}`);
      }
      setStep('scanner');
    }
  };

  // Recalculate condition based on seller's internal damage report
  const computeFinalCondition = (aiCondition: string, damages: string[]): string => {
    if (damages.includes('None — works perfectly')) return aiCondition;
    if (damages.length === 0) return aiCondition;

    // Downgrade based on number/severity of internal issues
    const severe = ['Battery drains fast', 'Screen flicker', 'Overheating', 'Charging port loose'];
    const severeCount = damages.filter(d => severe.includes(d)).length;

    if (severeCount >= 2) return 'Poor';
    if (severeCount === 1) {
      if (aiCondition === 'Like New' || aiCondition === 'Good') return 'Acceptable';
      return 'Poor';
    }
    // Minor issues
    if (aiCondition === 'Like New') return 'Good';
    if (aiCondition === 'Good') return 'Acceptable';
    return aiCondition;
  };

  const handleSubmitVerification = () => {
    const adjusted = computeFinalCondition(
      gradeResult?.health_card.condition || 'Good',
      internalDamage
    );
    setFinalCondition(adjusted);
    // Mark this item as sold/listed
    if (onItemSold && scanningOrderId) {
      onItemSold(scanningOrderId);
    }
    setStep('routed');
  };

  const toggleDamage = (item: string) => {
    if (item === 'None — works perfectly') {
      setInternalDamage(['None — works perfectly']);
      return;
    }
    setInternalDamage(prev => {
      const filtered = prev.filter(d => d !== 'None — works perfectly');
      if (filtered.includes(item)) return filtered.filter(d => d !== item);
      return [...filtered, item];
    });
  };

  // ─── SCANNING ───────────────────────────────────────────────────────────────
  if (step === 'scanning') {
    return (
      <div className="min-h-[calc(100vh-108px)] bg-[#0F1111] text-white flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-[#FF9900] animate-spin mx-auto" />
          <h2 className="text-lg font-bold">Analyzing with AWS Rekognition...</h2>
          <p className="text-[#CCC] text-sm">Layer 1: Visual inspection via computer vision</p>
        </div>
      </div>
    );
  }

  // ─── SCANNER ────────────────────────────────────────────────────────────────
  if (step === 'scanner') {
    return (
      <div className="min-h-[calc(100vh-108px)] bg-[#0F1111] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#007600]/10 blur-3xl rounded-full w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="z-10 bg-white/5 border border-white/10 p-6 rounded-lg shadow-2xl flex flex-col items-center max-w-md w-full">
          <div className="text-[#FF9900] font-bold flex items-center mb-4 text-lg">
            <Camera className="w-6 h-6 mr-2" /> AI Condition Scanner
          </div>
          <p className="text-[#CCC] text-sm text-center mb-1">Layer 1 of 2: Visual AI Assessment</p>
          <p className="text-[#888] text-xs text-center mb-4">Hold your item. Rekognition will detect its condition from appearance.</p>

          <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-dashed border-[#FF9900]/40 mb-5 bg-black/50">
            <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" screenshotQuality={0.6} videoConstraints={VIDEO_CONSTRAINTS} className="w-full h-full object-cover opacity-80" mirrored />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border border-white/30 flex flex-col justify-between">
                <div className="flex justify-between w-full"><div className="w-4 h-4 border-t-2 border-l-2 border-[#FF9900]" /><div className="w-4 h-4 border-t-2 border-r-2 border-[#FF9900]" /></div>
                <div className="flex justify-between w-full"><div className="w-4 h-4 border-b-2 border-l-2 border-[#FF9900]" /><div className="w-4 h-4 border-b-2 border-r-2 border-[#FF9900]" /></div>
              </div>
            </div>
            <div className="absolute bottom-3 left-0 w-full text-center text-sm font-medium text-white/80 animate-pulse">Point camera at the product</div>
          </div>

          {error && <div className="w-full mb-3 bg-[#CC0C39]/10 border border-[#CC0C39]/30 rounded p-2 text-[#CC0C39] text-sm text-center">{error}</div>}

          <button onClick={handleScanItem}
            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-3 px-6 rounded-full transition-colors flex justify-center items-center border border-[#FCD200]">
            <Camera className="w-5 h-5 mr-2" /> Scan Item
          </button>
          <button onClick={() => setStep('details')} className="w-full mt-2 text-[#CCC] hover:text-white text-sm font-medium transition-colors py-2">Cancel</button>
        </div>
      </div>
    );
  }

  // ─── RESULT (Layer 1 — AI Scorecard) → Proceed to Seller Verification ──────
  if (step === 'result') {
    const condition = gradeResult?.health_card.condition || 'Good';
    const credits = gradeResult?.green_credits || 800;
    const carbonSaved = gradeResult?.carbon_saved_estimate || '8.2kg CO2';
    const labels = gradeResult?.health_card.detected_labels || [];
    const confidence = gradeResult?.health_card.confidence || 0;
    const routeInfo = ROUTING_CONFIG[condition] || ROUTING_CONFIG['Good'];

    return (
      <div className="max-w-2xl mx-auto p-4 mt-4">
        <div className="bg-white rounded border border-[#D5D9D9] overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-[#E7F4E4] border-b border-[#C3E6C0] p-5 flex items-start justify-between">
            <div>
              <div className="flex items-center text-[#007600] font-bold mb-1"><ShieldCheck className="w-5 h-5 mr-2" />Layer 1 Complete — AI Assessment</div>
              <h2 className="text-xl font-bold text-[#0F1111]">Product Health Card</h2>
              <p className="text-[#565959] text-sm mt-0.5">Confidence: {confidence}% • Powered by AWS Rekognition</p>
            </div>
            <div className="bg-white border border-[#D5D9D9] p-3 rounded text-center shadow-sm">
              <div className="text-[10px] text-[#565959] font-semibold uppercase">AI Grade</div>
              <div className={`text-lg font-bold ${condition === 'Like New' || condition === 'Good' ? 'text-[#007600]' : condition === 'Acceptable' ? 'text-[#FF9900]' : 'text-[#CC0C39]'}`}>{condition}</div>
            </div>
          </div>

          {/* ★ Coins Earned Banner */}
          <div className="mx-5 mt-4 bg-gradient-to-r from-[#FF9900]/10 to-[#FF9900]/5 border border-[#FF9900]/30 rounded-lg p-3 flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 bg-[#FF9900] rounded-full flex items-center justify-center shrink-0 shadow-md">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-[#0F1111]">🎉 You earned +{credits} Green Coins!</div>
              <p className="text-[10px] text-[#565959]">For this sustainable action — keeping products in the circular economy</p>
            </div>
          </div>

          {/* Detected Labels */}
          {labels.length > 0 && (
            <div className="px-5 pt-4 pb-3 border-b border-[#D5D9D9]">
              <div className="text-[10px] text-[#565959] uppercase font-semibold mb-2">Rekognition Detected Labels</div>
              <div className="flex flex-wrap gap-1.5">
                {labels.slice(0, 8).map((label, i) => (
                  <span key={i} className="bg-[#F0F2F2] border border-[#D5D9D9] text-[#0F1111] text-[10px] font-medium px-2 py-0.5 rounded">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Scores */}
          <div className="p-5 border-b border-[#D5D9D9]">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-[#F7F8F8] rounded border border-[#D5D9D9]">
                <div className="text-[#FF9900] text-xl font-bold">{credits.toLocaleString()}</div>
                <div className="text-[9px] text-[#565959] mt-0.5 font-medium">Green Credits 🪙</div>
              </div>
              <div className="text-center p-3 bg-[#F7F8F8] rounded border border-[#D5D9D9]">
                <div className="text-[#007600] text-xl font-bold">{carbonSaved.replace(' CO2', '')}</div>
                <div className="text-[9px] text-[#565959] mt-0.5 font-medium">CO₂ Saved</div>
              </div>
              <div className="text-center p-3 bg-[#F7F8F8] rounded border border-[#D5D9D9]">
                <routeInfo.icon className={`w-6 h-6 mx-auto ${routeInfo.color}`} />
                <div className="text-[9px] text-[#565959] mt-1 font-medium">{routeInfo.destination.split('—')[0].trim()}</div>
              </div>
            </div>
          </div>

          {/* Suggested Route */}
          <div className={`mx-5 mt-4 mb-3 p-3 rounded border ${routeInfo.bgColor}`}>
            <div className="flex items-center gap-2 mb-1">
              <routeInfo.icon className={`w-4 h-4 ${routeInfo.color}`} />
              <span className={`text-sm font-bold ${routeInfo.color}`}>Suggested Route: {routeInfo.destination}</span>
            </div>
            <p className="text-xs text-[#565959] leading-relaxed">{routeInfo.description}</p>
          </div>

          {/* CTA — Proceed to Layer 2 */}
          <div className="p-5">
            <button onClick={() => setStep('verify')}
              className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-3 rounded-full border border-[#FCD200] transition-colors flex justify-center items-center gap-2 text-sm">
              <Edit3 className="w-4 h-4" /> Proceed to Layer 2: Seller Verification
            </button>
            <p className="text-[10px] text-[#565959] text-center mt-2">Add internal condition details that the camera can't detect</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── VERIFY (Layer 2 — Seller Self-Report) ─────────────────────────────────
  if (step === 'verify') {
    const aiCondition = gradeResult?.health_card.condition || 'Good';

    return (
      <div className="max-w-2xl mx-auto p-4 mt-4">
        <div className="bg-white rounded border border-[#D5D9D9] overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-[#232F3E] p-5 text-white">
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-[#FF9900]" />
              <span className="text-xs font-bold text-[#FF9900] uppercase tracking-wider">Layer 2 — Seller Verification</span>
            </div>
            <h2 className="text-lg font-bold">Report Internal Condition</h2>
            <p className="text-[#CCC] text-sm mt-1">
              AI scanned the exterior. Now tell us about anything it couldn't see — battery, internals, functionality.
            </p>
          </div>

          <div className="p-5 space-y-5">
            {/* AI Layer 1 Summary */}
            <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded p-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-[#565959] uppercase font-semibold">Layer 1 AI Grade</div>
                <div className="text-sm font-bold text-[#0F1111] mt-0.5">{aiCondition}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#565959] uppercase font-semibold">Confidence</div>
                <div className="text-sm font-bold text-[#007600]">{gradeResult?.health_card.confidence}%</div>
              </div>
            </div>

            {/* Internal Damage Checkboxes */}
            <div>
              <label className="text-sm font-bold text-[#0F1111] block mb-2">
                <AlertTriangle className="w-4 h-4 inline mr-1.5 text-[#FF9900]" />
                Any internal issues? (select all that apply)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {INTERNAL_DAMAGE_OPTIONS.map((opt) => {
                  const isSelected = internalDamage.includes(opt);
                  const isNone = opt === 'None — works perfectly';
                  return (
                    <button
                      key={opt}
                      onClick={() => toggleDamage(opt)}
                      className={`text-left p-2.5 rounded border text-xs font-medium transition-all ${
                        isSelected
                          ? isNone
                            ? 'border-[#007600] bg-[#E7F4E4] text-[#007600]'
                            : 'border-[#CC0C39] bg-[#FDF0F0] text-[#CC0C39]'
                          : 'border-[#D5D9D9] bg-white text-[#565959] hover:border-[#FF9900] hover:bg-[#FFFBF0]'
                      }`}
                    >
                      {isSelected ? '✓ ' : ''}{opt}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seller Notes */}
            <div>
              <label className="text-sm font-bold text-[#0F1111] block mb-2">
                Additional Notes (optional)
              </label>
              <textarea
                value={sellerNotes}
                onChange={(e) => setSellerNotes(e.target.value)}
                placeholder="E.g., 'Left earbud quieter than right' or 'Works fine, just upgrading'"
                className="w-full border border-[#D5D9D9] rounded p-3 text-sm text-[#0F1111] placeholder-[#999] outline-none focus:border-[#FF9900] resize-none h-20"
              />
            </div>

            {/* Preview adjusted condition */}
            {internalDamage.length > 0 && (
              <div className="bg-[#FFFBF0] border border-[#FFD814]/50 rounded p-3">
                <div className="text-[10px] text-[#565959] uppercase font-semibold mb-1">Adjusted Condition Preview</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#565959]">{aiCondition} → <span className="font-bold text-[#0F1111]">{computeFinalCondition(aiCondition, internalDamage)}</span></span>
                  {computeFinalCondition(aiCondition, internalDamage) !== aiCondition && (
                    <span className="text-[9px] bg-[#FF9900]/20 text-[#FF9900] font-bold px-2 py-0.5 rounded">Downgraded</span>
                  )}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmitVerification}
              disabled={internalDamage.length === 0}
              className="w-full bg-[#FFD814] hover:bg-[#F7CA00] disabled:bg-[#F0F2F2] disabled:text-[#999] text-[#0F1111] font-bold py-3 rounded-full border border-[#FCD200] disabled:border-[#D5D9D9] transition-colors flex justify-center items-center gap-2 text-sm"
            >
              <ShieldCheck className="w-4 h-4" /> Confirm & Route Item
            </button>
            <p className="text-[10px] text-center text-[#565959]">Select at least one option above to continue</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── ROUTED (Final Decision — P2P / Warehouse / Recycle) ────────────────────
  if (step === 'routed') {
    const routeInfo = ROUTING_CONFIG[finalCondition] || ROUTING_CONFIG['Good'];
    const credits = gradeResult?.green_credits || 800;
    const carbonSaved = gradeResult?.carbon_saved_estimate || '8.2kg CO2';
    const RouteIcon = routeInfo.icon;

    // Adjust credits based on downgrade
    const originalCondition = gradeResult?.health_card.condition || 'Good';
    const wasDowngraded = finalCondition !== originalCondition;
    const creditMap: Record<string, number> = { 'Like New': 1200, 'Good': 800, 'Acceptable': 400, 'Poor': 100 };
    const finalCredits = creditMap[finalCondition] || credits;

    return (
      <div className="max-w-2xl mx-auto p-4 mt-4">
        <div className="bg-white rounded border border-[#D5D9D9] overflow-hidden shadow-sm">
          {/* Success Header */}
          <div className={`p-6 text-center border-b ${routeInfo.bgColor}`}>
            <div className="w-16 h-16 mx-auto rounded-full bg-white border-2 border-current flex items-center justify-center mb-3 shadow-sm">
              <RouteIcon className={`w-8 h-8 ${routeInfo.color}`} />
            </div>
            <h2 className="text-xl font-bold text-[#0F1111]">Item Routed Successfully</h2>
            <p className={`text-sm font-bold mt-1 ${routeInfo.color}`}>{routeInfo.destination}</p>
          </div>

          {/* Two-Layer Verification Badge */}
          <div className="px-5 pt-4">
            <div className="flex items-center gap-3 bg-[#F7F8F8] border border-[#D5D9D9] rounded p-3">
              <div className="flex gap-1">
                <span className="bg-[#007600] text-white text-[8px] font-black px-1.5 py-0.5 rounded">L1</span>
                <span className="bg-[#232F3E] text-white text-[8px] font-black px-1.5 py-0.5 rounded">L2</span>
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F1111]">Two-Layer Verified</div>
                <div className="text-[10px] text-[#565959]">AI Rekognition + Seller Self-Report</div>
              </div>
              <CheckCircle className="w-5 h-5 text-[#007600] ml-auto" />
            </div>
          </div>

          {/* Final Condition Summary */}
          <div className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded p-3 text-center">
                <div className="text-[9px] text-[#565959] uppercase font-semibold">Final Condition</div>
                <div className={`text-lg font-bold mt-0.5 ${finalCondition === 'Like New' || finalCondition === 'Good' ? 'text-[#007600]' : finalCondition === 'Acceptable' ? 'text-[#FF9900]' : 'text-[#CC0C39]'}`}>
                  {finalCondition}
                </div>
                {wasDowngraded && (
                  <div className="text-[8px] text-[#FF9900] font-bold mt-0.5">↓ from {originalCondition}</div>
                )}
              </div>
              <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded p-3 text-center">
                <div className="text-[9px] text-[#565959] uppercase font-semibold">Green Credits</div>
                <div className="text-lg font-bold text-[#FF9900] mt-0.5">{finalCredits.toLocaleString()} 🪙</div>
              </div>
            </div>

            {/* Seller Notes Display */}
            {sellerNotes && (
              <div className="bg-[#FFFBF0] border border-[#FFD814]/30 rounded p-3">
                <div className="text-[9px] text-[#565959] uppercase font-semibold mb-1">Seller Notes</div>
                <p className="text-xs text-[#0F1111] italic">"{sellerNotes}"</p>
              </div>
            )}

            {/* Internal Issues Reported */}
            {internalDamage.length > 0 && !internalDamage.includes('None — works perfectly') && (
              <div className="bg-[#FDF0F0] border border-[#CC0C39]/15 rounded p-3">
                <div className="text-[9px] text-[#565959] uppercase font-semibold mb-1">Internal Issues Disclosed</div>
                <div className="flex flex-wrap gap-1">
                  {internalDamage.map((d, i) => (
                    <span key={i} className="text-[10px] bg-[#CC0C39]/10 text-[#CC0C39] font-medium px-2 py-0.5 rounded">{d}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Impact Timeline */}
            <div className="pt-3 border-t border-[#D5D9D9]">
              <h3 className="font-bold text-[#0F1111] mb-4 text-sm">Routing Summary</h3>
              <div className="relative pl-8 border-l-2 border-[#007600]/30 space-y-5">
                <div className="relative">
                  <div className="absolute left-[-41px] bg-[#FF9900] rounded-full p-1.5 border-4 border-white"><Coins className="w-3.5 h-3.5 text-white" /></div>
                  <h4 className="font-bold text-[#0F1111] text-sm">{finalCredits.toLocaleString()} Green Credits Earned</h4>
                  <p className="text-[#565959] text-xs">Credited to your EcoBridge wallet instantly.</p>
                </div>
                <div className="relative">
                  <div className="absolute left-[-41px] bg-[#007600] rounded-full p-1.5 border-4 border-white"><Leaf className="w-3.5 h-3.5 text-white" /></div>
                  <h4 className="font-bold text-[#0F1111] text-sm">{carbonSaved} Carbon Offset</h4>
                  <p className="text-[#565959] text-xs">Saved by keeping this item in circulation.</p>
                </div>
                <div className="relative">
                  <div className="absolute left-[-41px] bg-[#232F3E] rounded-full p-1.5 border-4 border-white"><RouteIcon className="w-3.5 h-3.5 text-white" /></div>
                  <h4 className="font-bold text-[#0F1111] text-sm">{routeInfo.action}</h4>
                  <p className="text-[#565959] text-xs">{routeInfo.description}</p>
                </div>
              </div>
            </div>

            <button onClick={() => { setStep('orders'); setGradeResult(null); setSellerNotes(''); setInternalDamage([]); }}
              className="mt-5 w-full bg-[#F0F2F2] hover:bg-[#E3E6E6] text-[#0F1111] font-medium py-2.5 rounded-full border border-[#D5D9D9] transition-colors text-sm">
              Return to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PRODUCT DETAILS (redirects to scanner) ─────────────────────────────────
  if (step === 'details') {
    setStep('scanner');
    return null;
  }

  // ─── ORDERS LIST (Dynamic — populated when buyer purchases) ──────────────────
  return (
    <div className="max-w-4xl mx-auto p-4 mt-2">
      <h1 className="text-xl font-medium text-[#0F1111] mb-4">Your Orders — Sell on EcoBridge</h1>
      
      {orders.length === 0 ? (
        <div className="bg-white border border-[#D5D9D9] rounded p-10 text-center shadow-sm">
          <Package className="w-16 h-16 text-[#D5D9D9] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#0F1111] mb-2">No items to sell yet</h2>
          <p className="text-sm text-[#565959]">When a buyer purchases items from the storefront, they'll appear here for you to scan and list on EcoBridge.</p>
          <p className="text-xs text-[#007185] mt-3">Switch to Amit (Buyer) → Add items to cart → Purchase → Items appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isSold = soldItems.has(order.id);
            return (
              <div key={order.id} className={`bg-white rounded overflow-hidden relative ${isSold ? 'border border-[#D5D9D9] opacity-70' : 'border-2 border-[#007600]'}`}>
                <div className={`${isSold ? 'bg-[#F0F2F2]' : 'bg-[#E7F4E4]'} border-b ${isSold ? 'border-[#D5D9D9]' : 'border-[#C3E6C0]'} px-4 py-2 flex items-center justify-between`}>
                  <div className="flex gap-6 text-xs text-[#565959]">
                    <div><span className="uppercase text-[10px] block font-medium">Order placed</span>{order.datePlaced}</div>
                    <div><span className="uppercase text-[10px] block font-medium">Total</span>₹{order.price.toLocaleString('en-IN')}</div>
                  </div>
                  {isSold ? (
                    <div className="flex items-center gap-1 bg-[#232F3E] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" /> Listed on EcoBridge
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 bg-[#007600] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      <Leaf className="w-3 h-3" /> EcoBridge Eligible
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-[#F7F8F8] rounded flex items-center justify-center mr-4 border border-[#D5D9D9] text-3xl">
                      {order.icon || <Package className="text-[#D5D9D9] w-8 h-8" />}
                    </div>
                    <div>
                      <span className="text-[#007185] font-medium text-sm">{order.name}</span>
                      <p className={`text-xs font-medium mt-0.5 ${isSold ? 'text-[#565959]' : 'text-[#007600]'}`}>
                        {isSold ? '✓ Listed on P2P Marketplace' : order.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    {!isSold && (
                      <button onClick={() => { setScanningOrderId(order.id); setScanningOrderName(order.name); setStep('scanner'); }}
                        className="bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] rounded-full px-4 py-2 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors">
                        <Camera className="w-4 h-4" /> Scan & Sell on EcoBridge
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
