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

  // NEW: Fetch user data from /api/user endpoint
  const fetchUserData = async () => {
    try {
      console.log('Fetching user data from API...');
      const response = await fetch('http://localhost:5000/api/user', {
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
            }
          }

          setUserData(prev => ({
            ...prev,
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
            state: user.state || ''
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
        }
      } else {
        console.log('User API returned:', response.status, ' - Using KYC data as fallback');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  // Fetch KYC data from backend - UPDATED VERSION
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

        // Update form data with KYC information
        if (kycData.pan) {
          setUserData(prev => ({
            ...prev,
            panFullName: kycData.pan.full_name || '',
            panNumber: kycData.pan.pan_number || kycData.pan.pan_masked || ''
          }));
        }

        if (kycData.bank) {
          setUserData(prev => ({
            ...prev,
            bankFullName: kycData.bank.full_name || '',
            bankName: kycData.bank.bank_name || '',
            ifscCode: kycData.bank.ifsc_code || '',
            accountNumber: kycData.bank.account_no || kycData.bank.account_masked || ''
          }));
        }
        
        // Update Personal Details from profile data - COMPLETE MAPPING
        if (kycData.profile) {
          const profile = kycData.profile;
          
          // Format date of birth if available
          let formattedDob = '';
          if (profile.dob) {
            try {
              const dobDate = new Date(profile.dob);
              formattedDob = dobDate.toISOString().split('T')[0];
            } catch (error) {
              console.error('Error formatting date of birth:', error);
            }
          }

          setUserData(prev => ({
            ...prev,
            // Personal Details
            fullName: `${profile.first_name || ''} ${profile.last_name || ''}`.trim(),
            email: profile.email || '',
            phoneNumber: profile.phone || '',
            gender: profile.gender || '',
            dateOfBirth: formattedDob,
            pincode: profile.pincode || '',
            houseOrFlatOrApartmentNo: profile.address1 || '',
            area: profile.address2 || '',
            city: profile.city || '',
            state: profile.state || ''
          }));

          // Also update session storage with current data
          if (profile.first_name || profile.last_name) {
            sessionStorage.setItem('username', `${profile.first_name || ''} ${profile.last_name || ''}`.trim());
          }
          if (profile.phone) {
            sessionStorage.setItem('phoneNumber', profile.phone);
          }
          if (profile.email) {
            sessionStorage.setItem('userEmail', profile.email);
          }
        }
        
      } else {
        console.error('Failed to fetch KYC data');
      }
    } catch (err) {
      console.error('Error fetching KYC data:', err);
    }
  };

  // Fetch user profile data from session storage and API - UPDATED VERSION
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      
      // Only set basic info if not already set from KYC data
      const currentUserData = { ...userData };
      
      // Get basic user info from session storage as fallback
      const userEmail = sessionStorage.getItem('userEmail');
      const username = sessionStorage.getItem('username');
      const phoneNumber = sessionStorage.getItem('phoneNumber');

      // Only update if fields are empty (not set from KYC data)
      const updates = {};
      if (!currentUserData.fullName && username) {
        updates.fullName = username;
      }
      if (!currentUserData.email && userEmail) {
        updates.email = userEmail;
      }
      if (!currentUserData.phoneNumber && phoneNumber) {
        updates.phoneNumber = phoneNumber;
      }

      if (Object.keys(updates).length > 0) {
        setUserData(prev => ({ ...prev, ...updates }));
      }

    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setLoading(false);
    }
  };

  // UPDATED: Handle initial data loading with priority order
  useEffect(() => {
    if (authToken) {
      const loadAllData = async () => {
        try {
          setLoading(true);
          
          // 1. First try to get data from /api/user (most current)
          await fetchUserData();
          
          // 2. Then fetch KYC data (for PAN/bank info and as fallback)
          await fetchKYCData();
          
          // 3. Finally use session storage as last resort
          await fetchUserProfile();
          
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
    if (!editMode) return; // Prevent changes when not in edit mode
    
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  // Handle PAN photo upload
  const handlePanPhotoUpload = () => {
    if (!editMode) return; // Prevent photo upload when not in edit mode
    
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
        
        const previewUrl = URL.createObjectURL(file);
        setPanPhotoPreview(previewUrl);
        
        console.log('PAN photo selected:', file.name, 'Size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
      }
    };
    
    fileInput.click();
  };

  // Remove PAN photo
  const handleRemovePanPhoto = () => {
    if (!editMode) return; // Prevent removal when not in edit mode
    
    setPanPhoto(null);
    setPanPhotoPreview(null);
  };

  // UPDATED: Update Personal Details with immediate data refresh
  const updatePersonalDetails = async () => {
    try {
      // Split full name into first and last name
      const nameParts = userData.fullName.split(' ');
      const first_name = nameParts[0] || '';
      const last_name = nameParts.slice(1).join(' ') || '';

      // Get current user info from session storage
      const username = sessionStorage.getItem('username') || '';
      const userEmail = sessionStorage.getItem('userEmail') || '';
      
      // Prepare payload - only include fields that have values
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

      // Only add date of birth if it's provided and valid
      if (userData.dateOfBirth) {
        payload.dob = userData.dateOfBirth;
      }

      // Add identification fields that backend might need
      payload.email = userEmail;
      payload.username = username;

      console.log('Sending update payload:', payload);

      const response = await fetch('http://localhost:5000/api/user', {
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
        
        // Update session storage with new data
        sessionStorage.setItem('username', `${first_name} ${last_name}`.trim());
        if (userData.phoneNumber) {
          sessionStorage.setItem('phoneNumber', userData.phoneNumber);
        }
        
        // NEW: Immediately refresh data from API to confirm updates
        await fetchUserData();
        
      } else {
        // Handle specific error cases
        if (responseData.message?.includes('already exists')) {
          alert('Update failed: User identification conflict. Please try with different credentials.');
        } else {
          alert('Failed to update personal details: ' + (responseData.message || 'Unknown error'));
        }
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

  // Enhanced renderInputField function with loading states
  const renderInputField = (label, name, type = 'text', alwaysDisabled = false, placeholder = "") => (
    <div>
      <label className="block text-sm text-gray-600 mb-2">{label}</label>
      <input
        type={type}
        name={name}
        value={userData[name] ?? ''}
        onChange={handleInputChange}
        disabled={alwaysDisabled || !editMode || loading}
        className={`w-full px-4 py-3 rounded-lg border ${
          (alwaysDisabled || !editMode || loading) 
            ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed' 
            : 'border-gray-400 bg-white'
        }`}
        placeholder={loading ? "Loading..." : placeholder}
      />
      {loading && userData[name] === '' && (
        <div className="mt-1">
          <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-[#50C2C9] animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}
    </div>
  );

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

      {/* Loading Indicator */}
      {loading && (
        <div className="px-4 py-2">
          <div className="flex items-center justify-center space-x-2 text-sm text-[#50C2C9]">
            <div className="w-4 h-4 border-2 border-[#50C2C9] border-t-transparent rounded-full animate-spin"></div>
            <span>Loading your profile data...</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white">
        <div className="flex">
          {['Personal Details', 'KYC Details', 'Bank Details'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-4 px-4 text-sm font-medium border-b-2 ${
                activeTab === tab ? 'border-b-2' : 'border-transparent text-gray-500'
              }`}
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
          <button onClick={handleLogout} className="flex items-center space-x-2">
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
                        disabled={!editMode}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                          editMode 
                            ? 'bg-teal-500 text-white hover:bg-teal-600' 
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Change Photo
                      </button>
                      <button
                        onClick={handleRemovePanPhoto}
                        disabled={!editMode}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center space-x-1 ${
                          editMode 
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
                    editMode 
                      ? 'border-gray-300 cursor-pointer hover:border-teal-400' 
                      : 'border-gray-200 cursor-not-allowed'
                  }`}
                  onClick={editMode ? handlePanPhotoUpload : undefined}
                >
                  <div className="text-center">
                    <Camera className={`w-12 h-12 mx-auto mb-3 ${
                      editMode ? 'text-gray-400' : 'text-gray-300'
                    }`} />
                    <p className={`text-sm font-medium ${
                      editMode ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {editMode ? 'Click to upload PAN card photo' : 'Click Edit to upload photo'}
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
        {editMode && (
          <div className="pt-4">
            <button
              onClick={handleUpdate}
              className="w-full bg-teal-500 text-white py-4 px-6 rounded-lg font-semibold hover:bg-teal-600 transition-colors duration-300 flex items-center justify-center space-x-2"
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