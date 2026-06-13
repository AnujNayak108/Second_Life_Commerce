import { useState, useEffect } from 'react';
import { 
  ShoppingCart, Leaf, Star, Recycle, Coins, CheckCircle, 
  ArrowRight, ShieldCheck, HeartPulse, Sparkles, Flame 
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  grade: 'A' | 'B' | 'C';
  rating: number;
  reviews: number;
  type: 'renewed' | 'p2p';
  seller?: string;
  aiScore?: number;
  greenCoins: number;
  co2Saved: string;
  icon: string;
  freeDelivery: boolean;
  prime: boolean;
}

interface StorefrontPageProps {
  onGoToCart?: () => void;
  onAddToCart?: (product: Product) => void;
  onNavigateToSecondLife?: () => void;
}

// ─── 12 Realistic Products Mock Data ──────────────────────────────────────────

const HOMEPAGE_PRODUCTS: Product[] = [
  { id: 'h1', name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones (Renewed)', price: 21999, originalPrice: 29999, grade: 'A', rating: 4.8, reviews: 3421, type: 'renewed', greenCoins: 150, co2Saved: '5.2 kg', icon: '🎧', freeDelivery: true, prime: true },
  { id: 'h2', name: 'Apple Watch Series 9 GPS + Cellular 45mm Aluminum (Renewed)', price: 34999, originalPrice: 45900, grade: 'A', rating: 4.7, reviews: 1284, type: 'renewed', greenCoins: 250, co2Saved: '18.4 kg', icon: '⌚', freeDelivery: true, prime: true },
  { id: 'h3', name: 'Samsung Odyssey G5 27" Curved QHD Gaming Monitor', price: 18500, originalPrice: 28000, grade: 'B', rating: 4.6, reviews: 543, type: 'renewed', greenCoins: 320, co2Saved: '42.1 kg', icon: '🖥️', freeDelivery: true, prime: false },
  { id: 'h4', name: 'Logitech MX Master 3S Wireless Performance Mouse', price: 5800, originalPrice: 9499, grade: 'A', rating: 4.5, reviews: 876, type: 'renewed', greenCoins: 80, co2Saved: '1.2 kg', icon: '🖱️', freeDelivery: true, prime: true },
  { id: 'h5', name: 'Apple iPad Air 10.9-inch M1 Chip 64GB Space Grey (Renewed)', price: 39999, originalPrice: 59900, grade: 'A', rating: 4.8, reviews: 921, type: 'renewed', greenCoins: 400, co2Saved: '31.7 kg', icon: '📱', freeDelivery: true, prime: true },
  { id: 'h6', name: 'Amazon Kindle Paperwhite 16GB 6.8" display with adjustable warm light', price: 11999, originalPrice: 14999, grade: 'A', rating: 4.9, reviews: 2314, type: 'renewed', greenCoins: 50, co2Saved: '0.6 kg', icon: '📚', freeDelivery: true, prime: true },
  { id: 'h7', name: 'Sony Alpha 7 IV Full-frame Mirrorless Interchangeable Lens Camera', price: 189999, originalPrice: 242990, grade: 'A', rating: 4.8, reviews: 342, type: 'renewed', greenCoins: 1200, co2Saved: '65.2 kg', icon: '📷', freeDelivery: true, prime: true },
  { id: 'h8', name: 'Bose QuietComfort Ultra Wireless Noise Cancelling Earbuds', price: 18999, originalPrice: 25900, grade: 'B', rating: 4.6, reviews: 1104, type: 'renewed', greenCoins: 180, co2Saved: '3.1 kg', icon: '🎵', freeDelivery: true, prime: true },
  { id: 'h9', name: 'GoPro HERO12 Black Waterproof Action Camera with HDR Video', price: 32999, originalPrice: 45000, grade: 'A', rating: 4.5, reviews: 438, type: 'renewed', greenCoins: 280, co2Saved: '4.8 kg', icon: '📹', freeDelivery: true, prime: false },
  { id: 'h10', name: 'Apple AirPods Pro (2nd Generation) with MagSafe USB-C (Renewed)', price: 14999, originalPrice: 24900, grade: 'A', rating: 4.7, reviews: 4518, type: 'renewed', greenCoins: 120, co2Saved: '2.5 kg', icon: '🔈', freeDelivery: true, prime: true },
  { id: 'h11', name: 'Dell XPS 13 Plus 9320 Laptop Intel Core i7 16GB 512GB SSD', price: 114999, originalPrice: 159990, grade: 'B', rating: 4.4, reviews: 192, type: 'renewed', greenCoins: 650, co2Saved: '54.2 kg', icon: '💻', freeDelivery: true, prime: true },
  { id: 'h12', name: 'Philips Digital Air Fryer HD9252 4.1L 1400W Multi-Cooker', price: 4200, originalPrice: 9995, grade: 'C', rating: 4.6, reviews: 2104, type: 'renewed', greenCoins: 60, co2Saved: '3.6 kg', icon: '🍳', freeDelivery: true, prime: true }
];

// ─── Featured Refurbished Deals Data ──────────────────────────────────────────

const REFURBISHED_DEALS = [
  { id: 'ref1', name: 'Sony WH-1000XM4 Noise Cancelling Headphones', originalPrice: 24990, refurbPrice: 13999, condition: 'Certified Refurbished', badgeColor: 'bg-emerald-500', savings: 44, icon: '🎧' },
  { id: 'ref2', name: 'Apple Watch Series 7 GPS 41mm Smartwatch', originalPrice: 41900, refurbPrice: 18500, condition: 'Excellent', badgeColor: 'bg-cyan-500', savings: 55, icon: '⌚' },
  { id: 'ref3', name: 'Logitech G915 TKL Wireless Mechanical Keyboard', originalPrice: 22995, refurbPrice: 12800, condition: 'Good', badgeColor: 'bg-amber-500', savings: 44, icon: '⌨️' },
  { id: 'ref4', name: 'Kindle Paperwhite (10th Gen) 8GB Waterproof', originalPrice: 12999, refurbPrice: 6500, condition: 'Certified Refurbished', badgeColor: 'bg-emerald-500', savings: 50, icon: '📚' }
];

// ─── Star Rating Sub-component ────────────────────────────────────────────────

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-[#FF9900] fill-[#FF9900]' : 'text-gray-300 fill-gray-300'}`} />
        ))}
      </div>
      <span className="text-[#007185] text-xs font-semibold">{reviews.toLocaleString()}</span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StorefrontPage({ onGoToCart, onAddToCart, onNavigateToSecondLife }: StorefrontPageProps) {
  const [toast, setToast] = useState<string | null>(null);
  
  // States for animated counters
  const [secondLifeCount, setSecondLifeCount] = useState(0);
  const [co2SavedCount, setCo2SavedCount] = useState(0);
  const [wasteCount, setWasteCount] = useState(0);
  const [creditsCount, setCreditsCount] = useState(0);

  // Counter animations on mount
  useEffect(() => {
    const duration = 1500; // ms
    const steps = 40;
    const intervalTime = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setSecondLifeCount(Math.floor((220 / steps) * step));
      setCo2SavedCount(Math.floor((250 / steps) * step));
      setWasteCount(Math.floor((120 / steps) * step));
      setCreditsCount(Math.floor((5400 / steps) * step));

      if (step >= steps) {
        setSecondLifeCount(220);
        setCo2SavedCount(250);
        setWasteCount(120);
        setCreditsCount(5400);
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const handleAdd = (product: Product) => {
    if (onAddToCart) {
      onAddToCart(product);
      setToast(`"${product.name.slice(0, 30)}…" added to cart · +${product.greenCoins} Green Coins!`);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleBuyNow = (product: Product) => {
    if (onAddToCart) {
      onAddToCart(product);
    }
    if (onGoToCart) {
      onGoToCart();
    }
  };

  return (
    <div className="bg-[#EAEDED] pb-12">
      
      {/* ─── HERO BANNER ─── */}
      <section 
        className="relative overflow-hidden w-full min-h-[360px] flex items-center px-6 md:px-12 py-10"
        style={{
          background: 'linear-gradient(90deg, #131921 0%, #232F3E 45%, rgba(35, 47, 62, 0.45) 80%), url("/eco_shopping_banner.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'right center'
        }}
      >
        <div className="max-w-xl text-white space-y-5 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/25 border border-emerald-400/40 rounded-full px-3.5 py-1 text-xs">
            <Recycle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-300 font-bold tracking-wider uppercase text-[10px]">Certified Circular Ecosystem</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Shop Smarter.<br />
            <span className="text-[#FF9900]">Waste Less.</span>
          </h1>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            Discover new and certified refurbished products while helping build a sustainable future.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <a 
              href="#products-section"
              className="bg-[#FF9900] hover:bg-[#E08800] text-gray-900 font-bold px-8 py-2.5 rounded-full text-xs shadow-sm hover:shadow transition-all text-center block w-full sm:w-auto cursor-pointer"
            >
              Shop Now
            </a>
            <button 
              onClick={onNavigateToSecondLife}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-8 py-2.5 rounded-full text-xs border border-white/20 transition-all text-center block w-full sm:w-auto cursor-pointer"
            >
              Explore Amazon SecondLife
            </button>
          </div>
        </div>
        
        {/* Subtle bottom curve fading into content */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[#EAEDED] to-transparent pointer-events-none" />
      </section>

      {/* ─── VALUE STATS ROW (Dynamic Counter Strip) ─── */}
      <section className="max-w-7xl mx-auto px-4 -mt-8 relative z-20 mb-6">
        <div className="bg-white dark:bg-[#1A222D] rounded-lg border border-gray-200 dark:border-gray-800 p-5 shadow grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
          
          <div className="space-y-1">
            <div className="text-2xl font-black text-[#FF9900] tracking-tight">{secondLifeCount}</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Products Given Second Life</div>
          </div>
          
          <div className="space-y-1 border-l border-gray-200 dark:border-gray-800">
            <div className="text-2xl font-black text-emerald-600 tracking-tight">{co2SavedCount} kg</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">CO₂ Saved</div>
          </div>
          
          <div className="space-y-1 border-l border-gray-200 dark:border-gray-800">
            <div className="text-2xl font-black text-cyan-600 tracking-tight">{wasteCount} kg</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Waste Diverted</div>
          </div>

          <div className="space-y-1 border-l border-gray-200 dark:border-gray-800">
            <div className="text-2xl font-black text-yellow-600 tracking-tight">{creditsCount} 🪙</div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Eco Credits Issued</div>
          </div>

        </div>
      </section>

      {/* ─── 12 PRODUCT GRID SECTION ─── */}
      <section id="products-section" className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-white rounded border border-[#D5D9D9] p-5">
          <div className="flex items-center gap-2 mb-5 border-b border-gray-100 pb-3">
            <Flame className="w-5 h-5 text-[#FF9900]" />
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Today's Deals & Renewed Offers</h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {HOMEPAGE_PRODUCTS.map((product) => {
              const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
              return (
                <div 
                  key={product.id}
                  className="bg-white border border-[#D5D9D9] rounded flex flex-col h-full hover:shadow-lg transition-all duration-300 relative group overflow-hidden"
                >
                  {/* Discount tag badge */}
                  <span className="absolute top-2.5 left-2.5 bg-[#CC0C39] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-sm z-10">
                    -{discount}%
                  </span>

                  {/* Product graphic area */}
                  <div className="h-48 bg-[#F7F8F8] border-b border-gray-150 flex items-center justify-center text-7xl select-none group-hover:scale-105 transition-transform duration-300">
                    {product.icon}
                  </div>

                  {/* Product details info card */}
                  <div className="p-4 flex flex-col grow justify-between space-y-3">
                    <div className="space-y-1.5">
                      <a href="#" className="font-semibold text-sm text-[#0F1111] hover:text-[#C7511F] hover:underline line-clamp-2 leading-snug">
                        {product.name}
                      </a>
                      
                      <StarRating rating={product.rating} reviews={product.reviews} />

                      {/* Prime and Renewed Badge markers */}
                      <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                        {product.prime && (
                          <span className="bg-[#00A8E0] text-white text-[9px] font-black px-1.5 py-0.2 rounded-sm italic">prime</span>
                        )}
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-sm border ${
                          product.grade === 'A' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                          product.grade === 'B' ? 'bg-cyan-50 text-cyan-800 border-cyan-200' :
                          'bg-yellow-50 text-yellow-800 border-yellow-200'
                        }`}>
                          Grade {product.grade}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="flex items-baseline">
                          <span className="text-xs text-gray-500 font-bold mr-0.5">₹</span>
                          <span className="text-xl font-bold tracking-tight">{product.price.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-xs text-gray-400">M.R.P: <span className="line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span></div>
                      </div>

                      {/* Carbon footprint nudge */}
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded px-2.5 py-1 text-[10px] flex items-center gap-1.5 font-semibold">
                        <Leaf className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Saves {product.co2Saved} CO₂ · +{product.greenCoins} 🪙</span>
                      </div>

                      {/* Action buttons */}
                      <div className="space-y-1.5 pt-2">
                        <button
                          onClick={() => handleAdd(product)}
                          className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 border border-[#FCD200] font-bold py-1.5 rounded-full text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                        </button>
                        <button
                          onClick={() => handleBuyNow(product)}
                          className="w-full bg-[#FFA41C] hover:bg-[#FA8900] text-gray-900 border border-[#FF8F00] font-bold py-1.5 rounded-full text-xs transition-colors shadow-sm"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── SPECIAL GREEN SUSTAINABILITY SECTION ─── */}
      <section id="second-life-section" className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-[#E7F4E4] border border-[#C3E6C0] rounded-lg p-6 md:p-8 space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <div className="inline-flex items-center justify-center p-2.5 bg-emerald-500/10 rounded-full text-emerald-600 mb-1">
              <Recycle className="w-7 h-7" />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#007600] tracking-tight">Amazon SecondLife</h2>
            <p className="text-sm text-emerald-950 font-medium">
              Give products a meaningful second life. Avoid landfill wastage by shopping AI-graded products, listing returned products on P2P hubs, and earning wallet incentives.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3">
            
            {/* AI Verified */}
            <div className="bg-white rounded-lg p-5 border border-emerald-200/50 flex flex-col justify-between shadow-sm">
              <div className="space-y-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-600 w-fit rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">AI Verified Refurbished</h3>
                <p className="text-xs text-gray-500 leading-normal">
                  Products returned by customers are visually inspected, functional graded by computer vision diagnostic rigs, and certified for active resale.
                </p>
              </div>
            </div>

            {/* Earn Eco Credits */}
            <div className="bg-white rounded-lg p-5 border border-emerald-200/50 flex flex-col justify-between shadow-sm">
              <div className="space-y-2.5">
                <div className="p-2 bg-yellow-500/10 text-yellow-600 w-fit rounded-lg">
                  <Coins className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Earn Eco Credits</h3>
                <p className="text-xs text-gray-500 leading-normal">
                  Earn wallet Green Coins for returning items, trading in active devices, or purchasing certified eco items. Redeem credits for cart discounts.
                </p>
              </div>
            </div>

            {/* Reduce Waste */}
            <div className="bg-white rounded-lg p-5 border border-emerald-200/50 flex flex-col justify-between shadow-sm">
              <div className="space-y-2.5">
                <div className="p-2 bg-cyan-500/10 text-cyan-600 w-fit rounded-lg">
                  <HeartPulse className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">Reduce Waste</h3>
                <p className="text-xs text-gray-500 leading-normal">
                  By routing items to peer-to-peer markets or local micro-refurbish facilities, we reduce circular logistical transport footprints and prevent landfills.
                </p>
              </div>
            </div>

          </div>

          <div className="flex justify-center pt-3">
            <button 
              onClick={onNavigateToSecondLife}
              className="bg-[#007600] hover:bg-[#005e00] text-white font-bold px-8 py-2.5 rounded-full text-xs shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Visit SecondLife Marketplace <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── HORIZONTAL SCROLL DEALS SECTION ─── */}
      <section className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-white rounded border border-[#D5D9D9] p-5">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Featured Refurbished Super Deals</h2>
          </div>

          {/* Horizonal scroll wrapper */}
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin select-none">
            {REFURBISHED_DEALS.map((deal) => {
              return (
                <div 
                  key={deal.id}
                  className="bg-white border border-[#D5D9D9] rounded p-4 flex gap-4 min-w-[280px] sm:min-w-[320px] max-w-sm hover:border-[#FF9900]/40 transition-colors cursor-pointer shrink-0"
                >
                  {/* Image wrapper */}
                  <div className="w-20 h-20 bg-gray-50 rounded border border-gray-150 flex items-center justify-center text-4xl shrink-0">
                    {deal.icon}
                  </div>

                  {/* Info details */}
                  <div className="space-y-1.5 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-gray-900 line-clamp-1 leading-snug">{deal.name}</h4>
                      <span className={`text-[9px] text-white font-extrabold px-1.5 py-0.2 rounded ${deal.badgeColor} block w-fit mt-1`}>
                        {deal.condition}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-extrabold text-[#B12704]">₹{deal.refurbPrice.toLocaleString('en-IN')}</span>
                        <span className="text-[10px] text-gray-400 line-through">₹{deal.originalPrice.toLocaleString('en-IN')}</span>
                      </div>
                      <span className="text-[10px] text-[#007600] font-semibold">Save {deal.savings}% (Avoid landfill)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── TOAST NOTIFICATION ─── */}
      {toast && (
        <div className="fixed bottom-6 right-4 z-50 bg-[#131921] text-white px-4 py-3.5 rounded shadow-2xl flex items-center gap-2 max-w-sm border border-gray-800 animate-slide-in">
          <CheckCircle className="w-5 h-5 text-[#FF9900] shrink-0" />
          <span className="text-xs font-semibold">{toast}</span>
        </div>
      )}

    </div>
  );
}
