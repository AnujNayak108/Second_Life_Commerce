import { useState, useEffect } from 'react';
import { Leaf, Award, Recycle, ShieldCheck, HeartPulse } from 'lucide-react';

export function SustainabilityPage() {
  
  // States for animated counters
  const [co2, setCo2] = useState(0);
  const [waste, setWaste] = useState(0);
  const [secondLife, setSecondLife] = useState(0);
  const [credits, setCredits] = useState(0);

  // Counter animation on mount
  useEffect(() => {
    const duration = 1200; // ms
    const steps = 30;
    const intervalTime = duration / steps;
    
    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCo2(Math.floor((250 / steps) * step));
      setWaste(Math.floor((120 / steps) * step));
      setSecondLife(Math.floor((220 / steps) * step));
      setCredits(Math.floor((5400 / steps) * step));

      if (step >= steps) {
        setCo2(250);
        setWaste(120);
        setSecondLife(220);
        setCredits(5400);
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Eco & Sustainability Ledger</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Track cumulative landfill diversion metrics, carbon offsets, and circular economy conversion rates.</p>
      </div>

      {/* Animated Counter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CO2 Saved */}
        <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Carbon Emissions Offset</span>
            <div className="text-3xl font-black text-emerald-600 tracking-tight">{co2} kg</div>
            <p className="text-[10px] text-gray-500">Prevented courier logistics footprint</p>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-full">
            <Leaf className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Waste Diverted */}
        <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Landfill Waste Diverted</span>
            <div className="text-3xl font-black text-cyan-600 tracking-tight">{waste} kg</div>
            <p className="text-[10px] text-gray-500">Electronic & plastic materials salvaged</p>
          </div>
          <div className="p-3 bg-cyan-500/10 text-cyan-600 rounded-full">
            <Recycle className="w-6 h-6" />
          </div>
        </div>

        {/* Second Life Products */}
        <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Avoided Destruction</span>
            <div className="text-3xl font-black text-[#FF9900] tracking-tight">{secondLife} units</div>
            <p className="text-[10px] text-gray-500">Item units given a second life</p>
          </div>
          <div className="p-3 bg-[#FF9900]/10 text-[#FF9900] rounded-full">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Green Credits Issued */}
        <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Green Coins Distributed</span>
            <div className="text-3xl font-black text-yellow-600 tracking-tight">{credits} 🪙</div>
            <p className="text-[10px] text-gray-500">Incentive currency paid to returners</p>
          </div>
          <div className="p-3 bg-yellow-500/10 text-yellow-600 rounded-full">
            <Award className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Middle Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Circular Economy Funnel Visualization */}
        <div className="lg:col-span-2 bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-base font-bold text-gray-950 dark:text-white">Circular Flow Conversion Rates</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Diagram tracing returns intake down to conversion channels.</p>
          </div>

          {/* Custom Funnel Graphics */}
          <div className="space-y-4 flex-1 flex flex-col justify-center py-4">
            
            {/* Top Funnel: Total Returns Intake */}
            <div className="relative">
              <div className="w-full bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 p-3 rounded-lg text-center font-bold text-xs">
                <div className="text-gray-400 uppercase text-[9px] tracking-wider mb-0.5">Returns Intake</div>
                <div className="text-sm text-gray-900 dark:text-white">245 units (100%)</div>
              </div>
              <div className="w-0.5 h-4 bg-gray-300 dark:bg-gray-800 mx-auto" />
            </div>

            {/* Split Middle Row */}
            <div className="grid grid-cols-2 gap-8 text-center text-xs relative">
              <div className="absolute top-[-4px] left-1/4 right-1/4 h-0.5 bg-gray-300 dark:bg-gray-800" />
              
              {/* Left Branch: Resold + Refurbished */}
              <div className="space-y-3">
                <div className="w-0.5 h-3 bg-gray-300 dark:bg-gray-800 mx-auto" />
                <div className="bg-[#FF9900]/10 border border-[#FF9900]/20 p-3 rounded-lg">
                  <div className="text-[#E08800] uppercase text-[9px] font-bold tracking-wider mb-0.5">Resell & Refurbish (Second Life)</div>
                  <div className="font-black text-gray-900 dark:text-white">220 units (89.8% rate)</div>
                </div>
              </div>

              {/* Right Branch: Recycled + Donated */}
              <div className="space-y-3">
                <div className="w-0.5 h-3 bg-gray-300 dark:bg-gray-800 mx-auto" />
                <div className="bg-slate-100 dark:bg-slate-800/10 border border-slate-250 dark:border-slate-800/20 p-3 rounded-lg">
                  <div className="text-slate-500 dark:text-slate-400 uppercase text-[9px] font-bold tracking-wider mb-0.5">Recycle & Donate (Alternative routing)</div>
                  <div className="font-black text-gray-900 dark:text-white">25 units (10.2% rate)</div>
                </div>
              </div>
            </div>

            {/* Final Conversion Channels breakdown list */}
            <div className="grid grid-cols-4 gap-2 pt-6 text-[10px] text-center font-bold">
              <div className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded p-2">
                <div>Resell</div>
                <div className="text-sm font-black mt-1">180</div>
              </div>
              <div className="bg-cyan-500/10 text-cyan-600 border border-cyan-500/20 rounded p-2">
                <div>Refurbish</div>
                <div className="text-sm font-black mt-1">40</div>
              </div>
              <div className="bg-orange-500/10 text-orange-600 border border-orange-500/20 rounded p-2">
                <div>Recycle</div>
                <div className="text-sm font-black mt-1">15</div>
              </div>
              <div className="bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 rounded p-2">
                <div>Donate</div>
                <div className="text-sm font-black mt-1">10</div>
              </div>
            </div>

          </div>
        </div>

        {/* Sustainability Scorecard Rating */}
        <div className="bg-white dark:bg-[#1A222D] p-5 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-950 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-2">Facility Eco Scorecard</h3>
            
            <div className="text-center py-4">
              <div className="text-5xl font-black text-emerald-600">9.2</div>
              <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mt-1.5 block">Circular Facility Rating</span>
            </div>

            {/* Scorecard checklist metrics */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Landfill Diversion Rate</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-500">93.8%</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded">
                <span className="font-semibold text-gray-700 dark:text-gray-300">AI Grading Precision</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-500">96.4%</span>
              </div>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-2.5 rounded">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Logistics Footprint Reduction</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-500">22.4%</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-2.5 mt-4 text-xs">
            <HeartPulse className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium text-emerald-800 dark:text-emerald-400">Classified: Platinum Tier Circular Warehouse</span>
          </div>
        </div>

      </div>

    </div>
  );
}
