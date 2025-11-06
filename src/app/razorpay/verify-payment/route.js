import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: 'rzp_test_aOTAZ3JhbITtOK',
  key_secret: 'dH82ObyAQVjPkzTxtfvyHyyy',
});

export async function POST(request) {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      selectedMetal,
      amount,
      months,
      day
    } = await request.json();

    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id });

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', 'dH82ObyAQVjPkzTxtfvyHyyy')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    console.log('Signature verification:', { isAuthentic, expectedSignature, receivedSignature: razorpay_signature });

    if (isAuthentic) {
      // Payment is authentic
      return NextResponse.json({
        success: true,
        data: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature,
          selectedMetal,
          amount,
          months,
          day,
          payment_date: new Date().toISOString(),
          status: 'completed'
        }
      });
    } else {
      // Payment verification failed
      return NextResponse.json({
        success: false,
        error: 'Payment verification failed'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}