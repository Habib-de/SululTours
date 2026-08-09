import React, { useState, useEffect, useCallback } from 'react';
import { 
  MapPin, Check, ChevronDown, Users, Building, 
  RefreshCw, Truck, Calendar, DollarSign, X
} from 'lucide-react';
import { useTenantConfig } from '../context/TenantConfigContext';
import { tenantService, userService, vehicleService, bookingService } from '../services/api';

const TenantSwitcher = ({ isAdmin = false }) => {
  const { currentTenant, switchTenant, getAvailablePresets } = useTenantConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [tenantStats, setTenantStats] = useState({ bookings: 0, vehicles: 0, users: 0, revenue: 0 });
  
  const presets = getAvailablePresets();
  const current = presets.find(p => p.id === currentTenant);

  // ============================================
  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURN
  // ============================================

  // LOAD TENANTS FROM API
  const loadTenants = useCallback(async () => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    
    try {
      console.log('🔍 Loading tenants from API...');
      
      const response = await tenantService.getAll();
      console.log('📊 Tenants API Response:', response);
      
      let tenantData = [];
      if (response?.success && response?.data) {
        tenantData = response.data;
      } else if (Array.isArray(response)) {
        tenantData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        tenantData = response.data;
      }
      
      if (tenantData.length === 0) {
        console.warn('No tenants from API, checking localStorage...');
        const savedTenants = localStorage.getItem('travel_agency_tenants');
        if (savedTenants) {
          try {
            tenantData = JSON.parse(savedTenants);
          } catch (e) {
            console.error('Failed to load tenants from localStorage:', e);
            tenantData = [];
          }
        }
      }
      
      if (tenantData.length === 0) {
        console.warn('No tenants found, creating default...');
        tenantData = [{
          id: 'default_tenant',
          name: 'Sulul Tours & Travel',
          status: 'active',
          createdAt: new Date().toISOString()
        }];
        localStorage.setItem('travel_agency_tenants', JSON.stringify(tenantData));
      }
      
      setTenants(tenantData);
    } catch (error) {
      console.error('❌ Error loading tenants:', error);
      loadTenantsFromLocalStorage();
    }
    
    setIsLoading(false);
  }, [isAdmin]);

  // LOAD TENANTS FROM LOCALSTORAGE (Fallback)
  const loadTenantsFromLocalStorage = useCallback(() => {
    if (!isAdmin) return;
    
    console.warn('Loading tenants from localStorage (fallback)');
    
    const savedTenants = localStorage.getItem('travel_agency_tenants');
    let tenantData = [];
    
    if (savedTenants) {
      try {
        tenantData = JSON.parse(savedTenants);
      } catch (e) {
        console.error('Failed to load tenants:', e);
        tenantData = [];
      }
    }
    
    if (tenantData.length === 0) {
      const fleetTenants = localStorage.getItem('fleetman_tenants');
      if (fleetTenants) {
        try {
          tenantData = JSON.parse(fleetTenants);
        } catch (e) {
          console.error('Failed to load fleet tenants:', e);
          tenantData = [];
        }
      }
    }
    
    if (tenantData.length === 0) {
      tenantData = [{
        id: 'default_tenant',
        name: 'Sulul Tours & Travel',
        status: 'active',
        createdAt: new Date().toISOString()
      }];
      localStorage.setItem('travel_agency_tenants', JSON.stringify(tenantData));
    }
    
    setTenants(tenantData);
  }, [isAdmin]);

  // GET TENANT STATS FROM API
  const getTenantStats = useCallback(async (tenantId) => {
    if (!isAdmin) return { bookings: 0, vehicles: 0, users: 0, revenue: 0 };
    
    try {
      console.log(`🔍 Getting stats for tenant: ${tenantId}`);
      
      const [usersResponse, vehiclesResponse, bookingsResponse] = await Promise.all([
        userService.getByTenant(tenantId).catch(() => ({ success: true, data: [] })),
        vehicleService.getAll(tenantId).catch(() => ({ success: true, data: [] })),
        bookingService.getAll(tenantId).catch(() => ({ success: true, data: [] }))
      ]);
      
      // ✅ Extract data properly
      let users = [];
      if (usersResponse?.data) {
        users = usersResponse.data;
      } else if (Array.isArray(usersResponse)) {
        users = usersResponse;
      }
      
      let vehicles = [];
      if (vehiclesResponse?.data) {
        vehicles = vehiclesResponse.data;
      } else if (Array.isArray(vehiclesResponse)) {
        vehicles = vehiclesResponse;
      }
      
      let bookings = [];
      if (bookingsResponse?.data) {
        bookings = bookingsResponse.data;
      } else if (Array.isArray(bookingsResponse)) {
        bookings = bookingsResponse;
      }
      
      console.log(`📊 Stats for tenant ${tenantId}:`, {
        users: users.length,
        vehicles: vehicles.length,
        bookings: bookings.length
      });
      
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      
      return {
        bookings: bookings.length,
        vehicles: vehicles.length,
        users: users.length,
        revenue: totalRevenue
      };
    } catch (error) {
      console.error('Error getting tenant stats:', error);
      return getTenantStatsFromLocalStorage(tenantId);
    }
  }, [isAdmin]);

  // GET TENANT STATS FROM LOCALSTORAGE (Fallback)
  const getTenantStatsFromLocalStorage = useCallback((tenantId) => {
    if (!isAdmin) return { bookings: 0, vehicles: 0, users: 0, revenue: 0 };
    
    const bookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
    const guestBookings = JSON.parse(localStorage.getItem('travel_agency_guest_bookings') || '[]');
    const vehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
    const users = JSON.parse(localStorage.getItem('travel_agency_users') || '[]');
    
    const allBookings = [...bookings, ...guestBookings];
    const tenantBookings = allBookings.filter(b => b.tenant_id === tenantId || b.tenantId === tenantId);
    const tenantVehicles = vehicles.filter(v => v.tenant_id === tenantId || v.tenantId === tenantId || v.cost_centre === tenantId);
    const tenantUsers = users.filter(u => u.tenant_id === tenantId || u.tenantId === tenantId);
    
    const totalRevenue = tenantBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    
    return {
      bookings: tenantBookings.length,
      vehicles: tenantVehicles.length,
      users: tenantUsers.length,
      revenue: totalRevenue
    };
  }, [isAdmin]);

  // ✅ useEffect HOOKS - Called unconditionally
  useEffect(() => {
    if (isAdmin) {
      loadTenants();
    }
  }, [isAdmin, loadTenants]);

  // Load stats for current tenant
  useEffect(() => {
    if (isAdmin && currentTenant) {
      getTenantStats(currentTenant).then(stats => {
        setTenantStats(stats);
      });
    }
  }, [isAdmin, currentTenant, getTenantStats]);

  // Listen for tenant updates
  useEffect(() => {
    const handleTenantUpdate = () => {
      if (isAdmin) {
        loadTenants();
      }
    };

    window.addEventListener('tenantsUpdated', handleTenantUpdate);
    window.addEventListener('storage', (e) => {
      if (isAdmin && (e.key === 'travel_agency_tenants' || e.key === 'fleetman_tenants')) {
        loadTenants();
      }
    });

    return () => {
      window.removeEventListener('tenantsUpdated', handleTenantUpdate);
    };
  }, [isAdmin, loadTenants]);

  // ============================================
  // NOW WE CAN DO THE CONDITIONAL RETURN
  // ============================================
  
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTenantSwitch = (tenantId) => {
  console.log(`🔄 Switching to tenant: ${tenantId}`);
  
  const tenant = tenants.find(t => t.id === tenantId);
  
  // Switch tenant in config
  switchTenant(tenantId);
  
  // Save to localStorage
  localStorage.setItem('travel_agency_current_tenant', tenantId);
  
  // Save tenant name for quick access
  if (tenant) {
    localStorage.setItem('current_tenant_name', tenant.name);
  }
  
  // Dispatch events for other components
  window.dispatchEvent(new CustomEvent('tenantSwitched', {
    detail: { tenantId, tenant }
  }));
  
  window.dispatchEvent(new CustomEvent('tenantChanged', {
    detail: { 
      config: {
        ...tenant,
        name: tenant?.name || 'Unknown',
        vehicles: tenant?.vehicles || [],
        geofences: tenant?.geofences || []
      }
    }
  }));
  
  setIsOpen(false);
  showNotification(`✅ Switched to ${tenant?.name || tenantId}`);
  
  // ✅ Force re-render by updating tenantStats
  setTenantStats(prev => ({ 
    ...prev, 
    users: prev.users, 
    vehicles: prev.vehicles, 
    bookings: prev.bookings,
    revenue: prev.revenue
  }));
};

  const getTenantDetails = (tenantId) => {
    return tenants.find(t => t.id === tenantId);
  };

  // ✅ CONDITIONAL RETURN - NOW AFTER ALL HOOKS
  if (!isAdmin) {
    return null;
  }

  // ============================================
  // RENDER ADMIN TENANT SWITCHER
  // ============================================
  const currentTenantDetails = getTenantDetails(currentTenant);

  return (
    <>
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[999] px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {notification.type === 'error' ? '❌' : '✅'}
          <span className="text-sm">{notification.message}</span>
        </div>
      )}

      {/* Tenant Switcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors text-sm min-w-[180px]"
      >
        <Building size={14} className="text-blue-600 flex-shrink-0" />
        <span className="font-medium text-blue-700 truncate max-w-[140px]">
          {currentTenantDetails?.name || 'Select Tenant'}
        </span>
        <span className="text-[10px] text-blue-400 bg-blue-100 px-1.5 py-0.5 rounded flex-shrink-0">
          {tenantStats.users} users
        </span>
        <ChevronDown size={14} className="text-blue-600 flex-shrink-0" />
      </button>

      {/* Modal - Same as before */}
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => setIsOpen(false)}></div>
          
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
            >
              <X size={20} className="text-gray-500 hover:text-gray-700" />
            </button>

            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Building size={24} />
                    Switch Tenant
                  </h2>
                  <p className="text-blue-100 text-sm mt-1">
                    Select a tenant to switch to
                  </p>
                </div>
                <button 
                  onClick={() => {
                    loadTenants();
                    showNotification('🔄 Refreshed tenants');
                  }}
                  className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-white"
                  title="Refresh tenants"
                >
                  <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {currentTenantDetails && (
                <div className="px-4 py-3 bg-blue-50 rounded-xl mb-4 border border-blue-200">
                  <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wider">Current Tenant</p>
                  <p className="text-base font-semibold text-gray-800">{currentTenantDetails.name}</p>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <Users size={14} className="text-blue-500" /> 
                      <span className="font-medium">{tenantStats.users}</span> users
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Truck size={14} className="text-purple-500" /> 
                      <span className="font-medium">{tenantStats.vehicles}</span> vehicles
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={14} className="text-orange-500" /> 
                      <span className="font-medium">{tenantStats.bookings}</span> bookings
                    </span>
                    <span className="flex items-center gap-1.5">
                      <DollarSign size={14} className="text-green-500" /> 
                      <span className="font-medium text-green-600">KSh {tenantStats.revenue.toLocaleString()}</span>
                    </span>
                  </div>
                </div>
              )}

              {isLoading ? (
                <div className="px-3 py-8 text-center text-gray-500">
                  <RefreshCw size={32} className="mx-auto text-gray-300 animate-spin mb-3" />
                  <p>Loading tenants...</p>
                </div>
              ) : tenants.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1 mb-3">
                    All Tenants ({tenants.length})
                  </p>
                  {tenants.map((tenant) => {
                    const isActive = currentTenant === tenant.id;
                    
                    return (
                      <button
                        key={tenant.id}
                        onClick={() => handleTenantSwitch(tenant.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl hover:shadow-md transition-all text-left ${
                          isActive 
                            ? 'bg-blue-50 border-2 border-blue-500 shadow-md' 
                            : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-800 truncate">
                              {tenant.name || tenant.id}
                            </span>
                            {tenant.status === 'active' && (
                              <span className="text-[8px] text-green-500">●</span>
                            )}
                            {isActive && (
                              <span className="text-[10px] px-2 py-0.5 bg-blue-200 text-blue-700 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                        {isActive && <Check size={20} className="text-blue-600 flex-shrink-0 ml-3" />}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-3 py-8 text-center text-gray-500">
                  <Building size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="font-medium">No tenants found</p>
                  <p className="text-sm">Create a tenant in the admin panel</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {tenants.length} tenant{tenants.length !== 1 ? 's' : ''} available
              </p>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-1"
                >
                  <RefreshCw size={14} /> Reload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TenantSwitcher;