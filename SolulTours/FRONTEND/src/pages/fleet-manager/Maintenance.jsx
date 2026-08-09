import React, { useState, useEffect, useRef } from 'react';
import { 
  Wrench, Plus, Search, Edit2, Trash2, 
  X, Filter, RefreshCw, Save, 
  AlertCircle, CheckCircle, Calendar,
  Clock, Car, DollarSign, Eye,
  AlertTriangle,
  User, Phone, Mail, MapPin,
  Upload, Image, Camera
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { maintenanceService, vehicleService } from '../../services/api';

const Maintenance = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [editingRecord, setEditingRecord] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantId, setTenantId] = useState(null);

  // Receipt image state
  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const receiptInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    vehicleId: '',
    maintenanceType: 'oil_change',
    description: '',
    cost: '',
    date: '',
    nextDueDate: '',
    status: 'scheduled',
    priority: 'medium',
    technician: '',
    receiptImage: null,
    notes: ''
  });

  useEffect(() => {
    const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
    const tid = userData?.tenantId || null;
    console.log('🔍 Tenant ID from localStorage:', tid);
    setTenantId(tid);
    loadData(tid);
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async (tid) => {
    setLoading(true);
    
    try {
      const tenantToUse = tid || tenantId;
      console.log('🔍 Loading maintenance data with tenantId:', tenantToUse);
      
      if (!tenantToUse) {
        console.warn('⚠️ No tenantId available, skipping API call');
        setLoading(false);
        return;
      }
      
      // ✅ 1. Load vehicles
      const vehiclesResponse = await vehicleService.getAll(tenantToUse);
      console.log('📊 Vehicles response:', vehiclesResponse);
      let vehiclesData = [];
      if (vehiclesResponse?.success && vehiclesResponse?.data) {
        vehiclesData = vehiclesResponse.data;
      } else if (Array.isArray(vehiclesResponse)) {
        vehiclesData = vehiclesResponse;
      }
      setVehicles(vehiclesData);

      // ✅ 2. Load maintenance records
      const maintenanceResponse = await maintenanceService.getAll(tenantToUse);
      console.log('📊 Maintenance response:', maintenanceResponse);
      let maintenanceData = [];
      if (maintenanceResponse?.success && maintenanceResponse?.data) {
        maintenanceData = maintenanceResponse.data;
      } else if (Array.isArray(maintenanceResponse)) {
        maintenanceData = maintenanceResponse;
      }
      
      setMaintenanceRecords(maintenanceData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Error loading maintenance records', 'error');
      // Fallback to localStorage
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  // Fallback to localStorage
  const loadFromLocalStorage = () => {
    try {
      const storedMaintenance = JSON.parse(localStorage.getItem('travel_agency_maintenance') || '[]');
      setMaintenanceRecords(storedMaintenance);
      
      const storedVehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
      setVehicles(storedVehicles);
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  const generateId = () => {
    return `maint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const resetForm = () => {
    setFormData({
      vehicleId: '',
      maintenanceType: 'oil_change',
      description: '',
      cost: '',
      date: '',
      nextDueDate: '',
      status: 'scheduled',
      priority: 'medium',
      technician: '',
      receiptImage: null,
      notes: ''
    });
    setReceiptImage(null);
    setReceiptPreview(null);
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      setReceiptImage(imageData);
      setReceiptPreview(imageData);
      setFormData(prev => ({ ...prev, receiptImage: imageData }));
    };
    reader.readAsDataURL(file);
  };

  const removeReceipt = () => {
    setReceiptImage(null);
    setReceiptPreview(null);
    setFormData(prev => ({ ...prev, receiptImage: null }));
    if (receiptInputRef.current) {
      receiptInputRef.current.value = '';
    }
  };

  const getVehicleDetails = (vehicleId) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const handleAddRecord = async () => {
  if (!formData.vehicleId) {
    showNotification('Please select a vehicle', 'error');
    return;
  }
  if (!formData.date) {
    showNotification('Please select a date', 'error');
    return;
  }

  const formattedDate = formData.date ? new Date(formData.date).toISOString().split('T')[0] : null;
  const formattedNextDueDate = formData.nextDueDate ? new Date(formData.nextDueDate).toISOString().split('T')[0] : null;

  // ✅ Get vehicle details
  const vehicle = getVehicleDetails(formData.vehicleId);

  const newRecord = {
    vehicleId: formData.vehicleId,
    // ✅ ADD THESE 3 LINES
    vehicleRegistration: vehicle?.registration || '',
    vehicleMake: vehicle?.make || '',
    vehicleModel: vehicle?.model || '',
    maintenanceType: formData.maintenanceType,
    description: formData.description || '',
    cost: parseFloat(formData.cost) || 0,
    date: formattedDate,
    nextDueDate: formattedNextDueDate,
    status: formData.status,
    priority: formData.priority,
    technician: formData.technician || '',
    receiptImage: receiptImage || null,
    notes: formData.notes || '',
    tenantId: tenantId
  };

  setIsSubmitting(true);

  try {
    console.log('📤 Creating maintenance record:', newRecord);
    const response = await maintenanceService.create(newRecord);
    console.log('📥 Create maintenance response:', response);
    
    if (response?.success) {
      showNotification(`✅ Maintenance record added successfully!`);
      setShowAddModal(false);
      resetForm();
      loadData(tenantId);
    } else {
      showNotification('Failed to add record: ' + (response?.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error adding maintenance record:', error);
    showNotification('Failed to add record. Please try again.', 'error');
  }
  
  setIsSubmitting(false);
};

  const handleEditRecord = async () => {
  if (!editingRecord) return;

  const formattedDate = formData.date ? new Date(formData.date).toISOString().split('T')[0] : null;
  const formattedNextDueDate = formData.nextDueDate ? new Date(formData.nextDueDate).toISOString().split('T')[0] : null;

  // ✅ Get vehicle details
  const vehicle = getVehicleDetails(formData.vehicleId);

  const updatedRecord = {
    vehicleId: formData.vehicleId,
    // ✅ ADD THESE 3 LINES
    vehicleRegistration: vehicle?.registration || '',
    vehicleMake: vehicle?.make || '',
    vehicleModel: vehicle?.model || '',
    maintenanceType: formData.maintenanceType,
    description: formData.description || '',
    cost: parseFloat(formData.cost) || 0,
    date: formattedDate,
    nextDueDate: formattedNextDueDate,
    status: formData.status,
    priority: formData.priority,
    technician: formData.technician || '',
    receiptImage: receiptImage || editingRecord.receiptImage || null,
    notes: formData.notes || '',
    tenantId: tenantId
  };

  setIsSubmitting(true);

  try {
    console.log(`📤 Updating maintenance record ${editingRecord.id}:`, updatedRecord);
    const response = await maintenanceService.update(editingRecord.id, updatedRecord);
    console.log('📥 Update maintenance response:', response);
    
    if (response?.success) {
      showNotification(`✅ Maintenance record updated successfully!`);
      setEditingRecord(null);
      setShowAddModal(false);
      resetForm();
      loadData(tenantId);
    } else {
      showNotification('Failed to update record: ' + (response?.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error updating maintenance record:', error);
    showNotification('Failed to update record. Please try again.', 'error');
  }
  
  setIsSubmitting(false);
};

  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;

    setIsSubmitting(true);

    try {
      console.log(`📤 Deleting maintenance record ${selectedRecord.id}`);
      const response = await maintenanceService.delete(selectedRecord.id);
      console.log('📥 Delete maintenance response:', response);
      
      if (response?.success) {
        showNotification('✅ Maintenance record deleted successfully!');
        setShowDeleteModal(false);
        setSelectedRecord(null);
        loadData(tenantId);
      } else {
        showNotification('Failed to delete record: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting maintenance record:', error);
      showNotification('Failed to delete record. Please try again.', 'error');
    }
    
    setIsSubmitting(false);
  };

  const openEditModal = (record) => {
  setEditingRecord(record);
  setFormData({
    vehicleId: record.vehicleId || '',
    maintenanceType: record.maintenanceType || 'oil_change',
    description: record.description || '',
    cost: record.cost || '',
    date: record.date || '',
    nextDueDate: record.nextDueDate || '',
    status: record.status || 'scheduled',
    priority: record.priority || 'medium',
    technician: record.technician || '',
    receiptImage: record.receiptImage || null,
    notes: record.notes || ''
  });
  setReceiptImage(record.receiptImage || null);
  setReceiptPreview(record.receiptImage || null);
  setShowAddModal(true);
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
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Wrench size={24} />
                <div>
                  <h2 className="text-lg font-semibold">Maintenance Details</h2>
                  <p className="text-sm text-blue-100">Record #{selectedRecord.id?.slice(0, 10)}...</p>
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
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal - Keep the same */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Wrench size={24} />
                <div>
                  <h2 className="text-lg font-semibold">{editingRecord ? 'Edit Maintenance' : 'New Maintenance Record'}</h2>
                  <p className="text-sm text-blue-100">{editingRecord ? 'Update maintenance details' : 'Add a new maintenance record'}</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Select Vehicle *</label>
                <select
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Select a vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration} - {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Maintenance Type</label>
                  <select
                    value={formData.maintenanceType}
                    onChange={(e) => setFormData({...formData, maintenanceType: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {maintenanceTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cost (KES)</label>
                  <input
                    type="number"
                    value={formData.cost}
                    onChange={(e) => setFormData({...formData, cost: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Next Due Date</label>
                  <input
                    type="date"
                    value={formData.nextDueDate}
                    onChange={(e) => setFormData({...formData, nextDueDate: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows="2"
                  placeholder="Describe the maintenance work..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Technician</label>
                <input
                  type="text"
                  value={formData.technician}
                  onChange={(e) => setFormData({...formData, technician: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Name of technician"
                />
              </div>

              {/* Receipt Image Upload */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Receipt Image</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => receiptInputRef.current?.click()}
                    className="px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors flex items-center gap-2 text-sm text-gray-600"
                  >
                    <Upload size={16} />
                    Upload Receipt
                  </button>
                  <input
                    ref={receiptInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReceiptUpload}
                    className="hidden"
                  />
                  {receiptPreview && (
                    <button
                      type="button"
                      onClick={removeReceipt}
                      className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                    >
                      <X size={16} /> Remove
                    </button>
                  )}
                </div>
                {receiptPreview && (
                  <div className="mt-2 relative inline-block">
                    <img 
                      src={receiptPreview} 
                      alt="Receipt" 
                      className="max-h-32 rounded-lg border border-gray-200 object-contain"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows="2"
                  placeholder="Additional notes..."
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={editingRecord ? handleEditRecord : handleAddRecord}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
              >
                <Save size={16} />
                {editingRecord ? 'Update Record' : 'Add Record'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Delete Record</h2>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete this maintenance record?
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteRecord}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Maintenance</h1>
          <p className="text-gray-500 text-sm mt-1">Track vehicle maintenance and repairs</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => loadData(tenantId)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={() => {
              resetForm();
              setEditingRecord(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Add Record
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
        : 'Add your first maintenance record'}
    </p>
  </div>
) : (
  <div className="space-y-2 sm:space-y-3">
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
          <div className="p-3 sm:p-4">
            {/* Header - Vehicle and Badges */}
            <div className="flex items-start justify-between gap-1 sm:gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Wrench size={14} className="text-blue-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate text-sm sm:text-base">
                    {vehicle ? `${vehicle.registration}` : 'Vehicle'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                    {vehicle ? `${vehicle.make} ${vehicle.model}` : 'N/A'}
                    {record.maintenanceType && ` • ${getTypeLabel(record.maintenanceType)}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                {hasReceipt && (
                  <button
                    onClick={() => {
                      setSelectedRecord(record);
                      setShowImageModal(true);
                    }}
                    className="p-1 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                    title="View Receipt"
                  >
                    <Image size={12} />
                  </button>
                )}
                <span className={`text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full ${priorityBadge.color}`}>
                  {priorityBadge.label}
                </span>
                <span className={`text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>
            </div>

            {/* Details Row - Compact */}
            <div className="grid grid-cols-2 gap-1 mt-1.5 text-[10px] sm:text-xs text-gray-500">
              <div>
                <span className="font-medium text-gray-600">Cost:</span>
                <span className="text-green-600 font-medium ml-0.5">KSh {record.cost?.toLocaleString() || 0}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Date:</span>
                <span className="text-gray-700 ml-0.5">{record.date || 'N/A'}</span>
              </div>
              {record.technician && (
                <div className="col-span-2">
                  <span className="font-medium text-gray-600">Tech:</span>
                  <span className="text-gray-700 ml-0.5">{record.technician}</span>
                </div>
              )}
            </div>

            {/* Description - if exists */}
            {record.description && (
              <div className="mt-1 text-[10px] sm:text-xs text-gray-500 truncate">
                <span className="font-medium text-gray-600">Desc:</span>
                <span className="text-gray-700 ml-0.5">{record.description}</span>
              </div>
            )}

            {/* Action Buttons - Compact */}
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelectedRecord(record);
                  setShowDetailModal(true);
                }}
                className="flex-1 px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-0.5"
              >
                <Eye size={12} /> View
              </button>
              <button
                onClick={() => openEditModal(record)}
                className="flex-1 px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-0.5"
              >
                <Edit2 size={12} /> Edit
              </button>
              <button
                onClick={() => {
                  setSelectedRecord(record);
                  setShowDeleteModal(true);
                }}
                className="flex-1 px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-0.5"
              >
                <Trash2 size={12} />
              </button>
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

export default Maintenance;