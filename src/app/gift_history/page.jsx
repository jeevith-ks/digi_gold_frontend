'use client';
import React, { useState } from 'react';
import { ChevronLeft, Gift, FileText } from 'lucide-react';
import Link from 'next/link';

const GiftHistoryPage = () => {
  const [activeFilter, setActiveFilter] = useState('All');
  
  const filters = [
    { id: 'All', label: 'All' },
    { id: '24k-995', label: 'Gold', sublabel: '24k-995' },
    { id: '22k-916', label: 'Gold', sublabel: '22k-916' }
  ];

  return (
    <div className="w-full max-w-sm mx-auto bg-white min-h-screen flex flex-col">
      

      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100">
        <button className="mr-4">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center mr-10">
          Gift History
        </h1>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-4">
        <div className="flex gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeFilter === filter.id
                  ? 'text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              style={{
                backgroundColor: activeFilter === filter.id ? '#50C2C9' : ''
              }}
            >
              <div>{filter.label}</div>
              {filter.sublabel && (
                <div className="text-xs opacity-80">{filter.sublabel}</div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Empty State */}
      <div className="flex-1 flex flex-col justify-center items-center px-8">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto"
               style={{ backgroundColor: '#50C2C920' }}>
            <FileText className="w-8 h-8" style={{ color: '#50C2C9' }} />
          </div>
          <h3 className="text-xl font-semibold mb-2"
              style={{ color: '#50C2C9' }}>
            No Transactions So Far!
          </h3>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 bg-white">
        <div className="flex">
          <Link  href='/gifts'className="flex-1 flex flex-col items-center py-4"
                  style={{ color: '#50C2C9' }}>
            <Gift className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Gift</span>
          </Link>
          <button className="flex-1 flex flex-col items-center py-4"
                  style={{ color: '#50C2C9' }}>
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Gift History</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiftHistoryPage;