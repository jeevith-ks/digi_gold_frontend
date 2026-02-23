'use client';
import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, Phone } from 'lucide-react';
import { useRouter } from "next/navigation";
import { useAlert } from '@/context/AlertContext';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    userType: 'customer' // Default to customer
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showAlert } = useAlert();

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
    const { name, value } = e.target;

    setFormData(prevData => {
      const updatedData = {
        ...prevData,
        [name]: value
      };

      // Automatically set userType based on email
      if (name === 'email') {
        const isAdminEmail = value.toLowerCase() === 'admin@example.com';
        updatedData.userType = isAdminEmail ? 'admin' : 'customer';
      }

      return updatedData;
    });
  };

  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Determine user type based on email
    const isAdminEmail = formData.email.toLowerCase() === 'admin@example.com';
    const finalUserType = isAdminEmail ? 'admin' : 'customer';

    if (isLogin) {
      // Login logic
      try {
        const response = await fetch("http://65.2.152.254:5000/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password
          })
        });

        if (response.ok) {
          const data = await response.json();

          // Store user info in session storage
          sessionStorage.setItem("authToken", data.token);
          sessionStorage.setItem("userEmail", data.user?.email || formData.email);
          sessionStorage.setItem("userId", data.user?.id);
          sessionStorage.setItem("username", data.user?.username || formData.username);
          sessionStorage.setItem("userType", data.user?.user_type || finalUserType);

          showAlert("Login successful!", "success");
          router.push("/Home");
        } else {
          const errorData = await response.json();

          showAlert("Login failed: " + (errorData.message || "Invalid credentials"), "error");
        }
      } catch (error) {

        showAlert("Something went wrong during login!", "error");
      }
    } else {
      // Registration logic
      // Basic validation
      if (formData.password !== formData.confirmPassword) {
        showAlert("Passwords do not match!", "warning");
        setIsLoading(false);
        return;
      }

      // if (formData.password.length < 4) {
      //   alert("Password must be at least 4 characters long!");
      //   setIsLoading(false);
      //   return;
      // }

      // Phone number validation (basic)
      if (!formData.phone.trim()) {
        showAlert("Phone number is required!", "warning");
        setIsLoading(false);
        return;
      }

      try {

        const response = await fetch("http://65.2.152.254:5000/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            user_type: finalUserType // Send as determined user type
          })
        });

        const responseData = await response.json();

        if (response.ok) {

          // Store user info in session storage
          sessionStorage.setItem("authToken", responseData.token);
          sessionStorage.setItem("userEmail", responseData.user?.email || formData.email);
          sessionStorage.setItem("userId", responseData.user?.id);
          sessionStorage.setItem("username", responseData.user?.username || formData.username);
          sessionStorage.setItem("userType", responseData.user?.user_type || finalUserType);
          sessionStorage.setItem("phone", responseData.user?.phone || formData.phone);

          // Show special message for admin registration
          if (isAdminEmail) {
            showAlert("Admin account created successfully! You have administrative privileges.", "success", "Admin Created");
          } else {
            showAlert("Account created successfully!", "success");
          }

          router.push("/Home");
          resetForm();
        } else {


          // Handle specific error cases
          if (responseData.message?.includes('already exists')) {
            showAlert("User with this email or username already exists!", "error");
          } else {
            showAlert("Failed to create account: " + (responseData.message || "Unknown error"), "error");
          }
        }
      } catch (error) {

        showAlert("Something went wrong during registration!", "error");
      }
    }

    setIsLoading(false);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      phone: '',
      userType: 'customer'
    });
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-cyan-400 via-teal-400 to-blue-500">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72  "></div>
        <div className="absolute top-3/4 right-1/4 w-96 h-96  "></div>
        <div className="absolute top-1/2 left-3/4 w-64 h-64  "></div>
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

            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <User className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-white text-opacity-80">
                {isLogin ? 'Sign in to your account' : 'Join us today'}
              </p>

              {/* Show admin indicator during registration */}
              {!isLogin && formData.email.toLowerCase() === 'admin@example.com' && (
                <div className="mt-2 px-3 py-1 bg-yellow-500 bg-opacity-20 border border-yellow-400 border-opacity-50 rounded-full inline-block">
                  <p className="text-yellow-300 text-sm font-medium">
                    🛡️ Admin account detected
                  </p>
                </div>
              )}
            </div>

            {/* Authentication Form */}
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Username field (only for register) */}
              {!isLogin && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-white text-opacity-60 group-focus-within:text-white transition-colors" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      borderColor: 'rgba(255, 255, 255, 0.15)'
                    }}
                    required
                  />
                </div>
              )}

              {/* First Name and Last Name fields (only for register) */}
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative group">
                    <input
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full pl-4 pr-4 py-4 rounded-2xl border text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        borderColor: 'rgba(255, 255, 255, 0.15)'
                      }}
                      required
                    />
                  </div>
                  <div className="relative group">
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full pl-4 pr-4 py-4 rounded-2xl border text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        borderColor: 'rgba(255, 255, 255, 0.15)'
                      }}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Phone field (only for register) */}
              {!isLogin && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-white text-opacity-60 group-focus-within:text-white transition-colors" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Phone Number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      borderColor: 'rgba(255, 255, 255, 0.15)'
                    }}
                    required
                  />
                </div>
              )}

              {/* Email field */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-white text-opacity-60 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    borderColor: 'rgba(255, 255, 255, 0.15)'
                  }}
                  required
                />
              </div>

              {/* Password field */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white text-opacity-60 group-focus-within:text-white transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl border text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    borderColor: 'rgba(255, 255, 255, 0.15)'
                  }}
                  required
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

              {/* Confirm Password field (only for register) */}
              {!isLogin && (
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-white text-opacity-60 group-focus-within:text-white transition-colors" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full pl-12 pr-12 py-4 rounded-2xl border text-white placeholder-white placeholder-opacity-60 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition-all duration-300"
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      borderColor: 'rgba(255, 255, 255, 0.15)'
                    }}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-white text-opacity-60 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              )}

              {/* Forgot Password (only for login) */}
              {isLogin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => router.push("/ForgotPassword")}
                    className="text-white text-opacity-80 hover:text-white text-sm transition-colors font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Submit button */}
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
                <span>{isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Create Account')}</span>
                {!isLoading && <ArrowRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>

            {/* Toggle between login and register */}
            <div className="text-center mt-6">
              <p className="text-white text-opacity-80">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin);
                    resetForm();
                  }}
                  className="ml-2 text-white font-semibold hover:underline transition-all duration-300"
                >
                  {isLogin ? 'Register' : 'Login'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}