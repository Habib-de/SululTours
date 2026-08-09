import React, { useState, useEffect } from 'react';
import { 
  Car, Users, Calendar, DollarSign, 
  TrendingUp, TrendingDown, Package, 
  MapPin, Plane, Hotel, Compass,
  ArrowRight, Bell, Clock, CheckCircle,
  AlertCircle, Star, Phone, Mail,
  BarChart3, PieChart, Eye, Edit2,
  Plus, Search, Filter, RefreshCw,
  Wallet, CreditCard, Shield, Award,
  Tag, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { vehicleService, bookingService, carOwnerService, complianceService } from '../../services/api';

const CarOwnerDashboard = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalDebt: 0,
    totalDiscount: 0,
    pendingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    activeVehicles: 0,
    maintenanceVehicles: 0,
    debtCount: 0,
    complianceScore: 0,
    expiredCompliance: 0,
    expiringCompliance: 0
  });
  const [vehicles, setVehicles] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownerProfile, setOwnerProfile] = useState(null);
  const [complianceItems, setComplianceItems] = useState([]);
  const [notification, setNotification] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [ownerId, setOwnerId] = useState(null);

  useEffect(() => {
    // Get tenant ID and owner ID from logged-in user
    const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
    setTenantId(userData?.tenantId || null);
    
    if (userData?.id) {
      loadCarOwnerProfile(userData.id);
    } else {
      loadFromLocalStorage();
      setLoading(false);
    }
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadCarOwnerProfile = async (userId) => {
    try {
      // Get car owner profile by user ID
      const response = await carOwnerService.getByUser(userId);
      
      let ownerData = null;
      if (response?.success && response?.data) {
        ownerData = response.data;
      } else if (response?.data) {
        ownerData = response.data;
      } else if (response?.id) {
        ownerData = response;
      }
      
      if (ownerData) {
        setOwnerProfile(ownerData);
        setOwnerId(ownerData.id);
        loadDashboardData(ownerData.id, ownerData.tenantId || tenantId);
      } else {
        showNotification('Car owner profile not found. Loading from local storage.', 'info');
        loadFromLocalStorage();
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading car owner profile:', error);
      if (error.message?.includes('404')) {
        showNotification('Car owner profile not found. Loading from local storage.', 'info');
      } else {
        showNotification('Failed to load profile. Please refresh.', 'error');
      }
      loadFromLocalStorage();
    }
  };

  const loadDashboardData = async (ownerIdParam, tenantIdParam) => {
    const ownerId = ownerIdParam || ownerId;
    const tid = tenantIdParam || tenantId;
    
    if (!ownerId) {
      showNotification('No car owner profile found. Loading from local storage.', 'info');
      loadFromLocalStorage();
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // ✅ 1. Get owner's vehicles
      let vehiclesData = [];
      try {
        const vehiclesResponse = await vehicleService.getByOwner(ownerId);
        if (vehiclesResponse?.success && vehiclesResponse?.data) {
          vehiclesData = vehiclesResponse.data;
        } else if (Array.isArray(vehiclesResponse)) {
          vehiclesData = vehiclesResponse;
        } else if (vehiclesResponse?.data && Array.isArray(vehiclesResponse.data)) {
          vehiclesData = vehiclesResponse.data;
        }
      } catch (e) {
        console.warn('Could not fetch vehicles:', e);
      }
      setVehicles(vehiclesData);

      // ✅ 2. Get all bookings for the tenant
      let bookingsData = [];
      try {
        const bookingsResponse = await bookingService.getAll(tid);
        let allBookings = [];
        if (bookingsResponse?.success && bookingsResponse?.data) {
          allBookings = bookingsResponse.data;
        } else if (Array.isArray(bookingsResponse)) {
          allBookings = bookingsResponse;
        } else if (bookingsResponse?.data && Array.isArray(bookingsResponse.data)) {
          allBookings = bookingsResponse.data;
        }
        
        // Filter bookings by owner's vehicles
        const vehicleIds = vehiclesData.map(v => v.id);
        bookingsData = allBookings.filter(b => vehicleIds.includes(b.vehicleId));
      } catch (e) {
        console.warn('Could not fetch bookings:', e);
      }

      // ✅ 3. Get compliance items
      let complianceData = [];
      try {
        const complianceResponse = await complianceService.getAll(tid);
        let allCompliance = [];
        if (complianceResponse?.success && complianceResponse?.data) {
          allCompliance = complianceResponse.data;
        } else if (Array.isArray(complianceResponse)) {
          allCompliance = complianceResponse;
        } else if (complianceResponse?.data && Array.isArray(complianceResponse.data)) {
          allCompliance = complianceResponse.data;
        }
        
        // Filter compliance by owner's vehicles
        const vehicleIds = vehiclesData.map(v => v.id);
        complianceData = allCompliance.filter(c => vehicleIds.includes(c.vehicleId));
        
        // ✅ Enhance compliance data with status calculations
                // ✅ Enhance compliance data with status calculations
        complianceData = complianceData.map(item => {
          const validUntil = item.validUntil;
          const now = new Date();
          const expiryDate = new Date(validUntil);
          const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          
          // ✅ FIX: Recalculate status from scratch, ignore stored status
          let status = 'valid';
          if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
            status = 'expiring_soon';
          } else if (daysUntilExpiry < 0) {
            status = 'expired';
          }
          
          return {
            ...item,
            status,
            daysUntilExpiry,
            isExpired: daysUntilExpiry < 0
          };
        });
      } catch (e) {
        console.warn('Could not fetch compliance:', e);
      }
      setComplianceItems(complianceData);

      // ✅ 4. Calculate stats with proper discount handling
      const totalVehicles = vehiclesData.length;
      const activeVehicles = vehiclesData.filter(v => v.status === 'active' || v.status === 'Active').length;
      const maintenanceVehicles = vehiclesData.filter(v => v.status === 'maintenance' || v.status === 'Maintenance' || v.status === 'inactive').length;
      const totalBookings = bookingsData.length;
      
      // ✅ Calculate revenue with discount applied to total
      const totalRevenue = bookingsData.reduce((sum, b) => {
        const dailyRate = b.vehiclePricePerDay || b.pricePerDay || 0;
        const days = b.days || b.duration || 0;
        const baseEarnings = dailyRate * days;
        
        let discount = 0;
        if (b.discountType === 'PERCENTAGE') {
          const discountPercent = parseFloat(b.discountValue) || 0;
          discount = baseEarnings * discountPercent / 100;
        } else if (b.discountType === 'FIXED') {
          discount = (b.discountAmount || 0) * days;
        } else {
          discount = b.discountAmount || 0;
        }
        
        return sum + (baseEarnings - discount);
      }, 0);
      
      // ✅ Calculate total discount
      const totalDiscount = bookingsData.reduce((sum, b) => {
        const dailyRate = b.vehiclePricePerDay || b.pricePerDay || 0;
        const days = b.days || b.duration || 0;
        const baseEarnings = dailyRate * days;
        
        if (b.discountType === 'PERCENTAGE') {
          const discountPercent = parseFloat(b.discountValue) || 0;
          return sum + (baseEarnings * discountPercent / 100);
        } else if (b.discountType === 'FIXED') {
          return sum + ((b.discountAmount || 0) * days);
        }
        return sum + (b.discountAmount || 0);
      }, 0);
      
      const totalDebt = bookingsData.reduce((sum, b) => sum + (b.remainingBalance || 0), 0);
      const debtCount = bookingsData.filter(b => (b.remainingBalance || 0) > 0).length;
      
      const pendingBookings = bookingsData.filter(b => b.status === 'pending' || b.status === 'Pending').length;
      const completedBookings = bookingsData.filter(b => b.status === 'completed' || b.status === 'Completed' || b.status === 'confirmed' || b.status === 'Confirmed').length;
      const cancelledBookings = bookingsData.filter(b => b.status === 'cancelled' || b.status === 'Cancelled').length;

      // ✅ Compliance stats
      const totalCompliance = complianceData.length;
      const validCompliance = complianceData.filter(c => c.status === 'valid' || c.status === 'Valid').length;
      const expiredCompliance = complianceData.filter(c => c.status === 'expired').length;
      const expiringCompliance = complianceData.filter(c => c.status === 'expiring_soon').length;
      const complianceScore = totalCompliance > 0 ? Math.round((validCompliance / totalCompliance) * 100) : 0;

      setStats({
        totalVehicles,
        totalBookings,
        totalRevenue,
        totalDiscount,
        totalDebt,
        debtCount,
        pendingBookings,
        completedBookings,
        cancelledBookings,
        activeVehicles,
        maintenanceVehicles,
        complianceScore,
        expiredCompliance,
        expiringCompliance
      });

      // Get recent bookings (last 5) - hide customer name
      const sortedBookings = [...bookingsData].sort((a, b) => 
        new Date(b.createdAt || b.created_at || b.booking_date) - new Date(a.createdAt || a.created_at || a.booking_date)
      );
      setRecentBookings(sortedBookings.slice(0, 5));

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showNotification('Failed to load dashboard data. Loading from local storage.', 'error');
      loadFromLocalStorage();
    }

    setLoading(false);
  };

  // ✅ Fallback to localStorage
  const loadFromLocalStorage = () => {
    console.warn('Loading dashboard data from localStorage (fallback)');
    
    try {
      const allOwners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
      const profile = allOwners.find(o => o.userId === currentUser?.id);
      setOwnerProfile(profile);

      const allVehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
      const myVehicles = allVehicles.filter(v => v.ownerId === profile?.id);
      setVehicles(myVehicles);

      const allBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      const myBookings = allBookings.filter(b => b.ownerId === profile?.id);

      const allCompliance = JSON.parse(localStorage.getItem('travel_agency_compliance') || '[]');
      const myCompliance = allCompliance.filter(c => {
        const vehicle = allVehicles.find(v => v.id === c.vehicleId);
        return vehicle?.ownerId === profile?.id;
      });
      
      // Enhance compliance data
            // Enhance compliance data
      const enhancedCompliance = myCompliance.map(item => {
        const validUntil = item.validUntil;
        const now = new Date();
        const expiryDate = new Date(validUntil);
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        // ✅ FIX: Recalculate status from scratch, ignore stored status
        let status = 'valid';
        if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
          status = 'expiring_soon';
        } else if (daysUntilExpiry < 0) {
          status = 'expired';
        }
        
        return {
          ...item,
          status,
          daysUntilExpiry,
          isExpired: daysUntilExpiry < 0
        };
      });
      setComplianceItems(enhancedCompliance);

      // Calculate stats with proper discount handling
      const totalVehicles = myVehicles.length;
      const activeVehicles = myVehicles.filter(v => v.status === 'active').length;
      const maintenanceVehicles = myVehicles.filter(v => v.status === 'maintenance' || v.status === 'Maintenance').length;
      const totalBookings = myBookings.length;
      
      const totalRevenue = myBookings.reduce((sum, b) => {
        const dailyRate = b.vehiclePricePerDay || 0;
        const days = b.days || 0;
        const baseEarnings = dailyRate * days;
        
        let discount = 0;
        if (b.discountType === 'PERCENTAGE') {
          const discountPercent = parseFloat(b.discountValue) || 0;
          discount = baseEarnings * discountPercent / 100;
        } else if (b.discountType === 'FIXED') {
          discount = (b.discountAmount || 0) * days;
        } else {
          discount = b.discountAmount || 0;
        }
        
        return sum + (baseEarnings - discount);
      }, 0);
      
      const totalDiscount = myBookings.reduce((sum, b) => {
        const dailyRate = b.vehiclePricePerDay || 0;
        const days = b.days || 0;
        const baseEarnings = dailyRate * days;
        
        if (b.discountType === 'PERCENTAGE') {
          const discountPercent = parseFloat(b.discountValue) || 0;
          return sum + (baseEarnings * discountPercent / 100);
        } else if (b.discountType === 'FIXED') {
          return sum + ((b.discountAmount || 0) * days);
        }
        return sum + (b.discountAmount || 0);
      }, 0);
      
      const totalDebt = myBookings.reduce((sum, b) => sum + (b.remainingBalance || 0), 0);
      const debtCount = myBookings.filter(b => (b.remainingBalance || 0) > 0).length;
      
      const pendingBookings = myBookings.filter(b => b.status === 'pending').length;
      const completedBookings = myBookings.filter(b => b.status === 'completed' || b.status === 'confirmed').length;
      const cancelledBookings = myBookings.filter(b => b.status === 'cancelled').length;

      // Compliance stats
      const totalCompliance = enhancedCompliance.length;
      const validCompliance = enhancedCompliance.filter(c => c.status === 'valid').length;
      const expiredCompliance = enhancedCompliance.filter(c => c.status === 'expired').length;
      const expiringCompliance = enhancedCompliance.filter(c => c.status === 'expiring_soon').length;
      const complianceScore = totalCompliance > 0 ? Math.round((validCompliance / totalCompliance) * 100) : 0;

      setStats({
        totalVehicles,
        totalBookings,
        totalRevenue,
        totalDiscount,
        totalDebt,
        debtCount,
        pendingBookings,
        completedBookings,
        cancelledBookings,
        activeVehicles,
        maintenanceVehicles,
        complianceScore,
        expiredCompliance,
        expiringCompliance
      });

      const sortedBookings = [...myBookings].sort((a, b) => 
        new Date(b.createdAt || b.created_at || b.booking_date) - new Date(a.createdAt || a.created_at || a.booking_date)
      );
      setRecentBookings(sortedBookings.slice(0, 5));
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  const calculateBookingRevenue = (booking) => {
    const dailyRate = booking.vehiclePricePerDay || booking.pricePerDay || 0;
    const days = booking.days || booking.duration || 0;
    const baseEarnings = dailyRate * days;
    
    let discount = 0;
    if (booking.discountType === 'PERCENTAGE') {
      const discountPercent = parseFloat(booking.discountValue) || 0;
      discount = baseEarnings * discountPercent / 100;
    } else if (booking.discountType === 'FIXED') {
      discount = (booking.discountAmount || 0) * days;
    } else {
      discount = booking.discountAmount || 0;
    }
    
    return baseEarnings - discount;
  };

  const calculateBookingDiscount = (booking) => {
    const dailyRate = booking.vehiclePricePerDay || booking.pricePerDay || 0;
    const days = booking.days || booking.duration || 0;
    const baseEarnings = dailyRate * days;
    
    if (booking.discountType === 'PERCENTAGE') {
      const discountPercent = parseFloat(booking.discountValue) || 0;
      return baseEarnings * discountPercent / 100;
    } else if (booking.discountType === 'FIXED') {
      return (booking.discountAmount || 0) * days;
    }
    return booking.discountAmount || 0;
  };

  const getStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' };
      case 'confirmed':
      case 'completed': return { label: 'Completed', color: 'bg-green-100 text-green-800' };
      case 'cancelled': return { label: 'Cancelled', color: 'bg-red-100 text-red-800' };
      case 'paid': return { label: 'Paid', color: 'bg-green-100 text-green-800' };
      case 'partial': return { label: 'Partial', color: 'bg-blue-100 text-blue-800' };
      default: return { label: status || 'N/A', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getVehicleStatusBadge = (status) => {
    switch(status?.toLowerCase()) {
      case 'active': return { label: 'Active', color: 'bg-green-100 text-green-800' };
      case 'rented': return { label: 'Rented', color: 'bg-blue-100 text-blue-800' };
      case 'maintenance': return { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' };
      case 'inactive': return { label: 'Inactive', color: 'bg-gray-100 text-gray-800' };
      default: return { label: status || 'N/A', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const getComplianceStatusColor = (status) => {
    switch(status) {
      case 'valid': return 'bg-green-100 text-green-700';
      case 'expiring_soon': return 'bg-orange-100 text-orange-700';
      case 'expired': return 'bg-red-100 text-red-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const statsCards = [
    {
      title: 'My Vehicles',
      value: stats.totalVehicles,
      icon: Car,
      subtitle: `${stats.activeVehicles} active, ${stats.maintenanceVehicles} in maintenance`
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      subtitle: `${stats.pendingBookings} pending, ${stats.completedBookings} completed`
    },
    {
      title: 'Total Revenue',
      value: `KSh ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      subtitle: 'After discounts applied'
    },
    {
      title: 'Total Discounts',
      value: `KSh ${stats.totalDiscount.toLocaleString()}`,
      icon: Tag,
      subtitle: 'Applied to bookings'
    },
    {
      title: 'Total Debt',
      value: `KSh ${stats.totalDebt.toLocaleString()}`,
      icon: Wallet,
      subtitle: `${stats.debtCount} booking(s) with debt`
    }
  ];

  const quickActions = [
    { label: 'My Vehicles', icon: Car, tab: 'my-vehicles', color: 'blue' },
    { label: 'Vehicle Bookings', icon: Calendar, tab: 'vehicle-bookings', color: 'green' },
    { label: 'Revenue', icon: DollarSign, tab: 'revenue', color: 'yellow' },
    { label: 'Compliance', icon: Shield, tab: 'compliance', color: 'purple' },
    { label: 'Maintenance', icon: Clock, tab: 'maintenance-status', color: 'orange' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 
          notification.type === 'info' ? 'bg-blue-50 border border-blue-200 text-blue-700' :
          'bg-green-50 border border-green-200 text-green-700'
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
            Welcome back, {currentUser?.name || 'Car Owner'}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {ownerProfile?.companyName ? `(${ownerProfile.companyName})` : ''} 
            {' '}Here's what's happening with your vehicles today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (ownerId) {
                loadDashboardData(ownerId, tenantId);
              } else {
                loadFromLocalStorage();
              }
            }}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        {statsCards.map((stat, index) => (
          <div 
            key={index}
            className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${
              stat.title === 'Total Debt' && stats.totalDebt > 0 ? 'border-red-200 bg-red-50/30' : 
              stat.title === 'Total Discounts' && stats.totalDiscount > 0 ? 'border-red-200 bg-red-50/30' :
              'border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <stat.icon size={18} className={
                stat.title === 'Total Debt' && stats.totalDebt > 0 ? 'text-red-500' :
                stat.title === 'Total Discounts' && stats.totalDiscount > 0 ? 'text-red-500' :
                'text-gray-400'
              } />
            </div>
            <p className={`text-xl sm:text-2xl font-bold mt-2 ${
              stat.title === 'Total Debt' && stats.totalDebt > 0 ? 'text-red-600' :
              stat.title === 'Total Discounts' && stats.totalDiscount > 0 ? 'text-red-600' :
              'text-gray-800'
            }`}>
              {stat.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{stat.title}</p>
            {stat.subtitle && (
              <p className="text-[10px] text-gray-400 mt-0.5 truncate">{stat.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      {/* ================================================================ */}
      {/* ✅ COMPLIANCE ALERT BANNER */}
      {/* ================================================================ */}
      {complianceItems.length > 0 && (stats.expiredCompliance > 0 || stats.expiringCompliance > 0) && (
        <div className="mb-6">
          <div className={`rounded-xl p-4 border flex items-start gap-4 ${
            stats.expiredCompliance > 0 
              ? 'bg-red-50 border-red-200' 
              : 'bg-orange-50 border-orange-200'
          }`}>
            <div className={`p-2 rounded-full flex-shrink-0 ${
              stats.expiredCompliance > 0 ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'
            }`}>
              <Shield size={20} />
            </div>
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    {stats.expiredCompliance > 0 ? (
                      <span className="text-red-700">⚠️ Compliance Alert - Expired Documents</span>
                    ) : (
                      <span className="text-orange-700">⚠️ Compliance Alert - Documents Expiring Soon</span>
                    )}
                  </h4>
                  <p className="text-xs mt-0.5">
                    {stats.expiredCompliance > 0 
                      ? `${stats.expiredCompliance} compliance document(s) have expired. `
                      : `${stats.expiringCompliance} compliance document(s) will expire within 30 days. `
                    }
                    Please review and update your compliance documents to avoid penalties.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {complianceItems
                      .filter(c => c.status === 'expired' || c.status === 'expiring_soon')
                      .slice(0, 3)
                      .map(item => (
                        <span key={item.id} className={`text-[10px] px-2 py-0.5 rounded-full ${getComplianceStatusColor(item.status)}`}>
                          {item.type} - {item.vehicleLabel}
                        </span>
                      ))}
                    {(stats.expiredCompliance + stats.expiringCompliance) > 3 && (
                      <span className="text-[10px] text-gray-500 px-2 py-0.5">
                        +{(stats.expiredCompliance + stats.expiringCompliance) - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('compliance')}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 flex-shrink-0"
                >
                  <Shield size={16} /> View Compliance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Score Card (if no expired/expiring but has compliance items) */}
      {complianceItems.length > 0 && stats.expiredCompliance === 0 && stats.expiringCompliance === 0 && (
        <div className="mb-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-4">
            <div className="p-2 rounded-full bg-green-100 text-green-600 flex-shrink-0">
              <CheckCircle size={20} />
            </div>
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-green-700">✅ Compliance Status: Good</h4>
                <p className="text-xs text-green-600 mt-0.5">
                  All {complianceItems.length} compliance documents are valid. 
                  Compliance Score: <span className="font-bold">{stats.complianceScore}%</span>
                </p>
              </div>
              <button
                onClick={() => setActiveTab('compliance')}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 flex-shrink-0"
              >
                <Shield size={16} /> View Compliance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(action.tab)}
              className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 text-center hover:shadow-md hover:border-gray-300 transition-all group"
            >
              <action.icon 
                size={24} 
                className={`mx-auto text-${action.color}-500 group-hover:scale-110 transition-transform`} 
              />
              <p className="text-[10px] sm:text-xs font-medium text-gray-600 mt-1">{action.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* My Vehicles & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ========== MY VEHICLES CARD ========== */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">My Vehicles</h2>
            <button 
              onClick={() => setActiveTab('my-vehicles')}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
            ) : vehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {vehicles.slice(0, 4).map((vehicle) => {
                  const statusBadge = getVehicleStatusBadge(vehicle.status);
                  const vehicleBookings = recentBookings.filter(b => b.vehicleId === vehicle.id);
                  
                  const hasActiveBookings = vehicleBookings.some(b => 
                    b.status === 'pending' || 
                    b.status === 'Pending' || 
                    b.status === 'confirmed' || 
                    b.status === 'Confirmed'
                  );
                  
                  const activeBookingCount = vehicleBookings.filter(b => 
                    b.status === 'pending' || 
                    b.status === 'Pending' || 
                    b.status === 'confirmed' || 
                    b.status === 'Confirmed'
                  ).length;
                  
                  const isAvailable = !hasActiveBookings && vehicle.status?.toLowerCase() === 'active';
                  const isRented = hasActiveBookings;
                  
                  return (
                    <div 
                      key={vehicle.id} 
                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                        isRented 
                          ? 'bg-red-50 border border-red-200 hover:bg-red-100' 
                          : isAvailable
                          ? 'bg-green-50 border border-green-200 hover:bg-green-100'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isRented ? 'bg-red-100' : 
                          isAvailable ? 'bg-green-100' : 
                          'bg-blue-100'
                        }`}>
                          <Car size={18} className={
                            isRented ? 'text-red-600' : 
                            isAvailable ? 'text-green-600' : 
                            'text-blue-600'
                          } />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{vehicle.registration}</p>
                          <p className="text-xs text-gray-500 truncate">{vehicle.make} {vehicle.model}</p>
                          
                          {isRented ? (
                            <span className="text-[10px] text-red-600 flex items-center gap-1 font-medium">
                              <AlertCircle size={10} /> 🔴 Not Available - {activeBookingCount} active booking{activeBookingCount > 1 ? 's' : ''}
                            </span>
                          ) : isAvailable ? (
                            <span className="text-[10px] text-green-600 flex items-center gap-1">
                              <CheckCircle size={10} /> ✅ Available for booking
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-500 flex items-center gap-1">
                              <Clock size={10} /> ⏳ Status: {vehicle.status || 'Unknown'}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                        {isRented && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-medium">
                            ❌ Unavailable
                          </span>
                        )}
                        {isAvailable && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                            ✅ Available
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {vehicles.length > 4 && (
                  <button 
                    onClick={() => setActiveTab('my-vehicles')}
                    className="text-xs text-blue-600 hover:text-blue-800 text-center py-2 border border-dashed border-gray-300 rounded-lg hover:border-blue-300 transition-colors"
                  >
                    + {vehicles.length - 4} more vehicles
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Car size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No vehicles registered yet</p>
                <button
                  onClick={() => setActiveTab('my-vehicles')}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800"
                >
                  Add your first vehicle →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ========== RECENT BOOKINGS CARD ========== */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Recent Bookings</h2>
            <button 
              onClick={() => setActiveTab('vehicle-bookings')}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
            ) : recentBookings.length > 0 ? (
              <div className="space-y-3">
                {recentBookings.map((booking, index) => {
                  const statusBadge = getStatusBadge(booking.status);
                  const hasDebt = (booking.remainingBalance || 0) > 0;
                  const hasDiscount = booking.discountAmount > 0 || booking.discountType !== 'NONE';
                  const revenue = calculateBookingRevenue(booking);
                  const discount = calculateBookingDiscount(booking);
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {booking.customerName || 'Customer'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {booking.vehicleRegistration || booking.vehicle_make || 'Vehicle'} 
                          {booking.days && ` • ${booking.days} days`}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs font-medium text-green-600">
                            KSh {revenue.toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-[10px] text-red-500">
                              (-KSh {discount.toLocaleString()} discount)
                            </span>
                          )}
                          {hasDebt && (
                            <span className="text-[10px] text-red-600 flex items-center gap-1">
                              <AlertCircle size={10} /> Debt: KSh {booking.remainingBalance.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm">No bookings yet</p>
                <p className="text-xs text-gray-400">Bookings will appear here when customers rent your vehicles</p>
              </div>
            )}
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

export default CarOwnerDashboard;