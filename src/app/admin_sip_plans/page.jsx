'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, CalendarRange, FileText, Plus, AlertCircle, ChevronLeft, Shield, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import '../home-enhanced.css';

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
    if (typeof window !== 'undefined') {
      const storedSipType = sessionStorage.getItem('sipType');
      const storedUserType = sessionStorage.getItem('userType');

      setSipType(storedSipType || '');
      setUserType(storedUserType || '');

      // Check if user is admin and SIP type is fixed
      if (storedUserType && storedUserType !== 'admin') {
        alert('Only admin users can create SIP plans');
        router.push('/sip-holdings');
        return;
      }
      // When page loads initially it might not have these values set yet logic needs to be safe
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
      const authToken = sessionStorage.getItem('authToken');
      if (!authToken) {
        alert('Authentication required. Please login again.');
        router.push('/Authentication');
        return;
      }

      const fixedSipData = {
        Yojna_name: formData.Yojna_name,
        metal_type: formData.metal_type,
        range_amount: parseFloat(formData.range_amount),
        total_months: parseInt(formData.total_months),
        description: formData.description || '',
        start_date: formData.startDate || null,
        end_date: formData.endDate || null
      };

      const response = await fetch('http://65.2.152.254:5000/api/sip/fixed/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fixedSipData)
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create SIP plan';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) { }
        throw new Error(`${errorMessage} (Status: ${response.status})`);
      }

      const result = await response.json();
      alert('Fixed SIP Plan created successfully!');

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
      
      alert(`Failed to create Fixed SIP plan: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Show loading while checking permissions
  if (!sipType || !userType) {
    // Only show loading if we are absolutely sure we are waiting for something. 
    // In a real app we'd verify auth here.
    // For now we render a skeleton or loading state.
    // However, if sessionStorage is empty, we might get stuck here.
    // Let's rely on the useEffect redirect logic.
  }

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans selection:bg-[#50C2C9] selection:text-white">
      {/* Header */}
      <div className="bg-white sticky top-0 z-30 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] backdrop-blur-xl bg-white/90">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors group"
          >
            <ChevronLeft className="w-6 h-6 text-gray-500 group-hover:text-gray-800" />
          </button>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#50C2C9] to-[#2D8A94]">
              Create SIP Plan
            </h1>
            <p className="text-xs text-gray-400 font-medium tracking-wide">ADMIN DASHBOARD</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6">

        {/* Helper Banner */}
        <div className="bg-[#50C2C9]/10 rounded-2xl p-4 flex items-start gap-3 border border-[#50C2C9]/20 mb-6">
          <Zap className="w-5 h-5 text-[#2D8A94] flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-[#2D8A94]">Fixed Plan Configuration</h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Set up a new fixed Systematic Investment Plan. All fields marked with asterisk (*) are mandatory.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Form Card */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#50C2C9]/10 to-transparent rounded-bl-full -mr-8 -mt-8 pointer-events-none" />

            {/* Yojna Name */}
            <div className="space-y-1.5 relative z-10">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Plan Name *
              </label>
              <div className="relative group">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#50C2C9] transition-colors" />
                <input
                  type="text"
                  name="Yojna_name"
                  value={formData.Yojna_name}
                  onChange={handleInputChange}
                  placeholder="e.g. Gold Saver Plus"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 font-semibold text-gray-900 focus:outline-none focus:border-[#50C2C9] focus:ring-4 focus:ring-[#50C2C9]/10 transition-all placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* Metal Type */}
            <div className="space-y-1.5 relative z-10">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Metal Type *
              </label>
              <div className="relative group">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#50C2C9] transition-colors" />
                <select
                  name="metal_type"
                  value={formData.metal_type}
                  onChange={handleInputChange}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 font-semibold text-gray-900 focus:outline-none focus:border-[#50C2C9] focus:ring-4 focus:ring-[#50C2C9]/10 transition-all appearance-none cursor-pointer"
                  required
                >
                  <option value="">Select Metal or Money</option>
                  <option value="gold22K">22KT Gold</option>
                  <option value="gold24K">24KT Gold</option>
                  <option value="silver">Silver</option>
                  <option value="Money">Money</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Range Amount */}
            <div className="space-y-1.5 relative z-10">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Monthly Amount (₹) *
              </label>
              <div className="relative group">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#50C2C9] transition-colors" />
                <input
                  type="number"
                  name="range_amount"
                  value={formData.range_amount}
                  onChange={handleInputChange}
                  placeholder="5000"
                  min="1"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 font-semibold text-gray-900 focus:outline-none focus:border-[#50C2C9] focus:ring-4 focus:ring-[#50C2C9]/10 transition-all"
                  required
                />
                {formData.range_amount && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#50C2C9] bg-[#50C2C9]/10 px-2 py-1 rounded-md">
                    {formatCurrency(formData.range_amount)}
                  </div>
                )}
              </div>
            </div>

            {/* Total Months */}
            <div className="space-y-1.5 relative z-10">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Duration (Months) *
              </label>
              <div className="relative group">
                <CalendarRange className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#50C2C9] transition-colors" />
                <input
                  type="number"
                  name="total_months"
                  value={formData.total_months}
                  onChange={handleInputChange}
                  placeholder="12"
                  min="1"
                  max="360"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3.5 pl-12 pr-4 font-semibold text-gray-900 focus:outline-none focus:border-[#50C2C9] focus:ring-4 focus:ring-[#50C2C9]/10 transition-all"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5 relative z-10">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Optional plan details..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-medium text-gray-900 focus:outline-none focus:border-[#50C2C9] focus:ring-4 focus:ring-[#50C2C9]/10 transition-all resize-none"
              />
            </div>
          </div>

          {/* Permission Error State */}
          {(sipType !== 'fixed' && sipType !== '') && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 font-medium">
                This form is only for Fixed SIP plans. Currently selected type: <span className="font-bold">{sipType}</span>
              </p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || sipType !== 'fixed'}
            className="w-full py-4 bg-gradient-to-r from-[#50C2C9] to-[#2D8A94] text-white rounded-2xl font-bold text-lg shadow-lg shadow-[#50C2C9]/30 hover:shadow-[#50C2C9]/50 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating Plan...</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                <span>Create Plan</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminSIPForm;