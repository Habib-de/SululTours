import React, { useState, useEffect } from 'react';
import { 
  Users, Plus, Search, Edit2, Trash2, 
  X, Filter, RefreshCw, Save, 
  AlertCircle, CheckCircle, User,
  Phone, Mail, MapPin, Building, Eye,
  Clock, UserCheck, UserX, Car
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { carOwnerService, userService, vehicleService } from '../../services/api';

const CarOwners = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [carOwners, setCarOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [editingOwner, setEditingOwner] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [notification, setNotification] = useState(null);
  const [tenantId, setTenantId] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    idNumber: '',
    companyName: '',
    notes: ''
  });

  useEffect(() => {
  // Get tenant ID from logged-in user
  const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
  const tid = userData?.tenantId || null;
  console.log('🔍 Tenant ID from localStorage:', tid);  // ✅ ADD THIS
  setTenantId(tid);
  
  // ✅ Pass tenantId directly to load function
  loadCarOwners(tid);
}, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadCarOwners = async (tid) => {
  setLoading(true);
  try {
    const tenantToUse = tid || tenantId;
    console.log('🔍 Loading car owners for tenant:', tenantToUse);
    
    if (!tenantToUse) {
      console.warn('⚠️ No tenantId available, skipping API call');
      setLoading(false);
      return;
    }
    
    const response = await carOwnerService.getAll(tenantToUse);
    console.log('📊 API Response:', response);
    
    let owners = [];
    if (response?.success && response?.data) {
      owners = response.data;
      
      // ✅ FETCH REAL VEHICLE COUNT FOR EACH OWNER
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
        } catch (e) {
          console.error('Error getting vehicle count for owner:', e);
          owners[i].vehicleCount = 0;
        }
      }
      
      console.log('✅ Found owners with updated vehicle counts:', owners.length);
    } else if (Array.isArray(response)) {
      owners = response;
    } else if (response?.data && Array.isArray(response.data)) {
      owners = response.data;
    }
    
    setCarOwners(owners);
  } catch (error) {
    console.error('Error loading car owners:', error);
    showNotification('Failed to load car owners', 'error');
    loadFromLocalStorage();
  }
  setLoading(false);
};

  // Fallback to localStorage
  const loadFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem('travel_agency_car_owners');
      if (stored) {
        const allOwners = JSON.parse(stored);
        const filtered = allOwners.filter(o => 
          o.tenantId === tenantId || !o.tenantId
        );
        setCarOwners(filtered);
      }
    } catch (e) {
      setCarOwners([]);
    }
  };

  const handleAddOwner = async () => {
    if (!formData.name) {
      showNotification('Please enter owner name', 'error');
      return;
    }

    try {
      const newOwner = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        idNumber: formData.idNumber,
        companyName: formData.companyName,
        tenantId: tenantId,
        status: 'active',
        vehicleCount: 0
      };

      const response = await carOwnerService.create(newOwner);
      
      if (response?.success) {
        showNotification(`Owner ${formData.name} added successfully!`);
        setShowAddModal(false);
        resetForm();
        loadCarOwners();
      } else {
        showNotification('Failed to add owner: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error adding owner:', error);
      showNotification('Failed to add owner. Please try again.', 'error');
    }
  };

  const handleEditOwner = async () => {
    if (!editingOwner) return;

    try {
      const updatedOwner = {
        ...editingOwner,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        idNumber: formData.idNumber,
        companyName: formData.companyName,
        notes: formData.notes
      };

      const response = await carOwnerService.update(editingOwner.id, updatedOwner);
      
      if (response?.success) {
        showNotification(`Owner updated successfully!`);
        setEditingOwner(null);
        setShowAddModal(false);
        resetForm();
        loadCarOwners();
      } else {
        showNotification('Failed to update owner: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error updating owner:', error);
      showNotification('Failed to update owner. Please try again.', 'error');
    }
  };

  const handleDeleteOwner = async () => {
    if (!selectedOwner) return;

    // Check if owner has vehicles
    try {
      const vehiclesResponse = await vehicleService.getByOwner(selectedOwner.id);
      let hasVehicles = false;
      if (vehiclesResponse?.data && Array.isArray(vehiclesResponse.data)) {
        hasVehicles = vehiclesResponse.data.length > 0;
      }
      
      if (hasVehicles) {
        showNotification(`Cannot delete ${selectedOwner.name} - they have vehicles assigned`, 'error');
        setShowDeleteModal(false);
        setSelectedOwner(null);
        return;
      }

      const response = await carOwnerService.delete(selectedOwner.id);
      
      if (response?.success) {
        showNotification(`Owner ${selectedOwner.name} deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedOwner(null);
        loadCarOwners();
      } else {
        showNotification('Failed to delete owner: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting owner:', error);
      showNotification('Failed to delete owner. Please try again.', 'error');
    }
  };

  const handleStatusToggle = async (ownerId, currentStatus) => {
  const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
  
  try {
    const owner = carOwners.find(o => o.id === ownerId);
    if (!owner) {
      showNotification('Owner not found', 'error');
      return;
    }

    console.log('🔍 Toggling status for owner:', ownerId);
    console.log('📋 Owner data:', owner);
    console.log('🔄 New status:', newStatus);
    console.log('👤 User ID to update:', owner.userId);

    if (!owner.userId) {
      showNotification('Owner has no associated user account', 'error');
      return;
    }

    // ✅ Update the USER status
    const userResponse = await userService.update(owner.userId, {
      status: newStatus
    });
    
    console.log('📊 User update response:', userResponse);
    
    if (userResponse?.success) {
      // ✅ Also update the car owner status to match
      const updatedOwner = {
        ...owner,
        status: newStatus
      };
      await carOwnerService.update(ownerId, updatedOwner);
      
      showNotification(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully!`);
      loadCarOwners(tenantId);
    } else {
      showNotification('Failed to update status: ' + (userResponse?.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error updating status:', error);
    showNotification('Failed to update status. Please try again.', 'error');
  }
};

  const openEditModal = (owner) => {
    setEditingOwner(owner);
    setFormData({
      name: owner.name || '',
      email: owner.email || '',
      phone: owner.phone || '',
      address: owner.address || '',
      idNumber: owner.idNumber || '',
      companyName: owner.companyName || '',
      notes: owner.notes || ''
    });
    setShowAddModal(true);
  };

  const openDetailModal = (owner) => {
    setSelectedOwner(owner);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      idNumber: '',
      companyName: '',
      notes: ''
    });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800' },
      suspended: { label: 'Suspended', color: 'bg-red-100 text-red-800' },
      pending_approval: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' }
    };
    return statusMap[status] || { label: status || 'Active', color: 'bg-gray-100 text-gray-800' };
  };

  const getStatusDot = (status) => {
    const dotMap = {
      active: 'bg-green-500',
      suspended: 'bg-red-500',
      pending_approval: 'bg-yellow-500',
      inactive: 'bg-gray-500'
    };
    return dotMap[status] || 'bg-gray-400';
  };

  const filteredOwners = carOwners.filter(o => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      o.name?.toLowerCase().includes(searchLower) ||
      o.email?.toLowerCase().includes(searchLower) ||
      o.phone?.toLowerCase().includes(searchLower) ||
      o.companyName?.toLowerCase().includes(searchLower);
    
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusOptions = ['all', 'active', 'suspended', 'pending_approval', 'inactive'];

  // Stats
  const totalOwners = carOwners.length;
  const activeOwners = carOwners.filter(o => o.status === 'active').length;
  const pendingOwners = carOwners.filter(o => o.status === 'pending_approval').length;
  const suspendedOwners = carOwners.filter(o => o.status === 'suspended').length;

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
      {showDetailModal && selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <User size={24} />
                <div>
                  <h2 className="text-lg font-semibold">{selectedOwner.name}</h2>
                  <p className="text-sm text-blue-100">{selectedOwner.companyName || 'Individual Owner'}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium">{selectedOwner.email || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{selectedOwner.phone || 'N/A'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">ID Number</p>
                    <p className="text-sm font-medium">{selectedOwner.idNumber || 'N/A'}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusBadge(selectedOwner.status).color}`}>
                      {getStatusBadge(selectedOwner.status).label}
                    </span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium">{selectedOwner.address || 'N/A'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Vehicles</p>
                  <p className="text-sm font-medium">{selectedOwner.vehicleCount || 0} vehicles</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">Registered</p>
                  <p className="text-sm font-medium">{new Date(selectedOwner.createdAt).toLocaleDateString()}</p>
                </div>
                {selectedOwner.notes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Notes</p>
                    <p className="text-sm font-medium">{selectedOwner.notes}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Car Owners</h1>
          <p className="text-gray-500 text-sm mt-1">Manage car owners who supply vehicles</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => loadCarOwners(tenantId)} 
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={() => {
              resetForm();
              setEditingOwner(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Add Owner
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {carOwners.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-xl font-bold text-gray-800">{totalOwners}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Active</p>
            <p className="text-xl font-bold text-green-600">{activeOwners}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Pending</p>
            <p className="text-xl font-bold text-yellow-600">{pendingOwners}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Suspended</p>
            <p className="text-xl font-bold text-red-600">{suspendedOwners}</p>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search owners by name, email, phone..."
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
              <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Owners Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading owners...</div>
      ) : filteredOwners.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">
            {searchQuery || filterStatus !== 'all' ? 'No owners match your search' : 'No car owners registered'}
          </p>
          <p className="text-sm text-gray-400">
            {searchQuery || filterStatus !== 'all' ? 'Try adjusting your search or filter' : 'Add your first car owner'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setEditingOwner(null);
              setShowAddModal(true);
            }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Add Owner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOwners.map((owner) => {
            const statusBadge = getStatusBadge(owner.status);
            const statusDot = getStatusDot(owner.status);
            
            return (
              <div 
                key={owner.id}
                className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{owner.name}</p>
                      {owner.companyName && (
                        <p className="text-xs text-gray-500">{owner.companyName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${statusDot}`}></div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1 text-xs text-gray-500">
                  {owner.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{owner.email}</span>
                    </div>
                  )}
                  {owner.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{owner.phone}</span>
                    </div>
                  )}
                  {owner.address && (
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400 flex-shrink-0" />
                      <span className="truncate">{owner.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Car size={14} className="text-gray-400 flex-shrink-0" />
                    <span>{owner.vehicleCount || 0} vehicles</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => openDetailModal(owner)}
                    className="px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Eye size={14} /> View
                  </button>
                  <button
                    onClick={() => openEditModal(owner)}
                    className="flex-1 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Edit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleStatusToggle(owner.id, owner.status)}
                    className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center justify-center gap-1 ${
                      owner.status === 'active' 
                        ? 'text-red-600 hover:bg-red-50' 
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {owner.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                    {owner.status === 'active' ? 'Suspend' : 'Activate'}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedOwner(owner);
                      setShowDeleteModal(true);
                    }}
                    className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => {
            setShowAddModal(false);
            setEditingOwner(null);
          }}></div>
          <div className="relative bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingOwner ? 'Edit Owner' : 'Add New Owner'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingOwner(null);
                }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="+254 700 000 000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">ID Number</label>
                  <input
                    type="text"
                    value={formData.idNumber}
                    onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="12345678"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Sulul Tours Ltd"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows="2"
                  placeholder="Nairobi, Kenya"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows="2"
                  placeholder="Additional notes about the owner..."
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingOwner(null);
                }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={editingOwner ? handleEditOwner : handleAddOwner}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
              >
                <Save size={16} />
                {editingOwner ? 'Update Owner' : 'Add Owner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedOwner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Delete Owner</h2>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete "{selectedOwner.name}"?
              </p>
              {selectedOwner.vehicleCount > 0 && (
                <p className="text-sm text-red-500 mt-2">
                  ⚠️ This owner has {selectedOwner.vehicleCount} vehicles assigned. Please reassign or delete vehicles first.
                </p>
              )}
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteOwner}
                  disabled={selectedOwner.vehicleCount > 0}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    selectedOwner.vehicleCount > 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  Delete Owner
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarOwners;