import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Filter, RefreshCw, Eye, Edit2, Trash2,
  X, Save, Upload, Image as ImageIcon, Calendar, Users,
  MapPin, Clock, DollarSign, Star, TrendingUp, AlertCircle,
  CheckCircle, Globe, Camera, Tag, Percent,
  Download, Share2, Printer, FileImage, Archive,
  Plane, Building, Award, Shield, 
  Phone, Mail, MapPinned, Wifi, Coffee,
  User, Headphones, CreditCard, Wallet,
  Heart, Sparkles, Trophy
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { airlineService } from '../../services/api'; // ✅ IMPORT THE SERVICE

const Airlines = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [airlines, setAirlines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedAirline, setSelectedAirline] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingAirline, setEditingAirline] = useState(null);
  const [tenantId, setTenantId] = useState(null); // ✅ ADD TENANT ID

  // Image upload refs
  const imageInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    country: '',
    headquarters: '',
    founded: '',
    fleetSize: '',
    destinations: 0,
    website: '',
    phone: '',
    email: '',
    status: 'active',
    alliance: 'none',
    starRating: 3,
    baggageAllowance: '20kg',
    amenities: [],
    description: '',
    image: null,
    notes: ''
  });

  // Statuses
  const statuses = [
    { value: 'active', label: '✅ Active' },
    { value: 'inactive', label: '❌ Inactive' },
    { value: 'suspended', label: '⛔ Suspended' }
  ];

  // Alliances
  const alliances = [
    { value: 'none', label: 'Independent' },
    { value: 'star_alliance', label: '⭐ Star Alliance' },
    { value: 'sky_team', label: '✈️ SkyTeam' },
    { value: 'one_world', label: '🌍 OneWorld' }
  ];

  const starRatings = [
    { value: 1, label: '⭐' },
    { value: 2, label: '⭐⭐' },
    { value: 3, label: '⭐⭐⭐' },
    { value: 4, label: '⭐⭐⭐⭐' },
    { value: 5, label: '⭐⭐⭐⭐⭐' }
  ];

  const amenityOptions = [
    { value: 'wifi', label: 'WiFi' },
    { value: 'meals', label: 'Free Meals' },
    { value: 'entertainment', label: 'In-flight Entertainment' },
    { value: 'power', label: 'Power Outlets' },
    { value: 'extra_legroom', label: 'Extra Legroom' },
    { value: 'priority_boarding', label: 'Priority Boarding' },
    { value: 'lounge_access', label: 'Lounge Access' },
    { value: 'baggage_insurance', label: 'Baggage Insurance' },
    { value: 'kids_friendly', label: 'Kids Friendly' },
    { value: 'pets_allowed', label: 'Pets Allowed' }
  ];

  const parseAmenities = (amenities) => {
  if (!amenities) return [];
  if (Array.isArray(amenities)) return amenities;
  if (typeof amenities === 'string') {
    try {
      const parsed = JSON.parse(amenities);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }
  return [];
};


  useEffect(() => {
    const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
    const tid = userData?.tenantId || null;
    setTenantId(tid);
    loadData(tid);
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ✅ LOAD DATA FROM API
  const loadData = async (tid) => {
    setLoading(true);
    try {
      const tenantToUse = tid || tenantId;
      if (!tenantToUse) {
        console.warn('⚠️ No tenantId available');
        setLoading(false);
        return;
      }

      const response = await airlineService.getAll(tenantToUse);
      console.log('📊 Airlines response:', response);

      let airlinesData = [];
      if (response?.success && response?.data) {
        airlinesData = response.data;
      } else if (Array.isArray(response)) {
        airlinesData = response;
      }

      setAirlines(airlinesData);
      
      // Save to localStorage as fallback
      localStorage.setItem('travel_agency_airlines', JSON.stringify(airlinesData));
    } catch (error) {
      console.error('❌ Error loading airlines:', error);
      showNotification('Error loading airlines', 'error');
      // Fallback to localStorage
      loadFromLocalStorage();
    }
    setLoading(false);
  };

  // ✅ FALLBACK TO LOCALSTORAGE
  const loadFromLocalStorage = () => {
    try {
      const storedAirlines = JSON.parse(localStorage.getItem('travel_agency_airlines') || '[]');
      setAirlines(storedAirlines);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setAirlines([]);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      country: '',
      headquarters: '',
      founded: '',
      fleetSize: '',
      destinations: 0,
      website: '',
      phone: '',
      email: '',
      status: 'active',
      alliance: 'none',
      starRating: 3,
      baggageAllowance: '20kg',
      amenities: [],
      description: '',
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
      if (editingAirline) {
        setEditingAirline(prev => ({ ...prev, image: event.target.result }));
      } else {
        setFormData(prev => ({ ...prev, image: event.target.result }));
      }
      setImagePreview(event.target.result);
      showNotification('Image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (editingAirline) {
      setEditingAirline(prev => ({ ...prev, image: null }));
    } else {
      setFormData(prev => ({ ...prev, image: null }));
    }
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editingAirline) {
      setEditingAirline(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleAmenity = (amenityValue) => {
    if (editingAirline) {
      const amenities = editingAirline.amenities?.includes(amenityValue)
        ? editingAirline.amenities.filter(a => a !== amenityValue)
        : [...(editingAirline.amenities || []), amenityValue];
      setEditingAirline(prev => ({ ...prev, amenities }));
    } else {
      const amenities = formData.amenities?.includes(amenityValue)
        ? formData.amenities.filter(a => a !== amenityValue)
        : [...(formData.amenities || []), amenityValue];
      setFormData(prev => ({ ...prev, amenities }));
    }
  };

  // ✅ CREATE AIRLINE VIA API
  const handleCreateAirline = async () => {
    if (!formData.name || !formData.code || !formData.country) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      // ✅ Build the airline object with tenant
      const airlineData = {
        name: formData.name,
        code: formData.code.toUpperCase(),
        country: formData.country,
        headquarters: formData.headquarters || '',
        founded: formData.founded || '',
        fleetSize: parseInt(formData.fleetSize) || 0,
        destinations: parseInt(formData.destinations) || 0,
        website: formData.website || '',
        phone: formData.phone || '',
        email: formData.email || '',
        status: formData.status || 'active',
        alliance: formData.alliance || 'none',
        starRating: parseInt(formData.starRating) || 3,
        baggageAllowance: formData.baggageAllowance || '20kg',
        amenities: JSON.stringify(formData.amenities || []),
        description: formData.description || '',
        image: formData.image || null,
        notes: formData.notes || '',
        tenant: { id: tenantId }  // ✅ Send tenant as object with id
      };

      console.log('📤 Creating airline:', airlineData);
      const response = await airlineService.create(airlineData);
      console.log('📥 Create response:', response);

      if (response?.success) {
        showNotification(`✅ Airline "${formData.name}" created successfully!`);
        setShowCreateModal(false);
        resetForm();
        loadData(tenantId);
      } else {
        showNotification('Failed to create airline: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('❌ Error creating airline:', error);
      showNotification('Failed to create airline. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  // ✅ EDIT AIRLINE VIA API
  const handleEditAirline = async () => {
    if (!editingAirline) return;

    setIsSubmitting(true);

    try {
      const airlineData = {
        name: editingAirline.name,
        code: editingAirline.code.toUpperCase(),
        country: editingAirline.country,
        headquarters: editingAirline.headquarters || '',
        founded: editingAirline.founded || '',
        fleetSize: parseInt(editingAirline.fleetSize) || 0,
        destinations: parseInt(editingAirline.destinations) || 0,
        website: editingAirline.website || '',
        phone: editingAirline.phone || '',
        email: editingAirline.email || '',
        status: editingAirline.status || 'active',
        alliance: editingAirline.alliance || 'none',
        starRating: parseInt(editingAirline.starRating) || 3,
        baggageAllowance: editingAirline.baggageAllowance || '20kg',
        amenities: JSON.stringify(editingAirline.amenities || []),
        description: editingAirline.description || '',
        image: editingAirline.image || null,
        notes: editingAirline.notes || '',
        tenant: { id: tenantId }
      };

      console.log(`📤 Updating airline ${editingAirline.id}:`, airlineData);
      const response = await airlineService.update(editingAirline.id, airlineData);
      console.log('📥 Update response:', response);

      if (response?.success) {
        showNotification(`✅ Airline updated successfully!`);
        setShowEditModal(false);
        setEditingAirline(null);
        resetForm();
        loadData(tenantId);
      } else {
        showNotification('Failed to update airline: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('❌ Error updating airline:', error);
      showNotification('Failed to update airline. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  // ✅ DELETE AIRLINE VIA API
  const handleDeleteAirline = async () => {
    if (!selectedAirline) return;

    setIsSubmitting(true);

    try {
      console.log(`📤 Deleting airline ${selectedAirline.id}`);
      const response = await airlineService.delete(selectedAirline.id);
      console.log('📥 Delete response:', response);

      if (response?.success) {
        showNotification(`✅ Airline "${selectedAirline.name}" deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedAirline(null);
        loadData(tenantId);
      } else {
        showNotification('Failed to delete airline: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('❌ Error deleting airline:', error);
      showNotification('Failed to delete airline. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  const openEditModal = (airline) => {
    // ✅ Parse amenities if it's a string
    let amenities = airline.amenities;
    if (typeof amenities === 'string') {
      try {
        amenities = JSON.parse(amenities);
      } catch (e) {
        amenities = [];
      }
    }
    setEditingAirline({ ...airline, amenities: amenities || [] });
    setImagePreview(airline.image || null);
    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: '✅ Active', color: 'bg-green-100 text-green-800' },
      inactive: { label: '❌ Inactive', color: 'bg-gray-100 text-gray-800' },
      suspended: { label: '⛔ Suspended', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { label: status || 'Active', color: 'bg-gray-100 text-gray-800' };
  };

  const getAllianceLabel = (alliance) => {
    const labels = {
      none: 'Independent',
      star_alliance: '⭐ Star Alliance',
      sky_team: '✈️ SkyTeam',
      one_world: '🌍 OneWorld'
    };
    return labels[alliance] || alliance || 'Independent';
  };

  const getStarDisplay = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const filteredAirlines = airlines.filter(airline => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      airline.name?.toLowerCase().includes(searchLower) ||
      airline.code?.toLowerCase().includes(searchLower) ||
      airline.country?.toLowerCase().includes(searchLower) ||
      airline.headquarters?.toLowerCase().includes(searchLower);
    const matchesStatus = filterStatus === 'all' || airline.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Stats
  const totalAirlines = airlines.length;
  const activeAirlines = airlines.filter(a => a.status === 'active').length;

  const statsCards = [
    { title: 'Total Airlines', value: totalAirlines, icon: Plane, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active', value: activeAirlines, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Alliances', value: new Set(airlines.map(a => a.alliance).filter(a => a !== 'none')).size, icon: Award, color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  // ============================================
  // RENDER FUNCTIONS (Keep the same as before)
  // ============================================

  // Render Form Modal
  const renderFormModal = (isEdit = false) => {
    const isOpen = isEdit ? showEditModal : showCreateModal;
    const data = isEdit ? editingAirline : formData;
    const setData = isEdit ? setEditingAirline : setFormData;
    const handleSubmit = isEdit ? handleEditAirline : handleCreateAirline;
    const closeModal = () => {
      if (isEdit) {
        setShowEditModal(false);
        setEditingAirline(null);
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
              {isEdit ? 'Edit Airline' : 'Add New Airline'}
            </h2>
            <p className={`text-sm ${isEdit ? 'text-blue-100' : 'text-purple-100'}`}>
              {isEdit ? 'Update airline details' : 'Add a new airline to your inventory'}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* ... all the same form fields ... */}
              {/* I'm keeping the form fields the same as your original */}
              
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Airline Name *</label>
                <input
                  type="text"
                  name="name"
                  value={data.name || ''}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Kenya Airways"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Airline Code *</label>
                <input
                  type="text"
                  name="code"
                  value={data.code || ''}
                  onChange={(e) => setData({ ...data, code: e.target.value.toUpperCase() })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., KQ"
                  maxLength="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                <input
                  type="text"
                  name="country"
                  value={data.country || ''}
                  onChange={(e) => setData({ ...data, country: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Kenya"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Headquarters</label>
                <input
                  type="text"
                  name="headquarters"
                  value={data.headquarters || ''}
                  onChange={(e) => setData({ ...data, headquarters: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Nairobi, Kenya"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Founded Year</label>
                <input
                  type="text"
                  name="founded"
                  value={data.founded || ''}
                  onChange={(e) => setData({ ...data, founded: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 1977"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fleet Size</label>
                <input
                  type="number"
                  name="fleetSize"
                  value={data.fleetSize || ''}
                  onChange={(e) => setData({ ...data, fleetSize: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destinations</label>
                <input
                  type="number"
                  name="destinations"
                  value={data.destinations || ''}
                  onChange={(e) => setData({ ...data, destinations: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Star Rating</label>
                <select
                  name="starRating"
                  value={data.starRating || 3}
                  onChange={(e) => setData({ ...data, starRating: parseInt(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {starRatings.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alliance</label>
                <select
                  name="alliance"
                  value={data.alliance || 'none'}
                  onChange={(e) => setData({ ...data, alliance: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {alliances.map(a => (
                    <option key={a.value} value={a.value}>{a.label}</option>
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

              {/* Contact */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={data.website || ''}
                  onChange={(e) => setData({ ...data, website: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://www.airline.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={data.phone || ''}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="+254 700 000 000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={data.email || ''}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="info@airline.com"
                />
              </div>

              <div className="md:col-span-2">
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
                  {amenityOptions.map(amenity => {
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

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={data.description || ''}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  rows="3"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Describe the airline..."
                />
              </div>

              {/* Image */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Airline Logo</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                  >
                    <Camera size={16} /> Upload Logo
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
                    <img src={imagePreview} alt="Airline" className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
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
                {isSubmitting ? 'Saving...' : (isEdit ? 'Update Airline' : 'Add Airline')}
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
    if (!showDeleteModal || !selectedAirline) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowDeleteModal(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Airline?</h3>
            <p className="text-gray-500 text-sm">
              Are you sure you want to delete "{selectedAirline.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleDeleteAirline}
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
    if (!showDetailModal || !selectedAirline) return null;

    const statusBadge = getStatusBadge(selectedAirline.status);

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
            <h2 className="text-2xl font-bold text-white">{selectedAirline.name}</h2>
            <p className="text-blue-100 text-sm">Code: {selectedAirline.code}</p>
            <div className="mt-1 text-yellow-400 text-sm">{getStarDisplay(selectedAirline.starRating || 3)}</div>
          </div>

          <div className="p-6">
            {selectedAirline.image && (
              <div className="mb-4">
                <img src={selectedAirline.image} alt={selectedAirline.name} className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Globe size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{selectedAirline.country}</p>
                <p className="text-xs text-gray-500">Country</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Plane size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{selectedAirline.fleetSize || 0}</p>
                <p className="text-xs text-gray-500">Fleet</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <MapPin size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{selectedAirline.destinations || 0}</p>
                <p className="text-xs text-gray-500">Destinations</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className={`text-sm font-semibold ${statusBadge.color}`}>{statusBadge.label}</span>
                <p className="text-xs text-gray-500">Status</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {selectedAirline.alliance && selectedAirline.alliance !== 'none' && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  {getAllianceLabel(selectedAirline.alliance)}
                </span>
              )}
              {selectedAirline.founded && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  🏛️ Founded {selectedAirline.founded}
                </span>
              )}
              {selectedAirline.headquarters && (
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                  📍 {selectedAirline.headquarters}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {(selectedAirline.website || selectedAirline.phone || selectedAirline.email) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">📞 Contact</p>
                  {selectedAirline.website && (
                    <a href={selectedAirline.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline block">
                      {selectedAirline.website}
                    </a>
                  )}
                  {selectedAirline.phone && <p className="text-sm font-medium">{selectedAirline.phone}</p>}
                  {selectedAirline.email && <p className="text-sm text-gray-600">{selectedAirline.email}</p>}
                </div>
              )}
              {selectedAirline.baggageAllowance && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">🧳 Baggage</p>
                  <p className="text-sm font-medium">{selectedAirline.baggageAllowance}</p>
                </div>
              )}
            </div>

            {(() => {
  const amenitiesList = parseAmenities(selectedAirline.amenities);
  return amenitiesList.length > 0 && (
    <div className="mb-4">
      <h4 className="font-semibold text-gray-700 mb-2">Amenities</h4>
      <div className="flex flex-wrap gap-2">
        {amenitiesList.map((amenity) => {
          const found = amenityOptions.find(a => a.value === amenity);
          return (
            <span key={amenity} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
              {found?.label || amenity}
            </span>
          );
        })}
      </div>
    </div>
  );
})()}

            {selectedAirline.description && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{selectedAirline.description}</p>
              </div>
            )}

            {selectedAirline.notes && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Notes</h4>
                <p className="text-sm text-gray-600">{selectedAirline.notes}</p>
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
                openEditModal(selectedAirline);
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
            <Building size={28} className="text-blue-600" />
            Airlines
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage partner airlines</p>
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
            <Plus size={16} /> Add Airline
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {statsCards.map((stat, index) => (
          <div key={index} className={`${stat.bg} rounded-xl p-4 border border-gray-100`}>
            <div className="flex items-center justify-between">
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.title}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by airline name, code, or country..."
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
            <option value="inactive">❌ Inactive</option>
            <option value="suspended">⛔ Suspended</option>
          </select>
        </div>
      </div>

      {/* Airlines Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filteredAirlines.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Building size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No airlines found</p>
          <p className="text-sm text-gray-400">
            {searchQuery ? 'Try adjusting your search' : 'Add your first airline by clicking "Add Airline"'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus size={16} className="inline mr-1" /> Add Airline
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
  {filteredAirlines.map((airline) => {
    const statusBadge = getStatusBadge(airline.status);
    const firstImage = airline.image;

    return (
      <div key={airline.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
        {firstImage ? (
          <div className="h-56 overflow-hidden">
            <img src={firstImage} alt={airline.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
          </div>
        ) : (
          <div className="h-56 bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
            <Building size={56} className="text-blue-300" />
          </div>
        )}
        
        <div className="p-4">
          {/* Header: Name + Status */}
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-800 truncate">{airline.name}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-blue-600 font-semibold">{airline.code}</span>
                <span className="text-gray-300">|</span>
                <Globe size={12} />
                <span>{airline.country}</span>
              </div>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color} flex-shrink-0 ml-2`}>
              {statusBadge.label}
            </span>
          </div>

          {/* Fleet, Destinations, Rating in one row */}
          <div className="flex items-center gap-3 mt-1.5 text-xs">
            <span className="flex items-center gap-1 text-gray-500">
              <Plane size={12} className="text-blue-500" /> {airline.fleetSize || 0} fleet
            </span>
            <span className="flex items-center gap-1 text-gray-500">
              <MapPin size={12} className="text-blue-500" /> {airline.destinations || 0} destinations
            </span>
            <span className="flex items-center gap-1 text-yellow-400">
              <Star size={12} className="fill-yellow-400 text-yellow-400" /> {airline.starRating || 3}/5
            </span>
          </div>

          {/* Alliance + Founded + Headquarters - ALL in one row */}
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {airline.alliance && airline.alliance !== 'none' && (
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-600 rounded">
                {getAllianceLabel(airline.alliance)}
              </span>
            )}
            {airline.founded && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                🏛️ {airline.founded}
              </span>
            )}
            {airline.headquarters && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded truncate max-w-[120px]">
                📍 {airline.headquarters}
              </span>
            )}
            {airline.baggageAllowance && (
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                🧳 {airline.baggageAllowance}
              </span>
            )}
          </div>

          {/* Contact - Email/Phone/Website in one row */}
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {airline.email && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded truncate max-w-[120px]">
                📧 {airline.email}
              </span>
            )}
            {airline.phone && (
              <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-gray-600 rounded">
                📞 {airline.phone}
              </span>
            )}
            {airline.website && (
  <a 
    href={airline.website} 
    target="_blank" 
    rel="noopener noreferrer"
    className="text-[10px] px-1.5 py-0.5 bg-gray-50 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded truncate max-w-[120px] transition-colors flex items-center gap-0.5"
  >
    🌐 {airline.website.replace(/^https?:\/\//, '')}
  </a>
)}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
            <button
              onClick={() => {
                setSelectedAirline(airline);
                setShowDetailModal(true);
              }}
              className="flex-1 px-2 py-1.5 text-[10px] text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Eye size={13} /> View
            </button>
            <button
              onClick={() => openEditModal(airline)}
              className="flex-1 px-2 py-1.5 text-[10px] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              <Edit2 size={13} /> Edit
            </button>
            <button
              onClick={() => {
                setSelectedAirline(airline);
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

export default Airlines;