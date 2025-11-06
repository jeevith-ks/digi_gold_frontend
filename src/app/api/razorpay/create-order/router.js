// app/api/razorpay/create-order/route.js
import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';

const razorpay = new Razorpay({
  key_id: 'rzp_test_aOTAZ3JhbITtOK',
  key_secret: 'dH82ObyAQVjPkzTxtfvyHyyy',
});

export async function POST(request) {
  try {
    const { amount, currency = 'INR' } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const options = {
      amount: Math.round(amount * 100), // Amount in paise
      currency: currency,
      receipt: `sip_${Date.now()}`, // Unique receipt ID
      payment_capture: 1, // Auto capture payment
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}