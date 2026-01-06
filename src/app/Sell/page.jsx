'use client'; 
import React, { useState, useEffect } from 'react';
import { ChevronLeft, Building2, Check, Scale, ArrowLeftRight, ShoppingCart, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SellPage = () => {
  const [selectedMetal, setSelectedMetal] = useState('24k-995');
  const [grams, setGrams] = useState('');
  const [amount, setAmount] = useState('');
  const [currentBalance, setCurrentBalance] = useState({ amount: 0, grams: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableMetals, setAvailableMetals] = useState([]);
  const [holdingsData, setHoldingsData] = useState([]);
  const [adminPrices, setAdminPrices] = useState(null);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on mount and fetch data
  useEffect(() => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      router.push('/login');
      return;
    }
    // Fetch both prices and holdings in parallel
    fetchAdminPrices();
    fetchUserHoldings();
  }, []);

  // Map metal types from backend to frontend
  const metalTypeMap = {
    'gold24K': '24k-995',  // Backend value -> Frontend value
    'gold22K': '22k-916',
    'silver': '24k-999'
  };

  const reverseMetalTypeMap = {
    '24k-995': 'gold24K',
    '22k-916': 'gold22K',
    '24k-999': 'silver'
  };

  const fetchAdminPrices = async () => {
    try {
      setLoadingPrices(true);
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      
      console.log('📊 Fetching admin prices with token...');

      const response = await fetch('http://35.154.85.104:5000/api/price/', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        // Token expired or invalid
        clearSessionStorage();
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Admin prices received:', data);
      
      // Check different response formats
      let prices = data;
      if (data.latestPrice) {
        prices = data.latestPrice;
      } else if (data.data) {
        prices = data.data;
      }
      
      setAdminPrices(prices);
    } catch (err) {
      console.error('❌ Error fetching admin prices:', err);
      setError('Failed to load current prices. Please try again.');
    } finally {
      setLoadingPrices(false);
    }
  };

  const fetchUserHoldings = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      
      console.log('🔐 Fetching holdings with token:', token.substring(0, 20) + '...');

      const response = await fetch('http://35.154.85.104:5000/api/holdings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 401) {
        // Token expired or invalid
        clearSessionStorage();
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Holdings API error:', errorText);
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
      setHoldingsData(holdingsArray);

      // Process available metals when both holdings and prices are available
      processAvailableMetals(holdingsArray);
    } catch (err) {
      console.error('❌ Error fetching holdings:', err);
      setError('Failed to load current balance. Please try again.');
    }
  };

  const processAvailableMetals = (holdingsArray) => {
    // Wait for admin prices to be available
    if (!adminPrices || Object.keys(adminPrices).length === 0) {
      console.log('⚠️ Waiting for admin prices...');
      return;
    }

    console.log('💰 Processing metals with admin prices:', adminPrices);
    console.log('📦 Holdings array:', holdingsArray);

    const available = [];
    
    holdingsArray.forEach(holding => {
      const frontendMetalType = metalTypeMap[holding.metal_type];
      if (frontendMetalType) {
        const quantity = parseFloat(holding.qty) || 0;
        
        // Get current price from adminPrices
        // Try different key formats
        let currentPrice = 0;
        if (adminPrices[holding.metal_type]) {
          currentPrice = parseFloat(adminPrices[holding.metal_type]) || 0;
        } else if (adminPrices[frontendMetalType]) {
          currentPrice = parseFloat(adminPrices[frontendMetalType]) || 0;
        } else if (adminPrices.gold22K && holding.metal_type === 'gold22K') {
          currentPrice = parseFloat(adminPrices.gold22K) || 0;
        } else if (adminPrices.gold24K && holding.metal_type === 'gold24K') {
          currentPrice = parseFloat(adminPrices.gold24K) || 0;
        } else if (adminPrices.silver && holding.metal_type === 'silver') {
          currentPrice = parseFloat(adminPrices.silver) || 0;
        }
        
        const calculatedAmount = quantity * currentPrice;
        
        console.log(`📈 ${holding.metal_type}: ${quantity}gm × ₹${currentPrice} = ₹${calculatedAmount}`);
        
        available.push({
          id: frontendMetalType,
          backendId: holding.metal_type,
          name: getMetalName(frontendMetalType),
          purity: getMetalPurity(frontendMetalType),
          rate: currentPrice,
          qty: quantity,
          amt: calculatedAmount
        });
      }
    });

    console.log('🛠️ Available metals with calculated amounts:', available);
    setAvailableMetals(available);

    // If no metals are selected from available, select the first one
    if (available.length > 0) {
      const firstMetal = available[0].id;
      if (!available.some(m => m.id === selectedMetal)) {
        setSelectedMetal(firstMetal);
        updateCurrentBalance(firstMetal, available);
      } else {
        updateCurrentBalance(selectedMetal, available);
      }
    }
  };

  // Process metals when adminPrices changes
  useEffect(() => {
    if (holdingsData.length > 0 && adminPrices) {
      processAvailableMetals(holdingsData);
    }
  }, [adminPrices]);

  const getMetalName = (metalType) => {
    switch(metalType) {
      case '24k-995':
      case '22k-916':
        return 'Gold';
      case '24k-999':
        return 'Silver';
      default:
        return 'Metal';
    }
  };

  const getMetalPurity = (metalType) => {
    switch(metalType) {
      case '24k-995':
        return '24k-995';
      case '22k-916':
        return '22k-916';
      case '24k-999':
        return '24k-999';
      default:
        return '';
    }
  };

  const getMetalSymbol = (metalType) => {
    switch(metalType) {
      case '24k-995':
      case '22k-916':
        return 'Au';
      case '24k-999':
        return 'Ag';
      default:
        return '?';
    }
  };

  const updateCurrentBalance = (metalType, availableMetalsArray = availableMetals) => {
    const metal = availableMetalsArray.find(m => m.id === metalType);
    
    if (metal) {
      setCurrentBalance({
        amount: metal.amt,
        grams: metal.qty
      });
    } else {
      setCurrentBalance({ amount: 0, grams: 0 });
    }
  };

  const clearSessionStorage = () => {
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userType');
  };

  const handleGramsChange = (value) => {
    setGrams(value);
    const selectedMetalData = availableMetals.find(m => m.id === selectedMetal);
    if (selectedMetalData && value) {
      setAmount((parseFloat(value) * selectedMetalData.rate).toFixed(0));
    } else {
      setAmount('');
    }
  };

  const handleAmountChange = (value) => {
    setAmount(value);
    const selectedMetalData = availableMetals.find(m => m.id === selectedMetal);
    if (selectedMetalData && value) {
      setGrams((parseFloat(value) / selectedMetalData.rate).toFixed(4));
    } else {
      setGrams('');
    }
  };

  const handleMetalSelect = (metalId) => {
    setSelectedMetal(metalId);
    setGrams('');
    setAmount('');
    updateCurrentBalance(metalId);
  };

  const handleSell = async () => {
    // Validate inputs
    if (!grams || parseFloat(grams) <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    if (parseFloat(grams) > currentBalance.grams) {
      setError(`Insufficient holdings. You have only ${currentBalance.grams.toFixed(4)} gm`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        router.push('/Authentication');
        return;
      }

      // Convert frontend metal type to backend metal type
      const backendMetalType = reverseMetalTypeMap[selectedMetal];
      if (!backendMetalType) {
        setError('Invalid metal type selected');
        return;
      }

      const requestBody = {
        metal_type: backendMetalType, // Use backend metal type
        quantity: parseFloat(grams)
      };

      console.log('📤 Sending sell request:', requestBody);
      console.log('🔑 Using authToken:', token.substring(0, 20) + '...');

      const response = await fetch('http://35.154.85.104:5000/api/transactions/sell', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      console.log('📥 Sell response:', data);

      if (response.ok) {
        alert(data.message || 'Sell successful,Amount will be Credited with in 24Hours');
        setGrams('');
        setAmount('');
        
        // Refresh both prices and holdings
        await Promise.all([
          fetchAdminPrices(),
          fetchUserHoldings()
        ]);
        
      } else {
        setError(data.message || 'Sell failed. Please try again.');
      }
    } catch (err) {
      console.error('❌ Sell error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectedMetalAvailable = availableMetals.find(m => m.id === selectedMetal);

  console.log('🔧 Current state:');
  console.log('- selectedMetal:', selectedMetal);
  console.log('- availableMetals:', availableMetals);
  console.log('- selectedMetalAvailable:', selectedMetalAvailable);
  console.log('- currentBalance:', currentBalance);
  console.log('- adminPrices:', adminPrices);
  console.log('- holdingsData:', holdingsData);

  return (
    <div className="w-full max-w-sm mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100">
        <button className="mr-4" onClick={() => router.push('/Home')}>
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center mr-10">
          Sell
        </h1>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Loading Indicator for Prices */}
        {loadingPrices && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded">
            Loading current prices...
          </div>
        )}

        {/* Debug Info (remove in production) */}
        {/* {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded text-xs">
            <div>Admin Prices: {adminPrices ? 'Loaded' : 'Loading...'}</div>
            <div>Holdings: {holdingsData.length} items</div>
            <div>Available Metals: {availableMetals.length} types</div>
          </div>
        )} */}

        {/* Metal Selection - Only show available metals */}
        <div className="flex gap-2">
          {availableMetals.length > 0 ? (
            availableMetals.map((metal) => (
              <button
                key={metal.id}
                onClick={() => handleMetalSelect(metal.id)}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors flex flex-col items-center ${
                  selectedMetal === metal.id
                    ? 'bg-[#50C2C9] text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                <div>{metal.name}</div>
                <div className="text-xs opacity-80">{metal.purity}</div>
                <div className="text-xs mt-1 font-medium">{metal.qty.toFixed(4)} gm</div>
                <div className="text-xs mt-0.5 font-medium">
                  ₹{metal.amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </div>
              </button>
            ))
          ) : (
            <div className="w-full py-3 text-center text-gray-500 bg-gray-100 rounded-lg">
              {loadingPrices ? 'Loading prices...' : 'No holdings available to sell'}
            </div>
          )}
        </div>

        {/* Current Balance Card */}
        <div className="bg-[#50C2C9] text-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-2">Current Balance</h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">
              ₹ {currentBalance.amount.toLocaleString('en-IN', { 
                minimumFractionDigits: 2, 
                maximumFractionDigits: 2 
              })}
            </span>
            <span className="text-sm opacity-80 ml-2">({currentBalance.grams.toFixed(4)} gm)</span>
          </div>
          {selectedMetalAvailable && selectedMetalAvailable.rate > 0 && (
            <div className="mt-2 text-sm opacity-90">
              Current rate: ₹{selectedMetalAvailable.rate.toLocaleString('en-IN')}/gm
            </div>
          )}
        </div>

        {/* Sell Form */}
        {selectedMetalAvailable ? (
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex items-center justify-center mb-4">
              <span className="text-gray-700 font-medium">
                Sell {getMetalName(selectedMetal)}
              </span>
              <span className="text-sm text-gray-500 ml-1">
                ({getMetalPurity(selectedMetal)})
              </span>
              <div className={`w-8 h-8 rounded-full ml-2 flex items-center justify-center ${
                getMetalName(selectedMetal) === 'Gold' ? 'bg-yellow-400' : 'bg-gray-400'
              }`}>
                <span className={`font-bold text-sm ${
                  getMetalName(selectedMetal) === 'Gold' ? 'text-yellow-800' : 'text-gray-800'
                }`}>
                  {getMetalSymbol(selectedMetal)}
                </span>
              </div>
            </div>

            {/* Input Fields */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <Scale className="w-4 h-4" />
                  Grams
                </label>
                <input
                  type="number"
                  value={grams}
                  onChange={(e) => handleGramsChange(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#50C2C9] bg-white"
                  placeholder="0"
                  step="0.001"
                  min="0.001"
                  max={currentBalance.grams}
                />
                <div className="text-xs text-gray-500 mt-1">
                  Max: {currentBalance.grams.toFixed(4)} gm
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Amount
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    className="w-full p-3 pl-8 border-2 border-dashed border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#50C2C9] bg-white"
                    placeholder="0"
                    step="0.01"
                    min="0.01"
                  />
                  <span className="absolute left-3 top-3 text-gray-600">₹</span>
                </div>
              </div>
            </div>

            {/* Conversion Icon */}
            <div className="flex justify-center mb-4">
              <ArrowLeftRight className="w-6 h-6 text-gray-400" />
            </div>

            {/* Rate Information */}
            {selectedMetalAvailable.rate > 0 && (
              <div className="text-center text-sm text-gray-600 mb-2">
                Rate: ₹{selectedMetalAvailable.rate.toLocaleString('en-IN')}/gm
              </div>
            )}

            {/* Security Note */}
            <div className="text-center text-xs text-gray-400 mb-4">
              🛡️ 100% Safe & Secured | Pure {getMetalName(selectedMetal)}
            </div>
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <div className="text-gray-500">Select a metal from above to sell</div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <div className="flex items-center">
              <div className="flex-1">{error}</div>
              <button onClick={() => setError('')} className="ml-2 text-lg">×</button>
            </div>
          </div>
        )}

        {/* Bank Account Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#50C2C9] rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-medium text-gray-800">Bank Account</span>
              <div className="text-xs text-gray-500">Amount will be credited to your bank</div>
            </div>
          </div>
          <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Sell Button */}
        <button 
          onClick={handleSell}
          disabled={loading || !grams || parseFloat(grams) <= 0 || !selectedMetalAvailable}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
            loading || !grams || parseFloat(grams) <= 0 || !selectedMetalAvailable
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-[#50C2C9] hover:bg-[#3caab0] text-white'
          }`}
        >
          {loading ? 'Processing...' : `Sell ${getMetalName(selectedMetal)}`}
        </button>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 bg-white">
        <div className="flex">
          <button className="flex-1 flex flex-col items-center py-4 text-[#50C2C9]">
            <ShoppingCart className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Sell</span>
          </button>

          <Link href="/Sell_history" className="flex-1">
            <div className="flex flex-col items-center py-4 text-gray-400">
              <FileText className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">Sell History</span>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SellPage;