'use client';
import React, { useState, useEffect } from 'react';
import { Edit2, LogOut, Save, Home, Bell, CreditCard, PiggyBank, User, Camera, X } from 'lucide-react';
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
        
        // Update form fields with data from API
        if (userDataFromApi.user || userDataFromApi) {
          const user = userDataFromApi.user || userDataFromApi;
          
          // Format date of birth if available
          let formattedDob = '';
          if (user.dob) {
            try {
              const dobDate = new Date(user.dob);
              formattedDob = dobDate.toISOString().split('T')[0];
            } catch (error) {
              console.error('Error formatting date of birth:', error);
              if (typeof user.dob === 'string') {
                formattedDob = user.dob.split('T')[0];
              }
            }
          }

          // Create updates object with ONLY personal details
          const personalUpdates = {
            // Personal Details
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

          console.log('Personal updates to apply:', personalUpdates);
          
          // Apply updates to userData
          setUserData(prev => ({
            ...prev,
            ...personalUpdates
            // NOTE: We're NOT clearing KYC fields here
          }));

          // Update session storage
          if (user.first_name || user.last_name) {
            sessionStorage.setItem('username', `${user.first_name || ''} ${user.last_name || ''}`.trim());
          }
          if (user.phone) {
            sessionStorage.setItem('phoneNumber', user.phone);
          }
          if (user.email) {
            sessionStorage.setItem('userEmail', user.email);
          }
          
          console.log('User data updated from API successfully');
          setDataLoadedFromAPI(true);
          return true;
        }
      } else {
        console.log('User API returned:', response.status);
        return false;
      }
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
        console.log('KYC Data:', kycData);
        
        // Update KYC status
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

        // Create updates object for KYC fields
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
        
        console.log('KYC updates to apply:', kycUpdates);
        
        // Apply KYC updates WITHOUT affecting personal details
        if (Object.keys(kycUpdates).length > 0) {
          setUserData(prev => ({
            ...prev,
            ...kycUpdates
          }));
        }
        
        return true;
      } else {
        console.error('Failed to fetch KYC data');
        return false;
      }
    } catch (err) {
      console.error('Error fetching KYC data:', err);
      return false;
    }
  };

  // Load session storage data as last resort
  const loadSessionStorageData = () => {
    // Only load from session storage if data wasn't loaded from API
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
        console.log('Loading from session storage:', updates);
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
          
          // 1. First fetch user data
          await fetchUserData();
          
          // 2. Then fetch KYC data (PAN/bank info only)
          await fetchKYCData();
          
          // 3. Use session storage only if user data API failed
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
      // Split full name into first and last name
      const nameParts = userData.fullName.split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      // Prepare payload
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

      // Only add date of birth if it's provided
      if (userData.dateOfBirth) {
        payload.dob = userData.dateOfBirth;
      }

      console.log('Sending update payload:', payload);

      const response = await fetch('http://localhost:5000/api/user/', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });
      
      const responseData = await response.json();
      console.log('Update response:', responseData);
      
      if (response.ok) {
        alert('Personal details updated successfully!');
        setEditMode(false);
        
        // Update session storage
        sessionStorage.setItem('username', `${first_name} ${last_name}`.trim());
        if (userData.phoneNumber) {
          sessionStorage.setItem('phoneNumber', userData.phoneNumber);
        }
        
        // Refresh data from API
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

  // DEBUG: Log current userData state
  useEffect(() => {
    console.log('Current userData state:', userData);
  }, [userData]);

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
          <span className={getStatusColor(kycStatus.pan.status)}>
            {kycStatus.pan.message}
          </span>
          <span className={getStatusColor(kycStatus.bank.status)}>
            {kycStatus.bank.message}
          </span>
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
          <div className="space-y-4">
            {renderInputField('PAN Full Name', 'panFullName')}
            {renderInputField('PAN Number', 'panNumber')}
            
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

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> PAN details require verification and will be encrypted for security.
                Status will show as "PENDING" until approved by admin. Please ensure the PAN card photo is clear and readable.
              </p>
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
        {editMode && !loading && (
          <div className="pt-4">
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="w-full bg-teal-500 text-white py-4 px-6 rounded-lg font-semibold hover:bg-teal-600 transition-colors duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-5 h-5" />
              <span>
                {activeTab === 'Personal Details' && 'Update Personal Details'}
                {activeTab === 'KYC Details' && 'Submit PAN Details'}
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