"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const RazorpayPaymentPage = () => {
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('processing');
  const [orderData, setOrderData] = useState(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Get SIP details from session storage
  const selectedMetal = sessionStorage.getItem('selectedMetal');
  const amount = sessionStorage.getItem('sipAmount');
  const months = sessionStorage.getItem('sipMonths');
  const day = sessionStorage.getItem('sipDay');
  const sipType = sessionStorage.getItem('sipType');

  useEffect(() => {
    // Validate required data
    if (!amount || !selectedMetal) {
      console.error('Missing payment data');
      setPaymentStatus('failed');
      setLoading(false);
      return;
    }
    
    initializePayment();
  }, []);

  const initializePayment = async () => {
    try {
      setLoading(true);

      // Create order first
      const orderResponse = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: 'INR'
        }),
      });

      if (!orderResponse.ok) {
        throw new Error('Failed to create order');
      }

      const order = await orderResponse.json();
      setOrderData(order);

      // Load Razorpay script
      if (!window.Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => {
          openRazorpay(order);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          setPaymentStatus('failed');
          setLoading(false);
        };
        document.body.appendChild(script);
      } else {
        openRazorpay(order);
      }

    } catch (error) {
      console.error('Payment initialization error:', error);
      setPaymentStatus('failed');
      setLoading(false);
    }
  };

  const openRazorpay = (order) => {
    try {
      const options = {
        key: 'rzp_test_aOTAZ3JhbITtOK',
        amount: order.amount,
        currency: order.currency,
        name: 'Gold SIP Plan',
        description: `SIP Investment - ${selectedMetal}`,
        order_id: order.id,
        handler: async function (response) {
          await verifyPayment(response);
        },
        prefill: {
          name: 'Customer Name',
          email: 'customer@example.com',
          contact: '9999999999'
        },
        notes: {
          metal: selectedMetal,
          months: months,
          day: day,
          sipType: sipType
        },
        theme: {
          color: '#50C2C9'
        },
        modal: {
          ondismiss: function() {
            setPaymentStatus('cancelled');
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error opening Razorpay:', error);
      setPaymentStatus('failed');
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      const verifyResponse = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentResponse,
          selectedMetal,
          amount: parseFloat(amount),
          months: parseInt(months),
          day: parseInt(day)
        }),
      });

      if (!verifyResponse.ok) {
        throw new Error('Verification failed');
      }

      const verification = await verifyResponse.json();

      if (verification.success) {
        setPaymentStatus('success');
        
        // Save SIP plan to database via your API
        await saveSIPPlan(verification.data);
      } else {
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  const saveSIPPlan = async (sipData) => {
    try {
      const token = sessionStorage.getItem('authToken');
      
      if (!token) {
        console.error('No auth token found');
        return;
      }

      const endpoint = sipType === 'fixed' 
        ? 'http://localhost:5000/api/sip/fixed'
        : 'http://localhost:5000/api/sip/flexible';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...sipData,
          metal_type: selectedMetal,
          total_amount: parseFloat(amount),
          total_months: parseInt(months),
          start_day: parseInt(day)
        })
      });

      if (!response.ok) {
        console.error('Failed to save SIP plan');
      } else {
        console.log('SIP plan saved successfully');
      }
    } catch (error) {
      console.error('Error saving SIP plan:', error);
    }
  };

  const handleRetry = () => {
    setPaymentStatus('processing');
    setLoading(true);
    initializePayment();
  };

  const handleBackToSIP = () => {
    router.push('/Sip_card_details');
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-white min-h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100">
        <button 
          onClick={handleBackToSIP}
          className="mr-4"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>
        <h1 className="text-lg font-semibold text-gray-900 flex-1 text-center mr-10">
          Payment Processing
        </h1>
      </div>

      {/* Payment Status */}
      <div className="flex-1 flex items-center justify-center px-4">
        {loading && paymentStatus === 'processing' && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#50C2C9] animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Processing Payment
            </h2>
            <p className="text-gray-600">
              Please wait while we initialize your payment...
            </p>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your SIP plan has been activated successfully.
            </p>
            <button
              onClick={handleBackToSIP}
              className="bg-[#50C2C9] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#45b1b9] transition-colors"
            >
              Back to SIP Plans
            </button>
          </div>
        )}

        {paymentStatus === 'failed' && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Failed
            </h2>
            <p className="text-gray-600 mb-6">
              There was an error processing your payment. Please try again.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-[#50C2C9] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#45b1b9] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleBackToSIP}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Back to SIP Plans
              </button>
            </div>
          </div>
        )}

        {paymentStatus === 'cancelled' && (
          <div className="text-center">
            <XCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Cancelled
            </h2>
            <p className="text-gray-600 mb-6">
              You cancelled the payment process.
            </p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-[#50C2C9] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#45b1b9] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleBackToSIP}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Back to SIP Plans
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details */}
      {orderData && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p><strong>Order ID:</strong> {orderData.id}</p>
            <p><strong>Amount:</strong> ₹{(orderData.amount / 100).toFixed(2)}</p>
            <p><strong>Metal:</strong> {selectedMetal}</p>
            <p><strong>SIP Type:</strong> {sipType}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RazorpayPaymentPage;