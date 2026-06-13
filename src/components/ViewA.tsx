import { useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, CheckCircle, Package, Leaf, ChevronRight, Coins, Recycle, ArrowLeft } from 'lucide-react';

type Step = 'orders' | 'details' | 'scanner' | 'result';

export function ViewA() {
  const [step, setStep] = useState<Step>('orders');

  // ─── SCANNER ────────────────────────────────────────────────────────────────
  if (step === 'scanner') {
    return (
      <div className="min-h-[calc(100vh-108px)] bg-[#0F1111] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#007600]/10 blur-3xl rounded-full w-[500px] h-[500px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="z-10 bg-white/5 border border-white/10 p-6 rounded-lg shadow-2xl flex flex-col items-center max-w-md w-full">
          <div className="text-[#FF9900] font-bold flex items-center mb-4 text-lg">
            <Camera className="w-6 h-6 mr-2" /> AI Condition Scanner
          </div>
          <p className="text-[#CCC] text-sm text-center mb-4">Hold your item up to the camera. Our AI will assess its condition for trade-in.</p>

          <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-dashed border-[#FF9900]/40 mb-5 bg-black/50">
            <Webcam audio={false} className="w-full h-full object-cover opacity-80" mirrored />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-48 h-48 border border-white/30 flex flex-col justify-between">
                <div className="flex justify-between w-full"><div className="w-4 h-4 border-t-2 border-l-2 border-[#FF9900]" /><div className="w-4 h-4 border-t-2 border-r-2 border-[#FF9900]" /></div>
                <div className="flex justify-between w-full"><div className="w-4 h-4 border-b-2 border-l-2 border-[#FF9900]" /><div className="w-4 h-4 border-b-2 border-r-2 border-[#FF9900]" /></div>
              </div>
            </div>
            <div className="absolute bottom-3 left-0 w-full text-center text-sm font-medium text-white/80 animate-pulse">Align item in the frame</div>
          </div>

          <button onClick={() => setStep('result')}
            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-3 px-6 rounded-full transition-colors flex justify-center items-center border border-[#FCD200]">
            <Camera className="w-5 h-5 mr-2" /> Scan Item
          </button>
          <button onClick={() => setStep('details')} className="w-full mt-2 text-[#CCC] hover:text-white text-sm font-medium transition-colors py-2">Cancel</button>
        </div>
      </div>
    );
  }

  // ─── RESULT (Health Card / Timeline) ────────────────────────────────────────
  if (step === 'result') {
    return (
      <div className="max-w-2xl mx-auto p-4 mt-4">
        <div className="bg-white rounded border border-[#D5D9D9] overflow-hidden shadow-sm">
          {/* Success header */}
          <div className="bg-[#E7F4E4] border-b border-[#C3E6C0] p-5 flex items-start justify-between">
            <div>
              <div className="flex items-center text-[#007600] font-bold mb-1"><CheckCircle className="w-5 h-5 mr-2" />Scan Successful</div>
              <h2 className="text-xl font-bold text-[#0F1111]">Product Health Card</h2>
              <p className="text-[#565959] text-sm mt-0.5">Baby Monitor (2025 Model)</p>
            </div>
            <div className="bg-white border border-[#D5D9D9] p-3 rounded text-center shadow-sm">
              <div className="text-[10px] text-[#565959] font-semibold uppercase">Condition</div>
              <div className="text-lg font-bold text-[#007600]">Like New</div>
            </div>
          </div>

          {/* AI Results */}
          <div className="p-5 border-b border-[#D5D9D9]">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-[#F7F8F8] rounded border border-[#D5D9D9]">
                <div className="text-[#FF9900] text-2xl font-bold">1,200</div>
                <div className="text-[10px] text-[#565959] mt-0.5 font-medium">Green Credits 🪙</div>
              </div>
              <div className="text-center p-3 bg-[#F7F8F8] rounded border border-[#D5D9D9]">
                <div className="text-[#007600] text-2xl font-bold">12.5kg</div>
                <div className="text-[10px] text-[#565959] mt-0.5 font-medium">CO₂ Saved</div>
              </div>
              <div className="text-center p-3 bg-[#F7F8F8] rounded border border-[#D5D9D9]">
                <div className="text-[#007185] text-2xl font-bold">Local</div>
                <div className="text-[10px] text-[#565959] mt-0.5 font-medium">Resale Route</div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-6">
            <h3 className="font-bold text-[#0F1111] mb-5 text-base">Your EcoBridge Impact</h3>
            <div className="relative pl-8 border-l-2 border-[#007600]/30 space-y-6">
              {[
                { icon: <Coins className="w-4 h-4 text-white" />, bg: 'bg-[#FF9900]', title: '1,200 Green Credits Awarded', desc: 'Added to your Amazon wallet instantly.' },
                { icon: <Package className="w-4 h-4 text-white" />, bg: 'bg-[#007185]', title: 'Local Index Updated', desc: 'Item is now visible to buyers within 5km.' },
                { icon: <Leaf className="w-4 h-4 text-white" />, bg: 'bg-[#007600]', title: '12.5kg CO₂ Saved', desc: 'By bypassing the central warehouse network.' },
                { icon: <Recycle className="w-4 h-4 text-white" />, bg: 'bg-[#232F3E]', title: 'Second Life Activated', desc: 'Your item gets a second life in the local marketplace.' },
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className={`absolute -left-[41px] ${item.bg} rounded-full p-1.5 border-4 border-white`}>{item.icon}</div>
                  <h4 className="font-bold text-[#0F1111]">{item.title}</h4>
                  <p className="text-[#565959] text-sm">{item.desc}</p>
                </div>
              ))}
            </div>

            <button onClick={() => setStep('orders')}
              className="mt-8 w-full bg-[#F0F2F2] hover:bg-[#E3E6E6] text-[#0F1111] font-medium py-2.5 rounded-full border border-[#D5D9D9] transition-colors text-sm">
              Return to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── PRODUCT DETAILS ────────────────────────────────────────────────────────
  if (step === 'details') {
    return (
      <div className="max-w-4xl mx-auto p-4 mt-2">
        <button onClick={() => setStep('orders')} className="text-[#007185] hover:text-[#C7511F] text-sm hover:underline mb-3 inline-flex items-center"><ArrowLeft className="w-3.5 h-3.5 mr-1" />Back to orders</button>
        <div className="bg-white border border-[#D5D9D9] rounded flex flex-col md:flex-row gap-6 p-6">
          {/* Image */}
          <div className="w-full md:w-1/3 aspect-square bg-[#F7F8F8] rounded flex items-center justify-center border border-[#D5D9D9]">
            <Package className="w-24 h-24 text-[#D5D9D9]" />
          </div>
          {/* Info */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              <h1 className="text-xl font-medium text-[#0F1111]">Baby Monitor (2025 Model)</h1>
              <p className="text-[#565959] text-sm mt-1">Purchased on March 12, 2025</p>
              <div className="mt-4 space-y-2.5">
                <div className="flex justify-between border-b border-[#F0F2F2] pb-2"><span className="text-[#565959] text-sm">Brand</span><span className="font-medium text-[#0F1111] text-sm">SafeBaby</span></div>
                <div className="flex justify-between border-b border-[#F0F2F2] pb-2"><span className="text-[#565959] text-sm">Original Price</span><span className="font-medium text-[#0F1111] text-sm">₹4,500</span></div>
                <div className="flex justify-between border-b border-[#F0F2F2] pb-2"><span className="text-[#565959] text-sm">Status</span><span className="font-medium text-[#007600] text-sm">Delivered</span></div>
              </div>
            </div>

            {/* EcoBridge CTA */}
            <div className="mt-6 bg-[#FFFBF0] border border-[#FFD814]/50 rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-[#007600] font-bold text-sm"><Leaf className="w-4 h-4 mr-1.5" />EcoBridge Trade-In</div>
                <span className="text-lg font-bold text-[#0F1111]">Est. ₹1,200</span>
              </div>
              <p className="text-[#565959] text-xs mb-3">Get an instant valuation using our AI scanner and earn Green Credits.</p>
              <button onClick={() => setStep('scanner')}
                className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-2.5 rounded-full transition-colors flex justify-center items-center border border-[#FCD200] text-sm">
                <Camera className="w-4 h-4 mr-2" /> Verify Condition with AI
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── ORDERS LIST ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto p-4 mt-2">
      <h1 className="text-xl font-medium text-[#0F1111] mb-4">Your Orders</h1>
      <div className="space-y-3">
        {/* Order 1 — Laptop Charger (plain) */}
        <div className="bg-white border border-[#D5D9D9] rounded overflow-hidden">
          <div className="bg-[#F0F2F2] border-b border-[#D5D9D9] px-4 py-2 flex items-center justify-between text-xs text-[#565959]">
            <div className="flex gap-6">
              <div><span className="uppercase text-[10px] block text-[#565959] font-medium">Order placed</span>4 January 2026</div>
              <div><span className="uppercase text-[10px] block text-[#565959] font-medium">Total</span>₹1,299.00</div>
            </div>
            <div className="text-[#565959] text-[10px]">ORDER# 171-2847593-9201245</div>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-[#F7F8F8] rounded flex items-center justify-center mr-4 border border-[#D5D9D9]"><Package className="text-[#D5D9D9]" /></div>
              <div>
                <a href="#" className="text-[#007185] hover:text-[#C7511F] hover:underline font-medium text-sm">Laptop Charger 65W USB-C</a>
                <p className="text-xs text-[#007600] font-medium mt-0.5">Delivered Jan 4</p>
              </div>
            </div>
            <button className="bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] rounded-full px-4 py-1.5 text-sm font-medium text-[#0F1111] transition-colors">Buy it again</button>
          </div>
        </div>

        {/* Order 2 — Baby Monitor (EcoBridge highlight) */}
        <div className="bg-white border-2 border-[#007600] rounded overflow-hidden relative">
          <div className="bg-[#E7F4E4] border-b border-[#C3E6C0] px-4 py-2 flex items-center justify-between">
            <div className="flex gap-6 text-xs text-[#565959]">
              <div><span className="uppercase text-[10px] block text-[#565959] font-medium">Order placed</span>12 March 2025</div>
              <div><span className="uppercase text-[10px] block text-[#565959] font-medium">Total</span>₹4,500.00</div>
            </div>
            <div className="flex items-center gap-1 bg-[#007600] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              <Leaf className="w-3 h-3" /> EcoBridge Eligible
            </div>
          </div>
          <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-[#F7F8F8] rounded flex items-center justify-center mr-4 border border-[#D5D9D9]"><Package className="text-[#D5D9D9]" /></div>
              <div>
                <a href="#" className="text-[#007185] hover:text-[#C7511F] hover:underline font-medium text-sm">Baby Monitor (2025 Model)</a>
                <p className="text-xs text-[#007600] font-medium mt-0.5">Delivered Mar 12, 2025</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <button onClick={() => setStep('details')}
                className="bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] rounded-full px-4 py-2 text-sm font-bold flex items-center justify-center gap-1.5 transition-colors">
                <Leaf className="w-4 h-4 text-[#007600]" /> EcoBridge Trade-In · Est. ₹1,200
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button className="bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] rounded-full px-4 py-2 text-sm font-medium text-[#0F1111] transition-colors hidden sm:block">Buy it again</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
