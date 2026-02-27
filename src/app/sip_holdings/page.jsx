'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAlert } from '@/context/AlertContext';

export default function SipHoldings() {
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState('');
  const [sipData, setSipData] = useState([]);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showAlert } = useAlert();

  const handlePayOffline = () => {
    router.push('/payoffline');
  };

  useEffect(() => {
    // load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // create Razorpay order
  const createRazorpayOrder = async (orderAmount) => {
    const response = await fetch('/api/razorpay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: orderAmount, currency: 'INR' }),
    });
    if (!response.ok) throw new Error('Order creation failed');
    return await response.json();
  };

  // verify payment
  const verifyPayment = async (paymentData) => {
    const response = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    });
    if (!response.ok) throw new Error('Payment verification failed');
    return await response.json();
  };

  // online payment per SIP row
  const handlePayOnline = async (sip) => {
    if (!window.Razorpay) {
      showAlert('Razorpay SDK not loaded', "error");
      return;
    }

    if (!sip.amount || sip.amount <= 0) {
      showAlert('Invalid SIP amount', "warning");
      return;
    }

    setIsLoading(true);
    setPaymentStatus('');

    try {
      const orderData = await createRazorpayOrder(sip.amount);

      const options = {
        key: 'rzp_test_aOTAZ3JhbITtOK',
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'SIP Investment Plan',
        description: `SIP Plan - ${sip.no_of_months} months`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            const verificationResult = await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              amount: sip.amount,
              months: sip.no_of_months,
            });

            if (verificationResult.success) {
              setPaymentStatus('Payment Success ✅');
              await fetch("http://localhost:8089/payment/save", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  user_id: userId,
                  amount: sip.amount,
                  dateTime: new Date().toISOString(),
                  transaction_id: response.razorpay_payment_id,
                  status: "SUCCESS",
                }),
              });
              router.push('/payment-success');
            } else {
              setPaymentStatus('Payment Verification Failed ❌');
            }
          } catch {
            setPaymentStatus('Payment Verification Failed ❌');
          }
        },
        prefill: {
          name: userName || 'User',
          email: 'user@example.com',
          contact: '9876543210',
        },
        notes: { months: sip.no_of_months, planType: 'SIP' },
        theme: { color: '#50C2C9' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setPaymentStatus('Payment Failed ❌');
        setIsLoading(false);
      });

      rzp.open();
      setIsLoading(false);
    } catch (err) {

      setPaymentStatus('Payment Init Failed ❌');
      setIsLoading(false);
    }
  };

  // inside handler after verifyPayment success



  // fetch SIP data
  useEffect(() => {
    const storedUserId = sessionStorage.getItem('userId');
    const storedUserName = sessionStorage.getItem('username');

    setUserId(storedUserId);
    setUserName(storedUserName);

    if (storedUserId) {
      fetch('http://localhost:8089/create_sip/getByUserId', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: parseInt(storedUserId) }),
      })
        .then((res) => res.json())
        .then((data) => {
          setSipData(data);
        })
        .catch((err) => {
          console.error('Error fetching SIP data:', err);
        });
    }
  }, []);

  return (
    <div className="min-h-screen bg-[lightgrey] flex flex-col items-center p-4">
      <h1 className="text-black text-2xl font-bold mb-6">SIP HOLDINGS</h1>

      <div className="bg-white shadow-lg rounded-2xl w-full max-w-md overflow-hidden">
        <div className="grid grid-cols-5 text-xs sm:text-sm font-semibold bg-[#50C2C9] text-white p-2 sm:p-3">
          <div className="text-center">NAME</div>
          <div className="text-center">SIP</div>
          <div className="text-center">AMT</div>
          <div className="text-center">REM</div>
          <div className="text-center">PAY</div>
        </div>

        {sipData.length > 0 ? (
          sipData.map((sip, index) => (
            <div
              key={index}
              className="grid grid-cols-5 items-center text-xs sm:text-sm p-2 sm:p-3 border-b"
            >
              <div className="text-center font-medium truncate">{userName}</div>
              <div className="text-center truncate">{sip.sip_name}</div>
              <div className="text-center">{sip.amount}</div>
              <div className="text-center">{sip.no_of_months}</div>
              <div className="flex justify-center space-x-1 sm:space-x-2">
                <button
                  className="bg-[#50C2C9] text-white px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs hover:opacity-90"
                  onClick={() => handlePayOnline(sip)}
                  disabled={isLoading}
                >
                  Online
                </button>
                <button
                  className="bg-gray-600 text-white px-2 sm:px-3 py-1 rounded-md text-[10px] sm:text-xs hover:opacity-90"
                  onClick={handlePayOffline}
                >
                  Offline
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-4 text-gray-500">No SIP Found</div>
        )}
      </div>

      {paymentStatus && (
        <p className="mt-4 text-sm font-semibold text-black">{paymentStatus}</p>
      )}
    </div>
  );
}