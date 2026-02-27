'use client';
import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowLeft, ArrowRight, ShieldCheck, Key, Eye, EyeOff } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useAlert } from '@/context/AlertContext';

export default function ForgotPasswordPage() {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP & New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const { showAlert } = useAlert();
    const router = useRouter();

    // Generate consistent particle positions for background
    const particlePositions = Array.from({ length: 15 }, (_, i) => ({
        left: ((i * 37) % 100),
        top: ((i * 23 + 17) % 100),
        delay: (i * 0.3) % 3,
        duration: 3 + (i * 0.2) % 2
    }));

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleRequestReset = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            const response = await fetch(`${apiUrl}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                showAlert("Reset code sent to your email!", "success");
                setStep(2);
            } else {
                const data = await response.json();
                showAlert(data.message || "Email not found", "error");
            }
        } catch (error) {
            showAlert("Check your internet connection", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdatePassword = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            showAlert("Passwords do not match", "warning");
            return;
        }

        if (newPassword.length < 6) {
            showAlert("Password must be at least 6 characters", "warning");
            return;
        }

        setIsLoading(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
            console.log("Updating password for:", email);
            const response = await fetch(`${apiUrl}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    otp,
                    newPassword
                })
            });

            if (response.ok) {
                showAlert("Password updated successfully!", "success");
                router.push("/Authentication");
            } else {
                const data = await response.json();
                showAlert(data.message || "Invalid reset code", "error");
            }
        } catch (error) {
            showAlert("Failed to update password", "error");
        } finally {
            setIsLoading(false);
        }
    };

    if (!isClient) return null;

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-cyan-400 via-teal-400 to-blue-500">
            {/* Animated background elements */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full border border-white/10"></div>
                <div className="absolute top-3/4 right-1/4 w-96 h-96 rounded-full border border-white/10"></div>
                <div className="absolute top-1/2 left-3/4 w-64 h-64 rounded-full border border-white/10"></div>
            </div>

            {/* Floating particles - only render on client to avoid hydration mismatch */}
            {isClient && (
                <div className="absolute inset-0 overflow-hidden">
                    {particlePositions.map((particle, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-2 bg-white bg-opacity-30 rounded-full animate-bounce"
                            style={{
                                left: `${particle.left}%`,
                                top: `${particle.top}%`,
                                animationDelay: `${particle.delay}s`,
                                animationDuration: `${particle.duration}s`
                            }}
                        ></div>
                    ))}
                </div>
            )}

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Glassmorphism container */}
                    <div className="backdrop-blur-xl bg-white bg-opacity-5 rounded-3xl p-8 shadow-2xl border border-white border-opacity-10 transition-all duration-500 hover:bg-opacity-10 hover:scale-105" style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 25px 45px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}>

                        {/* Back to Login */}
                        <button
                            onClick={() => step === 2 ? setStep(1) : router.push("/Authentication")}
                            className="flex items-center gap-2 text-white text-opacity-80 hover:text-white transition-colors mb-8 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-semibold uppercase tracking-widest">Back to Login</span>
                        </button>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}>
                                {step === 1 ? (
                                    <ShieldCheck className="w-10 h-10 text-white" />
                                ) : (
                                    <Key className="w-10 h-10 text-white" />
                                )}
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                                {step === 1 ? 'Forgot Password?' : 'Reset Password'}
                            </h1>
                            <p className="text-white text-opacity-80 text-sm">
                                {step === 1
                                    ? "Enter your email to receive a reset code"
                                    : "Enter the code sent to your email and your new password"}
                            </p>
                        </div>

                        {/* Step 1: Request Reset */}
                        {step === 1 && (
                            <form onSubmit={handleRequestReset} className="space-y-6">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-white text-opacity-60 group-focus-within:text-white transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email Address"
                                        required
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            backdropFilter: 'blur(10px)',
                                            WebkitBackdropFilter: 'blur(10px)',
                                            borderColor: 'rgba(255, 255, 255, 0.15)'
                                        }}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full text-white py-4 px-6 rounded-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center group hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}
                                >
                                    <span>{isLoading ? 'Sending...' : 'Send Reset Code'}</span>
                                    {!isLoading && <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />}
                                </button>
                            </form>
                        )}

                        {/* Step 2: Update Password */}
                        {step === 2 && (
                            <form onSubmit={handleUpdatePassword} className="space-y-6">
                                {/* OTP Input */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <ShieldCheck className="h-5 w-5 text-white text-opacity-60 group-focus-within:text-white transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter 6-digit code"
                                        required
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            backdropFilter: 'blur(10px)',
                                            WebkitBackdropFilter: 'blur(10px)',
                                            borderColor: 'rgba(255, 255, 255, 0.15)'
                                        }}
                                    />
                                </div>

                                {/* New Password */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-white text-opacity-60 group-focus-within:text-white transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New Password"
                                        required
                                        className="w-full pl-12 pr-12 py-4 rounded-2xl border text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            backdropFilter: 'blur(10px)',
                                            WebkitBackdropFilter: 'blur(10px)',
                                            borderColor: 'rgba(255, 255, 255, 0.15)'
                                        }}
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-white text-opacity-60 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                    </button>
                                </div>

                                {/* Confirm Password */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-white text-opacity-60 group-focus-within:text-white transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm New Password"
                                        required
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl border text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.08)',
                                            backdropFilter: 'blur(10px)',
                                            WebkitBackdropFilter: 'blur(10px)',
                                            borderColor: 'rgba(255, 255, 255, 0.15)'
                                        }}
                                        minLength={6}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full text-white py-4 px-6 rounded-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300 flex items-center justify-center group hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.15)',
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)'
                                    }}
                                >
                                    <span>{isLoading ? 'Updating...' : 'Update Password'}</span>
                                    {!isLoading && <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />}
                                </button>

                                <p className="text-center text-white text-opacity-60 text-xs mt-4">
                                    Didn't receive code? <button type="button" onClick={() => setStep(1)} className="text-white font-semibold hover:underline">Resend</button>
                                </p>
                            </form>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
