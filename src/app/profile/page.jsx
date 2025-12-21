'use client';
import React, { useState, useEffect } from 'react';
import { Edit2, LogOut, Save, Home, Bell, CreditCard, PiggyBank, User, Camera, X, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('Personal Details');
  const [userData, setUserData] = useState({
    // Personal Details
    fullName: '',
    email: '',
    gender: '',
    phoneNumber: '',
    dateOfBirth: '',
    pincode: '',
    houseOrFlatOrApartmentNo: '',
    area: '',
    city: '',
    state: '',
    
    // KYC Details
    panFullName: '',
    panNumber: '',
    
    // Bank Details
    bankFullName: '',
    bankName: '',
    ifscCode: '',
    accountNumber: '',
  });
  
  const [kycStatus, setKycStatus] = useState({
    pan: { status: 'NOT_SUBMITTED', message: '' },
    bank: { status: 'NOT_SUBMITTED', message: '' }
  });
  
  const [editMode, setEditMode] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [panPhoto, setPanPhoto] = useState(null);
  const [panPhotoPreview, setPanPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dataLoadedFromAPI, setDataLoadedFromAPI] = useState(false);
  
  // New verification states
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarOTP, setAadhaarOTP] = useState('');
  const [showAadhaarOTPField, setShowAadhaarOTPField] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState({
    pan: { verified: false, status: '', timestamp: '', data: null },
    aadhaar: { verified: false, status: '', timestamp: '', data: null }
  });
  const [isVerifying, setIsVerifying] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState([]);

  const router = useRouter();

  // Get auth token from sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('authToken');
      if (!token) {
        router.push('/Authentication');
      } else {
        setAuthToken(token);
      }
    }
  }, [router]);

  // Fetch user data from /api/user endpoint
  const fetchUserData = async () => {
    try {
      console.log('Fetching user data from API...');
      const response = await fetch('http://localhost:5000/api/user/details', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const userDataFromApi = await response.json();
        console.log('User data from API:', userDataFromApi);
        
        if (userDataFromApi.user || userDataFromApi) {
          const user = userDataFromApi.user || userDataFromApi;
          
          let formattedDob = '';
          if (user.dob) {
            try {
              const dobDate = new Date(user.dob);
              formattedDob = dobDate.toISOString().split('T')[0];
            } catch (error) {
              if (typeof user.dob === 'string') {
                formattedDob = user.dob.split('T')[0];
              }
            }
          }

          const personalUpdates = {
            fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            email: user.email || '',
            phoneNumber: user.phone || '',
            gender: user.gender || '',
            dateOfBirth: formattedDob,
            pincode: user.pincode || '',
            houseOrFlatOrApartmentNo: user.address1 || '',
            area: user.address2 || '',
            city: user.city || '',
            state: user.state || '',
          };

          setUserData(prev => ({
            ...prev,
            ...personalUpdates
          }));

          if (user.first_name || user.last_name) {
            sessionStorage.setItem('username', `${user.first_name || ''} ${user.last_name || ''}`.trim());
          }
          if (user.phone) {
            sessionStorage.setItem('phoneNumber', user.phone);
          }
          if (user.email) {
            sessionStorage.setItem('userEmail', user.email);
          }
          
          setDataLoadedFromAPI(true);
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('Error fetching user data:', err);
      return false;
    }
  };

  // Fetch KYC data from backend
  const fetchKYCData = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/kyc/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const kycData = await response.json();
        
        setKycStatus({
          pan: { 
            status: kycData.pan?.status || 'NOT_SUBMITTED', 
            message: kycData.pan ? `PAN: ${kycData.pan.status}` : 'PAN not submitted'
          },
          bank: { 
            status: kycData.bank?.status || 'NOT_SUBMITTED', 
            message: kycData.bank ? `Bank: ${kycData.bank.status}` : 'Bank details not submitted'
          }
        });

        const kycUpdates = {};
        
        if (kycData.pan) {
          kycUpdates.panFullName = kycData.pan.full_name || '';
          kycUpdates.panNumber = kycData.pan.pan_number || kycData.pan.pan_masked || '';
        }

        if (kycData.bank) {
          kycUpdates.bankFullName = kycData.bank.full_name || '';
          kycUpdates.bankName = kycData.bank.bank_name || '';
          kycUpdates.ifscCode = kycData.bank.ifsc_code || '';
          kycUpdates.accountNumber = kycData.bank.account_no || kycData.bank.account_masked || '';
        }
        
        if (Object.keys(kycUpdates).length > 0) {
          setUserData(prev => ({
            ...prev,
            ...kycUpdates
          }));
        }
        
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error fetching KYC data:', err);
      return false;
    }
  };

  // Fetch verification status and history
  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/kyc/verification/status', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data) {
          const panStatus = data.data.find(v => v.type === 'PAN');
          const aadhaarStatus = data.data.find(v => v.type === 'AADHAAR');
          
          setVerificationStatus({
            pan: {
              verified: panStatus?.status === 'VALID',
              status: panStatus?.status || 'NOT_VERIFIED',
              timestamp: panStatus?.verification_date,
              data: panStatus
            },
            aadhaar: {
              verified: aadhaarStatus?.status === 'VALID',
              status: aadhaarStatus?.status || 'NOT_VERIFIED',
              timestamp: aadhaarStatus?.verification_date,
              data: aadhaarStatus
            }
          });
          
          setVerificationHistory(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching verification status:', error);
    }
  };

  // Load session storage data as last resort
  const loadSessionStorageData = () => {
    if (!dataLoadedFromAPI) {
      const userEmail = sessionStorage.getItem('userEmail');
      const username = sessionStorage.getItem('username');
      const phoneNumber = sessionStorage.getItem('phoneNumber');

      const updates = {};
      if (!userData.fullName && username) {
        updates.fullName = username;
      }
      if (!userData.email && userEmail) {
        updates.email = userEmail;
      }
      if (!userData.phoneNumber && phoneNumber) {
        updates.phoneNumber = phoneNumber;
      }

      if (Object.keys(updates).length > 0) {
        setUserData(prev => ({ ...prev, ...updates }));
      }
    }
  };

  // Handle initial data loading
  useEffect(() => {
    if (authToken) {
      const loadAllData = async () => {
        try {
          setLoading(true);
          
          await fetchUserData();
          await fetchKYCData();
          await fetchVerificationStatus();
          
          loadSessionStorageData();
          
        } catch (error) {
          console.error('Error loading profile data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      loadAllData();
    }
  }, [authToken]);

  // Handle input change
  const handleInputChange = (e) => {
    if (!editMode) return;
    
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  // Handle PAN photo upload
  const handlePanPhotoUpload = () => {
    if (!editMode) return;
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.capture = 'environment';
    
    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          alert('Please select an image file');
          return;
        }

        if (file.size > 2 * 1024 * 1024) {
          alert('File size should be less than 2MB');
          return;
        }

        setPanPhoto(file);
        
        const reader = new FileReader();
        reader.onload = (event) => {
          setPanPhotoPreview(event.target.result);
        };
        reader.readAsDataURL(file);
      }
    };
    
    fileInput.click();
  };

  // Remove PAN photo
  const handleRemovePanPhoto = () => {
    if (!editMode) return;
    
    setPanPhoto(null);
    setPanPhotoPreview(null);
  };

  // Update Personal Details
  const updatePersonalDetails = async () => {
    try {
      const nameParts = userData.fullName.split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      const payload = {
        first_name,
        last_name,
        phone: userData.phoneNumber || '',
        gender: userData.gender || '',
        pincode: userData.pincode || '',
        address1: userData.houseOrFlatOrApartmentNo || '',
        address2: userData.area || '',
        city: userData.city || '',
        state: userData.state || '',
      };

      if (userData.dateOfBirth) {
        payload.dob = userData.dateOfBirth;
      }

      const response = await fetch('http://localhost:5000/api/user/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        alert('Personal details updated successfully!');
        setEditMode(false);
        
        sessionStorage.setItem('username', `${first_name} ${last_name}`.trim());
        if (userData.phoneNumber) {
          sessionStorage.setItem('phoneNumber', userData.phoneNumber);
        }
        
        await fetchUserData();
        
      } else {
        alert('Failed to update personal details: ' + (responseData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Error updating personal details. Please try again.');
    }
  };

  // Update KYC (PAN) details
  const updatePanDetails = async () => {
    try {
      if (!userData.panFullName || !userData.panNumber) {
        alert('PAN Full Name and PAN Number are required');
        return;
      }

      const payload = {
        full_name: userData.panFullName,
        pan_number: userData.panNumber,
      };

      if (panPhotoPreview) {
        const base64Data = panPhotoPreview.split(',')[1];
        payload.photo = base64Data;
      }

      const response = await fetch('http://localhost:5000/api/kyc/pan', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`PAN details submitted successfully! Status: ${result.status}`);
        setEditMode(false);
        fetchKYCData();
        
        setPanPhoto(null);
        setPanPhotoPreview(null);
      } else {
        const errorData = await response.json();
        alert('Failed to update PAN details: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('PAN update error:', err);
      alert('Error updating PAN details. Please try again.');
    }
  };

  // Update Bank details
  const updateBankDetails = async () => {
    try {
      if (!userData.bankFullName || !userData.accountNumber || !userData.bankName || !userData.ifscCode) {
        alert('All bank details are required');
        return;
      }

      const response = await fetch('http://localhost:5000/api/kyc/bank', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: userData.bankFullName,
          account_no: userData.accountNumber,
          bank_name: userData.bankName,
          ifsc_code: userData.ifscCode,
        }),
      });
      
      if (response.ok) {
        const result = await response.json();
        alert(`Bank details submitted! Status: ${result.status}`);
        setEditMode(false);
        fetchKYCData();
      } else {
        const errorData = await response.json();
        alert('Failed to update bank details: ' + (errorData.message || 'Unknown error'));
      }
    } catch (err) {
      console.error('Bank update error:', err);
      alert('Error updating bank details. Please try again.');
    }
  };

  // Verify PAN with third-party API
  // In your profile/page.jsx, update the verifyPAN function:

const verifyPAN = async () => {
  try {
    if (!userData.panNumber || !userData.panFullName) {
      alert('Please enter PAN number and full name');
      return;
    }
    
    setIsVerifying(true);
    
    const response = await fetch('http://localhost:5000/api/kyc/verify/pan', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pan_number: userData.panNumber.toUpperCase(),
        full_name: userData.panFullName,
        dob: userData.dateOfBirth || undefined
      })
    });
    
    // First check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error:', errorText);
      alert(`Server error: ${response.status} ${response.statusText}`);
      return;
    }
    
    // Then try to parse as JSON
    const result = await response.json();
    
    if (result.success) {
      if (result.data.status === 'VALID') {
        alert('✅ PAN verification successful!');
        
        // Update verification status
        setVerificationStatus(prev => ({
          ...prev,
          pan: {
            verified: true,
            status: 'VALID',
            timestamp: new Date().toISOString()
          }
        }));
        
        // Auto-save verified PAN
        await updatePanDetails();
        
        // Refresh verification status
        await fetchVerificationStatus();
      } else {
        alert(`⚠️ PAN verification failed: ${result.data.message}`);
      }
    } else {
      alert(`❌ PAN verification error: ${result.message}`);
    }
  } catch (error) {
    console.error('PAN verification error:', error);
    
    // More specific error handling
    if (error.name === 'SyntaxError') {
      alert('Server returned invalid JSON. Please check if backend is running correctly.');
    } else if (error.message.includes('Failed to fetch')) {
      alert('Cannot connect to server. Make sure backend is running on http://localhost:5000');
    } else {
      alert('Failed to verify PAN. Please try again.');
    }
  } finally {
    setIsVerifying(false);
  }
};

