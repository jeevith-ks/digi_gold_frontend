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
        isCredit: isCredit, // Use category field instead of amount
        category: transaction.category, // Use actual category from API
        icon: getTransactionIcon(transaction),
        rawCategory: transaction.category, // Keep original for filtering
        transaction_type: transaction.transaction_type // Keep original type
      };
    });
  };

  const getTransactionType = (type) => {
    const types = {
      'ONLINE': 'Online Payment',
      'OFFLINE': 'Offline Payment',
      'SIP': 'SIP Payment',
      'PURCHASE': 'Gold Purchase',
      'REDEEM': 'Gold Redeem',
      'DEPOSIT': 'Deposit',
      'WITHDRAWAL': 'Withdrawal'
    };
    return types[type] || type;
  };

  const getTransactionDescription = (transaction) => {
    if (transaction.transaction_type === 'SIP') {
      return `SIP Installment - ${transaction.sip_type || 'Flexible'}`;
    }
    return transaction.transaction_type || 'Transaction';
  };

  const getTransactionIcon = (transaction) => {
    if (transaction.category === 'CREDIT') return '📥'; // Credit icon
    if (transaction.category === 'DEBIT') return '📤'; // Debit icon
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
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(Math.abs(amount));
  };

  // Filter transactions based on selected filter and search
  const filteredTransactions = transactions.filter(transaction => {
    // Filter by credit/debit
    const matchesFilter = filter === 'all' || 
      (filter === 'credit' && transaction.category === 'CREDIT') ||
      (filter === 'debit' && transaction.category === 'DEBIT');
    
    // Filter by search term
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.utr && transaction.utr.toLowerCase().includes(searchTerm.toLowerCase())) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Calculate summary - FIXED: Use category instead of isCredit
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center px-4 py-4">
          <button onClick={() => router.back()} className="mr-4">
            <ChevronLeft className="w-6 h-6 text-gray-800" />
          </button>
          <h1 className="text-xl font-bold text-gray-900 flex-1">Passbook</h1>
          <button className="p-2">
            <Download className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by description or UTR..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#50C2C9] focus:border-transparent text-sm md:text-base"
            />
          </div>
        </div>

        {/* Filter Tabs - KEPT EXACTLY AS BEFORE */}
        <div className="flex px-4 pb-2 space-x-2 overflow-x-auto">
          {[
            { key: 'all', label: 'All' },
            { key: 'credit', label: 'Credits' },
            { key: 'debit', label: 'Debits' }
          ].map((filterItem) => (
            <button
              key={filterItem.key}
              onClick={() => setFilter(filterItem.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === filterItem.key
                  ? 'bg-[#50C2C9] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {filterItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Balance Summary */}
      <div className="bg-white mx-4 my-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600 text-sm md:text-base">Net Balance</span>
            {/* CHANGED: Net Amount with Blue Background and White Text */}
            <div className={`px-4 py-2 rounded-lg ${
              netBalance >= 0 ? 'bg-[#50C2C9]' : 'bg-red-600'
            } text-white font-bold text-lg md:text-2xl`}>
              {formatCurrency(netBalance)}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-green-600 font-semibold text-base md:text-lg">{formatCurrency(totalCredits)}</div>
              <div className="text-gray-500 text-xs md:text-sm">Total Credits</div>
            </div>
            <div className="text-center">
              <div className="text-red-600 font-semibold text-base md:text-lg">{formatCurrency(totalDebits)}</div>
              <div className="text-gray-500 text-xs md:text-sm">Total Debits</div>
            </div>
          </div>
          
          {/* Filter Status */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Showing {filteredTransactions.length} of {transactions.length} transactions
              </span>
              {filter !== 'all' && (
                <span className="text-[#50C2C9] font-medium capitalize">
                  {filter} transactions
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 pb-20">
        {error ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-red-600 mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#50C2C9] text-white px-4 py-2 rounded-lg hover:bg-[#45b1b9] transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 md:w-24 md:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-[#50C2C9] mb-2">
              {transactions.length === 0 ? 'No Transactions Yet!' : 'No Matching Transactions'}
            </h2>
            <p className="text-gray-600 text-sm md:text-base">
              {transactions.length === 0 
                ? 'Your transaction history will appear here' 
                : `No ${filter !== 'all' ? filter : ''} transactions found matching your search`
              }
            </p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="mt-4 text-[#50C2C9] font-medium hover:underline"
              >
                Show all transactions
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Transactions ({filteredTransactions.length})
            </h3>
            
            {/* Grouped transactions by date */}
            {Object.entries(groupedTransactions).map(([date, dateTransactions]) => (
              <div key={date} className="space-y-3">
                <div className="sticky top-0 bg-blue-50 py-2 px-3 rounded-lg z-10">
                  <h4 className="text-sm font-semibold text-gray-700">{date}</h4>
                </div>
                
                {dateTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-3 md:p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          transaction.category === 'CREDIT' ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <span className="text-base md:text-lg">{transaction.icon}</span>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-gray-900 text-sm md:text-base truncate">
                              {transaction.description}
                            </h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs md:text-sm text-gray-500 mt-2">
                            <span>{transaction.time}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              transaction.category === 'CREDIT' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {transaction.category}
                            </span>
                            {transaction.utr && (
                              <span className="truncate max-w-[120px] md:max-w-none" title={`UTR: ${transaction.utr}`}>
                                UTR: {transaction.utr.substring(0, 6)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className={`text-base md:text-lg font-bold ${
                          transaction.category === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.category === 'CREDIT' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {transaction.type}
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional details */}
                    <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Type:</span> {transaction.transaction_type}
                        </div>
                        <div>
                          <span className="font-medium">ID:</span> {transaction.id.substring(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for Filter */}
      <div className="fixed bottom-6 right-6 z-20">
        <div className="relative">
          <button className="bg-[#50C2C9] text-white p-4 rounded-full shadow-lg hover:bg-[#45b1b9] transition-colors">
            <Filter className="w-6 h-6" />
          </button>
          
          {/* Filter badge if filter is active */}
          {filter !== 'all' && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center">
              {filter === 'credit' ? 'C' : 'D'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}