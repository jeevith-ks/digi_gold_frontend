'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, User, Calendar, FileText, RefreshCw, Shield,
  ArrowLeft, Coins, TrendingUp, AlertCircle, Search, Filter,
  Clock, Check, X, ChevronRight, Award, Zap
} from 'lucide-react';
import '../home-enhanced.css';

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="relative">
      <div className="h-16 w-16 rounded-full border-4 border-gray-100"></div>
      <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-[#50C2C9] border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-6 text-gray-500 font-medium animate-pulse">Loading approval requests...</p>
  </div>
);

// Status Badge Component
const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return {
          bg: 'bg-amber-50',
          text: 'text-amber-700',
          border: 'border-amber-200',
          icon: <Clock className="w-3 h-3" />,
          label: 'Pending Bonus'
        };
      case 'COMPLETED':
        return {
          bg: 'bg-emerald-50',
          text: 'text-emerald-700',
          border: 'border-emerald-200',
          icon: <CheckCircle className="w-3 h-3" />,
          label: 'Bonus Approved'
        };
      default:
        return {
          bg: 'bg-gray-50',
          text: 'text-gray-600',
          border: 'border-gray-200',
          icon: <AlertCircle className="w-3 h-3" />,
          label: status || 'Unknown'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border} shadow-sm`}>
      {config.icon}
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
        year: 'numeric'
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
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const needsApproval = request.status === 'ACTIVE';
  const bonusAmount = request.total_amount_paid ? parseFloat(request.total_amount_paid) / 11 : 0;
  const progressPercentage = (11 / 12) * 100;

  return (
    <div className="group relative bg-white rounded-3xl p-5 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Decorative gradient background opacity */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#50C2C9]/10 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none group-hover:from-[#50C2C9]/20 transition-all" />

      {/* Header */}
      <div className="flex justify-between items-start mb-4 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#50C2C9] to-[#2D8A94] flex items-center justify-center text-white shadow-lg shadow-[#50C2C9]/30">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 truncate max-w-[150px]" title={request.userName}>
              {request.userName}
            </h3>
            <p className="text-xs text-gray-500 font-medium">{request.sipPlanAdmin?.Yojna_name}</p>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Progress Section */}
      <div className="mb-5 bg-gray-50 rounded-2xl p-4 border border-gray-100">
        <div className="flex justify-between items-end mb-2">
          <div>
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">SIP Progress</span>
            <div className="text-sm font-bold text-gray-900">11 <span className="text-gray-400 font-normal">/ 12 Months</span></div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Paid</span>
            <div className="text-sm font-bold text-[#50C2C9]">{formatCurrency(request.total_amount_paid)}</div>
          </div>
        </div>
        <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#50C2C9] to-[#2D8A94] rounded-full relative"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse-slow" />
          </div>
        </div>
      </div>

      {/* Bonus Details */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-[#50C2C9]/5 rounded-xl p-3 border border-[#50C2C9]/10">
          <div className="flex items-center gap-1.5 text-[#2D8A94] mb-1">
            <Award className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">Bonus Amount</span>
          </div>
          <div className="text-lg font-black text-[#50C2C9]">{formatCurrency(bonusAmount)}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
          <div className="flex items-center gap-1.5 text-gray-500 mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">Start Date</span>
          </div>
          <div className="text-sm font-bold text-gray-700">{formatDate(request.created_at)}</div>
        </div>
      </div>

      {/* Action Area */}
      {needsApproval ? (
        <button
          onClick={() => onApprove(request.id)}
          disabled={isProcessing === request.id}
          className="w-full relative overflow-hidden group/btn flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-[#50C2C9] to-[#2D8A94] text-white rounded-xl font-bold hover:shadow-lg hover:shadow-[#50C2C9]/40 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-300"
        >
          {isProcessing === request.id ? (
            <>
              <div className="h-4 w-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span className="relative z-10">Approve Bonus</span>
              <ChevronRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
            </>
          )}
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
        </button>
      ) : (
        <div className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-center justify-center gap-2 font-bold text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Bonus Credited</span>
        </div>
      )}

      {request.has_delayed_payment && (
        <div className="mt-3 flex items-center gap-1.5 justify-center text-xs text-amber-600 font-medium bg-amber-50 py-1.5 rounded-lg">
          <AlertCircle className="w-3 h-3" />
          <span>Note: User had payment delays</span>
        </div>
      )}
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

      const transformedData = Array.isArray(data) ? data.map(request => ({
        ...request,
        userName: request.user?.username || `${request.user?.first_name || ''} ${request.user?.last_name || ''}`.trim(),
        userEmail: request.user?.email,
        sipPlanName: request.sipPlanAdmin?.Yojna_name,
      })) : [];

      setRequests(transformedData);

    } catch (err) {
      console.error('Error fetching approval requests:', err);
      setError(err.message || 'Failed to load SIP bonus requests.');
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle approve request
  const handleApprove = async (sipId) => {
    if (!sipId) return;

    try {
      setProcessingId(sipId);
      setError('');
      setSuccessMessage('');

      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('authToken');
      if (!token) throw new Error('Authentication required.');

      const response = await fetch('http://localhost:5000/api/admin/approved', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sip_id: sipId,
          action: 'approve',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Approval failed: ${errorText}`);
      }

      const result = await response.json();

      setRequests(prev => prev.map(req =>
        req.id === sipId
          ? { ...req, status: 'COMPLETED', updatedAt: new Date().toISOString() }
          : req
      ));

      setSuccessMessage(result.message || '12th Month Bonus approved successfully!');

      setTimeout(() => fetchApprovalRequests(false), 2000);

    } catch (err) {
      setError(err.message || 'Failed to approve bonus. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    if (filter === 'pending') return request.status === 'ACTIVE';
    if (filter === 'completed') return request.status?.toUpperCase() === 'COMPLETED';
    return true;
  });

  const counts = {
    pending: requests.filter(r => r.status === 'ACTIVE').length,
    completed: requests.filter(r => r.status?.toUpperCase() === 'COMPLETED').length
  };

  const totalPendingBonus = requests
    .filter(r => r.status === 'ACTIVE')
    .reduce((sum, request) => {
      const bonus = request.total_amount_paid ? parseFloat(request.total_amount_paid) / 11 : 0;
      return sum + bonus;
    }, 0);

  useEffect(() => {
    fetchApprovalRequests();
  }, []);

  const handleRefresh = () => fetchApprovalRequests(false);

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
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 selection:bg-[#50C2C9] selection:text-white">
      {/* Premium Header */}
      <div className="bg-white sticky top-0 z-30 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] backdrop-blur-xl bg-white/90">
        <div className="max-w-7xl mx-auto px-4 lg:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-gray-800 transition-colors" />
              </button>
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#50C2C9] to-[#2D8A94]">
                  Bonus Approval
                </h1>
                <p className="text-xs text-gray-400 font-medium tracking-wide">ADMIN DASHBOARD</p>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className={`p-2.5 rounded-xl transition-all ${refreshing ? 'bg-[#50C2C9]/10 text-[#50C2C9]' : 'bg-gray-50 text-gray-500 hover:bg-[#50C2C9] hover:text-white hover:shadow-lg hover:shadow-[#50C2C9]/20'}`}
              title="Refresh Data"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-6 border-b border-gray-100">
            {[
              { key: 'pending', label: 'Pending Approval', count: counts.pending },
              { key: 'completed', label: 'Completed', count: counts.completed }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`flex items-center gap-2 pb-4 text-sm font-bold transition-all relative ${filter === tab.key
                    ? 'text-[#2D8A94]'
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${filter === tab.key ? 'bg-[#50C2C9] text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                  {tab.count}
                </span>
                {filter === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2D8A94] rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
        {/* Messages */}
        <div className="mb-6 space-y-4">
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-center gap-3 animate-scale-in shadow-sm">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-emerald-800 font-medium">{successMessage}</p>
            </div>
          )}
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 animate-scale-in shadow-sm">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <X className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          )}
        </div>

        {/* Stats Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-amber-50 to-transparent rounded-bl-full -mr-6 -mt-6 transition-all group-hover:scale-110" />
            <div className="relative">
              <p className="text-sm text-gray-500 font-medium mb-1">Pending Requests</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">{counts.pending}</span>
                <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">ACTION NEEDED</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-gray-400 text-xs">
                <Clock className="w-3.5 h-3.5" />
                Waiting for approval
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-[#50C2C9]/10 to-transparent rounded-bl-full -mr-6 -mt-6 transition-all group-hover:scale-110" />
            <div className="relative">
              <p className="text-sm text-gray-500 font-medium mb-1">Pending Value</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">
                  {new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                    notation: 'compact',
                    maximumFractionDigits: 1
                  }).format(totalPendingBonus)}
                </span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-gray-400 text-xs">
                <Coins className="w-3.5 h-3.5" />
                Total bonus to distribute
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-transparent rounded-bl-full -mr-6 -mt-6 transition-all group-hover:scale-110" />
            <div className="relative">
              <p className="text-sm text-gray-500 font-medium mb-1">Total Approved</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">{counts.completed}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">COMPLETED</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center gap-2 text-gray-400 text-xs">
                <CheckCircle className="w-3.5 h-3.5" />
                Succesfully processed
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="min-h-[400px]">
            {filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-gray-100 border-dashed">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">No requests found</h3>
                <p className="text-gray-500 text-sm mt-1">
                  {filter === 'pending' ? 'All caught up! No SIPs waiting for bonus.' : 'No completed bonus history found.'}
                </p>
                <button
                  onClick={handleRefresh}
                  className="mt-6 px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
                >
                  Refresh List
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        )}

        {/* Info Footer */}
        <div className="mt-12 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#50C2C9]/10 flex items-center justify-center text-[#50C2C9] flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Automated 12th Month Bonus System</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-3xl">
                This system identifies SIP plans that have successfully completed 11 months of payments.
                Approving a request will automatically calculate and credit the 12th-month bonus (equivalent to one monthly installment)
                to the user's wallet/gold balance, completing the SIP cycle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}