import { useState, useEffect } from 'react';
import { AmazonShell, type Persona } from './components/AmazonShell';
import { ViewA } from './components/ViewA';
import { ViewB } from './components/ViewB';
import { ViewC } from './components/ViewC';
import { StorefrontPage, type Product } from './components/StorefrontPage';
import { CustomerStorefrontPage } from './components/CustomerStorefrontPage';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { X } from 'lucide-react';

type ActiveFlow = null | 'seller' | 'returner' | 'buyer';

function App() {
  const [persona, setPersona] = useState<Persona>('storefront');
  const [activeFlow, setActiveFlow] = useState<ActiveFlow>(null);
  const [homeKey, setHomeKey] = useState(0);
  const [cart, setCart] = useState<Product[]>([]);
  const [currentPath, setCurrentPath] = useState<string>(window.location.pathname);
  const [orders, setOrders] = useState<any[]>([
    {
      id: 'mock_shoes',
      orderId: '402-7291058-3148621',
      name: 'Pro Running Shoes - Size 9',
      price: 4000,
      originalPrice: 4000,
      datePlaced: 'Yesterday',
      status: 'Delivered Yesterday',
      icon: '👟',
      freeDelivery: true,
      prime: true,
      isReturnable: true
    }
  ]);

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
  };

  const handleHomeClick = () => {
    navigateTo('/');
    setHomeKey(k => k + 1); // Triggers a re-mount of StorefrontPage to close the PDP
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

  const handlePlaceOrder = (items: Product[]) => {
    const generateOrderId = () => {
      const part1 = Math.floor(100 + Math.random() * 900);
      const part2 = Math.floor(1000000 + Math.random() * 9000000);
      const part3 = Math.floor(1000000 + Math.random() * 9000000);
      return `${part1}-${part2}-${part3}`;
    };

    const newOrders = items.map(item => ({
      id: item.id || `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: generateOrderId(),
      name: item.name,
      price: item.price,
      originalPrice: item.originalPrice || item.price,
      datePlaced: 'Today',
      status: 'Preparing for Dispatch',
      icon: item.icon,
      freeDelivery: item.freeDelivery || false,
      prime: item.prime || false,
      isReturnable: true,
      co2Saved: (item as any).co2Saved,
      greenCoins: (item as any).greenCoins
    }));

    setOrders(prev => [...newOrders, ...prev]);
    setCart([]);
  };

  if (persona === 'admin') {
    return <AdminDashboard onExit={() => handlePersonaChange('storefront')} />;
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
          cartCount={cart.length}
        >
          {/* ─── Storefront is ALWAYS the base content for SecondLife ─── */}
          <StorefrontPage key={homeKey} onGoToCart={handleCartClick} onAddToCart={handleAddToCart} />
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
          {activeFlow === 'seller' && <ViewA />}
          {activeFlow === 'returner' && <ViewB orders={orders} />}
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
