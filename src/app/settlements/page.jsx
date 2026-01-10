'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, RefreshCw, CheckCircle2, XCircle, Clock, AlertCircle, TrendingUp, DollarSign, Calendar, User, FileText, Check, ChevronRight, Home, LayoutDashboard, Wallet, Settings } from 'lucide-react';
import Link from 'next/link';

export default function SettlementsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Uncompleted');
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [token, setToken] = useState(null);
  const [isClient, setIsClient] = useState(false);

  // Initialize client-side
  useEffect(() => {
    setIsClient(true);
    const authToken = sessionStorage.getItem('authToken');
    if (authToken) {
      setToken(authToken);
    } else {
      // Redirect handled in data fetch or rendered UI
    }
  }, []);

  useEffect(() => {
    if (token) {
      fetchSettlements();
    }
  }, [token]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      setApiError(false);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch('http://35.154.85.104:5000/api/admin/completed-settled-sips', {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        sessionStorage.removeItem('authToken');
        setToken(null);
        router.push('/Authentication');
        return;
      }

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

      const data = await response.json();
      setSettlements(transformApiData(data));

    } catch (err) {
      console.error('Error fetching settlements:', err);
      setApiError(true);
      // Fallback data
      setSettlements(getSampleData());
    } finally {
      setLoading(false);
    }
  };

  const transformApiData = (apiData) => {
    const transformed = [];

    // Fixed SIPs
    if (apiData.sipsFixed && Array.isArray(apiData.sipsFixed)) {
      apiData.sipsFixed.forEach(sip => {
        transformed.push({
          id: sip.id,
          sip_id: sip.id,
          name: `User ${sip.user_id}`,
          user_id: sip.user_id,
          amount: parseFloat(sip.total_amount_paid) || 0,
          date: sip.created_at ? new Date(sip.created_at).toISOString().split('T')[0] : 'N/A',
          status: sip.status, // EXPECTED: 'COMPLETED' or 'SETTLED'
          description: sip.sipPlanAdmin?.Yojna_name || 'Fixed Wealth Plan',
          metal_type: sip.sipPlanAdmin?.metal_type || 'GOLD',
          sip_type: 'FIXED'
        });
      });
    }

    // Flexible SIPs
    if (apiData.sipsFlexible && Array.isArray(apiData.sipsFlexible)) {
      apiData.sipsFlexible.forEach(sip => {
        transformed.push({
          id: `flex-${sip.id}`,
          sip_id: sip.id,
          name: `User ${sip.user_id}`,
          user_id: sip.user_id,
          amount: parseFloat(sip.total_amount_paid) || 0,
          date: sip.created_at ? new Date(sip.created_at).toISOString().split('T')[0] : 'N/A',
          status: sip.status,
          description: `Flexible ${sip.metal_type} Plan`,
          metal_type: sip.metal_type || 'GOLD',
          sip_type: 'FLEXIBLE'
        });
      });
    }

    return transformed;
  };

  const getSampleData = () => [
    { id: 1, name: 'John Doe', user_id: 'USR001', amount: 12500, date: '2023-10-15', status: 'COMPLETED', description: 'Gold Wealth Builder', sip_type: 'FIXED', metal_type: 'GOLD24K' },
    { id: 2, name: 'Jane Smith', user_id: 'USR002', amount: 5000, date: '2023-10-10', status: 'SETTLED', description: 'Silver Flexi Plan', sip_type: 'FLEXIBLE', metal_type: 'SILVER' },
    { id: 3, name: 'Robert Fox', user_id: 'USR003', amount: 25000, date: '2023-10-12', status: 'COMPLETED', description: 'Platinum Shield', sip_type: 'FIXED', metal_type: 'GOLD24K' },
    { id: 4, name: 'Sarah Lee', user_id: 'USR004', amount: 15400, date: '2023-10-05', status: 'SETTLED', description: 'Gold Saver', sip_type: 'FLEXIBLE', metal_type: 'GOLD22K' },
  ];

  const handleSettleSIP = async (sipId, sipType) => {
    if (!confirm('Are you sure you want to settle this SIP? This action cannot be undone.')) return;

    try {
      const response = await fetch('http://35.154.85.104:5000/api/admin/settlements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sip_id: sipId, sip_type: sipType })
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'SIP settled successfully!');
        fetchSettlements();
      } else {
        alert(data.message || 'Failed to settle SIP');
      }
    } catch (error) {
      console.error('Error settling SIP:', error);
      alert('Failed to settle SIP. Please check connection.');
    }
  };

  // Filter Logic based on User Request:
  // "Uncompleted" tab -> Shows Pending Settlements (status === 'COMPLETED')
  // "Completed" tab -> Shows Settled History (status === 'SETTLED')
  const filteredSettlements = settlements.filter(item => {
    if (activeTab === 'Uncompleted') return item.status === 'COMPLETED';
    if (activeTab === 'Completed') return item.status === 'SETTLED';
    return false;
  });

  if (!isClient) return null;

  return (
    <div className="w-full max-w-md mx-auto bg-[#F8FAFC] min-h-screen pb-28 font-sans relative">

      {/* Header */}
      <header className="bg-white px-6 pt-10 pb-8 rounded-b-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-0 z-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors">
              <ChevronLeft className="w-6 h-6 text-slate-800" />
            </button>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Settlements</h1>
          </div>
          <button
            onClick={fetchSettlements}
            className={`p-3 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 transition-all ${loading ? 'animate-spin' : ''}`}
          >
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-50 p-1.5 rounded-[1.2rem] flex relative">
          {['Uncompleted', 'Completed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 text-[10px] font-black uppercase tracking-wider ${activeTab === tab
                ? 'bg-white text-[#50C2C9] shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {tab === 'Uncompleted' && <Clock size={16} />}
              {tab === 'Completed' && <CheckCircle2 size={16} />}
              <span>{tab}</span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6 space-y-4">

        {loading && !filteredSettlements.length ? (
          // Skeleton Loader
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm animate-pulse space-y-3">
              <div className="flex justify-between">
                <div className="h-4 w-32 bg-slate-100 rounded"></div>
                <div className="h-4 w-16 bg-slate-100 rounded"></div>
              </div>
              <div className="h-8 w-24 bg-slate-100 rounded"></div>
              <div className="h-10 w-full bg-slate-100 rounded-xl mt-4"></div>
            </div>
          ))
        ) : filteredSettlements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="text-slate-400" size={32} />
            </div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Records Found</h3>
            <p className="text-xs text-slate-400 mt-2">There are no {activeTab.toLowerCase()} settlements.</p>
          </div>
        ) : (
          filteredSettlements.map((item) => (
            <div key={item.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50 animate-in slide-in-from-bottom-4 hover:shadow-lg transition-all duration-300">

              {/* Card Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white text-xs shadow-sm bg-gradient-to-br ${item.metal_type?.toUpperCase().includes('SILVER') ? 'from-slate-300 to-slate-400' : 'from-amber-300 to-yellow-500'
                    }`}>
                    {item.metal_type?.charAt(0) || 'G'}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-800 line-clamp-1">{item.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{item.sip_type} • {item.user_id}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${item.status === 'SETTLED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                  }`}>
                  {item.status}
                </span>
              </div>

              {/* Amount & Date */}
              <div className="flex justify-between items-end mb-6 pb-6 border-b border-slate-50">
                <div>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-wider mb-0.5">Maturity Amount</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tight">
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-wider mb-0.5">Date</p>
                  <p className="text-xs font-bold text-slate-500">{item.date}</p>
                </div>
              </div>

              {/* Action Button */}
              {activeTab === 'Uncompleted' && (
                <button
                  onClick={() => handleSettleSIP(item.sip_id, item.sip_type)}
                  disabled={apiError} // Disable in demo mode
                  className="w-full py-3.5 bg-[#50C2C9] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-lg shadow-[#50C2C9]/20 hover:bg-[#45b1b9] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  Settle Payment
                </button>
              )}

              {/* Status Message for Completed Tab */}
              {activeTab === 'Completed' && (
                <div className="w-full py-3 bg-slate-50 text-slate-400 rounded-[1.5rem] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-default">
                  <Check size={16} />
                  Settled on Server
                </div>
              )}
            </div>
          ))
        )}

        {apiError && (
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 mt-4">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-800">Demo Mode Active</p>
              <p className="text-[10px] text-amber-600 mt-0.5">Unable to connect to server. Showing sample data.</p>
            </div>
          </div>
        )}

      </main>

      {/* Navigation (Optional since it is Admin, but requested to match Home) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-4 pb-6 z-40 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
        <div className="max-w-md mx-auto w-full flex justify-between items-center px-2">
          {[
            { icon: <Home className="w-6 h-6" />, label: 'Home', href: '/Home', active: false },
            { icon: <LayoutDashboard className="w-6 h-6 text-[#50C2C9]" />, label: 'Admin', href: '/settlements', active: true },
            { icon: <User className="w-6 h-6" />, label: 'Profile', href: '/profile', active: false }
          ].map((item, i) => (
            <Link key={i} href={item.href} className="group flex flex-col items-center gap-1.5 min-w-[3.5rem] cursor-pointer" onClick={(e) => { if (item.active) e.preventDefault(); }}>
              <div className={`p-2.5 rounded-2xl transition-all duration-300 ${item.active
                ? 'bg-[#50C2C9] text-white shadow-lg shadow-[#50C2C9]/30 -translate-y-2'
                : 'bg-transparent text-slate-300 group-hover:text-slate-500'
                }`}>
                {item.active ? item.icon : item.icon}
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