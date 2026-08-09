import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Search, Filter, Download, Eye, Edit, 
  Trash2, CheckCircle, XCircle, Clock, Users,
  Truck, CreditCard, MoreVertical, ChevronDown,
  AlertCircle, X, Building, Calendar, DollarSign,
  RefreshCw, Hotel, Plane, Compass, MapPin, Car,
  BookOpen, TrendingUp, PieChart, Shield
} from 'lucide-react';
import { 
  tenantService, userService, vehicleService, bookingService, 
  tourPackageService, hajjPackageService, hotelService, 
  flightService, carOwnerService, visaService,
  dashboardService, reportService
} from '../../services/api';

const Tenants = ({ setActiveTab }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(null);
  
  // Cache for tenant data to avoid repeated API calls
  const [tenantDataCache, setTenantDataCache] = useState({});

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================
  // LOAD DATA FROM API
  // ============================================
  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      console.log('🔍 Loading tenants from API...');

      // 1. Get all tenants
      const tenantsResponse = await tenantService.getAll();
      const tenantData = tenantsResponse?.data || tenantsResponse || [];
      console.log(`📋 Found ${tenantData.length} tenants from API`);

      // 2. For each tenant, fetch their data
      const enrichedTenants = [];
      const cache = {};

      for (const tenant of tenantData) {
        const tenantId = tenant.id;
        console.log(`📊 Loading data for tenant: ${tenant.name} (${tenantId})`);

        try {
          // Fetch all data for this tenant in parallel
          const [
            usersRes,
            vehiclesRes,
            bookingsRes,
            toursRes,
            hajjRes,
            hotelsRes,
            flightsRes,
            ownersRes,
            visasRes,
            statsRes,
            revenueRes
          ] = await Promise.all([
            userService.getByTenant(tenantId).catch(() => ({ success: true, data: [] })),
            vehicleService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
            bookingService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
            tourPackageService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
            hajjPackageService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
            hotelService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
            flightService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
            carOwnerService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
            visaService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
            dashboardService.getStats(tenantId).catch(() => ({ success: true, data: {} })),
            reportService.getRevenueReport(tenantId).catch(() => ({ success: true, data: {} }))
          ]);

          // Extract data
          const users = usersRes?.data || usersRes || [];
          const vehicles = vehiclesRes?.data || vehiclesRes || [];
          const bookings = bookingsRes?.data || bookingsRes || [];
          const tours = toursRes?.data || toursRes || [];
          const hajjPackages = hajjRes?.data || hajjRes || [];
          const hotels = hotelsRes?.data || hotelsRes || [];
          const flights = flightsRes?.data || flightsRes || [];
          const carOwners = ownersRes?.data || ownersRes || [];
          const visas = visasRes?.data || visasRes || [];
          const stats = statsRes?.data || statsRes || {};
          const revenue = revenueRes?.data || revenueRes || {};

          // Calculate revenue from bookings
          const bookingRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
          
          // Calculate visa revenue
          const approvedVisas = visas.filter(v => v.status === 'approved' || v.status === 'Approved');
          const visaRevenue = approvedVisas.reduce((sum, v) => sum + (parseFloat(v.cost) || 0), 0);

          // Cache the data
          cache[tenantId] = {
            users: users.length,
            vehicles: vehicles.length,
            bookings: bookings.length,
            tours: tours.length,
            hajjPackages: hajjPackages.length,
            hotels: hotels.length,
            flights: flights.length,
            carOwners: carOwners.length,
            visas: visas.length,
            revenue: bookingRevenue + visaRevenue,
            totalRevenue: stats.totalRevenue || revenue.totalRevenue || 0
          };

          // Build enriched tenant object
          enrichedTenants.push({
            ...tenant,
            users: users.length,
            vehicles: vehicles.length,
            bookings: bookings.length,
            tours: tours.length,
            hajjPackages: hajjPackages.length,
            hotels: hotels.length,
            flights: flights.length,
            carOwners: carOwners.length,
            visas: visas.length,
            revenue: bookingRevenue + visaRevenue,
            totalRevenue: stats.totalRevenue || revenue.totalRevenue || 0,
            joined: tenant.createdAt ? new Date(tenant.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            lastActive: tenant.updatedAt ? new Date(tenant.updatedAt).toLocaleString() : new Date().toLocaleString(),
            status: tenant.status || 'Active',
            plan: tenant.plan || 'Enterprise'
          });

        } catch (tenantError) {
          console.error(`❌ Error loading data for tenant ${tenantId}:`, tenantError);
          // Add tenant with minimal data
          enrichedTenants.push({
            ...tenant,
            users: 0,
            vehicles: 0,
            bookings: 0,
            tours: 0,
            hajjPackages: 0,
            hotels: 0,
            flights: 0,
            carOwners: 0,
            visas: 0,
            revenue: 0,
            totalRevenue: 0,
            joined: tenant.createdAt ? new Date(tenant.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            lastActive: tenant.updatedAt ? new Date(tenant.updatedAt).toLocaleString() : new Date().toLocaleString(),
            status: tenant.status || 'Active',
            plan: tenant.plan || 'Enterprise'
          });
        }
      }

      setTenantDataCache(cache);
      setTenants(enrichedTenants);
      console.log(`✅ Loaded ${enrichedTenants.length} tenants with data`);

    } catch (error) {
      console.error('❌ Error loading tenants:', error);
      showNotification('Error loading tenants from API', 'error');
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
      console.warn('⚠️ Loading tenants from localStorage (fallback)');
      
      const storedTenants = JSON.parse(localStorage.getItem('travel_agency_tenants') || '[]');
      const storedUsers = JSON.parse(localStorage.getItem('travel_agency_users') || '[]');
      const storedBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      const storedGuestBookings = JSON.parse(localStorage.getItem('travel_agency_guest_bookings') || '[]');
      const storedVehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
      const storedTours = JSON.parse(localStorage.getItem('travel_agency_tour_packages') || '[]');
      const storedHajj = JSON.parse(localStorage.getItem('travel_agency_hajj_packages') || '[]');
      const storedHotels = JSON.parse(localStorage.getItem('travel_agency_hotels') || '[]');
      const storedFlights = JSON.parse(localStorage.getItem('travel_agency_flights') || '[]');
      const storedCarOwners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
      const storedVisas = JSON.parse(localStorage.getItem('travel_agency_visa_applications') || '[]');

      const allBookings = [...storedBookings, ...storedGuestBookings];

      const enriched = storedTenants.map(tenant => {
        const tenantUsers = storedUsers.filter(u => u.tenant_id === tenant.id || u.tenantId === tenant.id);
        const tenantBookings = allBookings.filter(b => b.tenant_id === tenant.id || b.tenantId === tenant.id);
        const tenantVehicles = storedVehicles.filter(v => v.tenant_id === tenant.id || v.tenantId === tenant.id || v.cost_centre === tenant.id);
        const tenantTours = storedTours.filter(t => t.tenant_id === tenant.id || t.tenantId === tenant.id);
        const tenantHajj = storedHajj.filter(h => h.tenant_id === tenant.id || h.tenantId === tenant.id);
        const tenantHotels = storedHotels.filter(h => h.tenant_id === tenant.id || h.tenantId === tenant.id);
        const tenantFlights = storedFlights.filter(f => f.tenant_id === tenant.id || f.tenantId === tenant.id);
        const tenantCarOwners = storedCarOwners.filter(c => c.tenantId === tenant.id || c.tenant_id === tenant.id);
        const tenantVisas = storedVisas.filter(v => v.tenant_id === tenant.id || v.tenantId === tenant.id);
        
        const bookingRevenue = tenantBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        const approvedVisas = tenantVisas.filter(v => v.status === 'approved');
        const visaRevenue = approvedVisas.reduce((sum, v) => sum + (parseFloat(v.cost) || 0), 0);

        return {
          ...tenant,
          users: tenantUsers.length,
          vehicles: tenantVehicles.length,
          bookings: tenantBookings.length,
          tours: tenantTours.length,
          hajjPackages: tenantHajj.length,
          hotels: tenantHotels.length,
          flights: tenantFlights.length,
          carOwners: tenantCarOwners.length,
          visas: tenantVisas.length,
          revenue: bookingRevenue + visaRevenue,
          joined: tenant.createdAt ? new Date(tenant.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          lastActive: tenant.updatedAt ? new Date(tenant.updatedAt).toLocaleString() : new Date().toLocaleString(),
          status: tenant.status || 'Active',
          plan: tenant.plan || 'Enterprise'
        };
      });

      setTenants(enriched);
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  }, []);

  // ============================================
  // USE EFFECTS
  // ============================================
  useEffect(() => {
    loadData();

    // Listen for data updates
    const handleDataUpdate = () => {
      loadData();
    };

    window.addEventListener('tenantsUpdated', handleDataUpdate);
    window.addEventListener('usersUpdated', handleDataUpdate);
    window.addEventListener('bookingsUpdated', handleDataUpdate);
    window.addEventListener('vehiclesUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('tenantsUpdated', handleDataUpdate);
      window.removeEventListener('usersUpdated', handleDataUpdate);
      window.removeEventListener('bookingsUpdated', handleDataUpdate);
      window.removeEventListener('vehiclesUpdated', handleDataUpdate);
    };
  }, [loadData]);

  // ============================================
  // HELPERS
  // ============================================
  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-green-100 text-green-700',
      'active': 'bg-green-100 text-green-700',
      'Trial': 'bg-yellow-100 text-yellow-700',
      'trial': 'bg-yellow-100 text-yellow-700',
      'Past Due': 'bg-red-100 text-red-700',
      'past_due': 'bg-red-100 text-red-700',
      'Inactive': 'bg-gray-100 text-gray-700',
      'inactive': 'bg-gray-100 text-gray-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'suspended': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  // ============================================
  // FILTERS
  // ============================================
  const filteredTenants = useMemo(() => {
    let filtered = tenants;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        (t.name || '').toLowerCase().includes(term) ||
        (t.id || '').toLowerCase().includes(term) ||
        (t.email || '').toLowerCase().includes(term) ||
        (t.subdomain || '').toLowerCase().includes(term)
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(t => 
        (t.status || '').toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    return filtered;
  }, [tenants, searchTerm, statusFilter]);

  // ============================================
  // STATS
  // ============================================
  const stats = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter(t => t.status === 'Active' || t.status === 'active').length;
    const totalUsers = tenants.reduce((sum, t) => sum + (t.users || 0), 0);
    const totalRevenue = tenants.reduce((sum, t) => sum + (t.revenue || 0), 0);
    const totalBookings = tenants.reduce((sum, t) => sum + (t.bookings || 0), 0);
    const totalVehicles = tenants.reduce((sum, t) => sum + (t.vehicles || 0), 0);
    const totalTours = tenants.reduce((sum, t) => sum + (t.tours || 0), 0);
    const totalHajj = tenants.reduce((sum, t) => sum + (t.hajjPackages || 0), 0);
    const totalHotels = tenants.reduce((sum, t) => sum + (t.hotels || 0), 0);
    const totalFlights = tenants.reduce((sum, t) => sum + (t.flights || 0), 0);
    const totalVisas = tenants.reduce((sum, t) => sum + (t.visas || 0), 0);
    const totalCarOwners = tenants.reduce((sum, t) => sum + (t.carOwners || 0), 0);
    
    return { 
      total, active, totalUsers, totalRevenue, totalBookings, 
      totalVehicles, totalTours, totalHajj, totalHotels, 
      totalFlights, totalVisas, totalCarOwners 
    };
  }, [tenants]);

  // ============================================
  // OPEN DETAILS MODAL
  // ============================================
  const openDetailsModal = (tenant) => {
    setSelectedTenant(tenant);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedTenant(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading tenants...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
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

      {/* Tenant Detail Modal */}
      {showDetailsModal && selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={closeDetailsModal}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <button 
              onClick={closeDetailsModal}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
            >
              <X size={24} className="text-gray-500 hover:text-gray-700" />
            </button>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
              <h2 className="text-2xl font-bold text-white">{selectedTenant.name}</h2>
              <p className="text-blue-100 text-sm">Tenant Details & Performance</p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Tenant ID</p>
                  <p className="text-sm font-mono">{selectedTenant.id}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Subdomain</p>
                  <p className="text-sm font-medium">{selectedTenant.subdomain || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusColor(selectedTenant.status)}`}>
                    {selectedTenant.status}
                  </span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Plan</p>
                  <p className="text-sm font-medium">{selectedTenant.plan}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-3 rounded-lg text-center border border-blue-100">
                  <Users size={18} className="mx-auto text-blue-600 mb-1" />
                  <p className="text-xl font-bold text-blue-700">{selectedTenant.users}</p>
                  <p className="text-xs text-blue-600">Total Users</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg text-center border border-green-100">
                  <DollarSign size={18} className="mx-auto text-green-600 mb-1" />
                  <p className="text-xl font-bold text-green-700">KSh {selectedTenant.revenue.toLocaleString()}</p>
                  <p className="text-xs text-green-600">Total Revenue</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg text-center border border-orange-100">
                  <Calendar size={18} className="mx-auto text-orange-600 mb-1" />
                  <p className="text-xl font-bold text-orange-700">{selectedTenant.bookings}</p>
                  <p className="text-xs text-orange-600">Total Bookings</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg text-center border border-purple-100">
                  <Truck size={18} className="mx-auto text-purple-600 mb-1" />
                  <p className="text-xl font-bold text-purple-700">{selectedTenant.vehicles}</p>
                  <p className="text-xs text-purple-600">Total Vehicles</p>
                </div>
                <div className="bg-indigo-50 p-3 rounded-lg text-center border border-indigo-100">
                  <Compass size={18} className="mx-auto text-indigo-600 mb-1" />
                  <p className="text-xl font-bold text-indigo-700">{selectedTenant.tours}</p>
                  <p className="text-xs text-indigo-600">Total Tours</p>
                </div>
                <div className="bg-pink-50 p-3 rounded-lg text-center border border-pink-100">
                  <Hotel size={18} className="mx-auto text-pink-600 mb-1" />
                  <p className="text-xl font-bold text-pink-700">{selectedTenant.hotels}</p>
                  <p className="text-xs text-pink-600">Total Hotels</p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg text-center border border-yellow-100">
                  <Plane size={18} className="mx-auto text-yellow-600 mb-1" />
                  <p className="text-xl font-bold text-yellow-700">{selectedTenant.flights}</p>
                  <p className="text-xs text-yellow-600">Total Flights</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg text-center border border-red-100">
                  <Shield size={18} className="mx-auto text-red-600 mb-1" />
                  <p className="text-xl font-bold text-red-700">{selectedTenant.visas}</p>
                  <p className="text-xs text-red-600">Total Visas</p>
                </div>
                <div className="bg-amber-50 p-3 rounded-lg text-center border border-amber-100">
                  <Car size={18} className="mx-auto text-amber-600 mb-1" />
                  <p className="text-xl font-bold text-amber-700">{selectedTenant.carOwners}</p>
                  <p className="text-xs text-amber-600">Car Owners</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button 
                  onClick={closeDetailsModal}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    closeDetailsModal();
                    setActiveTab('tenant-form');
                  }}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit size={16} className="inline mr-1" /> Edit Tenant
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <Building size={24} className="text-blue-600" />
              Tenant Management
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Manage all tenants on the platform · 
              <span className="font-medium text-gray-700 ml-1">{stats.total} tenants</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadData}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => setActiveTab('tenant-form')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus size={16} /> Tenant
            </button>
            <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-200 flex items-center gap-2">
              <Download size={16} /> Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Total Tenants</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Active Tenants</p>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-blue-600">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">KSh {stats.totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search tenants..." 
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-40 sm:w-56"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 py-2 text-sm bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-1"
            >
              <Filter size={14} /> Filters
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Showing {filteredTenants.length} tenants</span>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select 
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Active">✅ Active</option>
                <option value="Trial">⏳ Trial</option>
                <option value="Past Due">⚠️ Past Due</option>
                <option value="Inactive">❌ Inactive</option>
                <option value="pending">⏳ Pending</option>
                <option value="suspended">⛔ Suspended</option>
              </select>
              <select className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white">
                <option value="all">All Plans</option>
                <option value="Basic">Basic</option>
                <option value="Pro">Pro</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Tenants Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {filteredTenants.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                  <tr>
                    <th className="p-3">Tenant</th>
                    <th className="p-3 hidden md:table-cell">Subdomain</th>
                    <th className="p-3">Users</th>
                    <th className="p-3 hidden lg:table-cell">Vehicles</th>
                    <th className="p-3">Bookings</th>
                    <th className="p-3">Revenue</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div>
                          <p className="font-medium text-sm">{tenant.name}</p>
                          <p className="text-xs text-gray-500">{tenant.email || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="p-3 text-sm hidden md:table-cell">
                        <span className="text-xs font-mono text-gray-500">{tenant.subdomain || 'N/A'}</span>
                      </td>
                      <td className="p-3 text-sm">
                        <span className="font-medium">{tenant.users}</span>
                      </td>
                      <td className="p-3 text-sm hidden lg:table-cell">
                        <span className="font-medium">{tenant.vehicles}</span>
                      </td>
                      <td className="p-3 text-sm">
                        <span className="font-medium">{tenant.bookings}</span>
                      </td>
                      <td className="p-3 text-sm">
                        <span className="font-medium text-green-600">KSh {tenant.revenue.toLocaleString()}</span>
                      </td>
                      <td className="p-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(tenant.status)}`}>
                          {tenant.status || 'Active'}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => openDetailsModal(tenant)}
                            className="p-1 hover:bg-gray-200 rounded text-blue-600" 
                            title="View Details"
                          >
                            <Eye size={14} />
                          </button>
                          <button 
                            onClick={() => {
                              setActiveTab('tenant-form');
                              // You could pass the tenant data via state or context
                            }}
                            className="p-1 hover:bg-gray-200 rounded text-green-600" 
                            title="Edit"
                          >
                            <Edit size={14} />
                          </button>
                          <button className="p-1 hover:bg-gray-200 rounded text-red-600" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-gray-600">
                Total: <span className="font-semibold">{filteredTenants.length}</span> tenants · 
                <span className="ml-2">{stats.totalUsers} users · {stats.totalVehicles} vehicles · {stats.totalBookings} bookings</span>
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Rows per page: 10</span>
                <span>1-{Math.min(filteredTenants.length, 10)} of {filteredTenants.length}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Building size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="font-medium">No tenants found</p>
            <p className="text-sm">Create a tenant to get started</p>
            <button 
              onClick={() => setActiveTab('tenant-form')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Add Tenant
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

export default Tenants;