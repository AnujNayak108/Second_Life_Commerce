import { useState, useRef, useEffect } from 'react';
import Webcam from 'react-webcam';
import { 
  Recycle, Leaf, Coins, ArrowLeft, Camera, 
  CheckCircle, MapPin, Sparkles, User, 
  Sliders, ShoppingCart
} from 'lucide-react';
import { P2PProductDetail } from './P2PProductDetail';

// Product Type
interface P2PProduct {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  grade: 'A' | 'B' | 'C';
  rating: number;
  reviews: number;
  seller: string;
  aiScore: number;
  greenCoins: number;
  co2Saved: string;
  icon: string;
  freeDelivery: boolean;
  prime: boolean;
}

interface SecondLifePageProps {
  onGoToCart?: () => void;
  onAddToCart?: (product: any) => void;
  onBackToStorefront: () => void;
  userEcoCredits: number;
  setUserEcoCredits: React.Dispatch<React.SetStateAction<number>>;
  userCo2Saved: number;
  setUserCo2Saved: React.Dispatch<React.SetStateAction<number>>;
}

// Initial P2P Listings (fallback if backend unavailable)
const INITIAL_P2P_PRODUCTS: P2PProduct[] = [
  { id: 'p2p1', name: 'Sony WH-1000XM4 Noise Cancelling Headphones (AI Inspected)', price: 13999, originalPrice: 24990, grade: 'A', rating: 4.8, reviews: 142, seller: 'Priya S.', aiScore: 94, greenCoins: 180, co2Saved: '5.2 kg', icon: '🎧', freeDelivery: true, prime: true },
  { id: 'p2p2', name: 'Keychron K2 V2 Mechanical Keyboard (Brown Switches)', price: 4500, originalPrice: 7999, grade: 'A', rating: 4.7, reviews: 38, seller: 'Rahul M.', aiScore: 92, greenCoins: 90, co2Saved: '1.8 kg', icon: '⌨️', freeDelivery: true, prime: false },
  { id: 'p2p3', name: 'Apple Watch Series 7 GPS 41mm Smartwatch', price: 18500, originalPrice: 41900, grade: 'B', rating: 4.5, reviews: 94, seller: 'Amit K.', aiScore: 86, greenCoins: 240, co2Saved: '12.4 kg', icon: '⌚', freeDelivery: true, prime: true },
  { id: 'p2p4', name: 'Kindle Paperwhite (10th Gen) 8GB Waterproof', price: 6500, originalPrice: 12999, grade: 'B', rating: 4.6, reviews: 52, seller: 'Neha P.', aiScore: 88, greenCoins: 50, co2Saved: '0.6 kg', icon: '📚', freeDelivery: true, prime: true }
];

const P2P_API_URL = import.meta.env.VITE_ECOBRIDGE_API_URL || 'https://4w990xpwkg.execute-api.ap-south-1.amazonaws.com/prod';

// Past Purchases mock data
const PAST_PURCHASES = [
  { id: 'past1', name: 'Logitech G502 Hero High Performance Gaming Mouse', originalPrice: 4500, purchaseDate: '3 months ago', icon: '🖱️', defaultGrade: 'A', estPrice: 2200, estCoins: 80, estCo2: '1.2 kg' },
  { id: 'past2', name: 'Cosmic Byte CB-GK-16 Firefly Mechanical Keyboard', originalPrice: 2100, purchaseDate: '6 months ago', icon: '⌨️', defaultGrade: 'B', estPrice: 900, estCoins: 40, estCo2: '0.8 kg' },
  { id: 'past3', name: 'OnePlus Bullets Wireless Z2 Bluetooth Earphones', originalPrice: 1999, purchaseDate: '1 month ago', icon: '🎧', defaultGrade: 'A', estPrice: 1100, estCoins: 50, estCo2: '0.5 kg' }
];

export function SecondLifePage({ 
  onGoToCart, 
  onAddToCart, 
  onBackToStorefront,
  userEcoCredits,
  setUserEcoCredits,
  userCo2Saved,
  setUserCo2Saved
}: SecondLifePageProps) {
  const [p2pProducts, setP2pProducts] = useState<P2PProduct[]>(INITIAL_P2P_PRODUCTS);
  const [detailProductId, setDetailProductId] = useState<string | null>(null);

  // Fetch live approved P2P items from backend (silent fail on CORS)
  useEffect(() => {
    fetch(`${P2P_API_URL}/api/admin/items?facilityPincode=110001&listingStatus=LISTED`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.items?.length > 0) {
          const liveProducts: P2PProduct[] = data.items.map((item: any) => ({
            id: item.id,
            name: item.name + ' (AI Verified)',
            price: item.price || 2500,
            originalPrice: item.originalPrice || 4000,
            grade: item.grade || 'B',
            rating: 4.7,
            reviews: Math.floor(Math.random() * 50) + 10,
            seller: item.seller || item.sellerName || 'EcoBridge Seller',
            aiScore: item.aiScore || 85,
            greenCoins: item.grade === 'A' ? 180 : item.grade === 'B' ? 120 : 60,
            co2Saved: item.carbonSaved || '8.2 kg',
            icon: item.icon || '♻️',
            freeDelivery: true,
            prime: true,
          }));
          setP2pProducts(prev => [...liveProducts, ...prev.filter(p => !liveProducts.some(l => l.id === p.id))]);
        }
      })
      .catch(() => {}); // Fall back to initial products if CORS blocked
  }, []);
  
  // Scanning flow states
  const [scanStep, setScanStep] = useState<'select' | 'scanning' | 'results' | 'success'>('select');
  const [selectedPastId, setSelectedPastId] = useState<string>('past1');
  const [scanProgress, setScanProgress] = useState(0);
  const webcamRef = useRef<Webcam>(null);
  
  // Calculator states
  const [calcCategory, setCalcCategory] = useState<'phone' | 'laptop' | 'audio' | 'gaming'>('phone');
  const [calcAge, setCalcAge] = useState<number>(6); // in months
  const [calcGrade, setCalcGrade] = useState<'A' | 'B' | 'C'>('A');

  // Scanner Progress Simulation
  useEffect(() => {
    let timer: any;
    if (scanStep === 'scanning') {
      setScanProgress(0);
      timer = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(timer);
            setScanStep('results');
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    }
    return () => clearInterval(timer);
  }, [scanStep]);

  const handleStartScan = () => {
    setScanStep('scanning');
  };

  const getSelectedPastItem = () => {
    return PAST_PURCHASES.find(item => item.id === selectedPastId) || PAST_PURCHASES[0];
  };

  const handleConfirmList = () => {
    const selectedItem = getSelectedPastItem();
    
    // Add to P2P marketplace state
    const newProduct: P2PProduct = {
      id: `p2p_user_${Date.now()}`,
      name: `${selectedItem.name} (AI Certified)`,
      price: selectedItem.estPrice,
      originalPrice: selectedItem.originalPrice,
      grade: selectedItem.defaultGrade as 'A' | 'B' | 'C',
      rating: 5.0,
      reviews: 1,
      seller: 'You (Self-Listed)',
      aiScore: selectedItem.defaultGrade === 'A' ? 95 : 85,
      greenCoins: selectedItem.estCoins,
      co2Saved: selectedItem.estCo2,
      icon: selectedItem.icon,
      freeDelivery: true,
      prime: false
    };

    setP2pProducts([newProduct, ...p2pProducts]);
    
    // Update user stats
    setUserEcoCredits(prev => prev + selectedItem.estCoins);
    setUserCo2Saved(prev => prev + parseFloat(selectedItem.estCo2));
    
    setScanStep('success');
    setTimeout(() => {
      setScanStep('select');
    }, 4000);
  };

  // Calculator logic
  const calculateEcoEstimate = () => {
    let basePrice = 25000;
    let baseCo2 = 15; // kg
    
    if (calcCategory === 'laptop') { basePrice = 60000; baseCo2 = 45; }
    else if (calcCategory === 'audio') { basePrice = 12000; baseCo2 = 4; }
    else if (calcCategory === 'gaming') { basePrice = 15000; baseCo2 = 8; }

    // age depreciation
    let ageFactor = 1.0;
    if (calcAge > 24) ageFactor = 0.3;
    else if (calcAge > 12) ageFactor = 0.5;
    else if (calcAge > 6) ageFactor = 0.7;
    else ageFactor = 0.85;

    // condition grade factor
    let gradeFactor = 1.0;
    if (calcGrade === 'B') gradeFactor = 0.8;
    else if (calcGrade === 'C') gradeFactor = 0.5;

    const priceEst = Math.round(basePrice * ageFactor * gradeFactor);
    const coinsEst = Math.round(priceEst * 0.05); // 5% back in coins
    const co2Est = (baseCo2 * (gradeFactor === 1.0 ? 1.0 : gradeFactor === 0.8 ? 0.75 : 0.55)).toFixed(1);

    return { priceEst, coinsEst, co2Est };
  };

  const calcResult = calculateEcoEstimate();

  const handleAdd = (product: P2PProduct) => {
    if (onAddToCart) {
      onAddToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        grade: product.grade,
        rating: product.rating,
        reviews: product.reviews,
        type: 'p2p',
        seller: product.seller,
        aiScore: product.aiScore,
        greenCoins: product.greenCoins,
        co2Saved: product.co2Saved,
        icon: product.icon,
        freeDelivery: product.freeDelivery,
        prime: product.prime
      });
    }
  };

  return (
    <div className="bg-[#EAEDED] min-h-screen pb-16">

      {/* P2P Product Detail Overlay */}
      {detailProductId && (
        <div className="fixed inset-0 z-50 bg-[#EAEDED] overflow-y-auto">
          <P2PProductDetail 
            productId={detailProductId} 
            onBack={() => setDetailProductId(null)} 
            onAddToCart={onAddToCart}
          />
        </div>
      )}
      
      {/* ─── GREEN SUITE SUBHEADER ─── */}
      <div className="bg-[#0F5132] text-white py-8 px-6 md:px-12 relative overflow-hidden shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.3),transparent_60%)] pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <button 
              onClick={onBackToStorefront}
              className="inline-flex items-center gap-1 text-emerald-350 hover:text-white font-semibold text-xs transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
            </button>
            <div className="flex items-center gap-3">
              <Recycle className="w-8 h-8 text-emerald-400" />
              <h1 className="text-3xl font-extrabold tracking-tight">SecondLife Circular Hub</h1>
            </div>
            <p className="text-emerald-100 text-sm max-w-xl">
              Inspected by AI. Trusted by Amazon. Prevent landfills and earn Eco Credits by listing and buying verified pre-owned items.
            </p>
          </div>

          {/* User Scorecard Card */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-5 w-full md:w-80 shrink-0 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-xs text-emerald-200 font-bold uppercase tracking-wider">Your Impact Dashboard</span>
              <span className="bg-[#FF9900] text-gray-900 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Circular Level 3</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] text-emerald-200 font-semibold uppercase">Eco Credits</div>
                <div className="text-xl font-bold flex items-center gap-1 mt-0.5">
                  <Coins className="w-4.5 h-4.5 text-[#FF9900]" />
                  <span>{userEcoCredits.toLocaleString()}</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] text-emerald-200 font-semibold uppercase">Total CO₂ Saved</div>
                <div className="text-xl font-bold flex items-center gap-1 mt-0.5 text-emerald-300">
                  <Leaf className="w-4.5 h-4.5 text-emerald-400" />
                  <span>{userCo2Saved.toFixed(1)} kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* ─── LEFT COLUMN: P2P MARKETPLACE (8 Cols) ─── */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Active Listings Grid */}
          <div className="bg-white rounded-lg border border-gray-250 p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-150 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Active Peer-to-Peer Listings</h2>
              </div>
              <span className="text-xs text-gray-500 font-medium">{p2pProducts.length} items listed</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {p2pProducts.map((product) => {
                const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
                return (
                  <div 
                    key={product.id}
                    className="bg-white border border-[#D5D9D9] rounded flex flex-col h-full hover:shadow-md transition-all relative group overflow-hidden"
                  >
                    {/* Condition badge & AI score */}
                    <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-sm shadow-sm ${
                        product.grade === 'A' ? 'bg-emerald-600 text-white' :
                        product.grade === 'B' ? 'bg-cyan-600 text-white' :
                        'bg-yellow-600 text-white'
                      }`}>
                        AI Grade {product.grade}
                      </span>
                      <span className="bg-[#131921] text-[#FF9900] text-[8px] font-black px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 shadow-sm">
                        AI Score: {product.aiScore}%
                      </span>
                    </div>

                    {/* Product visual area */}
                    <div className="h-40 bg-[#F7F8F8] border-b border-gray-150 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform duration-300">
                      {product.icon}
                    </div>

                    {/* Content details */}
                    <div className="p-4 flex flex-col grow justify-between space-y-3">
                      <div className="space-y-1">
                        <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-1">
                          <User className="w-3 h-3" /> Listed by {product.seller}
                        </div>
                        <h3 onClick={() => setDetailProductId(product.id)} className="font-bold text-sm text-[#007185] hover:text-[#C7511F] hover:underline line-clamp-2 leading-snug cursor-pointer">
                          {product.name}
                        </h3>
                        
                        {/* Rating row */}
                        <div className="flex items-center gap-1 pt-0.5">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <svg key={s} className="w-3 h-3 text-[#FF9900] fill-[#FF9900]" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
                            ))}
                          </div>
                          <span className="text-[10px] text-[#007185] font-semibold">{product.reviews} reviews</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {/* Prices */}
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs font-bold">₹</span>
                            <span className="text-lg font-extrabold text-gray-900 tracking-tight">{product.price.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-[#CC0C39] font-black">-{discount}% OFF</span>
                          </div>
                          <div className="text-[10px] text-gray-400">M.R.P: <span className="line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span></div>
                        </div>

                        {/* Sustainability values strip */}
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded p-2 text-[9px] flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1"><Leaf className="w-3 h-3 text-emerald-600" /> Offset: {product.co2Saved}</span>
                          <span className="flex items-center gap-0.5 text-yellow-700">+{product.greenCoins} 🪙 Credits</span>
                        </div>

                        {/* Add to Cart */}
                        <div className="space-y-1.5 pt-1">
                          <button
                            onClick={() => handleAdd(product)}
                            className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 border border-[#FCD200] font-bold py-1.5 rounded-full text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" /> Add P2P Item to Cart
                          </button>
                          <button
                            onClick={() => {
                              handleAdd(product);
                              if (onGoToCart) onGoToCart();
                            }}
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

          {/* Local Warehouse Network */}
          <div className="bg-white rounded-lg border border-gray-250 p-6 shadow-sm">
            <div className="flex items-center gap-2 border-b border-gray-150 pb-3 mb-4">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-gray-900 tracking-tight">Your Local EcoBridge Hubs</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4 leading-normal">
              Amazon's EcoBridge lockers allow local sellers and buyers to hand off products in under 5km. Dropoff shipping is completely instant and does not travel on standard long-haul courier sorting channels, bypassing up to 95% of standard carbon emissions.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { name: 'Connaught Place Locker CP-01', dist: '0.5 km away', capacity: '92% Available', offset: '98% CO₂ Saved', address: 'Block A, Inner Circle, CP, New Delhi' },
                { name: 'Karol Bagh Station Hub', dist: '2.1 km away', capacity: '85% Available', offset: '95% CO₂ Saved', address: 'Metro Stn Parking, Karol Bagh, New Delhi' },
                { name: 'Noida Sec-62 Eco Locker', dist: '14.5 km away', capacity: '40% Available', offset: '90% CO₂ Saved', address: 'Tech Park Locker Lobby, Sector 62, Noida' },
              ].map((locker, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50 flex flex-col justify-between shadow-xs">
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-xs text-gray-900">{locker.name}</h4>
                      <span className="text-[8px] bg-emerald-600 text-white font-extrabold px-1 py-0.2 rounded-sm shrink-0">{locker.offset}</span>
                    </div>
                    <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">{locker.dist}</span>
                    <p className="text-[10px] text-gray-400 mt-1.5 leading-snug">{locker.address}</p>
                  </div>
                  <div className="text-[9px] text-gray-400 font-semibold mt-3 pt-1 border-t border-gray-200/80 flex items-center justify-between">
                    <span>Locker Occupancy:</span>
                    <span className="text-gray-600">{locker.capacity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: INTERACTIVE SCANNER & CALCULATOR (4 Cols) ─── */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* AI Condition Scanner Tool */}
          <div className="bg-white rounded-lg border border-gray-250 p-5 shadow-sm">
            <div className="flex items-center gap-1.5 border-b border-gray-150 pb-3 mb-4">
              <Camera className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-black text-gray-900 tracking-tight">AI Return & Resale Scanner</h2>
            </div>

            {/* Step 1: Select Item */}
            {scanStep === 'select' && (
              <div className="space-y-4">
                <p className="text-[11px] text-gray-400 leading-normal">
                  Select a past Amazon purchase to grade visually using computer vision and list instantly.
                </p>
                <div className="space-y-2.5">
                  {PAST_PURCHASES.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => setSelectedPastId(item.id)}
                      className={`p-3 rounded border flex items-center justify-between cursor-pointer transition-all ${
                        selectedPastId === item.id 
                          ? 'border-[#FF9900] bg-[#FFFBF0] shadow-xs' 
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex gap-2 items-center min-w-0">
                        <span className="text-2xl shrink-0">{item.icon}</span>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-gray-900 truncate">{item.name}</h4>
                          <span className="text-[9px] text-gray-400 font-medium">Bought {item.purchaseDate}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-emerald-700">~₹{item.estPrice}</div>
                        <span className="text-[8px] text-gray-400 font-bold block">Est. Value</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <button
                  onClick={handleStartScan}
                  className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 border border-[#FCD200] font-bold py-2 rounded-full text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer mt-4"
                >
                  <Camera className="w-4 h-4" /> Start Condition Scan
                </button>
              </div>
            )}

            {/* Step 2: Scanning (Camera Stream Overlay) */}
            {scanStep === 'scanning' && (
              <div className="space-y-4 text-center">
                <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider animate-pulse text-[#FF9900]">
                  AI RIG CALIBRATING...
                </p>
                
                <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-dashed border-[#FF9900]/40 bg-black">
                  <Webcam ref={webcamRef} audio={false} className="w-full h-full object-cover opacity-75" mirrored />
                  
                  {/* Neon scan beam */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-[#FF9900]/80 shadow-[0_0_8px_#FF9900] animate-scan-beam" />
                  
                  {/* Scanner sight box */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-40 h-40 border border-white/20 flex flex-col justify-between p-1">
                      <div className="flex justify-between w-full">
                        <div className="w-3 h-3 border-t-2 border-l-2 border-[#FF9900]" />
                        <div className="w-3 h-3 border-t-2 border-r-2 border-[#FF9900]" />
                      </div>
                      <div className="flex justify-between w-full">
                        <div className="w-3 h-3 border-b-2 border-l-2 border-[#FF9900]" />
                        <div className="w-3 h-3 border-b-2 border-r-2 border-[#FF9900]" />
                      </div>
                    </div>
                  </div>
                  
                  <span className="absolute bottom-2 left-0 w-full text-[10px] text-white font-bold bg-black/60 py-1">
                    Hold item 12 inches from lens
                  </span>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-[#FF9900] h-2 transition-all duration-300" style={{ width: `${scanProgress}%` }} />
                  </div>
                  <div className="text-[10px] text-gray-500 font-bold">Diagnosing structural integrity ({scanProgress}%)</div>
                </div>
              </div>
            )}

            {/* Step 3: Grade Results */}
            {scanStep === 'results' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-center">
                  <div className="inline-flex items-center gap-1 text-emerald-800 text-xs font-extrabold mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-600" /> Inspected successfully
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm">{getSelectedPastItem().name}</h3>
                </div>

                <div className="grid grid-cols-3 gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  <div>
                    <span className="text-[8px] text-gray-400 font-bold uppercase">Grade</span>
                    <div className="text-sm font-black text-emerald-700 mt-0.5">Grade {getSelectedPastItem().defaultGrade}</div>
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-400 font-bold uppercase">Value</span>
                    <div className="text-sm font-black text-gray-900 mt-0.5">₹{getSelectedPastItem().estPrice}</div>
                  </div>
                  <div>
                    <span className="text-[8px] text-gray-400 font-bold uppercase">Eco Credits</span>
                    <div className="text-sm font-black text-yellow-700 mt-0.5 flex justify-center items-center gap-0.5">
                      <span>+{getSelectedPastItem().estCoins}</span>🪙
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-gray-150 pt-3 text-xs text-gray-500 leading-normal">
                  <div className="flex justify-between font-bold">
                    <span>CO₂ Saved Offset Estimate:</span>
                    <span className="text-emerald-700">{getSelectedPastItem().estCo2}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Target Local Node Lockers:</span>
                    <span className="text-[#007185]">Connaught Place CP-01</span>
                  </div>
                </div>

                <button
                  onClick={handleConfirmList}
                  className="w-full bg-[#FF9900] hover:bg-[#F3A847] text-gray-900 font-bold py-2 rounded-full text-xs shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer mt-4"
                >
                  <Recycle className="w-4 h-4" /> Approve & List on Marketplace
                </button>
                <button
                  onClick={() => setScanStep('select')}
                  className="w-full text-gray-400 hover:text-gray-600 text-[10px] font-semibold text-center py-1.5 transition-colors cursor-pointer"
                >
                  Re-scan / Select different item
                </button>
              </div>
            )}

            {/* Step 4: Success state */}
            {scanStep === 'success' && (
              <div className="py-6 text-center space-y-4">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-gray-900">Listed Successfully!</h3>
                  <p className="text-[10px] text-gray-400 mt-1 leading-normal">
                    Your item has been certified by AI and is now live on the peer-to-peer listings. Your eco-credits reward (+{getSelectedPastItem().estCoins} 🪙) has been credited to your wallet.
                  </p>
                </div>
                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5 max-w-xs mx-auto text-[9px] text-emerald-800 font-bold">
                  Bypassed transit: Drop the item off at CP-01 Locker anytime within 24 hours.
                </div>
              </div>
            )}
          </div>

          {/* Eco Credits Value Estimator Slider Widget */}
          <div className="bg-white rounded-lg border border-gray-250 p-5 shadow-sm">
            <div className="flex items-center gap-1.5 border-b border-gray-150 pb-3 mb-4">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <h2 className="text-sm font-black text-gray-900 tracking-tight">Eco Credits Value Estimator</h2>
            </div>
            
            <p className="text-[11px] text-gray-400 mb-4 leading-normal">
              Estimate trade-in credits and carbon offsets before returning/selling.
            </p>

            <div className="space-y-4">
              {/* Category Select */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase block">Product Category</label>
                <select
                  value={calcCategory}
                  onChange={(e) => setCalcCategory(e.target.value as any)}
                  className="w-full text-xs border border-gray-250 bg-white rounded p-1.5 text-gray-800 outline-none"
                >
                  <option value="phone">Smartphone / Tablet</option>
                  <option value="laptop">Laptop / PC Monitor</option>
                  <option value="audio">Headphones / Wireless Audio</option>
                  <option value="gaming">Console / Gaming Peripheral</option>
                </select>
              </div>

              {/* Age Slider */}
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-gray-400">
                  <span>Product Age</span>
                  <span className="text-gray-800 lowercase font-medium">{calcAge} months old</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="36" 
                  value={calcAge} 
                  onChange={(e) => setCalcAge(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-gray-400 font-semibold px-0.5">
                  <span>New (1m)</span>
                  <span>1.5 yrs</span>
                  <span>3 yrs</span>
                </div>
              </div>

              {/* Condition grade buttons */}
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase block">Condition Grade</label>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { grade: 'A', desc: 'Excellent' },
                    { grade: 'B', desc: 'Good' },
                    { grade: 'C', desc: 'Fair' }
                  ].map((item) => (
                    <button
                      key={item.grade}
                      onClick={() => setCalcGrade(item.grade as any)}
                      className={`py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                        calcGrade === item.grade 
                          ? 'border-[#FF9900] bg-[#FFFBF0] text-[#FF9900]' 
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      }`}
                    >
                      {item.grade}
                      <span className="block text-[8px] font-normal text-gray-400">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Estimate results display */}
              <div className="bg-emerald-50/50 border border-emerald-200/50 rounded-lg p-3 space-y-2 mt-4">
                <div className="flex justify-between items-center border-b border-emerald-200/30 pb-2">
                  <span className="text-xs text-emerald-800 font-bold">Estimated Eco Credits:</span>
                  <span className="text-base font-extrabold text-yellow-700 flex items-center gap-0.5">
                    {calcResult.coinsEst.toLocaleString()} 🪙
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-emerald-800 font-bold">
                  <span>Carbon Offset Estimate:</span>
                  <span className="text-emerald-700">{calcResult.co2Est} kg CO₂</span>
                </div>
                <div className="flex justify-between items-center text-[11px] text-emerald-800 font-bold">
                  <span>Resale Listing Price M.R.P:</span>
                  <span className="text-gray-900">₹{calcResult.priceEst.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
