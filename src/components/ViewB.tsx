import { useState, useRef } from 'react';
import Webcam from 'react-webcam';
import { Package, Leaf, X, CheckCircle, Camera, Recycle, ArrowRight } from 'lucide-react';

type State = 'orders' | 'scanning' | 'modal' | 'toast';

interface GradeResult {
  health_card: { condition: string; detected_labels: string[]; confidence: number };
  routing_decision: string;
  green_credits: number;
  item_id?: string;
  carbon_saved_estimate: string;
}

const API_URL = import.meta.env.VITE_ECOBRIDGE_API_URL;

export function ViewB() {
  const [state, setState] = useState<State>('orders');
  const [gradeResult, setGradeResult] = useState<GradeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const handleReturnClick = () => { setState('scanning'); setError(null); };

  const handleScanAndGrade = async () => {
    try {
      setError(null);
      const imageSrc = webcamRef.current?.getScreenshot();
      if (!imageSrc) { setError('Could not capture image. Please try again.'); return; }
      const response = await fetch(`${API_URL}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageSrc, zip_code: '110001' }),
      });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Grading failed. Please try again.'); return; }
      setGradeResult(data as GradeResult);
      setState('modal');
    } catch {
      setError('Network error. Please check your connection and try again.');
    }
  };

  const handleAcceptEcoOffer = () => setState('toast');

  // ─── SCANNING ───────────────────────────────────────────────────────────────
  if (state === 'scanning') {
    return (
      <div className="min-h-[calc(100vh-108px)] bg-[#0F1111] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#007600]/10 blur-3xl rounded-full w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="z-10 bg-white/5 border border-white/10 p-6 rounded-lg shadow-2xl flex flex-col items-center max-w-md w-full">
          <div className="text-[#FF9900] font-bold flex items-center mb-2 text-lg"><Camera className="w-6 h-6 mr-2" />AI Return Scanner</div>
          <p className="text-[#CCC] text-sm text-center mb-4">Show us the item you're returning. We'll find a greener path.</p>

          <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-dashed border-[#FF9900]/40 mb-5 bg-black/50">
            <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" className="w-full h-full object-cover opacity-80" mirrored />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border border-white/30 flex flex-col justify-between">
                <div className="flex justify-between w-full"><div className="w-4 h-4 border-t-2 border-l-2 border-[#FF9900]" /><div className="w-4 h-4 border-t-2 border-r-2 border-[#FF9900]" /></div>
                <div className="flex justify-between w-full"><div className="w-4 h-4 border-b-2 border-l-2 border-[#FF9900]" /><div className="w-4 h-4 border-b-2 border-r-2 border-[#FF9900]" /></div>
              </div>
            </div>
            <div className="absolute bottom-3 left-0 w-full text-center text-sm font-medium text-white/80 animate-pulse">Align return item in the frame</div>
          </div>

          {error && <div className="w-full mb-3 bg-[#CC0C39]/10 border border-[#CC0C39]/30 rounded p-2 text-[#CC0C39] text-sm text-center">{error}</div>}

          <button onClick={handleScanAndGrade}
            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-3 px-6 rounded-full transition-colors flex justify-center items-center border border-[#FCD200]">
            <Camera className="w-5 h-5 mr-2" /> Scan & Grade Item
          </button>
          <button onClick={() => setState('orders')} className="w-full mt-2 text-[#CCC] hover:text-white text-sm font-medium transition-colors py-2">Cancel</button>
        </div>
      </div>
    );
  }

  // ─── ORDERS + MODAL + TOAST ─────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto p-4 mt-2 relative">
      {/* Toast */}
      {state === 'toast' && (
        <div className="fixed bottom-6 right-6 bg-[#232F3E] text-white px-5 py-4 rounded shadow-2xl flex items-center z-50 max-w-sm border border-[#37475A]">
          <CheckCircle className="text-[#FF9900] w-6 h-6 mr-3 shrink-0" />
          <div>
            <div className="font-bold text-sm">Item listed on Local Micro-Warehouse</div>
            <div className="text-xs text-[#CCC] mt-0.5">
              {gradeResult ? `${gradeResult.health_card.condition} · ${gradeResult.green_credits} Credits earned.` : 'Hold item in its box for 24 hours.'}
            </div>
          </div>
        </div>
      )}

      <h1 className="text-xl font-medium text-[#0F1111] mb-4">Your Orders</h1>
      <div className="space-y-3">
        {/* Running Shoes order */}
        <div className="bg-white border border-[#D5D9D9] rounded overflow-hidden">
          <div className="bg-[#F0F2F2] border-b border-[#D5D9D9] px-4 py-2 flex items-center justify-between text-xs text-[#565959]">
            <div className="flex gap-6">
              <div><span className="uppercase text-[10px] block font-medium">Order placed</span>Yesterday</div>
              <div><span className="uppercase text-[10px] block font-medium">Total</span>₹4,000.00</div>
            </div>
            <div className="text-[10px]">ORDER# 402-7291058-3148621</div>
          </div>
          <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-[#F7F8F8] rounded flex items-center justify-center mr-4 border border-[#D5D9D9]"><Package className="text-[#D5D9D9]" /></div>
              <div>
                <a href="#" className="text-[#007185] hover:text-[#C7511F] hover:underline font-medium text-sm">Pro Running Shoes - Size 9</a>
                <p className="text-xs text-[#007600] font-medium mt-0.5">Delivered Yesterday</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 w-full md:w-auto">
              <button className="bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] rounded-full px-4 py-1.5 text-sm font-medium text-[#0F1111] transition-colors w-full md:w-auto">Track package</button>
              <button onClick={handleReturnClick} disabled={state === 'toast'}
                className="bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] rounded-full px-4 py-1.5 text-sm font-medium text-[#0F1111] transition-colors w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
                Return or replace items
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── INTERCEPT MODAL ─── */}
      {state === 'modal' && gradeResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D5D9D9] rounded-lg shadow-2xl max-w-md w-full relative overflow-hidden">
            <button onClick={() => setState('orders')} className="absolute top-3 right-3 text-[#565959] hover:text-[#0F1111]"><X className="w-5 h-5" /></button>

            {/* Green header */}
            <div className="bg-[#232F3E] p-6 text-center">
              <div className="inline-flex items-center justify-center bg-[#007600]/20 p-3 rounded-full mb-3">
                <Leaf className="w-8 h-8 text-[#FF9900]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Hold it right there! 🌱</h2>
              <p className="text-[#CCC] text-sm">Your item has a greener path than a warehouse return.</p>
            </div>

            {/* Health card */}
            <div className="p-5">
              <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded p-4 mb-4">
                <div className="text-[10px] text-[#565959] uppercase font-semibold mb-2">AI Health Card</div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-[#565959]">Condition</span><span className="font-bold text-[#007600]">{gradeResult.health_card.condition}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#565959]">Routing</span><span className="font-medium text-[#0F1111]">{gradeResult.routing_decision.replace(/_/g, ' ')}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-[#565959]">Carbon Saved</span><span className="font-medium text-[#007600]">{gradeResult.carbon_saved_estimate}</span></div>
                </div>
              </div>

              <p className="text-[#0F1111] text-sm mb-4 leading-relaxed">
                A local buyer might want this. Hold this item for 24 hours, earn{' '}
                <span className="font-bold text-[#007600]">{gradeResult.green_credits} Green Credits 🪙</span>, and save{' '}
                <span className="font-bold">{gradeResult.carbon_saved_estimate}</span> of CO₂.
              </p>

              {/* Two choices — per IMPLEMENTATION.md Smart Return Flow */}
              <div className="space-y-2">
                <button onClick={handleAcceptEcoOffer}
                  className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-3 rounded-full border border-[#FCD200] transition-colors flex justify-center items-center gap-2 text-sm">
                  <Recycle className="w-4 h-4 text-[#007600]" /> Accept Eco-Offer · List on P2P
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setState('orders')}
                  className="w-full bg-[#F0F2F2] hover:bg-[#E3E6E6] text-[#0F1111] font-medium py-3 rounded-full border border-[#D5D9D9] transition-colors text-sm">
                  No thanks, standard return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
