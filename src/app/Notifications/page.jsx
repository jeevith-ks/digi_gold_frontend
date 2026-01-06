'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Icons component - using inline SVG icons
const Icons = {
  Refresh: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Bell: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  Filter: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  CheckAll: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 a9 9 0 0118 0z" />
    </svg>
  ),
  Clock: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 a9 9 0 0118 0z" />
    </svg>
  ),
  CheckCircle: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 a9 9 0 0118 0z" />
    </svg>
  ),
  AlertCircle: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Package: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  Shield: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  CreditCard: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  ),
  MessageCircle: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Mail: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Home: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  User: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  ),
  ArrowLeft: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  ArrowLeftCircle: () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
    </svg>
  )
};

// Loading Spinner Component
const LoadingSpinner = () => {
  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-gray-200"></div>
        <div className="absolute top-0 left-0 h-12 w-12 rounded-full border-4 border-[#50C2C9] border-t-transparent animate-spin"></div>
      </div>
      <p className="mt-4 text-gray-600">Loading notifications...</p>
    </div>
  );
};

// Centralized authentication helper
const useAuth = () => {
  const getAuthToken = useCallback(() => {
    // Try multiple ways to get the token based on your existing auth system
    let token = null;
    
    // Check sessionStorage first (common in many apps)
    if (typeof window !== 'undefined') {
      token = sessionStorage.getItem('authToken');
    }
    
    // Fallback to localStorage
    if (!token && typeof window !== 'undefined') {
      token = localStorage.getItem('token') || localStorage.getItem('jwt');
    }
    
    // Check for JWT in URL parameters (sometimes used for auth redirects)
    if (!token && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      token = urlParams.get('token') || urlParams.get('jwt');
    }
    
    return token;
  }, []);

  const isAuthenticated = useCallback(() => {
    return !!getAuthToken();
  }, [getAuthToken]);

  return { getAuthToken, isAuthenticated };
};

// Refresh Button Component
const RefreshButton = ({ onClick, refreshing = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={refreshing}
      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 active:scale-95"
      title="Refresh notifications"
    >
      {refreshing ? (
        <>
          <div className="h-4 w-4 border-2 border-gray-300 border-t-[#50C2C9] rounded-full animate-spin"></div>
          <span>Refreshing...</span>
        </>
      ) : (
        <>
          <Icons.Refresh />
          <span>Refresh</span>
        </>
      )}
    </button>
  );
};

