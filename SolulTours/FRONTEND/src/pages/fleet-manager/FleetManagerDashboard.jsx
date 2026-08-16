// FleetManagerDashboard.jsx - Complete Fixed Version
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Car, Users, Calendar, DollarSign, 
  TrendingUp, TrendingDown, Package, 
  MapPin, Plane, Hotel, Compass,
  ArrowRight, Bell, Clock, CheckCircle,
  AlertCircle, Phone, Mail,
  BarChart3, PieChart, UserPlus, 
  X, Check, User, Building, RefreshCw,
  Shield, Award, CreditCard, Wallet,
  TrendingUp as TrendingUpIcon,
  Activity, Briefcase, Globe, 
  Download, Printer, Settings, HelpCircle,
  ChevronDown, ChevronUp, Maximize2, Minimize2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
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
  
  // State
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
  const [greeting, setGreeting] = useState('Good morning');
  const [expandedSections, setExpandedSections] = useState({
    stats: true,
    revenue: true,
    bookings: true
  });
  const [isExporting, setIsExporting] = useState(false);

  // ============================================
  // GET TIME-BASED GREETING
  // ============================================
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 17) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // ============================================
  // KEYBOARD SHORTCUTS
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        loadDashboardData(tenantId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        if (stats.pendingApprovals > 0) setShowApprovalModal(true);
      }
      if (e.key === 'Escape') {
        setShowApprovalModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tenantId, stats.pendingApprovals]);

  // ============================================
  // GET TENANT ID
  // ============================================
  useEffect(() => {
    const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
    const tid = userData?.tenantId || null;
    setTenantId(tid);
    if (tid) loadDashboardData(tid);
    else {
      loadFromLocalStorage();
      setLoading(false);
    }
  }, []);

  // ============================================
  // DATA LOADING FUNCTIONS
  // ============================================
  const loadDashboardData = useCallback(async (tid) => {
    const tenantToUse = tid || tenantId;
    if (!tenantToUse) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [
        vehiclesRes, bookingsRes, carOwnersRes, usersRes,
        toursRes, hajjRes, hotelsRes, flightsRes, visaRes, expensesRes
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

      const totalVehicles = vehicles.length;
      const totalBookings = bookings.length;
      const pendingBookings = bookings.filter(b => b.status === 'pending').length;
      const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'confirmed').length;
      const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

      let revenueBreakdown = { carHire: 0, tours: 0, hajj: 0, hotels: 0, flights: 0, visa: 0 };
      let bookingCounts = { carHire: 0, tours: 0, hajj: 0, hotels: 0, flights: 0, visa: 0 };
      let totalRevenue = 0, totalCommission = 0, totalDebt = 0, debtCount = 0;

      bookings.forEach(b => {
        const serviceType = b.serviceType || b.service_type || 'car_hire';
        const amount = b.totalPrice || b.total_price || 0;
        const commission = b.commission || 0;
        const remainingBalance = b.remainingBalance || 0;
        totalRevenue += amount;
        totalCommission += commission;
        totalDebt += remainingBalance;
        if (remainingBalance > 0) debtCount++;

        const key = serviceType === 'car_hire' || serviceType === 'car' ? 'carHire' :
                    serviceType === 'tour' || serviceType === 'tours' ? 'tours' :
                    serviceType === 'hajj' || serviceType === 'hajj_umra' ? 'hajj' :
                    serviceType === 'hotel' || serviceType === 'hotels' ? 'hotels' :
                    serviceType === 'flight' || serviceType === 'flights' ? 'flights' : null;
        if (key) { revenueBreakdown[key] += amount; bookingCounts[key]++; }
      });

      const visaRevenue = visas.filter(v => v.status === 'approved')
        .reduce((sum, v) => sum + (parseFloat(v.cost) || parseFloat(v.price) || 0), 0);
      const approvedVisas = visas.filter(v => v.status === 'approved').length;
      const visaApplications = visas.length;
      revenueBreakdown.visa = visaRevenue;
      bookingCounts.visa = visaApplications;
      totalRevenue += visaRevenue;

      const totalExpenses = expenses.reduce((sum, e) => sum + (e.cost || e.amount || 0), 0);
      const netProfit = totalRevenue - totalExpenses;
      const pendingOwnersList = owners.filter(o => o.status === 'pending_approval' || o.status === 'pending');
      const clients = users.filter(u => u.role === 'client').length;

      const sortedBookings = [...bookings].sort((a, b) => 
        new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)
      );
      const recentBookingsList = sortedBookings.slice(0, 5);
      const monthlyRevenue = calculateMonthlyRevenue(bookings);

      setStats({
        totalVehicles, totalBookings, totalRevenue, totalCommission,
        activeTours: tours.filter(t => t.status === 'active' || t.status === 'published').length,
        hajjPackages: hajjPackages.length, hotels: hotels.length, flights: flights.length,
        pendingBookings, completedBookings, cancelledBookings,
        pendingApprovals: pendingOwnersList.length, totalDebt, debtCount,
        carOwners: owners.filter(o => o.status === 'active').length, clients,
        visaRevenue, visaApplications, approvedVisas, totalExpenses, netProfit,
        revenueBreakdown, bookingCounts, monthlyRevenue
      });
      setRecentBookings(recentBookingsList);
      setPendingOwners(pendingOwnersList);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      showNotification('Failed to load dashboard data', 'error');
      loadFromLocalStorage();
    }
    setLoading(false);
  }, [tenantId]);

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

  const loadFromLocalStorage = () => {
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
      let totalRevenue = 0, totalCommission = 0, totalDebt = 0, debtCount = 0;

      bookings.forEach(b => {
        const serviceType = b.serviceType || b.service_type || 'car_hire';
        const amount = b.totalPrice || b.total_price || 0;
        const commission = b.commission || 0;
        const remainingBalance = b.remainingBalance || 0;
        totalRevenue += amount;
        totalCommission += commission;
        totalDebt += remainingBalance;
        if (remainingBalance > 0) debtCount++;

        const key = serviceType === 'car_hire' || serviceType === 'car' ? 'carHire' :
                    serviceType === 'tour' || serviceType === 'tours' ? 'tours' :
                    serviceType === 'hajj' || serviceType === 'hajj_umra' ? 'hajj' :
                    serviceType === 'hotel' || serviceType === 'hotels' ? 'hotels' :
                    serviceType === 'flight' || serviceType === 'flights' ? 'flights' : null;
        if (key) { revenueBreakdown[key] += amount; bookingCounts[key]++; }
      });

      revenueBreakdown.visa = visaRevenue;
      bookingCounts.visa = totalVisas;
      totalRevenue += visaRevenue;

      const totalExpenses = expenses.reduce((sum, e) => sum + (e.cost || e.amount || 0), 0);
      const netProfit = totalRevenue - totalExpenses;
      const pendingOwnersList = owners.filter(o => o.status === 'pending_approval' || o.status === 'pending');
      const clients = users.filter(u => u.role === 'client').length;
      const monthlyRevenue = calculateMonthlyRevenue(bookings);

      setStats({
        totalVehicles, totalBookings, totalRevenue, totalCommission,
        activeTours: tours.filter(t => t.status === 'active' || t.status === 'published').length,
        hajjPackages: hajjPackages.length, hotels: hotels.length, flights: flights.length,
        pendingBookings, completedBookings, cancelledBookings,
        pendingApprovals: pendingOwnersList.length, totalDebt, debtCount,
        carOwners: owners.filter(o => o.status === 'active').length, clients,
        visaRevenue, visaApplications: totalVisas, approvedVisas,
        totalExpenses, netProfit,
        revenueBreakdown, bookingCounts, monthlyRevenue
      });
      setRecentBookings(bookings.slice(0, 5));
      setPendingOwners(pendingOwnersList);
    } catch (e) { console.error('Error loading from localStorage:', e); }
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
        showNotification('Failed to approve', 'error');
      }
    } catch (error) {
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
      }
    } catch (error) {
      showNotification('Failed to decline.', 'error');
    }
    setApprovalLoading(false);
  };

  const handleApproveAll = async () => {
    if (!window.confirm(`Approve all ${pendingOwners.length} pending car owners?`)) return;
    setApprovalLoading(true);
    let successCount = 0;
    for (const owner of pendingOwners) {
      try {
        const response = await carOwnerService.approve(owner.id);
        if (response?.success) successCount++;
      } catch (e) {}
    }
    if (successCount > 0) {
      showNotification(`✅ ${successCount} car owners approved!`);
      await loadDashboardData(tenantId);
    }
    setApprovalLoading(false);
    setShowApprovalModal(false);
  };

  // ============================================
  // EXPORT FUNCTIONALITY
  // ============================================
  const handleExport = () => {
    setIsExporting(true);
    try {
      const data = {
        exportedAt: new Date().toISOString(),
        stats,
        recentBookings,
        pendingOwners
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('✅ Dashboard exported successfully!');
    } catch (error) {
      showNotification('Failed to export dashboard', 'error');
    }
    setIsExporting(false);
  };

  // ============================================
  // TOGGLE SECTION
  // ============================================
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // ============================================
  // HELPERS
  // ============================================
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getStatusColor = (status) => {
    const map = {
      pending: 'text-amber-600 bg-amber-50',
      confirmed: 'text-emerald-600 bg-emerald-50',
      completed: 'text-emerald-600 bg-emerald-50',
      cancelled: 'text-rose-600 bg-rose-50',
      paid: 'text-emerald-600 bg-emerald-50',
      partial: 'text-blue-600 bg-blue-50'
    };
    return map[status?.toLowerCase()] || 'text-gray-600 bg-gray-50';
  };

  const formatCurrency = (amount) => `KSh ${(amount || 0).toLocaleString()}`;
  const formatNumber = (num) => (num || 0).toLocaleString();

  // ============================================
  // MEMOIZED METRICS
  // ============================================
  const metrics = useMemo(() => ({
    revenue: { label: 'Total Revenue', value: formatCurrency(stats.totalRevenue), icon: DollarSign, color: 'blue' },
    profit: { label: 'Net Profit', value: formatCurrency(stats.netProfit), icon: TrendingUp, color: stats.netProfit >= 0 ? 'emerald' : 'rose' },
    bookings: { label: 'Total Bookings', value: formatNumber(stats.totalBookings), icon: Calendar, color: 'indigo' },
    commission: { label: 'Commission Earned', value: formatCurrency(stats.totalCommission), icon: TrendingUpIcon, color: 'purple' }
  }), [stats]);

  const revenueItems = useMemo(() => [
    { label: 'Car Hire', value: stats.revenueBreakdown?.carHire || 0, icon: Car },
    { label: 'Tours', value: stats.revenueBreakdown?.tours || 0, icon: Compass },
    { label: 'Hajj & Umra', value: stats.revenueBreakdown?.hajj || 0, icon: MapPin },
    { label: 'Hotels', value: stats.revenueBreakdown?.hotels || 0, icon: Hotel },
    { label: 'Flights', value: stats.revenueBreakdown?.flights || 0, icon: Plane },
    { label: 'Visa', value: stats.revenueBreakdown?.visa || 0, icon: Shield }
  ], [stats.revenueBreakdown]);

  const quickLinks = useMemo(() => [
    { label: 'Vehicles', icon: Car, tab: 'vehicles' },
    { label: 'Car Owners', icon: Users, tab: 'car-owners' },
    { label: 'Bookings', icon: Calendar, tab: 'car-bookings' },
    { label: 'Tours', icon: Compass, tab: 'tour-packages' },
    { label: 'Hajj', icon: MapPin, tab: 'hajj-packages' },
    { label: 'Hotels', icon: Hotel, tab: 'fleet-hotels' },
    { label: 'Flights', icon: Plane, tab: 'fleet-flights' },
    { label: 'Visa', icon: Shield, tab: 'visa-processing' },
    { label: 'CRM', icon: Users, tab: 'car-crm' }
  ], []);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl shadow-lg flex items-center gap-2 sm:gap-3 animate-slide-down max-w-[92%] sm:max-w-full ${
          notification.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-700' : 'bg-emerald-50 border border-emerald-200 text-emerald-700'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> : <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />}
          <span className="text-xs sm:text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-1 hover:opacity-70">
            <X size={14} className="sm:w-[16px] sm:h-[16px]" />
          </button>
        </div>
      )}

      {/* ============================================ */}
      {/* HEADER WITH GREETING */}
      {/* ============================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4 animate-fade-in">
        <div>
          <h1 className="text-lg sm:text-2xl font-semibold text-gray-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
            {greeting}, Fleet Manager
            <span className="text-lg sm:text-xl" role="img" aria-label="wave"></span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Here's your business overview for today
            <span className="text-[10px] sm:text-xs text-gray-400 ml-1 sm:ml-2">(⌘R to refresh)</span>
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Download size={13} className="sm:w-[15px] sm:h-[15px]" />
            <span className="hidden xs:inline">{isExporting ? 'Exporting...' : 'Export'}</span>
          </button>
          <button 
            onClick={() => loadDashboardData(tenantId)}
            className="inline-flex items-center gap-1 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <RefreshCw size={13} className={`sm:w-[15px] sm:h-[15px] ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* ============================================ */}
      {/* PENDING APPROVALS BANNER */}
      {/* ============================================ */}
      {stats.pendingApprovals > 0 && (
        <div 
          className="mb-4 sm:mb-6 bg-white border border-amber-200 rounded-xl p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer animate-slide-down"
          onClick={() => setShowApprovalModal(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && setShowApprovalModal(true)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <UserPlus size={16} className="sm:w-[20px] sm:h-[20px] text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                  {stats.pendingApprovals} Car {stats.pendingApprovals === 1 ? 'Owner' : 'Owners'} Pending
                </p>
                <p className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Review registration requests</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                {stats.pendingApprovals}
              </span>
              <ArrowRight size={14} className="sm:w-[16px] sm:h-[16px] text-gray-400" />
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* KEY METRICS - 4 BIG CARDS */}
      {/* ============================================ */}
      <div className="grid grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
        {Object.entries(metrics).map(([key, metric], index) => (
          <div
            key={key}
            className="bg-white rounded-xl border border-gray-100 p-3 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-sm text-gray-500 font-medium truncate">{metric.label}</p>
                <p className={`text-base sm:text-2xl font-semibold mt-0.5 sm:mt-1 truncate ${
                  metric.color === 'rose' ? 'text-rose-600' : 
                  metric.color === 'emerald' ? 'text-emerald-600' : 
                  'text-gray-900'
                }`}>
                  {metric.value}
                </p>
                {key === 'bookings' && (
                  <p className="text-[8px] sm:text-xs text-gray-400 mt-0.5">{stats.pendingBookings} pending</p>
                )}
                {key === 'revenue' && (
                  <p className="text-[8px] sm:text-xs text-gray-400 mt-0.5 hidden sm:block">All services combined</p>
                )}
                {key === 'commission' && (
                  <p className="text-[8px] sm:text-xs text-gray-400 mt-0.5 hidden sm:block">Agency earnings</p>
                )}
              </div>
              <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ml-1 sm:ml-2 ${
                metric.color === 'blue' ? 'bg-blue-50' :
                metric.color === 'emerald' ? 'bg-emerald-50' :
                metric.color === 'indigo' ? 'bg-indigo-50' :
                metric.color === 'purple' ? 'bg-purple-50' :
                metric.color === 'rose' ? 'bg-rose-50' : 'bg-gray-50'
              }`}>
                <metric.icon size={14} className="sm:w-[20px] sm:h-[20px]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ============================================ */}
      {/* SECONDARY METRICS - 6 SMALL CARDS */}
      {/* ============================================ */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-3 mb-4 sm:mb-6">
        {[
          { label: 'Vehicles', value: stats.totalVehicles, icon: Car },
          { label: 'Active Tours', value: stats.activeTours, icon: Compass },
          { label: 'Hajj', value: stats.hajjPackages, icon: MapPin },
          { label: 'Hotels', value: stats.hotels, icon: Hotel },
          { label: 'Flights', value: stats.flights, icon: Plane },
          { label: 'Visa', value: stats.visaApplications, icon: Shield }
        ].map((item, index) => (
          <div
            key={index}
            className="bg-white rounded-lg border border-gray-100 p-1.5 sm:p-3 text-center shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200 animate-fade-in-up"
            style={{ animationDelay: `${100 + index * 30}ms` }}
          >
            <item.icon size={12} className="sm:w-[18px] sm:h-[18px] mx-auto text-gray-400 mb-0.5 sm:mb-1" />
            <p className="text-sm sm:text-lg font-semibold text-gray-800">{formatNumber(item.value)}</p>
            <p className="text-[8px] sm:text-[10px] text-gray-400 uppercase tracking-wider">{item.label}</p>
          </div>
        ))}
      </div>

      {/* ============================================ */}
      {/* REVENUE BREAKDOWN + CHART */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 gap-3 sm:gap-6 mb-4 sm:mb-6">
        {/* Revenue Breakdown */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-left">
          <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 sm:gap-2">
              <PieChart size={14} className="sm:w-[16px] sm:h-[16px] text-gray-400" />
              Revenue by Service
            </h3>
            <button
              onClick={() => toggleSection('revenue')}
              className="text-gray-400 hover:text-gray-600 transition-colors lg:hidden"
            >
              {expandedSections.revenue ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          <div className={`p-3 sm:p-4 space-y-2 sm:space-y-3 ${expandedSections.revenue ? 'block' : 'hidden lg:block'}`}>
            {revenueItems.map((item, i) => {
              const maxVal = Math.max(...revenueItems.map(r => r.value), 1);
              const pct = maxVal > 0 ? (item.value / maxVal) * 100 : 0;
              return (
                <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${200 + i * 50}ms` }}>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <item.icon size={12} className="sm:w-[14px] sm:h-[14px] text-gray-400 flex-shrink-0" />
                      <span className="text-gray-600 truncate">{item.label}</span>
                    </div>
                    <span className="font-medium text-gray-800 text-xs sm:text-sm flex-shrink-0 ml-1">{formatCurrency(item.value)}</span>
                  </div>
                  <div className="mt-0.5 sm:mt-1 h-1 sm:h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* QUICK ACCESS + RECENT BOOKINGS */}
      {/* ============================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
        {/* Quick Access */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 sm:gap-2">
              <Activity size={14} className="sm:w-[16px] sm:h-[16px] text-gray-400" />
              Quick Access
            </h3>
            <button
              onClick={() => toggleSection('bookings')}
              className="text-gray-400 hover:text-gray-600 transition-colors lg:hidden"
            >
              {expandedSections.bookings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          <div className={`p-2 sm:p-4 ${expandedSections.bookings ? 'block' : 'hidden lg:block'}`}>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
              {quickLinks.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTab(item.tab)}
                  className="flex flex-col items-center gap-0.5 sm:gap-1 p-1.5 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 hover:scale-105 transition-all duration-200 group"
                >
                  <item.icon size={14} className="sm:w-[18px] sm:h-[18px] text-gray-500 group-hover:text-blue-600 transition-colors" />
                  <span className="text-[7px] sm:text-[10px] text-gray-600 group-hover:text-blue-600 transition-colors text-center leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '450ms' }}>
          <div className="px-3 sm:px-5 py-3 sm:py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-medium text-gray-700 flex items-center gap-1.5 sm:gap-2">
              <Clock size={14} className="sm:w-[16px] sm:h-[16px] text-gray-400" />
              Recent Bookings
            </h3>
            <button 
              onClick={() => setActiveTab('car-bookings')}
              className="text-[10px] sm:text-xs text-blue-600 hover:text-blue-800 flex items-center gap-0.5 sm:gap-1 transition-colors"
            >
              View all <ArrowRight size={10} className="sm:w-[12px] sm:h-[12px]" />
            </button>
          </div>
          <div className="divide-y divide-gray-50 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="text-center py-6 sm:py-8 text-gray-400 text-xs sm:text-sm">
                <div className="animate-pulse">Loading...</div>
              </div>
            ) : recentBookings.length > 0 ? (
              recentBookings.map((booking, index) => {
                const hasDebt = (booking.remainingBalance || 0) > 0;
                const serviceLabel = booking.serviceType?.replace('_', ' ') || 'Booking';
                const statusClass = getStatusColor(booking.status);
                
                return (
                  <div 
                    key={index}
                    className="px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-between hover:bg-gray-50 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${500 + index * 50}ms` }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                      <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${
                        booking.status === 'confirmed' || booking.status === 'completed' ? 'bg-emerald-500' :
                        booking.status === 'pending' ? 'bg-amber-500' :
                        booking.status === 'cancelled' ? 'bg-rose-500' : 'bg-gray-400'
                      }`}></div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-medium text-gray-800 truncate max-w-[80px] sm:max-w-full">
                          {booking.customerName || booking.customer_name || 'Customer'}
                        </p>
                        <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-xs text-gray-400 flex-wrap">
                          <span className="truncate max-w-[50px] sm:max-w-full">{serviceLabel}</span>
                          {booking.days && <span>• {booking.days}d</span>}
                          <span className={`text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full ${statusClass}`}>
                            {booking.status || 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0 ml-1 sm:ml-2">
                      <span className="text-xs sm:text-sm font-semibold text-gray-800">
                        {formatCurrency(booking.totalPrice || booking.total_price || 0)}
                      </span>
                      {hasDebt && (
                        <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 font-medium hidden xs:inline-block">
                          Debt: {formatCurrency(booking.remainingBalance)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-400">
                <Calendar size={24} className="sm:w-[32px] sm:h-[32px] mx-auto text-gray-300 mb-2" />
                <p className="text-xs sm:text-sm">No recent bookings</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1">Bookings will appear here once created</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================ */}
      {/* FOOTER */}
      {/* ============================================ */}
      <div className="mt-6 sm:mt-8 text-center text-[10px] sm:text-[11px] text-gray-400 border-t border-gray-200 pt-4 sm:pt-5 flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
        <span>© 2026 Sulul Tours &amp; Travel.</span>
        <span className="w-px h-3 bg-gray-200 hidden xs:block"></span>
        <span className="flex items-center gap-1">
          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="hidden xs:inline">All systems operational</span>
        </span>
        <span className="text-[8px] sm:text-[10px] text-gray-300">v2.0</span>
      </div>

      {/* ============================================ */}
      {/* APPROVAL MODAL - Mobile Optimized */}
      {/* ============================================ */}
      {showApprovalModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in"
          onClick={() => setShowApprovalModal(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>
          <div 
            className="relative bg-white rounded-xl sm:rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[85vh] overflow-hidden shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">Pending Approvals</h2>
                <p className="text-xs sm:text-sm text-gray-500">{pendingOwners.length} car owners waiting</p>
              </div>
              <button 
                onClick={() => setShowApprovalModal(false)} 
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} className="sm:w-[22px] sm:h-[22px] text-gray-500" />
              </button>
            </div>

            <div className="p-3 sm:p-6 overflow-y-auto max-h-[60vh] space-y-3 sm:space-y-4">
              {pendingOwners.length === 0 ? (
                <div className="text-center py-8 sm:py-12">
                  <CheckCircle size={36} className="sm:w-[48px] sm:h-[48px] mx-auto text-emerald-500 mb-3" />
                  <p className="text-sm sm:text-base text-gray-500">All clear! No pending approvals.</p>
                </div>
              ) : (
                pendingOwners.map((owner, index) => (
                  <div 
                    key={owner.id}
                    className="bg-gray-50 rounded-xl p-3 sm:p-4 border border-gray-100 hover:border-amber-200 transition-colors animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-2">
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                          <User size={18} className="sm:w-[22px] sm:h-[22px] text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{owner.name}</p>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-[10px] sm:text-xs text-gray-500">
                            <span className="flex items-center gap-0.5 sm:gap-1 truncate">
                              <Mail size={10} className="sm:w-[12px] sm:h-[12px] flex-shrink-0" /> 
                              <span className="truncate max-w-[80px] sm:max-w-full">{owner.email || 'No email'}</span>
                            </span>
                            <span className="flex items-center gap-0.5 sm:gap-1">
                              <Phone size={10} className="sm:w-[12px] sm:h-[12px]" /> 
                              {owner.phone || 'No phone'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 sm:gap-3 text-[9px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                            {owner.idNumber && <span>ID: {owner.idNumber}</span>}
                            <span>📅 {new Date(owner.createdAt || owner.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 w-full sm:w-auto">
                        <button
                          onClick={() => handleApprove(owner.id)}
                          disabled={approvalLoading}
                          className="flex-1 sm:flex-none px-3 py-1.5 sm:px-3 sm:py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-xs sm:text-sm flex items-center justify-center gap-0.5 sm:gap-1"
                        >
                          <Check size={12} className="sm:w-[14px] sm:h-[14px]" /> 
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleDecline(owner.id)}
                          disabled={approvalLoading}
                          className="flex-1 sm:flex-none px-3 py-1.5 sm:px-3 sm:py-1.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors text-xs sm:text-sm flex items-center justify-center gap-0.5 sm:gap-1"
                        >
                          <X size={12} className="sm:w-[14px] sm:h-[14px]" /> 
                          <span>Decline</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {pendingOwners.length > 0 && (
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs sm:text-sm text-gray-500">{pendingOwners.length} pending</span>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button 
                    onClick={() => setShowApprovalModal(false)} 
                    className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleApproveAll}
                    disabled={approvalLoading}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-xs sm:text-sm flex items-center gap-1 sm:gap-2"
                  >
                    {approvalLoading ? 'Processing...' : <><Check size={14} className="sm:w-[16px] sm:h-[16px]" /> Approve All</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* CSS ANIMATIONS - FIXED */}
      {/* ============================================ */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes growUp {
          from { height: 0; }
          to { height: var(--height); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-fade-in-up { animation: fadeInUp 0.4s ease-out both; }
        .animate-fade-in-left { animation: fadeInLeft 0.4s ease-out both; }
        .animate-fade-in-right { animation: fadeInRight 0.4s ease-out both; }
        .animate-slide-down { animation: slideDown 0.3s ease-out both; }
        .animate-scale-in { animation: scaleIn 0.3s ease-out both; }
        .animate-grow-up { animation: growUp 0.6s ease-out both; }
        
        /* Responsive utilities */
        @media (max-width: 480px) {
          .xs\\:inline { display: inline; }
          .xs\\:block { display: block; }
        }
        @media (min-width: 481px) {
          .xs\\:hidden { display: none; }
        }
      `}</style>
    </div>
  );
};

export default FleetManagerDashboard;