import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Server, Car, Compass, MapPin, Hotel, Plane,
  Shield, RefreshCw, Search, Filter, X,
  CheckCircle, AlertCircle, Edit2, Save,
  Eye, EyeOff, Plus, Trash2,
  ToggleLeft, ToggleRight, Settings,
  DollarSign, Users, Calendar, Clock
} from 'lucide-react';

const ServiceManagement = ({ setActiveTab }) => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState([]);
  const [notification, setNotification] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingService, setEditingService] = useState(null);

  // Service definitions
  const serviceDefinitions = [
    {
      id: 'car_hire',
      name: 'Car Hire',
      icon: Car,
      color: 'blue',
      description: 'Vehicle rental and booking service',
      status: 'active',
      features: ['Vehicle Management', 'Booking System', 'Car Owners', 'Maintenance'],
      settings: {
        allowGuestBooking: true,
        requireLicense: true,
        maxBookingDays: 30,
        cancellationPolicy: '24 hours'
      }
    },
    {
      id: 'tours',
      name: 'Tours & Travel',
      icon: Compass,
      color: 'green',
      description: 'Adventure and wildlife tour packages',
      status: 'active',
      features: ['Tour Packages', 'Tour Bookings', 'Tour Guides', 'Itineraries'],
      settings: {
        allowGuestBooking: true,
        requirePassport: true,
        maxGroupSize: 50,
        cancellationPolicy: '48 hours'
      }
    },
    {
      id: 'hajj',
      name: 'Hajj & Umra',
      icon: MapPin,
      color: 'purple',
      description: 'Pilgrimage packages and visa processing',
      status: 'active',
      features: ['Hajj Packages', 'Umra Packages', 'Visa Processing', 'Accommodation'],
      settings: {
        allowGuestBooking: false,
        requirePassport: true,
        requireVisa: true,
        cancellationPolicy: '7 days'
      }
    },
    {
      id: 'hotels',
      name: 'Hotels',
      icon: Hotel,
      color: 'orange',
      description: 'Hotel accommodations and room booking',
      status: 'active',
      features: ['Hotel Management', 'Room Types', 'Hotel Bookings', 'Amenities'],
      settings: {
        allowGuestBooking: true,
        requireId: true,
        minStay: 1,
        maxStay: 30,
        cancellationPolicy: '24 hours'
      }
    },
    {
      id: 'flights',
      name: 'Flights',
      icon: Plane,
      color: 'indigo',
      description: 'Local and international flight bookings',
      status: 'active',
      features: ['Flight Management', 'Seat Classes', 'Flight Bookings', 'Airlines'],
      settings: {
        allowGuestBooking: true,
        requirePassport: true,
        requireVisa: true,
        cancellationPolicy: '48 hours'
      }
    },
    {
      id: 'visa',
      name: 'Visa Processing',
      icon: Shield,
      color: 'pink',
      description: 'Visa application and processing service',
      status: 'active',
      features: ['Visa Applications', 'Document Verification', 'Status Tracking', 'Payment'],
      settings: {
        requirePassport: true,
        requirePhoto: true,
        processingDays: 5,
        cancellationPolicy: 'No refund'
      }
    }
  ];

  // Color mapping for Tailwind classes
  const colorClasses = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600', hover: 'hover:bg-blue-200', ring: 'ring-blue-500' },
    green: { bg: 'bg-green-100', text: 'text-green-600', hover: 'hover:bg-green-200', ring: 'ring-green-500' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600', hover: 'hover:bg-purple-200', ring: 'ring-purple-500' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600', hover: 'hover:bg-orange-200', ring: 'ring-orange-500' },
    indigo: { bg: 'bg-indigo-100', text: 'text-indigo-600', hover: 'hover:bg-indigo-200', ring: 'ring-indigo-500' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-600', hover: 'hover:bg-pink-200', ring: 'ring-pink-500' }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
  setLoading(true);
  try {
    const savedServices = localStorage.getItem('travel_agency_services');
    if (savedServices) {
      const parsed = JSON.parse(savedServices);
      // Merge saved data with definitions, but ALWAYS use the icon from definitions
      const merged = serviceDefinitions.map(def => {
        const saved = parsed.find(s => s.id === def.id);
        return saved ? { ...def, ...saved, icon: def.icon } : def;
      });
      setServices(merged);
    } else {
      setServices(serviceDefinitions);
    }
  } catch (error) {
    console.error('Error loading services:', error);
    setServices(serviceDefinitions);
  }
  setLoading(false);
};

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const saveServices = (updatedServices) => {
  // Strip non-serializable icon before saving to localStorage
  const serializable = updatedServices.map(s => {
    const { icon, ...rest } = s;
    return rest;
  });
  localStorage.setItem('travel_agency_services', JSON.stringify(serializable));
  setServices(updatedServices);
};

  const toggleServiceStatus = (serviceId) => {
    const updated = services.map(s => {
      if (s.id === serviceId) {
        return { ...s, status: s.status === 'active' ? 'inactive' : 'active' };
      }
      return s;
    });
    saveServices(updated);
    const service = updated.find(s => s.id === serviceId);
    showNotification(
      `${service.name} is now ${service.status === 'active' ? 'active' : 'inactive'}`,
      service.status === 'active' ? 'success' : 'error'
    );
  };

  const updateServiceSetting = (serviceId, settingKey, value) => {
    const updated = services.map(s => {
      if (s.id === serviceId) {
        return {
          ...s,
          settings: {
            ...s.settings,
            [settingKey]: value
          }
        };
      }
      return s;
    });
    saveServices(updated);
    showNotification(`Service setting updated successfully`);
  };

  const toggleGuestBooking = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    if (service) {
      const newValue = !service.settings.allowGuestBooking;
      updateServiceSetting(serviceId, 'allowGuestBooking', newValue);
    }
  };

  const filteredServices = useMemo(() => {
    let filtered = services;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.name.toLowerCase().includes(term) ||
        s.description.toLowerCase().includes(term) ||
        s.id.toLowerCase().includes(term)
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(s => s.status === filterStatus);
    }
    
    return filtered;
  }, [services, searchTerm, filterStatus]);

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: '✅ Active', color: 'bg-green-100 text-green-800' },
      inactive: { label: '❌ Inactive', color: 'bg-gray-100 text-gray-800' },
      maintenance: { label: '🔧 Maintenance', color: 'bg-yellow-100 text-yellow-800' }
    };
    return statusMap[status] || { label: status || 'Unknown', color: 'bg-gray-100 text-gray-800' };
  };

  const stats = useMemo(() => {
    const total = services.length;
    const active = services.filter(s => s.status === 'active').length;
    const inactive = services.filter(s => s.status === 'inactive').length;
    return { total, active, inactive };
  }, [services]);

  const ServiceCard = ({ service }) => {
    const statusBadge = getStatusBadge(service.status);
    const IconComponent = service.icon;
    const isEditing = editingService === service.id;
    const colors = colorClasses[service.color] || colorClasses.blue;

    return (
      <div className={`bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition-shadow ${
        service.status === 'inactive' ? 'border-gray-200 opacity-70' : 'border-gray-100'
      }`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-lg ${colors.bg} flex items-center justify-center flex-shrink-0`}>
              <IconComponent size={24} className={colors.text} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{service.name}</h3>
              <p className="text-xs text-gray-500">{service.description}</p>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color} inline-block mt-1`}>
                {statusBadge.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleServiceStatus(service.id)}
              className={`p-1.5 rounded-lg transition-colors ${
                service.status === 'active' 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              title={service.status === 'active' ? 'Deactivate' : 'Activate'}
            >
              {service.status === 'active' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            </button>
            <button
              onClick={() => setEditingService(isEditing ? null : service.id)}
              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-3 flex flex-wrap gap-1">
          {service.features.map((feature, index) => (
            <span key={index} className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {feature}
            </span>
          ))}
        </div>

        {/* Settings - Expanded */}
        {isEditing && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <h4 className="text-xs font-medium text-gray-700 mb-2">Service Settings</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Guest Booking</span>
                <button
                  onClick={() => toggleGuestBooking(service.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    service.settings.allowGuestBooking 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {service.settings.allowGuestBooking ? '✅ Enabled' : '❌ Disabled'}
                </button>
              </div>
              {service.settings.maxBookingDays && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Max Booking Days</span>
                  <span className="text-xs font-medium">{service.settings.maxBookingDays} days</span>
                </div>
              )}
              {service.settings.cancellationPolicy && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Cancellation Policy</span>
                  <span className="text-xs font-medium">{service.settings.cancellationPolicy}</span>
                </div>
              )}
              {service.settings.requirePassport && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Passport Required</span>
                  <span className="text-xs font-medium text-green-600">✅ Yes</span>
                </div>
              )}
              {service.settings.requireLicense && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">License Required</span>
                  <span className="text-xs font-medium text-green-600">✅ Yes</span>
                </div>
              )}
              {service.settings.requireId && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">ID Required</span>
                  <span className="text-xs font-medium text-green-600">✅ Yes</span>
                </div>
              )}
              {service.settings.requireVisa && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Visa Required</span>
                  <span className="text-xs font-medium text-green-600">✅ Yes</span>
                </div>
              )}
              {service.settings.requirePhoto && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Photo Required</span>
                  <span className="text-xs font-medium text-green-600">✅ Yes</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Server size={28} className="text-blue-600" />
            Service Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage all travel services on the platform
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
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <Server size={20} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-800 mt-2">{stats.total}</p>
          <p className="text-xs text-gray-500">Total Services</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <CheckCircle size={20} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-green-600 mt-2">{stats.active}</p>
          <p className="text-xs text-gray-500">Active Services</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <X size={20} className="text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-600 mt-2">{stats.inactive}</p>
          <p className="text-xs text-gray-500">Inactive Services</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">✅ Active</option>
              <option value="inactive">❌ Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Server size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No services found</p>
          <p className="text-sm text-gray-400">
            {searchTerm ? 'Try adjusting your search' : 'No services available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredServices.map(service => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

export default ServiceManagement;