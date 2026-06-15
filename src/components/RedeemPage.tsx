import React from 'react';
import { Gift, Leaf, Award, ArrowRight, CheckCircle2 } from 'lucide-react';

interface RedeemPageProps {
  greenCoins: number;
  onBack: () => void;
  onRedeem: (cost: number, rewardName: string) => void;
}

const REWARDS = [
  {
    id: 'r1',
    title: 'Plant a Tree in Your Name',
    description: 'We will plant a tree in the Amazon rainforest in your honor.',
    cost: 200,
    icon: <Leaf className="w-8 h-8 text-green-500" />,
    color: 'bg-green-50 border-green-200'
  },
  {
    id: 'r2',
    title: '1 Month Amazon Prime',
    description: 'Enjoy free delivery, exclusive deals, and Prime Video.',
    cost: 500,
    icon: <Award className="w-8 h-8 text-[#FF9900]" />,
    color: 'bg-orange-50 border-orange-200'
  },
  {
    id: 'r3',
    title: '₹500 Amazon Pay Gift Card',
    description: 'Add ₹500 directly to your Amazon Pay balance.',
    cost: 1000,
    icon: <Gift className="w-8 h-8 text-blue-500" />,
    color: 'bg-blue-50 border-blue-200'
  },
  {
    id: 'r4',
    title: 'Eco-Friendly Tote Bag',
    description: 'A stylish, reusable tote bag made from 100% recycled materials.',
    cost: 750,
    icon: <ShoppingBagIcon />,
    color: 'bg-teal-50 border-teal-200'
  }
];

function ShoppingBagIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-600">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>
  );
}

export function RedeemPage({ greenCoins, onBack, onRedeem }: RedeemPageProps) {
  return (
    <div className="min-h-screen bg-[#F2F4F8] py-8">
      <div className="max-w-5xl mx-auto px-4">
        
        {/* Breadcrumb / Back */}
        <button 
          onClick={onBack}
          className="text-sm text-[#007185] hover:text-[#C7511F] hover:underline mb-6 flex items-center gap-1"
        >
          &larr; Back to Shopping
        </button>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-[#131921] via-[#232F3E] to-[#131921] rounded-2xl shadow-xl overflow-hidden mb-8 relative">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Leaf className="w-64 h-64 text-green-500" />
          </div>
          <div className="px-8 py-12 relative z-10 text-white flex flex-col md:flex-row items-center justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-sm font-bold tracking-wide mb-4 border border-green-500/30">
                <Leaf className="w-4 h-4" /> Eco-Warrior Status: ACTIVE
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
                Thank You for Choosing <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-[#FF9900]">Second Life!</span>
              </h1>
              <p className="text-[#DDDDDD] text-lg leading-relaxed">
                By purchasing refurbished and peer-to-peer items, you're actively reducing electronic waste and carbon emissions. Redeem your hard-earned <strong className="text-[#FF9900]">Green Coins 🪙</strong> for exclusive rewards below!
              </p>
            </div>
            
            {/* Coin Balance Card */}
            <div className="mt-8 md:mt-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 text-center w-full md:w-auto min-w-[250px] shadow-2xl">
              <p className="text-white/80 text-sm font-semibold uppercase tracking-wider mb-2">Available Balance</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-5xl font-black text-[#FF9900] drop-shadow-md">{greenCoins}</span>
                <span className="text-3xl">🪙</span>
              </div>
              <div className="mt-4 pt-4 border-t border-white/10">
                <p className="text-xs text-green-300 font-medium flex items-center justify-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Equals ~{(greenCoins * 0.5).toFixed(1)} kg CO₂ Saved
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Rewards Grid */}
        <h2 className="text-2xl font-bold text-[#0F1111] mb-6 flex items-center gap-2">
          <Gift className="w-6 h-6 text-[#FF9900]" />
          Redeem Rewards
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {REWARDS.map(reward => {
            const canAfford = greenCoins >= reward.cost;
            return (
              <div 
                key={reward.id} 
                className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-300 hover:shadow-lg ${canAfford ? 'hover:border-[#FF9900]' : 'opacity-75 grayscale-[20%]'}`}
              >
                <div className={`p-6 flex flex-col h-full`}>
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-4 rounded-xl ${reward.color} border`}>
                      {reward.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-[#0F1111] mb-1">{reward.title}</h3>
                      <p className="text-sm text-[#565959]">{reward.description}</p>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xl font-bold ${canAfford ? 'text-[#0F1111]' : 'text-red-600'}`}>{reward.cost}</span>
                      <span className="text-lg">🪙</span>
                    </div>
                    <button
                      disabled={!canAfford}
                      onClick={() => onRedeem(reward.cost, reward.title)}
                      className={`flex items-center gap-2 px-5 py-2 rounded-full font-bold text-sm transition-all ${
                        canAfford 
                          ? 'bg-[#FF9900] hover:bg-[#F3A847] text-[#0F1111] shadow-md hover:shadow-lg active:scale-95' 
                          : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? 'Redeem Now' : 'Not Enough Coins'}
                      {canAfford && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </div>
                  {!canAfford && (
                    <div className="mt-2 text-xs text-red-500 text-right font-medium">
                      Need {reward.cost - greenCoins} more 🪙
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
