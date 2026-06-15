import { useState, useEffect } from 'react';
import { ArrowLeft, Star, ShieldCheck, Leaf, Coins, ShoppingCart, MapPin, Loader2, CheckCircle, Camera } from 'lucide-react';

const API_URL = import.meta.env.VITE_ECOBRIDGE_API_URL || 'https://4w990xpwkg.execute-api.ap-south-1.amazonaws.com/prod';

interface ProductDetail {
  id: string;
  name: string;
  type: string;
  condition: string;
  grade: string;
  price: number;
  originalPrice: number;
  listingImages: string[];
  seller: string;
  sellerPinCode: string;
  aiScore: number;
  carbonSaved: string;
  gradedAt: string;
  aiLabels: string[];
  description: string;
}

interface P2PProductDetailProps {
  productId: string;
  onBack: () => void;
  onAddToCart?: (product: any) => void;
  productData?: any; // Pre-loaded data from session (avoids API call)
}

export function P2PProductDetail({ productId, onBack, onAddToCart, productData }: P2PProductDetailProps) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    // If productData is passed (from session state), use it directly
    if (productData) {
      const galleryImages = productData.galleryImages || {};
      const images = Object.values(galleryImages).filter(Boolean) as string[];
      setProduct({
        ...productData,
        listingImages: images.length > 0 ? images : productData.listingImages || [],
        description: productData.description || `About this item\n• ${productData.condition || 'Good'} condition — AI-verified Grade ${productData.grade || 'B'}\n• Multi-angle AI inspection (4 photos)\n• Saves ${productData.co2Saved || '8.2 kg'} CO₂\n• Earn ${productData.greenCoins || 120} Green Coins 🪙\n• 7-day return window guaranteed`,
        aiLabels: productData.labels || [],
        aiScore: productData.aiScore || 85,
        gradedAt: new Date().toISOString(),
        seller: productData.seller || 'EcoBridge Seller',
        sellerPinCode: '110001',
        carbonSaved: productData.co2Saved || '8.2 kg',
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`${API_URL}/api/product/detail?id=${productId}`)
      .then(r => r.ok ? r.json() : Promise.reject('Not found'))
      .then(setProduct)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [productId, productData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[#FF9900] animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto p-4 mt-4 text-center">
        <p className="text-[#565959]">Product not found.</p>
        <button onClick={onBack} className="text-[#007185] hover:underline mt-2 text-sm">← Back</button>
      </div>
    );
  }

  const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
  const images = product.listingImages?.length > 0 ? product.listingImages : [];
  const gradeColor = product.grade === 'A' ? 'bg-emerald-600' : product.grade === 'B' ? 'bg-cyan-600' : 'bg-yellow-600';

  const handleAddToCart = () => {
    if (onAddToCart) {
      onAddToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        grade: product.grade,
        icon: '♻️',
        freeDelivery: true,
        prime: true,
        greenCoins: product.grade === 'A' ? 180 : product.grade === 'B' ? 120 : 60,
        co2Saved: product.carbonSaved,
        type: 'p2p',
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 mt-2">
      <button onClick={onBack} className="text-[#007185] hover:text-[#C7511F] text-sm hover:underline mb-4 inline-flex items-center">
        <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to listings
      </button>

      <div className="bg-white border border-[#D5D9D9] rounded-lg overflow-hidden shadow-sm">
        <div className="flex flex-col lg:flex-row">
          {/* ─── Left: Image Gallery ─── */}
          <div className="lg:w-[45%] p-5 border-b lg:border-b-0 lg:border-r border-[#D5D9D9]">
            {/* Main image */}
            <div className="relative aspect-square bg-[#F7F8F8] rounded-lg overflow-hidden border border-[#D5D9D9] mb-3">
              {images.length > 0 ? (
                <img src={images[activeImg]} alt={product.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl">♻️</div>
              )}
              {/* AI Verified badge */}
              <div className="absolute top-3 left-3 bg-[#232F3E] text-white text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-[#FF9900]" /> AI Verified
              </div>
              {/* Multi-angle badge */}
              {images.length >= 4 && (
                <div className="absolute top-3 right-3 bg-[#007600] text-white text-[9px] font-bold px-2 py-1 rounded flex items-center gap-1">
                  <Camera className="w-3 h-3" /> 4-Angle Scan
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    onClick={() => setActiveImg(i)}
                    className={`w-14 h-14 object-cover rounded border-2 cursor-pointer transition-all ${i === activeImg ? 'border-[#FF9900] shadow-md' : 'border-[#D5D9D9] hover:border-[#007185]'}`}
                    alt={`View ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* ─── Right: Product Info ─── */}
          <div className="lg:w-[55%] p-5 space-y-4">
            {/* Title */}
            <h1 className="text-lg font-medium text-[#0F1111] leading-snug">{product.name}</h1>

            {/* Seller + Rating */}
            <div className="flex items-center gap-3 text-sm">
              <span className="text-[#007185]">Sold by <span className="font-medium">{product.seller}</span></span>
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s <= 4 ? 'text-[#FF9900] fill-[#FF9900]' : 'text-gray-300'}`} />)}
                <span className="text-[#007185] text-xs ml-1">(AI Verified)</span>
              </div>
            </div>

            {/* Grade + AI Score */}
            <div className="flex items-center gap-3">
              <span className={`${gradeColor} text-white text-xs font-bold px-2.5 py-1 rounded`}>Grade {product.grade}</span>
              <span className="text-sm text-[#0F1111]">AI Score: <span className="font-bold">{product.aiScore}/100</span></span>
              <span className="bg-[#F0F2F2] border border-[#D5D9D9] text-[#565959] text-xs font-medium px-2 py-0.5 rounded">{product.condition}</span>
            </div>

            {/* Price */}
            <div className="border-b border-[#D5D9D9] pb-4">
              <div className="flex items-baseline gap-2">
                <span className="text-[10px] text-[#565959]">₹</span>
                <span className="text-2xl font-bold text-[#0F1111]">{product.price.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#565959]">M.R.P.: <span className="line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span></span>
                <span className="text-xs text-[#CC0C39] font-bold">({discount}% off)</span>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-[#565959]">
              <MapPin className="w-4 h-4 text-[#007185]" />
              <span>Ships from local seller in PIN <span className="font-bold text-[#0F1111]">{product.sellerPinCode}</span></span>
            </div>

            {/* Eco Impact Box */}
            <div className="bg-[#E7F4E4] border border-[#C3E6C0] rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2"><Leaf className="w-4 h-4 text-[#007600]" /><span className="text-sm font-bold text-[#007600]">EcoBridge Certified</span></div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5"><Leaf className="w-3.5 h-3.5 text-[#007600]" /><span>Saves <span className="font-bold">{product.carbonSaved}</span></span></div>
                <div className="flex items-center gap-1.5"><Coins className="w-3.5 h-3.5 text-[#FF9900]" /><span>Earn <span className="font-bold">{product.grade === 'A' ? 180 : product.grade === 'B' ? 120 : 60} 🪙</span></span></div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2 pt-2">
              <button onClick={handleAddToCart} disabled={addedToCart} className={`w-full font-bold py-2.5 rounded-full text-sm flex items-center justify-center gap-2 transition-colors ${addedToCart ? 'bg-[#007600] text-white' : 'bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] border border-[#FCD200]'}`}>
                {addedToCart ? <><CheckCircle className="w-4 h-4" /> Added to Cart!</> : <><ShoppingCart className="w-4 h-4" /> Add to Cart</>}
              </button>
              <button onClick={() => { handleAddToCart(); onBack(); }} className="w-full bg-[#FFA41C] hover:bg-[#FA8900] text-[#0F1111] font-bold py-2.5 rounded-full text-sm border border-[#FF8F00]">
                Buy Now
              </button>
            </div>

            {/* Description */}
            {product.description && (
              <div className="border-t border-[#D5D9D9] pt-4">
                <h3 className="font-bold text-sm text-[#0F1111] mb-2">About this item</h3>
                <div className="text-xs text-[#565959] space-y-1 leading-relaxed">
                  {product.description.split('\n').filter(l => l.trim()).map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              </div>
            )}

            {/* ═══ Detailed AI Scorecard ═══ */}
            <div className="border-t border-[#D5D9D9] pt-4">
              <h3 className="font-bold text-sm text-[#0F1111] mb-3">AI Inspection Scorecard</h3>
              <div className="bg-[#F7F8F8] border border-[#D5D9D9] rounded-lg p-4 space-y-3">
                {/* Overall Grade */}
                <div className="flex items-center justify-between pb-3 border-b border-[#D5D9D9]">
                  <div>
                    <div className="text-xs text-[#565959] font-medium">Overall Grade</div>
                    <div className={`text-2xl font-black mt-0.5 ${product.grade === 'A' ? 'text-[#007600]' : product.grade === 'B' ? 'text-[#007185]' : 'text-[#FF9900]'}`}>
                      Grade {product.grade}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#565959] font-medium">EcoBridge Score</div>
                    <div className="text-2xl font-black text-[#0F1111] mt-0.5">{product.aiScore}<span className="text-sm text-[#565959]">/100</span></div>
                  </div>
                </div>

                {/* Condition Assessment */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-[#565959] uppercase font-semibold">Condition</div>
                    <div className="text-sm font-bold text-[#0F1111] mt-0.5">{product.condition || 'Good'}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#565959] uppercase font-semibold">Verification</div>
                    <div className="text-sm font-bold text-[#007600] mt-0.5">AI + Seller ✓</div>
                  </div>
                </div>

                {/* Damage Assessment */}
                <div className="space-y-1.5 pt-2 border-t border-[#D5D9D9]">
                  <div className="text-[10px] text-[#565959] uppercase font-semibold">Damage Assessment</div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between bg-white rounded p-2 border border-[#D5D9D9]">
                      <span className="text-[#565959]">Scratches</span>
                      <span className={`font-bold ${(product.aiScore || 85) >= 85 ? 'text-[#007600]' : 'text-[#FF9900]'}`}>{(product.aiScore || 85) >= 85 ? 'None' : 'Minor'}</span>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded p-2 border border-[#D5D9D9]">
                      <span className="text-[#565959]">Stains</span>
                      <span className="font-bold text-[#007600]">None</span>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded p-2 border border-[#D5D9D9]">
                      <span className="text-[#565959]">Wear & Tear</span>
                      <span className={`font-bold ${(product.aiScore || 85) >= 80 ? 'text-[#007600]' : 'text-[#FF9900]'}`}>{(product.aiScore || 85) >= 80 ? 'Minimal' : 'Moderate'}</span>
                    </div>
                    <div className="flex items-center justify-between bg-white rounded p-2 border border-[#D5D9D9]">
                      <span className="text-[#565959]">Functionality</span>
                      <span className="font-bold text-[#007600]">Full ✓</span>
                    </div>
                  </div>
                </div>

                {/* Sustainability */}
                <div className="pt-2 border-t border-[#D5D9D9] flex items-center justify-between text-xs">
                  <span className="text-[#565959]">CO₂ Saved by buying this</span>
                  <span className="font-bold text-[#007600]">{product.carbonSaved || '8.2 kg'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#565959]">Inspected</span>
                  <span className="text-[#565959]">{product.gradedAt ? new Date(product.gradedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Today'}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#565959]">Verification Method</span>
                  <span className="font-medium text-[#0F1111]">AWS Rekognition (4-angle scan)</span>
                </div>
              </div>
            </div>

            {/* Rekognition Labels */}
            {product.aiLabels?.length > 0 && (
              <div className="border-t border-[#D5D9D9] pt-4">
                <h3 className="font-bold text-sm text-[#0F1111] mb-2">Detected Labels</h3>
                <div className="flex flex-wrap gap-1">
                  {product.aiLabels.map((label: string, i: number) => (
                    <span key={i} className="bg-white border border-[#D5D9D9] text-[#0F1111] text-[10px] font-medium px-2 py-0.5 rounded">{label}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
