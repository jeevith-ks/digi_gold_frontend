"use client";

import React, { useState, useEffect } from 'react';
import {
    ChevronLeft, X, Calendar, Clock, DollarSign, Edit, Users, Plus, Check, AlertCircle, Lock,
    Home, PiggyBank, BadgeIndianRupee, History, User, ArrowRight, Shield, Coins, RefreshCw, CheckCircle // New icons
} from 'lucide-react';
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

    // Notification states
    const [notifications, setNotifications] = useState([]);
    const [notificationId, setNotificationId] = useState(0);

    // Notification function
    const showNotification = (message, type = 'success') => {
        const id = notificationId;
        setNotificationId(prev => prev + 1);

        const newNotification = {
            id,
            message,
            type // 'success' or 'error'
        };

        setNotifications(prev => [...prev, newNotification]);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    // Function to send transaction data to API
    const sendTransactionData = async (transactionData) => {
        try {

            const token = sessionStorage.getItem('authToken');

            // Prepare data - send null for null values
            const dataToSend = {};
            Object.keys(transactionData).forEach(key => {
                dataToSend[key] = transactionData[key] === null ? null : transactionData[key];
            });

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
                return { success: true, data: result };
            } else {
                let errorMsg = 'Failed to record transaction';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch (e) { }

                showNotification(`Transaction Error: ${errorMsg}`, 'error');
                return { success: false, error: errorMsg };
            }
        } catch (err) {
            console.error('Send transaction error:', err);
            showNotification('Network error: Could not record transaction', 'error');
            return { success: false, error: err.message };
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

                // Clear session storage after successful payment
                clearPaymentDataFromSession();

                // Clear the stored amount for this SIP
                const newAmountPayingValues = { ...amountPayingValues };
                delete newAmountPayingValues[selectedSIPId];
                setAmountPayingValues(newAmountPayingValues);
                sessionStorage.setItem('amountPayingValues', JSON.stringify(newAmountPayingValues));

                // Show success message
                showNotification('Payment successful! Your SIP has been updated.', 'success');

                // Refresh the SIP data
                if (userType === 'admin') {
                    await fetchAllSIPs();
                } else {
                    await fetchUserSIPs();
                }

                return { success: true, data: verifyData };
            } else {

                showNotification(`Payment verification failed: ${verifyData.error || verifyData.message}`, 'error');
                return { success: false, error: verifyData.error || verifyData.message };
            }
        } catch (error) {

            showNotification('Payment verification failed. Please contact support.', 'error');
            return { success: false, error: error.message };
        } finally {
            setProcessingPayment(false);
        }
    };

    // Function to handle offline payment submission
    const handleOfflinePaymentSubmission = async (offlinePaymentData) => {
        try {

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

            return { success: false, error: error.message };
        }
    };

    // Get user data from sessionStorage and fetch initial data
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const storedUserType = sessionStorage.getItem('userType');
            const storedUsername = sessionStorage.getItem('username');
            const storedToken = sessionStorage.getItem('authToken');

            if (storedUserType) {
                setUserType(storedUserType);
            }
            if (storedUsername) {
                // setUsername(storedUsername);
            }

            // Check for stored market status - Load from sessionStorage
            const storedMarketStatus = sessionStorage.getItem('marketStatus');
            if (storedMarketStatus) {

                setMarketStatus(storedMarketStatus);
            } else {
                // Initialize with 'open' if not stored yet

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

            setError('Network error while fetching SIP data');
        } finally {
            setLoading(false);
        }
    };

    // Fetch latest prices from API
    const fetchLatestPrices = async (token) => {
        try {

            const response = await fetch('http://localhost:5000/api/price/', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Process latest prices if needed locally
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Latest prices fetch failed:', errorData.message || response.status);
            }
        } catch (error) {
            console.error('Network error fetching latest prices:', error);
        }
    };

    // Fetch holdings data for customers
    const fetchHoldings = async (token) => {
        try {
            const response = await fetch('http://localhost:5000/api/holdings', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // Process holdings data if needed
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error('Holdings fetch failed:', errorData.message || response.status);
            }
        } catch (error) {
            console.error('Network error fetching holdings:', error);
        }
    };

    // NEW FUNCTION: Fetch available fixed SIP plans for customers
    const fetchAvailableFixedSIPs = async () => {
        try {
            // Check time restriction before fetching (only for Fixed SIP)
            if (!isWithinAllowedTime) {
                const errorMsg = `Fixed SIP plans can only be chosen between 10:00 AM and 6:00 PM. Current time: ${formatTime(currentTime)}`;
                setError(errorMsg);
                showNotification(errorMsg, 'error');
                return;
            }

            // Check market status before fetching
            if (marketStatus === 'closed') {
                const errorMsg = `Market is currently closed. SIP operations are temporarily disabled.`;
                setError(errorMsg);
                showNotification(errorMsg, 'error');
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

                // Transform the data for display
                const transformedPlans = data
                    .filter(plan => {
                        const metalType = plan.metal_type ? String(plan.metal_type).trim() : '';
                        return metalType.toLowerCase() === 'money';
                    })
                    .map((plan, index) => ({
                        id: plan._id || plan.id,
                        name: plan.Yojna_name || `Fixed SIP Plan ${index + 1}`,
                        description: plan.description || 'Gold Investment Plan',
                        monthlyAmount: plan.range_amount || 0,
                        totalMonths: plan.total_months || 12,
                        metalType: getDisplayMetalType(plan.metal_type) || 'Money',
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
                showNotification(`Cannot choose Fixed SIP plan. Fixed SIP plans can only be chosen between 10:00 AM and 6:00 PM. Current time: ${formatTime(currentTime)}`, 'error');
                return;
            }

            // Check market status before proceeding
            if (marketStatus === 'closed') {
                showNotification(`Market is currently closed. SIP operations are temporarily disabled.`, 'error');
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
                    showNotification(data.message || 'Fixed SIP chosen successfully!', 'success');

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

        } catch (err) {

        }
    };

    // Transform fixed SIPs data for admin view
    const transformFixedSIPsData = (fixedSips, isAdmin = false) => {
        const fixedPlans = [];

        if (fixedSips && fixedSips.length > 0) {
            fixedSips.forEach((fixedSip, index) => {
                const metalType = fixedSip.sipPlanAdmin?.metal_type;
                if (metalType !== 'Money') return;

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
                    metalType: getDisplayMetalType(metalType) || 'Money',
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
                const metalType = flexibleSip.metal_type;
                if (metalType !== 'Money') return;

                const totalAmount = flexibleSip.total_amount_paid ? parseFloat(flexibleSip.total_amount_paid) : 0;
                const displayMetalType = getDisplayMetalType(metalType);

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

        const plans = [];

        // Process fixed SIPs (opted ones)
        if (apiData.sipsFixed && apiData.sipsFixed.length > 0) {
            apiData.sipsFixed.forEach((fixedSip, index) => {
                const metalType = fixedSip.sipPlanAdmin?.metal_type;
                if (metalType !== 'Money') return;

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
                    metalType: getDisplayMetalType(metalType) || 'Money',
                    totalMonths: fixedSip.sipPlanAdmin?.total_months || 12
                });
            });
        }

        // Process flexible SIPs - FIXED: Always use the actual metal type from backend
        if (apiData.sipsFlexible && apiData.sipsFlexible.length > 0) {
            apiData.sipsFlexible.forEach((flexibleSip, index) => {
                const metalType = flexibleSip.metal_type;
                if (metalType !== 'Money') return;

                const totalAmount = flexibleSip.total_amount_paid ? parseFloat(flexibleSip.total_amount_paid) : 0;
                // CRITICAL FIX: Get the metal type from the flexible SIP record
                const displayMetalType = getDisplayMetalType(metalType);

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

            return 'N/A';
        }
    };

    // UPDATED: Improved getDisplayMetalType function
    const getDisplayMetalType = (metalType) => {
        if (!metalType) return 'Unknown Metal';

        const metalTypeStr = String(metalType).toLowerCase().trim();

        switch (metalTypeStr) {
            case 'money':
                return 'Money';
            default:
                // Return the original value if it's not one of our known types
                return metalType;
        }
    };

    const getEnumMetalType = (displayType) => {
        switch (displayType) {
            case 'Money': return 'Money';
            default: return 'Money'
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

    };

    const handlePay = (id, plan, e) => {
        e.stopPropagation();

        // Check if SIP is completed
        if (plan.status === 'COMPLETED') {
            showNotification('This SIP plan has been completed. Please check your holdings for details.', 'error');
            return;
        }

        // FIXED: Check time restriction only for Fixed SIP, not for Flexible SIP
        const isFixedSIP = plan.isFixed || plan.type === 'Fixed SIP';
        if (isFixedSIP && !isWithinAllowedTime) {
            showNotification(`Cannot make payment for Fixed SIP. Fixed SIP payments can only be made between 10:00 AM and 6:00 PM. Current time: ${formatTime(currentTime)}`, 'error');
            return;
        }

        // Check market status before opening payment dialog
        if (marketStatus === 'closed') {
            showNotification(`Market is currently closed. Trading operations, including SIP payments, are temporarily disabled.`, 'error');
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
                showNotification(`Cannot create Fixed SIP plan. Fixed SIP plans can only be chosen between 10:00 AM and 6:00 PM. Current time: ${formatTime(currentTime)}`, 'error');
                return;
            }

            // Check market status before proceeding
            if (marketStatus === 'closed') {
                showNotification(`Market is currently closed. Trading operations, including SIP creation, are temporarily disabled.`, 'error');
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

        // Remove ₹ symbol, commas, and any whitespace
        const cleanedAmount = amountString.replace(/[₹,]/g, '').trim();

        // Parse as float
        const amount = parseFloat(cleanedAmount);

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
            showNotification(`Cannot process payment for Fixed SIP. Fixed SIP payments can only be made between 10:00 AM and 6:00 PM. Current time: ${formatTime(currentTime)}`, 'error');
            setShowPaymentDialog(false);
            return;
        }

        // Check market status before proceeding with payment
        if (marketStatus === 'closed') {
            showNotification(`Market is currently closed. Trading operations, including SIP payments, are temporarily disabled.`, 'error');
            setShowPaymentDialog(false);
            return;
        }

        // Save payment data to session storage
        savePaymentDataToSession();

        setShowPaymentDialog(false);

        if (!selectedPlan) {
            showNotification('No plan selected. Please try again.', 'error');
            return;
        }

        if (method === 'Online') {
            try {
                let amount;

                // Determine the amount to use
                if (showAmountInput && manualAmount) {
                    amount = parseAmount(manualAmount);

                } else {
                    amount = selectedPlan.monthlyAmount || parseAmount(selectedPlan.investMin);

                }

                // Enhanced validation
                if (isNaN(amount) || amount <= 0) {
                    throw new Error(`Invalid amount: Please enter a valid payment amount`);
                }

                if (amount < 1) {
                    throw new Error('Minimum payment amount is ₹1');
                }

                // Store payment details in sessionStorage for Razorpay
                sessionStorage.setItem('razorpayAmount', amount.toString());
                sessionStorage.setItem('razorpaySIPId', selectedSIPId);
                sessionStorage.setItem('razorpayPlanType', selectedPlan.type);
                sessionStorage.setItem('razorpayMetalType', selectedPlan.metalType || '22KT Gold');
                sessionStorage.setItem('razorpayIsFixed', selectedPlan.isFixed ? 'true' : 'false');

                const razorpayAmount = Math.round(amount * 100); // Convert to paise for Razorpay

                // Get auth token from session storage
                const token = sessionStorage.getItem('authToken');
                if (!token) {
                    throw new Error('Authentication required. Please login again.');
                }



                const response = await fetch('http://localhost:5000/api/razorpay/create-order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        amount: amount, // Sending in Rupees, backend likely handles * conversion
                        metalType: selectedPlan.metalType || 'Money',
                        sipMonths: selectedPlan.totalMonths || 12,
                        sipType: selectedPlan.isFixed ? 'fixed' : 'flexible',
                        sipId: selectedSIPId
                    }),
                });


                // Read the response text once
                const responseText = await response.text();

                let orderData;
                try {
                    orderData = JSON.parse(responseText);
                } catch (parseError) {

                    throw new Error(`Invalid response from server: ${responseText.substring(0, 100)}`);
                }

                if (!response.ok) {

                    throw new Error(orderData.error || orderData.message || `HTTP error! status: ${response.status}`);
                }

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

                        // Call verifyPayment with the payment response
                        const result = await verifyPayment(paymentResponse);

                        if (result.success) {

                        } else {

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
                        ondismiss: function () {

                            showNotification('Payment was cancelled. You can try again.', 'error');
                        }
                    }
                };

                const razorpay = new window.Razorpay(options);

                razorpay.on('payment.failed', function (response) {

                    showNotification(`Payment failed: ${response.error.description}. Please try again.`, 'error');
                });

                razorpay.open();

            } catch (error) {


                // Show more helpful error message
                let errorMessage = error.message;
                if (error.message.includes('Failed to create payment order')) {
                    errorMessage = 'Payment gateway error. Please check your internet connection and try again.';
                } else if (error.message.includes('Invalid amount')) {
                    errorMessage = 'Please enter a valid payment amount (minimum ₹1)';
                }

                showNotification(`Payment failed: ${errorMessage}`, 'error');
            }
        } else if (method === 'Offline') {
            // FIXED: Check time restriction only for Fixed SIP, not for Flexible SIP
            const isFixedSIP = selectedPlan?.isFixed || selectedPlan?.type === 'Fixed SIP';
            if (isFixedSIP && !isWithinAllowedTime) {
                showNotification(`Cannot process payment for Fixed SIP. Fixed SIP payments can only be made between 10:00 AM and 6:00 PM. Current time: ${formatTime(currentTime)}`, 'error');
                return;
            }

            // Check market status for offline payment
            if (marketStatus === 'closed') {
                showNotification(`Market is currently closed. Trading operations, including offline SIP payments, are temporarily disabled.`, 'error');
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

            sessionStorage.setItem('offlinePaymentData', JSON.stringify(offlineData));

            // Fix: Save the actual plan SIP type so payoffline page reads it correctly
            const sipTypeForOffline = selectedPlan.isFixed ? 'fixed' : 'flexible';
            sessionStorage.setItem('sipType', sipTypeForOffline);

            // Ensure sipId keys are set so payoffline can resolve the amount
            sessionStorage.setItem('currentSIPId', String(selectedSIPId));
            sessionStorage.setItem('planId', String(selectedSIPId));

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
                showNotification(`Market is currently closed. Trading operations, including SIP creation, are temporarily disabled.`, 'error');
                return;
            }

            setCreateSIPLoading(true);
            const token = sessionStorage.getItem('authToken');

            if (!token) {
                showNotification('Please login again', 'error');
                return;
            }

            const enumMetalType = getEnumMetalType(getDisplayMetalType(metalType)); // FIXED


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
                showNotification('Flexible SIP created successfully!', 'success');
            } else {
                showNotification(`Error: ${responseData.message || 'Failed to create flexible SIP'}`, 'error');
            }
        } catch (err) {
            showNotification('Network error while creating flexible SIP', 'error');
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
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
                <div
                    className="absolute inset-0"
                    onClick={() => !loadingFixedSIPs && !choosingSIP && setShowFixedSIPsList(false)}
                ></div>

                <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] p-8 flex flex-col max-h-[85vh] animate-in slide-in-from-bottom duration-300">
                    <div className="flex justify-between items-center mb-6 flex-shrink-0">
                        <div>
                            <h2 className="text-xl font-black text-slate-800">Fixed Plans</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Select a plan to invest</p>
                        </div>
                        <button
                            onClick={() => setShowFixedSIPsList(false)}
                            className="p-2 bg-slate-50 rounded-full hover:bg-slate-100 transition-colors"
                            disabled={loadingFixedSIPs || choosingSIP}
                        >
                            <X className="w-5 h-5 text-slate-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pb-4 space-y-4 pr-1">
                        {/* Alerts */}
                        {!isWithinAllowedTime && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-[1.5rem] flex items-start gap-3">
                                <div className="p-2 bg-rose-100 rounded-full">
                                    <AlertCircle className="w-4 h-4 text-rose-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-rose-700 uppercase tracking-wide">Restricted Hours</p>
                                    <p className="text-[10px] text-rose-600 mt-1 leading-relaxed font-medium">
                                        Fixed SIP selection available 10:00 AM - 6:00 PM.<br />Current: {formatTime(currentTime)}
                                    </p>
                                </div>
                            </div>
                        )}

                        {marketStatus === 'closed' && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-[1.5rem] flex items-start gap-3">
                                <div className="p-2 bg-rose-100 rounded-full">
                                    <Lock className="w-4 h-4 text-rose-500" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-rose-700 uppercase tracking-wide">Market Closed</p>
                                    <p className="text-[10px] text-rose-600 mt-1 leading-relaxed font-medium">
                                        Operations temporarily disabled.
                                    </p>
                                </div>
                            </div>
                        )}

                        {loadingFixedSIPs ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <RefreshCw className="w-8 h-8 text-[#50C2C9] animate-spin mb-4" />
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Plans...</p>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-3">
                                    <X className="w-6 h-6 text-rose-500" />
                                </div>
                                <p className="text-rose-500 font-bold text-xs mb-3">{error}</p>
                                <button
                                    onClick={fetchAvailableFixedSIPs}
                                    className="px-4 py-2 bg-[#50C2C9] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-[#50C2C9]/20"
                                >
                                    Retry
                                </button>
                            </div>
                        ) : availableFixedSIPs.length > 0 ? (
                            <div className="space-y-3">
                                {availableFixedSIPs.map((plan) => (
                                    <div
                                        key={plan.id}
                                        onClick={() => isWithinAllowedTime && marketStatus === 'open' && plan.isActive && handleChooseFixedSIP(plan.id)}
                                        className={`relative overflow-hidden rounded-[1.5rem] p-5 border-2 transition-all cursor-pointer group ${selectedFixedSIPId === plan.id
                                            ? 'border-[#50C2C9] bg-slate-50'
                                            : 'border-slate-100 bg-white hover:border-slate-200'
                                            } ${(!isWithinAllowedTime || marketStatus === 'closed' || !plan.isActive) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                    >
                                        {selectedFixedSIPId === plan.id && (
                                            <div className="absolute top-0 right-0 bg-[#50C2C9] p-1.5 rounded-bl-xl z-10">
                                                <Check className="w-3 h-3 text-white" />
                                            </div>
                                        )}

                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <span className="px-2 py-1 bg-slate-100 rounded-md text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                                    {plan.metalType}
                                                </span>
                                                <h3 className="font-black text-slate-800 text-lg mt-2 leading-none">{plan.name}</h3>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Invest</p>
                                                <p className="text-base font-black text-[#50C2C9]">₹{formatCurrency(plan.monthlyAmount)}</p>
                                                <p className="text-[9px] text-slate-400 font-bold">/ month</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100">
                                            <div className="bg-slate-50 rounded-xl p-2 text-center">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">Duration</p>
                                                <p className="text-xs font-black text-slate-700">{plan.totalMonths} Mo.</p>
                                            </div>
                                            <div className={`rounded-xl p-2 text-center ${plan.isActive ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                                <p className="text-[9px] font-bold uppercase opacity-60">Status</p>
                                                <p className={`text-xs font-black ${plan.isActive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {plan.isActive ? 'Active' : 'Inactive'}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();

                                                handleChooseFixedSIP(plan.id);
                                            }}
                                            disabled={!isWithinAllowedTime || marketStatus === 'closed' || !plan.isActive}
                                            className="w-full mt-4 py-3 bg-[#50C2C9] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#50C2C9]/20 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none hover:bg-[#45aeb5] transition-all flex items-center justify-center gap-2"
                                        >
                                            {choosingSIP && selectedFixedSIPId === plan.id ? (
                                                <>
                                                    <RefreshCw className="w-3 h-3 animate-spin" /> Processing...
                                                </>
                                            ) : (
                                                'Select Plan'
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-10 bg-slate-50 rounded-[2rem]">
                                <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                                <p className="text-xs font-bold text-slate-400 text-center">No Fixed Plans Available</p>
                            </div>
                        )}
                    </div>
                </div>
            </div >
        );
    };

    // Display saved payment data from session storage
    const displaySavedPaymentData = () => {
        const paymentData = JSON.parse(sessionStorage.getItem('currentPaymentData') || 'null');
        const summaryData = JSON.parse(sessionStorage.getItem('paymentSummaryData') || 'null');

        if (!paymentData && !summaryData) return null;

        return (
            <div className="mt-6 p-5 bg-indigo-50/50 border border-indigo-100 rounded-[2rem] backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-indigo-100 rounded-full">
                        <History className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <h3 className="text-xs font-black text-indigo-900 uppercase tracking-widest">Last Session</h3>
                </div>

                <div className="space-y-3 pl-2 border-l-2 border-indigo-100 ml-2">
                    {paymentData && (
                        <>
                            <div className="pl-3">
                                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Plan</p>
                                <p className="text-sm font-black text-slate-700">{paymentData.planName}</p>
                            </div>
                            <div className="pl-3">
                                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Amount</p>
                                <p className="text-sm font-black text-slate-700">₹{paymentData.amount}</p>
                            </div>
                            <div className="pl-3">
                                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Time</p>
                                <p className="text-[10px] font-bold text-slate-500">
                                    {new Date(paymentData.paymentTime).toLocaleString()}
                                </p>
                            </div>
                        </>
                    )}
                    {summaryData && (
                        <div className="pl-3">
                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">Status</p>
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${paymentData?.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
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


        }, [sipPlans]);

        return null;
    };

    return (
        <div className="w-full max-w-md mx-auto bg-[#F8FAFC] min-h-screen pb-24 font-sans relative">
            <DebugInfo />

            {/* Notification Toast Container */}
            <div className="fixed top-4 right-4 z-[200] space-y-3 max-w-sm">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`transform transition-all duration-500 ease-out animate-in slide-in-from-right-full ${notification.type === 'success'
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                            : 'bg-gradient-to-r from-rose-500 to-rose-600'
                            } text-white rounded-2xl shadow-2xl p-4 flex items-start gap-3 min-w-[300px] backdrop-blur-lg border border-white/20`}
                        style={{
                            animation: 'slideInRight 0.5s ease-out, fadeOut 0.5s ease-in 4.5s'
                        }}
                    >
                        <div className={`p-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-400/30' : 'bg-rose-400/30'
                            }`}>
                            {notification.type === 'success' ? (
                                <CheckCircle className="w-5 h-5 text-white" />
                            ) : (
                                <AlertCircle className="w-5 h-5 text-white" />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs font-black uppercase tracking-wider mb-1">
                                {notification.type === 'success' ? 'Success' : 'Error'}
                            </p>
                            <p className="text-sm font-medium leading-relaxed">
                                {notification.message}
                            </p>
                        </div>
                        <button
                            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
                            className="p-1 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-4 h-4 text-white" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Header */}
            <header className="bg-white px-6 pt-8 pb-6 rounded-b-[2.5rem] shadow-sm sticky top-0 z-20">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => router.push('/Home')}
                        className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                    >
                        <ChevronLeft className="text-slate-600" size={20} />
                    </button>
                    <div className="text-center">
                        <span className="text-[10px] font-black text-[#50C2C9] uppercase tracking-widest block">Portfolio</span>
                        <h1 className="text-xl font-black text-slate-800 tracking-tight">SIP Money Holdings</h1>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-bold text-slate-600">{formatTime(currentTime)}</span>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="mt-6 bg-slate-100 p-1 rounded-2xl flex">
                    <button
                        onClick={() => handleTabChange('All')}
                        className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'All'
                            ? 'bg-white text-[#50C2C9] shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Fixed Plans
                    </button>
                    <button
                        onClick={() => handleTabChange('New SIP')}
                        className={`flex-1 py-3 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${activeTab === 'New SIP'
                            ? 'bg-white text-[#50C2C9] shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        Flexible Plans
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="px-6 py-6 space-y-5">

                {/* Alerts & Banners */}
                {!isWithinAllowedTime && userType === 'customer' && activeTab === 'All' && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-[1.5rem] flex items-start gap-3">
                        <div className="p-2 bg-rose-100 rounded-full">
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-rose-700 uppercase tracking-wide">Time Restricted</p>
                            <p className="text-[10px] text-rose-600 mt-1 leading-relaxed font-medium">
                                Fixed SIP payments allowable 10:00 AM - 6:00 PM.<br />
                                Current: {formatTime(currentTime)}
                            </p>
                        </div>
                    </div>
                )}

                {marketStatus === 'closed' && userType === 'customer' && (
                    <div className="p-4 bg-rose-50 border border-rose-100 rounded-[1.5rem] flex items-start gap-3">
                        <div className="p-2 bg-rose-100 rounded-full">
                            <Lock className="w-4 h-4 text-rose-500" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-rose-700 uppercase tracking-wide">Market Closed</p>
                            <p className="text-[10px] text-rose-600 mt-1 leading-relaxed font-medium">
                                Trading operations are temporarily disabled.
                            </p>
                        </div>
                    </div>
                )}

                {/* SIP Plans List */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <RefreshCw className="w-8 h-8 text-[#50C2C9] animate-spin mb-4" />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Holdings...</p>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mb-4">
                            <X className="w-8 h-8 text-rose-500" />
                        </div>
                        <p className="text-rose-500 font-bold mb-4">{error}</p>
                        <button onClick={handleRefresh} className="px-6 py-3 bg-[#50C2C9] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-[#50C2C9]/20">
                            Retry
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {displayPlans.length > 0 ? (
                            displayPlans.map((plan) => {
                                const isFixedSIP = plan.isFixed || plan.type === 'Fixed SIP';
                                const shouldDisable = (isFixedSIP && !isWithinAllowedTime) || marketStatus === 'closed';

                                return (
                                    <div
                                        key={plan.id}
                                        className={`relative bg-gradient-to-br ${plan.color === 'bg-[#50C2C9]' ? 'from-[#50C2C9] to-[#45a0a6]' : 'from-slate-800 to-slate-900'} rounded-[2rem] p-6 text-white overflow-hidden shadow-xl shadow-slate-200/50 group`}
                                    >
                                        {/* Decorative elements */}
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-8 -mb-8"></div>

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md rounded-md text-[9px] font-bold uppercase tracking-wider">
                                                            {plan.type}
                                                        </span>
                                                        {plan.status && (
                                                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${plan.status === 'ACTIVE' ? 'bg-emerald-400 text-emerald-900' :
                                                                plan.status === 'PAUSED' ? 'bg-amber-400 text-amber-900' :
                                                                    'bg-slate-200 text-slate-800'
                                                                }`}>
                                                                {plan.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h3 className="text-lg font-black leading-tight mb-1">{plan.name}</h3>
                                                    <p className="text-[10px] opacity-80 font-medium">ID: #{plan.id.substring(0, 8)}</p>
                                                </div>
                                                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                                    {plan.metalType?.toLowerCase().includes('gold') ? <BadgeIndianRupee className="text-amber-300" /> : <Coins className="text-slate-300" />}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 bg-black/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5">
                                                <div>
                                                    <p className="text-[9px] opacity-70 uppercase font-bold mb-1">Due Date</p>
                                                    <div className="flex items-center gap-1.5 font-bold text-sm">
                                                        <Calendar size={12} className="opacity-70" />
                                                        {getDisplayDate(plan)}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] opacity-70 uppercase font-bold mb-1">Progress</p>
                                                    <div className="flex items-center gap-1.5 font-bold text-sm">
                                                        <Clock size={12} className="opacity-70" />
                                                        {plan.monthsPaid}/{plan.totalMonths || 'N/A'}
                                                    </div>
                                                </div>

                                                <div className="col-span-2 pt-2 border-t border-white/10 flex justify-between items-center">
                                                    <div>
                                                        <p className="text-[9px] opacity-70 uppercase font-bold mb-1">Total Invested</p>
                                                        <p className="font-black text-lg">{plan.totalAmount}</p>
                                                    </div>
                                                    <div className="bg-white/20 px-3 py-1 rounded-lg">
                                                        <p className="text-[9px] opacity-100 uppercase font-bold text-center">MONEY</p>
                                                        {/* <p className="font-bold text-xs text-center">{plan.metalType}</p> */}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Payment Input Section */}
                                            <div className="mt-4 pt-4 border-t border-white/10">
                                                <div className="flex justify-between items-center gap-4">
                                                    <div className="flex-1">
                                                        <label className="text-[9px] opacity-70 uppercase font-bold block mb-1">Paying Amount</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 text-xs">₹</span>
                                                            <input
                                                                type="text"
                                                                value={amountPayingValues[plan.id] || ''}
                                                                onChange={(e) => handleAmountPayingChange(plan.id, e.target.value)}
                                                                placeholder="0"
                                                                className="w-full bg-white/10 border border-white/20 rounded-xl py-2 pl-6 pr-3 text-sm font-bold text-white placeholder-white/30 focus:outline-none focus:bg-white/20 transition-all"
                                                                disabled={plan.status === 'COMPLETED'}
                                                            />
                                                        </div>
                                                    </div>

                                                    {userType === 'customer' && (
                                                        <div className="mt-4">
                                                            {(plan.status === 'COMPLETED' || (plan.monthsPaid >= plan.totalMonths && plan.totalMonths > 0)) ? (
                                                                <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-100 rounded-xl font-bold text-xs flex items-center gap-2">
                                                                    <Check size={14} /> Completed
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => handlePay(plan.id, plan, e)}
                                                                    disabled={shouldDisable}
                                                                    className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center gap-2 ${shouldDisable
                                                                        ? 'bg-slate-500/50 text-slate-300 cursor-not-allowed'
                                                                        : 'bg-white text-[#50C2C9] hover:bg-slate-50 shadow-black/20'
                                                                        }`}
                                                                >
                                                                    {marketStatus === 'closed' ? 'Closed' : isFixedSIP && !isWithinAllowedTime ? 'Timed Out' : 'Pay Now'}
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <BadgeIndianRupee className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-black text-slate-700">No Plans Found</h3>
                                <p className="text-xs text-slate-400 font-medium mt-1 max-w-[200px] text-center">
                                    {userType === 'admin'
                                        ? 'No SIP records found in the database.'
                                        : `You haven't started any ${activeTab === 'All' ? 'Fixed' : 'Flexible'} SIP plans yet.`}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center pt-4">
                    {activeTab === 'New SIP' && userType !== 'admin' && (
                        <button
                            onClick={() => {
                                if (userType === 'customer' && marketStatus === 'closed') {
                                    showNotification('Market is currently closed', 'error'); return;
                                }
                                setShowCreateFlexibleSIPDialog(true);
                            }}
                            disabled={marketStatus === 'closed'}
                            className="flex-1 py-4 bg-[#50C2C9] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-[#50C2C9]/30 flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            <Plus size={16} /> Create Flexible SIP
                        </button>
                    )}

                    {activeTab === 'All' && userType === 'customer' && (
                        <button
                            onClick={handleCreateFixedSIP_customers}
                            disabled={!isWithinAllowedTime || marketStatus === 'closed'}
                            className="flex-1 py-4 bg-emerald-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
                        >
                            <Plus size={16} /> New Fixed SIP
                        </button>
                    )}

                    {activeTab === 'All' && userType === 'admin' && (
                        <button
                            onClick={handleCreateFixedSIP}
                            className="flex-1 py-4 bg-[#50C2C9] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-[#50C2C9]/30 flex items-center justify-center gap-2"
                        >
                            <Plus size={16} /> Create Fixed Plan
                        </button>
                    )}

                    <button onClick={handleRefresh} className="px-4 py-4 bg-white text-slate-600 border border-slate-100 rounded-[1.5rem] font-bold shadow-sm hover:bg-slate-50 transition-colors">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </main>

            {/* FIXED SIP LIST MODAL */}
            {renderFixedSIPsList()}

            {/* CREATE FLEXIBLE SIP MODAL */}
            {showCreateFlexibleSIPDialog && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">New Flexible SIP</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Start small, grow big</p>
                            </div>
                            <button onClick={() => setShowCreateFlexibleSIPDialog(false)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Investment Plans</label>
                                <div className="relative">
                                    <select
                                        value={investmentAmount}
                                        onChange={(e) => setInvestmentAmount(e.target.value)}
                                        className="w-full bg-slate-50 border-none rounded-2xl py-4 px-5 text-sm font-bold text-slate-800 appearance-none focus:ring-2 focus:ring-[#50C2C9]/20 transition-all outline-none leading-tight"
                                        disabled={marketStatus === 'closed' || createSIPLoading}
                                    >
                                        <option value="25000">25000</option>
                                        <option value="50000">50000</option>
                                        <option value="75000">75000</option>
                                        <option value="100000">100000</option>
                                    </select>
                                    <ChevronLeft className="absolute right-4 top-1/2 -translate-y-1/2 rotate-270 text-slate-400 -rotate-90 pointer-events-none" size={16} />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 mb-1 block">Duration</label>
                                <div className="flex gap-2">
                                    {[6, 12].map(m => (
                                        <button
                                            key={m}
                                            onClick={() => setTotalMonths(m)}
                                            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${totalMonths === m ? 'bg-slate-800 text-white shadow-lg shadow-slate-800/20' : 'bg-slate-50 text-slate-400'}`}
                                        >
                                            {m} Months
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={createFlexibleSIP}
                                disabled={createSIPLoading || marketStatus === 'closed'}
                                className="w-full py-4 bg-[#50C2C9] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-[#50C2C9]/30 disabled:opacity-50 mt-4 flex justify-center items-center gap-2"
                            >
                                {createSIPLoading ? <RefreshCw className="animate-spin" size={16} /> : <Check size={16} />}
                                {createSIPLoading ? 'Creating Plan...' : 'Start Investment'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PAYMENT MODAL */}
            {showPaymentDialog && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 animate-in slide-in-from-bottom duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 className="text-xl font-black text-slate-800">Confirm Payment</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">{selectedPlan?.name}</p>
                            </div>
                            <button onClick={() => setShowPaymentDialog(false)} className="p-2 bg-slate-50 rounded-full hover:bg-slate-100">
                                <X className="w-5 h-5 text-slate-400" />
                            </button>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 mb-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-medium text-slate-500">Amount to Pay</span>
                                <span className="text-lg font-black text-slate-800">
                                    ₹{showAmountInput ? manualAmount : amountPayingValues[selectedSIPId] || selectedPlan?.monthlyAmount}
                                </span>
                            </div>
                            <div className="w-full h-px bg-slate-200 my-2"></div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-medium text-slate-500">Plan Type</span>
                                <span className="text-xs font-bold text-slate-800 uppercase">{selectedPlan?.type}</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => handlePaymentMethod('Online')}
                                className="w-full p-4 bg-[#50C2C9] text-white rounded-2xl font-bold shadow-lg shadow-[#50C2C9]/20 flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/20 rounded-xl"><DollarSign className="w-5 h-5 text-white" /></div>
                                    <div className="text-left">
                                        <span className="block text-sm">Pay Online</span>
                                        <span className="text-[9px] opacity-80 font-normal">UPI, Cards, Netbanking</span>
                                    </div>
                                </div>
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </button>

                            <button
                                onClick={() => handlePaymentMethod('Offline')}
                                className="w-full p-4 bg-white border-2 border-slate-100 text-slate-700 rounded-2xl font-bold hover:border-slate-200 transition-colors flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-xl"><DollarSign className="w-5 h-5 text-slate-500" /></div>
                                    <div className="text-left">
                                        <span className="block text-sm">Pay Offline</span>
                                        <span className="text-[9px] text-slate-400 font-normal">Manual Transfer</span>
                                    </div>
                                </div>
                                <ArrowRight size={18} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation (Sticky Bottom) */}
            <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-100 px-8 py-4 flex justify-between items-center max-w-md mx-auto z-40">
                {[
                    { icon: <Home />, label: 'Home', path: '/Home' },
                    { icon: <BadgeIndianRupee />, label: 'SIP', active: true, path: '/savings_plan' },
                    { icon: <History />, label: 'Passbook', path: '/Passbook' },
                    { icon: <User />, label: 'Profile', path: '/profile' }
                ].map((item, i) => (
                    <div
                        key={i}
                        onClick={() => router.push(item.path)}
                        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors ${item.active ? 'text-[#50C2C9]' : 'text-slate-600 hover:text-slate-700'}`}
                    >
                        {React.cloneElement(item.icon, { size: 22, strokeWidth: item.active ? 2.5 : 2 })}
                        <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
                    </div>
                ))}
            </nav>

            <style jsx>{`
        .animate-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
};

export default SIPPage;