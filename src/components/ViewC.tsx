import { useState, useEffect } from 'react';
import { Package, Leaf, CheckCircle, ShieldCheck, ShoppingCart, Loader2, X } from 'lucide-react';
import { type Product } from './StorefrontPage';

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
    if (cart.length > 0) {
      Promise.resolve().then(() => setHadItems(true));
    }
  }, [cart.length]);

  useEffect(() => {
    // If the cart already has items from the Storefront, they are already eco-items.
    // Skip the intercept API call entirely.
    if (cart.length > 0) {
      Promise.resolve().then(() => setState('checkout')); // Already eco
      return;
    }

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
  }, [cart.length]);

  const handleAccept = () => { 
    if (onPlaceOrder) {
      onPlaceOrder([{
        id: 'mock_eco_shoes',
        name: matchedItem?.product_name || 'Pro Running Shoes - Size 9',
        price: matchedItem ? matchedItem.price : 2500,
        originalPrice: 4000,
        icon: '👟',
        freeDelivery: true,
        prime: true,
        co2Saved: matchedItem ? matchedItem.carbon_saved_estimate : '8.2kg',
        greenCoins: 50
      } as any]);
    }
    setAcceptedEco(true);
    setShowModal(false); 
    setState('success'); 
  };

  const handleCheckout = () => {
    if (cart.length > 0) {
      if (onPlaceOrder) {
        onPlaceOrder(cart);
      }
      setState('success');
    } else {
      if (onPlaceOrder) {
        onPlaceOrder([{
          id: 'mock_shoes',
          name: matchedItem?.product_name || 'Pro Running Shoes - Size 9',
          price: isEco ? (matchedItem ? matchedItem.price : 2500) : 4000,
          originalPrice: 4000,
          icon: '👟',
          freeDelivery: true,
          prime: true,
          co2Saved: isEco ? (matchedItem ? matchedItem.carbon_saved_estimate : '8.2kg') : '0kg',
          greenCoins: isEco ? 50 : 25
        } as any]);
      }
      setState('success');
    }
  };
  
  // Calculate dynamic totals if cart has items
  const isDynamicCart = cart.length > 0;
  const dynamicSubtotal = cart.reduce((sum, item) => sum + item.price, 0);
  const dynamicCoins = cart.reduce((sum, item) => sum + item.greenCoins, 0);

  const isEco = isDynamicCart || acceptedEco;
  const matchedItem = interceptData?.item;
  const ecoPrice = matchedItem ? `₹${matchedItem.price.toLocaleString('en-IN')}.00` : '₹2,500.00';
  const discountPercent = interceptData?.eco_discount_percent ?? 37;

  const isEmpty = (hadItems && cart.length === 0) || mockDeleted;

  // ─── SUCCESS (Order Placed) ──────────────────────────────────────────────────
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
              Thank you for your purchase. Your items have been added to your orders ledger.
            </p>
          </div>

          <div className="bg-[#FFFBF0] border border-[#FFD814]/40 rounded p-4 text-left space-y-1.5 text-xs text-gray-800">
            <div className="flex justify-between font-bold">
              <span>Status:</span>
              <span className="text-[#007600]">Preparing for Dispatch</span>
            </div>
            <div className="flex justify-between">
              <span>Estimated Delivery:</span>
              <span>Standard Shipping (3-5 days)</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => {
                if (onViewOrders) {
                  onViewOrders();
                }
              }}
              className="flex-1 bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 font-bold py-2 rounded-full text-xs border border-[#FCD200] transition-colors cursor-pointer"
            >
              Go to Your Orders
            </button>
            <button 
              onClick={() => {
                if (onClose) {
                  onClose();
                }
              }}
              className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-2 rounded-full text-xs transition-colors cursor-pointer"
            >
              Continue Shopping
            </button>
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
          <p className="text-[#0F1111] font-medium text-sm">Checking local inventory…</p>
          <p className="text-[#565959] text-xs mt-1">Finding eco-friendly options near you</p>
        </div>
      </div>
    );
  }

  // ─── CHECKOUT (Amazon Cart) ─────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div className="pb-10">
        <div className="max-w-5xl mx-auto p-4 mt-2">
          <h1 className="text-2xl font-medium text-[#0F1111] mb-4">Shopping Cart</h1>
          <div className="bg-white border border-[#D5D9D9] rounded p-10 text-center shadow-sm">
            <ShoppingCart className="w-16 h-16 text-[#D5D9D9] mx-auto mb-4" />
            <h2 className="text-lg font-bold text-[#0F1111] mb-2">Your Amazon Cart is empty.</h2>
            <p className="text-sm text-[#565959] mb-6">Explore second-life and renewed deals on the storefront to earn Green Coins!</p>
          </div>
        </div>
      </div>
    );
  }

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
              {isDynamicCart ? (
                cart.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-5 items-start">
                    {/* Image */}
                    <div className="w-32 h-32 bg-[#F7F8F8] rounded flex items-center justify-center shrink-0 relative border border-[#D5D9D9] text-6xl">
                      {item.icon}
                      <div className="absolute inset-0 border-2 border-[#007600] rounded flex items-start justify-end p-1">
                        <div className="bg-[#007600] rounded-full p-0.5"><Leaf className="w-3 h-3 text-white" /></div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="grow">
                      <h2 className="text-base font-medium text-[#0F1111] mb-0.5 flex items-center flex-wrap gap-2">
                        {item.name}
                        <span className="bg-[#E7F4E4] border border-[#C3E6C0] text-[#007600] text-[10px] font-bold px-2 py-0.5 rounded-sm flex items-center"><Leaf className="w-3 h-3 mr-0.5" />EcoBridge Certified</span>
                      </h2>
                      <p className="text-xs text-[#007600] font-medium mb-0.5">In Stock</p>
                      <p className="text-xs text-[#565959] mb-3">Eligible for FREE Shipping</p>
                      <div className="flex items-center text-xs text-[#565959] gap-2">
                        <span className="bg-[#F0F2F2] border border-[#D5D9D9] px-2 py-0.5 rounded">Qty: 1</span>
                        <span>|</span>
                        <button 
                          onClick={() => onRemoveFromCart && onRemoveFromCart(item.id)}
                          className="text-[#007185] hover:text-[#C7511F] hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-1 bg-[#FFFBF0] border border-[#FFD814]/40 rounded-sm px-2 py-1 w-fit">
                        <Leaf className="w-3 h-3 text-[#007600]" />
                        <span className="text-[10px] text-[#0F1111]">You saved <span className="font-bold text-[#007600]">{item.co2Saved}</span> with EcoBridge</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-[#565959] line-through text-sm">₹{item.originalPrice.toLocaleString('en-IN')}</div>
                      <div className="text-lg font-bold text-[#007600] mt-0.5">₹{item.price.toLocaleString('en-IN')}</div>
                    </div>
                  </div>
                ))
              ) : (
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
                      <button 
                        onClick={() => setMockDeleted(true)}
                        className="text-[#007185] hover:text-[#C7511F] hover:underline"
                      >
                        Delete
                      </button>
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
              )}
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
                Subtotal ({isDynamicCart ? cart.length : 1} item{cart.length !== 1 && isDynamicCart ? 's' : ''}): <span className="font-bold">{isDynamicCart ? `₹${dynamicSubtotal.toLocaleString('en-IN')}.00` : (isEco ? ecoPrice : '₹4,000.00')}</span>
              </h3>
              <button 
                onClick={handleCheckout}
                className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-medium py-2 rounded-full text-sm border border-[#FCD200] transition-colors"
              >
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
                This purchase earns you <span className="font-bold text-[#007600]">{isDynamicCart ? dynamicCoins : 25} 🪙</span> Green Coins. Redeem for ₹1 off per 10 coins.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ─── INTERCEPT MODAL ─── */}
      {showModal && interceptData?.match_found && matchedItem && (
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
