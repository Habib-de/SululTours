import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Filter, RefreshCw, Eye, Edit2, Trash2,
  X, Save, Upload, Image as ImageIcon, Calendar, Users,
  MapPin, Clock, DollarSign, Star, TrendingUp, AlertCircle,
  CheckCircle, Globe, Compass, Camera, Tag, Percent,
  Download, Share2, Printer, FileImage, Archive,
  Plane, Moon, Star as StarIcon, Heart, Shield, Award,
  Building, Phone, Mail, User, MapPinned
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hajjPackageService } from '../../services/api';
import html2canvas from 'html2canvas';

const HajjPackages = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPackage, setSelectedPackage] = useState(null);
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
    type: 'hajj',
    destination: '',
    duration: '',
    price: '',
    description: '',
    inclusions: [],
    exclusions: [],
    itinerary: '',
    image: null,
    status: 'active',
    category: 'hajj',
    maxGroupSize: 10,
    departureDates: [],
    difficulty: 'moderate',
    highlights: [],
    rating: 0,
    reviews: 0,
    accommodation: '',
    meals: '',
    transport: '',
    guides: '',
    visa: '',
    insurance: ''
  });

  const [editFormData, setEditFormData] = useState(null);

  // Categories
  const categories = [
    { value: 'hajj', label: '🕋 Hajj' },
    { value: 'umra', label: '🕌 Umra' },
    { value: 'ramadan', label: '🌙 Ramadan' },
    { value: 'family', label: '👨‍👩‍👧‍👦 Family' },
    { value: 'group', label: '👥 Group' },
    { value: 'vip', label: '⭐ VIP' }
  ];

  const difficulties = [
    { value: 'easy', label: '🟢 Easy' },
    { value: 'moderate', label: '🟡 Moderate' },
    { value: 'hard', label: '🔴 Hard' }
  ];

  const statuses = [
    { value: 'active', label: '✅ Active' },
    { value: 'draft', label: '📝 Draft' },
    { value: 'archived', label: '📦 Archived' }
  ];

  const hajjTypes = [
    { value: 'hajj', label: '🕋 Hajj' },
    { value: 'umra', label: '🕌 Umra' },
    { value: 'ramadan_umra', label: '🌙 Ramadan Umra' }
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
      console.log('🔍 Loading Hajj packages with tenantId:', tenantToUse);
      
      if (!tenantToUse) {
        console.warn('⚠️ No tenantId available, skipping API call');
        setLoading(false);
        return;
      }
      
      const response = await hajjPackageService.getAll(tenantToUse);
      console.log('📊 Hajj packages response:', response);
      
      let packagesData = [];
      if (response?.success && response?.data) {
        packagesData = response.data;
      } else if (Array.isArray(response)) {
        packagesData = response;
      }
      
      const parsedPackages = packagesData.map(pkg => {
  // Parse images from JSON array
  let imageUrl = null;
  if (pkg.images) {
    try {
      // If images is a string, try to parse it
      if (typeof pkg.images === 'string') {
        // Check if it's a JSON array
        if (pkg.images.trim().startsWith('[')) {
          const imagesArray = JSON.parse(pkg.images);
          if (imagesArray && imagesArray.length > 0) {
            imageUrl = imagesArray[0]; // Use first image
          }
        } else {
          // It's a plain string URL
          imageUrl = pkg.images;
        }
      } else if (Array.isArray(pkg.images) && pkg.images.length > 0) {
        imageUrl = pkg.images[0];
      }
    } catch (e) {
      console.warn('Failed to parse images for package:', pkg.id, e);
      // If parsing fails, try to use the raw string
      if (typeof pkg.images === 'string' && pkg.images.length > 0) {
        imageUrl = pkg.images;
      }
    }
  }
  
  return {
    ...pkg,
    image: imageUrl, // This will be the actual image URL, not the JSON string
    inclusions: pkg.inclusions 
      ? (typeof pkg.inclusions === 'string' 
          ? JSON.parse(pkg.inclusions).filter(item => item && item.trim() !== '') 
          : pkg.inclusions.filter(item => item && item.trim() !== ''))
      : [],
    exclusions: pkg.exclusions 
      ? (typeof pkg.exclusions === 'string' 
          ? JSON.parse(pkg.exclusions).filter(item => item && item.trim() !== '') 
          : pkg.exclusions.filter(item => item && item.trim() !== ''))
      : [],
    highlights: pkg.highlights 
      ? (typeof pkg.highlights === 'string' 
          ? JSON.parse(pkg.highlights).filter(item => item && item.trim() !== '') 
          : pkg.highlights.filter(item => item && item.trim() !== ''))
      : [],
    departureDates: pkg.departureDates 
      ? (typeof pkg.departureDates === 'string' ? JSON.parse(pkg.departureDates) : pkg.departureDates)
      : [],
    images: pkg.images || null
  };
});
      
      setPackages(parsedPackages);
      
      setTimeout(() => {
        autoArchiveExpiredPackages(parsedPackages);
      }, 500);
      
    } catch (error) {
      console.error('Error loading Hajj packages:', error);
      showNotification('Error loading packages', 'error');
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  const loadFromLocalStorage = () => {
    console.warn('Loading Hajj packages from localStorage (fallback)');
    try {
      const storedPackages = JSON.parse(localStorage.getItem('travel_agency_hajj_packages') || '[]');
      setPackages(storedPackages);
      setTimeout(() => {
        autoArchiveExpiredPackages(storedPackages);
      }, 500);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setPackages([]);
    }
  };

  const autoArchiveExpiredPackages = (packagesData = null) => {
    const currentPackages = packagesData || packages;
    let updated = false;
    let archivedCount = 0;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const newPackages = currentPackages.map(pkg => {
      if (pkg.status !== 'active') return pkg;
      if (!pkg.departureDates || pkg.departureDates.length === 0) return pkg;

      const allExpired = pkg.departureDates.every(dateStr => {
        const date = new Date(dateStr);
        return date < today;
      });

      if (allExpired) {
        updated = true;
        archivedCount++;
        return { ...pkg, status: 'archived' };
      }
      return pkg;
    });

    if (updated) {
      setPackages(newPackages);
      if (archivedCount > 0) {
        showNotification(`🗂️ ${archivedCount} package(s) automatically archived (departure dates passed)`, 'info');
      }
    }
    return updated;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'hajj',
      destination: '',
      duration: '',
      price: '',
      description: '',
      inclusions: [],
      exclusions: [],
      itinerary: '',
      image: null,
      status: 'active',
      category: 'hajj',
      maxGroupSize: 10,
      departureDates: [],
      difficulty: 'moderate',
      highlights: [],
      rating: 0,
      reviews: 0,
      accommodation: '',
      meals: '',
      transport: '',
      guides: '',
      visa: '',
      insurance: ''
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
      if (editFormData) {
        setEditFormData(prev => ({ ...prev, image: event.target.result, images: event.target.result }));
      } else {
        setFormData(prev => ({ ...prev, image: event.target.result }));
      }
      setImagePreview(event.target.result);
      showNotification('Image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    if (editFormData) {
      setEditFormData(prev => ({ ...prev, image: null, images: null }));
    } else {
      setFormData(prev => ({ ...prev, image: null }));
    }
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const formatDateSafe = (dateString) => {
    if (!dateString) return 'Invalid Date';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const calculateEndDate = (startDate, duration) => {
    if (!startDate || !duration) return null;
    
    const daysMatch = duration.match(/(\d+)\s*Days?/i);
    const nightsMatch = duration.match(/(\d+)\s*Nights?/i);
    
    let daysToAdd = 0;
    if (daysMatch) {
      daysToAdd = parseInt(daysMatch[1]);
    } else if (nightsMatch) {
      daysToAdd = parseInt(nightsMatch[1]) + 1;
    } else {
      const anyNumber = duration.match(/(\d+)/);
      if (anyNumber) {
        daysToAdd = parseInt(anyNumber[1]);
      } else {
        return null;
      }
    }
    
    const start = new Date(startDate);
    if (isNaN(start.getTime())) return null;
    const end = new Date(start);
    end.setDate(end.getDate() + daysToAdd);
    
    return end.toISOString().split('T')[0];
  };

  const handleAddDepartureDate = () => {
    const input = document.getElementById('departureDateInput');
    
    if (!input || !input.value) {
      showNotification('Please select a date first', 'error');
      return;
    }
    
    const dateObj = new Date(input.value);
    
    if (isNaN(dateObj.getTime())) {
      showNotification('Please select a valid date', 'error');
      return;
    }
    
    if (editFormData) {
      const currentDates = editFormData.departureDates || [];
      
      if (currentDates.includes(input.value)) {
        showNotification('⚠️ This date is already added', 'error');
        return;
      }
      
      const newDates = [...currentDates, input.value];
      
      setEditFormData(prev => ({
        ...prev,
        departureDates: newDates
      }));
      
      showNotification('📅 Departure date added to package!');
    } else {
      const currentDates = formData.departureDates || [];
      
      if (currentDates.includes(input.value)) {
        showNotification('⚠️ This date is already added', 'error');
        return;
      }
      
      const newDates = [...currentDates, input.value];
      
      setFormData(prev => ({
        ...prev,
        departureDates: newDates
      }));
      
      showNotification('📅 Departure date added!');
    }
    
    input.value = '';
  };

  const handleRemoveDepartureDate = (index) => {
    if (editFormData) {
      const currentDates = editFormData.departureDates || [];
      const newDates = currentDates.filter((_, i) => i !== index);
      
      setEditFormData(prev => ({
        ...prev,
        departureDates: newDates
      }));
      
      showNotification('🗑️ Departure date removed!');
    } else {
      const currentDates = formData.departureDates || [];
      const newDates = currentDates.filter((_, i) => i !== index);
      
      setFormData(prev => ({
        ...prev,
        departureDates: newDates
      }));
      
      showNotification('🗑️ Departure date removed!');
    }
  };

  const handleAddInclusion = () => {
    const input = document.getElementById('inclusionInput');
    const value = input?.value?.trim();
    
    if (value && value.length > 0) {
      if (editFormData) {
        setEditFormData(prev => ({
          ...prev,
          inclusions: [...(prev.inclusions || []), value]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          inclusions: [...prev.inclusions, value]
        }));
      }
      input.value = '';
    }
  };

  const handleRemoveInclusion = (index) => {
    if (editFormData) {
      const currentInclusions = editFormData.inclusions || [];
      const updated = currentInclusions.filter((_, i) => i !== index);
      setEditFormData(prev => ({ ...prev, inclusions: updated }));
    } else {
      setFormData(prev => ({
        ...prev,
        inclusions: prev.inclusions.filter((_, i) => i !== index)
      }));
    }
  };

  const handleAddHighlight = () => {
    const input = document.getElementById('highlightInput');
    const value = input?.value?.trim();
    
    if (value && value.length > 0) {
      if (editFormData) {
        setEditFormData(prev => ({
          ...prev,
          highlights: [...(prev.highlights || []), value]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          highlights: [...prev.highlights, value]
        }));
      }
      input.value = '';
    }
  };

  const handleRemoveHighlight = (index) => {
    if (editFormData) {
      const currentHighlights = editFormData.highlights || [];
      const updated = currentHighlights.filter((_, i) => i !== index);
      setEditFormData(prev => ({ ...prev, highlights: updated }));
    } else {
      setFormData(prev => ({
        ...prev,
        highlights: prev.highlights.filter((_, i) => i !== index)
      }));
    }
  };

  const handleCreatePackage = async () => {
    if (!formData.name || !formData.destination || !formData.duration || !formData.price) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const filteredInclusions = (formData.inclusions || []).filter(item => item && item.trim() !== '');
      const filteredHighlights = (formData.highlights || []).filter(item => item && item.trim() !== '');
      const filteredDepartureDates = (formData.departureDates || []).filter(item => item && item.trim() !== '');

      const newPackage = {
        name: formData.name,
        type: formData.type || 'hajj',
        destination: formData.destination,
        duration: formData.duration,
        price: parseFloat(formData.price) || 0,
        description: formData.description || '',
        category: formData.category || 'hajj',
        status: formData.status || 'active',
        maxGroupSize: parseInt(formData.maxGroupSize) || 10,
        difficulty: formData.difficulty || 'moderate',
        inclusions: JSON.stringify(filteredInclusions),
        exclusions: JSON.stringify((formData.exclusions || []).filter(item => item && item.trim() !== '')),
        itinerary: formData.itinerary || '',
        highlights: JSON.stringify(filteredHighlights),
        departureDates: JSON.stringify(filteredDepartureDates),
        images: formData.image || null,
        accommodation: formData.accommodation || '',
        meals: formData.meals || '',
        transport: formData.transport || '',
        guides: formData.guides || '',
        visa: formData.visa || '',
        insurance: formData.insurance || '',
        tenantId: tenantId
      };

      console.log('📤 Creating Hajj package:', newPackage);
      const response = await hajjPackageService.create(newPackage);
      console.log('📥 Create response:', response);

      if (response?.success) {
        showNotification(`✅ Hajj package "${formData.name}" created successfully!`);
        setShowCreateModal(false);
        resetForm();
        loadData(tenantId);
      } else {
        showNotification('Failed to create package: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error creating package:', error);
      showNotification('Failed to create package. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  const handleEditPackage = async () => {
  if (!editFormData) return;

  setIsSubmitting(true);

  try {
    // Handle images properly
    let imagesValue = null;
    
    // If there's a new image from the preview, use it
    if (imagePreview && imagePreview !== editFormData.images) {
      imagesValue = imagePreview;
    } 
    // Otherwise, if there's an existing image, keep it
    else if (editFormData.images) {
      // If it's a string and starts with '[', it's already a JSON array
      if (typeof editFormData.images === 'string') {
        imagesValue = editFormData.images;
      } else if (Array.isArray(editFormData.images)) {
        // If it's an array, stringify it
        imagesValue = JSON.stringify(editFormData.images);
      } else {
        // If it's a single string, wrap in array
        imagesValue = JSON.stringify([editFormData.images]);
      }
    }
    // If there's an image in editFormData.image (new upload)
    else if (editFormData.image && typeof editFormData.image === 'string') {
      imagesValue = editFormData.image;
    }

    const updatedPackage = {
      name: editFormData.name,
      type: editFormData.type || 'hajj',
      destination: editFormData.destination,
      duration: editFormData.duration,
      price: parseFloat(editFormData.price) || 0,
      description: editFormData.description || '',
      category: editFormData.category || 'hajj',
      status: editFormData.status || 'active',
      maxGroupSize: parseInt(editFormData.maxGroupSize) || 10,
      difficulty: editFormData.difficulty || 'moderate',
      inclusions: JSON.stringify(editFormData.inclusions || []),
      exclusions: JSON.stringify(editFormData.exclusions || []),
      itinerary: editFormData.itinerary || '',
      highlights: JSON.stringify(editFormData.highlights || []),
      departureDates: JSON.stringify(editFormData.departureDates || []),
      accommodation: editFormData.accommodation || '',
      meals: editFormData.meals || '',
      transport: editFormData.transport || '',
      guides: editFormData.guides || '',
      visa: editFormData.visa || '',
      insurance: editFormData.insurance || '',
      tenantId: tenantId
    };

    // Only add images if we have a valid value
    if (imagesValue !== null && imagesValue !== undefined && imagesValue !== '') {
      updatedPackage.images = imagesValue;
    }

    console.log(`📤 Updating Hajj package ${editFormData.id}:`, updatedPackage);
    const response = await hajjPackageService.update(editFormData.id, updatedPackage);
    console.log('📥 Update response:', response);

    if (response?.success) {
      showNotification(`✅ Hajj package updated successfully!`);
      setShowEditModal(false);
      setEditFormData(null);
      setImagePreview(null);
      loadData(tenantId);
    } else {
      showNotification('Failed to update package: ' + (response?.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error updating package:', error);
    showNotification('Failed to update package. Please try again.', 'error');
  }

  setIsSubmitting(false);
};

  const handleDeletePackage = async () => {
    if (!selectedPackage) return;

    setIsSubmitting(true);

    try {
      console.log(`📤 Deleting Hajj package ${selectedPackage.id}`);
      const response = await hajjPackageService.delete(selectedPackage.id);
      console.log('📥 Delete response:', response);

      if (response?.success) {
        showNotification(`✅ Hajj package "${selectedPackage.name}" deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedPackage(null);
        loadData(tenantId);
      } else {
        showNotification('Failed to delete package: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting package:', error);
      showNotification('Failed to delete package. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  const openEditModal = (pkg) => {
  // Parse the image from the images array
  let imageUrl = null;
  if (pkg.images) {
    try {
      if (typeof pkg.images === 'string' && pkg.images.trim().startsWith('[')) {
        const imagesArray = JSON.parse(pkg.images);
        if (imagesArray && imagesArray.length > 0) {
          imageUrl = imagesArray[0];
        }
      } else if (typeof pkg.images === 'string') {
        imageUrl = pkg.images;
      } else if (Array.isArray(pkg.images) && pkg.images.length > 0) {
        imageUrl = pkg.images[0];
      }
    } catch (e) {
      // If parsing fails, use raw string
      if (typeof pkg.images === 'string') {
        imageUrl = pkg.images;
      }
    }
  }
  
  setEditFormData({
    ...pkg,
    image: imageUrl, // Store parsed image URL
    images: pkg.images, // Store original images for sending back
    inclusions: Array.isArray(pkg.inclusions) 
      ? pkg.inclusions.filter(item => item && item.trim() !== '') 
      : [],
    exclusions: Array.isArray(pkg.exclusions) 
      ? pkg.exclusions.filter(item => item && item.trim() !== '') 
      : [],
    highlights: Array.isArray(pkg.highlights) 
      ? pkg.highlights.filter(item => item && item.trim() !== '') 
      : [],
    departureDates: Array.isArray(pkg.departureDates) ? pkg.departureDates : [],
  });
  setImagePreview(imageUrl);
  setShowEditModal(true);
};

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: '✅ Active', color: 'bg-green-100 text-green-800' },
      draft: { label: '📝 Draft', color: 'bg-yellow-100 text-yellow-800' },
      archived: { label: '📦 Archived', color: 'bg-gray-100 text-gray-800' }
    };
    return statusMap[status] || statusMap.draft;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      hajj: '🕋',
      umra: '🕌',
      ramadan: '🌙',
      family: '👨‍👩‍👧‍👦',
      group: '👥',
      vip: '⭐'
    };
    return icons[category] || '🕋';
  };

  const getTypeLabel = (type) => {
    const labels = {
      hajj: 'Hajj',
      umra: 'Umra',
      ramadan_umra: 'Ramadan Umra'
    };
    return labels[type] || type || 'Hajj';
  };

  const renderFormModal = (isEdit = false) => {
    const isOpen = isEdit ? showEditModal : showCreateModal;
    const data = isEdit ? editFormData : formData;
    const setData = isEdit ? setEditFormData : setFormData;
    const handleSubmit = isEdit ? handleEditPackage : handleCreatePackage;
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
              {isEdit ? 'Edit Hajj/Umra Package' : 'Create New Hajj/Umra Package'}
            </h2>
            <p className={`text-sm ${isEdit ? 'text-blue-100' : 'text-green-100'}`}>
              {isEdit ? 'Update package details' : 'Add a new Hajj or Umra package'}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label>
                <input
                  type="text"
                  name="name"
                  value={data.name || ''}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 7-Day Hajj Package 2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Type</label>
                <select
                  name="type"
                  value={data.type || 'hajj'}
                  onChange={(e) => setData({ ...data, type: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {hajjTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={data.category || 'hajj'}
                  onChange={(e) => setData({ ...data, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                <input
                  type="text"
                  name="destination"
                  value={data.destination || ''}
                  onChange={(e) => setData({ ...data, destination: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Makkah, Saudi Arabia"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
                <input
                  type="text"
                  name="duration"
                  value={data.duration || ''}
                  onChange={(e) => setData({ ...data, duration: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 7 Days, 6 Nights"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price (KES) *</label>
                <input
                  type="number"
                  name="price"
                  value={data.price || ''}
                  onChange={(e) => setData({ ...data, price: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 250000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Group Size</label>
                <input
                  type="number"
                  name="maxGroupSize"
                  value={data.maxGroupSize || 10}
                  onChange={(e) => setData({ ...data, maxGroupSize: parseInt(e.target.value) })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="10"
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={data.description || ''}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  rows="3"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Describe the pilgrimage experience..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Itinerary</label>
                <textarea
                  name="itinerary"
                  value={data.itinerary || ''}
                  onChange={(e) => setData({ ...data, itinerary: e.target.value })}
                  rows="4"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Day 1: Arrival in Madinah...\nDay 2: Visit to Masjid Nabawi...\nDay 3: Travel to Makkah..."
                />
              </div>

              <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 border-b pb-2">Package Inclusions</h3>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Accommodation</label>
                <input
                  type="text"
                  name="accommodation"
                  value={data.accommodation || ''}
                  onChange={(e) => setData({ ...data, accommodation: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 5-star hotel in Makkah"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meals</label>
                <input
                  type="text"
                  name="meals"
                  value={data.meals || ''}
                  onChange={(e) => setData({ ...data, meals: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Full board (3 meals daily)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transport</label>
                <input
                  type="text"
                  name="transport"
                  value={data.transport || ''}
                  onChange={(e) => setData({ ...data, transport: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Air-conditioned buses"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guides</label>
                <input
                  type="text"
                  name="guides"
                  value={data.guides || ''}
                  onChange={(e) => setData({ ...data, guides: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Professional religious guides"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visa</label>
                <input
                  type="text"
                  name="visa"
                  value={data.visa || ''}
                  onChange={(e) => setData({ ...data, visa: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Visa processing included"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance</label>
                <input
                  type="text"
                  name="insurance"
                  value={data.insurance || ''}
                  onChange={(e) => setData({ ...data, insurance: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Travel insurance included"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  📅 Departure Dates
                  <span className="text-xs text-gray-400 ml-2">
                    (Add available departure dates)
                  </span>
                </label>
                <div className="flex gap-2">
                  <input
                    id="departureDateInput"
                    type="date"
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddDepartureDate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {(data.departureDates || []).map((date, index) => {
                    const endDate = calculateEndDate(date, data.duration);
                    return (
                      <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        📅 {formatDateSafe(date)}
                        {endDate && data.duration && (
                          <span className="text-[10px] text-blue-500 ml-1">
                            → {formatDateSafe(endDate)}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveDepartureDate(index)}
                          className="hover:text-red-600 ml-1"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    );
                  })}
                </div>
                {(!data.departureDates || data.departureDates.length === 0) && (
                  <p className="text-xs text-gray-400 mt-1">
                    No departure dates added yet. Add dates above.
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Inclusions</label>
                <div className="flex gap-2">
                  <input
                    id="inclusionInput"
                    type="text"
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Flights, Accommodation, Meals"
                  />
                  <button
                    type="button"
                    onClick={handleAddInclusion}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(data.inclusions || []).map((item, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      ✅ {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveInclusion(index)}
                        className="hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Highlights</label>
                <div className="flex gap-2">
                  <input
                    id="highlightInput"
                    type="text"
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Visit to Kaaba, Masjid Nabawi"
                  />
                  <button
                    type="button"
                    onClick={handleAddHighlight}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(data.highlights || []).map((item, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      ⭐ {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(index)}
                        className="hover:text-red-600"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Image</label>
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
                    <Camera size={16} /> Upload Image
                  </button>
                  <span className="text-xs text-gray-400">JPG, PNG (Max 5MB)</span>
                </div>
                {imagePreview && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={imagePreview} alt="Package" className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
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
                {isEdit ? 'Update Package' : 'Create Package'}
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

  const renderDeleteModal = () => {
    if (!showDeleteModal || !selectedPackage) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowDeleteModal(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Hajj Package?</h3>
            <p className="text-gray-500 text-sm">
              Are you sure you want to delete "{selectedPackage.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleDeletePackage}
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

  const renderDetailModal = () => {
    if (!showDetailModal || !selectedPackage) return null;

    const statusBadge = getStatusBadge(selectedPackage.status);

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

          <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-white">{selectedPackage.name}</h2>
            <p className="text-green-100 text-sm">{selectedPackage.destination}</p>
            <span className="inline-block mt-1 px-2 py-0.5 bg-white/20 text-white text-xs rounded-full">
              {getTypeLabel(selectedPackage.type)}
            </span>
          </div>

          <div className="p-6">
            {selectedPackage.image && (
              <div className="mb-4">
                <img src={selectedPackage.image} alt={selectedPackage.name} className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Clock size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{selectedPackage.duration}</p>
                <p className="text-xs text-gray-500">Duration</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <DollarSign size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">KSh {selectedPackage.price?.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Price</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Users size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{selectedPackage.maxGroupSize || 10}</p>
                <p className="text-xs text-gray-500">Max Group</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className={`text-sm font-semibold ${statusBadge.color}`}>{statusBadge.label}</span>
                <p className="text-xs text-gray-500">Status</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                {getCategoryIcon(selectedPackage.category)} {selectedPackage.category?.toUpperCase()}
              </span>
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {getTypeLabel(selectedPackage.type)}
              </span>
            </div>

            {selectedPackage.departureDates && selectedPackage.departureDates.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">📅 Departure Dates</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPackage.departureDates.map((date, index) => {
                    const endDate = calculateEndDate(date, selectedPackage.duration);
                    return (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {formatDateSafe(date)}
                        {endDate && selectedPackage.duration && (
                          <span className="text-[10px] text-blue-500 ml-1">
                            → {formatDateSafe(endDate)}
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-4">
              {selectedPackage.accommodation && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">🏨 Accommodation</p>
                  <p className="text-sm font-medium">{selectedPackage.accommodation}</p>
                </div>
              )}
              {selectedPackage.meals && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">🍽️ Meals</p>
                  <p className="text-sm font-medium">{selectedPackage.meals}</p>
                </div>
              )}
              {selectedPackage.transport && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">🚌 Transport</p>
                  <p className="text-sm font-medium">{selectedPackage.transport}</p>
                </div>
              )}
              {selectedPackage.guides && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">👨‍🏫 Guides</p>
                  <p className="text-sm font-medium">{selectedPackage.guides}</p>
                </div>
              )}
              {selectedPackage.visa && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">🛂 Visa</p>
                  <p className="text-sm font-medium">{selectedPackage.visa}</p>
                </div>
              )}
              {selectedPackage.insurance && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500">🛡️ Insurance</p>
                  <p className="text-sm font-medium">{selectedPackage.insurance}</p>
                </div>
              )}
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-1">Description</h4>
              <p className="text-sm text-gray-600">{selectedPackage.description}</p>
            </div>

            {selectedPackage.itinerary && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">Itinerary</h4>
                <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 whitespace-pre-line">
                  {selectedPackage.itinerary}
                </div>
              </div>
            )}

            {selectedPackage.inclusions && selectedPackage.inclusions.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">Inclusions</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPackage.inclusions.map((item, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      ✅ {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedPackage.highlights && selectedPackage.highlights.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">Highlights</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedPackage.highlights.map((item, index) => (
                    <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      ⭐ {item}
                    </span>
                  ))}
                </div>
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
                openEditModal(selectedPackage);
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

  const filteredPackages = packages.filter(pkg => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      pkg.name?.toLowerCase().includes(searchLower) ||
      pkg.destination?.toLowerCase().includes(searchLower) ||
      pkg.category?.toLowerCase().includes(searchLower) ||
      pkg.type?.toLowerCase().includes(searchLower);
    const matchesFilter = filterStatus === 'all' || pkg.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalPackages = packages.length;
  const activePackages = packages.filter(p => p.status === 'active').length;
  const draftPackages = packages.filter(p => p.status === 'draft').length;
  const archivedPackages = packages.filter(p => p.status === 'archived').length;

  const statsCards = [
    { title: 'Total Packages', value: totalPackages, icon: MapPin, color: 'text-blue-600', bg: 'bg-blue-50', filter: 'all' },
    { title: 'Active', value: activePackages, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', filter: 'active' },
    { title: 'Draft', value: draftPackages, icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', filter: 'draft' },
    { title: 'Archived', value: archivedPackages, icon: Archive, color: 'text-gray-600', bg: 'bg-gray-50', filter: 'archived' }
  ];

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

      {renderFormModal(false)}
      {renderFormModal(true)}
      {renderDeleteModal()}
      {renderDetailModal()}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin size={28} className="text-green-600" />
            Hajj & Umra Packages
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage pilgrimage packages for Hajj and Umra</p>
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
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
          >
            <Plus size={16} /> New Package
          </button>
        </div>
      </div>

      {/* Stats */}
<div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
  {statsCards.map((stat, index) => (
    <div 
      key={index} 
      className={`${stat.bg} rounded-xl p-2 sm:p-4 border border-gray-100 cursor-pointer hover:shadow-lg transition-shadow`}
      onClick={() => setFilterStatus(stat.filter)}
    >
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

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, destination, category..."
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
            <option value="draft">📝 Draft</option>
            <option value="archived">📦 Archived</option>
          </select>
        </div>
      </div>

      {loading ? (
  <div className="text-center py-12 text-gray-400">Loading packages...</div>
) : filteredPackages.length === 0 ? (
  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
    <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
    <p className="text-gray-500">No Hajj/Umra packages found</p>
    <p className="text-sm text-gray-400">
      {searchQuery ? 'Try adjusting your search' : 'Create your first Hajj/Umra package by clicking "New Package"'}
    </p>
    <button
      onClick={() => setShowCreateModal(true)}
      className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
    >
      <Plus size={16} className="inline mr-1" /> New Package
    </button>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6 max-w-6xl mx-auto">
    {filteredPackages.map((pkg) => {
      const statusBadge = getStatusBadge(pkg.status);
      return (
        <div key={pkg.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
          {pkg.image && (
            <div className="h-56 overflow-hidden">
              <img src={pkg.image} alt={pkg.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </div>
          )}
          <div className="p-5">
            {/* Header: Name + Status */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800 truncate">{pkg.name}</h3>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin size={12} />
                  <span>{pkg.destination}</span>
                </div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color} flex-shrink-0 ml-2`}>
                {statusBadge.label}
              </span>
            </div>

            {/* Duration, Group, Price in one row */}
            <div className="flex items-center gap-3 mt-1.5 text-xs">
              <span className="flex items-center gap-1 text-gray-500">
                <Clock size={12} className="text-blue-500" /> {pkg.duration}
              </span>
              <span className="flex items-center gap-1 text-gray-500">
                <Users size={12} className="text-blue-500" /> {pkg.maxGroupSize || 10}
              </span>
              <span className="flex items-center gap-1 font-semibold text-green-600">
                <DollarSign size={12} /> KSh {pkg.price?.toLocaleString()}
              </span>
            </div>

            {/* Badges - Only Departure Dates, Category, Type (NO accommodation, meals, transport) */}
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              {/* Departure Dates */}
              {pkg.departureDates && pkg.departureDates.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded flex items-center gap-0.5">
                  <Calendar size={10} /> 
                  {pkg.departureDates.slice(0, 2).map((date, i) => {
                    const endDate = calculateEndDate(date, pkg.duration);
                    return (
                      <span key={i}>
                        {formatDateSafe(date)}
                        {endDate && `→${formatDateSafe(endDate)}`}
                        {i < Math.min(pkg.departureDates.length, 2) - 1 && ','}
                      </span>
                    );
                  })}
                  {pkg.departureDates.length > 2 && ` +${pkg.departureDates.length - 2}`}
                </span>
              )}

              {/* Category */}
              <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-600 rounded">
                {getCategoryIcon(pkg.category)} {pkg.category}
              </span>

              {/* Type */}
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">
                {getTypeLabel(pkg.type)}
              </span>
            </div>

            {/* Action Buttons - Compact */}
            <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelectedPackage(pkg);
                  setShowDetailModal(true);
                }}
                className="flex-1 px-2 py-1.5 text-[10px] text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Eye size={13} /> View
              </button>
              <button
                onClick={() => openEditModal(pkg)}
                className="flex-1 px-2 py-1.5 text-[10px] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <Edit2 size={13} /> Edit
              </button>
              <button
                onClick={() => {
                  setSelectedPackage(pkg);
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

      <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

export default HajjPackages;