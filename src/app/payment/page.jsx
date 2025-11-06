"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const RazorpayPaymentPage = () => {
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('processing');
  const [orderData, setOrderData] = useState(null);
  const router = useRouter();

  // Get SIP details from session storage
  const selectedMetal = sessionStorage.getItem('selectedMetal');
  const amount = sessionStorage.getItem('sipAmount');
  const months = sessionStorage.getItem('sipMonths');
  const day = sessionStorage.getItem('sipDay');
  const sipType = sessionStorage.getItem('sipType');

  useEffect(() => {
    console.log('Payment page loaded with data:', {
      selectedMetal, amount, months, day, sipType
    });
    
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
      console.log('Initializing payment with amount:', amount);

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
        const errorText = await orderResponse.text();
        console.error('Order creation failed:', errorText);
        throw new Error('Failed to create order');
      }

      const order = await orderResponse.json();
      console.log('Order created:', order);
      setOrderData(order);

      // Check if Razorpay is already loaded
      if (window.Razorpay) {
        console.log('Razorpay already loaded');
        openRazorpay(order);
        return;
      }

      // Load Razorpay script
      console.log('Loading Razorpay script...');
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        openRazorpay(order);
      };
      
      script.onerror = (error) => {
        console.error('Failed to load Razorpay script:', error);
        setPaymentStatus('failed');
        setLoading(false);
      };
      
      document.body.appendChild(script);

    } catch (error) {
      console.error('Payment initialization error:', error);
      setPaymentStatus('failed');
      setLoading(false);
    }
  };

  const openRazorpay = (order) => {
    try {
      console.log('Opening Razorpay checkout...');
      
      const options = {
        key: 'rzp_test_aOTAZ3JhbITtOK',
        amount: order.amount,
        currency: order.currency,
        name: 'Gold SIP Plan',
        description: `SIP Investment - ${selectedMetal}`,
        order_id: order.id,
        handler: async function (response) {
          console.log('Payment response:', response);
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
            console.log('Payment modal dismissed');
            setPaymentStatus('cancelled');
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        setPaymentStatus('failed');
        setLoading(false);
      });
      
      rzp.open();
      console.log('Razorpay checkout opened');
      
    } catch (error) {
      console.error('Error opening Razorpay:', error);
      setPaymentStatus('failed');
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentResponse) => {
    try {
      console.log('Verifying payment...', paymentResponse);
      
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
      console.log('Verification result:', verification);

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

      console.log('Saving SIP plan to:', endpoint);
      
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
    console.log('Retrying payment...');
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

      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p><strong>Debug Info:</strong></p>
            <p>Amount: {amount}</p>
            <p>Metal: {selectedMetal}</p>
            <p>SIP Type: {sipType}</p>
            <p>Status: {paymentStatus}</p>
            {orderData && <p>Order ID: {orderData.id}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default RazorpayPaymentPage;