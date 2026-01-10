'use client';
import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Home, Bell, PiggyBank, User, CreditCard, ChevronLeft, RefreshCw, Layers, TrendingUp, Gem, Wallet, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import BottomNavigation from '../../components/BottomNavigation';

export default function SecureVault() {
  const [metalsExpanded, setMetalsExpanded] = useState(true);
  const [holdings, setHoldings] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [adminPrices, setAdminPrices] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const router = useRouter();

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  const getAuthToken = () => {
    if (typeof window !== 'undefined') return sessionStorage.getItem('authToken');
    return null;
  };

  const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    return !!getAuthToken();
  };

  const getUserInfo = () => {
    if (typeof window !== 'undefined') {
      return {
        email: sessionStorage.getItem('userEmail') || '',
        username: sessionStorage.getItem('username') || '',
      };
    }
    return { email: '', username: '' };
  };

  // Fetch admin prices from API
  const fetchAdminPrices = async () => {
    try {
      setLoadingPrices(true);
      const token = getAuthToken();

      if (!token) return null;

      const response = await fetch('http://localhost:5000/api/price/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) return null;
      if (!response.ok) throw new Error(`Failed to fetch prices: ${response.status}`);

      const data = await response.json();

      let prices = data;
      if (data.latestPrice) prices = data.latestPrice;
      else if (data.data) prices = data.data;

      setAdminPrices(prices);
      return prices;
    } catch (error) {
      console.error('❌ Error fetching admin prices:', error);
      return null;
    } finally {
      setLoadingPrices(false);
    }
  };

  // Calculate amount based on quantity and current price
  const calculateAmount = (holding, prices = adminPrices) => {
    if (!holding || !holding.qty) return parseFloat(holding.amt) || 0;

    const quantity = parseFloat(holding.qty) || 0;
    if (!prices) return parseFloat(holding.amt) || 0;

    let currentPrice = 0;
    const metalType = holding.metal_type;

    if (prices[metalType]) {
      currentPrice = parseFloat(prices[metalType]) || 0;
    } else if (prices.gold24K && metalType.includes('24')) {
      currentPrice = parseFloat(prices.gold24K) || 0;
    } else if (prices.gold22K && metalType.includes('22')) {
      currentPrice = parseFloat(prices.gold22K) || 0;
    } else if (prices.silver && metalType.toLowerCase().includes('silver')) {
      currentPrice = parseFloat(prices.silver) || 0;
    } else if (prices.GOLD24K) {
      currentPrice = parseFloat(prices.GOLD24K) || 0;
    } else if (prices.GOLD22K) {
      currentPrice = parseFloat(prices.GOLD22K) || 0;
    } else if (prices.SILVER) {
      currentPrice = parseFloat(prices.SILVER) || 0;
    } else {
      // Fallback
      if (metalType.toUpperCase().includes('GOLD24K')) currentPrice = 13000;
      else if (metalType.toUpperCase().includes('GOLD22K')) currentPrice = 11930;
      else if (metalType.toUpperCase().includes('SILVER')) currentPrice = 150;
    }

    return quantity * currentPrice;
  };

  // Process holdings with current prices
  const processHoldingsWithPrices = (holdingsArray, prices) => {
    if (!holdingsArray || holdingsArray.length === 0) return { processedHoldings: [], total: 0 };

    let total = 0;
    const processedHoldings = holdingsArray.map(holding => {
      const calculatedAmount = calculateAmount(holding, prices);
      const originalAmount = parseFloat(holding.amt) || 0;
      const displayAmount = calculatedAmount > 0 ? calculatedAmount : originalAmount;

      total += displayAmount;
      return { ...holding, calculatedAmount, originalAmount, displayAmount };
    });

    return { processedHoldings, total };
  };

  const getMetalDisplayInfo = (metalType) => {
    const type = metalType.toUpperCase();
    if (type.includes('GOLD24K')) return { name: 'Pure Gold', purity: '24k (99.5%)', color: 'bg-yellow-400', gradient: 'from-amber-300 to-yellow-500', symbol: 'Au' };
    if (type.includes('GOLD22K')) return { name: 'Standard Gold', purity: '22k (91.6%)', color: 'bg-yellow-500', gradient: 'from-yellow-400 to-amber-600', symbol: 'Au' };
    if (type.includes('SILVER')) return { name: 'Silver', purity: '24k (99.9%)', color: 'bg-slate-300', gradient: 'from-slate-200 to-slate-400', symbol: 'Ag' };

    return { name: metalType, purity: 'Investment', color: 'bg-[#50C2C9]', gradient: 'from-[#50C2C9] to-teal-500', symbol: metalType.charAt(0) };
  };

  // Fetch holdings data
  const fetchHoldings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = getAuthToken();

      if (!token) {
        setError('Please login to view your holdings');
        setHoldings(getDemoData());
        setTotalSavings(0);
        setLoading(false);
        return;
      }

      const prices = await fetchAdminPrices();

      const response = await fetch('http://localhost:5000/api/holdings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        setError('Session expired. Please login again.');
        if (typeof window !== 'undefined') sessionStorage.clear();
        setHoldings(getDemoData());
        setTotalSavings(0);
        return;
      }

      if (!response.ok) throw new Error(`Failed to fetch holdings: ${response.status}`);

      const data = await response.json();
      let holdingsArray = [];

      if (Array.isArray(data)) holdingsArray = data;
      else if (data.holdings && Array.isArray(data.holdings)) holdingsArray = data.holdings;
      else if (data.data && Array.isArray(data.data)) holdingsArray = data.data;

      const { processedHoldings, total } = processHoldingsWithPrices(holdingsArray, prices);

      setHoldings(processedHoldings);
      setTotalSavings(total);

      // Manual fallback if total is 0
      if (total === 0 && holdingsArray.length > 0) {
        const manualTotal = holdingsArray.reduce((sum, holding) => {
          const qty = parseFloat(holding.qty) || 0;
          let price = 0;
          if (holding.metal_type.toUpperCase().includes('GOLD24K')) price = 13000;
          else if (holding.metal_type.toUpperCase().includes('GOLD22K')) price = 11930;
          else if (holding.metal_type.toUpperCase().includes('SILVER')) price = 150;
          return sum + (qty * price);
        }, 0);

        setTotalSavings(manualTotal);
      }
    } catch (error) {
      console.error('Error fetching holdings:', error);
      setError(`Error: ${error.message}`);
      setHoldings(getDemoData());
    } finally {
      setLoading(false);
    }
  };

  const getDemoData = () => [
    { metal_type: 'GOLD24K', amt: 0, qty: 0 },
    { metal_type: 'GOLD22K', amt: 0, qty: 0 },
    { metal_type: 'SILVER', amt: 0, qty: 0 }
  ];

  const handleLogin = () => router.push('/Authentication');

  const handleRefresh = async () => {
    await fetchHoldings();
  };

  useEffect(() => {
    if (isClient && isAuthenticated()) {
      fetchHoldings();
    } else if (isClient) {
      setLoading(false);
    }
  }, [isClient]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  const formatQuantity = (qty) => {
    const quantity = parseFloat(qty || 0);
    return quantity === 0 ? '0.0000 gm' : quantity.toFixed(4) + ' gm';
  };

  const getCurrentPrice = (metalType) => {
    if (!adminPrices) return 'Loading...';

    let priceItem = null;
    if (metalType.toUpperCase().includes('GOLD24K')) priceItem = adminPrices.gold24K || adminPrices.GOLD24K;
    else if (metalType.toUpperCase().includes('GOLD22K')) priceItem = adminPrices.gold22K || adminPrices.GOLD22K;
    else if (metalType.toUpperCase().includes('SILVER')) priceItem = adminPrices.silver || adminPrices.SILVER;

    return priceItem ? `₹${parseFloat(priceItem).toLocaleString('en-IN')}/gm` : 'N/A';
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#50C2C9] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-[#F8FAFC] min-h-screen pb-28 font-sans relative">

      {/* Header */}
      <header className="bg-white px-6 pt-10 pb-8 rounded-b-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-0 z-20">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-800" />
          </button>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Vault</h1>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className={`p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Total Savings Card */}
        <div className="bg-slate-900 rounded-[2rem] p-6 shadow-xl relative overflow-hidden group">
          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#50C2C9]/20 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-[#50C2C9]/30 transition-all duration-500"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#50C2C9]/10 rounded-full -ml-8 -mb-8 blur-xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <Layers className="w-4 h-4 text-[#50C2C9]" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Total Valuation</span>
            </div>

            <div className="text-4xl font-black text-white mb-2 tracking-tight">
              {formatCurrency(totalSavings)}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-slate-400">
                {isAuthenticated() ? (adminPrices ? 'Updated with live rates' : 'Syncing rates...') : 'Login for real prices'}
              </p>
              {adminPrices && (
                <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                  Live Live
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6 space-y-6">

        {/* Error/Login Prompts */}
        {error && (
          <div className="animate-in slide-in-from-top-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <p className="text-xs font-bold text-rose-700 flex-1">{error}</p>
            <button onClick={() => setError(null)}><ChevronDown className="w-4 h-4 text-rose-400" /></button>
          </div>
        )}

        {!isAuthenticated() && !error && (
          <Link href="/Authentication" className="block p-4 bg-amber-50 border border-amber-100 rounded-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-amber-800">Login Required</h3>
                <p className="text-[10px] font-bold text-amber-600 mt-1">Access your secure vault holdings</p>
              </div>
              <div className="bg-amber-100 text-amber-700 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider">
                Login
              </div>
            </div>
          </Link>
        )}

        {/* Holdings List */}
        <div className="space-y-4">
          <div className="flex justify-between items-end px-2">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Your Assets</h3>
            <span className="text-[10px] font-bold text-slate-400">{holdings.length} Metals</span>
          </div>

          {loading && !holdings.length ? (
            // Skeleton Loader
            [1, 2, 3].map(i => (
              <div key={i} className="bg-white p-4 rounded-[1.5rem] shadow-sm animate-pulse">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-2xl"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-slate-100 rounded"></div>
                    <div className="h-3 w-16 bg-slate-100 rounded"></div>
                  </div>
                  <div className="w-20 h-5 bg-slate-100 rounded"></div>
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-3">
              {holdings.map((holding) => {
                const info = getMetalDisplayInfo(holding.metal_type);
                return (
                  <div key={holding.metal_type} className="animate-in slide-in-from-bottom-4 bg-white rounded-[1.5rem] p-4 shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-50 hover:shadow-lg hover:scale-[1.02] transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${info.gradient} flex items-center justify-center shadow-sm text-white font-bold text-sm`}>
                          {info.symbol}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800">{info.name}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{info.purity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-800">{formatCurrency(holding.displayAmount)}</div>
                        <div className="items-center justify-end gap-1 text-[10px] font-bold text-emerald-500 hidden group-hover:flex animate-in fade-in">
                          <TrendingUp size={10} /> Live
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-50 flex justify-between items-center px-1">
                      <div>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-wider mb-0.5">Quantity</p>
                        <p className="text-xs font-bold text-slate-600">{formatQuantity(holding.qty)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-wider mb-0.5">Current Rate</p>
                        <p className="text-xs font-bold text-slate-600">{getCurrentPrice(holding.metal_type)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {isAuthenticated() && (
          <div className="bg-[#50C2C9]/5 rounded-[2rem] p-6 text-center border border-[#50C2C9]/20">
            <div className="w-12 h-12 bg-[#50C2C9]/10 rounded-full flex items-center justify-center mx-auto mb-3 text-[#50C2C9]">
              <Gem size={20} />
            </div>
            <h3 className="text-sm font-black text-slate-800 mb-1">Diversify Portfolio</h3>
            <p className="text-xs text-slate-500 mb-4 px-4 font-medium">Invest in other precious metals to secure your future.</p>
            <button onClick={() => router.push('/Home')} className="px-6 py-3 bg-[#50C2C9] text-white text-xs font-bold rounded-xl uppercase tracking-wider shadow-lg shadow-[#50C2C9]/20 hover:bg-[#45b1b9] transition-all">
              Invest Now
            </button>
          </div>
        )}

      </main>

      {/* Navigation Bar */}
      {/* Navigation Bar */}
      <BottomNavigation />

    </div>
  );
}