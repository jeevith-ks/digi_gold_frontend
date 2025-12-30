'use client';
import React, { useState, useEffect } from 'react';
import { Home, Bell, Shield, User, Gift, ShoppingCart, ArrowLeftRight, Scale, CreditCard, PiggyBank, Edit2, Save, RefreshCw, Clock, Lock, Unlock, FolderInput,Settings2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Add this import

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
  const [marketStatus, setMarketStatus] = useState('open'); // 'open' or 'closed'
  const [isUpdatingMarket, setIsUpdatingMarket] = useState(false);
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

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedSIPId] = useState('quick-buy-' + Date.now()); // Generate a unique ID for quick buy
  const [selectedPlan, setSelectedPlan] = useState(null); // For quick buy, we'll create a dummy plan
  
  const router = useRouter(); // Initialize router

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

      // Check for stored market status - Load from sessionStorage
      const storedMarketStatus = sessionStorage.getItem('marketStatus');
      if (storedMarketStatus) {
        console.log('📊 Loading market status from sessionStorage:', storedMarketStatus);
        setMarketStatus(storedMarketStatus);
      } else {
        // Initialize with 'open' if not stored yet
        console.log('📊 Initializing market status to: open');
        sessionStorage.setItem('marketStatus', 'open');
        setMarketStatus('open');
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

  // Handle market open/close
  const handleMarketToggle = async (newStatus) => {
    if (userType !== 'admin') {
      alert('You do not have admin privileges to control market status.');
      return;
    }

    setIsUpdatingMarket(true);
    try {
      const token = sessionStorage.getItem('authToken');
      
      if (!token) {
        alert('Authentication token not found. Please login again.');
        setIsUpdatingMarket(false);
        return;
      }

      console.log(`🔄 Updating market status to: ${newStatus}`);
      
      // Store market status in sessionStorage
      sessionStorage.setItem('marketStatus', newStatus);
      console.log(`💾 Market status saved to sessionStorage: ${newStatus}`);
      
      // Update state
      setMarketStatus(newStatus);
      
      // Here you would typically make an API call to update market status on server
      // For now, we'll simulate it with a timeout
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call
      
      console.log(`✅ Market status updated to: ${newStatus}`);
      
      // Show appropriate message
      if (newStatus === 'closed') {
        alert('Market has been closed. Trading is now disabled for all users.');
      } else {
        alert('Market has been opened. Trading is now enabled for all users.');
      }
      
    } catch (error) {
      console.error('❌ Error updating market status:', error);
      alert('Error updating market status. Please try again.');
    } finally {
      setIsUpdatingMarket(false);
    }
  };

  // Handle market open
  const handleMarketOpen = () => {
    handleMarketToggle('open');
  };

  // Handle market close
  const handleMarketClose = () => {
    const confirmClose = window.confirm('Are you sure you want to close the market? This will disable trading for all users.');
    if (confirmClose) {
      handleMarketToggle('closed');
    }
  };

  const handleDownload = async () => {
  try {
    // Get token from sessionStorage
    const token = sessionStorage.getItem('authToken');
    
    if (!token) {
      alert('Please log in to download the Excel file.');
      // Optionally redirect to login page
      // router.push('/Authentication');
      return;
    }

    const response = await fetch("http://localhost:5000/api/admin/export-excel", {
      headers: {
        'Authorization': `Bearer ${token}`, // Add Bearer prefix
        'Content-Type': 'application/json'
      }
    });

    // Check if response is ok
    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        alert('Session expired. Please log in again.');
        sessionStorage.removeItem('authToken');
        // Optionally redirect to login
        // router.push('/Authentication');
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Check content type to ensure it's an Excel file
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')) {
      console.warn('Unexpected content type:', contentType);
    }

    // Convert response to blob
    const blob = await response.blob();

    // Check if blob is valid
    if (!blob || blob.size === 0) {
      throw new Error('Received empty file');
    }

    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "ExcelExport.xlsx";
    document.body.appendChild(a);
    a.click();
    a.remove();

    // Clean up the URL object after download
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
    }, 100);
    
    console.log('Excel file downloaded successfully');
    
  } catch (error) {
    console.error('Failed to download excel:', error);
    // Show user-friendly error message
    alert('Failed to download Excel file. Please try again.');
  }
};

  // Time restriction check function
