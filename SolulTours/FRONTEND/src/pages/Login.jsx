import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import api from '../services/api';

const Login = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  try {
    const response = await api.auth.login(email, password);

    if (response.success && response.data) {
      const userData = response.data;
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userData.role);
      onLogin(userData);
    } else {
      setError(response.message || 'Login failed. Please try again.');
    }
  } catch (err) {
    console.error('Login error:', err);
    console.log('Error message:', err.message);  // ✅ ADD THIS
    console.log('Error object:', err);           // ✅ ADD THIS
    
    // ✅ Handle specific error messages from backend
    if (err.message) {
      setError(err.message);
    } else {
      setError('Invalid email or password. Please try again.');
    }
  } finally {
    setIsLoading(false);
  }
};
  return (
    <div className="h-screen w-screen bg-white flex items-center justify-center p-3 overflow-hidden fixed inset-0">
      <div className="w-full max-w-sm h-full max-h-[600px] flex items-center">
        <div className="w-full bg-white rounded-2xl shadow-xl border border-amber-300/50 overflow-hidden">
          
          {/* HEADER */}
          <div className="bg-white px-4 py-3 text-center border-b border-gray-200">
            <div className="flex justify-center">
              <img 
                src="/lg1.png" 
                alt="Sulul Tours Logo" 
                className="w-full max-w-[100px] h-auto object-contain mx-auto"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            </div>
            <div className="mt-1">
              <p className="text-gray-500 text-[10px] mt-0.5 font-medium tracking-wide">
                Travel &amp; Tours Management System
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-4">
            <div className="text-center mb-2">
              <h2 className="text-sm font-semibold text-gray-800">Welcome Back</h2>
              <p className="text-gray-500 text-xs mt-0.5">Sign in to manage your travel services</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all bg-gray-50 hover:bg-white focus:bg-white text-sm"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-0.5">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all bg-gray-50 hover:bg-white focus:bg-white text-sm"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-xs text-amber-600 hover:text-amber-700 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              {error && (
  <div className={`flex flex-col items-start gap-1 p-3 rounded-lg border ${
    error.includes('pending') || error.includes('suspended') || error.includes('inactive') || error.includes('approval')
      ? 'bg-yellow-50 border-yellow-200'
      : 'bg-red-50 border-red-200'
  }`}>
    <div className="flex items-center gap-2 w-full">
      <AlertCircle size={16} className={`flex-shrink-0 ${
        error.includes('pending') || error.includes('suspended') || error.includes('inactive') || error.includes('approval')
          ? 'text-yellow-600'
          : 'text-red-500'
      }`} />
      <p className={`text-xs font-medium ${
        error.includes('pending') || error.includes('suspended') || error.includes('inactive') || error.includes('approval')
          ? 'text-yellow-700'
          : 'text-red-600'
      }`}>
        {error}
      </p>
    </div>
    {error.includes('Super Admin') && (
      <p className="text-[10px] text-yellow-600 ml-7">
        📧 Contact the system administrator to activate your account.
      </p>
    )}
    {error.includes('Fleet Manager') && (
      <p className="text-[10px] text-yellow-600 ml-7">
        ⏳ Your account is pending approval from a Fleet Manager.
      </p>
    )}
    {error.includes('pending approval') && !error.includes('Fleet Manager') && !error.includes('Super Admin') && (
      <p className="text-[10px] text-yellow-600 ml-7">
        ⏳ Please wait for an administrator to approve your account.
      </p>
    )}
  </div>
)}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2.5 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 text-sm"
              >
                {isLoading ? (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-2.5 text-center">
              <p className="text-xs text-gray-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('register')}
                  className="text-amber-600 hover:text-amber-700 font-medium hover:underline"
                >
                  Create Account
                </button>
              </p>

              <div className="mt-2 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  🎉 Book without registering!{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('guest-booking')}
                    className="text-green-600 hover:text-green-700 font-medium hover:underline"
                  >
                    Continue as Guest
                  </button>
                </p>
              </div>
            </div>
          </div>

          <div className="text-center pb-2">
            <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold sm:font-normal">
              &copy; 2026 Sulul Tours &amp; Travel. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;