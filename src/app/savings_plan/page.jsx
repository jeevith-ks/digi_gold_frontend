"use client";   // 👈 must be first line

import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SIPPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('New SIP');

  const sipPlans = [
    {
      id: 1,
      name: 'SWARN SANCHAY YOJNA (22KT)',
      type: 'Money SIP',
      range: '12 Months',
      investMin: '2,000.0',
      investMax: '49,999.0',
      color: 'bg-[#50C2C9]',
      redirect: '/Sip_card_details',
    },
    {
      id: 2,
      name: 'KUBER YOJNA (24KT)',
      type: 'Metal SIP',
      range: '12 Months',
      investMin: '1,000.0',
      investMax: '49,999.0',
      color: 'bg-[#50C2C9]',
      redirect: '/Sip_card_details',
    },
  ];

  return (
    <div className="w-full max-w-sm mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100">
        <button className="mr-4" onClick={() => router.push('/sip')}>
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center mr-10">
          SIP
        </h1>
      </div>

      {/* Tab Navigation */}
      <div className="px-4 py-4">
        <div className="flex">
          <button
            onClick={() => setActiveTab('All')}
            className={`flex-1 text-center py-2 text-sm font-medium ${
              activeTab === 'All'
                ? 'text-gray-800 border-b-2 border-gray-400'
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
      </div>

      {/* SIP Plans */}
      <div className="flex-1 px-4 space-y-4">
        {sipPlans.map((plan) => (
          <div
            key={plan.id}
            onClick={() => router.push(plan.redirect)}
            className={`${plan.color} text-white rounded-lg p-4 cursor-pointer hover:opacity-90 transition-opacity`}
          >
            <div className="mb-4">
              <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
              <div className="bg-black bg-opacity-20 inline-block px-3 py-1 rounded-full">
                <span className="text-sm font-medium">{plan.type}</span>
              </div>
            </div>

            <div className="border-t border-white border-opacity-30 pt-3 space-y-2">
              <div className="flex items-center">
                <span className="text-sm">• Range : </span>
                <span className="text-sm font-medium ml-1">{plan.range}</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm">• Invest : </span>
                <span className="text-sm font-medium ml-1">
                  {plan.investMin} Rs - {plan.investMax} Rs
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Spacer */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default SIPPage;
