'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Download, Filter, Search } from 'lucide-react';

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

    return apiData.sipTransactions.map(transaction => ({
      id: transaction.tr_id,
      amount: transaction.transaction_amt,
      type: getTransactionType(transaction.transaction_type),
      status: transaction.transaction_status,
      description: getTransactionDescription(transaction),
      date: formatDate(transaction.transaction_datetime),
      time: formatTime(transaction.transaction_datetime),
      utr: transaction.utr_no,
      isCredit: transaction.transaction_amt > 0,
      category: getTransactionCategory(transaction),
      icon: getTransactionIcon(transaction)
    }));
  };

  const getTransactionType = (type) => {
    const types = {
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

  const getTransactionCategory = (transaction) => {
    if (transaction.transaction_type === 'SIP') return 'investment';
    if (transaction.transaction_amt > 0) return 'credit';
    return 'debit';
  };

  const getTransactionIcon = (transaction) => {
    if (transaction.transaction_type === 'SIP') return '💳';
    if (transaction.transaction_amt > 0) return '📥';
    return '📤';
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
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filter transactions based on selected filter and search
  const filteredTransactions = transactions.filter(transaction => {
    const matchesFilter = filter === 'all' || 
      (filter === 'credit' && transaction.isCredit) ||
      (filter === 'debit' && !transaction.isCredit);
    
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.utr?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  // Calculate summary
  const totalCredits = transactions
    .filter(t => t.isCredit)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalDebits = transactions
    .filter(t => !t.isCredit)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const netBalance = totalCredits - totalDebits;

  const getStatusColor = (status) => {
    switch (status) {
      case 'SUCCESS': return 'text-green-600 bg-green-50';
      case 'PENDING': return 'text-yellow-600 bg-yellow-50';
      case 'FAILED': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#50C2C9] focus:border-transparent"
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex px-4 pb-2 space-x-2">
          {['all', 'credit', 'debit'].map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize ${
                filter === filterType
                  ? 'bg-[#50C2C9] text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {filterType === 'all' ? 'All' : filterType + 's'}
            </button>
          ))}
        </div>
      </div>

      {/* Balance Summary */}
      <div className="bg-white mx-4 my-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Net Balance</span>
            <span className="text-2xl font-bold text-gray-900">
              {formatCurrency(netBalance)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-green-600 font-semibold">{formatCurrency(totalCredits)}</div>
              <div className="text-gray-500">Total Credits</div>
            </div>
            <div className="text-center">
              <div className="text-red-600 font-semibold">{formatCurrency(totalDebits)}</div>
              <div className="text-gray-500">Total Debits</div>
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
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📊</span>
            </div>
            <h2 className="text-2xl font-bold text-[#50C2C9] mb-2">
              {transactions.length === 0 ? 'No Transactions Yet!' : 'No Matching Transactions'}
            </h2>
            <p className="text-gray-600">
              {transactions.length === 0 
                ? 'Your transaction history will appear here' 
                : 'Try changing your search or filter'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Recent Transactions ({filteredTransactions.length})
            </h3>
            
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-lg">{transaction.icon}</span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">
                          {transaction.description}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                          {transaction.status}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{transaction.date}</span>
                        <span>{transaction.time}</span>
                        {transaction.utr && (
                          <span className="truncate">UTR: {transaction.utr}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className={`text-lg font-bold ${
                      transaction.isCredit ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.isCredit ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                    </div>
                    <div className="text-xs text-gray-500 capitalize">
                      {transaction.category}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <button className="bg-[#50C2C9] text-white p-4 rounded-full shadow-lg hover:bg-[#45b1b9] transition-colors">
          <Filter className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
