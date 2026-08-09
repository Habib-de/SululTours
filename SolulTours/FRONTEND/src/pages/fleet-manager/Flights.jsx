import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Filter, RefreshCw, Eye, Edit2, Trash2,
  X, Save, Upload, Image as ImageIcon, Calendar, Users,
  MapPin, Clock, DollarSign, Star, TrendingUp, AlertCircle,
  CheckCircle, Globe, Camera, Tag, Percent,
  Download, Share2, Printer, FileImage, Archive,
  Plane, PlaneTakeoff, PlaneLanding, Ticket, 
  MapPinned, Wifi, Coffee, Tv, Headphones,
  User, Phone, Mail, Building, Award,
  Crown, Briefcase, Users as UsersIcon, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { flightService } from '../../services/api';

const Flights = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAirline, setFilterAirline] = useState('all');
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingFlight, setEditingFlight] = useState(null);
  const [tenantId, setTenantId] = useState(null);

  // Image upload refs
  const imageInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    airline: '',
    flightNumber: '',
    origin: '',
    destination: '',
    departureDate: '',
    departureTime: '',
    arrivalDate: '',
    arrivalTime: '',
    duration: '',
    economyPrice: '',
    businessPrice: '',
    firstClassPrice: '',
    economySeats: 100,
    businessSeats: 20,
    firstClassSeats: 10,
    status: 'active',
    flightType: 'international',
    terminal: '',
    gate: '',
    baggageAllowance: '20kg',
    amenities: [],
    image: null,
    notes: ''
  });

  const [editFormData, setEditFormData] = useState(null);

  // Flight statuses
  const statuses = [
    { value: 'active', label: '✅ Active' },
    { value: 'scheduled', label: '📅 Scheduled' },
    { value: 'cancelled', label: '❌ Cancelled' },
    { value: 'completed', label: '✅ Completed' },
    { value: 'delayed', label: '⏳ Delayed' }
  ];

  const flightTypes = [
    { value: 'domestic', label: '🏠 Domestic' },
    { value: 'international', label: '🌍 International' },
    { value: 'regional', label: '🌍 Regional' },
    { value: 'charter', label: '✈️ Charter' }
  ];

  const amenitiesOptions = [
    { value: 'wifi', label: 'WiFi' },
    { value: 'meals', label: 'Meals Included' },
    { value: 'entertainment', label: 'In-flight Entertainment' },
    { value: 'power', label: 'Power Outlets' },
    { value: 'extra_legroom', label: 'Extra Legroom' },
    { value: 'priority_boarding', label: 'Priority Boarding' },
    { value: 'lounge_access', label: 'Lounge Access' },
    { value: 'baggage_insurance', label: 'Baggage Insurance' }
  ];

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
      console.log('🔍 Loading flights with tenantId:', tenantToUse);
      
      if (!tenantToUse) {
        console.warn('⚠️ No tenantId available, skipping API call');
        setLoading(false);
        return;
      }
      
      // ✅ Fetch flights from API
      const response = await flightService.getAll(tenantToUse);
      console.log('📊 Flights response:', response);
      
      let flightData = [];
      if (response?.success && response?.data) {
        flightData = response.data;
      } else if (Array.isArray(response)) {
        flightData = response;
      }
      
      // ✅ Parse amenities (JSON string to array)
      const parsedFlights = flightData.map(flight => ({
        ...flight,
        amenities: flight.amenities ? 
          (typeof flight.amenities === 'string' ? JSON.parse(flight.amenities) : flight.amenities) 
          : []
      }));
      
      setFlights(parsedFlights);
      
      // Save to localStorage for fallback
      localStorage.setItem('travel_agency_flights', JSON.stringify(parsedFlights));
      
    } catch (error) {
      console.error('Error loading flights:', error);
      showNotification('Error loading flights', 'error');
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  // ✅ Fallback to localStorage
  const loadFromLocalStorage = () => {
    console.warn('Loading flights from localStorage (fallback)');
    try {
      const storedFlights = JSON.parse(localStorage.getItem('travel_agency_flights') || '[]');
      setFlights(storedFlights);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setFlights([]);
    }
  };

  const generateId = () => {
    return `flight_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  };

  const resetForm = () => {
    setFormData({
      airline: '',
      flightNumber: '',
      origin: '',
      destination: '',
      departureDate: '',
      departureTime: '',
      arrivalDate: '',
      arrivalTime: '',
      duration: '',
      economyPrice: '',
      businessPrice: '',
      firstClassPrice: '',
      economySeats: 100,
      businessSeats: 20,
      firstClassSeats: 10,
      status: 'active',
      flightType: 'international',
      terminal: '',
      gate: '',
      baggageAllowance: '20kg',
      amenities: [],
      image: null,
      notes: ''
    });
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleImageUpload = (e) => {
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
    reader.onload = (event) => {
      if (editingFlight) {
        setEditingFlight(prev => ({ ...prev, image: event.target.result }));
      } else {
        setFormData(prev => ({ ...prev, image: event.target.result }));
      }
      setImagePreview(event.target.result);
      showNotification('Image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (editingFlight) {
      setEditingFlight(prev => ({ ...prev, image: null }));
    } else {
      setFormData(prev => ({ ...prev, image: null }));
    }
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingFlight) {
      setEditingFlight(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleAmenity = (amenityValue) => {
    if (editingFlight) {
      const amenities = editingFlight.amenities?.includes(amenityValue)
        ? editingFlight.amenities.filter(a => a !== amenityValue)
        : [...(editingFlight.amenities || []), amenityValue];
      setEditingFlight(prev => ({ ...prev, amenities }));
    } else {
      const amenities = formData.amenities?.includes(amenityValue)
        ? formData.amenities.filter(a => a !== amenityValue)
        : [...(formData.amenities || []), amenityValue];
      setFormData(prev => ({ ...prev, amenities }));
    }
  };

  // ✅ Create flight via API
  const handleCreateFlight = async () => {
    if (!formData.airline || !formData.flightNumber || !formData.origin || !formData.destination) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }
    if (!formData.economyPrice && !formData.businessPrice && !formData.firstClassPrice) {
      showNotification('Please enter at least one price', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const newFlight = {
        airline: formData.airline,
        flightNumber: formData.flightNumber.toUpperCase(),
        origin: formData.origin,
        destination: formData.destination,
        flightType: formData.flightType || 'international',
        departureDate: formData.departureDate || null,
        departureTime: formData.departureTime || null,
        arrivalDate: formData.arrivalDate || null,
        arrivalTime: formData.arrivalTime || null,
        duration: formData.duration || '',
        economyPrice: parseFloat(formData.economyPrice) || 0,
        businessPrice: parseFloat(formData.businessPrice) || 0,
        firstClassPrice: parseFloat(formData.firstClassPrice) || 0,
        economySeats: parseInt(formData.economySeats) || 100,
        businessSeats: parseInt(formData.businessSeats) || 20,
        firstClassSeats: parseInt(formData.firstClassSeats) || 10,
        status: formData.status || 'active',
        terminal: formData.terminal || '',
        gate: formData.gate || '',
        baggageAllowance: formData.baggageAllowance || '20kg',
        amenities: JSON.stringify(formData.amenities || []),
        image: formData.image || null,
        notes: formData.notes || '',
        tenantId: tenantId
      };

      console.log('📤 Creating flight:', newFlight);
      const response = await flightService.create(newFlight);
      console.log('📥 Create response:', response);

      if (response?.success) {
        showNotification(`✅ Flight ${newFlight.airline} ${newFlight.flightNumber} created successfully!`);
        setShowCreateModal(false);
        resetForm();
        loadData(tenantId);
      } else {
        showNotification('Failed to create flight: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error creating flight:', error);
      showNotification('Failed to create flight. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  // ✅ Edit flight via API
  const handleEditFlight = async () => {
    if (!editingFlight) return;

    setIsSubmitting(true);

    try {
      const updatedFlight = {
        airline: editingFlight.airline,
        flightNumber: editingFlight.flightNumber.toUpperCase(),
        origin: editingFlight.origin,
        destination: editingFlight.destination,
        flightType: editingFlight.flightType || 'international',
        departureDate: editingFlight.departureDate || null,
        departureTime: editingFlight.departureTime || null,
        arrivalDate: editingFlight.arrivalDate || null,
        arrivalTime: editingFlight.arrivalTime || null,
        duration: editingFlight.duration || '',
        economyPrice: parseFloat(editingFlight.economyPrice) || 0,
        businessPrice: parseFloat(editingFlight.businessPrice) || 0,
        firstClassPrice: parseFloat(editingFlight.firstClassPrice) || 0,
        economySeats: parseInt(editingFlight.economySeats) || 100,
        businessSeats: parseInt(editingFlight.businessSeats) || 20,
        firstClassSeats: parseInt(editingFlight.firstClassSeats) || 10,
        status: editingFlight.status || 'active',
        terminal: editingFlight.terminal || '',
        gate: editingFlight.gate || '',
        baggageAllowance: editingFlight.baggageAllowance || '20kg',
        amenities: JSON.stringify(editingFlight.amenities || []),
        image: editingFlight.image || null,
        notes: editingFlight.notes || '',
        tenantId: tenantId
      };

      console.log(`📤 Updating flight ${editingFlight.id}:`, updatedFlight);
      const response = await flightService.update(editingFlight.id, updatedFlight);
      console.log('📥 Update response:', response);

      if (response?.success) {
        showNotification(`✅ Flight updated successfully!`);
        setShowEditModal(false);
        setEditingFlight(null);
        resetForm();
        loadData(tenantId);
      } else {
        showNotification('Failed to update flight: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error updating flight:', error);
      showNotification('Failed to update flight. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  // ✅ Delete flight via API
  const handleDeleteFlight = async () => {
    if (!selectedFlight) return;

    setIsSubmitting(true);

    try {
      console.log(`📤 Deleting flight ${selectedFlight.id}`);
      const response = await flightService.delete(selectedFlight.id);
      console.log('📥 Delete response:', response);

      if (response?.success) {
        showNotification(`✅ Flight "${selectedFlight.airline} ${selectedFlight.flightNumber}" deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedFlight(null);
        loadData(tenantId);
      } else {
        showNotification('Failed to delete flight: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting flight:', error);
      showNotification('Failed to delete flight. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  const openEditModal = (flight) => {
    setEditingFlight({
      ...flight,
      amenities: Array.isArray(flight.amenities) ? flight.amenities : []
    });
    setImagePreview(flight.image || null);
    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: '✅ Active', color: 'bg-green-100 text-green-800' },
      scheduled: { label: '📅 Scheduled', color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: '❌ Cancelled', color: 'bg-red-100 text-red-800' },
      completed: { label: '✅ Completed', color: 'bg-gray-100 text-gray-800' },
      delayed: { label: '⏳ Delayed', color: 'bg-yellow-100 text-yellow-800' }
    };
    return statusMap[status] || { label: status || 'Active', color: 'bg-gray-100 text-gray-800' };
  };

  const getTypeLabel = (type) => {
    const labels = {
      domestic: '🏠 Domestic',
      international: '🌍 International',
      regional: '🌍 Regional',
      charter: '✈️ Charter'
    };
    return labels[type] || type || 'International';
  };

  const formatCurrency = (amount) => {
    return `KSh ${(amount || 0).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  const filteredFlights = flights.filter(flight => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      flight.airline?.toLowerCase().includes(searchLower) ||
      flight.flightNumber?.toLowerCase().includes(searchLower) ||
      flight.origin?.toLowerCase().includes(searchLower) ||
      flight.destination?.toLowerCase().includes(searchLower);
    const matchesStatus = filterStatus === 'all' || flight.status === filterStatus;
    const matchesAirline = filterAirline === 'all' || flight.airline === filterAirline;
    return matchesSearch && matchesStatus && matchesAirline;
  });

  // Stats
  const totalFlights = flights.length;
  const activeFlights = flights.filter(f => f.status === 'active' || f.status === 'scheduled').length;

  const statsCards = [
    { title: 'Total Flights', value: totalFlights, icon: Plane, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active/Scheduled', value: activeFlights, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Airlines', value: new Set(flights.map(f => f.airline)).size, icon: Building, color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  // Get unique airlines for filter
  const airlines = [...new Set(flights.map(f => f.airline))];

  // Render Form Modal
  const renderFormModal = (isEdit = false) => {
    const isOpen = isEdit ? showEditModal : showCreateModal;
    const data = isEdit ? editingFlight : formData;
    const setData = isEdit ? setEditingFlight : setFormData;
    const handleSubmit = isEdit ? handleEditFlight : handleCreateFlight;
    const closeModal = () => {
      if (isEdit) {
        setShowEditModal(false);
        setEditingFlight(null);
        resetForm();
      } else {
        setShowCreateModal(false);
        resetForm();
      }
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={closeModal}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <button 
            onClick={closeModal}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>

          <div className={`px-6 py-5 rounded-t-2xl ${isEdit ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-purple-600 to-purple-700'}`}>
            <h2 className="text-2xl font-bold text-white">
              {isEdit ? 'Edit Flight' : 'Add New Flight'}
            </h2>
            <p className={`text-sm ${isEdit ? 'text-blue-100' : 'text-purple-100'}`}>
              {isEdit ? 'Update flight details' : 'Add a new flight to your inventory'}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Airline *</label>
                <input
                  type="text"
                  name="airline"
                  value={data.airline || ''}
                  onChange={(e) => setData({ ...data, airline: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Kenya Airways"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flight Number *</label>
                <input
                  type="text"
                  name="flightNumber"
                  value={data.flightNumber || ''}
                  onChange={(e) => setData({ ...data, flightNumber: e.target.value.toUpperCase() })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., KQ 100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Origin *</label>
                <input
                  type="text"
                  name="origin"
                  value={data.origin || ''}
                  onChange={(e) => setData({ ...data, origin: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Nairobi (NBO)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                <input
                  type="text"
                  name="destination"
                  value={data.destination || ''}
                  onChange={(e) => setData({ ...data, destination: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., London (LHR)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Flight Type</label>
                <select
                  name="flightType"
                  value={data.flightType || 'international'}
                  onChange={(e) => setData({ ...data, flightType: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {flightTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={data.status || 'active'}
                  onChange={(e) => setData({ ...data, status: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {statuses.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              {/* Departure */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
                <input
                  type="date"
                  name="departureDate"
                  value={data.departureDate || ''}
                  onChange={(e) => setData({ ...data, departureDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Departure Time</label>
                <input
                  type="time"
                  name="departureTime"
                  value={data.departureTime || ''}
                  onChange={(e) => setData({ ...data, departureTime: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Arrival */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Date</label>
                <input
                  type="date"
                  name="arrivalDate"
                  value={data.arrivalDate || ''}
                  onChange={(e) => setData({ ...data, arrivalDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Arrival Time</label>
                <input
                  type="time"
                  name="arrivalTime"
                  value={data.arrivalTime || ''}
                  onChange={(e) => setData({ ...data, arrivalTime: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <input
                  type="text"
                  name="duration"
                  value={data.duration || ''}
                  onChange={(e) => setData({ ...data, duration: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 8h 30m"
                />
              </div>

              {/* Prices by Class */}
              <div className="md:col-span-2">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2 flex items-center gap-2">
                  <Ticket size={16} /> Prices by Class
                </h4>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <UsersIcon size={16} className="text-green-600" /> Economy Price (KES)
                </label>
                <input
                  type="number"
                  name="economyPrice"
                  value={data.economyPrice || ''}
                  onChange={(e) => setData({ ...data, economyPrice: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 45000"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Briefcase size={16} className="text-blue-600" /> Business Price (KES)
                </label>
                <input
                  type="number"
                  name="businessPrice"
                  value={data.businessPrice || ''}
                  onChange={(e) => setData({ ...data, businessPrice: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 85000"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Crown size={16} className="text-yellow-600" /> First Class Price (KES)
                </label>
                <input
                  type="number"
                  name="firstClassPrice"
                  value={data.firstClassPrice || ''}
                  onChange={(e) => setData({ ...data, firstClassPrice: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 120000"
                  min="0"
                />
              </div>

              <div className="md:col-span-2 bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">💡 Tip: Economy is usually cheapest, Business is premium, First Class is luxury.</p>
              </div>

              {/* Seats */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Economy Seats</label>
                <input
                  type="number"
                  name="economySeats"
                  value={data.economySeats || 100}
                  onChange={(e) => setData({ ...data, economySeats: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Seats</label>
                <input
                  type="number"
                  name="businessSeats"
                  value={data.businessSeats || 20}
                  onChange={(e) => setData({ ...data, businessSeats: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Class Seats</label>
                <input
                  type="number"
                  name="firstClassSeats"
                  value={data.firstClassSeats || 10}
                  onChange={(e) => setData({ ...data, firstClassSeats: parseInt(e.target.value) || 0 })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terminal</label>
                <input
                  type="text"
                  name="terminal"
                  value={data.terminal || ''}
                  onChange={(e) => setData({ ...data, terminal: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Terminal 1A"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gate</label>
                <input
                  type="text"
                  name="gate"
                  value={data.gate || ''}
                  onChange={(e) => setData({ ...data, gate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Gate 12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Baggage Allowance</label>
                <input
                  type="text"
                  name="baggageAllowance"
                  value={data.baggageAllowance || '20kg'}
                  onChange={(e) => setData({ ...data, baggageAllowance: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 20kg"
                />
              </div>

              {/* Amenities */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {amenitiesOptions.map(amenity => {
                    const isSelected = (data.amenities || []).includes(amenity.value);
                    return (
                      <button
                        key={amenity.value}
                        type="button"
                        onClick={() => toggleAmenity(amenity.value)}
                        className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-colors ${
                          isSelected 
                            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                            : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                        }`}
                      >
                        {amenity.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Flight Image</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                  >
                    <Camera size={16} /> Upload Image
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <span className="text-xs text-gray-400">JPG, PNG (Max 5MB)</span>
                </div>
                {imagePreview && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={imagePreview} alt="Flight" className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={data.notes || ''}
                  onChange={(e) => setData({ ...data, notes: e.target.value })}
                  rows="2"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Internal notes..."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200 mt-4">
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {isEdit ? 'Update Flight' : 'Add Flight'}
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

  // Render Delete Modal
  const renderDeleteModal = () => {
    if (!showDeleteModal || !selectedFlight) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowDeleteModal(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Flight?</h3>
            <p className="text-gray-500 text-sm">
              Are you sure you want to delete "{selectedFlight.airline} {selectedFlight.flightNumber}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleDeleteFlight}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button 
                onClick={() => setShowDeleteModal(false)}
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

  // Render Detail Modal
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedFlight) return null;

    const statusBadge = getStatusBadge(selectedFlight.status);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowDetailModal(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <button 
            onClick={() => setShowDetailModal(false)}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-white">{selectedFlight.airline} {selectedFlight.flightNumber}</h2>
            <p className="text-blue-100 text-sm">{selectedFlight.origin} → {selectedFlight.destination}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
              {getTypeLabel(selectedFlight.flightType)}
            </span>
          </div>

          <div className="p-6">
            {selectedFlight.image && (
              <div className="mb-4">
                <img src={selectedFlight.image} alt={selectedFlight.airline} className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <PlaneTakeoff size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{selectedFlight.origin}</p>
                <p className="text-xs text-gray-500">Origin</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <PlaneLanding size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{selectedFlight.destination}</p>
                <p className="text-xs text-gray-500">Destination</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className={`text-sm font-semibold ${statusBadge.color}`}>{statusBadge.label}</span>
                <p className="text-xs text-gray-500">Status</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Ticket size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-xs text-gray-500">Seat Classes</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">✈️ Departure</p>
                <p className="text-sm font-medium">{selectedFlight.departureDate ? formatDate(selectedFlight.departureDate) : 'N/A'}</p>
                <p className="text-sm text-gray-600">{selectedFlight.departureTime || 'N/A'}</p>
                {selectedFlight.terminal && <p className="text-xs text-gray-400">Terminal: {selectedFlight.terminal}</p>}
                {selectedFlight.gate && <p className="text-xs text-gray-400">Gate: {selectedFlight.gate}</p>}
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">🛬 Arrival</p>
                <p className="text-sm font-medium">{selectedFlight.arrivalDate ? formatDate(selectedFlight.arrivalDate) : 'N/A'}</p>
                <p className="text-sm text-gray-600">{selectedFlight.arrivalTime || 'N/A'}</p>
                {selectedFlight.duration && <p className="text-xs text-gray-400">Duration: {selectedFlight.duration}</p>}
              </div>
            </div>

            {/* Prices by Class */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-green-50 rounded-lg p-3 text-center border-2 border-green-200">
                <UsersIcon size={16} className="mx-auto text-green-600 mb-1" />
                <p className="text-xs text-gray-500">Economy</p>
                <p className="text-lg font-bold text-green-700">{formatCurrency(selectedFlight.economyPrice)}</p>
                <p className="text-xs text-gray-400">{selectedFlight.economySeats || 0} seats</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center border-2 border-blue-200">
                <Briefcase size={16} className="mx-auto text-blue-600 mb-1" />
                <p className="text-xs text-gray-500">Business</p>
                <p className="text-lg font-bold text-blue-700">{formatCurrency(selectedFlight.businessPrice)}</p>
                <p className="text-xs text-gray-400">{selectedFlight.businessSeats || 0} seats</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center border-2 border-yellow-200">
                <Crown size={16} className="mx-auto text-yellow-600 mb-1" />
                <p className="text-xs text-gray-500">First Class</p>
                <p className="text-lg font-bold text-yellow-700">{formatCurrency(selectedFlight.firstClassPrice)}</p>
                <p className="text-xs text-gray-400">{selectedFlight.firstClassSeats || 0} seats</p>
              </div>
            </div>

            {selectedFlight.amenities && selectedFlight.amenities.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedFlight.amenities.map((amenity) => {
                    const found = amenitiesOptions.find(a => a.value === amenity);
                    return (
                      <span key={amenity} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {found?.label || amenity}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedFlight.baggageAllowance && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Baggage Allowance</h4>
                <p className="text-sm text-gray-600">{selectedFlight.baggageAllowance}</p>
              </div>
            )}

            {selectedFlight.notes && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Notes</h4>
                <p className="text-sm text-gray-600">{selectedFlight.notes}</p>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2 flex-wrap">
            <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
              Close
            </button>
            <button 
              onClick={() => {
                setShowDetailModal(false);
                openEditModal(selectedFlight);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Edit2 size={16} className="inline mr-1" /> Edit
            </button>
          </div>
        </div>
      </div>
    );
  };

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

      {/* Modals */}
      {renderFormModal(false)}
      {renderFormModal(true)}
      {renderDeleteModal()}
      {renderDetailModal()}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Plane size={28} className="text-blue-600" />
            Flights
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage local and international flights</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => loadData(tenantId)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Add Flight
          </button>
        </div>
      </div>

      {/* Stats */}
<div className="grid grid-cols-3 gap-2 sm:gap-4 mb-6">
  {statsCards.map((stat, index) => (
    <div key={index} className={`${stat.bg} rounded-xl p-2 sm:p-4 border border-gray-100`}>
      <div className="flex items-center justify-between">
        <stat.icon size={16} className={stat.color} />
      </div>
      <p className="text-base sm:text-2xl font-bold text-gray-800 mt-1 sm:mt-2">{stat.value}</p>
      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-tight">
        {stat.title === 'Active/Scheduled' ? (
          <>
            <span className="block sm:hidden">Active</span>
            <span className="block sm:hidden">Scheduled</span>
            <span className="hidden sm:inline">Active/Scheduled</span>
          </>
        ) : (
          stat.title
        )}
      </p>
    </div>
  ))}
</div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by airline, flight number, or destination..."
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
            <option value="active">✅ Active</option>
            <option value="scheduled">📅 Scheduled</option>
            <option value="completed">✅ Completed</option>
            <option value="cancelled">❌ Cancelled</option>
            <option value="delayed">⏳ Delayed</option>
          </select>
          {airlines.length > 0 && (
            <select
              value={filterAirline}
              onChange={(e) => setFilterAirline(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Airlines</option>
              {airlines.map(airline => (
                <option key={airline} value={airline}>{airline}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Flights Grid */}
{loading ? (
  <div className="text-center py-12 text-gray-400">Loading...</div>
) : filteredFlights.length === 0 ? (
  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
    <Plane size={48} className="mx-auto text-gray-300 mb-3" />
    <p className="text-gray-500">No flights found</p>
    <p className="text-sm text-gray-400">
      {searchQuery ? 'Try adjusting your search' : 'Add your first flight by clicking "Add Flight"'}
    </p>
    <button
      onClick={() => {
        resetForm();
        setShowCreateModal(true);
      }}
      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
    >
      <Plus size={16} className="inline mr-1" /> Add Flight
    </button>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 max-w-6xl mx-auto">
    {filteredFlights.map((flight) => {
      const statusBadge = getStatusBadge(flight.status);

      return (
        <div key={flight.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
          {flight.image ? (
            <div className="h-56 overflow-hidden">
              <img src={flight.image} alt={flight.airline} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </div>
          ) : (
            <div className="h-56 bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
              <Plane size={48} className="text-blue-300" />
            </div>
          )}
          <div className="p-5">
            {/* card content stays the same */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{flight.airline}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <span className="font-medium text-blue-600">{flight.flightNumber}</span>
                  <span className="text-gray-300">•</span>
                  <span>{flight.origin} <ArrowRight size={10} className="inline" /> {flight.destination}</span>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color} flex-shrink-0 ml-2`}>
                {statusBadge.label}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
              {flight.departureDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-blue-500" /> {formatDate(flight.departureDate)}
                </span>
              )}
              {flight.duration && (
                <span className="flex items-center gap-1">
                  <Clock size={12} className="text-blue-500" /> {flight.duration}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users size={12} className="text-blue-500" /> {flight.economySeats || 0} seats
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mt-1.5">
              <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded">
                💺 {formatCurrency(flight.economyPrice)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">
                💼 {formatCurrency(flight.businessPrice)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">
                👑 {formatCurrency(flight.firstClassPrice)}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">
                {getTypeLabel(flight.flightType)}
              </span>
              {flight.amenities && flight.amenities.slice(0, 3).map(amenity => {
                const found = amenitiesOptions.find(a => a.value === amenity);
                return (
                  <span key={amenity} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {found?.label || amenity}
                  </span>
                );
              })}
              {flight.amenities && flight.amenities.length > 3 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                  +{flight.amenities.length - 3}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelectedFlight(flight);
                  setShowDetailModal(true);
                }}
                className="flex-1 px-2 py-1.5 text-[10px] text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Eye size={13} /> View
              </button>
              <button
                onClick={() => openEditModal(flight)}
                className="flex-1 px-2 py-1.5 text-[10px] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Edit2 size={13} /> Edit
              </button>
              <button
                onClick={() => {
                  setSelectedFlight(flight);
                  setShowDeleteModal(true);
                }}
                className="flex-1 px-2 py-1.5 text-[10px] text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Trash2 size={13} />
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

export default Flights;