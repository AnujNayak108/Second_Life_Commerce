import { useState, useEffect } from 'react';
import { Package, Leaf, CheckCircle, ShieldCheck, ShoppingCart, Loader2, X, MapPin, Users } from 'lucide-react';
import { type Product } from './StorefrontPage';

type State = 'loading' | 'checkout' | 'success';

interface MatchedItem {
  item_id: string;
  product_name: string;
  condition: string;
  price: number;
  seller_id: string;
  seller_pin?: string;
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

// Buyer's PIN code — in a real app this comes from the user's delivery address
const BUYER_PIN_CODE = '110001';

export function ViewC({ 
  cart = [], 
  onRemoveFromCart,
  onPlaceOrder,
  onViewOrders,
  onClose
}: { 
  cart?: Product[]; 
  onRemoveFromCart?: (id: string) => void;
  onPlaceOrder?: (items: Product[]) => void;
  onViewOrders?: () => void;
  onClose?: () => void;
}) {
  const [state, setState] = useState<State>('loading');
  const [showModal, setShowModal] = useState(false);
  const [acceptedEco, setAcceptedEco] = useState(false);
  const [interceptData, setInterceptData] = useState<InterceptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hadItems, setHadItems] = useState(cart.length > 0);
  const [mockDeleted, setMockDeleted] = useState(false);

  useEffect(() => {
    if (cart.length > 0) setHadItems(true);
  }, [cart.length]);

