import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, Shield, Calendar, Edit2, Save, X, 
  Camera, Upload, MapPin, Building, CreditCard, Clock,
  CheckCircle, AlertCircle, Info, Lock, Eye, EyeOff,
  LogOut, ArrowRight, Key, Home, Briefcase, FileText, Car  
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/api';

const ClientProfile = ({ setActiveTab, user, onLogout }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userId, setUserId] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  
  // User profile data
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    idNumber: '',
    address: '',
    role: 'client',
    avatar: '',
    createdAt: '',
    status: 'active'
  });

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Avatar upload ref
  const avatarInputRef = useRef(null);

  // Load user data
  useEffect(() => {
    const userData = currentUser || user || JSON.parse(localStorage.getItem('user') || '{}');
    const tid = userData?.tenantId || null;
    setTenantId(tid);
    loadUserData(userData);
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ✅ LOAD USER DATA FROM API
  const loadUserData = async (userData) => {
    setLoading(true);
    
    try {
      const userToCheck = userData || currentUser || user || JSON.parse(localStorage.getItem('user') || '{}');
      const email = userToCheck?.email;
      
      if (!email) {
        console.warn('⚠️ No email found for user');
        setLoading(false);
        return;
      }

      console.log('🔍 Loading user profile for email:', email);
      
      // Try to get user by email
      const response = await userService.getByEmail(email);
      console.log('📊 User response:', response);
      
      let userProfile = null;
      if (response?.success && response?.data) {
        userProfile = response.data;
      } else if (response?.id) {
        userProfile = response;
      }
      
      if (userProfile) {
        setUserId(userProfile.id);
        setProfile({
          id: userProfile.id || '',
          name: userProfile.name || '',
          email: userProfile.email || '',
          phone: userProfile.phone || '',
          idNumber: userProfile.idNumber || '',
          address: userProfile.address || '',
          role: userProfile.role || 'client',
          avatar: userProfile.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile.name || 'User')}&background=1e293b&color=fff&size=100`,
          createdAt: userProfile.createdAt || new Date().toISOString(),
          status: userProfile.status || 'active'
        });
      } else {
        // Fallback: try to get from localStorage
        loadFromLocalStorage();
      }
      
    } catch (error) {
      console.error('❌ Error loading user data:', error);
      showNotification('Error loading profile data', 'error');
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  // ✅ FALLBACK TO LOCALSTORAGE
  const loadFromLocalStorage = () => {
    try {
      const users = JSON.parse(localStorage.getItem('travel_agency_users') || '[]');
      const authData = JSON.parse(localStorage.getItem('travel_agency_auth') || 'null');
      
      let foundUser = null;
      if (authData?.email) {
        foundUser = users.find(u => u.email === authData.email);
      }
      if (!foundUser && user?.email) {
        foundUser = users.find(u => u.email === user.email) || user;
      }
      if (!foundUser && user) {
        foundUser = user;
      }
      
      if (foundUser) {
        setProfile({
          id: foundUser.id || '',
          name: foundUser.name || '',
          email: foundUser.email || '',
          phone: foundUser.phone || '',
          idNumber: foundUser.idNumber || '',
          address: foundUser.address || '',
          role: foundUser.role || 'client',
          avatar: foundUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(foundUser.name || 'User')}&background=1e293b&color=fff&size=100`,
          createdAt: foundUser.created_at || foundUser.createdAt || new Date().toISOString(),
          status: foundUser.status || 'active'
        });
        setUserId(foundUser.id);
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  // ✅ SAVE PROFILE VIA API
  const handleSaveProfile = async () => {
    if (!profile.name.trim()) {
      showNotification('Please enter your name', 'error');
      return;
    }
    if (!profile.phone.trim()) {
      showNotification('Please enter your phone number', 'error');
      return;
    }

    setIsEditing(false);
    setLoading(true);

    try {
      const userData = {
        name: profile.name,
        phone: profile.phone,
        idNumber: profile.idNumber || '',
        address: profile.address || '',
        avatar: profile.avatar || null,
        tenantId: tenantId
      };

      console.log(`📤 Updating user ${userId}:`, userData);
      const response = await userService.update(userId, userData);
      console.log('📥 Update response:', response);

      if (response?.success) {
        showNotification('✅ Profile updated successfully!');
        // Update local user data
        const updatedUser = response.data;
        if (updatedUser) {
          setProfile(prev => ({
            ...prev,
            name: updatedUser.name || prev.name,
            phone: updatedUser.phone || prev.phone,
            idNumber: updatedUser.idNumber || prev.idNumber,
            address: updatedUser.address || prev.address,
            avatar: updatedUser.avatar || prev.avatar
          }));
        }
        // Update localStorage
        const userToUpdate = { ...profile, name: profile.name, phone: profile.phone };
        localStorage.setItem('user', JSON.stringify(userToUpdate));
        if (currentUser) {
          localStorage.setItem('user', JSON.stringify({ ...currentUser, name: profile.name, phone: profile.phone }));
        }
      } else {
        showNotification('Failed to update profile: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      showNotification('Error saving profile', 'error');
    }

    setLoading(false);
  };

  // ✅ CHANGE PASSWORD VIA API
  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!passwordForm.newPassword || passwordForm.newPassword.length < 6) {
      showNotification('New password must be at least 6 characters', 'error');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showNotification('Passwords do not match', 'error');
      return;
    }

    setLoading(true);

    try {
      console.log(`📤 Changing password for user ${userId}`);
      const response = await userService.changePassword(userId, passwordForm.newPassword);
      console.log('📥 Password change response:', response);

      if (response?.success) {
        showNotification('✅ Password changed successfully!');
        setShowPasswordModal(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showNotification('Failed to change password: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('❌ Error changing password:', error);
      showNotification('Error changing password', 'error');
    }

    setLoading(false);
  };

  // ✅ UPLOAD AVATAR VIA API
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Please upload an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Image must be less than 5MB', 'error');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log(`📤 Uploading avatar for user ${userId}`);
      const response = await userService.uploadAvatar(userId, formData);
      console.log('📥 Avatar upload response:', response);

      if (response?.success && response?.data?.avatar) {
        setProfile(prev => ({ ...prev, avatar: response.data.avatar }));
        showNotification('✅ Avatar updated successfully!');
      } else {
        showNotification('Failed to upload avatar: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('❌ Error uploading avatar:', error);
      showNotification('Error uploading avatar', 'error');
    }

    setLoading(false);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // Get role badge
  const getRoleBadge = (role) => {
    const badges = {
      client: { label: 'Client', color: 'bg-blue-100 text-blue-700' },
      car_owner: { label: 'Car Owner', color: 'bg-green-100 text-green-700' },
      fleet_manager: { label: 'Fleet Manager', color: 'bg-purple-100 text-purple-700' },
      super_admin: { label: 'Super Admin', color: 'bg-red-100 text-red-700' }
    };
    return badges[role] || { label: role || 'Client', color: 'bg-gray-100 text-gray-700' };
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const badges = {
      active: { label: 'Active', color: 'bg-green-100 text-green-700' },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700' },
      suspended: { label: 'Suspended', color: 'bg-red-100 text-red-700' },
      inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-700' }
    };
    return badges[status] || { label: status || 'Active', color: 'bg-gray-100 text-gray-700' };
  };

  // Password Modal
  const PasswordModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold">Change Password</h3>
            <p className="text-xs text-gray-500">Update your account password</p>
          </div>
          <button
            onClick={() => {
              setShowPasswordModal(false);
              setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleChangePassword} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">New Password *</label>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Min 6 characters"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password *</label>
            <div className="relative">
              <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Confirm new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <p className="text-xs text-yellow-700">
              ⚠️ Password must be at least 6 characters long.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
              }}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={16} /> {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const roleBadge = getRoleBadge(profile.role);
  const statusBadge = getStatusBadge(profile.status);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg flex items-center gap-2 max-w-md
          ${notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
            'bg-blue-50 border border-blue-200 text-blue-700'}`}
        >
          {notification.type === 'success' ? <CheckCircle size={20} /> :
           notification.type === 'error' ? <AlertCircle size={20} /> :
           <Info size={20} />}
          <span className="flex-1 text-sm">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <User className="text-blue-600" size={28} />
            My Profile
          </h1>
          <p className="text-gray-500">Manage your account settings and preferences</p>
        </div>
        <div className="flex gap-2">
  {!isEditing && (
    <button
      onClick={() => setIsEditing(true)}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
    >
      <Edit2 size={16} /> Edit Profile
    </button>
  )}
  <button
    onClick={() => {
      if (onLogout) {
        onLogout();
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('travel_agency_auth');
        localStorage.removeItem('travel_agency_role');
        if (setActiveTab) setActiveTab('login');
        window.location.reload();
      }
    }}
    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2 text-sm"
  >
    <LogOut size={16} /> Logout
  </button>
</div>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        {/* Cover/Banner */}
        <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600"></div>

        {/* Profile Content */}
        <div className="px-6 pb-6 relative">
          {/* Avatar */}
          <div className="flex justify-center -mt-12 mb-4">
            <div className="relative">
              <img
                src={profile.avatar}
                alt={profile.name}
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
              />
              {isEditing && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white hover:bg-blue-700 transition-colors"
                  >
                    <Camera size={14} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* User Name & Role */}
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">{profile.name}</h2>
            <div className="flex items-center justify-center gap-2 mt-1">
              <span className={`text-xs px-3 py-0.5 rounded-full ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
              <span className={`text-xs px-3 py-0.5 rounded-full ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
            </div>
          </div>

          {/* Edit Mode Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-2 mb-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  loadUserData(currentUser || user);
                }}
                className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm flex items-center gap-1"
              >
                <X size={14} /> Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={loading}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1 disabled:opacity-50"
              >
                <Save size={14} /> {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Profile Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Name */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <User size={14} /> Full Name
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800 mt-1">{profile.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Mail size={14} /> Email Address
              </p>
              <p className="text-sm font-medium text-gray-800 mt-1">{profile.email}</p>
              <p className="text-[10px] text-gray-400">Cannot change email</p>
            </div>

            {/* Phone */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Phone size={14} /> Phone Number
              </p>
              {isEditing ? (
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800 mt-1">{profile.phone}</p>
              )}
            </div>

            {/* ID Number */}
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <FileText size={14} /> ID/Passport Number
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.idNumber}
                  onChange={(e) => setProfile(prev => ({ ...prev, idNumber: e.target.value }))}
                  className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Not set"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800 mt-1">{profile.idNumber || 'Not set'}</p>
              )}
            </div>

            {/* Address */}
            <div className="bg-gray-50 rounded-lg p-3 md:col-span-2">
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin size={14} /> Address
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={profile.address}
                  onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Not set"
                />
              ) : (
                <p className="text-sm font-medium text-gray-800 mt-1">{profile.address || 'Not set'}</p>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Account Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Account Type</p>
                <p className="text-sm font-medium text-gray-800 mt-1 capitalize">{profile.role}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Status</p>
                <p className="text-sm font-medium text-gray-800 mt-1 capitalize">{profile.status}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Member Since</p>
                <p className="text-sm font-medium text-gray-800 mt-1">{formatDate(profile.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {!isEditing && (
            <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-3">
              <button
                onClick={() => setShowPasswordModal(true)}
                className="px-4 py-2 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors text-sm flex items-center gap-2"
              >
                <Key size={16} /> Change Password
              </button>
              <button
                onClick={() => {
                  if (setActiveTab) setActiveTab('car-hire');
                }}
                className="px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm flex items-center gap-2"
              >
                <Car size={16} /> Book a Car
              </button>
              <button
                onClick={() => {
                  if (setActiveTab) setActiveTab('my-bookings');
                }}
                className="px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors text-sm flex items-center gap-2"
              >
                <Calendar size={16} /> My Bookings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && <PasswordModal />}

      {/* Footer */}
      <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

export default ClientProfile;