'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Home, Bell, Shield, User, ShoppingCart, ArrowLeftRight, Scale, 
  CreditCard, PiggyBank, RefreshCw, Lock, Unlock, 
  FolderInput, Settings2, Signature, History, TrendingUp, ChevronRight, X 
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

// Asset Imports (Ensure these exist in your public or images folder)
import gold_24k from '../images/24k_gold.png';
import gold_22k from '../images/22k_gold_v.jpg';
import silver from '../images/silver_coin_v.jpg';

const PreciousMetalsApp = () => {
  const router = useRouter();

  // --- 1. STATE MANAGEMENT ---
  const [selectedMetal, setSelectedMetal] = useState('24k-995');
  const [grams, setGrams] = useState('');
  const [amount, setAmount] = useState('');
  const [userType, setUserType] = useState('');
  const [username, setUsername] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [marketStatus, setMarketStatus] = useState('CLOSED');
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [tradingHours, setTradingHours] = useState({ open: '10:00', close: '18:00' });
  const [currentTime, setCurrentTime] = useState('');
  const [metalRates, setMetalRates] = useState({ '24k-995': 0, '22k-916': 0, '24k-999': 0 });
  const [metalBalances, setMetalBalances] = useState({ '24k-995': '0.0000', '22k-916': '0.0000', '24k-999': '0.0000' });
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // --- 2. API & LOGIC FUNCTIONS ---

  const getAuthHeader = useCallback(() => {
    const token = sessionStorage.getItem('authToken');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, []);

  const fetchMarketStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/market-status', {
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() }
      });
      const data = await response.json();
      const status = data.marketStatus?.status || data.status || 'CLOSED';
      setMarketStatus(status);
      setIsMarketOpen(status === 'OPEN');
      if (data.marketStatus?.open_time) {
        setTradingHours({ open: data.marketStatus.open_time, close: data.marketStatus.close_time });
      }
    } catch (error) { console.error('Market Error:', error); }
  };

  const fetchLatestPrices = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/price/', { headers: getAuthHeader() });
      if (res.ok) {
        const data = await res.json();
        setMetalRates({
          '24k-995': data.latestPrice.gold24K,
          '22k-916': data.latestPrice.gold22K,
          '24k-999': data.latestPrice.silver
        });
      }
    } catch (e) { console.error('Price Fetch Error:', e); }
  };

  const fetchHoldings = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/holdings', { headers: getAuthHeader() });
      const data = await res.json();
      const newBalances = { '24k-995': '0.0000', '22k-916': '0.0000', '24k-999': '0.0000' };
      const holdingsArr = data.holdings || data;
      if (Array.isArray(holdingsArr)) {
        holdingsArr.forEach(h => {
          const qty = parseFloat(h.qty || 0).toFixed(4);
          if (h.metal_type?.toLowerCase().includes('gold24k')) newBalances['24k-995'] = qty;
          if (h.metal_type?.toLowerCase().includes('gold22k')) newBalances['22k-916'] = qty;
          if (h.metal_type?.toLowerCase().includes('silver')) newBalances['24k-999'] = qty;
        });
      }
      setMetalBalances(newBalances);
    } finally { setIsLoading(false); }
  };

  // --- 3. PAYMENT GATEWAY INTEGRATION ---
  
  const handlePaymentMethod = async (method) => {
    if (!isMarketOpen) return alert("Market is closed.");
    const currentMetal = metals.find(m => m.id === selectedMetal);
    const transactionId = `TXN_${Date.now()}`;

    const paymentData = {
      method,
      amount: parseFloat(amount),
      grams: parseFloat(grams),
      metalType: currentMetal.metalType,
      sipId: transactionId,
      sipType: 'quick_buy'
    };

    if (method === 'Online') {
      initiateRazorpay(paymentData);
    } else {
      sessionStorage.setItem('offlinePaymentData', JSON.stringify(paymentData));
      router.push('/payoffline_qb');
    }
  };

  const initiateRazorpay = async (data) => {
    try {
      const token = sessionStorage.getItem('authToken');
      // Step 1: Create Order on Backend
      const orderRes = await fetch('http://localhost:5000/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ amount: data.amount, currency: 'INR' })
      });
      const orderData = await orderRes.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
        amount: orderData.amount,
        currency: "INR",
        name: "Precious Metals App",
        order_id: orderData.id,
        handler: async (response) => {
          // Step 2: Verify Payment
          const verifyRes = await fetch('http://localhost:5000/api/payments/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ ...response, ...data })
          });
          if (verifyRes.ok) {
            alert("Payment Successful!");
            fetchHoldings();
            setShowPaymentDialog(false);
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) { alert("Razorpay failed to load"); }
  };

  // --- 4. ADMIN ACTIONS ---

  const toggleMarket = async () => {
    const newStatus = isMarketOpen ? 'CLOSED' : 'OPEN';
    try {
      const res = await fetch('http://localhost:5000/api/admin/market-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ status: newStatus, open_time: tradingHours.open, close_time: tradingHours.close })
      });
      if (res.ok) fetchMarketStatus();
    } catch (e) { console.error(e); }
  };

  const saveNewRates = async () => {
    try {
      await fetch('http://localhost:5000/api/price/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
        body: JSON.stringify({ 
          gold24K: metalRates['24k-995'], 
          gold22K: metalRates['22k-916'], 
          silver: metalRates['24k-999'] 
        })
      });
      setEditMode(false);
      fetchLatestPrices();
    } catch (e) { console.error(e); }
  };

  // --- 5. LIFECYCLE ---

  useEffect(() => {
    setUserType(sessionStorage.getItem('userType') || 'customer');
    setUsername(sessionStorage.getItem('username') || 'User');
    fetchMarketStatus();
    fetchLatestPrices();
    fetchHoldings();
    
    // Timer for clock
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);

    // Razorpay Script Injection
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => { clearInterval(timer); document.body.removeChild(script); };
  }, []);

  // --- 6. RENDER DATA ---

  const metals = [
    { id: '24k-995', name: 'Gold', purity: '24k-995', rate: metalRates['24k-995'], balance: metalBalances['24k-995'], image: gold_24k, metalType: 'gold24K' },
    { id: '22k-916', name: 'Gold', purity: '22k-916', rate: metalRates['22k-916'], balance: metalBalances['22k-916'], image: gold_22k, metalType: 'gold22K' },
    { id: '24k-999', name: 'Silver', purity: '24k-999', rate: metalRates['24k-999'], balance: metalBalances['24k-999'], image: silver, metalType: 'silver' }
  ];

  return (
    <div className="w-full max-w-md mx-auto bg-[#F8FAFC] min-h-screen pb-24 font-sans">
      
      {/* Header */}
      <header className="bg-white px-6 pt-10 pb-6 rounded-b-[2.5rem] shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <span className="text-[10px] font-black text-[#50C2C9] uppercase tracking-widest">Portfolio</span>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Hi, {username}</h1>
          </div>
          <button onClick={() => setShowNotifications(!showNotifications)} className="p-3 bg-slate-50 rounded-2xl relative">
            <Bell size={24} className="text-slate-600" />
            <span className="absolute top-3 right-3 w-2 h-2 bg-[#50C2C9] rounded-full border-2 border-white"></span>
          </button>
        </div>

        {/* Market Status Bar */}
        <div className={`flex items-center justify-between p-4 rounded-2xl ${isMarketOpen ? 'bg-emerald-50' : 'bg-rose-50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${isMarketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <div>
              <p className={`text-[11px] font-black uppercase ${isMarketOpen ? 'text-emerald-700' : 'text-rose-700'}`}>Market {marketStatus}</p>
              <p className="text-[10px] text-slate-500 font-medium">{currentTime} | {tradingHours.open}-{tradingHours.close}</p>
            </div>
          </div>
          {userType === 'admin' && (
            <button onClick={toggleMarket} className="p-2 bg-white rounded-xl shadow-sm">
              {isMarketOpen ? <Lock size={16} className="text-rose-500"/> : <Unlock size={16} className="text-emerald-500"/>}
            </button>
          )}
        </div>
      </header>

      {/* Holdings Card */}
      <main className="px-6 -mt-4">
        <div className="bg-white rounded-[2rem] p-6 shadow-xl shadow-slate-200/50 relative z-10 border border-white">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Current Balance</h2>
            <RefreshCw size={14} className={`text-[#50C2C9] ${isLoading ? 'animate-spin' : ''}`} onClick={fetchHoldings} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {metals.map(metal => (
              <div key={metal.id} className="text-center">
                <div className="relative w-12 h-12 mx-auto mb-2">
                  <Image src={metal.image} alt={metal.name} fill className="object-contain" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{metal.purity}</p>
                <p className="text-sm font-black text-slate-800">{metal.balance}g</p>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-50">
            <div className="flex justify-between mb-4">
              <span className="text-[10px] font-black text-slate-400 uppercase">Live Prices</span>
              {userType === 'admin' && (
                <button onClick={() => editMode ? saveNewRates() : setEditMode(true)} className="text-[10px] font-bold text-[#50C2C9]">
                  {editMode ? 'SAVE' : 'EDIT'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              {metals.map(m => (
                <div key={m.id} className="bg-slate-50 rounded-xl p-2 text-center">
                  {editMode ? (
                    <input 
                      type="number" className="w-full text-center bg-white rounded text-xs font-bold"
                      value={m.rate} onChange={(e) => setMetalRates({...metalRates, [m.id]: e.target.value})}
                    />
                  ) : (
                    <p className="text-xs font-black text-slate-800">₹{m.rate}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Purchase Section */}
        <div className="mt-8 bg-white rounded-[2rem] p-6 shadow-lg border border-white">
          <h3 className="text-lg font-black text-slate-800 mb-5">Quick Buy</h3>
          <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
            {metals.map(m => (
              <button 
                key={m.id} onClick={() => setSelectedMetal(m.id)}
                className={`flex-1 py-2.5 rounded-xl text-[10px] font-black transition-all ${selectedMetal === m.id ? 'bg-[#50C2C9] text-white shadow-md' : 'text-slate-500'}`}
              >
                {m.purity}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="relative">
              <label className="absolute left-4 top-2 text-[8px] font-black text-slate-400 uppercase">Grams</label>
              <input 
                type="number" value={grams} onChange={(e) => {
                  setGrams(e.target.value);
                  setAmount((e.target.value * metals.find(m => m.id === selectedMetal).rate).toFixed(0));
                }}
                className="w-full pt-6 pb-3 px-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-1 ring-[#50C2C9]/20"
                placeholder="0.0000"
              />
            </div>
            <div className="relative">
              <label className="absolute left-4 top-2 text-[8px] font-black text-slate-400 uppercase">Amount (INR)</label>
              <input 
                type="number" value={amount} onChange={(e) => {
                  setAmount(e.target.value);
                  setGrams((e.target.value / metals.find(m => m.id === selectedMetal).rate).toFixed(4));
                }}
                className="w-full pt-6 pb-3 px-4 bg-slate-50 rounded-2xl font-bold text-slate-800 outline-none focus:ring-1 ring-[#50C2C9]/20"
                placeholder="0"
              />
            </div>
          </div>

          <button 
            disabled={!isMarketOpen || !grams}
            onClick={() => setShowPaymentDialog(true)}
            className="w-full mt-6 py-4 bg-[#50C2C9] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-[#50C2C9]/30 disabled:opacity-50"
          >
            {isMarketOpen ? 'Proceed to Pay' : 'Market Closed'}
          </button>
        </div>
      </main>

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] p-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black text-slate-800">Checkout</h3>
              <X onClick={() => setShowPaymentDialog(false)} className="text-slate-400" />
            </div>
            <div className="space-y-4">
              <button onClick={() => handlePaymentMethod('Online')} className="w-full flex items-center justify-between p-5 bg-[#50C2C9] text-white rounded-2xl font-bold shadow-lg shadow-[#50C2C9]/20">
                <div className="flex items-center gap-4">
                  <CreditCard />
                  <div className="text-left">
                    <p className="text-sm">Online Gateway</p>
                    <p className="text-[10px] opacity-70">UPI, Net Banking, Cards</p>
                  </div>
                </div>
                <ChevronRight size={18} />
              </button>
              <button onClick={() => handlePaymentMethod('Offline')} className="w-full flex items-center justify-between p-5 bg-slate-50 text-slate-700 rounded-2xl font-bold border border-slate-100">
                <div className="flex items-center gap-4">
                  <ShoppingCart className="text-[#50C2C9]" />
                  <div className="text-left">
                    <p className="text-sm">Manual Transfer</p>
                    <p className="text-[10px] text-slate-400">NEFT / IMPS / RTGS</p>
                  </div>
                </div>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 px-8 py-4 flex justify-between items-center max-w-md mx-auto z-50">
        {[
          { icon: <Home />, label: 'Home', active: true, path: '/Home' },
          { icon: <PiggyBank />, label: 'SIP', path: '/savings_plan' },
          { icon: <History />, label: 'Passbook', path: '/Passbook' },
          { icon: <User />, label: 'Profile', path: '/profile' }
        ].map((item, i) => (
          <div key={i} onClick={() => router.push(item.path)} className={`flex flex-col items-center gap-1 cursor-pointer ${item.active ? 'text-[#50C2C9]' : 'text-slate-300'}`}>
            {React.cloneElement(item.icon, { size: 22, strokeWidth: 2.5 })}
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
          </div>
        ))}
      </nav>
    </div>
  );
};

export default PreciousMetalsApp;