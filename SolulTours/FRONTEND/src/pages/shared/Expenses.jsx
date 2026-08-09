import React, { useState, useEffect, useRef } from 'react';
import { 
  DollarSign, Plus, Search, Edit2, Trash2, 
  X, Filter, RefreshCw, Save, 
  AlertCircle, CheckCircle, Calendar,
  Clock, Car, Eye, Building, Fuel,
  Users, FileText, TrendingUp, TrendingDown,
  Tag, Receipt, Shield, Wrench, Upload, Image, Camera
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { expenseService, vehicleService, carOwnerService, maintenanceService } from '../../services/api';

const Expenses = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const isCarOwner = currentUser?.role === 'car_owner';
  const isFleetManager = currentUser?.role === 'fleet_manager';
  
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [carOwner, setCarOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantId, setTenantId] = useState(null);

  // Receipt image state
  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const receiptInputRef = useRef(null);

  // Form state
  const [formData, setFormData] = useState({
    category: 'fuel',
    description: '',
    amount: '',
    date: '',
    vehicleId: '',
    paymentMethod: 'cash',
    status: 'paid',
    receiptNumber: '',
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
      console.log('🔍 Loading expenses data with tenantId:', tenantToUse);
      
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

      // ✅ 2. Load expenses
      const expensesResponse = await expenseService.getAll(tenantToUse);
      console.log('📊 Expenses response:', expensesResponse);
      let expensesData = [];
      if (expensesResponse?.success && expensesResponse?.data) {
        expensesData = expensesResponse.data;
      } else if (Array.isArray(expensesResponse)) {
        expensesData = expensesResponse;
      }

      // ✅ 3. Load maintenance records (to show as expenses)
      const maintenanceResponse = await maintenanceService.getAll(tenantToUse);
      console.log('📊 Maintenance response:', maintenanceResponse);
      let maintenanceData = [];
      if (maintenanceResponse?.success && maintenanceResponse?.data) {
        maintenanceData = maintenanceResponse.data;
      } else if (Array.isArray(maintenanceResponse)) {
        maintenanceData = maintenanceResponse;
      }

      // ✅ 4. Convert maintenance to expenses
      const maintenanceExpenses = maintenanceData.map(m => {
        const vehicle = vehiclesData.find(v => v.id === m.vehicleId);
        return {
          id: `maint_${m.id}`,
          category: 'maintenance',
          description: m.description || `${m.maintenanceType || 'Maintenance'} - ${vehicle?.registration || 'Unknown Vehicle'}`,
          amount: m.cost || 0,
          date: m.date || new Date().toISOString().split('T')[0],
          vehicleId: m.vehicleId || '',
          vehicleRegistration: vehicle?.registration || m.vehicleRegistration || '',
          vehicleMake: vehicle?.make || m.vehicleMake || '',
          vehicleModel: vehicle?.model || m.vehicleModel || '',
          ownerId: vehicle?.ownerId || '',
          ownerName: '',
          paymentMethod: 'cash',
          status: m.status === 'completed' ? 'paid' : 
                  m.status === 'in_progress' ? 'pending' : 
                  m.status === 'cancelled' ? 'pending' : 'pending',
          receiptNumber: '',
          receiptImage: m.receiptImage || null,
          notes: m.notes || `Maintenance: ${m.maintenanceType || 'Service'}`,
          isMaintenance: true,
          maintenanceId: m.id,
          maintenanceType: m.maintenanceType || 'general',
          priority: m.priority || 'medium',
          technician: m.technician || '',
          nextDueDate: m.nextDueDate || '',
          createdAt: m.createdAt || new Date().toISOString(),
          updatedAt: m.updatedAt || new Date().toISOString()
        };
      });

      // ✅ 5. Combine and filter by role
      let allExpenses = [...expensesData, ...maintenanceExpenses];

      if (isCarOwner) {
        // Get car owner profile
        const ownerResponse = await carOwnerService.getByUser(currentUser.id);
        let owner = null;
        if (ownerResponse?.success && ownerResponse?.data) {
          owner = ownerResponse.data;
        } else if (ownerResponse?.id) {
          owner = ownerResponse;
        }
        setCarOwner(owner);

        if (owner) {
          // Get vehicles owned by this car owner
          const ownerVehicles = vehiclesData.filter(v => v.ownerId === owner.id);
          const ownerVehicleIds = ownerVehicles.map(v => v.id);
          
          // Filter expenses for owner's vehicles
          allExpenses = allExpenses.filter(e => 
            ownerVehicleIds.includes(e.vehicleId)
          );
          
          // Add owner name
          allExpenses = allExpenses.map(e => ({
            ...e,
            ownerName: owner.name
          }));
        } else {
          allExpenses = [];
        }
      } else {
        // Fleet Manager sees ALL expenses
        // Add owner names
        const allOwners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
        allExpenses = allExpenses.map(e => {
          if (e.ownerId) {
            const owner = allOwners.find(o => o.id === e.ownerId);
            return { ...e, ownerName: owner?.name || '' };
          }
          return e;
        });
      }

      console.log(`📊 Loaded ${allExpenses.length} expenses`);
      setExpenses(allExpenses);
      
    } catch (error) {
      console.error('Error loading expenses:', error);
      showNotification('Error loading expenses', 'error');
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  // Fallback to localStorage
  const loadFromLocalStorage = () => {
    try {
      const storedExpenses = JSON.parse(localStorage.getItem('travel_agency_expenses') || '[]');
      const storedMaintenance = JSON.parse(localStorage.getItem('travel_agency_maintenance') || '[]');
      const storedVehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
      setVehicles(storedVehicles);

      const maintenanceExpenses = storedMaintenance.map(m => {
        const vehicle = storedVehicles.find(v => v.id === m.vehicleId);
        return {
          id: `maint_${m.id}`,
          category: 'maintenance',
          description: m.description || `${m.maintenanceType || 'Maintenance'} - ${vehicle?.registration || 'Unknown Vehicle'}`,
          amount: m.cost || 0,
          date: m.date || new Date().toISOString().split('T')[0],
          vehicleId: m.vehicleId || '',
          vehicleRegistration: vehicle?.registration || m.vehicleRegistration || '',
          vehicleMake: vehicle?.make || m.vehicleMake || '',
          vehicleModel: vehicle?.model || m.vehicleModel || '',
          ownerId: vehicle?.ownerId || '',
          ownerName: '',
          paymentMethod: 'cash',
          status: m.status === 'completed' ? 'paid' : 'pending',
          receiptNumber: '',
          receiptImage: m.receiptImage || null,
          notes: m.notes || `Maintenance: ${m.maintenanceType || 'Service'}`,
          isMaintenance: true,
          maintenanceId: m.id,
          createdAt: m.createdAt || new Date().toISOString()
        };
      });

      let allExpenses = [...storedExpenses, ...maintenanceExpenses];

      if (isCarOwner) {
        const allOwners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
        const owner = allOwners.find(o => o.userId === currentUser?.id);
        setCarOwner(owner);
        if (owner) {
          const ownerVehicles = storedVehicles.filter(v => v.ownerId === owner.id);
          const ownerVehicleIds = ownerVehicles.map(v => v.id);
          allExpenses = allExpenses.filter(e => ownerVehicleIds.includes(e.vehicleId));
        } else {
          allExpenses = [];
        }
      }

      setExpenses(allExpenses);
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  const generateId = () => {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const resetForm = () => {
    setFormData({
      category: 'fuel',
      description: '',
      amount: '',
      date: '',
      vehicleId: '',
      paymentMethod: 'cash',
      status: 'paid',
      receiptNumber: '',
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

  const getAvailableVehicles = () => {
    if (isCarOwner) {
      return vehicles.filter(v => v.ownerId === carOwner?.id);
    }
    return vehicles;
  };

  const handleAddExpense = async () => {
    if (!formData.category) {
      showNotification('Please select a category', 'error');
      return;
    }
    if (!formData.amount) {
      showNotification('Please enter amount', 'error');
      return;
    }
    if (!formData.date) {
      showNotification('Please select a date', 'error');
      return;
    }

    if (isCarOwner && formData.vehicleId) {
      const ownerVehicles = vehicles.filter(v => v.ownerId === carOwner?.id);
      const isValidVehicle = ownerVehicles.some(v => v.id === formData.vehicleId);
      if (!isValidVehicle) {
        showNotification('You can only add expenses for your own vehicles', 'error');
        return;
      }
    }

    // ✅ Format date properly
    const formattedDate = formData.date ? new Date(formData.date).toISOString().split('T')[0] : null;

    const vehicle = getVehicleDetails(formData.vehicleId);

    const newExpense = {
      category: formData.category,
      description: formData.description || '',
      amount: parseFloat(formData.amount) || 0,
      date: formattedDate,
      vehicleId: formData.vehicleId || null,
      paymentMethod: formData.paymentMethod,
      status: formData.status,
      receiptNumber: formData.receiptNumber || '',
      receiptImage: receiptImage || null,
      notes: formData.notes || '',
      tenantId: tenantId,
      createdByName: currentUser?.name || ''
    };

    setIsSubmitting(true);

    try {
      console.log('📤 Creating expense:', newExpense);
      const response = await expenseService.create(newExpense);
      console.log('📥 Create expense response:', response);
      
      if (response?.success) {
        showNotification(`✅ Expense added successfully!`);
        setShowAddModal(false);
        resetForm();
        loadData(tenantId);
      } else {
        showNotification('Failed to add expense: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      showNotification('Failed to add expense. Please try again.', 'error');
    }
    
    setIsSubmitting(false);
  };

  const handleEditExpense = async () => {
    if (!editingExpense) return;

    if (isCarOwner) {
      showNotification('Car owners cannot edit expenses. Please contact your Fleet Manager.', 'error');
      return;
    }

    if (editingExpense.isMaintenance) {
      showNotification('Maintenance expenses can only be edited from the Maintenance page', 'error');
      return;
    }

    const formattedDate = formData.date ? new Date(formData.date).toISOString().split('T')[0] : null;

    const updatedExpense = {
      category: formData.category,
      description: formData.description || '',
      amount: parseFloat(formData.amount) || 0,
      date: formattedDate,
      vehicleId: formData.vehicleId || null,
      paymentMethod: formData.paymentMethod,
      status: formData.status,
      receiptNumber: formData.receiptNumber || '',
      receiptImage: receiptImage || editingExpense.receiptImage || null,
      notes: formData.notes || '',
      tenantId: tenantId,
      createdByName: currentUser?.name || ''
    };

    setIsSubmitting(true);

    try {
      console.log(`📤 Updating expense ${editingExpense.id}:`, updatedExpense);
      const response = await expenseService.update(editingExpense.id, updatedExpense);
      console.log('📥 Update expense response:', response);
      
      if (response?.success) {
        showNotification(`✅ Expense updated successfully!`);
        setEditingExpense(null);
        setShowAddModal(false);
        resetForm();
        loadData(tenantId);
      } else {
        showNotification('Failed to update expense: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error updating expense:', error);
      showNotification('Failed to update expense. Please try again.', 'error');
    }
    
    setIsSubmitting(false);
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;

    if (isCarOwner) {
      showNotification('Car owners cannot delete expenses. Please contact your Fleet Manager.', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log(`📤 Deleting expense ${selectedExpense.id}`);
      const response = await expenseService.delete(selectedExpense.id);
      console.log('📥 Delete expense response:', response);
      
      if (response?.success) {
        showNotification('✅ Expense deleted successfully!');
        setShowDeleteModal(false);
        setSelectedExpense(null);
        loadData(tenantId);
      } else {
        showNotification('Failed to delete expense: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      showNotification('Failed to delete expense. Please try again.', 'error');
    }
    
    setIsSubmitting(false);
  };

  const openEditModal = (expense) => {
    if (isCarOwner) {
      showNotification('Car owners cannot edit expenses. Please contact your Fleet Manager.', 'error');
      return;
    }

    if (expense.isMaintenance) {
      showNotification('Maintenance expenses can only be edited from the Maintenance page', 'error');
      return;
    }
    
    setEditingExpense(expense);
    setFormData({
      category: expense.category || 'fuel',
      description: expense.description || '',
      amount: expense.amount || '',
      date: expense.date || '',
      vehicleId: expense.vehicleId || '',
      paymentMethod: expense.paymentMethod || 'cash',
      status: expense.status || 'paid',
      receiptNumber: expense.receiptNumber || '',
      receiptImage: expense.receiptImage || null,
      notes: expense.notes || ''
    });
    setReceiptImage(expense.receiptImage || null);
    setReceiptPreview(expense.receiptImage || null);
    setShowAddModal(true);
  };

  const handleDeleteClick = (expense) => {
    if (isCarOwner) {
      showNotification('Car owners cannot delete expenses. Please contact your Fleet Manager.', 'error');
      return;
    }
    setSelectedExpense(expense);
    setShowDeleteModal(true);
  };

  const getCategoryLabel = (category) => {
    const categoryMap = {
      fuel: 'Fuel',
      insurance: 'Insurance',
      permit: 'Permit/License',
      maintenance: 'Maintenance',
      repairs: 'Repairs',
      salaries: 'Salaries',
      rent: 'Rent/Office',
      marketing: 'Marketing',
      utilities: 'Utilities',
      other: 'Other'
    };
    return categoryMap[category] || category || 'Other';
  };

  const getCategoryIcon = (category) => {
    const iconMap = {
      fuel: <Fuel size={16} className="text-orange-500" />,
      insurance: <Shield size={16} className="text-blue-500" />,
      permit: <FileText size={16} className="text-purple-500" />,
      maintenance: <Wrench size={16} className="text-yellow-500" />,
      repairs: <Wrench size={16} className="text-red-500" />,
      salaries: <Users size={16} className="text-green-500" />,
      rent: <Building size={16} className="text-gray-500" />,
      marketing: <TrendingUp size={16} className="text-pink-500" />,
      utilities: <Receipt size={16} className="text-cyan-500" />,
      other: <Tag size={16} className="text-gray-500" />
    };
    return iconMap[category] || <Tag size={16} className="text-gray-500" />;
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      overdue: { label: 'Overdue', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { label: status || 'Paid', color: 'bg-gray-100 text-gray-800' };
  };

  const getPaymentMethodLabel = (method) => {
    const methodMap = {
      cash: 'Cash',
      mpesa: 'M-Pesa',
      bank: 'Bank Transfer',
      credit: 'Credit'
    };
    return methodMap[method] || method || 'Cash';
  };

  const expenseCategories = [
    { value: 'fuel', label: 'Fuel' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'permit', label: 'Permit/License' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'repairs', label: 'Repairs' },
    { value: 'salaries', label: 'Salaries' },
    { value: 'rent', label: 'Rent/Office' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'utilities', label: 'Utilities' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = ['all', 'paid', 'pending', 'overdue'];

  const filteredExpenses = expenses.filter(e => {
    const vehicle = getVehicleDetails(e.vehicleId);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      e.description?.toLowerCase().includes(searchLower) ||
      e.category?.toLowerCase().includes(searchLower) ||
      vehicle?.registration?.toLowerCase().includes(searchLower) ||
      e.receiptNumber?.toLowerCase().includes(searchLower);
    
    const matchesCategory = filterCategory === 'all' || e.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || e.status === filterStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Stats
  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPaid = expenses.filter(e => e.status === 'paid').reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalPending = expenses.filter(e => e.status === 'pending').reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalOverdue = expenses.filter(e => e.status === 'overdue').reduce((sum, e) => sum + (e.amount || 0), 0);

  const availableVehicles = getAvailableVehicles();

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
      {showImageModal && selectedExpense && selectedExpense.receiptImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setShowImageModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Camera size={24} />
                <div>
                  <h2 className="text-lg font-semibold">Receipt Image</h2>
                  <p className="text-sm text-red-100">
                    {selectedExpense.category ? getCategoryLabel(selectedExpense.category) : 'Expense'} 
                    {selectedExpense.vehicleRegistration && ` - ${selectedExpense.vehicleRegistration}`}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowImageModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 flex items-center justify-center">
              <img 
                src={selectedExpense.receiptImage} 
                alt="Receipt" 
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end">
              <button 
                onClick={() => setShowImageModal(false)} 
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-red-600 to-red-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <DollarSign size={24} />
                <div>
                  <h2 className="text-lg font-semibold">{editingExpense ? 'Edit Expense' : 'New Expense'}</h2>
                  <p className="text-sm text-red-100">{editingExpense ? 'Update expense details' : 'Add a new expense'}</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Amount (KES) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Brief description of expense"
                />
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
                  <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle</label>
                  <select
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({...formData, vehicleId: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">No vehicle</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.registration} - {v.make} {v.model}
                      </option>
                    ))}
                    {availableVehicles.length === 0 && isCarOwner && (
                      <option disabled>No vehicles found</option>
                    )}
                  </select>
                  {isCarOwner && availableVehicles.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ You haven't added any vehicles yet. Add a vehicle first.
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="cash">Cash</option>
                    <option value="mpesa">M-Pesa</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="credit">Credit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Receipt Number</label>
                <input
                  type="text"
                  value={formData.receiptNumber}
                  onChange={(e) => setFormData({...formData, receiptNumber: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Receipt/invoice number"
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
                onClick={editingExpense ? handleEditExpense : handleAddExpense}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
              >
                <Save size={16} />
                {editingExpense ? 'Update Expense' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Delete Expense</h2>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete this expense?
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteExpense}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Expenses</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isCarOwner ? 'Track expenses for your vehicles' : 'Track all business expenses'}
          </p>
          {isCarOwner && (
            <p className="text-xs text-blue-600 mt-1">
              ℹ️ You can view and add expenses for vehicles you own
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
          {!isCarOwner && (
            <button 
              onClick={() => {
                resetForm();
                setEditingExpense(null);
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm flex items-center gap-2"
            >
              <Plus size={16} /> Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {expenses.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Total Expenses</p>
            <p className="text-xl font-bold text-red-600">KSh {totalExpenses.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Paid</p>
            <p className="text-xl font-bold text-green-600">KSh {totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Pending</p>
            <p className="text-xl font-bold text-yellow-600">KSh {totalPending.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Overdue</p>
            <p className="text-xl font-bold text-red-600">KSh {totalOverdue.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search expenses..."
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
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="all">All Categories</option>
            {expenseCategories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
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

      {/* Expenses List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filteredExpenses.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <DollarSign size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No expenses found</p>
          <p className="text-sm text-gray-400">
            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters' 
              : isCarOwner 
                ? 'No expenses found for your vehicles'
                : 'Add your first expense'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredExpenses.map((expense) => {
            const vehicle = getVehicleDetails(expense.vehicleId);
            const statusBadge = getStatusBadge(expense.status);
            const hasReceipt = expense.receiptImage !== null && expense.receiptImage !== '';
            const showActions = !isCarOwner;

            return (
              <div 
                key={expense.id}
                className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
                        {getCategoryIcon(expense.category)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {getCategoryLabel(expense.category)}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {expense.description || 'No description'} • {expense.date || 'No date'}
                        </p>
                        {isFleetManager && expense.ownerName && (
                          <p className="text-[10px] text-gray-400">Owner: {expense.ownerName}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {hasReceipt && (
                        <button
                          onClick={() => {
                            setSelectedExpense(expense);
                            setShowImageModal(true);
                          }}
                          className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-blue-600"
                          title="View Receipt"
                        >
                          <Image size={16} />
                        </button>
                      )}
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-sm font-bold text-red-600">
                        KSh {expense.amount?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 text-xs text-gray-500">
                    <div><span className="font-medium text-gray-600">Vehicle:</span> {vehicle ? vehicle.registration : 'N/A'}</div>
                    <div><span className="font-medium text-gray-600">Payment:</span> {getPaymentMethodLabel(expense.paymentMethod)}</div>
                    <div><span className="font-medium text-gray-600">Date:</span> {expense.date || 'N/A'}</div>
                  </div>

                  {expense.notes && (
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-medium text-gray-600">Notes:</span>
                      <span className="text-gray-700 ml-1">{expense.notes}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    {isCarOwner ? (
                      <button
                        onClick={() => {
                          showNotification(`📋 ${getCategoryLabel(expense.category)}: KSh ${expense.amount}\nVehicle: ${vehicle?.registration || 'N/A'}\nDate: ${expense.date}\nStatus: ${statusBadge.label}`, 'info');
                        }}
                        className="flex-1 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye size={14} /> View Details
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => openEditModal(expense)}
                          className="flex-1 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(expense)}
                          className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
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

export default Expenses;