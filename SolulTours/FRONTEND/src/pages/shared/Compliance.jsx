import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, CheckCircle, XCircle, Clock, AlertCircle,
  FileText, Upload, Plus, Edit, Trash2, Eye,
  Search, RefreshCw, Download, X, Save,
  Car, User, Calendar, Bell, TrendingUp, BarChart3,
  Camera, Image as ImageIcon, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { complianceService, vehicleService, carOwnerService } from '../../services/api';

// Helper: Compress image
const compressImage = (base64String, maxWidth = 800, maxHeight = 800, quality = 0.85) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.src = base64String;
  });
};

const Compliance = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  
  // ✅ Determine user role
  const userRole = currentUser?.role || 'client';
  const isFleetManager = userRole === 'fleet_manager' || userRole === 'admin' || userRole === 'super_admin';
  const isCarOwner = userRole === 'car_owner';
  
  // States
  const [complianceItems, setComplianceItems] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTabState] = useState('overview');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [documentView, setDocumentView] = useState(null);
  const [notification, setNotification] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // File input refs
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  
  // Form data
  const [formData, setFormData] = useState({
    vehicleId: '',
    type: '',
    validFrom: '',
    validUntil: '',
    status: 'valid',
    notes: '',
    documentImage: null
  });
  
  const [editFormData, setEditFormData] = useState({
    vehicleId: '',
    type: '',
    validFrom: '',
    validUntil: '',
    status: 'valid',
    notes: '',
    documentImage: null
  });
  
  // Preview states
  const [documentPreview, setDocumentPreview] = useState(null);
  const [editDocumentPreview, setEditDocumentPreview] = useState(null);

  // Compliance types
  const complianceTypes = [
    { id: 'license_disc', label: 'License Disc' },
    { id: 'roadworthy', label: 'Roadworthy' },
    { id: 'insurance', label: 'Insurance' },
    { id: 'permit', label: 'Permit' },
    { id: 'registration', label: 'Registration' },
    { id: 'inspection', label: 'Inspection Report' },
    { id: 'tax_clearance', label: 'Tax Clearance' }
  ];

  const getTypeLabel = (type) => {
    const found = complianceTypes.find(t => t.id === type);
    return found ? found.label : type;
  };

  const getTypeIcon = (type) => {
    const icons = {
      'license_disc': <FileText size={14} className="text-blue-500" />,
      'roadworthy': <Shield size={14} className="text-green-500" />,
      'insurance': <CheckCircle size={14} className="text-purple-500" />,
      'permit': <FileText size={14} className="text-orange-500" />,
      'registration': <FileText size={14} className="text-indigo-500" />,
      'inspection': <FileText size={14} className="text-yellow-500" />,
      'tax_clearance': <FileText size={14} className="text-red-500" />
    };
    return icons[type] || <FileText size={14} className="text-gray-500" />;
  };

  const getStatusColor = (status) => {
    const colors = {
      'valid': 'bg-green-100 text-green-700',
      'pending': 'bg-yellow-100 text-yellow-700',
      'expired': 'bg-red-100 text-red-700',
      'expiring_soon': 'bg-orange-100 text-orange-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusLabel = (status) => {
    const labels = {
      'valid': '✅ Valid',
      'pending': '⏳ Pending',
      'expired': '❌ Expired',
      'expiring_soon': '⚠️ Expiring Soon'
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'valid': return <CheckCircle size={14} className="text-green-600" />;
      case 'pending': return <Clock size={14} className="text-yellow-600" />;
      case 'expired': return <XCircle size={14} className="text-red-600" />;
      case 'expiring_soon': return <AlertCircle size={14} className="text-orange-600" />;
      default: return null;
    }
  };

  useEffect(() => {
    const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
    const tid = userData?.tenantId || null;
    console.log('🔍 Tenant ID from localStorage:', tid);
    setTenantId(tid);
    loadData(tid);
  }, []);

  // Load data
  const loadData = async (tid) => {
    setLoading(true);
    
    try {
      const tenantToUse = tid || tenantId;
      console.log('🔍 Loading compliance data with tenantId:', tenantToUse);
      
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
      
      // If car owner, filter vehicles
      let userVehicles = vehiclesData;
      if (isCarOwner) {
        const ownerResponse = await carOwnerService.getByUser(currentUser.id);
        let owner = null;
        if (ownerResponse?.success && ownerResponse?.data) {
          owner = ownerResponse.data;
        } else if (ownerResponse?.id) {
          owner = ownerResponse;
        }
        if (owner) {
          userVehicles = vehiclesData.filter(v => v.ownerId === owner.id);
        } else {
          userVehicles = [];
        }
      }
      setVehicles(userVehicles);
      
      // ✅ 2. Load compliance items
      const complianceResponse = await complianceService.getAll(tenantToUse);
      console.log('📊 Compliance response:', complianceResponse);
      let complianceData = [];
      if (complianceResponse?.success && complianceResponse?.data) {
        complianceData = complianceResponse.data;
      } else if (Array.isArray(complianceResponse)) {
        complianceData = complianceResponse;
      }
      
      // Filter for car owner
      let userCompliance = complianceData;
      if (isCarOwner) {
        const ownerVehicleIds = userVehicles.map(v => v.id);
        userCompliance = complianceData.filter(c => ownerVehicleIds.includes(c.vehicleId));
      }
      
      // Enhance with calculated fields
            const enhanced = userCompliance.map(item => {
        const validUntil = item.validUntil;
        const now = new Date();
        const expiryDate = new Date(validUntil);
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        let status = 'valid'; 
        if (daysUntilExpiry <= 30 && daysUntilExpiry >= 0) {
          status = 'expiring_soon';
        } else if (daysUntilExpiry < 0) {
          status = 'expired';
        }
        
        const vehicle = userVehicles.find(v => v.id === item.vehicleId);
        
        return {
          ...item,
          status,
          daysUntilExpiry,
          vehicleLabel: vehicle ? `${vehicle.registration} - ${vehicle.make} ${vehicle.model}` : 'Unknown',
          isExpired: daysUntilExpiry < 0
        };
      });
      
      setComplianceItems(enhanced);
      
    } catch (error) {
      console.error('❌ Error loading compliance:', error);
      showNotification('Error loading compliance data', 'error');
      // Fallback to localStorage
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  // Fallback to localStorage
  const loadFromLocalStorage = () => {
    try {
      const storedVehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
      let userVehicles = storedVehicles;
      
      if (isCarOwner) {
        const owners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
        const owner = owners.find(o => o.userId === currentUser?.id);
        if (owner) {
          userVehicles = storedVehicles.filter(v => v.ownerId === owner.id);
        } else {
          userVehicles = [];
        }
      }
      setVehicles(userVehicles);
      
      const storedCompliance = JSON.parse(localStorage.getItem('travel_agency_compliance') || '[]');
      let userCompliance = storedCompliance;
      if (isCarOwner) {
        const ownerVehicleIds = userVehicles.map(v => v.id);
        userCompliance = storedCompliance.filter(c => ownerVehicleIds.includes(c.vehicleId));
      }
      
      const enhanced = userCompliance.map(item => {
        const validUntil = item.validUntil;
        const now = new Date();
        const expiryDate = new Date(validUntil);
        const daysUntilExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        
        let status = 'valid'; 
        if (status === 'valid' && daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          status = 'expiring_soon';
        } else if (daysUntilExpiry < 0) {
          status = 'expired';
        }
        
        const vehicle = userVehicles.find(v => v.id === item.vehicleId);
        
        return {
          ...item,
          status,
          daysUntilExpiry,
          vehicleLabel: vehicle ? `${vehicle.registration} - ${vehicle.make} ${vehicle.model}` : 'Unknown',
          isExpired: daysUntilExpiry < 0
        };
      });
      
      setComplianceItems(enhanced);
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  // Stats
  const stats = {
    total: complianceItems.length,
    valid: complianceItems.filter(c => c.status === 'valid').length,
    expired: complianceItems.filter(c => c.status === 'expired').length,
    expiringSoon: complianceItems.filter(c => c.status === 'expiring_soon').length,
    pending: complianceItems.filter(c => c.status === 'pending').length,
    complianceRate: complianceItems.length > 0 
      ? Math.round((complianceItems.filter(c => c.status === 'valid' || c.status === 'pending').length / complianceItems.length) * 100) 
      : 0,
    withDocuments: complianceItems.filter(c => c.documentImage).length
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Generate ID
  const generateId = () => {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  };

  // Handle file upload
  const handleFileChange = async (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Please upload an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Image must be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result);
        
        if (isEdit) {
          setEditFormData({ ...editFormData, documentImage: compressed });
          setEditDocumentPreview(compressed);
        } else {
          setFormData({ ...formData, documentImage: compressed });
          setDocumentPreview(compressed);
        }
        showNotification('Document uploaded successfully!');
      } catch (error) {
        console.error('Error compressing image:', error);
        showNotification('Failed to process image', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const removeDocument = (isEdit = false) => {
    if (isEdit) {
      setEditFormData({ ...editFormData, documentImage: null });
      setEditDocumentPreview(null);
      if (editFileInputRef.current) editFileInputRef.current.value = '';
    } else {
      setFormData({ ...formData, documentImage: null });
      setDocumentPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const viewDocument = (item) => {
    if (item.documentImage) {
      setDocumentView(item.documentImage);
      setShowDocumentModal(true);
    }
  };

  const hasDocument = (item) => {
    return !!(item.documentImage);
  };

  // Reset forms
  const resetForm = () => {
    setFormData({
      vehicleId: '',
      type: '',
      validFrom: '',
      validUntil: '',
      status: 'valid',
      notes: '',
      documentImage: null
    });
    setDocumentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetEditForm = () => {
    setEditFormData({
      vehicleId: '',
      type: '',
      validFrom: '',
      validUntil: '',
      status: 'valid',
      notes: '',
      documentImage: null
    });
    setEditDocumentPreview(null);
    if (editFileInputRef.current) editFileInputRef.current.value = '';
  };

  // ✅ CRUD Operations - Only Fleet Manager can perform these
  const handleAddCompliance = async () => {
    if (!isFleetManager) {
      showNotification('You do not have permission to add compliance items', 'error');
      return;
    }

    if (!formData.vehicleId) {
      showNotification('Please select a vehicle', 'error');
      return;
    }
    if (!formData.type) {
      showNotification('Please select a compliance type', 'error');
      return;
    }
    if (!formData.validUntil) {
      showNotification('Please enter expiry date', 'error');
      return;
    }

    // ✅ Format date properly
    const formattedValidFrom = formData.validFrom ? new Date(formData.validFrom).toISOString().split('T')[0] : null;
    const formattedValidUntil = formData.validUntil ? new Date(formData.validUntil).toISOString().split('T')[0] : null;

    const newItem = {
      vehicleId: formData.vehicleId,
      type: formData.type,
      validFrom: formattedValidFrom,
      validUntil: formattedValidUntil,
      status: 'valid',
      notes: formData.notes || '',
      documentImage: formData.documentImage || null,
      tenantId: tenantId,
      createdBy: currentUser?.name || 'Fleet Manager'
    };

    setIsSubmitting(true);

    try {
      console.log('📤 Creating compliance item:', newItem);
      const response = await complianceService.create(newItem);
      console.log('📥 Create compliance response:', response);
      
      if (response?.success) {
        showNotification(`✅ ${getTypeLabel(formData.type)} added successfully!`);
        setShowAddModal(false);
        resetForm();
        loadData(tenantId);
      } else {
        showNotification('Failed to add item: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error adding compliance item:', error);
      showNotification('Failed to add item. Please try again.', 'error');
    }
    
    setIsSubmitting(false);
  };

  const handleEditCompliance = async () => {
    if (!isFleetManager) {
      showNotification('You do not have permission to edit compliance items', 'error');
      return;
    }

    if (!selectedItem) return;

    const formattedValidFrom = editFormData.validFrom ? new Date(editFormData.validFrom).toISOString().split('T')[0] : null;
    const formattedValidUntil = editFormData.validUntil ? new Date(editFormData.validUntil).toISOString().split('T')[0] : null;

    const updatedItem = {
      vehicleId: editFormData.vehicleId,
      type: editFormData.type,
      validFrom: formattedValidFrom,
      validUntil: formattedValidUntil,
      status: editFormData.status,
      notes: editFormData.notes || '',
      documentImage: editFormData.documentImage || selectedItem.documentImage || null,
      tenantId: tenantId,
      createdBy: currentUser?.name || 'Fleet Manager'
    };

    setIsSubmitting(true);

    try {
      console.log(`📤 Updating compliance item ${selectedItem.id}:`, updatedItem);
      const response = await complianceService.update(selectedItem.id, updatedItem);
      console.log('📥 Update compliance response:', response);
      
      if (response?.success) {
        showNotification('✅ Compliance item updated successfully!');
        setShowEditModal(false);
        setSelectedItem(null);
        resetEditForm();
        loadData(tenantId);
      } else {
        showNotification('Failed to update item: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error updating compliance item:', error);
      showNotification('Failed to update item. Please try again.', 'error');
    }
    
    setIsSubmitting(false);
  };

  const handleDeleteCompliance = async () => {
    if (!isFleetManager) {
      showNotification('You do not have permission to delete compliance items', 'error');
      return;
    }

    if (!selectedItem) return;

    setIsSubmitting(true);

    try {
      console.log(`📤 Deleting compliance item ${selectedItem.id}`);
      const response = await complianceService.delete(selectedItem.id);
      console.log('📥 Delete compliance response:', response);
      
      if (response?.success) {
        showNotification('✅ Compliance item deleted successfully!');
        setShowDeleteConfirm(false);
        setSelectedItem(null);
        loadData(tenantId);
      } else {
        showNotification('Failed to delete item: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting compliance item:', error);
      showNotification('Failed to delete item. Please try again.', 'error');
    }
    
    setIsSubmitting(false);
  };

  const openEditModal = (item) => {
    if (!isFleetManager) {
      showNotification('You do not have permission to edit compliance items', 'error');
      return;
    }

    setSelectedItem(item);
    setEditFormData({
      vehicleId: item.vehicleId || '',
      type: item.type || '',
      validFrom: item.validFrom || '',
      validUntil: item.validUntil || '',
      status: item.status || 'valid',
      notes: item.notes || '',
      documentImage: item.documentImage || null
    });
    setEditDocumentPreview(item.documentImage || null);
    setShowEditModal(true);
  };

  // Filter items
  const filteredItems = complianceItems.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return getTypeLabel(item.type).toLowerCase().includes(searchLower) ||
           item.vehicleLabel?.toLowerCase().includes(searchLower);
  });

  // Document Modal
  const renderDocumentModal = () => {
    if (!showDocumentModal || !documentView) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowDocumentModal(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 p-4">
          <button 
            onClick={() => setShowDocumentModal(false)}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>
          <div className="flex items-center justify-center p-4">
            <img 
              src={documentView} 
              alt="Document" 
              className="max-h-[80vh] max-w-full object-contain rounded-lg"
            />
          </div>
        </div>
      </div>
    );
  };

  // Add/Edit Modal
  const renderFormModal = (isEdit = false) => {
    const isOpen = isEdit ? showEditModal : showAddModal;
    const data = isEdit ? editFormData : formData;
    const setData = isEdit ? setEditFormData : setFormData;
    const handleSubmit = isEdit ? handleEditCompliance : handleAddCompliance;
    const closeModal = () => {
      if (isEdit) {
        setShowEditModal(false);
        resetEditForm();
      } else {
        setShowAddModal(false);
        resetForm();
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={closeModal}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <button 
            onClick={closeModal}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>

          <div className={`px-6 py-5 rounded-t-2xl ${isEdit ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-green-600 to-green-700'}`}>
            <h2 className="text-2xl font-bold text-white">
              {isEdit ? 'Edit Compliance Item' : 'Add Compliance Document'}
            </h2>
            <p className={`text-sm ${isEdit ? 'text-blue-100' : 'text-green-100'}`}>
              {isEdit ? 'Update compliance details' : 'Upload a new compliance document'}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle *</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={data.vehicleId}
                  onChange={(e) => setData({...data, vehicleId: e.target.value})}
                >
                  <option value="">Select Vehicle</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registration} - {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={data.type}
                  onChange={(e) => setData({...data, type: e.target.value})}
                >
                  <option value="">Select Type</option>
                  {complianceTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid From</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={data.validFrom}
                  onChange={(e) => setData({...data, validFrom: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={data.validUntil}
                  onChange={(e) => setData({...data, validUntil: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={data.status}
                  onChange={(e) => setData({...data, status: e.target.value})}
                >
                  <option value="valid">Valid</option>
                  <option value="pending">Pending</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea 
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="2"
                  placeholder="Additional notes..."
                  value={data.notes}
                  onChange={(e) => setData({...data, notes: e.target.value})}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Document Image (Optional)
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={isEdit ? editFileInputRef : fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, isEdit)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (isEdit && editFileInputRef.current) {
                        editFileInputRef.current.click();
                      } else if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                  >
                    <Camera size={16} /> Upload Document
                  </button>
                  <span className="text-xs text-gray-400">JPG, PNG (Max 5MB)</span>
                </div>

                {(data.documentImage) && (
                  <div className="mt-3 flex items-center gap-3">
                    <img 
                      src={data.documentImage} 
                      alt="Document" 
                      className="h-20 w-20 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeDocument(isEdit)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                {!data.documentImage && (
                  <p className="text-xs text-gray-400 mt-2">Upload a document image for proof</p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200 mt-4">
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {isSubmitting ? 'Saving...' : (isEdit ? 'Update Item' : 'Add Item')}
              </button>
              <button 
                onClick={closeModal}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Delete Confirm Modal
  const renderDeleteConfirm = () => {
    if (!showDeleteConfirm || !selectedItem) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowDeleteConfirm(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Compliance Item?</h3>
            <p className="text-gray-500 text-sm">
              Are you sure you want to delete this compliance item? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleDeleteCompliance}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Overview View
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Compliance Score</p>
          <p className="text-2xl font-bold text-blue-600">{stats.complianceRate}%</p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
            <div className="bg-blue-500 rounded-full h-1.5" style={{ width: `${stats.complianceRate}%` }} />
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Total Items</p>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-gray-400">{stats.valid} valid</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Expiring Soon</p>
          <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
          <p className="text-xs text-gray-400">Within 30 days</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Expired</p>
          <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
          <p className="text-xs text-gray-400">Need attention</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-xs text-gray-500">Documents</p>
          <p className="text-2xl font-bold text-purple-600">{stats.withDocuments}</p>
          <p className="text-xs text-gray-400">Uploaded</p>
        </div>
      </div>

      {/* Expiry Alerts */}
      {complianceItems.filter(c => c.status === 'expired' || c.status === 'expiring_soon').length > 0 && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 p-4 rounded-xl border border-red-200">
          <div className="flex items-start gap-3">
            <Bell size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700">⚠️ Compliance Alerts</p>
              <p className="text-xs text-red-600 mb-2">
                {complianceItems.filter(c => c.status === 'expired').length} expired, 
                {complianceItems.filter(c => c.status === 'expiring_soon').length} expiring soon
              </p>
              <div className="space-y-1">
                {complianceItems.filter(c => c.status === 'expired' || c.status === 'expiring_soon').slice(0, 3).map(item => (
                  <div key={item.id} className="flex items-center gap-2 text-xs bg-white/80 p-2 rounded-lg">
                    {getTypeIcon(item.type)}
                    <span className="font-medium">{getTypeLabel(item.type)}</span>
                    <span className="text-gray-500">- {item.vehicleLabel}</span>
                    <span className={`px-2 py-0.5 rounded-full ${item.status === 'expired' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                      {item.status === 'expired' ? 'Expired' : `${item.daysUntilExpiry} days`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-200">
          <h4 className="font-semibold text-sm flex items-center gap-2">
            <FileText size={16} className="text-blue-500" />
            Compliance Items
            <span className="text-xs text-gray-400">({filteredItems.length})</span>
          </h4>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-40"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* ✅ Only show Add button for Fleet Manager */}
            {isFleetManager && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
              >
                <Plus size={14} /> Add Item
              </button>
            )}
          </div>
        </div>

        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3 hidden sm:table-cell">Vehicle</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 hidden md:table-cell">Valid Until</th>
                  <th className="p-3">Document</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(item.type)}
                        <span className="text-sm font-medium">{getTypeLabel(item.type)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm hidden sm:table-cell">
                      {item.vehicleLabel}
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        {getStatusLabel(item.status)}
                      </span>
                    </td>
                    <td className="p-3 text-sm hidden md:table-cell">
                      <span className={item.isExpired ? 'text-red-600 font-medium' : 'text-gray-600'}>
                        {item.validUntil ? new Date(item.validUntil).toLocaleDateString() : 'N/A'}
                      </span>
                      {item.daysUntilExpiry !== null && !item.isExpired && item.daysUntilExpiry <= 30 && (
                        <span className="text-xs text-orange-600 ml-1">({item.daysUntilExpiry}d)</span>
                      )}
                    </td>
                    <td className="p-3">
                      {hasDocument(item) ? (
                        <button
                          onClick={() => viewDocument(item)}
                          className="p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                          title="View Document"
                        >
                          <ImageIcon size={16} />
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {/* ✅ Only show Edit/Delete for Fleet Manager */}
                        {isFleetManager ? (
                          <>
                            <button 
                              onClick={() => openEditModal(item)}
                              className="p-1 hover:bg-gray-200 rounded text-blue-600 transition-colors"
                              title="Edit"
                            >
                              <Edit size={14} />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedItem(item);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-1 hover:bg-gray-200 rounded text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        ) : (
                          // ✅ Car Owner - View only
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Lock size={12} /> View Only
                          </span>
                        )}
                        {hasDocument(item) && (
                          <button 
                            onClick={() => viewDocument(item)}
                            className="p-1 hover:bg-gray-200 rounded text-purple-600 transition-colors"
                            title="View Document"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <Shield size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="font-medium">No compliance items found</p>
            <p className="text-sm">
              {isFleetManager 
                ? 'Click "Add Item" to add your first compliance document'
                : 'No compliance documents have been uploaded for your vehicles yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Analytics View
  const renderAnalytics = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Overall Compliance</p>
          <p className="text-2xl font-bold text-green-600">{stats.complianceRate}%</p>
          <p className="text-xs text-green-500">Based on {stats.total} items</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Total Items</p>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-gray-400">Across all categories</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Risk Items</p>
          <p className="text-2xl font-bold text-red-600">{stats.expired + stats.expiringSoon}</p>
          <p className="text-xs text-red-500">{stats.expired} expired, {stats.expiringSoon} expiring soon</p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500">Documents</p>
          <p className="text-2xl font-bold text-purple-600">{stats.withDocuments}</p>
          <p className="text-xs text-gray-400">Uploaded</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h5 className="font-medium text-sm mb-3">Compliance Status</h5>
          {stats.total > 0 ? (
            <div className="space-y-2">
              {[
                { label: '✅ Valid', count: stats.valid, color: 'bg-green-500' },
                { label: '⚠️ Expiring Soon', count: stats.expiringSoon, color: 'bg-orange-500' },
                { label: '❌ Expired', count: stats.expired, color: 'bg-red-500' },
                { label: '⏳ Pending', count: stats.pending, color: 'bg-yellow-500' }
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm">
                    <span>{item.label}</span>
                    <span className="font-medium">{item.count} ({stats.total > 0 ? Math.round((item.count / stats.total) * 100) : 0}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`${item.color} rounded-full h-2 transition-all duration-500`} 
                      style={{ width: `${stats.total > 0 ? (item.count / stats.total) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-4">No data available</p>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h5 className="font-medium text-sm mb-3">Type Distribution</h5>
          {stats.total > 0 ? (
            <div className="space-y-2">
              {Object.entries(
                complianceItems.reduce((acc, c) => {
                  acc[c.type] = (acc[c.type] || 0) + 1;
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([type, count]) => (
                  <div key={type}>
                    <div className="flex justify-between text-sm">
                      <span>{getTypeLabel(type)}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-blue-500 rounded-full h-2 transition-all duration-500" 
                        style={{ width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-4">No data available</p>
          )}
        </div>
      </div>
    </div>
  );

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield size={28} className="text-blue-600" />
            Compliance
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isCarOwner ? 'View compliance for your vehicles' : 'Manage all compliance requirements'}
          </p>
          {isCarOwner && (
            <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
              <Lock size={12} /> View-only mode - Contact fleet manager for changes
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => loadData(tenantId)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          {/* ✅ Only show Add button for Fleet Manager */}
          {isFleetManager && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
            >
              <Plus size={16} /> Add Item
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 mb-6 border-b border-gray-200">
        {[
          { id: 'overview', label: 'Overview', icon: Shield },
          { id: 'analytics', label: 'Analytics', icon: BarChart3 }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabState(tab.id)}
            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-t-lg transition-colors flex items-center gap-1 sm:gap-2 ${
              activeTab === tab.id 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading compliance data...</p>
        </div>
      ) : (
        <div>
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'analytics' && renderAnalytics()}
        </div>
      )}

      {/* Modals */}
      {renderFormModal(false)}
      {renderFormModal(true)}
      {renderDeleteConfirm()}
      {renderDocumentModal()}
    </div>
  );
};

export default Compliance;