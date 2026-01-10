'use client';

import React, { useState } from 'react';
import { ChevronLeft, Wallet, Shield, Award, ArrowRight, Clock, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BottomNavigation from '../../components/BottomNavigation';
import '../home-enhanced.css';

const SIPPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('New SIP');

  const sipPlans = [
    {
      id: 1,
      name: 'SWARN SANCHAY YOJNA',
      metal: 'GOLD 22KT',
      type: 'Money SIP',
      duration: '12 Months',
      minInvest: '2,000',
      maxInvest: '49,999',
      features: ['Fixed Monthly Amount', 'Guaranteed Gold', 'Bonus on Maturity'],
      icon: <Wallet className="w-6 h-6" />,
      gradient: 'from-[#50C2C9] to-[#2D8A94]',
      redirect: '/Sip_card_details',
    },
    {
      id: 2,
      name: 'KUBER YOJNA',
      metal: 'GOLD 24KT',
      type: 'Metal SIP',
      duration: '12 Months',
      minInvest: '1,000',
      maxInvest: '49,999',
      features: ['Buy Pure Gold', 'Market Rate prices', 'Secure Storage'],
      icon: <Award className="w-6 h-6" />,
      gradient: 'from-[#2D8A94] to-[#1A5F66]',
      redirect: '/Sip_card_details',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans selection:bg-[#50C2C9] selection:text-white">
      {/* Premium Header */}
      <div className="bg-white sticky top-0 z-10 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] backdrop-blur-xl bg-white/90">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/Home')}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors group"
          >
            <ChevronLeft className="w-6 h-6 text-gray-500 group-hover:text-gray-800" />
          </button>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#50C2C9] to-[#2D8A94]">
            Investment Plans
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>

        {/* Custom Tab Navigation */}
        <div className="max-w-md mx-auto px-4 pb-2">
          <div className="flex p-1 bg-gray-100 rounded-xl relative">
            {/* Animated Background Slider */}
            <div
              className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-lg shadow-sm transition-all duration-300 ease-out ${activeTab === 'All' ? 'left-1' : 'left-[calc(50%+2px)]'}`}
            />

            <button
              onClick={() => setActiveTab('All')}
              className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors ${activeTab === 'All' ? 'text-[#2D8A94]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All Plans
            </button>
            <button
              onClick={() => setActiveTab('New SIP')}
              className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors ${activeTab === 'New SIP' ? 'text-[#2D8A94]' : 'text-gray-500 hover:text-gray-700'}`}
            >
              New SIP
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">

        {/* Info Banner */}
        <div className="bg-[#50C2C9]/10 rounded-2xl p-4 flex items-start gap-3 border border-[#50C2C9]/20">
          <Info className="w-5 h-5 text-[#2D8A94] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-[#2D8A94]">Why Start an SIP?</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Systematic Investment Plans help you accumulate wealth over time with small monthly investments.
            </p>
          </div>
        </div>

        {/* SIP Plans List */}
        <div className="space-y-5">
          {sipPlans.map((plan) => (
            <div
              key={plan.id}
              onClick={() => router.push(plan.redirect)}
              className="group relative bg-white rounded-3xl p-1 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden"
            >
              {/* Card Content Container */}
              <div className="relative z-10 bg-white rounded-[20px] p-5 h-full overflow-hidden">
                {/* Decorative Background */}
                <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${plan.gradient} opacity-10 rounded-bl-full -mr-8 -mt-8`} />

                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white shadow-lg`}>
                    {plan.icon}
                  </div>
                  <span className="px-3 py-1 bg-gray-50 rounded-full text-xs font-bold text-gray-500 border border-gray-100">
                    {plan.type}
                  </span>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-black text-gray-900 leading-tight mb-1">{plan.name}</h3>
                  <p className={`text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r ${plan.gradient}`}>
                    {plan.metal}
                  </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="bg-gray-50 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Duration</span>
                    <div className="flex items-center gap-1.5 text-gray-900 font-bold text-sm">
                      <Clock className="w-3.5 h-3.5 text-[#50C2C9]" />
                      {plan.duration}
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-2.5">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Investment</span>
                    <div className="font-bold text-sm text-gray-900">
                      ₹{plan.minInvest} - {plan.maxInvest}
                    </div>
                  </div>
                </div>

                {/* Feature List */}
                <div className="space-y-2 mb-5">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs font-medium text-gray-500">
                      <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${plan.gradient}`} />
                      {feature}
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 group/btn">
                  <span className="text-xs font-bold text-gray-400">View Plan Details</span>
                  <div className={`w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center transition-all group-hover/btn:bg-[#50C2C9] group-hover/btn:text-white`}>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Gradient Border Effect on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`} />
            </div>
          ))}
        </div>

        {/* Secure & Safe Badge */}
        <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-medium py-4">
          <Shield className="w-4 h-4" />
          100% Secure & Insured Vaults
        </div>

        <div className="h-20"></div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default SIPPage;
