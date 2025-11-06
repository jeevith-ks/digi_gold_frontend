'use client';
import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

const SIPPage = () => {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <div className="w-full max-w-md mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100">
        <button className="mr-4">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center mr-10">
          SIP
        </h1>
      </div>

      {/* Tabs */}
      {/* <div className="px-4 py-2">
        <div className="flex">
          <button
            onClick={() => setActiveTab('All')}
            className={`flex-1 text-center py-2 text-sm font-medium ${
              activeTab === 'All'
                ? 'text-[#50C2C9] border-b-2 border-[#50C2C9]'
                : 'text-gray-500'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('New SIP')}
            className={`flex-1 text-center py-2 text-sm font-medium ${
              activeTab === 'New SIP'
                ? 'text-[#50C2C9] border-b-2 border-[#50C2C9]'
                : 'text-gray-500'
            }`}
          >
            New SIP
          </button>
        </div>
      </div> */}

      {/* Empty State */}
      <div className="flex-1 flex items-center justify-center px-6">
        <p className="text-lg font-semibold text-[#50C2C9] text-center">
          No SIP plans found!
        </p>
      </div>
    </div>
  );
};

export default SIPPage;
