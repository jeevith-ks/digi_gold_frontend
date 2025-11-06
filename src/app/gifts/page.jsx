'use client';
import React, { useState } from 'react';
import { ChevronLeft, Scale, Gift, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation'; // ✅ useRouter for navigation

const GiftPage = () => {
  const router = useRouter();
  const [selectedMetal, setSelectedMetal] = useState('24k-995');
  const [grams, setGrams] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [message, setMessage] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const metals = [
    { id: '24k-995', name: 'Gold', purity: '24k-995', rate: 10170 },
    { id: '22k-916', name: 'Gold', purity: '22k-916', rate: 9560 },
    { id: '24k-999', name: 'Silver', purity: '24k-999', rate: 118 }
  ];

  const handleGenerateOtp = () => {
    if (recipientEmail && grams) {
      setOtpSent(true);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100">
        <button className="mr-4">
          <ChevronLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center mr-10">
          Gift
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {/* Metal Selection */}
        <div className="flex gap-2">
          {metals.map((metal) => (
            <button
              key={metal.id}
              onClick={() => setSelectedMetal(metal.id)}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedMetal === metal.id
                  ? 'text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
              style={{
                backgroundColor: selectedMetal === metal.id ? '#50C2C9' : ''
              }}
            >
              <div>{metal.name}</div>
              <div className="text-xs opacity-80">{metal.purity}</div>
            </button>
          ))}
        </div>

        {/* Current Balance Card */}
        <div className="text-white rounded-lg p-6"
             style={{ backgroundColor: '#50C2C9' }}>
          <h3 className="text-lg font-medium mb-2">Current Balance</h3>
          <div className="text-2xl font-bold">0.0000 GM</div>
        </div>

        {/* Gift Form */}
        <div className="bg-gray-100 rounded-lg p-4">
          <div className="flex items-center justify-center mb-4">
            <span className="text-gray-700 font-medium">Gift Gold</span>
            <div className="w-8 h-8 bg-yellow-400 rounded-full ml-2 flex items-center justify-center">
              <span className="text-yellow-800 font-bold text-sm">Au</span>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-500 mb-4">995</div>

          {/* Grams Input */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Scale className="w-4 h-4" />
              Grams
            </label>
            <input
              type="number"
              value={grams}
              onChange={(e) => setGrams(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-white"
              placeholder="Enter grams"
            />
          </div>

          {/* Security Note */}
          <div className="text-center text-xs text-gray-400 mb-4">
            🛡️ 100% Safe & Secured | Pure Gold
          </div>
        </div>

        {/* Message Input */}
        <div className="bg-gray-100 rounded-lg p-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Type your message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-white resize-none"
            rows={4}
            placeholder="Enter your gift message..."
          />
        </div>

        {/* Recipient Email */}
        <div className="bg-gray-100 rounded-lg p-4">
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Recipient's Email ID
          </label>
          <input
            type="email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-white"
            placeholder="Enter recipient's email"
          />
        </div>

        {/* Generate OTP Button */}
        <button
          onClick={handleGenerateOtp}
          disabled={!recipientEmail || !grams}
          className="w-full py-3 rounded-lg font-medium text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: '#50C2C9' }}
        >
          Generate OTP
        </button>

        {/* OTP Section */}
        {otpSent && (
          <>
            <div className="bg-gray-100 rounded-lg p-4">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Enter OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 bg-white text-center text-lg font-mono"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
              />
              <div className="text-center text-xs text-gray-500 mt-2">
                OTP sent to {recipientEmail}
              </div>
            </div>

            {/* Confirm Button */}
            <button
              disabled={otp.length !== 6}
              className="w-full py-4 rounded-lg font-bold text-lg text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: '#50C2C9' }}
            >
              Confirm Gift
            </button>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-200 bg-white mt-auto">
        <div className="flex">
          {/* Gift Button */}
          <button
            className="flex-1 flex flex-col items-center py-4"
            style={{ color: '#50C2C9' }}
          >
            <Gift className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Gift</span>
          </button>

          {/* Gift History Button - redirects */}
          <button
            onClick={() => router.push('/gift_history')}
            className="flex-1 flex flex-col items-center py-4 text-gray-400"
          >
            <FileText className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Gift History</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GiftPage;
