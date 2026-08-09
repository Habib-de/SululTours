import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Calendar, TrendingUp, TrendingDown, 
  Car, Users, Clock, CheckCircle, XCircle,
  Filter, Search, X, RefreshCw, Download,
  ArrowUp, ArrowDown, PieChart, BarChart3,
  AlertCircle, Eye, ChevronDown, ChevronUp,
  Tag, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  bookingService, 
  vehicleService, 
  carOwnerService, 
  expenseService,
  maintenanceService 
} from '../../services/api';

const Revenue = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [carOwner, setCarOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [ownerId, setOwnerId] = useState(null);

  // Expenses data for Profit/Loss calculation
  const [expenses, setExpenses] = useState([]);
  const [totalExpenses, setTotalExpenses] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    completedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    averageRevenue: 0,
    totalDays: 0,
    revenueByVehicle: {},
    totalDebt: 0,
    debtCount: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    totalDiscount: 0
  });

  useEffect(() => {
    const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
    const tid = userData?.tenantId || null;
    setTenantId(tid);
    
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
      const response = await carOwnerService.getByUser(userId);
      console.log('👤 Car Owner Response:', response);
      
      let ownerData = null;
      if (response?.success && response?.data) {
        ownerData = response.data;
      } else if (response?.data) {
        ownerData = response.data;
      } else if (response?.id) {
        ownerData = response;
      }
      
      if (ownerData) {
        setCarOwner(ownerData);
        setOwnerId(ownerData.id);
        loadData(ownerData.id, ownerData.tenantId || tenantId);
      } else {
        showNotification('Car owner profile not found', 'error');
        loadFromLocalStorage();
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading car owner profile:', error);
      showNotification('Failed to load profile. Loading from local storage.', 'error');
      loadFromLocalStorage();
      setLoading(false);
    }
  };

  const loadData = async (ownerIdParam, tenantIdParam) => {
    const ownerIdToUse = ownerIdParam || ownerId;
    const tid = tenantIdParam || tenantId;
    
    if (!ownerIdToUse) {
      showNotification('No car owner profile found', 'error');
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // ✅ 1. Get owner's vehicles
      let vehiclesData = [];
      try {
        const vehiclesResponse = await vehicleService.getByOwner(ownerIdToUse);
        console.log('📊 Vehicles Response:', vehiclesResponse);
        
        if (vehiclesResponse?.success && vehiclesResponse?.data) {
          vehiclesData = vehiclesResponse.data;
        } else if (Array.isArray(vehiclesResponse)) {
          vehiclesData = vehiclesResponse;
        }
      } catch (e) {
        console.warn('Could not fetch vehicles:', e);
      }
      setVehicles(vehiclesData);
      const vehicleIds = vehiclesData.map(v => v.id);

      // ✅ 2. Get all bookings for the tenant
      let bookingsData = [];
      try {
        const bookingsResponse = await bookingService.getAll(tid);
        console.log('📊 Bookings Response:', bookingsResponse);
        
        let allBookings = [];
        if (bookingsResponse?.success && bookingsResponse?.data) {
          allBookings = bookingsResponse.data;
        } else if (Array.isArray(bookingsResponse)) {
          allBookings = bookingsResponse;
        }
        
        // ✅ Filter bookings for owner's vehicles
        bookingsData = allBookings.filter(b => vehicleIds.includes(b.vehicleId));
      } catch (e) {
        console.warn('Could not fetch bookings:', e);
      }
      setBookings(bookingsData);

      // ✅ 3. Get expenses for the tenant
      let expensesData = [];
      let totalExpensesAmount = 0;
      try {
        const expensesResponse = await expenseService.getAll(tid);
        console.log('📊 Expenses Response:', expensesResponse);
        
        let allExpenses = [];
        if (expensesResponse?.success && expensesResponse?.data) {
          allExpenses = expensesResponse.data;
        } else if (Array.isArray(expensesResponse)) {
          allExpenses = expensesResponse;
        }
        
        // Filter expenses for owner's vehicles
        expensesData = allExpenses.filter(e => vehicleIds.includes(e.vehicleId));
        totalExpensesAmount = expensesData.reduce((sum, e) => sum + (e.amount || 0), 0);
      } catch (e) {
        console.warn('Could not fetch expenses:', e);
      }

      // ✅ 4. Get maintenance records (to show as expenses)
      let maintenanceData = [];
      try {
        const maintenanceResponse = await maintenanceService.getAll(tid);
        console.log('📊 Maintenance Response:', maintenanceResponse);
        
        let allMaintenance = [];
        if (maintenanceResponse?.success && maintenanceResponse?.data) {
          allMaintenance = maintenanceResponse.data;
        } else if (Array.isArray(maintenanceResponse)) {
          allMaintenance = maintenanceResponse;
        }
        
        // Filter maintenance for owner's vehicles
        maintenanceData = allMaintenance.filter(m => vehicleIds.includes(m.vehicleId));
        
        // Add maintenance costs to total expenses
        maintenanceData.forEach(m => {
          totalExpensesAmount += (m.cost || 0);
        });
      } catch (e) {
        console.warn('Could not fetch maintenance:', e);
      }

      // ✅ 5. Combine expenses
      const allExpenses = [...expensesData, ...maintenanceData.map(m => ({
        ...m,
        amount: m.cost || 0,
        category: 'maintenance',
        description: m.description || m.maintenanceType || 'Maintenance',
        date: m.date,
        status: m.status === 'completed' ? 'paid' : 'pending',
        isMaintenance: true,
        maintenanceId: m.id
      }))];
      
      setExpenses(allExpenses);
      setTotalExpenses(totalExpensesAmount);

      // ✅ 6. Calculate stats with correct discount handling
      calculateStats(bookingsData, totalExpensesAmount, allExpenses);

    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Error loading data', 'error');
      loadFromLocalStorage();
    }

    setLoading(false);
  };

  // ✅ Fallback to localStorage
  const loadFromLocalStorage = () => {
    console.warn('Loading revenue data from localStorage (fallback)');
    
    try {
      const storedVehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
      setVehicles(storedVehicles);

      const allOwners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
      const owner = allOwners.find(o => o.userId === currentUser?.id);
      setCarOwner(owner);

      if (owner) {
        const ownerVehicles = storedVehicles.filter(v => v.ownerId === owner.id);
        const ownerVehicleIds = ownerVehicles.map(v => v.id);

        const allBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
        const myBookings = allBookings.filter(b => ownerVehicleIds.includes(b.vehicleId));
        setBookings(myBookings);

        const storedExpenses = JSON.parse(localStorage.getItem('travel_agency_expenses') || '[]');
        const storedMaintenance = JSON.parse(localStorage.getItem('travel_agency_maintenance') || '[]');
        
        const filteredExpenses = storedExpenses.filter(e => ownerVehicleIds.includes(e.vehicleId));
        const filteredMaintenance = storedMaintenance.filter(m => ownerVehicleIds.includes(m.vehicleId));
        
        const totalExp = filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
        const totalMaint = filteredMaintenance.reduce((sum, m) => sum + (m.cost || 0), 0);
        setTotalExpenses(totalExp + totalMaint);
        setExpenses([...filteredExpenses, ...filteredMaintenance]);

        calculateStats(myBookings, totalExp + totalMaint, []);
      } else {
        setBookings([]);
        setStats({
          totalRevenue: 0,
          totalBookings: 0,
          completedBookings: 0,
          pendingBookings: 0,
          cancelledBookings: 0,
          averageRevenue: 0,
          totalDays: 0,
          revenueByVehicle: {},
          totalDebt: 0,
          debtCount: 0,
          totalExpenses: 0,
          netProfit: 0,
          profitMargin: 0,
          totalDiscount: 0
        });
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  const calculateStats = (bookingsData, expenseAmount = 0, expenseData = []) => {
    console.log('🔍 Calculating stats for bookings:', bookingsData.length);
    console.log('💰 Total Expenses:', expenseAmount);
    
    const completed = bookingsData.filter(b => b.status === 'completed' || b.status === 'confirmed');
    const pending = bookingsData.filter(b => b.status === 'pending');
    const cancelled = bookingsData.filter(b => b.status === 'cancelled');
    
    // ✅ Calculate revenue with discount applied to total
    const totalRevenue = bookingsData.reduce((sum, b) => {
      if (b.status === 'cancelled') return sum;
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
      if (b.status === 'cancelled') return sum;
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
    
    const completedRevenue = completed.reduce((sum, b) => {
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
    
    const totalDays = bookingsData.reduce((sum, b) => {
      if (b.status === 'cancelled') return sum;
      return sum + (b.days || b.duration || 0);
    }, 0);
    
    const totalDebt = bookingsData.reduce((sum, b) => sum + (b.remainingBalance || 0), 0);
    const debtCount = bookingsData.filter(b => (b.remainingBalance || 0) > 0).length;
    
    // Revenue by vehicle with discount applied
    const revenueByVehicle = {};
    bookingsData.forEach(b => {
      if (b.status === 'cancelled') return;
      const vehicleId = b.vehicleId;
      if (!revenueByVehicle[vehicleId]) {
        revenueByVehicle[vehicleId] = {
          revenue: 0,
          bookings: 0,
          days: 0,
          debt: 0,
          expenses: 0,
          discount: 0,
          registration: b.vehicleRegistration || 'Unknown',
          make: b.vehicleMake || 'Unknown',
          model: b.vehicleModel || ''
        };
      }
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
      
      revenueByVehicle[vehicleId].revenue += (baseEarnings - discount);
      revenueByVehicle[vehicleId].discount += discount;
      revenueByVehicle[vehicleId].bookings += 1;
      revenueByVehicle[vehicleId].days += days;
      revenueByVehicle[vehicleId].debt += (b.remainingBalance || 0);
    });

    // Add expenses to vehicle breakdown
    expenseData.forEach(e => {
      if (e.vehicleId && revenueByVehicle[e.vehicleId]) {
        revenueByVehicle[e.vehicleId].expenses += (e.amount || 0);
      }
    });

    // ✅ Update vehicle details from the vehicles state
    const vehiclesData = vehicles.length > 0 ? vehicles : JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
    const revenueByVehicleWithDetails = {};
    Object.keys(revenueByVehicle).forEach(vehicleId => {
      const vehicle = vehiclesData.find(v => v.id === vehicleId);
      
      revenueByVehicleWithDetails[vehicleId] = {
        ...revenueByVehicle[vehicleId],
        registration: vehicle?.registration || revenueByVehicle[vehicleId].registration || 'Unknown',
        make: vehicle?.make || revenueByVehicle[vehicleId].make || 'Unknown',
        model: vehicle?.model || revenueByVehicle[vehicleId].model || '',
        image: vehicle?.images || null
      };
    });

    // Calculate Profit/Loss
    const netProfit = totalRevenue - expenseAmount;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    setStats({
      totalRevenue,
      totalBookings: bookingsData.length,
      completedBookings: completed.length,
      pendingBookings: pending.length,
      cancelledBookings: cancelled.length,
      averageRevenue: completed.length > 0 ? completedRevenue / completed.length : 0,
      totalDays,
      revenueByVehicle: revenueByVehicleWithDetails,
      totalDebt,
      debtCount,
      totalExpenses: expenseAmount,
      netProfit,
      profitMargin,
      totalDiscount
    });
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

  const formatCurrency = (amount) => {
    return `KSh ${(amount || 0).toLocaleString()}`;
  };

  const getVehicleDetails = (vehicleId) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { label: '📌 Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      completed: { label: '✅ Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { label: '❌ Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    return statusMap[status] || { 
      label: status || 'Pending', 
      color: 'bg-gray-100 text-gray-800', 
      icon: Clock 
    };
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      PAID: { label: '✅ Paid', color: 'bg-green-100 text-green-800' },
      PENDING: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800' },
      PARTIAL: { label: '🔄 Partial', color: 'bg-blue-100 text-blue-800' }
    };
    return statusMap[status] || { label: status || 'Pending', color: 'bg-gray-100 text-gray-800' };
  };

  const getStatusDot = (status) => {
    const dotMap = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return dotMap[status] || 'bg-gray-400';
  };

  const formatDateTime = (dateString) => {
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
  };

  const getFilteredBookings = () => {
    let filtered = [...bookings];
    
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(b => {
        const vehicle = getVehicleDetails(b.vehicleId);
        return vehicle?.registration?.toLowerCase().includes(searchLower) ||
               vehicle?.make?.toLowerCase().includes(searchLower) ||
               vehicle?.model?.toLowerCase().includes(searchLower);
      });
    }
    
    if (filterPeriod === 'completed') {
      filtered = filtered.filter(b => b.status === 'completed' || b.status === 'confirmed');
    } else if (filterPeriod === 'pending') {
      filtered = filtered.filter(b => b.status === 'pending');
    } else if (filterPeriod === 'cancelled') {
      filtered = filtered.filter(b => b.status === 'cancelled');
    } else if (filterPeriod === 'debt') {
      filtered = filtered.filter(b => (b.remainingBalance || 0) > 0);
    }
    
    return filtered;
  };

  const filteredBookings = getFilteredBookings();

  const revenueByVehicleArray = Object.keys(stats.revenueByVehicle).map(key => ({
    id: key,
    ...stats.revenueByVehicle[key]
  }));

  const filterOptions = [
    { value: 'all', label: 'All Bookings' },
    { value: 'completed', label: 'Completed' },
    { value: 'pending', label: 'Pending' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'debt', label: 'Has Debt' }
  ];

  // Summary cards
  const summaryCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      subtitle: `After discounts: ${formatCurrency(stats.totalDiscount)} total discount`
    },
    {
      title: 'Total Expenses',
      value: formatCurrency(stats.totalExpenses),
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      subtitle: `From ${expenses.length} expense(s)`
    },
    {
      title: 'Net Profit / Loss',
      value: formatCurrency(stats.netProfit),
      icon: stats.netProfit >= 0 ? TrendingUp : TrendingDown,
      color: stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.netProfit >= 0 ? 'bg-green-50' : 'bg-red-50',
      subtitle: `${stats.profitMargin >= 0 ? 'Profit' : 'Loss'} margin: ${stats.profitMargin.toFixed(1)}%`
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      subtitle: `${stats.pendingBookings} pending, ${stats.completedBookings} completed`
    },
    {
      title: 'Total Rental Days',
      value: stats.totalDays,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      subtitle: `from ${stats.totalBookings} bookings`
    },
    {
      title: 'Total Discounts',
      value: formatCurrency(stats.totalDiscount),
      icon: Tag,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      subtitle: 'Applied to bookings'
    },
    {
      title: 'Total Debt Outstanding',
      value: formatCurrency(stats.totalDebt),
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      subtitle: `${stats.debtCount} booking(s) with debt`
    }
  ];

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

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <DollarSign size={24} />
                <div>
                  <h2 className="text-lg font-semibold">Revenue Details</h2>
                  <p className="text-sm text-green-100">Booking #{selectedBooking.id?.slice(0, 10)}...</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Customer Info - Only name */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer</h3>
                <div className="grid grid-cols-1 gap-3 bg-gray-50 rounded-lg p-4">
                  <div><span className="text-xs text-gray-500">Name:</span> <span className="text-sm font-medium">{selectedBooking.customerName}</span></div>
                  <div><span className="text-xs text-gray-500">Status:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusBadge(selectedBooking.status).color}`}>{getStatusBadge(selectedBooking.status).label}</span></div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Vehicle</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div><span className="text-xs text-gray-500">Vehicle:</span> <span className="text-sm font-medium">{selectedBooking.vehicleRegistration || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">Make/Model:</span> <span className="text-sm font-medium">{selectedBooking.vehicleMake || 'N/A'} {selectedBooking.vehicleModel || ''}</span></div>
                  <div><span className="text-xs text-gray-500">Daily Rate:</span> <span className="text-sm font-medium">KSh {selectedBooking.vehiclePricePerDay?.toLocaleString() || 0}</span></div>
                </div>
              </div>

              {/* Revenue Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Revenue Details</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500">Start:</span>
                    <span className="text-sm font-medium ml-1">{formatDateTime(selectedBooking.startDate)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500">End:</span>
                    <span className="text-sm font-medium ml-1">{formatDateTime(selectedBooking.endDate)}</span>
                  </div>
                  <div><span className="text-xs text-gray-500">Days:</span> <span className="text-sm font-medium">{selectedBooking.days || 0} days</span></div>
                  <div><span className="text-xs text-gray-500">Daily Rate:</span> <span className="text-sm font-medium">KSh {selectedBooking.vehiclePricePerDay?.toLocaleString() || 0}</span></div>
                  
                  {/* Show discount if applied */}
                  {selectedBooking.discountAmount > 0 && (
                    <div className="col-span-2">
                      <span className="text-xs text-red-500">Discount Applied:</span>
                      <span className="text-sm font-medium text-red-500 ml-1">
                        -KSh {(() => {
                          const base = (selectedBooking.vehiclePricePerDay || 0) * (selectedBooking.days || 0);
                          if (selectedBooking.discountType === 'PERCENTAGE') {
                            return (base * parseFloat(selectedBooking.discountValue || 0) / 100).toLocaleString();
                          } else if (selectedBooking.discountType === 'FIXED') {
                            return ((selectedBooking.discountAmount || 0) * (selectedBooking.days || 1)).toLocaleString();
                          }
                          return (selectedBooking.discountAmount || 0).toLocaleString();
                        })()}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({selectedBooking.discountType === 'PERCENTAGE' ? `${selectedBooking.discountValue}% of total` : 
                          selectedBooking.discountType === 'FIXED' ? `KES ${selectedBooking.discountValue}/day` : 'None'})
                      </span>
                    </div>
                  )}
                  
                  <div className="col-span-2 border-t border-gray-200 pt-2">
                    <span className="text-xs text-gray-500 font-semibold">Total Revenue:</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(calculateBookingRevenue(selectedBooking))}
                    </span>
                    {selectedBooking.discountAmount > 0 && (
                      <span className="text-xs text-gray-400 ml-2">
                        (after discount)
                      </span>
                    )}
                  </div>
                  
                  {(selectedBooking.remainingBalance || 0) > 0 && (
                    <div className="col-span-2 border-t border-red-200 pt-2">
                      <span className="text-xs text-gray-500 font-semibold">Remaining Balance (Debt):</span>
                      <span className="text-lg font-bold text-red-600 ml-1">
                        {formatCurrency(selectedBooking.remainingBalance)}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div><span className="text-xs text-gray-500">Method:</span> <span className="text-sm font-medium">{selectedBooking.paymentMethod || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">Status:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getPaymentStatusBadge(selectedBooking.paymentStatus || 'PENDING').color}`}>{selectedBooking.paymentStatus || 'Pending'}</span></div>
                  {(selectedBooking.paidAmount || 0) > 0 && (
                    <div><span className="text-xs text-gray-500">Amount Paid:</span> <span className="text-sm font-medium text-green-600">{formatCurrency(selectedBooking.paidAmount)}</span></div>
                  )}
                </div>
              </div>

              {selectedBooking.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{selectedBooking.notes}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Revenue</h1>
          <p className="text-gray-500 text-sm mt-1">Track your earnings, expenses, and profitability</p>
          {carOwner && (
            <p className="text-xs text-green-600 mt-1">👤 {carOwner.name}</p>
          )}
          {expenses.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">📋 {expenses.length} expense(s) loaded</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (ownerId) {
                loadData(ownerId, tenantId);
              } else {
                loadFromLocalStorage();
              }
            }} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" 
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
        {summaryCards.map((card, index) => (
          <div key={index} className={`${card.bgColor} rounded-xl p-4 border border-gray-100 shadow-sm`}>
            <div className="flex items-center justify-between">
              <card.icon size={20} className={card.color} />
            </div>
            <p className={`text-xl sm:text-2xl font-bold mt-2 ${card.color}`}>
              {card.value}
            </p>
            <p className="text-xs text-gray-500 mt-1">{card.title}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{card.subtitle}</p>
          </div>
        ))}
      </div>

      {/* ================================================================ */}
      {/* MAIN SECTION: REVENUE BY VEHICLE */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-700">Revenue by Vehicle</h2>
          <p className="text-sm text-gray-500">View revenue, discounts, expenses, and profit for each vehicle</p>
        </div>
        <div className="flex items-center gap-3 mt-2 sm:mt-0">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-48"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-gray-400" />
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white w-full sm:w-auto"
            >
              {filterOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : revenueByVehicleArray.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <DollarSign size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No revenue data found</p>
          <p className="text-sm text-gray-400">Revenue will appear here when bookings are completed</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {revenueByVehicleArray.map((item) => {
            const vehicleProfit = item.revenue - (item.expenses || 0);
            const vehicle = vehicles.find(v => v.id === item.id);
            const vehicleImage = vehicle?.images || null;
            
            return (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                {/* Row 1: Image + Registration + Revenue */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {vehicleImage ? (
                      <img 
                        src={vehicleImage} 
                        alt={item.registration} 
                        className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                        style={{ objectPosition: 'center' }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                        <Car size={18} className="text-gray-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-sm truncate">{item.registration || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 truncate">
                        {item.make && item.model ? `${item.make} ${item.model}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-green-600 flex-shrink-0 ml-2">{formatCurrency(item.revenue)}</span>
                </div>
                
                {/* Row 2: Stats */}
                <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500 border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} className="text-blue-500" />
                    <span>{item.days}d</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Car size={14} className="text-gray-400" />
                    <span>{item.bookings}b</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600 font-medium">
                    <DollarSign size={14} />
                    <span>Avg {formatCurrency(item.revenue / (item.bookings || 1))}</span>
                  </div>
                  {item.discount > 0 && (
                    <div className="flex items-center gap-1 text-red-500">
                      <Tag size={14} />
                      <span>-{formatCurrency(item.discount)}</span>
                    </div>
                  )}
                </div>
                
                {/* Row 3: Profitability */}
                <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3 text-xs">
                    {(item.expenses || 0) > 0 && (
                      <span className="text-red-600 flex items-center gap-1">
                        <TrendingDown size={14} /> {formatCurrency(item.expenses)}
                      </span>
                    )}
                    <span className={vehicleProfit >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                      {vehicleProfit >= 0 ? '📈' : '📉'} {formatCurrency(vehicleProfit)}
                    </span>
                  </div>
                  {item.debt > 0 && (
                    <span className="text-red-600 text-xs flex items-center gap-1">
                      <AlertCircle size={14} /> {formatCurrency(item.debt)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

export default Revenue;