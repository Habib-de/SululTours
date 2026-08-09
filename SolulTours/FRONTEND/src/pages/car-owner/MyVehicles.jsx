import React, { useState, useEffect } from 'react';
import { 
  Car, Search, 
  X, Filter, RefreshCw, 
  AlertCircle, CheckCircle, Eye,
  Clock, Calendar, DollarSign,
  MapPin, Phone, Mail, User, Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { vehicleService, carOwnerService } from '../../services/api';

const MyVehicles = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [carOwner, setCarOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [notification, setNotification] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [tenantId, setTenantId] = useState(null);

  useEffect(() => {
    const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
    setTenantId(userData?.tenantId || null);
    loadData();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      // Load car owner profile first
      await loadCarOwner();
      
      // Then load vehicles
      await loadVehicles();
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Failed to load data', 'error');
    }
    setLoading(false);
  };

  const loadCarOwner = async () => {
    try {
      console.log('🔍 Loading car owner for user:', currentUser?.id);
      
      if (!currentUser?.id) {
        console.warn('No user ID found');
        return null;
      }

      const response = await carOwnerService.getByUser(currentUser.id);
      console.log('📊 Car owner response:', response);
      
      let owner = null;
      if (response?.success && response?.data) {
        owner = response.data;
      } else if (response?.id) {
        owner = response;
      }
      
      setCarOwner(owner);
      return owner;
    } catch (error) {
      console.error('Error loading car owner:', error);
      // Try localStorage fallback
      return loadCarOwnerFromLocalStorage();
    }
  };

  const loadCarOwnerFromLocalStorage = () => {
    try {
      const allOwners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
      const owner = allOwners.find(o => o.userId === currentUser?.id);
      setCarOwner(owner);
      return owner;
    } catch (e) {
      setCarOwner(null);
      return null;
    }
  };

  const loadVehicles = async () => {
    try {
      // First make sure we have the car owner
      let owner = carOwner;
      if (!owner) {
        owner = await loadCarOwner();
      }
      
      if (!owner) {
        console.warn('No car owner found');
        setVehicles([]);
        return;
      }

      console.log('🔍 Loading vehicles for owner:', owner.id);
      
      const response = await vehicleService.getByOwner(owner.id);
      console.log('📊 Vehicles response:', response);
      
      let vehiclesData = [];
      if (response?.success && response?.data) {
        vehiclesData = response.data;
      } else if (Array.isArray(response)) {
        vehiclesData = response;
      }
      
      console.log('📋 Vehicles loaded:', vehiclesData.length);
      setVehicles(vehiclesData);
    } catch (error) {
      console.error('Error loading vehicles:', error);
      showNotification('Failed to load vehicles', 'error');
      // Fallback to localStorage
      loadVehiclesFromLocalStorage();
    }
  };

  const loadVehiclesFromLocalStorage = () => {
    try {
      const owner = carOwner;
      if (!owner) return;

      const stored = localStorage.getItem('travel_agency_vehicles');
      if (stored) {
        const allVehicles = JSON.parse(stored);
        const myVehicles = allVehicles.filter(v => v.ownerId === owner.id);
        setVehicles(myVehicles);
      }
    } catch (e) {
      setVehicles([]);
    }
  };

  const openDetailModal = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedVehicle(null);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
      maintenance: { label: 'Maintenance', color: 'bg-yellow-100 text-yellow-800' },
      disposed: { label: 'Disposed', color: 'bg-red-100 text-red-800' },
      rented: { label: 'Rented', color: 'bg-blue-100 text-blue-800' }
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getStatusDot = (status) => {
    const dotMap = {
      active: 'bg-green-500',
      inactive: 'bg-gray-500',
      maintenance: 'bg-yellow-500',
      disposed: 'bg-red-500',
      rented: 'bg-blue-500'
    };
    return dotMap[status] || 'bg-gray-400';
  };

  const filteredVehicles = vehicles.filter(v => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      v.registration?.toLowerCase().includes(searchLower) ||
      v.make?.toLowerCase().includes(searchLower) ||
      v.model?.toLowerCase().includes(searchLower) ||
      v.vin?.toLowerCase().includes(searchLower) ||
      v.color?.toLowerCase().includes(searchLower);
    
    const matchesFilter = filterStatus === 'all' || v.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const statusOptions = ['active', 'inactive', 'maintenance', 'disposed', 'rented'];

  // Stats
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const rentedVehicles = vehicles.filter(v => v.status === 'rented').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;

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

      {/* Detail Modal */}
      {showDetailModal && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeDetailModal}></div>
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Car size={24} />
                <div>
                  <h2 className="text-lg font-semibold">{selectedVehicle.registration}</h2>
                  <p className="text-sm text-blue-100">{selectedVehicle.make} {selectedVehicle.model}</p>
                </div>
              </div>
              <button onClick={closeDetailModal} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                    <div><span className="text-xs text-gray-500">Registration:</span> <span className="text-sm font-medium">{selectedVehicle.registration}</span></div>
                    <div><span className="text-xs text-gray-500">VIN:</span> <span className="text-sm font-medium">{selectedVehicle.vin || 'N/A'}</span></div>
                    <div><span className="text-xs text-gray-500">Make:</span> <span className="text-sm font-medium">{selectedVehicle.make}</span></div>
                    <div><span className="text-xs text-gray-500">Model:</span> <span className="text-sm font-medium">{selectedVehicle.model}</span></div>
                    <div><span className="text-xs text-gray-500">Year:</span> <span className="text-sm font-medium">{selectedVehicle.year || 'N/A'}</span></div>
                    <div><span className="text-xs text-gray-500">Color:</span> <span className="text-sm font-medium">{selectedVehicle.color || 'N/A'}</span></div>
                  </div>
                </div>
                <div className="col-span-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Specifications</h3>
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                    <div><span className="text-xs text-gray-500">Category:</span> <span className="text-sm font-medium">{selectedVehicle.category || 'N/A'}</span></div>
                    <div><span className="text-xs text-gray-500">Seating Capacity:</span> <span className="text-sm font-medium">{selectedVehicle.seatingCapacity || 'N/A'}</span></div>
                    <div><span className="text-xs text-gray-500">Transmission:</span> <span className="text-sm font-medium">{selectedVehicle.transmission || 'N/A'}</span></div>
                    <div><span className="text-xs text-gray-500">Fuel Type:</span> <span className="text-sm font-medium">{selectedVehicle.fuelType || 'N/A'}</span></div>
                    <div><span className="text-xs text-gray-500">Engine Size:</span> <span className="text-sm font-medium">{selectedVehicle.engineSize || 'N/A'}</span></div>
                    <div><span className="text-xs text-gray-500">Mileage:</span> <span className="text-sm font-medium">{selectedVehicle.mileage ? `${selectedVehicle.mileage} km` : 'N/A'}</span></div>
                  </div>
                </div>
                <div className="col-span-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Financial & Status</h3>
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                    <div><span className="text-xs text-gray-500">Price/Day:</span> <span className="text-sm font-medium text-green-600">KSh {selectedVehicle.pricePerDay?.toLocaleString() || 0}</span></div>
                    <div><span className="text-xs text-gray-500">Status:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusBadge(selectedVehicle.status).color}`}>{getStatusBadge(selectedVehicle.status).label}</span></div>
                    <div><span className="text-xs text-gray-500">Acquisition Cost:</span> <span className="text-sm font-medium">KSh {selectedVehicle.acquisitionCost?.toLocaleString() || 'N/A'}</span></div>
                    <div><span className="text-xs text-gray-500">Acquisition Date:</span> <span className="text-sm font-medium">{selectedVehicle.acquisitionDate || 'N/A'}</span></div>
                  </div>
                </div>
                <div className="col-span-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Additional Information</h3>
                  <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                    <div><span className="text-xs text-gray-500">Location:</span> <span className="text-sm font-medium">{selectedVehicle.location || 'N/A'}</span></div>
                    <div><span className="text-xs text-gray-500">Custodian:</span> <span className="text-sm font-medium">{selectedVehicle.custodian || 'N/A'}</span></div>
                    <div><span className="text-xs text-gray-500">Insurance:</span> <span className="text-sm font-medium">{selectedVehicle.insurance || 'N/A'}</span></div>
                    <div><span className="text-xs text-gray-500">Permit:</span> <span className="text-sm font-medium">{selectedVehicle.permit || 'N/A'}</span></div>
                    <div><span className="text-xs text-gray-500">License Expiry:</span> <span className="text-sm font-medium">{selectedVehicle.licenseExpiry || 'N/A'}</span></div>
                    <div><span className="text-xs text-gray-500">Roadworthy:</span> <span className="text-sm font-medium">{selectedVehicle.roadworthy || 'N/A'}</span></div>
                  </div>
                </div>
                {selectedVehicle.description && (
                  <div className="col-span-2">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-600">{selectedVehicle.description}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end">
              <button onClick={closeDetailModal} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Vehicles</h1>
          <p className="text-gray-500 text-sm mt-1">View your vehicle fleet</p>
          <p className="text-xs text-blue-600 mt-1">
            ℹ️ Click <span className="font-medium">View Details</span> to see full vehicle information
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {vehicles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-xl font-bold text-gray-800">{totalVehicles}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Active</p>
            <p className="text-xl font-bold text-green-600">{activeVehicles}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Rented</p>
            <p className="text-xl font-bold text-blue-600">{rentedVehicles}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Maintenance</p>
            <p className="text-xl font-bold text-yellow-600">{maintenanceVehicles}</p>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search vehicles by registration, make, model..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="all">All Status</option>
            {statusOptions.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading vehicles...</div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Car size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">
            {searchQuery || filterStatus !== 'all' ? 'No vehicles match your search' : 'You haven\'t added any vehicles yet'}
          </p>
          <p className="text-sm text-gray-400">
            {searchQuery || filterStatus !== 'all' ? 'Try adjusting your search or filter' : 'Contact your Fleet Manager to add vehicles'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => {
            const statusBadge = getStatusBadge(vehicle.status);
            const statusDot = getStatusDot(vehicle.status);
            
            return (
              <div 
                key={vehicle.id}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      {vehicle.images ? (
                        <img 
                          src={vehicle.images} 
                          alt={vehicle.registration} 
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <Car size={20} className="text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{vehicle.registration}</p>
                      <p className="text-xs text-gray-500">{vehicle.make} {vehicle.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${statusDot}`}></div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vehicle Image Preview */}
                {vehicle.images && (
                  <div className="mt-2">
                    <img 
                      src={vehicle.images} 
                      alt={vehicle.registration} 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-1 mt-3 text-xs text-gray-500">
                  <div><span className="font-medium text-gray-600">Category:</span> {vehicle.category || 'N/A'}</div>
                  <div><span className="font-medium text-gray-600">Year:</span> {vehicle.year || 'N/A'}</div>
                  <div><span className="font-medium text-gray-600">Color:</span> {vehicle.color || 'N/A'}</div>
                  <div><span className="font-medium text-gray-600">Seats:</span> {vehicle.seatingCapacity || 'N/A'}</div>
                  <div><span className="font-medium text-gray-600">Fuel:</span> {vehicle.fuelType || 'N/A'}</div>
                  <div><span className="font-medium text-gray-600">Price:</span> KSh {vehicle.pricePerDay?.toLocaleString() || 0}/day</div>
                  {vehicle.vin && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">VIN:</span> {vehicle.vin}
                    </div>
                  )}
                </div>

                {/* View Details Button Only */}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openDetailModal(vehicle)}
                    className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={16} /> View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyVehicles;