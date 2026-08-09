import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Filter, RefreshCw, Eye, Edit2, Trash2,
  X, Save, Upload, Image as ImageIcon, Calendar, Users,
  MapPin, Clock, DollarSign, Star, TrendingUp, AlertCircle,
  CheckCircle, Globe, Camera, Tag, Percent,
  Download, Share2, Printer, FileImage, Archive,
  Building, Phone, Mail, Wifi, Coffee, Car, Key,
  Bed, Bath, Tv, Utensils, Dumbbell, Waves,
  Sparkles, Shield, Award, Heart, Home, Hotel,
  BedDouble, BedSingle, Sofa
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hotelService } from '../../services/api';

const Hotels = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantId, setTenantId] = useState(null);

  // Image upload refs
  const imageInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    country: '',
    phone: '',
    email: '',
    website: '',
    description: '',
    amenities: [],
    images: [],
    rating: 0,
    starRating: 3,
    status: 'active',
    checkIn: '14:00',
    checkOut: '11:00',
    contactPerson: '',
    contactPhone: '',
    notes: '',
    agreementType: 'direct',
    agreementDate: '',
    agreementEndDate: '',
    commissionRate: 0,
    netRate: false,
    supplierName: '',
    supplierContact: '',
    paymentTerms: ''
  });

  const [editFormData, setEditFormData] = useState(null);

  // Amenities options
  const amenityOptions = [
    { value: 'wifi', label: 'Free WiFi', icon: Wifi },
    { value: 'breakfast', label: 'Breakfast Included', icon: Coffee },
    { value: 'parking', label: 'Free Parking', icon: Car },
    { value: 'pool', label: 'Swimming Pool', icon: Waves },
    { value: 'gym', label: 'Fitness Center', icon: Dumbbell },
    { value: 'restaurant', label: 'Restaurant', icon: Utensils },
    { value: 'room_service', label: 'Room Service', icon: Sofa },
    { value: 'airport_shuttle', label: 'Airport Shuttle', icon: Globe },
    { value: 'spa', label: 'Spa & Wellness', icon: Sparkles },
    { value: 'business_center', label: 'Business Center', icon: Building },
    { value: 'conference', label: 'Conference Rooms', icon: Users },
    { value: 'pet_friendly', label: 'Pet Friendly', icon: Heart },
    { value: 'family_rooms', label: 'Family Rooms', icon: Users },
    { value: '24h_front_desk', label: '24-Hour Front Desk', icon: Clock },
    { value: 'laundry', label: 'Laundry Service', icon: Tag },
    { value: 'bar', label: 'Bar/Lounge', icon: Coffee }
  ];

  const statuses = [
    { value: 'active', label: '✅ Active' },
    { value: 'inactive', label: '❌ Inactive' },
    { value: 'pending', label: '⏳ Pending Review' },
    { value: 'suspended', label: '⛔ Suspended' }
  ];

  const agreementTypes = [
    { value: 'direct', label: 'Direct Contract' },
    { value: 'wholesale', label: 'Wholesale/GDS' },
    { value: 'commission', label: 'Commission Based' },
    { value: 'net_rate', label: 'Net Rate' }
  ];

  const starRatings = [
    { value: 1, label: '⭐' },
    { value: 2, label: '⭐⭐' },
    { value: 3, label: '⭐⭐⭐' },
    { value: 4, label: '⭐⭐⭐⭐' },
    { value: 5, label: '⭐⭐⭐⭐⭐' }
  ];

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

      const response = await hotelService.getAll(tenantToUse);
      console.log('📊 Hotels response:', response);

      let hotelsData = [];
      if (response?.success && response?.data) {
        hotelsData = response.data;
      } else if (Array.isArray(response)) {
        hotelsData = response;
      }

      // ✅ Parse JSON fields
      const parsedHotels = hotelsData.map(hotel => ({
        ...hotel,
        amenities: hotel.amenities ? (typeof hotel.amenities === 'string' ? JSON.parse(hotel.amenities) : hotel.amenities) : [],
        images: hotel.images ? (typeof hotel.images === 'string' ? JSON.parse(hotel.images) : hotel.images) : []
      }));

      setHotels(parsedHotels);
      
      // Save to localStorage as fallback
      localStorage.setItem('travel_agency_hotels', JSON.stringify(parsedHotels));
    } catch (error) {
      console.error('❌ Error loading hotels:', error);
      showNotification('Error loading hotels', 'error');
      loadFromLocalStorage();
    }
    setLoading(false);
  };

  // ✅ FALLBACK TO LOCALSTORAGE
  const loadFromLocalStorage = () => {
    try {
      const storedHotels = JSON.parse(localStorage.getItem('travel_agency_hotels') || '[]');
      setHotels(storedHotels);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setHotels([]);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      city: '',
      country: '',
      phone: '',
      email: '',
      website: '',
      description: '',
      amenities: [],
      images: [],
      rating: 0,
      starRating: 3,
      status: 'active',
      checkIn: '14:00',
      checkOut: '11:00',
      contactPerson: '',
      contactPhone: '',
      notes: '',
      agreementType: 'direct',
      agreementDate: '',
      agreementEndDate: '',
      commissionRate: 0,
      netRate: false,
      supplierName: '',
      supplierContact: '',
      paymentTerms: ''
    });
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const isEditMode = !!editFormData;

    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        showNotification(`"${file.name}" is not an image`, 'error');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        showNotification(`"${file.name}" must be less than 5MB`, 'error');
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const readers = validFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event.target.result);
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(readers).then((results) => {
      if (isEditMode) {
        setEditFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), ...results]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), ...results]
        }));
      }
      showNotification(`${results.length} image(s) uploaded successfully!`);
    });
  };

  const removeImage = (index) => {
    if (editFormData) {
      const currentImages = editFormData.images || [];
      const newImages = currentImages.filter((_, i) => i !== index);
      setEditFormData(prev => ({
        ...prev,
        images: newImages
      }));
    } else {
      const currentImages = formData.images || [];
      const newImages = currentImages.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        images: newImages
      }));
    }
  };

  const toggleAmenity = (amenityValue) => {
    if (editFormData) {
      const amenities = editFormData.amenities?.includes(amenityValue)
        ? editFormData.amenities.filter(a => a !== amenityValue)
        : [...(editFormData.amenities || []), amenityValue];
      setEditFormData(prev => ({ ...prev, amenities }));
    } else {
      const amenities = formData.amenities?.includes(amenityValue)
        ? formData.amenities.filter(a => a !== amenityValue)
        : [...(formData.amenities || []), amenityValue];
      setFormData(prev => ({ ...prev, amenities }));
    }
  };

  // ✅ CREATE HOTEL VIA API
  const handleCreateHotel = async () => {
    if (!formData.name || !formData.address || !formData.city) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const hotelData = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        country: formData.country || '',
        phone: formData.phone || '',
        email: formData.email || '',
        website: formData.website || '',
        description: formData.description || '',
        starRating: parseInt(formData.starRating) || 3,
        status: formData.status || 'active',
        checkIn: formData.checkIn || '14:00',
        checkOut: formData.checkOut || '11:00',
        contactPerson: formData.contactPerson || '',
        contactPhone: formData.contactPhone || '',
        amenities: JSON.stringify(formData.amenities || []),
        images: JSON.stringify(formData.images || []),
        agreementType: formData.agreementType || 'direct',
        agreementDate: formData.agreementDate || null,
        agreementEndDate: formData.agreementEndDate || null,
        commissionRate: parseFloat(formData.commissionRate) || 0,
        supplierName: formData.supplierName || '',
        supplierContact: formData.supplierContact || '',
        paymentTerms: formData.paymentTerms || '',
        notes: formData.notes || '',
        tenant: { id: tenantId }
      };

      console.log('📤 Creating hotel:', hotelData);
      const response = await hotelService.create(hotelData);
      console.log('📥 Create response:', response);

      if (response?.success) {
        showNotification(`✅ Hotel "${formData.name}" created successfully!`);
        setShowCreateModal(false);
        resetForm();
        loadData(tenantId);
      } else {
        showNotification('Failed to create hotel: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('❌ Error creating hotel:', error);
      showNotification('Failed to create hotel. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  // ✅ EDIT HOTEL VIA API
  const handleEditHotel = async () => {
    if (!editFormData) return;

    setIsSubmitting(true);

    try {
      const hotelData = {
        name: editFormData.name,
        address: editFormData.address,
        city: editFormData.city,
        country: editFormData.country || '',
        phone: editFormData.phone || '',
        email: editFormData.email || '',
        website: editFormData.website || '',
        description: editFormData.description || '',
        starRating: parseInt(editFormData.starRating) || 3,
        status: editFormData.status || 'active',
        checkIn: editFormData.checkIn || '14:00',
        checkOut: editFormData.checkOut || '11:00',
        contactPerson: editFormData.contactPerson || '',
        contactPhone: editFormData.contactPhone || '',
        amenities: JSON.stringify(editFormData.amenities || []),
        images: JSON.stringify(editFormData.images || []),
        agreementType: editFormData.agreementType || 'direct',
        agreementDate: editFormData.agreementDate || null,
        agreementEndDate: editFormData.agreementEndDate || null,
        commissionRate: parseFloat(editFormData.commissionRate) || 0,
        supplierName: editFormData.supplierName || '',
        supplierContact: editFormData.supplierContact || '',
        paymentTerms: editFormData.paymentTerms || '',
        notes: editFormData.notes || '',
        tenant: { id: tenantId }
      };

      console.log(`📤 Updating hotel ${editFormData.id}:`, hotelData);
      const response = await hotelService.update(editFormData.id, hotelData);
      console.log('📥 Update response:', response);

      if (response?.success) {
        showNotification(`✅ Hotel updated successfully!`);
        setShowEditModal(false);
        setEditFormData(null);
        loadData(tenantId);
      } else {
        showNotification('Failed to update hotel: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('❌ Error updating hotel:', error);
      showNotification('Failed to update hotel. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  // ✅ DELETE HOTEL VIA API
  const handleDeleteHotel = async () => {
    if (!selectedHotel) return;

    setIsSubmitting(true);

    try {
      console.log(`📤 Deleting hotel ${selectedHotel.id}`);
      const response = await hotelService.delete(selectedHotel.id);
      console.log('📥 Delete response:', response);

      if (response?.success) {
        showNotification(`✅ Hotel "${selectedHotel.name}" deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedHotel(null);
        loadData(tenantId);
      } else {
        showNotification('Failed to delete hotel: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('❌ Error deleting hotel:', error);
      showNotification('Failed to delete hotel. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  const openEditModal = (hotel) => {
    // ✅ Parse amenities and images if they're strings
    let amenities = hotel.amenities;
    if (typeof amenities === 'string') {
      try {
        amenities = JSON.parse(amenities);
      } catch (e) {
        amenities = [];
      }
    }
    
    let images = hotel.images;
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch (e) {
        images = [];
      }
    }
    
    setEditFormData({ 
      ...hotel, 
      amenities: amenities || [], 
      images: images || [] 
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: '✅ Active', color: 'bg-green-100 text-green-800' },
      inactive: { label: '❌ Inactive', color: 'bg-gray-100 text-gray-800' },
      pending: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800' },
      suspended: { label: '⛔ Suspended', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || statusMap.inactive;
  };

  const getStarDisplay = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  // Render Form Modal (Create/Edit)
  const renderFormModal = (isEdit = false) => {
    const isOpen = isEdit ? showEditModal : showCreateModal;
    const data = isEdit ? editFormData : formData;
    const setData = isEdit ? setEditFormData : setFormData;
    const handleSubmit = isEdit ? handleEditHotel : handleCreateHotel;
    const closeModal = () => {
      if (isEdit) {
        setShowEditModal(false);
        setEditFormData(null);
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

          <div className={`px-6 py-5 rounded-t-2xl ${isEdit ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-green-600 to-green-700'}`}>
            <h2 className="text-2xl font-bold text-white">
              {isEdit ? 'Edit Hotel' : 'Add New Hotel'}
            </h2>
            <p className={`text-sm ${isEdit ? 'text-blue-100' : 'text-green-100'}`}>
              {isEdit ? 'Update hotel details' : 'Add a new hotel to your inventory'}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Info */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Name *</label>
                <input
                  type="text"
                  name="name"
                  value={data.name || ''}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Hilton Nairobi"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input
                  type="text"
                  name="address"
                  value={data.address || ''}
                  onChange={(e) => setData({ ...data, address: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Street address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={data.city || ''}
                  onChange={(e) => setData({ ...data, city: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Nairobi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={data.email || ''}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="hotel@example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  name="website"
                  value={data.website || ''}
                  onChange={(e) => setData({ ...data, website: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="https://www.hotel.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={data.description || ''}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  rows="3"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Describe the hotel..."
                />
              </div>

              {/* Star Rating & Status */}
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

              {/* Check-in/Check-out */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Time</label>
                <input
                  type="time"
                  name="checkIn"
                  value={data.checkIn || '14:00'}
                  onChange={(e) => setData({ ...data, checkIn: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Time</label>
                <input
                  type="time"
                  name="checkOut"
                  value={data.checkOut || '11:00'}
                  onChange={(e) => setData({ ...data, checkOut: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {/* Contact Person */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                <input
                  type="text"
                  name="contactPerson"
                  value={data.contactPerson || ''}
                  onChange={(e) => setData({ ...data, contactPerson: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contact person name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <input
                  type="tel"
                  name="contactPhone"
                  value={data.contactPhone || ''}
                  onChange={(e) => setData({ ...data, contactPhone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Contact phone number"
                />
              </div>

              {/* Agreement Details */}
              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Agreement Details</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Type</label>
                <select
                  name="agreementType"
                  value={data.agreementType || 'direct'}
                  onChange={(e) => setData({ ...data, agreementType: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {agreementTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Commission Rate (%)</label>
                <input
                  type="number"
                  name="commissionRate"
                  value={data.commissionRate || ''}
                  onChange={(e) => setData({ ...data, commissionRate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                  min="0"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agreement Date</label>
                <input
                  type="date"
                  name="agreementDate"
                  value={data.agreementDate || ''}
                  onChange={(e) => setData({ ...data, agreementDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agreement End Date</label>
                <input
                  type="date"
                  name="agreementEndDate"
                  value={data.agreementEndDate || ''}
                  onChange={(e) => setData({ ...data, agreementEndDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name</label>
                <input
                  type="text"
                  name="supplierName"
                  value={data.supplierName || ''}
                  onChange={(e) => setData({ ...data, supplierName: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Supplier name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Contact</label>
                <input
                  type="text"
                  name="supplierContact"
                  value={data.supplierContact || ''}
                  onChange={(e) => setData({ ...data, supplierContact: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Supplier contact details"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
                <textarea
                  name="paymentTerms"
                  value={data.paymentTerms || ''}
                  onChange={(e) => setData({ ...data, paymentTerms: e.target.value })}
                  rows="2"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Payment terms with supplier..."
                />
              </div>

              {/* Amenities */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {amenityOptions.map(amenity => {
                    const Icon = amenity.icon;
                    const isSelected = (data.amenities || []).includes(amenity.value);
                    return (
                      <button
                        key={amenity.value}
                        type="button"
                        onClick={() => {
                          const amenities = isSelected
                            ? (data.amenities || []).filter(a => a !== amenity.value)
                            : [...(data.amenities || []), amenity.value];
                          setData({ ...data, amenities });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 transition-colors ${
                          isSelected 
                            ? 'bg-blue-100 text-blue-700 border border-blue-300' 
                            : 'bg-gray-100 text-gray-600 border border-transparent hover:bg-gray-200'
                        }`}
                      >
                        <Icon size={14} />
                        {amenity.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Images */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Images</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                  >
                    <Camera size={16} /> Upload Images
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <span className="text-xs text-gray-400">JPG, PNG (Max 5MB each)</span>
                </div>
                
                {(data.images && data.images.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {data.images.map((img, index) => (
                      <div key={index} className="relative">
                        <img src={img} alt={`Hotel ${index + 1}`} className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => {
                            if (isEdit) {
                              const newImages = data.images.filter((_, i) => i !== index);
                              setEditFormData({ ...data, images: newImages });
                            } else {
                              const newImages = data.images.filter((_, i) => i !== index);
                              setFormData({ ...data, images: newImages });
                            }
                          }}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-sm"
                          style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
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
                {isSubmitting ? 'Saving...' : (isEdit ? 'Update Hotel' : 'Add Hotel')}
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
    if (!showDeleteModal || !selectedHotel) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowDeleteModal(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Hotel?</h3>
            <p className="text-gray-500 text-sm">
              Are you sure you want to delete "{selectedHotel.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleDeleteHotel}
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
    if (!showDetailModal || !selectedHotel) return null;

    const statusBadge = getStatusBadge(selectedHotel.status);

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
            <h2 className="text-2xl font-bold text-white">{selectedHotel.name}</h2>
            <p className="text-blue-100 text-sm">{selectedHotel.address}, {selectedHotel.city}</p>
            <div className="mt-1 text-yellow-400 text-sm">{getStarDisplay(selectedHotel.starRating || 3)}</div>
          </div>

          <div className="p-6">
            {(selectedHotel.images && selectedHotel.images.length > 0) && (
              <div className="mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedHotel.images.slice(0, 4).map((img, index) => (
                    <img key={index} src={img} alt={`${selectedHotel.name} ${index + 1}`} className="h-32 w-auto object-cover rounded-lg border border-gray-200" />
                  ))}
                  {selectedHotel.images.length > 4 && (
                    <div className="h-32 w-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                      +{selectedHotel.images.length - 4} more
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <MapPin size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{selectedHotel.city}</p>
                <p className="text-xs text-gray-500">Location</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Star size={16} className="mx-auto text-yellow-400 mb-1" />
                <p className="text-sm font-semibold">{selectedHotel.starRating || 3} Stars</p>
                <p className="text-xs text-gray-500">Rating</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Clock size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{selectedHotel.checkIn || '14:00'} - {selectedHotel.checkOut || '11:00'}</p>
                <p className="text-xs text-gray-500">Check-in/Out</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className={`text-sm font-semibold ${statusBadge.color}`}>{statusBadge.label}</span>
                <p className="text-xs text-gray-500">Status</p>
              </div>
            </div>

            {(selectedHotel.amenities && selectedHotel.amenities.length > 0) && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedHotel.amenities.map((amenity) => {
                    const found = amenityOptions.find(a => a.value === amenity);
                    const Icon = found?.icon || Tag;
                    return (
                      <span key={amenity} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs flex items-center gap-1">
                        <Icon size={12} /> {found?.label || amenity}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              {(selectedHotel.phone || selectedHotel.email) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">📞 Contact</p>
                  <p className="text-sm font-medium">{selectedHotel.phone || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{selectedHotel.email || ''}</p>
                  {selectedHotel.website && (
                    <a href={selectedHotel.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                      Visit Website
                    </a>
                  )}
                </div>
              )}
              {(selectedHotel.contactPerson || selectedHotel.contactPhone) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">👤 Contact Person</p>
                  <p className="text-sm font-medium">{selectedHotel.contactPerson || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{selectedHotel.contactPhone || ''}</p>
                </div>
              )}
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Agreement Details</h4>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                <div><span className="text-xs text-gray-500">Type:</span> <span className="text-sm font-medium">{selectedHotel.agreementType}</span></div>
                <div><span className="text-xs text-gray-500">Commission:</span> <span className="text-sm font-medium">{selectedHotel.commissionRate || 0}%</span></div>
                <div><span className="text-xs text-gray-500">Agreement Date:</span> <span className="text-sm font-medium">{selectedHotel.agreementDate || 'N/A'}</span></div>
                <div><span className="text-xs text-gray-500">End Date:</span> <span className="text-sm font-medium">{selectedHotel.agreementEndDate || 'N/A'}</span></div>
                {selectedHotel.supplierName && (
                  <div className="col-span-2"><span className="text-xs text-gray-500">Supplier:</span> <span className="text-sm font-medium">{selectedHotel.supplierName}</span></div>
                )}
                {selectedHotel.paymentTerms && (
                  <div className="col-span-2"><span className="text-xs text-gray-500">Payment Terms:</span> <span className="text-sm font-medium">{selectedHotel.paymentTerms}</span></div>
                )}
              </div>
            </div>

            {selectedHotel.description && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{selectedHotel.description}</p>
              </div>
            )}

            {selectedHotel.notes && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Notes</h4>
                <p className="text-sm text-gray-600">{selectedHotel.notes}</p>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2 flex-wrap">
            <button 
              onClick={() => {
                setShowDetailModal(false);
                setActiveTab('room-types');
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-2"
            >
              <Bed size={16} /> Manage Rooms
            </button>
            <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
              Close
            </button>
            <button 
              onClick={() => {
                setShowDetailModal(false);
                openEditModal(selectedHotel);
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

  const filteredHotels = hotels.filter(hotel => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      hotel.name?.toLowerCase().includes(searchLower) ||
      hotel.address?.toLowerCase().includes(searchLower) ||
      hotel.city?.toLowerCase().includes(searchLower) ||
      hotel.country?.toLowerCase().includes(searchLower);
    const matchesFilter = filterStatus === 'all' || hotel.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Stats
  const totalHotels = hotels.length;
  const activeHotels = hotels.filter(h => h.status === 'active').length;

  const statsCards = [
    { title: 'Total Hotels', value: totalHotels, icon: Hotel, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active', value: activeHotels, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Inactive', value: hotels.filter(h => h.status === 'inactive' || h.status === 'suspended').length, icon: X, color: 'text-gray-600', bg: 'bg-gray-50' }
  ];

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
            <Hotel size={28} className="text-blue-600" />
            Hotels
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage hotel partners and accommodations</p>
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
            <Plus size={16} /> Add Hotel
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
            placeholder="Search by name, city, or address..."
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
            <option value="pending">⏳ Pending</option>
            <option value="suspended">⛔ Suspended</option>
          </select>
        </div>
      </div>

      {/* Hotels Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading hotels...</div>
      ) : filteredHotels.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Hotel size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hotels found</p>
          <p className="text-sm text-gray-400">
            {searchQuery ? 'Try adjusting your search' : 'Add your first hotel by clicking "Add Hotel"'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus size={16} className="inline mr-1" /> Add Hotel
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
          {filteredHotels.map((hotel) => {
            const statusBadge = getStatusBadge(hotel.status);
            const firstImage = hotel.images && hotel.images.length > 0 ? hotel.images[0] : null;

            return (
              <div key={hotel.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                {firstImage ? (
  <div className="h-56 overflow-hidden">
    <img src={firstImage} alt={hotel.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
  </div>
) : (
                  <div className="h-48 sm:h-56 bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                    <Hotel size={56} className="text-blue-300" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{hotel.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={12} />
                        <span>{hotel.city}, {hotel.country || ''}</span>
                      </div>
                      <div className="text-yellow-400 text-xs mt-0.5">{getStarDisplay(hotel.starRating || 3)}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color} flex-shrink-0 ml-2`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-xs">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock size={12} className="text-blue-500" /> {hotel.checkIn || '14:00'} - {hotel.checkOut || '11:00'}
                    </span>
                    {hotel.agreementType && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        {hotel.agreementType === 'direct' ? '📄 Direct' : '🤝 ' + hotel.agreementType}
                      </span>
                    )}
                  </div>

                  {/* Amenities preview */}
                  {hotel.amenities && hotel.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {hotel.amenities.slice(0, 4).map((amenity) => {
                        const found = amenityOptions.find(a => a.value === amenity);
                        const Icon = found?.icon || Tag;
                        return (
                          <span key={amenity} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full flex items-center gap-0.5">
                            <Icon size={10} />
                          </span>
                        );
                      })}
                      {hotel.amenities.length > 4 && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                          +{hotel.amenities.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setSelectedHotel(hotel);
                        setShowDetailModal(true);
                      }}
                      className="flex-1 px-2 py-1.5 text-[10px] text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye size={13} /> View
                    </button>
                    <button
                      onClick={() => {
                        setSelectedHotel(hotel);
                        setActiveTab('room-types');
                      }}
                      className="flex-1 px-2 py-1.5 text-[10px] text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Bed size={13} /> Rooms
                    </button>
                    <button
                      onClick={() => openEditModal(hotel)}
                      className="flex-1 px-2 py-1.5 text-[10px] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 size={13} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedHotel(hotel);
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

export default Hotels;