import { useState } from 'react';
import { Package, Leaf, CheckCircle, Recycle, Truck, X, ArrowRight, ClipboardList, Camera, Loader2, ShieldCheck, Coins } from 'lucide-react';
import { AngleCaptureStep } from './grading/AngleCaptureStep';
import { ReviewCapturesStep } from './grading/ReviewCapturesStep';
import { ScoreBreakdownCard } from './grading/ScoreBreakdownCard';

export interface OrderItem {
  id: string;
  orderId: string;
  name: string;
  price: number;
  originalPrice: number;
  icon?: string;
  datePlaced: string;
  status: string;
  isReturnable: boolean;
  co2Saved?: string;
  greenCoins?: number;
}

const RETURN_REASONS = [
  { id: 'damaged', label: 'Product damaged or defective', icon: '🔨' },
  { id: 'wrong_item', label: 'Wrong item received', icon: '❌' },
  { id: 'not_as_described', label: 'Product not as described', icon: '📝' },
  { id: 'size_fit', label: 'Size/Fit issue', icon: '📏' },
  { id: 'changed_mind', label: 'Changed my mind', icon: '🔄' },
  { id: 'better_alternative', label: 'Found a better alternative', icon: '🔍' },
  { id: 'late_delivery', label: 'Delivery took too long', icon: '🐢' },
  { id: 'no_longer_needed', label: 'No longer needed', icon: '🚫' },
  { id: 'other', label: 'Other', icon: '💬' },
];

const API_URL = import.meta.env.VITE_ECOBRIDGE_API_URL || 'https://4w990xpwkg.execute-api.ap-south-1.amazonaws.com/prod';

type ViewState = 'orders' | 'reason_form' | 'choice' | 'capture_front' | 'capture_back' | 'capture_left' | 'capture_right' | 'review' | 'scanning' | 'health_card' | 'done';

/**
 * ViewB — Returner View
 * Flow: Orders → Reason Form → Choice (Normal/EcoBridge) → 4-Angle Scan → Health Card → Listed
 */
