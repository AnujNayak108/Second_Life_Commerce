import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Sparkles, DollarSign, Leaf, Lightbulb } from 'lucide-react';
import { PREVENTION_HEATMAP } from './mockData';

export function AnalyticsPage() {
  
  // Return prevention KPIs
  const preventionStats = [
    { label: 'AI Prevented Returns', value: '42', desc: 'Returns intercepted by storefront alternative recommendations', icon: Sparkles, color: 'text-emerald-500' },
    { label: 'Money Saved', value: '₹1,20,000', desc: 'Direct shipping & processing cost recovery', icon: DollarSign, color: 'text-yellow-500' },
    { label: 'Est. CO₂ Reduction', value: '75 kg', desc: 'Carbon offset through avoided logistics returns', icon: Leaf, color: 'text-green-500' }
  ];

  // Prevention History Trend Mock
  const trendData = [
    { month: 'Jan', prevented: 8, savedAmt: 22000 },
    { month: 'Feb', prevented: 12, savedAmt: 34000 },
    { month: 'Mar', prevented: 15, savedAmt: 42000 },
    { month: 'Apr', prevented: 22, savedAmt: 60000 },
    { month: 'May', prevented: 35, savedAmt: 98000 },
    { month: 'Jun', prevented: 42, savedAmt: 120000 }
  ];

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Return Prevention Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Review AI-driven return-prevention indicators, reasons diagnostic heatmaps, and financial savings.</p>
      </div>

      {/* Prevention KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {preventionStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div 
              key={i} 
              className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex items-start gap-4 hover:shadow-md transition-all"
            >
              <div className={`p-3 bg-gray-50 dark:bg-gray-900 rounded-lg shrink-0 ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">{stat.label}</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white block">{stat.value}</span>
                <p className="text-xs text-gray-500 leading-normal">{stat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Analytics Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Return Reasons Heatmap Diagnostic */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-950 dark:text-white">Diagnostic Return Reasons Heatmap</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Intersection of return reason volume rates across categories.</p>
          </div>
          
          {/* Heatmap Grid representation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            <div className="space-y-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block">Primary Reasons Breakdown</span>
              {PREVENTION_HEATMAP.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-150 dark:border-gray-800 flex justify-between items-center text-xs">
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white">{item.reason}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">Category: {item.category}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900 dark:text-white">{item.count} returns</div>
                    <div className="text-[10px] text-rose-500 font-bold">{item.rate}% rate</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Grid Visualization */}
            <div className="border border-gray-200 dark:border-gray-800 rounded p-4 flex flex-col justify-center bg-gray-50/50 dark:bg-gray-900/30">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center block mb-4">Risk Heat Matrix</span>
              <div className="grid grid-cols-3 grid-rows-3 gap-1.5 h-44 text-[10px] font-bold text-center">
                <div className="bg-rose-500 text-white rounded flex items-center justify-center p-1" title="High Risk">Fashion Size (35%)</div>
                <div className="bg-rose-400 text-white rounded flex items-center justify-center p-1" title="Medium High Risk">Elec Altern (25%)</div>
                <div className="bg-amber-400 text-gray-900 rounded flex items-center justify-center p-1" title="Medium Risk">Elec Acc (15%)</div>
                <div className="bg-amber-300 text-gray-900 rounded flex items-center justify-center p-1" title="Low Medium Risk">Home Remorse (10%)</div>
                <div className="bg-emerald-350 text-white rounded flex items-center justify-center p-1" title="Low Risk">Elec Defect (15%)</div>
                <div className="bg-gray-200 dark:bg-gray-800 text-gray-400 rounded flex items-center justify-center p-1">Others (5%)</div>
                <div className="bg-gray-250 dark:bg-gray-800 text-gray-400 rounded flex items-center justify-center p-1">Books (2%)</div>
                <div className="bg-gray-250 dark:bg-gray-800 text-gray-400 rounded flex items-center justify-center p-1">Toys (1%)</div>
                <div className="bg-gray-250 dark:bg-gray-800 text-gray-400 rounded flex items-center justify-center p-1">Automotive (0%)</div>
              </div>
              <div className="flex justify-between text-[9px] text-gray-400 mt-3 font-semibold px-2">
                <span>🟢 Low Risk</span>
                <span>🟡 Med Risk</span>
                <span>🔴 High Risk</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prevention Growth Trend Chart */}
        <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-950 dark:text-white">Interception Growth Trend</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Timeline view of returns successfully avoided.</p>
          </div>
          <div className="h-64 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-gray-800" />
                <XAxis dataKey="month" stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#19222D', border: '1px solid #374151', color: '#fff' }} />
                <Legend />
                <Bar dataKey="prevented" name="Returns Blocked" fill="#FF9900" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Machine Learning Prediction Widgets */}
      <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-gray-150 dark:border-gray-800 pb-3">
          <Sparkles className="w-5 h-5 text-[#FF9900]" />
          <h3 className="text-base font-bold text-gray-990 dark:text-white">AI Predictive Recommendations</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Sizing Recommendations */}
          <div className="p-4 bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-3.5">
            <div className="p-2.5 bg-amber-500/20 text-amber-600 rounded-lg h-fit shrink-0">
              <Lightbulb className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">Enable "Fit Finder" Sizing on Fashion Listings</h4>
              <p className="text-gray-650 dark:text-gray-400 leading-normal">
                Sizing mismatch in shoe size 9 represents <strong>35%</strong> of fashion returns. Enabling augmented sizing guides is projected to prevent <strong>15 returns next week</strong> (saving ₹45,000).
              </p>
            </div>
          </div>

          {/* Accessory Bundle recommendations */}
          <div className="p-4 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex gap-3.5">
            <div className="p-2.5 bg-emerald-500/20 text-emerald-600 rounded-lg h-fit shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">Add Accessory Verifications on Electronics</h4>
              <p className="text-gray-650 dark:text-gray-400 leading-normal">
                Missing adapter cords represent <strong>15%</strong> of electronics returns. Flagging checkout warning checks ("Does your laptop match this USB hub?") is expected to reduce electronics returns rate by <strong>8.4%</strong>.
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
