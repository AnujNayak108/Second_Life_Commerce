import { useState } from 'react';
import {
  Search, ShoppingCart, Star, Recycle, Leaf,
  CheckCircle, ArrowRight, Flame, ShoppingBag,
  ChevronDown
} from 'lucide-react';
import { CustomerProductDetailPage } from './CustomerProductDetailPage';

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  icon: string;
  freeDelivery: boolean;
  prime: boolean;
  tag?: string;
}

interface CustomerStorefrontPageProps {
  cartCount: number;
  onCartClick: () => void;
  onAddToCart: (product: any) => void;
  onNavigateToSecondLife: () => void;
  persona: string;
  setPersona: (p: any) => void;
  onOrdersClick: () => void;
}

// 12 Mock Products requested
const FEATURED_PRODUCTS: Product[] = [
  { id: 'c1', name: 'Sony WH-1000XM5 Wireless Active Noise Cancelling Headphones', price: 29999, originalPrice: 34999, rating: 4.8, reviews: 3421, icon: '🎧', freeDelivery: true, prime: true, tag: 'Best Seller' },
  { id: 'c2', name: 'Apple Watch Series 9 GPS 45mm Smartwatch with Midnight Band', price: 41900, originalPrice: 45900, rating: 4.7, reviews: 1284, icon: '⌚', freeDelivery: true, prime: true },
  { id: 'c3', name: 'Samsung Odyssey G5 27" Curved QHD Gaming Monitor (144Hz)', price: 22500, originalPrice: 28000, rating: 4.6, reviews: 543, icon: '🖥️', freeDelivery: true, prime: false },
  { id: 'c4', name: 'Logitech MX Master 3S Wireless Performance Mouse', price: 8999, originalPrice: 9499, rating: 4.5, reviews: 876, icon: '🖱️', freeDelivery: true, prime: true, tag: 'Top Rated' },
  { id: 'c5', name: 'Amazon Kindle Paperwhite 16GB 6.8" Display with Adjustable Warm Light', price: 13999, originalPrice: 14999, rating: 4.9, reviews: 2314, icon: '📚', freeDelivery: true, prime: true },
  { id: 'c6', name: 'Apple iPad Air 10.9-inch M1 Chip 64GB Space Grey', price: 54900, originalPrice: 59900, rating: 4.8, reviews: 921, icon: '📱', freeDelivery: true, prime: true },
  { id: 'c7', name: 'Keychron K2 V2 Hot-swappable Mechanical Keyboard', price: 6999, originalPrice: 7999, rating: 4.7, reviews: 320, icon: '⌨️', freeDelivery: true, prime: true },
  { id: 'c8', name: 'Logitech G502 Hero High Performance Wired Gaming Mouse', price: 3999, originalPrice: 4500, rating: 4.6, reviews: 1482, icon: '🖱️', freeDelivery: true, prime: false },
  { id: 'c9', name: 'JBL Flip 6 Portable Waterproof Bluetooth Speaker', price: 9999, originalPrice: 11999, rating: 4.5, reviews: 754, icon: '🔈', freeDelivery: true, prime: true },
  { id: 'c10', name: 'OnePlus 12R 5G Smartphone (16GB RAM + 256GB Storage)', price: 42999, originalPrice: 45999, rating: 4.7, reviews: 218, icon: '📱', freeDelivery: true, prime: true, tag: 'Hot Deal' },
  { id: 'c11', name: 'Anker PowerCore 20,000mAh Power Bank (22.5W Fast Charging)', price: 2999, originalPrice: 3499, rating: 4.4, reviews: 1982, icon: '🔋', freeDelivery: true, prime: true },
  { id: 'c12', name: 'Logitech C920s Pro HD Pro Webcam with Privacy Shutter', price: 7499, originalPrice: 9499, rating: 4.5, reviews: 843, icon: '📷', freeDelivery: true, prime: true }
];

