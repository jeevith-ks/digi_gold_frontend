'use client';

import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

const CustomAlert = ({ message, type = 'info', title, onClose, onConfirm, isConfirm }) => {
    const [isExiting, setIsExiting] = useState(false);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300); // Wait for animation
    };

    const handleConfirm = () => {
        setIsExiting(true);
        setTimeout(onConfirm, 300);
    };

    const getTypeStyles = () => {
        switch (type) {
            case 'success':
                return {
                    icon: <CheckCircle className="w-6 h-6 text-emerald-500" />,
                    bg: 'bg-emerald-50/90',
                    border: 'border-emerald-200',
                    accent: 'bg-emerald-500',
                    text: 'text-emerald-900',
                    shadow: 'shadow-emerald-200/50'
                };
            case 'error':
                return {
                    icon: <AlertCircle className="w-6 h-6 text-rose-500" />,
                    bg: 'bg-rose-50/90',
                    border: 'border-rose-200',
                    accent: 'bg-rose-500',
                    text: 'text-rose-900',
                    shadow: 'shadow-rose-200/50'
                };
            case 'warning':
                return {
                    icon: <AlertTriangle className="w-6 h-6 text-amber-500" />,
                    bg: 'bg-amber-50/90',
                    border: 'border-amber-200',
                    accent: 'bg-amber-500',
                    text: 'text-amber-900',
                    shadow: 'shadow-amber-200/50'
                };
            case 'confirm':
                return {
                    icon: <AlertCircle className="w-6 h-6 text-blue-500" />,
                    bg: 'bg-blue-50/90',
                    border: 'border-blue-200',
                    accent: 'bg-blue-500',
                    text: 'text-blue-900',
                    shadow: 'shadow-blue-200/50'
                };
            default:
                return {
                    icon: <Info className="w-6 h-6 text-blue-500" />,
                    bg: 'bg-blue-50/90',
                    border: 'border-blue-200',
                    accent: 'bg-blue-500',
                    text: 'text-blue-900',
                    shadow: 'shadow-blue-200/50'
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                onClick={handleClose}
            ></div>

            {/* Alert Modal */}
            <div className={`relative w-full max-w-sm transform transition-all duration-300 ${isExiting ? 'scale-95 translate-y-4' : 'scale-100'}`}>
                <div className={`overflow-hidden rounded-[2rem] border ${styles.border} ${styles.bg} ${styles.shadow} shadow-2xl backdrop-blur-md`}>

                    {/* Top Accent Bar */}
                    <div className={`h-2 w-full ${styles.accent}`}></div>

                    <div className="p-8">
                        <div className="flex flex-col items-center text-center">
                            {/* Icon Wrapper */}
                            <div className={`mb-6 p-4 rounded-3xl ${styles.bg} border ${styles.border} shadow-sm`}>
                                {styles.icon}
                            </div>

                            {/* Title */}
                            <h3 className={`text-xl font-black mb-2 tracking-tight ${styles.text}`}>
                                {title}
                            </h3>

                            {/* Message */}
                            <p className="text-sm font-bold text-slate-600 leading-relaxed mb-8">
                                {message}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex gap-3 w-full">
                                {isConfirm && (
                                    <button
                                        onClick={handleClose}
                                        className="flex-1 py-4 px-4 rounded-2xl font-black text-slate-500 bg-white/50 border border-slate-200 shadow-sm transition-transform active:scale-95 hover:bg-white uppercase tracking-widest text-xs"
                                    >
                                        Cancel
                                    </button>
                                )}
                                <button
                                    onClick={isConfirm ? handleConfirm : handleClose}
                                    className={`flex-1 py-4 px-6 rounded-2xl font-black text-white ${styles.accent} shadow-lg transition-transform active:scale-95 hover:brightness-110 focus:outline-none uppercase tracking-widest text-xs`}
                                >
                                    {isConfirm ? 'Confirm' : 'Continue'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Close Button (Icon) - Only show for non-confirm alerts */}
                    {!isConfirm && (
                        <button
                            onClick={handleClose}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/20 transition-colors"
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    )}
                </div>
            </div>

            <style jsx>{`
                @keyframes bounceIn {
                    0% { transform: scale(0.9); opacity: 0; }
                    70% { transform: scale(1.05); }
                    100% { transform: scale(1); opacity: 1; }
                }
                .max-w-sm {
                    animation: bounceIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
            `}</style>
        </div>
    );
};

export default CustomAlert;
