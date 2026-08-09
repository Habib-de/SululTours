import React, { useState, useEffect } from 'react';
import { Lock, ArrowLeft, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const ResetPassword = ({ onNavigate }) => {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  // Extract token from URL on mount
  useEffect(() => {
    // ✅ Clear any existing auth to prevent auto-redirect to dashboard
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('travel_agency_auth');
    localStorage.removeItem('travel_agency_role');
    localStorage.removeItem('role');
    
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
      console.log('✅ Reset token found:', tokenParam);
    } else {
      setIsValidToken(false);
      setError('No reset token provided. Please request a new password reset link.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Validate passwords
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      // ✅ Call the actual API
      const response = await api.auth.resetPassword(token, newPassword);

      if (response.success) {
        setSuccess('✅ Password reset successfully! You can now login with your new password.');
        setNewPassword('');
        setConfirmPassword('');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          onNavigate('login');
        }, 3000);
      } else {
        setError(response.message || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // If token is invalid, show error
  if (!isValidToken) {
    return (
      <div className="h-screen w-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-3 overflow-hidden fixed inset-0">
        <div className="w-full max-w-sm h-full max-h-[400px] flex items-center">
          <div className="w-full bg-white rounded-2xl shadow-xl border border-amber-300/50 overflow-hidden">
            <div className="bg-white px-4 py-3 text-center border-b border-gray-200 relative">
              <button
                onClick={() => onNavigate('login')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft size={18} />
              </button>
              <div className="flex justify-center">
                <img 
                  src="/lg1.png" 
                  alt="Sulul Tours Logo" 
                  className="w-full max-w-[80px] h-auto object-contain mx-auto"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>
            </div>
            <div className="p-6 text-center">
              <AlertCircle size={48} className="mx-auto text-red-500 mb-3" />
              <h2 className="text-lg font-semibold text-gray-800 mb-2">Invalid Reset Link</h2>
              <p className="text-sm text-gray-500 mb-4">
                The password reset link is invalid or has expired.
              </p>
              <button
                onClick={() => onNavigate('forgot-password')}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 transition-colors text-sm"
              >
                Request New Reset Link
              </button>
              <button
                onClick={() => onNavigate('login')}
                className="mt-2 text-sm text-amber-600 hover:text-amber-700 hover:underline"
              >
                ← Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-3 overflow-hidden fixed inset-0">
      <div className="w-full max-w-sm h-full max-h-[550px] flex items-center">
        <div className="w-full bg-white rounded-2xl shadow-xl border border-amber-300/50 overflow-hidden">
          {/* HEADER */}
          <div className="bg-white px-4 py-3 text-center border-b border-gray-200 relative">
            <button
              onClick={() => onNavigate('login')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex justify-center">
              <img 
                src="/lg1.png" 
                alt="Sulul Tours Logo" 
                className="w-full max-w-[80px] h-auto object-contain mx-auto"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="mt-0.5">
              <p className="text-gray-500 text-[10px] mt-0.5 font-medium tracking-wide">
                Travel &amp; Tours Management System
              </p>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-4">
            <div className="text-center mb-3">
              <h2 className="text-sm font-semibold text-gray-800">Reset Password</h2>
              <p className="text-gray-500 text-xs mt-0.5">
                Enter your new password below
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* New Password */}
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                  New Password *
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all bg-gray-50/50 hover:bg-white focus:bg-white text-sm"
                    placeholder="Minimum 6 characters"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                  Confirm Password *
                </label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all bg-gray-50/50 hover:bg-white focus:bg-white text-sm"
                    placeholder="Confirm your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="flex items-center gap-2 p-1.5 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
                  <p className="text-[10px] text-red-600">{error}</p>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="flex items-center gap-2 p-1.5 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                  <p className="text-[10px] text-green-600">{success}</p>
                </div>
              )}

              {/* Reset Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 text-sm"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            {/* Back to Login */}
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-xs text-amber-600 hover:text-amber-700 hover:underline"
              >
                ← Back to Sign In
              </button>
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

export default ResetPassword;