const CATEGORIES = [
  { label: 'Electronics', icon: '🔌', bg: 'bg-[#F2F8FD]' },
  { label: 'Fashion', icon: '👕', bg: 'bg-[#FDF6F2]' },
  { label: 'Home', icon: '🏠', bg: 'bg-[#F3FDF2]' },
  { label: 'Books', icon: '📚', bg: 'bg-[#FCF2FD]' },
  { label: 'Gaming', icon: '🎮', bg: 'bg-[#F2FDFD]' },
  { label: 'Accessories', icon: '👜', bg: 'bg-[#FDFDF2]' }
];

const TODAY_DEALS = [
  { id: 'd1', name: 'Sony WH-1000XM4 Noise Cancelling Headphones', originalPrice: 24990, dealPrice: 19999, discount: 20, icon: '🎧', endsIn: '4 hrs' },
  { id: 'd2', name: 'Kindle Oasis (10th Gen) 32GB Wi-Fi', originalPrice: 21999, dealPrice: 17999, discount: 18, icon: '📚', endsIn: '2 hrs' },
  { id: 'd3', name: 'Logitech G915 TKL Mechanical Keyboard', originalPrice: 22995, dealPrice: 18499, discount: 19, icon: '⌨️', endsIn: '6 hrs' }
];

export function CustomerStorefrontPage({
  cartCount,
  onCartClick,
  onAddToCart,
  onNavigateToSecondLife,
  persona,
  setPersona,
  onOrdersClick
}: CustomerStorefrontPageProps) {
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItem, setCartItem] = useState<Product | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const handleAdd = (product: Product) => {
    onAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      grade: 'A',
      rating: product.rating,
      reviews: product.reviews,
      type: 'renewed', // standard buy flow compatibility
      greenCoins: 0,
      co2Saved: '0 kg',
      icon: product.icon,
      freeDelivery: product.freeDelivery,
      prime: product.prime
    });
    setCartItem(product);
    setCartOpen(true);
    setTimeout(() => setCartOpen(false), 5000);
  };

  const handleBuyNow = (product: Product) => {
    onAddToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      grade: 'A',
      rating: product.rating,
      reviews: product.reviews,
      type: 'renewed',
      greenCoins: 0,
      co2Saved: '0 kg',
      icon: product.icon,
      freeDelivery: product.freeDelivery,
      prime: product.prime
    });
    onCartClick();
  };
  const CartSideDrawer = (
    <>
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
          <button 
            onClick={() => { setCartOpen(false); onCartClick(); }} 
            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] border border-[#FCD200] text-[#0F1111] font-medium py-2 rounded-full mb-2">
            Cart & Checkout
          </button>
          <button onClick={() => setCartOpen(false)} className="w-full border border-[#D5D9D9] hover:bg-[#F7F8F8] text-[#0F1111] font-medium py-2 rounded-full">Continue Shopping</button>
        </div>
      )}
    </>
  );

  if (selectedProductId) {
    const allProducts = [...FEATURED_PRODUCTS, ...TODAY_DEALS.map(d => ({
      id: d.id, name: d.name, price: d.dealPrice, originalPrice: d.originalPrice,
      rating: 4.5, reviews: 100, icon: d.icon, freeDelivery: true, prime: true
    }))];
    const product = allProducts.find(p => p.id === selectedProductId);
    if (product) {
      return (
        <div className="min-h-screen bg-[#EAEDED] font-sans">
          <CustomerProductDetailPage 
            product={product} 
            onBack={() => setSelectedProductId(null)} 
            onAddToCart={(p) => handleAdd(p)} 
            onBuyNow={(p) => handleBuyNow(p)}
          />
          {CartSideDrawer}
        </div>
      );
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#EAEDED] text-[#0F1111] font-sans">
      
      {CartSideDrawer}

      {/* ═══ CUSTOMER NAVBAR — #131921 ═══════════════════════════════════════════ */}
      <header className="bg-[#131921] sticky top-0 z-50">
        <div className="flex items-center justify-between gap-2 px-4 py-2">

          {/* Left: SecondLife AI Logo */}
          <div
            className="flex flex-col items-start mr-2 shrink-0 border border-transparent hover:border-white rounded px-2 py-1 cursor-pointer"
            onClick={() => {
              setSelectedProductId(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <div className="flex items-baseline gap-0.5">
              <span className="text-white font-bold text-xl leading-tight tracking-tight">SecondLife</span>
              <span className="text-[#FF9900] text-xs font-black leading-none">AI</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Leaf className="w-2.5 h-2.5 text-[#FF9900]" />
              <span className="text-gray-400 text-[8px] font-bold tracking-widest uppercase">An Amazon Platform</span>
            </div>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 flex rounded-md overflow-hidden max-w-3xl">
            <div className="bg-[#F3F3F3] hover:bg-[#E6E6E6] border-r border-gray-300 flex items-center px-3 cursor-pointer shrink-0">
              <span className="text-[11px] text-[#555] whitespace-nowrap">All</span>
              <ChevronDown className="w-3 h-3 text-[#555] ml-0.5" />
            </div>
            <input
              type="text"
              placeholder="Search Amazon.in..."
              className="flex-1 bg-white text-sm px-3 py-2 outline-none min-w-0 text-[#0F1111] placeholder-[#999]"
            />
            <button className="bg-[#FEBD69] hover:bg-[#F3A847] px-5 py-2 shrink-0 flex items-center justify-center cursor-pointer">
              <Search className="w-5 h-5 text-[#0F1111]" />
            </button>
          </div>

          {/* Right Navigation */}
          <div className="flex items-center gap-2 shrink-0 ml-1">

            {/* Account Switcher Trigger */}
            <div className="relative flex flex-col border border-transparent hover:border-white rounded px-2 py-1">
              <span className="text-[#CCCCCC] text-[10px] leading-tight">Hello, Sign In</span>
              <div className="flex items-center gap-0.5">
                <select
                  value={persona}
                  onChange={(e) => setPersona(e.target.value as any)}
                  className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer appearance-none pr-3"
                  style={{ WebkitAppearance: 'none' }}
                >
                  <option value="storefront" className="text-[#0F1111]">🏪 Storefront</option>
                  <option value="rahul" className="text-[#0F1111]">📦 Rahul (Seller)</option>
                  <option value="priya" className="text-[#0F1111]">↩️ Priya (Returner)</option>
                  <option value="amit" className="text-[#0F1111]">🛒 Amit (Buyer)</option>
                  <option value="admin" className="text-[#0F1111]">🛠️ Operations Admin</option>
                </select>
                <ChevronDown className="w-3 h-3 text-white pointer-events-none -ml-3" />
              </div>
            </div>

            {/* Orders */}
            <div
              onClick={onOrdersClick}
              className="hidden md:flex flex-col border border-transparent hover:border-white rounded px-2 py-1 cursor-pointer"
            >
              <span className="text-[#CCCCCC] text-[10px] leading-tight">Returns</span>
              <span className="text-white text-xs font-bold">& Orders</span>
            </div>

            {/* Cart */}
            <div
              onClick={onCartClick}
              className="relative flex items-end border border-transparent hover:border-white rounded px-2 py-1 cursor-pointer"
            >
              <div className="relative">
                <ShoppingCart className="w-8 h-8 text-white" />
                <span className="absolute -top-1 left-5 bg-[#FF9900] text-[#0F1111] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              </div>
              <span className="text-white text-xs font-bold ml-0.5 hidden sm:block">Cart</span>
            </div>
          </div>
        </div>

        {/* ═══ SECONDARY NAVIGATION ═══ */}
        <nav className="bg-[#232F3E] flex items-center px-4 py-1.5 gap-4 overflow-x-auto select-none">
          <button className="flex items-center gap-1.5 text-white text-sm font-bold hover:text-white border border-transparent hover:border-white rounded px-2 py-1 whitespace-nowrap shrink-0 cursor-pointer">
            <span className="flex flex-col gap-[3px] w-4">
              <span className="w-full h-0.5 bg-white rounded" />
              <span className="w-full h-0.5 bg-white rounded" />
              <span className="w-full h-0.5 bg-white rounded" />
            </span>
            All
          </button>

          {['Today\'s Deals', 'Electronics', 'Fashion', 'Home', 'Books', 'Computers', 'Accessories'].map((item) => (
            <button
              key={item}
              className="text-white text-sm hover:underline hover:text-white border border-transparent rounded px-2 py-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              {item}
            </button>
          ))}

          {/* Highlighted Navigation Item: 🌱 Amazon SecondLife */}
          <button
            onClick={onNavigateToSecondLife}
            className="ml-auto text-emerald-400 hover:text-emerald-300 font-extrabold text-sm border border-emerald-500/20 hover:border-emerald-500/50 bg-emerald-950/20 hover:bg-emerald-950/40 rounded-full px-3 py-1 flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all cursor-pointer shadow-sm animate-pulse"
          >
            🌱 Amazon SecondLife
            <span className="bg-[#007600] text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
              Explore
            </span>
          </button>
        </nav>
      </header>

      {/* ─── HERO PROMO BANNER ─── */}
      <section
        className="relative overflow-hidden w-full min-h-[380px] flex items-center px-6 md:px-12 py-12"
        style={{
          background: 'linear-gradient(90deg, #131921 0%, #232F3E 50%, rgba(35, 47, 62, 0.5) 85%), url("/eco_shopping_banner.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'right center'
        }}
      >
        <div className="max-w-xl text-white space-y-5 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-[#FF9900]/20 border border-[#FF9900]/40 rounded-full px-3.5 py-1 text-xs">
            <Flame className="w-3.5 h-3.5 text-[#FF9900]" />
            <span className="text-[#FF9900] font-extrabold tracking-wider uppercase text-[10px]">Big Brands. Great Discounts.</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Shop Millions of<br />
            <span className="text-[#FF9900]">Products.</span>
          </h1>
          <p className="text-gray-300 text-sm md:text-base leading-relaxed">
            Find great deals on electronics, fashion, home essentials, and more. Fast delivery and certified customer guarantees on all purchases.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <a
              href="#featured-products"
              className="bg-[#FF9900] hover:bg-[#E08800] text-gray-900 font-extrabold px-8 py-2.5 rounded-full text-xs shadow-sm hover:shadow transition-all text-center block w-full sm:w-auto cursor-pointer"
            >
              Shop Now
            </a>
            <button
              onClick={onNavigateToSecondLife}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-8 py-2.5 rounded-full text-xs border border-emerald-500 shadow-md hover:shadow-lg transition-all text-center block w-full sm:w-auto cursor-pointer flex items-center justify-center gap-1.5"
            >
              🌱 Explore Amazon SecondLife
            </button>
          </div>
        </div>

        {/* Subtle bottom curve fading into content */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#EAEDED] to-transparent pointer-events-none" />
      </section>

      {/* ─── PRODUCT CATEGORIES SECTION ─── */}
      <section className="max-w-7xl mx-auto px-4 -mt-10 relative z-20 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.label}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm text-center space-y-2 hover:shadow hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            >
              <div className={`w-14 h-14 mx-auto rounded-full ${cat.bg} flex items-center justify-center text-3xl shadow-inner`}>
                {cat.icon}
              </div>
              <h3 className="font-bold text-xs text-gray-900">{cat.label}</h3>
              <span className="text-[10px] text-[#007185] hover:text-[#C7511F] hover:underline font-semibold block">Shop Now</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS GRID (12 Products) ─── */}
      <section id="featured-products" className="max-w-7xl mx-auto px-4 mb-8 scroll-mt-20">
        <div className="bg-white rounded border border-[#D5D9D9] p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-3">
            <ShoppingBag className="w-5 h-5 text-[#FF9900]" />
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Featured Retail Products</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {FEATURED_PRODUCTS.map((product) => {
              const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
              return (
                <div
                  key={product.id}
                  className="bg-white border border-[#D5D9D9] rounded flex flex-col h-full hover:shadow-lg transition-all duration-300 relative group overflow-hidden"
                >
                  {/* Tag badge (Best Seller, Hot Deal etc) */}
                  {product.tag && (
                    <span className="absolute top-2.5 left-2.5 bg-[#C7511F] text-white text-[9px] font-black px-2 py-0.5 rounded-sm z-10 shadow-xs uppercase tracking-wide">
                      {product.tag}
                    </span>
                  )}

                  {/* Discount Tag */}
                  <span className={`absolute top-2.5 right-2.5 bg-[#CC0C39] text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-sm z-10 ${product.tag ? '' : ''}`}>
                    -{discount}%
                  </span>

                  {/* Product Visual Area */}
                  <div className="h-44 bg-[#F7F8F8] border-b border-gray-150 flex items-center justify-center text-7xl select-none group-hover:scale-105 transition-transform duration-300">
                    {product.icon}
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex flex-col grow justify-between space-y-3">
                    <div className="space-y-1.5">
                      <span className="font-semibold text-sm text-[#0F1111] group-hover:text-[#C7511F] hover:underline line-clamp-2 leading-snug cursor-pointer">
                        {product.name}
                      </span>

                      {/* Rating details */}
                      <div className="flex items-center gap-1">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= Math.round(product.rating) ? 'text-[#FF9900] fill-[#FF9900]' : 'text-gray-300 fill-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-[#007185] text-xs font-semibold">{product.reviews.toLocaleString()}</span>
                      </div>

                      {/* Prime delivery flag */}
                      {product.prime && (
                        <div className="pt-0.5">
                          <span className="bg-[#00A8E0] text-white text-[9px] font-black px-1.5 py-0.2 rounded-sm italic">prime</span>
                          <span className="text-[10px] text-gray-500 ml-1.5 font-medium">Free Delivery</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="flex items-baseline">
                          <span className="text-xs text-gray-500 font-bold mr-0.5">₹</span>
                          <span className="text-xl font-bold tracking-tight">{product.price.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="text-xs text-gray-400">M.R.P: <span className="line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span></div>
                      </div>

                      {/* CTA Buttons */}
                      <div className="space-y-1.5 pt-2">
                        <button
                          onClick={() => handleAdd(product)}
                          className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 border border-[#FCD200] font-bold py-1.5 rounded-full text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                        </button>
                        <button
                          onClick={() => handleBuyNow(product)}
                          className="w-full bg-[#FFA41C] hover:bg-[#FA8900] text-gray-900 border border-[#FF8F00] font-bold py-1.5 rounded-full text-xs transition-colors shadow-sm cursor-pointer"
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

      {/* ─── SPECIAL AMAZON SECONDLIFE PROMOTION SECTION ─── */}
      <section className="max-w-7xl mx-auto px-4 mb-8">
        <div className="bg-gradient-to-r from-[#0F5132] to-[#146c43] border border-emerald-800 text-white rounded-lg p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.2),transparent_50%)] pointer-events-none" />

          <div className="space-y-4 max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-400/30 rounded-full px-3 py-0.5 text-xs font-bold text-emerald-300">
              <Recycle className="w-3.5 h-3.5" /> Amazon Circular Ecosystem
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Give Products a Meaningful Second Life
            </h2>

            <p className="text-emerald-150 text-sm leading-relaxed">
              Buy certified refurbished products, earn eco credits, and reduce waste through our AI-powered sustainable commerce ecosystem. Keep returns in circulation and list your own items for trade-in incentives.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-100">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> AI Verified Products
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-100">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Eco Credits Rewards
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-100">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Sustainable Shopping
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-100">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Trusted Marketplace
              </div>
            </div>
          </div>

          <div className="shrink-0 relative z-10 w-full md:w-auto text-center">
            <button
              onClick={onNavigateToSecondLife}
              className="bg-[#FF9900] hover:bg-[#E08800] text-gray-900 font-extrabold px-8 py-3 rounded-full text-xs shadow-md hover:shadow-lg transition-all w-full md:w-auto flex items-center justify-center gap-2 cursor-pointer inline-flex"
            >
              Explore Amazon SecondLife <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ─── TODAY'S DEALS SECTION ─── */}
      <section className="max-w-7xl mx-auto px-4 mb-12">
        <div className="bg-white rounded border border-[#D5D9D9] p-5 shadow-xs">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
            <Flame className="w-4 h-4 text-[#CC0C39]" />
            <h2 className="text-base font-bold text-gray-900 tracking-tight">Today's Hot Deals</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TODAY_DEALS.map((deal) => (
              <div
                key={deal.id}
                className="bg-white border border-[#D5D9D9] rounded p-4 flex gap-4 hover:border-[#FF9900] transition-colors duration-200 cursor-pointer shadow-2xs"
              >
                <div className="w-20 h-20 bg-gray-50 rounded border border-gray-150 flex items-center justify-center text-4xl shrink-0 select-none">
                  {deal.icon}
                </div>

                <div className="flex flex-col justify-between py-0.5">
                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-gray-900 line-clamp-1 leading-snug">{deal.name}</h4>
                    <div className="flex items-center gap-1.5">
                      <span className="bg-[#CC0C39] text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-sm uppercase">
                        -{deal.discount}% Deal
                      </span>
                      <span className="text-[10px] text-[#CC0C39] font-bold">Ends in {deal.endsIn}</span>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1.5 pt-1">
                    <span className="text-sm font-extrabold text-[#B12704]">₹{deal.dealPrice.toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-gray-400 line-through">₹{deal.originalPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CUSTOMER FOOTER ═══ */}
      <footer>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-full bg-[#37475A] hover:bg-[#485769] text-white text-sm py-3.5 transition-colors font-medium cursor-pointer"
        >
          Back to top
        </button>
        <div className="bg-[#232F3E] text-white py-10 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-bold text-sm mb-3">Shop</h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li><a href="#" className="hover:underline hover:text-white">Today's Deals</a></li>
                <li><a href="#" className="hover:underline hover:text-white">New Releases</a></li>
                <li><a href="#" className="hover:underline hover:text-white">Electronics Store</a></li>
                <li><a href="#" className="hover:underline hover:text-white">Fashion Catalog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">Categories</h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li><a href="#" className="hover:underline hover:text-white">Computers & Accessories</a></li>
                <li><a href="#" className="hover:underline hover:text-white">Home & Kitchen Essentials</a></li>
                <li><a href="#" className="hover:underline hover:text-white">Books & Literary Gems</a></li>
                <li><a href="#" className="hover:underline hover:text-white">Video Games & Toys</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">Returns & Orders</h4>
              <ul className="space-y-1.5 text-xs text-gray-300">
                <li><button onClick={onOrdersClick} className="hover:underline text-left cursor-pointer hover:text-white">Returns Center</button></li>
                <li><button onClick={onOrdersClick} className="hover:underline text-left cursor-pointer hover:text-white">Your Orders</button></li>
                <li><a href="#" className="hover:underline hover:text-white">Shipping Rates & Policies</a></li>
                <li><a href="#" className="hover:underline hover:text-white">Help & Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-sm mb-3">Amazon SecondLife</h4>
              <ul className="space-y-1.5 text-xs text-emerald-300 font-semibold">
                <li><button onClick={onNavigateToSecondLife} className="hover:underline text-emerald-400 hover:text-emerald-300 text-left cursor-pointer flex items-center gap-1">🌱 Visit SecondLife Portal</button></li>
                <li><button onClick={onNavigateToSecondLife} className="hover:underline text-emerald-400 hover:text-emerald-300 text-left cursor-pointer">AI Refurbished Center</button></li>
                <li><button onClick={onNavigateToSecondLife} className="hover:underline text-emerald-400 hover:text-emerald-300 text-left cursor-pointer">P2P Marketplace Hub</button></li>
                <li><button onClick={onNavigateToSecondLife} className="hover:underline text-emerald-400 hover:text-emerald-300 text-left cursor-pointer">Incentives & Eco Wallet</button></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="bg-[#131921] text-white py-5 px-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-baseline gap-0.5">
              <span className="text-white font-bold text-lg leading-tight">amazon</span>
              <span className="text-[#FF9900] text-[9px] font-semibold">.in</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-[10px] text-gray-400">
              <a href="#" className="hover:underline">Conditions of Use</a>
              <a href="#" className="hover:underline">Privacy Notice</a>
              <a href="#" className="hover:underline">Interest-Based Ads</a>
            </div>
            <p className="text-[10px] text-gray-500">© 2026, SecondLife.AI Commerce — HackOn with Amazon Season 6.0</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
