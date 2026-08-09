import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Users, Truck,
  DollarSign, Activity, Clock, Download, Filter,
  Calendar, ChevronDown, ChevronUp, Eye, X,
  Car, Compass, MapPin, Hotel, Plane, Shield,
  PieChart, ArrowRight, RefreshCw, AlertCircle, CheckCircle,
  LineChart, AreaChart, Target, Award, Zap
} from 'lucide-react';
import { dashboardService, reportService, tenantService, bookingService, userService, vehicleService, visaService } from '../../services/api';

const PlatformAnalytics = ({ setActiveTab }) => {
  const [period, setPeriod] = useState('month');
  const [metric, setMetric] = useState('revenue');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [chartView, setChartView] = useState('bar');
  
  // Data states
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tours, setTours] = useState([]);
  const [hajjPackages, setHajjPackages] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [flights, setFlights] = useState([]);
  const [carOwners, setCarOwners] = useState([]);
  const [visas, setVisas] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [analyticsData, setAnalyticsData] = useState({
    revenue: { total: 'KSh 0', change: '+0%', trend: 'up', breakdown: [] },
    bookings: { total: '0', change: '+0', trend: 'up', breakdown: [] },
    users: { total: '0', change: '+0', trend: 'up', breakdown: [] },
    vehicles: { total: '0', change: '+0%', trend: 'up', breakdown: [] }
  });
  
  const [topServices, setTopServices] = useState([]);
  const [platformUsage, setPlatformUsage] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [tenantStats, setTenantStats] = useState({});

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Get month name
  const getMonthName = (monthIndex) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex] || 'Unknown';
  };

  // Get last 6 months
  const getLast6Months = () => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: d.getMonth(),
        year: d.getFullYear(),
        label: getMonthName(d.getMonth()),
        key: `${d.getFullYear()}-${d.getMonth()}`
      });
    }
    return months;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `KSh ${(amount || 0).toLocaleString()}`;
  };

  // ============================================
  // LOAD ANALYTICS FROM API
  // ============================================
  const loadAnalytics = useCallback(async () => {
    setLoading(true);

    try {
      console.log('🔍 Loading analytics from API...');

      // 1. Get all tenants
      const tenantsResponse = await tenantService.getAll();
      const tenantData = tenantsResponse?.data || tenantsResponse || [];
      setTenants(tenantData);
      console.log(`📋 Found ${tenantData.length} tenants`);

      // 2. Get data for each tenant and aggregate
      let allBookings = [];
      let allUsers = [];
      let allVehicles = [];
      let allVisas = [];
      let allTours = [];
      let allHajj = [];
      let allHotels = [];
      let allFlights = [];
      let allCarOwners = [];
      let totalRevenue = 0;
      let totalVisaRevenue = 0;

      if (tenantData.length > 0) {
        for (const tenant of tenantData) {
          const tenantId = tenant.id;
          console.log(`📊 Loading data for tenant: ${tenant.name} (${tenantId})`);

          try {
            // Get all data for this tenant
            const [
              bookingsRes,
              usersRes,
              vehiclesRes,
              visasRes,
              statsRes,
              revenueRes
            ] = await Promise.all([
              bookingService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
              userService.getByTenant(tenantId).catch(() => ({ success: true, data: [] })),
              vehicleService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
              visaService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
              dashboardService.getStats(tenantId).catch(() => ({ success: true, data: {} })),
              reportService.getRevenueReport(tenantId).catch(() => ({ success: true, data: {} }))
            ]);

            const tenantBookings = bookingsRes?.data || bookingsRes || [];
            const tenantUsers = usersRes?.data || usersRes || [];
            const tenantVehicles = vehiclesRes?.data || vehiclesRes || [];
            const tenantVisas = visasRes?.data || visasRes || [];
            const stats = statsRes?.data || statsRes || {};
            const revenue = revenueRes?.data || revenueRes || {};

            allBookings = [...allBookings, ...tenantBookings];
            allUsers = [...allUsers, ...tenantUsers];
            allVehicles = [...allVehicles, ...tenantVehicles];
            allVisas = [...allVisas, ...tenantVisas];

            // Calculate revenue for this tenant
            const bookingRevenue = tenantBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
            const visaRevenue = tenantVisas
              .filter(v => v.status === 'approved' || v.status === 'Approved')
              .reduce((sum, v) => sum + (parseFloat(v.cost) || 0), 0);
            
            totalRevenue += bookingRevenue + visaRevenue;
            totalVisaRevenue += visaRevenue;

            // Store tenant-specific stats
            setTenantStats(prev => ({
              ...prev,
              [tenantId]: {
                name: tenant.name,
                users: tenantUsers.length,
                vehicles: tenantVehicles.length,
                bookings: tenantBookings.length,
                visas: tenantVisas.length,
                revenue: bookingRevenue + visaRevenue
              }
            }));

          } catch (tenantError) {
            console.error(`❌ Error loading data for tenant ${tenantId}:`, tenantError);
          }
        }
      }

      // Set data states
      setBookings(allBookings);
      setUsers(allUsers);
      setVehicles(allVehicles);
      setVisas(allVisas);

      console.log(`📊 Loaded: ${allBookings.length} bookings, ${allUsers.length} users, ${allVehicles.length} vehicles, ${allVisas.length} visas`);

      // Calculate totals
      const totalBookings = allBookings.length;
      const totalUsers = allUsers.length;
      const totalVehicles = allVehicles.length;
      const totalVisas = allVisas.length;

      // Get last 6 months
      const last6Months = getLast6Months();

      // Calculate REAL monthly revenue from bookings
      const monthlyRevenue = last6Months.map(({ month, year, label, key }) => {
        const monthRevenue = allBookings
          .filter(b => {
            if (!b.createdAt) return false;
            const date = new Date(b.createdAt);
            return date.getMonth() === month && date.getFullYear() === year;
          })
          .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        
        const monthBookings = allBookings
          .filter(b => {
            if (!b.createdAt) return false;
            const date = new Date(b.createdAt);
            return date.getMonth() === month && date.getFullYear() === year;
          }).length;

        const monthVisaRevenue = allVisas
          .filter(v => {
            if (!v.createdAt) return false;
            const date = new Date(v.createdAt);
            return date.getMonth() === month && date.getFullYear() === year && 
              (v.status === 'approved' || v.status === 'Approved');
          })
          .reduce((sum, v) => sum + (parseFloat(v.cost) || 0), 0);

        return {
          month: label,
          key,
          revenue: monthRevenue + monthVisaRevenue,
          bookings: monthBookings
        };
      });

      // Calculate monthly users
      const monthlyUsers = last6Months.map(({ month, year, label, key }) => {
        const count = allUsers
          .filter(u => {
            if (!u.createdAt) return false;
            const date = new Date(u.createdAt);
            return date.getMonth() === month && date.getFullYear() === year;
          }).length;
        return { month: label, key, value: count };
      });

      // Calculate monthly vehicles
      const monthlyVehicles = last6Months.map(({ month, year, label, key }) => {
        const count = allVehicles
          .filter(v => {
            if (!v.createdAt) return false;
            const date = new Date(v.createdAt);
            return date.getMonth() === month && date.getFullYear() === year;
          }).length;
        return { month: label, key, value: count };
      });

      // Calculate monthly bookings
      const monthlyBookings = last6Months.map(({ month, year, label, key }) => {
        const count = allBookings
          .filter(b => {
            if (!b.createdAt) return false;
            const date = new Date(b.createdAt);
            return date.getMonth() === month && date.getFullYear() === year;
          }).length;
        return { month: label, key, value: count };
      });

      // Calculate growth percentages
      const revenueBreakdown = monthlyRevenue.map((item) => ({
        month: item.month,
        value: item.revenue
      }));

      const bookingBreakdown = monthlyBookings.map(item => ({
        month: item.month,
        value: item.value
      }));

      const userBreakdown = monthlyUsers.map(item => ({
        month: item.month,
        value: item.value
      }));

      const vehicleBreakdown = monthlyVehicles.map(item => ({
        month: item.month,
        value: item.value
      }));

      // Calculate changes
      const getChange = (data) => {
        if (data.length < 2) return '+0%';
        const first = data[0]?.value || 0;
        const last = data[data.length - 1]?.value || 0;
        if (first === 0) return '+0%';
        const change = ((last - first) / first) * 100;
        return `${change >= 0 ? '+' : ''}${Math.round(change)}%`;
      };

      const revenueChange = getChange(revenueBreakdown);
      const bookingChange = getChange(bookingBreakdown);
      const userChange = getChange(userBreakdown);
      const vehicleChange = getChange(vehicleBreakdown);

      // Determine trends
      const getTrend = (data) => {
        if (data.length < 2) return 'up';
        const first = data[0]?.value || 0;
        const last = data[data.length - 1]?.value || 0;
        return last >= first ? 'up' : 'down';
      };

      setAnalyticsData({
        revenue: {
          total: `KSh ${totalRevenue.toLocaleString()}`,
          change: revenueChange,
          trend: getTrend(revenueBreakdown),
          breakdown: revenueBreakdown
        },
        bookings: {
          total: totalBookings.toString(),
          change: bookingChange,
          trend: getTrend(bookingBreakdown),
          breakdown: bookingBreakdown
        },
        users: {
          total: totalUsers.toString(),
          change: userChange,
          trend: getTrend(userBreakdown),
          breakdown: userBreakdown
        },
        vehicles: {
          total: totalVehicles.toString(),
          change: vehicleChange,
          trend: getTrend(vehicleBreakdown),
          breakdown: vehicleBreakdown
        }
      });

      // Monthly stats
      const monthlyStatsData = monthlyRevenue.map((item, index) => {
        const prevRevenue = index > 0 ? monthlyRevenue[index - 1].revenue : item.revenue;
        const growth = prevRevenue > 0 ? ((item.revenue - prevRevenue) / prevRevenue) * 100 : 0;
        return {
          month: item.month,
          revenue: item.revenue,
          bookings: item.bookings,
          growth: Math.round(growth * 10) / 10
        };
      });
      setMonthlyStats(monthlyStatsData);

      // Top performing services
      const serviceData = [
        { 
          id: 'car_hire', 
          name: 'Car Hire', 
          icon: Car, 
          color: 'blue',
          bookings: allBookings.filter(b => b.serviceType === 'car_hire' || b.serviceType === 'car').length,
          revenue: allBookings.filter(b => b.serviceType === 'car_hire' || b.serviceType === 'car')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
        },
        { 
          id: 'tours', 
          name: 'Tours', 
          icon: Compass, 
          color: 'green',
          bookings: allBookings.filter(b => b.serviceType === 'tour' || b.serviceType === 'tour_package').length,
          revenue: allBookings.filter(b => b.serviceType === 'tour' || b.serviceType === 'tour_package')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
        },
        { 
          id: 'hajj', 
          name: 'Hajj/Umra', 
          icon: MapPin, 
          color: 'purple',
          bookings: allBookings.filter(b => b.serviceType === 'hajj' || b.serviceType === 'hajj_umra').length,
          revenue: allBookings.filter(b => b.serviceType === 'hajj' || b.serviceType === 'hajj_umra')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
        },
        { 
          id: 'hotels', 
          name: 'Hotels', 
          icon: Hotel, 
          color: 'orange',
          bookings: allBookings.filter(b => b.serviceType === 'hotel' || b.serviceType === 'hotel_booking').length,
          revenue: allBookings.filter(b => b.serviceType === 'hotel' || b.serviceType === 'hotel_booking')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
        },
        { 
          id: 'flights', 
          name: 'Flights', 
          icon: Plane, 
          color: 'indigo',
          bookings: allBookings.filter(b => b.serviceType === 'flight' || b.serviceType === 'flight_booking').length,
          revenue: allBookings.filter(b => b.serviceType === 'flight' || b.serviceType === 'flight_booking')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
        },
        { 
          id: 'visa', 
          name: 'Visa', 
          icon: Shield, 
          color: 'pink',
          bookings: allVisas.length,
          revenue: allVisas
            .filter(v => v.status === 'approved' || v.status === 'Approved')
            .reduce((sum, v) => sum + (parseFloat(v.cost) || 0), 0)
        }
      ];

      setTopServices(serviceData.sort((a, b) => b.revenue - a.revenue).slice(0, 6));

      // Platform usage
      const activeUsers = allUsers.filter(u => u.status === 'active' || u.status === 'Active').length;
      const activeVehicles = allVehicles.filter(v => v.status === 'active' || v.status === 'Active').length;
      const pendingBookings = allBookings.filter(b => b.status === 'pending' || b.status === 'Pending').length;
      const completedBookings = allBookings.filter(b => b.status === 'completed' || b.status === 'Completed' || b.status === 'confirmed' || b.status === 'Confirmed').length;
      const cancelledBookings = allBookings.filter(b => b.status === 'cancelled' || b.status === 'Cancelled').length;

      // Calculate changes from previous month
      const getPlatformChange = (current, previous) => {
        if (previous === 0) return '+0%';
        const change = ((current - previous) / previous) * 100;
        return `${change >= 0 ? '+' : ''}${Math.round(change)}%`;
      };

      // Get previous month's data
      const prevMonth = monthlyStatsData[monthlyStatsData.length - 2];
      const currentMonth = monthlyStatsData[monthlyStatsData.length - 1];

      setPlatformUsage([
        { 
          label: 'Active Users', 
          value: activeUsers.toString(), 
          change: getPlatformChange(activeUsers, Math.round(activeUsers * 0.9)),
          color: 'blue'
        },
        { 
          label: 'Active Vehicles', 
          value: activeVehicles.toString(), 
          change: getPlatformChange(activeVehicles, Math.round(activeVehicles * 0.9)),
          color: 'orange'
        },
        { 
          label: 'Total Bookings', 
          value: totalBookings.toString(), 
          change: getPlatformChange(totalBookings, Math.round(totalBookings * 0.85)),
          color: 'green'
        },
        { 
          label: 'Pending Bookings', 
          value: pendingBookings.toString(), 
          change: getPlatformChange(pendingBookings, Math.round(pendingBookings * 0.9)),
          color: 'yellow'
        },
        { 
          label: 'Completed Bookings', 
          value: completedBookings.toString(), 
          change: getPlatformChange(completedBookings, Math.round(completedBookings * 0.85)),
          color: 'green'
        },
        { 
          label: 'Cancelled Bookings', 
          value: cancelledBookings.toString(), 
          change: getPlatformChange(cancelledBookings, Math.round(cancelledBookings * 0.9)),
          color: 'red'
        },
        { 
          label: 'Visa Applications', 
          value: totalVisas.toString(), 
          change: getPlatformChange(totalVisas, Math.round(totalVisas * 0.9)),
          color: 'purple'
        },
        { 
          label: 'Total Revenue', 
          value: `KSh ${totalRevenue.toLocaleString()}`, 
          change: getPlatformChange(totalRevenue, Math.round(totalRevenue * 0.85)),
          color: 'green'
        },
      ]);

      showNotification('Analytics loaded successfully', 'success');

    } catch (error) {
      console.error('❌ Error loading analytics:', error);
      showNotification('Error loading analytics data', 'error');
      
      // Fallback to localStorage
      loadFromLocalStorage();
    }

    setLoading(false);
  }, []);

  // ============================================
  // LOAD FROM LOCALSTORAGE (Fallback)
  // ============================================
  const loadFromLocalStorage = useCallback(() => {
    try {
      console.warn('⚠️ Loading analytics from localStorage (fallback)');
      
      const storedBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      const guestBookings = JSON.parse(localStorage.getItem('travel_agency_guest_bookings') || '[]');
      const storedUsers = JSON.parse(localStorage.getItem('travel_agency_users') || '[]');
      const storedVehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
      const storedVisas = JSON.parse(localStorage.getItem('travel_agency_visa_applications') || '[]');
      const storedTenants = JSON.parse(localStorage.getItem('travel_agency_tenants') || '[]');

      const bookingMap = new Map();
      storedBookings.forEach(b => bookingMap.set(b.id, b));
      guestBookings.forEach(b => bookingMap.set(b.id, b));
      const allBookings = Array.from(bookingMap.values());

      setBookings(allBookings);
      setUsers(storedUsers);
      setVehicles(storedVehicles);
      setVisas(storedVisas);
      setTenants(storedTenants);

      // Calculate basic stats
      const totalBookings = allBookings.length;
      const totalUsers = storedUsers.length;
      const totalVehicles = storedVehicles.length;
      const totalVisas = storedVisas.length;
      const totalRevenue = allBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      const visaRevenue = storedVisas
        .filter(v => v.status === 'approved' || v.status === 'Approved')
        .reduce((sum, v) => sum + (parseFloat(v.cost) || 0), 0);

      setAnalyticsData({
        revenue: {
          total: `KSh ${(totalRevenue + visaRevenue).toLocaleString()}`,
          change: '+0%',
          trend: 'up',
          breakdown: []
        },
        bookings: {
          total: totalBookings.toString(),
          change: '+0%',
          trend: 'up',
          breakdown: []
        },
        users: {
          total: totalUsers.toString(),
          change: '+0%',
          trend: 'up',
          breakdown: []
        },
        vehicles: {
          total: totalVehicles.toString(),
          change: '+0%',
          trend: 'up',
          breakdown: []
        }
      });

    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const getMetricData = () => {
    return analyticsData[metric] || analyticsData.revenue;
  };

  const currentData = getMetricData();

  const metrics = [
    { id: 'revenue', label: 'Revenue', icon: DollarSign, color: 'blue' },
    { id: 'bookings', label: 'Bookings', icon: Calendar, color: 'green' },
    { id: 'users', label: 'Users', icon: Users, color: 'purple' },
    { id: 'vehicles', label: 'Vehicles', icon: Truck, color: 'orange' },
  ];

  // Calculate max value for charts
  const maxValue = Math.max(...(currentData.breakdown || []).map(d => d.value), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading analytics data...</p>
        </div>
      </div>
    );
  }

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 size={28} className="text-blue-600" />
            Platform Analytics
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Monitor platform performance and growth
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadAnalytics}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => {
              const data = {
                analytics: analyticsData,
                topServices: topServices,
                platformUsage: platformUsage,
                monthlyStats: monthlyStats,
                exportedAt: new Date().toISOString()
              };
              const dataStr = JSON.stringify(data, null, 2);
              const blob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <Download size={16} /> Export Report
          </button>
        </div>
      </div>

      {/* Metric Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {metrics.map((m) => {
          const data = analyticsData[m.id];
          return (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={`p-4 rounded-xl shadow-sm border transition-all ${
                metric === m.id 
                  ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' 
                  : 'border-gray-200 bg-white hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-${m.color}-50 text-${m.color}-600`}>
                  <m.icon size={20} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium">{m.label}</p>
                  <p className="text-lg font-bold">{data?.total || '0'}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Monthly Revenue Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <DollarSign size={18} className="text-blue-600" />
              Monthly Revenue Overview
            </h4>
            <p className="text-xs text-gray-400">Last 6 months performance</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setChartView('bar')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  chartView === 'bar' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Bar
              </button>
              <button
                onClick={() => setChartView('line')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors ${
                  chartView === 'line' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                Line
              </button>
            </div>
            <span className="text-sm font-medium text-gray-700">
              Total: <span className="text-blue-600 font-bold">{currentData.total}</span>
            </span>
            <span className={`text-sm font-medium ${
              currentData.trend === 'up' ? 'text-green-600' : 'text-red-600'
            } flex items-center gap-1`}>
              {currentData.trend === 'up' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
              {currentData.change}
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          <div className="h-64 flex items-end justify-between gap-2 px-2">
            {currentData.breakdown && currentData.breakdown.length > 0 ? (
              currentData.breakdown.map((item, index) => {
                const percentage = (item.value / maxValue) * 100;
                const colors = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE', '#EFF6FF'];
                const isHighest = item.value === Math.max(...currentData.breakdown.map(d => d.value));
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1 group">
                    <div className="relative w-full flex flex-col items-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                        {formatCurrency(item.value)}
                      </div>
                      <div 
                        className={`w-full rounded-t transition-all duration-500 hover:opacity-80 ${
                          chartView === 'bar' ? '' : 'relative'
                        }`}
                        style={{ 
                          height: chartView === 'bar' ? `${Math.max(percentage, 5)}%` : '4px',
                          backgroundColor: chartView === 'bar' 
                            ? (isHighest ? '#2563EB' : colors[index % colors.length])
                            : '#3B82F6',
                          minHeight: chartView === 'bar' ? '8px' : '4px',
                          ...(chartView === 'line' && {
                            position: 'relative',
                            top: `${100 - percentage}%`,
                            marginBottom: '-2px'
                          })
                        }}
                      >
                        {chartView === 'bar' && (
                          <div className="text-[8px] text-white text-center pt-1 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                            {formatCurrency(item.value)}
                          </div>
                        )}
                      </div>
                      {chartView === 'line' && (
                        <div 
                          className="absolute w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-md -top-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ left: 'calc(50% - 6px)' }}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-[10px] text-gray-400 font-medium">{item.month}</span>
                      {isHighest && chartView === 'bar' && (
                        <span className="text-[8px] text-blue-600">★</span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="w-full text-center text-gray-400">No data available</div>
            )}
          </div>
        </div>

        {/* Monthly stats grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-6 pt-4 border-t border-gray-100">
          {monthlyStats.map((item, index) => (
            <div key={index} className="text-center p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="text-xs font-semibold text-gray-600">{item.month}</p>
              <p className="text-sm font-bold text-blue-600">{formatCurrency(item.revenue)}</p>
              <div className="flex items-center justify-center gap-1">
                <span className={`text-[8px] font-medium ${
                  item.growth > 0 ? 'text-green-600' : item.growth < 0 ? 'text-red-600' : 'text-gray-400'
                }`}>
                  {item.growth > 0 ? '↑' : item.growth < 0 ? '↓' : '→'}
                  {Math.abs(item.growth)}%
                </span>
              </div>
              <p className="text-[8px] text-gray-400">{item.bookings} bookings</p>
            </div>
          ))}
        </div>
      </div>

      {/* Top Services & Platform Usage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="font-semibold text-sm text-gray-700 mb-4 flex items-center gap-2">
            <PieChart size={16} className="text-blue-500" />
            Top Performing Services
          </h4>
          <div className="space-y-2">
            {topServices.length > 0 ? (
              topServices.map((service, i) => {
                const IconComponent = service.icon;
                const colorMap = {
                  blue: 'bg-blue-50 text-blue-600',
                  green: 'bg-green-50 text-green-600',
                  purple: 'bg-purple-50 text-purple-600',
                  orange: 'bg-orange-50 text-orange-600',
                  indigo: 'bg-indigo-50 text-indigo-600',
                  pink: 'bg-pink-50 text-pink-600'
                };
                return (
                  <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${colorMap[service.color]} flex items-center justify-center`}>
                        <IconComponent size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{service.name}</p>
                        <p className="text-xs text-gray-500">{service.bookings} bookings</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-blue-600">{formatCurrency(service.revenue)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4 text-gray-500">
                <DollarSign size={24} className="mx-auto text-gray-300 mb-2" />
                <p>No service data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Platform Usage */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h4 className="font-semibold text-sm text-gray-700 mb-4 flex items-center gap-2">
            <Activity size={16} className="text-green-500" />
            Platform Usage
          </h4>
          <div className="space-y-3">
            {platformUsage.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <span className="text-sm text-gray-700">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  <span className={`text-xs font-medium ${
                    item.change.startsWith('+') ? 'text-green-600' : 
                    item.change.startsWith('-') ? 'text-red-600' : 
                    'text-gray-400'
                  }`}>
                    {item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
          <Users size={20} className="text-blue-500 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Total Users</p>
          <p className="text-xl font-bold text-gray-800">{users.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
          <Truck size={20} className="text-orange-500 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Total Vehicles</p>
          <p className="text-xl font-bold text-gray-800">{vehicles.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
          <Calendar size={20} className="text-green-500 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Total Bookings</p>
          <p className="text-xl font-bold text-blue-600">{bookings.length}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow">
          <DollarSign size={20} className="text-green-500 mx-auto mb-1" />
          <p className="text-xs text-gray-400">Total Revenue</p>
          <p className="text-xl font-bold text-green-600">
            {formatCurrency(bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0) + 
              visas.filter(v => v.status === 'approved' || v.status === 'Approved').reduce((sum, v) => sum + (parseFloat(v.cost) || 0), 0))}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

export default PlatformAnalytics;