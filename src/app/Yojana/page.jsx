'use client';

import React, { useState } from 'react';
import { ChevronLeft, Wallet, Shield, Award, ArrowRight, Clock, Info, Banknote, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';
import BottomNavigation from '../../components/BottomNavigation';
import '../home-enhanced.css';

const SIPPage = () => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('New SIP');

    const sipPlans = [
        {
            id: 1,
            name: 'LAKSHMI YOJNA',
            metal: 'GOLD 22KT',
            type: 'Money SIP',
            duration: '12 Months',
            minInvest: '2,000',
            maxInvest: '49,999',
            features: ['Fixed Monthly Amount', 'Guaranteed Money', 'Bonus on Maturity'],
            icon: <Banknote className="w-6 h-6" />,
            gradient: 'from-[#50C2C9] to-[#2D8A94]',
            redirect: '/sip_money_details',
            popular: true
        },
        {
            id: 2,
            name: 'KUBER YOJNA',
            metal: 'GOLD 24KT',
            type: 'Metal SIP',
            duration: '12 Months',
            minInvest: '1,000',
            maxInvest: '49,999',
            features: ['Buy Pure Gold', 'Market Rate prices', 'Guaranteed Gold', 'Secure Storage'],
            icon: <Award className="w-6 h-6" />,
            gradient: 'from-[#2D8A94] to-[#1A5F66]',
            redirect: '/Sip_card_details',
            popular: false
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans selection:bg-[#50C2C9] selection:text-white pb-24">
            {/* Premium Header */}
            <div className="bg-white sticky top-0 z-20 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] backdrop-blur-xl bg-white/90">
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
                    <div className="w-10" />
                </div>

                {/* Custom Tab Navigation */}
                <div className="max-w-md mx-auto px-4 pb-4">
                    <div className="flex p-1.5 bg-gray-100/80 rounded-2xl relative">
                        {/* Animated Background Slider */}
                        <div
                            className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white rounded-xl shadow-sm transition-all duration-300 ease-out ${activeTab === 'All' ? 'left-1.5' : 'left-[calc(50%+3px)]'}`}
                        />

                        <button
                            onClick={() => setActiveTab('All')}
                            className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors ${activeTab === 'All' ? 'text-[#2D8A94]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <TrendingUp className="w-4 h-4" />
                                All Plans
                            </span>
                        </button>
                        <button
                            onClick={() => setActiveTab('New SIP')}
                            className={`flex-1 relative z-10 py-2.5 text-sm font-bold transition-colors ${activeTab === 'New SIP' ? 'text-[#2D8A94]' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Wallet className="w-4 h-4" />
                                New SIP
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-6 space-y-6">

                {/* Info Banner */}
                <div className="bg-gradient-to-r from-[#50C2C9]/10 to-[#2D8A94]/10 rounded-2xl p-5 flex items-start gap-4 border border-[#50C2C9]/20 shadow-sm">
                    <div className="p-2 bg-white rounded-full shadow-sm shrink-0">
                        <Info className="w-5 h-5 text-[#2D8A94]" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-[#2D8A94] mb-1">Why Start an SIP?</h3>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                            Systematic Investment Plans help you accumulate wealth over time with small, disciplined monthly investments.
                        </p>
                    </div>
                </div>

                {/* SIP Plans List */}
                <div className="space-y-6">
                    {sipPlans.map((plan) => (
                        <div
                            key={plan.id}
                            onClick={() => router.push(plan.redirect)}
                            className="group relative bg-white rounded-[2rem] p-1 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-100 overflow-hidden"
                        >
                            {/* Card Content Container */}
                            <div className="relative z-10 bg-white rounded-[1.8rem] p-6 h-full overflow-hidden">
                                {/* Decorative Background */}
                                <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${plan.gradient} opacity-[0.08] rounded-bl-[100px] -mr-10 -mt-10 transition-transform group-hover:scale-110 duration-500`} />

                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center text-white shadow-lg group-hover:shadow-[0_8px_20px_-6px_rgba(80,194,201,0.4)] transition-shadow duration-300`}>
                                        {plan.icon}
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        {plan.popular && (
                                            <span className="px-3 py-1 bg-gradient-to-r from-amber-200 to-amber-100 text-[10px] font-bold text-amber-800 rounded-full shadow-sm uppercase tracking-wider">
                                                Most Popular
                                            </span>
                                        )}
                                        <span className="px-3 py-1 bg-gray-50 rounded-full text-xs font-bold text-gray-500 border border-gray-100">
                                            {plan.type}
                                        </span>
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <h3 className="text-lg font-black text-gray-900 leading-tight mb-2 group-hover:text-[#2D8A94] transition-colors">{plan.name}</h3>
                                    <p className={`text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r ${plan.gradient} w-fit`}>
                                        {plan.metal}
                                    </p>
                                </div>

                                {/* Features Grid */}
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100/50">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Duration</span>
                                        <div className="flex items-center gap-1.5 text-gray-900 font-bold text-sm">
                                            <Clock className="w-3.5 h-3.5 text-[#50C2C9]" />
                                            {plan.duration}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50/80 rounded-2xl p-3 border border-gray-100/50">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Min Investment</span>
                                        <div className="font-bold text-sm text-gray-900">
                                            ₹{plan.minInvest}
                                        </div>
                                    </div>
                                </div>

                                {/* Feature List */}
                                <div className="space-y-3 mb-6 p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
                                    {plan.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-3 text-xs font-semibold text-gray-600">
                                            <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${plan.gradient} shadow-sm`} />
                                            {feature}
                                        </div>
                                    ))}
                                </div>

                                {/* CTA Button */}
                                <div className="flex items-center justify-between pt-2 group/btn">
                                    <span className="text-xs font-bold text-gray-400 group-hover:text-[#2D8A94] transition-colors">View Plan Details</span>
                                    <div className={`w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center transition-all duration-300 group-hover:bg-gradient-to-r ${plan.gradient} group-hover:text-white group-hover:shadow-lg group-hover:scale-110`}>
                                        <ArrowRight className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            {/* Gradient Border Effect on Hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10`} />
                        </div>
                    ))}
                </div>

                {/* Secure & Safe Badge */}
                <div className="flex items-center justify-center gap-2 text-gray-400 text-xs font-medium py-6 opacity-70">
                    <Shield className="w-4 h-4" />
                    <span>100% Secure & Insured Vaults</span>
                </div>
            </div>
            <BottomNavigation />
        </div>
    );
};

export default SIPPage;