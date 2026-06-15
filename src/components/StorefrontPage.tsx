import { useState } from 'react';
import { P2PProductDetail } from './P2PProductDetail';
import {
  ShoppingCart,
  Leaf,
  Star,
  ArrowRight,
  Recycle,
  Users,
  Coins,
  CheckCircle,
  Truck,
  RotateCcw,
  ThumbsUp,
  Package,
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
  galleryImages?: Record<string, string>;
  condition?: string;
  labels?: string[];
  confidence?: number;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const RENEWED_PRODUCTS: Product[] = [
  { id: 'r1', name: 'Apple iPhone 14 Pro 256GB Space Black – Amazon Renewed', price: 54999, originalPrice: 89999, grade: 'A', rating: 4.7, reviews: 1284, type: 'renewed', greenCoins: 250, co2Saved: '18.4 kg', icon: '📱', freeDelivery: true, prime: true },
  { id: 'r2', name: 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones – Renewed', price: 16999, originalPrice: 29990, grade: 'A', rating: 4.8, reviews: 3421, type: 'renewed', greenCoins: 150, co2Saved: '5.2 kg', icon: '🎧', freeDelivery: true, prime: true },
  { id: 'r3', name: 'Dell XPS 15 9530 Laptop Intel i7 16GB 512GB SSD – Grade B', price: 74999, originalPrice: 125000, grade: 'B', rating: 4.5, reviews: 876, type: 'renewed', greenCoins: 400, co2Saved: '31.7 kg', icon: '💻', freeDelivery: true, prime: true },
  { id: 'r4', name: 'Samsung 55" QLED 4K Smart TV QN90B – Certified Renewed', price: 44999, originalPrice: 79990, grade: 'A', rating: 4.6, reviews: 543, type: 'renewed', greenCoins: 320, co2Saved: '42.1 kg', icon: '📺', freeDelivery: true, prime: false },
];

const P2P_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Nike Air Max 270 Running Shoes – Size 9 – Lightly Used', price: 3200, originalPrice: 7995, grade: 'B', rating: 4.3, reviews: 12, type: 'p2p', seller: 'Priya M.', aiScore: 87, greenCoins: 50, co2Saved: '2.1 kg', icon: '👟', freeDelivery: false, prime: false },
  { id: 'p2', name: 'Atomic Habits by James Clear – Paperback – Read Once', price: 180, originalPrice: 599, grade: 'A', rating: 4.9, reviews: 7, type: 'p2p', seller: 'Rahul K.', aiScore: 95, greenCoins: 20, co2Saved: '0.3 kg', icon: '📚', freeDelivery: false, prime: false },
  { id: 'p3', name: 'Fossil Gen 6 Smartwatch 44mm – Barely Used – With Box', price: 8500, originalPrice: 22995, grade: 'B', rating: 4.4, reviews: 5, type: 'p2p', seller: 'Ananya S.', aiScore: 82, greenCoins: 75, co2Saved: '4.8 kg', icon: '⌚', freeDelivery: true, prime: false },
  { id: 'p4', name: 'Philips Digital Air Fryer HD9252 – 1400W – 4.1L – Used', price: 4200, originalPrice: 9995, grade: 'A', rating: 4.6, reviews: 9, type: 'p2p', seller: 'Vikram D.', aiScore: 91, greenCoins: 60, co2Saved: '3.6 kg', icon: '🍳', freeDelivery: true, prime: false },
];

const CATEGORIES = [
  { icon: '📱', label: 'Electronics' }, { icon: '👕', label: 'Fashion' },
  { icon: '🏠', label: 'Home & Kitchen' }, { icon: '📚', label: 'Books' },
  { icon: '🧴', label: 'Beauty' }, { icon: '🏋️', label: 'Sports' },
  { icon: '🚗', label: 'Automotive' }, { icon: '🧸', label: 'Toys' },
];

// ─── Star Rating ──────────────────────────────────────────────────────────────

function StarRating({ rating, reviews }: { rating: number; reviews: number }) {
  return (
    <div className="flex items-center gap-1 mt-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(rating) ? 'text-[#FF9900] fill-[#FF9900]' : 'text-gray-300 fill-gray-300'}`} />
        ))}
      </div>
      <span className="text-[#007185] text-xs">{reviews.toLocaleString()}</span>
    </div>
  );
}

