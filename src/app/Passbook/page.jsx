'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronLeft, Download, Filter, Search, X, ArrowUpRight, ArrowDownLeft, Wallet, Calendar, Clock, CreditCard, Home, Bell, PiggyBank, User } from 'lucide-react';

export default function StatementsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, credit, debit
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('authToken');

        if (!token) {
          setError('Authentication required');
          return;
        }

        const response = await fetch('http://35.154.85.104:5000/api/transactions/', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Transactions data:', data);

          // Transform the data to match our frontend structure
          const transformedTransactions = transformTransactionData(data);
          setTransactions(transformedTransactions);
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Failed to fetch transactions');
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
        setError('Network error while fetching transactions');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Transform API data to frontend format
  const transformTransactionData = (apiData) => {
    if (!apiData.sipTransactions || !Array.isArray(apiData.sipTransactions)) {
      return [];
    }

    return apiData.sipTransactions.map(transaction => {
      // Convert string amount to number
      const amount = parseFloat(transaction.transaction_amt) || 0;

      // Determine if it's credit or debit based on category field
      const isCredit = transaction.category === 'CREDIT';

      return {
        id: transaction.tr_id,
        amount: amount,
        type: getTransactionType(transaction.transaction_type),
        status: transaction.transaction_status,
        description: getTransactionDescription(transaction),
        date: formatDate(transaction.transaction_datetime),
        time: formatTime(transaction.transaction_datetime),
        utr: transaction.utr_no,
        isCredit: isCredit,
        category: transaction.category,
        icon: getTransactionIcon(transaction),
        rawCategory: transaction.category,
        transaction_type: transaction.transaction_type
      };
    });
  };

  const getTransactionType = (type) => {
    const types = {
      'ONLINE': 'Online',
      'OFFLINE': 'Offline',
      'SIP': 'SIP',
      'PURCHASE': 'Purchase',
      'REDEEM': 'Redeem',
      'DEPOSIT': 'Deposit',
      'WITHDRAWAL': 'Withdrawal'
    };
    return types[type] || type;
  };

  const getTransactionDescription = (transaction) => {
    if (transaction.transaction_type === 'SIP') {
      return `SIP - ${transaction.sip_type || 'Flexible'}`;
    }
    return transaction.transaction_type || 'Transaction';
  };

  const getTransactionIcon = (transaction) => {
    if (transaction.category === 'CREDIT') return '📥';
    if (transaction.category === 'DEBIT') return '📤';
    if (transaction.transaction_type === 'SIP') return '💳';
    return '💰';
  };

  const formatDate = (dateString, full = false) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (full) {
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    }
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).toLowerCase();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
  };

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filter === 'all' ||
      (filter === 'credit' && transaction.category === 'CREDIT') ||
      (filter === 'debit' && transaction.category === 'DEBIT');

    const matchesSearch =
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.utr && transaction.utr.toLowerCase().includes(searchTerm.toLowerCase())) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Calculate summary
  const totalCredits = transactions
    .filter(t => t.category === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDebits = transactions
    .filter(t => t.category === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0);

  const netBalance = totalCredits - totalDebits;

  // Group transactions by date
  const groupTransactionsByDate = () => {
    const grouped = {};

    filteredTransactions.forEach(transaction => {
      const dateKey = transaction.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(transaction);
    });

    return grouped;
  };

  const groupedTransactions = groupTransactionsByDate();

  if (loading) {
    return (
      <div className="w-full max-w-md mx-auto bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#50C2C9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Passbook...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-[#F8FAFC] min-h-screen pb-24 font-sans relative">
      {/* Header */}
      <header className="bg-white px-6 pt-10 pb-8 rounded-b-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-0 z-20">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-800" />
          </button>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Passbook</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setIsSearchActive(!isSearchActive)}
              className={`p-3 rounded-2xl transition-colors ${isSearchActive ? 'bg-[#50C2C9] text-white shadow-lg shadow-[#50C2C9]/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              <Search size={20} />
            </button>
          </div>
        </div>

        {/* Search Input */}
        {isSearchActive && (
          <div className="mb-6 animate-in slide-in-from-top-2">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search transactions, UTR..."
                className="w-full pl-10 pr-4 py-4 bg-slate-50 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 ring-[#50C2C9]/20 transition-all placeholder:text-slate-300 placeholder:font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 bg-slate-200 rounded-full text-slate-500 hover:bg-slate-300"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Balance Card */}
        <div className="bg-slate-900 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#50C2C9]/20 rounded-full -mr-10 -mt-10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#50C2C9]/10 rounded-full -ml-8 -mb-8 blur-xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <Wallet className="w-4 h-4 text-[#50C2C9]" />
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Net Balance</span>
            </div>
            <div className="text-3xl font-black text-white mb-6">
              {formatCurrency(netBalance)}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <ArrowDownLeft size={10} className="text-emerald-400" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Credits</span>
                </div>
                <p className="text-sm font-black text-emerald-400">{formatCurrency(totalCredits)}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 backdrop-blur-sm border border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-4 rounded-full bg-rose-500/20 flex items-center justify-center">
                    <ArrowUpRight size={10} className="text-rose-400" />
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Debits</span>
                </div>
                <p className="text-sm font-black text-rose-400">{formatCurrency(totalDebits)}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="px-6 py-4 overflow-x-auto scrollbar-hide">
        <div className="flex space-x-2">
          {[
            { key: 'all', label: 'All Transactions' },
            { key: 'credit', label: 'Credits' },
            { key: 'debit', label: 'Debits' }
          ].map((filterItem) => (
            <button
              key={filterItem.key}
              onClick={() => setFilter(filterItem.key)}
              className={`px-5 py-2.5 rounded-[1rem] text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${filter === filterItem.key
                ? 'bg-[#50C2C9] text-white shadow-lg shadow-[#50C2C9]/30'
                : 'bg-white text-slate-400 hover:text-slate-600 border border-slate-100'
                }`}
            >
              {filterItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List */}
      <main className="px-6 pb-6 space-y-6">
        {error ? (
          <div className="text-center py-12 bg-white rounded-[2rem] shadow-sm border border-rose-100">
            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-rose-500" />
            </div>
            <p className="text-rose-500 text-sm font-bold mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
            >
              Try Again
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-8 h-8 text-slate-300" />
            </div>
            <h2 className="text-lg font-black text-slate-800 mb-2">
              No Transactions Found
            </h2>
            <p className="text-xs font-medium text-slate-400 max-w-[200px] mx-auto leading-relaxed">
              {searchTerm
                ? "We couldn't find any transactions matching your search."
                : "You haven't made any transactions yet."}
            </p>
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setFilter('all'); }}
                className="mt-6 text-[#50C2C9] text-xs font-black uppercase tracking-wider hover:text-[#45b1b9]"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
            <div key={date} className="animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-px flex-1 bg-slate-200"></span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-[#F8FAFC] px-2">{date}</span>
                <span className="h-px flex-1 bg-slate-200"></span>
              </div>

              <div className="space-y-3">
                {dateTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-slate-50 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${transaction.category === 'CREDIT'
                        ? 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100'
                        : 'bg-rose-50 text-rose-500 group-hover:bg-rose-100'
                        }`}>
                        {transaction.category === 'CREDIT' ? <ArrowDownLeft size={20} strokeWidth={2.5} /> : <ArrowUpRight size={20} strokeWidth={2.5} />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-black text-slate-800 truncate pr-2">
                            {transaction.description}
                          </h4>
                          <span className={`text-sm font-black whitespace-nowrap ${transaction.category === 'CREDIT' ? 'text-emerald-500' : 'text-slate-800'
                            }`}>
                            {transaction.category === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider ${transaction.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
                              transaction.status === 'PENDING' ? 'bg-amber-50 text-amber-600' :
                                'bg-rose-50 text-rose-600'
                              }`}>
                              {transaction.status}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock size={10} /> {transaction.time}
                            </span>
                          </div>

                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {transaction.type}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expandable details (optional or just visible UTR) */}
                    {(transaction.utr || transaction.id) && (
                      <div className="mt-3 pt-3 border-t border-slate-50 flex flex-col gap-1">
                        <div className="flex justify-between items-center text-[9px] text-slate-400 font-medium">
                          <span>Ref ID: <span className="font-mono text-slate-500">{transaction.id.slice(0, 10)}...</span></span>
                          {transaction.utr && (
                            <span>UTR: <span className="font-mono text-slate-500">{transaction.utr.slice(0, 15)}...</span></span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </main>

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

              {active && (
                <div className="absolute -bottom-4 w-8 h-1 bg-[#50C2C9] rounded-t-full"></div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
}