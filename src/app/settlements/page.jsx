// app/page.js (for Next.js 13+ App Router) or pages/index.js (for Pages Router)

"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Import useRouter

export default function SettlementsPage() {
  const router = useRouter(); // Initialize router
  const [activeTab, setActiveTab] = useState('pending');
  const [settlements, setSettlements] = useState([]);
  const [filteredSettlements, setFilteredSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    // Get token from sessionStorage when component mounts
    if (typeof window !== 'undefined') {
      const authToken = sessionStorage.getItem('authToken');
      if (authToken) {
        setToken(authToken);
      } else {
        console.warn('No auth token found in sessionStorage');
        setApiError(true);
        setApiErrorMessage('Authentication required. Please log in.');
        // Redirect to authentication page
        router.push('/Authentication');
      }
    }
  }, [router]);

  useEffect(() => {
    if (token) {
      fetchSettlements();
    }
  }, [token]);

  useEffect(() => {
    // Filter settlements based on active tab
    if (activeTab === 'pending') {
      setFilteredSettlements(settlements.filter(item => item.status === 'COMPLETED'));
    } else {
      setFilteredSettlements(settlements.filter(item => item.status === 'SETTLED'));
    }
  }, [activeTab, settlements]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      setApiError(false);
      setApiErrorMessage('');
      
      // Check if token exists
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Using fetch with timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      const response = await fetch('http://172.31.11.246:5000/api/admin/completed-settled-sips', {
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${token}`, // Add Bearer prefix if needed
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.status === 401) {
        // Clear token and redirect to login
        sessionStorage.removeItem('authToken');
        setToken('');
        throw new Error('Unauthorized - Token may be expired or invalid');
      }
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the API response to match frontend structure
      const transformedData = transformApiData(data);
      setSettlements(transformedData);
      
      console.log('API loaded successfully:', transformedData.length, 'settlements loaded');
      
    } catch (err) {
      console.error('Error fetching settlements from API:', err.message || err);
      
      // Set error state for UI feedback
      setApiError(true);
      setApiErrorMessage(err.message || 'Unable to connect to API server');
      
      // Load sample data as fallback - user will still see the UI
      const sampleData = getSampleData();
      setSettlements(sampleData);
      
      console.log('Using sample data as fallback:', sampleData.length, 'sample settlements loaded');
      
    } finally {
      setLoading(false);
    }
  };

  const transformApiData = (apiData) => {
    const transformed = [];
    
    // Process Fixed SIPs
    if (apiData.sipsFixed && Array.isArray(apiData.sipsFixed)) {
      apiData.sipsFixed.forEach(sip => {
        transformed.push({
          id: sip.id,
          sip_id: sip.id,
          name: `User ${sip.user_id}`,
          user_id: sip.user_id,
          amount: parseFloat(sip.total_amount_paid) || 0,
          date: sip.created_at ? new Date(sip.created_at).toISOString().split('T')[0] : 'N/A',
          status: sip.status,
          description: `Fixed SIP - ${sip.sipPlanAdmin?.Yojna_name || 'Unknown Plan'}`,
          metal_type: sip.sipPlanAdmin?.metal_type || 'GOLD',
          sip_type: 'FIXED',
          sipPlanAdmin: sip.sipPlanAdmin
        });
      });
    }
    
    // Process Flexible SIPs
    if (apiData.sipsFlexible && Array.isArray(apiData.sipsFlexible)) {
      apiData.sipsFlexible.forEach(sip => {
        transformed.push({
          id: `flex-${sip.id}`,
          sip_id: sip.id,
          name: `User ${sip.user_id}`,
          user_id: sip.user_id,
          amount: parseFloat(sip.total_amount_paid) || 0,
          date: sip.created_at ? new Date(sip.created_at).toISOString().split('T')[0] : 'N/A',
          status: sip.status,
          description: `Flexible SIP - ${sip.metal_type}`,
          metal_type: sip.metal_type || 'GOLD',
          sip_type: 'FLEXIBLE',
        });
      });
    }
    
    return transformed;
  };

  const getSampleData = () => {
    // Sample data for demonstration if API is not available
    return [
      { id: 1, name: 'John Doe', amount: 1250.75, date: '2023-10-15', status: 'COMPLETED', description: 'Fixed SIP - Gold Plan', sip_type: 'FIXED', metal_type: 'GOLD' },
      { id: 2, name: 'Acme Corp', amount: 3250.50, date: '2023-10-10', status: 'SETTLED', description: 'Flexible SIP - Silver', sip_type: 'FLEXIBLE', metal_type: 'SILVER' },
      { id: 3, name: 'Jane Smith', amount: 850.00, date: '2023-10-12', status: 'COMPLETED', description: 'Fixed SIP - Platinum Plan', sip_type: 'FIXED', metal_type: 'GOLD' },
      { id: 4, name: 'Tech Solutions LLC', amount: 4200.25, date: '2023-10-05', status: 'SETTLED', description: 'Flexible SIP - Gold', sip_type: 'FLEXIBLE', metal_type: 'GOLD' },
      { id: 5, name: 'Robert Johnson', amount: 950.00, date: '2023-10-18', status: 'COMPLETED', description: 'Fixed SIP - Gold Plan', sip_type: 'FIXED', metal_type: 'GOLD' },
      { id: 6, name: 'Global Enterprises', amount: 1750.00, date: '2023-09-28', status: 'SETTLED', description: 'Fixed SIP - Silver Plan', sip_type: 'FIXED', metal_type: 'SILVER' },
      { id: 7, name: 'Sarah Williams', amount: 2200.00, date: '2023-10-20', status: 'COMPLETED', description: 'Flexible SIP - Gold', sip_type: 'FLEXIBLE', metal_type: 'GOLD' },
      { id: 8, name: 'Innovate Inc', amount: 1800.50, date: '2023-10-08', status: 'SETTLED', description: 'Fixed SIP - Gold Plan', sip_type: 'FIXED', metal_type: 'GOLD' },
    ];
  };

  const handleSettleSIP = async (sipId, sipType) => {
    try {
      if (!token) {
        alert('Authentication required. Please log in again.');
        router.push('/Authentication');
        return;
      }

      const response = await fetch('http://172.31.11.246:5000/api/admin/settlements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          sip_id: sipId,
          sip_type: sipType
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        alert(data.message || 'SIP settled successfully!');
        // Refresh the data
        fetchSettlements();
      } else if (response.status === 401) {
        // Token expired, redirect to login
        sessionStorage.removeItem('authToken');
        setToken('');
        alert('Session expired. Please log in again.');
        router.push('/Authentication');
      } else {
        alert(data.message || 'Failed to settle SIP');
      }
    } catch (error) {
      console.error('Error settling SIP:', error);
      alert('Failed to settle SIP. Please try again.');
    }
  };

  const handleRetry = () => {
    fetchSettlements();
  };

  const handleLoginRedirect = () => {
    // Redirect to authentication page
    router.push('/Authentication');
  };

  const handleLogout = () => {
    sessionStorage.removeItem('authToken');
    setToken('');
    router.push('/Authentication');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">SIP Settlements</h1>
          <p className="text-gray-600 mt-2">View and manage completed and settled SIPs</p>
        </div>
        {token && (
          <button 
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Logout
          </button>
        )}
      </header>

      {/* Authentication Error */}
      {!token && apiErrorMessage.includes('Authentication') && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Authentication Required</span>
          </div>
          <p className="mt-2">You need to be logged in to access settlements.</p>
          <button 
            onClick={handleLoginRedirect}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
          >
            Go to Login
          </button>
        </div>
      )}

      {/* API Error Warning (non-intrusive) */}
      {apiError && token && !apiErrorMessage.includes('Authentication') && (
        <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex justify-between items-center">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <span className="font-medium">Using demo data</span>
              <span className="text-sm ml-2">(API connection failed)</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleRetry}
              className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded hover:bg-yellow-200 transition-colors duration-200"
            >
              Retry API
            </button>
            <button 
              onClick={handleLogout}
              className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors duration-200"
            >
              Re-login
            </button>
          </div>
        </div>
      )}

      {/* Tabs Navigation - Only show if we have token */}
      {token && (
        <>
          <div className="mb-8">
            <div className="flex border-b border-gray-200">
              <button
                className={`px-6 py-3 font-medium text-lg transition-all duration-200 ${activeTab === 'pending' 
                  ? 'border-b-2 text-[#50C2C9] border-[#50C2C9]' 
                  : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('pending')}
              >
                Completed SIPs
                {activeTab === 'pending' && (
                  <span className="ml-2 bg-[#50C2C9] text-white text-xs px-2 py-1 rounded-full">
                    {settlements.filter(item => item.status === 'COMPLETED').length}
                  </span>
                )}
              </button>
              <button
                className={`px-6 py-3 font-medium text-lg transition-all duration-200 ${activeTab === 'settled' 
                  ? 'border-b-2 text-[#50C2C9] border-[#50C2C9]' 
                  : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setActiveTab('settled')}
              >
                Settled SIPs
                {activeTab === 'settled' && (
                  <span className="ml-2 bg-[#50C2C9] text-white text-xs px-2 py-1 rounded-full">
                    {settlements.filter(item => item.status === 'SETTLED').length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold text-gray-700">
                {activeTab === 'pending' ? 'Completed SIPs Ready for Settlement' : 'Settled SIPs History'}
              </h2>
              {apiError && !apiErrorMessage.includes('Authentication') && (
                <p className="text-sm text-yellow-600 mt-1">
                  Showing sample data. Check console for API error details.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleRetry}
                className="px-4 py-2 bg-[#50C2C9] text-white rounded-lg hover:bg-[#3fa9b0] transition-colors duration-200 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                Refresh Data
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && token && (
            <div className="flex justify-center items-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#50C2C9] mx-auto mb-4"></div>
                <p className="text-gray-600">Loading settlements...</p>
                {apiError && (
                  <p className="text-sm text-yellow-600 mt-2">Falling back to sample data</p>
                )}
              </div>
            </div>
          )}

          {/* Settlements Grid */}
          {!loading && token && (
            <>
              {filteredSettlements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSettlements.map((settlement) => (
                    <SettlementCard 
                      key={settlement.id} 
                      settlement={settlement} 
                      activeTab={activeTab}
                      isDemoData={apiError}
                      onSettleSIP={handleSettleSIP}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No {activeTab === 'pending' ? 'completed' : 'settled'} SIPs</h3>
                  <p className="text-gray-500">
                    {activeTab === 'pending' 
                      ? 'All SIPs have been settled.' 
                      : 'No SIPs have been settled yet.'}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Summary Footer */}
          {!loading && filteredSettlements.length > 0 && token && (
            <div className="mt-8 p-4 bg-white rounded-lg shadow-sm border border-gray-100">
              <div className="flex flex-wrap justify-between items-center">
                <div>
                  <p className="text-gray-600">Total {activeTab === 'pending' ? 'completed' : 'settled'} amount:</p>
                  <p className="text-2xl font-bold text-gray-800">
                    ${filteredSettlements.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
                  </p>
                  {apiError && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Based on sample data
                    </p>
                  )}
                </div>
                <div className="text-gray-600">
                  <span className="font-medium">{filteredSettlements.length}</span> {activeTab === 'pending' ? 'completed' : 'settled'} SIPs
                  {apiError && (
                    <div className="text-xs text-yellow-600 mt-1">
                      Real-time data unavailable
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Debug Information - Hidden in production */}
      {process.env.NODE_ENV === 'development' && apiError && token && (
        <div className="mt-8 p-4 bg-gray-900 text-gray-300 text-sm rounded-lg font-mono">
          <div className="flex items-center mb-2">
            <svg className="w-4 h-4 mr-2 text-red-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Debug Information</span>
          </div>
          <div className="pl-6">
            <p>Endpoint: http://172.31.11.246:5000/api/admin/completed-settled-sips</p>
            <p className="mt-1">Error: {apiErrorMessage}</p>
            <p className="mt-1">Token available: {token ? 'Yes' : 'No'}</p>
            <p className="mt-1">Token length: {token ? token.length : 0}</p>
            <p className="mt-1">Token first 20 chars: {token ? token.substring(0, 20) + '...' : 'N/A'}</p>
            <p className="mt-2 text-gray-400">
              Check if your backend expects "Bearer " prefix in Authorization header.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// SettlementCard component with settle button
function SettlementCard({ settlement, activeTab, isDemoData, onSettleSIP }) {
  const statusColors = {
    'COMPLETED': 'bg-yellow-100 text-yellow-800',
    'SETTLED': 'bg-green-100 text-green-800',
  };

  const metalColors = {
    'GOLD': 'bg-yellow-100 text-yellow-800',
    'SILVER': 'bg-gray-100 text-gray-800',
    'PLATINUM': 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="font-bold text-lg text-gray-800">{settlement.name}</h3>
          <p className="text-sm text-gray-500">User ID: {settlement.user_id}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[settlement.status] || 'bg-gray-100 text-gray-800'}`}>
          {settlement.status}
        </span>
      </div>
      
      <div className="mb-4">
        <p className="text-gray-600 text-sm mb-1">SIP Description</p>
        <p className="font-medium text-gray-800">{settlement.description}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <p className="text-gray-600 text-sm mb-1">Amount</p>
          <p className="font-bold text-xl text-gray-800">${settlement.amount.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600 text-sm mb-1">Date Created</p>
          <p className="font-medium text-gray-800">{settlement.date}</p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-6">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${metalColors[settlement.metal_type] || 'bg-gray-100 text-gray-800'}`}>
          {settlement.metal_type || 'GOLD'}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {settlement.sip_type}
        </span>
      </div>
      
      {activeTab === 'pending' && settlement.status === 'COMPLETED' && (
        <button
          onClick={() => onSettleSIP(settlement.sip_id, settlement.sip_type)}
          className="w-full py-3 bg-[#50C2C9] text-white rounded-lg font-medium hover:bg-[#3fa9b0] transition-colors duration-200"
          disabled={isDemoData}
        >
          {isDemoData ? 'Demo Mode' : 'Settle SIP'}
        </button>
      )}
      
      {activeTab === 'settled' && settlement.status === 'SETTLED' && (
        <div className="text-center py-2 text-green-600 font-medium">
          ✓ Already Settled
        </div>
      )}
      
      {isDemoData && (
        <p className="text-xs text-yellow-600 mt-2 text-center">
          Demo data - Settle button disabled
        </p>
      )}
    </div>
  );
}