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

  // Fetch holdings data from API
  const fetchHoldings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = getAuthToken();
      
      if (!token) {
        setError('Please login to view your holdings');
        setHoldings(getDemoData());
        setLoading(false);
        return;
      }

      console.log('🔐 Fetching holdings with token:', token.substring(0, 20) + '...');
      console.log('👤 User info:', getUserInfo());

      const response = await fetch('http://localhost:5000/api/holdings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Response status:', response.status);
      
      if (response.status === 401) {
        setError('Session expired. Please login again.');
        // Clear invalid token
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('userEmail');
          sessionStorage.removeItem('username');
          sessionStorage.removeItem('userType');
          sessionStorage.removeItem('userId');
        }
        setHoldings(getDemoData());
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch holdings: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Holdings data received:', data);
      
      // Handle both array and object response formats
      if (Array.isArray(data)) {
        setHoldings(data);
        // Calculate total savings
        const total = data.reduce((sum, holding) => sum + parseFloat(holding.amt || 0), 0);
        setTotalSavings(total);
      } else if (data.holdings && Array.isArray(data.holdings)) {
        setHoldings(data.holdings);
        // Calculate total savings
        const total = data.holdings.reduce((sum, holding) => sum + parseFloat(holding.amt || 0), 0);
        setTotalSavings(total);
      } else {
        console.warn('Unexpected data format:', data);
        setHoldings(getDemoData());
        setTotalSavings(0);
      }
    } catch (error) {
      console.error('❌ Error fetching holdings:', error);
      setError(`Error loading holdings: ${error.message}`);
      setHoldings(getDemoData());
    } finally {
      setLoading(false);
    }
  };

  // Demo data for development
  const getDemoData = () => [
    { metal_type: 'GOLD_24K', amt: 0, qty: 0 },
    { metal_type: 'GOLD_22K', amt: 0, qty: 0 },
    { metal_type: 'MONEY', amt: 0, qty: 0 },
    { metal_type: 'SILVER', amt: 0, qty: 0 },
    { metal_type: 'EQUITY_FUNDS', amt: 0, qty: 0 },
    { metal_type: 'DEBT_FUNDS', amt: 0, qty: 0 }
  ];

  // Update holdings function
  const updateHoldings = async (metal_type, amt, qty) => {
    try {
      setError(null);
      
      const token = getAuthToken();
      
      if (!token) {
        setError('Please login to update holdings');
        return;
      }

      console.log('🔄 Updating holdings for:', metal_type);

      const response = await fetch('http://localhost:5000/api/holdings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ metal_type, amt, qty })
      });

      if (response.status === 401) {
        setError('Session expired. Please login again.');
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('authToken');
          sessionStorage.removeItem('userEmail');
          sessionStorage.removeItem('username');
          sessionStorage.removeItem('userType');
          sessionStorage.removeItem('userId');
        }
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to update holdings: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Holdings updated:', result);
      
      // Refresh holdings data after update
      fetchHoldings();
    } catch (error) {
      console.error('❌ Error updating holdings:', error);
      setError(`Error updating holdings: ${error.message}`);
    }
  };

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
    setError('Logged out successfully');
    setTimeout(() => setError(null), 3000);
  };

  useEffect(() => {
    if (isClient) {
      fetchHoldings();
    }
  }, [isClient]);

  // Helper function to get holding by metal type
  const getHoldingByType = (metalType) => {
    return holdings.find(holding => holding.metal_type === metalType) || { amt: 0, qty: 0 };
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
    return parseFloat(qty || 0).toFixed(4) + ' gms';
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
            onClick={fetchHoldings}
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

        {/* Total Savings */}
        <div className="rounded-xl p-6 bg-[#50C2C9]">
          <h2 className="text-white text-lg font-medium mb-2">Total savings</h2>
          <div className="text-white text-4xl font-bold">{formatCurrency(totalSavings)}</div>
          {loading && (
            <div className="text-white text-sm mt-2">Updating...</div>
          )}
          {!isAuthenticated() && (
            <div className="text-white text-sm mt-2 opacity-75">Demo mode - Login to see real data</div>
          )}
        </div>

        {/* Metals Section */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setMetalsExpanded(!metalsExpanded)}
            className="w-full flex justify-between items-center p-4 bg-gray-100"
          >
            <span className="font-semibold text-gray-700">Metals</span>
            {metalsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {metalsExpanded && (
            <div className="divide-y divide-gray-100">
              {/* Gold 24k-995 */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">GOLD</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Gold <span className="text-sm text-gray-500">24k-995</span></div>
                    <div className="text-gray-600 text-sm">
                      {formatQuantity(getHoldingByType('GOLD_24K').qty)}
                    </div>
                  </div>
                </div>
                <span className="font-medium">{formatCurrency(getHoldingByType('GOLD_24K').amt)}</span>
              </div>

              {/* Gold 22k-916 */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">GOLD</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Gold <span className="text-sm text-gray-500">22k-916</span></div>
                    <div className="text-gray-600 text-sm">
                      {formatQuantity(getHoldingByType('GOLD_22K').qty)}
                    </div>
                  </div>
                </div>
                <span className="font-medium">{formatCurrency(getHoldingByType('GOLD_22K').amt)}</span>
              </div>

              {/* Money */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                    <span className="text-white font-bold">₹</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Money</div>
                  </div>
                </div>
                <span className="font-medium">{formatCurrency(getHoldingByType('MONEY').amt)}</span>
              </div>

              {/* Silver */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center">
                    <span className="text-white font-bold text-xs">SILVER</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">Silver <span className="text-sm text-gray-500">24k-999</span></div>
                    <div className="text-gray-600 text-sm">
                      {formatQuantity(getHoldingByType('SILVER').qty)}
                    </div>
                  </div>
                </div>
                <span className="font-medium">{formatCurrency(getHoldingByType('SILVER').amt)}</span>
              </div>

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
                  </div>
                </div>
                <span className="font-bold text-[#50C2C9]">{formatCurrency(totalSavings)}</span>
              </div>
            </div>
          )}
        </div>

        {/* SIP Holdings Section */}
        <div className="bg-white rounded-xl overflow-hidden shadow-sm">
          <button
            onClick={() => setSipExpanded(!sipExpanded)}
            className="w-full flex justify-between items-center p-4 bg-gray-100"
          >
            <span className="font-semibold text-gray-700">SIP Holdings</span>
            {sipExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {sipExpanded && (
            <div className="divide-y divide-gray-100">
              {/* Total Amount */}
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
        </div>
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