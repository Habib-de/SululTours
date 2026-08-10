import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const VAPID_PUBLIC_KEY = 'BPhdfyyOVmu7FSl8qChi53xAOCzYvI4Iopl5KECi1Fg3UkdyYvIa2FMSOMtphnScI8ryiutQqcjBhhE7l_vy2-g';

export const usePushNotifications = () => {
  const { currentUser, token } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const supported = 'Notification' in window && 
                        'serviceWorker' in navigator && 
                        'PushManager' in window;
      setIsSupported(supported);
      setLoading(false);

      if (supported && currentUser) {
        await checkSubscription();
      }
    };

    checkSupport();
  }, [currentUser]);

  // Check if already subscribed
  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
      return subscription;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return null;
    }
  };

  // Subscribe to push notifications
  const subscribe = async () => {
    if (!isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission denied');
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Save subscription to backend
      const response = await fetch('https://sulultours.com/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          authKey: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('auth')))),
          p256dhKey: btoa(String.fromCharCode.apply(null, new Uint8Array(subscription.getKey('p256dh')))),
          deviceType: 'WEB'
        })
      });

      if (response.ok) {
        setIsSubscribed(true);
        console.log('✅ Successfully subscribed to push notifications');
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to save subscription to backend:', errorData);
        return false;
      }
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // Remove from backend
        await fetch('https://sulultours.com/api/push/unsubscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });

        // Unsubscribe from browser
        await subscription.unsubscribe();
        setIsSubscribed(false);
        console.log('✅ Successfully unsubscribed from push notifications');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      return false;
    }
  };

  // Helper to convert VAPID key
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

  return {
    isSupported,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
    checkSubscription
  };
};