// Also update the requestAadhaarOTP function:

const requestAadhaarOTP = async () => {
  try {
    if (!aadhaarNumber) {
      alert('Please enter Aadhaar number');
      return;
    }
    
    if (!consentGiven) {
      alert('Please give consent for Aadhaar verification');
      return;
    }
    
    setIsVerifying(true);
    
    const consentText = `I authorize FinTech App to verify my Aadhaar details for KYC purpose.`;
    
    const response = await fetch('http://localhost:5000/api/kyc/verify/aadhaar', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        aadhaar_number: aadhaarNumber,
        consent: 'Y',
        consent_text: consentText
      })
    });
    
    // Check response status first
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server error:', errorText);
      alert(`Server error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const result = await response.json();
    
    if (result.success) {
      if (result.data.status === 'VALID') {
        setShowAadhaarOTPField(true);
        alert('✅ OTP has been sent to your registered mobile number');
      } else {
        alert(`⚠️ Aadhaar verification failed: ${result.data.message}`);
      }
    } else {
      alert(`❌ Aadhaar verification error: ${result.message}`);
    }
  } catch (error) {
    console.error('Aadhaar OTP request error:', error);
    
    if (error.name === 'SyntaxError') {
      alert('Server returned invalid response. Please check backend configuration.');
    } else {
      alert('Failed to request Aadhaar OTP. Please try again.');
    }
  } finally {
    setIsVerifying(false);
  }
};

  // Verify Aadhaar with OTP
  const verifyAadhaarWithOTP = async () => {
    try {
      if (!aadhaarOTP) {
        alert('Please enter OTP');
        return;
      }
      
      setIsVerifying(true);
      
      const consentText = `I authorize FinTech App to verify my Aadhaar details for KYC purpose.`;
      
      const response = await fetch('http://localhost:5000/api/kyc/verify/aadhaar/otp', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          aadhaar_number: aadhaarNumber,
          otp: aadhaarOTP,
          consent: 'Y',
          consent_text: consentText
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        if (result.data.status === 'VALID') {
          alert('✅ Aadhaar verification successful!');
          
          await fetchVerificationStatus();
          
          setShowAadhaarOTPField(false);
          setAadhaarOTP('');
        } else {
          alert(`⚠️ Aadhaar OTP verification failed: ${result.data.message}`);
        }
      } else {
        alert(`❌ Aadhaar OTP verification error: ${result.message}`);
      }
    } catch (error) {
      console.error('Aadhaar OTP verification error:', error);
      alert('Failed to verify Aadhaar OTP. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Combined KYC verification
  const verifyFullKYC = async () => {
    try {
      if (!consentGiven) {
        alert('Please give consent for KYC verification');
        return;
      }
      
      setIsVerifying(true);
      
      const consentText = `I authorize FinTech App to verify my KYC details including PAN and Aadhaar for account verification purpose.`;
      
      const response = await fetch('http://localhost:5000/api/kyc/verify/kyc', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          pan: {
            pan_number: userData.panNumber,
            full_name: userData.panFullName
          },
          aadhaar: {
            aadhaar_number: aadhaarNumber
          },
          consent: 'Y'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        let message = 'KYC verification results:\n';
        if (result.data.pan) {
          message += `PAN: ${result.data.pan.status === 'VALID' ? '✅ Verified' : '❌ Failed'}\n`;
        }
        if (result.data.aadhaar) {
          message += `Aadhaar: ${result.data.aadhaar.status === 'VALID' ? '✅ Verified' : '❌ Failed'}`;
        }
        alert(message);
        
        await fetchVerificationStatus();
      } else {
        alert(`❌ KYC verification error: ${result.message}`);
      }
    } catch (error) {
      console.error('KYC verification error:', error);
      alert('Failed to verify KYC. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle update based on active tab
  const handleUpdate = async () => {
    switch (activeTab) {
      case 'Personal Details':
        await updatePersonalDetails();
        break;
      case 'KYC Details':
        await updatePanDetails();
        break;
      case 'Bank Details':
        await updateBankDetails();
        break;
      default:
        alert('Invalid tab');
    }
  };

  // Logout
  const handleLogout = () => {
    sessionStorage.removeItem('userEmail');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('phoneNumber');
    router.push('/Authentication');
  };

  // Enhanced renderInputField function
  const renderInputField = (label, name, type = 'text', alwaysDisabled = false, placeholder = "") => {
    const value = userData[name] ?? '';
    const isLoading = loading && value === '';
    
    return (
      <div>
        <label className="block text-sm text-gray-600 mb-2">{label}</label>
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleInputChange}
          disabled={alwaysDisabled || !editMode || loading}
          className={`w-full px-4 py-3 rounded-lg border ${
            (alwaysDisabled || !editMode || loading) 
              ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed' 
              : 'border-gray-400 bg-white'
          } ${isLoading ? 'animate-pulse' : ''}`}
          placeholder={isLoading ? "Loading..." : placeholder}
        />
        {isLoading && (
          <div className="mt-1">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#50C2C9] animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'APPROVED': return 'text-green-600';
      case 'PENDING': return 'text-yellow-600';
      case 'REJECTED': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Clean up preview URL on component unmount
  useEffect(() => {
    return () => {
      if (panPhotoPreview) {
        URL.revokeObjectURL(panPhotoPreview);
      }
    };
  }, [panPhotoPreview]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Full-screen loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#50C2C9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-700 font-medium">Loading your profile data...</p>
            <p className="text-sm text-gray-500 mt-2">Please wait a moment</p>
          </div>
        </div>
      )}

      {/* KYC Status Banner */}
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex justify-between text-sm">
          <div className="flex items-center space-x-2">
            <span className={getStatusColor(kycStatus.pan.status)}>
              {kycStatus.pan.message}
            </span>
            {verificationStatus.pan.verified && (
              <Check className="w-4 h-4 text-green-500" />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className={getStatusColor(kycStatus.bank.status)}>
              {kycStatus.bank.message}
            </span>
            {verificationStatus.aadhaar.verified && (
              <Check className="w-4 h-4 text-green-500" />
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white">
        <div className="flex">
          {['Personal Details', 'KYC Details', 'Bank Details'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              disabled={loading}
              className={`flex-1 py-4 px-4 text-sm font-medium border-b-2 ${
                activeTab === tab ? 'border-b-2' : 'border-transparent text-gray-500'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              style={activeTab === tab ? { color: '#50C2C9', borderBottomColor: '#50C2C9' } : {}}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="bg-white px-4 py-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">{activeTab}</h1>
        <div className="flex items-center space-x-4">
          <button 
            onClick={editMode ? () => setEditMode(false) : () => setEditMode(true)}
            className="flex items-center space-x-2"
            disabled={loading}
          >
            {editMode ? (
              <span className="text-sm text-gray-600">Cancel</span>
            ) : (
              <>
                <Edit2 className="w-6 h-6 text-gray-600" />
                <span className="text-sm text-gray-600">Edit</span>
              </>
            )}
          </button>
          <button onClick={handleLogout} className="flex items-center space-x-2" disabled={loading}>
            <LogOut className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4 space-y-6 pb-24">
        {activeTab === 'Personal Details' && (
          <div className="space-y-4">
            {renderInputField('Full Name', 'fullName', 'text', true)}
            {renderInputField('Email', 'email', 'email', true)}
            {renderInputField('Phone Number', 'phoneNumber', 'tel', true)}
            {renderInputField('Gender', 'gender')}
            {renderInputField('Date of Birth', 'dateOfBirth', 'date')}
            {renderInputField('Pincode', 'pincode', 'number')}
            {renderInputField('House/Flat/Apartment', 'houseOrFlatOrApartmentNo')}
            {renderInputField('Area', 'area')}
            {renderInputField('City', 'city')}
            {renderInputField('State', 'state')}
          </div>
        )}

        {activeTab === 'KYC Details' && (
          <div className="space-y-6">
            {/* PAN Verification Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">PAN Verification</h3>
                <div className="flex items-center space-x-2">
                  {verificationStatus.pan.verified ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center">
                      <Check className="w-4 h-4 mr-1" />
                      Verified
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                      ⚠️ Pending
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {renderInputField('PAN Full Name', 'panFullName', 'text', false, 'As per PAN card')}
                {renderInputField('PAN Number', 'panNumber', 'text', false, 'ABCDE1234F')}
              </div>
              
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={verifyPAN}
                  disabled={isVerifying || !userData.panNumber || !userData.panFullName}
                  className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all flex items-center ${
                    isVerifying || !userData.panNumber || !userData.panFullName
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isVerifying ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Verifying...
                    </>
                  ) : verificationStatus.pan.verified ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Verified
                    </>
                  ) : (
                    'Verify PAN'
                  )}
                </button>
                
                <button
                  onClick={updatePanDetails}
                  disabled={isVerifying || !userData.panNumber || !userData.panFullName}
                  className={`px-5 py-2.5 rounded-lg font-medium text-sm border transition-all ${
                    isVerifying || !userData.panNumber || !userData.panFullName
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'border-blue-600 text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Save PAN Details
                </button>
              </div>
              
              {verificationStatus.pan.timestamp && (
                <p className="text-xs text-gray-500 mt-3">
                  Last verified: {new Date(verificationStatus.pan.timestamp).toLocaleDateString()}
                </p>
              )}
            </div>
            
            {/* Aadhaar Verification Section */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Aadhaar Verification</h3>
                <div className="flex items-center space-x-2">
                  {verificationStatus.aadhaar.verified ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full flex items-center">
                      <Check className="w-4 h-4 mr-1" />
                      Verified
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                      Optional
                    </span>
                  )}
                </div>
              </div>
              
              {/* Consent Checkbox */}
              <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    checked={consentGiven}
                    onChange={(e) => setConsentGiven(e.target.checked)}
                    disabled={verificationStatus.aadhaar.verified}
                    className="mt-1 h-4 w-4 text-blue-600 disabled:text-gray-400"
                  />
                  <span className="text-sm text-gray-700">
                    I consent to verify my Aadhaar details for KYC purpose. I understand that my Aadhaar details will be used only for verification and will be stored securely in compliance with UIDAI guidelines.
                  </span>
                </label>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm text-gray-600 mb-2">Aadhaar Number</label>
                <input
                  type="text"
                  value={aadhaarNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                    setAadhaarNumber(value);
                  }}
                  disabled={isVerifying || verificationStatus.aadhaar.verified}
                  className="w-full px-4 py-3 rounded-lg border border-gray-400 bg-white disabled:bg-gray-100 disabled:text-gray-500"
                  placeholder="Enter 12-digit Aadhaar"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format: 12 digits (e.g., 123456789012)
                </p>
              </div>
              
              {/* OTP Field (shown after requesting OTP) */}
              {showAadhaarOTPField && (
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-2">Enter OTP</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={aadhaarOTP}
                      onChange={(e) => setAadhaarOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      disabled={isVerifying}
                      className="flex-1 px-4 py-3 rounded-lg border border-gray-400 bg-white"
                      placeholder="Enter 6-digit OTP"
                    />
                    <button
                      onClick={verifyAadhaarWithOTP}
                      disabled={isVerifying || aadhaarOTP.length !== 6}
                      className={`px-6 py-3 rounded-lg font-medium flex items-center ${
                        isVerifying || aadhaarOTP.length !== 6
                          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isVerifying ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Verifying...
                        </>
                      ) : (
                        'Verify OTP'
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              <div className="flex flex-wrap gap-3">
                {!showAadhaarOTPField ? (
                  <button
                    onClick={requestAadhaarOTP}
                    disabled={isVerifying || !aadhaarNumber || aadhaarNumber.length !== 12 || !consentGiven || verificationStatus.aadhaar.verified}
                    className={`px-5 py-2.5 rounded-lg font-medium text-sm flex items-center ${
                      isVerifying || !aadhaarNumber || aadhaarNumber.length !== 12 || !consentGiven || verificationStatus.aadhaar.verified
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isVerifying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending OTP...
                      </>
                    ) : verificationStatus.aadhaar.verified ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Verified
                      </>
                    ) : (
                      'Request OTP'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAadhaarOTPField(false)}
                    className="px-5 py-2.5 rounded-lg font-medium text-sm border border-gray-400 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel OTP
                  </button>
                )}
                
                <button
                  onClick={verifyFullKYC}
                  disabled={isVerifying || !consentGiven}
                  className={`px-5 py-2.5 rounded-lg font-medium text-sm border flex items-center ${
                    isVerifying || !consentGiven
                      ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                      : 'border-green-600 text-green-600 hover:bg-green-50'
                  }`}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Verify Full KYC
                </button>
              </div>
              
              {verificationStatus.aadhaar.timestamp && (
                <p className="text-xs text-gray-500 mt-3">
                  Last verified: {new Date(verificationStatus.aadhaar.timestamp).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* PAN Photo Upload */}
            <div className="mt-4">
              <label className="block text-sm text-gray-600 mb-2">PAN Card Photo</label>
              
              {panPhotoPreview ? (
                <div className="relative border-2 border-dashed border-teal-400 rounded-lg p-4 bg-gray-50">
                  <div className="flex flex-col items-center">
                    <img 
                      src={panPhotoPreview} 
                      alt="PAN Card Preview" 
                      className="max-h-64 max-w-full rounded-lg object-contain mb-3"
                    />
                    <div className="flex space-x-3">
                      <button
                        onClick={handlePanPhotoUpload}
                        disabled={!editMode || loading}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          editMode && !loading
                            ? 'bg-teal-500 text-white hover:bg-teal-600' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Change Photo
                      </button>
                      <button
                        onClick={handleRemovePanPhoto}
                        disabled={!editMode || loading}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1 ${
                          editMode && !loading
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <X className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      File: {panPhoto?.name} ({(panPhoto?.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                </div>
              ) : (
                <div 
                  className={`flex items-center justify-center border-2 border-dashed rounded-lg p-6 transition-colors duration-300 bg-gray-50 min-h-[200px] ${
                    editMode && !loading
                      ? 'border-gray-300 cursor-pointer hover:border-teal-400' 
                      : 'border-gray-200 cursor-not-allowed'
                  }`}
                  onClick={editMode && !loading ? handlePanPhotoUpload : undefined}
                >
                  <div className="text-center">
                    <Camera className={`w-12 h-12 mx-auto mb-3 ${
                      editMode && !loading ? 'text-gray-400' : 'text-gray-300'
                    }`} />
                    <p className={`text-sm font-medium ${
                      editMode && !loading ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {editMode && !loading ? 'Click to upload PAN card photo' : loading ? 'Loading...' : 'Click Edit to upload photo'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Take a clear picture of your PAN card</p>
                    <p className="text-xs text-gray-400 mt-2">Supports: JPG, PNG • Max: 2MB</p>
                  </div>
                </div>
              )}
            </div>

            {/* Verification History */}
            {verificationHistory.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Verification History</h3>
                <div className="space-y-3">
                  {verificationHistory.slice(0, 5).map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item.type} Verification</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.verification_date).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs ${
                        item.status === 'VALID' 
                          ? 'bg-green-100 text-green-800' 
                          : item.status === 'INVALID'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Important Notes */}
            <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl border border-blue-200 p-5">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center">
                <AlertCircle className="w-5 h-5 mr-2" />
                Important Notes
              </h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start">
                  <Check className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
                  <span>PAN verification is mandatory for financial transactions</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
                  <span>Aadhaar verification is optional but recommended for complete KYC</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
                  <span>Your data is encrypted and stored securely</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
                  <span>For demo purposes, use PAN format: ABCDE1234F</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-4 h-4 mr-2 mt-0.5 text-green-500" />
                  <span>For demo Aadhaar OTP, use: 123456</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'Bank Details' && (
          <div className="space-y-4">
            {renderInputField('Account Holder Full Name', 'bankFullName')}
            {renderInputField('Bank Name', 'bankName')}
            {renderInputField('IFSC Code', 'ifscCode')}
            {renderInputField('Account Number', 'accountNumber')}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> Bank details require verification and will be encrypted for security.
                Status will show as "PENDING" until approved by admin.
              </p>
            </div>
          </div>
        )}

        {/* Update Button - Shows only in edit mode */}
        {editMode && !loading && activeTab !== 'KYC Details' && (
          <div className="pt-4">
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="w-full bg-teal-500 text-white py-4 px-6 rounded-lg font-semibold hover:bg-teal-600 transition-colors duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>
                {activeTab === 'Personal Details' && 'Update Personal Details'}
                {activeTab === 'Bank Details' && 'Submit Bank Details'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-inner">
        <div className="flex justify-around items-center py-2">
          <Link href="/Home" className="flex flex-col items-center py-2 px-4 cursor-pointer">
            <Home className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Home</span>
          </Link>
          <Link href="/notification" className="flex flex-col items-center py-2 px-4">
            <Bell className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Notification</span>
          </Link>
          <Link href="/savings" className="flex flex-col items-center py-2 px-4">
            <PiggyBank className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Savings</span>
          </Link>
          <Link href="/Passbook" className="flex flex-col items-center py-2 px-4">
            <CreditCard className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Passbook</span>
          </Link>
          
          <Link href="/profile" className="flex flex-col items-center py-2 px-4">
            <User className="w-6 h-6 text-gray-400" style={{ color: '#50C2C9' }} />
            <span className="text-xs text-gray-400 mt-1" style={{ color: '#50C2C9' }}>Profile</span>
          </Link>
        </div>
      </div>
    </div>
  );
}