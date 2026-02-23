'use client';
import React, { useState, useEffect } from 'react';
import { Edit2, LogOut, Save, Home, Bell, CreditCard, PiggyBank, User, X, BadgeCheck, Shield, Wallet, AlertCircle, Camera, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useAlert } from '@/context/AlertContext';

// Component defined OUTSIDE to prevent focus loss issues
const RenderInput = ({ label, name, type = 'text', disabled = false, placeholder, icon, userData, onChange, editMode, loading }) => {
  const value = userData[name] ?? '';
  return (
    <div className="group space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-[#50C2C9] transition-colors flex items-center gap-1">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled || !editMode || loading}
          placeholder={placeholder}
          className={`w-full bg-slate-50 rounded-2xl px-4 py-4 font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 ring-[#50C2C9]/20 focus:shadow-sm transition-all text-sm placeholder:text-slate-300 ${(!editMode || disabled) ? 'text-slate-500 bg-slate-100/50 cursor-not-allowed border border-slate-100' : 'border border-transparent'}`}
        />
        {icon && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

export default function ProfilePage() {
  // 1. Hooks (Must be top-level and consistent)
  const [activeTab, setActiveTab] = useState('Personal');
  const [userData, setUserData] = useState({
    fullName: '', email: '', gender: '', phoneNumber: '', dateOfBirth: '',
    pincode: '', houseOrFlatOrApartmentNo: '', area: '', city: '', state: '',
    panFullName: '', panNumber: '', bankFullName: '', bankName: '', ifscCode: '', accountNumber: '',
  });
  const [kycStatus, setKycStatus] = useState({
    pan: { status: 'NOT_SUBMITTED', message: '' },
    bank: { status: 'NOT_SUBMITTED', message: '' }
  });
  const [editMode, setEditMode] = useState(false);
  const [authToken, setAuthToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [verificationStatus, setVerificationStatus] = useState({
    pan: { verified: false, status: '', timestamp: '', data: null },
    aadhaar: { verified: false, status: '', timestamp: '', data: null }
  });

  const router = useRouter();
  const pathname = usePathname();
  const { showAlert, showConfirm } = useAlert();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = sessionStorage.getItem('authToken');
      if (!token) router.push('/Authentication');
      else setAuthToken(token);
    }
  }, [router]);

  useEffect(() => {
    if (authToken) {
      const loadAllData = async () => {
        try {
          setLoading(true);
          await fetchUserData();
          await fetchKYCData();
          await fetchVerificationStatus();
        } catch (error) {
          console.error('Error loading profile data:', error);
        } finally {
          setLoading(false);
        }
      };
      loadAllData();
    }
  }, [authToken]);

  // 2. Methods
  const fetchUserData = async () => {
    try {
      const response = await fetch('http://65.2.152.254:5000/api/user/details', {
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        const data = await response.json();
        const user = data.user || data;

        let formattedDob = '';
        if (user.dob) formattedDob = new Date(user.dob).toISOString().split('T')[0];

        setUserData(prev => ({
          ...prev,
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
        }));
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || 'Failed to fetch user data');
      }
    } catch (err) {
      setError('Network error: Unable to connect to the server');
      console.error('Error fetching user data:', err);
    }
  };

  const fetchKYCData = async () => {
    try {
      const response = await fetch('http://65.2.152.254:5000/api/kyc/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const kycData = await response.json();
        setKycStatus({
          pan: { status: kycData.pan?.status || 'NOT_SUBMITTED', message: kycData.pan ? `PAN: ${kycData.pan.status}` : 'PAN not submitted' },
          bank: { status: kycData.bank?.status || 'NOT_SUBMITTED', message: kycData.bank ? `Bank: ${kycData.bank.status}` : 'Bank details not submitted' }
        });

        setUserData(prev => ({
          ...prev,
          panFullName: kycData.pan?.full_name || '',
          panNumber: kycData.pan?.pan_number || kycData.pan?.pan_masked || '',
          bankFullName: kycData.bank?.full_name || '',
          bankName: kycData.bank?.bank_name || '',
          ifscCode: kycData.bank?.ifsc_code || '',
          accountNumber: kycData.bank?.account_no || kycData.bank?.account_masked || ''
        }));
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || 'Failed to fetch KYC data');
      }
    } catch (err) {
      setError('Network error: Failed to fetch KYC status');
      console.error('Error fetching KYC data:', err);
    }
  };

  const fetchVerificationStatus = async () => {
    try {
      const response = await fetch('http://65.2.152.254:5000/api/kyc/verification/status', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (response.ok) {
        const res = await response.json();
        if (res.success && res.data) {
          const pan = res.data.find(v => v.type === 'PAN');
          const aad = res.data.find(v => v.type === 'AADHAAR');
          setVerificationStatus({
            pan: { verified: pan?.status === 'VALID', status: pan?.status || 'NOT_VERIFIED', timestamp: pan?.verification_date },
            aadhaar: { verified: aad?.status === 'VALID', status: aad?.status || 'NOT_VERIFIED', timestamp: aad?.verification_date }
          });
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || 'Failed to fetch verification status');
      }
    } catch (err) {
      setError('Network error: Verification status sync failed');
      console.error('Error fetching verification status:', err);
    }
  };

  const handleInputChange = (e) => {
    if (!editMode) return;
    const { name, value } = e.target;
    setUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogout = async () => {
    const confirmLogout = await showConfirm("Are you sure you want to logout?", "Logout");
    if (confirmLogout) {
      sessionStorage.clear();
      router.push('/Authentication');
    }
  };

  const handleUpdate = async () => {
    if (!editMode) return;
    if (activeTab === 'Personal') await updatePersonalDetails();
    else if (activeTab === 'KYC') await updatePanDetails();
    else if (activeTab === 'Bank') await updateBankDetails();
  };

  const updatePersonalDetails = async () => {
    try {
      const [first_name, ...rest] = userData.fullName.split(' ');
      const last_name = rest.join(' ');
      const payload = {
        first_name, last_name, phone: userData.phoneNumber, gender: userData.gender,
        pincode: userData.pincode, address1: userData.houseOrFlatOrApartmentNo,
        address2: userData.area, city: userData.city, state: userData.state,
        ...(userData.dateOfBirth && { dob: userData.dateOfBirth })
      };

      const response = await fetch('http://65.2.152.254:5000/api/user/', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setEditMode(false);
        fetchUserData();
        // Success notification could be added here if needed, but alert is also fine for critical success
        showAlert('Personal details updated successfully!', "success");
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.message || 'Failed to update personal details');
      }
    } catch (e) {
      setError('Connection error while updating details');
      console.error('Update error:', e);
    }
  };

  const verifyPAN = async () => {
    if (!userData.panNumber || !userData.panFullName) return showAlert('Enter PAN details first', "warning");
    setIsVerifying(true);
    try {
      const response = await fetch('http://65.2.152.254:5000/api/kyc/verify/pan', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan_number: userData.panNumber.toUpperCase(), full_name: userData.panFullName, dob: userData.dateOfBirth })
      });
      const result = await response.json().catch(() => ({}));
      if (result.success && result.data?.status === 'VALID') {
        showAlert('PAN Verified Successfully!', "success");
        fetchVerificationStatus();
        fetchKYCData();
      } else {
        setError(result.message || 'Verification failed. Details do not match.');
      }
    } catch (e) {
      setError('Verification service unavailable. Try again later.');
      console.error('PAN Verification error:', e);
    }
    finally { setIsVerifying(false); }
  };

  const updatePanDetails = async () => {
    try {
      const payload = { full_name: userData.panFullName, pan_number: userData.panNumber };
      const res = await fetch('http://65.2.152.254:5000/api/kyc/pan', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        showAlert('PAN Details Saved', "success");
        setEditMode(false);
        fetchKYCData();
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || 'Failed to save PAN details');
      }
    } catch (e) {
      setError('Network error: Unable to save PAN details');
    }
  };

  const updateBankDetails = async () => {
    try {
      const res = await fetch('http://65.2.152.254:5000/api/kyc/bank', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: userData.bankFullName, account_no: userData.accountNumber,
          bank_name: userData.bankName, ifsc_code: userData.ifscCode
        })
      });
      if (res.ok) {
        showAlert('Bank Details Saved', "success");
        setEditMode(false);
        fetchKYCData();
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || 'Failed to save bank details');
      }
    } catch (e) {
      setError('Network error: Unable to save bank details');
    }
  };

  const menuItems = [
    { icon: <User size={18} />, label: 'Personal', active: activeTab === 'Personal' },
    { icon: <BadgeCheck size={18} />, label: 'KYC', active: activeTab === 'KYC' },
    { icon: <Wallet size={18} />, label: 'Bank', active: activeTab === 'Bank' }
  ];

  const inputProps = { userData, onChange: handleInputChange, editMode, loading };

  // 3. Early Returns (ONLY after all hooks)
  if (loading && !userData.email) {
    return (
      <div className="w-full max-w-md mx-auto bg-[#F8FAFC] min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#50C2C9] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Profile Info...</p>
        </div>
      </div>
    );
  }

  // 4. Main Render
  return (
    <div className="w-full max-w-md mx-auto bg-[#F8FAFC] min-h-screen pb-28 font-sans relative">
      {/* Error Alert */}
      {error && (
        <div className="fixed top-4 left-0 right-0 z-[100] px-4 animate-in slide-in-from-top-4">
          <div className="max-w-md mx-auto bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
            <AlertCircle size={20} className="text-rose-500 flex-shrink-0" />
            <p className="text-xs font-bold text-rose-700 flex-1">{error}</p>
            <button onClick={() => setError('')} className="p-1 hover:bg-rose-100 rounded-lg transition-colors">
              <X size={16} className="text-rose-400" />
            </button>
          </div>
        </div>
      )}
      <header className="bg-white px-6 pt-10 pb-8 rounded-b-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-0 z-20">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#50C2C9] to-emerald-400 p-0.5 shadow-lg shadow-[#50C2C9]/20">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center border-2 border-white overflow-hidden relative">
                  {userData.fullName ? (
                    <span className="text-2xl font-black text-[#50C2C9] uppercase">{userData.fullName.charAt(0)}</span>
                  ) : (
                    <User className="text-slate-300" />
                  )}
                  {verificationStatus.pan.verified && (
                    <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 size={24} className="text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-md">
                <div className={`w-3 h-3 rounded-full ${verificationStatus.pan.verified ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></div>
              </div>
            </div>

            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">
                {userData.fullName || 'Guest User'}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {userData.email || 'No Email Linked'}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider ${verificationStatus.pan.verified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {verificationStatus.pan.verified ? 'Verified Investor' : 'KYC Pending'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setEditMode(!editMode)}
              className={`p-3 rounded-2xl transition-all ${editMode ? 'bg-[#50C2C9] text-white shadow-lg shadow-[#50C2C9]/30' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              {editMode ? <Save size={20} /> : <Edit2 size={20} />}
            </button>
            <button
              onClick={handleLogout}
              className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>

        <div className="bg-slate-50 p-1.5 rounded-[1.2rem] flex relative">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => setActiveTab(item.label)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all duration-300 text-[10px] font-black uppercase tracking-wider ${item.active
                ? 'bg-white text-[#50C2C9] shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="px-6 py-6 space-y-6">
        {activeTab === 'Personal' && (
          <div className="animate-in slide-in-from-right-8 duration-500 space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-[#50C2C9]/10 rounded-xl">
                  <User size={18} className="text-[#50C2C9]" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Personal Info</h3>
              </div>
              <div className="space-y-4">
                <RenderInput {...inputProps} label="Full Name" name="fullName" placeholder="John Doe" />
                <RenderInput {...inputProps} label="Email" name="email" type="email" disabled icon={<Lock size={14} />} />
                <RenderInput {...inputProps} label="Phone" name="phoneNumber" type="tel" />
                <div className="grid grid-cols-2 gap-3">
                  <RenderInput {...inputProps} label="Gender" name="gender" />
                  <RenderInput {...inputProps} label="DOB" name="dateOfBirth" type="date" />
                </div>
              </div>
            </div>
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-violet-50 rounded-xl">
                  <Home size={18} className="text-violet-500" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Address</h3>
              </div>
              <div className="space-y-4">
                <RenderInput {...inputProps} label="Flat / House No" name="houseOrFlatOrApartmentNo" />
                <RenderInput {...inputProps} label="Area / Colony" name="area" />
                <div className="grid grid-cols-2 gap-3">
                  <RenderInput {...inputProps} label="City" name="city" />
                  <RenderInput {...inputProps} label="Pincode" name="pincode" type="number" />
                </div>
                <RenderInput {...inputProps} label="State" name="state" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'KYC' && (
          <div className="animate-in slide-in-from-right-8 duration-500 space-y-6">
            <div className={`rounded-[2rem] p-6 border transition-all relative overflow-hidden ${verificationStatus.pan.verified ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-100 shadow-sm'}`}>
              <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm">
                    <BadgeCheck size={18} className={verificationStatus.pan.verified ? 'text-emerald-500' : 'text-slate-400'} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">PAN Details</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">Mandatory for Investment</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${verificationStatus.pan.verified ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  {verificationStatus.pan.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="space-y-4 relative z-10">
                <RenderInput {...inputProps} label="PAN Number" name="panNumber" placeholder="ABCDE1234F" disabled={verificationStatus.pan.verified} />
                <RenderInput {...inputProps} label="Full Name (As per PAN)" name="panFullName" disabled={verificationStatus.pan.verified} />
                {!verificationStatus.pan.verified && (
                  <button onClick={verifyPAN} disabled={isVerifying || !editMode} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-slate-800 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2">
                    {isVerifying ? (<><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Verifying...</>) : (<>Verify PAN Now <ChevronRight size={16} /></>)}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'Bank' && (
          <div className="animate-in slide-in-from-right-8 duration-500 space-y-6">
            <div className="p-4 bg-blue-50 rounded-[1.5rem] border border-blue-100 flex gap-3 items-start">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] font-bold text-blue-700 leading-relaxed">
                Ensure the bank account belongs to <span className="text-blue-900 uppercase">{userData.fullName}</span>. Third-party accounts will be rejected during withdrawal.
              </p>
            </div>
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-[#50C2C9]/10 rounded-xl">
                  <Wallet size={18} className="text-[#50C2C9]" />
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Bank Details</h3>
              </div>
              <div className="space-y-4">
                <RenderInput {...inputProps} label="Account Number" name="accountNumber" type="password" />
                <RenderInput {...inputProps} label="Re-enter Account" name="accountNumber" placeholder="Confirm Account Number" />
                <div className="grid grid-cols-2 gap-3">
                  <RenderInput {...inputProps} label="IFSC Code" name="ifscCode" />
                  <RenderInput {...inputProps} label="Bank Name" name="bankName" />
                </div>
                <RenderInput {...inputProps} label="Account Holder" name="bankFullName" />
              </div>
            </div>
          </div>
        )}

        {editMode && (
          <div className="fixed bottom-24 left-0 right-0 px-6 z-30 max-w-md mx-auto pointer-events-none">
            <button onClick={handleUpdate} className="w-full pointer-events-auto py-4 bg-[#50C2C9] text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-[#50C2C9]/30 hover:bg-[#45b1b9] active:scale-95 transition-all flex items-center justify-center gap-2">
              <Save size={18} /> Save {activeTab} Details
            </button>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center max-w-md mx-auto z-50 pb-safe">
        {[
          { icon: <Home className="w-6 h-6" />, label: 'Home', href: '/Home', isActive: (path) => path === '/Home' },
          { icon: <Bell className="w-6 h-6" />, label: 'Notification', href: '/Notifications', isActive: (path) => path === '/Notifications' },
          { icon: <PiggyBank className="w-6 h-6" />, label: 'Savings', href: '/savings', isActive: (path) => path === '/savings' || path.startsWith('/savings/') || path === '/savings_plan' },
          { icon: <CreditCard className="w-6 h-6" />, label: 'Passbook', href: '/Passbook', isActive: (path) => path === '/Passbook' },
          { icon: <User className="w-6 h-6" />, label: 'Profile', href: '/profile', isActive: (path) => path === '/profile' }
        ].map((item, index) => {
          const active = item.isActive(pathname);
          return (
            <div key={index} className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative group ${active ? 'text-[#50C2C9]' : 'text-slate-600 hover:text-slate-700'}`} onClick={() => router.push(item.href)}>
              {React.cloneElement(item.icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
              {active && <div className="absolute -bottom-4 w-8 h-1 bg-[#50C2C9] rounded-t-full"></div>}
            </div>
          );
        })}
      </nav>
    </div>
  );
}