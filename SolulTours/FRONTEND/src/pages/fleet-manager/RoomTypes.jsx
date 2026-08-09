import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Filter, RefreshCw, Eye, Edit2, Trash2,
  X, Save, Calendar, Users, 
  MapPin, Clock, DollarSign, AlertCircle,
  CheckCircle, Camera, Tag, Download,
  Printer, FileText, Upload, Image,
  User, Phone, Mail, MapPinned,
  Bed, BedDouble, BedSingle, Sofa,
  Users as UsersIcon, Wifi, Coffee, Car,
  Hotel, Building, Home, Key,
  TrendingUp, TrendingDown, Star,
  ArrowRight, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { roomTypeService, hotelService } from '../../services/api';

const RoomTypes = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHotel, setFilterHotel] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [tenantId, setTenantId] = useState(null);

  // Image upload refs
  const imageInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    hotelId: '',
    name: '',
    type: 'standard',
    description: '',
    price: '',
    capacity: 2,
    beds: 1,
    bedType: 'double',
    size: '',
    amenities: [],
    status: 'active',
    quantity: 1,
    images: [],
    notes: ''
  });

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

      // Load hotels
      const hotelsResponse = await hotelService.getAll(tenantToUse);
      console.log('📊 Hotels response:', hotelsResponse);
      
      let hotelsData = [];
      if (hotelsResponse?.success && hotelsResponse?.data) {
        hotelsData = hotelsResponse.data;
      } else if (Array.isArray(hotelsResponse)) {
        hotelsData = hotelsResponse;
      }
      
      // Parse hotel images and amenities
      const parsedHotels = hotelsData.map(hotel => ({
        ...hotel,
        amenities: hotel.amenities ? (typeof hotel.amenities === 'string' ? JSON.parse(hotel.amenities) : hotel.amenities) : [],
        images: hotel.images ? (typeof hotel.images === 'string' ? JSON.parse(hotel.images) : hotel.images) : []
      }));
      setHotels(parsedHotels);

      // Load room types
      const roomsResponse = await roomTypeService.getAll(tenantToUse);
      console.log('📊 Rooms response:', roomsResponse);

      let roomsData = [];
      if (roomsResponse?.success && roomsResponse?.data) {
        roomsData = roomsResponse.data;
      } else if (Array.isArray(roomsResponse)) {
        roomsData = roomsResponse;
      }

      // Parse room data
      const parsedRooms = roomsData.map(room => ({
        ...room,
        amenities: room.amenities ? (typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities) : [],
        images: room.images ? (typeof room.images === 'string' ? JSON.parse(room.images) : room.images) : [],
        hotelName: getHotelName(room.hotelId, parsedHotels),
        hotelCity: getHotelCity(room.hotelId, parsedHotels)
      }));

      setRooms(parsedRooms);
      
      // Save to localStorage as fallback
      localStorage.setItem('travel_agency_room_types', JSON.stringify(parsedRooms));
      localStorage.setItem('travel_agency_hotels', JSON.stringify(parsedHotels));
    } catch (error) {
      console.error('❌ Error loading data:', error);
      showNotification('Error loading room types', 'error');
      loadFromLocalStorage();
    }
    setLoading(false);
  };

  // ✅ FALLBACK TO LOCALSTORAGE
  const loadFromLocalStorage = () => {
    try {
      const storedRooms = JSON.parse(localStorage.getItem('travel_agency_room_types') || '[]');
      setRooms(storedRooms);
      const storedHotels = JSON.parse(localStorage.getItem('travel_agency_hotels') || '[]');
      setHotels(storedHotels);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setRooms([]);
      setHotels([]);
    }
  };

  const getHotelName = (hotelId, hotelsList = null) => {
    const hotelList = hotelsList || hotels;
    const hotel = hotelList.find(h => h.id === hotelId);
    return hotel?.name || 'Unknown Hotel';
  };

  const getHotelCity = (hotelId, hotelsList = null) => {
    const hotelList = hotelsList || hotels;
    const hotel = hotelList.find(h => h.id === hotelId);
    return hotel?.city || '';
  };

  const resetForm = () => {
    setFormData({
      hotelId: '',
      name: '',
      type: 'standard',
      description: '',
      price: '',
      capacity: 2,
      beds: 1,
      bedType: 'double',
      size: '',
      amenities: [],
      status: 'active',
      quantity: 1,
      images: [],
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
      if (editingRoom) {
        setEditingRoom(prev => ({
          ...prev,
          images: [...(prev.images || []), event.target.result]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          images: [...(prev.images || []), event.target.result]
        }));
      }
      setImagePreview(event.target.result);
      showNotification('Image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index) => {
    if (editingRoom) {
      const images = editingRoom.images.filter((_, i) => i !== index);
      setEditingRoom(prev => ({ ...prev, images }));
    } else {
      const images = formData.images.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, images }));
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      standard: '🛏️ Standard',
      deluxe: '⭐ Deluxe',
      suite: '🛋️ Suite',
      family: '👨‍👩‍👧‍👦 Family',
      executive: '💼 Executive',
      presidential: '👑 Presidential',
      twin: '🛌 Twin',
      double: '🛏️ Double',
      single: '🛏️ Single',
      dormitory: '🏠 Dormitory'
    };
    return labels[type] || type || 'Standard';
  };

  const getBedTypeLabel = (type) => {
    const labels = {
      single: 'Single',
      double: 'Double',
      queen: 'Queen',
      king: 'King',
      twin: 'Twin',
      bunk: 'Bunk',
      sofa: 'Sofa Bed'
    };
    return labels[type] || type || 'Double';
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: '✅ Active', color: 'bg-green-100 text-green-800' },
      inactive: { label: '❌ Inactive', color: 'bg-gray-100 text-gray-800' },
      maintenance: { label: '🔧 Maintenance', color: 'bg-yellow-100 text-yellow-800' },
      booked: { label: '📅 Booked', color: 'bg-blue-100 text-blue-800' }
    };
    return statusMap[status] || { label: status || 'Active', color: 'bg-gray-100 text-gray-800' };
  };

  const roomTypes = [
    { value: 'standard', label: '🛏️ Standard' },
    { value: 'deluxe', label: '⭐ Deluxe' },
    { value: 'suite', label: '🛋️ Suite' },
    { value: 'family', label: '👨‍👩‍👧‍👦 Family' },
    { value: 'executive', label: '💼 Executive' },
    { value: 'presidential', label: '👑 Presidential' },
    { value: 'twin', label: '🛌 Twin' },
    { value: 'double', label: '🛏️ Double' },
    { value: 'single', label: '🛏️ Single' },
    { value: 'dormitory', label: '🏠 Dormitory' }
  ];

  const bedTypes = [
    { value: 'single', label: 'Single' },
    { value: 'double', label: 'Double' },
    { value: 'queen', label: 'Queen' },
    { value: 'king', label: 'King' },
    { value: 'twin', label: 'Twin' },
    { value: 'bunk', label: 'Bunk' },
    { value: 'sofa', label: 'Sofa Bed' }
  ];

  const statuses = [
    { value: 'active', label: '✅ Active' },
    { value: 'inactive', label: '❌ Inactive' },
    { value: 'maintenance', label: '🔧 Maintenance' },
    { value: 'booked', label: '📅 Booked' }
  ];

  const roomAmenities = [
    { value: 'wifi', label: 'Free WiFi' },
    { value: 'tv', label: 'Flat-screen TV' },
    { value: 'ac', label: 'Air Conditioning' },
    { value: 'mini_bar', label: 'Mini Bar' },
    { value: 'safe', label: 'Safe' },
    { value: 'bathtub', label: 'Bathtub' },
    { value: 'shower', label: 'Shower' },
    { value: 'balcony', label: 'Balcony' },
    { value: 'view', label: 'City View' },
    { value: 'kitchen', label: 'Kitchenette' },
    { value: 'smoking', label: 'Smoking Allowed' },
    { value: 'pet', label: 'Pet Friendly' }
  ];

  // ✅ CREATE ROOM TYPE VIA API
  const handleCreateRoom = async () => {
    if (!formData.hotelId || !formData.name || !formData.price) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const roomData = {
        hotel: { id: formData.hotelId },
        name: formData.name,
        type: formData.type || 'standard',
        description: formData.description || '',
        price: parseFloat(formData.price) || 0,
        capacity: parseInt(formData.capacity) || 2,
        beds: parseInt(formData.beds) || 1,
        bedType: formData.bedType || 'double',
        size: formData.size || '',
        quantity: parseInt(formData.quantity) || 1,
        status: formData.status || 'active',
        amenities: JSON.stringify(formData.amenities || []),
        images: JSON.stringify(formData.images || []),
        notes: formData.notes || '',
        tenantId: tenantId
      };

      console.log('📤 Creating room type:', roomData);
      const response = await roomTypeService.create(roomData);
      console.log('📥 Create response:', response);

      if (response?.success) {
        showNotification(`✅ Room type "${formData.name}" created successfully!`);
        setShowCreateModal(false);
        resetForm();
        loadData(tenantId);
      } else {
        showNotification('Failed to create room type: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('❌ Error creating room type:', error);
      showNotification('Failed to create room type. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  // ✅ EDIT ROOM TYPE VIA API
  const handleEditRoom = async () => {
    if (!editingRoom) return;

    setIsSubmitting(true);

    try {
      const roomData = {
        hotel: { id: editingRoom.hotelId },
        name: editingRoom.name,
        type: editingRoom.type || 'standard',
        description: editingRoom.description || '',
        price: parseFloat(editingRoom.price) || 0,
        capacity: parseInt(editingRoom.capacity) || 2,
        beds: parseInt(editingRoom.beds) || 1,
        bedType: editingRoom.bedType || 'double',
        size: editingRoom.size || '',
        quantity: parseInt(editingRoom.quantity) || 1,
        status: editingRoom.status || 'active',
        amenities: JSON.stringify(editingRoom.amenities || []),
        images: JSON.stringify(editingRoom.images || []),
        notes: editingRoom.notes || '',
        tenantId: tenantId
      };

      console.log(`📤 Updating room type ${editingRoom.id}:`, roomData);
      const response = await roomTypeService.update(editingRoom.id, roomData);
      console.log('📥 Update response:', response);

      if (response?.success) {
        showNotification(`✅ Room type updated successfully!`);
        setShowEditModal(false);
        setEditingRoom(null);
        loadData(tenantId);
      } else {
        showNotification('Failed to update room type: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('❌ Error updating room type:', error);
      showNotification('Failed to update room type. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  // ✅ DELETE ROOM TYPE VIA API
  const handleDeleteRoom = async () => {
    if (!selectedRoom) return;

    setIsSubmitting(true);

    try {
      console.log(`📤 Deleting room type ${selectedRoom.id}`);
      const response = await roomTypeService.delete(selectedRoom.id);
      console.log('📥 Delete response:', response);

      if (response?.success) {
        showNotification(`✅ Room type deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedRoom(null);
        loadData(tenantId);
      } else {
        showNotification('Failed to delete room type: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('❌ Error deleting room type:', error);
      showNotification('Failed to delete room type. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  const openEditModal = (room) => {
    // Parse amenities and images if they're strings
    let amenities = room.amenities;
    if (typeof amenities === 'string') {
      try {
        amenities = JSON.parse(amenities);
      } catch (e) {
        amenities = [];
      }
    }
    
    let images = room.images;
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch (e) {
        images = [];
      }
    }
    
    setEditingRoom({ 
      ...room, 
      amenities: amenities || [], 
      images: images || [] 
    });
    setShowEditModal(true);
  };

  const filteredRooms = rooms.filter(room => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      room.name?.toLowerCase().includes(searchLower) ||
      room.type?.toLowerCase().includes(searchLower) ||
      room.hotelName?.toLowerCase().includes(searchLower);
    const matchesHotel = filterHotel === 'all' || room.hotelId === filterHotel;
    const matchesStatus = filterStatus === 'all' || room.status === filterStatus;
    return matchesSearch && matchesHotel && matchesStatus;
  });

  // Stats
  const totalRooms = rooms.length;
  const activeRooms = rooms.filter(r => r.status === 'active').length;
  const totalHotels = hotels.length;

  const statsCards = [
    { title: 'Total Room Types', value: totalRooms, icon: Bed, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active', value: activeRooms, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Hotels', value: totalHotels, icon: Hotel, color: 'text-purple-600', bg: 'bg-purple-50' }
  ];

  // ============================================
  // RENDER FUNCTIONS (Keep the same structure)
  // ============================================

  // Render Form Modal (Create/Edit)
  const renderFormModal = (isEdit = false) => {
    const isOpen = isEdit ? showEditModal : showCreateModal;
    const data = isEdit ? editingRoom : formData;
    const setData = isEdit ? setEditingRoom : setFormData;
    const handleSubmit = isEdit ? handleEditRoom : handleCreateRoom;
    const closeModal = () => {
      if (isEdit) {
        setShowEditModal(false);
        setEditingRoom(null);
        resetForm();
      } else {
        setShowCreateModal(false);
        resetForm();
      }
    };

    if (!isOpen) return null;

    // ... (keep your existing renderFormModal code, it stays the same)
    // The form fields remain unchanged, just the submit handler changes
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={closeModal}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <button 
            onClick={closeModal}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>

          <div className={`px-6 py-5 rounded-t-2xl ${isEdit ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-green-600 to-green-700'}`}>
            <h2 className="text-2xl font-bold text-white">
              {isEdit ? 'Edit Room Type' : 'Add Room Type'}
            </h2>
            <p className={`text-sm ${isEdit ? 'text-blue-100' : 'text-green-100'}`}>
              {isEdit ? 'Update room details' : 'Add a new room type to a hotel'}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel *</label>
                <select
                  name="hotelId"
                  value={data.hotelId || ''}
                  onChange={(e) => setData({ ...data, hotelId: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Select a hotel...</option>
                  {hotels.filter(h => h.status === 'active').map(hotel => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.name} - {hotel.city} ({hotel.starRating || 3}⭐)
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Name *</label>
                <input
                  type="text"
                  name="name"
                  value={data.name || ''}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Deluxe King Room"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type</label>
                <select
                  name="type"
                  value={data.type || 'standard'}
                  onChange={(e) => setData({ ...data, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {roomTypes.map(type => (
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES) *</label>
                <input
                  type="number"
                  name="price"
                  value={data.price || ''}
                  onChange={(e) => setData({ ...data, price: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Available</label>
                <input
                  type="number"
                  name="quantity"
                  value={data.quantity || 1}
                  onChange={(e) => setData({ ...data, quantity: parseInt(e.target.value) || 1 })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  min="1"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (People)</label>
                <input
                  type="number"
                  name="capacity"
                  value={data.capacity || 2}
                  onChange={(e) => setData({ ...data, capacity: parseInt(e.target.value) || 2 })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  min="1"
                  max="20"
                  placeholder="2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Beds</label>
                <input
                  type="number"
                  name="beds"
                  value={data.beds || 1}
                  onChange={(e) => setData({ ...data, beds: parseInt(e.target.value) || 1 })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  min="1"
                  max="10"
                  placeholder="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bed Type</label>
                <select
                  name="bedType"
                  value={data.bedType || 'double'}
                  onChange={(e) => setData({ ...data, bedType: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {bedTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Size (sqm)</label>
                <input
                  type="text"
                  name="size"
                  value={data.size || ''}
                  onChange={(e) => setData({ ...data, size: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 30 sqm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={data.description || ''}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  rows="2"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Describe the room..."
                />
              </div>

              {/* Amenities */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Room Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {roomAmenities.map(amenity => {
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
                        {amenity.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Image</label>
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
                {(data.images && data.images.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {data.images.map((img, index) => (
                      <div key={index} className="relative">
                        <img src={img} alt="Room" className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => {
                            const images = data.images.filter((_, i) => i !== index);
                            setData({ ...data, images });
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
                {isSubmitting ? 'Saving...' : (isEdit ? 'Update Room' : 'Add Room')}
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
    if (!showDeleteModal || !selectedRoom) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowDeleteModal(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Room Type?</h3>
            <p className="text-gray-500 text-sm">
              Are you sure you want to delete "{selectedRoom.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleDeleteRoom}
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
    if (!showDetailModal || !selectedRoom) return null;

    const statusBadge = getStatusBadge(selectedRoom.status);
    const firstImage = selectedRoom.images && selectedRoom.images.length > 0 ? selectedRoom.images[0] : null;

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

          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-white">{selectedRoom.name}</h2>
            <p className="text-purple-100 text-sm">{selectedRoom.hotelName} • {selectedRoom.hotelCity}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
              {getTypeLabel(selectedRoom.type)}
            </span>
          </div>

          <div className="p-6">
            {firstImage && (
              <div className="mb-4">
                <img src={firstImage} alt={selectedRoom.name} className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <DollarSign size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">KSh {selectedRoom.price?.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Price</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <UsersIcon size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{selectedRoom.capacity || 2}</p>
                <p className="text-xs text-gray-500">Capacity</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Bed size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{selectedRoom.beds || 1} {getBedTypeLabel(selectedRoom.bedType)}</p>
                <p className="text-xs text-gray-500">Beds</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className={`text-sm font-semibold ${statusBadge.color}`}>{statusBadge.label}</span>
                <p className="text-xs text-gray-500">Status</p>
              </div>
            </div>

            {(selectedRoom.amenities && selectedRoom.amenities.length > 0) && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRoom.amenities.map((amenity) => {
                    const found = roomAmenities.find(a => a.value === amenity);
                    return (
                      <span key={amenity} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                        {found?.label || amenity}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedRoom.description && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{selectedRoom.description}</p>
              </div>
            )}

            {selectedRoom.notes && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Notes</h4>
                <p className="text-sm text-gray-600">{selectedRoom.notes}</p>
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
                openEditModal(selectedRoom);
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
            <Bed size={28} className="text-purple-600" />
            Room Types
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage room types for all hotels</p>
          <p className="text-xs text-gray-400 mt-0.5">{hotels.length} hotels available</p>
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
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Add Room Type
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
            placeholder="Search by room name, type, or hotel..."
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
            value={filterHotel}
            onChange={(e) => setFilterHotel(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="all">All Hotels</option>
            {hotels.map(hotel => (
              <option key={hotel.id} value={hotel.id}>{hotel.name}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">✅ Active</option>
            <option value="inactive">❌ Inactive</option>
            <option value="maintenance">🔧 Maintenance</option>
            <option value="booked">📅 Booked</option>
          </select>
        </div>
      </div>

      {/* Room Types Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filteredRooms.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Bed size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No room types found</p>
          <p className="text-sm text-gray-400">
            {searchQuery || filterHotel !== 'all' || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Add your first room type by clicking "Add Room Type"'}
          </p>
          {hotels.length === 0 && (
            <p className="text-sm text-yellow-600 mt-1">⚠️ Please add hotels first before adding room types</p>
          )}
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            <Plus size={16} className="inline mr-1" /> Add Room Type
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRooms.map((room) => {
            const statusBadge = getStatusBadge(room.status);
            const firstImage = room.images && room.images.length > 0 ? room.images[0] : null;

            return (
              <div key={room.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                {firstImage ? (
                  <div className="h-40 overflow-hidden">
                    <img src={firstImage} alt={room.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                  </div>
                ) : (
                  <div className="h-40 bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center">
                    <Bed size={48} className="text-purple-300" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800 truncate">{room.name}</h3>
                      <p className="text-xs text-gray-500 truncate">{room.hotelName}</p>
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full mt-1 inline-block">
                        {getTypeLabel(room.type)}
                      </span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-sm">
                    <span className="flex items-center gap-1 text-green-600 font-semibold">
                      <DollarSign size={14} /> KSh {room.price?.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <UsersIcon size={14} /> {room.capacity || 2}
                    </span>
                    <span className="flex items-center gap-1 text-gray-500">
                      <Bed size={14} /> {room.beds || 1}
                    </span>
                  </div>

                  {/* Amenities preview */}
                  {room.amenities && room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {room.amenities.slice(0, 3).map((amenity) => {
                        const found = roomAmenities.find(a => a.value === amenity);
                        return (
                          <span key={amenity} className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                            {found?.label || amenity}
                          </span>
                        );
                      })}
                      {room.amenities.length > 3 && (
                        <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                          +{room.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedRoom(room);
                        setShowDetailModal(true);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye size={14} /> View
                    </button>
                    <button
                      onClick={() => openEditModal(room)}
                      className="flex-1 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 size={14} /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRoom(room);
                        setShowDeleteModal(true);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 size={14} />
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

export default RoomTypes;