const checkTimeRestriction = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTimeInMinutes = hours * 60 + minutes;
  
  // Check if time is between 10:00 AM (600 minutes) and 6:00 PM (1080 minutes)
  return currentTimeInMinutes >= 600 && currentTimeInMinutes <= 1880;
};

// Format time for display
const formatTime = (date) => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Update current time every minute
useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 60000); // Update every minute
  
  return () => clearInterval(timer);
}, []);

// Session storage functions
const savePaymentDataToSession = () => {
  const paymentData = {
    planId: selectedSIPId,
    planName: 'Quick Buy - ' + metals.find(m => m.id === selectedMetal)?.name,
    amount: amount,
    grams: grams,
    metalType: selectedMetal,
    timestamp: new Date().toISOString()
  };
  
  sessionStorage.setItem('quickBuyPaymentData', JSON.stringify(paymentData));
};

const clearPaymentDataFromSession = () => {
  sessionStorage.removeItem('quickBuyPaymentData');
};

// Parse amount string to number
const parseAmount = (amountStr) => {
  if (typeof amountStr === 'number') return amountStr;
  if (typeof amountStr === 'string') {
    // Remove commas and any non-numeric characters except decimal point
    const cleaned = amountStr.replace(/[^\d.]/g, '');
    return parseFloat(cleaned) || 0;
  }
  return 0;
};

// Load Razorpay script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve();
    };
    document.body.appendChild(script);
  });
};

// Verify payment function
const verifyPayment = async (paymentResponse) => {
  try {
    const token = sessionStorage.getItem('authToken');
    const response = await fetch('http://localhost:5000/api/razorpay/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentResponse)
    });

    const result = await response.json();
    
    if (result.success) {
      alert('Payment verified successfully! Your purchase has been processed.');
      // Clear form
      setGrams('');
      setAmount('');
      // Refresh holdings
      handleRefreshHoldings();
    } else {
      alert(`Payment verification failed: ${result.message}`);
    }
    
    return result;
  } catch (error) {
    console.error('Verification error:', error);
    alert('Error verifying payment. Please check your transaction history.');
    return { success: false, message: error.message };
  }
};

