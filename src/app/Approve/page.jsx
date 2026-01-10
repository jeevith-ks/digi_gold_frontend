'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle, User, Calendar, FileText, RefreshCw, Shield,
  ArrowLeft, Coins, TrendingUp, AlertCircle, Search, Filter,
  Clock, Check, X, ChevronRight, Award, Zap,
  Home, LayoutDashboard, Settings
} from 'lucide-react';
import Link from 'next/link';

// --- Components ---

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center py-20">
    <div className="relative">
      <div className="h-12 w-12 rounded-full border-4 border-slate-100"></div>
      <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-[#50C2C9] border-t-transparent animate-spin"></div>
    </div>
    <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading requests...</p>
  </div>
);

const ApprovalCard = ({ request, onApprove, isProcessing }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch { return 'Invalid Date'; }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const needsApproval = request.status === 'ACTIVE';
  const bonusAmount = request.total_amount_paid ? parseFloat(request.total_amount_paid) / 11 : 0;
  const progressPercentage = (11 / 12) * 100;

  return (
    <div className="group relative bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50 hover:shadow-lg hover:scale-[1.01] transition-all duration-300 overflow-hidden animate-in slide-in-from-bottom-4">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#50C2C9] to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-[#50C2C9]/20">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 line-clamp-1">{request.userName}</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{request.sipPlanAdmin?.Yojna_name || 'Gold Plan'}</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${needsApproval ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
          }`}>
          {needsApproval ? 'Pending' : 'Approved'}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progress</span>
          <span className="text-[10px] font-black text-slate-700">11 <span className="text-slate-400 font-bold">/ 12 Months</span></span>
        </div>
        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#50C2C9] to-teal-400 rounded-full relative"
            style={{ width: `${progressPercentage}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-[#50C2C9]/5 rounded-2xl p-4 border border-[#50C2C9]/10">
          <p className="text-[9px] font-black text-[#50C2C9] uppercase tracking-wider mb-1">Bonus Amount</p>
          <p className="text-lg font-black text-slate-800">{formatCurrency(bonusAmount)}</p>
        </div>
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Total Paid</p>
          <p className="text-lg font-black text-slate-700">{formatCurrency(request.total_amount_paid)}</p>
        </div>
      </div>

      {/* Action Button */}
      {needsApproval ? (
        <button
          onClick={() => onApprove(request.id)}
          disabled={isProcessing === request.id}
          className="w-full py-4 bg-[#50C2C9] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#50C2C9]/30 hover:bg-[#45b1b9] active:scale-95 disabled:opacity-70 disabled:active:scale-100 transition-all flex items-center justify-center gap-2"
        >
          {isProcessing === request.id ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Award size={18} />
              Approve Bonus
            </>
          )}
        </button>
      ) : (
        <div className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-default">
          <CheckCircle size={16} />
          Bonus Credited
        </div>
      )}
    </div>
  );
};

