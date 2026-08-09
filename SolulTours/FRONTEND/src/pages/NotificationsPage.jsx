import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, CheckCircle, AlertCircle, AlertTriangle, Info, X,
  ChevronLeft, Check, CheckCheck, Trash2, RefreshCw,
  Filter, Clock, Car, Plane, Hotel, Compass, MapPin
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';

const NotificationsPage = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  const userId = currentUser?.id;
  const userRole = currentUser?.role || 'client';

  // ============================================
  // LOAD NOTIFICATIONS
  // ============================================
  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await notificationService.getByUser(userId);
      console.log('📊 Notifications response:', response);

      let notificationsData = [];
      if (response?.success && response?.data) {
        notificationsData = response.data;
      } else if (Array.isArray(response)) {
        notificationsData = response;
      }

      const formatted = notificationsData.map(notif => ({
        id: notif.id,
        title: notif.title || 'Notification',
        description: notif.description || '',
        type: notif.type || 'info',
        read: notif.read || false,
        role: notif.role || 'client',
        createdAt: notif.createdAt,
        time: formatTime(notif.createdAt),
        data: notif.data || {}
      }));

      formatted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications(formatted);
    } catch (error) {
      console.error('Error loading notifications:', error);
      loadFromLocalStorage();
    }
    setLoading(false);
  }, [userId]);

  // ============================================
  // FALLBACK: Load from localStorage
  // ============================================
  const loadFromLocalStorage = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('travel_agency_notifications') || '[]');
      const formatted = stored.map(n => ({
        ...n,
        time: n.createdAt ? formatTime(n.createdAt) : 'Now'
      }));
      setNotifications(formatted);
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  // ============================================
  // FORMAT TIME
  // ============================================
  const formatTime = (dateString) => {
    if (!dateString) return 'Now';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = Math.floor((now - date) / 1000);

      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
      return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
    } catch {
      return 'Now';
    }
  };

  // ============================================
  // MARK AS READ
  // ============================================
  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
    }
  };

  // ============================================
  // MARK ALL AS READ
  // ============================================
  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await notificationService.markAllAsRead(userId);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    }
  };

  // ============================================
  // DELETE NOTIFICATION
  // ============================================
  const deleteNotification = async (id) => {
    if (!window.confirm('Delete this notification?')) return;
    try {
      await notificationService.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      setNotifications(notifications.filter(n => n.id !== id));
    }
  };

  // ============================================
  // GET ICON
  // ============================================
  const getIcon = (type) => {
    switch(type) {
      case 'alert': return <AlertCircle size={18} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={18} className="text-yellow-500" />;
      case 'success': return <CheckCircle size={18} className="text-green-500" />;
      default: return <Info size={18} className="text-blue-500" />;
    }
  };

  const getBgColor = (type) => {
    switch(type) {
      case 'alert': return 'bg-red-50 border-red-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  // ============================================
  // GET ROLE BADGE
  // ============================================
  const getRoleBadge = (role) => {
    const roles = {
      super_admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800' },
      fleet_manager: { label: 'Fleet', color: 'bg-blue-100 text-blue-800' },
      car_owner: { label: 'Owner', color: 'bg-green-100 text-green-800' },
      client: { label: 'Client', color: 'bg-gray-100 text-gray-800' }
    };
    return roles[role] || { label: role || 'User', color: 'bg-gray-100 text-gray-800' };
  };

  // ============================================
  // GET SERVICE ICON
  // ============================================
  const getServiceIcon = (title) => {
    if (title?.includes('car') || title?.includes('vehicle') || title?.includes('Car')) 
      return <Car size={12} className="text-blue-500" />;
    if (title?.includes('tour') || title?.includes('Travel')) 
      return <Compass size={12} className="text-green-500" />;
    if (title?.includes('hajj') || title?.includes('Hajj') || title?.includes('Umra')) 
      return <MapPin size={12} className="text-purple-500" />;
    if (title?.includes('hotel') || title?.includes('Hotel')) 
      return <Hotel size={12} className="text-orange-500" />;
    if (title?.includes('flight') || title?.includes('Flight')) 
      return <Plane size={12} className="text-indigo-500" />;
    return <Bell size={12} className="text-gray-400" />;
  };

  // ============================================
  // FILTER NOTIFICATIONS
  // ============================================
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'read') return n.read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // ============================================
  // GET ROLE DISPLAY NAME
  // ============================================
  const getRoleDisplay = (role) => {
    const roles = {
      super_admin: 'Super Admin',
      fleet_manager: 'Fleet Manager',
      car_owner: 'Car Owner',
      client: 'Client'
    };
    return roles[role] || role || 'User';
  };

  // ============================================
  // LOAD ON MOUNT
  // ============================================
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // ============================================
  // RENDER
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6 max-w-4xl mx-auto">
      {/* Header - Mobile Friendly */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => {
              if (typeof window.setActiveTab === 'function') {
                window.setActiveTab('dashboard');
              }
            }}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="sm:size-6" />
          </button>
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
              <Bell size={22} className="sm:size-7 text-blue-600" />
              Notifications
            </h1>
            <p className="text-xs sm:text-sm text-gray-500">
              {unreadCount > 0 
                ? `${unreadCount} unread`
                : 'All caught up! 🎉'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={loadNotifications}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={16} className="sm:size-[18px] text-gray-500" />
          </button>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-blue-600 text-white rounded-lg text-[10px] sm:text-sm hover:bg-blue-700 transition-colors flex items-center gap-0.5 sm:gap-1"
            >
              <CheckCheck size={14} className="sm:size-4" /> 
              <span className="hidden sm:inline">Mark all read</span>
              <span className="sm:hidden">Read all</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters - Mobile Friendly Pills */}
      <div className="flex items-center gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-colors ${
            filter === 'all' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-colors ${
            filter === 'unread' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-colors ${
            filter === 'read' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          Read ({notifications.length - unreadCount})
        </button>
      </div>

      {/* Notification List */}
      {filteredNotifications.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-white rounded-xl border border-gray-100">
          <CheckCircle size={40} className="sm:size-12 mx-auto text-gray-300 mb-3" />
          <p className="text-base sm:text-lg font-medium text-gray-700">All clear!</p>
          <p className="text-xs sm:text-sm text-gray-400">
            {filter === 'all' 
              ? 'No notifications yet' 
              : filter === 'unread' 
                ? 'No unread notifications' 
                : 'No read notifications'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-3">
          {filteredNotifications.map((notif) => {
            const roleBadge = getRoleBadge(notif.role);
            const isUnread = !notif.read;

            return (
              <div
                key={notif.id}
                className={`bg-white rounded-xl border ${isUnread ? 'border-l-4 border-l-blue-500 shadow-md' : 'border-gray-100'} p-3 sm:p-4 hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 sm:gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold truncate ${isUnread ? 'text-gray-800' : 'text-gray-600'}`}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-600 mt-0.5 leading-relaxed line-clamp-2">
                          {notif.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`text-[7px] sm:text-[8px] px-1.5 sm:px-2 py-0.5 rounded-full ${roleBadge.color} whitespace-nowrap`}>
                          {roleBadge.label}
                        </span>
                        {isUnread && (
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:gap-3 mt-1.5 text-[9px] sm:text-[10px] text-gray-400">
                      <span className="flex items-center gap-0.5 sm:gap-1">
                        <Clock size={10} className="sm:size-3" /> {notif.time}
                      </span>
                      <span className="flex items-center gap-0.5 sm:gap-1">
                        {getServiceIcon(notif.title)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                      {isUnread && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="text-[9px] sm:text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-0.5 sm:gap-1"
                        >
                          <Check size={12} className="sm:size-3" /> Mark read
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notif.id)}
                        className="text-[9px] sm:text-[10px] text-red-500 hover:text-red-700 flex items-center gap-0.5 sm:gap-1"
                      >
                        <Trash2 size={12} className="sm:size-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-[8px] sm:text-[10px] text-gray-400 border-t border-gray-200 pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

export default NotificationsPage;