// Your handlePaymentMethod function (with some adjustments for quick buy)
const handlePaymentMethod = async (method) => {
  // Check time restriction before proceeding with payment
  if (!checkTimeRestriction()) {
    alert(`Cannot process payment. SIP payments can only be made between 10:00 AM and 6:00 PM. Current time: ${formatTime(currentTime)}`);
    setShowPaymentDialog(false);
    return;
  }
  
  // Check market status before proceeding with payment
  if (marketStatus === 'closed') {
    alert(`Market is currently closed. Trading operations are temporarily disabled.`);
    setShowPaymentDialog(false);
    return;
  }
  
  // Validate amount and grams
  if (!grams || parseFloat(grams) <= 0 || !amount || parseFloat(amount) <= 0) {
    alert('Please enter valid grams and amount');
    return;
  }
  
  // Save payment data to session storage
  savePaymentDataToSession();
  
  setShowPaymentDialog(false);
  
  // Create a dummy plan for quick buy
  const quickBuyPlan = {
    type: 'quick-buy',
    name: 'Quick Buy - ' + metals.find(m => m.id === selectedMetal)?.name,
    monthlyAmount: parseFloat(amount),
    investMin: amount,
    metalType: metals.find(m => m.id === selectedMetal)?.metalType,
    isFixed: true,
    totalMonths: 1
  };
  
  setSelectedPlan(quickBuyPlan);

  if (method === 'Online') {
    try {
      let amountValue = parseAmount(amount);
      
      // Enhanced validation
      if (isNaN(amountValue) || amountValue <= 0) {
        throw new Error(`Invalid amount: Please enter a valid payment amount`);
      }

      if (amountValue < 1) {
        throw new Error('Minimum payment amount is ₹1');
      }

      console.log('💰 Quick Buy payment details:', {
        amount: amountValue,
        grams: grams,
        metalType: selectedMetal,
        amountInPaise: amountValue,
        sipId: selectedSIPId
      });

      // Store payment details in sessionStorage for Razorpay
      sessionStorage.setItem('razorpayAmount', amountValue.toString());
      sessionStorage.setItem('razorpaySIPId', selectedSIPId);
      sessionStorage.setItem('razorpayPlanType', 'quick-buy');
      sessionStorage.setItem('razorpayMetalType', metals.find(m => m.id === selectedMetal)?.name || 'Gold');

      const razorpayAmount = amountValue; // Convert to paise for Razorpay
      
      console.log('💰 Razorpay amount in paise:', razorpayAmount);

      // Get auth token from session storage
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      console.log('📞 Calling Razorpay API for quick buy...');
      
      const response = await fetch('http://localhost:5000/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: amountValue,
          metalType: metals.find(m => m.id === selectedMetal)?.metalType,
          sipMonths: 1,
          sipType: 'fixed',
          sipId: selectedSIPId,
          transactionType: 'quick-buy',
          grams: grams
        }),
      });

      console.log('📋 API Response status:', response.status);
      
      const responseText = await response.text();
      console.log('📋 API Response text:', responseText);

      let orderData;
      try {
        orderData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}`);
      }

      if (!response.ok) {
        console.error('❌ Backend API Error response:', orderData);
        throw new Error(orderData.error || orderData.message || `HTTP error! status: ${response.status}`);
      }

      console.log('✅ Order created successfully:', orderData);

      await loadRazorpayScript();

      // Convert amount to paise for Razorpay
      const amountInPaise = Math.round(amountValue * 100);

      // Razorpay options
      const options = {
        key: 'rzp_test_aOTAZ3JhbITtOK', // Replace with your actual Razorpay key
        amount: amountInPaise,
        currency: 'INR',
        name: 'Gold/Silver Purchase',
        description: `Quick Buy: ${grams}g of ${metals.find(m => m.id === selectedMetal)?.name} ${selectedMetal}`,
        order_id: orderData.id,
        handler: async function (paymentResponse) {
          console.log('✅ Payment successful:', paymentResponse);
          
          // Clear session storage after successful payment
          clearPaymentDataFromSession();
          
          const result = await verifyPayment(paymentResponse);
          
          if (result.success) {
            // Clear the form
            setGrams('');
            setAmount('');
          }
        },
        prefill: {
          name: username || 'Customer',
          email: 'customer@example.com',
          contact: '9999999999'
        },
        notes: {
          transactionType: 'quick-buy',
          sipId: selectedSIPId,
          metalType: selectedMetal,
          grams: grams
        },
        theme: {
          color: '#50C2C9'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal closed');
            alert('Payment was cancelled. You can try again.');
          }
        }
      };

      console.log('🎯 Razorpay options:', options);

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', function (response) {
        console.error('❌ Payment failed:', response.error);
        alert(`Payment failed: ${response.error.description}. Please try again.`);
      });

      razorpay.open();
      
    } catch (error) {
      console.error('❌ Payment initialization error:', error);
      
      let errorMessage = error.message;
      if (error.message.includes('Failed to create payment order')) {
        errorMessage = 'Payment gateway error. Please check your internet connection and try again.';
      } else if (error.message.includes('Invalid amount')) {
        errorMessage = 'Please enter a valid payment amount (minimum ₹1)';
      }
      
      alert(`Payment failed: ${errorMessage}`);
    }
  } else if (method === 'Offline') {
    // Handle offline payment
    if (!checkTimeRestriction()) {
      alert(`Cannot process payment. Payments can only be made between 10:00 AM and 6:00 PM. Current time: ${formatTime(currentTime)}`);
      return;
    }
    
    if (marketStatus === 'closed') {
      alert(`Market is currently closed. Trading operations are temporarily disabled.`);
      return;
    }
    
    // Save offline payment data to session storage
    const offlineData = {
      planId: selectedSIPId,
      planName: `Quick Buy - ${metals.find(m => m.id === selectedMetal)?.name}`,
      amount: amount,
      grams: grams,
      metalType: selectedMetal,
      timestamp: new Date().toISOString(),
      status: 'offline_pending',
      transaction_type: 'offline'
    };
    
    sessionStorage.setItem('offlinePaymentData', JSON.stringify(offlineData));
    
    router.push('/payoffline');
  }
};

// Function to handle Buy Now click
const handleBuyNow = () => {
  // Check if user is logged in
  const token = sessionStorage.getItem('authToken');
  if (!token) {
    alert('Please login to make a purchase');
    router.push('/login');
    return;
  }
  
  // Check market status
  if (marketStatus === 'closed') {
    alert('Market is currently closed. Trading operations are temporarily disabled.');
    return;
  }
  
  // Validate input
  if (!grams || parseFloat(grams) <= 0 || !amount || parseFloat(amount) <= 0) {
    alert('Please enter valid grams and amount');
    return;
  }
  
  // Show payment dialog or directly proceed to online payment
  // For simplicity, we'll proceed directly to online payment
  handlePaymentMethod('Online');
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

  const adminActionButtons = [
    { icon: <FolderInput className="w-6 h-6" onClick={handleDownload} />, label: 'Export', href: '' },
     { icon: <Settings2 className="w-6 h-6"  />, label: 'Settlements', href: '/settlements' },
    { icon: <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center text-white text-xs font-bold">₹</div>, label: 'SIP', href: '/savings_plan' },
    { icon: <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center text-white text-xs">💰</div>, label: 'LookBook', href: '/Lookbook' }
  ];

  const customerActionButtons = [
    { icon: <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center text-white text-xs font-bold">₹</div>, label: 'SIP', href: '/savings_plan' },
    { icon: <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center text-white text-xs">💰</div>, label: 'LookBook', href: '/Lookbook' }
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
    const marketStatus = sessionStorage.getItem('marketStatus');
    
    console.log('Debug User Data:', {
      token: token ? 'Exists' : 'Missing',
      userType,
      username,
      marketStatus,
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

  // Function to manually clear market status (for debugging)
  const clearMarketStatus = () => {
    if (userType === 'admin') {
      const confirmClear = window.confirm('Clear market status from sessionStorage?');
      if (confirmClear) {
        sessionStorage.removeItem('marketStatus');
        setMarketStatus('open');
        alert('Market status cleared. Defaulting to "open".');
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
              <div className="flex items-center space-x-2 mt-1">
                <div className={`text-xs px-2 py-1 rounded ${marketStatus === 'open' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  Market: {marketStatus === 'open' ? 'OPEN' : 'CLOSED'}
                </div>
                {/* Debug button - remove in production */}
                <button 
                  onClick={debugUserData}
                  className="text-xs text-blue-500 underline"
                >
                  Debug User Data
                </button>
                {/* Clear market status button (debug) */}
                <button 
                  onClick={clearMarketStatus}
                  className="text-xs text-red-500 underline"
                >
                  Clear Market Status
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Market Control Buttons */}
              {marketStatus === 'open' ? (
                <button
                  onClick={handleMarketClose}
                  disabled={isUpdatingMarket}
                  className="flex items-center space-x-1 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isUpdatingMarket ? 'Closing...' : 'Close Market'}</span>
                </button>
              ) : (
                <button
                  onClick={handleMarketOpen}
                  disabled={isUpdatingMarket}
                  className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Unlock className="w-4 h-4" />
                  <span>{isUpdatingMarket ? 'Opening...' : 'Open Market'}</span>
                </button>
              )}
              
              {/* Edit Rates Button */}
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

      {/* ===== Quick Buy Section ===== */}
      <div className="bg-gray-100 rounded-lg m-4 p-4"> 
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Buy</h2>

        {/* Market Status Warning for Customers */}
        {userType === 'customer' && marketStatus === 'closed' && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium">Market is currently closed</span>
            </div>
            <p className="text-xs text-red-600 mt-1">Trading will resume when the market opens.</p>
          </div>
        )}

        {/* Metal Selection */}
         <div className="flex flex-wrap gap-2 mb-4"> 
          {metals.map((metal) => (
            <button
              key={metal.id}
              onClick={() => setSelectedMetal(metal.id)}
              disabled={marketStatus === 'closed'}
              className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                selectedMetal === metal.id
                  ? 'bg-[#50C2C9] text-white'
                  : marketStatus === 'closed' 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              <div>{metal.name}</div>
              <div className="text-xs opacity-80">{metal.purity}</div>
            </button>
          ))}
        </div> 

        {/* Input Fields */}
         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Scale className="w-4 h-4" />
              Grams
            </label>
            <input
              type="number"
              value={grams}
              onChange={(e) => handleGramsChange(e.target.value)}
              disabled={marketStatus === 'closed'}
              className={`w-full p-3 border rounded-lg focus:outline-none ${
                marketStatus === 'closed' 
                  ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-300 focus:ring-2 focus:ring-[#50C2C9]'
              }`}
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
              disabled={marketStatus === 'closed'}
              className={`w-full p-3 border rounded-lg focus:outline-none ${
                marketStatus === 'closed' 
                  ? 'border-gray-300 bg-gray-50 text-gray-400 cursor-not-allowed' 
                  : 'border-gray-300 focus:ring-2 focus:ring-[#50C2C9]'
              }`}
              placeholder="0"
            />
          </div>
        </div> 

        {/* Conversion Icon */}
         <div className="flex justify-center mb-4">
          <ArrowLeftRight className="w-6 h-6 text-gray-400" />
        </div> 

         <div className="text-right text-xs text-gray-400 mb-4">
          GST included
        </div> 

        {/* Buy Now Button */}
          <button 
            className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
              marketStatus === 'closed'
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-[#50C2C9] text-white hover:bg-[#3AA8AF]'
            }`}
            disabled={marketStatus === 'closed' || !grams || !amount}
            onClick={handleBuyNow}
          >
            {marketStatus === 'closed' ? 'Market Closed' : 'Buy Now'}
          </button>
       </div>

      {/* ===== Action Buttons ===== */}
      <div className="flex justify-around flex-wrap px-2 py-3 gap-2 sticky bottom-20 bg-white">
        {/* Render different action buttons based on user type */}
        {userType === 'admin' 
          ? adminActionButtons.map((button, index) => (
              <Link
                key={index}
                className={`flex flex-col items-center p-3 rounded-lg transition-colors ${
                  marketStatus === 'closed' && button.label === 'Export'
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50'
                }`}
                href={marketStatus === 'closed' && button.label === 'Export' ? '#' : button.href}
                onClick={(e) => {
                  if (marketStatus === 'closed' && button.label === 'Export') {
                    e.preventDefault();
                    alert('Trading is currently disabled. Market is closed.');
                  }
                }}
              >
                <div className={`mb-1 ${
                  marketStatus === 'closed' && button.label === 'Export'
                    ? 'text-gray-400'
                    : 'text-[#50C2C9]'
                }`}>
                  {button.icon}
                </div>
                <span className={`text-xs text-center leading-tight ${
                  marketStatus === 'closed' && button.label === 'Export'
                    ? 'text-gray-400'
                    : 'text-gray-600'
                }`}>
                  {button.label}
                </span>
              </Link>
            ))
          : customerActionButtons.map((button, index) => (
              <Link
                key={index}
                className="flex flex-col items-center p-3 rounded-lg transition-colors hover:bg-gray-50"
                href={button.href}
              >
                <div className="mb-1 text-[#50C2C9]">
                  {button.icon}
                </div>
                <span className="text-xs text-center leading-tight text-gray-600">
                  {button.label}
                </span>
              </Link>
            ))
        }
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