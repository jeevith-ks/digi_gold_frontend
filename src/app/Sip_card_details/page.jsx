"use client";

import React, { useState, useEffect } from 'react';
import { ChevronLeft, X, Calendar, Clock, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SIPPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('New SIP');
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedSIPId, setSelectedSIPId] = useState(null);
  const [userType, setUserType] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [sipPlans, setSipPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    // Get user type and auth token from session storage
    const storedUserType = sessionStorage.getItem('userType');
    const token = sessionStorage.getItem('authToken');
    const storedSipType = sessionStorage.getItem('sipType');
    
    setUserType(storedUserType || '');
    setAuthToken(token || '');
    
    if (storedSipType) {
      setActiveTab(storedSipType === 'fixed' ? 'All' : 'New SIP');
    }

    // Fetch SIP data
    fetchSIPData();
  }, []);

  // Fetch SIP data from API
  const fetchSIPData = async () => {
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
        console.log('SIP Data fetched:', data);
        
        // Transform API data to match our frontend structure
        const transformedPlans = transformSIPData(data);
        setSipPlans(transformedPlans);
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

  // Transform API data to frontend format
  const transformSIPData = (apiData) => {
    const plans = [];

    // Transform fixed SIPs
    if (apiData.sipsFixed && apiData.sipsFixed.length > 0) {
      apiData.sipsFixed.forEach((fixedSip, index) => {
        plans.push({
          id: fixedSip.id,
          name: `Fixed SIP Plan ${index + 1}`,
          type: 'Fixed SIP',
          // Store both due date and created date
          dueDate: '2005', // This is the original due date for customers
          createdDate: formatDate(fixedSip.created_at), 
          investMin: fixedSip.total_amount_paid ? `₹${fixedSip.total_amount_paid}` : '₹0',
          investMax: 'N/A',
          color: 'bg-[#50C2C9]',
          redirect: '/Sip_card_details',
          status: fixedSip.status,
          monthsPaid: fixedSip.months_paid || 0,
          nextDueDate: fixedSip.next_due_date,
          isFixed: true,
          createdAt: fixedSip.created_at // Store original created_at
        });
      });
    }

    // Transform flexible SIPs
    if (apiData.sipsFlexible && apiData.sipsFlexible.length > 0) {
      apiData.sipsFlexible.forEach((flexibleSip, index) => {
        plans.push({
          id: flexibleSip.id,
          name: `Flexible SIP Plan ${index + 1}`,
          type: 'Flexible SIP',
          // Store both due date and created date
          dueDate: '2005', // This is the original due date for customers
          createdDate: formatDate(flexibleSip.created_at), // This is for admin
          investMin: flexibleSip.total_amount_paid ? `₹${flexibleSip.total_amount_paid}` : '₹0',
          investMax: 'N/A',
          color: 'bg-[#FF6B6B]',
          redirect: '/Sip_card_details',
          status: flexibleSip.status,
          monthsPaid: flexibleSip.months_paid || 0,
          totalMonths: flexibleSip.total_months || 12,
          metalType: flexibleSip.metal_type,
          isFixed: false,
          createdAt: flexibleSip.created_at // Store original created_at
        });
      });
    }

    // If no SIPs found, show sample data
    if (plans.length === 0) {
      plans.push({
        id: 1,
        name: 'SWARN SANCHAY YOJNA (22KT)',
        type: 'Money SIP',
        dueDate: '2005',
        createdDate: formatDate(new Date()),
        investMin: '2,000.0',
        investMax: '49,999.0',
        color: 'bg-[#50C2C9]',
        redirect: '/Sip_card_details',
        status: 'ACTIVE',
        monthsPaid: 0,
        isFixed: true,
        createdAt: new Date().toISOString()
      });
    }

    return plans;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get display date based on user type
  const getDisplayDate = (plan) => {
    if (userType === 'admin') {
      return plan.createdDate || formatDate(plan.createdAt);
    } else {
      return plan.dueDate;
    }
  };

  // Get date label based on user type
  const getDateLabel = () => {
    return userType === 'admin' ? 'Create Date:' : 'Due Date:';
  };

  // Handle tab change and store SIP type in session storage
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    const sipType = tab === 'All' ? 'fixed' : 'flexible';
    sessionStorage.setItem('sipType', sipType);
    
    console.log('SIP type stored:', sipType);
  };

  const handlePay = (id, plan, e) => {
    e.stopPropagation();
    setSelectedSIPId(id);
    setSelectedPlan(plan); // Store the selected plan
    setShowPaymentDialog(true);
  };

  const handlePaymentMethod = async (method) => {
  setShowPaymentDialog(false);
  setSelectedSIPId(null);
  
  if (!selectedPlan) {
    console.error('No plan selected');
    return;
  }

  if (method === 'Online') {
    // Store SIP details in session storage for the payment page
    sessionStorage.setItem('selectedMetal', selectedPlan.metalType || '22KT Gold');
    sessionStorage.setItem('sipAmount', selectedPlan.investMin.replace('₹', '').replace(',', ''));
    sessionStorage.setItem('sipMonths', selectedPlan.totalMonths || '12');
    sessionStorage.setItem('sipDay', '1');
    sessionStorage.setItem('sipType', activeTab === 'All' ? 'fixed' : 'flexible');
    
    console.log('Navigating to payment page with data:', {
      metal: selectedPlan.metalType,
      amount: selectedPlan.investMin.replace('₹', '').replace(',', ''),
      type: activeTab === 'All' ? 'fixed' : 'flexible'
    });
    
    // Navigate to the new payment page
    router.push('/payment/razorpay');
  } else if (method === 'Offline') {
    router.push('/payoffline');
  }
};

  const handleCreateSIP = () => {
    if (activeTab === 'New SIP') {
      sessionStorage.setItem('sipType', 'flexible');
      router.push('/sip');
    } else if (activeTab === 'All') {
      sessionStorage.setItem('sipType', 'fixed');
      router.push('/swarn_yojana_22k');
    }
  };

  const handleCreateAdminSIPPlans = () => {
    router.push('/admin_sip_plans');
  };

  // Function to get SIP type display name
  const getSipTypeDisplay = () => {
    return activeTab === 'All' ? 'Fixed SIP' : 'Flexible SIP';
  };

  // Filter plans based on active tab
  const filteredPlans = sipPlans.filter(plan => 
    activeTab === 'All' ? plan.isFixed : !plan.isFixed
  );

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

      {/* SIP Type Indicator */}
      <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
        <div className="text-center">
          <p className="text-sm text-blue-700 font-medium">
            📊 Current View: <span className="font-bold">{getSipTypeDisplay()}</span>
          </p>
          <p className="text-xs text-blue-600 mt-1">
            {activeTab === 'All' 
              ? 'Fixed SIPs have locked-in periods and guaranteed returns' 
              : 'Flexible SIPs allow dynamic investment changes'
            }
          </p>
          {/* User Type Indicator */}
          <p className="text-xs text-blue-500 mt-1">
            👤 User: <span className="font-bold">{userType === 'admin' ? 'Administrator' : 'Customer'}</span>
          </p>
        </div>
      </div>

      {/* Admin Controls - Only show for admin users */}
      {userType === 'admin' && (
        <div className="px-4 py-3 bg-yellow-50 border-b border-yellow-200">
          <div className="text-center mb-2">
            <p className="text-sm text-yellow-700 font-medium">
              🛡️ Admin Privileges
            </p>
          </div>
          <button
            onClick={handleCreateAdminSIPPlans}
            className="w-full bg-yellow-500 text-white px-4 py-3 rounded-lg font-semibold shadow-md hover:bg-yellow-600 transition-all flex items-center justify-center space-x-2"
          >
            <span>Create Admin SIP Plans</span>
          </button>
          <p className="text-xs text-yellow-600 text-center mt-2">
            Manage and create new SIP plans for users
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
              onClick={fetchSIPData}
              className="bg-[#50C2C9] text-white px-4 py-2 rounded-lg hover:bg-[#45b1b9] transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* SIP Plans */}
      {!loading && !error && (
        <div className={`flex-1 px-4 space-y-4 transition-all duration-300 ${showPaymentDialog ? 'blur-md filter' : ''}`}>
          {filteredPlans.length > 0 ? (
            filteredPlans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => {
                  const sipType = activeTab === 'All' ? 'fixed' : 'flexible';
                  sessionStorage.setItem('sipType', sipType);
                  router.push(plan.redirect);
                }}
                className={`${plan.color} text-white rounded-lg p-4 cursor-pointer hover:opacity-90 transition-opacity`}
              >
                {/* Plan Title */}
                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <div className="inline-block bg-white bg-opacity-20 px-2 py-1 rounded text-xs">
                    {plan.type}
                  </div>
                  {plan.status && (
                    <div className={`inline-block ml-2 px-2 py-1 rounded text-xs ${
                      plan.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-500'
                    }`}>
                      {plan.status}
                    </div>
                  )}
                </div>

                {/* Plan Details Section */}
                <div className="border-t border-white border-opacity-30 pt-3 space-y-3">
                  {/* Row 1: Date + Months */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Date - Show created date for admin, due date for customer */}
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm whitespace-nowrap">{getDateLabel()}</span>
                      <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full min-w-[70px] text-center">
                        <span className="text-sm font-medium">
                          {getDisplayDate(plan)}
                        </span>
                      </div>
                    </div>

                    {/* Months */}
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm whitespace-nowrap">Months:</span>
                      <div className="bg-white bg-opacity-20 px-1 py-1 rounded-full min-w-[70px] min-h-[20px] text-center">
                        <span className="text-sm font-medium">
                          {plan.monthsPaid}/{plan.totalMonths || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Amount */}
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-sm">Amount:</span>
                    <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full min-w-[70px] text-center">
                      <span className="text-sm font-medium">{plan.investMin}</span>
                    </div>
                  </div>

                  {/* Metal Type for Flexible SIPs */}
                  {!plan.isFixed && plan.metalType && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">Metal:</span>
                      <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-center">
                        <span className="text-sm font-medium">{plan.metalType}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Pay Button - Hide for admin users */}
                {userType !== 'admin' && (
                  <div className="flex justify-end pt-3">
                    <button
                      onClick={(e) => {
                        const sipType = activeTab === 'All' ? 'fixed' : 'flexible';
                        sessionStorage.setItem('sipType', sipType);
                        handlePay(plan.id, plan, e);
                      }}
                      className="bg-white text-[#50C2C9] px-6 py-2 rounded-md font-semibold hover:bg-opacity-90 transition-colors shadow-md"
                    >
                      Pay
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            // No plans found
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">No {getSipTypeDisplay()} plans found</p>
              <p className="text-sm text-gray-500">
                {activeTab === 'All' 
                  ? 'Fixed SIP plans will appear here' 
                  : 'Flexible SIP plans will appear here'
                }
              </p>
            </div>
          )}

          {/* Create SIP Button - Show for customers, hide for admin */}
          {userType !== 'admin' && filteredPlans.length > 0 && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleCreateSIP}
                className="bg-[#50C2C9] text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:bg-[#45b1b9] transition-all"
              >
                Create New {activeTab === 'All' ? 'Fixed' : 'Flexible'} SIP
              </button>
            </div>
          )}

          {/* Debug Info (remove in production) */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-xs text-gray-600">
                <strong>Debug Info:</strong><br />
                Active Tab: {activeTab}<br />
                Stored SIP Type: {sessionStorage.getItem('sipType')}<br />
                User Type: {userType}<br />
                Plans Count: {filteredPlans.length}<br />
                API Data Loaded: {!loading && !error ? 'Yes' : 'No'}
              </p>
            </div>
          )}

          {/* Spacer */}
          <div className="h-20"></div>
        </div>
      )}

      {/* Payment Dialog */}
      {showPaymentDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setShowPaymentDialog(false)}
          ></div>

          {/* Dialog Box */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
            {/* Close Button */}
            <button
              onClick={() => setShowPaymentDialog(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Dialog Title */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Choose Payment Method
              </h2>
              <p className="text-sm text-gray-500">
                Pay for your <strong>{getSipTypeDisplay()}</strong>
              </p>
            </div>

            {/* Payment Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => handlePaymentMethod('Online')}
                className="w-full bg-[#50C2C9] text-white py-4 rounded-lg font-semibold hover:bg-[#45b1b9] transition-all shadow-md flex items-center justify-center space-x-2"
              >
                <span>Online Payment</span>
              </button>

              <button
                onClick={() => handlePaymentMethod('Offline')}
                className="w-full bg-gray-100 text-gray-800 py-4 rounded-lg font-semibold hover:bg-gray-200 transition-all shadow-sm flex items-center justify-center space-x-2"
              >
                <span>Offline Payment</span>
              </button>
            </div>
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