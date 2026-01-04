"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, X, Calendar, Clock, DollarSign, Edit, Users, Plus, Check, AlertCircle, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SIPPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('New SIP');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedSIPId, setSelectedSIPId] = useState(null);
  const [userType, setUserType] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [sipPlans, setSipPlans] = useState([]);
  const [allFixedSips, setAllFixedSips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showCreateFlexibleSIPDialog, setShowCreateFlexibleSIPDialog] = useState(false);
  const [createSIPLoading, setCreateSIPLoading] = useState(false);
  const [metalType, setMetalType] = useState('gold22K');
  const [totalMonths, setTotalMonths] = useState(12);
  const [investmentAmount, setInvestmentAmount] = useState(100000);
  const [manualAmount, setManualAmount] = useState('');
  const [showAmountInput, setShowAmountInput] = useState(false);
  const [amountPayingValues, setAmountPayingValues] = useState({});
  
  // New states for fixed SIP plan
  const [availableFixedSIPs, setAvailableFixedSIPs] = useState([]);
  const [showFixedSIPsList, setShowFixedSIPsList] = useState(false);
  const [loadingFixedSIPs, setLoadingFixedSIPs] = useState(false);
  const [choosingSIP, setChoosingSIP] = useState(false);
  const [selectedFixedSIPId, setSelectedFixedSIPId] = useState(null);
  
  // Time restriction states
  const [isWithinAllowedTime, setIsWithinAllowedTime] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Market status state
  const [marketStatus, setMarketStatus] = useState('open'); // 'open' or 'closed'
  
  // Payment processing state
  const [processingPayment, setProcessingPayment] = useState(false);

  // Function to send transaction data to API
  const sendTransactionData = async (transactionData) => {
    try {
      console.log('📤 Sending transaction data:', transactionData);
      
      const token = sessionStorage.getItem('authToken');
      
      // Prepare data - send null for null values
      const dataToSend = {};
      Object.keys(transactionData).forEach(key => {
        dataToSend[key] = transactionData[key] === null ? null : transactionData[key];
      });
      
      console.log('📤 Data being sent to API:', dataToSend);
      
      const response = await fetch('http://localhost:5000/api/transactions/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Transaction data sent successfully:', result);
        return { success: true, data: result };
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to send transaction data. Status:', response.status, 'Response:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          return { success: false, error: errorData.message || 'Failed to send transaction data' };
        } catch {
          return { success: false, error: 'Failed to send transaction data' };
        }
      }
    } catch (error) {
      console.error('❌ Error sending transaction data:', error);
      return { success: false, error: error.message };
    }
  };

  // Enhanced verifyPayment function with transaction sending - FIXED VERSION
  const verifyPayment = async (paymentResponse, isOffline = false, offlineData = null) => {
    try {
      setProcessingPayment(true);
      
      // Get token from sessionStorage
      const token = sessionStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication token not found. Please login again.');
      }
      
      // IMPORTANT: Get the amount that was used to create the order
      let amount;
      
      if (showAmountInput && manualAmount) {
        amount = parseAmount(manualAmount);
      } else if (selectedPlan) {
        amount = selectedPlan.monthlyAmount || parseAmount(selectedPlan.investMin);
      } else {
        // Try to get from sessionStorage as fallback
        const paymentData = JSON.parse(sessionStorage.getItem('currentPaymentData') || '{}');
        amount = parseAmount(paymentData.amount || '0');
      }
      
      console.log('🔐 Verifying payment with details:', {
        orderId: paymentResponse.razorpay_order_id,
        paymentId: paymentResponse.razorpay_payment_id,
        signature: paymentResponse.razorpay_signature,
        amountToVerify: amount,
        sipId: selectedSIPId,
        isOffline: isOffline
      });
      
      // For both online and offline payments
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
          sipId: selectedSIPId,
          amount: amount,
          isOffline: isOffline || false
        }),
      });

      const verifyData = await verifyResponse.json();
      
      if (verifyResponse.ok) {
        console.log('✅ Payment verified successfully:', verifyData);
        
        // Clear session storage after successful payment
        clearPaymentDataFromSession();
        
        // Clear the stored amount for this SIP
        const newAmountPayingValues = { ...amountPayingValues };
        delete newAmountPayingValues[selectedSIPId];
        setAmountPayingValues(newAmountPayingValues);
        sessionStorage.setItem('amountPayingValues', JSON.stringify(newAmountPayingValues));
        
        // Show success message
        alert('Payment successful! Your SIP has been updated.');
        
        // Refresh the SIP data
        if (userType === 'admin') {
          await fetchAllSIPs();
        } else {
          await fetchUserSIPs();
        }
        
        return { success: true, data: verifyData };
      } else {
        console.error('❌ Payment verification failed:', verifyData);
        alert(`Payment verification failed: ${verifyData.error || verifyData.message}`);
        return { success: false, error: verifyData.error || verifyData.message };
      }
    } catch (error) {
      console.error('❌ Payment verification error:', error);
      alert('Payment verification failed. Please contact support.');
      return { success: false, error: error.message };
    } finally {
      setProcessingPayment(false);
    }
  };

  // Function to handle offline payment submission
  const handleOfflinePaymentSubmission = async (offlinePaymentData) => {
    try {
      console.log('📤 Submitting offline payment:', offlinePaymentData);
      
      // For offline payment, we need to create a mock payment response
      const mockPaymentResponse = {
        razorpay_order_id: offlinePaymentData.orderId || `offline_${Date.now()}`,
        razorpay_payment_id: `offline_payment_${Date.now()}`,
        razorpay_signature: `offline_signature_${Date.now()}`,
        offline: true
      };
      
      // First verify the offline payment
      const verificationResult = await verifyPayment(mockPaymentResponse, true, offlinePaymentData);
      
      if (verificationResult.success) {
        // Clear offline payment data from sessionStorage
        sessionStorage.removeItem('offlinePaymentData');
        return { success: true };
      } else {
        return { success: false, error: verificationResult.error };
      }
    } catch (error) {
      console.error('❌ Offline payment submission error:', error);
      return { success: false, error: error.message };
    }
  };

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
        // setUsername(storedUsername);
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
        // setMetalBalances({
        //   '24k-995': '0.0000',
        //   '22k-916': '0.0000',
        //   '24k-999': '0.0000'
        // });
      }

      const storedSipType = sessionStorage.getItem('sipType');
      
      setUserType(storedUserType || '');
      setAuthToken(storedToken || '');
      
      if (storedSipType) {
        setActiveTab(storedSipType === 'fixed' ? 'All' : 'New SIP');
      }

      // Load saved amount paying values from sessionStorage
      const savedAmounts = sessionStorage.getItem('amountPayingValues');
      if (savedAmounts) {
        setAmountPayingValues(JSON.parse(savedAmounts));
      }

      // Load saved payment data if exists
      const savedPaymentData = sessionStorage.getItem('currentPaymentData');
      if (savedPaymentData) {
        console.log('📝 Loaded saved payment data from session:', JSON.parse(savedPaymentData));
      }

      // Initial fetch based on user type
      if (storedUserType === 'admin') {
        fetchAllSIPs(); // Admin needs to see all SIPs
      } else {
        fetchUserSIPs(); // Customer sees their own SIPs
      }

      // Check time restriction immediately
      checkTimeRestriction();
      
      // Set up interval to check time every minute
      const timeCheckInterval = setInterval(() => {
        const now = new Date();
        setCurrentTime(now);
        checkTimeRestriction(now);
      }, 60000); // Check every minute

      // Clean up interval on unmount
      return () => clearInterval(timeCheckInterval);
    }
  }, []);

  // Function to check if current time is within allowed hours (10:00 AM to 6:00 PM)
  // FIXED: This function now only checks for Fixed SIPs, not Flexible SIPs
  const checkTimeRestriction = (now = new Date()) => {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Define allowed time range: 10:00 AM (600 minutes) to 6:00 PM (1080 minutes)
    const startTimeInMinutes = 10 * 60; // 10:00 AM = 600 minutes
    const endTimeInMinutes = 18 * 60;   // 6:00 PM = 1080 minutes
    
    const isWithinTime = currentTimeInMinutes >= startTimeInMinutes && 
                         currentTimeInMinutes <= endTimeInMinutes;
    
    setIsWithinAllowedTime(isWithinTime);
    
    console.log('⏰ Time check:', {
      currentTime: `${currentHour}:${currentMinute < 10 ? '0' + currentMinute : currentMinute}`,
      currentTimeInMinutes,
      startTime: '10:00 AM (600 minutes)',
      endTime: '6:00 PM (1080 minutes)',
      isWithinAllowedTime: isWithinTime
    });
    
    return isWithinTime;
  };

  // Format time for display
  const formatTime = (date) => {
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Check if we should disable operations based on plan type
  const shouldDisableForFixedSIP = () => {
    return !isWithinAllowedTime;
  };

  // Check if we should disable operations based on plan type
  const shouldDisableOperations = (planType) => {
    // For Fixed SIP: Check time restriction
    // For Flexible SIP: No time restriction (always allowed)
    if (planType === 'Fixed SIP' || planType === 'Fixed') {
      return shouldDisableForFixedSIP();
    }
    return false; // Flexible SIP always allowed
  };

  // Save amount paying values to sessionStorage whenever they change
  useEffect(() => {
    if (Object.keys(amountPayingValues).length > 0) {
      sessionStorage.setItem('amountPayingValues', JSON.stringify(amountPayingValues));
    }
  }, [amountPayingValues]);

  // Fetch all SIPs for admin
  const fetchAllSIPs = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('http://localhost:5000/api/sip/all', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('All SIP Data fetched (Admin):', data);
        
        // For admin, separate fixed and flexible SIPs
        const transformedFixedSips = transformFixedSIPsData(data.sipsFixed || [], true);
        const transformedFlexibleSips = transformFlexibleSIPData(data.sipsFlexible || [], true);
        
        setAllFixedSips(transformedFixedSips);
        setSipPlans(transformedFlexibleSips);
        
        // Load saved amounts
        const savedAmounts = sessionStorage.getItem('amountPayingValues');
        if (savedAmounts) {
          setAmountPayingValues(JSON.parse(savedAmounts));
        } else {
          const initialAmounts = {};
          [...transformedFixedSips, ...transformedFlexibleSips].forEach(plan => {
            initialAmounts[plan.id] = '';
          });
          setAmountPayingValues(initialAmounts);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch SIP data');
      }
    } catch (err) {
      console.error('Error fetching SIP data:', err);
      setError('Network error while fetching SIP data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's personal SIP data - for customers only
  const fetchUserSIPs = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('http://localhost:5000/api/sip/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Raw API data for user SIPs:', {
          flexibleSIPs: data.sipsFlexible,
          metalTypes: data.sipsFlexible?.map(sip => ({
            id: sip.id,
            metal_type: sip.metal_type,
            status: sip.status
          }))
        });
        
        // Transform and set data
        const transformedPlans = transformSIPData(data);
        setSipPlans(transformedPlans);
        
        // For customers in Fixed tab, we need to fetch opted fixed SIPs separately
        if (activeTab === 'All') {
          fetchOptedFixedSIPs();
        }
        
        // Load saved amounts
        const savedAmounts = sessionStorage.getItem('amountPayingValues');
        if (savedAmounts) {
          setAmountPayingValues(JSON.parse(savedAmounts));
        } else {
          const initialAmounts = {};
          transformedPlans.forEach(plan => {
            initialAmounts[plan.id] = '';
          });
          setAmountPayingValues(initialAmounts);
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch SIP data');
      }
    } catch (err) {
      console.error('Error fetching SIP data:', err);
      setError('Network error while fetching SIP data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch latest prices from API
  const fetchLatestPrices = async (token) => {
    try {
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
          console.log('🔄 Metal rates updated with latest prices');
        }
      } else {
        console.error('❌ Failed to fetch prices:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching prices:', error);
    }
  };

  // Fetch holdings data for customers
  const fetchHoldings = async (token) => {
    try {
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
      } else {
        console.error('❌ Failed to fetch holdings:', response.status);
      }
    } catch (error) {
      console.error('❌ Error fetching holdings:', error);
    }
  };

  // NEW FUNCTION: Fetch available fixed SIP plans for customers
  const fetchAvailableFixedSIPs = async () => {
    try {
      // Check time restriction before fetching (only for Fixed SIP)
      if (!isWithinAllowedTime) {
        setError(`Fixed SIP plans can only be chosen between 10:00 AM and 6:00 PM. Current time: ${formatTime(currentTime)}`);
        return;
      }

      // Check market status before fetching
      if (marketStatus === 'closed') {
        setError(`Market is currently closed. SIP operations are temporarily disabled.`);
        return;
      }

      setLoadingFixedSIPs(true);
      setError('');
      
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await fetch('http://localhost:5000/api/sip/fixed', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Available Fixed SIPs fetched:', data);
        
        // Transform the data for display
        const transformedPlans = data.map((plan, index) => ({
          id: plan._id || plan.id,
          name: plan.Yojna_name || `Fixed SIP Plan ${index + 1}`,
          description: plan.description || 'Gold Investment Plan',
          monthlyAmount: plan.range_amount || 0,
          totalMonths: plan.total_months || 12,
          metalType: getDisplayMetalType(plan.metal_type) || '22KT Gold',
          minAmount: plan.min_amount || plan.range_amount || 0,
          maxAmount: plan.max_amount || plan.range_amount || 0,
          isActive: plan.isActive !== false,
          createdAt: plan.created_at || new Date().toISOString()
        }));
        
        setAvailableFixedSIPs(transformedPlans);
        setShowFixedSIPsList(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch fixed SIP plans');
      }
    } catch (err) {
      console.error('Error fetching fixed SIP plans:', err);
      setError(err.message || 'Failed to load fixed SIP plans');
    } finally {
      setLoadingFixedSIPs(false);
    }
  };

  // NEW FUNCTION: Choose a fixed SIP plan
  const handleChooseFixedSIP = async (planId) => {
    try {
      // Check time restriction before proceeding (only for Fixed SIP)
      if (!isWithinAllowedTime) {
        alert(`Cannot choose Fixed SIP plan. Fixed SIP plans can only be chosen between 10:00 AM and 6:00 PM. Current time: ${formatTime(currentTime)}`);
        return;
      }

      // Check market status before proceeding
      if (marketStatus === 'closed') {
        alert(`Market is currently closed. SIP operations are temporarily disabled.`);
        return;
      }

      setChoosingSIP(true);
      setError('');
      
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const userId = sessionStorage.getItem('userId');
      if (!userId) {
        setError('User ID not found');
        return;
      }

      const response = await fetch('http://localhost:5000/api/sip/fixed/opt', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          sipPlanId: planId
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fixed SIP chosen successfully:', data);
        
        // Mark this SIP as selected temporarily
        setSelectedFixedSIPId(planId);
        
        // Save to session storage
        sessionStorage.setItem('selectedFixedSIP', JSON.stringify({
          planId,
          timestamp: new Date().toISOString(),
          status: 'chosen'
        }));
        
        // Show success message
        setTimeout(() => {
          setShowFixedSIPsList(false);
          setSelectedFixedSIPId(null);
          alert('Fixed SIP chosen successfully!');
          
          // Clear from session storage after success
          sessionStorage.removeItem('selectedFixedSIP');
          
          // Refresh the user's SIP data
          fetchUserSIPs();
        }, 1500);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to choose fixed SIP');
      }
    } catch (err) {
      console.error('Error choosing fixed SIP:', err);
      setError(err.message || 'Failed to choose fixed SIP');
      setSelectedFixedSIPId(null);
    } finally {
      setChoosingSIP(false);
    }
  };

  // Fetch opted fixed SIPs for customers
  const fetchOptedFixedSIPs = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      
      if (!token) {
        return;
      }

      console.log('Opted fixed SIPs are included in the main fetch');
      
    } catch (err) {
      console.error('Error fetching opted fixed SIPs:', err);
    }
  };

  // Transform fixed SIPs data for admin view
  const transformFixedSIPsData = (fixedSips, isAdmin = false) => {
    const fixedPlans = [];

    if (fixedSips && fixedSips.length > 0) {
      fixedSips.forEach((fixedSip, index) => {
        const totalAmount = fixedSip.total_amount_paid ? parseFloat(fixedSip.total_amount_paid) : 0;
        const monthlyAmount = fixedSip.sipPlanAdmin?.range_amount || 0;
        
        fixedPlans.push({
          id: fixedSip.id,
          name: fixedSip.sipPlanAdmin?.Yojna_name || `Fixed SIP Plan ${index + 1}`,
          type: 'Fixed SIP',
          dueDate: formatDate(fixedSip.next_due_date),
          createdDate: formatDate(fixedSip.created_at),  
          investMin: `₹${formatCurrency(monthlyAmount)}`,
          totalAmount: `₹${formatCurrency(totalAmount)}`,
          monthlyAmount: monthlyAmount,
          color: 'bg-[#50C2C9]',
          status: fixedSip.status,
          monthsPaid: fixedSip.months_paid || 0,
          nextDueDate: fixedSip.next_due_date,
          isFixed: true,
          createdAt: fixedSip.created_at,
          metalType: getDisplayMetalType(fixedSip.sipPlanAdmin?.metal_type) || '22KT Gold',
          totalMonths: fixedSip.sipPlanAdmin?.total_months || 12,
          userId: fixedSip.user_id,
          userName: `User ${fixedSip.user_id?.substring(0, 8)}...`,
          isAdminView: isAdmin
        });
      });
    }

    return fixedPlans;
  };

  // Transform flexible SIP data (Used for Admin view)
  const transformFlexibleSIPData = (flexibleSips, isAdmin = false) => {
    const flexiblePlans = [];

    if (flexibleSips && flexibleSips.length > 0) {
      flexibleSips.forEach((flexibleSip, index) => {
        const totalAmount = flexibleSip.total_amount_paid ? parseFloat(flexibleSip.total_amount_paid) : 0;
        const displayMetalType = getDisplayMetalType(flexibleSip.metal_type);
        
        console.log(`🔍 Admin Flexible SIP ${index + 1}:`, {
          id: flexibleSip.id,
          backendMetalType: flexibleSip.metal_type,
          displayMetalType: displayMetalType,
          name: `Flexible SIP - ${displayMetalType}`
        });
        
        flexiblePlans.push({
          id: flexibleSip.id,
          name: `Flexible SIP - ${displayMetalType}`,
          type: 'Flexible SIP',
          dueDate: formatDate(flexibleSip.next_due_date),
          createdDate: formatDate(flexibleSip.created_at),
          investMin: `₹${formatCurrency(totalAmount)}`,
          totalAmount: `₹${formatCurrency(totalAmount)}`,
          monthlyAmount: 0,
          color: 'bg-[#50C2C9]',
          redirect: '/Sip_card_details',
          status: flexibleSip.status,
          monthsPaid: flexibleSip.months_paid || 0,
          totalMonths: flexibleSip.total_months || 12,
          metalType: displayMetalType,
          isFixed: false,
          createdAt: flexibleSip.created_at,
          nextDueDate: flexibleSip.next_due_date,
          userId: flexibleSip.user_id,
          userName: isAdmin ? `User ${flexibleSip.user_id?.substring(0, 8)}...` : null,
          isAdminView: isAdmin
        });
      });
    }

    return flexiblePlans;
  };

  // Transform user's personal SIP data (Used for Customer view)
  const transformSIPData = (apiData) => {
    console.log('🔍 Transforming SIP data for customer:', {
      hasFixedSIPs: apiData.sipsFixed?.length || 0,
      hasFlexibleSIPs: apiData.sipsFlexible?.length || 0,
      flexibleSIPs: apiData.sipsFlexible
    });

    const plans = [];

    // Process fixed SIPs (opted ones)
    if (apiData.sipsFixed && apiData.sipsFixed.length > 0) {
      apiData.sipsFixed.forEach((fixedSip, index) => {
        const totalAmount = fixedSip.total_amount_paid ? parseFloat(fixedSip.total_amount_paid) : 0;
        const monthlyAmount = fixedSip.sipPlanAdmin?.range_amount || 0;
        
        plans.push({
          id: fixedSip.id,
          name: fixedSip.sipPlanAdmin?.Yojna_name || `Fixed SIP Plan ${index + 1}`,
          type: 'Fixed SIP',
          dueDate: formatDate(fixedSip.next_due_date),
          createdDate: formatDate(fixedSip.created_at), 
          investMin: `₹${formatCurrency(monthlyAmount)}`,
          totalAmount: `₹${formatCurrency(totalAmount)}`,
          monthlyAmount: monthlyAmount,
          color: 'bg-[#50C2C9]',
          redirect: '/Sip_card_details',
          status: fixedSip.status,
          monthsPaid: fixedSip.months_paid || 0,
          nextDueDate: fixedSip.next_due_date,
          isFixed: true,
          createdAt: fixedSip.created_at,
          metalType: getDisplayMetalType(fixedSip.sipPlanAdmin?.metal_type) || '22KT Gold',
          totalMonths: fixedSip.sipPlanAdmin?.total_months || 12
        });
      });
    }

    // Process flexible SIPs - FIXED: Always use the actual metal type from backend
    if (apiData.sipsFlexible && apiData.sipsFlexible.length > 0) {
      apiData.sipsFlexible.forEach((flexibleSip, index) => {
        const totalAmount = flexibleSip.total_amount_paid ? parseFloat(flexibleSip.total_amount_paid) : 0;
        // CRITICAL FIX: Get the metal type from the flexible SIP record
        const displayMetalType = getDisplayMetalType(flexibleSip.metal_type);
        
        console.log(`✅ Customer Flexible SIP ${index + 1} - FIXED:`, {
          id: flexibleSip.id,
          backendMetalType: flexibleSip.metal_type,
          displayMetalType: displayMetalType,
          name: `Flexible SIP - ${displayMetalType}`
        });
        
        plans.push({
          id: flexibleSip.id,
          name: `Flexible SIP - ${displayMetalType}`, // Now shows correct metal type
          type: 'Flexible SIP',
          dueDate: formatDate(flexibleSip.next_due_date),
          createdDate: formatDate(flexibleSip.created_at),
          investMin: `₹${formatCurrency(totalAmount)}`,
          totalAmount: `₹${formatCurrency(totalAmount)}`,
          monthlyAmount: 0,
          color: 'bg-[#50C2C9]',
          redirect: '/Sip_card_details',
          status: flexibleSip.status,
          monthsPaid: flexibleSip.months_paid || 0,
          totalMonths: flexibleSip.total_months || 12,
          metalType: displayMetalType, // Correct metal type stored
          isFixed: false,
          createdAt: flexibleSip.created_at,
          nextDueDate: flexibleSip.next_due_date
        });
      });
    }

    console.log('✅ Final transformed plans:', plans);
    return plans;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'N/A';
    }
  };

  // UPDATED: Improved getDisplayMetalType function
  const getDisplayMetalType = (metalType) => {
    if (!metalType) return 'Unknown Metal';
    
    const metalTypeStr = String(metalType).toLowerCase().trim();
    
    switch (metalTypeStr) {
      case 'gold22k':
      case '22kt':
      case '22kt gold':
      case '22 karat':
        return '22KT Gold';
      case 'gold24k':
      case '24kt':
      case '24kt gold':
      case '24 karat':
        return '24KT Gold';
      case 'silver':
        return 'Silver';
      default:
        // Return the original value if it's not one of our known types
        return metalType;
    }
  };

  const getEnumMetalType = (displayType) => {
    switch (displayType) {
      case '22KT Gold': return 'gold22K';
      case '24KT Gold': return 'gold24K';
      case 'Silver': return 'silver';
      default: return 'gold22K';
    }
  };

  const getDisplayDate = (plan) => {
    if (userType === 'admin' && activeTab === 'All') {
      return plan.createdDate || formatDate(plan.createdAt);
    } else {
      return plan.dueDate || formatDate(plan.nextDueDate);
    }
  };

  const getDateLabel = () => {
    return (userType === 'admin' && activeTab === 'All') ? 'Created:' : 'Due Date:';
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    const sipType = tab === 'All' ? 'fixed' : 'flexible';
    sessionStorage.setItem('sipType', sipType);
    
    console.log('SIP type stored:', sipType);
    
    // Save tab change to session storage
    sessionStorage.setItem('activeSIPTab', tab);
    
    // Fetch appropriate data based on user type and tab
    if (userType === 'admin') {
      // Admin: Always show all SIPs
      fetchAllSIPs();
    } else {
      // Customer: Fetch user SIPs
      fetchUserSIPs();
    }
  };

  // Handle amount paying input change and save to sessionStorage
  const handleAmountPayingChange = (planId, value) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    
    console.log('💾 Amount paying change:', { planId, value, numericValue });
    
    let newValue = '';
    if (numericValue !== '') {
      newValue = `₹${formatCurrency(parseInt(numericValue))}`;
    }

    const newAmountPayingValues = {
      ...amountPayingValues,
      [planId]: newValue
    };

    setAmountPayingValues(newAmountPayingValues);
    
    // Immediately save to sessionStorage
    sessionStorage.setItem('amountPayingValues', JSON.stringify(newAmountPayingValues));
    
    console.log('💾 Saved amount to sessionStorage:', {
      planId,
      value: newValue,
      numericValue: parseInt(numericValue) || 0,
      allValues: newAmountPayingValues
    });
  };

  // Save payment data to session storage
  const savePaymentDataToSession = () => {
    if (!selectedPlan) return;
    
    const paymentData = {
      selectedPlanId: selectedSIPId,
      planName: selectedPlan.name,
      planType: selectedPlan.type,
      amount: showAmountInput && manualAmount ? manualAmount : selectedPlan.investMin,
      isCustomAmount: showAmountInput && manualAmount && selectedPlan.type === 'Flexible SIP',
      paymentMethod: 'Online', // or 'Offline' based on selection
      metalType: selectedPlan.metalType,
      paymentTime: new Date().toISOString(),
      status: 'pending',
      userId: sessionStorage.getItem('userId'),
      userType: userType
    };
    
    sessionStorage.setItem('currentPaymentData', JSON.stringify(paymentData));
    console.log('💾 Current payment data saved:', paymentData);
  };

  // Function to clear payment data after successful payment
  const clearPaymentDataFromSession = () => {
    sessionStorage.removeItem('currentPaymentData');
    sessionStorage.removeItem('paymentSummaryData');
    sessionStorage.removeItem('currentPaymentAmount');
    sessionStorage.removeItem('currentSIPId');
    sessionStorage.removeItem('initialPaymentData');
    sessionStorage.removeItem('razorpayAmount');
    sessionStorage.removeItem('razorpaySIPId');
    sessionStorage.removeItem('razorpayPlanType');
    sessionStorage.removeItem('razorpayMetalType');
    
    console.log('🧹 Cleared payment data from sessionStorage');
  };

  const handlePay = (id, plan, e) => {
    e.stopPropagation();
    
    // Check if SIP is completed
    if (plan.status === 'COMPLETED') {
      alert('This SIP plan has been completed. Please check your holdings for details.');
      return;
    }
    
    // FIXED: Check time restriction only for Fixed SIP, not for Flexible SIP
    const isFixedSIP = plan.isFixed || plan.type === 'Fixed SIP';
    if (isFixedSIP && !isWithinAllowedTime) {
      alert(`Cannot make payment for Fixed SIP. Fixed SIP payments can only be made between 10:00 AM and 6:00 PM. Current time: ${formatTime(currentTime)}`);
      return;
    }
    
    // Check market status before opening payment dialog
    if (marketStatus === 'closed') {
      alert(`Market is currently closed. Trading operations, including SIP payments, are temporarily disabled.`);
      return;
    }
    
    setSelectedSIPId(id);
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
    
    // Save plan selection to session storage
    sessionStorage.setItem('selectedPlanId', id);
    sessionStorage.setItem('selectedPlan', JSON.stringify(plan));
    
    // Pre-fill the manual amount with the amount paying value if available
    const amountPayingValue = amountPayingValues[id];
    if (amountPayingValue && amountPayingValue !== '') {
      setManualAmount(amountPayingValue);
      setShowAmountInput(true);
      
      // Also store in sessionStorage for Razorpay to access
      sessionStorage.setItem('currentPaymentAmount', amountPayingValue);
      sessionStorage.setItem('currentSIPId', id);
      
      // Save initial payment summary
      const initialPaymentData = {
        planId: id,
        planName: plan.name,
        planType: plan.type,
        amount: amountPayingValue,
        isCustomAmount: true,
        metalType: plan.metalType,
        timestamp: new Date().toISOString()
      };
      sessionStorage.setItem('initialPaymentData', JSON.stringify(initialPaymentData));
    } else {
      setManualAmount('');
      setShowAmountInput(false);
      sessionStorage.removeItem('currentPaymentAmount');
      sessionStorage.removeItem('currentSIPId');
      sessionStorage.removeItem('initialPaymentData');
    }
  };

  // Handle Create Fixed SIP for Admin
  const handleCreateFixedSIP = () => {
    if (userType === 'admin') {
      // Save to session storage before navigation
      sessionStorage.setItem('sipCreationType', 'fixed');
      sessionStorage.setItem('sipCreationUserType', userType);
      router.push('/admin_sip_plans');
    }
  };

  // Handle Create Fixed SIP for Customers
  const handleCreateFixedSIP_customers = () => {
    if (userType === 'customer' && activeTab === 'All') {
      // Check time restriction before proceeding (only for Fixed SIP)
      if (!isWithinAllowedTime) {
        alert(`Cannot create Fixed SIP plan. Fixed SIP plans can only be chosen between 10:00 AM and 6:00 PM. Current time: ${formatTime(currentTime)}`);
        return;
      }
      
      // Check market status before proceeding
      if (marketStatus === 'closed') {
        alert(`Market is currently closed. Trading operations, including SIP creation, are temporarily disabled.`);
        return;
      }
      
      // Save to session storage
      sessionStorage.setItem('sipCreationType', 'fixed');
      sessionStorage.setItem('sipCreationUserType', userType);
      // Fetch available fixed SIP plans
      fetchAvailableFixedSIPs();
    }
  };

  // Enhanced amount parsing function
  const parseAmount = (amountString) => {
    if (!amountString) return 0;
    
    console.log('🔍 Parsing amount:', amountString);
    
    // Remove ₹ symbol, commas, and any whitespace
    const cleanedAmount = amountString.replace(/[₹,]/g, '').trim();
    
    // Parse as float
    const amount = parseFloat(cleanedAmount);
    
    console.log('🔍 Parsed amount result:', {
      original: amountString,
      cleaned: cleanedAmount,
      parsed: amount
    });
    
    // Return 0 if invalid, otherwise return the amount
    return isNaN(amount) ? 0 : amount;
  };

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

  // Enhanced payment method handler with sessionStorage integration - FIXED VERSION
  const handlePaymentMethod = async (method) => {
    // FIXED: Check time restriction only for Fixed SIP, not for Flexible SIP
    const isFixedSIP = selectedPlan?.isFixed || selectedPlan?.type === 'Fixed SIP';
    if (isFixedSIP && !isWithinAllowedTime) {
      alert(`Cannot process payment for Fixed SIP. Fixed SIP payments can only be made between 10:00 AM and 6:00 PM. Current time: ${formatTime(currentTime)}`);
      setShowPaymentDialog(false);
      return;
    }
    
    // Check market status before proceeding with payment
    if (marketStatus === 'closed') {
      alert(`Market is currently closed. Trading operations, including SIP payments, are temporarily disabled.`);
      setShowPaymentDialog(false);
      return;
    }
    
    // Save payment data to session storage
    savePaymentDataToSession();
    
    setShowPaymentDialog(false);
    
    if (!selectedPlan) {
      alert('No plan selected. Please try again.');
      return;
    }

    if (method === 'Online') {
      try {
        let amount;
        
        // Determine the amount to use
        if (showAmountInput && manualAmount) {
          amount = parseAmount(manualAmount);
          console.log('💰 Using MANUAL amount:', {
            manualAmount,
            parsedAmount: amount,
            planType: selectedPlan.type
          });
        } else {
          amount = selectedPlan.monthlyAmount || parseAmount(selectedPlan.investMin);
          console.log('💰 Using DEFAULT amount:', {
            defaultAmount: selectedPlan.investMin,
            parsedAmount: amount,
            planType: selectedPlan.type
          });
        }

        // Enhanced validation
        if (isNaN(amount) || amount <= 0) {
          throw new Error(`Invalid amount: Please enter a valid payment amount`);
        }

        if (amount < 1) {
          throw new Error('Minimum payment amount is ₹1');
        }

        console.log('💰 Final payment details:', {
          amount,
          manualAmount,
          showAmountInput,
          planType: selectedPlan.type,
          planName: selectedPlan.name,
          isFixed: selectedPlan.isFixed,
          isFlexible: !selectedPlan.isFixed,
          amountInPaise: amount * 100,
          sipId: selectedSIPId,
          metalType: selectedPlan.metalType
        });

        // Store payment details in sessionStorage for Razorpay
        sessionStorage.setItem('razorpayAmount', amount.toString());
        sessionStorage.setItem('razorpaySIPId', selectedSIPId);
        sessionStorage.setItem('razorpayPlanType', selectedPlan.type);
        sessionStorage.setItem('razorpayMetalType', selectedPlan.metalType || '22KT Gold');
        sessionStorage.setItem('razorpayIsFixed', selectedPlan.isFixed ? 'true' : 'false');

        const razorpayAmount = Math.round(amount * 100); // Convert to paise for Razorpay
        
        console.log('💰 Razorpay amount in paise:', razorpayAmount);

        // Get auth token from session storage
        const token = sessionStorage.getItem('authToken');
        if (!token) {
          throw new Error('Authentication required. Please login again.');
        }

        console.log('📞 Calling Razorpay API...');
        console.log('Request URL:', 'http://localhost:5000/api/razorpay/create-order');
        console.log('Request payload:', {
          amount: razorpayAmount,
          metalType: selectedPlan.metalType || '22KT Gold',
          sipMonths: selectedPlan.totalMonths || 12,
          sipType: selectedPlan.isFixed ? 'fixed' : 'flexible',
          sipId: selectedSIPId
        });

        const response = await fetch('http://localhost:5000/api/razorpay/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            amount: razorpayAmount,
            metalType: selectedPlan.metalType || '22KT Gold',
            sipMonths: selectedPlan.totalMonths || 12,
            sipType: selectedPlan.isFixed ? 'fixed' : 'flexible',
            sipId: selectedSIPId
          }),
        });

        console.log('📋 API Response status:', response.status);
        console.log('📋 API Response headers:', [...response.headers.entries()]);

        // Read the response text once
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

        // Razorpay options - use orderData.id
        const options = {
          key: 'rzp_test_aOTAZ3JhbITtOK',
          amount: razorpayAmount,
          currency: 'INR',
          name: 'Gold SIP Investment',
          description: `${selectedPlan.metalType} ${selectedPlan.type} Payment - ${selectedPlan.name}`,
          order_id: orderData.id,
          handler: async function (paymentResponse) {
            console.log('✅ Payment successful:', paymentResponse);
            
            // Call verifyPayment with the payment response
            const result = await verifyPayment(paymentResponse);
            
            if (result.success) {
              console.log('✅ Payment verification and processing completed successfully');
            } else {
              console.error('❌ Payment processing failed:', result.error);
            }
          },
          prefill: {
            name: 'Customer Name',
            email: 'customer@example.com',
            contact: '9999999999'
          },
          notes: {
            sipType: selectedPlan.isFixed ? 'fixed' : 'flexible',
            sipId: selectedSIPId,
            metalType: selectedPlan.metalType,
            isManualAmount: showAmountInput && manualAmount ? 'yes' : 'no',
            amount: amount
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
        console.error('❌ Payment initialization error:',{
          message: error.message,
          stack: error.stack,
          name: error.name
        });

        // Show more helpful error message
        let errorMessage = error.message;
        if (error.message.includes('Failed to create payment order')) {
          errorMessage = 'Payment gateway error. Please check your internet connection and try again.';
        } else if (error.message.includes('Invalid amount')) {
          errorMessage = 'Please enter a valid payment amount (minimum ₹1)';
        }
        
        alert(`Payment failed: ${errorMessage}`);
      }
    } else if (method === 'Offline') {
      // FIXED: Check time restriction only for Fixed SIP, not for Flexible SIP
      const isFixedSIP = selectedPlan?.isFixed || selectedPlan?.type === 'Fixed SIP';
      if (isFixedSIP && !isWithinAllowedTime) {
        alert(`Cannot process payment for Fixed SIP. Fixed SIP payments can only be made between 10:00 AM and 6:00 PM. Current time: ${formatTime(currentTime)}`);
        return;
      }
      
      // Check market status for offline payment
      if (marketStatus === 'closed') {
        alert(`Market is currently closed. Trading operations, including offline SIP payments, are temporarily disabled.`);
        return;
      }
      
      // Determine the amount for offline payment
      let amount;
      if (showAmountInput && manualAmount) {
        amount = parseAmount(manualAmount);
      } else {
        amount = selectedPlan.monthlyAmount || parseAmount(selectedPlan.investMin);
      }
      
      // Save offline payment data to session storage
      const offlineData = {
        planId: selectedSIPId,
        planName: selectedPlan.name,
        planType: selectedPlan.type,
        MetalType: selectedPlan.metalType,
        amount: amount,
        timestamp: new Date().toISOString(),
        status: 'offline_pending',
        transaction_type: 'offline',
        isFixed: selectedPlan.isFixed,
        isFlexible: !selectedPlan.isFixed
      };
      
      console.log('💾 Storing offline payment data in session storage:', offlineData);
      sessionStorage.setItem('offlinePaymentData', JSON.stringify(offlineData));
      
      // Navigate to offline payment page
      router.push('/payoffline');
    }
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0';
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  // Enhanced manual amount input handling
  const handleManualAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const numericValue = value ? parseInt(value) : 0;
    
    console.log('⌨️ Manual amount input:', { value, numericValue });
    
    if (numericValue > 0) {
      const formattedAmount = `₹${formatCurrency(numericValue)}`;
      setManualAmount(formattedAmount);
      
      // Also update the amount paying value for this plan
      if (selectedSIPId) {
        handleAmountPayingChange(selectedSIPId, value);
      }
    } else {
      setManualAmount('');
    }
  };

  // Clear manual amount when switching to default
  const handleUseDefaultAmount = () => {
    setShowAmountInput(false);
    setManualAmount('');
    
    // Also clear from sessionStorage
    if (selectedSIPId) {
      const newAmountPayingValues = { ...amountPayingValues };
      delete newAmountPayingValues[selectedSIPId];
      setAmountPayingValues(newAmountPayingValues);
      sessionStorage.setItem('amountPayingValues', JSON.stringify(newAmountPayingValues));
      sessionStorage.removeItem('currentPaymentAmount');
      sessionStorage.removeItem('currentSIPId');
    }
  };

  const createFlexibleSIP = async () => {
    try {
      // FIXED: No time restriction for Flexible SIP creation
      // Check market status before creating SIP
      if (marketStatus === 'closed') {
        alert(`Market is currently closed. Trading operations, including SIP creation, are temporarily disabled.`);
        return;
      }

      setCreateSIPLoading(true);
      const token = sessionStorage.getItem('authToken');
      
      if (!token) {
        alert('Please login again');
        return;
      }

      console.log('🔍 Creating flexible SIP with:', {
        currentMetalTypeState: metalType,
        getDisplayMetalType: getDisplayMetalType(metalType),
        getEnumMetalType: getEnumMetalType(getDisplayMetalType(metalType))
      });

      const enumMetalType = getEnumMetalType(getDisplayMetalType(metalType)); // FIXED

      console.log('🔍 Sending to backend:', {
        metal_type: enumMetalType,
        display: getDisplayMetalType(metalType)
      });

      // Save flexible SIP creation data to session storage
      const sipCreationData = {
        metalType: metalType,
        displayMetalType: getDisplayMetalType(metalType),
        totalMonths: totalMonths,
        investmentAmount: investmentAmount,
        timestamp: new Date().toISOString(),
        userType: userType
      };
      sessionStorage.setItem('flexibleSIPCreation', JSON.stringify(sipCreationData));

      const response = await fetch('http://localhost:5000/api/sip/flexible/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          metal_type: enumMetalType,
          total_months: parseInt(totalMonths),
          amount: parseInt(investmentAmount)
        })
      });

      const responseData = await response.json();
      
      if (response.ok) {
        console.log('✅ SIP created successfully:', responseData);
        // Clear creation data from session storage
        sessionStorage.removeItem('flexibleSIPCreation');
        
        // Refresh data based on user type
        if (userType === 'admin') {
          await fetchAllSIPs();
        } else {
          await fetchUserSIPs();
        }
        setShowCreateFlexibleSIPDialog(false);
        setMetalType('gold22K'); // Reset to default
        setTotalMonths(12);
        setInvestmentAmount(100000);
        alert('Flexible SIP created successfully!');
      } else {
        alert(`Error: ${responseData.message || 'Failed to create flexible SIP'}`);
      }
    } catch (err) {
      alert('Network error while creating flexible SIP');
    } finally {
      setCreateSIPLoading(false);
    }
  };

  // Determine which plans to display based on active tab and user type
  const getDisplayPlans = () => {
    if (userType === 'admin') {
      // Admin view
      if (activeTab === 'All') {
        // Fixed tab: Show all fixed SIPs
        return allFixedSips.filter(plan => plan.isFixed);
      } else {
        // Flexible tab: Show all flexible SIPs
        return sipPlans.filter(plan => !plan.isFixed);
      }
    } else {
      // Customer view
      if (activeTab === 'All') {
        // Fixed tab: Show only opted fixed SIPs
        return sipPlans.filter(plan => plan.isFixed);
      } else {
        // Flexible tab: Show only created flexible SIPs
        return sipPlans.filter(plan => !plan.isFixed);
      }
    }
  };

  const displayPlans = getDisplayPlans();

  // Refresh function for Fixed tab
  const handleRefresh = () => {
    // Save refresh timestamp to session storage
    sessionStorage.setItem('lastSIPRefresh', new Date().toISOString());
    
    if (userType === 'admin') {
      fetchAllSIPs();
    } else {
      fetchUserSIPs();
    }
  };

  // Add a new function to render the fixed SIPs list
  const renderFixedSIPsList = () => {
    if (!showFixedSIPsList) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
        <div 
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={() => !loadingFixedSIPs && !choosingSIP && setShowFixedSIPsList(false)}
        ></div>

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[80vh] flex flex-col animate-scale-in">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Choose Fixed SIP Plan</h2>
              <button
                onClick={() => setShowFixedSIPsList(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={loadingFixedSIPs || choosingSIP}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Select a fixed SIP plan to invest in
            </p>
            
            {/* Time Restriction Banner - Only for Fixed SIP */}
            {!isWithinAllowedTime && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-red-700">
                    Fixed SIP selection is only available between 10:00 AM and 6:00 PM
                  </span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Current time: {formatTime(currentTime)}. Please try again during allowed hours.
                </p>
              </div>
            )}
            
            {/* Market Status Banner */}
            {marketStatus === 'closed' && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-red-700">
                    Market is currently closed
                  </span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  SIP operations are temporarily disabled. Please try again when the market opens.
                </p>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {loadingFixedSIPs ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-[#50C2C9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">Loading available SIP plans...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <X className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={fetchAvailableFixedSIPs}
                  className="bg-[#50C2C9] text-white px-4 py-2 rounded-lg hover:bg-[#45b1b9] transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : availableFixedSIPs.length > 0 ? (
              <div className="space-y-4">
                {availableFixedSIPs.map((plan) => (
                  <div
                    key={plan.id}
                    className={`border rounded-lg p-4 transition-all ${
                      selectedFixedSIPId === plan.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-[#50C2C9]'
                    } ${(!isWithinAllowedTime || marketStatus === 'closed') ? 'opacity-60' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                      </div>
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                        {plan.metalType}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Monthly Amount:</span>
                        <span className="font-medium text-gray-900">₹{formatCurrency(plan.monthlyAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Duration:</span>
                        <span className="font-medium text-gray-900">{plan.totalMonths} Months</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Status:</span>
                        <span className={`font-medium ${plan.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    {selectedFixedSIPId === plan.id ? (
                      <div className="w-full py-2 rounded-lg bg-green-100 flex items-center justify-center space-x-2">
                        <Check className="w-5 h-5 text-green-600" />
                        <span className="font-medium text-green-700">Plan Selected Successfully!</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => isWithinAllowedTime && marketStatus === 'open' && handleChooseFixedSIP(plan.id)}
                        disabled={!plan.isActive || choosingSIP || (!isWithinAllowedTime || marketStatus === 'closed')}
                        className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                          plan.isActive && isWithinAllowedTime && marketStatus === 'open'
                            ? 'bg-green-600 text-white hover:bg-green-700' 
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {choosingSIP ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing...</span>
                          </>
                        ) : (
                          <span>
                            {marketStatus === 'closed'
                              ? 'Market Closed'
                              : !isWithinAllowedTime 
                              ? 'Available 10:00 AM - 6:00 PM' 
                              : plan.isActive ? 'Choose Plan' : 'Not Available'
                            }
                          </span>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-600 mb-2">No fixed SIP plans available</p>
                <p className="text-sm text-gray-500">
                  Contact administrator for available plans
                </p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <button
              onClick={() => setShowFixedSIPsList(false)}
              className="w-full bg-gray-600 text-white py-3 rounded-lg font-semibold hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Display saved payment data from session storage
  const displaySavedPaymentData = () => {
    const paymentData = JSON.parse(sessionStorage.getItem('currentPaymentData') || 'null');
    const summaryData = JSON.parse(sessionStorage.getItem('paymentSummaryData') || 'null');
    
    if (!paymentData && !summaryData) return null;
    
    return (
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-sm font-medium text-blue-800 mb-2">Last Payment Session Data:</h3>
        <div className="text-xs space-y-1">
          {paymentData && (
            <>
              <div className="flex justify-between">
                <span className="text-blue-700">Plan:</span>
                <span className="text-black font-medium">{paymentData.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Amount:</span>
                <span className="text-black font-medium">{paymentData.amount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Time:</span>
                <span className="text-black text-xs">
                  {new Date(paymentData.paymentTime).toLocaleString()}
                </span>
              </div>
            </>
          )}
          {summaryData && (
            <div className="flex justify-between">
              <span className="text-blue-700">Status:</span>
              <span className={`font-medium ${paymentData?.status === 'pending' ? 'text-yellow-600' : 'text-green-600'}`}>
                {paymentData?.status || 'Saved'}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Debug component to show current SIP plans data
  const DebugInfo = () => {
    useEffect(() => {
      console.log('🔍 Current SIP plans:', sipPlans);
      console.log('🔍 Amount paying values:', amountPayingValues);
    }, [sipPlans]);
    
    return null;
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white min-h-screen flex flex-col relative">
      <DebugInfo />
      
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100">
        <button className="mr-4" onClick={() => router.push('/savings_plan')}>
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center mr-10">
          SIP Holdings
        </h1>
        
        {/* Current Time Display */}
        <div className="absolute right-4 top-4">
          <div className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded-lg">
            <Clock className="w-3 h-3 text-gray-600" />
            <span className="text-xs font-medium text-gray-700">
              {formatTime(currentTime)}
            </span>
          </div>
        </div>
      </div>

      {/* Time Restriction Banner - Updated for Fixed SIP only */}
      {!isWithinAllowedTime && userType === 'customer' && activeTab === 'All' && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-700">
                ⏰ Fixed SIP Payment Restricted
              </p>
              <p className="text-xs text-red-600 mt-1">
                Fixed SIP payments can only be made between 10:00 AM and 6:00 PM. Current time: {formatTime(currentTime)}
                <br />
                <span className="font-semibold">Note:</span> Flexible SIP payments are available 24/7.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Market Status Banner */}
      {marketStatus === 'closed' && userType === 'customer' && (
        <div className="px-4 py-3 bg-red-50 border-b border-red-200">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-700">
                ⚠️ Market Closed
              </p>
              <p className="text-xs text-red-600 mt-1">
                Trading operations, including SIP creation and payments, are temporarily disabled.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Admin Info Banner */}
      {userType === 'admin' && activeTab === 'All' && (
        <div className="px-4 py-3 bg-purple-50 border-b border-purple-200">
          <div className="flex items-center justify-center space-x-2">
            <Users className="w-4 h-4 text-purple-600" />
            <p className="text-sm text-purple-700 font-medium">
              Admin View: All Users' Fixed SIPs
            </p>
          </div>
          <p className="text-xs text-purple-600 text-center mt-1">
            Showing all fixed SIPs from all users
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="px-4 py-4">
        <div className="flex">
          <button
            onClick={() => handleTabChange('All')}
            className={`flex-1 text-center py-2 text-sm font-medium ${
              activeTab === 'All'
                ? 'text-gray-800 border-b-2 border-gray-400'
                : 'text-gray-500'
            }`}
          >
            Fixed
          </button>
          <button
            onClick={() => handleTabChange('New SIP')}
            className={`flex-1 text-center py-2 text-sm font-medium ${
              activeTab === 'New SIP'
                ? 'text-[#50C2C9] border-b-2 border-[#50C2C9]'
                : 'text-gray-500'
            }`}
          >
            Flexible
          </button>
        </div>
      </div>

      {/* Fixed SIPs List Modal */}
      {renderFixedSIPsList()}

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#50C2C9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading SIP plans...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-[#50C2C9] text-white px-4 py-2 rounded-lg hover:bg-[#45b1b9] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* SIP Plans */}
      {!loading && !error && (
        <div className={`flex-1 px-4 space-y-4 transition-all duration-300 ${showPaymentDialog || showCreateFlexibleSIPDialog ? 'blur-md filter' : ''}`}>
          {displayPlans.length > 0 ? (
            displayPlans.map((plan) => {
              const isFixedSIP = plan.isFixed || plan.type === 'Fixed SIP';
              const shouldDisable = (isFixedSIP && !isWithinAllowedTime) || marketStatus === 'closed';
              
              return (
                <div
                  key={plan.id}
                  className={`${plan.color} rounded-lg p-4 cursor-pointer hover:opacity-90 transition-opacity`}
                >
                  {/* Plan Title - White Text */}
                  <div className="mb-4">
                    <h3 className="text-lg font-bold mb-1 text-white">{plan.name}</h3>
                    <div className="flex items-center gap-2">
                      <div className="inline-block bg-white bg-opacity-20 px-2 py-1 rounded text-xs text-white">
                        {plan.type}
                      </div>
                      {plan.status && (
                        <div className={`inline-block px-2 py-1 rounded text-xs text-white ${
                          plan.status === 'ACTIVE' ? 'bg-green-500' : 
                          plan.status === 'PAUSED' ? 'bg-yellow-500' : 
                          plan.status === 'COMPLETED' ? 'bg-gray-500' : 'bg-gray-500'
                        }`}>
                          {plan.status}
                        </div>
                      )}
                    </div>
                    
                    {/* User Info for Admin View */}
                    {userType === 'admin' && plan.userName && (
                      <div className="mt-2 flex items-center space-x-1">
                        <Users className="w-3 h-3 text-white opacity-80" />
                        <span className="text-xs text-white opacity-80">{plan.userName}</span>
                      </div>
                    )}
                  </div>

                  {/* Plan Details Section - BLACK TEXT for data fields */}
                  <div className="border-t border-white border-opacity-30 pt-3 space-y-3">
                    {/* Row 1: Due Date and Months */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Due Date */}
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 flex-shrink-0 text-white" />
                        <span className="text-sm whitespace-nowrap text-white">{getDateLabel()}</span>
                        <div className="bg-white bg-opacity-20 px-2 py-1 rounded-full min-w-[80px] text-center">
                          <span className="text-sm font-medium text-black">
                            {getDisplayDate(plan)}
                          </span>
                        </div>
                      </div>

                      {/* Months Progress */}
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 flex-shrink-0 text-white" />
                        <span className="text-sm whitespace-nowrap text-white">Months:</span>
                        <div className="bg-white bg-opacity-20 px-2 py-1 rounded-full min-w-[80px] text-center">
                          <span className="text-sm font-medium text-black">
                            {plan.monthsPaid}/{plan.totalMonths || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Row 2: Amount Invested */}
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 flex-shrink-0 text-white" />
                      <span className="text-sm whitespace-nowrap text-white">Amount Invested:</span>
                      <div className="bg-white bg-opacity-20 px-2 py-1 rounded-full min-w-[80px] text-center">
                        <span className="text-sm font-medium text-black">
                          {plan.totalAmount}
                        </span>
                      </div>
                    </div>

                    {/* Row 3: Monthly Amount - EDITABLE FIELD */}
                    <div className="flex items-center space-x-2">
                      <DollarSign className="w-4 h-4 flex-shrink-0 text-white" />
                      <span className="text-sm whitespace-nowrap text-white">Amount Paying:</span>
                      <div className="bg-white bg-opacity-20 px-2 py-1 rounded-full min-w-[80px] text-center">
                        <input
                          type="text"
                          value={amountPayingValues[plan.id] || ''}
                          onChange={(e) => handleAmountPayingChange(plan.id, e.target.value)}
                          placeholder="₹0"
                          className="w-full bg-transparent border-none text-sm font-medium text-black text-center focus:outline-none focus:ring-0 focus:bg-white focus:bg-opacity-30 focus:rounded px-1"
                          style={{ color: 'black' }}
                          disabled={plan.status === 'COMPLETED'}
                        />
                      </div>
                    </div>

                    {/* Row 4: Metal Type */}
                    <div className="flex items-center space-x-2">
                      <span className="text-sm whitespace-nowrap text-white">Metal:</span>
                      <div className="bg-white bg-opacity-20 px-2 py-1 rounded-full text-center">
                        <span className="text-sm font-medium text-black">
                          {plan.metalType}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pay Button - Updated to handle COMPLETED status */}
                  {userType === 'customer' && (
                    <div className="flex justify-end pt-3">
                      {plan.status === 'COMPLETED' ? (
                        <div className="px-4 py-2 rounded-md font-semibold bg-gray-100 text-gray-700 cursor-not-allowed shadow-md text-sm text-center">
                          <div className="flex items-center space-x-1">
                            <Check className="w-4 h-4" />
                            <span>SIP Completed</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Please check holdings</p>
                        </div>
                      ) : shouldDisable ? (
                        <button
                          onClick={(e) => handlePay(plan.id, plan, e)}
                          disabled={true}
                          className="px-6 py-2 rounded-md font-semibold bg-gray-300 text-gray-500 cursor-not-allowed shadow-md"
                          title={
                            marketStatus === 'closed'
                              ? "Market is currently closed"
                              : isFixedSIP
                              ? "Fixed SIP payments only allowed between 10:00 AM and 6:00 PM"
                              : ""
                          }
                        >
                          {marketStatus === 'closed' 
                            ? 'Market Closed' 
                            : isFixedSIP 
                            ? 'Time Restricted' 
                            : 'Pay'
                          }
                        </button>
                      ) : (
                        <button
                          onClick={(e) => handlePay(plan.id, plan, e)}
                          className="px-6 py-2 rounded-md font-semibold bg-white text-[#50C2C9] hover:bg-opacity-90 transition-colors shadow-md"
                        >
                          Pay
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">No {activeTab === 'All' ? 'Fixed' : 'Flexible'} SIP plans found</p>
              <p className="text-sm text-gray-500">
                {userType === 'admin' 
                  ? activeTab === 'All' 
                    ? 'No fixed SIPs from any users' 
                    : 'No flexible SIPs from any users'
                  : activeTab === 'All' 
                    ? 'You have not opted for any fixed SIPs' 
                    : 'You have not created any flexible SIPs'
                }
              </p>
            </div>
          )}

          {/* Display saved payment data from session storage */}
          {displaySavedPaymentData()}

          {/* Action Buttons Section */}
          <div className="flex justify-center mt-6 pb-8 space-x-4">
            {/* Create Flexible SIP Button - Show for Flexible tab */}
            {activeTab === 'New SIP' && (
              <button
                onClick={() => {
                  if (userType === 'customer') {
                    // FIXED: No time restriction for Flexible SIP creation
                    // Check market status
                    if (marketStatus === 'closed') {
                      alert(`Market is currently closed. Trading operations, including SIP creation, are temporarily disabled.`);
                      return;
                    }
                    setShowCreateFlexibleSIPDialog(true);
                  } else {
                    // Admin can also create flexible SIPs if needed
                    setShowCreateFlexibleSIPDialog(true);
                  }
                }}
                disabled={marketStatus === 'closed'}
                className={`px-6 py-3 rounded-lg font-semibold shadow-md transition-all flex items-center space-x-2 ${
                  marketStatus === 'closed'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#50C2C9] text-white hover:bg-[#45b1b9]'
                }`}
                title={marketStatus === 'closed' ? "Market is currently closed" : ""}
              >
                <Plus className="w-4 h-4" />
                <span>
                  {marketStatus === 'closed' ? 'Market Closed' : 'Create Flexible SIP'}
                </span>
              </button>
            )}

            {/* Create Fixed SIP Button - Show for Admin in Fixed tab */}
            {userType === 'admin' && activeTab === 'All' && (
              <button
                onClick={handleCreateFixedSIP}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-green-700 transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Fixed SIP</span>
              </button>
            )}
            {userType === 'customer' && activeTab === 'All' && (
              <button
                onClick={handleCreateFixedSIP_customers}
                disabled={!isWithinAllowedTime || marketStatus === 'closed'}
                className={`px-6 py-3 rounded-lg font-semibold shadow-md transition-all flex items-center space-x-2 ${
                  !isWithinAllowedTime || marketStatus === 'closed'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
                title={
                  marketStatus === 'closed' 
                    ? "Market is currently closed" 
                    : !isWithinAllowedTime 
                    ? "Fixed SIP creation only available 10:00 AM - 6:00 PM" 
                    : ""
                }
              >
                <Plus className="w-4 h-4" />
                <span>
                  {marketStatus === 'closed' 
                    ? 'Market Closed' 
                    : !isWithinAllowedTime 
                    ? 'Available 10:00 AM - 6:00 PM' 
                    : 'Create Fixed SIP'
                  }
                </span>
              </button>
            )}

            {/* Refresh Button for Both Tabs */}
            <button
              onClick={handleRefresh}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-gray-700 transition-all flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>

          {/* Time Restriction Info - Updated for Fixed SIP only */}
          {userType === 'customer' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Clock className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-yellow-800">
                    ⏰ Payment Hours Information
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    <span className="font-semibold">Fixed SIP:</span> Payments can only be made between <span className="font-semibold">10:00 AM and 6:00 PM</span> every day.
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    <span className="font-semibold">Flexible SIP:</span> Payments are available <span className="font-semibold">24/7</span>.
                  </p>
                  <p className="text-xs text-yellow-600 mt-1">
                    Current time: <span className="font-medium">{formatTime(currentTime)}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Market Status Info */}
          {userType === 'customer' && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <Lock className={`w-4 h-4 ${marketStatus === 'closed' ? 'text-red-600' : 'text-green-600'} mt-0.5 flex-shrink-0`} />
                <div>
                  <p className="text-xs font-medium text-blue-800">
                    📊 Market Status
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Current market status: <span className={`font-semibold ${marketStatus === 'closed' ? 'text-red-600' : 'text-green-600'}`}>
                      {marketStatus === 'closed' ? 'CLOSED' : 'OPEN'}
                    </span>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {marketStatus === 'closed' 
                      ? 'Trading operations are temporarily disabled. You can view existing SIPs but cannot create new ones or make payments.'
                      : 'Market is open for trading operations.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Enhanced Payment Dialog with Manual Amount Input */}
      {showPaymentDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowPaymentDialog(false)}
          ></div>

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
            <button
              onClick={() => setShowPaymentDialog(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Make Payment
              </h2>
              <p className="text-sm text-gray-500">
                {selectedPlan?.name}
              </p>
              <div className="mt-2 inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                {selectedPlan?.type}
              </div>
              
              {/* Time Restriction Notice - Only for Fixed SIP */}
              {selectedPlan?.isFixed && !isWithinAllowedTime && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 justify-center">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-medium text-red-700">
                      ⏰ Fixed SIP Payment Time Restricted
                    </span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    Fixed SIP payments can only be made between 10:00 AM and 6:00 PM
                  </p>
                  <p className="text-xs text-red-600">
                    Current time: {formatTime(currentTime)}
                  </p>
                </div>
              )}

              {/* Market Status Notice */}
              {marketStatus === 'closed' && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 justify-center">
                    <Lock className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-medium text-red-700">
                      ⚠️ Market Closed
                    </span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    Trading operations, including SIP payments, are temporarily disabled.
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced Manual Amount Input Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Amount {selectedPlan?.type === 'Flexible SIP' && '(You can enter any amount)'}
              </label>
              
              {/* Default Amount Display */}
              {!showAmountInput && (
                <div className="space-y-3">
                  <div 
                    className={`border-2 ${(selectedPlan?.isFixed && !isWithinAllowedTime) || marketStatus === 'closed' ? 'border-gray-300 bg-gray-50' : 'border-[#50C2C9] bg-blue-50'} rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors`}
                    onClick={() => !((selectedPlan?.isFixed && !isWithinAllowedTime) || marketStatus === 'closed') && setShowAmountInput(true)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedPlan?.type === 'Flexible SIP' ? 'Suggested Amount' : 'Default Amount'}
                        </p>
                        <p className="text-lg font-bold text-[#50C2C9]">{selectedPlan?.investMin}</p>
                        <p className="text-xs text-gray-500">
                          {marketStatus === 'closed'
                            ? 'Market is currently closed'
                            : selectedPlan?.isFixed && !isWithinAllowedTime 
                            ? 'Fixed SIP payments disabled outside allowed hours' 
                            : selectedPlan?.type === 'Flexible SIP' 
                              ? 'Click to enter custom amount' 
                              : 'Monthly installment amount'
                          }
                        </p>
                      </div>
                      {!((selectedPlan?.isFixed && !isWithinAllowedTime) || marketStatus === 'closed') && <Edit className="w-4 h-4 text-[#50C2C9]" />}
                    </div>
                  </div>
                  {selectedPlan?.type === 'Flexible SIP' && (
                    <p className="text-xs text-green-600 text-center font-medium">
                      💡 For Flexible SIP, you can pay any amount you want!
                    </p>
                  )}
                </div>
              )}

              {/* Enhanced Manual Amount Input */}
              {showAmountInput && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={manualAmount}
                      onChange={handleManualAmountChange}
                      placeholder="Enter amount (e.g., 5000)"
                      className="w-full p-4 border-2 border-[#50C2C9] rounded-lg focus:ring-2 focus:ring-[#50C2C9] focus:border-transparent text-lg font-medium text-black"
                      autoFocus
                      disabled={(selectedPlan?.isFixed && !isWithinAllowedTime) || marketStatus === 'closed'}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex space-x-1">
                      <button
                        onClick={handleUseDefaultAmount}
                        className="text-gray-400 hover:text-gray-600"
                        title="Use default amount"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-500">
                      Enter the amount you want to pay
                    </p>
                    {manualAmount && (
                      <p className="text-xs font-medium text-green-600">
                        Will pay: {manualAmount}
                      </p>
                    )}
                  </div>
                  {selectedPlan?.type === 'Flexible SIP' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <p className="text-xs text-green-700 text-center">
                        ✅ This amount will be added to your Flexible SIP balance
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment Method Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => !((selectedPlan?.isFixed && !isWithinAllowedTime) || marketStatus === 'closed' || processingPayment) && handlePaymentMethod('Online')}
                disabled={(selectedPlan?.isFixed && !isWithinAllowedTime) || marketStatus === 'closed' || (showAmountInput && !manualAmount) || processingPayment}
                className={`w-full py-4 rounded-lg font-semibold transition-all shadow-md flex items-center justify-center space-x-2 ${
                  (selectedPlan?.isFixed && !isWithinAllowedTime) || marketStatus === 'closed' || processingPayment
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : (showAmountInput && !manualAmount)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-[#50C2C9] text-white hover:bg-[#45b1b9]'
                }`}
              >
                {processingPayment ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : marketStatus === 'closed' ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Market Closed</span>
                  </>
                ) : selectedPlan?.isFixed && selectedPlan?.isFlexible && !isWithinAllowedTime ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Available 10:00 AM - 6:00 PM</span>
                  </>
                ) : (
                  <span>Pay {showAmountInput && manualAmount ? manualAmount : selectedPlan?.investMin} Online</span>
                )}
              </button>

              <button
                onClick={() => !((selectedPlan?.isFixed && !isWithinAllowedTime) || marketStatus === 'closed' || processingPayment) && handlePaymentMethod('Offline')}
                disabled={(selectedPlan?.isFixed && !isWithinAllowedTime) || marketStatus === 'closed' || processingPayment}
                className={`w-full py-4 rounded-lg font-semibold transition-all shadow-md flex items-center justify-center space-x-2 ${
                  (selectedPlan?.isFixed && !isWithinAllowedTime) || marketStatus === 'closed' || processingPayment
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                <span>
                  {processingPayment
                    ? 'Processing...'
                    : marketStatus === 'closed' 
                    ? 'Offline Payment Disabled' 
                    : selectedPlan?.isFixed && selectedPlan?.isFlexible && !isWithinAllowedTime 
                    ? 'Available 10:00 AM - 6:00 PM'
                    : 'Pay Offline'
                  }
                </span>
              </button>
            </div>

            {/* Enhanced Payment Summary */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-700 font-medium mb-2">
                Payment Summary
              </p>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>SIP Plan:</span>
                  <span className="text-black font-medium">{selectedPlan?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Metal Type:</span>
                  <span className="text-black font-medium">{selectedPlan?.metalType}</span>
                </div>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className={`font-medium ${
                    selectedPlan?.type === 'Flexible SIP' ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {selectedPlan?.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Amount:</span>
                  <span className="font-semibold text-black text-sm">
                    {showAmountInput && manualAmount ? manualAmount : selectedPlan?.investMin}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Market Status:</span>
                  <span className="font-semibold text-black text-sm">
                    {marketStatus}
                  </span>
                </div>
                {selectedPlan?.isFixed && (
                  <div className="flex justify-between">
                    <span>Payment Hours:</span>
                    <span className={`font-semibold text-sm ${
                      isWithinAllowedTime ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isWithinAllowedTime ? '10:00 AM - 6:00 PM' : 'Outside allowed hours'}
                    </span>
                  </div>
                )}
                {showAmountInput && manualAmount && selectedPlan?.type === 'Flexible SIP' && (
                  <div className="flex justify-between">
                    <span>Payment Type:</span>
                    <span className="font-medium text-green-600">Custom Amount</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Payment Status:</span>
                  <span className={`font-medium ${
                    marketStatus === 'closed' 
                      ? 'text-red-600' 
                      : selectedPlan?.isFixed && !isWithinAllowedTime 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {marketStatus === 'closed' 
                      ? 'Market Closed' 
                      : selectedPlan?.isFixed && !isWithinAllowedTime 
                      ? 'Time Restricted' 
                      : 'Allowed'
                    }
                  </span>
                </div>
              </div>
            </div>

            {/* Transaction Info */}
            <div className="mt-4 p-2 bg-blue-50 rounded text-xs text-blue-700 text-center">
              💾 Transaction will be recorded in your investment history
            </div>
          </div>
        </div>
      )}

      {/* Create Flexible SIP Dialog */}
      {showCreateFlexibleSIPDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => !createSIPLoading && setShowCreateFlexibleSIPDialog(false)}
          ></div>

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
            <button
              onClick={() => !createSIPLoading && setShowCreateFlexibleSIPDialog(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              disabled={createSIPLoading}
            >
              <X className="w-6 h-6" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Create Flexible SIP
              </h2>
              <p className="text-sm text-gray-500">
                Start your flexible gold investment plan
              </p>
              
              {/* FIXED: No time restriction notice for Flexible SIP */}
              {/* Market Status Notice */}
              {marketStatus === 'closed' && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 justify-center">
                    <Lock className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-medium text-red-700">
                      Market is currently closed
                    </span>
                  </div>
                  <p className="text-xs text-red-600 mt-1">
                    SIP operations are temporarily disabled. Please try again when the market opens.
                  </p>
                </div>
              )}
            </div>

            {/* SIP Configuration */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metal Type
                </label>
                <select 
                  value={getDisplayMetalType(metalType)} // <-- Shows the display name
                  onChange={(e) => setMetalType(getEnumMetalType(e.target.value))} // <-- Sets enum value
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#50C2C9] focus:border-transparent text-black"
                  disabled={marketStatus === 'closed' || createSIPLoading}
                >
                  <option value="22KT Gold">22KT Gold</option>
                  <option value="24KT Gold">24KT Gold</option>
                  <option value="Silver">Silver</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag your plan (months)
                </label>
                <select 
                  value={totalMonths}
                  onChange={(e) => setTotalMonths(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#50C2C9] focus:border-transparent text-black"
                  disabled={marketStatus === 'closed' || createSIPLoading}
                >
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={createFlexibleSIP}
              disabled={createSIPLoading || marketStatus === 'closed'}
              className={`w-full py-4 rounded-lg font-semibold transition-all shadow-md flex items-center justify-center space-x-2 ${
                createSIPLoading || marketStatus === 'closed'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-[#50C2C9] text-white hover:bg-[#45b1b9]'
              }`}
            >
              {createSIPLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating SIP...</span>
                </>
              ) : marketStatus === 'closed' ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Market Closed</span>
                </>
              ) : (
                <span>Create Flexible SIP</span>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              {marketStatus === 'closed'
                ? 'Market is currently closed. SIP operations are temporarily disabled.'
                : 'You can add funds to your flexible SIP anytime'
              }
            </p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0.9);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default SIPPage;