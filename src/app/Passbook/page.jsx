'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Download, Filter, Search, X } from 'lucide-react';

export default function StatementsPage() {
  const router = useRouter();
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

        const response = await fetch('http://localhost:5000/api/transactions/', {
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600 bg-green-50';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'FAILED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

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
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="flex items-center px-4 py-4">
            <button onClick={() => router.back()} className="mr-4">
              <ChevronLeft className="w-6 h-6 text-gray-800" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Passbook</h1>
          </div>
        </div>
        
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#50C2C9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your transactions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header - Mobile Optimized */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        {/* Main Header */}
        <div className="flex items-center px-4 py-3">
          <button onClick={() => router.back()} className="mr-3 p-1">
            <ChevronLeft className="w-5 h-5 text-gray-800" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">Passbook</h1>
          <div className="flex items-center space-x-2">
            {isSearchActive ? (
              <button onClick={() => setIsSearchActive(false)} className="p-1">
                <X className="w-5 h-5 text-gray-600" />
              </button>
            ) : (
              <>
                <button onClick={() => setIsSearchActive(true)} className="p-1">
                  <Search className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-1">
                  <Download className="w-5 h-5 text-gray-600" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search Bar - Conditional Render for Mobile */}
        {isSearchActive ? (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by description or UTR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#50C2C9] focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        ) : (
          <div className="px-4 pb-3 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by description or UTR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#50C2C9] focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Filter Tabs - Mobile Optimized */}
        <div className="flex px-4 pb-3 overflow-x-auto scrollbar-hide -mx-4">
          <div className="flex space-x-2 px-4">
            {[
              { key: 'all', label: 'All Transactions' },
              { key: 'credit', label: 'Credits' },
              { key: 'debit', label: 'Debits' }
            ].map((filterItem) => (
              <button
                key={filterItem.key}
                onClick={() => setFilter(filterItem.key)}
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  filter === filterItem.key
                    ? 'bg-[#50C2C9] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filterItem.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Balance Summary - Mobile Optimized */}
      <div className="bg-white mx-4 my-4 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col space-y-4">
            {/* Net Balance */}
            <div className="flex flex-col space-y-2">
              <span className="text-gray-600 text-sm">Net Balance</span>
              <div className={`px-4 py-3 rounded-lg text-center ${
                netBalance >= 0 ? 'bg-[#50C2C9]' : 'bg-red-600'
              } text-white font-bold text-xl md:text-2xl`}>
                {formatCurrency(netBalance)}
              </div>
            </div>

            {/* Credits & Debits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-green-600 font-bold text-lg">{formatCurrency(totalCredits)}</div>
                <div className="text-gray-500 text-xs mt-1">Total Credits</div>
              </div>
              <div className="text-center">
                <div className="text-red-600 font-bold text-lg">{formatCurrency(totalDebits)}</div>
                <div className="text-gray-500 text-xs mt-1">Total Debits</div>
              </div>
            </div>
            
            {/* Transaction Count */}
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  Showing {filteredTransactions.length} of {transactions.length} transactions
                </span>
                {filter !== 'all' && (
                  <span className="text-[#50C2C9] font-medium capitalize px-2 py-1 bg-blue-50 rounded">
                    {filter}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Mobile Optimized */}
      <div className="px-4 pb-20">
        {error ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-red-600 mb-2 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#50C2C9] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#45b1b9] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h2 className="text-lg font-bold text-[#50C2C9] mb-2">
              {transactions.length === 0 ? 'No Transactions Yet!' : 'No Matching Transactions'}
            </h2>
            <p className="text-gray-600 text-sm">
              {transactions.length === 0 
                ? 'Your transaction history will appear here' 
                : `No ${filter !== 'all' ? filter : ''} transactions found matching your search`
              }
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-3 text-[#50C2C9] text-sm font-medium hover:underline"
              >
                Show all transactions
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-gray-900">
              Recent Transactions ({filteredTransactions.length})
            </h3>
            
            {/* Grouped transactions by date */}
            {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
              <div key={date} className="space-y-3">
                {/* Date Header - Mobile Optimized */}
                <div className="sticky top-0 bg-blue-50 py-2 px-3 rounded-lg z-10 -mx-2">
                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">{date}</h4>
                </div>
                
                {/* Transactions List */}
                <div className="space-y-2">
                  {dateTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      <div className="p-3">
                        {/* Top Row: Icon, Description, Amount */}
                        <div className="flex items-start gap-3">
                          {/* Icon */}
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            transaction.category === 'CREDIT' 
                              ? 'bg-green-50 border border-green-100' 
                              : 'bg-red-50 border border-red-100'
                          }`}>
                            <span className="text-lg">{transaction.icon}</span>
                          </div>
                          
                          {/* Main Content */}
                          <div className="flex-1 min-w-0">
                            {/* Description and Status */}
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-medium text-gray-900 text-sm truncate pr-2">
                                {transaction.description}
                              </h4>
                              <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(transaction.status)}`}>
                                {transaction.status}
                              </div>
                            </div>
                            
                            {/* Time and Type */}
                            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                              <span>{transaction.time}</span>
                              <span className={`px-2 py-0.5 rounded ${
                                transaction.category === 'CREDIT' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {transaction.category}
                              </span>
                              <span className="text-gray-400">{transaction.type}</span>
                            </div>
                            
                            {/* Amount */}
                            <div className={`text-lg font-bold ${
                              transaction.category === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.category === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </div>
                          </div>
                        </div>
                        
                        {/* Bottom Row: Transaction Details - Hidden on mobile by default */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div className="truncate">
                              <span className="font-medium">Type:</span> {transaction.transaction_type}
                            </div>
                            <div className="truncate">
                              <span className="font-medium">ID:</span> {transaction.id.substring(0, 8)}...
                            </div>
                            {transaction.utr && (
                              <div className="col-span-2 truncate">
                                <span className="font-medium">UTR:</span> {transaction.utr.substring(0, 20)}...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Filter FAB - Only show when search is not active */}
      {!isSearchActive && (
        <div className="fixed bottom-4 right-4 z-20 md:hidden">
          <div className="relative">
            <button 
              onClick={() => setFilter(prev => prev === 'all' ? 'credit' : prev === 'credit' ? 'debit' : 'all')}
              className="bg-[#50C2C9] text-white p-3 rounded-full shadow-lg hover:bg-[#45b1b9] transition-all active:scale-95"
            >
              <Filter className="w-5 h-5" />
            </button>
            
            {/* Filter badge */}
            {filter !== 'all' && (
              <div className="absolute -top-1 -right-1 bg-white border-2 border-[#50C2C9] text-[#50C2C9] text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {filter === 'credit' ? 'C' : 'D'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}