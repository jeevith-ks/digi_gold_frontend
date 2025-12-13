'use client';
import React, { useState, useEffect } from 'react';
import { Home, Bell, Shield, User, Gift, ShoppingCart, ArrowLeftRight, Scale, CreditCard, PiggyBank, Edit2, Save, RefreshCw, Clock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import gold_24k from '../images/24k_gold.png';
import gold_22k from '../images/22k_gold_v.jpg';
import silver from '../images/silver_coin_v.jpg';

const PreciousMetalsApp = () => {
  const [selectedMetal, setSelectedMetal] = useState('24k-995');
  const [grams, setGrams] = useState('');
  const [amount, setAmount] = useState('');
  const [userType, setUserType] = useState('');
  const [username, setUsername] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState(null);
  const [metalRates, setMetalRates] = useState({
    '24k-995': 10170,
    '22k-916': 9560,
    '24k-999': 118
  });
  const [metalBalances, setMetalBalances] = useState({
    '24k-995': '0.0000',
    '22k-916': '0.0000', 
    '24k-999': '0.0000'
  });
  const [holdings, setHoldings] = useState([]);

  // Get user data from sessionStorage and fetch initial data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedUserType = sessionStorage.getItem('userType');
      const storedUsername = sessionStorage.getItem('username');
      const storedToken = sessionStorage.getItem('authToken');
      
      console.log('Session Storage Data:', {
        userType: storedUserType,
        username: storedUsername,
        hasToken: !!storedToken
      });
      
      if (storedUserType) {
        setUserType(storedUserType);
      }
      if (storedUsername) {
        setUsername(storedUsername);
      }

      // Fetch initial data based on user type
      if (storedUserType === 'customer' && storedToken) {
        fetchHoldings(storedToken);
        fetchLatestPrices(storedToken); // Fetch prices immediately for customers
      } else if (storedUserType === 'admin') {
        // Set zeros for admin users
        setMetalBalances({
          '24k-995': '0.0000',
          '22k-916': '0.0000',
          '24k-999': '0.0000'
        });
      }
    }
  }, []);

  // Set up hourly price updates for customers
  useEffect(() => {
    let priceInterval;
    
    if (userType === 'customer') {
      const token = sessionStorage.getItem('authToken');
      if (token) {
        // Fetch prices immediately and then set up hourly interval
        fetchLatestPrices(token);
        
        // Set up interval for hourly price updates (1 hour = 3600000 ms)
        priceInterval = setInterval(() => {
          console.log('🕒 Hourly price update triggered');
          fetchLatestPrices(token);
        }, 3600000); // 1 hour in milliseconds
        
        console.log('⏰ Hourly price updates enabled for customer');
      }
    }
    
    // Cleanup interval on component unmount or user type change
    return () => {
      if (priceInterval) {
        clearInterval(priceInterval);
        console.log('⏰ Hourly price updates disabled');
      }
    };
  }, [userType]);

  // Fetch latest prices from API
  const fetchLatestPrices = async (token) => {
    try {
      setIsLoadingPrices(true);
      console.log('💰 Fetching latest prices...');

      const response = await fetch('http://localhost:5000/api/price/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Price response status:', response.status);
      

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Latest prices received:', data);
        
        if (data.latestPrice) {
          // Update metal rates with latest prices
          setMetalRates({
            '24k-995': data.latestPrice.gold24K,
            '22k-916': data.latestPrice.gold22K,
            '24k-999': data.latestPrice.silver
          });
          
          // Update last price update time
          setLastPriceUpdate(new Date().toLocaleTimeString());
          console.log('🔄 Metal rates updated with latest prices');
        }
      } else {
        console.error('❌ Failed to fetch prices:', response.status);
        // Keep existing rates if fetch fails
      }
    } catch (error) {
      console.error('❌ Error fetching prices:', error);
      // Keep existing rates on error
    } finally {
      setIsLoadingPrices(false);
    }
  };

  // Fetch holdings data for customers
  const fetchHoldings = async (token) => {
    try {
      setIsLoading(true);
      console.log('🔐 Fetching holdings for customer...');

      const response = await fetch('http://localhost:5000/api/holdings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📡 Holdings response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Holdings data received:', data);
        setHoldings(data.holdings || data); // Handle both response formats
        
        // Update metal balances based on holdings data
        updateMetalBalances(data.holdings || data);
      } else {
        console.error('❌ Failed to fetch holdings:', response.status);
        // Set zeros if fetch fails
        setMetalBalances({
          '24k-995': '0.0000',
          '22k-916': '0.0000',
          '24k-999': '0.0000'
        });
      }
    } catch (error) {
      console.error('❌ Error fetching holdings:', error);
      // Set zeros on error
      setMetalBalances({
        '24k-995': '0.0000',
        '22k-916': '0.0000',
        '24k-999': '0.0000'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Update metal balances based on holdings data
  const updateMetalBalances = (holdingsData) => {
    const newBalances = {
      '24k-995': '0.0000',
      '22k-916': '0.0000',
      '24k-999': '0.0000'
    };

    if (Array.isArray(holdingsData)) {
      holdingsData.forEach(holding => {
        const qty = parseFloat(holding.qty) || 0;
        
        switch (holding.metal_type) {
          case 'gold24K':
          case 'GOLD_24K':
            newBalances['24k-995'] = qty.toFixed(4);
            break;
          case 'gold22K':
          case 'GOLD_22K':
            newBalances['22k-916'] = qty.toFixed(4);
            break;
          case 'silver':
          case 'SILVER':
            newBalances['24k-999'] = qty.toFixed(4);
            break;
          default:
            console.log('Unknown metal type:', holding.metal_type);
        }
      });
    }

    console.log('📊 Updated metal balances:', newBalances);
    setMetalBalances(newBalances);
  };

  // Refresh holdings data
  const handleRefreshHoldings = () => {
    const token = sessionStorage.getItem('authToken');
    const currentUserType = sessionStorage.getItem('userType');
    
    if (currentUserType === 'customer' && token) {
      fetchHoldings(token);
    }
  };

  // Refresh prices manually
  const handleRefreshPrices = () => {
    const token = sessionStorage.getItem('authToken');
    const currentUserType = sessionStorage.getItem('userType');
    
    if (currentUserType === 'customer' && token) {
      fetchLatestPrices(token);
    }
  };

  // ✅ add image references
  const metals = [
    { 
      id: '24k-995', 
      name: 'Gold', 
      purity: '24k-995', 
      rate: metalRates['24k-995'], 
      balance: metalBalances['24k-995'], 
      image: gold_24k,
      metalType: 'gold24K'
    },
    { 
      id: '22k-916', 
      name: 'Gold', 
      purity: '22k-916', 
      rate: metalRates['22k-916'], 
      balance: metalBalances['22k-916'], 
      image: gold_22k,
      metalType: 'gold22K'
    },
    { 
      id: '24k-999', 
      name: 'Silver', 
      purity: '24k-999', 
      rate: metalRates['24k-999'], 
      balance: metalBalances['24k-999'], 
      image: silver,
      metalType: 'silver'
    }
  ];

  const actionButtons = [
    { icon: <ShoppingCart className="w-6 h-6" />, label: 'Sell', href: '/Sell' },
    { icon: <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center text-white text-xs font-bold">₹</div>, label: 'SIP', href: '/savings_plan' },
    // { icon: <Gift className="w-6 h-6" />, label: 'Gift', href: '/gifts' },
    { icon: <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center text-white text-xs">💰</div>, label: 'LookBook', href: '/Loan' }
  ];

  const navItems = [
    { icon: <Home className="w-6 h-6" />, label: 'Home', active: true, href: '/Home' },
    { icon: <Bell className="w-6 h-6" />, label: 'Notification', href: '/Notifications' },
    { icon: <PiggyBank className="w-6 h-6" />, label: 'Savings', href: '/savings' },
    { icon: <CreditCard className="w-6 h-6" />, label: 'Passbook', href: '/Passbook' },
    { icon: <User className="w-6 h-6" />, label: 'Profile', href: '/profile' }
  ];

  const handleGramsChange = (value) => {
    setGrams(value);
    const selectedMetalData = metals.find(m => m.id === selectedMetal);
    if (selectedMetalData && value) {
      setAmount((parseFloat(value) * selectedMetalData.rate).toFixed(0));
    } else {
      setAmount('');
    }
  };

  const handleAmountChange = (value) => {
    setAmount(value);
    const selectedMetalData = metals.find(m => m.id === selectedMetal);
    if (selectedMetalData && value) {
      setGrams((parseFloat(value) / selectedMetalData.rate).toFixed(4));
    } else {
      setGrams('');
    }
  };

  const handleRateChange = (metalId, newRate) => {
    setMetalRates(prev => ({
      ...prev,
      [metalId]: parseFloat(newRate) || 0
    }));
  };

  const handleSaveRates = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    
    try {
      const token = sessionStorage.getItem('authToken');
      const currentUserType = sessionStorage.getItem('userType');
      
      console.log('Current user type:', currentUserType);
      console.log('Token exists:', !!token);
      
      if (!token) {
        alert('Authentication token not found. Please login again.');
        setIsSaving(false);
        return;
      }

      if (currentUserType !== 'admin') {
        alert('You do not have admin privileges to update rates.');
        setIsSaving(false);
        return;
      }

      // Prepare the data for API - ONLY send the price data, NOT the token
      const priceData = {
        gold24K: metalRates['24k-995'],
        gold22K: metalRates['22k-916'],  
        silver: metalRates['24k-999']
      };

      console.log('Sending price data to API:', priceData);

      const response = await fetch('http://localhost:5000/api/price/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Send token in Authorization header
        },
        body: JSON.stringify(priceData) // Only send price data in body
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Price update successful:', result);
        alert('Rates updated successfully for all users!');
        setEditMode(false);
      } else {
        const errorData = await response.json();
        console.error('Failed to update rates:', errorData);
        
        if (response.status === 401) {
          alert('Unauthorized: Please login again.');
        } else if (response.status === 403) {
          alert('Access forbidden: You do not have admin privileges.');
          setEditMode(false);
        } else {
          alert('Failed to update rates: ' + (errorData.message || 'Unknown error'));
        }
      }
    } catch (error) {
      console.error('Error updating rates:', error);
      alert('Error updating rates. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditToggle = () => {
    // Double-check admin privileges before allowing edit mode
    const currentUserType = sessionStorage.getItem('userType');
    if (currentUserType !== 'admin') {
      alert('You do not have admin privileges to edit rates.');
      return;
    }
    setEditMode(!editMode);
  };

  // Debug function to check user data
  const debugUserData = () => {
    const token = sessionStorage.getItem('authToken');
    const userType = sessionStorage.getItem('userType');
    const username = sessionStorage.getItem('username');
    
    console.log('Debug User Data:', {
      token: token ? 'Exists' : 'Missing',
      userType,
      username,
      tokenLength: token ? token.length : 0,
      metalBalances,
      metalRates,
      lastPriceUpdate,
      holdingsCount: holdings.length
    });
    
    if (token) {
      // Decode JWT token to see payload (for debugging)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', payload);
      } catch (e) {
        console.log('Could not decode token:', e);
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-screen flex flex-col font-sans">
      {/* Admin Header - Only show for admin users */}
      {userType === 'admin' && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium text-blue-800">Admin Mode</span>
              <p className="text-xs text-blue-600">Welcome, {username}</p>
              {/* Debug button - remove in production */}
              <button 
                onClick={debugUserData}
                className="text-xs text-blue-500 underline mt-1"
              >
                Debug User Data
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {editMode ? (
                <button
                  onClick={handleSaveRates}
                  disabled={isSaving}
                  className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save'}</span>
                </button>
              ) : (
                <button
                  onClick={handleEditToggle}
                  className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Rates</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Customer Header - Only show for customer users */}
      {userType === 'customer' && (
        <div className="bg-green-50 border-b border-green-200 px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm font-medium text-green-800">Customer Mode</span>
              <p className="text-xs text-green-600">Welcome, {username}</p>
              <div className="text-xs text-green-500 mt-1">
                {isLoading ? 'Loading holdings...' : 'Real-time holdings data'}
              </div>
              {lastPriceUpdate && (
                <div className="text-xs text-green-600 flex items-center space-x-1 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>Prices updated: {lastPriceUpdate}</span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleRefreshPrices}
                disabled={isLoadingPrices}
                className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingPrices ? 'animate-spin' : ''}`} />
                <span>Refresh Prices</span>
              </button>
              <button
                onClick={handleRefreshHoldings}
                disabled={isLoading}
                className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh Holdings</span>
              </button>
              {/* Debug button - remove in production */}
              <button 
                onClick={debugUserData}
                className="text-xs text-green-500 underline"
              >
                Debug
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Precious Metals Balance ===== */}
      <div className="bg-gray-100 rounded-lg m-4 p-4">
        {/* Header Row */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {metals.map((metal, index) => (
            <div key={index} className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center bg-white shadow-md overflow-hidden mb-2">
                <Image
                  src={metal.image}
                  alt={metal.name}
                  className="object-contain"
                  width={56}
                  height={56}
                />
              </div>
              <span className="text-sm font-medium text-gray-800">{metal.name}</span>
            </div>
          ))}
        </div>

        {/* Balance Section */}
        <div className="mb-4">
          <div className="text-left mb-2">
            <span className="text-sm font-medium text-gray-700">Balance</span>
            <br />
            <span className="text-xs text-gray-500">in gms</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {metals.map((metal, index) => (
              <div key={index} className="text-center">
                <div className="text-lg font-bold text-gray-800 mb-1">
                  {isLoading ? '...' : metal.balance}
                </div>
                <div className="text-xs text-gray-500">
                  {metal.purity}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Current Rate Section */}
        <div>
          <div className="text-left mb-2">
            <span className="text-sm font-medium text-gray-700">Current</span>
            <br />
            <span className="text-xs text-gray-500">rate(₹)/gm</span>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2">
            {metals.map((metal, index) => (
              <div key={index} className="text-center">
                {userType === 'admin' && editMode ? (
                  <input
                    type="number"
                    value={metalRates[metal.id]}
                    onChange={(e) => handleRateChange(metal.id, e.target.value)}
                    className="w-full text-lg font-bold text-gray-800 text-center border border-blue-300 rounded px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="0.01"
                  />
                ) : (
                  <div className="text-lg font-bold text-gray-800">
                    {isLoadingPrices ? '...' : metal.rate}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="text-right">
            <span className="text-xs text-gray-400">Rates are exclusive of 3% GST</span>
            {userType === 'customer' && (
              <div className="text-xs text-green-600 flex items-center justify-end space-x-1 mt-1">
                <Clock className="w-3 h-3" />
                <span>Auto-updates hourly</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rest of your component remains the same */}
      {/* ===== Quick Buy Section ===== */}
      {/* <div className="bg-gray-100 rounded-lg m-4 p-4"> */}
        {/* ?<h2 className="text-xl font-bold text-gray-800 mb-4">Quick Buy</h2> */}

        {/* Metal Selection */}
        {/* <div className="flex flex-wrap gap-2 mb-4">
          {metals.map((metal) => (
            <button
              key={metal.id}
              onClick={() => setSelectedMetal(metal.id)}
              className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                selectedMetal === metal.id
                  ? 'bg-[#50C2C9] text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              <div>{metal.name}</div>
              <div className="text-xs opacity-80">{metal.purity}</div>
            </button>
          ))}
        </div> */}

        {/* Input Fields */}
        {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Scale className="w-4 h-4" />
              Grams
            </label>
            <input
              type="number"
              value={grams}
              onChange={(e) => handleGramsChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#50C2C9]"
              placeholder="0"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              ₹ Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#50C2C9]"
              placeholder="0"
            />
          </div>
        </div> */}

        {/* Conversion Icon */}
        {/* <div className="flex justify-center mb-4">
          <ArrowLeftRight className="w-6 h-6 text-gray-400" />
        </div> */}

        {/* <div className="text-right text-xs text-gray-400 mb-4">
          GST included
        </div> */}

        {/* Buy Now Button */}
        {/* <button className="w-full bg-[#50C2C9] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#3AA8AF] transition-colors">
          Buy Now
        </button> */}
      {/* </div> */}

      {/* ===== Action Buttons ===== */}
      <div className="flex justify-around flex-wrap px-2 py-3 gap-2 sticky bottom-20 bg-white">
        {actionButtons.map((button, index) => (
          <Link
            key={index}
            className="flex flex-col items-center p-3 hover:bg-gray-50 rounded-lg transition-colors"
            href={button.href}
          >
            <div className="text-[#50C2C9] mb-1">
              {button.icon}
            </div>
            <span className="text-xs text-gray-600 text-center leading-tight">
              {button.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* ===== Bottom Navigation ===== */}
      <div className="border-t border-gray-200 bg-white sticky bottom-0">
        <div className="flex justify-around py-3">
          {navItems.map((item, index) => (
            item.href ? (
              <Link
                key={index}
                className={`flex flex-col items-center p-2 transition-colors  ${
                  item.active
                    ? 'text-[#50C2C9]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
                href={item.href}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </Link>
            ) : (
              <div
                key={index}
                className={`flex flex-col items-center p-2 transition-colors ${
                  item.active
                    ? 'text-[#50C2C9]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {item.icon}
                <span className="text-xs mt-1">{item.label}</span>
              </div>
            )
          ))}
        </div>
      </div>
    </div>
  );
};

export default PreciousMetalsApp;