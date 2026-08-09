// FleetManagerDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Car, Users, Calendar, DollarSign, 
  TrendingUp, TrendingDown, Package, 
  MapPin, Plane, Hotel, Compass,
  ArrowRight, Bell, Clock, CheckCircle,
  AlertCircle, Star, Phone, Mail,
  BarChart3, PieChart, UserPlus, 
  X, Check, User, Building, RefreshCw,
  Shield, Award, CreditCard, Wallet,
  TrendingUp as TrendingUpIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  dashboardService, 
  reportService, 
  bookingService, 
  carOwnerService,
  vehicleService,
  userService,
  tourPackageService,
  hajjPackageService,
  hotelService,
  flightService,
  visaService,
  expenseService
} from '../../services/api';

const FleetManagerDashboard = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  
  const [stats, setStats] = useState({
    totalVehicles: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalCommission: 0,
    activeTours: 0,
    hajjPackages: 0,
    hotels: 0,
    flights: 0,
    pendingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    pendingApprovals: 0,
    totalDebt: 0,
    debtCount: 0,
    carOwners: 0,
    clients: 0,
    visaRevenue: 0,
    visaApplications: 0,
    approvedVisas: 0,
    totalExpenses: 0,
    netProfit: 0,
    revenueBreakdown: {
      carHire: 0,
      tours: 0,
      hajj: 0,
      hotels: 0,
      flights: 0,
      visa: 0
    },
    bookingCounts: {
      carHire: 0,
      tours: 0,
      hajj: 0,
      hotels: 0,
      flights: 0,
      visa: 0
    },
    monthlyRevenue: [],
    recentActivities: []
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [pendingOwners, setPendingOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [tenantId, setTenantId] = useState(null);

  // Get tenant ID from auth
  useEffect(() => {
    const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
    const tid = userData?.tenantId || null;
    console.log('🔍 Tenant ID from user:', tid);
    setTenantId(tid);
    
    if (tid) {
      loadDashboardData(tid);
    } else {
      console.warn('⚠️ No tenantId found, loading from localStorage fallback');
      loadFromLocalStorage();
      setLoading(false);
    }
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================
  // MAIN DATA LOADER - FETCHES FROM BACKEND
  // ============================================
  const loadDashboardData = useCallback(async (tid) => {
    const tenantToUse = tid || tenantId;
    
    if (!tenantToUse) {
      console.warn('⚠️ No tenantId available');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Loading dashboard data for tenant:', tenantToUse);

      // ✅ 1. Fetch ALL data in parallel for performance
      const [
        vehiclesRes,
        bookingsRes,
        carOwnersRes,
        usersRes,
        toursRes,
        hajjRes,
        hotelsRes,
        flightsRes,
        visaRes,
        expensesRes
      ] = await Promise.all([
        vehicleService.getAll(tenantToUse).catch(() => ({ data: [] })),
        bookingService.getAll(tenantToUse).catch(() => ({ data: [] })),
        carOwnerService.getAll(tenantToUse).catch(() => ({ data: [] })),
        userService.getAll().catch(() => ({ data: [] })),
        tourPackageService.getAll(tenantToUse).catch(() => ({ data: [] })),
        hajjPackageService.getAll(tenantToUse).catch(() => ({ data: [] })),
        hotelService.getAll(tenantToUse).catch(() => ({ data: [] })),
        flightService.getAll(tenantToUse).catch(() => ({ data: [] })),
        visaService.getAll(tenantToUse).catch(() => ({ data: [] })),
        expenseService.getAll(tenantToUse).catch(() => ({ data: [] }))
      ]);

      // ✅ 2. Extract data arrays
      const vehicles = vehiclesRes?.data || vehiclesRes || [];
      const bookings = bookingsRes?.data || bookingsRes || [];
      const owners = carOwnersRes?.data || carOwnersRes || [];
      const users = usersRes?.data || usersRes || [];
      const tours = toursRes?.data || toursRes || [];
      const hajjPackages = hajjRes?.data || hajjRes || [];
      const hotels = hotelsRes?.data || hotelsRes || [];
      const flights = flightsRes?.data || flightsRes || [];
      const visas = visaRes?.data || visaRes || [];
      const expenses = expensesRes?.data || expensesRes || [];

      console.log(`📊 Loaded: ${vehicles.length} vehicles, ${bookings.length} bookings, ${owners.length} owners`);

      // ✅ 3. Calculate stats
      const totalVehicles = vehicles.length;
      const totalBookings = bookings.length;
      const pendingBookings = bookings.filter(b => b.status === 'pending').length;
      const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'confirmed').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

      // ✅ 4. Calculate revenue breakdown
      let revenueBreakdown = { carHire: 0, tours: 0, hajj: 0, hotels: 0, flights: 0, visa: 0 };
      let bookingCounts = { carHire: 0, tours: 0, hajj: 0, hotels: 0, flights: 0, visa: 0 };
      let totalRevenue = 0;
      let totalCommission = 0;
      let totalDebt = 0;
      let debtCount = 0;

      bookings.forEach(b => {
        const serviceType = b.serviceType || b.service_type || 'car_hire';
        const amount = b.totalPrice || b.total_price || 0;
        const commission = b.commission || 0;
        const remainingBalance = b.remainingBalance || 0;

        totalRevenue += amount;
        totalCommission += commission;
        totalDebt += remainingBalance;
        if (remainingBalance > 0) debtCount++;

        if (serviceType === 'car_hire' || serviceType === 'car') {
          revenueBreakdown.carHire += amount;
          bookingCounts.carHire++;
        } else if (serviceType === 'tour' || serviceType === 'tours') {
          revenueBreakdown.tours += amount;
          bookingCounts.tours++;
        } else if (serviceType === 'hajj' || serviceType === 'hajj_umra') {
          revenueBreakdown.hajj += amount;
          bookingCounts.hajj++;
        } else if (serviceType === 'hotel' || serviceType === 'hotels') {
          revenueBreakdown.hotels += amount;
          bookingCounts.hotels++;
        } else if (serviceType === 'flight' || serviceType === 'flights') {
          revenueBreakdown.flights += amount;
          bookingCounts.flights++;
        }
      });

      // ✅ 5. Visa stats
      const visaRevenue = visas
        .filter(v => v.status === 'approved')
        .reduce((sum, v) => sum + (parseFloat(v.cost) || parseFloat(v.price) || 0), 0);
      const approvedVisas = visas.filter(v => v.status === 'approved').length;
      const visaApplications = visas.length;

      // Add visa to revenue breakdown
      revenueBreakdown.visa = visaRevenue;
      bookingCounts.visa = visaApplications;
      totalRevenue += visaRevenue;

      // ✅ 6. Expense stats
      const totalExpenses = expenses.reduce((sum, e) => sum + (e.cost || e.amount || 0), 0);
      const netProfit = totalRevenue - totalExpenses;

      // ✅ 7. Pending approvals
      const pendingOwnersList = owners.filter(o => 
        o.status === 'pending_approval' || o.status === 'pending'
      );

      // ✅ 8. Recent bookings (last 5)
      const sortedBookings = [...bookings].sort((a, b) => 
        new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
      );
      const recentBookingsList = sortedBookings.slice(0, 5);

      // ✅ 9. Monthly revenue (last 6 months)
      const monthlyRevenue = calculateMonthlyRevenue(bookings);

      // ✅ 10. Set state
      setStats({
        totalVehicles,
        totalBookings,
        totalRevenue,
        totalCommission,
        activeTours: tours.filter(t => t.status === 'active' || t.status === 'published').length,
        hajjPackages: hajjPackages.length,
        hotels: hotels.length,
        flights: flights.length,
        pendingBookings,
        completedBookings,
        cancelledBookings,
        pendingApprovals: pendingOwnersList.length,
        totalDebt,
        debtCount,
        carOwners: owners.filter(o => o.status === 'active').length,
        clients: users.filter(u => u.role === 'client').length,
        visaRevenue,
        visaApplications,
        approvedVisas,
        totalExpenses,
        netProfit,
        revenueBreakdown,
        bookingCounts,
        monthlyRevenue
      });

      setRecentBookings(recentBookingsList);
      setPendingOwners(pendingOwnersList);

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      showNotification('Failed to load dashboard data. Using local data.', 'error');
      loadFromLocalStorage();
    }

    setLoading(false);
  }, [tenantId]);

  // ============================================
  // CALCULATE MONTHLY REVENUE
  // ============================================
  const calculateMonthlyRevenue = (bookings) => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      let revenue = 0;
      bookings.forEach(b => {
        const createdAt = new Date(b.createdAt || b.created_at || 0);
        if (createdAt >= monthStart && createdAt <= monthEnd) {
          revenue += (b.totalPrice || b.total_price || 0);
        }
      });
      
      months.push({ month: monthLabel, revenue });
    }
    
    return months;
  };

  // ============================================
  // LOCAL STORAGE FALLBACK
  // ============================================
  const loadFromLocalStorage = () => {
    console.warn('📦 Loading dashboard data from localStorage fallback');
    
    try {
      const vehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
      const bookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      const tours = JSON.parse(localStorage.getItem('travel_agency_tour_packages') || '[]');
      const hajjPackages = JSON.parse(localStorage.getItem('travel_agency_hajj_packages') || '[]');
      const hotels = JSON.parse(localStorage.getItem('travel_agency_hotels') || '[]');
      const flights = JSON.parse(localStorage.getItem('travel_agency_flights') || '[]');
      const owners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
      const users = JSON.parse(localStorage.getItem('travel_agency_users') || '[]');
      const visas = JSON.parse(localStorage.getItem('travel_agency_visa_applications') || '[]');
      const expenses = JSON.parse(localStorage.getItem('travel_agency_expenses') || '[]');

      const totalVehicles = vehicles.length;
      const totalBookings = bookings.length;
      const pendingBookings = bookings.filter(b => b.status === 'pending').length;
      const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'confirmed').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
      
      const totalVisas = visas.length;
      const approvedVisas = visas.filter(v => v.status === 'approved').length;
      const visaRevenue = visas
        .filter(v => v.status === 'approved')
        .reduce((sum, v) => sum + (parseFloat(v.cost) || 0), 0);

      let revenueBreakdown = { carHire: 0, tours: 0, hajj: 0, hotels: 0, flights: 0, visa: 0 };
      let bookingCounts = { carHire: 0, tours: 0, hajj: 0, hotels: 0, flights: 0, visa: 0 };
      let totalRevenue = 0;
      let totalCommission = 0;
      let totalDebt = 0;
      let debtCount = 0;

      bookings.forEach(b => {
        const serviceType = b.serviceType || b.service_type || 'car_hire';
        const amount = b.totalPrice || b.total_price || 0;
        const commission = b.commission || 0;
        const remainingBalance = b.remainingBalance || 0;

        totalRevenue += amount;
        totalCommission += commission;
        totalDebt += remainingBalance;
        if (remainingBalance > 0) debtCount++;

        if (serviceType === 'car_hire' || serviceType === 'car') {
          revenueBreakdown.carHire += amount;
          bookingCounts.carHire++;
        } else if (serviceType === 'tour' || serviceType === 'tours') {
          revenueBreakdown.tours += amount;
          bookingCounts.tours++;
        } else if (serviceType === 'hajj' || serviceType === 'hajj_umra') {
          revenueBreakdown.hajj += amount;
          bookingCounts.hajj++;
        } else if (serviceType === 'hotel' || serviceType === 'hotels') {
          revenueBreakdown.hotels += amount;
          bookingCounts.hotels++;
        } else if (serviceType === 'flight' || serviceType === 'flights') {
          revenueBreakdown.flights += amount;
          bookingCounts.flights++;
        }
      });

      revenueBreakdown.visa = visaRevenue;
      bookingCounts.visa = totalVisas;
      totalRevenue += visaRevenue;

      const totalExpenses = expenses.reduce((sum, e) => sum + (e.cost || e.amount || 0), 0);
      const netProfit = totalRevenue - totalExpenses;
      const pendingOwnersList = owners.filter(o => o.status === 'pending_approval' || o.status === 'pending');
      const clients = users.filter(u => u.role === 'client').length;

      // Monthly revenue from localStorage
      const monthlyRevenue = calculateMonthlyRevenue(bookings);

      setStats({
        totalVehicles,
        totalBookings,
        totalRevenue,
        totalCommission,
        activeTours: tours.filter(t => t.status === 'active' || t.status === 'published').length,
        hajjPackages: hajjPackages.length,
        hotels: hotels.length,
        flights: flights.length,
        pendingBookings,
        completedBookings,
        cancelledBookings,
        pendingApprovals: pendingOwnersList.length,
        totalDebt,
        debtCount,
        carOwners: owners.filter(o => o.status === 'active').length,
        clients,
        visaRevenue,
        visaApplications: totalVisas,
        approvedVisas,
        totalExpenses,
        netProfit,
        revenueBreakdown,
        bookingCounts,
        monthlyRevenue
      });

      setRecentBookings(bookings.slice(0, 5));
      setPendingOwners(pendingOwnersList);

    } catch (e) {
      console.error('❌ Error loading from localStorage:', e);
    }
  };

  // ============================================
  // APPROVAL HANDLERS
  // ============================================
  const handleApprove = async (ownerId) => {
    setApprovalLoading(true);
    
    try {
      const response = await carOwnerService.approve(ownerId);
      if (response?.success) {
        showNotification('✅ Car owner approved successfully!');
        await loadDashboardData(tenantId);
      } else {
        showNotification('Failed to approve: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('❌ Approval error:', error);
      showNotification('Failed to approve. Please try again.', 'error');
    }
    
    setApprovalLoading(false);
  };

  const handleDecline = async (ownerId) => {
    if (!window.confirm('Are you sure you want to decline this car owner?')) return;
    
    setApprovalLoading(true);
    
    try {
      const response = await carOwnerService.delete(ownerId);
      if (response?.success) {
        showNotification('❌ Car owner declined.', 'error');
        await loadDashboardData(tenantId);
      } else {
        showNotification('Failed to decline: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('❌ Decline error:', error);
      showNotification('Failed to decline. Please try again.', 'error');
    }
    
    setApprovalLoading(false);
  };

  const handleApproveAll = async () => {
    if (!window.confirm(`Approve all ${pendingOwners.length} pending car owners?`)) return;
    
    setApprovalLoading(true);
    
    try {
      let successCount = 0;
      for (const owner of pendingOwners) {
        try {
          const response = await carOwnerService.approve(owner.id);
          if (response?.success) successCount++;
        } catch (e) {
          console.error(`Failed to approve ${owner.id}:`, e);
        }
      }
      
      if (successCount > 0) {
        showNotification(`✅ ${successCount} car owners approved successfully!`);
        await loadDashboardData(tenantId);
      } else {
        showNotification('Failed to approve car owners.', 'error');
      }
    } catch (error) {
      console.error('❌ Bulk approval error:', error);
      showNotification('Failed to approve car owners. Please try again.', 'error');
    }
    
    setApprovalLoading(false);
    setShowApprovalModal(false);
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return `KSh ${(amount || 0).toLocaleString()}`;
  };

  // ============================================
  // DATA FOR CARDS
  // ============================================
  const revenueCards = [
    {
      title: 'Car Hire',
      value: formatCurrency(stats.revenueBreakdown?.carHire || 0),
      icon: Car,
      color: 'blue',
      count: stats.bookingCounts?.carHire || 0,
      countLabel: 'bookings'
    },
    {
      title: 'Tours',
      value: formatCurrency(stats.revenueBreakdown?.tours || 0),
      icon: Compass,
      color: 'green',
      count: stats.bookingCounts?.tours || 0,
      countLabel: 'bookings'
    },
    {
      title: 'Hajj & Umra',
      value: formatCurrency(stats.revenueBreakdown?.hajj || 0),
      icon: MapPin,
      color: 'red',
      count: stats.bookingCounts?.hajj || 0,
      countLabel: 'bookings'
    },
    {
      title: 'Hotels',
      value: formatCurrency(stats.revenueBreakdown?.hotels || 0),
      icon: Hotel,
      color: 'orange',
      count: stats.bookingCounts?.hotels || 0,
      countLabel: 'bookings'
    },
    {
      title: 'Flights',
      value: formatCurrency(stats.revenueBreakdown?.flights || 0),
      icon: Plane,
      color: 'purple',
      count: stats.bookingCounts?.flights || 0,
      countLabel: 'bookings'
    },
    {
      title: 'Visa Processing',
      value: formatCurrency(stats.revenueBreakdown?.visa || 0),
      icon: Shield,
      color: 'pink',
      count: stats.bookingCounts?.visa || 0,
      countLabel: 'applications'
    }
  ];

  const statsCards = [
    { title: 'Total Vehicles', value: stats.totalVehicles || 0, icon: Car, subtitle: `${stats.totalVehicles || 0} registered` },
    { title: 'Total Bookings', value: stats.totalBookings || 0, icon: Calendar, subtitle: `${stats.pendingBookings || 0} pending` },
    { title: 'Total Revenue', value: formatCurrency(stats.totalRevenue || 0), icon: DollarSign, subtitle: 'All services combined' },
    { title: 'Total Commission', value: formatCurrency(stats.totalCommission || 0), icon: TrendingUpIcon, subtitle: 'Agency earnings' },
    { title: 'Total Debt', value: formatCurrency(stats.totalDebt || 0), icon: Wallet, subtitle: `${stats.debtCount || 0} bookings with debt` },
    { title: 'Net Profit', value: formatCurrency(stats.netProfit || 0), icon: TrendingUp, subtitle: `Revenue - Expenses` },
    { title: 'Active Tours', value: stats.activeTours || 0, icon: Compass, subtitle: 'Tour packages' },
    { title: 'Hajj Packages', value: stats.hajjPackages || 0, icon: MapPin, subtitle: 'Pilgrimage packages' },
    { title: 'Hotels', value: stats.hotels || 0, icon: Hotel, subtitle: 'Accommodations' },
    { title: 'Visa Apps', value: stats.visaApplications || 0, icon: Shield, subtitle: `${stats.approvedVisas || 0} approved` }
  ];

  const serviceLinks = [
    { label: 'Car Hire', icon: Car, tab: 'vehicles' },
    { label: 'Car Owners', icon: Users, tab: 'car-owners' },
    { label: 'Car Bookings', icon: Calendar, tab: 'car-bookings' },
    { label: 'Customer CRM', icon: Users, tab: 'car-crm' },
    { label: 'Tours', icon: Compass, tab: 'tour-packages' },
    { label: 'Hajj & Umra', icon: MapPin, tab: 'hajj-packages' },
    { label: 'Hotels', icon: Hotel, tab: 'fleet-hotels' },
    { label: 'Flights', icon: Plane, tab: 'fleet-flights' },
    { label: 'Visa Processing', icon: Shield, tab: 'visa-processing' }
  ];

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Notification */}
      
{notification && (
  <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 ${
    notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
  }`}>
    {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
    <span className="text-sm font-medium">{notification.message}</span>
    <button 
      onClick={() => setNotification(null)} 
      className="ml-2 hover:opacity-70 p-1 hover:bg-gray-200/50 rounded-full transition-colors"
    >
      <X size={16} />
    </button>
  </div>
)}

      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Welcome back, Fleet Manager!
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Here's what's happening with your travel services today.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => loadDashboardData(tenantId)}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Pending Approvals Card */}
      {stats.pendingApprovals > 0 && (
        <div 
          className="mb-6 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => setShowApprovalModal(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <UserPlus size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-yellow-800">
                  {stats.pendingApprovals} Car {stats.pendingApprovals === 1 ? 'Owner' : 'Owners'} Pending Approval
                </h3>
                <p className="text-sm text-yellow-600">
                  Click to review and approve/decline registration requests
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">
                {stats.pendingApprovals} pending
              </span>
              <ArrowRight size={20} className="text-yellow-600" />
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
        {statsCards.map((stat, index) => (
          <div 
            key={index}
            className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${
              stat.title === 'Total Commission' ? 'border-purple-200 bg-purple-50/30' : ''
            } ${stat.title === 'Total Debt' && stats.totalDebt > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-100'}
            ${stat.title === 'Net Profit' && stats.netProfit > 0 ? 'border-green-200 bg-green-50/30' : 'border-gray-100'}
            ${stat.title === 'Net Profit' && stats.netProfit < 0 ? 'border-red-200 bg-red-50/30' : ''}`}
          >
            <div className="flex items-center justify-between">
              <stat.icon size={18} className={
                stat.title === 'Total Commission' ? 'text-purple-500' : 
                stat.title === 'Total Debt' && stats.totalDebt > 0 ? 'text-red-500' : 
                stat.title === 'Net Profit' && stats.netProfit > 0 ? 'text-green-500' :
                stat.title === 'Net Profit' && stats.netProfit < 0 ? 'text-red-500' :
                'text-gray-400'
              } />
            </div>
            <p className={`text-xl sm:text-2xl font-bold mt-2 ${
              stat.title === 'Total Commission' ? 'text-purple-600' :
              stat.title === 'Total Debt' && stats.totalDebt > 0 ? 'text-red-600' : 
              stat.title === 'Net Profit' && stats.netProfit > 0 ? 'text-green-600' :
              stat.title === 'Net Profit' && stats.netProfit < 0 ? 'text-red-600' :
              'text-gray-800'
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

      {/* Monthly Revenue Chart - Simple bar chart */}
      {stats.monthlyRevenue && stats.monthlyRevenue.length > 0 && (
        <div className="mb-6 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
            <BarChart3 size={16} /> Monthly Revenue Trend
          </h2>
          <div className="flex items-end gap-2 h-32">
            {stats.monthlyRevenue.map((item, index) => {
              const maxRevenue = Math.max(...stats.monthlyRevenue.map(m => m.revenue), 1);
              const height = Math.max((item.revenue / maxRevenue) * 100, 5);
              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600"
                    style={{ height: `${height}%` }}
                  >
                    <div className="text-[8px] text-center text-white pt-1 opacity-0 hover:opacity-100 transition-opacity">
                      {formatCurrency(item.revenue)}
                    </div>
                  </div>
                  <div className="text-[8px] text-gray-400 mt-1 truncate w-full text-center">
                    {item.month}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Revenue Breakdown by Service */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
          <PieChart size={16} /> Revenue Breakdown by Service
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {revenueCards.map((card, index) => {
            const colorMap = {
              blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
              green: 'from-green-50 to-green-100 border-green-200 text-green-700',
              red: 'from-red-50 to-red-100 border-red-200 text-red-700',
              orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-700',
              purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
              pink: 'from-pink-50 to-pink-100 border-pink-200 text-pink-700'
            };
            return (
              <div 
                key={index}
                className={`bg-gradient-to-br ${colorMap[card.color]} border rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow`}
              >
                <card.icon size={20} className={`mx-auto ${card.color === 'blue' ? 'text-blue-600' : card.color === 'green' ? 'text-green-600' : card.color === 'red' ? 'text-red-600' : card.color === 'orange' ? 'text-orange-600' : card.color === 'purple' ? 'text-purple-600' : 'text-pink-600'} mb-1`} />
                <p className="text-lg font-bold">{card.value}</p>
                <p className="text-xs font-medium">{card.title}</p>
                {card.count > 0 && (
                  <p className="text-[10px] text-gray-500 mt-1">{card.count} {card.countLabel}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Service Quick Links */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Quick Access</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-3">
          {serviceLinks.map((service, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(service.tab)}
              className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 text-center hover:shadow-md hover:border-blue-300 transition-all group"
            >
              <service.icon 
                size={24} 
                className="mx-auto text-gray-500 group-hover:text-blue-600 transition-colors" 
              />
              <p className="text-[10px] sm:text-xs font-medium text-gray-600 mt-1 group-hover:text-blue-600 transition-colors">
                {service.label}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Bookings & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Recent Bookings</h2>
            <button 
              onClick={() => setActiveTab('car-bookings')}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              View All <ArrowRight size={12} />
            </button>
          </div>
          <div className="p-4 sm:p-6">
            {loading ? (
              <div className="text-center py-8 text-gray-400 text-sm">Loading...</div>
            ) : recentBookings.length > 0 ? (
              <div className="space-y-2">
                {recentBookings.map((booking, index) => {
                  const hasDebt = (booking.remainingBalance || 0) > 0;
                  const hasCommission = booking.commission > 0;
                  const serviceLabel = booking.serviceType?.replace('_', ' ') || 'Booking';
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors rounded-lg">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          booking.status === 'confirmed' ? 'bg-green-500' :
                          booking.status === 'pending' ? 'bg-yellow-500' :
                          booking.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'
                        }`}></div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {booking.customerName || booking.customer_name || 'Customer'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="truncate">{serviceLabel}</span>
                            {booking.days && <span>• {booking.days} days</span>}
                          </div>
                          {hasCommission && (
                            <span className="text-[10px] text-purple-600 flex items-center gap-1">
                              <TrendingUpIcon size={10} /> Commission: {formatCurrency(booking.commission)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-sm font-semibold text-gray-700">
                          {formatCurrency(booking.totalPrice || booking.total_price || 0)}
                        </span>
                        {hasDebt && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                            Debt: {formatCurrency(booking.remainingBalance)}
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status || 'Pending'}
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
              </div>
            )}
          </div>
        </div>

        {/* Service Summary */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Service Summary</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Car size={20} className="mx-auto text-gray-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{stats.totalVehicles}</p>
                <p className="text-[10px] text-gray-400">Vehicles</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Compass size={20} className="mx-auto text-gray-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{stats.activeTours}</p>
                <p className="text-[10px] text-gray-400">Active Tours</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <MapPin size={20} className="mx-auto text-gray-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{stats.hajjPackages}</p>
                <p className="text-[10px] text-gray-400">Hajj Packages</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Hotel size={20} className="mx-auto text-gray-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{stats.hotels}</p>
                <p className="text-[10px] text-gray-400">Hotels</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Plane size={20} className="mx-auto text-gray-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{stats.flights}</p>
                <p className="text-[10px] text-gray-400">Flights</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Shield size={20} className="mx-auto text-indigo-500 mb-1" />
                <p className="text-xl font-bold text-indigo-600">{stats.visaApplications}</p>
                <p className="text-[10px] text-gray-400">Visa Apps ({stats.approvedVisas} approved)</p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-2">Booking Status</p>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                  <span className="text-xs text-gray-600">{stats.completedBookings} Completed</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                  <span className="text-xs text-gray-600">{stats.pendingBookings} Pending</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                  <span className="text-xs text-gray-600">{stats.cancelledBookings} Cancelled</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-2">Financial Summary</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Revenue:</span>
                  <span className="font-medium text-green-600">{formatCurrency(stats.totalRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Commission:</span>
                  <span className="font-medium text-purple-600">{formatCurrency(stats.totalCommission)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Expenses:</span>
                  <span className="font-medium text-red-600">{formatCurrency(stats.totalExpenses)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                  <span className="text-gray-400 font-medium">Net Profit:</span>
                  <span className={`font-bold ${stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(stats.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Debt:</span>
                  <span className={`font-medium ${stats.totalDebt > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {formatCurrency(stats.totalDebt)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Modal */}
      {showApprovalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowApprovalModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-yellow-50 to-amber-50 border-b border-yellow-200 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                  <UserPlus size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Pending Approvals</h2>
                  <p className="text-sm text-gray-500">{pendingOwners.length} car owners waiting for approval</p>
                </div>
              </div>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {pendingOwners.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
                  <p className="text-gray-500">No pending approvals</p>
                  <p className="text-sm text-gray-400">All car owners have been processed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingOwners.map((owner) => (
                    <div key={owner.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-yellow-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
                            <User size={24} className="text-yellow-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{owner.name}</p>
                            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <Mail size={12} /> {owner.email || 'No email'}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone size={12} /> {owner.phone || 'No phone'}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-400 mt-1">
                              {owner.idNumber && <span>ID: {owner.idNumber}</span>}
                              {owner.address && <span>📍 {owner.address}</span>}
                              <span>📅 {new Date(owner.createdAt || owner.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(owner.id)}
                            disabled={approvalLoading}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-1"
                          >
                            <Check size={16} /> Approve
                          </button>
                          <button
                            onClick={() => handleDecline(owner.id)}
                            disabled={approvalLoading}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-1"
                          >
                            <X size={16} /> Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {pendingOwners.length > 0 && (
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {pendingOwners.length} pending approval{ pendingOwners.length !== 1 ? 's' : '' }
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowApprovalModal(false)}
                    className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleApproveAll}
                    disabled={approvalLoading}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm flex items-center gap-2"
                  >
                    {approvalLoading ? 'Processing...' : <><Check size={16} /> Approve All</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

export default FleetManagerDashboard;