// ─── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({ product, onAdd, onBuyNow, onClick }: { product: Product; onAdd: (id: string) => void; onBuyNow: (id: string) => void; onClick: (id: string) => void }) {
  const [added, setAdded] = useState(false);
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

  const handleAdd = (e: React.MouseEvent) => { e.stopPropagation(); setAdded(true); onAdd(product.id); setTimeout(() => setAdded(false), 2000); };

  return (
    <div onClick={() => onClick(product.id)} className="bg-white border border-[#D5D9D9] hover:shadow-md transition-shadow flex flex-col h-full relative group cursor-pointer">
      <div className="absolute top-2 left-2 z-10">
        <span className="bg-[#CC0C39] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">-{discount}%</span>
      </div>
      <div className="h-44 bg-white flex items-center justify-center p-4 border-b border-gray-100 relative overflow-hidden">
        {product.galleryImages?.front ? (
          <img src={product.galleryImages.front} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
        ) : (
          <span className="text-7xl group-hover:scale-105 transition-transform">{product.icon}</span>
        )}
        {product.prime && (
          <span className="absolute top-2 right-2 bg-[#00A8E0] text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm italic">prime</span>
        )}
      </div>
      <div className="p-3 flex flex-col flex-1">
        {/* AI Score badge for P2P items */}
        {product.type === 'p2p' && product.aiScore && (
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${product.grade === 'A' ? 'bg-emerald-100 text-emerald-700' : product.grade === 'B' ? 'bg-cyan-100 text-cyan-700' : 'bg-amber-100 text-amber-700'}`}>
              Grade {product.grade}
            </span>
            <span className="text-[9px] text-[#565959] font-medium">AI: {product.aiScore}/100</span>
            {product.condition && <span className="text-[9px] bg-[#F0F2F2] px-1.5 py-0.5 rounded text-[#565959]">{product.condition}</span>}
          </div>
        )}
        <a href="#" className="text-[#0F1111] text-sm leading-snug hover:text-[#C7511F] hover:underline line-clamp-2 mb-1 font-medium">{product.name}</a>
        <StarRating rating={product.rating} reviews={product.reviews} />
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {product.type === 'renewed' ? (
            <span className="inline-flex items-center gap-0.5 bg-[#F0F2F2] border border-[#D5D9D9] text-[10px] font-semibold px-1.5 py-0.5 rounded-sm">
              <Recycle className="w-2.5 h-2.5 text-[#007600]" />Amazon Renewed
            </span>
          ) : (
            <span className="inline-flex items-center gap-0.5 bg-[#F0F2F2] border border-[#D5D9D9] text-[10px] font-semibold px-1.5 py-0.5 rounded-sm">
              <Users className="w-2.5 h-2.5 text-[#007185]" />{product.seller}
            </span>
          )}
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-sm border ${product.grade === 'A' ? 'bg-[#E7F4E4] border-[#C3E6C0] text-[#007600]' : product.grade === 'B' ? 'bg-[#EAF4FB] border-[#C5DCF0] text-[#005276]' : 'bg-[#FFF8E7] border-[#F5D68A] text-[#7D5B00]'}`}>
            Grade {product.grade}
          </span>
          {product.aiScore && <span className="text-[10px] text-[#565959]">AI: <span className="font-semibold text-[#0F1111]">{product.aiScore}/100</span></span>}
        </div>
        <div className="mt-2.5">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xs text-[#565959]">₹</span>
            <span className="text-2xl font-medium text-[#0F1111]">{product.price.toLocaleString('en-IN')}</span>
          </div>
          <div className="text-xs text-[#565959] mt-0.5">M.R.P.: <span className="line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span></div>
        </div>
        <div className="mt-2 text-xs">
          {product.freeDelivery ? <span className="text-[#007600] font-medium">FREE Delivery</span> : <span className="text-[#565959]">+ ₹40 delivery</span>}
        </div>
        <div className="mt-2 flex items-center gap-1 bg-[#FFFBF0] border border-[#FFD814]/40 rounded-sm px-2 py-1">
          <Leaf className="w-3 h-3 text-[#007600]" />
          <span className="text-[10px] text-[#0F1111]">Earn <span className="font-bold text-[#007600]">{product.greenCoins} 🪙</span> · Save {product.co2Saved} CO₂</span>
        </div>
        <button onClick={handleAdd}
          className={`mt-3 w-full py-1.5 rounded-full text-sm font-medium transition-all active:scale-95 ${added ? 'bg-[#007600] text-white' : 'bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200]'}`}>
          {added ? <span className="flex items-center justify-center gap-1"><CheckCircle className="w-4 h-4" />Added</span> : <span className="flex items-center justify-center gap-1"><ShoppingCart className="w-4 h-4" />Add to Cart</span>}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onBuyNow(product.id); }} className="mt-1.5 w-full py-1.5 rounded-full text-sm font-medium bg-[#FFA41C] hover:bg-[#FA8900] text-[#0F1111] border border-[#FF8F00]">Buy Now</button>
      </div>
    </div>
  );
}