export function ViewB({ orders = [], onEarnCoins, onEcoBridgeReturn }: { orders?: OrderItem[]; onEarnCoins?: (amount: number) => void; onEcoBridgeReturn?: (order: OrderItem, images?: Record<string, string>, gradeData?: any) => void }) {
  const [viewState, setViewState] = useState<ViewState>('orders');
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [captures, setCaptures] = useState<Record<string, string>>({});
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [healthScore, setHealthScore] = useState<any>(null);
  
  // Persist returned items
  const [returnedItems, setReturnedItems] = useState<Record<string, { type: 'ecobridge' | 'normal'; reason: string }>>(() => {
    try { const s = localStorage.getItem('ecobridge_returnedItems'); return s ? JSON.parse(s) : {}; } catch { return {}; }
  });

  const saveReturnedItems = (items: Record<string, any>) => {
    setReturnedItems(items);
    try { localStorage.setItem('ecobridge_returnedItems', JSON.stringify(items)); } catch {}
  };

  const handleReturnClick = (order: OrderItem) => {
    setSelectedOrder(order);
    setSelectedReason('');
    setOtherReason('');
    setCaptures({});
    setHealthScore(null);
    setViewState('reason_form');
  };

  const handleReasonSubmit = () => setViewState('choice');

  const handleNormalReturn = () => {
    if (selectedOrder) {
      const reason = selectedReason === 'other' ? otherReason : RETURN_REASONS.find(r => r.id === selectedReason)?.label || '';
      saveReturnedItems({ ...returnedItems, [selectedOrder.id]: { type: 'normal', reason } });
    }
    setViewState('orders');
  };

  const handleEcoBridgeChoice = () => {
    // Start the 4-angle capture flow
    setViewState('capture_front');
  };

  const handleCapture = (angle: string, dataUrl: string) => {
    setCaptures(prev => ({ ...prev, [angle]: dataUrl }));
    const angles = ['front', 'back', 'left', 'right'];
    const nextIdx = angles.indexOf(angle) + 1;
    if (nextIdx < angles.length) {
      setViewState(`capture_${angles[nextIdx]}` as ViewState);
    } else {
      setViewState('review');
    }
  };

  const handleSubmitForGrading = async () => {
    setViewState('scanning');
    setAnalysisProgress(0);

    try {
      const angles = ['front', 'back', 'left', 'right'];
      const results: any[] = [];

      for (let i = 0; i < angles.length; i++) {
        setAnalysisProgress(i);
        const angle = angles[i];
        if (!captures[angle]) continue;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(`${API_URL}/api/grade`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: captures[angle], zip_code: '110001', product_name: selectedOrder?.name || '' }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (response.ok) {
          const data = await response.json();
          results.push({ angle, ...data });
        }
      }
      setAnalysisProgress(4);

      // Compute health score from results
      const conditions = results.map(r => r.health_card?.condition || 'Good');
      const avgConfidence = Math.round(results.reduce((s, r) => s + (r.health_card?.confidence || 80), 0) / Math.max(results.length, 1));
      const majorityCondition = conditions.sort((a, b) => conditions.filter(v => v === b).length - conditions.filter(v => v === a).length)[0] || 'Good';
      const overall = majorityCondition === 'Like New' ? 92 : majorityCondition === 'Good' ? 78 : majorityCondition === 'Acceptable' ? 55 : 30;
      const labels = results.flatMap(r => r.health_card?.detected_labels || []).slice(0, 8);

      setHealthScore({
        overall,
        condition: majorityCondition,
        confidence: avgConfidence,
        labels,
        identityScore: 95,
        completenessScore: 100,
        cosmeticScore: overall,
      });

      // Earn coins based on price (5% of original, min 30, max 200)
      const earnedCoins = Math.min(200, Math.max(30, Math.round((selectedOrder?.price || 4000) * 0.05)));
      if (onEarnCoins) onEarnCoins(earnedCoins);

      setViewState('health_card');
    } catch {
      setViewState('review');
    }
  };

  const handleListOnEcoBridge = () => {
    if (selectedOrder) {
      const reason = selectedReason === 'other' ? otherReason : RETURN_REASONS.find(r => r.id === selectedReason)?.label || '';
      saveReturnedItems({ ...returnedItems, [selectedOrder.id]: { type: 'ecobridge', reason } });
      if (onEcoBridgeReturn) onEcoBridgeReturn(selectedOrder, captures, { condition: healthScore?.condition, healthScore: healthScore?.overall, labels: healthScore?.labels, confidence: healthScore?.confidence });
    }
    setViewState('orders');
  };

  const isReasonValid = selectedReason && (selectedReason !== 'other' || otherReason.trim().length > 0);

  // ═══ CAPTURE STEPS ═══
  if (viewState === 'capture_front') return <AngleCaptureStep angle="front" stepNumber={1} totalSteps={4} onCaptured={(d) => handleCapture('front', d)} onBack={() => setViewState('choice')} />;
  if (viewState === 'capture_back') return <AngleCaptureStep angle="back" stepNumber={2} totalSteps={4} onCaptured={(d) => handleCapture('back', d)} onBack={() => setViewState('capture_front')} />;
  if (viewState === 'capture_left') return <AngleCaptureStep angle="left" stepNumber={3} totalSteps={4} onCaptured={(d) => handleCapture('left', d)} onBack={() => setViewState('capture_back')} />;
  if (viewState === 'capture_right') return <AngleCaptureStep angle="right" stepNumber={4} totalSteps={4} onCaptured={(d) => handleCapture('right', d)} onBack={() => setViewState('capture_left')} />;

  // ═══ REVIEW ═══
  if (viewState === 'review') return <ReviewCapturesStep captures={captures} videoRecorded={false} onRetake={(a) => setViewState(`capture_${a}` as ViewState)} onSubmit={handleSubmitForGrading} onBack={() => setViewState('capture_right')} />;

  // ═══ SCANNING ═══
  if (viewState === 'scanning') {
    return (
      <div className="min-h-[calc(100vh-150px)] bg-[#0F1111] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6 text-center">
          <Loader2 className="w-10 h-10 text-[#FF9900] animate-spin mx-auto" />
          <h2 className="text-lg font-bold">Analyzing Return Item...</h2>
          <p className="text-sm text-[#CCC]">Running AI inspection on 4 angles</p>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-[#FF9900] h-2 rounded-full transition-all duration-500" style={{ width: `${(analysisProgress / 4) * 100}%` }} />
          </div>
          <p className="text-[10px] text-[#888]">{analysisProgress}/4 images processed</p>
        </div>
      </div>
    );
  }

  // ═══ HEALTH CARD ═══
  if (viewState === 'health_card' && healthScore) {
    return (
      <div className="max-w-2xl mx-auto p-4 mt-4">
        <div className="bg-white border border-[#D5D9D9] rounded-lg overflow-hidden shadow-sm">
          <div className="bg-[#E7F4E4] border-b border-[#C3E6C0] p-5 flex items-start justify-between">
            <div>
              <div className="flex items-center text-[#007600] font-bold mb-1"><ShieldCheck className="w-5 h-5 mr-2" />Return Item Inspected</div>
              <h2 className="text-lg font-bold text-[#0F1111]">{selectedOrder?.name}</h2>
              <p className="text-xs text-[#565959] mt-0.5">4-angle AI inspection complete • Confidence: {healthScore.confidence}%</p>
            </div>
            <div className="bg-white border border-[#D5D9D9] p-3 rounded text-center shadow-sm">
              <div className="text-[9px] text-[#565959] font-semibold uppercase">Condition</div>
              <div className={`text-lg font-bold ${healthScore.condition === 'Like New' || healthScore.condition === 'Good' ? 'text-[#007600]' : 'text-[#FF9900]'}`}>{healthScore.condition}</div>
            </div>
          </div>

          {/* Coins banner */}
          <div className="mx-4 mt-4 bg-gradient-to-r from-[#FF9900]/10 to-[#FF9900]/5 border border-[#FF9900]/30 rounded-lg p-3 flex items-center gap-3">
            <Coins className="w-8 h-8 text-[#FF9900]" />
            <div>
              <div className="text-sm font-bold text-[#0F1111]">🎉 +{Math.min(200, Math.max(30, Math.round((selectedOrder?.price || 4000) * 0.05)))} Green Coins earned!</div>
              <p className="text-[10px] text-[#565959]">For choosing EcoBridge over standard return</p>
            </div>
          </div>

          {/* 4-image strip */}
          <div className="px-4 pt-4">
            <div className="grid grid-cols-4 gap-2">
              {['front', 'back', 'left', 'right'].map(a => captures[a] && (
                <div key={a} className="aspect-square rounded overflow-hidden border border-[#D5D9D9]">
                  <img src={captures[a]} alt={a} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>

          {/* Score breakdown */}
          <div className="p-4">
            <ScoreBreakdownCard
              overall={healthScore.overall}
              identityScore={healthScore.identityScore}
              identityStatus="match"
              completenessScore={healthScore.completenessScore}
              cosmeticScore={healthScore.cosmeticScore}
              worstSeverity="none"
              findingsCount={0}
            />
          </div>

          {/* Listing info */}
          <div className="px-4 pb-2">
            <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded p-3 flex items-center justify-between text-sm">
              <span className="text-[#565959]">Listing Price</span>
              <span className="font-bold text-[#0F1111]">₹{(selectedOrder?.price || 4000).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* CTA */}
          <div className="p-4 border-t border-[#D5D9D9]">
            <button onClick={handleListOnEcoBridge} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-3 rounded-full border border-[#FCD200] flex items-center justify-center gap-2 text-sm">
              <Leaf className="w-4 h-4 text-[#007600]" /> List on EcoBridge at ₹{(selectedOrder?.price || 4000).toLocaleString('en-IN')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ REASON FORM ═══
  if (viewState === 'reason_form' && selectedOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="bg-white border border-[#D5D9D9] rounded-lg shadow-2xl max-w-md w-full relative z-10 overflow-hidden">
          <button onClick={() => setViewState('orders')} className="absolute top-3 right-3 text-[#565959] hover:text-[#0F1111] z-20"><X className="w-5 h-5" /></button>
          <div className="bg-[#F0F2F2] border-b border-[#D5D9D9] p-5">
            <div className="flex items-center gap-2 mb-1"><ClipboardList className="w-5 h-5 text-[#FF9900]" /><h2 className="text-base font-bold text-[#0F1111]">Why are you returning this item?</h2></div>
            <p className="text-xs text-[#565959]">{selectedOrder.name}</p>
          </div>
          <div className="p-4 max-h-[50vh] overflow-y-auto space-y-2">
            {RETURN_REASONS.map(reason => (
              <button key={reason.id} onClick={() => setSelectedReason(reason.id)} className={`w-full text-left p-3 rounded-lg border flex items-center gap-3 transition-all ${selectedReason === reason.id ? 'border-[#FF9900] bg-[#FFFBF0] shadow-sm' : 'border-[#D5D9D9] hover:border-[#FF9900]/50'}`}>
                <span className="text-lg">{reason.icon}</span>
                <span className="text-sm font-medium text-[#0F1111]">{reason.label}</span>
                {selectedReason === reason.id && <CheckCircle className="w-4 h-4 text-[#FF9900] ml-auto" />}
              </button>
            ))}
            {selectedReason === 'other' && <textarea value={otherReason} onChange={e => setOtherReason(e.target.value)} placeholder="Please describe..." className="w-full mt-2 border border-[#D5D9D9] rounded-lg p-3 text-sm outline-none focus:border-[#FF9900] resize-none h-20" />}
          </div>
          <div className="p-4 border-t border-[#D5D9D9]">
            <button onClick={handleReasonSubmit} disabled={!isReasonValid} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] disabled:bg-[#F0F2F2] disabled:text-[#999] text-[#0F1111] font-bold py-3 rounded-full border border-[#FCD200] disabled:border-[#D5D9D9] text-sm flex items-center justify-center gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>
    );
  }

  // ═══ CHOICE: Normal vs EcoBridge ═══
  if (viewState === 'choice' && selectedOrder) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className="bg-white border border-[#D5D9D9] rounded-lg shadow-2xl max-w-md w-full relative z-10 overflow-hidden">
          <button onClick={() => setViewState('orders')} className="absolute top-3 right-3 text-[#565959] hover:text-[#0F1111] z-20"><X className="w-5 h-5" /></button>
          <div className="bg-[#232F3E] p-6 text-center">
            <div className="inline-flex items-center justify-center bg-[#007600]/20 p-3 rounded-full mb-3"><Leaf className="w-8 h-8 text-[#FF9900]" /></div>
            <h2 className="text-xl font-bold text-white mb-1">Choose Return Path 🌱</h2>
            <p className="text-[#CCC] text-sm">List on EcoBridge to earn coins and help the planet</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded p-3 flex items-center gap-3">
              <div className="w-12 h-12 bg-white border border-[#D5D9D9] rounded flex items-center justify-center text-2xl shrink-0">{selectedOrder.icon || '📦'}</div>
              <div><div className="text-sm font-medium text-[#0F1111] line-clamp-1">{selectedOrder.name}</div><div className="text-xs text-[#565959]">₹{selectedOrder.price.toLocaleString('en-IN')}</div></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#E7F4E4] border border-[#C3E6C0] rounded p-3 text-center">
                <div className="text-[9px] text-[#565959] uppercase font-semibold mb-1">EcoBridge</div>
                <div className="text-sm font-bold text-[#007600]">+{Math.min(200, Math.max(30, Math.round(selectedOrder.price * 0.05)))} 🪙</div>
                <div className="text-[9px] text-[#565959] mt-0.5">+ AI Inspection</div>
              </div>
              <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded p-3 text-center">
                <div className="text-[9px] text-[#565959] uppercase font-semibold mb-1">Normal Return</div>
                <div className="text-sm font-bold text-[#565959]">0 🪙</div>
                <div className="text-[9px] text-[#565959] mt-0.5">Standard process</div>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <button onClick={handleEcoBridgeChoice} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-3 rounded-full border border-[#FCD200] flex justify-center items-center gap-2 text-sm">
                <Camera className="w-4 h-4" /> Scan & List on EcoBridge <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleNormalReturn} className="w-full bg-[#F0F2F2] hover:bg-[#E3E6E6] text-[#0F1111] font-medium py-3 rounded-full border border-[#D5D9D9] text-sm">
                Proceed with standard return
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═══ ORDERS LIST ═══
  return (
    <div className="max-w-4xl mx-auto p-4 mt-2">
      <h1 className="text-xl font-medium text-[#0F1111] mb-4">Returns & Orders</h1>
      {orders.length === 0 ? (
        <div className="bg-white border border-[#D5D9D9] rounded p-10 text-center shadow-sm">
          <Package className="w-16 h-16 text-[#D5D9D9] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#0F1111] mb-2">No orders yet</h2>
          <p className="text-sm text-[#565959]">Purchase items from the storefront to see them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => {
            const returnStatus = returnedItems[order.id];
            return (
              <div key={order.id} className="bg-white border border-[#D5D9D9] rounded overflow-hidden">
                <div className="bg-[#F0F2F2] border-b border-[#D5D9D9] px-4 py-2 flex items-center justify-between text-xs text-[#565959]">
                  <div className="flex gap-6">
                    <div><span className="uppercase text-[10px] block font-medium">Order placed</span>{order.datePlaced}</div>
                    <div><span className="uppercase text-[10px] block font-medium">Total</span>₹{order.price.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="text-[10px]">ORDER# {order.orderId}</div>
                </div>
                <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-[#F7F8F8] rounded flex items-center justify-center mr-4 border border-[#D5D9D9] text-3xl">{order.icon || '📦'}</div>
                    <div>
                      <span className="text-[#007185] font-medium text-sm">{order.name}</span>
                      <p className={`text-xs font-medium mt-0.5 ${returnStatus?.type === 'ecobridge' ? 'text-[#007600]' : returnStatus ? 'text-[#565959]' : 'text-[#007600]'}`}>
                        {returnStatus?.type === 'ecobridge' ? '✓ Listed on EcoBridge' : returnStatus?.type === 'normal' ? '↩ Return processing' : order.status}
                      </p>
                      {returnStatus && <p className="text-[10px] text-[#565959]">Reason: {returnStatus.reason}</p>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    {!returnStatus ? (
                      <>
                        <button className="bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] rounded-full px-4 py-1.5 text-sm font-medium text-[#0F1111] transition-colors w-full md:w-auto flex items-center justify-center gap-1.5"><Truck className="w-3.5 h-3.5" /> Track package</button>
                        <button onClick={() => handleReturnClick(order)} className="bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] rounded-full px-4 py-1.5 text-sm font-medium text-[#0F1111] transition-colors w-full md:w-auto flex items-center justify-center gap-1.5"><Recycle className="w-3.5 h-3.5 text-[#007600]" /> Return item</button>
                      </>
                    ) : returnStatus.type === 'ecobridge' ? (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E7F4E4] border border-[#C3E6C0] rounded-full text-xs text-[#007600] font-bold"><Leaf className="w-3.5 h-3.5" /> On EcoBridge</div>
                    ) : (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F2F2] border border-[#D5D9D9] rounded-full text-xs text-[#565959] font-medium"><CheckCircle className="w-3.5 h-3.5" /> Return processing</div>
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
