'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Icons component
const Icons = {
  CheckCircle: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  User: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  Calendar: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  FileText: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Refresh: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Shield: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  Coins: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  TrendingUp: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  )
};

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-12">
    <div className="relative">
      <div className="h-12 w-12 rounded-full border-4 border-gray-200"></div>
      <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-[#50C2C9] border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-gray-600">Loading approval requests...</p>
  </div>
);

// Status Badge Component
const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          label: 'Ready for Bonus'
        };
      case 'COMPLETED':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          label: 'Bonus Approved'
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          label: status || 'Unknown'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
      {config.label}
    </span>
  );
};

// Approval Card Component
const ApprovalCard = ({ request, onApprove, isProcessing }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount || 0);
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(numAmount);
  };

  // Determine if the request needs approval
  const needsApproval = request.status === 'ACTIVE';

  // Calculate bonus amount
  const bonusAmount = request.total_amount_paid ? parseFloat(request.total_amount_paid) / 11 : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Card Header with Status */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#50C2C9]/10 rounded-lg">
            <Icons.User className="text-[#50C2C9]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {request.user?.username || `${request.user?.first_name || ''} ${request.user?.last_name || ''}`.trim() || 'User'}
            </h3>
            <p className="text-sm text-gray-500">{request.user?.email || 'No email'}</p>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-4">
        {/* SIP Plan Details */}
        <div className="space-y-3">
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Icons.Coins className="h-4 w-4" />
              SIP Plan Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan Name:</span>
                <span className="font-semibold text-gray-900">{request.sipPlanAdmin?.Yojna_name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Metal Type:</span>
                <span className="font-semibold text-gray-900 capitalize">{request.sipPlanAdmin?.metal_type?.toLowerCase() || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Amount:</span>
                <span className="font-semibold text-gray-900">{formatCurrency(request.sipPlanAdmin?.range_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Plan Duration:</span>
                <span className="font-semibold text-gray-900">12 months</span>
              </div>
            </div>
          </div>

          {/* User Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Icons.TrendingUp className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Progress:</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-900">11</span>
                <span className="text-gray-500">/12 months</span>
              </div>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#50C2C9] h-2 rounded-full" 
                style={{ width: '92%' }} // 11/12 = 91.67%
              ></div>
            </div>

            <div className="flex justify-between text-sm pt-2">
              <span className="text-gray-600">Total Paid (11 months):</span>
              <span className="font-semibold text-gray-900">{formatCurrency(request.total_amount_paid)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">12th Month Bonus:</span>
              <span className="font-semibold text-green-600">{formatCurrency(bonusAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Payment History:</span>
              <span className={`font-semibold ${request.has_delayed_payment ? 'text-red-600' : 'text-green-600'}`}>
                {request.has_delayed_payment ? 'Has delays' : 'On-time payments'}
              </span>
            </div>
          </div>

          {/* Dates */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Icons.Calendar className="h-4 w-4" />
              <span className="text-sm">Started:</span>
              <span className="text-sm font-medium">{formatDate(request.created_at)}</span>
            </div>
            {request.next_due_date && (
              <div className="flex items-center gap-2 text-gray-600">
                <Icons.Calendar className="h-4 w-4" />
                <span className="text-sm">Next Due:</span>
                <span className="text-sm font-medium">{formatDate(request.next_due_date)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Action Button - Only show for active SIPs */}
        {needsApproval && (
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={() => onApprove(request.id)}
              disabled={isProcessing === request.id}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#50C2C9] text-white rounded-lg font-medium hover:bg-[#45b1b9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing === request.id ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Approval...
                </>
              ) : (
                <>
                  <Icons.CheckCircle className="h-4 w-4" />
                  Approve 12th Month Bonus
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Approve to release {formatCurrency(bonusAmount)} bonus to user
            </p>
          </div>
        )}

        {/* Note: Show this for already completed SIPs */}
        {!needsApproval && (
          <div className="pt-3 border-t border-gray-100">
            <div className="text-center p-3 rounded-lg bg-green-50 border border-green-100">
              <p className="text-sm font-medium text-green-700">
                <Icons.CheckCircle className="h-4 w-4 inline mr-1" />
                12th Month Bonus Approved
              </p>
              <p className="text-xs text-green-600 mt-1">
                Bonus of {formatCurrency(bonusAmount)} was paid on {formatDate(request.updatedAt || new Date().toISOString())}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>SIP ID: {request.id?.substring(0, 8)}...</span>
          <span>Plan: {request.sipPlanAdmin?.Yojna_name?.substring(0, 15)}...</span>
        </div>
      </div>
    </div>
  );
};

// Main Admin Approval Page
export default function AdminApprovalPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState('pending'); // pending, completed
  const router = useRouter();

  // Fetch approval requests
  const fetchApprovalRequests = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      setError('');
      setSuccessMessage('');

      // Get auth token
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication required. Please login as admin.');
        setRequests([]);
        return;
      }

      const response = await fetch('http://localhost:5000/api/admin/approve', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Admin authentication required. Please login again.');
        }
        throw new Error(`Failed to fetch requests: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Fetched SIP bonus requests:', data);
      
      // Transform data for better UI display
      const transformedData = Array.isArray(data) ? data.map(request => ({
        ...request,
        // For UI display purposes
        userName: request.user?.username || `${request.user?.first_name || ''} ${request.user?.last_name || ''}`.trim(),
        userEmail: request.user?.email,
        sipPlanName: request.sipPlanAdmin?.Yojna_name,
      })) : [];
      
      setRequests(transformedData);
      
    } catch (err) {
      console.error('Error fetching approval requests:', err);
      setError(err.message || 'Failed to load SIP bonus requests. Please try again.');
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle approve request
  const handleApprove = async (sipId) => {
    if (!sipId) {
      setError('No SIP ID found');
      return;
    }

    try {
      setProcessingId(sipId);
      setError('');
      setSuccessMessage('');

      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication required. Please login as admin.');
      }

      // Send the fixedSip.id in the request body as sip_id
      const response = await fetch('http://localhost:5000/api/admin/approved', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sip_id: sipId,  // This is the fixedSip.id
          action: 'approve',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Approval failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Approval successful:', result);

      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === sipId 
          ? { ...req, status: 'COMPLETED', updatedAt: new Date().toISOString() }
          : req
      ));

      setSuccessMessage(result.message || '12th Month Bonus approved successfully!');
      
      // Auto-refresh after 2 seconds
      setTimeout(() => {
        fetchApprovalRequests(false);
      }, 2000);
      
    } catch (err) {
      console.error('Error approving request:', err);
      setError(err.message || 'Failed to approve 12th Month Bonus. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    if (filter === 'pending') {
      return request.status === 'ACTIVE';
    }
    if (filter === 'completed') {
      return request.status?.toUpperCase() === 'COMPLETED';
    }
    return true;
  });

  // Counts for filter badges
  const counts = {
    pending: requests.filter(r => r.status === 'ACTIVE').length,
    completed: requests.filter(r => r.status?.toUpperCase() === 'COMPLETED').length
  };

  // Calculate total bonus amount for pending requests
  const totalPendingBonus = requests
    .filter(r => r.status === 'ACTIVE')
    .reduce((sum, request) => {
      const bonus = request.total_amount_paid ? parseFloat(request.total_amount_paid) / 11 : 0;
      return sum + bonus;
    }, 0);

  // Calculate total paid amount
  const totalInvestment = requests.reduce((sum, request) => {
    return sum + parseFloat(request.total_amount_paid || 0);
  }, 0);

  useEffect(() => {
    fetchApprovalRequests();
  }, []);

  const handleRefresh = () => {
    fetchApprovalRequests(false);
  };

  const handleBack = () => {
    router.back();
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={handleBack}
                className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <Icons.ArrowLeft className="h-5 w-5 text-gray-700" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Approval Page</h1>
                {/* <p className="text-sm text-gray-500">Approve 12th month bonus for completed 11-month SIPs</p> */}
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              {refreshing ? (
                <div className="h-4 w-4 border-2 border-gray-300 border-t-[#50C2C9] rounded-full animate-spin"></div>
              ) : (
                <Icons.Refresh className="h-4 w-4" />
              )}
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { key: 'pending', label: 'Pending Approval' },
              { key: 'completed', label: 'Completed' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === tab.key
                    ? 'bg-[#50C2C9] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  filter === tab.key
                    ? 'bg-white/30'
                    : 'bg-white'
                }`}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4">
        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Icons.CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-800">Success</h3>
                <p className="text-green-600">{successMessage}</p>
              </div>
              <button
                onClick={() => setSuccessMessage('')}
                className="p-1 hover:bg-green-100 rounded-full"
              >
                <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-red-800">Error</h3>
                <p className="text-red-600">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="p-1 hover:bg-red-100 rounded-full"
              >
                <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Stats Summary */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{counts.pending}</div>
            <div className="text-sm text-gray-500">Pending Approval</div>
            <div className="text-xs text-yellow-600 mt-1">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(totalPendingBonus)} total bonus
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{counts.completed}</div>
            <div className="text-sm text-gray-500">Bonus Approved</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(totalInvestment)}
            </div>
            <div className="text-sm text-gray-500">Total SIP Investment</div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Requests List */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {filter === 'pending' ? 'SIPs Ready for 12th Month Bonus' : 'Completed SIP Bonuses'}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({filteredRequests.length} found)
                  </span>
                </h2>
                {filteredRequests.length > 0 && (
                  <button
                    onClick={handleRefresh}
                    className="text-sm text-[#50C2C9] hover:text-[#45b1b9] flex items-center gap-1"
                  >
                    <Icons.Refresh className="h-3 w-3" />
                    Refresh
                  </button>
                )}
              </div>

              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                    <Icons.Shield className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {filter === 'pending' ? 'No SIPs Ready for Bonus' : 'No Completed Bonuses'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {filter === 'pending' 
                      ? 'There are no SIPs that have completed 11 payments yet.' 
                      : 'No 12th month bonuses have been approved yet.'}
                  </p>
                  <button
                    onClick={handleRefresh}
                    className="px-4 py-2 bg-[#50C2C9] text-white rounded-lg hover:bg-[#45b1b9] transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRequests.map((request) => (
                    <ApprovalCard
                      key={request.id}
                      request={request}
                      onApprove={handleApprove}
                      isProcessing={processingId}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Information Panel */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-[#50C2C9]/10 rounded-lg">
                  <Icons.Shield className="h-6 w-6 text-[#50C2C9]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">12th Month Bonus Program</h3>
                  <p className="text-sm text-gray-500">Automatic bonus for completing 12-month SIPs</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-800 mb-2">How It Works</h4>
                  <ul className="text-sm text-blue-600 space-y-2">
                    <li className="flex items-start">
                      <span className="inline-block w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center mr-2 mt-0.5">1</span>
                      <span>User completes 11 monthly payments of a 12-month SIP</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center mr-2 mt-0.5">2</span>
                      <span>System automatically lists SIP for 12th month bonus approval</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center mr-2 mt-0.5">3</span>
                      <span>Admin approves bonus (equal to one monthly payment)</span>
                    </li>
                    <li className="flex items-start">
                      <span className="inline-block w-6 h-6 bg-blue-100 text-blue-800 rounded-full text-xs flex items-center justify-center mr-2 mt-0.5">4</span>
                      <span>Bonus is credited and gold added to user holdings</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                  <h4 className="font-medium text-green-800 mb-2">Bonus Calculation</h4>
                  <div className="text-sm text-green-700 space-y-2">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <div className="font-medium">Formula:</div>
                      <div className="text-xs mt-1">12th Month Bonus = Total Paid Amount ÷ 11</div>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <div className="font-medium">Example:</div>
                      <div className="text-xs mt-1">
                        If user paid ₹11,000 over 11 months<br/>
                        Bonus = ₹11,000 ÷ 11 = ₹1,000
                      </div>
                    </div>
                    <div className="text-xs text-green-600 mt-2">
                      * Bonus is paid as cash credit and equivalent gold
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap gap-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-900">{requests.length}</div>
                    <div className="text-xs text-gray-500">Total 12-Month SIPs</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-yellow-600">{counts.pending}</div>
                    <div className="text-xs text-gray-500">Awaiting Bonus</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">{counts.completed}</div>
                    <div className="text-xs text-gray-500">Bonus Paid</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {new Intl.NumberFormat('en-IN', {
                        style: 'currency',
                        currency: 'INR',
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0
                      }).format(totalPendingBonus)}
                    </div>
                    <div className="text-xs text-gray-500">Pending Bonus Value</div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 p-4 border-t border-gray-200 bg-white">
        <div className="text-center text-sm text-gray-500">
          <p>SIP 12th Month Bonus Approval System • {new Date().getFullYear()}</p>
          <p className="mt-1">Only shows 12-month SIP plans with exactly 11 payments completed</p>
        </div>
      </div>
    </div>
  );
}