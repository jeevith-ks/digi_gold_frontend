"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';

const RazorpayPaymentPage = () => {
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState('processing');
  const [orderData, setOrderData] = useState(null);
  const [paymentData, setPaymentData] = useState({
    selectedMetal: null,
    amount: null,
    months: null,
    day: null,
    sipType: null
  });
  const router = useRouter();

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const selectedMetal = sessionStorage.getItem('selectedMetal');
      const amount = sessionStorage.getItem('sipAmount');
      const months = sessionStorage.getItem('sipMonths');
      const day = sessionStorage.getItem('sipDay');
      const sipType = sessionStorage.getItem('sipType');
      
      setPaymentData({
        selectedMetal,
        amount,
        months,
        day,
        sipType
      });

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
      
      initializePayment(amount, selectedMetal);
    }
  }, []);

  const initializePayment = async (amount, selectedMetal) => {
    // Rest of your initializePayment function...
    // Use the parameters instead of accessing sessionStorage directly
  };

  // Update the verifyPayment function to use paymentData state
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
          selectedMetal: paymentData.selectedMetal,
          amount: parseFloat(paymentData.amount),
          months: parseInt(paymentData.months),
          day: parseInt(paymentData.day)
        }),
      });
      // ... rest of the function
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('failed');
    } finally {
      setLoading(false);
    }
  };

  // Update the saveSIPPlan function
  const saveSIPPlan = async (sipData) => {
    try {
      let token = null;
      if (typeof window !== 'undefined') {
        token = sessionStorage.getItem('authToken');
      }
      // ... rest of the function
    } catch (error) {
      console.error('Error saving SIP plan:', error);
    }
  };

  // Update JSX to use paymentData state
  return (
    <div className="w-full max-w-sm mx-auto bg-white min-h-screen flex flex-col">
      {/* ... rest of your JSX ... */}
      
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <p><strong>Debug Info:</strong></p>
            <p>Amount: {paymentData.amount}</p>
            <p>Metal: {paymentData.selectedMetal}</p>
            <p>SIP Type: {paymentData.sipType}</p>
            <p>Status: {paymentStatus}</p>
            {orderData && <p>Order ID: {orderData.id}</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default RazorpayPaymentPage;