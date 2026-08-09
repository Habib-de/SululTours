import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Filter, RefreshCw, Eye, Edit2, Trash2,
  X, Save, Upload, Image as ImageIcon, Calendar, Users,
  MapPin, Clock, DollarSign, Star, TrendingUp, AlertCircle,
  CheckCircle, Globe, Compass, Camera, Tag, Percent,
  Download, Share2, Printer, FileImage, Archive  
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tourPackageService } from '../../services/api';
import html2canvas from 'html2canvas';

const TourPackages = ({ setActiveTab }) => {
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
  const [showPosterModal, setShowPosterModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantId, setTenantId] = useState(null);

  // Poster ref
  const posterRef = useRef(null);

  // Image upload refs
  const imageInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    destination: '',
    duration: '',
    price: '',
    description: '',
    inclusions: [],
    exclusions: [],
    itinerary: '',
    image: null,
    status: 'active',
    category: 'safari',
    maxGroupSize: 10,
    departureDates: [],
    difficulty: 'moderate',
    highlights: [],
    rating: 0,
    reviews: 0
  });

  const [editFormData, setEditFormData] = useState(null);

  // Categories
  const categories = [
    { value: 'safari', label: '🦁 Safari' },
    { value: 'beach', label: '🏖️ Beach' },
    { value: 'mountain', label: '🏔️ Mountain' },
    { value: 'cultural', label: '🎭 Cultural' },
    { value: 'adventure', label: '🧗 Adventure' },
    { value: 'wildlife', label: '🐘 Wildlife' },
    { value: 'hiking', label: '🥾 Hiking' },
    { value: 'city', label: '🏙️ City' }
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
    console.log('🔍 Loading tour packages with tenantId:', tenantToUse);
    
    if (!tenantToUse) {
      console.warn('⚠️ No tenantId available, skipping API call');
      setLoading(false);
      return;
    }
    
    // ✅ Fetch packages from API
    const response = await tourPackageService.getAll(tenantToUse);
    console.log('📊 Tour packages response:', response);
    
    let packagesData = [];
    if (response?.success && response?.data) {
      packagesData = response.data;
    } else if (Array.isArray(response)) {
      packagesData = response;
    }
    
    // ✅ Parse JSON fields and filter out empty strings
    const parsedPackages = packagesData.map(pkg => ({
      ...pkg,
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
    }));
    
    setPackages(parsedPackages);
    
    // ✅ Auto-archive expired packages
    setTimeout(() => {
      autoArchiveExpiredPackages(parsedPackages);
    }, 500);
    
  } catch (error) {
    console.error('Error loading tour packages:', error);
    showNotification('Error loading packages', 'error');
    loadFromLocalStorage();
  }
  
  setLoading(false);
};

  // ✅ Fallback to localStorage
  const loadFromLocalStorage = () => {
    console.warn('Loading tour packages from localStorage (fallback)');
    try {
      const storedPackages = JSON.parse(localStorage.getItem('travel_agency_tour_packages') || '[]');
      setPackages(storedPackages);
      setTimeout(() => {
        autoArchiveExpiredPackages(storedPackages);
      }, 500);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setPackages([]);
    }
  };

  // ✅ Auto-archive expired packages
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

  const generateId = () => {
    return `tour_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  };

  const resetForm = () => {
    setFormData({
      name: '',
      destination: '',
      duration: '',
      price: '',
      description: '',
      inclusions: [],
      exclusions: [],
      itinerary: '',
      image: null,
      status: 'active',
      category: 'safari',
      maxGroupSize: 10,
      departureDates: [],
      difficulty: 'moderate',
      highlights: [],
      rating: 0,
      reviews: 0
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
      // Edit mode - update editFormData
      setEditFormData(prev => ({ ...prev, image: imageData, images: imageData }));
    } else {
      // Create mode - update formData
      setFormData(prev => ({ ...prev, image: imageData }));
    }
    
    setImagePreview(imageData);
    showNotification('Image uploaded successfully!');
  };
  reader.readAsDataURL(file);
};

  const removeImage = () => {
  // ✅ Check if we're in edit mode or create mode
  if (editFormData) {
    setEditFormData(prev => ({ ...prev, image: null, images: null }));
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
  console.log('🔍 [DEBUG] handleAddDepartureDate called');
  
  const input = document.getElementById('departureDateInput');
  console.log('🔍 [DEBUG] Input element:', input);
  console.log('🔍 [DEBUG] Input value:', input?.value);
  
  if (!input || !input.value) {
    console.log('❌ [DEBUG] No date selected');
    showNotification('Please select a date first', 'error');
    return;
  }
  
  // Validate date
  const dateObj = new Date(input.value);
  console.log('🔍 [DEBUG] Parsed date:', dateObj);
  console.log('🔍 [DEBUG] Is valid date:', !isNaN(dateObj.getTime()));
  
  if (isNaN(dateObj.getTime())) {
    console.log('❌ [DEBUG] Invalid date');
    showNotification('Please select a valid date', 'error');
    return;
  }
  
  // Check if we're in edit mode or create mode
  console.log('🔍 [DEBUG] editFormData:', editFormData);
  console.log('🔍 [DEBUG] formData:', formData);
  console.log('🔍 [DEBUG] Is Edit Mode:', !!editFormData);
  
  if (editFormData) {
    // Edit mode - update editFormData
    console.log('📝 [DEBUG] EDIT MODE - Adding date to editFormData');
    const currentDates = editFormData.departureDates || [];
    console.log('🔍 [DEBUG] Current dates in edit:', currentDates);
    
    // Check for duplicate
    if (currentDates.includes(input.value)) {
      console.log('⚠️ [DEBUG] Duplicate date detected');
      showNotification('⚠️ This date is already added', 'error');
      return;
    }
    
    const newDates = [...currentDates, input.value];
    console.log('🔍 [DEBUG] New dates array:', newDates);
    
    setEditFormData(prev => {
      console.log('📝 [DEBUG] Updating editFormData with new dates');
      const updated = {
        ...prev,
        departureDates: newDates
      };
      console.log('🔍 [DEBUG] Updated editFormData:', updated);
      return updated;
    });
    
    showNotification('📅 Departure date added to package!');
  } else {
    // Create mode - update formData
    console.log('📝 [DEBUG] CREATE MODE - Adding date to formData');
    const currentDates = formData.departureDates || [];
    console.log('🔍 [DEBUG] Current dates in form:', currentDates);
    
    // Check for duplicate
    if (currentDates.includes(input.value)) {
      console.log('⚠️ [DEBUG] Duplicate date detected');
      showNotification('⚠️ This date is already added', 'error');
      return;
    }
    
    const newDates = [...currentDates, input.value];
    console.log('🔍 [DEBUG] New dates array:', newDates);
    
    setFormData(prev => {
      console.log('📝 [DEBUG] Updating formData with new dates');
      const updated = {
        ...prev,
        departureDates: newDates
      };
      console.log('🔍 [DEBUG] Updated formData:', updated);
      return updated;
    });
    
    showNotification('📅 Departure date added!');
  }
  
  // Clear the input
  input.value = '';
  console.log('✅ [DEBUG] Input cleared');
  console.log('====================================');
};

  const handleRemoveDepartureDate = (index) => {
  console.log('🔍 [DEBUG] handleRemoveDepartureDate called with index:', index);
  console.log('🔍 [DEBUG] editFormData:', editFormData);
  console.log('🔍 [DEBUG] formData:', formData);
  console.log('🔍 [DEBUG] Is Edit Mode:', !!editFormData);
  
  if (editFormData) {
    // Edit mode - update editFormData
    const currentDates = editFormData.departureDates || [];
    console.log('🔍 [DEBUG] Current dates in edit before removal:', currentDates);
    
    const newDates = currentDates.filter((_, i) => i !== index);
    console.log('🔍 [DEBUG] New dates after removal:', newDates);
    
    setEditFormData(prev => {
      console.log('📝 [DEBUG] Updating editFormData with filtered dates');
      const updated = {
        ...prev,
        departureDates: newDates
      };
      console.log('🔍 [DEBUG] Updated editFormData:', updated);
      return updated;
    });
    
    showNotification('🗑️ Departure date removed!');
  } else {
    // Create mode - update formData
    const currentDates = formData.departureDates || [];
    console.log('🔍 [DEBUG] Current dates in form before removal:', currentDates);
    
    const newDates = currentDates.filter((_, i) => i !== index);
    console.log('🔍 [DEBUG] New dates after removal:', newDates);
    
    setFormData(prev => {
      console.log('📝 [DEBUG] Updating formData with filtered dates');
      const updated = {
        ...prev,
        departureDates: newDates
      };
      console.log('🔍 [DEBUG] Updated formData:', updated);
      return updated;
    });
    
    showNotification('🗑️ Departure date removed!');
  }
  
  console.log('✅ [DEBUG] Removal complete');
  console.log('====================================');
};

  const handleAddInclusion = () => {
  const input = document.getElementById('inclusionInput');
  const value = input?.value?.trim();
  
  // ✅ Only add if value is not empty
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
  // Check if we're in edit mode or create mode
  if (editFormData) {
    // Edit mode - update editFormData
    const currentInclusions = editFormData.inclusions || [];
    const updated = currentInclusions.filter((_, i) => i !== index);
    setEditFormData(prev => ({ ...prev, inclusions: updated }));
  } else {
    // Create mode - update formData
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, i) => i !== index)
    }));
  }
};

  const handleAddHighlight = () => {
  const input = document.getElementById('highlightInput');
  const value = input?.value?.trim();
  
  // ✅ Only add if value is not empty
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
  // Check if we're in edit mode or create mode
  if (editFormData) {
    // Edit mode - update editFormData
    const currentHighlights = editFormData.highlights || [];
    const updated = currentHighlights.filter((_, i) => i !== index);
    setEditFormData(prev => ({ ...prev, highlights: updated }));
  } else {
    // Create mode - update formData
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
    // ✅ Filter out empty strings before stringifying
    const filteredInclusions = (formData.inclusions || []).filter(item => item && item.trim() !== '');
    const filteredHighlights = (formData.highlights || []).filter(item => item && item.trim() !== '');
    const filteredDepartureDates = (formData.departureDates || []).filter(item => item && item.trim() !== '');

    const newPackage = {
      name: formData.name,
      destination: formData.destination,
      duration: formData.duration,
      price: parseFloat(formData.price) || 0,
      description: formData.description || '',
      category: formData.category || 'safari',
      status: formData.status || 'active',
      maxGroupSize: parseInt(formData.maxGroupSize) || 10,
      difficulty: formData.difficulty || 'moderate',
      inclusions: JSON.stringify(filteredInclusions),
      exclusions: JSON.stringify((formData.exclusions || []).filter(item => item && item.trim() !== '')),
      itinerary: formData.itinerary || '',
      highlights: JSON.stringify(filteredHighlights),
      departureDates: JSON.stringify(filteredDepartureDates),
      images: formData.image || null,
      tenantId: tenantId
    };

    console.log('📤 Creating tour package:', newPackage);
    const response = await tourPackageService.create(newPackage);
    console.log('📥 Create response:', response);

    if (response?.success) {
      showNotification(`✅ Tour package "${formData.name}" created successfully!`);
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
      const updatedPackage = {
        name: editFormData.name,
        destination: editFormData.destination,
        duration: editFormData.duration,
        price: parseFloat(editFormData.price) || 0,
        description: editFormData.description || '',
        category: editFormData.category || 'safari',
        status: editFormData.status || 'active',
        maxGroupSize: parseInt(editFormData.maxGroupSize) || 10,
        difficulty: editFormData.difficulty || 'moderate',
        inclusions: JSON.stringify(editFormData.inclusions || []),
        exclusions: JSON.stringify(editFormData.exclusions || []),
        itinerary: editFormData.itinerary || '',
        highlights: JSON.stringify(editFormData.highlights || []),
        departureDates: JSON.stringify(editFormData.departureDates || []),
        images: editFormData.image || editFormData.images || null,
        tenantId: tenantId
      };

      console.log(`📤 Updating tour package ${editFormData.id}:`, updatedPackage);
      const response = await tourPackageService.update(editFormData.id, updatedPackage);
      console.log('📥 Update response:', response);

      if (response?.success) {
        showNotification(`✅ Tour package updated successfully!`);
        setShowEditModal(false);
        setEditFormData(null);
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
      console.log(`📤 Deleting tour package ${selectedPackage.id}`);
      const response = await tourPackageService.delete(selectedPackage.id);
      console.log('📥 Delete response:', response);

      if (response?.success) {
        showNotification(`✅ Tour package "${selectedPackage.name}" deleted successfully!`);
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
  setEditFormData({
    ...pkg,
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
    image: pkg.images || null,
    images: pkg.images || null
  });
  setImagePreview(pkg.images || null);
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
      safari: '🦁',
      beach: '🏖️',
      mountain: '🏔️',
      cultural: '🎭',
      adventure: '🧗',
      wildlife: '🐘',
      hiking: '🥾',
      city: '🏙️'
    };
    return icons[category] || '🌍';
  };

  const generatePoster = (pkg) => {
    setSelectedPackage(pkg);
    setShowPosterModal(true);
  };

  const downloadPoster = async () => {
  if (!posterRef.current) {
    showNotification('Poster not ready', 'error');
    return;
  }

  try {
    showNotification('📸 Generating poster...', 'info');
    
    const canvas = await html2canvas(posterRef.current, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#1a1a2e',
      logging: false,
      width: 600,
      height: 900, // Increased height to capture all content
      onclone: (document) => {
        // Ensure all images are loaded
        const images = document.querySelectorAll('img');
        return Promise.all(Array.from(images).map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }));
      }
    });
    
    const link = document.createElement('a');
    link.download = `${selectedPackage?.name?.replace(/\s+/g, '_') || 'poster'}.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
    
    showNotification('✅ Poster downloaded successfully!');
  } catch (error) {
    console.error('Error generating poster:', error);
    showNotification('Failed to generate poster', 'error');
  }
};

  // ✅ Render Form Modal (Create/Edit)
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
              {isEdit ? 'Edit Tour Package' : 'Create New Tour Package'}
            </h2>
            <p className={`text-sm ${isEdit ? 'text-blue-100' : 'text-green-100'}`}>
              {isEdit ? 'Update package details' : 'Add a new tour package'}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Basic Info */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label>
                <input
                  type="text"
                  name="name"
                  value={data.name || ''}
                  onChange={(e) => setData({ ...data, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Maasai Mara Safari Adventure"
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
                  placeholder="e.g., Maasai Mara, Kenya"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={data.category || 'safari'}
                  onChange={(e) => setData({ ...data, category: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration *</label>
                <input
                  type="text"
                  name="duration"
                  value={data.duration || ''}
                  onChange={(e) => setData({ ...data, duration: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 3 Days, 2 Nights"
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
                  placeholder="e.g., 45000"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  name="difficulty"
                  value={data.difficulty || 'moderate'}
                  onChange={(e) => setData({ ...data, difficulty: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {difficulties.map(diff => (
                    <option key={diff.value} value={diff.value}>{diff.label}</option>
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={data.description || ''}
                  onChange={(e) => setData({ ...data, description: e.target.value })}
                  rows="3"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Describe the tour experience..."
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
                  placeholder="Day 1: Arrival...\nDay 2: Game Drive...\nDay 3: Departure..."
                />
              </div>

              {/* Departure Dates */}
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
              </div>

              {/* Inclusions */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Inclusions</label>
                <div className="flex gap-2">
                  <input
                    id="inclusionInput"
                    type="text"
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Accommodation, Meals, Transport"
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

              {/* Highlights */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Highlights</label>
                <div className="flex gap-2">
                  <input
                    id="highlightInput"
                    type="text"
                    className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., Big Five Safari, Balloon Ride"
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

              {/* Image Upload */}
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

  // ✅ Render Delete Modal
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
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Tour Package?</h3>
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

  // ✅ Render Detail Modal
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

          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-white">{selectedPackage.name}</h2>
            <p className="text-blue-100 text-sm">{selectedPackage.destination}</p>
          </div>

          <div className="p-6">
            {selectedPackage.images && (
              <div className="mb-4">
                <img src={selectedPackage.images} alt={selectedPackage.name} className="w-full h-48 object-cover rounded-lg" />
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
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {getCategoryIcon(selectedPackage.category)} {selectedPackage.category?.toUpperCase()}
              </span>
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                {selectedPackage.difficulty?.toUpperCase()}
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
            <button 
              onClick={() => {
                setShowDetailModal(false);
                generatePoster(selectedPackage);
              }}
              className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:from-yellow-600 hover:to-yellow-700 text-sm flex items-center gap-2"
            >
              <FileImage size={16} /> Poster
            </button>
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

  // ✅ Render Poster Modal (same as before)
  const renderPosterModal = () => {
    if (!showPosterModal || !selectedPackage) return null;

    const pkg = selectedPackage;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowPosterModal(false)}></div>
        <div className="relative bg-transparent max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <button 
            onClick={() => setShowPosterModal(false)}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10 text-white"
          >
            <X size={24} />
          </button>
          
          <div className="flex flex-col items-center">
            {/* Poster Preview */}
            <div 
              ref={posterRef}
              className="w-full max-w-[600px] mx-auto rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20"
            >
              <div className="bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] text-white p-6">
                {/* Header */}
                {/* Header with Logo - Full Width White Background */}
<div className="border-b-4 border-yellow-500/30 pb-4 mb-4">
  <div className="flex flex-col items-center">
    {/* Full width white background container */}
    <div className="bg-white/95 w-full py-4 px-6 rounded-lg shadow-xl mb-3 border border-yellow-400/30">
      <div className="flex justify-center">
        <img 
          src="/lg1.png" 
          alt="Sulul Tours Logo" 
          className="w-32 h-auto object-contain"
          onError={(e) => {
            e.target.style.display = 'none';
            // Fallback if image fails
            const parent = e.target.parentElement;
            parent.innerHTML = `
              <h1 className="text-2xl font-bold text-amber-600">SULUL TOURS</h1>
            `;
          }}
        />
      </div>
    </div>
    {/* <h1 className="text-2xl font-bold text-center text-yellow-400">SULUL TOURS</h1>
    <p className="text-center text-yellow-400/50 text-sm">Travel & Adventure</p> */}
  </div>
</div>
                
                {/* Image */}
                {pkg.images && (
                  <div className="mb-4 rounded-xl overflow-hidden border-2 border-yellow-500/30">
                    <img src={pkg.images} alt={pkg.name} className="w-full h-64 object-cover" />
                  </div>
                )}
                
                {/* Package Info */}
                <div className="text-center mb-4">
                  <h2 className="text-2xl font-bold">{pkg.name}</h2>
                  <p className="text-yellow-400 text-lg">📍 {pkg.destination}</p>
                </div>
                
                {/* Details Grid */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-2xl">🕐</div>
                    <div className="text-xs text-white/50">Duration</div>
                    <div className="font-semibold text-sm">{pkg.duration}</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-2xl">👥</div>
                    <div className="text-xs text-white/50">Group</div>
                    <div className="font-semibold text-sm">{pkg.maxGroupSize || 10} people</div>
                  </div>
                  <div className="bg-white/5 rounded-xl p-3 text-center">
                    <div className="text-2xl">💰</div>
                    <div className="text-xs text-white/50">Price</div>
                    <div className="font-semibold text-sm text-yellow-400">KSh {(pkg.price || 0).toLocaleString()}</div>
                  </div>
                </div>

                {/* Departure Dates */}
                {pkg.departureDates && pkg.departureDates.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-3 mb-4">
                    <p className="text-yellow-400 font-semibold text-sm mb-2">📅 Available Dates</p>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {pkg.departureDates.slice(0, 6).map((date, index) => {
                        const endDate = calculateEndDate(date, pkg.duration);
                        return (
                          <span key={index} className="text-[10px] text-white/80 bg-white/10 px-2 py-0.5 rounded">
                            {formatDateSafe(date)}
                            {endDate && ` → ${formatDateSafe(endDate)}`}
                          </span>
                        );
                      })}
                      {pkg.departureDates.length > 6 && (
                        <span className="text-[10px] text-white/50">+{pkg.departureDates.length - 6} more</span>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Highlights */}
                {pkg.highlights && pkg.highlights.length > 0 && (
                  <div className="bg-white/5 rounded-xl p-3 mb-4">
                    <p className="text-yellow-400 font-semibold text-sm mb-2">⭐ Highlights</p>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {pkg.highlights.slice(0, 4).map((item, index) => (
                        <span key={index} className="text-white/80">• {item}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Category & Difficulty */}
                <div className="flex gap-2 mb-4 justify-center flex-wrap">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                    {getCategoryIcon(pkg.category)} {pkg.category?.toUpperCase()}
                  </span>
                  <span className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-xs">
                    {pkg.difficulty?.toUpperCase()}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadge(pkg.status).color}`}>
                    {getStatusBadge(pkg.status).label}
                  </span>
                </div>
                
                {/* Description */}
                <p className="text-xs text-white/70 text-center mb-4 line-clamp-3">
                  {pkg.description}
                </p>
                
                {/* Footer */}
                <div className="border-t border-yellow-500/20 pt-3 text-center">
                  <p className="text-yellow-400 text-sm font-semibold">📞 Book Now: +254 725 418 081</p>
                  <p className="text-white/30 text-[10px]">📧 sulultoursandtravel@gmail.com</p>
                  <p className="text-white/20 text-[8px] mt-1">© 2026 Sulul Tours & Travel</p>
                </div>
              </div>
            </div>
            
            {/* Download Button */}
            <button
              onClick={downloadPoster}
              className="mt-6 px-8 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-yellow-700 transition-all flex items-center gap-3 shadow-lg"
            >
              <Download size={20} /> Download Poster (PNG)
            </button>
            
            <button
              onClick={() => setShowPosterModal(false)}
              className="mt-3 px-6 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-sm"
            >
              Close
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
      pkg.category?.toLowerCase().includes(searchLower);
    const matchesFilter = filterStatus === 'all' || pkg.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Stats
  const totalPackages = packages.length;
  const activePackages = packages.filter(p => p.status === 'active').length;
  const draftPackages = packages.filter(p => p.status === 'draft').length;
  const archivedPackages = packages.filter(p => p.status === 'archived').length;

  const statsCards = [
    { title: 'Total Packages', value: totalPackages, icon: Compass, color: 'text-blue-600', bg: 'bg-blue-50', filter: 'all' },
    { title: 'Active', value: activePackages, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', filter: 'active' },
    { title: 'Draft', value: draftPackages, icon: AlertCircle, color: 'text-yellow-600', bg: 'bg-yellow-50', filter: 'draft' },
    { title: 'Archived', value: archivedPackages, icon: Archive, color: 'text-gray-600', bg: 'bg-gray-50', filter: 'archived' }
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
      {renderPosterModal()}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Compass size={28} className="text-blue-600" />
            Tour Packages
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage adventure and wildlife tour packages</p>
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
      onClick={() => {
        setFilterStatus(stat.filter);
        if (stat.filter === 'all') {
          showNotification(`📦 Showing all packages (${stat.value})`, 'info');
        } else {
          showNotification(`📦 Showing ${stat.title.toLowerCase()} packages (${stat.value})`, 'info');
        }
      }}
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

      {/* Search & Filter */}
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

      {/* Packages Grid */}
      {/* Packages Grid */}
{loading ? (
  <div className="text-center py-12 text-gray-400">Loading packages...</div>
) : filteredPackages.length === 0 ? (
  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
    <Compass size={48} className="mx-auto text-gray-300 mb-3" />
    <p className="text-gray-500">No tour packages found</p>
    <p className="text-sm text-gray-400">
      {searchQuery ? 'Try adjusting your search' : 'Create your first tour package by clicking "New Package"'}
    </p>
    <button
      onClick={() => setShowCreateModal(true)}
      className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
    >
      <Plus size={16} className="inline mr-1" /> New Package
    </button>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto">
    {filteredPackages.map((pkg) => {
      const statusBadge = getStatusBadge(pkg.status);
      return (
        <div key={pkg.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
          {pkg.images && (
            <div className="h-56 overflow-hidden">
              <img src={pkg.images} alt={pkg.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
            </div>
          )}
          <div className="p-4">
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
              <span className="flex items-center gap-1 font-semibold text-blue-600">
                <DollarSign size={12} /> KSh {pkg.price?.toLocaleString()}
              </span>
            </div>

            {/* Departure Dates + Category + Difficulty + Badges ALL in one row */}
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
              <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-600 rounded">
                {getCategoryIcon(pkg.category)} {pkg.category}
              </span>

              {/* Difficulty */}
              {pkg.difficulty && (
                <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                  {pkg.difficulty}
                </span>
              )}

              {/* Accommodation */}
              {pkg.accommodation && (
                <span className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-600 rounded">
                  🏨 {pkg.accommodation}
                </span>
              )}

              {/* Meals */}
              {pkg.meals && (
                <span className="text-[10px] px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded">
                  🍽️ {pkg.meals}
                </span>
              )}

              {/* Transport */}
              {pkg.transport && (
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded">
                  🚌 {pkg.transport}
                </span>
              )}
            </div>

            {/* Action Buttons - Compact with less padding */}
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
                onClick={() => generatePoster(pkg)}
                className="flex-1 px-2 py-1.5 text-[10px] text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                <FileImage size={13} /> Poster
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

      {/* Footer */}
      <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

export default TourPackages;