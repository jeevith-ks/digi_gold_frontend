"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, X, Calendar, Clock, DollarSign, Edit, Users, Plus } from 'lucide-react';
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

  useEffect(() => {
    const storedUserType = sessionStorage.getItem('userType');
    const token = sessionStorage.getItem('authToken');
    const storedSipType = sessionStorage.getItem('sipType');
    
    setUserType(storedUserType || '');
    setAuthToken(token || '');
    
    if (storedSipType) {
      setActiveTab(storedSipType === 'fixed' ? 'All' : 'New SIP');
    }

    // Load saved amount paying values from sessionStorage
    const savedAmounts = sessionStorage.getItem('amountPayingValues');
    if (savedAmounts) {
      setAmountPayingValues(JSON.parse(savedAmounts));
    }

    // Initial fetch based on user type
    if (storedUserType === 'admin') {
      fetchAllSIPs(); // Admin needs to see all SIPs
    } else {
      fetchUserSIPs(); // Customer sees their own SIPs
    }
  }, []);

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
        console.log('User SIP Data fetched:', data);
        
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

  // Fetch opted fixed SIPs for customers
  const fetchOptedFixedSIPs = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      
      if (!token) {
        return;
      }

      // Note: Based on your backend, opted fixed SIPs are included in the /api/sip/ endpoint
      // So we don't need a separate call if we already have the data
      // This function is kept for future expansion if needed
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

  // Transform flexible SIP data
  const transformFlexibleSIPData = (flexibleSips, isAdmin = false) => {
    const flexiblePlans = [];

    if (flexibleSips && flexibleSips.length > 0) {
      flexibleSips.forEach((flexibleSip, index) => {
        const totalAmount = flexibleSip.total_amount_paid ? parseFloat(flexibleSip.total_amount_paid) : 0;
        
        flexiblePlans.push({
          id: flexibleSip.id,
          name: `Flexible SIP - ${getDisplayMetalType(flexibleSip.metal_type)}`,
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
          metalType: getDisplayMetalType(flexibleSip.metal_type),
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

  // Transform user's personal SIP data
  const transformSIPData = (apiData) => {
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

    // Process flexible SIPs
    if (apiData.sipsFlexible && apiData.sipsFlexible.length > 0) {
      apiData.sipsFlexible.forEach((flexibleSip, index) => {
        const totalAmount = flexibleSip.total_amount_paid ? parseFloat(flexibleSip.total_amount_paid) : 0;
        
        plans.push({
          id: flexibleSip.id,
          name: `Flexible SIP - ${getDisplayMetalType(flexibleSip.metal_type)}`,
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
          metalType: getDisplayMetalType(flexibleSip.metal_type),
          isFixed: false,
          createdAt: flexibleSip.created_at,
          nextDueDate: flexibleSip.next_due_date
        });
      });
    }

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

  const getDisplayMetalType = (metalType) => {
    switch (metalType) {
      case 'gold22K': return '22KT Gold';
      case 'gold24K': return '24KT Gold';
      case 'silver': return 'Silver';
      default: return metalType || '22KT Gold';
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

  const handlePay = (id, plan, e) => {
    e.stopPropagation();
    setSelectedSIPId(id);
    setSelectedPlan(plan);
    setShowPaymentDialog(true);
    
    // Pre-fill the manual amount with the amount paying value if available
    const amountPayingValue = amountPayingValues[id];
    if (amountPayingValue && amountPayingValue !== '') {
      setManualAmount(amountPayingValue);
      setShowAmountInput(true);
      
      // Also store in sessionStorage for Razorpay to access
      sessionStorage.setItem('currentPaymentAmount', amountPayingValue);
      sessionStorage.setItem('currentSIPId', id);
    } else {
      setManualAmount('');
      setShowAmountInput(false);
      sessionStorage.removeItem('currentPaymentAmount');
      sessionStorage.removeItem('currentSIPId');
    }
  };

  // Handle Create Fixed SIP for Admin
  const handleCreateFixedSIP = () => {
    if (userType === 'admin') {
      // router.push('/swarn_yojana_22k');
      router.push('/admin_sip_plans');
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

  const verifyPayment = async (paymentResponse) => {
    try {
      const verifyResponse = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: paymentResponse.razorpay_order_id,
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_signature: paymentResponse.razorpay_signature,
          sipId: selectedSIPId,
          amount: paymentResponse.amount / 100,
        }),
      });

      const verifyData = await verifyResponse.json();
      
      if (verifyResponse.ok) {
        alert('Payment successful! Your SIP payment has been processed.');
        
        // Clear the stored amount after successful payment
        const newAmountPayingValues = { ...amountPayingValues };
        delete newAmountPayingValues[selectedSIPId];
        setAmountPayingValues(newAmountPayingValues);
        sessionStorage.setItem('amountPayingValues', JSON.stringify(newAmountPayingValues));
        
        // Refresh data
        if (userType === 'admin') {
          fetchAllSIPs();
        } else {
          fetchUserSIPs();
        }
      } else {
        alert(`Payment verification failed: ${verifyData.error}`);
      }
    } catch (error) {
      alert('Payment verification failed. Please contact support.');
    }
  };

  // Enhanced payment method handler with sessionStorage integration
  const handlePaymentMethod = async (method) => {
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
          isFlexible: !selectedPlan.isFixed,
          amountInPaise: amount 
        });

        // Store payment details in sessionStorage for Razorpay
        sessionStorage.setItem('razorpayAmount', amount.toString());
        sessionStorage.setItem('razorpaySIPId', selectedSIPId);
        sessionStorage.setItem('razorpayPlanType', selectedPlan.type);
        sessionStorage.setItem('razorpayMetalType', selectedPlan.metalType || '22KT Gold');

        const razorpayAmount = amount; // Convert to paise for Razorpay
        
        console.log('💰 Razorpay amount in paise:', razorpayAmount);

        console.log('📞 Calling Razorpay API...');
        const response = await fetch('/api/razorpay', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: razorpayAmount,
            metalType: selectedPlan.metalType || '22KT Gold',
            sipMonths: selectedPlan.totalMonths || 12,
            sipType: selectedPlan.isFixed ? 'fixed' : 'flexible',
            sipId: selectedSIPId,
            isManualAmount: showAmountInput && manualAmount,
            manualAmount: showAmountInput && manualAmount ? manualAmount : 'default'
          }),
        });

        console.log('📋 API Response status:', response.status);
        
        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('text/html')) {
            throw new Error('API route not found. Please check the server configuration.');
          }
          
          const errorData = await response.json();
          console.error('❌ API Error response:', errorData);
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const orderData = await response.json();
        console.log('✅ Order created:', orderData);

        await loadRazorpayScript();
        
        // Enhanced Razorpay options with prefill from sessionStorage
        const storedAmount = sessionStorage.getItem('currentPaymentAmount');
        const options = {
          key: 'rzp_test_aOTAZ3JhbITtOK',
          amount: orderData.amount,
          currency: orderData.currency || 'INR',
          name: 'Gold SIP Investment',
          description: `${selectedPlan.metalType} ${selectedPlan.type} Payment - ${selectedPlan.name}`,
          order_id: orderData.id,
          handler: async function (response) {
            console.log('✅ Payment successful:', response);
            
            // Clear session storage after successful payment
            sessionStorage.removeItem('currentPaymentAmount');
            sessionStorage.removeItem('currentSIPId');
            sessionStorage.removeItem('razorpayAmount');
            sessionStorage.removeItem('razorpaySIPId');
            sessionStorage.removeItem('razorpayPlanType');
            sessionStorage.removeItem('razorpayMetalType');
            
            await verifyPayment(response);
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
            manualAmount: storedAmount || (showAmountInput && manualAmount ? manualAmount : 'default'),
            storedAmount: storedAmount || 'none'
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

        const razorpay = new window.Razorpay(options);
        
        razorpay.on('payment.failed', function (response) {
          console.error('❌ Payment failed:', response.error);
          alert(`Payment failed: ${response.error.description}. Please try again.`);
        });

        razorpay.open();
        
      } catch (error) {
        console.error('❌ Payment initialization error:', error);
        alert(`Failed to initialize payment: ${error.message}`);
      }
    } else if (method === 'Offline') {
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
    }
  };

  const createFlexibleSIP = async () => {
    try {
      setCreateSIPLoading(true);
      const token = sessionStorage.getItem('authToken');
      
      if (!token) {
        alert('Please login again');
        return;
      }

      const enumMetalType = getEnumMetalType(metalType);

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
        // Refresh data based on user type
        if (userType === 'admin') {
          await fetchAllSIPs();
        } else {
          await fetchUserSIPs();
        }
        setShowCreateFlexibleSIPDialog(false);
        setMetalType('gold22K');
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
    if (userType === 'admin') {
      fetchAllSIPs();
    } else {
      fetchUserSIPs();
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white min-h-screen flex flex-col relative">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100">
        <button className="mr-4" onClick={() => router.push('/savings_plan')}>
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center mr-10">
          SIP Holdings
        </h1>
      </div>

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

      {/* Customer Info Banner */}
      {userType === 'customer' && activeTab === 'All' && (
        <div className="px-4 py-3 bg-blue-50 border-b border-blue-200">
          <div className="flex items-center justify-center space-x-2">
            <Users className="w-4 h-4 text-blue-600" />
            <p className="text-sm text-blue-700 font-medium">
              Your Opted Fixed SIPs
            </p>
          </div>
          <p className="text-xs text-blue-600 text-center mt-1">
            Showing only fixed SIPs you have opted for
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
            displayPlans.map((plan) => (
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
                        plan.status === 'ACTIVE' ? 'bg-green-500' : plan.status === 'PAUSED' ? 'bg-yellow-500' : 'bg-gray-500'
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

                {/* Pay Button - Show for customers in both tabs, hide for admin */}
                {(userType !== 'admin' || activeTab === 'New SIP') && (
                  <div className="flex justify-end pt-3">
                    <button
                      onClick={(e) => handlePay(plan.id, plan, e)}
                      className="bg-white text-[#50C2C9] px-6 py-2 rounded-md font-semibold hover:bg-opacity-90 transition-colors shadow-md"
                    >
                      Pay
                    </button>
                  </div>
                )}
              </div>
            ))
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

          {/* Action Buttons Section */}
          <div className="flex justify-center mt-6 pb-8 space-x-4">
            {/* Create Flexible SIP Button - Show for Flexible tab */}
            {activeTab === 'New SIP' && (
              <button
                onClick={() => {
                  if (userType === 'customer') {
                    setShowCreateFlexibleSIPDialog(true);
                  } else {
                    // Admin can also create flexible SIPs if needed
                    setShowCreateFlexibleSIPDialog(true);
                  }
                }}
                className="bg-[#50C2C9] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-[#45b1b9] transition-all flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Flexible SIP</span>
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

            {/* Refresh Button for Both Tabs */}
            <button
              onClick={handleRefresh}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-gray-700 transition-all flex items-center space-x-2"
            >
              <Users className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
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
                    className="border-2 border-[#50C2C9] bg-blue-50 rounded-lg p-4 cursor-pointer hover:bg-blue-100 transition-colors"
                    onClick={() => setShowAmountInput(true)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {selectedPlan?.type === 'Flexible SIP' ? 'Suggested Amount' : 'Default Amount'}
                        </p>
                        <p className="text-lg font-bold text-[#50C2C9]">{selectedPlan?.investMin}</p>
                        <p className="text-xs text-gray-500">
                          {selectedPlan?.type === 'Flexible SIP' 
                            ? 'Click to enter custom amount' 
                            : 'Monthly installment amount'
                          }
                        </p>
                      </div>
                      <Edit className="w-4 h-4 text-[#50C2C9]" />
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
                onClick={() => handlePaymentMethod('Online')}
                disabled={showAmountInput && !manualAmount}
                className="w-full bg-[#50C2C9] text-white py-4 rounded-lg font-semibold hover:bg-[#45b1b9] transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>Pay {showAmountInput && manualAmount ? manualAmount : selectedPlan?.investMin} Online</span>
              </button>

              <button
                onClick={() => handlePaymentMethod('Offline')}
                className="w-full bg-gray-100 text-gray-800 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <span>Pay Offline</span>
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
                {showAmountInput && manualAmount && selectedPlan?.type === 'Flexible SIP' && (
                  <div className="flex justify-between">
                    <span>Payment Type:</span>
                    <span className="font-medium text-green-600">Custom Amount</span>
                  </div>
                )}
              </div>
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
            </div>

            {/* SIP Configuration */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Metal Type
                </label>
                <select 
                  value={getDisplayMetalType(metalType)}
                  onChange={(e) => setMetalType(getEnumMetalType(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#50C2C9] focus:border-transparent text-black"
                >
                  <option value="22KT Gold">22KT Gold</option>
                  <option value="24KT Gold">24KT Gold</option>
                  <option value="Silver">Silver</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Months)
                </label>
                <select 
                  value={totalMonths}
                  onChange={(e) => setTotalMonths(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#50C2C9] focus:border-transparent text-black"
                >
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                  <option value={24}>24 Months</option>
                  <option value={36}>36 Months</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Amount
                </label>
                <select 
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(parseInt(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#50C2C9] focus:border-transparent text-black"
                >
                  <option value={100000}>₹1,00,000</option>
                  <option value={500000}>₹5,00,000</option>
                  <option value={1000000}>₹10,00,000</option>
                  <option value={1500000}>₹15,00,000</option>
                  <option value={2000000}>₹20,00,000</option>
                </select>
              </div>
            </div>

            {/* Create Button */}
            <button
              onClick={createFlexibleSIP}
              disabled={createSIPLoading}
              className="w-full bg-[#50C2C9] text-white py-4 rounded-lg font-semibold hover:bg-[#50C2C9] transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createSIPLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating SIP...</span>
                </>
              ) : (
                <span>Create Flexible SIP</span>
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              You can add funds to your flexible SIP anytime
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