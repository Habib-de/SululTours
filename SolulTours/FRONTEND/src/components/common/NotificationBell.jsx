import React, { useState, useEffect, useCallback } from 'react';
import { 
  Bell, CheckCircle, AlertCircle, AlertTriangle, Info, X, 
  ChevronRight, RefreshCw, Settings
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { pushService, notificationService } from '../../services/api';

const NotificationBell = () => {
  const { currentUser } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPushSupported, setIsPushSupported] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const userId = currentUser?.id;
  const token = currentUser?.token || localStorage.getItem('token');

  // ============================================
  // VAPID PUBLIC KEY
  // ============================================
  const VAPID_PUBLIC_KEY = 'BPhdfyyOVmu7FSl8qChi53xAOCzYvI4Iopl5KECi1Fg3UkdyYvIa2FMSOMtphnScI8ryiutQqcjBhhE7l_vy2-g';

  // ============================================
  // CHECK PUSH NOTIFICATION SUPPORT
  // ============================================
  useEffect(() => {
    const supported = 'Notification' in window && 
                      'serviceWorker' in navigator && 
                      'PushManager' in window;
    setIsPushSupported(supported);
    
    if (supported && currentUser) {
      checkSubscriptionStatus();
    }
  }, [currentUser]);

  // ============================================
  // CHECK IF USER IS SUBSCRIBED
  // ============================================
  const checkSubscriptionStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    }
  };

  // ============================================
  // HELPER: Convert VAPID key
  // ============================================
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // ============================================
  // SUBSCRIBE TO PUSH NOTIFICATIONS
  // ============================================
  const subscribeToPush = async () => {
    if (!isPushSupported) {
      alert('Push notifications are not supported in this browser.');
      return;
    }

    setIsSubscribing(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        alert('Please allow notifications to receive push updates.');
        setIsSubscribing(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // ✅ Use pushService (same pattern as other pages)
      const response = await pushService.subscribe({
        endpoint: subscription.endpoint,
        authKey: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')))),
        p256dhKey: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
        deviceType: 'WEB'
      });

      if (response?.success) {
        setIsSubscribed(true);
        alert('✅ Push notifications enabled! You will receive notifications even when the app is closed.');
      } else {
        alert('❌ Failed to enable push notifications: ' + (response?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
      alert('❌ Failed to enable push notifications. Please try again.');
    }

    setIsSubscribing(false);
  };

  // ============================================
  // UNSUBSCRIBE FROM PUSH NOTIFICATIONS
  // ============================================
  const unsubscribeFromPush = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // ✅ Use pushService
        await pushService.unsubscribe(subscription.endpoint);

        await subscription.unsubscribe();
        setIsSubscribed(false);
        alert('🔕 Push notifications disabled.');
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      alert('❌ Failed to disable push notifications.');
    }
  };

  // ============================================
  // LOAD NOTIFICATIONS FROM API
  // ============================================
  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // ✅ Use notificationService (same pattern as other pages)
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
        time: formatTime(notif.createdAt)
      }));

      formatted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const unread = formatted.filter(n => !n.read).length;

      setNotifications(formatted);
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error loading notifications:', error);
      loadFromLocalStorage();
    }
    setIsLoading(false);
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
      setUnreadCount(formatted.filter(n => !n.read).length);
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
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
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
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  // ============================================
  // NAVIGATE TO NOTIFICATIONS PAGE
  // ============================================
  const navigateToNotifications = () => {
    setShowNotifications(false);
    if (typeof window.setActiveTab === 'function') {
      window.setActiveTab('notifications');
    } else {
      window.dispatchEvent(new CustomEvent('navigateTo', {
        detail: { tab: 'notifications' }
      }));
    }
  };

  // ============================================
  // GET ICON
  // ============================================
  const getIcon = (type) => {
    switch(type) {
      case 'alert': return <AlertCircle size={16} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'success': return <CheckCircle size={16} className="text-green-500" />;
      default: return <Info size={16} className="text-blue-500" />;
    }
  };

  const getBgColor = (type) => {
    switch(type) {
      case 'alert': return 'bg-red-50 hover:bg-red-100';
      case 'warning': return 'bg-yellow-50 hover:bg-yellow-100';
      case 'success': return 'bg-green-50 hover:bg-green-100';
      default: return 'bg-blue-50 hover:bg-blue-100';
    }
  };

  // ============================================
  // LOAD ON MOUNT
  // ============================================
  useEffect(() => {
    loadNotifications();

    const handleDataUpdate = () => {
      loadNotifications();
    };

    window.addEventListener('bookingsUpdated', handleDataUpdate);
    window.addEventListener('notificationsUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('bookingsUpdated', handleDataUpdate);
      window.removeEventListener('notificationsUpdated', handleDataUpdate);
    };
  }, [loadNotifications]);

  // ============================================
  // RENDER PUSH SETTINGS POPUP
  // ============================================
  const renderPushSettings = () => {
    if (!showSettings) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowSettings(false)}></div>
        <div className="relative bg-white rounded-xl w-full max-w-md p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Bell size={20} className="text-blue-600" />
              Push Notifications
            </h3>
            <button 
              onClick={() => setShowSettings(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">
                    {isSubscribed ? '✅ Enabled' : '🔕 Disabled'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {isSubscribed 
                      ? 'You will receive notifications even when the app is closed' 
                      : 'Enable to get notifications on bookings and updates'}
                  </p>
                </div>
                <button
                  onClick={isSubscribed ? unsubscribeFromPush : subscribeToPush}
                  disabled={isSubscribing}
                  className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                    isSubscribed 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } ${isSubscribing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubscribing ? 'Processing...' : isSubscribed ? 'Disable' : 'Enable'}
                </button>
              </div>
              {!isPushSupported && (
                <p className="text-xs text-red-500 mt-2">
                  ⚠️ Push notifications are not supported in this browser. Please use Chrome, Firefox, or Edge.
                </p>
              )}
            </div>

            <div className="text-xs text-gray-400 space-y-1">
              <p>📱 You will receive notifications for:</p>
              <ul className="list-disc list-inside pl-2 space-y-0.5">
                <li>New booking requests</li>
                <li>Booking confirmations</li>
                <li>Booking cancellations</li>
                <li>Payment confirmations</li>
                <li>Important updates</li>
              </ul>
            </div>

            <button
              onClick={() => setShowSettings(false)}
              className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER
  // ============================================
  if (isLoading) {
    return (
      <div className="relative">
        <button className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 relative">
          <Bell size={20} className="text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {renderPushSettings()}

      <button 
        onClick={() => setShowNotifications(!showNotifications)} 
        className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 relative transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold border-2 border-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {showNotifications && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 z-30 lg:hidden" 
            onClick={() => setShowNotifications(false)}
          ></div>

          <div className="
  fixed lg:absolute top-16 lg:top-full left-1/2 -translate-x-1/2 lg:left-auto lg:right-0 lg:translate-x-0 z-40
  w-[90%] sm:w-80 max-w-sm
  bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden
  transition-all duration-200 ease-out
">
            <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
  {/* Header Row - Title and Close */}
  <div className="flex justify-between items-center">
    <h3 className="font-semibold text-sm flex items-center gap-2">
      <Bell size={16} className="text-blue-500" />
      Notifications
      <span className="text-xs text-gray-400 font-normal bg-gray-100 px-2 py-0.5 rounded-full">
        {notifications.length}
      </span>
    </h3>
    <button 
      onClick={() => setShowNotifications(false)}
      className="p-1 hover:bg-gray-100 rounded-full transition-colors"
    >
      <X size={16} className="text-gray-500 hover:text-gray-700" />
    </button>
  </div>

  {/* Second Row - Actions (View All, Mark all read, Settings, Refresh) */}
  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
    <button
      onClick={navigateToNotifications}
      className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1"
    >
      <ChevronRight size={14} className="rotate-180" />
      View All
    </button>
    <div className="flex items-center gap-2">
      <button 
        onClick={() => {
          setShowSettings(true);
          setShowNotifications(false);
        }}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        title="Notification Settings"
      >
        <Settings size={14} className="text-gray-400 hover:text-gray-600" />
      </button>
      <button 
        onClick={loadNotifications}
        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
        title="Refresh"
      >
        <RefreshCw size={14} className="text-gray-400 hover:text-gray-600" />
      </button>
      {unreadCount > 0 && (
        <button 
          onClick={markAllAsRead}
          className="text-[10px] text-blue-500 hover:text-blue-700 hover:underline font-medium"
        >
          Mark all read
        </button>
      )}
    </div>
  </div>
</div>
            
            <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
              {notifications.length > 0 ? (
                <>
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={`p-4 border-b border-gray-100 transition-all duration-200 cursor-pointer ${getBgColor(notif.type)} ${!notif.read ? 'border-l-4 border-l-blue-500' : ''}`}
                      onClick={() => markAsRead(notif.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{notif.title}</p>
                          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{notif.description}</p>
                          <p className="text-[10px] text-gray-400 mt-1.5">{notif.time}</p>
                        </div>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {/* FAB - Floating Action Button in middle-right of card */}
{/* <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-10">
  <button
    onClick={navigateToNotifications}
    className="bg-blue-600 text-white rounded-full p-2 sm:p-3 shadow-xl hover:bg-blue-700 hover:shadow-2xl transition-all duration-200 flex items-center justify-center group border-2 border-white/20"
    title="View All Notifications"
  >
    <div className="flex items-center gap-0.5 sm:gap-1.5">
      <Bell size={14} className="sm:w-[18px] sm:h-[18px]" />
      <span className="text-[8px] sm:text-xs font-medium hidden sm:inline">View All</span>
      <ChevronRight size={12} className="sm:w-[16px] sm:h-[16px] group-hover:translate-x-0.5 transition-transform" />
    </div>
  </button>
</div> */}
                </>
              ) : (
                <div className="p-10 text-center text-gray-500">
                  <CheckCircle size={40} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-sm font-medium text-gray-700">All clear!</p>
                  <p className="text-xs text-gray-400 mt-1">No notifications for you right now</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;