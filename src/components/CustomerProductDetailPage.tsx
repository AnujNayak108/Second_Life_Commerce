import { Star, MapPin, Truck, ShieldCheck, ArrowLeft, Heart, Share2, Info } from 'lucide-react';
import { type Product } from './CustomerStorefrontPage';
import { useState } from 'react';

interface CustomerProductDetailPageProps {
  product: Product;
  onBack: () => void;
  onAddToCart: (p: Product) => void;
  onBuyNow: (p: Product) => void;
}

export function CustomerProductDetailPage({ product, onBack, onAddToCart, onBuyNow }: CustomerProductDetailPageProps) {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="max-w-[1500px] mx-auto bg-white min-h-screen">
      {/* Breadcrumb & Nav */}
      <div className="bg-[#EAEDED] px-4 py-2 text-sm text-[#565959] flex items-center gap-2">
        <button onClick={onBack} className="hover:text-[#0F1111] hover:underline flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back to results
        </button>
        <span>›</span>
        <span>Electronics</span>
      </div>

      <div className="flex flex-col md:flex-row p-4 gap-8">
        {/* Left: Image Gallery */}
        <div className="w-full md:w-[40%] flex flex-col items-center">
          <div className="w-full aspect-square bg-[#F7F8F8] border border-[#D5D9D9] flex items-center justify-center text-[180px] rounded mb-4">
            {product.icon}
          </div>
          <div className="flex gap-2 w-full justify-center">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-16 h-16 border border-[#D5D9D9] hover:border-[#007185] bg-[#F7F8F8] flex items-center justify-center text-3xl cursor-pointer rounded">
                {product.icon}
              </div>
            ))}
          </div>
        </div>

        {/* Center: Details */}
        <div className="w-full md:w-[35%]">
          <h1 className="text-2xl font-medium text-[#0F1111] leading-tight mb-2">
            {product.name}
          </h1>
          <div className="flex items-center gap-4 text-sm text-[#007185] mb-2 border-b border-[#D5D9D9] pb-2">
            <span className="flex items-center text-[#FFA41C]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-current' : 'text-gray-300'}`} />
              ))}
              <span className="text-[#007185] hover:text-[#C7511F] hover:underline ml-2 cursor-pointer">{product.reviews} ratings</span>
            </span>
          </div>

          <div className="mb-4 flex items-end gap-2">
            <span className="text-xl text-[#CC0C39] font-light">-15%</span>
            <span className="text-3xl font-medium text-[#0F1111] flex items-start">
              <span className="text-sm mt-1">₹</span>
              {product.price.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="text-sm text-[#565959] mb-4">
            M.R.P.: <span className="line-through">₹{product.originalPrice.toLocaleString('en-IN')}</span>
          </div>

          <div className="mb-4">
            <p className="text-sm text-[#0F1111] mb-1"><b>Save Extra</b> with 3 offers</p>
            <ul className="text-sm text-[#0F1111] list-disc pl-4 space-y-1">
              <li><b>Bank Offer:</b> 10% instant discount up to ₹1,500 on SBI Credit Card</li>
              <li><b>Exchange Offer:</b> Up to ₹5,000 off on exchange</li>
            </ul>
          </div>

          <div className="flex flex-col gap-4 border-t border-[#D5D9D9] pt-4 mt-4">
            <div className="flex items-center gap-4 text-sm text-[#0F1111]">
              <div className="flex flex-col items-center gap-1 text-[#007185]">
                <Truck className="w-6 h-6" />
                <span className="text-[10px] text-center w-16">Free Delivery</span>
              </div>
              <div className="flex flex-col items-center gap-1 text-[#007185]">
                <ShieldCheck className="w-6 h-6" />
                <span className="text-[10px] text-center w-16">1 Year Warranty</span>
              </div>
            </div>
            
            <div className="text-sm text-[#0F1111] mt-2 space-y-1">
              <div className="flex"><span className="w-32 font-bold">Brand</span><span>Premium Brand</span></div>
              <div className="flex"><span className="w-32 font-bold">Model Name</span><span>{product.name.split(' ')[0]} Pro</span></div>
              <div className="flex"><span className="w-32 font-bold">Color</span><span>Midnight Black</span></div>
            </div>
          </div>
        </div>

        {/* Right: Buy Box */}
        <div className="w-full md:w-[25%]">
          <div className="border border-[#D5D9D9] rounded-lg p-4 bg-white sticky top-[130px]">
            <div className="text-2xl font-medium text-[#0F1111] flex items-start mb-2">
              <span className="text-sm mt-1">₹</span>
              {product.price.toLocaleString('en-IN')}
            </div>
            
            {product.prime && <div className="text-[#007185] text-sm font-bold mb-2">prime</div>}
            
            <p className="text-sm text-[#0F1111] mb-2">
              <span className="text-[#007185] hover:text-[#C7511F] hover:underline cursor-pointer">FREE delivery</span> <b>Tomorrow, June 15</b>. Order within 4 hrs 30 mins.
            </p>

            <div className="flex items-center gap-1 text-[#007185] text-sm hover:text-[#C7511F] hover:underline cursor-pointer mb-4">
              <MapPin className="w-4 h-4" /> Deliver to Amit - New Delhi 110001
            </div>

            <h3 className="text-lg text-[#007600] font-medium mb-4">In stock</h3>

            <div className="mb-4">
              <select 
                value={quantity} 
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="border border-[#D5D9D9] rounded-md p-1.5 text-sm bg-[#F0F2F2] shadow-sm outline-none focus:border-[#007185]"
              >
                {[1, 2, 3, 4, 5].map(q => <option key={q} value={q}>Quantity: {q}</option>)}
              </select>
            </div>

            <button 
              onClick={() => onAddToCart(product)}
              className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-[#0F1111] font-medium py-2 rounded-full text-sm border border-[#FCD200] mb-2 transition-colors"
            >
              Add to Cart
            </button>
            <button 
              onClick={() => onBuyNow(product)}
              className="w-full bg-[#FFA41C] hover:bg-[#FA8900] text-[#0F1111] font-medium py-2 rounded-full text-sm border border-[#FF8F00] transition-colors mb-4"
            >
              Buy Now
            </button>

            <div className="flex flex-col gap-1 text-xs text-[#565959] border-t border-[#D5D9D9] pt-3">
              <div className="flex justify-between"><span>Ships from</span><span>Amazon</span></div>
              <div className="flex justify-between"><span>Sold by</span><span className="text-[#007185]">RetailNet India</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
