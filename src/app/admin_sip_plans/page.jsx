"use client";

import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, CalendarRange, FileText, Plus, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

const AdminSIPForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    Yojna_name: '',
    metal_type: '',
    range_amount: '',
    total_months: '',
    startDate: '',
    endDate: '',
    description: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [sipType, setSipType] = useState('');
  const [userType, setUserType] = useState('');

  useEffect(() => {
    // Get SIP type from session storage
    const storedSipType = sessionStorage.getItem('sipType');
    const storedUserType = sessionStorage.getItem('userType');
    
    setSipType(storedSipType || '');
    setUserType(storedUserType || '');

    // Check if user is admin and SIP type is fixed
    if (storedUserType !== 'admin') {
      alert('Only admin users can create SIP plans');
      router.push('/sip-holdings');
      return;
    }

    if (storedSipType !== 'fixed') {
      alert('Only Fixed SIP plans can be created by admin');
      router.push('/sip-holdings');
      return;
    }
  }, [router]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Double check user is admin and SIP type is fixed
    if (userType !== 'admin') {
      alert('Only admin users can create SIP plans');
      return;
    }

    if (sipType !== 'fixed') {
      alert('Only Fixed SIP plans can be created by admin');
      return;
    }

    setIsLoading(true);

    // Basic validation for Fixed SIP
    if (!formData.Yojna_name || !formData.metal_type || !formData.range_amount || !formData.total_months) {
      alert('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    if (parseFloat(formData.range_amount) <= 0) {
      alert('Range amount must be greater than 0');
      setIsLoading(false);
      return;
    }

    if (parseInt(formData.total_months) <= 0) {
      alert('Total months must be greater than 0');
      setIsLoading(false);
      return;
    }

    try {
      // Get auth token from session storage
      const authToken = sessionStorage.getItem('authToken');
      console.log('🔐 Auth Token from sessionStorage:', authToken);
      
      if (!authToken) {
        alert('Authentication required. Please login again.');
        router.push('/Authentication');
        return;
      }

      // Prepare data for Fixed SIP API
      const fixedSipData = {
        Yojna_name: formData.Yojna_name,
        metal_type: formData.metal_type,
        range_amount: parseFloat(formData.range_amount),
        total_months: parseInt(formData.total_months),
        description: formData.description || '',
        start_date: formData.startDate || null,
        end_date: formData.endDate || null
      };

      console.log('📤 Creating Fixed SIP Plan:', fixedSipData);
      console.log('🚀 Sending request to: http://172.31.11.246:5000/api/sip/fixed/create');
      console.log('🔑 Authorization Header:', `Bearer ${authToken}`);
      
      // Make API call to create Fixed SIP
      const response = await fetch('http://172.31.11.246:5000/api/sip/fixed/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fixedSipData)
      });

      console.log('📥 Response Status:', response.status);
      console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = 'Failed to create SIP plan';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.log('❌ Error response data:', errorData);
        } catch (parseError) {
          console.log('❌ Could not parse error response');
        }
        
        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }

      const result = await response.json();
      console.log('✅ SIP creation successful:', result);
      
      alert('Fixed SIP Plan created successfully!');
      
      // Reset form
      setFormData({
        Yojna_name: '',
        metal_type: '',
        range_amount: '',
        total_months: '',
        startDate: '',
        endDate: '',
        description: ''
      });
      
    } catch (error) {
      console.error('💥 Error creating Fixed SIP plan:', error);
      alert(`Failed to create Fixed SIP plan: ${error.message}`);
      
      // Check if it's an authentication error
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('🔐 Authentication failed. Possible issues:');
        console.log('1. Token might be expired');
        console.log('2. Token format might be incorrect');
        console.log('3. User might not have admin privileges');
        console.log('4. Backend token verification might be failing');
        
        // Suggest re-login
        const shouldRelogin = confirm('Authentication failed. Would you like to login again?');
        if (shouldRelogin) {
          sessionStorage.clear();
          router.push('/Authentication');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Test token function
  const testToken = async () => {
    const authToken = sessionStorage.getItem('authToken');
    if (!authToken) {
      alert('No token found in sessionStorage');
      return;
    }

    try {
      console.log('🧪 Testing token...');
      const response = await fetch('http://localhost:5000/api/sip/', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        }
      });
      
      console.log('Token test response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Token test successful:', data);
        alert('Token is valid!');
      } else {
        console.log('Token test failed:', response.status);
        alert(`Token validation failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Token test error:', error);
      alert('Token test failed with error');
    }
  };

  // Show loading while checking permissions
  if (!sipType || !userType) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  // Show error if not admin or not fixed SIP
  if (userType !== 'admin' || sipType !== 'fixed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-8 px-4 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            {userType !== 'admin' 
              ? 'Only admin users can create SIP plans.' 
              : 'Only Fixed SIP plans can be created by admin.'
            }
          </p>
          <button
            onClick={() => router.push('/sip-holdings')}
            className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
          >
            Back to SIP Holdings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Create Fixed SIP Plan
          </h1>
          <p className="text-gray-600">
            Admin: Create a new Fixed Systematic Investment Plan
          </p>
          <div className="mt-2 inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            📊 SIP Type: Fixed
          </div>
          
          {/* Debug Section */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800 mb-2">
              <strong>Debug Info:</strong>
            </p>
            <div className="text-left space-y-1">
              <p className="text-xs text-yellow-700">User Type: {userType}</p>
              <p className="text-xs text-yellow-700">SIP Type: {sipType}</p>
              <p className="text-xs text-yellow-700">
                Token: {sessionStorage.getItem('authToken') ? '✅ Present' : '❌ Missing'}
              </p>
            </div>
            <button
              onClick={testToken}
              className="mt-2 bg-yellow-500 text-white px-3 py-1 rounded text-xs hover:bg-yellow-600"
            >
              Test Token
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Yojna Name */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FileText className="w-4 h-4 mr-2 text-blue-500" />
                Yojna Name *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="Yojna_name"
                  value={formData.Yojna_name}
                  onChange={handleInputChange}
                  placeholder="e.g., SWARN SANCHAY YOJNA (22KT)"
                  className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  required
                />
              </div>
            </div>

            {/* Metal Type */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <FileText className="w-4 h-4 mr-2 text-yellow-500" />
                Metal Type *
              </label>
              <div className="relative">
               
                <select
                  name="metal_type"
                  value={formData.metal_type}
                  onChange={handleInputChange}
                  className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  required
                >
                  <option value="">Select Metal Type</option>
                  <option value="gold22K">22KT Gold</option>
                  <option value="gold24K">24KT Gold</option>
                  <option value="silver">Silver</option>
                </select>
              </div>
            </div>

            {/* Range Amount */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <DollarSign className="w-4 h-4 mr-2 text-green-500" />
                Range Amount (₹) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="range_amount"
                  value={formData.range_amount}
                  onChange={handleInputChange}
                  placeholder="Enter range amount in rupees"
                  min="1"
                  className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  required
                />
                {formData.range_amount && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 bg-green-50 px-2 py-1 rounded-lg">
                    {formatCurrency(formData.range_amount)}
                  </div>
                )}
              </div>
            </div>

            {/* Total Months */}
            <div className="space-y-2">
              <label className="flex items-center text-sm font-medium text-gray-700">
                <CalendarRange className="w-4 h-4 mr-2 text-purple-500" />
                Total Months *
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="total_months"
                  value={formData.total_months}
                  onChange={handleInputChange}
                  placeholder="Enter total months"
                  min="1"
                  max="360"
                  className="w-full pl-4 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 hover:bg-white"
                  required
                />
                {formData.total_months && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 bg-purple-50 px-2 py-1 rounded-lg">
                    {formData.total_months} months
                  </div>
                )}
              </div>
            </div>

            {/* Create Admin Fixed SIP Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-4 px-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Fixed SIP Plan...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>Create Fixed SIP Plan</span>
                </>
              )}
            </button>

            {/* Back Button */}
            <button
              type="button"
              onClick={() => router.back()}
              className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200 border border-gray-200"
            >
              Back to SIP Holdings
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSIPForm;