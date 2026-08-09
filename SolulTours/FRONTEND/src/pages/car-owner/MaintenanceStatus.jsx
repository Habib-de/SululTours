import React, { useState, useEffect } from 'react';
import { 
  Wrench, Search, Filter, RefreshCw, 
  Eye, X, AlertCircle, CheckCircle, 
  Calendar, Clock, Car, DollarSign,
  Image, Camera, AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { maintenanceService, vehicleService, carOwnerService } from '../../services/api';

const MaintenanceStatus = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [carOwner, setCarOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [ownerId, setOwnerId] = useState(null);

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
        } else if (vehiclesResponse?.data && Array.isArray(vehiclesResponse.data)) {
          vehiclesData = vehiclesResponse.data;
        }
      } catch (e) {
        console.warn('Could not fetch vehicles:', e);
      }
      setVehicles(vehiclesData);

      // ✅ 2. Get all maintenance records for the tenant
      let maintenanceData = [];
      try {
        const maintenanceResponse = await maintenanceService.getAll(tid);
        console.log('📊 Maintenance Response:', maintenanceResponse);
        
        let allRecords = [];
        if (maintenanceResponse?.success && maintenanceResponse?.data) {
          allRecords = maintenanceResponse.data;
        } else if (Array.isArray(maintenanceResponse)) {
          allRecords = maintenanceResponse;
        } else if (maintenanceResponse?.data && Array.isArray(maintenanceResponse.data)) {
          allRecords = maintenanceResponse.data;
        }
        
        // ✅ Filter maintenance records for owner's vehicles
        const vehicleIds = vehiclesData.map(v => v.id);
        maintenanceData = allRecords.filter(r => vehicleIds.includes(r.vehicleId));
      } catch (e) {
        console.warn('Could not fetch maintenance records:', e);
      }
      
      setMaintenanceRecords(maintenanceData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Error loading maintenance records', 'error');
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  // ✅ Fallback to localStorage
  const loadFromLocalStorage = () => {
    console.warn('Loading maintenance data from localStorage (fallback)');
    
    try {
      // Get car owner
      const allOwners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
      const owner = allOwners.find(o => o.userId === currentUser?.id);
      setCarOwner(owner);

      // Get all vehicles
      const storedVehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
      
      if (owner) {
        // Get owner's vehicles
        const ownerVehicles = storedVehicles.filter(v => v.ownerId === owner.id);
        setVehicles(ownerVehicles);
        
        // Get maintenance records for owner's vehicles
        const ownerVehicleIds = ownerVehicles.map(v => v.id);
        const storedMaintenance = JSON.parse(localStorage.getItem('travel_agency_maintenance') || '[]');
        const ownerRecords = storedMaintenance.filter(r => 
          ownerVehicleIds.includes(r.vehicleId)
        );
        setMaintenanceRecords(ownerRecords);
      } else {
        setVehicles([]);
        setMaintenanceRecords([]);
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
      setVehicles([]);
      setMaintenanceRecords([]);
    }
  };

  const getVehicleDetails = (vehicleId) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-800' },
      in_progress: { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
      overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { label: status || 'Scheduled', color: 'bg-gray-100 text-gray-800' };
  };

  const getPriorityBadge = (priority) => {
    const priorityMap = {
      low: { label: 'Low', color: 'bg-gray-100 text-gray-800' },
      medium: { label: 'Medium', color: 'bg-blue-100 text-blue-800' },
      high: { label: 'High', color: 'bg-yellow-100 text-yellow-800' },
      critical: { label: 'Critical', color: 'bg-red-100 text-red-800' }
    };
    return priorityMap[priority] || { label: priority || 'Medium', color: 'bg-gray-100 text-gray-800' };
  };

  const getTypeLabel = (type) => {
    const typeMap = {
      oil_change: 'Oil Change',
      tire_rotation: 'Tire Rotation',
      brake_service: 'Brake Service',
      engine_repair: 'Engine Repair',
      transmission: 'Transmission Service',
      electrical: 'Electrical Repair',
      body_repair: 'Body Repair',
      general: 'General Service'
    };
    return typeMap[type] || type || 'General Service';
  };

  const maintenanceTypes = [
    { value: 'oil_change', label: 'Oil Change' },
    { value: 'tire_rotation', label: 'Tire Rotation' },
    { value: 'brake_service', label: 'Brake Service' },
    { value: 'engine_repair', label: 'Engine Repair' },
    { value: 'transmission', label: 'Transmission Service' },
    { value: 'electrical', label: 'Electrical Repair' },
    { value: 'body_repair', label: 'Body Repair' },
    { value: 'general', label: 'General Service' }
  ];

  const statusOptions = ['all', 'scheduled', 'in_progress', 'completed', 'cancelled', 'overdue'];

  const filteredRecords = maintenanceRecords.filter(r => {
    const vehicle = getVehicleDetails(r.vehicleId);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      vehicle?.registration?.toLowerCase().includes(searchLower) ||
      vehicle?.make?.toLowerCase().includes(searchLower) ||
      vehicle?.model?.toLowerCase().includes(searchLower) ||
      r.description?.toLowerCase().includes(searchLower) ||
      r.technician?.toLowerCase().includes(searchLower) ||
      r.maintenanceType?.toLowerCase().includes(searchLower);
    
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesType = filterType === 'all' || r.maintenanceType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Stats
  const totalRecords = maintenanceRecords.length;
  const scheduledRecords = maintenanceRecords.filter(r => r.status === 'scheduled').length;
  const inProgressRecords = maintenanceRecords.filter(r => r.status === 'in_progress').length;
  const completedRecords = maintenanceRecords.filter(r => r.status === 'completed').length;
  const overdueRecords = maintenanceRecords.filter(r => r.status === 'overdue').length;
  const totalCost = maintenanceRecords.reduce((sum, r) => sum + (r.cost || 0), 0);

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

      {/* Image Modal */}
      {showImageModal && selectedRecord && selectedRecord.receiptImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowImageModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Camera size={24} />
                <div>
                  <h2 className="text-lg font-semibold">Receipt Image</h2>
                  <p className="text-sm text-blue-100">
  {(() => {
    const vehicle = vehicles.find(v => v.id === selectedRecord?.vehicleId);
    return `${vehicle?.registration || 'Vehicle'} - ${getTypeLabel(selectedRecord.maintenanceType)}`;
  })()}
</p>
                </div>
              </div>
              <button onClick={() => setShowImageModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 flex items-center justify-center">
              <img 
                src={selectedRecord.receiptImage} 
                alt="Receipt" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end">
              <button 
                onClick={() => setShowImageModal(false)} 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Wrench size={24} />
                <div>
                  <h2 className="text-lg font-semibold">Maintenance Details</h2>
                  <p className="text-sm text-purple-100">Record #{selectedRecord.id?.slice(0, 10)}...</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
  <h3 className="text-sm font-semibold text-gray-700 mb-2">Vehicle</h3>
  {(() => {
    const vehicle = vehicles.find(v => v.id === selectedRecord?.vehicleId);
    return (
      <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
        <div>
          <span className="text-xs text-gray-500">Registration:</span>
          <span className="text-sm font-medium">{vehicle?.registration || 'N/A'}</span>
        </div>
        <div>
          <span className="text-xs text-gray-500">Make/Model:</span>
          <span className="text-sm font-medium">{vehicle?.make || 'N/A'} {vehicle?.model || ''}</span>
        </div>
      </div>
    );
  })()}
</div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Maintenance Details</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div><span className="text-xs text-gray-500">Type:</span> <span className="text-sm font-medium">{getTypeLabel(selectedRecord.maintenanceType)}</span></div>
                  <div><span className="text-xs text-gray-500">Status:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusBadge(selectedRecord.status).color}`}>{getStatusBadge(selectedRecord.status).label}</span></div>
                  <div><span className="text-xs text-gray-500">Priority:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getPriorityBadge(selectedRecord.priority).color}`}>{getPriorityBadge(selectedRecord.priority).label}</span></div>
                  <div><span className="text-xs text-gray-500">Cost:</span> <span className="text-sm font-medium text-green-600">KSh {selectedRecord.cost?.toLocaleString() || 0}</span></div>
                  <div className="col-span-2"><span className="text-xs text-gray-500">Description:</span> <span className="text-sm font-medium">{selectedRecord.description || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">Date:</span> <span className="text-sm font-medium">{selectedRecord.date || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">Next Due:</span> <span className="text-sm font-medium">{selectedRecord.nextDueDate || 'N/A'}</span></div>
                  <div className="col-span-2"><span className="text-xs text-gray-500">Technician:</span> <span className="text-sm font-medium">{selectedRecord.technician || 'N/A'}</span></div>
                  {selectedRecord.receiptImage && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500">Receipt:</span>
                      <button
                        onClick={() => {
                          setShowDetailModal(false);
                          setShowImageModal(true);
                        }}
                        className="mt-1 flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Image size={16} />
                        <span className="text-sm">View Receipt Image</span>
                      </button>
                    </div>
                  )}
                  {selectedRecord.notes && (
                    <div className="col-span-2"><span className="text-xs text-gray-500">Notes:</span> <span className="text-sm font-medium">{selectedRecord.notes}</span></div>
                  )}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Maintenance Status</h1>
          <p className="text-gray-500 text-sm mt-1">View maintenance records for your vehicles</p>
          {carOwner && (
            <p className="text-xs text-blue-600 mt-1">👤 {carOwner.name}</p>
          )}
          {maintenanceRecords.length === 0 && !loading && (
            <p className="text-xs text-gray-400 mt-1">No maintenance records found for your vehicles</p>
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

      {/* Stats */}
      {maintenanceRecords.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-xl font-bold text-gray-800">{totalRecords}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Scheduled</p>
            <p className="text-xl font-bold text-blue-600">{scheduledRecords}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">In Progress</p>
            <p className="text-xl font-bold text-yellow-600">{inProgressRecords}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Completed</p>
            <p className="text-xl font-bold text-green-600">{completedRecords}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Total Cost</p>
            <p className="text-xl font-bold text-purple-600">KSh {totalCost.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      {maintenanceRecords.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by vehicle or description..."
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
              {statusOptions.map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All Status' : s.replace('_', ' ').charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Types</option>
              {maintenanceTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Maintenance List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Wrench size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No maintenance records found</p>
          <p className="text-sm text-gray-400">
            {searchQuery || filterStatus !== 'all' || filterType !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Maintenance records for your vehicles will appear here'}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            💡 Contact your Fleet Manager to add or update maintenance records
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record) => {
            const vehicle = getVehicleDetails(record.vehicleId);
            const statusBadge = getStatusBadge(record.status);
            const priorityBadge = getPriorityBadge(record.priority);
            const hasReceipt = record.receiptImage !== null && record.receiptImage !== '';

            return (
              <div 
                key={record.id}
                className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Wrench size={20} className="text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {vehicle ? `${vehicle.registration} - ${vehicle.make} ${vehicle.model}` : 'Vehicle not found'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {getTypeLabel(record.maintenanceType)} • {record.date || 'Date not set'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasReceipt && (
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowImageModal(true);
                          }}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                          title="View Receipt"
                        >
                          <Image size={16} />
                        </button>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${priorityBadge.color}`}>
                        {priorityBadge.label}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-xs text-gray-500">
                    <div><span className="font-medium text-gray-600">Type:</span> {getTypeLabel(record.maintenanceType)}</div>
                    <div><span className="font-medium text-gray-600">Cost:</span> <span className="text-green-600 font-medium">KSh {record.cost?.toLocaleString() || 0}</span></div>
                    <div><span className="font-medium text-gray-600">Date:</span> {record.date || 'N/A'}</div>
                    <div><span className="font-medium text-gray-600">Technician:</span> {record.technician || 'N/A'}</div>
                  </div>

                  {/* Additional details */}
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-500">
                    {record.description && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-600">Description:</span>
                        <span className="text-gray-700 ml-1">{record.description}</span>
                      </div>
                    )}
                    {record.nextDueDate && (
                      <div>
                        <span className="font-medium text-gray-600">Next Due:</span>
                        <span className="text-gray-700 ml-1">{record.nextDueDate}</span>
                      </div>
                    )}
                    {record.notes && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-600">Notes:</span>
                        <span className="text-gray-700 ml-1">{record.notes}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedRecord(record);
                        setShowDetailModal(true);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye size={14} /> View Details
                    </button>
                    <span className="text-[10px] text-gray-400">
                      🔒 Read-only
                    </span>
                  </div>
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

export default MaintenanceStatus;