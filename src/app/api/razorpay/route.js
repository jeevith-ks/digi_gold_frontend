import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log('🔵 Razorpay API called');
    
    const { amount, currency = 'INR', metalType, sipMonths } = await request.json();
    
    console.log('📦 Received data:', { amount, metalType, sipMonths });

    // Validate required fields
    if (!amount || isNaN(amount)) {
      console.error('❌ Invalid amount:', amount);
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Initialize Razorpay with hardcoded credentials
    const Razorpay = require('razorpay');
    const razorpay = new Razorpay({
      key_id: 'rzp_test_aOTAZ3JhbITtOK',
      key_secret: 'dH82ObyAQVjPkzTxtfvyHyyy',
    });

    // Create order
    const orderAmount = Math.round(amount * 100); // Convert to paise
    
    const options = {
      amount: orderAmount,
      currency: currency,
      receipt: `sip_${Date.now()}`,
      payment_capture: 1, // Auto capture payment
      notes: {
        metalType: metalType,
        sipMonths: sipMonths,
        type: 'sip_payment'
      }
    };

    console.log('🔄 Creating Razorpay order with options:', options);
    
    const order = await razorpay.orders.create(options);
    
    console.log('✅ Order created successfully:', {
      id: order.id,
      amount: order.amount,
      currency: order.currency
    });

    return NextResponse.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
      receipt: order.receipt,
    });
    
  } catch (error) {
    console.error('❌ Razorpay order creation error:', error);
    return NextResponse.json(
      { error: `Failed to create payment order: ${error.message}` },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST instead.' },
    { status: 405 }
  );
}