import React, { useState, useEffect } from 'react';
import { LogOut, Menu, ChevronDown } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../context/AuthContext';

const Header = ({ activeTab, onLogout, toggleSidebar }) => {
  const { currentUser } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const userName = currentUser?.name || 'User';
  const userRole = currentUser?.role || 'user';
  const userEmail = currentUser?.email || 'user@example.com';
  const userAvatar = currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1e293b&color=fff&size=32`;

  const getDisplayRole = (role) => {
    switch(role) {
      case 'super_admin': return 'Super Admin';
      case 'fleet_manager': return 'Fleet Manager';
      case 'car_owner': return 'Car Owner';
      case 'broker': return 'Booking Agent';
      case 'client': return 'Client';
      default: return 'User';
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left Section - Logo + Menu */}
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        {isMobile && (
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-700 flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            <Menu size={22} />
          </button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-2">
          <img 
            src="/lg1.png" 
            alt="Sulul Tours Logo" 
            className="h-10 w-auto object-contain"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {/* <span className="font-bold text-xl text-gray-800 whitespace-nowrap">
            SULUL <span className="text-blue-600">TOURS</span>
          </span> */}
        </div>
      </div>

      {/* Center - Welcome Message (Desktop only) */}
      <div className="hidden md:block text-center">
        <p className="text-sm text-gray-500">
          Welcome back, <span className="font-semibold text-gray-700">{userName}</span>
        </p>
      </div>

      {/* Right Section - Notifications + User */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        {/* Notification Bell */}
      <NotificationBell />

        {/* User Menu */}
        <div className="relative">
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)} 
            className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="User menu"
          >
            <img 
              src={userAvatar}
              alt={userName} 
              className="w-8 h-8 rounded-full ring-2 ring-gray-200" 
            />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-700">{userName}</p>
              <p className="text-xs text-gray-500">{getDisplayRole(userRole)}</p>
            </div>
            <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
          </button>
          
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-20">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <p className="font-semibold text-gray-800">{userName}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {getDisplayRole(userRole)}
                  </span>
                </p>
              </div>
              <button 
                onClick={() => {
                  onLogout();
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2 transition-colors"
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;