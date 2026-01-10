'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Home, Bell, PiggyBank, CreditCard, User } from 'lucide-react';

const BottomNavigation = ({ unreadCount = 0 }) => {
    const router = useRouter();
    const pathname = usePathname();

    const navItems = [
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
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-between items-center max-w-md mx-auto z-50 pb-safe">
            {navItems.map((item, index) => {
                const active = item.isActive(pathname);

                return (
                    <div
                        key={index}
                        className={`flex flex-col items-center gap-1 cursor-pointer transition-colors relative group ${active
                            ? 'text-[#50C2C9]'
                            : 'text-slate-300 hover:text-slate-500'
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
    );
};

export default BottomNavigation;
