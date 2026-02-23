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
            const response = await fetch("http://65.2.152.254:5000/api/auth/forgot-password", {
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
            // Assuming the same endpoint or similar for the update step
            // The user specified /forgot-password, so let's use it for the full flow if it handles both
            // Usually, it's a different endpoint for reset, but I'll follow the user's hint
            const response = await fetch("http://65.2.152.254:5000/api/auth/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    otp, // or token
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
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
            {/* Animated background elements */}
            <div className="absolute inset-0">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute top-3/4 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 overflow-hidden">
                {particlePositions.map((particle, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-white/20 rounded-full animate-pulse"
                        style={{
                            left: `${particle.left}%`,
                            top: `${particle.top}%`,
                            animationDelay: `${particle.delay}s`,
                            animationDuration: `${particle.duration}s`
                        }}
                    ></div>
                ))}
            </div>

            <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
                <div className="w-full max-w-md">
                    {/* Glassmorphism container */}
                    <div className="backdrop-blur-xl bg-white/10 rounded-[2.5rem] p-8 shadow-2xl border border-white/20 transition-all duration-500 hover:bg-white/20" style={{
                        boxShadow: '0 25px 45px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2)'
                    }}>

                        {/* Back to Login */}
                        <button
                            onClick={() => step === 2 ? setStep(1) : router.push("/Authentication")}
                            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-8 group"
                        >
                            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            <span className="text-sm font-bold uppercase tracking-widest">Back</span>
                        </button>

                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-white/10 border border-white/20 flex items-center justify-center shadow-inner">
                                {step === 1 ? (
                                    <ShieldCheck className="w-10 h-10 text-white" />
                                ) : (
                                    <Key className="w-10 h-10 text-white" />
                                )}
                            </div>
                            <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
                                {step === 1 ? 'Forgot Password?' : 'Reset Password'}
                            </h1>
                            <p className="text-white/70 text-sm font-medium">
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
                                        <Mail className="h-5 w-5 text-white/50 group-focus-within:text-white transition-colors" />
                                    </div>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Email Address"
                                        required
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-white text-purple-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
                                    ) : (
                                        <>Send Code <ArrowRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </form>
                        )}

                        {/* Step 2: Update Password */}
                        {step === 2 && (
                            <form onSubmit={handleUpdatePassword} className="space-y-5">
                                {/* OTP Input */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <ShieldCheck className="h-5 w-5 text-white/50 group-focus-within:text-white transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="Enter 6-digit code"
                                        required
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium"
                                    />
                                </div>

                                {/* New Password */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-white/50 group-focus-within:text-white transition-colors" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="New Password"
                                        required
                                        className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-white/40 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>

                                {/* Confirm Password */}
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-white/50 group-focus-within:text-white transition-colors" />
                                    </div>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm New Password"
                                        required
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all font-medium"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-white text-purple-600 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <div className="w-5 h-5 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
                                    ) : (
                                        'Update Password'
                                    )}
                                </button>

                                <p className="text-center text-white/50 text-xs mt-4">
                                    Didn't receive code? <button type="button" onClick={() => setStep(1)} className="text-white hover:underline">Resend</button>
                                </p>
                            </form>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
