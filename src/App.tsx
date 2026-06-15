import { useState, useEffect } from 'react';
import { AmazonShell, type Persona } from './components/AmazonShell';
import { ViewA } from './components/ViewA';
import { ViewB } from './components/ViewB';
import { ViewC } from './components/ViewC';
import { StorefrontPage, type Product } from './components/StorefrontPage';
import { CustomerStorefrontPage } from './components/CustomerStorefrontPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { RedeemPage } from './components/RedeemPage';
import { X } from 'lucide-react';

type ActiveFlow = null | 'seller' | 'returner' | 'buyer';

// ─── localStorage helpers ──────────────────────────────────────────────────
function loadState<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(`ecobridge_${key}`);
    if (stored) return JSON.parse(stored);
  } catch {}
  return fallback;
}

function saveState(key: string, value: any) {
  try {
    localStorage.setItem(`ecobridge_${key}`, JSON.stringify(value));
  } catch {}
}

function App() {
  const [persona, setPersona] = useState<Persona>('storefront');
  const [activeFlow, setActiveFlow] = useState<ActiveFlow>(null);
  const [showRedeem, setShowRedeem] = useState(false);
  const [homeKey, setHomeKey] = useState(0);
  const [cart, setCart] = useState<Product[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [greenCoins, setGreenCoins] = useState(() => loadState('greenCoins', 150));
  const [coinAnimating, setCoinAnimating] = useState(false);
  const [soldItems, setSoldItems] = useState<Set<string>>(() => new Set(loadState<string[]>('soldItems', [])));
  const [approvedP2PItems, setApprovedP2PItems] = useState<any[]>(() => loadState('approvedP2PItems', []));
  const [orders, setOrders] = useState<Record<Persona, any[]>>(() => loadState('orders', {
    storefront: [],
    amit: [],
    priya: [],
    rahul: [],
    admin: []
  }));

  // Persist state to localStorage whenever it changes
  useEffect(() => { saveState('greenCoins', greenCoins); }, [greenCoins]);
  useEffect(() => { saveState('soldItems', [...soldItems]); }, [soldItems]);
  useEffect(() => { saveState('approvedP2PItems', approvedP2PItems); }, [approvedP2PItems]);
  useEffect(() => { saveState('orders', orders); }, [orders]);

  // Sync state with popstate event (e.g. browser back/forward buttons)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    setActiveFlow(null); // Close returner/seller overlays when switching routes
  };

  // When persona changes, close any open flow to simulate a fresh state for that user
  const handlePersonaChange = (p: Persona) => {
    setPersona(p);
    setActiveFlow(null);
    setShowRedeem(false);
  };

  const handleHomeClick = () => {
    navigateTo('/');
    setHomeKey(k => k + 1); // Triggers a re-mount of StorefrontPage to close the PDP
    setShowRedeem(false);
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

  const handleAddToCart = (product: Product) => {
    setCart(prev => {
      if (prev.some(item => item.id === product.id)) {
        return prev;
      }
      return [...prev, product];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  // Green Coins earned callback — triggered by ViewA/ViewB after grading
  const handleEarnCoins = (amount: number) => {
    setGreenCoins(prev => prev + amount);
    setCoinAnimating(true);
    setTimeout(() => setCoinAnimating(false), 1500);
  };

  // When seller lists an item via EcoBridge, mark it as sold and store images
  const handleItemSold = (orderId: string, images?: Record<string, string>, gradeData?: any) => {
    setSoldItems(prev => new Set([...prev, orderId]));
    
    // Find the order details to build the P2P listing
    const allOrders = Object.values(orders).flat();
    const order = allOrders.find(o => o.id === orderId);
    if (order) {
      const newP2PItem = {
        id: `p2p_${orderId}_${Date.now()}`,
        name: order.name + ' (AI Verified)',
        price: Math.round((order.price || 4000) * 0.50),
        originalPrice: order.price || 4000,
        grade: gradeData?.condition === 'Like New' ? 'A' : gradeData?.condition === 'Good' ? 'B' : 'C',
        rating: 4.7,
        reviews: 1,
        type: 'p2p' as const,
        seller: 'Rahul M.',
        aiScore: gradeData?.healthScore || 85,
        greenCoins: gradeData?.condition === 'Like New' ? 180 : 120,
        co2Saved: '8.2 kg',
        icon: order.icon || '♻️',
        freeDelivery: true,
        prime: true,
        // Store the captured images for display
        galleryImages: images || {},
        condition: gradeData?.condition || 'Good',
        labels: gradeData?.labels || [],
        confidence: gradeData?.confidence || 85,
      };
      setApprovedP2PItems(prev => [newP2PItem, ...prev]);
    }
  };

  // When admin approves an item, add to P2P listings
  const handleItemApproved = (item: any) => {
    setApprovedP2PItems(prev => [item, ...prev.filter(p => p.id !== item.id)]);
  };

  const handlePlaceOrder = (items: Product[]) => {
    const generateOrderId = () => {
      const part1 = Math.floor(100 + Math.random() * 900);
      const part2 = Math.floor(1000000 + Math.random() * 9000000);
      const part3 = Math.floor(1000000 + Math.random() * 9000000);
      return `${part1}-${part2}-${part3}`;
    };

    const newOrders = items.map(item => {
      const uid = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      return {
        id: uid,
        orderId: generateOrderId(),
        name: item.name,
        price: item.price,
        originalPrice: item.originalPrice || item.price,
        datePlaced: 'Today',
        status: 'Delivered Today',
        icon: item.icon,
        freeDelivery: item.freeDelivery || false,
        prime: item.prime || false,
        isReturnable: true,
        co2Saved: (item as any).co2Saved,
        greenCoins: (item as any).greenCoins
      };
    });

    // Propagate to Seller (Rahul) only — simulates "time passing" for circular economy demo
    // Priya only sees her own orders (no cross-user leakage)
    setOrders(prev => ({
      ...prev,
      [persona]: [...newOrders, ...(prev[persona] || [])],
      // Only Rahul gets the items (he's the seller who can scan and resell)
      rahul: persona !== 'rahul' ? [...newOrders.map(o => ({ ...o, id: `${o.id}_seller`, status: 'Delivered — EcoBridge Eligible' })), ...(prev.rahul || [])] : [...newOrders, ...(prev.rahul || [])],
    }));
    setCart([]);
  };

  if (persona === 'admin') {
    return <AdminDashboard onExit={() => handlePersonaChange('storefront')} liveOrders={orders} soldItems={soldItems} greenCoins={greenCoins} onItemApproved={handleItemApproved} />;
  }

  if (showRedeem) {
    return (
      <AmazonShell
        persona={persona}
        setPersona={handlePersonaChange}
        onHomeClick={handleHomeClick}
        onOrdersClick={handleOrdersClick}
        onCartClick={handleCartClick}
        cartCount={cart.length}
        greenCoins={greenCoins}
      >
        <RedeemPage
          greenCoins={greenCoins}
          onBack={() => setShowRedeem(false)}
          onRedeem={(cost, rewardName) => {
            if (greenCoins >= cost) {
              setGreenCoins(prev => prev - cost);
              alert(`Successfully redeemed: ${rewardName}!\n\nA confirmation email will be sent shortly.`);
            }
          }}
        />
      </AmazonShell>
    );
  }

  return (
    <>
      {currentPath === '/second-life' ? (
        <AmazonShell 
          persona={persona} 
          setPersona={handlePersonaChange}
          onHomeClick={handleHomeClick}
          onOrdersClick={handleOrdersClick}
          onCartClick={handleCartClick}
          onCoinsClick={() => setShowRedeem(true)}
          cartCount={cart.length}
          greenCoins={greenCoins}
          coinAnimating={coinAnimating}
        >
          {/* ─── Storefront is ALWAYS the base content for SecondLife ─── */}
          <StorefrontPage key={homeKey} onGoToCart={handleCartClick} onAddToCart={handleAddToCart} approvedP2PItems={approvedP2PItems} />
        </AmazonShell>
      ) : (
        <CustomerStorefrontPage 
          cartCount={cart.length}
          onCartClick={handleCartClick}
          onAddToCart={handleAddToCart}
          onNavigateToSecondLife={() => navigateTo('/second-life')}
          persona={persona}
          setPersona={handlePersonaChange}
          onOrdersClick={handleOrdersClick}
        />
      )}

      {/* ─── Flow Overlays (open on top of storefront/hub) ─── */}
      {activeFlow !== null && (
        <div className="fixed inset-0 z-40 bg-[#EAEDED] overflow-y-auto" style={{ top: '108px' }}>
          {/* Close bar */}
          <div className="bg-white border-b border-[#D5D9D9] sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 py-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-[#0F1111]">
                <button 
                  onClick={() => setActiveFlow(null)} 
                  className="text-[#007185] hover:text-[#C7511F] hover:underline font-medium cursor-pointer"
                >
                  ← Back to {currentPath === '/second-life' ? 'SecondLife Platform' : 'Storefront'}
                </button>
                <span className="text-[#D5D9D9]">|</span>
                <span className="text-[#565959]">
                  {activeFlow === 'seller' && "Your Orders"}
                  {activeFlow === 'returner' && "Returns & Orders"}
                  {activeFlow === 'buyer' && "Amazon Cart"}
                </span>
              </div>
              <button 
                onClick={() => setActiveFlow(null)} 
                className="text-[#565959] hover:text-[#0F1111] p-1 rounded hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
          {/* Flow content */}
          {activeFlow === 'seller' && <ViewA onEarnCoins={handleEarnCoins} orders={orders.rahul} soldItems={soldItems} onItemSold={handleItemSold} />}
          {activeFlow === 'returner' && <ViewB orders={orders[persona]} onEarnCoins={handleEarnCoins} onEcoBridgeReturn={(order) => {
            // EcoBridge return: mark as sold so it appears in admin dashboard
            setSoldItems(prev => new Set([...prev, order.id]));
          }} />}
          {activeFlow === 'buyer' && (
            <ViewC 
              cart={cart} 
              onRemoveFromCart={handleRemoveFromCart}
              onPlaceOrder={handlePlaceOrder}
              onViewOrders={() => setActiveFlow('returner')}
              onClose={() => setActiveFlow(null)}
            />
          )}
        </div>
      )}
    </>
  );
}

export default App;
