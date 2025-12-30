export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, metalType, sipMonths, sipType, sipId } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    // Validate inputs
    if (!amount || amount < 1) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!sipId) {
      return res.status(400).json({ error: 'SIP ID is required' });
    }

    console.log('📋 Creating Razorpay order:', {
      amount,
      metalType,
      sipType,
      sipId
    });

    // Call your backend API to create order
    const backendResponse = await fetch('http://localhost:5000/api/razorpay/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        amount,
        metalType,
        sipMonths,
        sipType,
        sipId
      })
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return res.status(400).json({
        error: errorData.error || 'Failed to create order'
      });
    }

    const orderData = await backendResponse.json();

    console.log('✅ Order created successfully:', orderData.id);

    return res.status(200).json({
      id: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency
    });

  } catch (error) {
    console.error('❌ Error creating order:', error);
    return res.status(500).json({
      error: 'Failed to create order',
      message: error.message
    });
  }
}