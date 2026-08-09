import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Filter, RefreshCw, Eye, Edit2, Trash2,
  X, Save, Upload, Image as ImageIcon, Calendar, Users,
  MapPin, Clock, DollarSign, Star, TrendingUp, AlertCircle,
  CheckCircle, Globe, Compass, Camera, Tag, Percent,
  Phone, Mail, Award, Languages, Clock as ClockIcon,
  Star as StarIcon, BookOpen, Briefcase, MessageCircle,
  User, Shield, Flag, Heart, Coffee, Sun
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tourGuideService } from '../../services/api';

const TourGuides = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [guides, setGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLanguage, setFilterLanguage] = useState('all');
  const [selectedGuide, setSelectedGuide] = useState(null);
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
    email: '',
    phone: '',
    bio: '',
    specialties: [],
    languages: [],
    experience: '',
    rating: 0,
    reviews: 0,
    image: null,
    status: 'active',
    certifications: [],
    availability: 'available',
    pricePerDay: '',
    country: '',
    city: ''
  });

  const [editFormData, setEditFormData] = useState(null);

  // Sample languages
  const languageOptions = [
    'English', 'Swahili', 'French', 'German', 'Spanish', 
    'Italian', 'Chinese', 'Arabic', 'Portuguese', 'Dutch',
    'Russian', 'Japanese', 'Korean', 'Hindi', 'Mandarin'
  ];

  // Sample specialties
  const specialtyOptions = [
    'Wildlife Safari', 'Bird Watching', 'Cultural Tours', 
    'Hiking & Trekking', 'Photography Tours', 'City Tours',
    'Beach Holidays', 'Historical Tours', 'Adventure Tours',
    'Luxury Travel', 'Eco-Tourism', 'Culinary Tours',
    'Water Sports', 'Camping & Bush', 'Night Safaris'
  ];

  // Sample certifications
  const certificationOptions = [
    'KPSGA Certified', 'KATO Certified', 'First Aid Certified',
    'Wildlife Conservation', 'Bird Guide Certified', 'Safety Certified',
    'Wilderness First Responder', 'CPR Certified', 'Driving License',
    'Tourism Management Diploma', 'Languages Certified'
  ];

  const statuses = [
    { value: 'active', label: '✅ Active' },
    { value: 'inactive', label: '⏸️ Inactive' },
    { value: 'on_leave', label: '🏖️ On Leave' }
  ];

  const availabilityOptions = [
    { value: 'available', label: '🟢 Available' },
    { value: 'busy', label: '🟡 Busy' },
    { value: 'unavailable', label: '🔴 Unavailable' }
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
      console.log('🔍 Loading tour guides with tenantId:', tenantToUse);
      
      if (!tenantToUse) {
        console.warn('⚠️ No tenantId available, skipping API call');
        setLoading(false);
        return;
      }
      
      // ✅ Fetch guides from API
      const response = await tourGuideService.getAll(tenantToUse);
      console.log('📊 Tour guides response:', response);
      
      let guidesData = [];
      if (response?.success && response?.data) {
        guidesData = response.data;
      } else if (Array.isArray(response)) {
        guidesData = response;
      }
      
      // ✅ Parse JSON fields that might be stored as strings
      const parsedGuides = guidesData.map(guide => ({
        ...guide,
        specialties: guide.specialties ? (typeof guide.specialties === 'string' ? JSON.parse(guide.specialties) : guide.specialties) : [],
        languages: guide.languages ? (typeof guide.languages === 'string' ? JSON.parse(guide.languages) : guide.languages) : [],
        certifications: guide.certifications ? (typeof guide.certifications === 'string' ? JSON.parse(guide.certifications) : guide.certifications) : [],
        image: guide.image || null
      }));
      
      setGuides(parsedGuides);
      
    } catch (error) {
      console.error('Error loading tour guides:', error);
      showNotification('Error loading guides', 'error');
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  // ✅ Fallback to localStorage
  const loadFromLocalStorage = () => {
    console.warn('Loading tour guides from localStorage (fallback)');
    try {
      const storedGuides = JSON.parse(localStorage.getItem('travel_agency_tour_guides') || '[]');
      setGuides(storedGuides);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setGuides([]);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      bio: '',
      specialties: [],
      languages: [],
      experience: '',
      rating: 0,
      reviews: 0,
      image: null,
      status: 'active',
      certifications: [],
      availability: 'available',
      pricePerDay: '',
      country: '',
      city: ''
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
      const imageData = event.target.result;
      
      // ✅ Check if we're in edit mode or create mode
      if (editFormData) {
        setEditFormData(prev => ({ ...prev, image: imageData }));
      } else {
        setFormData(prev => ({ ...prev, image: imageData }));
      }
      
      setImagePreview(imageData);
      showNotification('Image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (editFormData) {
      setEditFormData(prev => ({ ...prev, image: null }));
    } else {
      setFormData(prev => ({ ...prev, image: null }));
    }
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddItem = (type) => {
    const inputId = type === 'specialty' ? 'specialtyInput' : 
                    type === 'language' ? 'languageInput' : 'certificationInput';
    const input = document.getElementById(inputId);
    const value = input?.value?.trim();
    
    if (value && value.length > 0) {
      const field = type === 'specialty' ? 'specialties' : 
                    type === 'language' ? 'languages' : 'certifications';
      
      if (editFormData) {
        setEditFormData(prev => ({
          ...prev,
          [field]: [...(prev[field] || []), value]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: [...prev[field], value]
        }));
      }
      input.value = '';
    }
  };

  const handleRemoveItem = (type, index) => {
    const field = type === 'specialty' ? 'specialties' : 
                  type === 'language' ? 'languages' : 'certifications';
    
    if (editFormData) {
      const current = editFormData[field] || [];
      setEditFormData(prev => ({
        ...prev,
        [field]: current.filter((_, i) => i !== index)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index)
      }));
    }
  };

  const handleCreateGuide = async () => {
  if (!formData.name || !formData.email || !formData.phone) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }

  setIsSubmitting(true);

  try {
    const newGuide = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      bio: formData.bio || '',
      // ✅ Convert arrays to JSON strings
      specialties: JSON.stringify(formData.specialties || []),
      languages: JSON.stringify(formData.languages || []),
      experience: formData.experience || '',
      rating: parseFloat(formData.rating) || 0,
      reviews: parseInt(formData.reviews) || 0,
      image: formData.image || null,
      status: formData.status || 'active',
      certifications: JSON.stringify(formData.certifications || []),
      availability: formData.availability || 'available',
      pricePerDay: parseFloat(formData.pricePerDay) || 0,
      country: formData.country || '',
      city: formData.city || '',
      tenantId: tenantId
    };

    console.log('📤 Creating tour guide:', newGuide);
    const response = await tourGuideService.create(newGuide);
    console.log('📥 Create response:', response);

    if (response?.success) {
      showNotification(`✅ Tour guide "${formData.name}" created successfully!`);
      setShowCreateModal(false);
      resetForm();
      loadData(tenantId);
    } else {
      showNotification('Failed to create guide: ' + (response?.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error creating guide:', error);
    showNotification('Failed to create guide. Please try again.', 'error');
  }

  setIsSubmitting(false);
};

  const handleEditGuide = async () => {
  if (!editFormData) return;

  setIsSubmitting(true);

  try {
    const updatedGuide = {
      name: editFormData.name,
      email: editFormData.email,
      phone: editFormData.phone,
      bio: editFormData.bio || '',
      // ✅ Convert arrays to JSON strings
      specialties: JSON.stringify(editFormData.specialties || []),
      languages: JSON.stringify(editFormData.languages || []),
      experience: editFormData.experience || '',
      rating: parseFloat(editFormData.rating) || 0,
      reviews: parseInt(editFormData.reviews) || 0,
      image: editFormData.image || null,
      status: editFormData.status || 'active',
      certifications: JSON.stringify(editFormData.certifications || []),
      availability: editFormData.availability || 'available',
      pricePerDay: parseFloat(editFormData.pricePerDay) || 0,
      country: editFormData.country || '',
      city: editFormData.city || '',
      tenantId: tenantId
    };

    console.log(`📤 Updating tour guide ${editFormData.id}:`, updatedGuide);
    const response = await tourGuideService.update(editFormData.id, updatedGuide);
    console.log('📥 Update response:', response);

    if (response?.success) {
      showNotification(`✅ Tour guide updated successfully!`);
      setShowEditModal(false);
      setEditFormData(null);
      loadData(tenantId);
    } else {
      showNotification('Failed to update guide: ' + (response?.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error updating guide:', error);
    showNotification('Failed to update guide. Please try again.', 'error');
  }

  setIsSubmitting(false);
};

  const handleDeleteGuide = async () => {
    if (!selectedGuide) return;

    setIsSubmitting(true);

    try {
      console.log(`📤 Deleting tour guide ${selectedGuide.id}`);
      const response = await tourGuideService.delete(selectedGuide.id);
      console.log('📥 Delete response:', response);

      if (response?.success) {
        showNotification(`✅ Tour guide "${selectedGuide.name}" deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedGuide(null);
        loadData(tenantId);
      } else {
        showNotification('Failed to delete guide: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting guide:', error);
      showNotification('Failed to delete guide. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  const openEditModal = (guide) => {
    setEditFormData({
      ...guide,
      specialties: Array.isArray(guide.specialties) ? guide.specialties : [],
      languages: Array.isArray(guide.languages) ? guide.languages : [],
      certifications: Array.isArray(guide.certifications) ? guide.certifications : [],
      image: guide.image || null
    });
    setImagePreview(guide.image || null);
    setShowEditModal(true);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: '✅ Active', color: 'bg-green-100 text-green-800' },
      inactive: { label: '⏸️ Inactive', color: 'bg-gray-100 text-gray-800' },
      on_leave: { label: '🏖️ On Leave', color: 'bg-yellow-100 text-yellow-800' }
    };
    return statusMap[status] || statusMap.active;
  };

  const getAvailabilityBadge = (availability) => {
    const availabilityMap = {
      available: { label: '🟢 Available', color: 'bg-green-100 text-green-800' },
      busy: { label: '🟡 Busy', color: 'bg-yellow-100 text-yellow-800' },
      unavailable: { label: '🔴 Unavailable', color: 'bg-red-100 text-red-800' }
    };
    return availabilityMap[availability] || availabilityMap.available;
  };

  const getRandomRating = () => {
    return (3.5 + Math.random() * 1.5).toFixed(1);
  };

  const filteredGuides = guides.filter(guide => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      guide.name?.toLowerCase().includes(searchLower) ||
      guide.email?.toLowerCase().includes(searchLower) ||
      guide.phone?.toLowerCase().includes(searchLower) ||
      guide.country?.toLowerCase().includes(searchLower) ||
      guide.city?.toLowerCase().includes(searchLower) ||
      guide.specialties?.some(s => s.toLowerCase().includes(searchLower)) ||
      guide.languages?.some(l => l.toLowerCase().includes(searchLower));
    
    const matchesStatus = filterStatus === 'all' || guide.status === filterStatus;
    const matchesLanguage = filterLanguage === 'all' || 
      (guide.languages && guide.languages.includes(filterLanguage));
    
    return matchesSearch && matchesStatus && matchesLanguage;
  });

  // Stats
  const totalGuides = guides.length;
  const activeGuides = guides.filter(g => g.status === 'active').length;
  const availableGuides = guides.filter(g => g.availability === 'available').length;

  const statsCards = [
    { title: 'Total Guides', value: totalGuides, icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Active', value: activeGuides, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Available', value: availableGuides, icon: Sun, color: 'text-yellow-600', bg: 'bg-yellow-50' }
  ];

  // Render Create/Edit Modal
  const renderFormModal = (isEdit = false) => {
    const isOpen = isEdit ? showEditModal : showCreateModal;
    const data = isEdit ? editFormData : formData;
    const setData = isEdit ? setEditFormData : setFormData;
    const handleSubmit = isEdit ? handleEditGuide : handleCreateGuide;
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
              {isEdit ? 'Edit Tour Guide' : 'Add New Tour Guide'}
            </h2>
            <p className={`text-sm ${isEdit ? 'text-blue-100' : 'text-green-100'}`}>
              {isEdit ? 'Update guide details' : 'Add a new tour guide'}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Info */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={data.name || ''}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., John Mwangi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={data.email || ''}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  name="country"
                  value={data.country || ''}
                  onChange={(e) => setData({ ...data, country: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Kenya"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={data.city || ''}
                  onChange={(e) => setData({ ...data, city: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nairobi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                <input
                  type="text"
                  name="experience"
                  value={data.experience || ''}
                  onChange={(e) => setData({ ...data, experience: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 5 years"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Day (KES)</label>
                <input
                  type="number"
                  name="pricePerDay"
                  value={data.pricePerDay || ''}
                  onChange={(e) => setData({ ...data, pricePerDay: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 5000"
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                <select
                  name="availability"
                  value={data.availability || 'available'}
                  onChange={(e) => setData({ ...data, availability: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {availabilityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio / About</label>
                <textarea
                  name="bio"
                  value={data.bio || ''}
                  onChange={(e) => setData({ ...data, bio: e.target.value })}
                  rows="3"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Tell us about the guide..."
                />
              </div>

              {/* Specialties */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialties</label>
                <div className="flex gap-2">
                  <input
                    id="specialtyInput"
                    type="text"
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Wildlife Safari, Bird Watching"
                    list="specialtyOptions"
                  />
                  <datalist id="specialtyOptions">
                    {specialtyOptions.map(opt => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={() => handleAddItem('specialty')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(data.specialties || []).map((item, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      🏆 {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem('specialty', index)}
                        className="hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                <div className="flex gap-2">
                  <input
                    id="languageInput"
                    type="text"
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., English, Swahili"
                    list="languageOptions"
                  />
                  <datalist id="languageOptions">
                    {languageOptions.map(opt => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={() => handleAddItem('language')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(data.languages || []).map((item, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      🌍 {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem('language', index)}
                        className="hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Certifications */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Certifications</label>
                <div className="flex gap-2">
                  <input
                    id="certificationInput"
                    type="text"
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., KPSGA Certified, First Aid"
                    list="certificationOptions"
                  />
                  <datalist id="certificationOptions">
                    {certificationOptions.map(opt => (
                      <option key={opt} value={opt} />
                    ))}
                  </datalist>
                  <button
                    type="button"
                    onClick={() => handleAddItem('certification')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(data.certifications || []).map((item, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      🎓 {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveItem('certification', index)}
                        className="hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Image Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Guide Photo</label>
                <div className="flex items-center gap-3">
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                  >
                    <Camera size={16} /> Upload Photo
                  </button>
                  <span className="text-xs text-gray-400">JPG, PNG (Max 5MB)</span>
                </div>
                {imagePreview && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={imagePreview} alt="Guide" className="h-20 w-20 object-cover rounded-full border border-gray-200" />
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
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200 mt-4">
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {isEdit ? 'Update Guide' : 'Add Guide'}
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

  // Render Detail Modal
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedGuide) return null;

    const statusBadge = getStatusBadge(selectedGuide.status);
    const availabilityBadge = getAvailabilityBadge(selectedGuide.availability);

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

          <div className="bg-gradient-to-r from-orange-600 to-orange-700 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center gap-4">
              {selectedGuide.image ? (
                <img src={selectedGuide.image} alt={selectedGuide.name} className="w-16 h-16 rounded-full border-2 border-white object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <User size={32} className="text-white" />
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedGuide.name}</h2>
                <p className="text-orange-100 text-sm">{selectedGuide.city}, {selectedGuide.country}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {/* Stats */}
<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-6">
  {statsCards.map((stat, index) => (
    <div key={index} className={`${stat.bg} rounded-xl p-2 sm:p-4 border border-gray-100`}>
      <div className="flex items-center justify-between">
        <stat.icon size={16} className={stat.color} />
      </div>
      <p className="text-base sm:text-2xl font-bold text-gray-800 mt-1 sm:mt-2">{stat.value}</p>
      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-tight">
        {stat.title}
      </p>
    </div>
  ))}
</div>

            {/* Statuses */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={`text-sm px-3 py-1 rounded-full ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
              <span className={`text-sm px-3 py-1 rounded-full ${availabilityBadge.color}`}>
                {availabilityBadge.label}
              </span>
            </div>

            {/* Bio */}
            {selectedGuide.bio && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">About</h4>
                <p className="text-sm text-gray-600">{selectedGuide.bio}</p>
              </div>
            )}

            {/* Specialties */}
            {selectedGuide.specialties && selectedGuide.specialties.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">🏆 Specialties</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedGuide.specialties.map((item, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {selectedGuide.languages && selectedGuide.languages.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">🌍 Languages</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedGuide.languages.map((item, index) => (
                    <span key={index} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {selectedGuide.certifications && selectedGuide.certifications.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">🎓 Certifications</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedGuide.certifications.map((item, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Contact */}
            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-1">📞 Contact</h4>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <p><span className="text-gray-500">Email:</span> {selectedGuide.email}</p>
                <p><span className="text-gray-500">Phone:</span> {selectedGuide.phone}</p>
              </div>
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2">
            <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
              Close
            </button>
            <button 
              onClick={() => {
                setShowDetailModal(false);
                openEditModal(selectedGuide);
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

  // Render Delete Modal
  const renderDeleteModal = () => {
    if (!showDeleteModal || !selectedGuide) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowDeleteModal(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Tour Guide?</h3>
            <p className="text-gray-500 text-sm">
              Are you sure you want to delete "{selectedGuide.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleDeleteGuide}
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
            <Users size={28} className="text-blue-600" />
            Tour Guides
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage professional tour guides</p>
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
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Add Guide
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
            placeholder="Search by name, specialty, language..."
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
            <option value="inactive">⏸️ Inactive</option>
            <option value="on_leave">🏖️ On Leave</option>
          </select>
          <select
            value={filterLanguage}
            onChange={(e) => setFilterLanguage(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="all">All Languages</option>
            {languageOptions.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Guides Grid */}
{loading ? (
  <div className="text-center py-12 text-gray-400">Loading guides...</div>
) : filteredGuides.length === 0 ? (
  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
    <Users size={48} className="mx-auto text-gray-300 mb-3" />
    <p className="text-gray-500">No tour guides found</p>
    <p className="text-sm text-gray-400">
      {searchQuery ? 'Try adjusting your search' : 'Add your first tour guide by clicking "Add Guide"'}
    </p>
    <button
      onClick={() => setShowCreateModal(true)}
      className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
    >
      <Plus size={16} className="inline mr-1" /> Add Guide
    </button>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 max-w-6xl mx-auto">
    {filteredGuides.map((guide) => {
      const statusBadge = getStatusBadge(guide.status);
      const availabilityBadge = getAvailabilityBadge(guide.availability);
      const rating = guide.rating || getRandomRating();

      return (
        <div key={guide.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
          <div className="relative">
            {guide.image ? (
              <img src={guide.image} alt={guide.name} className="w-full h-56 object-cover" />
            ) : (
              <div className="w-full h-56 bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                <User size={64} className="text-gray-400" />
              </div>
            )}
            <div className="absolute top-2 right-2 flex flex-col gap-1">
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${availabilityBadge.color}`}>
                {availabilityBadge.label}
              </span>
            </div>
            <div className="absolute bottom-2 left-2 bg-black/50 rounded-full px-3 py-1 text-white text-xs flex items-center gap-1">
              <StarIcon size={12} className="text-yellow-400" /> {rating} ({guide.reviews || 0} reviews)
            </div>
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{guide.name}</h3>
                <p className="text-xs text-gray-500">{guide.city}, {guide.country}</p>
              </div>
              <span className="text-xs text-blue-600 font-medium flex-shrink-0 ml-2">
                KSh {guide.pricePerDay?.toLocaleString() || 0}/day
              </span>
            </div>

            <div className="flex flex-wrap gap-1 mt-2">
              {guide.specialties && guide.specialties.slice(0, 3).map((spec, idx) => (
                <span key={idx} className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                  {spec}
                </span>
              ))}
              {guide.specialties && guide.specialties.length > 3 && (
                <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  +{guide.specialties.length - 3}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-1 mt-1.5">
              {guide.languages && guide.languages.slice(0, 4).map((lang, idx) => (
                <span key={idx} className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
                  🌍 {lang}
                </span>
              ))}
              {guide.languages && guide.languages.length > 4 && (
                <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  +{guide.languages.length - 4}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelectedGuide(guide);
                  setShowDetailModal(true);
                }}
                className="flex-1 px-2 py-1.5 text-[10px] text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Eye size={13} /> View
              </button>
              <button
                onClick={() => openEditModal(guide)}
                className="flex-1 px-2 py-1.5 text-[10px] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Edit2 size={13} /> Edit
              </button>
              <button
                onClick={() => {
                  setSelectedGuide(guide);
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

export default TourGuides;