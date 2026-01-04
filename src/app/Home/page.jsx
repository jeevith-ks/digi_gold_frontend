'use client';
import React, { useState, useEffect } from 'react';
import { Home, Bell, Shield, User, Gift, ShoppingCart, ArrowLeftRight, Scale, CreditCard, PiggyBank, Edit2, Save, RefreshCw, Clock, Lock, Unlock, FolderInput, Settings2, Signature, AlertCircle, CheckCircle, XCircle, History, Calendar, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
  const [marketStatus, setMarketStatus] = useState('CLOSED');
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isUpdatingMarket, setIsUpdatingMarket] = useState(false);
  const [tradingHours, setTradingHours] = useState({ open: '10:00', close: '18:00' });
  const [currentTime, setCurrentTime] = useState('');
  const [marketHistory, setMarketHistory] = useState([]);
  const [showMarketHistory, setShowMarketHistory] = useState(false);
  
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
  const [selectedSIPId] = useState('quick-buy-' + Date.now());
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  const router = useRouter();

  // Initialize user data and fetch market status
  useEffect(() => {
    const initializeApp = async () => {
      if (typeof window !== 'undefined') {
        const storedUserType = sessionStorage.getItem('userType');
        const storedUsername = sessionStorage.getItem('username');
        const storedToken = sessionStorage.getItem('authToken');
        
        if (storedUserType) {
          setUserType(storedUserType);
        }
        if (storedUsername) {
          setUsername(storedUsername);
        }

        // Fetch market status immediately
        await fetchMarketStatus();
        
        // Set up time updates
        updateCurrentTime();
        const timeInterval = setInterval(updateCurrentTime, 60000);
        
        // Fetch initial data based on user type
        if (storedUserType === 'customer' && storedToken) {
          await Promise.all([
            fetchHoldings(storedToken),
            fetchLatestPrices(storedToken),
            fetchNotifications(storedToken)
          ]);
        } else if (storedUserType === 'admin' && storedToken) {
          await Promise.all([
            fetchMarketHistory(storedToken),
            fetchNotifications(storedToken)
          ]);
          setMetalBalances({
            '24k-995': '0.0000',
            '22k-916': '0.0000',
            '24k-999': '0.0000'
          });
        }

        // Set up polling for market status (every 30 seconds)
        const marketStatusInterval = setInterval(() => {
          fetchMarketStatus();
        }, 30000);

        // Set up hourly price updates for customers
        let priceInterval;
        if (storedUserType === 'customer' && storedToken) {
          priceInterval = setInterval(() => {
            fetchLatestPrices(storedToken);
          }, 3600000);
        }

        return () => {
          clearInterval(timeInterval);
          clearInterval(marketStatusInterval);
          if (priceInterval) clearInterval(priceInterval);
        };
      }
    };

    initializeApp();
  }, []);

  // Update current time every minute
  const updateCurrentTime = () => {
    const now = new Date();
    setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
  };

  // Function to generate unique transaction ID for quick buy
  const generateQuickBuyTransactionId = () => {
    // Get or create quick buy counter in sessionStorage
    let quickBuyCounter = sessionStorage.getItem('quickBuyCounter');
    
    if (!quickBuyCounter) {
      // Initialize counter if it doesn't exist
      quickBuyCounter = '0';
      sessionStorage.setItem('quickBuyCounter', quickBuyCounter);
    }
    
    // Increment counter
    quickBuyCounter = parseInt(quickBuyCounter) + 1;
    sessionStorage.setItem('quickBuyCounter', quickBuyCounter.toString());
    
    // Generate transaction ID in format: QB_001, QB_002, etc.
    const transactionId = `QB_${String(quickBuyCounter).padStart(3, '0')}_${Date.now().toString().slice(-6)}`;
    
    console.log('🔢 Generated Transaction ID:', transactionId);
    
    return transactionId;
  };

  const debugSessionStorage = () => {
    console.log("=== SESSION STORAGE DEBUG ===");
    
    // Check specific quick buy related keys
    const paymentParamsStr = sessionStorage.getItem("paymentParameters");
    const offlinePaymentDataStr = sessionStorage.getItem("offlinePaymentData");
    
    console.log("=== RAW SESSION STORAGE VALUES ===");
    if (paymentParamsStr) {
      console.log("paymentParameters:", JSON.parse(paymentParamsStr));
    } else {
      console.log("paymentParameters: NOT FOUND");
    }
    
    if (offlinePaymentDataStr) {
      console.log("offlinePaymentData:", JSON.parse(offlinePaymentDataStr));
    } else {
      console.log("offlinePaymentData: NOT FOUND");
    }
    
    console.log("=== ALL SESSION STORAGE KEYS ===");
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      try {
        const value = sessionStorage.getItem(key);
        console.log(key, "=>", JSON.parse(value));
      } catch {
        console.log(key, "=>", sessionStorage.getItem(key));
      }
    }
  };

  // Fetch market status from API
  const fetchMarketStatus = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      const userType = sessionStorage.getItem('userType');
      
      // Always use the admin endpoint to get market status
      // This endpoint should be accessible to both admin and customers
      const response = await fetch('http://localhost:5000/api/admin/market-status', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Market Status Data:', data);
        
        // Extract market status from response
        let marketStatusValue = 'CLOSED';
        let marketOpen = false;
        
        if (data.marketStatus) {
          // Response has marketStatus object
          marketStatusValue = data.marketStatus.status;
          marketOpen = marketStatusValue === 'OPEN';
          
          // Update trading hours if available
          if (data.marketStatus.open_time && data.marketStatus.close_time) {
            setTradingHours({
              open: data.marketStatus.open_time,
              close: data.marketStatus.close_time
            });
          }
        } else if (data.status) {
          // Direct status in response
          marketStatusValue = data.status;
          marketOpen = marketStatusValue === 'OPEN';
        }
        
        // Update state
        setMarketStatus(marketStatusValue);
        setIsMarketOpen(marketOpen);
        
        // Store in sessionStorage for persistence
        sessionStorage.setItem('marketStatus', marketStatusValue);
        sessionStorage.setItem('tradingHours', JSON.stringify(tradingHours));
        sessionStorage.setItem('isMarketOpen', marketOpen.toString());
        
        console.log('Market status updated:', { 
          status: marketStatusValue, 
          isOpen: marketOpen,
          tradingHours 
        });
        
        // Add notification if status changed to CLOSED
        if (marketStatusValue === 'CLOSED') {
          addNotification({
            title: 'Market Closed',
            message: 'Trading operations are currently disabled',
            type: 'warning'
          });
        }
      } else {
        console.error('Failed to fetch market status:', response.status);
        
        // Fallback to sessionStorage if API fails
        const storedStatus = sessionStorage.getItem('marketStatus');
        const storedHours = sessionStorage.getItem('tradingHours');
        const storedIsOpen = sessionStorage.getItem('isMarketOpen');
        
        if (storedStatus) {
          setMarketStatus(storedStatus);
          setIsMarketOpen(storedIsOpen === 'true');
        }
        
        if (storedHours) {
          setTradingHours(JSON.parse(storedHours));
        }
      }
    } catch (error) {
      console.error('Error fetching market status:', error);
      
      // Fallback to sessionStorage
      const storedStatus = sessionStorage.getItem('marketStatus');
      const storedHours = sessionStorage.getItem('tradingHours');
      const storedIsOpen = sessionStorage.getItem('isMarketOpen');
      
      if (storedStatus) {
        setMarketStatus(storedStatus);
        setIsMarketOpen(storedIsOpen === 'true');
      }
      
      if (storedHours) {
        setTradingHours(JSON.parse(storedHours));
      }
    }
  };

  // Fetch market history (admin only)
  const fetchMarketHistory = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/market-status/history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMarketHistory(data.history || data);
      }
    } catch (error) {
      console.error('Error fetching market history:', error);
    }
  };

  // Fetch latest prices
  const fetchLatestPrices = async (token) => {
    try {
      setIsLoadingPrices(true);
      const response = await fetch('http://localhost:5000/api/price/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.latestPrice) {
          setMetalRates({
            '24k-995': data.latestPrice.gold24K,
            '22k-916': data.latestPrice.gold22K,
            '24k-999': data.latestPrice.silver
          });
          
          setLastPriceUpdate(new Date().toLocaleTimeString());
          
          addNotification({
            title: 'Prices Updated',
            message: 'Metal rates have been updated',
            type: 'info'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  };

  // Fetch holdings data
  const fetchHoldings = async (token) => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5000/api/holdings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setHoldings(data.holdings || data);
        updateMetalBalances(data.holdings || data);
      }
    } catch (error) {
      console.error('Error fetching holdings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch notifications
  const fetchNotifications = async (token) => {
    try {
      const response = await fetch('http://localhost:5000/api/notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Add notification
  const addNotification = (notification) => {
    setNotifications(prev => [{
      id: Date.now(),
      ...notification,
      timestamp: new Date().toISOString(),
      is_read: false
    }, ...prev.slice(0, 9)]);
  };

  // Update metal balances
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
        }
      });
    }

    setMetalBalances(newBalances);
  };

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load payment gateway'));
      document.body.appendChild(script);
    });
  };

  // Verify payment function
  const verifyPayment = async (paymentResponse, sipId) => {
    try {
      setProcessingPayment(true);
      
      const token = sessionStorage.getItem('authToken');
      const selectedMetalData = metals.find(m => m.id === selectedMetal);
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }

      console.log('🔐 Verifying payment with details:', {
        sipId: sipId,
        orderId: paymentResponse.razorpay_order_id,
        paymentId: paymentResponse.razorpay_payment_id,
        amount: parseFloat(amount),
        metalType: selectedMetalData?.metalType
      });

      // For online payment verification
      const verifyResponse = await fetch('http://localhost:5000/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          amount: parseFloat(amount),
          metal_type: selectedMetalData?.metalType,
          transaction_type: 'quick_buy',
          sip_id: sipId // Send the SIP ID
        }),
      });

      // Check if response is ok first
      if (!verifyResponse.ok) {
        let errorMessage = 'Payment verification failed';
        try {
          const errorText = await verifyResponse.text();
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorData.message || errorMessage;
            } catch {
              errorMessage = errorText.substring(0, 100) || errorMessage;
            }
          }
        } catch (e) {
          console.error('Failed to parse verification error:', e);
        }
        
        throw new Error(`HTTP ${verifyResponse.status}: ${errorMessage}`);
      }

      // Parse JSON only if response is ok
      const verifyData = await verifyResponse.json();
      console.log('✅ Payment verified successfully:', verifyData);
      
      // Add transaction to database
      const transactionResponse = await fetch('http://localhost:5000/api/transactions/add-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          utr_no: `QRP-${paymentResponse.razorpay_payment_id}`,
          transaction_type: 'ONLINE',
          category: 'DEBIT',
          metal_type: selectedMetalData?.metalType,
          transaction_status: 'COMPLETED',
          grams: parseFloat(grams),
          sip_id: sipId // Include SIP ID in transaction
        })
      });

      if (transactionResponse.ok) {
        alert('Payment successful! Transaction has been recorded.');
        
        // Refresh holdings
        await fetchHoldings(token);
        
        addNotification({
          title: 'Payment Successful',
          message: `Successfully purchased ${grams}g of ${selectedMetalData?.name}`,
          type: 'success'
        });
        
        // Reset form
        setGrams('');
        setAmount('');
      } else {
        console.error('Failed to record transaction');
        alert('Payment successful but failed to record transaction. Please contact support.');
      }
      
      return { success: true, data: verifyData };
    } catch (error) {
      console.error('❌ Payment verification error:', error);
      alert(`Payment verification failed: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle online payment with Razorpay
  const handleOnlinePayment = async () => {
    try {
      // Check market status
      const transactionCheck = canPerformTransaction();
      if (!transactionCheck.allowed) {
        alert(`Cannot process transaction: ${transactionCheck.reason}`);
        return;
      }

      // Validate input
      if (!grams || parseFloat(grams) <= 0 || !amount || parseFloat(amount) <= 0) {
        alert('Please enter valid grams and amount');
        return;
      }

      setProcessingPayment(true);
      
      const token = sessionStorage.getItem('authToken');
      const selectedMetalData = metals.find(m => m.id === selectedMetal);
      
      if (!token) {
        alert('Please login to make a purchase');
        router.push('/login');
        return;
      }

      const paymentAmount = parseFloat(amount);
      if (paymentAmount < 1) {
        alert('Minimum payment amount is ₹1');
        return;
      }

      // Generate unique SIP ID for quick buy
      const sipId = generateQuickBuyTransactionId();
      
      console.log('💰 Creating Razorpay order for:', {
        sipId: sipId,
        amount: paymentAmount,
        metalType: selectedMetalData?.metalType,
        grams: grams
      });

      // Update payment parameters in session storage with SIP ID
      const existingParams = JSON.parse(sessionStorage.getItem('paymentParameters') || '{}');
      const updatedParams = {
        ...existingParams,
        sipId: sipId,
        razorpayOrderTime: new Date().toISOString()
      };
      sessionStorage.setItem('paymentParameters', JSON.stringify(updatedParams));
      
      // Also store specific data for Razorpay
      const razorpayData = {
        sipId: sipId,
        amount: paymentAmount,
        metalType: selectedMetalData?.metalType,
        grams: grams,
        timestamp: new Date().toISOString(),
        tokenPresent: !!token
      };
      sessionStorage.setItem('razorpayData', JSON.stringify(razorpayData));

      // Prepare the request body based on what backend expects
      const requestBody = {
        amount: paymentAmount,
        metalType: selectedMetalData?.metalType,
        sipType: 'quick_buy',
        sipId: sipId, // Send sipId (not sip_id)
        description: `Quick Buy - ${grams}g ${selectedMetalData?.name} (${selectedMetalData?.purity})`,
        sipMonths: 1 // Add default value for sipMonths if required
      };

      console.log('📤 Sending to backend:', requestBody);

      // Create Razorpay order
      const response = await fetch('http://localhost:5000/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody),
      });

      // Store API response details
      const apiResponseData = {
        requestBody: requestBody,
        responseStatus: response.status,
        responseTime: new Date().toISOString()
      };
      sessionStorage.setItem('apiResponseData', JSON.stringify(apiResponseData));

      // First check if response is ok
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to create payment order';
        let errorDetails = '';
        
        try {
          const errorText = await response.text();
          console.log('❌ Backend error response:', errorText);
          
          if (errorText) {
            try {
              const errorData = JSON.parse(errorText);
              errorMessage = errorData.error || errorData.message || errorMessage;
              errorDetails = errorData.details || '';
              
              // Store error in session storage
              const errorDataStorage = {
                error: errorMessage,
                details: errorDetails,
                statusCode: response.status,
                timestamp: new Date().toISOString()
              };
              sessionStorage.setItem('paymentError', JSON.stringify(errorDataStorage));
            } catch {
              errorMessage = errorText.substring(0, 100) || errorMessage;
            }
          }
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        
        throw new Error(`HTTP ${response.status}: ${errorMessage} ${errorDetails ? `(${errorDetails})` : ''}`);
      }

      // If response is ok, then parse JSON
      const orderData = await response.json();
      console.log('✅ Order created successfully:', orderData);

      // Store successful order data
      const successfulOrderData = {
        orderId: orderData.id,
        amount: orderData.amount,
        currency: orderData.currency,
        status: orderData.status,
        timestamp: new Date().toISOString()
      };
      sessionStorage.setItem('razorpayOrderData', JSON.stringify(successfulOrderData));

      await loadRazorpayScript();

      // Convert amount to paise for Razorpay
      const amountInPaise = Math.round(paymentAmount * 100);

      // Razorpay options
      const options = {
        key: 'rzp_test_aOTAZ3JhbITtOK', // Replace with your actual Razorpay key
        amount: amountInPaise,
        currency: 'INR',
        name: 'Gold Investment Platform',
        description: `${grams}g ${selectedMetalData?.name} (${selectedMetalData?.purity})`,
        order_id: orderData.id,
        handler: async function (paymentResponse) {
          console.log('✅ Payment successful:', paymentResponse);
          
          // Store payment success data
          const paymentSuccessData = {
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
            timestamp: new Date().toISOString(),
            sipId: sipId
          };
          sessionStorage.setItem('paymentSuccessData', JSON.stringify(paymentSuccessData));
          
          const result = await verifyPayment(paymentResponse, sipId); // Pass sipId to verifyPayment
          
          if (result.success) {
            setShowPaymentDialog(false);
            // Clear temporary session storage after successful payment
            sessionStorage.removeItem('paymentParameters');
            sessionStorage.removeItem('razorpayData');
            sessionStorage.removeItem('apiResponseData');
          }
        },
        prefill: {
          name: username || 'Customer',
          email: 'customer@example.com',
          contact: '9999999999'
        },
        notes: {
          metalType: selectedMetalData?.metalType,
          grams: grams,
          transactionType: 'quick_buy',
          sipId: sipId // Include SIP ID in Razorpay notes
        },
        theme: {
          color: '#50C2C9'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal closed');
            setProcessingPayment(false);
            alert('Payment was cancelled. You can try again.');
            
            // Store cancellation in session storage
            const cancellationData = {
              reason: 'user_cancelled',
              timestamp: new Date().toISOString(),
              sipId: sipId,
              amount: paymentAmount
            };
            sessionStorage.setItem('paymentCancellation', JSON.stringify(cancellationData));
          }
        }
      };

      console.log('🎯 Razorpay options:', options);

      const razorpay = new window.Razorpay(options);

      razorpay.on('payment.failed', function (response) {
        console.error('❌ Payment failed:', response.error);
        setProcessingPayment(false);
        
        // Store payment failure in session storage
        const paymentFailureData = {
          error: response.error,
          timestamp: new Date().toISOString(),
          sipId: sipId,
          amount: paymentAmount
        };
        sessionStorage.setItem('paymentFailure', JSON.stringify(paymentFailureData));
        
        alert(`Payment failed: ${response.error.description}. Please try again.`);
      });

      razorpay.open();
      
    } catch (error) {
      console.error('❌ Payment initialization error:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      setProcessingPayment(false);
      
      let errorMessage = error.message;
      if (error.message.includes('500')) {
        errorMessage = 'Server error. Please try again later or contact support.';
      } else if (error.message.includes('Failed to create payment order')) {
        errorMessage = 'Payment gateway error. Please check your internet connection and try again.';
      } else if (errorMessage.includes('SIP ID is required')) {
        errorMessage = 'SIP ID is required. This is a server configuration error.';
      } else if (error.message.includes('Invalid amount')) {
        errorMessage = 'Please enter a valid payment amount (minimum ₹1)';
      } else if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = 'Authentication failed. Please login again.';
        sessionStorage.removeItem('authToken');
        router.push('/login');
      }
      
      alert(`Payment failed: ${errorMessage}`);
    }
  };

  // Handle market toggle
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

      const response = await fetch('http://localhost:5000/api/admin/market-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          open_time: tradingHours.open,
          close_time: tradingHours.close
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        setMarketStatus(newStatus);
        setIsMarketOpen(newStatus === 'OPEN');
        
        // Store in sessionStorage
        sessionStorage.setItem('marketStatus', newStatus);
        sessionStorage.setItem('isMarketOpen', (newStatus === 'OPEN').toString());
        
        // Add notification
        addNotification({
          title: `Market ${newStatus === 'OPEN' ? 'Opened' : 'Closed'}`,
          message: data.message || `Market has been ${newStatus === 'OPEN' ? 'opened' : 'closed'}`,
          type: newStatus === 'OPEN' ? 'success' : 'warning'
        });
        
        // Refresh market history for admin
        if (userType === 'admin') {
          await fetchMarketHistory(token);
        }
        
        alert(data.message || 'Market status updated successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update market status');
      }
    } catch (error) {
      console.error('Error updating market status:', error);
      alert('Error updating market status. Please try again.');
    } finally {
      setIsUpdatingMarket(false);
    }
  };

  // Update trading hours
  const handleUpdateTradingHours = async () => {
    if (userType !== 'admin') {
      alert('You do not have admin privileges to update trading hours.');
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

      const response = await fetch('http://localhost:5000/api/admin/market-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: marketStatus,
          open_time: tradingHours.open,
          close_time: tradingHours.close
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Store updated trading hours
        sessionStorage.setItem('tradingHours', JSON.stringify(tradingHours));
        
        addNotification({
          title: 'Trading Hours Updated',
          message: `New trading hours: ${tradingHours.open} - ${tradingHours.close}`,
          type: 'info'
        });
        
        alert('Trading hours updated successfully');
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Failed to update trading hours');
      }
    } catch (error) {
      console.error('Error updating trading hours:', error);
      alert('Error updating trading hours. Please try again.');
    } finally {
      setIsUpdatingMarket(false);
    }
  };

  // Check if current time is within trading hours
  const checkCurrentTimeInRange = () => {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const currentTimeInMinutes = hours * 60 + minutes;
    
    const [openHour, openMinute] = tradingHours.open.split(':').map(Number);
    const [closeHour, closeMinute] = tradingHours.close.split(':').map(Number);
    
    const openTimeInMinutes = openHour * 60 + openMinute;
    const closeTimeInMinutes = closeHour * 60 + closeMinute;
    
    return currentTimeInMinutes >= openTimeInMinutes && 
           currentTimeInMinutes <= closeTimeInMinutes;
  };

  // Check if transaction is allowed
  const canPerformTransaction = () => {
    if (marketStatus !== 'OPEN') {
      return { allowed: false, reason: 'Market is currently closed' };
    }
    
    if (!checkCurrentTimeInRange()) {
      return { 
        allowed: false, 
        reason: `Outside trading hours (${tradingHours.open} - ${tradingHours.close})` 
      };
    }
    
    return { allowed: true, reason: '' };
  };

  // Handle buy now with market status check
  const handleBuyNow = () => {
    const token = sessionStorage.getItem('authToken');
    if (!token) {
      alert('Please login to make a purchase');
      router.push('/login');
      return;
    }
    
    const transactionCheck = canPerformTransaction();
    if (!transactionCheck.allowed) {
      alert(`Cannot process transaction: ${transactionCheck.reason}`);
      return;
    }
    
    // Validate input
    if (!grams || parseFloat(grams) <= 0 || !amount || parseFloat(amount) <= 0) {
      alert('Please enter valid grams and amount');
      return;
    }
    
    // Show payment dialog
    setShowPaymentDialog(true);
  };

  // Handle payment method selection
  const handlePaymentMethod = async (method) => {
    const transactionCheck = canPerformTransaction();
    if (!transactionCheck.allowed) {
      alert(`Cannot process payment: ${transactionCheck.reason}`);
      setShowPaymentDialog(false);
      return;
    }

    // Generate transaction ID for quick buy
    const transactionId = generateQuickBuyTransactionId();
    
    const selectedMetalData = metals.find(m => m.id === selectedMetal);
    const paymentParams = {
      method: method,
      amount: parseFloat(amount),
      grams: parseFloat(grams),
      metalType: selectedMetalData?.metalType,
      metalName: selectedMetalData?.name,
      purity: selectedMetalData?.purity,
      selectedMetal: selectedMetal,
      // Add transaction ID
      transactionId: transactionId,
      sipId: transactionId, // Also store as sipId
      sipType: 'quick_buy', // Add sipType
      timestamp: new Date().toISOString(),
      status: 'pending',
      marketStatus: marketStatus,
      tradingHours: tradingHours,
      currentTime: currentTime,
      userType: userType,
      username: username
    };

    console.log('💾 Storing payment parameters in session storage:', paymentParams);
    sessionStorage.setItem('paymentParameters', JSON.stringify(paymentParams));
    
    if (method === 'Online') {
      await handleOnlinePayment();
    } else if (method === 'Offline') {
      // For offline payment, also store the offline data
      const offlineData = {
        ...paymentParams,
        transaction_type: 'OFFLINE',
        status: 'offline_pending'
      };
      
      console.log('💾 Storing offline payment data:', offlineData);
      sessionStorage.setItem('offlinePaymentData', JSON.stringify(offlineData));
      
      setShowPaymentDialog(false);
      router.push('/payoffline_qb');
    }
  };

  // Handle rate change
  const handleRateChange = (metalId, newRate) => {
    setMetalRates(prev => ({
      ...prev,
      [metalId]: parseFloat(newRate) || 0
    }));
  };

  // Handle save rates
  const handleSaveRates = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    
    try {
      const token = sessionStorage.getItem('authToken');
      
      if (!token) {
        alert('Authentication token not found. Please login again.');
        setIsSaving(false);
        return;
      }

      if (userType !== 'admin') {
        alert('You do not have admin privileges to update rates.');
        setIsSaving(false);
        return;
      }

      const priceData = {
        gold24K: metalRates['24k-995'],
        gold22K: metalRates['22k-916'],  
        silver: metalRates['24k-999']
      };

      const response = await fetch('http://localhost:5000/api/price/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(priceData)
      });

      if (response.ok) {
        alert('Rates updated successfully for all users!');
        setEditMode(false);
        
        addNotification({
          title: 'Prices Updated',
          message: 'Admin has updated metal rates',
          type: 'info'
        });
      } else {
        const errorData = await response.json();
        alert('Failed to update rates: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating rates:', error);
      alert('Error updating rates. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle grams change
  const handleGramsChange = (value) => {
    setGrams(value);
    const selectedMetalData = metals.find(m => m.id === selectedMetal);
    if (selectedMetalData && value) {
      setAmount((parseFloat(value) * selectedMetalData.rate).toFixed(0));
    } else {
      setAmount('');
    }
  };

  // Handle amount change
  const handleAmountChange = (value) => {
    setAmount(value);
    const selectedMetalData = metals.find(m => m.id === selectedMetal);
    if (selectedMetalData && value) {
      setGrams((parseFloat(value) / selectedMetalData.rate).toFixed(4));
    } else {
      setGrams('');
    }
  };

  // Handle download
  const handleDownload = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      
      if (!token) {
        alert('Please log in to download the Excel file.');
        return;
      }

      const response = await fetch("http://localhost:5000/api/admin/export-excel", {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          alert('Session expired. Please log in again.');
          sessionStorage.removeItem('authToken');
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = "ExcelExport.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Excel file downloaded successfully');
      
    } catch (error) {
      console.error('Failed to download excel:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  // Mark notification as read
  const markNotificationAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, is_read: true } : notification
      )
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Metals data
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

  // Action buttons based on user type
  const adminActionButtons = [
    { icon: <FolderInput className="w-6 h-6" />, label: 'Export', action: handleDownload },
    { icon: <Settings2 className="w-6 h-6" />, label: 'Settlements', href: '/settlements' },
    { icon: <Signature className="w-6 h-6" />, label: 'Approve', href: '/Approve' },
    { icon: <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center text-white text-xs font-bold">₹</div>, label: 'SIP', href: '/savings_plan' },
    { icon: <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center text-white text-xs">💰</div>, label: 'LookBook', href: '/Lookbook' }
  ];

  const customerActionButtons = [
    { icon: <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center text-white text-xs font-bold">₹</div>, label: 'SIP', href: '/savings_plan' },
    { icon: <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center text-white text-xs">💰</div>, label: 'LookBook', href: '/Lookbook' }
  ];

  // Navigation items
  const navItems = [
    { icon: <Home className="w-6 h-6" />, label: 'Home', active: true, href: '/Home' },
    { icon: <Bell className="w-6 h-6" />, label: 'Notification', href: '/Notifications' },
    { icon: <PiggyBank className="w-6 h-6" />, label: 'Savings', href: '/savings' },
    { icon: <CreditCard className="w-6 h-6" />, label: 'Passbook', href: '/Passbook' },
    { icon: <User className="w-6 h-6" />, label: 'Profile', href: '/profile' }
  ];

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-screen flex flex-col font-sans">
      {/* Header with Market Status */}
      <div className={`px-4 py-3 border-b ${isMarketOpen ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-medium">
              {userType === 'admin' ? 'Admin Mode' : 'Customer Mode'}
            </span>
            <p className="text-xs opacity-80">Welcome, {username}</p>
            
            {/* Market Status Display */}
            <div className="flex items-center space-x-2 mt-1">
              <div className={`flex items-center space-x-1 px-2 py-1 rounded text-xs ${
                isMarketOpen 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isMarketOpen ? (
                  <CheckCircle className="w-3 h-3" />
                ) : (
                  <XCircle className="w-3 h-3" />
                )}
                <span>Market: {marketStatus}</span>
              </div>
              
              <div className="text-xs text-gray-600 flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {tradingHours.open} - {tradingHours.close}
              </div>
              
              <div className="text-xs text-gray-600">
                Now: {currentTime}
              </div>
            </div>
          </div>
          
          {/* Admin Controls */}
          {userType === 'admin' && (
            <div className="flex items-center space-x-2">
              {editMode ? (
                <button
                  onClick={handleSaveRates}
                  disabled={isSaving}
                  className="flex items-center space-x-1 bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Rates'}</span>
                </button>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  <span>Edit Rates</span>
                </button>
              )}
              
              <button
                onClick={() => setShowMarketHistory(!showMarketHistory)}
                className="flex items-center space-x-1 bg-gray-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-gray-600 transition-colors"
              >
                <History className="w-4 h-4" />
                <span>History</span>
              </button>
            </div>
          )}
          
          {/* Customer Controls */}
          {userType === 'customer' && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => fetchLatestPrices(sessionStorage.getItem('authToken'))}
                disabled={isLoadingPrices}
                className="flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingPrices ? 'animate-spin' : ''}`} />
                <span>Refresh Prices</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Admin Market Controls */}
        {userType === 'admin' && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {/* Market Toggle Buttons */}
              <button
                onClick={() => handleMarketToggle('OPEN')}
                disabled={isUpdatingMarket || isMarketOpen}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isMarketOpen 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-green-500 text-white hover:bg-green-600'
                } disabled:opacity-50`}
              >
                <Unlock className="w-4 h-4" />
                <span>Open Market</span>
              </button>
              
              <button
                onClick={() => handleMarketToggle('CLOSED')}
                disabled={isUpdatingMarket || !isMarketOpen}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                  !isMarketOpen 
                    ? 'bg-red-100 text-red-800 border border-red-300' 
                    : 'bg-red-500 text-white hover:bg-red-600'
                } disabled:opacity-50`}
              >
                <Lock className="w-4 h-4" />
                <span>Close Market</span>
              </button>
              
              {/* Trading Hours Editor */}
              <div className="flex items-center space-x-2 bg-gray-100 px-3 py-2 rounded-lg">
                <Clock className="w-4 h-4 text-gray-600" />
                <input
                  type="time"
                  value={tradingHours.open}
                  onChange={(e) => setTradingHours(prev => ({ ...prev, open: e.target.value }))}
                  className="w-20 text-sm border rounded px-2 py-1"
                />
                <span className="text-gray-600">to</span>
                <input
                  type="time"
                  value={tradingHours.close}
                  onChange={(e) => setTradingHours(prev => ({ ...prev, close: e.target.value }))}
                  className="w-20 text-sm border rounded px-2 py-1"
                />
                <button
                  onClick={handleUpdateTradingHours}
                  disabled={isUpdatingMarket}
                  className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Market History Modal (Admin Only) */}
      {showMarketHistory && userType === 'admin' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-11/12 max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Market Status History</h3>
              <button
                onClick={() => setShowMarketHistory(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-2">
              {marketHistory.length > 0 ? marketHistory.map((item, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`px-2 py-1 rounded text-xs ${
                      item.status === 'OPEN' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(item.updated_at || item.last_updated_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm">
                    <div>Trading Hours: {item.open_time || '10:00'} - {item.close_time || '18:00'}</div>
                    {item.updated_by && (
                      <div className="text-xs text-gray-600 mt-1">
                        Updated by: {item.updated_by}
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="text-center py-4 text-gray-500">
                  No market history available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 w-11/12 max-w-md max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Notifications</h3>
              <div className="flex space-x-2">
                <button
                  onClick={clearAllNotifications}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`border rounded-lg p-3 ${notification.is_read ? 'bg-gray-50' : 'bg-blue-50'}`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      {notification.type === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                      {notification.type === 'warning' && <AlertCircle className="w-4 h-4 text-yellow-500" />}
                      {notification.type === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                      {notification.type === 'info' && <Bell className="w-4 h-4 text-blue-500" />}
                      <span className="font-medium">{notification.title}</span>
                    </div>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
              
              {notifications.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  No notifications
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Precious Metals Balance Section */}
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
                    {isLoadingPrices ? '...' : metal.rate.toLocaleString()}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-400">Rates are exclusive of 3% GST</span>
            {lastPriceUpdate && (
              <span className="text-xs text-green-600">
                Updated: {lastPriceUpdate}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Buy Section */}
      <div className="bg-gray-100 rounded-lg m-4 p-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Buy</h2>

        {/* Market Status Warning */}
        {!isMarketOpen && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Market is currently {marketStatus}</span>
            </div>
            <p className="text-xs text-red-600 mt-1">
              Trading operations are temporarily disabled. Please try again when market is open.
            </p>
          </div>
        )}

        {/* Metal Selection */}
        <div className="flex flex-wrap gap-2 mb-4">
          {metals.map((metal) => (
            <button
              key={metal.id}
              onClick={() => setSelectedMetal(metal.id)}
              className={`flex-1 min-w-[90px] py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                selectedMetal === metal.id
                  ? 'bg-[#50C2C9] text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
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
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#50C2C9] border-gray-300`}
              placeholder="0"
              min="0"
              step="0.001"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <TrendingUp className="w-4 h-4" />
              ₹ Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#50C2C9] border-gray-300`}
              placeholder="0"
              min="0"
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

        {/* Buy Now Button - Only disabled when market is closed */}
        <button
          className={`w-full py-4 rounded-lg font-bold text-lg transition-colors ${
            !isMarketOpen || !grams || !amount
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#50C2C9] text-white hover:bg-[#3AA8AF]'
          }`}
          disabled={!isMarketOpen || !grams || !amount}
          onClick={handleBuyNow}
        >
          {!isMarketOpen ? 'Market Closed' : 'Buy Now'}
        </button>
      </div>

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-11/12 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Select Payment Method</h3>
            
            {/* Payment Summary */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-700 font-medium mb-2">
                Payment Summary
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Metal Type:</span>
                  <span className="text-black font-medium">
                    {metals.find(m => m.id === selectedMetal)?.name} ({metals.find(m => m.id === selectedMetal)?.purity})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Grams:</span>
                  <span className="text-black font-medium">{grams}g</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-semibold text-black text-sm">₹{amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Market Status:</span>
                  <span className={`font-medium ${
                    marketStatus === 'OPEN' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {marketStatus}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 mb-6">
              {/* Online Payment Option */}
              <div 
                className={`p-3 border rounded-lg ${processingPayment ? 'opacity-50' : 'hover:bg-gray-50 cursor-pointer'}`}
                onClick={() => !processingPayment && handlePaymentMethod('Online')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    {processingPayment ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <CreditCard className="w-6 h-6 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">Online Payment</div>
                    <div className="text-sm text-gray-600">
                      {processingPayment ? 'Processing...' : 'Credit/Debit Card, UPI, Net Banking'}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Offline Payment Option */}
              <div 
                className={`p-3 border rounded-lg ${processingPayment ? 'opacity-50' : 'hover:bg-gray-50 cursor-pointer'}`}
                onClick={() => !processingPayment && handlePaymentMethod('Offline')}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">Offline Payment</div>
                    <div className="text-sm text-gray-600">Bank Transfer, Cash Deposit</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentDialog(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={processingPayment}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Only disable specific actions based on requirements */}
      <div className="flex justify-around flex-wrap px-2 py-3 gap-2 sticky bottom-20 bg-white">
        {(userType === 'admin' ? adminActionButtons : customerActionButtons).map((button, index) => (
          <div
            key={index}
            className={`flex flex-col items-center p-3 rounded-lg transition-colors hover:bg-gray-50`}
            onClick={(e) => {
              if (button.action) {
                button.action();
              } else if (button.href) {
                router.push(button.href);
              }
            }}
          >
            <div className={`mb-1 text-[#50C2C9]`}>
              {button.icon}
            </div>
            <span className={`text-xs text-center leading-tight text-gray-600`}>
              {button.label}
            </span>
          </div>
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1"></div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 bg-white sticky bottom-0">
        <div className="flex justify-around py-3">
          {navItems.map((item, index) => (
            <div
              key={index}
              className={`flex flex-col items-center p-2 transition-colors cursor-pointer ${
                item.active
                  ? 'text-[#50C2C9]'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else if (item.href) {
                  router.push(item.href);
                }
              }}
            >
              {item.icon}
              <span className="text-xs mt-1">{item.label}</span>
              {item.label === 'Notification' && notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute top-1 right-1/3 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PreciousMetalsApp;