  // ═══ Intercept: Query DynamoDB for matching approved P2P items ═══
  useEffect(() => {
    if (cart.length === 0) {
      setState('checkout');
      return;
    }

    let cancelled = false;
    async function checkLocalInventory() {
      try {
        const cartItemName = cart[0]?.name || '';
        const response = await fetch(`${API_URL}/api/intercept`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ zip_code: BUYER_PIN_CODE, cart_item_name: cartItemName }),
        });
        if (!response.ok || cancelled) { setState('checkout'); return; }
        const data: InterceptResult = await response.json();
        if (cancelled) return;
        setInterceptData(data);
        setState('checkout');
        if (data.match_found && data.item) {
          setTimeout(() => { if (!cancelled) setShowModal(true); }, 600);
        }
      } catch {
        if (!cancelled) setState('checkout');
      }
    }
    checkLocalInventory();
    return () => { cancelled = true; };
  }, [cart.length]);

  const handleAcceptEco = () => { 
    if (onPlaceOrder && interceptData?.item) {
      const item = interceptData.item;
      const ecoPurchasePrice = Math.round((cart[0]?.price || 4000) * 0.50);
      onPlaceOrder([{
        id: item.item_id,
        name: item.product_name || cart[0]?.name + ' (EcoBridge)',
        price: ecoPurchasePrice,
        originalPrice: cart[0]?.price || 4000,
        icon: cart[0]?.icon || '♻️',
        freeDelivery: true,
        prime: true,
        co2Saved: item.carbon_saved_estimate,
        greenCoins: Math.min(200, Math.max(30, Math.round(ecoPurchasePrice * 0.05)))
      } as any]);
    }
    setAcceptedEco(true);
    setShowModal(false); 
    setState('success'); 
  };

  const handleCheckout = () => {
    if (cart.length > 0 && onPlaceOrder) {
      // Purchase propagation happens in App.tsx (handlePlaceOrder) via React state
      // No backend call needed — items flow to Rahul/Priya's orders automatically

      onPlaceOrder(cart);
      setState('success');
    }
  };
  
  const isDynamicCart = cart.length > 0;
  const dynamicSubtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const dynamicCoins = cart.reduce((sum, item) => sum + (item.greenCoins || 0), 0);
  const isEco = acceptedEco;
  const matchedItem = interceptData?.item;
  // Show eco price as 50% of the cart item's actual price (not the Lambda's estimate)
  const cartPrice = cart[0]?.price || 4000;
  const ecoPrice = matchedItem ? `₹${Math.round(cartPrice * 0.50).toLocaleString('en-IN')}` : '';
  const discountPercent = 50; // Fixed 50% discount for EcoBridge items
  const isEmpty = (hadItems && cart.length === 0) || mockDeleted;

  // ─── SUCCESS ────────────────────────────────────────────────────────────────
  if (state === 'success') {
    return (
      <div className="pb-10">
        <div className="max-w-xl mx-auto p-6 mt-8 bg-white border border-[#D5D9D9] rounded shadow-sm text-center space-y-5">
          <div className="w-16 h-16 bg-[#E7F4E4] border border-[#C3E6C0] text-[#007600] rounded-full flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order Placed Successfully!</h1>
            <p className="text-sm text-[#565959] mt-1.5">
              {acceptedEco 
                ? 'You chose the eco-friendly local option! The seller in your PIN code will be notified.'
                : 'Thank you for your purchase. Item will appear in Seller/Returner dashboard for circular economy flow.'}
            </p>
          </div>
          {acceptedEco && matchedItem && (
            <div className="bg-[#E7F4E4] border border-[#C3E6C0] rounded p-4 text-left space-y-1.5 text-xs text-[#0F1111]">
              <div className="flex justify-between font-bold"><span>Local Seller:</span><span className="text-[#007600]">{matchedItem.seller_id}</span></div>
              <div className="flex justify-between"><span>PIN Code Match:</span><span className="font-bold">{matchedItem.seller_pin || BUYER_PIN_CODE}</span></div>
              <div className="flex justify-between"><span>Carbon Saved:</span><span className="text-[#007600] font-bold">{matchedItem.carbon_saved_estimate}</span></div>
            </div>
          )}
          <div className="bg-[#FFFBF0] border border-[#FFD814]/40 rounded p-4 text-left space-y-1.5 text-xs text-gray-800">
            <div className="flex justify-between font-bold"><span>Status:</span><span className="text-[#007600]">Preparing for Dispatch</span></div>
            <div className="flex justify-between"><span>Delivery:</span><span>{acceptedEco ? 'Local pickup within 5km' : 'Standard Shipping (3-5 days)'}</span></div>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button onClick={() => onViewOrders && onViewOrders()} className="flex-1 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 font-bold py-2 rounded-full text-xs border border-[#FCD200] transition-colors cursor-pointer">Go to Your Orders</button>
            <button onClick={() => onClose && onClose()} className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 rounded-full text-xs transition-colors cursor-pointer">Continue Shopping</button>
          </div>
        </div>
      </div>
    );
  }

  // ─── LOADING ────────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="min-h-[calc(100vh-108px)] bg-[#EAEDED] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#FF9900] animate-spin mx-auto mb-4" />
          <p className="text-[#0F1111] font-medium text-sm">Checking local EcoBridge inventory…</p>
          <p className="text-[#565959] text-xs mt-1">Searching PIN {BUYER_PIN_CODE} for eco-friendly alternatives</p>
        </div>
      </div>
    );
  }

  // ─── EMPTY CART ─────────────────────────────────────────────────────────────
  if (isEmpty || (!isDynamicCart && !acceptedEco)) {
    return (
      <div className="pb-10">
        <div className="max-w-5xl mx-auto p-4 mt-2">
          <h1 className="text-2xl font-medium text-[#0F1111] mb-4">Shopping Cart</h1>
          <div className="bg-white border border-[#D5D9D9] rounded p-10 text-center shadow-sm">
            <ShoppingCart className="w-16 h-16 text-[#D5D9D9] mx-auto mb-4" />
            <h2 className="text-lg font-bold text-[#0F1111] mb-2">Your Cart is empty.</h2>
            <p className="text-sm text-[#565959] mb-6">Add items from the storefront to start shopping!</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── CHECKOUT ───────────────────────────────────────────────────────────────
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

            <div className="flex flex-col gap-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex flex-col sm:flex-row gap-5 items-start">
                  <div className="w-28 h-28 bg-[#F7F8F8] rounded flex items-center justify-center shrink-0 border border-[#D5D9D9] text-5xl">
                    {item.icon}
                  </div>
                  <div className="grow">
                    <h2 className="text-sm font-medium text-[#0F1111] mb-1 leading-snug">{item.name}</h2>
                    <p className="text-xs text-[#007600] font-medium mb-0.5">In Stock</p>
                    {item.prime && <p className="text-xs text-[#565959] mb-2">Eligible for FREE Prime Shipping</p>}
                    <div className="flex items-center text-xs text-[#565959] gap-2">
                      <span className="bg-[#F0F2F2] border border-[#D5D9D9] px-2 py-0.5 rounded">Qty: 1</span>
                      <span>|</span>
                      <button onClick={() => onRemoveFromCart && onRemoveFromCart(item.id)} className="text-[#007185] hover:text-[#C7511F] hover:underline">Delete</button>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {item.originalPrice > item.price && (
                      <div className="text-sm text-[#565959] line-through">₹{item.originalPrice.toLocaleString('en-IN')}</div>
                    )}
                    <div className="text-lg font-bold text-[#0F1111]">₹{item.price.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subtotal */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white border border-[#D5D9D9] rounded p-5">
              <h3 className="text-base text-[#0F1111] mb-3">
                Subtotal ({cart.length} item{cart.length > 1 ? 's' : ''}): <span className="font-bold">₹{dynamicSubtotal.toLocaleString('en-IN')}</span>
              </h3>

              {/* Delivery PIN display */}
              <div className="mb-3 bg-[#F7F8F8] border border-[#D5D9D9] rounded p-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#007185] shrink-0" />
                <span className="text-xs text-[#565959]">Deliver to PIN: <span className="font-bold text-[#0F1111]">{BUYER_PIN_CODE}</span></span>
              </div>

              <button onClick={handleCheckout}
                className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-medium py-2 rounded-full text-sm border border-[#FCD200] transition-colors">
                Proceed to Buy
              </button>
            </div>

            <div className="bg-white border border-[#D5D9D9] rounded p-4 mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-4 h-4 text-[#007600]" />
                <span className="text-sm font-bold text-[#0F1111]">Green Coins</span>
              </div>
              <p className="text-xs text-[#565959]">
                This purchase earns you <span className="font-bold text-[#007600]">{dynamicCoins || 25} 🪙</span> Green Coins.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Phase 4: EcoBridge Intercept Modal ═══ */}
      {showModal && interceptData?.match_found && matchedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="bg-white border border-[#D5D9D9] rounded-lg shadow-2xl max-w-lg w-full relative z-10 overflow-hidden">
            <button onClick={() => setShowModal(false)} className="absolute top-3 right-3 text-[#565959] hover:text-[#0F1111] z-20"><X className="w-5 h-5" /></button>

            {/* Header */}
            <div className="bg-[#232F3E] p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="bg-[#007600]/20 p-2.5 rounded-lg"><Leaf className="w-7 h-7 text-[#FF9900]" /></div>
                <div>
                  <h2 className="text-xl font-bold text-white">Wait! Local Match Found 🌿</h2>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-[#FF9900]" />
                    <span className="text-[#FF9900] text-xs font-bold">Same PIN Code: {BUYER_PIN_CODE}</span>
                  </div>
                </div>
              </div>
              <p className="text-[#CCC] text-sm leading-relaxed">
                {interceptData.intercept_message}
              </p>
            </div>

            <div className="p-5">
              {/* Seller info card */}
              <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded p-4 mb-5">
                <div className="flex items-center justify-between border-b border-[#D5D9D9] pb-2 mb-3">
                  <div className="flex items-center text-[#007600] font-medium text-sm"><ShieldCheck className="w-4 h-4 mr-1.5" />Verified Local Seller</div>
                  <span className="text-[10px] bg-[#E7F4E4] border border-[#C3E6C0] text-[#007600] font-semibold px-2 py-0.5 rounded-sm">{matchedItem.condition}</span>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center justify-between">
                    <span className="text-[#565959]">Product</span>
                    <span className="text-[#0F1111] font-medium text-xs max-w-[200px] truncate">{matchedItem.product_name}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-[#565959]">Seller</span>
                    <span className="text-[#0F1111] font-medium flex items-center gap-1"><Users className="w-3 h-3" />{matchedItem.seller_id}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-[#565959]">Location</span>
                    <span className="text-[#007185] font-medium flex items-center gap-1"><MapPin className="w-3 h-3" />PIN {matchedItem.seller_pin || BUYER_PIN_CODE}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-[#565959]">Carbon Savings</span>
                    <span className="text-[#007600] font-bold">{matchedItem.carbon_saved_estimate}</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <span className="text-[#565959]">AI Condition</span>
                    <span className="text-[#0F1111] font-medium">Passed ✓</span>
                  </li>
                </ul>
              </div>

              {/* Price comparison */}
              <div className="flex items-end justify-between mb-5">
                <div>
                  <div className="text-[#565959] text-xs mb-0.5">Eco-Local Price</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[#007600]">{ecoPrice}</span>
                    <span className="text-sm text-[#565959] line-through">₹{(cart[0]?.price || 4000).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="bg-[#CC0C39] text-white text-sm font-bold px-3 py-1 rounded">-{discountPercent}%</div>
              </div>

              {/* CTA */}
              <button onClick={handleAcceptEco}
                className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-3 rounded-full border border-[#FCD200] transition-colors flex justify-center items-center gap-2 text-sm">
                <Leaf className="w-4 h-4 text-[#007600]" /> Buy from Local Seller — Save {matchedItem.carbon_saved_estimate}
              </button>
              <button onClick={() => setShowModal(false)}
                className="w-full mt-2 text-[#565959] hover:text-[#0F1111] text-sm font-medium transition-colors py-2 text-center">
                No thanks, buy new at ₹{(cart[0]?.price || 4000).toLocaleString('en-IN')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
