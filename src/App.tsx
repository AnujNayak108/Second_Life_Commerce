import { useState } from 'react';
import { AmazonShell, type Persona } from './components/AmazonShell';
import { ViewA } from './components/ViewA';
import { ViewB } from './components/ViewB';
import { ViewC } from './components/ViewC';
import { StorefrontPage } from './components/StorefrontPage';
import { X } from 'lucide-react';

type ActiveFlow = null | 'seller' | 'returner' | 'buyer';

function App() {
  const [persona, setPersona] = useState<Persona>('storefront');
  const [activeFlow, setActiveFlow] = useState<ActiveFlow>(null);

  // When persona changes, close any open flow to simulate a fresh state for that user
  const handlePersonaChange = (p: Persona) => {
    setPersona(p);
    setActiveFlow(null);
  };

  // Clicking "Returns & Orders" routes based on the current persona
  const handleOrdersClick = () => {
    if (persona === 'rahul') {
      setActiveFlow('seller');
    } else {
      setActiveFlow('returner'); // Default to the returner flow (Priya) for anyone else
    }
  };

  // Clicking "Cart" always goes to checkout
  const handleCartClick = () => {
    setActiveFlow('buyer');
  };

  return (
    <AmazonShell 
      persona={persona} 
      setPersona={handlePersonaChange}
      onOrdersClick={handleOrdersClick}
      onCartClick={handleCartClick}
    >
      {/* ─── Storefront is ALWAYS the base content ─── */}
      <StorefrontPage />

      {/* ─── Flow Overlays (open on top of storefront) ─── */}
      {activeFlow !== null && (
        <div className="fixed inset-0 z-40 bg-[#EAEDED] overflow-y-auto" style={{ top: '108px' }}>
          {/* Close bar */}
          <div className="bg-white border-b border-[#D5D9D9] sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[#0F1111]">
                <button onClick={() => setActiveFlow(null)} className="text-[#007185] hover:text-[#C7511F] hover:underline font-medium">
                  ← Back to Storefront
                </button>
                <span className="text-[#D5D9D9]">|</span>
                <span className="text-[#565959]">
                  {activeFlow === 'seller' && "Your Orders"}
                  {activeFlow === 'returner' && "Returns & Orders"}
                  {activeFlow === 'buyer' && "Amazon Cart"}
                </span>
              </div>
              <button onClick={() => setActiveFlow(null)} className="text-[#565959] hover:text-[#0F1111] p-1 rounded hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Flow content */}
          {activeFlow === 'seller' && <ViewA />}
          {activeFlow === 'returner' && <ViewB />}
          {activeFlow === 'buyer' && <ViewC />}
        </div>
      )}
    </AmazonShell>
  );
}

export default App;
