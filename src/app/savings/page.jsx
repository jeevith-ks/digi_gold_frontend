'use client';
import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Home, Bell, PiggyBank, User, CreditCard, ChevronLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SecureVault() {
  const [metalsExpanded, setMetalsExpanded] = useState(true);
  const [sipExpanded, setSipExpanded] = useState(false);
  const [holdings, setHoldings] = useState([]);
  const [totalSavings, setTotalSavings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isClient, setIsClient] = useState(false);
  const [adminPrices, setAdminPrices] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const router = useRouter();

  // Set client-side flag to prevent hydration mismatches
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Get authentication token from sessionStorage (only on client)
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('authToken');
    }
    return null;
  };

  // Check if user is authenticated (only on client)
  const isAuthenticated = () => {
    if (typeof window === 'undefined') return false;
    return !!getAuthToken();
  };

  // Get user info from sessionStorage (only on client)
  const getUserInfo = () => {
    if (typeof window !== 'undefined') {
      return {
        email: sessionStorage.getItem('userEmail') || '',
        username: sessionStorage.getItem('username') || '',
        userType: sessionStorage.getItem('userType') || '',
        userId: sessionStorage.getItem('userId') || ''
      };
    }
    return { email: '', username: '', userType: '', userId: '' };
  };

  const debugHoldingsData = (holdingsArray) => {
    console.log('🔍 DEBUG Holdings Structure:');
    holdingsArray.forEach((holding, index) => {
      console.log(`${index + 1}.`, {
        metal_type: holding.metal_type,
        qty: holding.qty,
        amt: holding.amt,
        keys: Object.keys(holding)
      });
    });
  };

  // Fetch admin prices from API
  const fetchAdminPrices = async () => {
    try {
      setLoadingPrices(true);
      const token = getAuthToken();
      
      if (!token) {
        console.log('No token available for fetching prices');
        return null;
      }

      console.log('📊 Fetching admin prices...');

      const response = await fetch('http://35.154.85.104:5000/api/price/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        console.log('Token expired for prices API');
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Admin prices received:', data);
      
      // Extract prices from response
      let prices = data;
      if (data.latestPrice) {
        prices = data.latestPrice;
      } else if (data.data) {
        prices = data.data;
      }
      
      setAdminPrices(prices);
      return prices;
    } catch (error) {
      console.error('❌ Error fetching admin prices:', error);
      return null;
    } finally {
      setLoadingPrices(false);
    }
  };

  // Calculate amount based on quantity and current price - SIMPLIFIED VERSION
  const calculateAmount = (holding, prices = adminPrices) => {
    if (!holding || !holding.qty) return parseFloat(holding.amt) || 0;
    
    const quantity = parseFloat(holding.qty) || 0;
    
    // If no prices, return the stored amount
    if (!prices) {
      return parseFloat(holding.amt) || 0;
    }
    
    let currentPrice = 0;
    const metalType = holding.metal_type;
    
    // DIRECT price lookup - check all possible formats
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
      // Fallback to fixed prices if not found
      if (metalType === 'gold24K' || metalType === 'GOLD24K') {
        currentPrice = 13000;
      } else if (metalType === 'gold22K' || metalType === 'GOLD22K') {
        currentPrice = 11930;
      } else if (metalType === 'silver' || metalType === 'SILVER') {
        currentPrice = 150;
      }
    }
    
    const amount = quantity * currentPrice;
    console.log(`💰 ${metalType}: ${quantity}gm × ₹${currentPrice} = ₹${amount}`);
    
    return amount;
  };

  // Process holdings with current prices
  const processHoldingsWithPrices = (holdingsArray, prices) => {
    if (!holdingsArray || holdingsArray.length === 0) {
      return { processedHoldings: [], total: 0 };
    }

    console.log('🔧 Processing holdings with prices:', holdingsArray.length, 'holdings');
    console.log('📊 Admin prices:', prices);

    let total = 0;
    const processedHoldings = holdingsArray.map(holding => {
      // Calculate with the provided prices
      const calculatedAmount = calculateAmount(holding, prices);
      const originalAmount = parseFloat(holding.amt) || 0;
      
      // Use calculated amount if we have prices and calculation > 0, otherwise use original
      const displayAmount = calculatedAmount > 0 ? calculatedAmount : originalAmount;
      
      total += displayAmount;
      
      console.log(`📈 ${holding.metal_type}:`, {
        qty: holding.qty,
        calculated: `₹${calculatedAmount.toFixed(2)}`,
        display: `₹${displayAmount.toFixed(2)}`,
        runningTotal: `₹${total.toFixed(2)}`
      });
      
      return {
        ...holding,
        calculatedAmount,
        originalAmount,
        displayAmount
      };
    });
    
    console.log('💰 FINAL Total:', total);
    
    return { processedHoldings, total };
  };

  // Map backend metal types to display names
  const getMetalDisplayInfo = (metalType) => {
    switch(metalType) {
      case 'gold24K':
      case 'GOLD24K':
        return { name: 'Gold', purity: '24k-995', color: 'bg-yellow-400', symbol: 'GOLD' };
      case 'gold22K':
      case 'GOLD22K':
        return { name: 'Gold', purity: '22k-916', color: 'bg-yellow-400', symbol: 'GOLD' };
      case 'silver':
      case 'SILVER':
        return { name: 'Silver', purity: '24k-999', color: 'bg-gray-400', symbol: 'SILVER' };
      case 'MONEY':
        return { name: 'Money', purity: '', color: 'bg-gray-800', symbol: '₹' };
      case 'EQUITY_FUNDS':
        return { name: 'Equity Funds', purity: '', color: 'bg-blue-400', symbol: 'EF' };
      case 'DEBT_FUNDS':
        return { name: 'Debt Funds', purity: '', color: 'bg-green-400', symbol: 'DF' };
      default:
        return { name: metalType, purity: '', color: 'bg-gray-300', symbol: metalType.charAt(0) };
    }
  };

  // Fetch holdings data from API
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

      console.log('🔐 Fetching holdings with token...');

      // Fetch prices first
      const prices = await fetchAdminPrices();
      
      // Then fetch holdings
      const response = await fetch('http://35.154.85.104:5000/api/holdings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Response status:', response.status);
      
      if (response.status === 401) {
        setError('Session expired. Please login again.');
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('userEmail');
          sessionStorage.removeItem('username');
          sessionStorage.removeItem('userType');
          sessionStorage.removeItem('userId');
        }
        setHoldings(getDemoData());
        setTotalSavings(0);
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch holdings: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Holdings data received:', data);
      
      // Extract holdings array from response
      let holdingsArray = [];
      
      if (Array.isArray(data)) {
        holdingsArray = data;
      } else if (data.holdings && Array.isArray(data.holdings)) {
        holdingsArray = data.holdings;
      } else if (data.data && Array.isArray(data.data)) {
        holdingsArray = data.data;
      }

      console.log('📊 Holdings array:', holdingsArray);
      
      // DEBUG: Log the structure
      debugHoldingsData(holdingsArray);

      // Process holdings with current prices
      const { processedHoldings, total } = processHoldingsWithPrices(holdingsArray, prices);
      
      setHoldings(processedHoldings);
      setTotalSavings(total);

      // If total is still 0 but we have data, calculate manually
      if (total === 0 && holdingsArray.length > 0) {
        console.log('⚠️ Total is 0 but we have holdings - forcing manual calculation');
        const manualTotal = holdingsArray.reduce((sum, holding) => {
          const qty = parseFloat(holding.qty) || 0;
          let price = 0;
          
          if (holding.metal_type === 'gold24K' || holding.metal_type === 'GOLD24K') price = 13000;
          else if (holding.metal_type === 'gold22K' || holding.metal_type === 'GOLD22K') price = 11930;
          else if (holding.metal_type === 'silver' || holding.metal_type === 'SILVER') price = 150;
          
          return sum + (qty * price);
        }, 0);
        
        console.log(`🔨 Manual calculation total: ₹${manualTotal.toFixed(2)}`);
        setTotalSavings(manualTotal);
        
        // Also update holdings with calculated amounts
        const updatedHoldings = processedHoldings.map(holding => {
          const qty = parseFloat(holding.qty) || 0;
          let price = 0;
          
          if (holding.metal_type === 'gold24K' || holding.metal_type === 'GOLD24K') price = 13000;
          else if (holding.metal_type === 'gold22K' || holding.metal_type === 'GOLD22K') price = 11930;
          else if (holding.metal_type === 'silver' || holding.metal_type === 'SILVER') price = 150;
          
          const calculatedAmount = qty * price;
          return {
            ...holding,
            calculatedAmount,
            displayAmount: calculatedAmount
          };
        });
        
        setHoldings(updatedHoldings);
      }

    } catch (error) {
      console.error('❌ Error fetching holdings:', error);
      setError(`Error loading holdings: ${error.message}`);
      setHoldings(getDemoData());
      setTotalSavings(0);
    } finally {
      setLoading(false);
    }
  };

  // Demo data for development
  const getDemoData = () => [
    { metal_type: 'GOLD24K', amt: 0, qty: 0, calculatedAmount: 0, displayAmount: 0 },
    { metal_type: 'GOLD22K', amt: 0, qty: 0, calculatedAmount: 0, displayAmount: 0 },
    { metal_type: 'MONEY', amt: 0, qty: 0, calculatedAmount: 0, displayAmount: 0 },
    { metal_type: 'SILVER', amt: 0, qty: 0, calculatedAmount: 0, displayAmount: 0 },
    { metal_type: 'EQUITY_FUNDS', amt: 0, qty: 0, calculatedAmount: 0, displayAmount: 0 },
    { metal_type: 'DEBT_FUNDS', amt: 0, qty: 0, calculatedAmount: 0, displayAmount: 0 }
  ];

  // Handle login
  const handleLogin = () => {
    router.push('/Authentication');
  };

  // Handle logout
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('authToken');
      sessionStorage.removeItem('userEmail');
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('userType');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('phone');
    }
    setHoldings(getDemoData());
    setTotalSavings(0);
    setAdminPrices(null);
    setError('Logged out successfully');
    setTimeout(() => setError(null), 3000);
  };

  // Refresh all data
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

  // Helper function to get holding by metal type
  const getHoldingByType = (metalType) => {
    const holding = holdings.find(h => 
      h.metal_type === metalType || 
      h.metal_type === metalType.toUpperCase() ||
      h.metal_type === metalType.toLowerCase()
    );
    
    if (holding) {
      return {
        ...holding,
        displayAmount: holding.displayAmount || holding.calculatedAmount || parseFloat(holding.amt) || 0
      };
    }
    return { metal_type: metalType, qty: 0, displayAmount: 0 };
  };

  // Get all holdings total for debugging
  const getAllHoldingsTotal = () => {
    return holdings.reduce((total, holding) => {
      const amount = holding.displayAmount || holding.calculatedAmount || parseFloat(holding.amt) || 0;
      return total + amount;
    }, 0);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format quantity
  const formatQuantity = (qty) => {
    const quantity = parseFloat(qty || 0);
    if (quantity === 0) return '0 gms';
    return quantity.toFixed(4) + ' gms';
  };

  // Get current price for a metal type
  const getCurrentPrice = (metalType) => {
    if (!adminPrices) return 'Loading...';
    
    if (adminPrices[metalType]) {
      return `₹${parseFloat(adminPrices[metalType]).toLocaleString('en-IN')}/gm`;
    } else if (metalType === 'gold24K' && adminPrices.gold24K) {
      return `₹${parseFloat(adminPrices.gold24K).toLocaleString('en-IN')}/gm`;
    } else if (metalType === 'gold22K' && adminPrices.gold22K) {
      return `₹${parseFloat(adminPrices.gold22K).toLocaleString('en-IN')}/gm`;
    } else if (metalType === 'silver' && adminPrices.silver) {
      return `₹${parseFloat(adminPrices.silver).toLocaleString('en-IN')}/gm`;
    } else if (adminPrices.GOLD24K) {
      return `₹${parseFloat(adminPrices.GOLD24K).toLocaleString('en-IN')}/gm`;
    } else if (adminPrices.GOLD22K) {
      return `₹${parseFloat(adminPrices.GOLD22K).toLocaleString('en-IN')}/gm`;
    } else if (adminPrices.SILVER) {
      return `₹${parseFloat(adminPrices.SILVER).toLocaleString('en-IN')}/gm`;
    }
    
    return 'Price not available';
  };

  const userInfo = getUserInfo();

  // Don't render anything until we're on the client to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#50C2C9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading SecureVault...</p>
        </div>
      </div>
    );
  }

  // Debug info - remove in production
  // const debugInfo = process.env.NODE_ENV === 'development' ? (
  //   <div className="bg-gray-800 text-white p-3 rounded text-xs">
  //     <div className="font-bold mb-1">Debug Information:</div>
  //     <div>Total Savings State: ₹{totalSavings.toFixed(2)}</div>
  //     <div>Calculated Total: ₹{getAllHoldingsTotal().toFixed(2)}</div>
  //     <div>Holdings Count: {holdings.length}</div>
  //     <div>Admin Prices: {adminPrices ? 'Loaded' : 'Not loaded'}</div>
  //     <div>Holdings Details:</div>
  //     {holdings.map((h, i) => (
  //       <div key={i} className="ml-2">
  //         {h.metal_type}: Qty={h.qty}, Amt=₹{(h.displayAmount || h.calculatedAmount || 0).toFixed(2)}
  //       </div>
  //     ))}
  //   </div>
  // ) : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100">
        <button className="mr-4" onClick={() => router.push('/Home')}>
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center mr-10">
          SecureVault
        </h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleRefresh}
            className="p-1"
            disabled={loading}
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className={`mx-4 mt-4 p-3 rounded-lg ${
          error.includes('expired') || error.includes('Please login') || error.includes('Logged out')
            ? 'bg-red-100 border border-red-400 text-red-700'
            : error.includes('successfully')
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-blue-100 border border-blue-400 text-blue-700'
        }`}>
          <div className="flex justify-between items-center">
            <span className="text-sm">{error}</span>
            <button onClick={() => setError(null)} className="text-lg">×</button>
          </div>
          {error.includes('Please login') && (
            <button 
              onClick={handleLogin}
              className="mt-2 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
            >
              Login Now
            </button>
          )}
        </div>
      )}

      {/* Debug Info - Only in development */}
      {/* {process.env.NODE_ENV === 'development' && debugInfo} */}
      {process.env.NODE_ENV === 'development'}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-28">
        
        {/* Login Prompt - Only show when not authenticated */}
        {!isAuthenticated() && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm font-medium">You are not logged in</span>
                <p className="text-xs mt-1">Login to access your real holdings data</p>
              </div>
              <button 
                onClick={handleLogin}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
              >
                Login
              </button>
            </div>
          </div>
        )}

        {/* Current Prices Info */}
        {/* {adminPrices && isAuthenticated() && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-sm text-green-800 font-medium mb-1">Current Market Prices</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {(adminPrices.gold24K || adminPrices.GOLD24K) && (
                <div className="flex justify-between">
                  <span>Gold 24K:</span>
                  <span className="font-medium">
                    ₹{parseFloat(adminPrices.gold24K || adminPrices.GOLD24K || 0).toLocaleString('en-IN')}/gm
                  </span>
                </div>
              )}
              {(adminPrices.gold22K || adminPrices.GOLD22K) && (
                <div className="flex justify-between">
                  <span>Gold 22K:</span>
                  <span className="font-medium">
                    ₹{parseFloat(adminPrices.gold22K || adminPrices.GOLD22K || 0).toLocaleString('en-IN')}/gm
                  </span>
                </div>
              )}
              {(adminPrices.silver || adminPrices.SILVER) && (
                <div className="flex justify-between">
                  <span>Silver:</span>
                  <span className="font-medium">
                    ₹{parseFloat(adminPrices.silver || adminPrices.SILVER || 0).toLocaleString('en-IN')}/gm
                  </span>
                </div>
              )}
            </div>
          </div>
        )} */}

        {/* Loading Indicator */}
        {loading && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mr-2"></div>
              <span>Loading current holdings and prices...</span>
            </div>
          </div>
        )}

        {/* Total Savings */}
        <div className="rounded-xl p-6 bg-[#50C2C9]">
          <h2 className="text-white text-lg font-medium mb-2">Total savings</h2>
          <div className="text-white text-4xl font-bold">{formatCurrency(totalSavings)}</div>
          <div className="text-white text-sm mt-2 opacity-90">
            {isAuthenticated() ? (
              adminPrices ? 'Based on current market prices' : 'Calculating...'
            ) : 'Demo mode - Login to see real data'}
          </div>
          {adminPrices && (
            <div className="text-white text-xs mt-1 opacity-75">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          )}
        </div>

        {/* Metals Section - SIMPLIFIED TO SHOW ALL HOLDINGS */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setMetalsExpanded(!metalsExpanded)}
            className="w-full flex justify-between items-center p-4 bg-gray-100"
          >
            <div className="flex items-center">
              <span className="font-semibold text-gray-700">Metals</span>
              {loadingPrices && (
                <div className="ml-2 w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></div>
              )}
            </div>
            {metalsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {metalsExpanded && holdings.length > 0 && (
            <div className="divide-y divide-gray-100">
              {/* Show ALL holdings dynamically */}
              {holdings.map(holding => {
                const info = getMetalDisplayInfo(holding.metal_type);
                return (
                  <div key={holding.metal_type} className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-full ${info.color} flex items-center justify-center`}>
                        <span className="text-white font-bold text-xs">{info.symbol}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">
                          {info.name} 
                          {info.purity && <span className="text-sm text-gray-500"> {info.purity}</span>}
                        </div>
                        <div className="text-gray-600 text-sm">
                          {formatQuantity(holding.qty)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getCurrentPrice(holding.metal_type)}
                        </div>
                      </div>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(holding.displayAmount || holding.calculatedAmount || 0)}
                    </span>
                  </div>
                );
              })}

              {/* Total Amount */}
              <div className="flex items-center justify-between p-4 bg-gray-50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 flex items-center justify-center">
                    <div className="flex">
                      <div className="w-4 h-4 rounded-full bg-[#50C2C9]"></div>
                      <div className="w-4 h-4 rounded-full ml-1 bg-[#50C2C9]"></div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium text-[#50C2C9]">Total Amount</div>
                    <div className="text-xs text-[#50C2C9] opacity-75">
                      Sum of all holdings
                    </div>
                  </div>
                </div>
                <span className="font-bold text-[#50C2C9]">{formatCurrency(totalSavings)}</span>
              </div>
            </div>
          )}
        </div>

        {/* SIP Holdings Section */}
        {/* <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setSipExpanded(!sipExpanded)}
            className="w-full flex justify-between items-center p-4 bg-gray-100"
          >
            <span className="font-semibold text-gray-700">SIP Holdings</span>
            {sipExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {sipExpanded && (
            <div className="divide-y divide-gray-100">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className="flex">
                    <div className="w-5 h-5 rounded-full bg-orange-400"></div>
                    <div className="w-5 h-5 rounded-full bg-orange-400 -ml-2"></div>
                  </div>
                  <div>
                    <div className="font-medium text-orange-500">Total Amount</div>
                  </div>
                </div>
                <span className="font-bold text-orange-500">₹ 0.00</span>
              </div>
            </div>
          )}
        </div> */}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-inner">
        <div className="flex justify-around items-center py-2">
          <Link href="/Home" className="flex flex-col items-center py-2 px-4 cursor-pointer">
            <Home className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Home</span>
          </Link>
          <Link href="/notification" className="flex flex-col items-center py-2 px-4">
            <Bell className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Notification</span>
          </Link>
          <Link href="/savings" className="flex flex-col items-center py-2 px-4">
            <PiggyBank className="w-6 h-6 text-[#50C2C9]" />
            <span className="text-xs mt-1 text-[#50C2C9]">Savings</span>
          </Link>
          <Link href="/Passbook" className="flex flex-col items-center py-2 px-4">
            <CreditCard className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Passbook</span>
          </Link>
          <Link href="/profile" className="flex flex-col items-center py-2 px-4">
            <User className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}