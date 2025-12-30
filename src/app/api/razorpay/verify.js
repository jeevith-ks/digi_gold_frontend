export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      sipId,
      amount
    } = req.body;

    const token = req.headers.authorization?.split(' ')[1];

    console.log('🔐 Verifying payment:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      sipId
    });

    // Call backend to verify payment
    const backendResponse = await fetch('http://localhost:5000/api/razorpay/verify-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        sipId,
        amount
      })
    });

    const verifyData = await backendResponse.json();

    if (!backendResponse.ok) {
      return res.status(400).json({
        success: false,
        error: verifyData.error || 'Payment verification failed'
      });
    }

    console.log('✅ Payment verified successfully');

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      payment: verifyData.payment
    });

  } catch (error) {
    console.error('❌ Verification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Verification failed',
      message: error.message
    });
  }
}