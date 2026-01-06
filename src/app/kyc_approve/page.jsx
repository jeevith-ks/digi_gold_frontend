'use client';
import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  FileText, 
  Banknote, 
  User, 
  Home,
  ChevronLeft,
  Check,
  AlertCircle,
  Shield,
  Upload,
  BadgeCheck
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function KYCApprovalPage() {
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(false);
  const [approvalChecks, setApprovalChecks] = useState({
    panVerified: false,
    bankVerified: false,
    identityVerified: false,
    addressVerified: false
  });
  const [notes, setNotes] = useState('');
  const router = useRouter();

  // Get auth token
  const getAuthToken = () => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('authToken');
    }
    return null;
  };

  // Fetch KYC data
  const fetchKYCData = async () => {
    try {
      setLoading(true);
      const authToken = getAuthToken();
      
      if (!authToken) {
        setError('Please login to view KYC data');
        router.push('/Authentication');
        return;
      }

      console.log('📋 Fetching KYC data...');
      
      const response = await fetch('http://35.154.85.104:5000/api/kyc/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        setError('Session expired. Please login again.');
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('authToken');
        }
        router.push('/Authentication');
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch KYC data: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ KYC Data received:', data);
      setKycData(data);

      // Pre-check if already approved
      if (data.pan?.status === 'VERIFIED') {
        setApprovalChecks(prev => ({ ...prev, panVerified: true }));
      }
      if (data.bank?.status === 'VERIFIED') {
        setApprovalChecks(prev => ({ ...prev, bankVerified: true }));
      }

    } catch (error) {
      console.error('❌ Error fetching KYC data:', error);
      setError(`Error loading KYC data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Handle approval submission
  const handleApproveKYC = async () => {
    try {
      setApproving(true);
      const authToken = getAuthToken();
      
      if (!authToken) {
        setError('Session expired. Please login again.');
        return;
      }

      // Prepare approval data
      const approvalData = {
        userId: kycData.user_id || kycData.userId,
        checks: approvalChecks,
        notes: notes.trim() || null,
        status: 'APPROVED'
      };

      console.log('📤 Submitting KYC approval:', approvalData);

      const response = await fetch('http://35.154.85.104:5000/api/kyc/approve', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(approvalData)
      });

      if (response.status === 401) {
        setError('Session expired. Please login again.');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to approve KYC: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ KYC Approval successful:', result);

      // Show success message
      setError({ type: 'success', message: 'KYC approved successfully!' });
      
      // Refresh KYC data
      setTimeout(() => fetchKYCData(), 2000);

    } catch (error) {
      console.error('❌ Error approving KYC:', error);
      setError({ type: 'error', message: error.message });
    } finally {
      setApproving(false);
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (checkName) => {
    setApprovalChecks(prev => ({
      ...prev,
      [checkName]: !prev[checkName]
    }));
  };

  // Get status badge color and icon
  const getStatusInfo = (status) => {
    switch(status?.toUpperCase()) {
      case 'VERIFIED':
      case 'APPROVED':
        return { 
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: <CheckCircle className="w-4 h-4" />,
          text: 'Verified'
        };
      case 'PENDING':
        return { 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: <Clock className="w-4 h-4" />,
          text: 'Pending'
        };
      case 'REJECTED':
        return { 
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: <XCircle className="w-4 h-4" />,
          text: 'Rejected'
        };
      default:
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <AlertCircle className="w-4 h-4" />,
          text: 'Not Submitted'
        };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Initialize
  useEffect(() => {
    fetchKYCData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#50C2C9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading KYC Application...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex items-center px-4 py-4">
          <button 
            onClick={() => router.back()}
            className="mr-4"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">KYC Verification</h1>
            <p className="text-sm text-gray-500">Review and approve customer KYC</p>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-[#50C2C9]" />
          </div>
        </div>
      </div>

      {/* Error/Success Message */}
      {error && (
        <div className={`mx-4 mt-4 p-4 rounded-lg ${
          error.type === 'success' 
            ? 'bg-green-100 border border-green-400 text-green-700'
            : 'bg-red-100 border border-red-400 text-red-700'
        }`}>
          <div className="flex items-center">
            {error.type === 'success' ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span className="flex-1">{error.message}</span>
            <button onClick={() => setError(null)} className="text-lg">×</button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4 space-y-6">
        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-[#50C2C9] bg-opacity-10 flex items-center justify-center">
                <User className="w-6 h-6 text-[#50C2C9]" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">
                  {kycData?.user?.name || kycData?.pan?.full_name || 'Customer'}
                </h2>
                <p className="text-sm text-gray-500">
                  User ID: {kycData?.user_id || kycData?.userId || 'N/A'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusInfo(kycData?.overall_status).color}`}>
                {getStatusInfo(kycData?.overall_status).icon}
                <span className="ml-1">{getStatusInfo(kycData?.overall_status).text}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {formatDate(kycData?.updated_at)}
              </p>
            </div>
          </div>
        </div>

        {/* PAN Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">PAN Details</h3>
                  <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${getStatusInfo(kycData?.pan?.status).color}`}>
                    {getStatusInfo(kycData?.pan?.status).icon}
                    <span className="ml-1">{getStatusInfo(kycData?.pan?.status).text}</span>
                  </div>
                </div>
              </div>
              
              {/* PAN Verification Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="panVerified"
                  checked={approvalChecks.panVerified}
                  onChange={() => handleCheckboxChange('panVerified')}
                  className="h-5 w-5 rounded border-gray-300 text-[#50C2C9] focus:ring-[#50C2C9]"
                />
                <label htmlFor="panVerified" className="ml-2 text-sm text-gray-700">
                  Verify PAN
                </label>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            {kycData?.pan ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Full Name</label>
                  <div className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {kycData.pan.full_name || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">PAN Number</label>
                  <div className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {kycData.pan.pan_number || kycData.pan.pan_masked || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date of Birth</label>
                  <div className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {formatDate(kycData.pan.date_of_birth)}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Submitted On</label>
                  <div className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {formatDate(kycData.pan.created_at)}
                  </div>
                </div>
                {kycData.pan.document_url && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">PAN Document</label>
                    <a 
                      href={kycData.pan.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-[#50C2C9] hover:text-[#3aa9b9]"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      View PAN Document
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">PAN details not submitted</p>
              </div>
            )}
          </div>
        </div>

        {/* Bank Details Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <Banknote className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Bank Details</h3>
                  <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${getStatusInfo(kycData?.bank?.status).color}`}>
                    {getStatusInfo(kycData?.bank?.status).icon}
                    <span className="ml-1">{getStatusInfo(kycData?.bank?.status).text}</span>
                  </div>
                </div>
              </div>
              
              {/* Bank Verification Checkbox */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="bankVerified"
                  checked={approvalChecks.bankVerified}
                  onChange={() => handleCheckboxChange('bankVerified')}
                  className="h-5 w-5 rounded border-gray-300 text-[#50C2C9] focus:ring-[#50C2C9]"
                />
                <label htmlFor="bankVerified" className="ml-2 text-sm text-gray-700">
                  Verify Bank
                </label>
              </div>
            </div>
          </div>
          
          <div className="p-5">
            {kycData?.bank ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Account Holder Name</label>
                  <div className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {kycData.bank.full_name || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Bank Name</label>
                  <div className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {kycData.bank.bank_name || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Account Number</label>
                  <div className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {kycData.bank.account_no || kycData.bank.account_masked || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">IFSC Code</label>
                  <div className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {kycData.bank.ifsc_code || 'N/A'}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Branch Address</label>
                  <div className="text-sm font-medium text-gray-900 bg-gray-50 p-3 rounded-lg">
                    {kycData.bank.branch_address || 'N/A'}
                  </div>
                </div>
                {kycData.bank.document_url && (
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Bank Document</label>
                    <a 
                      href={kycData.bank.document_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-[#50C2C9] hover:text-[#3aa9b9]"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      View Bank Document
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Bank details not submitted</p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Verification Checks */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Additional Verification Checks</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                  <User className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <label className="font-medium text-gray-900">Identity Verification</label>
                  <p className="text-xs text-gray-500">Verify customer's identity matches PAN & Bank</p>
                </div>
              </div>
              <input
                type="checkbox"
                id="identityVerified"
                checked={approvalChecks.identityVerified}
                onChange={() => handleCheckboxChange('identityVerified')}
                className="h-5 w-5 rounded border-gray-300 text-[#50C2C9] focus:ring-[#50C2C9]"
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                  <Home className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <label className="font-medium text-gray-900">Address Verification</label>
                  <p className="text-xs text-gray-500">Verify address matches supporting documents</p>
                </div>
              </div>
              <input
                type="checkbox"
                id="addressVerified"
                checked={approvalChecks.addressVerified}
                onChange={() => handleCheckboxChange('addressVerified')}
                className="h-5 w-5 rounded border-gray-300 text-[#50C2C9] focus:ring-[#50C2C9]"
              />
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Approval Notes</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes or comments regarding this KYC approval..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#50C2C9] focus:border-transparent"
            rows="4"
          />
          <p className="text-xs text-gray-500 mt-2">These notes will be saved with the approval record.</p>
        </div>

        {/* Approval Summary */}
        <div className="bg-gradient-to-r from-[#50C2C9] to-[#3aa9b9] rounded-xl p-5 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <BadgeCheck className="w-6 h-6" />
              <h3 className="font-semibold">Approval Summary</h3>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {Object.values(approvalChecks).filter(Boolean).length}/4
              </div>
              <div className="text-xs opacity-90">Checks Completed</div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-4">
            {Object.entries(approvalChecks).map(([key, value]) => (
              <div 
                key={key}
                className={`flex items-center p-2 rounded-lg ${value ? 'bg-white bg-opacity-20' : 'bg-black bg-opacity-10'}`}
              >
                <div className={`w-3 h-3 rounded-full mr-2 ${value ? 'bg-white' : 'bg-white bg-opacity-50'}`}></div>
                <span className="text-sm capitalize">
                  {key.replace('Verified', '').replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => router.back()}
              className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white py-3 rounded-lg font-medium transition-all"
            >
              Back to List
            </button>
            <button
              onClick={handleApproveKYC}
              disabled={approving || Object.values(approvalChecks).filter(Boolean).length === 0}
              className="flex-1 bg-white text-[#50C2C9] hover:bg-gray-100 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            >
              {approving ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#50C2C9] border-t-transparent rounded-full animate-spin mr-2"></div>
                  Approving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5 mr-2" />
                  Approve KYC
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Padding */}
      <div className="h-20"></div>
    </div>
  );
}