'use client';
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Generate consistent particle positions
  const particlePositions = Array.from({ length: 15 }, (_, i) => ({
    left: ((i * 37) % 100),
    top: ((i * 23 + 17) % 100),
    delay: (i * 0.3) % 3,
    duration: 3 + (i * 0.2) % 2
  }));

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Register submitted:', formData);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-cyan-400 via-teal-400 to-blue-500">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72  "></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96  "></div>
        <div className="absolute top-1/2 left-3/4 w-64 h-64  "></div>
      </div>

      {/* Floating particles */}
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
          <div
            className="backdrop-blur-xl bg-white bg-opacity-5 rounded-3xl p-8 shadow-2xl border border-white border-opacity-10 transition-all duration-500 hover:bg-opacity-10 hover:scale-105"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 25px 45px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <div
                className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}
              >
                <User className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
              <p className="text-white text-opacity-80">Join us today</p>
            </div>

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-white text-opacity-60 group-focus-within:text-white" />
                </div>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border text-white placeholder-white placeholder-opacity-60 placeholder-font-size-30 focus:outline-none focus:ring-2 focus:ring-white"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderColor: 'rgba(255, 255, 255, 0.15)'
                  }}
                  required
                />
              </div>

              {/* Email */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-white text-opacity-60 group-focus-within:text-white" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderColor: 'rgba(255, 255, 255, 0.15)'
                  }}
                  required
                />
              </div>

              {/* Password */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white text-opacity-60 group-focus-within:text-white" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderColor: 'rgba(255, 255, 255, 0.15)'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white text-opacity-60 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Confirm Password */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white text-opacity-60 group-focus-within:text-white" />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderColor: 'rgba(255, 255, 255, 0.15)'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-white text-opacity-60 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full text-white py-4 px-6 rounded-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-white flex items-center justify-center hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <span>Create Account</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 mb-6">
              <div className="relative">
                <div className="absolute inset-6 flex items-center">
                  <div className="w-full border-t border-white border-opacity-20"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-transparent text-white text-opacity-60">or continue with</span>
                </div>
              </div>
            </div>

            {/* Social login buttons */}
            <div className="grid grid-cols-1 gap-4 mb-8">
              <button
                className="flex items-center justify-center py-3 px-4 rounded-xl text-white hover:scale-105"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)'
                }}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </div>

            {/* Login redirect */}
            <div className="text-center">
              <p className="text-white text-opacity-80">
                Already have an account?
                <a href="/Authentication" className="ml-2 text-white font-semibold hover:underline">
                  Login
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
