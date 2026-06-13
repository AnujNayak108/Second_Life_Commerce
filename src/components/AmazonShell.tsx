import { type ReactNode } from 'react';
import { Search, ShoppingCart, MapPin, ChevronDown, Coins, Leaf } from 'lucide-react';

// ─── Persona type ─────────────────────────────────────────────────────────────
export type Persona = 'storefront' | 'rahul' | 'priya' | 'amit' | 'admin';

const PERSONA_META: Record<Persona, { name: string; greeting: string; label: string }> = {
  storefront: { name: 'Amit', greeting: 'Hello, Amit', label: '🏪 Storefront' },
  rahul: { name: 'Rahul', greeting: 'Hello, Rahul', label: '📦 Rahul (Seller)' },
  priya: { name: 'Priya', greeting: 'Hello, Priya', label: '↩️ Priya (Returner)' },
  amit: { name: 'Amit', greeting: 'Hello, Amit', label: '🛒 Amit (Buyer)' },
  admin: { name: 'Ops Admin', greeting: 'Hello, Ops Admin', label: '🛠️ Operations Admin' },
};

const SUB_NAV = [
  '🌿 Second Life', '♻️ Amazon Renewed', '👤 P2P Marketplace', "Today's Deals",
  'Electronics', 'Fashion', 'Home & Kitchen', 'Books'
];

