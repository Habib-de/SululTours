import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Car, Users, Calendar, DollarSign, 
  TrendingUp, TrendingDown, Package, 
  MapPin, Plane, Hotel, Compass,
  ArrowRight, Bell, Clock, CheckCircle,
  AlertCircle, Star, Phone, Mail,
  BarChart3, PieChart, UserPlus, 
  X, Check, User, Building, RefreshCw,
  Shield, Award, CreditCard, Wallet,
  TrendingUp as TrendingUpIcon,
  Headphones, Search, Filter, Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingService, userService } from '../../services/api';

const ClientDashboard = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [notification, setNotification] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalSpent: 0,
    totalServices: 0
  });

  // ✅ FIXED: Load user data on mount - with localStorage fallback
  useEffect(() => {
    const loadUser = async () => {
      // Try to get from auth context
      let user = currentUser;
      
      // If not available, try localStorage
      if (!user || !user.email) {
        try {
          const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
          if (storedUser && storedUser.email) {
            user = storedUser;
            console.log('📥 Loaded user from localStorage fallback');
          }
        } catch (e) {
          console.error('Error loading user from localStorage:', e);
        }
      }
      
      if (user && user.email) {
        setUserData(user);
        const tid = user?.tenantId || null;
        setTenantId(tid);
        console.log('🔍 User loaded:', user.email, 'Tenant:', tid);
        
        if (tid) {
          await loadDashboardData(tid, user);
        } else {
          loadFromLocalStorage(user);
          setLoading(false);
        }
      } else {
        console.warn('⚠️ No user found');
        setLoading(false);
      }
    };
    
    loadUser();
  }, [currentUser]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ✅ FIXED: Accept tenantId and user as parameters
  const loadDashboardData = async (tid, user) => {
    setLoading(true);

    try {
      const tenantToUse = tid || tenantId;
      const userToUse = user || userData || currentUser;
      
      if (!tenantToUse) {
        console.warn('⚠️ No tenantId found, loading from localStorage fallback');
        loadFromLocalStorage(userToUse);
        setLoading(false);
        return;
      }

      // Check if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('⚠️ No token found, loading from localStorage');
        loadFromLocalStorage(userToUse);
        setLoading(false);
        return;
      }

      console.log('📤 Fetching bookings for tenant:', tenantToUse);
      const response = await bookingService.getAll(tenantToUse);
      console.log('📊 Bookings Response:', response);
      
      let allBookings = [];
      if (response?.success && response?.data) {
        allBookings = response.data;
      } else if (Array.isArray(response)) {
        allBookings = response;
      } else if (response?.data && Array.isArray(response.data)) {
        allBookings = response.data;
      }
      
      // Get user info from the passed user
      const userEmail = userToUse?.email?.toLowerCase().trim();
      const userPhone = userToUse?.phone;
      const userName = userToUse?.name?.toLowerCase().trim();
      const userId = userToUse?.id;
      
      // Filter bookings for this client
      const clientBookings = allBookings.filter(b => {
        const bookingEmail = (b.customerEmail || b.userEmail || b.email || '').toLowerCase().trim();
        const bookingPhone = b.customerPhone || b.phone || '';
        const bookingName = (b.customerName || '').toLowerCase().trim();
        
        if (bookingEmail && userEmail && bookingEmail === userEmail) return true;
        if (bookingPhone && userPhone && bookingPhone === userPhone) return true;
        if (bookingName && userName && bookingName === userName) return true;
        if (b.userId && b.userId === userId) return true;
        
        return false;
      });
      
      console.log(`📊 Found ${clientBookings.length} bookings for client`);
      setBookings(clientBookings);

      // Calculate stats
      const total = clientBookings.length;
      const pending = clientBookings.filter(b => b.status === 'pending' || b.status === 'Pending').length;
      const confirmed = clientBookings.filter(b => b.status === 'confirmed' || b.status === 'Confirmed' || b.status === 'active' || b.status === 'Active').length;
      const completed = clientBookings.filter(b => b.status === 'completed' || b.status === 'Completed').length;
      const cancelled = clientBookings.filter(b => b.status === 'cancelled' || b.status === 'Cancelled').length;
      
      const totalSpent = clientBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      
      const servicesSet = new Set();
      clientBookings.forEach(b => {
        const service = b.serviceType || b.service_type || '';
        if (service) servicesSet.add(service);
      });

      setStats({
        totalBookings: total,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        completedBookings: completed,
        cancelledBookings: cancelled,
        totalSpent: totalSpent,
        totalServices: servicesSet.size
      });
      
    } catch (error) {
      console.error('❌ Error loading bookings:', error);
      showNotification('Error loading bookings. Using local data.', 'error');
      // Fallback to localStorage
      loadFromLocalStorage(user || userData);
    }
    
    setLoading(false);
  };

  // ✅ FIXED: Accept user as parameter
  const loadFromLocalStorage = (user) => {
    try {
      const userToUse = user || userData || currentUser || JSON.parse(localStorage.getItem('user') || '{}');
      
      const storedBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      const guestBookings = JSON.parse(localStorage.getItem('travel_agency_guest_bookings') || '[]');
      
      const bookingMap = new Map();
      storedBookings.forEach(b => bookingMap.set(b.id, b));
      guestBookings.forEach(b => bookingMap.set(b.id, b));
      const allBookings = Array.from(bookingMap.values());
      
      const userEmail = userToUse?.email?.toLowerCase().trim();
      const userPhone = userToUse?.phone;
      const userName = userToUse?.name?.toLowerCase().trim();
      const userId = userToUse?.id;
      
      const clientBookings = allBookings.filter(b => {
        const bookingEmail = (b.customerEmail || b.userEmail || b.email || '').toLowerCase().trim();
        const bookingPhone = b.customerPhone || b.phone || '';
        const bookingName = (b.customerName || '').toLowerCase().trim();
        
        if (bookingEmail && userEmail && bookingEmail === userEmail) return true;
        if (bookingPhone && userPhone && bookingPhone === userPhone) return true;
        if (bookingName && userName && bookingName === userName) return true;
        if (b.userId && b.userId === userId) return true;
        
        return false;
      });
      
      setBookings(clientBookings);
      
      const total = clientBookings.length;
      const pending = clientBookings.filter(b => b.status === 'pending' || b.status === 'Pending').length;
      const confirmed = clientBookings.filter(b => b.status === 'confirmed' || b.status === 'Confirmed' || b.status === 'active' || b.status === 'Active').length;
      const completed = clientBookings.filter(b => b.status === 'completed' || b.status === 'Completed').length;
      const cancelled = clientBookings.filter(b => b.status === 'cancelled' || b.status === 'Cancelled').length;
      const totalSpent = clientBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      
      const servicesSet = new Set();
      clientBookings.forEach(b => {
        const service = b.serviceType || b.service_type || '';
        if (service) servicesSet.add(service);
      });

      setStats({
        totalBookings: total,
        pendingBookings: pending,
        confirmedBookings: confirmed,
        completedBookings: completed,
        cancelledBookings: cancelled,
        totalSpent: totalSpent,
        totalServices: servicesSet.size
      });
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  const getStatusBadge = useCallback((status) => {
    const statusMap = {
      pending: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { label: '📌 Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      active: { label: '✅ Active', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      completed: { label: '✅ Completed', color: 'bg-gray-100 text-gray-800', icon: CheckCircle },
      cancelled: { label: '❌ Cancelled', color: 'bg-red-100 text-red-800', icon: X },
      rejected: { label: '❌ Rejected', color: 'bg-red-100 text-red-800', icon: X }
    };
    return statusMap[status] || { label: status || 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock };
  }, []);

  const getServiceIcon = useCallback((serviceType) => {
    const iconMap = {
      'car_hire': <Car size={16} className="text-blue-600" />,
      'car': <Car size={16} className="text-blue-600" />,
      'tour': <Compass size={16} className="text-green-600" />,
      'tour_package': <Compass size={16} className="text-green-600" />,
      'hajj': <MapPin size={16} className="text-purple-600" />,
      'hajj_umra': <MapPin size={16} className="text-purple-600" />,
      'hotel': <Hotel size={16} className="text-orange-600" />,
      'hotel_booking': <Hotel size={16} className="text-orange-600" />,
      'flight': <Plane size={16} className="text-indigo-600" />,
      'flight_booking': <Plane size={16} className="text-indigo-600" />
    };
    return iconMap[serviceType] || <Calendar size={16} className="text-gray-400" />;
  }, []);

  const getServiceLabel = useCallback((serviceType) => {
    const labelMap = {
      'car_hire': 'Car Hire',
      'car': 'Car Hire',
      'tour': 'Tour & Travel',
      'tour_package': 'Tour & Travel',
      'hajj': 'Hajj & Umra',
      'hajj_umra': 'Hajj & Umra',
      'hotel': 'Hotel',
      'hotel_booking': 'Hotel',
      'flight': 'Flight',
      'flight_booking': 'Flight'
    };
    return labelMap[serviceType] || 'Booking';
  }, []);

  const formatDateTime = useCallback((dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (e) {
      return dateString;
    }
  }, []);

  const formatCurrency = useCallback((amount) => {
    return `KSh ${(amount || 0).toLocaleString()}`;
  }, []);

  const serviceLinks = useMemo(() => [
    { label: 'Car Hire', icon: Car, tab: 'client-car-hire', color: 'blue', description: 'Rent a vehicle for your journey' },
    { label: 'Tours & Travel', icon: Compass, tab: 'client-tours', color: 'green', description: 'Explore adventure and wildlife tours' },
    { label: 'Hajj & Umra', icon: MapPin, tab: 'client-hajj-umra', color: 'purple', description: 'Book pilgrimage packages' },
    { label: 'Hotels', icon: Hotel, tab: 'client-hotels', color: 'orange', description: 'Find the perfect accommodation' },
    { label: 'Flights', icon: Plane, tab: 'client-flights', color: 'indigo', description: 'Book local and international flights' },
  ], []);

  const statsCards = useMemo(() => [
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      subtitle: `${stats.totalBookings} bookings`
    },
    {
      title: 'Pending',
      value: stats.pendingBookings,
      icon: Clock,
      subtitle: 'Awaiting confirmation'
    },
    {
      title: 'Confirmed',
      value: stats.confirmedBookings,
      icon: CheckCircle,
      subtitle: 'Confirmed bookings'
    },
    {
      title: 'Completed',
      value: stats.completedBookings,
      icon: Award,
      subtitle: 'Completed journeys'
    },
    {
      title: 'Total Spent',
      value: formatCurrency(stats.totalSpent),
      icon: DollarSign,
      subtitle: `${stats.totalServices} services used`
    }
  ], [stats, formatCurrency]);

  const recentBookings = useMemo(() => {
    return bookings.slice(0, 5);
  }, [bookings]);

  // ✅ FIXED: Refresh handler using stored user data
  const handleRefresh = () => {
    const user = userData || currentUser || JSON.parse(localStorage.getItem('user') || '{}');
    const tid = user?.tenantId || tenantId;
    if (tid) {
      loadDashboardData(tid, user);
    } else {
      loadFromLocalStorage(user);
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-sm">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Welcome back, {userData?.name || currentUser?.name || 'Guest'}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Explore and book amazing travel experiences
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button 
            onClick={() => setActiveTab('client-my-bookings')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 whitespace-nowrap"
          >
            <Calendar size={16} /> My Bookings ({bookings.length})
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        {statsCards.map((stat, index) => (
          <div 
            key={index}
            className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${
              stat.title === 'Total Spent' ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <stat.icon size={18} className={
                stat.title === 'Total Spent' ? 'text-green-500' : 'text-gray-400'
              } />
            </div>
            <p className={`text-xl sm:text-2xl font-bold mt-2 ${
              stat.title === 'Total Spent' ? 'text-green-600' : 'text-gray-800'
            }`}>
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{stat.title}</p>
            {stat.subtitle && (
              <p className="text-[10px] text-gray-400 mt-0.5">{stat.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      {/* Services Grid - Main Feature */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Services Offered by SululTours</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {serviceLinks.map((service, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(service.tab)}
              className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                <service.icon size={24} className="text-blue-600" />
              </div>
              <p className="text-xs font-medium text-gray-700">{service.label}</p>
              <p className="text-[8px] text-gray-400 mt-0.5 hidden sm:block">{service.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Bookings & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Recent Bookings</h2>
            {bookings.length > 0 && (
              <button 
                onClick={() => setActiveTab('client-my-bookings')}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                View All <ArrowRight size={12} />
              </button>
            )}
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">
                <div className="flex justify-center">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="mt-2">Loading bookings...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Calendar size={32} className="text-blue-600" />
                </div>
                <p className="text-gray-500">No bookings yet</p>
                <p className="text-sm text-gray-400 mt-1">Start planning your next adventure!</p>
                <button
                  onClick={() => setActiveTab('client-car-hire')}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Book Now
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {recentBookings.map((booking, index) => {
                  const statusBadge = getStatusBadge(booking.status);
                  const StatusIcon = statusBadge.icon;
                  const serviceIcon = getServiceIcon(booking.serviceType);
                  const serviceLabel = getServiceLabel(booking.serviceType);
                  const hasDebt = (booking.remainingBalance || 0) > 0;
                  
                  let itemName = 'Booking';
                  if (booking.vehicleRegistration) {
                    itemName = booking.vehicleRegistration;
                  } else if (booking.hotelName) {
                    itemName = booking.hotelName;
                  } else if (booking.airline) {
                    itemName = `${booking.airline} ${booking.flightNumber || ''}`;
                  } else if (booking.packageName) {
                    itemName = booking.packageName;
                  } else if (booking.destination) {
                    itemName = booking.destination;
                  } else if (booking.itemName) {
                    itemName = booking.itemName;
                  }
                  
                  return (
                    <div 
                      key={booking.id || index}
                      className="flex items-center justify-between p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors rounded-lg"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {serviceIcon}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-800 truncate">
                              {serviceLabel}
                            </p>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color} flex items-center gap-0.5`}>
                              <StatusIcon size={10} /> {statusBadge.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 truncate">
                            {itemName}
                          </p>
                          <p className="text-[10px] text-gray-400">
                            {formatDateTime(booking.startDate || booking.checkIn || booking.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {booking.totalPrice && (
                          <span className="text-sm font-semibold text-blue-600">
                            {formatCurrency(booking.totalPrice)}
                          </span>
                        )}
                        {hasDebt && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            O/S: {formatCurrency(booking.remainingBalance)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Booking Summary</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-600 mb-2">Booking Status</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-600">Completed</span>
                  </div>
                  <span className="text-xs font-medium">{stats.completedBookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                    <span className="text-xs text-gray-600">Pending</span>
                  </div>
                  <span className="text-xs font-medium">{stats.pendingBookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                    <span className="text-xs text-gray-600">Confirmed</span>
                  </div>
                  <span className="text-xs font-medium">{stats.confirmedBookings}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                    <span className="text-xs text-gray-600">Cancelled</span>
                  </div>
                  <span className="text-xs font-medium">{stats.cancelledBookings}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-2">Quick Stats</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Total Spent:</span>
                  <span className="font-medium text-green-600 block">{formatCurrency(stats.totalSpent)}</span>
                </div>
                <div>
                  <span className="text-gray-400">Services Used:</span>
                  <span className="font-medium block">{stats.totalServices}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-2">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setActiveTab('client-car-hire')}
                  className="text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg py-2 px-3 transition-colors flex items-center justify-center gap-1"
                >
                  <Car size={14} /> Book Car
                </button>
                <button
                  onClick={() => setActiveTab('client-my-bookings')}
                  className="text-xs bg-purple-50 text-purple-600 hover:bg-purple-100 rounded-lg py-2 px-3 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye size={14} /> View All
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Star size={16} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-blue-800">Travel Tips</h3>
            <p className="text-xs text-blue-600 mt-0.5">
              💡 Book early to get the best rates. Check our packages for amazing deals!
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

export default ClientDashboard;