import { useState } from 'react';
import { Package, Leaf, CheckCircle, Recycle, Truck, X, ArrowRight } from 'lucide-react';

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

/**
 * ViewB — Returner/Orders View (Priya)
 * Shows past orders with return option. On return click, shows EcoBridge intercept popup.
 */
export function ViewB({ orders = [], onEarnCoins }: { orders?: OrderItem[]; onEarnCoins?: (amount: number) => void }) {
  const [showPopup, setShowPopup] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [returnedItems, setReturnedItems] = useState<Record<string, 'ecobridge' | 'normal'>>({});

  const handleReturnClick = (order: OrderItem) => {
    setSelectedOrder(order);
    setShowPopup(true);
  };

  const handleEcoBridgeReturn = () => {
    if (selectedOrder) {
      setReturnedItems(prev => ({ ...prev, [selectedOrder.id]: 'ecobridge' }));
      if (onEarnCoins) onEarnCoins(50);
    }
    setShowPopup(false);
  };

  const handleNormalReturn = () => {
    if (selectedOrder) {
      setReturnedItems(prev => ({ ...prev, [selectedOrder.id]: 'normal' }));
      if (onEarnCoins) onEarnCoins(20);
    }
    setShowPopup(false);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 mt-2 relative">
      <h1 className="text-xl font-medium text-[#0F1111] mb-4">Returns & Orders</h1>
      
      {orders.length === 0 ? (
        <div className="bg-white border border-[#D5D9D9] rounded p-10 text-center shadow-sm">
          <Package className="w-16 h-16 text-[#D5D9D9] mx-auto mb-4" />
          <h2 className="text-lg font-bold text-[#0F1111] mb-2">No orders yet</h2>
          <p className="text-sm text-[#565959]">Purchase items from the storefront to see them here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const returnStatus = returnedItems[order.id];
            return (
              <div key={order.id} className={`bg-white rounded overflow-hidden ${returnStatus ? 'border border-[#D5D9D9] opacity-80' : 'border border-[#D5D9D9]'}`}>
                <div className="bg-[#F0F2F2] border-b border-[#D5D9D9] px-4 py-2 flex items-center justify-between text-xs text-[#565959]">
                  <div className="flex gap-6">
                    <div><span className="uppercase text-[10px] block font-medium">Order placed</span>{order.datePlaced}</div>
                    <div><span className="uppercase text-[10px] block font-medium">Total</span>₹{order.price.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="text-[10px]">ORDER# {order.orderId}</div>
                </div>
                <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-[#F7F8F8] rounded flex items-center justify-center mr-4 border border-[#D5D9D9] text-3xl">
                      {order.icon || <Package className="text-[#D5D9D9] w-8 h-8" />}
                    </div>
                    <div>
                      <span className="text-[#007185] font-medium text-sm">{order.name}</span>
                      <p className={`text-xs font-medium mt-0.5 ${returnStatus ? (returnStatus === 'ecobridge' ? 'text-[#007600]' : 'text-[#565959]') : 'text-[#007600]'}`}>
                        {returnStatus === 'ecobridge' 
                          ? '✓ Listed on EcoBridge — Earning Green Coins!' 
                          : returnStatus === 'normal' 
                            ? '↩ Standard return initiated' 
                            : order.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    {!returnStatus && (
                      <>
                        <button className="bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] rounded-full px-4 py-1.5 text-sm font-medium text-[#0F1111] transition-colors w-full md:w-auto flex items-center justify-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" /> Track package
                        </button>
                        <button 
                          onClick={() => handleReturnClick(order)}
                          className="bg-[#F0F2F2] hover:bg-[#E3E6E6] border border-[#D5D9D9] rounded-full px-4 py-1.5 text-sm font-medium text-[#0F1111] transition-colors w-full md:w-auto flex items-center justify-center gap-1.5">
                          <Recycle className="w-3.5 h-3.5 text-[#007600]" /> Return item
                        </button>
                      </>
                    )}
                    {returnStatus === 'ecobridge' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E7F4E4] border border-[#C3E6C0] rounded-full text-xs text-[#007600] font-bold">
                        <Leaf className="w-3.5 h-3.5" /> On EcoBridge P2P
                      </div>
                    )}
                    {returnStatus === 'normal' && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0F2F2] border border-[#D5D9D9] rounded-full text-xs text-[#565959] font-medium">
                        <CheckCircle className="w-3.5 h-3.5" /> Return processing
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ EcoBridge Intercept Popup ═══ */}
      {showPopup && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="bg-white border border-[#D5D9D9] rounded-lg shadow-2xl max-w-md w-full relative z-10 overflow-hidden">
            <button onClick={() => setShowPopup(false)} className="absolute top-3 right-3 text-[#565959] hover:text-[#0F1111] z-20">
              <X className="w-5 h-5" />
            </button>

            {/* Green Header */}
            <div className="bg-[#232F3E] p-6 text-center">
              <div className="inline-flex items-center justify-center bg-[#007600]/20 p-3 rounded-full mb-3">
                <Leaf className="w-8 h-8 text-[#FF9900]" />
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Wait! 🌱</h2>
              <p className="text-[#CCC] text-sm leading-relaxed">
                Instead of returning to warehouse, would you like to list this on <span className="text-[#FF9900] font-bold">EcoBridge</span>?
              </p>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Item being returned */}
              <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded p-3 flex items-center gap-3">
                <div className="w-12 h-12 bg-white border border-[#D5D9D9] rounded flex items-center justify-center text-2xl shrink-0">
                  {selectedOrder.icon || '📦'}
                </div>
                <div>
                  <div className="text-sm font-medium text-[#0F1111] line-clamp-1">{selectedOrder.name}</div>
                  <div className="text-xs text-[#565959]">₹{selectedOrder.price.toLocaleString('en-IN')}</div>
                </div>
              </div>

              {/* Comparison */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#E7F4E4] border border-[#C3E6C0] rounded p-3 text-center">
                  <div className="text-[9px] text-[#565959] uppercase font-semibold mb-1">EcoBridge</div>
                  <div className="text-sm font-bold text-[#007600]">+50 🪙</div>
                  <div className="text-[9px] text-[#565959] mt-0.5">Green Coins</div>
                </div>
                <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded p-3 text-center">
                  <div className="text-[9px] text-[#565959] uppercase font-semibold mb-1">Normal Return</div>
                  <div className="text-sm font-bold text-[#565959]">+20 🪙</div>
                  <div className="text-[9px] text-[#565959] mt-0.5">Green Coins</div>
                </div>
              </div>

              <p className="text-xs text-[#565959] leading-relaxed">
                A neighbor in your area might need this exact item. By listing on EcoBridge, you earn <span className="font-bold text-[#007600]">2.5x more Green Coins</span>, 
                save <span className="font-bold">8.2kg CO₂</span>, and give your product a second life — all without long-haul shipping!
              </p>

              {/* CTAs */}
              <div className="space-y-2 pt-1">
                <button 
                  onClick={handleEcoBridgeReturn}
                  className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold py-3 rounded-full border border-[#FCD200] transition-colors flex justify-center items-center gap-2 text-sm">
                  <Leaf className="w-4 h-4 text-[#007600]" /> List on EcoBridge · Earn +50 🪙
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={handleNormalReturn}
                  className="w-full bg-[#F0F2F2] hover:bg-[#E3E6E6] text-[#0F1111] font-medium py-3 rounded-full border border-[#D5D9D9] transition-colors text-sm">
                  Proceed with standard return
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