// ─── Props ────────────────────────────────────────────────────────────────────
interface AmazonShellProps {
  persona: Persona;
  setPersona: (p: Persona) => void;
  onHomeClick?: () => void;
  onOrdersClick?: () => void;
  onCartClick?: () => void;
  cartCount?: number;
  children: ReactNode;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AmazonShell({ persona, setPersona, onHomeClick, onOrdersClick, onCartClick, cartCount = 0, children }: AmazonShellProps) {
  const meta = PERSONA_META[persona];

  return (
    <div className="min-h-screen flex flex-col bg-[#EAEDED] text-[#0F1111] font-sans">

      {/* ═══ TOP HEADER — #131921 ═══════════════════════════════════════════ */}
      <header className="bg-[#131921] sticky top-0 z-50">
        <div className="flex items-center gap-2 px-3 py-2">

          {/* Logo */}
          <div 
            className="flex flex-col items-start mr-1 shrink-0 border border-transparent hover:border-white rounded px-2 py-1 cursor-pointer"
            onClick={onHomeClick}
          >
            <div className="flex items-baseline gap-0.5">
              <span className="text-white font-bold text-xl leading-tight tracking-tight">amazon</span>
              <span className="text-[#FF9900] text-[9px] font-semibold">.in</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Leaf className="w-2.5 h-2.5 text-[#FF9900]" />
              <span className="text-[#FF9900] text-[8px] font-bold tracking-widest uppercase">Second Life</span>
            </div>
          </div>

          {/* Deliver to */}
          <div className="hidden lg:flex flex-col shrink-0 border border-transparent hover:border-white rounded px-2 py-1 cursor-pointer">
            <span className="text-[#CCCCCC] text-[10px] leading-tight">Deliver to {meta.name}</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-bold">Delhi 110001</span>
            </div>
          </div>

          {/* Search bar */}
          <div className="flex-1 flex rounded-md overflow-hidden min-w-0">
            <div className="bg-[#F3F3F3] hover:bg-[#E6E6E6] border-r border-gray-300 flex items-center px-2 cursor-pointer shrink-0">
              <span className="text-[11px] text-[#555] whitespace-nowrap">All</span>
              <ChevronDown className="w-3 h-3 text-[#555] ml-0.5" />
            </div>
            <input
              type="text"
              placeholder="Search Second Life Commerce…"
              className="flex-1 bg-white text-sm px-3 py-2 outline-none min-w-0 text-[#0F1111] placeholder-[#999]"
            />
            <button className="bg-[#FEBD69] hover:bg-[#F3A847] px-4 py-2 shrink-0 flex items-center justify-center">
              <Search className="w-5 h-5 text-[#0F1111]" />
            </button>
          </div>

          {/* Right nav */}
          <div className="flex items-center gap-0.5 shrink-0 ml-1">

            {/* Green Coins */}
            <div className="hidden sm:flex flex-col border border-transparent hover:border-white rounded px-2 py-1 cursor-pointer">
              <span className="text-[#CCCCCC] text-[10px] leading-tight">Green</span>
              <div className="flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-[#FF9900]" />
                <span className="text-white text-xs font-bold">240 🪙</span>
              </div>
            </div>

            {/* Persona Switcher (replaces Account & Lists) */}
            <div className="relative flex flex-col border border-transparent hover:border-white rounded px-2 py-1">
              <span className="text-[#CCCCCC] text-[10px] leading-tight">{meta.greeting}</span>
              <div className="flex items-center gap-0.5">
                <select
                  value={persona}
                  onChange={(e) => setPersona(e.target.value as Persona)}
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

            {/* Returns & Orders */}
            <div className="hidden md:flex flex-col border border-transparent hover:border-white rounded px-2 py-1 cursor-pointer"
              onClick={onOrdersClick}
            >
              <span className="text-[#CCCCCC] text-[10px] leading-tight">Returns</span>
              <span className="text-white text-xs font-bold">& Orders</span>
            </div>

            {/* Cart */}
            <div className="relative flex items-end border border-transparent hover:border-white rounded px-2 py-1 cursor-pointer"
              onClick={onCartClick}
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

        {/* ═══ SUB NAV — #232F3E ═══════════════════════════════════════════ */}
        <nav className="bg-[#232F3E] flex items-center px-3 py-1 gap-0.5 overflow-x-auto">
          <button className="flex items-center gap-1.5 text-white text-sm font-bold hover:text-white border border-transparent hover:border-white rounded px-2 py-1.5 whitespace-nowrap shrink-0">
            <span className="flex flex-col gap-[3px] w-4">
              <span className="w-full h-0.5 bg-white rounded" />
              <span className="w-full h-0.5 bg-white rounded" />
              <span className="w-full h-0.5 bg-white rounded" />
            </span>
            All
          </button>
          {SUB_NAV.map((item) => (
            <button
              key={item}
              className="text-white text-sm hover:text-white border border-transparent hover:border-white rounded px-2 py-1.5 whitespace-nowrap shrink-0"
            >
              {item}
            </button>
          ))}
        </nav>
      </header>

      {/* ═══ PAGE CONTENT ══════════════════════════════════════════════════ */}
      <main className="flex-1">
        {children}
      </main>

      {/* ═══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="w-full bg-[#37475A] hover:bg-[#485769] text-white text-sm py-3 transition-colors font-medium"
        >
          Back to top
        </button>
        <div className="bg-[#232F3E] text-white py-10 px-6">
          <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { title: 'Get to Know Us', links: ['About SecondLife', 'Careers', 'Press Releases', 'Amazon Science'] },
              { title: 'Connect with Us', links: ['Facebook', 'Twitter', 'Instagram'] },
              { title: 'Make Money with Us', links: ['Sell on Second Life', 'List P2P Items', 'Amazon Renewed Program', 'Become a Seller'] },
              { title: 'Let Us Help You', links: ['Your Account', 'Your Orders', 'Green Coins Balance', 'Return an Item', 'Help'] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="font-bold text-sm mb-3">{col.title}</h4>
                <ul className="space-y-1.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-[#DDDDDD] hover:text-white text-xs transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#131921] text-white py-5 px-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-baseline gap-0.5">
              <span className="text-white font-bold text-lg leading-tight">amazon</span>
              <span className="text-[#FF9900] text-[9px] font-semibold">.in</span>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-[10px] text-[#DDDDDD]">
              {['Conditions of Use', 'Privacy Notice', 'Interest-Based Ads', 'Green Coins Terms'].map((l) => (
                <a key={l} href="#" className="hover:underline">{l}</a>
              ))}
            </div>
            <p className="text-[10px] text-[#999]">© 2026, SecondLife.AI Commerce — HackOn with Amazon Season 6.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
