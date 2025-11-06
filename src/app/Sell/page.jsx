'use client'; 
import React, { useState } from 'react';
import { ChevronLeft, Building2, Check, Scale, ArrowLeftRight, ShoppingCart, FileText } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const SellPage = () => {
  const [selectedMetal, setSelectedMetal] = useState('24k-995');
  const [grams, setGrams] = useState('');
  const [amount, setAmount] = useState('');
  const router = useRouter();

  const metals = [
    { id: '24k-995', name: 'Gold', purity: '24k-995', rate: 10170 },
    { id: '22k-916', name: 'Gold', purity: '22k-916', rate: 9560 },
    { id: '24k-999', name: 'Silver', purity: '24k-999', rate: 118 }
  ];

  const handleGramsChange = (value) => {
    setGrams(value);
    const selectedMetalData = metals.find(m => m.id === selectedMetal);
    if (selectedMetalData && value) {
      setAmount((parseFloat(value) * selectedMetalData.rate).toFixed(0));
    } else {
      setAmount('');
    }
  };

  const handleAmountChange = (value) => {
    setAmount(value);
    const selectedMetalData = metals.find(m => m.id === selectedMetal);
    if (selectedMetalData && value) {
      setGrams((parseFloat(value) / selectedMetalData.rate).toFixed(4));
    } else {
      setGrams('');
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100">
        <button className="mr-4" onClick={() => router.push('/Home')}>
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center mr-10">
          Sell
        </h1>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Metal Selection */}
        <div className="flex gap-2">
          {metals.map((metal) => (
            <button
              key={metal.id}
              onClick={() => setSelectedMetal(metal.id)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedMetal === metal.id
                  ? 'bg-[#50C2C9] text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              <div>{metal.name}</div>
              <div className="text-xs opacity-80">{metal.purity}</div>
            </button>
          ))}
        </div>

        {/* Current Balance Card */}
        <div className="bg-[#50C2C9] text-white rounded-lg p-6">
          <h3 className="text-lg font-medium mb-2">Current Balance</h3>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold">₹ 0.00</span>
            <span className="text-sm opacity-80 ml-2">(0.0000 gm)</span>
          </div>
        </div>

        {/* Sell Form */}
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-center mb-4">
            <span className="text-gray-700 font-medium">Sell GOLD</span>
            <span className="text-sm text-gray-500 ml-1">( 995.0 )</span>
            <div className="w-8 h-8 bg-yellow-400 rounded-full ml-2 flex items-center justify-center">
              <span className="text-yellow-800 font-bold text-sm">Au</span>
            </div>
          </div>

          {/* Input Fields */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Scale className="w-4 h-4" />
                Grams
              </label>
              <input
                type="number"
                value={grams}
                onChange={(e) => handleGramsChange(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#50C2C9] bg-white"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Amount
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="w-full p-3 pl-8 border-2 border-dashed border-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#50C2C9] bg-white"
                  placeholder="0"
                />
                <span className="absolute left-3 top-3 text-gray-600">₹</span>
              </div>
            </div>
          </div>

          {/* Conversion Icon */}
          <div className="flex justify-center mb-4">
            <ArrowLeftRight className="w-6 h-6 text-gray-400" />
          </div>

          {/* Security Note */}
          <div className="text-center text-xs text-gray-400 mb-4">
            🛡️ 100% Safe & Secured | Pure Gold
          </div>
        </div>

        {/* Bank Account Section */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#50C2C9] rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <span className="font-medium text-gray-800">Bank Account</span>
          </div>
          <div className="w-6 h-6 bg-[#50C2C9] rounded-full flex items-center justify-center">
            <Check className="w-4 h-4 text-white" />
          </div>
        </div>

        {/* Sell Button */}
        <button className="w-full bg-[#50C2C9] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#3caab0] transition-colors">
          Sell
        </button>
      </div>

      {/* Bottom Navigation */}
      {/* Bottom Navigation */}
<div className="border-t border-gray-200 bg-white">
  <div className="flex">
    <button className="flex-1 flex flex-col items-center py-4 text-[#50C2C9]">
      <ShoppingCart className="w-6 h-6 mb-1" />
      <span className="text-xs font-medium">Sell</span>
    </button>

    <Link href="/Sell_history" className="flex-1">
      <div className="flex flex-col items-center py-4 text-gray-400">
        <FileText className="w-6 h-6 mb-1" />
        <span className="text-xs font-medium">Sell History</span>
      </div>
    </Link>
  </div>
</div>


    </div>
  );
};

export default SellPage;
