import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, RotateCcw, ShoppingBag, Users, BarChart3, Settings, 
  Menu, Bell, ChevronDown, Sun, Moon, Search, Clock, LogOut 
} from 'lucide-react';
import type { ReturnItem, MarketplaceListing } from './mockData';
import { MOCK_RETURNS, MOCK_MARKETPLACE } from './mockData';
import { DashboardHome } from './DashboardHome';
import { ReturnsPage } from './ReturnsPage';
import { AiInspectionPage } from './AiInspectionPage';
import { MarketplacePage } from './MarketplacePage';
import { EcoCreditsPage } from './EcoCreditsPage';
import { AnalyticsPage } from './AnalyticsPage';
import { SustainabilityPage } from './SustainabilityPage';

interface AdminDashboardProps {
  onExit: () => void;
}

export function AdminDashboard({ onExit }: AdminDashboardProps) {
  // Navigation & Sidebar states
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [returnsStatusFilter, setReturnsStatusFilter] = useState('All');
  
  // App-level Shared State (in memory mock database)
  const [returns, setReturns] = useState<ReturnItem[]>(MOCK_RETURNS);
  const [listings, setListings] = useState<MarketplaceListing[]>(MOCK_MARKETPLACE);
  const [selectedReturnId, setSelectedReturnId] = useState<string | null>(null);

  // Time clock state
  const [timeStr, setTimeStr] = useState('');

  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    return document.documentElement.classList.contains('dark');
  });

  // Clock effect
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setTimeStr(d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' · ' + d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Theme toggler effect
  const toggleDarkMode = () => {
    const nextDark = !darkMode;
    setDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // State handlers
  const handleUpdateReturn = (id: string, updates: Partial<ReturnItem>) => {
    setReturns(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates };
        // If decision is updated, let's sync to marketplace draft list
        if (updates.aiDecision && updates.status === 'Overridden') {
          // Add or update marketplace listing draft
          syncToMarketplace(updated);
        } else if (updates.status === 'Approved') {
          syncToMarketplace(updated);
        }
        return updated;
      }
      return item;
    }));
  };

  const syncToMarketplace = (item: ReturnItem) => {
    if (item.aiDecision === 'Resell') {
      const exists = listings.some(x => x.id === item.id || x.product === item.product);
      if (!exists) {
        const newListing: MarketplaceListing = {
          id: item.id,
          product: item.product,
          category: item.category,
          condition: item.condition,
          resalePrice: item.estimatedResalePrice,
          originalPrice: item.originalPrice,
          inventory: 1,
          status: 'Draft',
          image: item.images[0] || '📦'
        };
        setListings(prev => [newListing, ...prev]);
      }
    }
  };

  const handleUpdateListing = (id: string, updates: Partial<MarketplaceListing>) => {
    setListings(prev => {
      const exists = prev.some(x => x.id === id);
      if (!exists) {
        // Create manual listing
        const newL = { ...updates } as MarketplaceListing;
        return [newL, ...prev];
      }
      return prev.map(item => item.id === id ? { ...item, ...updates } : item);
    });
  };

  const handleRemoveListing = (id: string) => {
    setListings(prev => prev.filter(item => item.id !== id));
  };

  const handleViewDetails = (id: string) => {
    setSelectedReturnId(id);
    setActiveView('ai-inspections');
  };

  const handleSidebarNavigate = (view: string, filter?: string) => {
    if (filter) {
      setReturnsStatusFilter(filter);
      setActiveView(view);
    } else if (view === 'returns-pending') {
      setReturnsStatusFilter('Pending');
      setActiveView('returns');
    } else if (view === 'returns-approved') {
      setReturnsStatusFilter('Approved');
      setActiveView('returns');
    } else if (view === 'returns-rejected') {
      setReturnsStatusFilter('Rejected');
      setActiveView('returns');
    } else {
      setReturnsStatusFilter('All');
      setActiveView(view);
    }
    setSelectedReturnId(null);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 bg-gray-50 dark:bg-[#0B0F19] text-gray-900 dark:text-gray-100`}>
      
      {/* ═══ TOP NAVIGATION BAR ═══ */}
      <header className="bg-[#131921] text-white border-b border-gray-800 sticky top-0 z-40 shrink-0 h-16 flex items-center justify-between px-4">
        
        {/* Left Side: Logo & Burger */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="flex items-baseline gap-1.5 select-none cursor-pointer" onClick={() => handleSidebarNavigate('dashboard')}>
            <span className="font-black text-xl tracking-tight">amazon</span>
            <span className="text-[#FF9900] text-[10px] font-black tracking-widest uppercase border border-[#FF9900] px-1 rounded-sm">SecondLife AI</span>
            <span className="text-[9px] text-gray-400 font-medium">Ops Console</span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="hidden md:flex items-center bg-gray-900 border border-gray-700 hover:border-gray-650 rounded overflow-hidden max-w-md w-full mx-4">
          <input
            type="text"
            placeholder="Global search returns, products, users..."
            className="w-full bg-transparent px-3 py-1.5 outline-none text-sm text-white placeholder-gray-500"
          />
          <button className="bg-[#FF9900] hover:bg-[#E08800] px-4 py-1.5 flex items-center justify-center text-gray-900">
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Right Side Controls */}
        <div className="flex items-center gap-4">
          
          {/* Clock Display */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-400 border-r border-gray-800 pr-4">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeStr}</span>
          </div>

          {/* Dark Mode Toggler */}
          <button 
            onClick={toggleDarkMode}
            className="p-1.5 hover:bg-gray-850 rounded transition-colors text-gray-400 hover:text-[#FF9900]"
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications Icon */}
          <div className="relative">
            <Bell className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer" />
            <span className="absolute -top-1 -right-1 bg-red-650 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">3</span>
          </div>

          {/* Admin Profile Dropdown */}
          <div className="flex items-center gap-1 border-l border-gray-800 pl-4 cursor-pointer hover:text-gray-300">
            <div className="w-8 h-8 rounded-full bg-[#37475A] border border-[#FF9900] flex items-center justify-center text-sm font-bold text-[#FF9900]">
              OP
            </div>
            <span className="text-xs font-semibold hidden sm:inline">BLR-03 Ops</span>
            <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
          </div>

          {/* Exit Portal / Logout */}
          <button 
            onClick={onExit}
            className="p-1.5 hover:bg-gray-800 rounded transition-colors text-gray-400 hover:text-rose-500 border border-transparent hover:border-gray-800"
            title="Exit Admin Portal"
          >
            <LogOut className="w-4 h-4" />
          </button>

        </div>
      </header>

      {/* ═══ BODY: SIDEBAR + CONTENT FRAME ═══ */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Collapsible Left Sidebar */}
        <aside className={`${
          sidebarOpen ? 'w-60' : 'w-16'
        } bg-[#131921] dark:bg-[#111721] text-gray-300 border-r border-gray-800 flex flex-col justify-between transition-all duration-300 shrink-0 z-30 overflow-y-auto`}>
          
          <nav className="p-3 space-y-4">
            
            {/* Main Section */}
            <div className="space-y-1">
              <button 
                onClick={() => handleSidebarNavigate('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors ${
                  activeView === 'dashboard' ? 'bg-[#FF9900] text-gray-900 font-bold' : 'hover:bg-gray-850 hover:text-white'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>Dashboard</span>}
              </button>
            </div>

            {/* Returns Management Dropdown/Section */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                {sidebarOpen ? 'Returns Operations' : 'Ret'}
              </div>
              <button 
                onClick={() => handleSidebarNavigate('returns', 'All')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors ${
                  activeView === 'returns' && returnsStatusFilter === 'All' ? 'bg-gray-800 text-white font-semibold' : 'hover:bg-gray-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  {sidebarOpen && <span>All Returns</span>}
                </div>
                {sidebarOpen && <span className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">{returns.length}</span>}
              </button>
              <button 
                onClick={() => handleSidebarNavigate('returns', 'Pending')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors ${
                  activeView === 'returns' && returnsStatusFilter === 'Pending' ? 'bg-gray-800 text-white font-semibold' : 'hover:bg-gray-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  {sidebarOpen && <span>Pending Returns</span>}
                </div>
                {sidebarOpen && <span className="bg-amber-600/20 text-amber-500 font-bold px-1.5 py-0.5 rounded-sm">{returns.filter(x => x.status === 'Pending').length}</span>}
              </button>
              <button 
                onClick={() => handleSidebarNavigate('returns', 'Approved')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors ${
                  activeView === 'returns' && returnsStatusFilter === 'Approved' ? 'bg-gray-800 text-white font-semibold' : 'hover:bg-gray-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  {sidebarOpen && <span>Approved Returns</span>}
                </div>
              </button>
              <button 
                onClick={() => handleSidebarNavigate('returns', 'Rejected')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors ${
                  activeView === 'returns' && returnsStatusFilter === 'Rejected' ? 'bg-gray-800 text-white font-semibold' : 'hover:bg-gray-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  {sidebarOpen && <span>Rejected Returns</span>}
                </div>
              </button>
              <button 
                onClick={() => handleSidebarNavigate('ai-inspections')}
                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded text-xs transition-colors ${
                  activeView === 'ai-inspections' ? 'bg-gray-800 text-white font-semibold' : 'hover:bg-gray-850 hover:text-white'
                }`}
              >
                <Settings className="w-3.5 h-3.5 shrink-0 text-[#FF9900]" />
                {sidebarOpen && <span>AI Inspection Results</span>}
              </button>
            </div>

            {/* Marketplace Section */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                {sidebarOpen ? 'Marketplace' : 'Mkt'}
              </div>
              <button 
                onClick={() => handleSidebarNavigate('marketplace')}
                className={`w-full flex items-center justify-between px-3 py-1.5 rounded text-xs transition-colors ${
                  activeView === 'marketplace' ? 'bg-gray-800 text-white font-semibold' : 'hover:bg-gray-850 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                  {sidebarOpen && <span>Published Listings</span>}
                </div>
                {sidebarOpen && <span className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">{listings.filter(x => x.status === 'Active').length}</span>}
              </button>
            </div>

            {/* Users Ledger Section */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                {sidebarOpen ? 'Users Ledger' : 'Usr'}
              </div>
              <button 
                onClick={() => handleSidebarNavigate('eco-credits')}
                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded text-xs transition-colors ${
                  activeView === 'eco-credits' ? 'bg-gray-800 text-white font-semibold' : 'hover:bg-gray-850 hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                {sidebarOpen && <span>Eco Credits Wallet</span>}
              </button>
            </div>

            {/* Analytics Section */}
            <div className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">
                {sidebarOpen ? 'Analytics & KPIs' : 'An'}
              </div>
              <button 
                onClick={() => handleSidebarNavigate('analytics-sustainability')}
                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded text-xs transition-colors ${
                  activeView === 'analytics-sustainability' ? 'bg-gray-800 text-white font-semibold' : 'hover:bg-gray-850 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                {sidebarOpen && <span>Sustainability Metrics</span>}
              </button>
              <button 
                onClick={() => handleSidebarNavigate('analytics-prevention')}
                className={`w-full flex items-center gap-3 px-3 py-1.5 rounded text-xs transition-colors ${
                  activeView === 'analytics-prevention' ? 'bg-gray-800 text-white font-semibold' : 'hover:bg-gray-850 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 shrink-0 text-[#FF9900]" />
                {sidebarOpen && <span>Return Prevention</span>}
              </button>
            </div>

            {/* Settings */}
            <div className="space-y-1 border-t border-gray-850 pt-3">
              <button 
                onClick={() => handleSidebarNavigate('settings')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded text-xs transition-colors ${
                  activeView === 'settings' ? 'bg-gray-800 text-white font-semibold' : 'hover:bg-gray-850 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                {sidebarOpen && <span>System Settings</span>}
              </button>
            </div>

          </nav>

          {/* Sidebar Footer info */}
          {sidebarOpen && (
            <div className="p-4 bg-gray-950 border-t border-gray-900 text-[10px] text-gray-500 space-y-1 select-none">
              <div>Facility ID: BLR-03</div>
              <div>System Node: Edge-Grader_92</div>
              <div>Firmware: v14.2.1-Prod</div>
            </div>
          )}
        </aside>

        {/* Main Workspace Frame */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-16">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* View router switcher */}
            {activeView === 'dashboard' && (
              <DashboardHome onNavigate={(v) => handleSidebarNavigate(v)} />
            )}

            {activeView === 'returns' && (
              <ReturnsPage 
                returns={returns}
                onUpdateReturn={handleUpdateReturn}
                onViewDetails={handleViewDetails}
                statusFilter={returnsStatusFilter}
                setStatusFilter={setReturnsStatusFilter}
              />
            )}

            {activeView === 'ai-inspections' && (
              <AiInspectionPage 
                returnId={selectedReturnId || returns[0].id}
                returns={returns}
                onBack={() => setActiveView('returns')}
                onUpdateReturn={handleUpdateReturn}
              />
            )}

            {activeView === 'marketplace' && (
              <MarketplacePage 
                listings={listings}
                onUpdateListing={handleUpdateListing}
                onRemoveListing={handleRemoveListing}
              />
            )}

            {activeView === 'eco-credits' && (
              <EcoCreditsPage />
            )}

            {activeView === 'analytics-prevention' && (
              <AnalyticsPage />
            )}

            {activeView === 'analytics-sustainability' && (
              <SustainabilityPage />
            )}

            {activeView === 'settings' && (
              <div className="bg-white dark:bg-[#1A222D] p-6 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white border-b border-gray-150 dark:border-gray-800 pb-2">System Operations Settings</h2>
                <div className="space-y-4 text-xs font-semibold">
                  <div className="flex items-center justify-between p-3 bg-gray-55 dark:bg-gray-900 rounded">
                    <div>
                      <div className="text-gray-900 dark:text-white">Enable Automated Edge-Grader Rekognition Integration</div>
                      <div className="text-[10px] text-gray-450 mt-0.5">Automatically trigger camera visual captures on warehouse intake scanner gates.</div>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded text-[#FF9900]" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-55 dark:bg-gray-900 rounded">
                    <div>
                      <div className="text-gray-900 dark:text-white">Auto-Publish Resell Recommendation Approvals</div>
                      <div className="text-[10px] text-gray-450 mt-0.5">Instantly publish items with condition score above 90 and confidence score above 95.</div>
                    </div>
                    <input type="checkbox" className="rounded text-[#FF9900]" />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-55 dark:bg-gray-900 rounded">
                    <div>
                      <div className="text-gray-900 dark:text-white">Double Green Coins Promotion</div>
                      <div className="text-[10px] text-gray-450 mt-0.5">Incentivize local P2P checkout intercepts during peak weekend return windows.</div>
                    </div>
                    <input type="checkbox" className="rounded text-[#FF9900]" />
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>

      </div>

    </div>
  );
}
