import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Car, Plus, Search, Edit2, Trash2, 
  X, Filter, RefreshCw, Save, 
  AlertCircle, CheckCircle, User, Upload, Image
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { vehicleService, carOwnerService } from '../../services/api';

const Vehicles = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [carOwners, setCarOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [notification, setNotification] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const isCarOwner = currentUser?.role === 'car_owner';

  // Form state
  const [formData, setFormData] = useState({
    registration: '',
    vin: '',
    make: '',
    model: '',
    year: '',
    color: '',
    category: '',
    status: 'active',
    mileage: '',
    ownerId: '',
    ownerName: '',
    location: '',
    custodian: '',
    insurance: '',
    permit: '',
    licenseExpiry: '',
    roadworthy: '',
    fuelType: '',
    engineSize: '',
    transmission: '',
    acquisitionDate: '',
    acquisitionCost: '',
    pricePerDay: '',
    seatingCapacity: '4',
    description: '',
    images: ''
  });

  useEffect(() => {
  const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
  console.log('🔍 User data in Vehicles:', userData);
  console.log('🔍 Tenant ID from user:', userData?.tenantId);
  
  const tid = userData?.tenantId || null;
  setTenantId(tid);
  
  // ✅ Pass tenantId directly to load function
  if (tid) {
    loadData(tid);
  } else {
    console.warn('⚠️ No tenantId found, will retry...');
    const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (storedUser?.tenantId) {
      setTenantId(storedUser.tenantId);
      loadData(storedUser.tenantId);
    }
  }
}, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = useCallback(async (tid) => {
  setLoading(true);
  try {
    // Use the passed tenantId or fallback to state
    const tenantToUse = tid || tenantId;
    console.log('🔍 Loading data with tenantId:', tenantToUse);
    
    // Load car owners first
    await loadCarOwners(tenantToUse);
    
    // Then load vehicles
    await loadVehicles(tenantToUse);
  } catch (error) {
    console.error('Error loading data:', error);
    showNotification('Failed to load data', 'error');
  }
  setLoading(false);
}, [tenantId]);

  const loadCarOwners = async (tid) => {
  try {
    const tenantToUse = tid || tenantId;
    let owners = [];
    
    console.log('🔍 ===== LOADING CAR OWNERS =====');
    console.log('📋 isCarOwner:', isCarOwner);
    console.log('📋 tenantId:', tenantToUse);
    console.log('📋 currentUser:', currentUser);
    
    if (isCarOwner) {
      const response = await carOwnerService.getByUser(currentUser.id);
      console.log('📊 Car owner by user response:', response);
      if (response?.success && response?.data) {
        owners = [response.data];
      } else if (response?.id) {
        owners = [response];
      }
    } else {
      console.log('📡 Calling carOwnerService.getAll with tenantId:', tenantToUse);
      const response = await carOwnerService.getAll(tenantToUse);
      console.log('📊 Full response:', response);
      
      if (response) {
        if (response.success === true && response.data) {
          if (Array.isArray(response.data)) {
            owners = response.data.filter(o => o.status === 'active' || o.status === 'Active');
            console.log('✅ Found owners from response.data (array):', owners.length);
          }
        } else if (Array.isArray(response)) {
          owners = response.filter(o => o.status === 'active' || o.status === 'Active');
        } else if (response.data && Array.isArray(response.data)) {
          owners = response.data.filter(o => o.status === 'active' || o.status === 'Active');
        }
      }
    }
    
    // ✅ FETCH REAL VEHICLE COUNT FOR EACH OWNER (like CarOwners page does)
    for (let i = 0; i < owners.length; i++) {
      try {
        const vehicleResponse = await vehicleService.getByOwner(owners[i].id);
        let vehicles = [];
        if (vehicleResponse?.success && vehicleResponse?.data) {
          vehicles = vehicleResponse.data;
        } else if (Array.isArray(vehicleResponse)) {
          vehicles = vehicleResponse;
        }
        owners[i].vehicleCount = vehicles.length;
        console.log(`✅ Owner ${owners[i].name} has ${vehicles.length} vehicles`);
      } catch (e) {
        console.error('Error getting vehicle count for owner:', e);
        owners[i].vehicleCount = 0;
      }
    }
    
    console.log('📋 Final car owners with counts:', owners);
    console.log('📋 Number of owners:', owners.length);
    setCarOwners(owners);
  } catch (error) {
    console.error('❌ Error loading car owners:', error);
    loadCarOwnersFromLocalStorage();
  }
};

  const loadCarOwnersFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('travel_agency_car_owners');
      if (stored) {
        const allOwners = JSON.parse(stored);
        const filtered = allOwners.filter(o => 
          o.tenantId === tenantId && (o.status === 'active' || o.status === 'Active')
        );
        setCarOwners(filtered);
      }
    } catch (e) {
      setCarOwners([]);
    }
  };

  const loadVehicles = async (tid) => {
  try {
    const tenantToUse = tid || tenantId;
    let vehiclesData = [];
    console.log('🔍 Loading vehicles with tenantId:', tenantToUse);
    
    if (isCarOwner) {
      const ownerResponse = await carOwnerService.getByUser(currentUser.id);
      let ownerId = null;
      if (ownerResponse?.success && ownerResponse?.data) {
        ownerId = ownerResponse.data.id;
      } else if (ownerResponse?.id) {
        ownerId = ownerResponse.id;
      }
      
      if (ownerId) {
        const response = await vehicleService.getByOwner(ownerId);
        if (response?.success && response?.data) {
          vehiclesData = response.data;
        } else if (Array.isArray(response)) {
          vehiclesData = response;
        }
      }
    } else {
      console.log('📡 Calling vehicleService.getAll with tenantId:', tenantToUse);
      const response = await vehicleService.getAll(tenantToUse);
      console.log('📊 Vehicles API response:', response);
      if (response?.success && response?.data) {
        vehiclesData = response.data;
      } else if (Array.isArray(response)) {
        vehiclesData = response;
      }
    }
    
    console.log('📋 Vehicles loaded:', vehiclesData.length);
    setVehicles(vehiclesData);
  } catch (error) {
    console.error('Error loading vehicles:', error);
    showNotification('Failed to load vehicles', 'error');
  }
};

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        // Store base64 image in formData
        setFormData({
          ...formData,
          images: reader.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      registration: '',
      vin: '',
      make: '',
      model: '',
      year: '',
      color: '',
      category: '',
      status: 'active',
      mileage: '',
      ownerId: '',
      ownerName: '',
      location: '',
      custodian: '',
      insurance: '',
      permit: '',
      licenseExpiry: '',
      roadworthy: '',
      fuelType: '',
      engineSize: '',
      transmission: '',
      acquisitionDate: '',
      acquisitionCost: '',
      pricePerDay: '',
      seatingCapacity: '4',
      description: '',
      images: ''
    });
    setImagePreview(null);
  };

  const handleOwnerSelect = (ownerId) => {
    const selectedOwner = carOwners.find(o => o.id === ownerId);
    setFormData({
      ...formData,
      ownerId: ownerId,
      ownerName: selectedOwner ? selectedOwner.name : ''
    });
  };

  const handleAddVehicle = async () => {
    if (!formData.registration || !formData.make || !formData.model) {
      showNotification('Please fill in Registration, Make and Model', 'error');
      return;
    }

    if (vehicles.some(v => v.registration === formData.registration)) {
      showNotification(`Vehicle with registration ${formData.registration} already exists`, 'error');
      return;
    }

    try {
      let ownerId = formData.ownerId;
      let ownerName = formData.ownerName;
      
      if (isCarOwner) {
        const ownerResponse = await carOwnerService.getByUser(currentUser.id);
        if (ownerResponse?.success && ownerResponse?.data) {
          ownerId = ownerResponse.data.id;
          ownerName = ownerResponse.data.name;
        } else if (ownerResponse?.id) {
          ownerId = ownerResponse.id;
          ownerName = ownerResponse.name;
        } else {
          showNotification('Car owner profile not found. Please contact admin.', 'error');
          return;
        }
      }

      const newVehicle = {
        registration: formData.registration,
        vin: formData.vin,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year) || null,
        color: formData.color,
        category: formData.category,
        status: formData.status || 'active',
        mileage: parseFloat(formData.mileage) || null,
        ownerId: ownerId,
        ownerName: ownerName,
        tenantId: tenantId,
        location: formData.location,
        custodian: formData.custodian,
        insurance: formData.insurance,
        permit: formData.permit,
        licenseExpiry: formData.licenseExpiry || null,
        roadworthy: formData.roadworthy || null,
        fuelType: formData.fuelType,
        engineSize: formData.engineSize,
        transmission: formData.transmission,
        acquisitionDate: formData.acquisitionDate || null,
        acquisitionCost: parseFloat(formData.acquisitionCost) || null,
        pricePerDay: parseFloat(formData.pricePerDay) || 0,
        seatingCapacity: parseInt(formData.seatingCapacity) || 4,
        description: formData.description,
        images: formData.images || null
      };

      console.log('📤 Sending vehicle data:', newVehicle);
      const response = await vehicleService.create(newVehicle);
      console.log('📥 Create vehicle response:', response);
      
      if (response?.success) {
        showNotification(`Vehicle ${newVehicle.registration} added successfully!`);
        setShowAddModal(false);
        resetForm();
        loadVehicles();
      } else {
        showNotification('Failed to add vehicle: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error adding vehicle:', error);
      showNotification('Failed to add vehicle. Please try again.', 'error');
    }
  };

  const handleEditVehicle = async () => {
    if (!editingVehicle) return;

    try {
      let ownerId = formData.ownerId;
      let ownerName = formData.ownerName;
      
      if (isCarOwner) {
        const ownerResponse = await carOwnerService.getByUser(currentUser.id);
        if (ownerResponse?.success && ownerResponse?.data) {
          ownerId = ownerResponse.data.id;
          ownerName = ownerResponse.data.name;
        } else if (ownerResponse?.id) {
          ownerId = ownerResponse.id;
          ownerName = ownerResponse.name;
        }
      }

      const updatedVehicle = {
        registration: formData.registration,
        vin: formData.vin,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year) || null,
        color: formData.color,
        category: formData.category,
        status: formData.status || 'active',
        mileage: parseFloat(formData.mileage) || null,
        ownerId: ownerId,
        ownerName: ownerName,
        tenantId: tenantId,
        location: formData.location,
        custodian: formData.custodian,
        insurance: formData.insurance,
        permit: formData.permit,
        licenseExpiry: formData.licenseExpiry || null,
        roadworthy: formData.roadworthy || null,
        fuelType: formData.fuelType,
        engineSize: formData.engineSize,
        transmission: formData.transmission,
        acquisitionDate: formData.acquisitionDate || null,
        acquisitionCost: parseFloat(formData.acquisitionCost) || null,
        pricePerDay: parseFloat(formData.pricePerDay) || 0,
        seatingCapacity: parseInt(formData.seatingCapacity) || 4,
        description: formData.description,
        images: formData.images || null
      };

      const response = await vehicleService.update(editingVehicle.id, updatedVehicle);
      
      if (response?.success) {
        showNotification(`Vehicle ${formData.registration} updated successfully!`);
        setEditingVehicle(null);
        setShowAddModal(false);
        resetForm();
        loadVehicles();
      } else {
        showNotification('Failed to update vehicle: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error updating vehicle:', error);
      showNotification('Failed to update vehicle. Please try again.', 'error');
    }
  };

  const handleDeleteVehicle = async () => {
    if (!selectedVehicle) return;

    try {
      const response = await vehicleService.delete(selectedVehicle.id);
      
      if (response?.success) {
        showNotification(`Vehicle ${selectedVehicle.registration} deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedVehicle(null);
        loadVehicles();
      } else {
        showNotification('Failed to delete vehicle: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      showNotification('Failed to delete vehicle. Please try again.', 'error');
    }
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      registration: vehicle.registration || '',
      vin: vehicle.vin || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      color: vehicle.color || '',
      category: vehicle.category || '',
      status: vehicle.status || 'active',
      mileage: vehicle.mileage || '',
      ownerId: vehicle.ownerId || '',
      ownerName: vehicle.ownerName || '',
      location: vehicle.location || '',
      custodian: vehicle.custodian || '',
      insurance: vehicle.insurance || '',
      permit: vehicle.permit || '',
      licenseExpiry: vehicle.licenseExpiry || '',
      roadworthy: vehicle.roadworthy || '',
      fuelType: vehicle.fuelType || '',
      engineSize: vehicle.engineSize || '',
      transmission: vehicle.transmission || '',
      acquisitionDate: vehicle.acquisitionDate || '',
      acquisitionCost: vehicle.acquisitionCost || '',
      pricePerDay: vehicle.pricePerDay || '',
      seatingCapacity: vehicle.seatingCapacity || '4',
      description: vehicle.description || '',
      images: vehicle.images || ''
    });
    setImagePreview(vehicle.images || null);
    setShowAddModal(true);
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
      v.color?.toLowerCase().includes(searchLower) ||
      v.ownerName?.toLowerCase().includes(searchLower);
    
    const matchesFilter = filterStatus === 'all' || v.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const vehicleCategories = ['SUV', 'Sedan', 'Minibus', 'Luxury', 'Hatchback', 'Pickup', 'Van', 'Truck'];
  const statusOptions = ['active', 'inactive', 'maintenance', 'disposed', 'rented'];
  const transmissionOptions = ['Automatic', 'Manual', 'CVT'];
  const fuelTypeOptions = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'LPG'];

  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const rentedVehicles = vehicles.filter(v => v.status === 'rented').length;
  const maintenanceVehicles = vehicles.filter(v => v.status === 'maintenance').length;
  const inactiveVehicles = vehicles.filter(v => v.status === 'inactive').length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {isCarOwner ? 'My Vehicles' : 'All Vehicles'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isCarOwner ? 'Manage your vehicles' : 'Manage all vehicles in your fleet'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
             onClick={() => loadVehicles(tenantId)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={() => {
              resetForm();
              setEditingVehicle(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search vehicles by registration, VIN, make, model, owner..."
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

      {/* Stats Summary */}
      {vehicles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
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
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Inactive</p>
            <p className="text-xl font-bold text-gray-600">{inactiveVehicles}</p>
          </div>
        </div>
      )}

      {/* Vehicles Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading vehicles...</div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Car size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">
            {searchQuery || filterStatus !== 'all' ? 'No vehicles match your search' : 'No vehicles found'}
          </p>
          <p className="text-sm text-gray-400">
            {searchQuery || filterStatus !== 'all' ? 'Try adjusting your search or filter' : 'Add your first vehicle to get started'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setEditingVehicle(null);
              setShowAddModal(true);
            }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Add Vehicle
          </button>
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
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      {vehicle.images ? (
                        <img 
                          src={vehicle.images} 
                          alt={vehicle.registration} 
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <Car size={20} className="text-gray-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{vehicle.registration}</p>
                      <p className="text-xs text-gray-500">{vehicle.make} {vehicle.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${statusDot}`}></div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </div>
                </div>

                {vehicle.images && (
                  <div className="mt-2">
                    <img 
                      src={vehicle.images} 
                      alt={vehicle.registration} 
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-1 mt-3 text-xs text-gray-500">
                  <div><span className="font-medium text-gray-600">Category:</span> {vehicle.category || 'N/A'}</div>
                  <div><span className="font-medium text-gray-600">Year:</span> {vehicle.year || 'N/A'}</div>
                  <div><span className="font-medium text-gray-600">Color:</span> {vehicle.color || 'N/A'}</div>
                  <div><span className="font-medium text-gray-600">Seats:</span> {vehicle.seatingCapacity || 'N/A'}</div>
                  <div><span className="font-medium text-gray-600">Fuel:</span> {vehicle.fuelType || 'N/A'}</div>
                  <div><span className="font-medium text-gray-600">Price:</span> KSh {vehicle.pricePerDay?.toLocaleString() || 0}/day</div>
                  {vehicle.ownerName && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">Owner:</span> {vehicle.ownerName}
                    </div>
                  )}
                  {vehicle.vin && (
                    <div className="col-span-2">
                      <span className="font-medium text-gray-600">VIN:</span> {vehicle.vin}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openEditModal(vehicle)}
                    className="flex-1 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setShowDeleteModal(true);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal - Updated with Image Upload */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            setShowAddModal(false);
            setEditingVehicle(null);
            resetForm();
          }}></div>
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingVehicle ? 'Edit Vehicle' : 'Add New Vehicle'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingVehicle(null);
                  resetForm();
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {/* Image Upload Section */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Image size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm text-gray-600">
                        <Upload size={16} />
                        Choose Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    </label>
                    <p className="text-[10px] text-gray-400 mt-1">Upload vehicle image (JPG, PNG, GIF)</p>
                    {imagePreview && (
                      <button
                        onClick={() => {
                          setImagePreview(null);
                          setFormData({...formData, images: ''});
                        }}
                        className="text-xs text-red-500 hover:text-red-600 mt-1"
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Registration *</label>
                  <input
                    type="text"
                    value={formData.registration}
                    onChange={(e) => setFormData({...formData, registration: e.target.value.toUpperCase()})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="KCA 123A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">VIN</label>
                  <input
                    type="text"
                    value={formData.vin}
                    onChange={(e) => setFormData({...formData, vin: e.target.value.toUpperCase()})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="17 character VIN"
                  />
                </div>
              </div>

              {/* Rest of the form fields (same as before) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Make *</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({...formData, make: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Land Cruiser"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({...formData, year: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="2022"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="White"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Select Category</option>
                    {vehicleCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Seating Capacity</label>
                  <select
                    value={formData.seatingCapacity}
                    onChange={(e) => setFormData({...formData, seatingCapacity: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {[2,3,4,5,6,7,8,9,10,12,14,16].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Transmission</label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({...formData, transmission: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Select</option>
                    {transmissionOptions.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fuel Type</label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({...formData, fuelType: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Select</option>
                    {fuelTypeOptions.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Engine Size</label>
                  <input
                    type="text"
                    value={formData.engineSize}
                    onChange={(e) => setFormData({...formData, engineSize: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="2.0L"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mileage (km)</label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({...formData, mileage: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="15000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price/Day (KES)</label>
                  <input
                    type="number"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({...formData, pricePerDay: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="15000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {statusOptions.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* OWNER DROPDOWN - Only show for Fleet Manager */}
              {!isCarOwner && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Car Owner *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      value={formData.ownerId}
                      onChange={(e) => handleOwnerSelect(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm"
                      required
                    >
                      <option value="">Select Car Owner...</option>
                      {carOwners.length === 0 ? (
                        <option disabled>No car owners registered yet</option>
                      ) : (
                        carOwners.map(owner => (
                          <option key={owner.id} value={owner.id}>
                            {owner.name} {owner.companyName ? `(${owner.companyName})` : ''} - {owner.vehicleCount || 0} vehicles
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  {carOwners.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ No car owners registered. Please add car owners first.
                    </p>
                  )}
                </div>
              )}

              {isCarOwner && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Car Owner</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={formData.ownerName || currentUser?.name || ''}
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-sm text-gray-600"
                      disabled
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Vehicle will be automatically assigned to you</p>
                </div>
              )}

              {/* Location and Custodian */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nairobi"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Custodian</label>
                  <input
                    type="text"
                    value={formData.custodian}
                    onChange={(e) => setFormData({...formData, custodian: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Person responsible"
                  />
                </div>
              </div>

              {/* Insurance and Permit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Insurance</label>
                  <input
                    type="text"
                    value={formData.insurance}
                    onChange={(e) => setFormData({...formData, insurance: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="APA Insurance - Policy #123456"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Permit</label>
                  <input
                    type="text"
                    value={formData.permit}
                    onChange={(e) => setFormData({...formData, permit: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Permit number"
                  />
                </div>
              </div>

              {/* License Expiry and Roadworthy */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">License Expiry</label>
                  <input
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(e) => setFormData({...formData, licenseExpiry: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Roadworthy</label>
                  <input
                    type="date"
                    value={formData.roadworthy}
                    onChange={(e) => setFormData({...formData, roadworthy: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              {/* Acquisition Date and Cost */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Acquisition Date</label>
                  <input
                    type="date"
                    value={formData.acquisitionDate}
                    onChange={(e) => setFormData({...formData, acquisitionDate: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Acquisition Cost (KES)</label>
                  <input
                    type="number"
                    value={formData.acquisitionCost}
                    onChange={(e) => setFormData({...formData, acquisitionCost: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="1000000"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows="2"
                  placeholder="Vehicle description..."
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingVehicle(null);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={editingVehicle ? handleEditVehicle : handleAddVehicle}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
              >
                <Save size={16} />
                {editingVehicle ? 'Update Vehicle' : 'Add Vehicle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Delete Vehicle</h2>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete "{selectedVehicle.registration}" ({selectedVehicle.make} {selectedVehicle.model})?
                This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteVehicle}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Delete Vehicle
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vehicles;