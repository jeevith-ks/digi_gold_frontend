'use client';
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function StatementsPage() {
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch API on component mount
    const fetchPassbook = async () => {
      try {
        const response = await axios.get('/api/passbook');
        // Check if response data is null or empty
        if (!response.data || response.data.length === 0) {
          setTransactions(null);
        } else {
          setTransactions(response.data);
        }
      } catch (error) {
        console.error('Error fetching passbook:', error);
        setTransactions(null);
      } finally {
        setLoading(false);
      }
    };

    

    fetchPassbook();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-4">
          <button className="mr-4">
            <svg 
              className="w-6 h-6 text-gray-800" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M15 19l-7-7 7-7" 
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900" onClick={() => router.push('/Home')}>Statements</h1>
        </div>
      </div>

      {/* Main Content */}
      <div
        className="flex items-center justify-center px-4"
        style={{ minHeight: 'calc(100vh - 64px)' }}
      >
        {loading ? (
          <h2 className="text-xl text-gray-600 text-center">Loading...</h2>
        ) : transactions === null ? (
          <h2 className="text-2xl font-bold text-[#50c2c9] text-center">
            No Transactions So Far!
          </h2>
        ) : (
          <div className="w-full max-w-2xl bg-white shadow rounded-lg p-4">
            <h2 className="text-lg font-semibold mb-2 text-gray-800">Transaction History</h2>
            <ul>
              {transactions.map((txn, index) => (
                <li key={index} className="border-b py-2 text-gray-700">
                  <div className="flex justify-between">
                    <span>{txn.date}</span>
                    <span className="font-medium">{txn.amount}</span>
                  </div>
                  <div className="text-sm text-gray-500">{txn.description}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
