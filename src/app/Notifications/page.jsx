'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Bell,
  ArrowLeft,
  CheckCircle,
  Clock,
  Filter,
  Home,
  PiggyBank,
  CreditCard,
  User,
  RefreshCw,
  XCircle,
  AlertCircle,
  Check,
  Mail,
  Shield,
  MessageCircle,
  Package
} from 'lucide-react';

const NotificationsPage = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [userType, setUserType] = useState('');
  const [username, setUsername] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Initialize user data
    if (typeof window !== 'undefined') {
      const storedUserType = sessionStorage.getItem('userType');
      const storedUsername = sessionStorage.getItem('username');
      if (storedUserType) setUserType(storedUserType);
      if (storedUsername) setUsername(storedUsername);

      fetchNotifications();
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      setRefreshing(true);
      const token = sessionStorage.getItem('authToken');

      if (!token) {
        // Handle unauthenticated state if needed
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await fetch('http://65.2.152.254:5000/api/notifications', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both possible response structures (array or object with notifications key)
        const notifs = Array.isArray(data) ? data : (data.notifications || []);
        setNotifications(notifs);
      }
    } catch (error) {
      
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`http://65.2.152.254:5000/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === id ? { ...notification, is_read: true } : notification
          )
        );
      }
    } catch (error) {
      
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = sessionStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('http://65.2.152.254:5000/api/notifications/read-all', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(notification => ({ ...notification, is_read: true }))
        );
      }
    } catch (error) {
      
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.is_read;
    if (filter === 'read') return notification.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;



  const getTypeIcon = (type) => {
    switch (type) {
      case 'order': return <Package size={18} />;
      case 'security': return <Shield size={18} />;
      case 'payment': return <CreditCard size={18} />;
      case 'message': return <MessageCircle size={18} />;
      case 'newsletter': return <Mail size={18} />;
      case 'success': return <CheckCircle size={18} className="text-emerald-500" />;
      case 'warning': return <AlertCircle size={18} className="text-amber-500" />;
      case 'error': return <XCircle size={18} className="text-rose-500" />;
      default: return <Bell size={18} />;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-[#F8FAFC] min-h-screen pb-24 font-sans relative">

      {/* Header */}
      <header className="bg-white px-6 pt-10 pb-8 rounded-b-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] sticky top-0 z-20">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/Home')}
              className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft size={20} className="text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">Notifications</h1>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {unreadCount > 0 ? `${unreadCount} New Updates` : 'All caught up'}
              </p>
            </div>
          </div>
          <button
            onClick={fetchNotifications}
            disabled={refreshing}
            className="p-3 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors"
          >
            <RefreshCw size={20} className={`text-slate-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-slate-50 p-1.5 rounded-[1.2rem]">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'read', label: 'Read' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 ${filter === tab.id ? 'bg-white text-[#50C2C9] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
            >
              {tab.label}
              <span className="ml-1 opacity-70">
                ({tab.id === 'all' ? notifications.length : tab.id === 'unread' ? unreadCount : notifications.length - unreadCount})
              </span>
            </button>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6 space-y-4">

        {/* Actions */}
        {unreadCount > 0 && (
          <div className="flex justify-end mb-2">
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-slate-50 text-[10px] font-black text-[#50C2C9] uppercase tracking-wider hover:bg-slate-50 active:scale-95 transition-all"
            >
              <CheckCircle size={12} />
              Mark all as read
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#50C2C9]/20 border-t-[#50C2C9] rounded-full animate-spin mb-4"></div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Updates...</p>
          </div>
        ) : filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => markAsRead(notification.id)}
              className={`p-5 rounded-[1.5rem] border transition-all cursor-pointer group active:scale-[0.98] ${notification.is_read
                ? 'bg-white border-slate-50'
                : 'bg-white border-[#50C2C9]/20 shadow-lg shadow-[#50C2C9]/5 relative overflow-hidden'
                }`}
            >
              {!notification.is_read && (
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-[#50C2C9]/10 to-transparent rounded-bl-[3rem] -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
              )}

              <div className="flex gap-4 relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notification.is_read ? 'bg-slate-50 text-slate-400' : 'bg-[#50C2C9]/10 text-[#50C2C9]'
                  }`}>
                  {getTypeIcon(notification.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm font-black ${notification.is_read ? 'text-slate-600' : 'text-slate-800'}`}>
                      {notification.title}
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 whitespace-nowrap ml-2">
                      <Clock size={10} />
                      {new Date(notification.created_at || notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className={`text-xs font-medium leading-relaxed ${notification.is_read ? 'text-slate-400' : 'text-slate-500'}`}>
                    {notification.message}
                  </p>

                  <div className="flex justify-between items-center mt-3">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${notification.type === 'error' ? 'bg-rose-50 text-rose-500' :
                      notification.type === 'warning' ? 'bg-amber-50 text-amber-500' :
                        notification.type === 'success' ? 'bg-emerald-50 text-emerald-500' :
                          'bg-slate-50 text-slate-400'
                      }`}>
                      {notification.type || 'System'}
                    </span>

                    {!notification.is_read && (
                      <span className="text-[10px] font-bold text-[#50C2C9] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Read <Check size={12} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-50 shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={24} className="text-slate-300" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-1">No Notifications</h3>
            <p className="text-xs font-medium text-slate-400">You don't have any {filter !== 'all' ? filter : ''} notifications</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center max-w-md mx-auto z-50 pb-safe">
        {[
          {
            icon: <Home className="w-6 h-6" />,
            label: 'Home',
            href: '/Home',
            isActive: (path) => path === '/Home'
          },
          {
            icon: <Bell className="w-6 h-6" />,
            label: 'Notification',
            href: '/Notifications',
            isActive: (path) => path === '/Notifications'
          },
          {
            icon: <PiggyBank className="w-6 h-6" />,
            label: 'Savings',
            href: '/savings',
            isActive: (path) => path === '/savings' || path.startsWith('/savings/') || path === '/savings_plan'
          },
          {
            icon: <CreditCard className="w-6 h-6" />,
            label: 'Passbook',
            href: '/Passbook',
            isActive: (path) => path === '/Passbook'
          },
          {
            icon: <User className="w-6 h-6" />,
            label: 'Profile',
            href: '/profile',
            isActive: (path) => path === '/profile'
          }
        ].map((item, index) => {
          const pathname = usePathname();
          const active = item.isActive(pathname);

          return (
            <div
              key={index}
              className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative group ${active
                ? 'text-[#50C2C9]'
                : 'text-slate-600 hover:text-slate-700'
                }`}
              onClick={() => router.push(item.href)}
            >
              {React.cloneElement(item.icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
              <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>

              {item.label === 'Notification' && unreadCount > 0 && (
                <span className="absolute top-0 right-1/4 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
              )}

              {active && (
                <div className="absolute -bottom-4 w-8 h-1 bg-[#50C2C9] rounded-t-full"></div>
              )}
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default NotificationsPage;