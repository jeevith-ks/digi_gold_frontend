import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      sipId,
      amount
    } = body;

    console.log('🔵 Verifying payment:', { 
      razorpay_order_id, 
      razorpay_payment_id, 
      sipId,
      amount 
    });

    // Verify signature
    const secret = 'dH82ObyAQVjPkzTxtfvyHyyy';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    console.log('🔑 Signature verification:', {
      generatedSignature,
      receivedSignature: razorpay_signature,
      isValid: generatedSignature === razorpay_signature
    });

    if (generatedSignature === razorpay_signature) {
      // Payment verified successfully
      console.log('✅ Payment verified successfully');
      
      // Here you can update your database with the payment success
      // For example, update the SIP plan with the paid amount
      
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        sipId: sipId,
        amount: amount
      });
    } else {
      console.error('❌ Payment verification failed - signature mismatch');
      return NextResponse.json(
        { error: 'Payment verification failed - invalid signature' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ Payment verification error:', error);
    return NextResponse.json(
      { error: `Payment verification failed: ${error.message}` },
      { status: 500 }
    );
  }
}