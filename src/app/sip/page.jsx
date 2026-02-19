'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // ✅ only once
import { CloudCog, ChevronLeft } from 'lucide-react';

export default function SipPlan() {
  const router = useRouter(); // ✅ declare once here

  const [selectedMetal, setSelectedMetal] = useState('Gold-24k-995');
  const [amount, setAmount] = useState(5000);
  const [months, setMonths] = useState(36);
  const [day, setDay] = useState(18);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState(null);
  const [paymentDoneMode, setPaymentDoneMode] = useState(null);

  const metals = [
    { name: 'Gold', sub: '24k-995' },
    { name: 'Gold', sub: '22k-916' },
    { name: 'Silver', sub: '24k-999' },
  ];

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Create Razorpay order API route handler
  const createRazorpayOrder = async (orderAmount) => {
    try {
      const response = await fetch('/api/razorpay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: orderAmount, currency: 'INR' }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      
      throw error;
    }
  };

  // Verify payment API route handler
  const verifyPayment = async (paymentData) => {
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) throw new Error('Payment verification failed');
      return await response.json();
    } catch (error) {
      
      throw error;
    }
  };

  const handlePayOnline = async () => {
    setPaymentMode("online");

    if (!window.Razorpay) {
      alert("Razorpay SDK failed to load. Please check your connection.");
      return;
    }
    if (!amount || amount <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    setIsLoading(true);
    setPaymentStatus('');

    try {
      const orderData = await createRazorpayOrder(amount);

      const options = {
        key: 'rzp_test_aOTAZ3JhbITtOK',
        amount: orderData.amount,
        currency: orderData.currency,
        name: "SIP Investment Plan",
        description: `${selectedMetal} SIP Plan - ${months} months`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            const verificationResult = await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              selectedMetal,
              amount,
              months,
              day
            });

            if (verificationResult.success) {
              setPaymentStatus("Payment Success ✅");
              setPaymentDoneMode("online");
            } else {
              setPaymentStatus("Payment Verification Failed ❌");
            }
          } catch {
            setPaymentStatus("Payment Verification Failed ❌");
          }
        },
        prefill: {
          name: "John Doe",
          email: "johndoe@example.com",
          contact: "9876543210",
        },
        notes: { metal: selectedMetal, months, day, planType: 'SIP' },
        theme: { color: "#50C2C9" },
        method: { upi: true, card: true, netbanking: true, wallet: true },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setPaymentStatus("Payment Failed ❌");
        setIsLoading(false);
      });

      rzp.open();
      setIsLoading(false);
    } catch {
      setPaymentStatus("Payment Init Failed ❌");
      setIsLoading(false);
    }
  };

  const handlePayOffline = () => {
    setPaymentMode("offline");
    router.push('/payoffline');
  };

  const handleCreateSavingsPlan = async () => {
    const planData = {
      gold_24K: selectedMetal === "Gold-24k-995",
      gold_22K: selectedMetal === "Gold-22k-916",
      silver: selectedMetal === "Silver-24k-999",
      amount: Number(amount),
      noOfMonths: Number(months),
      day: Number(day),
      payment_online: paymentMode === "online",
      payment_offline: paymentMode === "offline",
    };

    try {
      const response = await fetch("http://65.2.152.254:8089/sip/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planData),
      });

      if (!response.ok) throw new Error("Failed to save savings plan");

      await response.json();
      alert("Savings plan created successfully ✅");

      // ✅ Redirect after success
      router.push("/Sip_card_details");
    } catch (err) {
      
      alert("Failed to create savings plan ❌");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-sm sm:max-w-md md:max-w-lg rounded-3xl shadow-xl bg-white p-6">

        {/* Title */}
        <div className="flex items-center px-4 py-4 mb-2 border-b border-gray-100">
          <button className="mr-4" onClick={() => router.push('/savings_plan')}>
            <ChevronLeft className=" mr-1 w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center mr-10">
            SIP Holdings
          </h1>
        </div>

        {/* Select Metal */}
        <p className="text-gray-600 mb-2 text-sm sm:text-base">Select Metal</p>
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-2">
          {metals.map((metal) => (
            <button
              key={`${metal.name}-${metal.sub}`}
              onClick={() => setSelectedMetal(metal.name + '-' + metal.sub)}
              className={`flex-1 py-3 rounded-lg border text-center transition-all
                ${selectedMetal === metal.name + '-' + metal.sub
                  ? 'bg-[#50C2C9] text-white border-[#50C2C9]'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-[#50C2C9]'
                }`}
            >
              <p className="font-medium">{metal.name}</p>
              <p className="text-xs">{metal.sub}</p>
            </button>
          ))}
        </div>

        {/* Enter Amount */}
        <p className="text-gray-600 mb-2 text-sm sm:text-base">Enter Amount</p>
        <div className="flex items-center border rounded-lg px-3 py-3 mb-6 focus-within:border-[#50C2C9]">
          <span className="text-xl">₹</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="ml-2 flex-1 outline-none text-lg"
            min="1"
            placeholder="Enter amount"
          />
          <span className="ml-2">🪙</span>
        </div>

        {/* No of Months */}
        <p className="text-gray-600 mb-2 text-sm sm:text-base">No Of Months</p>
        <input
          type="number"
          value={months}
          onChange={(e) => setMonths(Number(e.target.value))}
          className="w-full border rounded-lg px-3 py-3 mb-6 outline-none focus:border-[#50C2C9]"
          min="1"
          placeholder="Number of months"
        />

        {/* Select Day of Month */}
        <p className="text-gray-600 mb-2 text-sm sm:text-base">Select Day Of The Month</p>
        <select
          value={day}
          onChange={(e) => setDay(Number(e.target.value))}
          className="w-full border rounded-lg px-3 py-3 mb-6 outline-none focus:border-[#50C2C9]"
        >
          {[...Array(28)].map((_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </select>

        {/* Payment Status */}
        {paymentStatus && (
          <div className={`text-center font-semibold mb-4 p-3 rounded-lg ${paymentStatus.includes('Success')
              ? 'text-green-600 bg-green-50'
              : 'text-red-600 bg-red-50'
            }`}>
            {paymentStatus}
          </div>
        )}

        {/* Payment Mode Tabs */}
        <div className="flex flex-col sm:flex-row justify-between mb-6 gap-2">
          <button
            onClick={handlePayOnline}
            disabled={isLoading}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all
              ${paymentDoneMode === "online"
                ? 'bg-blue-600 text-white border border-blue-600'
                : paymentMode === "online"
                  ? 'bg-[#50C2C9] text-white border border-[#50C2C9]'
                  : 'bg-white text-[#50C2C9] border border-[#50C2C9] hover:bg-[#50C2C9] hover:text-white'
              }`}
          >
            {isLoading ? 'Processing...' : 'Pay Online'}
          </button>

          <button
            onClick={handlePayOffline}
            className={`flex-1 py-3 rounded-lg font-semibold transition-all
              ${paymentDoneMode === "offline"
                ? 'bg-blue-600 text-white border border-blue-600'
                : paymentMode === "offline"
                  ? 'bg-[#50C2C9] text-white border border-[#50C2C9]'
                  : 'bg-white text-[#50C2C9] border border-[#50C2C9] hover:bg-[#50C2C9] hover:text-white'
              }`}
          >
            Pay Offline
          </button>
        </div>

        {/* Create Savings Plan */}
        <button
          onClick={handleCreateSavingsPlan}
          className="w-full bg-[#50C2C9] text-white py-3 rounded-lg font-semibold mb-6 hover:bg-[#45B0B7] transition-all active:scale-95"
        >
          Create Savings Plan
        </button>

        {/* Bottom Navigation */}
        <div className="flex justify-around text-[#50C2C9]">
          <div
            className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform"
            onClick={() => router.push('/savings_plan')}
          >
            <span className="text-2xl">💰</span>
            <p className="text-xs sm:text-sm font-semibold mt-1">NEW SIP PLAN</p>
          </div>
        </div>
      </div>
    </div>
  );
}