import { useState, useEffect } from 'react';
import { Package, Leaf, CheckCircle, ShieldCheck, ShoppingCart, Loader2, X } from 'lucide-react';

type State = 'loading' | 'checkout' | 'success';

interface MatchedItem {
  item_id: string;
  product_name: string;
  condition: string;
  price: number;
  seller_id: string;
  carbon_saved_estimate: string;
}

interface InterceptResult {
  match_found: boolean;
  item?: MatchedItem;
  intercept_message?: string;
  eco_discount_percent?: number;
  message?: string;
}

const API_URL = import.meta.env.VITE_ECOBRIDGE_API_URL || 'https://4w990xpwkg.execute-api.ap-south-1.amazonaws.com/prod';

export function ViewC() {
  const [state, setState] = useState<State>('loading');
  const [showModal, setShowModal] = useState(false);
  const [interceptData, setInterceptData] = useState<InterceptResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function checkLocalInventory() {
      try {
        const response = await fetch(`${API_URL}/intercept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zip_code: '110001', cart_item_name: 'Running Shoes' }),
        });
        const data: InterceptResult = await response.json();
        if (cancelled) return;
        if (!response.ok) { setError('Could not check local inventory.'); setState('checkout'); return; }
        setInterceptData(data);
        setState('checkout');
        if (data.match_found) { setTimeout(() => { if (!cancelled) setShowModal(true); }, 400); }
      } catch (err) {
        if (cancelled) return;
        setError(`API call failed: ${err instanceof Error ? err.message : 'Unknown'}`);
        setState('checkout');
      }
    }
    checkLocalInventory();
    return () => { cancelled = true; };
  }, []);

  const handleAccept = () => { setShowModal(false); setState('success'); };
  const isEco = state === 'success';
  const matchedItem = interceptData?.item;
  const ecoPrice = matchedItem ? `₹${matchedItem.price.toLocaleString('en-IN')}.00` : '₹2,500.00';
  const discountPercent = interceptData?.eco_discount_percent ?? 37;

  // ─── LOADING ────────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="min-h-[calc(100vh-108px)] bg-[#EAEDED] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#FF9900] animate-spin mx-auto mb-4" />
          <p className="text-[#0F1111] font-medium text-sm">Checking local inventory…</p>
          <p className="text-[#565959] text-xs mt-1">Finding eco-friendly options near you</p>
        </div>
      </div>
    );
  }

  // ─── CHECKOUT (Amazon Cart) ─────────────────────────────────────────────────
  return (
    <div className="pb-10">
      <div className="max-w-5xl mx-auto p-4 mt-2">
        <h1 className="text-2xl font-medium text-[#0F1111] mb-4">Shopping Cart</h1>

        {error && <div className="mb-3 bg-[#FFFBF0] border border-[#FFD814]/40 rounded p-2.5 text-[#7D5B00] text-xs">{error}</div>}

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Cart items */}
          <div className="grow bg-white border border-[#D5D9D9] rounded p-5">
            <div className="flex justify-between items-end border-b border-[#D5D9D9] pb-2 mb-5">
              <span className="font-medium text-lg text-[#0F1111]">Items</span>
              <span className="text-[#565959] text-sm">Price</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Image */}
              <div className="w-32 h-32 bg-[#F7F8F8] rounded flex items-center justify-center shrink-0 relative border border-[#D5D9D9]">
                <Package className="w-12 h-12 text-[#D5D9D9]" />
                {isEco && (
                  <div className="absolute inset-0 border-2 border-[#007600] rounded flex items-start justify-end p-1">
                    <div className="bg-[#007600] rounded-full p-0.5"><Leaf className="w-3 h-3 text-white" /></div>
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="grow">
                <h2 className="text-base font-medium text-[#0F1111] mb-0.5 flex items-center flex-wrap gap-2">
                  {matchedItem?.product_name || 'Pro Running Shoes - Size 9'}
                  {isEco && <span className="bg-[#E7F4E4] border border-[#C3E6C0] text-[#007600] text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center"><Leaf className="w-3 h-3 mr-0.5" />EcoBridge Certified</span>}
                </h2>
                <p className="text-xs text-[#007600] font-medium mb-0.5">In Stock</p>
                <p className="text-xs text-[#565959] mb-3">Eligible for FREE Shipping</p>
                <div className="flex items-center text-xs text-[#565959] gap-2">
                  <span className="bg-[#F0F2F2] border border-[#D5D9D9] px-2 py-0.5 rounded">Qty: 1</span>
                  <span>|</span>
                  <button className="text-[#007185] hover:text-[#C7511F] hover:underline">Delete</button>
                  <span>|</span>
                  <button className="text-[#007185] hover:text-[#C7511F] hover:underline">Save for later</button>
                </div>
                {isEco && (
                  <div className="mt-3 flex items-center gap-1 bg-[#FFFBF0] border border-[#FFD814]/40 rounded-sm px-2 py-1 w-fit">
                    <Leaf className="w-3 h-3 text-[#007600]" />
                    <span className="text-[10px] text-[#0F1111]">You saved <span className="font-bold text-[#007600]">{matchedItem?.carbon_saved_estimate || '8.2kg CO2'}</span> with EcoBridge</span>
                  </div>
                )}
              </div>

              {/* Price */}
              <div className="text-right shrink-0">
                <div className={`text-lg font-bold ${isEco ? 'text-[#565959] line-through text-sm' : 'text-[#0F1111]'}`}>₹4,000.00</div>
                {isEco && <div className="text-lg font-bold text-[#007600] mt-0.5">{ecoPrice}</div>}
              </div>
            </div>
          </div>

          {/* Subtotal sidebar */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white border border-[#D5D9D9] rounded p-5">
              {isEco && (
                <div className="mb-3 bg-[#E7F4E4] border border-[#C3E6C0] rounded p-2.5 flex items-center text-[#007600]">
                  <CheckCircle className="w-4 h-4 mr-2 shrink-0" />
                  <span className="text-xs font-semibold">Eco-Bundle discount applied!</span>
                </div>
              )}
              <h3 className="text-base text-[#0F1111] mb-3">
                Subtotal (1 item): <span className="font-bold">{isEco ? ecoPrice : '₹4,000.00'}</span>
              </h3>
              <button className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-medium py-2 rounded-full text-sm border border-[#FCD200] transition-colors">
                Proceed to Buy
              </button>
            </div>

            {/* Green Coins info */}
            <div className="bg-white border border-[#D5D9D9] rounded p-4 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-4 h-4 text-[#007600]" />
                <span className="text-sm font-bold text-[#0F1111]">Green Coins</span>
              </div>
              <p className="text-xs text-[#565959]">
                This purchase earns you <span className="font-bold text-[#007600]">25 🪙</span> Green Coins. Redeem for ₹1 off per 10 coins.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── INTERCEPT MODAL ─── */}
      {showModal && state !== 'success' && interceptData?.match_found && matchedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="bg-white border border-[#D5D9D9] rounded-lg shadow-2xl max-w-lg w-full relative z-10 overflow-hidden">
            <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 text-[#565959] hover:text-[#0F1111] z-20"><X className="w-5 h-5" /></button>

            {/* Header */}
            <div className="bg-[#232F3E] p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#007600]/20 p-2 rounded-lg"><Leaf className="w-6 h-6 text-[#FF9900]" /></div>
                <h2 className="text-xl font-bold text-white">Hyper-Local Match! 🌿</h2>
              </div>
              <p className="text-[#CCC] text-sm leading-relaxed">
                {interceptData.intercept_message || (
                  <>A certified <span className="text-[#FF9900] font-bold">{matchedItem.condition}</span> version is available locally! Save <span className="font-bold text-white">{matchedItem.carbon_saved_estimate}</span> by buying from your neighbor.</>
                )}
              </p>
            </div>

            <div className="p-5">
              {/* Health card */}
              <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded p-4 mb-5">
                <div className="flex items-center justify-between border-b border-[#D5D9D9] pb-2 mb-3">
                  <div className="flex items-center text-[#007600] font-medium text-sm"><ShieldCheck className="w-4 h-4 mr-1.5" />Amazon Verified Health Card</div>
                  <span className="text-[10px] bg-[#E7F4E4] border border-[#C3E6C0] text-[#007600] font-semibold px-2 py-0.5 rounded-sm">{matchedItem.condition}</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between"><span className="text-[#565959]">AI Condition Scan</span><span className="text-[#0F1111] font-medium">Passed ✓</span></li>
                  <li className="flex items-center justify-between"><span className="text-[#565959]">Carbon Savings</span><span className="text-[#007600] font-medium">{matchedItem.carbon_saved_estimate}</span></li>
                  <li className="flex items-center justify-between"><span className="text-[#565959]">Seller</span><span className="text-[#0F1111] font-medium">{matchedItem.seller_id}</span></li>
                </ul>
              </div>

              {/* Price */}
              <div className="flex items-end justify-between mb-5">
                <div>
                  <div className="text-[#565959] text-xs mb-0.5">Eco-Bundle Price</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#007600]">{ecoPrice}</span>
                    <span className="text-sm text-[#565959] line-through">₹4,000</span>
                  </div>
                </div>
                <div className="bg-[#CC0C39] text-white text-sm font-bold px-3 py-1 rounded">Save {discountPercent}%</div>
              </div>

              {/* CTA */}
              <button onClick={handleAccept}
                className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-3 rounded-full border border-[#FCD200] transition-colors flex justify-center items-center gap-2 text-sm">
                <ShoppingCart className="w-4 h-4" /> Accept Eco-Bundle
              </button>
              <button onClick={() => setShowModal(false)}
                className="w-full mt-2 text-[#565959] hover:text-[#0F1111] text-sm font-medium transition-colors py-2 text-center">
                No thanks, keep new item at ₹4,000
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
