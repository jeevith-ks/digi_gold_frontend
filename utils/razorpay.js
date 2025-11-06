export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const initializeRazorpayPayment = async (orderData) => {
  const isLoaded = await loadRazorpayScript();
  if (!isLoaded) {
    throw new Error('Razorpay SDK failed to load');
  }

  return new Promise((resolve, reject) => {
    const options = {
      key: 'rzp_test_aOTAZ3JhbITtOK', // Your key_id
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      name: 'Your Company Name',
      description: orderData.description,
      order_id: orderData.id,
      handler: function (response) {
        resolve(response);
      },
      prefill: {
        name: orderData.customer_name || '',
        email: orderData.customer_email || '',
        contact: orderData.customer_contact || ''
      },
      theme: {
        color: '#50C2C9'
      },
      modal: {
        ondismiss: function() {
          reject(new Error('Payment closed'));
        }
      }
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  });
};