import { useState } from 'react';
import { ArrowLeft, Sparkles, Tag } from 'lucide-react';
import type { ReturnItem } from './mockData';

interface AiInspectionPageProps {
  returnId: string;
  returns: ReturnItem[];
  onBack: () => void;
  onUpdateReturn: (id: string, updates: Partial<ReturnItem>) => void;
}

export function AiInspectionPage({ returnId, returns, onBack, onUpdateReturn }: AiInspectionPageProps) {
  const item = returns.find(r => r.id === returnId) || returns[0];
  const selectedImageIdx = 0;
  const [localDecision, setLocalDecision] = useState(item.aiDecision);

  // SVG Gauge calculations
  const gaugeRadius = 50;
  const gaugeCircumference = 2 * Math.PI * gaugeRadius;
  const strokeDashoffset = gaugeCircumference - (item.conditionScore / 100) * gaugeCircumference;

  const handleOverrideSave = () => {
    onUpdateReturn(item.id, { 
      aiDecision: localDecision, 
      status: localDecision === item.aiDecision ? 'Approved' : 'Overridden' 
    });
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <div>
        <button 
          onClick={onBack}
          className="text-sm font-semibold text-[#007185] hover:text-[#C7511F] hover:underline flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Returns Queue
        </button>
      </div>

      {/* Main Inspection Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visual Inspection Panel (Left & Center) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card Header & Bounding Box Visualizer */}
          <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Visual Inspection Log</span>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-1">{item.product}</h2>
              <p className="text-xs text-gray-500 mt-1">Returned by <span className="font-semibold">{item.customer}</span> on {item.date}</p>
            </div>

            {/* Bounding Box Image Preview */}
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 flex items-center justify-center select-none group">
              
              {/* Product Large Icon Representative */}
              <span className="text-[120px] filter drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
                {item.images[selectedImageIdx] || '📦'}
              </span>

              {/* Bounding box mock overlay (damage indicator overlay) */}
              {item.id === 'RET001' && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Mock Bounding Box */}
                  <div className="absolute top-1/3 left-1/4 w-32 h-16 border-2 border-dashed border-[#FF9900] bg-[#FF9900]/10 flex flex-col justify-between p-1 rounded animate-pulse">
                    <span className="bg-[#FF9900] text-gray-900 text-[8px] font-bold px-1 rounded-sm w-fit uppercase tracking-wider">Minor Scratch</span>
                  </div>
                  <div className="absolute top-2/3 right-1/4 w-28 h-20 border-2 border-dashed border-[#007600] bg-[#007600]/10 flex flex-col justify-between p-1 rounded">
                    <span className="bg-[#007600] text-white text-[8px] font-bold px-1 rounded-sm w-fit uppercase tracking-wider">Open Box Packaging</span>
                  </div>
                </div>
              )}

              {item.id === 'RET002' && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/4 right-1/3 w-24 h-24 border-2 border-dashed border-cyan-500 bg-cyan-500/10 flex flex-col justify-between p-1 rounded animate-pulse">
                    <span className="bg-cyan-500 text-white text-[8px] font-bold px-1 rounded-sm w-fit uppercase tracking-wider">Scroll Chamber Dust</span>
                  </div>
                </div>
              )}

              <div className="absolute bottom-3 left-3 bg-black/75 text-white text-[10px] font-bold px-2.5 py-1 rounded backdrop-blur">
                BLR-03 / Cam_Inlet_02 · Bounding Box Overlay Active
              </div>
            </div>

            {/* Damage Tags List */}
            <div className="flex flex-wrap gap-2 pt-2">
              {item.damageLabels.map((lbl, idx) => (
                <span 
                  key={idx} 
                  className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded bg-[#FF9900]/10 text-[#E08800] border border-[#FF9900]/20"
                >
                  <Tag className="w-3.5 h-3.5" /> {lbl}
                </span>
              ))}
            </div>
          </div>

          {/* AI Scorecard & Explanation */}
          <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-gray-150 dark:border-gray-800 pb-3">
              <Sparkles className="w-5 h-5 text-[#FF9900]" />
              <h3 className="text-base font-bold text-gray-900 dark:text-white">AI Diagnostic Assessment</h3>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">Customer Reason for Return</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 italic bg-gray-50 dark:bg-gray-900/50 p-3 rounded border border-gray-150 dark:border-gray-800">
                  "{item.reason}"
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                
                {/* Visual Analysis Panel */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded border border-gray-150 dark:border-gray-800 space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400">AWS Rekognition Labels</h5>
                  <ul className="text-xs font-medium space-y-2 text-gray-700 dark:text-gray-300">
                    <li className="flex justify-between"><span>Electronics / Audio Equipment</span><span className="font-mono text-emerald-600 dark:text-emerald-500">99%</span></li>
                    <li className="flex justify-between"><span>Headphones / Headset</span><span className="font-mono text-emerald-600 dark:text-emerald-500">97%</span></li>
                    <li className="flex justify-between"><span>Cosmetic Scratch Damage</span><span className="font-mono text-amber-600 dark:text-amber-500">88%</span></li>
                  </ul>
                </div>

                {/* Claude Scoring Ledger */}
                <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded border border-gray-150 dark:border-gray-800 space-y-3">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-gray-400">Claude Routing Rationale</h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Minor cosmetic defect (scratch) detected on back chassis. Functionality checks out fully. Recommended resale routing (Amazon Renewed, Grade B) recovers optimal value of ₹22,000.
                  </p>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Diagnostic Scorecard & Override Panel (Right Sidebar) */}
        <div className="space-y-6">
          
          {/* Condition Gauge Card */}
          <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center text-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Inspection Grade Score</span>
            
            {/* SVG Circular Gauge */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Ring */}
                <circle 
                  cx="80" 
                  cy="80" 
                  r={gaugeRadius} 
                  className="stroke-gray-100 dark:stroke-gray-800" 
                  strokeWidth="12" 
                  fill="transparent" 
                />
                {/* Value Circle */}
                <circle 
                  cx="80" 
                  cy="80" 
                  r={gaugeRadius} 
                  className={`${
                    item.conditionScore >= 85 ? 'stroke-emerald-500' :
                    item.conditionScore >= 70 ? 'stroke-cyan-500' :
                    item.conditionScore >= 50 ? 'stroke-yellow-500' :
                    'stroke-rose-500'
                  } transition-all duration-1000 ease-out`} 
                  strokeWidth="12" 
                  fill="transparent" 
                  strokeDasharray={gaugeCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              {/* Gauge Text Overlay */}
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">{item.conditionScore}</span>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 uppercase font-bold tracking-wider">out of 100</span>
              </div>
            </div>

            {/* Recommendations block */}
            <div className="w-full mt-6 grid grid-cols-2 gap-3 border-t border-gray-150 dark:border-gray-800 pt-5 text-left text-xs">
              <div>
                <span className="text-gray-400 block font-semibold mb-0.5">AI Routing</span>
                <span className="font-bold text-gray-900 dark:text-white text-sm">{item.aiDecision}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-semibold mb-0.5">Confidence</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-500 text-sm">{item.confidence}%</span>
              </div>
              <div className="mt-2.5">
                <span className="text-gray-400 block font-semibold mb-0.5">Resale Est.</span>
                <span className="font-bold text-gray-900 dark:text-white text-sm">₹{item.estimatedResalePrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="mt-2.5">
                <span className="text-gray-400 block font-semibold mb-0.5">Original Cost</span>
                <span className="font-medium text-gray-400 line-through text-sm">₹{item.originalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-sm font-bold text-gray-950 dark:text-white mb-4 border-b border-gray-150 dark:border-gray-800 pb-2">Inspection Timeline</h3>
            <div className="space-y-4">
              {item.timeline.map((step, idx) => (
                <div key={idx} className="flex gap-3 relative text-xs">
                  {/* Connector vertical line */}
                  {idx !== item.timeline.length - 1 && (
                    <div className="absolute left-2.5 top-5 bottom-[-20px] w-0.5 bg-gray-200 dark:bg-gray-800" />
                  )}
                  {/* Bullets */}
                  <div className={`w-5 h-5 rounded-full border-4 border-white dark:border-[#1A222D] shrink-0 z-10 ${
                    step.completed ? 'bg-emerald-500 shadow-sm' : 'bg-gray-300 dark:bg-gray-800 animate-pulse'
                  }`} />
                  {/* Text details */}
                  <div className="space-y-0.5">
                    <h4 className={`font-bold ${step.completed ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-500'}`}>{step.stage}</h4>
                    <p className="text-[10px] text-gray-400">{step.date}</p>
                    <p className="text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{step.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Override Control Panel */}
          <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-gray-950 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-2">Operations Approval</h3>
            
            <div className="space-y-3.5">
              <div className="text-xs">
                <span className="text-gray-400 block font-semibold mb-1">Status:</span>
                <span className="font-bold">{item.status}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Manual Routing Selection</label>
                <select
                  value={localDecision}
                  onChange={(e) => setLocalDecision(e.target.value as ReturnItem['aiDecision'])}
                  className="w-full text-xs font-semibold px-3 py-2 border border-gray-300 dark:border-gray-800 rounded bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 outline-none focus:border-[#FF9900]"
                >
                  <option value="Resell">Resell (Renewed / Storefront)</option>
                  <option value="Refurbish">Refurbish (Warehouse Refit)</option>
                  <option value="Recycle">Recycle (Eco-Waste Destruction)</option>
                  <option value="Donate">Donate (Charitable Giving)</option>
                </select>
              </div>

              <button
                onClick={handleOverrideSave}
                className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-gray-900 border border-[#FCD200] font-bold py-2 rounded-full transition-colors text-xs text-center shadow-sm"
              >
                Approve & Execute Route
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
