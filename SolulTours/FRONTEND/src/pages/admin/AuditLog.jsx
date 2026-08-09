import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Filter, Download, Eye, Calendar,
  User, Shield, Truck, Settings, AlertCircle,
  ChevronDown, ChevronUp, Clock, MapPin,
  FileText, AlertTriangle, CheckCircle, XCircle,
  Car, Compass, Hotel, Plane, MapPin as MapPinIcon,
  RefreshCw, X, Building, CreditCard, Users
} from 'lucide-react';
import { auditLogService, tenantService } from '../../services/api';

const AuditLog = ({ setActiveTab }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState([]);
  const [filterAction, setFilterAction] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [tenants, setTenants] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // ============================================
// LOAD AUDIT LOGS FROM API
// ============================================
const loadAuditLogs = useCallback(async () => {
  setLoading(true);

  try {
    console.log('🔍 Loading audit logs from API...');

    // ✅ Get current user from localStorage
    const userJson = localStorage.getItem('user');
    let currentUserId = null;
    let currentUserRole = null;
    let currentUserTenantId = null;
    
    if (userJson) {
      try {
        const user = JSON.parse(userJson);
        currentUserId = user.id;
        currentUserRole = user.role;
        currentUserTenantId = user.tenantId;
        console.log('👤 Current user:', { 
          id: currentUserId, 
          role: currentUserRole, 
          tenantId: currentUserTenantId 
        });
      } catch (e) {
        console.warn('Could not parse user from localStorage');
      }
    }

    // ✅ Get all tenants (for super admin or to get tenant names)
    const tenantsResponse = await tenantService.getAll();
    const tenantData = tenantsResponse?.data || tenantsResponse || [];
    setTenants(tenantData);
    console.log(`📋 Found ${tenantData.length} tenants`);

    let allLogs = [];

    // ✅ CASE 1: Super Admin - Get logs from ALL tenants
    if (currentUserRole === 'super_admin') {
      console.log('👑 Super Admin - Loading all tenant logs...');
      
      if (tenantData.length > 0) {
        for (const tenant of tenantData) {
          const tenantId = tenant.id;
          try {
            const response = await auditLogService.getByTenant(tenantId);
            const logs = response?.data || response || [];
            const enrichedLogs = logs.map(log => ({
              ...log,
              tenantName: tenant.name
            }));
            allLogs = [...allLogs, ...enrichedLogs];
            console.log(`📊 Found ${logs.length} logs for ${tenant.name}`);
          } catch (tenantError) {
            console.error(`❌ Error loading audit logs for tenant ${tenantId}:`, tenantError);
          }
        }
      }
    } 
    // ✅ CASE 2: User has tenant - Get logs by tenant
    else if (currentUserTenantId) {
      console.log(`🏢 Loading audit logs for tenant: ${currentUserTenantId}`);
      try {
        const response = await auditLogService.getByTenant(currentUserTenantId);
        const logs = response?.data || response || [];
        const tenant = tenantData.find(t => t.id === currentUserTenantId);
        const enrichedLogs = logs.map(log => ({
          ...log,
          tenantName: tenant?.name || 'N/A'
        }));
        allLogs = [...allLogs, ...enrichedLogs];
        console.log(`📊 Found ${logs.length} logs for tenant`);
      } catch (tenantError) {
        console.error(`❌ Error loading audit logs for tenant ${currentUserTenantId}:`, tenantError);
      }
    }
    // ✅ CASE 3: User has NO tenant - Get logs by user_id ONLY
    // ✅ CASE 3: User has NO tenant - Get logs by user_id ONLY
else if (currentUserId) {
  console.log(`👤 Loading audit logs for user: ${currentUserId} (no tenant)`);
  try {
    // ✅ Use getByUser endpoint - no tenant required!
    const response = await auditLogService.getByUser(currentUserId);
    const logs = response?.data || response || [];
    // Try to get tenant name from the logs if available
    const enrichedLogs = logs.map(log => {
      const tenant = tenantData.find(t => t.id === log.tenantId);
      return {
        ...log,
        tenantName: tenant?.name || 'N/A'
      };
    });
    allLogs = [...allLogs, ...enrichedLogs];
    console.log(`📊 Found ${logs.length} logs for user`);
  } catch (userError) {
    console.error(`❌ Error loading audit logs for user ${currentUserId}:`, userError);
  }
}

    // Sort by timestamp (newest first)
    allLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (allLogs.length === 0) {
      console.warn('No audit logs from API, loading from localStorage...');
      loadFromLocalStorage();
      return;
    }

    console.log(`📊 Loaded ${allLogs.length} audit logs from API`);
    setAuditLogs(allLogs);

  } catch (error) {
    console.error('❌ Error loading audit logs:', error);
    loadFromLocalStorage();
  }

  setLoading(false);
}, []);

  // ============================================
  // LOAD FROM LOCALSTORAGE (Fallback)
  // ============================================
  const loadFromLocalStorage = useCallback(() => {
    try {
      console.warn('⚠️ Loading audit logs from localStorage (fallback)');
      
      const users = JSON.parse(localStorage.getItem('travel_agency_users') || '[]');
      const bookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      const guestBookings = JSON.parse(localStorage.getItem('travel_agency_guest_bookings') || '[]');
      const vehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
      const tours = JSON.parse(localStorage.getItem('travel_agency_tour_packages') || '[]');
      const hajjPackages = JSON.parse(localStorage.getItem('travel_agency_hajj_packages') || '[]');
      const hotels = JSON.parse(localStorage.getItem('travel_agency_hotels') || '[]');
      const flights = JSON.parse(localStorage.getItem('travel_agency_flights') || '[]');
      const carOwners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
      const visas = JSON.parse(localStorage.getItem('travel_agency_visa_applications') || '[]');
      const tenants = JSON.parse(localStorage.getItem('travel_agency_tenants') || '[]');

      const bookingMap = new Map();
      bookings.forEach(b => bookingMap.set(b.id, b));
      guestBookings.forEach(b => bookingMap.set(b.id, b));
      const allBookings = Array.from(bookingMap.values());

      const logs = [];

      users.forEach((user, index) => {
        logs.push({
          id: `log_${Date.now()}_${index}_1`,
          action: user.createdAt ? 'User Registered' : 'User Login',
          user: user.email || 'unknown@example.com',
          role: user.role || 'Client',
          entity: 'User Management',
          timestamp: user.createdAt || new Date().toISOString(),
          ip: '192.168.1.100',
          details: `User ${user.name || 'Unknown'} ${user.createdAt ? 'registered' : 'logged in'} as ${user.role}`,
          status: 'Success',
          type: 'auth'
        });
      });

      allBookings.forEach((booking, index) => {
        const serviceType = booking.serviceType || 'booking';
        const serviceLabel = {
          car_hire: 'Car Hire',
          car: 'Car Hire',
          tour: 'Tour',
          tour_package: 'Tour',
          hajj: 'Hajj/Umra',
          hajj_umra: 'Hajj/Umra',
          hotel: 'Hotel',
          hotel_booking: 'Hotel',
          flight: 'Flight',
          flight_booking: 'Flight'
        }[serviceType] || 'Booking';

        logs.push({
          id: `log_${Date.now()}_${index}_2`,
          action: `${serviceLabel} Booking Created`,
          user: booking.customerEmail || 'guest@example.com',
          role: booking.isGuestBooking ? 'Guest' : 'Client',
          entity: serviceLabel,
          timestamp: booking.createdAt || new Date().toISOString(),
          ip: '192.168.1.45',
          details: `${serviceLabel} booking #${booking.reference} by ${booking.customerName} - Amount: KSh ${(booking.totalPrice || 0).toLocaleString()}`,
          status: booking.status === 'cancelled' ? 'Failed' : 'Success',
          type: 'booking'
        });

        if (booking.status && booking.status !== 'pending') {
          logs.push({
            id: `log_${Date.now()}_${index}_3`,
            action: `${serviceLabel} Booking Status Updated`,
            user: booking.customerEmail || 'guest@example.com',
            role: booking.isGuestBooking ? 'Guest' : 'Client',
            entity: serviceLabel,
            timestamp: booking.updatedAt || new Date().toISOString(),
            ip: '192.168.1.45',
            details: `${serviceLabel} booking #${booking.reference} status changed to "${booking.status}"`,
            status: 'Success',
            type: 'booking'
          });
        }
      });

      vehicles.forEach((vehicle, index) => {
        logs.push({
          id: `log_${Date.now()}_${index}_4`,
          action: 'Vehicle Added',
          user: vehicle.owner || 'system@travelagency.com',
          role: 'Car Owner',
          entity: 'Vehicle',
          timestamp: vehicle.createdAt || new Date().toISOString(),
          ip: '192.168.1.45',
          details: `Vehicle ${vehicle.registration} - ${vehicle.make} ${vehicle.model} added to fleet`,
          status: 'Success',
          type: 'vehicle'
        });
      });

      tours.forEach((tour, index) => {
        logs.push({
          id: `log_${Date.now()}_${index}_5`,
          action: 'Tour Package Added',
          user: 'admin@travelagency.com',
          role: 'Admin',
          entity: 'Tour',
          timestamp: tour.createdAt || new Date().toISOString(),
          ip: '192.168.1.45',
          details: `Tour package "${tour.name}" added - Destination: ${tour.destination}`,
          status: 'Success',
          type: 'tour'
        });
      });

      hajjPackages.forEach((pkg, index) => {
        logs.push({
          id: `log_${Date.now()}_${index}_6`,
          action: 'Hajj Package Added',
          user: 'admin@travelagency.com',
          role: 'Admin',
          entity: 'Hajj/Umra',
          timestamp: pkg.createdAt || new Date().toISOString(),
          ip: '192.168.1.45',
          details: `${pkg.type || 'Hajj'} package "${pkg.name}" added - Destination: ${pkg.destination}`,
          status: 'Success',
          type: 'hajj'
        });
      });

      hotels.forEach((hotel, index) => {
        logs.push({
          id: `log_${Date.now()}_${index}_7`,
          action: 'Hotel Added',
          user: 'admin@travelagency.com',
          role: 'Admin',
          entity: 'Hotel',
          timestamp: hotel.createdAt || new Date().toISOString(),
          ip: '192.168.1.45',
          details: `Hotel "${hotel.name}" added - ${hotel.city} (${hotel.starRating || 3}⭐)`,
          status: 'Success',
          type: 'hotel'
        });
      });

      flights.forEach((flight, index) => {
        logs.push({
          id: `log_${Date.now()}_${index}_8`,
          action: 'Flight Added',
          user: 'admin@travelagency.com',
          role: 'Admin',
          entity: 'Flight',
          timestamp: flight.createdAt || new Date().toISOString(),
          ip: '192.168.1.45',
          details: `Flight ${flight.airline} ${flight.flightNumber} added - ${flight.origin} → ${flight.destination}`,
          status: 'Success',
          type: 'flight'
        });
      });

      visas.forEach((visa, index) => {
        logs.push({
          id: `log_${Date.now()}_${index}_9`,
          action: 'Visa Application',
          user: visa.email || 'unknown@example.com',
          role: 'Client',
          entity: 'Visa',
          timestamp: visa.createdAt || new Date().toISOString(),
          ip: '192.168.1.45',
          details: `Visa application for ${visa.name} - ${visa.destination} (${visa.status || 'pending'})`,
          status: visa.status === 'approved' ? 'Success' : visa.status === 'rejected' ? 'Failed' : 'Pending',
          type: 'visa'
        });
      });

      tenants.forEach((tenant, index) => {
        logs.push({
          id: `log_${Date.now()}_${index}_10`,
          action: 'Tenant Created',
          user: 'admin@travelagency.com',
          role: 'Super Admin',
          entity: 'Tenant',
          timestamp: tenant.createdAt || new Date().toISOString(),
          ip: '10.0.0.23',
          details: `New tenant "${tenant.name}" created`,
          status: 'Success',
          type: 'tenant'
        });
      });

      carOwners.forEach((owner, index) => {
        logs.push({
          id: `log_${Date.now()}_${index}_11`,
          action: owner.status === 'pending_approval' ? 'Car Owner Registration' : 'Car Owner Updated',
          user: owner.email || 'unknown@example.com',
          role: 'Car Owner',
          entity: 'Car Owner',
          timestamp: owner.createdAt || new Date().toISOString(),
          ip: '192.168.1.45',
          details: `Car owner "${owner.name}" ${owner.status === 'pending_approval' ? 'registered and pending approval' : 'updated'}`,
          status: owner.status === 'active' ? 'Success' : 'Pending',
          type: 'car_owner'
        });
      });

      logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      if (logs.length === 0) {
        logs.push({
          id: 'sample_1',
          action: 'System Initialized',
          user: 'system@travelagency.com',
          role: 'System',
          entity: 'System',
          timestamp: new Date().toISOString(),
          ip: '127.0.0.1',
          details: 'Travel Agency System initialized successfully',
          status: 'Success',
          type: 'system'
        });
      }

      setAuditLogs(logs);
      console.log(`📊 Loaded ${logs.length} audit logs from localStorage`);
      
    } catch (e) {
      console.error('Error loading from localStorage:', e);
      setAuditLogs([{
        id: 'sample_1',
        action: 'System Initialized',
        user: 'system@travelagency.com',
        role: 'System',
        entity: 'System',
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1',
        details: 'Travel Agency System initialized successfully',
        status: 'Success',
        type: 'system'
      }]);
    }
  }, []);

  // ============================================
  // USE EFFECTS
  // ============================================
  useEffect(() => {
    loadAuditLogs();

    const handleDataUpdate = () => {
      loadAuditLogs();
    };

    window.addEventListener('usersUpdated', handleDataUpdate);
    window.addEventListener('bookingsUpdated', handleDataUpdate);
    window.addEventListener('vehiclesUpdated', handleDataUpdate);
    window.addEventListener('tenantsUpdated', handleDataUpdate);

    return () => {
      window.removeEventListener('usersUpdated', handleDataUpdate);
      window.removeEventListener('bookingsUpdated', handleDataUpdate);
      window.removeEventListener('vehiclesUpdated', handleDataUpdate);
      window.removeEventListener('tenantsUpdated', handleDataUpdate);
    };
  }, [loadAuditLogs]);

  // ============================================
  // HELPERS
  // ============================================
  const getActionIcon = (action) => {
    if (!action) return <FileText size={14} />;
    if (action.includes('Login') || action.includes('Registered')) return <User size={14} />;
    if (action.includes('Vehicle')) return <Truck size={14} />;
    if (action.includes('Tenant')) return <Building size={14} />;
    if (action.includes('Booking')) return <Calendar size={14} />;
    if (action.includes('Tour')) return <Compass size={14} />;
    if (action.includes('Hajj') || action.includes('Umra')) return <MapPinIcon size={14} />;
    if (action.includes('Hotel')) return <Hotel size={14} />;
    if (action.includes('Flight')) return <Plane size={14} />;
    if (action.includes('Visa')) return <FileText size={14} />;
    if (action.includes('Car Owner')) return <Car size={14} />;
    if (action.includes('Status')) return <Clock size={14} />;
    return <FileText size={14} />;
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700';
    if (status === 'Success' || status === 'Resolved') return 'bg-green-100 text-green-700';
    if (status === 'Failed' || status === 'Rejected') return 'bg-red-100 text-red-700';
    if (status === 'Pending') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status) => {
    if (!status) return <AlertCircle size={12} className="text-gray-600" />;
    if (status === 'Success' || status === 'Resolved') return <CheckCircle size={12} className="text-green-600" />;
    if (status === 'Failed' || status === 'Rejected') return <XCircle size={12} className="text-red-600" />;
    if (status === 'Pending') return <AlertCircle size={12} className="text-yellow-600" />;
    return <AlertCircle size={12} className="text-gray-600" />;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp).toLocaleString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timestamp;
    }
  };

  // Filter logs
  const filteredLogs = useMemo(() => {
    let filtered = auditLogs;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        (log.action || '').toLowerCase().includes(search) ||
        (log.user || log.userEmail || '').toLowerCase().includes(search) ||
        (log.entity || '').toLowerCase().includes(search) ||
        (log.details || '').toLowerCase().includes(search) ||
        (log.role || '').toLowerCase().includes(search)
      );
    }

    if (filterAction !== 'all') {
      filtered = filtered.filter(log => log.type === filterAction);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(log => {
        const status = log.status || '';
        if (filterStatus === 'success') return status === 'Success' || status === 'Resolved';
        if (filterStatus === 'failed') return status === 'Failed' || status === 'Rejected';
        if (filterStatus === 'pending') return status === 'Pending';
        return true;
      });
    }

    return filtered;
  }, [auditLogs, searchTerm, filterAction, filterStatus]);

  // Action types for filter
  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'auth', label: 'Authentication' },
    { value: 'booking', label: 'Bookings' },
    { value: 'vehicle', label: 'Vehicles' },
    { value: 'tour', label: 'Tours' },
    { value: 'hajj', label: 'Hajj/Umra' },
    { value: 'hotel', label: 'Hotels' },
    { value: 'flight', label: 'Flights' },
    { value: 'visa', label: 'Visa' },
    { value: 'car_owner', label: 'Car Owners' },
    { value: 'tenant', label: 'Tenants' }
  ];

  // Open detail modal
  const openDetailModal = (log) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  // Close detail modal
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedLog(null);
  };

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedLog) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="absolute inset-0" onClick={closeDetailModal}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <button 
            onClick={closeDetailModal}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white">
                {getActionIcon(selectedLog.action)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{selectedLog.action}</h2>
                <p className="text-blue-100 text-sm">Log Details</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">User</p>
                <p className="text-sm font-medium break-all">{selectedLog.userEmail || selectedLog.user || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-sm font-medium">{selectedLog.userRole || selectedLog.role || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Entity</p>
                <p className="text-sm font-medium">{selectedLog.entity || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Status</p>
                <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusColor(selectedLog.status)}`}>
                  {selectedLog.status || 'N/A'}
                </span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-gray-500">Timestamp</p>
                <p className="text-sm font-medium">{formatDate(selectedLog.createdAt || selectedLog.timestamp)}</p>
              </div>
            </div>

            {selectedLog.details && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={14} /> Details
                </h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">{selectedLog.details}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {selectedLog.ipAddress && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">IP Address</p>
                  <p className="text-sm font-mono break-all">{selectedLog.ipAddress}</p>
                </div>
              )}
              {selectedLog.userAgent && (
                <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                  <p className="text-xs text-gray-500">User Agent</p>
                  <p className="text-xs text-gray-600 break-all">{selectedLog.userAgent}</p>
                </div>
              )}
              {selectedLog.tenantName && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Tenant</p>
                  <p className="text-sm font-medium">{selectedLog.tenantName}</p>
                </div>
              )}
              {selectedLog.entityId && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Entity ID</p>
                  <p className="text-sm font-mono break-all">{selectedLog.entityId}</p>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <button 
                onClick={closeDetailModal}
                className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading audit logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Detail Modal */}
      {renderDetailModal()}

      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <FileText size={24} className="text-blue-600" />
              Audit Log
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Complete audit trail of all system activities · 
              <span className="font-medium text-gray-700 ml-1">{auditLogs.length} entries</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={loadAuditLogs}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </button>
            <button 
              onClick={() => {
                const dataStr = JSON.stringify(auditLogs, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `audit-log-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2"
            >
              <Download size={16} /> Export Logs
            </button>
          </div>
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
                placeholder="Search logs..." 
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
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={14} />
            <span>{filteredLogs.length} entries found</span>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select 
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                {actionTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <select 
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="success">✅ Success</option>
                <option value="failed">❌ Failed</option>
                <option value="pending">⏳ Pending</option>
              </select>
              <input 
                type="date" 
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white" 
              />
            </div>
          </div>
        )}
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
              <tr>
                <th className="p-3">Action</th>
                <th className="p-3 hidden md:table-cell">User</th>
                <th className="p-3 hidden lg:table-cell">Role</th>
                <th className="p-3">Entity</th>
                <th className="p-3 hidden xl:table-cell">Timestamp</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="text-sm font-medium">{log.action}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm hidden md:table-cell truncate max-w-[150px]">
                      {log.userEmail || log.user || 'N/A'}
                    </td>
                    <td className="p-3 text-sm hidden lg:table-cell">
                      {log.userRole || log.role || 'N/A'}
                    </td>
                    <td className="p-3 text-sm">{log.entity || 'N/A'}</td>
                    <td className="p-3 text-sm hidden xl:table-cell">
                      {formatDate(log.createdAt || log.timestamp)}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(log.status)}`}>
                        {getStatusIcon(log.status)}
                        {log.status || 'N/A'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => openDetailModal(log)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500">
                    <Search size={32} className="mx-auto text-gray-300 mb-2" />
                    <p>No audit logs found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-gray-600">
            Total: <span className="font-semibold">{filteredLogs.length}</span> entries
            {filteredLogs.length !== auditLogs.length && (
              <span className="text-gray-400 ml-2">(filtered from {auditLogs.length})</span>
            )}
          </p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Rows per page: 10</span>
            <span>1-{Math.min(filteredLogs.length, 10)} of {filteredLogs.length}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

export default AuditLog;