// ─── Product Detail Page (PDP) ────────────────────────────────────────────────

function ProductDetailPage({ product, onBack, onAdd, onBuyNow }: { product: Product; onBack: () => void; onAdd: (id: string) => void; onBuyNow: (id: string) => void; }) {
  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-4 bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="text-xs text-[#565959] mb-4 flex items-center gap-1">
        <button onClick={onBack} className="hover:underline text-[#565959]">Storefront</button>
        <span>›</span>
        <span className="hover:underline cursor-pointer">Electronics</span>
        <span>›</span>
        <span className="font-bold text-[#0F1111]">{product.name.split(' ')[0]}</span>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Left: Image */}
        <div className="w-full md:w-[40%] flex flex-col items-center">
          <div className="w-full aspect-square bg-[#F7F8F8] border border-[#D5D9D9] flex items-center justify-center rounded mb-4">
            <span className="text-[150px]">{product.icon}</span>
          </div>
          <div className="flex gap-2 w-full justify-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`w-12 h-12 border ${i === 1 ? 'border-[#FF9900] shadow-[0_0_3px_#FF9900]' : 'border-[#D5D9D9]'} rounded flex items-center justify-center bg-[#F7F8F8] cursor-pointer hover:border-[#FF9900]`}>
                <span className="text-xl">{product.icon}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Middle: Info */}
        <div className="w-full md:w-[40%]">
          <h1 className="text-2xl text-[#0F1111] font-medium leading-tight mb-1">{product.name}</h1>
          <a href="#" className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mb-2 block">
            Visit the {product.type === 'renewed' ? 'Amazon Renewed' : product.seller} Store
          </a>
          <div className="border-b border-[#D5D9D9] pb-2 mb-2 flex items-center gap-4">
            <StarRating rating={product.rating} reviews={product.reviews} />
            <div className="flex items-center gap-1">
              {product.type === 'renewed' ? (
                <span className="inline-flex items-center gap-0.5 bg-[#F0F2F2] border border-[#D5D9D9] text-[10px] font-semibold px-1.5 py-0.5 rounded-sm"><Recycle className="w-2.5 h-2.5 text-[#007600]" />Amazon Renewed</span>
              ) : (
                <span className="inline-flex items-center gap-0.5 bg-[#F0F2F2] border border-[#D5D9D9] text-[10px] font-semibold px-1.5 py-0.5 rounded-sm"><Users className="w-2.5 h-2.5 text-[#007185]" />P2P Listing</span>
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-baseline gap-2 mb-1">
              <span className="text-3xl text-[#CC0C39] font-light">-{discount}%</span>
              <span className="text-xs text-[#0F1111] align-top mt-1">₹</span>
              <span className="text-3xl font-medium text-[#0F1111]">{product.price.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-xs text-[#565959]">
              M.R.P.: <span className="line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-sm text-[#0F1111] mt-1">Inclusive of all taxes</p>
          </div>

          {/* EcoBridge Impact Box */}
          <div className="bg-[#E7F4E4]/30 border border-[#C3E6C0] rounded p-3 mb-5">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="w-5 h-5 text-[#007600]" />
              <span className="font-bold text-[#007600]">EcoBridge Impact</span>
            </div>
            <ul className="text-sm text-[#0F1111] space-y-1.5">
              <li><span className="font-bold">Green Coins:</span> Earn <span className="text-[#007600] font-bold">{product.greenCoins} 🪙</span> on purchase</li>
              <li><span className="font-bold">Carbon Saved:</span> {product.co2Saved} CO₂ emissions diverted</li>
              <li><span className="font-bold">Condition:</span> AI-Verified Grade {product.grade} {product.aiScore && `(${product.aiScore}/100)`}</li>
            </ul>
          </div>

          <h3 className="font-bold text-base text-[#0F1111] mb-2">About this item</h3>
          <ul className="list-disc pl-5 text-sm text-[#0F1111] space-y-1">
            <li>Professionally inspected, tested, and cleaned to work and look like new.</li>
            <li>Backed by the 90-day Amazon Renewed Guarantee.</li>
            <li>Battery capacity exceeds 80% capacity relative to its new equivalent.</li>
            <li>Box and accessories may be generic.</li>
          </ul>
        </div>

        {/* Right: Buy Box */}
        <div className="w-full md:w-[20%]">
          <div className="border border-[#D5D9D9] rounded-lg p-4">
            <div className="flex items-baseline gap-0.5 mb-2">
              <span className="text-sm text-[#0F1111]">₹</span>
              <span className="text-2xl font-medium text-[#0F1111]">{product.price.toLocaleString('en-IN')}</span>
            </div>
            {product.freeDelivery && (
              <p className="text-sm text-[#007185] mb-2 hover:text-[#C7511F] hover:underline cursor-pointer">
                <span className="text-[#0F1111]">FREE delivery</span> <b>Tomorrow, June 15</b>. Order within 4 hrs 30 mins.
              </p>
            )}
            
            <h3 className="text-lg text-[#007600] font-medium mb-3">In stock</h3>
            
            <div className="flex flex-col gap-1 text-xs text-[#0F1111] mb-4">
              <div className="flex justify-between"><span className="text-[#565959]">Ships from</span><span>Amazon</span></div>
              <div className="flex justify-between"><span className="text-[#565959]">Sold by</span><span className="text-[#007185] hover:underline cursor-pointer">{product.type === 'renewed' ? 'Amazon Renewed' : product.seller}</span></div>
            </div>

            <div className="mb-4">
              <select className="w-full border border-[#D5D9D9] rounded p-1.5 text-sm bg-[#F0F2F2] shadow-sm outline-none focus:border-[#007185]">
                <option>Quantity: 1</option>
                <option>Quantity: 2</option>
              </select>
            </div>

            <button onClick={() => onAdd(product.id)} className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-medium py-2 rounded-full text-sm border border-[#FCD200] mb-2 transition-colors">
              Add to Cart
            </button>
            <button onClick={() => onBuyNow(product.id)} className="w-full bg-[#FFA41C] hover:bg-[#FA8900] text-[#0F1111] font-medium py-2 rounded-full text-sm border border-[#FF8F00] transition-colors mb-3">
              Buy Now
            </button>

            <div className="flex items-center justify-center gap-2 text-sm text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">
              <CheckCircle className="w-4 h-4 text-[#999]" /> Secure transaction
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function StorefrontPage({ onGoToCart, onAddToCart, approvedP2PItems = [] }: { onGoToCart?: () => void; onAddToCart?: (p: Product) => void; approvedP2PItems?: Product[] }) {
  const [activeTab, setActiveTab] = useState<'all' | 'renewed' | 'p2p'>('all');
  const [searchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItem, setCartItem] = useState<Product | null>(null);

  const handleAdd = (id: string) => {
    const p = [...RENEWED_PRODUCTS, ...P2P_PRODUCTS, ...approvedP2PItems].find((x) => x.id === id);
    if (p) { 
      setCartItem(p);
      setCartOpen(true);
      if (onAddToCart) onAddToCart(p);
      setTimeout(() => setCartOpen(false), 5000);
    }
  };

  const handleBuyNow = (id: string) => {
    const p = [...RENEWED_PRODUCTS, ...P2P_PRODUCTS, ...approvedP2PItems].find((x) => x.id === id);
    if (p) { 
      if (onAddToCart) onAddToCart(p);
      if (onGoToCart) onGoToCart();
    }
  };

  const renewed = RENEWED_PRODUCTS.filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const p2p = [...approvedP2PItems, ...P2P_PRODUCTS].filter((p) => !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // If a product is selected, render the PDP
  if (selectedProductId) {
    const p = [...RENEWED_PRODUCTS, ...P2P_PRODUCTS, ...approvedP2PItems].find((x) => x.id === selectedProductId);
    if (p) {
      // Use P2PProductDetail for items with gallery images (scanned products)
      if (p.galleryImages && Object.keys(p.galleryImages).length > 0) {
        return <P2PProductDetail productId={p.id} onBack={() => setSelectedProductId(null)} onAddToCart={onAddToCart} productData={p} />;
      }
      return (
        <>
          <ProductDetailPage product={p} onBack={() => setSelectedProductId(null)} onAdd={handleAdd} onBuyNow={handleBuyNow} />
          {/* Cart Side Drawer */}
          {cartOpen && cartItem && (
            <div className="fixed top-[108px] right-0 bottom-0 w-80 bg-white shadow-[-5px_0_15px_rgba(0,0,0,0.1)] z-50 border-l border-[#D5D9D9] p-4 animate-in slide-in-from-right">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-[#0F1111] flex items-center gap-2"><CheckCircle className="w-5 h-5 text-[#007600]" /> Added to Cart</h2>
                <button onClick={() => setCartOpen(false)} className="text-[#565959] hover:text-[#0F1111]">✕</button>
              </div>
              <div className="flex gap-3 mb-4">
                <div className="w-16 h-16 bg-[#F7F8F8] border border-[#D5D9D9] rounded flex items-center justify-center text-3xl shrink-0">{cartItem.icon}</div>
                <div>
                  <div className="text-sm text-[#0F1111] font-medium line-clamp-2 leading-tight mb-1">{cartItem.name}</div>
                  <div className="text-[#B12704] font-bold">₹{cartItem.price.toLocaleString('en-IN')}</div>
                </div>
              </div>
              <div className="bg-[#FFFBF0] border border-[#FFD814]/40 p-2 rounded text-xs mb-4">
                <span className="font-bold text-[#007600]">+ {cartItem.greenCoins} 🪙 Green Coins earned!</span>
              </div>
              <button 
                onClick={() => { setCartOpen(false); onGoToCart?.(); }} 
                className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] font-medium py-2 rounded-full mb-2">
                Cart & Checkout
              </button>
              <button onClick={() => setCartOpen(false)} className="w-full border border-[#D5D9D9] hover:bg-[#F7F8F8] text-[#0F1111] font-medium py-2 rounded-full">Continue Shopping</button>
            </div>
          )}
        </>
      );
    }
  }

  return (
    <>
      {/* ─── Hero Banner ─── */}
      <div className="relative overflow-hidden">
        <div className="w-full py-14 px-8 text-center" style={{ background: 'linear-gradient(135deg, #232F3E 0%, #37475A 40%, #485769 70%, #232F3E 100%)' }}>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 40px),repeating-linear-gradient(90deg,#fff 0px,#fff 1px,transparent 1px,transparent 40px)' }} />
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-[#FF9900]/20 border border-[#FF9900]/40 rounded-full px-4 py-1.5 mb-4">
              <Recycle className="w-4 h-4 text-[#FF9900]" />
              <span className="text-[#FF9900] text-sm font-semibold">AI-Powered Circular Commerce · HackOn Season 6</span>
            </div>
            <h1 className="text-white text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Every Return Gets a <span className="text-[#FF9900]">Second Life</span>
            </h1>
            <p className="text-[#ccc] text-base mb-8 max-w-xl mx-auto">Shop AI-graded renewed products and peer-to-peer listings. Earn Green Coins on every eco purchase.</p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab('renewed')} className="bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-bold px-8 py-2.5 rounded-full text-sm border border-[#FCD200] flex items-center gap-2"><Recycle className="w-4 h-4" />Shop Amazon Renewed</button>
              <button onClick={() => setActiveTab('p2p')} className="bg-white hover:bg-[#F7F8F8] text-[#0F1111] font-bold px-8 py-2.5 rounded-full text-sm border border-[#D5D9D9] flex items-center gap-2"><Users className="w-4 h-4" />Browse P2P Listings</button>
            </div>
          </div>
          <div className="relative z-10 mt-10 flex items-center justify-center gap-6 md:gap-12 flex-wrap">
            {[{ value: '1.2M+', label: 'Products Renewed', icon: '♻️' }, { value: '8,400 T', label: 'CO₂ Saved', icon: '🌿' }, { value: '₹54M', label: 'Green Coins Issued', icon: '🪙' }, { value: '320K', label: 'Active Sellers', icon: '👤' }].map((s) => (
              <div key={s.label} className="text-center"><div className="text-[#FF9900] text-2xl font-bold">{s.icon} {s.value}</div><div className="text-[#CCC] text-xs mt-0.5">{s.label}</div></div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-5 bg-[#EAEDED]" style={{ borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }} />
      </div>

      {/* ─── Value Props ─── */}
      <div className="bg-white border-b border-[#D5D9D9]">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-4 md:gap-8 flex-wrap">
          {[
            { icon: <Truck className="w-4 h-4 text-[#007600]" />, text: 'FREE Delivery on Renewed' },
            { icon: <RotateCcw className="w-4 h-4 text-[#007185]" />, text: '90-Day Renewed Guarantee' },
            { icon: <ThumbsUp className="w-4 h-4 text-[#FF9900]" />, text: 'AI-Verified Condition' },
            { icon: <Leaf className="w-4 h-4 text-[#007600]" />, text: 'Earn Green Coins' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-[#0F1111] text-xs font-medium">{item.icon}<span>{item.text}</span></div>
          ))}
        </div>
      </div>

      {/* ─── Category Row ─── */}
      <div className="bg-white border-b border-[#D5D9D9] mb-3">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button key={c.label} className="flex flex-col items-center gap-1 shrink-0 px-3 py-1 rounded hover:bg-[#F7F8F8]">
              <span className="text-2xl">{c.icon}</span>
              <span className="text-[10px] font-medium text-[#0F1111] whitespace-nowrap">{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ─── Products ─── */}
      <div className="max-w-7xl mx-auto px-3 pb-8">
        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4">
          {(['all', 'renewed', 'p2p'] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`text-sm px-4 py-1.5 rounded-full border transition-colors ${activeTab === tab ? 'bg-[#232F3E] text-white border-[#232F3E] font-semibold' : 'bg-white text-[#0F1111] border-[#D5D9D9] hover:bg-[#F7F8F8]'}`}>
              {tab === 'all' ? '🌿 All Listings' : tab === 'renewed' ? '♻️ Amazon Renewed' : '👤 P2P Listings'}
            </button>
          ))}
        </div>

        {/* Renewed */}
        {(activeTab === 'all' || activeTab === 'renewed') && renewed.length > 0 && (
          <section className="mb-6">
            <div className="bg-white border border-[#D5D9D9] px-4 py-3 flex items-center justify-between mb-px">
              <div className="flex items-center gap-3">
                <Recycle className="w-5 h-5 text-[#007600]" />
                <div>
                  <h2 className="text-lg font-bold text-[#0F1111]">Amazon Renewed</h2>
                  <p className="text-xs text-[#565959]">Professionally inspected, tested · AI-graded condition</p>
                </div>
              </div>
              <a href="#" className="text-[#007185] hover:text-[#C7511F] text-sm hover:underline flex items-center gap-1">See all <ArrowRight className="w-3.5 h-3.5" /></a>
            </div>
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {renewed.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={handleAdd} onBuyNow={handleBuyNow} onClick={setSelectedProductId} />
              ))}
            </div>
          </section>
        )}

        {/* P2P */}
        {(activeTab === 'all' || activeTab === 'p2p') && p2p.length > 0 && (
          <section className="mb-6">
            <div className="bg-white border border-[#D5D9D9] px-4 py-3 flex items-center justify-between mb-px">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#007185]" />
                <div>
                  <h2 className="text-lg font-bold text-[#0F1111]">P2P Marketplace</h2>
                  <p className="text-xs text-[#565959]">Listed by real users · AI-verified condition scores</p>
                </div>
              </div>
              <a href="#" className="text-[#007185] hover:text-[#C7511F] text-sm hover:underline flex items-center gap-1">See all <ArrowRight className="w-3.5 h-3.5" /></a>
            </div>
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {p2p.map((product) => (
                <ProductCard key={product.id} product={product} onAdd={handleAdd} onBuyNow={handleBuyNow} onClick={setSelectedProductId} />
              ))}
            </div>
          </section>
        )}

        {/* Empty */}
        {renewed.length === 0 && p2p.length === 0 && (
          <div className="bg-white border border-[#D5D9D9] text-center py-20 rounded">
            <Package className="w-16 h-16 text-[#D5D9D9] mx-auto mb-4" />
            <h3 className="text-[#0F1111] font-bold text-lg mb-1">No results found</h3>
            <p className="text-[#565959] text-sm">Try a different search or category.</p>
          </div>
        )}

        {/* Impact banner */}
        <div className="bg-white border border-[#D5D9D9] rounded p-5 mt-2">
          <div className="flex flex-col md:flex-row items-center gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1"><Leaf className="w-5 h-5 text-[#007600]" /><h3 className="font-bold text-[#0F1111]">🌍 Your Shopping Impact</h3></div>
              <p className="text-[#565959] text-sm">Every Second Life purchase diverts waste, cuts carbon, and keeps products in circulation.</p>
            </div>
            <div className="flex gap-6 shrink-0">
              {[{ label: 'CO₂ Saved', value: '12.5 kg', color: 'text-[#007600]' }, { label: 'Green Coins', value: '240 🪙', color: 'text-[#C7511F]' }, { label: 'Items Diverted', value: '3', color: 'text-[#007185]' }].map((s) => (
                <div key={s.label} className="text-center"><div className={`text-xl font-bold ${s.color}`}>{s.value}</div><div className="text-[10px] text-[#565959] mt-0.5">{s.label}</div></div>
              ))}
            </div>
            <button className="shrink-0 bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] font-medium px-5 py-2 rounded-full text-sm flex items-center gap-2">
              <Coins className="w-4 h-4 text-[#007600]" />View My Impact
            </button>
          </div>
        </div>
      </div>

      {/* Cart Side Drawer */}
      {cartOpen && cartItem && (
        <div className="fixed top-[108px] right-0 bottom-0 w-80 bg-white shadow-[-5px_0_15px_rgba(0,0,0,0.1)] z-50 border-l border-[#D5D9D9] p-4 animate-in slide-in-from-right">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#0F1111] flex items-center gap-2"><CheckCircle className="w-5 h-5 text-[#007600]" /> Added to Cart</h2>
            <button onClick={() => setCartOpen(false)} className="text-[#565959] hover:text-[#0F1111]">✕</button>
          </div>
          <div className="flex gap-3 mb-4">
            <div className="w-16 h-16 bg-[#F7F8F8] border border-[#D5D9D9] rounded flex items-center justify-center text-3xl shrink-0">{cartItem.icon}</div>
            <div>
              <div className="text-sm text-[#0F1111] font-medium line-clamp-2 leading-tight mb-1">{cartItem.name}</div>
              <div className="text-[#B12704] font-bold">₹{cartItem.price.toLocaleString('en-IN')}</div>
            </div>
          </div>
          <div className="bg-[#FFFBF0] border border-[#FFD814]/40 p-2 rounded text-xs mb-4">
            <span className="font-bold text-[#007600]">+ {cartItem.greenCoins} 🪙 Green Coins earned!</span>
          </div>
          <button 
            onClick={() => { setCartOpen(false); onGoToCart?.(); }} 
            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] font-medium py-2 rounded-full mb-2">
            Cart & Checkout
          </button>
          <button onClick={() => setCartOpen(false)} className="w-full border border-[#D5D9D9] hover:bg-[#F7F8F8] text-[#0F1111] font-medium py-2 rounded-full">Continue Shopping</button>
        </div>
      )}
    </>
  );
}