export default function AdminApprovalPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState('pending');
  const router = useRouter();

  // Fetch logic remains same, just updated UI wrapping
  const fetchApprovalRequests = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      else setRefreshing(true);
      setError(''); setSuccessMessage('');

      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('authToken');
      if (!token) {
        setError('Authentication required. Please login as admin.');
        setRequests([]);
        return;
      }

      const response = await fetch('http://35.154.85.104:5000/api/admin/approve', {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });

      if (!response.ok) throw new Error(`Failed to fetch requests: ${response.status}`);

      const data = await response.json();
      const transformedData = Array.isArray(data) ? data.map(request => ({
        ...request,
        userName: request.user?.username || `${request.user?.first_name || ''} ${request.user?.last_name || ''}`.trim(),
        userEmail: request.user?.email,
        sipPlanName: request.sipPlanAdmin?.Yojna_name,
      })) : [];

      setRequests(transformedData);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load requests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleApprove = async (sipId) => {
    if (!sipId) return;
    try {
      setProcessingId(sipId);
      setError(''); setSuccessMessage('');
      const token = localStorage.getItem('adminToken') || sessionStorage.getItem('authToken');

      const response = await fetch('http://35.154.85.104:5000/api/admin/approved', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ sip_id: sipId, action: 'approve', timestamp: new Date().toISOString() })
      });

      if (!response.ok) throw new Error(await response.text());
      const result = await response.json();

      setRequests(prev => prev.map(req => req.id === sipId ? { ...req, status: 'COMPLETED' } : req));
      setSuccessMessage(result.message || 'Bonus approved successfully!');
      setTimeout(() => fetchApprovalRequests(false), 2000);
    } catch (err) { setError(err.message); }
    finally { setProcessingId(null); }
  };

  useEffect(() => { fetchApprovalRequests(); }, []);
  const handleRefresh = () => fetchApprovalRequests(false);

  // Filter logic
  const filteredRequests = requests.filter(request => {
    if (filter === 'pending') return request.status === 'ACTIVE';
    if (filter === 'completed') return request.status?.toUpperCase() === 'COMPLETED';
    return true;
  });

  const counts = {
    pending: requests.filter(r => r.status === 'ACTIVE').length,
    completed: requests.filter(r => r.status?.toUpperCase() === 'COMPLETED').length
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#F8FAFC] min-h-screen pb-28 font-sans relative">

      {/* Header */}
      <header className="bg-white px-6 pt-10 pb-8 rounded-b-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-0 z-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors">
              <ChevronRight className="w-6 h-6 text-slate-800 rotate-180" />
            </button>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Approvals</h1>
          </div>
          <button
            onClick={handleRefresh}
            className={`p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-50 p-1.5 rounded-[1.2rem] flex relative">
          {['pending', 'completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 text-[10px] font-black uppercase tracking-wider ${filter === tab
                ? 'bg-white text-[#50C2C9] shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {tab === 'pending' && <Clock size={16} />}
              {tab === 'completed' && <CheckCircle size={16} />}
              <span>{tab === 'pending' ? 'Pending' : 'History'}</span>
              <span className={`ml-1 px-1.5 py-0.5 rounded-md text-[9px] ${filter === tab ? 'bg-[#50C2C9]/10 text-[#50C2C9]' : 'bg-slate-200 text-slate-500'}`}>
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6 space-y-4">

        {/* Alerts */}
        {successMessage && (
          <div className="animate-in slide-in-from-top-4 p-4 bg-emerald-50 border border-emerald-100 rounded-[1.5rem] flex items-center gap-3 shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <p className="text-xs font-bold text-emerald-700">{successMessage}</p>
          </div>
        )}
        {error && (
          <div className="animate-in slide-in-from-top-4 p-4 bg-rose-50 border border-rose-100 rounded-[1.5rem] flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <p className="text-xs font-bold text-rose-700">{error}</p>
          </div>
        )}

        {/* Stats Card (Only on pending) */}
        {filter === 'pending' && counts.pending > 0 && (
          <div className="bg-slate-900 rounded-[2rem] p-6 shadow-xl relative overflow-hidden mb-6">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#50C2C9]/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>

            <div className="relative z-10">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Pending Bonus</p>
              <p className="text-3xl font-black text-white tracking-tight">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
                  requests.filter(r => r.status === 'ACTIVE').reduce((sum, r) => sum + (parseFloat(r.total_amount_paid || 0) / 11), 0)
                )}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border-2 border-slate-900"></div>)}
                </div>
                <p className="text-[10px] font-bold text-slate-400">{counts.pending} Investors awaiting bonus</p>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <LoadingSpinner />
        ) : filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center opacity-50">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="text-slate-300" size={32} />
            </div>
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest">No Requests</h3>
            <p className="text-xs text-slate-400 mt-2 max-w-[200px]">
              {filter === 'pending' ? 'All bonuses have been approved.' : 'No approval history found.'}
            </p>
          </div>
        ) : (
          filteredRequests.map(request => (
            <ApprovalCard
              key={request.id}
              request={request}
              onApprove={handleApprove}
              isProcessing={processingId}
            />
          ))
        )}

      </main>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 pb-6 z-40 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto w-full flex justify-between items-center px-2">
          {[
            { icon: <Home className="w-6 h-6" />, label: 'Home', href: '/Home', active: false },
            { icon: <LayoutDashboard className="w-6 h-6" />, label: 'Admin', href: '/settlements', active: false },
            { icon: <Award className="w-6 h-6 text-[#50C2C9]" />, label: 'Approve', href: '/Approve', active: true },
            { icon: <User className="w-6 h-6" />, label: 'Profile', href: '/profile', active: false }
          ].map((item, i) => (
            <Link key={i} href={item.href} className="group flex flex-col items-center gap-1.5 min-w-[3.5rem] cursor-pointer" onClick={(e) => { if (item.active) e.preventDefault(); }}>
              <div className={`p-2.5 rounded-2xl transition-all duration-300 ${item.active
                ? 'bg-[#50C2C9] text-white shadow-lg shadow-[#50C2C9]/30 -translate-y-2'
                : 'bg-transparent text-slate-300 group-hover:text-slate-500'
                }`}>
                {item.active ? <Award className="w-6 h-6 text-white" /> : item.icon}
              </div>
              {item.active && (
                <span className="text-[10px] font-black text-[#50C2C9] uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 absolute bottom-2">
                  {item.label}
                </span>
              )}
            </Link>
          ))}
        </div>
      </nav>

    </div>
  );
}