// Notification Card Component
const NotificationCard = ({ notification, onMarkAsRead }) => {
  const [isRead, setIsRead] = useState(notification.is_read || false);
  const { getAuthToken } = useAuth();
  
  const handleMarkAsRead = async () => {
    if (!isRead) {
      try {
        // Get JWT token using centralized auth helper
        const token = getAuthToken();
        
        if (!token) {
          throw new Error('No authentication token found. Please login first.');
        }
        
        console.log('Marking notification as read:', notification.id);
        
        const response = await fetch(`http://172.31.11.246:5000/api/notifications/${notification.id}/read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('API Error Response:', errorData);
          throw new Error(errorData.message || 'Failed to mark notification as read');
        }
        
        const result = await response.json();
        console.log('Mark as read successful:', result);
        
        setIsRead(true);
        onMarkAsRead(notification.id);
      } catch (error) {
        console.error('Error marking as read:', error);
        alert(`Error: ${error.message}\n\nPlease ensure you are logged in and try again.`);
      }
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'order':
        return <Icons.Package />;
      case 'security':
        return <Icons.Shield />;
      case 'payment':
        return <Icons.CreditCard />;
      case 'message':
        return <Icons.MessageCircle />;
      case 'newsletter':
        return <Icons.Mail />;
      default:
        return <Icons.AlertCircle />;
    }
  };

  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return 'Recently';
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 60) {
        return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch (error) {
      return 'Recently';
    }
  };

  // Handle scroll to mark as read
  const handleCardClick = () => {
    handleMarkAsRead();
  };

  return (
    <div 
      className={`relative rounded-2xl p-5 transition-all duration-200 hover:shadow-md ${isRead ? 'bg-white' : 'bg-[#50C2C9]/10'} cursor-pointer`}
      onClick={handleCardClick}
    >
      {/* Unread indicator */}
      {!isRead && (
        <div className="absolute top-5 right-5">
          <div className="h-3 w-3 bg-[#50C2C9] rounded-full"></div>
        </div>
      )}
      
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`p-3 rounded-full ${isRead ? 'bg-gray-100' : 'bg-[#50C2C9]/20'}`}>
          <div className={isRead ? 'text-gray-600' : 'text-[#50C2C9]'}>
            {getTypeIcon(notification.type)}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 mb-2">
            <h3 className={`font-semibold ${isRead ? 'text-gray-800' : 'text-gray-900'}`}>
              {notification.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Icons.Clock />
              <span>{formatTime(notification.created_at)}</span>
            </div>
          </div>
          
          <p className={`text-gray-600 mb-3 ${isRead ? '' : 'font-medium'}`}>
            {notification.message}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${isRead 
                ? 'bg-gray-100 text-gray-600' 
                : 'bg-[#50C2C9]/20 text-[#50C2C9]'
              }`}>
                {notification.type ? notification.type.charAt(0).toUpperCase() + notification.type.slice(1) : 'System'}
              </span>
              
              {!isRead && (
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-[#50C2C9] text-white">
                  New
                </span>
              )}
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMarkAsRead();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition ${isRead
                ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                : 'text-[#50C2C9] hover:text-[#3DA9B0] hover:bg-[#50C2C9]/10'
              }`}
            >
              <Icons.CheckCircle />
              <span>{isRead ? 'Read' : 'Mark as read'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Back Button Component
const BackButton = () => {
  const router = useRouter();

  const handleBackClick = () => {
    // Redirect to /Home
    router.push('/Home');
  };

  return (
    <button
      onClick={handleBackClick}
      className="flex items-center justify-center p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#50C2C9] focus:ring-offset-2"
      aria-label="Go back to Home"
      title="Go back to Home"
    >
      <Icons.ArrowLeft className="w-6 h-6 text-gray-700" />
    </button>
  );
};

// Main Notification Page Component
export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const { getAuthToken, isAuthenticated } = useAuth();
  const router = useRouter();

  const fetchNotifications = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setRefreshing(true);
      }
      
      // Get JWT token
      const token = getAuthToken();
      if (!token) {
        const errorMsg = 'Please login first to view notifications.';
        console.log('Auth check - No token found');
        setError(errorMsg);
        setNotifications([]);
        setRefreshing(false);
        setLoading(false);
        return;
      }
      
      console.log('Fetching notifications with token:', token.substring(0, 20) + '...');
      
      const response = await fetch('http://172.31.11.246:5000/api/notifications/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        const errorText = await response.text();
        throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setNotifications(data);
      setError(null);
      console.log('Successfully fetched notifications:', data.length);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [getAuthToken]);

  const handleRefresh = () => {
    fetchNotifications(false);
  };

  useEffect(() => {
    fetchNotifications();
    
    // Set up polling for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchNotifications(false);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, is_read: true } : notification
      )
    );
  };

  const markAllAsRead = async () => {
    try {
      // Get JWT token
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login first.');
      }
      
      const response = await fetch('http://172.31.11.246:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mark all as read');
      }
      
      const result = await response.json();
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, is_read: true }))
      );
    } catch (error) {
      console.error('Error marking all as read:', error);
      alert(`Error: ${error.message}\n\nPlease ensure you are logged in and try again.`);
    }
  };

  // Check authentication status
  useEffect(() => {
    console.log('Authentication status:', isAuthenticated() ? 'Authenticated' : 'Not authenticated');
  }, [isAuthenticated]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'read') return notification.is_read;
    return true; // 'all'
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Inline CSS for the page
  const pageStyles = `
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background-color: #f9fafb;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .animate-spin {
      animation: spin 1s linear infinite;
    }
    
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    
    ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
      background: #a1a1a1;
    }
    
    * {
      transition: background-color 0.2s ease, border-color 0.2s ease;
    }
  `;

  return (
    <>
      <style>{pageStyles}</style>
      
      <div className="min-h-screen bg-gray-50">
        {/* Header with Back Button and Refresh */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center">
              {/* Lucide Back Button - Redirects to /Home */}
              <BackButton />
              
              <div className="flex-1 ml-4">
                <h1 className="text-lg font-semibold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-500">
                  {unreadCount > 0 
                    ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                    : 'All caught up!'}
                </p>
              </div>
            </div>
            
            {/* Refresh Button */}
            <div className="ml-4">
              <RefreshButton 
                onClick={handleRefresh} 
                refreshing={refreshing}
              />
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Authentication Warning */}
          {!isAuthenticated() && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Icons.AlertCircle className="text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-yellow-800">Authentication Required</h3>
                  <p className="text-yellow-700 mt-1">
                    You need to login first to view and manage notifications.
                  </p>
                  <div className="mt-3">
                    <button
                      onClick={() => router.push('/Authentication')}
                      className="px-4 py-2 bg-[#50C2C9] text-white rounded-lg hover:bg-[#3DA9B0] transition"
                    >
                      Go to Login Page
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          {isAuthenticated() && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                <Icons.Filter />
                <span className="text-gray-700 font-medium">Filter by:</span>
              </div>
              
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {[
                  { id: 'all', label: 'All', count: notifications.length },
                  { id: 'unread', label: 'Unread', count: unreadCount },
                  { id: 'read', label: 'Read', count: notifications.length - unreadCount }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setFilter(tab.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${filter === tab.id 
                      ? 'bg-[#50C2C9] text-white' 
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                    <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && isAuthenticated() && (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          )}

          {/* Error State */}
          {error && !loading && isAuthenticated() && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Icons.AlertCircle />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800">Error Loading Notifications</h3>
                  <p className="text-red-600 mt-1">{error}</p>
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={handleRefresh}
                      className="px-4 py-2 bg-[#50C2C9] text-white rounded-lg hover:bg-[#3DA9B0] transition mr-2"
                    >
                      Try Again
                    </button>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
                    >
                      Reload Page
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications List */}
          {!loading && isAuthenticated() && !error && (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-[#50C2C9] rounded-lg">
                    <Icons.Bell className="text-white" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-800">Your Notifications</h2>
                </div>
                <button
                  onClick={markAllAsRead}
                  disabled={unreadCount === 0}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <Icons.CheckAll />
                  <span>Mark all as read</span>
                </button>
              </div>

              {filteredNotifications.length > 0 ? (
                <div className="space-y-4">
                  {filteredNotifications.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
                  <div className="inline-flex p-4 bg-gray-100 rounded-full mb-4">
                    <Icons.Bell />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">No notifications found</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    {filter === 'all' 
                      ? "You don't have any notifications yet." 
                      : `You don't have any ${filter} notifications.`}
                  </p>
                  <button
                    onClick={handleRefresh}
                    className="mt-4 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Refresh to check
                  </button>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          {isAuthenticated() && !loading && (
            <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
              <button
                onClick={() => router.push('/Home')}
                className="px-5 py-2.5 bg-[#50C2C9] text-white rounded-lg font-medium hover:bg-[#3DA9B0] transition flex items-center gap-2"
              >
                <Icons.Home />
                <span>Go to Home</span>
              </button>
            </div>
          )}

          {/* Instructions */}
          {/* {isAuthenticated() && (
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Icons.AlertCircle className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-800">How to use:</h4>
                  <ul className="mt-2 text-sm text-blue-600 space-y-1">
                    <li>• Click on any notification to mark it as read</li>
                    <li>• Use the "Mark all as read" button to clear all notifications</li>
                    <li>• Filter notifications using the tabs above</li>
                    <li>• Notifications automatically refresh every 30 seconds</li>
                  </ul>
                </div>
              </div>
            </div>
          )} */}
        </div>
      </div>
    </>
  );
}