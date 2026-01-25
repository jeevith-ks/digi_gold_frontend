'use client';
import React, { useState, useEffect } from 'react';
import { Home, Bell, Gem, Shield, User, Gift, ShoppingCart, ArrowLeftRight, Scale, CreditCard, PiggyBank, Edit2, Save, RefreshCw, Clock, Lock, Unlock, FolderInput, Settings2, Signature, AlertCircle, CheckCircle, XCircle, History, Calendar, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

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

  const [originalMetalRates, setOriginalMetalRates] = useState({
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
          const newRates = {
            '24k-995': data.latestPrice.gold24K,
            '22k-916': data.latestPrice.gold22K,
            '24k-999': data.latestPrice.silver
          };

          setMetalRates(newRates);
          setOriginalMetalRates(newRates); // Store as original for cancel functionality

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
      // const transactionResponse = await fetch('http://localhost:5000/api/transactions/add-transaction', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${token}`
      //   },
      //   body: JSON.stringify({
      //     amount: parseFloat(amount),
      //     utr_no: `QRP-${paymentResponse.razorpay_payment_id}`,
      //     transaction_type: 'ONLINE',
      //     category: 'DEBIT',
      //     metal_type: selectedMetalData?.metalType,
      //     transaction_status: 'COMPLETED',
      //     grams: parseFloat(grams),
      //     sip_id: sipId // Include SIP ID in transaction
      //   })
      // });

      // if (transactionResponse.ok) {
      //   alert('Payment successful! Transaction has been recorded.');

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
      // } else {
      //   console.error('Failed to record transaction');
      //   alert('Payment successful but failed to record transaction. Please contact support.');
      // }

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
          ondismiss: function () {
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

  // Handle metal selection
  const handleMetalSelection = (metalId) => {
    setSelectedMetal(metalId);

    // Recalculate amount based on existing grams and new metal rate
    const rate = metalRates[metalId];
    if (grams && rate) {
      setAmount((parseFloat(grams) * rate).toFixed(0));
    }
  };

  // Handle rate change
  const handleRateChange = (metalId, newRate) => {
    // Allow empty string while editing, only convert to number if there's a value
    // This prevents the field from defaulting to 0 when user clears it
    if (newRate === '' || newRate === null || newRate === undefined) {
      setMetalRates(prev => ({
        ...prev,
        [metalId]: ''
      }));
    } else {
      const numValue = parseFloat(newRate);
      setMetalRates(prev => ({
        ...prev,
        [metalId]: isNaN(numValue) ? '' : numValue
      }));
    }
  };

  // Handle start edit - store current rates as original
  const handleStartEdit = () => {
    setOriginalMetalRates({ ...metalRates });
    setEditMode(true);
  };

  // Handle cancel edit - restore original rates
  const handleCancelEdit = () => {
    setMetalRates({ ...originalMetalRates });
    setEditMode(false);
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

      // Validate that all rates are filled and valid
      const gold24K = parseFloat(metalRates['24k-995']);
      const gold22K = parseFloat(metalRates['22k-916']);
      const silver = parseFloat(metalRates['24k-999']);

      if (!gold24K || isNaN(gold24K) || gold24K <= 0) {
        alert('Please enter a valid rate for Gold 24K');
        setIsSaving(false);
        return;
      }

      if (!gold22K || isNaN(gold22K) || gold22K <= 0) {
        alert('Please enter a valid rate for Gold 22K');
        setIsSaving(false);
        return;
      }

      if (!silver || isNaN(silver) || silver <= 0) {
        alert('Please enter a valid rate for Silver');
        setIsSaving(false);
        return;
      }

      const priceData = {
        gold24K: gold24K,
        gold22K: gold22K,
        silver: silver
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

        // Update the metalRates state with the validated numbers
        setMetalRates({
          '24k-995': gold24K,
          '22k-916': gold22K,
          '24k-999': silver
        });

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
    if (value.includes('-') || parseFloat(value) < 0) return;

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
    if (value.includes('-') || parseFloat(value) < 0) return;

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
      name: 'Gold 24K',
      purity: '24k-995',
      rate: metalRates['24k-995'],
      balance: metalBalances['24k-995'],
      image: gold_24k,
      metalType: 'gold24K'
    },
    {
      id: '22k-916',
      name: 'Gold 22K',
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
    { icon: <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center text-white text-xs font-bold">₹</div>, label: 'SIP', href: '/Yojana' },
    // { icon: <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center text-white text-xs">💰</div>, label: 'LookBook', href: '/Lookbook' }
  ];

  const customerActionButtons = [
    { icon: <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center text-white text-xs font-bold">₹</div>, label: 'SIP', href: '/Yojana' },
    // { icon: <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center text-white text-xs">💰</div>, label: 'LookBook', href: '/Lookbook' }
  ];



  return (
    <div className="w-full max-w-md mx-auto bg-[#F8FAFC] min-h-screen pb-24 font-sans relative">

      {/* Header */}
      <header className="bg-white px-6 pt-10 pb-8 rounded-b-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-0 z-20">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black text-[#50C2C9] uppercase tracking-widest">Portfolio</span>
              {userType === 'admin' && (
                <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[9px] font-black text-slate-500 uppercase tracking-wider">Admin</span>
              )}
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Hi, {username} {userType === 'admin' ? '(Admin)' : ''}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/Lookbook')}
              className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors relative"
            >
              <Gem size={20} className="text-slate-600" />
            </button>
          </div>
        </div>

        {/* Market Status Bar */}
        <div className={`flex items-center justify-between p-4 rounded-[1.5rem] border ${isMarketOpen ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${isMarketOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <div>
              <p className={`text-[11px] font-black uppercase tracking-wider ${isMarketOpen ? 'text-emerald-700' : 'text-rose-700'}`}>
                Market {marketStatus}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                  <Clock size={10} /> {tradingHours.open} - {tradingHours.close}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">| {currentTime}</span>
              </div>
            </div>
          </div>

          {userType === 'customer' && (
            <button
              onClick={() => fetchLatestPrices(sessionStorage.getItem('authToken'))}
              disabled={isLoadingPrices}
              className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"
            >
              <RefreshCw size={14} className={`text-[#50C2C9] ${isLoadingPrices ? 'animate-spin' : ''}`} />
            </button>
          )}

          {userType === 'admin' && (
            <div className="flex gap-2">
              <button
                onClick={() => handleMarketToggle(isMarketOpen ? 'CLOSED' : 'OPEN')}
                disabled={isUpdatingMarket}
                className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"
              >
                {isMarketOpen ? <Unlock size={14} className="text-emerald-500" /> : <Lock size={14} className="text-rose-500" />}
              </button>
              <button
                onClick={() => setShowMarketHistory(true)}
                className="p-2 bg-white rounded-xl shadow-sm border border-slate-100"
              >
                <History size={14} className="text-slate-400" />
              </button>
            </div>
          )}
        </div>

        {/* Admin Market Time Controls */}
        {userType === 'admin' && !isMarketOpen && (
          <div className="mt-3 flex items-center gap-2 px-1 animate-in slide-in-from-top-2">
            <div className="flex-1 bg-slate-50 p-2 rounded-xl flex items-center gap-2">
              <Clock size={12} className="text-slate-400" />
              <input
                type="time"
                value={tradingHours.open}
                onChange={(e) => setTradingHours(prev => ({ ...prev, open: e.target.value }))}
                className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-full"
              />
              <span className="text-[10px] text-slate-300">-</span>
              <input
                type="time"
                value={tradingHours.close}
                onChange={(e) => setTradingHours(prev => ({ ...prev, close: e.target.value }))}
                className="bg-transparent text-[10px] font-bold text-slate-600 outline-none w-full"
              />
            </div>
            <button
              onClick={handleUpdateTradingHours}
              disabled={isUpdatingMarket}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider"
            >
              Update
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="px-6 py-6 space-y-6">

        {/* Holdings Card */}
        <section className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#50C2C9]/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>

          <div className="flex justify-between items-center mb-6 relative z-10">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest">Your Portfolio</h2>
            <button onClick={() => fetchHoldings(sessionStorage.getItem('authToken'))}>
              <RefreshCw size={14} className={`text-[#50C2C9] ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 relative z-10">
            {metals.map(metal => (
              <div key={metal.id} className="text-center group">
                <div className="relative w-14 h-14 mx-auto mb-3 shadow-lg shadow-slate-100 rounded-full p-2 bg-white border border-slate-50 transition-transform group-hover:scale-105">
                  <Image src={metal.image} alt={metal.name} fill className="object-contain p-2" />
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{metal.purity}</p>
                <p className="text-sm font-black text-slate-800 mt-1">{isLoading ? '...' : metal.balance}<span className="text-[10px] font-black text-slate-400 ml-0.5">gm</span></p>
              </div>
            ))}
          </div>

          {/* Live Rates */}
          <div className="mt-6 pt-6 border-t border-slate-50 relative z-10">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Live Rates</span>
                {lastPriceUpdate && <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1.5 py-0.5 rounded">Updated</span>}
              </div>
              {userType === 'admin' && (
                <div className="flex gap-2">
                  {editMode && (
                    <button
                      onClick={handleCancelEdit}
                      className="text-[10px] font-black text-rose-500 uppercase tracking-wider hover:text-rose-700 transition-colors flex items-center gap-1"
                    >
                      <XCircle size={12} />
                      Cancel
                    </button>
                  )}
                  <button
                    onClick={editMode ? handleSaveRates : handleStartEdit}
                    className="text-[10px] font-black text-[#50C2C9] uppercase tracking-wider hover:text-slate-700 transition-colors flex items-center gap-1"
                  >
                    {editMode ? <Save size={12} /> : <Edit2 size={12} />}
                    {editMode ? (isSaving ? 'Saving...' : 'Save') : 'Edit'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3">
              {metals.map(m => (
                <div key={m.id} className="bg-slate-50 rounded-2xl p-2.5 text-center transition-all hover:bg-slate-100">
                  {editMode ? (
                    <input
                      type="number"
                      className="w-full text-center bg-white rounded-lg text-xs font-bold py-1 text-slate-800 border-2 border-[#50C2C9]/20 focus:ring-2 ring-[#50C2C9]/40 focus:border-[#50C2C9] outline-none transition-all"
                      value={metalRates[m.id] === '' ? '' : metalRates[m.id]}
                      onChange={(e) => handleRateChange(m.id, e.target.value)}
                      placeholder="Enter rate"
                      min="0"
                      step="0.01"
                    />
                  ) : (
                    <p className="text-xs font-black text-slate-800">₹{isLoadingPrices ? '...' : m.rate.toLocaleString()}</p>
                  )}
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">/gm</p>
                </div>
              ))}
            </div>
            <p className="text-[9px] font-bold text-slate-300 text-center mt-3 uppercase tracking-wider">Exclusive of 3% GST</p>
          </div>
        </section>

        {/* Quick Buy Section */}
        <section className="bg-white rounded-[2.5rem] p-6 shadow-xl shadow-slate-200/50 border border-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-[#50C2C9]/10 rounded-xl">
              <ShoppingCart size={18} className="text-[#50C2C9]" />
            </div>
            <h3 className="text-lg font-black text-slate-800">Quick Buy</h3>
          </div>

          {/* Metal Selector */}
          <div className="flex bg-slate-50 p-1.5 rounded-[1.2rem] mb-6">
            {metals.map(m => (
              <button
                key={m.id}
                onClick={() => handleMetalSelection(m.id)}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${selectedMetal === m.id ? 'bg-white text-[#50C2C9] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                  }`}
              >
                {m.name} <span className="hidden sm:inline opacity-70">({m.purity})</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div className="relative group">
              <div className="absolute left-4 top-3 text-[9px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">Buy in Grams</div>
              <input
                type="number"
                value={grams}
                onChange={(e) => handleGramsChange(e.target.value)}
                className="w-full pt-8 pb-3 px-4 bg-slate-50 rounded-[1.5rem] text-lg font-black text-slate-800 outline-none focus:bg-white focus:ring-2 ring-[#50C2C9]/20 focus:shadow-sm transition-all placeholder:text-slate-300"
                placeholder="0.0000"
              />
              <Scale className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#50C2C9] transition-colors" size={18} />
            </div>

            <div className="relative group">
              <div className="absolute left-4 top-3 text-[9px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">Amount (INR)</div>
              <input
                type="number"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="w-full pt-8 pb-3 px-4 bg-slate-50 rounded-[1.5rem] text-lg font-black text-slate-800 outline-none focus:bg-white focus:ring-2 ring-[#50C2C9]/20 focus:shadow-sm transition-all placeholder:text-slate-300"
                placeholder="0"
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-500 group-focus-within:bg-[#50C2C9] group-focus-within:text-white transition-colors">₹</div>
            </div>
          </div>

          {!isMarketOpen && (
            <div className="mt-4 p-3 bg-rose-50 rounded-2xl border border-rose-100 flex items-center gap-3">
              <AlertCircle size={16} className="text-rose-500" />
              <p className="text-[10px] font-bold text-rose-600">Market is currently closed. Purchases are disabled.</p>
            </div>
          )}

          <button
            disabled={!isMarketOpen || !grams || parseFloat(grams) <= 0 || !amount || parseFloat(amount) <= 0}
            onClick={handleBuyNow}
            className="w-full mt-6 py-4 bg-[#50C2C9] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-[#50C2C9]/30 disabled:opacity-50 disabled:shadow-none hover:bg-[#45aeb5] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {isMarketOpen ? 'Proceed to Pay' : 'Market Closed'} <ArrowLeftRight size={16} />
          </button>
        </section>

        {/* Action Buttons Grid */}
        <section className="grid grid-cols-4 gap-3">
          {(userType === 'admin' ? adminActionButtons : customerActionButtons).map((btn, i) => (
            <div
              key={i}
              onClick={() => {
                if (btn.action) btn.action();
                else if (btn.href) router.push(btn.href);
              }}
              className="flex flex-col items-center gap-2 p-3 bg-white rounded-2xl shadow-sm border border-slate-50 active:scale-95 transition-transform cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-[#50C2C9] font-bold">
                {btn.icon}
              </div>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-tight text-center leading-tight">{btn.label}</span>
            </div>
          ))}
        </section>
      </main>

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0"
            onClick={() => setShowPaymentDialog(false)}
          ></div>
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 animate-in slide-in-from-bottom duration-300 relative z-10">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-black text-slate-800">Checkout</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Select payment method</p>
              </div>
              <button onClick={() => setShowPaymentDialog(false)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100">
                <XCircle className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Summary */}
            <div className="bg-slate-50 p-4 rounded-2xl mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Item</span>
                <span className="text-[10px] font-black text-slate-700 uppercase">
                  {metals.find(m => m.id === selectedMetal)?.name} ({metals.find(m => m.id === selectedMetal)?.purity})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Weight</span>
                <span className="text-[10px] font-black text-slate-700">{grams}g</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                <span className="text-sm font-black text-[#50C2C9]">₹{amount}</span>
              </div>
            </div>

            <div className="space-y-4">
              <button
                disabled={processingPayment}
                onClick={() => !processingPayment && handlePaymentMethod('Online')}
                className="w-full flex items-center justify-between p-4 bg-[#50C2C9] text-white rounded-[1.5rem] font-bold shadow-lg shadow-[#50C2C9]/20 hover:bg-[#45aeb5] disabled:opacity-70 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-white/20 rounded-xl"><CreditCard size={20} /></div>
                  <div className="text-left">
                    <p className="text-sm font-black">Online Payment</p>
                    <p className="text-[10px] opacity-80 font-medium">UPI, Cards, Netbanking</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                  {processingPayment ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowLeftRight size={16} />}
                </div>
              </button>

              <button
                disabled={processingPayment}
                onClick={() => !processingPayment && handlePaymentMethod('Offline')}
                className="w-full flex items-center justify-between p-4 bg-white text-slate-700 rounded-[1.5rem] font-bold border-2 border-slate-100 hover:border-slate-200 disabled:opacity-70 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-100 rounded-xl"><ShoppingCart size={20} className="text-slate-500" /></div>
                  <div className="text-left">
                    <p className="text-sm font-black">Offline Transfer</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Manual Bank Deposit</p>
                  </div>
                </div>
                <ArrowLeftRight size={16} className="text-slate-300 group-hover:text-slate-500" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Market History Modal */}
      {showMarketHistory && userType === 'admin' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6 px-2">
              <h3 className="text-lg font-black text-slate-800">Market History</h3>
              <button
                onClick={() => setShowMarketHistory(false)}
                className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 px-2 pb-4 scrollbar-hide">
              {marketHistory.length > 0 ? marketHistory.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50">
                  <div>
                    <span className={`inline-flex px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider mb-1 ${item.status === 'OPEN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {item.status}
                    </span>
                    <p className="text-[10px] text-slate-400 font-bold mt-1">
                      {new Date(item.updated_at || item.last_updated_at).toLocaleString()}
                    </p>
                    {item.updated_by && <p className="text-[9px] text-slate-400">By: {item.updated_by}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Trading Hours</p>
                    <p className="text-xs font-black text-slate-700">{item.open_time || '10:00'} - {item.close_time || '18:00'}</p>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10">
                  <FolderInput size={32} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-400">No history available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0"
            onClick={() => setShowNotifications(false)}
          ></div>
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-6 max-h-[70vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 relative z-10">
            <div className="flex justify-between items-center mb-6 pl-2">
              <div>
                <h3 className="text-lg font-black text-slate-800">Notifications</h3>
                <button onClick={clearAllNotifications} className="text-[10px] font-bold text-rose-500 hover:text-rose-600 uppercase tracking-wider mt-1">Clear All</button>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 pb-2">
              {notifications.length > 0 ? notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer ${notification.is_read ? 'bg-white border-slate-100 opacity-60' : 'bg-indigo-50/50 border-indigo-100'}`}
                  onClick={() => markNotificationAsRead(notification.id)}
                >
                  <div className="flex gap-3">
                    <div className={`mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${notification.type === 'success' ? 'bg-emerald-500' : notification.type === 'warning' ? 'bg-amber-500' : notification.type === 'error' ? 'bg-rose-500' : 'bg-indigo-500'}`}></div>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 mb-0.5">{notification.title}</h4>
                      <p className="text-[11px] text-slate-500 leading-snug font-medium">{notification.message}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-2 uppercase tracking-wider">{new Date(notification.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-10">
                  <Bell size={32} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-400">No new notifications</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center max-w-md mx-auto z-50 pb-safe">
        {[
          {
            icon: <Home className="w-6 h-6" />,
            label: 'Home',
            href: '/Home',
            isActive: (path) => path === '/Home'
          },
          {
            icon: <Bell className="w-6 h-6" />,
            label: 'Notification',
            href: '/Notifications',
            isActive: (path) => path === '/Notifications'
          },
          {
            icon: <PiggyBank className="w-6 h-6" />,
            label: 'Savings',
            href: '/savings',
            isActive: (path) => path === '/savings' || path.startsWith('/savings/') || path === '/savings_plan'
          },
          {
            icon: <CreditCard className="w-6 h-6" />,
            label: 'Passbook',
            href: '/Passbook',
            isActive: (path) => path === '/Passbook'
          },
          {
            icon: <User className="w-6 h-6" />,
            label: 'Profile',
            href: '/profile',
            isActive: (path) => path === '/profile'
          }
        ].map((item, index) => {
          const pathname = usePathname();
          const active = item.isActive(pathname);

          return (
            <div
              key={index}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative group ${active
                ? 'text-[#50C2C9]'
                : 'text-slate-600 hover:text-slate-700'
                }`}
              onClick={() => router.push(item.href)}
            >
              {React.cloneElement(item.icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>

              {item.label === 'Notification' && notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute top-0 right-1/4 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
              )}

              {active && (
                <div className="absolute -bottom-4 w-8 h-1 bg-[#50C2C9] rounded-t-full"></div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default PreciousMetalsApp;