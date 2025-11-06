'use client'; 
import React, { useState,useEffect } from 'react';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SIPForm = () => {
  const [amount, setAmount] = useState('49999.0');
  const [months, setMonths] = useState(12);
  const [isAgreed, setIsAgreed] = useState(false);
  const [showMonthsDropdown, setShowMonthsDropdown] = useState(false);
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMode, setPaymentMode] = useState(null); // 'online' | 'offline' | null
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  
  const monthOptions = [12,24];

  const handlePayOffline = () => {
    if (!isAgreed) {
      alert("Please agree to the terms before proceeding.");
      return;
    }
    router.push('/payoffline'); // redirects to /payoffline
  };

useEffect(() => {
    const storedUserId = sessionStorage.getItem("userId");
    const storedUserName = sessionStorage.getItem("username");

    setUserId(storedUserId);
    setUserName(storedUserName);

    console.log("userID:", storedUserId);
    console.log("userName:", storedUserName);
  }, []);
  const handle_back = () => {
    router.push('/savings_plan')
  }

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
      console.error('Error creating order:', error);
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
      console.error('Error verifying payment:', error);
      throw error;
    }
  };

  const handlePayOnline = async () => {
    if (!isAgreed) {
      alert("Please agree to the terms before proceeding.");
      return;
    }

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
        description: `SIP Plan - ${months} months`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            const verificationResult = await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount,
              months
            });

            if (verificationResult.success) {
              setPaymentStatus("Payment Success ✅");
              router.push("/payment-success"); // ✅ redirect to success page
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
        notes: { months, planType: 'SIP' },
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
    } catch (err) {
      console.error(err);
      setPaymentStatus("Payment Init Failed ❌");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-lg mx-auto bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="flex items-center p-4 border-b">
          <ChevronLeft className="w-6 h-6 text-gray-600 mr-3" onClick={handle_back} />
          <h1 className="text-xl font-semibold text-gray-900">SIP</h1>
        </div>

        <div className="p-4 space-y-6">
          {/* Swarn Sanchay Yojna Card */}
          <div className="rounded-lg p-4" style={{ backgroundColor: '#50C2C9' }}>
            <h2 className="text-white text-lg font-semibold mb-3">SWARN SANCHAY YOJNA (22KT)</h2>
            <div className="space-y-2">
              <div className="flex items-center text-white">
                <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                <span>Range : 12 Months</span>
              </div>
              <div className="flex items-center text-white">
                <span className="w-2 h-2 bg-white rounded-full mr-3"></span>
                <span>Invest : 2,000.0 Rs - 49,999.0 Rs</span>
              </div>
            </div>
          </div>

          {/* Enter Amount */}
         <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-gray-900 font-semibold mb-3">Enter Amount per Month</h3>
            <div className="flex items-center bg-white rounded-lg p-4">
              <span className="text-2xl font-bold text-gray-900 mr-3">₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 text-2xl font-bold text-gray-900 bg-transparent border-none outline-none"
                step="0.1"
              />
              <div className="w-8 h-8 rounded-full flex items-center justify-center ml-3" style={{ backgroundColor: '#50C2C9' }}>
                <span className="text-white text-xs font-bold">₹</span>
              </div>
            </div>
          </div>

          {/* No of Months */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-gray-900 font-semibold mb-3">No of Months</h3>
            <div className="relative">
              <button
                onClick={() => setShowMonthsDropdown(!showMonthsDropdown)}
                className="w-full bg-white rounded-lg p-4 flex items-center justify-between"
              >
                <span className="text-lg text-gray-900">{months}</span>
                <ChevronDown className="w-5 h-5 text-gray-600" />
              </button>
              {showMonthsDropdown && (
                <div className="absolute top-full left-0 right-0 bg-white rounded-lg shadow-lg border mt-1 z-10">
                  {monthOptions.map((month) => (
                    <button
                      key={month}
                      onClick={() => {
                        setMonths(month);
                        setShowMonthsDropdown(false);
                      }}
                      className="w-full p-3 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {month}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tag your plan */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-gray-900 font-semibold mb-3">Tag your plan</h3>
            <div className="bg-white rounded-lg p-4 min-h-16"></div>
          </div>

          {/* Benefits */}
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="space-y-2 text-gray-700">
              <div className="flex items-start">
                <span className="w-2 h-2 bg-gray-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                <span>Jewellery SIP</span>
              </div>
              <div className="flex items-start">
                <span className="w-2 h-2 bg-gray-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                <span>12 + 1 Scheme Plan</span>
              </div>
              <div className="flex items-start">
                <span className="w-2 h-2 bg-gray-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                <span>One Month Bonus From US</span>
              </div>
              <div className="flex items-start">
                <span className="w-2 h-2 bg-gray-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                <span>Pay For 12 Months And Get One Installment Benefit On Redemption Of Jewellery</span>
              </div>
            </div>
          </div>

          {/* Additional Benefits */}
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="space-y-2 text-gray-700 mb-4">
              <div className="flex items-start">
                <span className="w-2 h-2 bg-gray-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                <span>No Cash Return After SIP Cancellation.</span>
              </div>
              <div className="flex items-start">
                <span className="w-2 h-2 bg-gray-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                <span>Unlock steady growth potential</span>
              </div>
              <div className="flex items-start">
                <span className="w-2 h-2 bg-gray-600 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                <span>Secure long-term growth with Money SIP.</span>
              </div>
            </div>

            {/* Agreement Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="agree"
                checked={isAgreed}
                onChange={(e) => setIsAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-2 border-gray-300 mr-3"
                style={{ accentColor: '#50C2C9' }}
              />
              <label htmlFor="agree" className="text-gray-700">I agree</label>
            </div>
          </div>

          {/* Action Buttons */}
          {/* <div className="flex gap-3 pb-4">
            <button
              onClick={handlePayOnline}
              disabled={isLoading || !isAgreed}
              className={`flex-1 py-3 rounded-lg font-semibold transition-all
                ${(!isAgreed || isLoading)
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : paymentMode === "online"
                    ? 'bg-[#50C2C9] text-white border border-[#50C2C9]'
                    : 'bg-white text-[#50C2C9] border border-[#50C2C9] hover:bg-[#50C2C9] hover:text-white'
                }`}
            >
              {isLoading ? 'Processing...' : 'Pay Online'}
            </button>
            <button 
              className={`flex-1 font-semibold py-4 rounded-lg ${
                isAgreed 
                  ? 'text-white cursor-pointer' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              style={isAgreed ? { backgroundColor: '#50C2C9' } : {}}
              onClick={handlePayOffline}
              disabled={!isAgreed}
            >
              Pay Offline
            </button>
          </div> */}

          <div className="flex justify-center mt-6">
  <button
    className={`w-2/3 text-xl font-semibold py-4 rounded-2xl shadow-md transition-all ${
      isAgreed
        ? "text-white cursor-pointer"
        : "bg-gray-300 text-gray-500 cursor-not-allowed"
    }`}
    style={isAgreed ? { backgroundColor: "#50C2C9" } : {}}
    disabled={!isAgreed}
    onClick={async () => {
      if (!isAgreed) {
        alert("Please agree to the terms.");
        return;
      }

      try {
        const response = await fetch("http://localhost:8089/create_sip/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sip_name: "Swarn Sanchay Yojna 22KT", // or dynamic tag input
            amount: amount,
            no_of_months: months,
            user_id: userId, // from sessionStorage
          }),
        });

        if (response.ok) {
          const savedSIP = await response.json();
          console.log("✅ SIP saved:", savedSIP);

          alert("SIP Created Successfully!");
          router.push("/Sip_card_details"); // redirect to SIP list page
        } else {
          const errorText = await response.text();
          alert("❌ Failed to save SIP: " + errorText);
        }
      } catch (err) {
        console.error("❌ Error:", err);
        alert("Something went wrong!");
      }
    }}
  >
    Create SIP
  </button>
</div>



        </div>
      </div>
    </div>
  );
};

export default SIPForm;
