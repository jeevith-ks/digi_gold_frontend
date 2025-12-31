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
  XCircle: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
    switch (status?.toLowerCase()) {
      case 'pending':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          label: 'Pending'
        };
      case 'approved':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          label: 'Approved'
        };
      case 'rejected':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          label: 'Rejected'
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
const ApprovalCard = ({ request, onApprove, onReject, isProcessing }) => {
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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Card Header with Status */}
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-[#50C2C9]/10 rounded-lg">
            <Icons.User className="text-[#50C2C9]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{request.userName || 'User'}</h3>
            <p className="text-sm text-gray-500">{request.userEmail || request.email || 'No email'}</p>
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {/* Card Content */}
      <div className="p-4 space-y-4">
        {/* Request Details */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-600">
            <Icons.FileText className="h-4 w-4" />
            <span className="text-sm font-medium">Request Type:</span>
            <span className="text-sm">{request.requestType || 'General'}</span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Icons.Calendar className="h-4 w-4" />
            <span className="text-sm font-medium">Submitted:</span>
            <span className="text-sm">{formatDate(request.submittedAt || request.createdAt)}</span>
          </div>

          {/* Additional Details */}
          {request.details && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Details:</h4>
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {request.details}
              </p>
            </div>
          )}

          {/* Request Data (if any) */}
          {request.data && Object.keys(request.data).length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Request Data:</h4>
              <div className="space-y-2">
                {Object.entries(request.data).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600">{key}:</span>
                    <span className="text-gray-900 font-medium">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons - Only show for pending requests */}
        {request.status?.toLowerCase() === 'pending' && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex gap-3">
              <button
                onClick={() => onApprove(request.id)}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#50C2C9] text-white rounded-lg font-medium hover:bg-[#45b1b9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Icons.CheckCircle className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => onReject(request.id)}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Icons.XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>ID: {request.id?.substring(0, 8) || 'N/A'}</span>
          <span>Last updated: {formatDate(request.updatedAt)}</span>
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
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
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

      // Get auth token (adjust based on your auth system)
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        setError('Authentication required. Please login as admin.');
        setRequests([]);
        return;
      }

      const response = await fetch('http://localhost:5000/api/approve', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Admin authentication required');
        }
        throw new Error(`Failed to fetch requests: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched approval requests:', data);
      setRequests(data);
    } catch (err) {
      console.error('Error fetching approval requests:', err);
      setError(err.message || 'Failed to load approval requests');
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle approve request
  const handleApprove = async (requestId) => {
    try {
      setProcessingId(requestId);
      setError('');

      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:5000/api/approved', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: requestId,
          action: 'approve',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Approval failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Approval successful:', result);

      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'approved', updatedAt: new Date().toISOString() }
          : req
      ));

      // Show success message
      alert('Request approved successfully!');
      
    } catch (err) {
      console.error('Error approving request:', err);
      setError(err.message || 'Failed to approve request');
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Handle reject request
  const handleReject = async (requestId) => {
    try {
      setProcessingId(requestId);
      setError('');

      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('authToken');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('http://localhost:5000/api/approved', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          requestId: requestId,
          action: 'reject',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Rejection failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Rejection successful:', result);

      // Update local state
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, status: 'rejected', updatedAt: new Date().toISOString() }
          : req
      ));

      // Show success message
      alert('Request rejected successfully!');
      
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError(err.message || 'Failed to reject request');
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  // Filter requests
  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    if (filter === 'pending') return request.status?.toLowerCase() === 'pending';
    if (filter === 'approved') return request.status?.toLowerCase() === 'approved';
    if (filter === 'rejected') return request.status?.toLowerCase() === 'rejected';
    return true;
  });

  // Counts for filter badges
  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status?.toLowerCase() === 'pending').length,
    approved: requests.filter(r => r.status?.toLowerCase() === 'approved').length,
    rejected: requests.filter(r => r.status?.toLowerCase() === 'rejected').length
  };

  useEffect(() => {
    fetchApprovalRequests();
  }, []);

  const handleRefresh = () => {
    fetchApprovalRequests(false);
  };

  const handleBack = () => {
    router.back();
  };

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
                <h1 className="text-xl font-bold text-gray-900">Admin Approval Panel</h1>
                <p className="text-sm text-gray-500">Review and manage approval requests</p>
              </div>
            </div>
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
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
              { key: 'all', label: 'All Requests' },
              { key: 'pending', label: 'Pending' },
              { key: 'approved', label: 'Approved' },
              { key: 'rejected', label: 'Rejected' }
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
        {/* Stats Summary */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{counts.all}</div>
            <div className="text-sm text-gray-500">Total Requests</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-yellow-600">{counts.pending}</div>
            <div className="text-sm text-gray-500">Pending</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-green-600">{counts.approved}</div>
            <div className="text-sm text-gray-500">Approved</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold text-red-600">{counts.rejected}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <Icons.XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800">Error</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Requests List */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {filter === 'all' ? 'All Requests' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Requests`}
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({filteredRequests.length} found)
                  </span>
                </h2>
              </div>

              {filteredRequests.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                    <Icons.Shield className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    {requests.length === 0 ? 'No Approval Requests' : `No ${filter} Requests`}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {requests.length === 0 
                      ? 'There are no approval requests at the moment.' 
                      : `There are no ${filter} approval requests.`}
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
                      onReject={handleReject}
                      isProcessing={processingId === request.id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Admin Info & Actions */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-[#50C2C9]/10 rounded-lg">
                  <Icons.Shield className="h-6 w-6 text-[#50C2C9]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Admin Actions</h3>
                  <p className="text-sm text-gray-500">Manage approval requests</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Pending Requests</h4>
                  <p className="text-sm text-blue-600">
                    {counts.pending} request{counts.pending !== 1 ? 's' : ''} need{counts.pending === 1 ? 's' : ''} your attention
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Approved Requests</h4>
                  <p className="text-sm text-green-600">
                    {counts.approved} request{counts.approved !== 1 ? 's' : ''} approved
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Total Processed</h4>
                  <p className="text-sm text-gray-600">
                    {counts.approved + counts.rejected} request{counts.approved + counts.rejected !== 1 ? 's' : ''} processed
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}