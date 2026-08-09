import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, Truck, Server, AlertTriangle, CheckCircle, Check,
  Activity, BarChart3, TrendingUp, TrendingDown,
  Clock, DollarSign, Shield, Zap, Globe, ChevronRight,
  X, RefreshCw, Calendar, Package, Building,
  Plane, Hotel, Compass, MapPin, Car,
  Award, CreditCard, Wallet, PieChart,
  TrendingUp as TrendingUpIcon, Filter, UserCheck,
  UserPlus, Clock as ClockIcon, UserX, ArrowRight
} from 'lucide-react';
import { 
  userService, tenantService, vehicleService, bookingService, 
  tourPackageService, hajjPackageService, hotelService, 
  flightService, carOwnerService, visaService, 
  dashboardService, reportService 
} from '../../services/api';

const AdminDashboard = ({ setActiveTab }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedTenant, setSelectedTenant] = useState('all');
  const [tenantList, setTenantList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState({ fleetManagers: [], carOwners: [] });
  const [processingApproval, setProcessingApproval] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  
  // Data states
  const [tenants, setTenants] = useState([]);
  const [users, setUsers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [tours, setTours] = useState([]);
  const [hajjPackages, setHajjPackages] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [flights, setFlights] = useState([]);
  const [carOwners, setCarOwners] = useState([]);
  const [visas, setVisas] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTenants: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    totalCommission: 0,
    activeTours: 0,
    hajjPackages: 0,
    hotels: 0,
    flights: 0,
    carOwners: 0,
    visaApplications: 0,
    approvedVisas: 0,
    visaRevenue: 0,
    totalDebt: 0,
    debtCount: 0,
    pendingFleetManagers: 0,
    pendingCarOwners: 0
  });

  // Revenue breakdown
  const [revenueBreakdown, setRevenueBreakdown] = useState({
    carHire: 0,
    tours: 0,
    hajj: 0,
    hotels: 0,
    flights: 0,
    visa: 0
  });

  // Booking counts by service
  const [bookingCounts, setBookingCounts] = useState({
    carHire: 0,
    tours: 0,
    hajj: 0,
    hotels: 0,
    flights: 0,
    visa: 0
  });

  // Helper function to filter data by period
  const filterDataByPeriod = (data, period, dateField = 'createdAt') => {
    if (period === 'all' || !period || !data || data.length === 0) return data;
    
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
      case 'day':
        startDate.setDate(now.getDate() - 1);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return data;
    }

    return data.filter(item => {
      const itemDate = new Date(item[dateField] || item.created_at || item.bookingDate || item.booking_date || item.applicationDate || item.application_date);
      return itemDate >= startDate && itemDate <= now;
    });
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load tenants for filter dropdown
  const loadTenantList = useCallback(async () => {
    try {
      const response = await tenantService.getAll().catch(() => ({ success: true, data: [] }));
      const tenantData = response?.data || response || [];
      setTenantList(tenantData);
      
      if (tenantData.length === 1) {
        setSelectedTenant(tenantData[0].id);
      }
    } catch (error) {
      console.error('Error loading tenant list:', error);
    }
  }, []);

  // Load pending approvals
  const loadPendingApprovals = useCallback(async () => {
    try {
      // Get all users
      const usersResponse = await userService.getAll();
      const allUsers = usersResponse?.data || usersResponse || [];
      
      // Get all car owners
      const carOwnersResponse = await carOwnerService.getAll();
      const allCarOwners = carOwnersResponse?.data || carOwnersResponse || [];
      
      // Filter pending Fleet Managers (role = fleet_manager and status = pending)
      const pendingFMs = allUsers.filter(u => 
        u.role === 'fleet_manager' && u.status === 'pending'
      );
      
      // Filter pending Car Owners (role = car_owner and status = pending)
      const pendingCOs = allUsers.filter(u => 
        u.role === 'car_owner' && u.status === 'pending'
      );
      
      // Get car owner profiles for pending car owners
      const pendingCarOwnersWithProfiles = pendingCOs.map(user => {
        const profile = allCarOwners.find(co => co.userId === user.id || co.user_id === user.id);
        return { ...user, profile };
      });
      
      setPendingApprovals({
        fleetManagers: pendingFMs,
        carOwners: pendingCarOwnersWithProfiles
      });
      
      setStats(prev => ({
        ...prev,
        pendingFleetManagers: pendingFMs.length,
        pendingCarOwners: pendingCOs.length
      }));
      
    } catch (error) {
      console.error('Error loading pending approvals:', error);
    }
  }, []);

  // Approve Fleet Manager
  const approveFleetManager = async (userId) => {
    setProcessingApproval(userId);
    try {
      const user = users.find(u => u.id === userId);
      if (!user) {
        showNotification('User not found', 'error');
        setProcessingApproval(null);
        return;
      }
      
      const updateData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: 'active'
      };
      
      const response = await userService.update(userId, updateData);
      
      if (response?.success) {
        showNotification('✅ Fleet Manager approved successfully!', 'success');
        await loadPendingApprovals();
        await loadData(selectedPeriod, selectedTenant);
      } else {
        showNotification('Failed to approve Fleet Manager', 'error');
      }
    } catch (error) {
      console.error('Error approving Fleet Manager:', error);
      showNotification('Error approving Fleet Manager', 'error');
    }
    setProcessingApproval(null);
  };

  // Approve Car Owner
  const approveCarOwner = async (userId) => {
    setProcessingApproval(userId);
    try {
      const carOwner = carOwners.find(co => co.userId === userId || co.user_id === userId);
      if (!carOwner) {
        showNotification('Car owner profile not found', 'error');
        setProcessingApproval(null);
        return;
      }
      
      const approveResponse = await carOwnerService.approve(carOwner.id);
      
      if (approveResponse?.success) {
        const user = users.find(u => u.id === userId);
        if (user) {
          const updateData = {
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: 'active'
          };
          await userService.update(userId, updateData);
        }
        
        showNotification('✅ Car Owner approved successfully!', 'success');
        await loadPendingApprovals();
        await loadData(selectedPeriod, selectedTenant);
      } else {
        showNotification('Failed to approve Car Owner', 'error');
      }
    } catch (error) {
      console.error('Error approving Car Owner:', error);
      showNotification('Error approving Car Owner', 'error');
    }
    setProcessingApproval(null);
  };

  // Reject/Delete pending user
  const rejectUser = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this registration? The user will be deleted.')) return;
    
    setProcessingApproval(userId);
    try {
      const response = await userService.delete(userId);
      
      if (response?.success) {
        showNotification('User registration rejected and deleted', 'success');
        await loadPendingApprovals();
        await loadData(selectedPeriod, selectedTenant);
      } else {
        showNotification('Failed to reject user', 'error');
      }
    } catch (error) {
      console.error('Error rejecting user:', error);
      showNotification('Error rejecting user', 'error');
    }
    setProcessingApproval(null);
  };

  const loadData = useCallback(async (period = selectedPeriod, tenantFilter = selectedTenant) => {
    setLoading(true);

    try {
      console.log(`🔍 Loading admin dashboard data for period: ${period}, tenant: ${tenantFilter}`);

      const tenantsResponse = await tenantService.getAll().catch(() => ({ success: true, data: [] }));
      const allTenants = tenantsResponse?.data || tenantsResponse || [];
      
      let tenantsToLoad = allTenants;
      if (tenantFilter !== 'all') {
        tenantsToLoad = allTenants.filter(t => t.id === tenantFilter);
      }
      
      console.log(`📋 Found ${tenantsToLoad.length} tenants to load`);

      let allUsers = [];
      let allVehicles = [];
      let allBookings = [];
      let allTours = [];
      let allHajj = [];
      let allHotels = [];
      let allFlights = [];
      let allOwners = [];
      let allVisas = [];
      let totalVisaRevenue = 0;
      let totalApprovedVisas = 0;
      let totalVisaApplications = 0;

      if (tenantsToLoad.length > 0) {
        for (const tenant of tenantsToLoad) {
          const tenantId = tenant.id;
          console.log(`📊 Loading data for tenant: ${tenant.name} (${tenantId})`);
          
          try {
            const [
              usersRes,
              vehiclesRes,
              bookingsRes,
              toursRes,
              hajjRes,
              hotelsRes,
              flightsRes,
              ownersRes,
              visasRes
            ] = await Promise.all([
              userService.getByTenant(tenantId).catch(() => ({ success: true, data: [] })),
              vehicleService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
              bookingService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
              tourPackageService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
              hajjPackageService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
              hotelService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
              flightService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
              carOwnerService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
              visaService.getAll(tenantId).catch(() => ({ success: true, data: [] }))
            ]);

            allUsers = [...allUsers, ...(usersRes?.data || usersRes || [])];
            allVehicles = [...allVehicles, ...(vehiclesRes?.data || vehiclesRes || [])];
            allBookings = [...allBookings, ...(bookingsRes?.data || bookingsRes || [])];
            allTours = [...allTours, ...(toursRes?.data || toursRes || [])];
            allHajj = [...allHajj, ...(hajjRes?.data || hajjRes || [])];
            allHotels = [...allHotels, ...(hotelsRes?.data || hotelsRes || [])];
            allFlights = [...allFlights, ...(flightsRes?.data || flightsRes || [])];
            allOwners = [...allOwners, ...(ownersRes?.data || ownersRes || [])];
            
            const tenantVisas = visasRes?.data || visasRes || [];
            allVisas = [...allVisas, ...tenantVisas];
            
            const approvedVisas = tenantVisas.filter(v => 
              v.status === 'approved' || v.status === 'Approved'
            );
            totalApprovedVisas += approvedVisas.length;
            totalVisaApplications += tenantVisas.length;
            
            const visaRevenue = approvedVisas.reduce((sum, v) => {
              const cost = parseFloat(v.cost) || parseFloat(v.price) || 0;
              return sum + cost;
            }, 0);
            totalVisaRevenue += visaRevenue;

          } catch (tenantError) {
            console.error(`❌ Error loading data for tenant ${tenantId}:`, tenantError);
          }
        }
      } else {
        console.warn('⚠️ No tenants found to load');
      }

      setTenants(allTenants);

      if (period !== 'all') {
        allBookings = filterDataByPeriod(allBookings, period);
        allVisas = filterDataByPeriod(allVisas, period);
        
        const filteredApprovedVisas = allVisas.filter(v => 
          v.status === 'approved' || v.status === 'Approved'
        );
        totalApprovedVisas = filteredApprovedVisas.length;
        totalVisaApplications = allVisas.length;
        totalVisaRevenue = filteredApprovedVisas.reduce((sum, v) => {
          const cost = parseFloat(v.cost) || parseFloat(v.price) || 0;
          return sum + cost;
        }, 0);
      }

      console.log(`📊 Filtered data:`, {
        users: allUsers.length,
        tenants: tenantsToLoad.length,
        vehicles: allVehicles.length,
        bookings: allBookings.length,
        visas: allVisas.length,
        visaRevenue: totalVisaRevenue
      });

      setUsers(allUsers);
      setVehicles(allVehicles);
      setBookings(allBookings);
      setTours(allTours);
      setHajjPackages(allHajj);
      setHotels(allHotels);
      setFlights(allFlights);
      setCarOwners(allOwners);
      setVisas(allVisas);

      // Calculate stats
      const totalUsers = allUsers.length;
      const totalTenants = tenantsToLoad.length;
      const totalVehicles = allVehicles.length;
      const activeVehicles = allVehicles.filter(v => v.status === 'active' || v.status === 'Active').length;
      const totalBookings = allBookings.length;
      const pendingBookings = allBookings.filter(b => b.status === 'pending' || b.status === 'Pending').length;
      const completedBookings = allBookings.filter(b => b.status === 'completed' || b.status === 'Completed' || b.status === 'confirmed' || b.status === 'Confirmed').length;
      
      let revenueBreakdown = { carHire: 0, tours: 0, hajj: 0, hotels: 0, flights: 0, visa: 0 };
      let bookingCounts = { carHire: 0, tours: 0, hajj: 0, hotels: 0, flights: 0, visa: 0 };
      let totalRevenue = 0;
      let totalCommission = 0;

      allBookings.forEach(b => {
        const serviceType = b.serviceType || b.service_type || 'car_hire';
        const amount = b.totalPrice || b.total_price || 0;
        
        if (serviceType === 'car_hire' || serviceType === 'car' || serviceType === 'Car') {
          revenueBreakdown.carHire += amount;
          bookingCounts.carHire++;
          const carOwnerEarning = (b.vehiclePricePerDay || 0) * (b.days || 0);
          const commission = amount - carOwnerEarning;
          totalCommission += commission > 0 ? commission : 0;
        } else if (serviceType === 'tour' || serviceType === 'tour_package' || serviceType === 'Tour') {
          revenueBreakdown.tours += amount;
          bookingCounts.tours++;
        } else if (serviceType === 'hajj' || serviceType === 'hajj_umra' || serviceType === 'Hajj') {
          revenueBreakdown.hajj += amount;
          bookingCounts.hajj++;
        } else if (serviceType === 'hotel' || serviceType === 'hotel_booking' || serviceType === 'Hotel') {
          revenueBreakdown.hotels += amount;
          bookingCounts.hotels++;
        } else if (serviceType === 'flight' || serviceType === 'flight_booking' || serviceType === 'Flight') {
          revenueBreakdown.flights += amount;
          bookingCounts.flights++;
        }
        totalRevenue += amount;
      });

      revenueBreakdown.visa = totalVisaRevenue;
      bookingCounts.visa = totalVisaApplications;
      totalRevenue += totalVisaRevenue;

      const totalDebt = allBookings.reduce((sum, b) => sum + (b.remainingBalance || 0), 0);
      const debtCount = allBookings.filter(b => (b.remainingBalance || 0) > 0).length;

      setStats(prev => ({
        ...prev,
        totalUsers,
        totalTenants,
        totalVehicles,
        activeVehicles,
        totalBookings,
        pendingBookings,
        completedBookings,
        totalRevenue,
        totalCommission,
        activeTours: allTours.filter(t => t.status === 'active' || t.status === 'Active' || t.status === 'published').length,
        hajjPackages: allHajj.length,
        hotels: allHotels.length,
        flights: allFlights.length,
        carOwners: allOwners.filter(o => o.status === 'active' || o.status === 'Active').length,
        visaApplications: totalVisaApplications,
        approvedVisas: totalApprovedVisas,
        visaRevenue: totalVisaRevenue,
        totalDebt,
        debtCount
      }));

      setRevenueBreakdown(revenueBreakdown);
      setBookingCounts(bookingCounts);

      // Load pending approvals
      await loadPendingApprovals();

      const tenantName = tenantFilter === 'all' ? 'All Tenants' : 
        allTenants.find(t => t.id === tenantFilter)?.name || 'Selected Tenant';
      showNotification(`Dashboard updated for ${tenantName} (${period})`, 'success');

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      showNotification('Error loading dashboard data', 'error');
      loadFromLocalStorage(period);
    }

    setLoading(false);
  }, [selectedPeriod, selectedTenant, loadPendingApprovals]);

  // Fallback to localStorage (simplified)
  const loadFromLocalStorage = (period = selectedPeriod) => {
    try {
      console.warn(`Loading admin dashboard from localStorage for period: ${period}`);
      // ... existing localStorage code (keep the same)
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  // Load tenant list on mount
  useEffect(() => {
    loadTenantList();
  }, [loadTenantList]);

  useEffect(() => {
    loadData(selectedPeriod, selectedTenant);
  }, [loadData, selectedPeriod, selectedTenant]);

  // Get tenant name for display
  const getSelectedTenantName = () => {
    if (selectedTenant === 'all') return 'All Tenants';
    const tenant = tenantList.find(t => t.id === selectedTenant);
    return tenant?.name || 'Selected Tenant';
  };

  // Stats Cards
  const statsCards = useMemo(() => [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      subtitle: `${stats.totalUsers} registered`
    },
    {
      title: 'Total Tenants',
      value: stats.totalTenants,
      icon: Building,
      subtitle: `${stats.totalTenants} active tenants`
    },
    {
      title: 'Total Vehicles',
      value: stats.totalVehicles,
      icon: Truck,
      subtitle: `${stats.activeVehicles} active`
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: Calendar,
      subtitle: `${stats.pendingBookings} pending`
    },
    {
      title: 'Total Revenue',
      value: `KSh ${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      subtitle: 'All services combined'
    },
    {
      title: 'Total Commission',
      value: `KSh ${stats.totalCommission.toLocaleString()}`,
      icon: TrendingUpIcon,
      subtitle: 'Agency earnings'
    },
    {
      title: 'Total Debt',
      value: `KSh ${stats.totalDebt.toLocaleString()}`,
      icon: Wallet,
      subtitle: `${stats.debtCount} bookings with debt`
    },
    {
      title: 'Visa Revenue',
      value: `KSh ${stats.visaRevenue.toLocaleString()}`,
      icon: Shield,
      subtitle: `${stats.approvedVisas} approved`
    }
  ], [stats]);

  // Revenue Breakdown Cards
  const revenueCards = useMemo(() => [
    {
      title: 'Car Hire',
      value: `KSh ${revenueBreakdown.carHire.toLocaleString()}`,
      icon: Car,
      color: 'blue',
      count: bookingCounts.carHire,
      countLabel: 'bookings'
    },
    {
      title: 'Tours',
      value: `KSh ${revenueBreakdown.tours.toLocaleString()}`,
      icon: Compass,
      color: 'green',
      count: bookingCounts.tours,
      countLabel: 'bookings'
    },
    {
      title: 'Hajj & Umra',
      value: `KSh ${revenueBreakdown.hajj.toLocaleString()}`,
      icon: MapPin,
      color: 'purple',
      count: bookingCounts.hajj,
      countLabel: 'bookings'
    },
    {
      title: 'Hotels',
      value: `KSh ${revenueBreakdown.hotels.toLocaleString()}`,
      icon: Hotel,
      color: 'orange',
      count: bookingCounts.hotels,
      countLabel: 'bookings'
    },
    {
      title: 'Flights',
      value: `KSh ${revenueBreakdown.flights.toLocaleString()}`,
      icon: Plane,
      color: 'indigo',
      count: bookingCounts.flights,
      countLabel: 'bookings'
    },
    {
      title: 'Visa Processing',
      value: `KSh ${revenueBreakdown.visa.toLocaleString()}`,
      icon: Shield,
      color: 'pink',
      count: bookingCounts.visa,
      countLabel: 'applications'
    }
  ], [revenueBreakdown, bookingCounts]);

  // Service Quick Links
  const serviceLinks = useMemo(() => [
    { label: 'Tenants', icon: Building, tab: 'tenants' },
    { label: 'Users', icon: Users, tab: 'users' },
    { label: 'Vehicles', icon: Truck, tab: 'vehicles' },
    { label: 'Car Bookings', icon: Calendar, tab: 'car-bookings' },
    { label: 'Tour Packages', icon: Compass, tab: 'tour-packages' },
    { label: 'Hajj Packages', icon: MapPin, tab: 'hajj-packages' },
    { label: 'Hotels', icon: Hotel, tab: 'fleet-hotels' },
    { label: 'Flights', icon: Plane, tab: 'fleet-flights' },
    { label: 'Visa Processing', icon: Shield, tab: 'visa-processing' }
  ], []);

  // Render Pending Approvals Card (like Fleet Manager Dashboard)
  const renderPendingApprovalsCard = () => {
    const totalPending = stats.pendingFleetManagers + stats.pendingCarOwners;
    
    if (totalPending === 0) return null;
    
    return (
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
                {totalPending} User{totalPending > 1 ? 's' : ''} Pending Approval
              </h3>
              <p className="text-sm text-yellow-600">
                {stats.pendingFleetManagers > 0 && `${stats.pendingFleetManagers} Fleet Manager${stats.pendingFleetManagers > 1 ? 's' : ''}`}
                {stats.pendingFleetManagers > 0 && stats.pendingCarOwners > 0 && ' • '}
                {stats.pendingCarOwners > 0 && `${stats.pendingCarOwners} Car Owner${stats.pendingCarOwners > 1 ? 's' : ''}`}
                {' awaiting approval'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">
              {totalPending} pending
            </span>
            <ArrowRight size={20} className="text-yellow-600" />
          </div>
        </div>
      </div>
    );
  };

  // Pending Approvals Modal
  const renderApprovalModal = () => {
    if (!showApprovalModal) return null;
    
    const allPending = [...pendingApprovals.fleetManagers, ...pendingApprovals.carOwners];
    
    return (
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
                <p className="text-sm text-gray-500">{allPending.length} users waiting for approval</p>
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
            {allPending.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
                <p className="text-gray-500">No pending approvals</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Fleet Managers */}
                {pendingApprovals.fleetManagers.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Building size={14} className="text-purple-500" />
                      Fleet Managers ({pendingApprovals.fleetManagers.length})
                    </h3>
                    {pendingApprovals.fleetManagers.map((user) => (
                      <div key={user.id} className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 hover:border-yellow-300 transition-colors mb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-semibold text-sm">
                              {user.name?.charAt(0).toUpperCase() || 'F'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                              <p className="text-xs text-gray-400">Tenant: {user.tenantId ? 'Pending' : 'N/A'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => approveFleetManager(user.id)}
                              disabled={processingApproval === user.id}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              {processingApproval === user.id ? (
                                <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                              ) : (
                                <Check size={14} />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => rejectUser(user.id)}
                              disabled={processingApproval === user.id}
                              className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs hover:bg-red-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Car Owners */}
                {pendingApprovals.carOwners.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Car size={14} className="text-blue-500" />
                      Car Owners ({pendingApprovals.carOwners.length})
                    </h3>
                    {pendingApprovals.carOwners.map((user) => (
                      <div key={user.id} className="bg-blue-50 rounded-xl p-4 border border-blue-200 hover:border-blue-300 transition-colors mb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                              {user.name?.charAt(0).toUpperCase() || 'C'}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-800">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                              <p className="text-xs text-gray-400">
                                Company: {user.profile?.companyName || user.companyName || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => approveCarOwner(user.id)}
                              disabled={processingApproval === user.id}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              {processingApproval === user.id ? (
                                <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                              ) : (
                                <Check size={14} />
                              )}
                              Approve
                            </button>
                            <button
                              onClick={() => rejectUser(user.id)}
                              disabled={processingApproval === user.id}
                              className="px-3 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs hover:bg-red-200 transition-colors flex items-center gap-1 disabled:opacity-50"
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {allPending.length > 0 && (
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {allPending.length} pending approval{allPending.length > 1 ? 's' : ''}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 ${
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {notification.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          <span className="text-sm font-medium">{notification.message}</span>
          <button 
            onClick={() => setNotification(null)} 
            className="ml-2 hover:opacity-70 p-1 hover:bg-gray-200/50 rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Approval Modal */}
      {renderApprovalModal()}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Super Admin Dashboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Overview of all travel services and platform performance
            {selectedPeriod !== 'all' && ` (${selectedPeriod})`}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="appearance-none px-4 py-2 pr-10 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[180px]"
            >
              <option value="all">🌐 All Tenants</option>
              {tenantList.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  🏢 {tenant.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
              <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>

          <button 
            onClick={() => loadData(selectedPeriod, selectedTenant)}
            className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Show current filter */}
      <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
        <Filter size={14} />
        <span className="font-medium">Filter:</span>
        <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs">
          {selectedTenant === 'all' ? 'All Tenants' : getSelectedTenantName()}
        </span>
        <span className="text-gray-300">|</span>
        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs">
          {selectedPeriod === 'all' ? 'All Time' : selectedPeriod}
        </span>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {['day', 'week', 'month', 'quarter', 'year', 'all'].map((period) => (
          <button 
            key={period} 
            onClick={() => setSelectedPeriod(period)} 
            className={`px-4 py-1.5 text-sm rounded-lg capitalize transition-colors ${
              selectedPeriod === period ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {period === 'all' ? 'All Time' : period}
          </button>
        ))}
      </div>

      {/* ✅ Pending Approvals Card - Like Fleet Manager Dashboard */}
      {renderPendingApprovalsCard()}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statsCards.map((stat, index) => (
          <div 
            key={index}
            className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${
              stat.title === 'Total Commission' ? 'border-purple-200 bg-purple-50/30' : 
              stat.title === 'Total Debt' && stats.totalDebt > 0 ? 'border-red-200 bg-red-50/30' :
              stat.title === 'Visa Revenue' ? 'border-pink-200 bg-pink-50/30' : 'border-gray-100'
            }`}
          >
            <div className="flex items-center justify-between">
              <stat.icon size={18} className={
                stat.title === 'Total Commission' ? 'text-purple-500' : 
                stat.title === 'Total Debt' && stats.totalDebt > 0 ? 'text-red-500' : 
                stat.title === 'Visa Revenue' ? 'text-pink-500' : 'text-gray-400'
              } />
            </div>
            <p className={`text-xl sm:text-2xl font-bold mt-2 ${
              stat.title === 'Total Commission' ? 'text-purple-600' :
              stat.title === 'Total Debt' && stats.totalDebt > 0 ? 'text-red-600' : 
              stat.title === 'Visa Revenue' ? 'text-pink-600' : 'text-gray-800'
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

      {/* Revenue Breakdown */}
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
          <PieChart size={16} /> Revenue Breakdown by Service
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {revenueCards.map((card, index) => {
            const colorMap = {
              blue: 'from-blue-50 to-blue-100 border-blue-200 text-blue-700',
              green: 'from-green-50 to-green-100 border-green-200 text-green-700',
              purple: 'from-purple-50 to-purple-100 border-purple-200 text-purple-700',
              orange: 'from-orange-50 to-orange-100 border-orange-200 text-orange-700',
              indigo: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700',
              pink: 'from-pink-50 to-pink-100 border-pink-200 text-pink-700'
            };
            return (
              <div 
                key={index}
                className={`bg-gradient-to-br ${colorMap[card.color]} border rounded-xl p-4 text-center shadow-sm hover:shadow-md transition-shadow`}
              >
                <card.icon size={20} className={`mx-auto ${card.color === 'blue' ? 'text-blue-600' : card.color === 'green' ? 'text-green-600' : card.color === 'purple' ? 'text-purple-600' : card.color === 'orange' ? 'text-orange-600' : card.color === 'indigo' ? 'text-indigo-600' : 'text-pink-600'} mb-1`} />
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

      {/* Main Grid - Tenant Activity & Platform Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building size={18} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-700">Tenant Activity</h2>
            </div>
            <button 
              onClick={() => setActiveTab('tenants')}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="p-4 sm:p-6">
            {tenants.length > 0 ? (
              <div className="space-y-3">
                {tenants.slice(0, 5).map((tenant, index) => {
                  const tenantVehicles = vehicles.filter(v => v.tenant_id === tenant.id || v.cost_centre === tenant.id || v.tenantId === tenant.id);
                  const activeVehicles = tenantVehicles.filter(v => v.status === 'active' || v.status === 'Active');
                  const hasVehicles = tenantVehicles.length > 0;
                  
                  return (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 cursor-pointer transition-all duration-200 border border-transparent hover:border-blue-200 group"
                      onClick={() => setActiveTab('tenants')}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${hasVehicles ? 'bg-blue-600' : 'bg-gray-400'}`}>
                          {tenant.name ? tenant.name.charAt(0).toUpperCase() : 'T'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 group-hover:text-blue-600 transition-colors">
                            {tenant.name || 'Unnamed Tenant'}
                          </p>
                          <div className="flex items-center gap-3 text-sm">
                            <span className={`flex items-center gap-1 ${hasVehicles ? 'text-gray-600' : 'text-gray-400'}`}>
                              <Truck size={12} className={hasVehicles ? 'text-blue-500' : 'text-gray-400'} />
                              {tenantVehicles.length} vehicles
                            </span>
                            {activeVehicles.length > 0 && (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle size={12} />
                                {activeVehicles.length} active
                              </span>
                            )}
                            {!hasVehicles && (
                              <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                                No vehicles
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {hasVehicles && (
                          <span className={`text-sm font-medium px-2 py-1 rounded-full ${activeVehicles.length > 0 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {activeVehicles.length > 0 ? 'Active' : 'Inactive'}
                          </span>
                        )}
                        <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Building size={32} className="text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No tenants registered</p>
                <p className="text-sm text-gray-400 mt-1">Tenants will appear here once they register</p>
                <button 
                  onClick={() => setActiveTab('tenants')}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  Add Tenant
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Platform Summary */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Platform Summary</h2>
          </div>
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Users size={20} className="mx-auto text-gray-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{stats.totalUsers}</p>
                <p className="text-[10px] text-gray-400">Users</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Building size={20} className="mx-auto text-gray-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{stats.totalTenants}</p>
                <p className="text-[10px] text-gray-400">Tenants</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Truck size={20} className="mx-auto text-gray-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{stats.totalVehicles}</p>
                <p className="text-[10px] text-gray-400">Vehicles</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Calendar size={20} className="mx-auto text-gray-500 mb-1" />
                <p className="text-xl font-bold text-gray-800">{stats.totalBookings}</p>
                <p className="text-[10px] text-gray-400">Bookings</p>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
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
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-2">Service Stats</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-400">Tours:</span> <span className="font-medium">{stats.activeTours}</span></div>
                <div><span className="text-gray-400">Hajj Packages:</span> <span className="font-medium">{stats.hajjPackages}</span></div>
                <div><span className="text-gray-400">Hotels:</span> <span className="font-medium">{stats.hotels}</span></div>
                <div><span className="text-gray-400">Flights:</span> <span className="font-medium">{stats.flights}</span></div>
                <div><span className="text-gray-400">Car Owners:</span> <span className="font-medium">{stats.carOwners}</span></div>
                <div className="text-indigo-600"><span className="text-gray-400">Visa Apps:</span> <span className="font-medium">{stats.visaApplications}</span></div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-600 mb-2">Revenue Quick Stats</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Revenue:</span>
                  <span className="font-medium text-green-600">KSh {stats.totalRevenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Commission:</span>
                  <span className="font-medium text-purple-600">KSh {stats.totalCommission.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Visa Revenue:</span>
                  <span className="font-medium text-pink-600">KSh {stats.visaRevenue.toLocaleString()}</span>
                </div>
                {stats.totalDebt > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Outstanding Debt:</span>
                    <span className="font-medium text-red-600">KSh {stats.totalDebt.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
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

export default AdminDashboard;