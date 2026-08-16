import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Search, Filter, RefreshCw, 
  Eye, CheckCircle, XCircle, Clock, 
  AlertCircle, User, Car, DollarSign,
  MapPin, Phone, Mail, Edit2, Trash2, Plus,
  X, Save, Percent, Tag, CreditCard,
  Wallet, Building, Upload, Camera,
  Calendar as CalendarIcon, Clock as ClockIcon,
  Receipt, ChevronLeft, ChevronRight, FileText  
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingService, vehicleService, carOwnerService } from '../../services/api';

// Helper to format date with time
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateString;
  }
};

// Helper to generate booking reference
const generateReference = () => {
  return 'BK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
};

const CarBookings = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [carOwners, setCarOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantId, setTenantId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    mpesaCode: '',
    notes: ''
  });

  // Image upload refs
  const idImageRef = useRef(null);
  const licenseImageRef = useRef(null);
  const vehicleImageRef = useRef(null);
  const editIdImageRef = useRef(null);
  const editLicenseImageRef = useRef(null);
  const editVehicleImageRef = useRef(null);

  // Form state for creating booking
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerIdNumber: '',
    customerLicenseNumber: '',
    customerIdImage: null,
    customerLicenseImage: null,
    vehicleId: '',
    startDate: '',
    startTime: '08:00',
    endDate: '',
    endTime: '18:00',
    notes: '',
    bookingFee: '',
    days: 0,
    discountType: 'NONE',
    discountValue: '',
    discountAmount: 0,
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    mpesaCode: '',
    paidAmount: 0,
    remainingBalance: 0,
    vehicleConditionImages: []
  });

  const [editFormData, setEditFormData] = useState({
  customerName: '',
  customerEmail: '',
  customerPhone: '',
  customerIdNumber: '',
  customerLicenseNumber: '',
  customerIdImage: null,
  customerLicenseImage: null,
  vehicleId: '',
  startDate: '',
  startTime: '08:00',
  endDate: '',
  endTime: '18:00',
  notes: '',
  bookingFee: '',
  days: 0,
  discountType: 'NONE',
  discountValue: '',
  discountAmount: 0,
  paymentMethod: 'CASH',
  paymentStatus: 'PENDING',
  mpesaCode: '',
  paidAmount: 0,
  remainingBalance: 0,
  vehicleConditionImages: []
});

  // Preview images
  const [idImagePreview, setIdImagePreview] = useState(null);
  const [licenseImagePreview, setLicenseImagePreview] = useState(null);
  const [vehicleImagePreviews, setVehicleImagePreviews] = useState([]);
  const [calculatedSubtotal, setCalculatedSubtotal] = useState(0);
  const [calculatedCommission, setCalculatedCommission] = useState(0);
  const [selectedVehicleRate, setSelectedVehicleRate] = useState(0);

  // ✅ ADD THIS useEffect HERE - Auto-recalculate days when dates change in CREATE modal
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      // Check if end date is before start date
      if (end < start) {
        showNotification('⚠️ End date must be on or after start date', 'error');
        return;
      }
      
      const days = calculateDays(formData.startDate, formData.endDate);
      
      setFormData(prev => ({ 
        ...prev, 
        days 
      }));
      
      // Recalculate pricing if vehicle is selected
      if (formData.vehicleId && days > 0) {
        const vehicle = vehicles.find(v => v.id === formData.vehicleId);
        if (vehicle) {
          const pricePerDay = parseFloat(vehicle.pricePerDay) || 0;
          const subtotal = pricePerDay * days;
          setSelectedVehicleRate(pricePerDay);
          setCalculatedSubtotal(subtotal);
          
          if (!formData.bookingFee) {
  // ✅ Calculate discount correctly
  let discountAmount = 0;
  if (formData.discountType === 'PERCENTAGE') {
    discountAmount = (subtotal * parseFloat(formData.discountValue || 0)) / 100;
  } else if (formData.discountType === 'FIXED') {
    discountAmount = parseFloat(formData.discountValue || 0) * days;
  }
  
  const finalTotal = subtotal - discountAmount;
  const dailyRateAfterDiscount = finalTotal / days;
  
  setFormData(prev => ({ 
    ...prev, 
    bookingFee: dailyRateAfterDiscount.toString(), // ✅ Show daily rate, not total
    discountAmount: discountAmount,
    remainingBalance: finalTotal
  }));
  setCalculatedCommission(0);
} else {
            const enteredFee = parseFloat(formData.bookingFee) || 0;
            const discount = calculateDiscount(subtotal, formData.discountType, formData.discountValue, days);  
            const expectedAfterDiscount = subtotal - discount;
            
            let finalTotal = 0;
            if (enteredFee > 0 && pricePerDay > 0) {
              if (Math.abs(enteredFee - pricePerDay) / pricePerDay < 0.5) {
                finalTotal = enteredFee * days;
              } else {
                finalTotal = enteredFee;
              }
            } else {
              finalTotal = expectedAfterDiscount;
            }
            
            const commission = finalTotal - expectedAfterDiscount;
            setFormData(prev => ({ 
              ...prev, 
              remainingBalance: finalTotal,
              totalPriceDisplay: finalTotal
            }));
            setCalculatedCommission(commission);
          }
        }
      }
    }
  }, [formData.startDate, formData.endDate, formData.vehicleId]); // ✅ Re-run when these change

  // ✅ ADD THIS useEffect HERE - Auto-recalculate days when dates change in EDIT modal
  useEffect(() => {
    if (editFormData.startDate && editFormData.endDate) {
      const start = new Date(editFormData.startDate);
      const end = new Date(editFormData.endDate);
      
      // Check if end date is before start date
      if (end < start) {
        showNotification('⚠️ End date must be on or after start date', 'error');
        return;
      }
      
      const days = calculateDays(editFormData.startDate, editFormData.endDate);
      
      setEditFormData(prev => ({ 
        ...prev, 
        days 
      }));
      
      // Recalculate pricing if vehicle is selected
      if (editFormData.vehicleId && days > 0) {
        const vehicle = vehicles.find(v => v.id === editFormData.vehicleId);
        if (vehicle) {
          const pricePerDay = parseFloat(vehicle.pricePerDay) || 0;
          const subtotal = pricePerDay * days;
          const discount = calculateDiscount(subtotal, editFormData.discountType, editFormData.discountValue, days);
          const finalTotal = subtotal - discount;
          
          setEditFormData(prev => ({
            ...prev,
            bookingFee: prev.bookingFee || (finalTotal / days).toString(),
            subtotal: subtotal,
            totalPrice: finalTotal,
            remainingBalance: finalTotal - (prev.paidAmount || 0)
          }));
        }
      }
    }
  }, [editFormData.startDate, editFormData.endDate, editFormData.vehicleId]); // ✅ Re-run when these change


  useEffect(() => {
  const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
  const tid = userData?.tenantId || null;
  console.log('🔍 Tenant ID from localStorage:', tid);
  setTenantId(tid);
  
  // ✅ Pass tenantId directly to load function
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
    console.log('🔍 Loading car bookings data with tenantId:', tenantToUse);
    
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

    // ✅ 2. Load car owners
    const ownersResponse = await carOwnerService.getAll(tenantToUse);
    console.log('📊 Car owners response:', ownersResponse);
    let ownersData = [];
    if (ownersResponse?.success && ownersResponse?.data) {
      ownersData = ownersResponse.data;
    } else if (Array.isArray(ownersResponse)) {
      ownersData = ownersResponse;
    }
    setCarOwners(ownersData);

    // ✅ 3. Load bookings
    const bookingsResponse = await bookingService.getAll(tenantToUse);
    console.log('📊 Bookings response:', bookingsResponse);
    let bookingsData = [];
    if (bookingsResponse?.success && bookingsResponse?.data) {
      bookingsData = bookingsResponse.data;
    } else if (Array.isArray(bookingsResponse)) {
      bookingsData = bookingsResponse;
    }
    
    // ✅ Filter only car hire bookings
    const carBookings = bookingsData.filter(b => {
      const serviceType = b.serviceType || b.service_type || 'car_hire';
      return serviceType === 'car_hire' || serviceType === 'car';
    });
    
    console.log(`📊 Loaded ${carBookings.length} car bookings`);
    setBookings(carBookings);
    
  } catch (error) {
    console.error('Error loading data:', error);
    showNotification('Error loading bookings', 'error');
    loadFromLocalStorage();
  }
  
  setLoading(false);
};

  // Fallback to localStorage
  const loadFromLocalStorage = () => {
    try {
      const storedBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      const guestBookings = JSON.parse(localStorage.getItem('travel_agency_guest_bookings') || '[]');
      
      const bookingMap = new Map();
      storedBookings.forEach(b => bookingMap.set(b.id, b));
      guestBookings.forEach(b => bookingMap.set(b.id, b));
      
      const allBookings = Array.from(bookingMap.values());
      const carBookings = allBookings.filter(b => {
        const serviceType = b.serviceType || b.service_type || 'car_hire';
        return serviceType === 'car_hire' || serviceType === 'car';
      });
      
      setBookings(carBookings);
      
      const storedVehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
      setVehicles(storedVehicles);
      
      const storedOwners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
      setCarOwners(storedOwners);
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerIdNumber: '',
      customerLicenseNumber: '',
      customerIdImage: null,
      customerLicenseImage: null,
      vehicleId: '',
      startDate: '',
      startTime: '08:00',
      endDate: '',
      endTime: '18:00',
      notes: '',
      bookingFee: '',
      days: 0,
      discountType: 'NONE',
      discountValue: '',
      discountAmount: 0,
      paymentMethod: 'CASH',
      paymentStatus: 'PENDING',
      mpesaCode: '',
      paidAmount: 0,
      remainingBalance: 0,
      vehicleConditionImages: []
    });
    setIdImagePreview(null);
    setLicenseImagePreview(null);
    setVehicleImagePreviews([]);
    setCalculatedSubtotal(0);
    setCalculatedCommission(0);
    setSelectedVehicleRate(0);
    setPaymentForm({ amount: '', paymentMethod: 'CASH', mpesaCode: '', notes: '' });
  };

  const handleImageUpload = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      
      if (type === 'id') {
        setFormData(prev => ({ ...prev, customerIdImage: imageData }));
        setIdImagePreview(imageData);
      } else if (type === 'license') {
        setFormData(prev => ({ ...prev, customerLicenseImage: imageData }));
        setLicenseImagePreview(imageData);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVehicleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    const newPreviews = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        newImages.push(imageData);
        newPreviews.push(imageData);
        
        if (newImages.length === files.length) {
          setFormData(prev => ({
            ...prev,
            vehicleConditionImages: [...prev.vehicleConditionImages, ...newImages]
          }));
          setVehicleImagePreviews(prev => [...prev, ...newPreviews]);
                    setEditFormData(prev => ({
            ...prev,
            vehicleConditionImages: [...prev.vehicleConditionImages, ...newImages]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeVehicleImage = (index) => {
    setFormData(prev => ({
      ...prev,
      vehicleConditionImages: prev.vehicleConditionImages.filter((_, i) => i !== index)
    }));
    setVehicleImagePreviews(prev => prev.filter((_, i) => i !== index));
        setEditFormData(prev => ({
      ...prev,
      vehicleConditionImages: prev.vehicleConditionImages.filter((_, i) => i !== index)
    }));
  };

  // Edit modal image handlers
const handleEditIdImageUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const imageData = event.target.result;
    setEditFormData(prev => ({ ...prev, customerIdImage: imageData }));
  };
  reader.readAsDataURL(file);
};

const handleEditLicenseImageUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const imageData = event.target.result;
    setEditFormData(prev => ({ ...prev, customerLicenseImage: imageData }));
  };
  reader.readAsDataURL(file);
};

const handleEditVehicleImageUpload = (e) => {
  const files = Array.from(e.target.files);
  const newImages = [];

  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target.result;
      newImages.push(imageData);
      
      if (newImages.length === files.length) {
        setEditFormData(prev => ({
          ...prev,
          vehicleConditionImages: [...prev.vehicleConditionImages, ...newImages]
        }));
      }
    };
    reader.readAsDataURL(file);
  });
};

const removeEditVehicleImage = (index) => {
  setEditFormData(prev => {
    let images = prev.vehicleConditionImages;
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch (e) {
        images = [];
      }
    }
    if (!Array.isArray(images)) {
      images = [];
    }
    return {
      ...prev,
      vehicleConditionImages: images.filter((_, i) => i !== index)
    };
  });
};

  const calculateDays = (start, end) => {
  if (!start || !end) return 0;
  
  // Parse dates simply - split the string
  const startParts = start.split('-');
  const endParts = end.split('-');
  
  if (startParts.length !== 3 || endParts.length !== 3) return 0;
  
  // Create dates WITHOUT timezone
  const startDate = new Date(
    parseInt(startParts[0]), 
    parseInt(startParts[1]) - 1, 
    parseInt(startParts[2])
  );
  const endDate = new Date(
    parseInt(endParts[0]), 
    parseInt(endParts[1]) - 1, 
    parseInt(endParts[2])
  );
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 0;
  
  const diffTime = endDate.getTime() - startDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));  // ✅ Math.ceil() instead of Math.round()
  
  return Math.max(diffDays, 1);
};

  const calculateDiscount = (subtotal, type, value, days = 1) => {
  if (type === 'NONE' || !value) return 0;
  if (type === 'PERCENTAGE') {
    return (subtotal * parseFloat(value)) / 100;
  }
  if (type === 'FIXED') {
    return parseFloat(value) * days;  // ✅ 'days' is now defined
  }
  return 0;
};

  const handleDateChange = () => {
  // ✅ ADD THIS VALIDATION AT THE START
  if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      
      if (end <= start) {
          showNotification('⚠️ End date must be after start date', 'error');
          const nextDay = new Date(start);
          nextDay.setDate(nextDay.getDate() + 1);
          const nextDayStr = nextDay.toISOString().split('T')[0];
          setFormData(prev => ({ 
              ...prev, 
              endDate: nextDayStr,
              days: 1 
          }));
          return;
      }
  }
  const days = calculateDays(formData.startDate, formData.endDate);
  setFormData(prev => ({ ...prev, days }));
  
  if (formData.vehicleId && days > 0) {
    const vehicle = vehicles.find(v => v.id === formData.vehicleId);
    if (vehicle) {
      const pricePerDay = parseFloat(vehicle.pricePerDay) || 0;
      const subtotal = pricePerDay * days;
      setSelectedVehicleRate(pricePerDay);
      setCalculatedSubtotal(subtotal);
      
      if (!formData.bookingFee) {
        // ✅ Pass days to calculateDiscount
        const discount = calculateDiscount(subtotal, formData.discountType, formData.discountValue, days);
        const finalTotal = subtotal - discount;
        const dailyRateAfterDiscount = finalTotal / days;
        setFormData(prev => ({ 
          ...prev, 
          bookingFee: dailyRateAfterDiscount.toString(),  // ✅ Show daily rate
          discountAmount: discount,
          remainingBalance: finalTotal
        }));
        setCalculatedCommission(0);
      } else {
        const enteredFee = parseFloat(formData.bookingFee) || 0;
        // ✅ Pass days to calculateDiscount
        const discount = calculateDiscount(subtotal, formData.discountType, formData.discountValue, days);
        const expectedAfterDiscount = subtotal - discount;
        
        let finalTotal = 0;
        if (enteredFee > 0 && pricePerDay > 0) {
          if (Math.abs(enteredFee - pricePerDay) / pricePerDay < 0.5) {
            finalTotal = enteredFee * days;
          } else {
            finalTotal = enteredFee;
          }
        } else {
          finalTotal = expectedAfterDiscount;
        }
        
        const commission = finalTotal - expectedAfterDiscount;
        setFormData(prev => ({ 
          ...prev, 
          remainingBalance: finalTotal
        }));
        setCalculatedCommission(commission);
      }
    }
  }
};

  const handleBookingFeeChange = (value) => {
  if (!value || value === '') {
    setFormData(prev => ({ ...prev, bookingFee: '', remainingBalance: 0 }));
    setCalculatedCommission(0);
    return;
  }

  const enteredFee = parseFloat(value);
  const days = formData.days || 1;
  const vehicle = vehicles.find(v => v.id === formData.vehicleId);
  const pricePerDay = parseFloat(vehicle?.pricePerDay) || 0;
  
  const expectedPrice = pricePerDay * days;
  // ✅ Pass days to calculateDiscount
  const discount = calculateDiscount(expectedPrice, formData.discountType, formData.discountValue, days);
  const expectedAfterDiscount = expectedPrice - discount;
  
  const finalTotal = enteredFee * days;
  const commission = Math.max(0, finalTotal - expectedAfterDiscount);
  
  setFormData(prev => ({ 
    ...prev, 
    bookingFee: value, 
    remainingBalance: finalTotal,
    totalPriceDisplay: finalTotal
  }));
  setCalculatedCommission(commission);
};

  const handleDiscountChange = (type, value) => {
  const vehicle = vehicles.find(v => v.id === formData.vehicleId);
  const days = formData.days || 1;
  const pricePerDay = parseFloat(vehicle?.pricePerDay) || 0;
  const subtotal = pricePerDay * days;
  
  // ✅ Calculate discount correctly
  let discountAmount = 0;
  if (type === 'PERCENTAGE') {
    discountAmount = (subtotal * parseFloat(value)) / 100;
  } else if (type === 'FIXED') {
    // ✅ FIXED discount is per day, so multiply by days
    discountAmount = parseFloat(value) * days;
  }
  
  const finalTotal = subtotal - discountAmount;
  
  setFormData(prev => ({
    ...prev,
    discountType: type,
    discountValue: value || '',
    discountAmount: discountAmount,
    bookingFee: (finalTotal / days).toString(), // ✅ Show daily rate after discount
    remainingBalance: finalTotal
  }));
  setCalculatedCommission(0);
};

  const handleVehicleSelect = (vehicleId) => {
  if (!vehicleId) {
    setFormData(prev => ({ ...prev, vehicleId: '' }));
    return;
  }
  
  // ✅ Check if vehicle is available for the selected dates
  const isAvailable = isVehicleAvailableForDates(
    vehicleId, 
    formData.startDate, 
    formData.endDate
  );
  
  if (!isAvailable) {
    // Find the conflicting bookings
    const conflicts = getOverlappingBookings(vehicleId, formData.startDate, formData.endDate);
    let conflictMessage = '❌ This vehicle is not available for the selected dates.';
    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      conflictMessage = `❌ This vehicle is booked from ${formatDateTime(conflict.startDate)} to ${formatDateTime(conflict.endDate)}. Please choose different dates or another vehicle.`;
    }
    showNotification(conflictMessage, 'error');
    setFormData(prev => ({ ...prev, vehicleId: '' }));
    return;
  }
  
  const vehicle = vehicles.find(v => v.id === vehicleId);
  const days = formData.days || 1;
  const pricePerDay = parseFloat(vehicle?.pricePerDay) || 0;
  const subtotal = pricePerDay * days;
  // ✅ Pass days to calculateDiscount
  const discount = calculateDiscount(subtotal, formData.discountType, formData.discountValue, days);
  const bookingFee = subtotal - discount;
  
  setSelectedVehicleRate(pricePerDay);
  setCalculatedSubtotal(subtotal);
  
  setFormData(prev => ({ 
    ...prev, 
    vehicleId,
    bookingFee: bookingFee.toString(),
    discountAmount: discount,
    remainingBalance: bookingFee
  }));
  setCalculatedCommission(0);
};

  const validateMpesaCode = (code) => {
    return code && code.length >= 6;
  };

  // ✅ NEW: Check if vehicle is available for specific dates (date-aware)
const isVehicleAvailableForDates = (vehicleId, startDate, endDate) => {
    if (!startDate || !endDate) return true; // No dates selected yet
    
    // Parse the dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // // Check if start date is in the past
    // const today = new Date();
    // today.setHours(0, 0, 0, 0);
    // if (start < today) {
    //     return false; // Can't book in the past
    // }
    
    // Check if end date is after start date
    if (end < start) {
        return false;
    }
    
    // Check for overlapping bookings (date-aware)
    return !bookings.some(b => 
        b.vehicleId === vehicleId &&
        (b.status === 'pending' || b.status === 'confirmed') &&
        // Check if dates overlap
        new Date(b.startDate) < end &&
        new Date(b.endDate) > start
    );
};

// ✅ NEW: Get overlapping bookings for a vehicle
const getOverlappingBookings = (vehicleId, startDate, endDate) => {
    if (!startDate || !endDate) return [];
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return bookings.filter(b => 
        b.vehicleId === vehicleId &&
        (b.status === 'pending' || b.status === 'confirmed') &&
        new Date(b.startDate) < end &&
        new Date(b.endDate) > start
    );
};

// ✅ NEW: Get available vehicles for the selected dates
const getAvailableVehiclesForDates = (startDate, endDate) => {
    if (!startDate || !endDate) return vehicles.filter(v => v.status === 'active');
    
    return vehicles.filter(v => 
        v.status === 'active' && 
        isVehicleAvailableForDates(v.id, startDate, endDate)
    );
};

  const getVehicleDetails = (vehicleId) => {
    return vehicles.find(v => v.id === vehicleId);
  };

  const getOwnerDetails = (ownerId) => {
    return carOwners.find(o => o.id === ownerId);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { label: '📌 Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      completed: { label: '✅ Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { label: '❌ Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    return statusMap[status] || { label: status || 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock };
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      PAID: { label: '✅ Paid', color: 'bg-green-100 text-green-800' },
      PENDING: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800' },
      PARTIAL: { label: '🔄 Partial', color: 'bg-blue-100 text-blue-800' }
    };
    return statusMap[status] || { label: status || 'Pending', color: 'bg-gray-100 text-gray-800' };
  };

  const getPaymentMethodIcon = (method) => {
    const methodMap = {
      CASH: <DollarSign size={14} className="text-green-600" />,
      M_PESA: <CreditCard size={14} className="text-blue-600" />,
      BANK_TRANSFER: <Building size={14} className="text-purple-600" />,
      CREDIT: <Wallet size={14} className="text-orange-600" />
    };
    return methodMap[method] || <DollarSign size={14} className="text-gray-400" />;
  };

  const getStatusDot = (status) => {
    const dotMap = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return dotMap[status] || 'bg-gray-400';
  };

  const handleCreateBooking = async () => {
  if (!formData.customerName) {
    showNotification('Please enter customer name', 'error');
    return;
  }
  
  if (!formData.vehicleId) {
    showNotification('Please select a vehicle', 'error');
    return;
  }
  
  if (!formData.startDate || !formData.endDate) {
    showNotification('Please select start and end dates', 'error');
    return;
  }

  //  // ✅ CHECK IF START DATE IS IN THE PAST
  // const start = new Date(formData.startDate);
  // const today = new Date();
  // today.setHours(0, 0, 0, 0);
  // if (start < today) {
  //   showNotification('⚠️ Start date cannot be in the past', 'error');
  //   return;
  // }

  // ✅ CHECK IF END DATE IS AFTER START DATE
const start = new Date(formData.startDate);  // ✅ ADD THIS LINE BACK
const end = new Date(formData.endDate);
if (end < start) {
  showNotification('⚠️ End date must be on or after start date', 'error');
  return;
}

  // ✅ ADD THIS AVAILABILITY CHECK RIGHT HERE
  const startDateTime = `${formData.startDate}T${formData.startTime || '08:00'}`;
  const endDateTime = `${formData.endDate}T${formData.endTime || '18:00'}`;
  
  const isAvailable = isVehicleAvailableForDates(
    formData.vehicleId,
    startDateTime,
    endDateTime
  );
  
  if (!isAvailable) {
    const conflicts = getOverlappingBookings(
      formData.vehicleId,
      startDateTime,
      endDateTime
    );
    let conflictMessage = '❌ This vehicle is not available for the selected dates.';
    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      conflictMessage = `❌ This vehicle is booked from ${formatDateTime(conflict.startDate)} to ${formatDateTime(conflict.endDate)}. Please choose different dates or another vehicle.`;
    }
    showNotification(conflictMessage, 'error');
    return;
  }

  if (formData.paymentMethod === 'M_PESA') {
    if (!formData.mpesaCode || !validateMpesaCode(formData.mpesaCode)) {
      showNotification('Please enter a valid M-Pesa transaction code (at least 6 characters)', 'error');
      return;
    }
  }

  setIsSubmitting(true);

  try {
    const startDateTime = `${formData.startDate}T${formData.startTime || '08:00'}`;
    const endDateTime = `${formData.endDate}T${formData.endTime || '18:00'}`;

    const vehicle = vehicles.find(v => v.id === formData.vehicleId);
    const owner = carOwners.find(o => o.id === vehicle?.ownerId);
    const pricePerDay = parseFloat(vehicle?.pricePerDay) || 0;
    const days = formData.days || calculateDays(formData.startDate, formData.endDate);
    
    const expectedPrice = pricePerDay * days;
    const discountAmount = formData.discountAmount || 0;
    const expectedAfterDiscount = expectedPrice - discountAmount;
    
    let finalTotal = 0;
    if (formData.bookingFee) {
      const enteredFee = parseFloat(formData.bookingFee);
      finalTotal = enteredFee * days;
    } else {
      finalTotal = expectedAfterDiscount;
    }
    
    // ✅ Commission should NEVER be negative
    const commission = Math.max(0, finalTotal - expectedAfterDiscount);

    let paidAmount = 0;
    let remainingBalance = finalTotal;
    let paymentStatus = formData.paymentStatus;

    if (formData.paymentMethod === 'CREDIT') {
      paidAmount = 0;
      remainingBalance = finalTotal;
      paymentStatus = 'PENDING';
    } else if (formData.paymentMethod === 'M_PESA' || formData.paymentMethod === 'CASH') {
      paidAmount = finalTotal;
      remainingBalance = 0;
      paymentStatus = 'PAID';
    }

    // ✅ Convert dates to proper ISO format
    const startDateISO = startDateTime;
    const endDateISO = endDateTime;

    const newBooking = {
      reference: generateReference(),
      customerName: formData.customerName,
      customerEmail: formData.customerEmail || '',
      customerPhone: formData.customerPhone || '',
      customerIdNumber: formData.customerIdNumber || '',
      customerLicenseNumber: formData.customerLicenseNumber || '',
      customerIdImage: formData.customerIdImage || null,
      customerLicenseImage: formData.customerLicenseImage || null,
      vehicleId: formData.vehicleId,
      vehicleRegistration: vehicle?.registration || '',
      vehicleMake: vehicle?.make || '',
      vehicleModel: vehicle?.model || '',
      vehiclePricePerDay: pricePerDay || 0,
      ownerId: vehicle?.ownerId || '',
      startDate: startDateISO,
      endDate: endDateISO,
      days: days || 1,
      subtotal: expectedPrice || 0,
      discountType: formData.discountType || 'NONE',
      discountValue: formData.discountValue || '',
      discountAmount: discountAmount || 0,
      totalPrice: finalTotal || 0,
      bookingFeePerDay: formData.bookingFee ? parseFloat(formData.bookingFee) : null,
      commission: commission, // ✅ Will be 0 if negative
      paymentMethod: formData.paymentMethod || 'CASH',
      paymentStatus: paymentStatus || 'PENDING',
      mpesaCode: formData.mpesaCode || '',
      paidAmount: paidAmount || 0,
      remainingBalance: remainingBalance || 0,
      vehicleConditionImages: formData.vehicleConditionImages && formData.vehicleConditionImages.length > 0 
        ? JSON.stringify(formData.vehicleConditionImages) 
        : null,
      notes: formData.notes || '',
      status: 'pending',
      serviceType: 'car_hire',
      isGuestBooking: false,
      tenantId: tenantId
    };

    console.log('📤 Creating booking:', newBooking);
    
    const response = await bookingService.create(newBooking);
    console.log('📥 Create booking response:', response);
    
    if (response?.success) {
      showNotification(`✅ Booking created successfully for ${newBooking.customerName}!`);
      setShowCreateModal(false);
      resetForm();
      loadData(tenantId);
    } else {
      showNotification('Failed to create booking: ' + (response?.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    showNotification('Failed to create booking. Please try again.', 'error');
  }
  
  setIsSubmitting(false);
};

// ✅ Handle Edit Booking
const handleEditBooking = async () => {
  if (!editingBooking) return;

  if (!editFormData.customerName) {
    showNotification('Please enter customer name', 'error');
    return;
  }
  
  if (!editFormData.vehicleId) {
    showNotification('Please select a vehicle', 'error');
    return;
  }
  
  if (!editFormData.startDate || !editFormData.endDate) {
    showNotification('Please select start and end dates', 'error');
    return;
  }

  // // ✅ CHECK IF START DATE IS IN THE PAST
  // const start = new Date(editFormData.startDate);
  // const today = new Date();
  // today.setHours(0, 0, 0, 0);
  // if (start < today) {
  //   showNotification('⚠️ Start date cannot be in the past', 'error');
  //   return;
  // }

  // ✅ CHECK IF END DATE IS AFTER START DATE
const start = new Date(editFormData.startDate);  // ✅ ADD THIS LINE BACK
const end = new Date(editFormData.endDate);
if (end < start) {
  showNotification('⚠️ End date must be on or after start date', 'error');
  return;
}

  // ✅ ONLY CHECK AVAILABILITY IF DATES OR VEHICLE HAVE CHANGED
  const startDateTime = `${editFormData.startDate}T${editFormData.startTime || '08:00'}`;
  const endDateTime = `${editFormData.endDate}T${editFormData.endTime || '18:00'}`;
  
  // Check if dates or vehicle actually changed from the original booking
  const datesChanged = editingBooking.startDate !== startDateTime || 
                       editingBooking.endDate !== endDateTime;
  const vehicleChanged = editingBooking.vehicleId !== editFormData.vehicleId;
  
  // ✅ ONLY validate availability if something changed
  if (datesChanged || vehicleChanged) {
    const isAvailable = isVehicleAvailableForDates(
      editFormData.vehicleId,
      startDateTime,
      endDateTime
    );
    
    if (!isAvailable) {
      const conflicts = getOverlappingBookings(
        editFormData.vehicleId,
        startDateTime,
        endDateTime
      );
      
      // ✅ Check if the conflict is with the booking itself (self-conflict)
      const selfConflict = conflicts.some(c => c.id === editingBooking.id);
      
      if (!selfConflict && conflicts.length > 0) {
        const conflict = conflicts[0];
        let conflictMessage = `❌ This vehicle is booked from ${formatDateTime(conflict.startDate)} to ${formatDateTime(conflict.endDate)}. Please choose different dates or another vehicle.`;
        showNotification(conflictMessage, 'error');
        return;
      }
    }
  }

  setIsSubmitting(true);

  try {
    const startDateTime = `${editFormData.startDate}T${editFormData.startTime || '08:00'}`;
    const endDateTime = `${editFormData.endDate}T${editFormData.endTime || '18:00'}`;

    const vehicle = vehicles.find(v => v.id === editFormData.vehicleId);
    const pricePerDay = parseFloat(vehicle?.pricePerDay) || 0;
    const days = editFormData.days || calculateDays(editFormData.startDate, editFormData.endDate);
    
    const expectedPrice = pricePerDay * days;
    let discountAmount = 0;
if (editFormData.discountType === 'PERCENTAGE') {
  discountAmount = (expectedPrice * parseFloat(editFormData.discountValue || 0)) / 100;
} else if (editFormData.discountType === 'FIXED') {
  discountAmount = parseFloat(editFormData.discountValue || 0) * days;
} else {
  discountAmount = editFormData.discountAmount || 0;
}
    const expectedAfterDiscount = expectedPrice - discountAmount;
    
    let finalTotal = 0;
    if (editFormData.bookingFee) {
      const enteredFee = parseFloat(editFormData.bookingFee);
      finalTotal = enteredFee * days;
    } else {
      finalTotal = expectedAfterDiscount;
    }
    
    const commission = Math.max(0, finalTotal - expectedAfterDiscount);

    let paidAmount = editFormData.paidAmount || 0;
    let remainingBalance = finalTotal - paidAmount;
    let paymentStatus = editFormData.paymentStatus;

    if (remainingBalance <= 0) {
      paymentStatus = 'PAID';
      remainingBalance = 0;
    } else if (paidAmount > 0) {
      paymentStatus = 'PARTIAL';
    }

    const startDateISO = startDateTime;
    const endDateISO = endDateTime;


    const updatedBooking = {
      ...editingBooking,
      customerName: editFormData.customerName,
      customerEmail: editFormData.customerEmail || '',
      customerPhone: editFormData.customerPhone || '',
      customerIdNumber: editFormData.customerIdNumber || '',
      customerLicenseNumber: editFormData.customerLicenseNumber || '',
      customerIdImage: editFormData.customerIdImage || null,
      customerLicenseImage: editFormData.customerLicenseImage || null,
      vehicleId: editFormData.vehicleId,
      vehicleRegistration: vehicle?.registration || '',
      vehicleMake: vehicle?.make || '',
      vehicleModel: vehicle?.model || '',
      vehiclePricePerDay: pricePerDay || 0,
      ownerId: vehicle?.ownerId || '',
      startDate: startDateISO,
      endDate: endDateISO,
      days: days || 1,
      subtotal: expectedPrice || 0,
      discountType: editFormData.discountType || 'NONE',
      discountValue: editFormData.discountValue || '',
      discountAmount: discountAmount || 0,
      totalPrice: finalTotal || 0,
      bookingFeePerDay: editFormData.bookingFee ? parseFloat(editFormData.bookingFee) : null,
      commission: commission,
      paymentMethod: editFormData.paymentMethod || 'CASH',
      paymentStatus: paymentStatus || 'PENDING',
      mpesaCode: editFormData.mpesaCode || '',
      paidAmount: paidAmount || 0,
      remainingBalance: remainingBalance || 0,
      vehicleConditionImages: editFormData.vehicleConditionImages && editFormData.vehicleConditionImages.length > 0 
        ? JSON.stringify(editFormData.vehicleConditionImages) 
        : null,
      notes: editFormData.notes || '',
    };

    console.log('📤 Updating booking:', updatedBooking);
    
    const response = await bookingService.update(editingBooking.id, updatedBooking);
    console.log('📥 Update booking response:', response);
    
    if (response?.success) {
      showNotification(`✅ Booking updated successfully!`);
      setShowEditModal(false);
      setEditingBooking(null);
      loadData(tenantId);
    } else {
      showNotification('Failed to update booking: ' + (response?.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error updating booking:', error);
    showNotification('Failed to update booking. Please try again.', 'error');
  }
  
  setIsSubmitting(false);
};

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      showNotification('Please enter a valid payment amount', 'error');
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    
    if (amount > selectedBooking.remainingBalance) {
      showNotification(`Amount (KES ${amount}) exceeds remaining balance (KES ${selectedBooking.remainingBalance})`, 'error');
      return;
    }

    if (paymentForm.paymentMethod === 'M_PESA') {
      if (!paymentForm.mpesaCode || !validateMpesaCode(paymentForm.mpesaCode)) {
        showNotification('Please enter a valid M-Pesa transaction code', 'error');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const updatedBooking = {
        ...selectedBooking,
        paidAmount: (selectedBooking.paidAmount || 0) + amount,
        remainingBalance: selectedBooking.totalPrice - ((selectedBooking.paidAmount || 0) + amount),
        paymentStatus: (selectedBooking.totalPrice - ((selectedBooking.paidAmount || 0) + amount)) <= 0 ? 'PAID' : 'PARTIAL',
        paymentMethod: paymentForm.paymentMethod,
        mpesaCode: paymentForm.mpesaCode || selectedBooking.mpesaCode
      };

      console.log('📤 Updating booking with payment:', updatedBooking);
      
      const response = await bookingService.update(selectedBooking.id, updatedBooking);
      console.log('📥 Update booking response:', response);
      
      if (response?.success) {
        showNotification(`✅ Payment of KES ${amount} recorded successfully!`);
        setShowPaymentModal(false);
        setPaymentForm({ amount: '', paymentMethod: 'CASH', mpesaCode: '', notes: '' });
        loadData();
      } else {
        showNotification('Failed to record payment: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      showNotification('Failed to record payment. Please try again.', 'error');
    }
    
    setIsSubmitting(false);
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setIsSubmitting(true);
    
    try {
      console.log(`📤 Updating booking ${bookingId} status to ${newStatus}`);
      
      const response = await bookingService.updateStatus(bookingId, newStatus);
      console.log('📥 Update status response:', response);
      
      if (response?.success) {
        showNotification(`✅ Booking status updated to ${newStatus}!`);
        setShowStatusModal(false);
        loadData();
      } else {
        showNotification('Failed to update status: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Failed to update status. Please try again.', 'error');
    }
    
    setIsSubmitting(false);
  };

  const handlePaymentStatusUpdate = async (bookingId, newPaymentStatus) => {
    setIsSubmitting(true);
    
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) {
        showNotification('Booking not found', 'error');
        return;
      }

      const updatedBooking = {
        ...booking,
        paymentStatus: newPaymentStatus
      };

      console.log(`📤 Updating booking ${bookingId} payment status to ${newPaymentStatus}`);
      
      const response = await bookingService.update(bookingId, updatedBooking);
      console.log('📥 Update payment status response:', response);
      
      if (response?.success) {
        showNotification(`✅ Payment status updated to ${newPaymentStatus}!`);
        loadData();
      } else {
        showNotification('Failed to update payment status: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      showNotification('Failed to update payment status. Please try again.', 'error');
    }
    
    setIsSubmitting(false);
  };

  const handleDeleteBooking = async () => {
    if (!selectedBooking) return;
    
    setIsSubmitting(true);
    
    try {
      console.log(`📤 Deleting booking ${selectedBooking.id}`);
      
      const response = await bookingService.delete(selectedBooking.id);
      console.log('📥 Delete booking response:', response);
      
      if (response?.success) {
        showNotification('Booking deleted successfully!');
        setShowDeleteModal(false);
        setSelectedBooking(null);
        loadData();
      } else {
        showNotification('Failed to delete booking: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      showNotification('Failed to delete booking. Please try again.', 'error');
    }
    
    setIsSubmitting(false);
  };

  const handlePrintBooking = (booking) => {
  const vehicle = getVehicleDetails(booking.vehicleId);
  const owner = getOwnerDetails(booking.ownerId);
  
  // Get fleet manager name from logged-in user
  const fleetManagerName = currentUser?.name || currentUser?.fullName || 'Fleet Manager';
  const currentDate = new Date().toLocaleString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Parse vehicle condition images
  let vehicleImages = [];
  try {
    if (booking.vehicleConditionImages) {
      vehicleImages = typeof booking.vehicleConditionImages === 'string'
        ? JSON.parse(booking.vehicleConditionImages)
        : booking.vehicleConditionImages;
    }
  } catch (e) {
    vehicleImages = [];
  }

  // Create a print-friendly HTML
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  printWindow.document.write(`
    <html>
      <head>
        <title>Booking Receipt - ${booking.reference}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { font-size: 24px; margin: 0; color: #1a56db; }
          .header p { margin: 5px 0; color: #666; }
          .section { margin-bottom: 20px; }
          .section h2 { font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px; margin-bottom: 12px; color: #1a56db; }
          .row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
          .row .label { font-weight: 600; color: #555; }
          .row .value { color: #333; }
          .total-row { font-size: 18px; font-weight: bold; color: #16a34a; border-top: 2px solid #16a34a; padding-top: 10px; margin-top: 10px; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #999; }
          .badge { display: inline-block; padding: 2px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; }
          .badge-pending { background: #fef3c7; color: #92400e; }
          .badge-confirmed { background: #dbeafe; color: #1e40af; }
          .badge-completed { background: #d1fae5; color: #065f46; }
          .badge-cancelled { background: #fee2e2; color: #991b1b; }
          
          /* Image styles */
          .image-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px; }
          .image-grid img { width: 100%; height: 120px; object-fit: cover; border-radius: 8px; border: 1px solid #ddd; }
          .image-container { margin-top: 10px; }
          .image-container img { max-width: 200px; max-height: 150px; border-radius: 8px; border: 1px solid #ddd; }
          
          /* Signature section */
          .signature-section { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 30px; 
            padding-top: 20px;
            border-top: 2px solid #ddd;
          }
          .signature-box { 
            width: 45%; 
            text-align: center;
          }
          .signature-line { 
            border-top: 1px solid #333; 
            width: 80%; 
            margin: 40px auto 5px auto;
          }
          .signature-label { 
            font-size: 12px; 
            color: #666; 
          }
          .signature-name { 
            font-weight: 600; 
            font-size: 14px;
            margin-top: 5px;
          }
          .print-button { display: none; }
          .watermark { 
            position: fixed; 
            bottom: 20px; 
            right: 20px; 
            font-size: 12px; 
            color: #ddd;
            font-weight: bold;
          }
          @media print {
            .print-button { display: none; }
            body { padding: 20px; }
            .watermark { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="watermark">Sulul Tours & Travel</div>

        <div class="header">
          <h1>🚗 Car Booking Receipt</h1>
          <p><strong>Reference:</strong> ${booking.reference}</p>
          <p><strong>Generated:</strong> ${currentDate}</p>
        </div>

        <div class="section">
          <h2>👤 Customer Information</h2>
          <div class="row"><span class="label">Name:</span> <span class="value">${booking.customerName || 'N/A'}</span></div>
          <div class="row"><span class="label">Phone:</span> <span class="value">${booking.customerPhone || 'N/A'}</span></div>
          <div class="row"><span class="label">Email:</span> <span class="value">${booking.customerEmail || 'N/A'}</span></div>
          <div class="row"><span class="label">ID Number:</span> <span class="value">${booking.customerIdNumber || 'N/A'}</span></div>
          <div class="row"><span class="label">License Number:</span> <span class="value">${booking.customerLicenseNumber || 'N/A'}</span></div>
          <div class="row"><span class="label">Booking Type:</span> <span class="value">${booking.isGuestBooking || booking.isGuestBooking === true ? '👤 Guest' : '📋 Registered'}</span></div>
        </div>

        <!-- Customer ID Image -->
        ${booking.customerIdImage ? `
        <div class="section">
          <h2>🪪 ID Image</h2>
          <div class="image-container">
            <img src="${booking.customerIdImage}" alt="Customer ID" />
          </div>
        </div>
        ` : ''}

        <!-- Customer License Image -->
        ${booking.customerLicenseImage ? `
        <div class="section">
          <h2>📜 License Image</h2>
          <div class="image-container">
            <img src="${booking.customerLicenseImage}" alt="Driver's License" />
          </div>
        </div>
        ` : ''}

        <div class="section">
          <h2>🚗 Vehicle Information</h2>
          <div class="row"><span class="label">Vehicle:</span> <span class="value">${vehicle ? `${vehicle.make} ${vehicle.model}` : 'N/A'}</span></div>
          <div class="row"><span class="label">Registration:</span> <span class="value">${vehicle?.registration || 'N/A'}</span></div>
          <div class="row"><span class="label">Rate per Day:</span> <span class="value">KSh ${(booking.vehiclePricePerDay || 0).toLocaleString()}</span></div>
          <div class="row"><span class="label">Owner:</span> <span class="value">${currentUser?.tenantName || 'Sulul Tours & Travel'}</span></div>
        </div>

        <!-- Vehicle Condition Images -->
        ${vehicleImages.length > 0 ? `
        <div class="section">
          <h2>📸 Vehicle Condition Images</h2>
          <div class="image-grid">
            ${vehicleImages.map(img => `
              <img src="${img}" alt="Vehicle condition" />
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="section">
          <h2>📅 Booking Details</h2>
          <div class="row"><span class="label">Start Date:</span> <span class="value">${formatDateTime(booking.startDate)}</span></div>
          <div class="row"><span class="label">End Date:</span> <span class="value">${formatDateTime(booking.endDate)}</span></div>
          <div class="row"><span class="label">Duration:</span> <span class="value">${booking.days || 0} days</span></div>
          <div class="row"><span class="label">Status:</span> <span class="value"><span class="badge badge-${booking.status}">${booking.status?.toUpperCase() || 'PENDING'}</span></span></div>
        </div>

        <div class="section">
          <h2>💰 Payment Summary</h2>
          <div class="row"><span class="label">Subtotal:</span> <span class="value">KSh ${(booking.subtotal || 0).toLocaleString()}</span></div>
          ${booking.discountAmount > 0 ? `<div class="row"><span class="label">Discount:</span> <span class="value" style="color: #16a34a;">- KSh ${(booking.discountAmount || 0).toLocaleString()}</span></div>` : ''}
          <div class="row"><span class="label">Final Fee:</span> <span class="value" style="font-weight: bold; color: #16a34a;">KSh ${(booking.totalPrice || 0).toLocaleString()}</span></div>
          <div class="row"><span class="label">Paid Amount:</span> <span class="value" style="color: #16a34a;">KSh ${(booking.paidAmount || 0).toLocaleString()}</span></div>
          ${booking.remainingBalance > 0 ? `<div class="row"><span class="label">Remaining Balance:</span> <span class="value" style="color: #dc2626;">KSh ${(booking.remainingBalance || 0).toLocaleString()}</span></div>` : ''}
          <div class="row"><span class="label">Payment Method:</span> <span class="value">${booking.paymentMethod || 'CASH'}</span></div>
          <div class="row"><span class="label">Payment Status:</span> <span class="value">${booking.paymentStatus || 'PENDING'}</span></div>
          ${booking.mpesaCode ? `<div class="row"><span class="label">M-Pesa Code:</span> <span class="value">${booking.mpesaCode}</span></div>` : ''}
          ${booking.commission > 0 ? `<div class="row"><span class="label">Commission:</span> <span class="value">KSh ${(booking.commission || 0).toLocaleString()}</span></div>` : ''}
        </div>

        <!-- ✅ SIGNATURE SECTION -->
        <div class="signature-section">
          <!-- Customer Signature -->
          <div class="signature-box">
            <p class="signature-label">Customer Signature</p>
            <div class="signature-line"></div>
            <p class="signature-name">${booking.customerName || '_________________'} (Customer)</p>
            <p style="font-size: 10px; color: #999; margin-top: 5px;">
              Signed: ${currentDate}
            </p>
          </div>
          
          <!-- Fleet Manager Signature -->
          <div class="signature-box">
            <p class="signature-label">Fleet Manager Signature</p>
            <div class="signature-line"></div>
            <p class="signature-name">${fleetManagerName || '_________________'} (Fleet Manager)</p>
            <p style="font-size: 10px; color: #999; margin-top: 5px;">
              Signed: ${currentDate}
            </p>
          </div>
        </div>

        ${booking.notes ? `
        <div class="section">
          <h2>📝 Notes</h2>
          <div class="row"><span class="value">${booking.notes}</span></div>
        </div>
        ` : ''}

        <div class="footer">
          <p>© 2026 Sulul Tours &amp; Travel. All rights reserved.</p>
          <p>This is a system-generated receipt. Please keep for your records.</p>
          <p style="font-size: 10px; color: #aaa; margin-top: 5px;">
            Generated by: ${fleetManagerName} | ${currentDate}
          </p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
    </html>
  `);
  
  printWindow.document.close();
};

  const statusOptions = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

  const filteredBookings = bookings.filter(b => {
    const vehicle = getVehicleDetails(b.vehicleId);
    const owner = getOwnerDetails(b.ownerId);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      b.customerName?.toLowerCase().includes(searchLower) ||
      b.customerEmail?.toLowerCase().includes(searchLower) ||
      b.customerPhone?.toLowerCase().includes(searchLower) ||
      b.customerIdNumber?.toLowerCase().includes(searchLower) ||
      b.customerLicenseNumber?.toLowerCase().includes(searchLower) ||
      vehicle?.registration?.toLowerCase().includes(searchLower) ||
      vehicle?.make?.toLowerCase().includes(searchLower) ||
      vehicle?.model?.toLowerCase().includes(searchLower) ||
      owner?.name?.toLowerCase().includes(searchLower);
    
    const matchesFilter = filterStatus === 'all' || b.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totalBookings = bookings?.length || 0;
  const pendingBookings = bookings?.filter(b => b?.status === 'pending').length || 0;
  const confirmedBookings = bookings?.filter(b => b?.status === 'confirmed').length || 0;
  const completedBookings = bookings?.filter(b => b?.status === 'completed').length || 0;
  const cancelledBookings = bookings?.filter(b => b?.status === 'cancelled').length || 0;

  const totalRevenue = bookings?.reduce((sum, b) => {
    const price = b?.totalPrice || 0;
    return sum + price;
  }, 0) || 0;

  const totalCommission = bookings?.reduce((sum, b) => {
    const commission = b?.commission || 0;
    return sum + commission;
  }, 0) || 0;

  const totalCreditOutstanding = bookings
    ?.filter(b => (b?.remainingBalance || 0) > 0)
    .reduce((sum, b) => sum + (b?.remainingBalance || 0), 0) || 0;

  const availableVehicles = vehicles.filter(v => v.status === 'active');

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto">
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

      {/* ================================================================ */}
      {/* PAYMENT MODAL */}
      {/* ================================================================ */}
      {showPaymentModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPaymentModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <CreditCard size={20} />
                <h2 className="text-lg font-semibold">Record Payment</h2>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-white/20 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">{selectedBooking.customerName}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Total Booking Fee:</span>
                  <span className="font-medium">KES {(selectedBooking.totalPrice || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Paid:</span>
                  <span className="font-medium text-green-600">KES {(selectedBooking.paidAmount || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-1 border-t border-gray-200 pt-1">
                  <span className="text-gray-600 font-semibold">Remaining:</span>
                  <span className="font-bold text-orange-600">KES {(selectedBooking.remainingBalance || 0).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount to Pay (KES) *</label>
                <input
                  type="number"
                  value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter amount"
                  min="0"
                  step="50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="M_PESA">M-Pesa</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>

              {paymentForm.paymentMethod === 'M_PESA' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Transaction Code *</label>
                  <div className="relative">
                    <Receipt size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={paymentForm.mpesaCode}
                      onChange={(e) => setPaymentForm({...paymentForm, mpesaCode: e.target.value.toUpperCase()})}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="e.g., ABC123DEF456"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Enter the M-Pesa confirmation code received</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows="2"
                  placeholder="Any notes about this payment..."
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordPayment}
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
              >
                <Save size={16} /> {isSubmitting ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* CREATE BOOKING MODAL */}
      {/* ================================================================ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Plus size={24} />
                <div>
                  <h2 className="text-lg font-semibold">Create New Booking</h2>
                  <p className="text-sm text-green-100">Fill in the details below</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Customer Info - Same as before */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      value={formData.customerName}
                      onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.customerEmail}
                      onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="+254 700 000 000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ID Number</label>
                    <input
                      type="text"
                      value={formData.customerIdNumber}
                      onChange={(e) => setFormData({...formData, customerIdNumber: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="12345678"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Driver's License Number</label>
                    <input
                      type="text"
                      value={formData.customerLicenseNumber}
                      onChange={(e) => setFormData({...formData, customerLicenseNumber: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="DL-123456789"
                    />
                  </div>
                </div>
              </div>

              {/* ID & License Images */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Documents</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ID Image</label>
                    <div 
                      onClick={() => idImageRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      {idImagePreview ? (
                        <div className="relative">
                          <img src={idImagePreview} alt="ID" className="max-h-32 mx-auto rounded" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setIdImagePreview(null);
                              setFormData(prev => ({ ...prev, customerIdImage: null }));
                            }}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <Upload size={20} />
                          <span className="text-sm">Upload ID Image</span>
                        </div>
                      )}
                      <input
                        ref={idImageRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'id')}
                        className="hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">License Image</label>
                    <div 
                      onClick={() => licenseImageRef.current?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-500 transition-colors"
                    >
                      {licenseImagePreview ? (
                        <div className="relative">
                          <img src={licenseImagePreview} alt="License" className="max-h-32 mx-auto rounded" />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setLicenseImagePreview(null);
                              setFormData(prev => ({ ...prev, customerLicenseImage: null }));
                            }}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-gray-500">
                          <Upload size={20} />
                          <span className="text-sm">Upload License Image</span>
                        </div>
                      )}
                      <input
                        ref={licenseImageRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'license')}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle Selection */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Vehicle Information</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Select Vehicle *</label>
<select
  value={formData.vehicleId}
  onChange={(e) => handleVehicleSelect(e.target.value)}
  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
>
  <option value="">Select a vehicle...</option>
  {availableVehicles.length === 0 ? (
    <option disabled>No vehicles available</option>
  ) : (
    (() => {
      // ✅ Get available vehicles for the selected dates
      const availableForDates = getAvailableVehiclesForDates(
          formData.startDate, 
          formData.endDate
      );
      
      if (availableForDates.length === 0 && formData.startDate && formData.endDate) {
          return <option disabled>No vehicles available for selected dates</option>;
      }
      
      // Show all vehicles but mark unavailable ones
      return availableVehicles.map(v => {
          const isAvailable = isVehicleAvailableForDates(
              v.id, 
              formData.startDate, 
              formData.endDate
          );
          const conflicts = getOverlappingBookings(v.id, formData.startDate, formData.endDate);
          const conflictInfo = conflicts.length > 0 ? 
              ` ❌ Booked ${formatDateTime(conflicts[0].startDate)} - ${formatDateTime(conflicts[0].endDate)}` : '';
          
          return (
              <option 
                  key={v.id} 
                  value={v.id}
                  disabled={!isAvailable}
                  className={!isAvailable ? 'text-gray-400' : ''}
              >
                  {v.registration} - {v.make} {v.model} (KSh {v.pricePerDay || 0}/day)
                  {!isAvailable && conflictInfo}
                  {isAvailable && ' ✅ Available'}
              </option>
          );
      });
    })()
  )}
</select>

{/* Show availability message when dates are selected */}
{formData.vehicleId && formData.startDate && formData.endDate && (
    <div className="mt-2">
        {(() => {
            const isAvailable = isVehicleAvailableForDates(
                formData.vehicleId, 
                formData.startDate, 
                formData.endDate
            );
            const conflicts = getOverlappingBookings(
                formData.vehicleId, 
                formData.startDate, 
                formData.endDate
            );
            
            if (isAvailable) {
                return (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle size={16} />
                        <span>✅ Vehicle is available for the selected dates!</span>
                    </div>
                );
            } else if (conflicts.length > 0) {
                const conflict = conflicts[0];
                return (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700 flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>❌ Booked from {formatDateTime(conflict.startDate)} to {formatDateTime(conflict.endDate)}</span>
                    </div>
                );
            } else {
                return (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 text-sm text-yellow-700 flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>⚠️ Vehicle not available for selected dates</span>
                    </div>
                );
            }
        })()}
    </div>
)}
                    
                    {/* {formData.vehicleId && (
                      <div className="mt-2">
                        {(() => {
                          const activeCount = getActiveBookingsCount(formData.vehicleId);
                          const hasCompleted = bookings.some(b => 
                            b.vehicleId === formData.vehicleId && b.status === 'completed'
                          );
                          
                          if (activeCount > 0) {
                            return (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700 flex items-center gap-2">
                                <AlertCircle size={16} />
                                <span>❌ This vehicle has {activeCount} active booking(s) (pending/confirmed). Cannot book until they are completed or cancelled.</span>
                              </div>
                            );
                          }
                          
                          if (hasCompleted) {
                            return (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-sm text-green-700 flex items-center gap-2">
                                <CheckCircle size={16} />
                                <span>✅ Vehicle is available! Previous rentals have been completed.</span>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-sm text-green-700 flex items-center gap-2">
                              <CheckCircle size={16} />
                              <span>✅ Vehicle is available for booking.</span>
                            </div>
                          );
                        })()}
                      </div>
                    )} */}
                  </div>
                </div>
              </div>

              {/* Vehicle Condition Images */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Vehicle Condition (Current State)</h3>
                <div 
                  onClick={() => vehicleImageRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
                >
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Camera size={24} />
                    <span className="text-sm">Upload vehicle condition images (damage, scratches, etc.)</span>
                  </div>
                  <input
                    ref={vehicleImageRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleVehicleImageUpload}
                    className="hidden"
                  />
                </div>
                {vehicleImagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {vehicleImagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img src={preview} alt={`Vehicle ${index + 1}`} className="h-20 w-full object-cover rounded-lg" />
                        <button
                          onClick={() => removeVehicleImage(index)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Dates with Time */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Booking Dates & Times</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
                    <input
  type="date"
  value={formData.startDate}
  onChange={(e) => {
    setFormData(prev => ({ ...prev, startDate: e.target.value }));
  }}
  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date *</label>
                    <input
  type="date"
  value={formData.endDate}
  onChange={(e) => {
    setFormData(prev => ({ ...prev, endDate: e.target.value }));
  }}
  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
/>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Fee Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Booking Fee</h3>
                {formData.vehicleId && formData.days > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Daily Rate:</span>
                        <span className="font-semibold ml-1">KSh {(selectedVehicleRate || 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Days:</span>
                        <span className="font-semibold ml-1">{formData.days}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">🚗 Car Owner Earnings:</span>
                        <span className="font-semibold ml-1 text-green-600">KSh {((selectedVehicleRate || 0) * (formData.days || 1)).toLocaleString()}</span>
                      </div>
                      {formData.discountAmount > 0 && (
                        <div className="col-span-2">
                          <span className="text-green-600">Discount:</span>
                          <span className="font-semibold text-green-600 ml-1">- KSh {(formData.discountAmount || 0).toLocaleString()}</span>
                        </div>
                      )}
                      {formData.discountAmount > 0 && (
                        <div className="col-span-2 border-t border-blue-200 pt-1 mt-1">
                          <span className="text-gray-600">💰 Car Owner Earnings After Discount:</span>
                          <span className="font-semibold ml-1 text-green-600">KSh {((selectedVehicleRate || 0) * (formData.days || 1) - (formData.discountAmount || 0)).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Booking Fee <span className="text-xs text-gray-400">(per day)</span>
                  </label>
                  <div className="relative">
                    <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="number"
                      value={formData.bookingFee}
                      onChange={(e) => handleBookingFeeChange(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Enter per-day fee (e.g., 9000)"
                      min="0"
                      step="100"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">This amount will be multiplied by the number of days</p>
                </div>
              </div>

              {/* Discount Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Discount(Per Day)</h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  <button
                    onClick={() => handleDiscountChange('NONE', '')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      formData.discountType === 'NONE'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    No Discount
                  </button>
                  <button
                    onClick={() => handleDiscountChange('PERCENTAGE', formData.discountValue || '10')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                      formData.discountType === 'PERCENTAGE'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Percent size={12} /> Percentage
                  </button>
                  <button
                    onClick={() => handleDiscountChange('FIXED', formData.discountValue || '500')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                      formData.discountType === 'FIXED'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Tag size={12} /> Fixed (KES)
                  </button>
                </div>
                {formData.discountType !== 'NONE' && (
                  <div>
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={(e) => handleDiscountChange(formData.discountType, e.target.value)}
                      placeholder={formData.discountType === 'PERCENTAGE' ? 'Enter percentage (e.g., 10)' : 'Enter amount in KES (e.g., 500)'}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      min="0"
                      step={formData.discountType === 'PERCENTAGE' ? '1' : '50'}
                    />
                  </div>
                )}
              </div>

              {/* Payment Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
                      <select
                        value={formData.paymentMethod}
                        onChange={(e) => {
                          const method = e.target.value;
                          setFormData({...formData, paymentMethod: method});
                          if (method !== 'M_PESA') {
                            setFormData(prev => ({...prev, mpesaCode: ''}));
                          }
                        }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="CASH">Cash</option>
                        <option value="M_PESA">M-Pesa</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                        <option value="CREDIT">Credit</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Payment Status</label>
                      <select
                        value={formData.paymentStatus}
                        onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="PAID">Paid</option>
                        <option value="PARTIAL">Partial</option>
                      </select>
                    </div>
                  </div>

                  {formData.paymentMethod === 'M_PESA' && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">M-Pesa Transaction Code *</label>
                      <div className="relative">
                        <Receipt size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={formData.mpesaCode}
                          onChange={(e) => setFormData({...formData, mpesaCode: e.target.value.toUpperCase()})}
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          placeholder="e.g., ABC123DEF456"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Enter the M-Pesa confirmation code received</p>
                    </div>
                  )}

                  {formData.paymentMethod === 'CREDIT' && (
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <div className="flex items-center gap-2 text-yellow-800">
                        <AlertCircle size={16} />
                        <span className="text-sm font-medium">Credit Payment</span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        Customer will pay later. You can record payments from the booking list.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows="2"
                  placeholder="Special requests or notes..."
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBooking}
                disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
              >
                <Save size={16} /> {isSubmitting ? 'Creating...' : 'Create Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* DETAIL MODAL */}
      {/* ================================================================ */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Calendar size={24} />
                <div>
                  <h2 className="text-lg font-semibold">Booking Details</h2>
                  <p className="text-sm text-blue-100">Ref: {selectedBooking.reference}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Customer Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div><span className="text-xs text-gray-500">Name:</span> <span className="text-sm font-medium">{selectedBooking.customerName}</span></div>
                  <div><span className="text-xs text-gray-500">Email:</span> <span className="text-sm font-medium">{selectedBooking.customerEmail || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">Phone:</span> <span className="text-sm font-medium">{selectedBooking.customerPhone || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">ID Number:</span> <span className="text-sm font-medium">{selectedBooking.customerIdNumber || 'N/A'}</span></div>
                  <div className="col-span-2"><span className="text-xs text-gray-500">License Number:</span> <span className="text-sm font-medium">{selectedBooking.customerLicenseNumber || 'N/A'}</span></div>
                  {selectedBooking.customerIdImage && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500">ID Image:</span>
                      <img src={selectedBooking.customerIdImage} alt="ID" className="max-h-32 mt-1 rounded border" />
                    </div>
                  )}
                  {selectedBooking.customerLicenseImage && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500">License Image:</span>
                      <img src={selectedBooking.customerLicenseImage} alt="License" className="max-h-32 mt-1 rounded border" />
                    </div>
                  )}
                  <div><span className="text-xs text-gray-500">Status:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusBadge(selectedBooking.status).color}`}>{getStatusBadge(selectedBooking.status).label}</span></div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div><span className="text-xs text-gray-500">Vehicle:</span> <span className="text-sm font-medium">{selectedBooking.vehicleRegistration || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">Make/Model:</span> <span className="text-sm font-medium">{selectedBooking.vehicleMake || 'N/A'} {selectedBooking.vehicleModel || ''}</span></div>
                  <div><span className="text-xs text-gray-500">Owner:</span> <span className="text-sm font-medium">{selectedBooking.ownerName || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">Rate/Day:</span> <span className="text-sm font-medium">KSh {(selectedBooking.vehiclePricePerDay || 0).toLocaleString()}</span></div>
                </div>
              </div>

              {/* Booking Details */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Booking Details</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500">Start:</span>
                    <span className="text-sm font-medium ml-1">{formatDateTime(selectedBooking.startDate)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500">End:</span>
                    <span className="text-sm font-medium ml-1">{formatDateTime(selectedBooking.endDate)}</span>
                  </div>
                  <div><span className="text-xs text-gray-500">Days:</span> <span className="text-sm font-medium">{selectedBooking.days || 0} days</span></div>
                  <div><span className="text-xs text-gray-500">Subtotal:</span> <span className="text-sm font-medium">KSh {(selectedBooking.subtotal || 0).toLocaleString()}</span></div>
                  {selectedBooking.discountAmount > 0 && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500">Discount:</span>
                      <span className="text-sm font-medium text-green-600">- KSh {(selectedBooking.discountAmount || 0).toLocaleString()}</span>
                      <span className="text-xs text-gray-400 ml-2">
                        ({selectedBooking.discountType === 'PERCENTAGE' ? `${selectedBooking.discountValue}%` : `KES ${selectedBooking.discountValue}`})
                      </span>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500">Booking Fee (Final Price):</span>
                    <span className="text-sm font-bold text-green-600">KSh {(selectedBooking.totalPrice || 0).toLocaleString()}</span>
                  </div>
                  {selectedBooking.commission !== 0 && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500">Commission:</span>
                      <span className={`text-sm font-medium ${(selectedBooking.commission || 0) > 0 ? 'text-purple-600' : 'text-red-600'}`}>
                        {(selectedBooking.commission || 0) > 0 ? '+' : ''}KSh {(selectedBooking.commission || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-400 ml-2">
                        {(selectedBooking.commission || 0) > 0 ? 'Above expected' : 'Below expected'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

                            {/* Vehicle Condition Images */}
              {selectedBooking.vehicleConditionImages && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Vehicle Condition</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {(() => {
                      try {
                        const images = typeof selectedBooking.vehicleConditionImages === 'string'
                          ? JSON.parse(selectedBooking.vehicleConditionImages)
                          : selectedBooking.vehicleConditionImages;
                        return images.map((img, index) => (
                          <div key={index} className="relative">
                            <img
                              src={img}
                              alt={`Vehicle condition ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200"
                            />
                          </div>
                        ));
                      } catch (e) {
                        return (
                          <div className="col-span-3 text-xs text-gray-400">
                            No condition images available
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* Payment Information */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment Information</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div><span className="text-xs text-gray-500">Method:</span> <span className="text-sm font-medium flex items-center gap-1">{getPaymentMethodIcon(selectedBooking.paymentMethod)} {selectedBooking.paymentMethod || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">Status:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getPaymentStatusBadge(selectedBooking.paymentStatus).color}`}>{getPaymentStatusBadge(selectedBooking.paymentStatus).label}</span></div>
                  
                  {selectedBooking.mpesaCode && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500">M-Pesa Transaction Code:</span>
                      <span className="text-sm font-mono font-medium text-blue-600 ml-1">{selectedBooking.mpesaCode}</span>
                    </div>
                  )}
                  
                  <div><span className="text-xs text-gray-500">Total Amount:</span> <span className="text-sm font-medium">KES {(selectedBooking.totalPrice || 0).toLocaleString()}</span></div>
                  <div><span className="text-xs text-gray-500">Amount Paid:</span> <span className="text-sm font-medium text-green-600">KES {(selectedBooking.paidAmount || 0).toLocaleString()}</span></div>
                  {selectedBooking.remainingBalance > 0 && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500">Remaining Balance:</span>
                      <span className="text-sm font-bold text-orange-600">KES {(selectedBooking.remainingBalance || 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedBooking.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">{selectedBooking.notes}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm">
                Close
              </button>
              {selectedBooking.remainingBalance > 0 && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setShowPaymentModal(true);
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center gap-2"
                >
                  <CreditCard size={16} /> Record Payment
                </button>
              )}
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedBooking(selectedBooking);
                  setShowStatusModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* STATUS UPDATE MODAL */}
      {/* ================================================================ */}
      {showStatusModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowStatusModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock size={24} className="text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Update Booking Status</h2>
              <p className="text-sm text-gray-500 mt-1">
                Current status: <span className={`font-medium ${getStatusBadge(selectedBooking.status).color}`}>{getStatusBadge(selectedBooking.status).label}</span>
              </p>
              <div className="mt-4 space-y-2">
                {['confirmed', 'completed', 'cancelled'].map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(selectedBooking.id, status)}
                    className="w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                  >
                    <span className="text-sm">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    {selectedBooking.status === status && <CheckCircle size={16} className="text-blue-600" />}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Update Payment Status</p>
                <div className="space-y-2">
                  {['PAID', 'PARTIAL', 'PENDING'].map(status => (
                    <button
                      key={status}
                      onClick={() => handlePaymentStatusUpdate(selectedBooking.id, status)}
                      className="w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                    >
                      <span className="text-sm">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                      {selectedBooking.paymentStatus === status && <CheckCircle size={16} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setShowStatusModal(false)}
                className="mt-4 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm w-full"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* DELETE MODAL */}
      {/* ================================================================ */}
      {showDeleteModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Delete Booking</h2>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete booking #{selectedBooking.reference}?
                This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBooking}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  {isSubmitting ? 'Deleting...' : 'Delete Booking'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
{/* EDIT BOOKING MODAL */}
{/* ================================================================ */}
{showEditModal && editingBooking && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)}></div>
    <div className="relative bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
      <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <Edit2 size={24} />
          <div>
            <h2 className="text-lg font-semibold">Edit Booking</h2>
            <p className="text-sm text-blue-100">Ref: {editingBooking.reference}</p>
          </div>
        </div>
        <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
          <X size={24} />
        </button>
      </div>
      <div className="p-6 space-y-4">
        {/* Customer Info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer Information</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Customer Name *</label>
              <input
                type="text"
                value={editFormData.customerName}
                onChange={(e) => setEditFormData({...editFormData, customerName: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={editFormData.customerEmail}
                onChange={(e) => setEditFormData({...editFormData, customerEmail: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <input
                type="tel"
                value={editFormData.customerPhone}
                onChange={(e) => setEditFormData({...editFormData, customerPhone: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ID Number</label>
              <input
                type="text"
                value={editFormData.customerIdNumber}
                onChange={(e) => setEditFormData({...editFormData, customerIdNumber: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Driver's License Number</label>
              <input
                type="text"
                value={editFormData.customerLicenseNumber}
                onChange={(e) => setEditFormData({...editFormData, customerLicenseNumber: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* ✅ Documents Section - ID & License Images */}
<div>
  <h3 className="text-sm font-semibold text-gray-700 mb-2">Documents</h3>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    {/* ID Image */}
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">ID Image</label>
      <div 
        onClick={() => editIdImageRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-500 transition-colors"
      >
        {editFormData.customerIdImage ? (
          <div className="relative">
            <img src={editFormData.customerIdImage} alt="ID" className="max-h-32 mx-auto rounded" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditFormData(prev => ({ ...prev, customerIdImage: null }));
              }}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Upload size={20} />
            <span className="text-sm">Upload ID Image</span>
          </div>
        )}
        <input
          ref={editIdImageRef}
          type="file"
          accept="image/*"
          onChange={handleEditIdImageUpload}
          className="hidden"
        />
      </div>
    </div>

    {/* License Image */}
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">License Image</label>
      <div 
        onClick={() => editLicenseImageRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-500 transition-colors"
      >
        {editFormData.customerLicenseImage ? (
          <div className="relative">
            <img src={editFormData.customerLicenseImage} alt="License" className="max-h-32 mx-auto rounded" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditFormData(prev => ({ ...prev, customerLicenseImage: null }));
              }}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Upload size={20} />
            <span className="text-sm">Upload License Image</span>
          </div>
        )}
        <input
          ref={editLicenseImageRef}
          type="file"
          accept="image/*"
          onChange={handleEditLicenseImageUpload}
          className="hidden"
        />
      </div>
    </div>
  </div>
</div>

        {/* Vehicle Selection - EDIT MODAL */}
<div>
  <h3 className="text-sm font-semibold text-gray-700 mb-2">Vehicle Information</h3>
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1">Select Vehicle *</label>
    <select
      value={editFormData.vehicleId}
      onChange={(e) => {
        const vehicleId = e.target.value;
        const vehicle = vehicles.find(v => v.id === vehicleId);
        const days = editFormData.days || 1;
        const pricePerDay = parseFloat(vehicle?.pricePerDay) || 0;
        const subtotal = pricePerDay * days;
        const discountAmount = editFormData.discountAmount || 0;
        const finalTotal = subtotal - discountAmount;
        
        setEditFormData(prev => ({
          ...prev,
          vehicleId: vehicleId,
          bookingFee: pricePerDay.toString(),
          subtotal: subtotal,
          totalPrice: finalTotal,
          remainingBalance: finalTotal - (prev.paidAmount || 0)
        }));
      }}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
    >
      <option value="">Select a vehicle...</option>
      {vehicles.filter(v => v.status === 'active').map(v => {
        // ✅ ONLY CHECK AVAILABILITY IF DATES ARE SELECTED
        if (editFormData.startDate && editFormData.endDate) {
          const isAvailable = isVehicleAvailableForDates(
            v.id, 
            `${editFormData.startDate}T${editFormData.startTime || '08:00'}`,
            `${editFormData.endDate}T${editFormData.endTime || '18:00'}`
          );
          const isCurrentlySelected = v.id === editFormData.vehicleId;
          const conflicts = getOverlappingBookings(
            v.id, 
            `${editFormData.startDate}T${editFormData.startTime || '08:00'}`,
            `${editFormData.endDate}T${editFormData.endTime || '18:00'}`
          );
          // ✅ Filter out self-conflict (the booking being edited)
          const realConflicts = conflicts.filter(c => c.id !== editingBooking?.id);
          const hasRealConflict = realConflicts.length > 0;
          
          // ✅ Can select if available, is currently selected, or has no real conflicts
          const canSelect = isAvailable || isCurrentlySelected || !hasRealConflict;
          
          let conflictInfo = '';
          if (hasRealConflict && !isCurrentlySelected) {
            const conflict = realConflicts[0];
            conflictInfo = ` ❌ Booked ${formatDateTime(conflict.startDate)} - ${formatDateTime(conflict.endDate)}`;
          }
          
          return (
            <option 
              key={v.id} 
              value={v.id}
              disabled={!canSelect}
              className={!canSelect ? 'text-gray-400' : ''}
            >
              {v.registration} - {v.make} {v.model} (KSh {v.pricePerDay || 0}/day)
              {!canSelect && conflictInfo}
              {canSelect && ' ✅ Available'}
            </option>
          );
        } else {
          // ✅ NO DATES SELECTED - Show all vehicles as available
          return (
            <option key={v.id} value={v.id}>
              {v.registration} - {v.make} {v.model} (KSh {v.pricePerDay || 0}/day) ✅ Available
            </option>
          );
        }
      })}
    </select>
  </div>
</div>

        {/* Dates */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Booking Dates & Times</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
              <input
  type="date"
  value={editFormData.startDate}
  onChange={(e) => {
    setEditFormData(prev => ({ ...prev, startDate: e.target.value }));
  }}
  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
              <input
                type="time"
                value={editFormData.startTime}
                onChange={(e) => setEditFormData({...editFormData, startTime: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Date *</label>
              <input
  type="date"
  value={editFormData.endDate}
  onChange={(e) => {
    setEditFormData(prev => ({ ...prev, endDate: e.target.value }));
  }}
  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
/>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
              <input
                type="time"
                value={editFormData.endTime}
                onChange={(e) => setEditFormData({...editFormData, endTime: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Booking Fee */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Booking Fee</h3>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Booking Fee (per day)</label>
            <div className="relative">
              <DollarSign size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="number"
                value={editFormData.bookingFee}
                onChange={(e) => {
                  const value = e.target.value;
                  const days = editFormData.days || 1;
                  const enteredFee = parseFloat(value) || 0;
                  const total = enteredFee * days;
                  setEditFormData(prev => ({
                    ...prev,
                    bookingFee: value,
                    remainingBalance: total - (prev.paidAmount || 0)
                  }));
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Enter per-day fee"
                min="0"
                step="100"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">This amount will be multiplied by the number of days</p>
          </div>
        </div>

        {/* Discount */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Discount</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setEditFormData(prev => ({...prev, discountType: 'NONE', discountValue: '', discountAmount: 0}))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                editFormData.discountType === 'NONE' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              No Discount
            </button>
            <button
              onClick={() => setEditFormData(prev => ({...prev, discountType: 'PERCENTAGE', discountValue: '10'}))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                editFormData.discountType === 'PERCENTAGE' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Percent size={12} className="inline" /> Percentage
            </button>
            <button
              onClick={() => setEditFormData(prev => ({...prev, discountType: 'FIXED', discountValue: '500'}))}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                editFormData.discountType === 'FIXED' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Tag size={12} className="inline" /> Fixed (KES)
            </button>
          </div>
          {editFormData.discountType !== 'NONE' && (
  <input
    type="number"
    value={editFormData.discountValue}
    onChange={(e) => {
      const value = e.target.value;
      const vehicle = vehicles.find(v => v.id === editFormData.vehicleId);
      const days = editFormData.days || 1;
      const subtotal = vehicle ? (parseFloat(vehicle.pricePerDay) || 0) * days : 0;
      let discountAmount = 0;
      if (editFormData.discountType === 'PERCENTAGE') {
        discountAmount = (subtotal * parseFloat(value)) / 100;
      } else if (editFormData.discountType === 'FIXED') {
        discountAmount = (parseFloat(value) || 0) * days;  // ✅ FIXED discount multiplied by days
      }
      const finalTotal = subtotal - discountAmount;
      const dailyRateAfterDiscount = finalTotal / days;
      
      setEditFormData(prev => ({
        ...prev,
        discountValue: value,
        discountAmount: discountAmount,
        bookingFee: dailyRateAfterDiscount.toString(), // ✅ Show daily rate after discount
        remainingBalance: finalTotal - (prev.paidAmount || 0)
      }));
    }}
    placeholder={editFormData.discountType === 'PERCENTAGE' ? 'Enter percentage' : 'Enter amount in KES'}
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
    min="0"
    step={editFormData.discountType === 'PERCENTAGE' ? '1' : '50'}
  />
)}
        </div>

                      {/* Vehicle Condition Images */}
                                    {/* Vehicle Condition Images */}
              {/* ✅ Vehicle Condition Images - EDIT MODAL */}
<div>
  <h3 className="text-sm font-semibold text-gray-700 mb-2">Vehicle Condition (Current State)</h3>
  <div 
    onClick={() => editVehicleImageRef.current?.click()}
    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center cursor-pointer hover:border-blue-500 transition-colors"
  >
    <div className="flex items-center justify-center gap-2 text-gray-500">
      <Camera size={24} />
      <span className="text-sm">Upload vehicle condition images (damage, scratches, etc.)</span>
    </div>
    <input
      ref={editVehicleImageRef}
      type="file"
      accept="image/*"
      multiple
      onChange={handleEditVehicleImageUpload}
      className="hidden"
    />
  </div>
  {(() => {
    // ✅ Safely parse vehicleConditionImages
    let images = editFormData.vehicleConditionImages;
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images);
      } catch (e) {
        images = [];
      }
    }
    if (!Array.isArray(images)) {
      images = [];
    }
    
    return images.length > 0 && (
      <div className="grid grid-cols-3 gap-2 mt-3">
        {images.map((preview, index) => (
          <div key={index} className="relative">
            <img src={preview} alt={`Vehicle ${index + 1}`} className="h-20 w-full object-cover rounded-lg" />
            <button
              onClick={() => removeEditVehicleImage(index)}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    );
  })()}
</div>

        {/* Payment */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method</label>
              <select
                value={editFormData.paymentMethod}
                onChange={(e) => setEditFormData({...editFormData, paymentMethod: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="CASH">Cash</option>
                <option value="M_PESA">M-Pesa</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Amount Paid</label>
              <input
                type="number"
                value={editFormData.paidAmount}
                onChange={(e) => {
                  const paid = parseFloat(e.target.value) || 0;
                  const total = editFormData.bookingFee ? parseFloat(editFormData.bookingFee) * (editFormData.days || 1) : 0;
                  setEditFormData(prev => ({
                    ...prev,
                    paidAmount: paid,
                    remainingBalance: total - paid
                  }));
                }}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0"
                min="0"
                step="50"
              />
            </div>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
          <textarea
            value={editFormData.notes}
            onChange={(e) => setEditFormData({...editFormData, notes: e.target.value})}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            rows="2"
            placeholder="Special requests or notes..."
          />
        </div>
      </div>
      <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2">
        <button
          onClick={() => setShowEditModal(false)}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
        >
          Cancel
        </button>
        <button
          onClick={handleEditBooking}
          disabled={isSubmitting}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
        >
          <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  </div>
)}

      {/* ================================================================ */}
      {/* HEADER */}
      {/* ================================================================ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Car Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">Create and manage all car hire bookings</p>
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
              setShowCreateModal(true);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
          >
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      {/* STATS SUMMARY */}
      {bookings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-xl font-bold text-gray-800">{totalBookings}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">⏳ Pending</p>
            <p className="text-xl font-bold text-yellow-600">{pendingBookings}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">📌 Confirmed</p>
            <p className="text-xl font-bold text-blue-600">{confirmedBookings}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">✅ Completed</p>
            <p className="text-xl font-bold text-green-600">{completedBookings}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">💰 Revenue</p>
            <p className="text-xl font-bold text-purple-600">KSh {(totalRevenue || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">💼 Commission</p>
            <p className="text-xl font-bold text-orange-600">KSh {(totalCommission || 0).toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">💳 Credit O/S</p>
            <p className="text-xl font-bold text-red-600">KSh {(totalCreditOutstanding || 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* SEARCH & FILTER */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer, vehicle, owner..."
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
              <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* BOOKINGS TABLE */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">
            {searchQuery || filterStatus !== 'all' ? 'No bookings match your search' : 'No car bookings found'}
          </p>
          <p className="text-sm text-gray-400">
            {searchQuery || filterStatus !== 'all' ? 'Try adjusting your search or filter' : 'Create your first booking by clicking "New Booking"'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Plus size={16} className="inline mr-1" /> New Booking
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Customer</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Vehicle</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Dates</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Days</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Subtotal</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Discount</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Final Fee</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Commission</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Payment</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((booking) => {
                    const vehicle = getVehicleDetails(booking.vehicleId);
                    const statusBadge = getStatusBadge(booking.status);
                    const StatusIcon = statusBadge.icon;
                    const hasRemainingBalance = (booking.remainingBalance || 0) > 0;
                    const hasDiscount = (booking.discountAmount || 0) > 0;

                    return (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                       <td className="px-3 py-3 whitespace-nowrap">
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(booking.status)}`}></div>
    <div>
      <p className="font-medium text-gray-800 text-sm">{booking.customerName || 'Customer'}</p>
      <p className="text-xs text-gray-400 truncate max-w-[120px]">{booking.customerPhone || ''}</p>
      {/* ✅ ADD THIS BADGE */}
      <span className={`text-[10px] font-bold mt-0.5 inline-block ${
        booking.isGuestBooking || booking.isGuestBooking === true
          ? 'text-orange-600' 
          : 'text-green-600'
      }`}>
        {booking.isGuestBooking || booking.isGuestBooking === true ? '👤 Guest' : '📋 Registered'}
      </span>
    </div>
  </div>
</td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-xs">
                            <p className="font-medium text-gray-700">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'N/A'}</p>
                            <p className="text-gray-400">{vehicle?.registration || 'N/A'}</p>
                            <p className="text-green-600 text-[10px]">KSh {booking.vehiclePricePerDay?.toLocaleString()}/day</p>
                          </div>
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-xs">
                            <p className="text-gray-600">{formatDateTime(booking.startDate)}</p>
                            <p className="text-gray-400">→ {formatDateTime(booking.endDate)}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className="font-semibold text-blue-600 text-sm">{booking.days || 0}</span>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <span className="text-sm text-gray-700">KSh {(booking.subtotal || 0).toLocaleString()}</span>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          {hasDiscount ? (
                            <div>
                              <span className="text-sm text-green-600 font-medium">-KSh {(booking.discountAmount || 0).toLocaleString()}</span>
                              <p className="text-[10px] text-gray-400">
                                {booking.discountType === 'PERCENTAGE' ? `${booking.discountValue}%` : 
                                 booking.discountType === 'FIXED' ? 'Fixed' : 'None'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <span className="text-sm font-bold text-green-600">KSh {(booking.totalPrice || 0).toLocaleString()}</span>
                          {booking.bookingFeePerDay && (
                            <p className="text-[10px] text-gray-400">@{booking.bookingFeePerDay.toLocaleString()}/day</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <span className={`text-sm font-semibold ${(booking.commission || 0) > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                            {(booking.commission || 0) > 0 ? '+' : ''}KSh {(booking.commission || 0).toLocaleString()}
                          </span>
                          {(booking.commission || 0) > 0 && (
                            <span className="text-[10px] text-purple-500 block">Profit</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs">{getPaymentMethodIcon(booking.paymentMethod)}</span>
                            
                            {booking.status === 'completed' ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-800">✅ Paid</span>
                            ) : booking.status === 'cancelled' ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800">❌ Cancelled</span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">⏳ Pending</span>
                            )}
                            
                            {hasRemainingBalance && (
                              <span className="text-[10px] text-orange-600 font-medium">
                                O/S: KSh {(booking.remainingBalance || 0).toLocaleString()}
                              </span>
                            )}
                            
                            {booking.mpesaCode && (
                              <span className="text-[8px] font-mono text-blue-500 truncate max-w-[80px]">{booking.mpesaCode}</span>
                            )}
                            
                            {(booking.paidAmount || 0) > 0 && (
                              <span className="text-[9px] text-green-600">Should Pay: KSh {(booking.totalPrice || 0).toLocaleString()}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color} flex items-center gap-1 justify-center`}>
                            <StatusIcon size={12} /> {statusBadge.label}
                          </span>
                          {booking.ownerName && (
                            <p className="text-[8px] text-gray-400 mt-0.5 truncate max-w-[80px]">{booking.ownerName}</p>
                          )}
                        </td>
                        <td className="px-1.5 py-1.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowDetailModal(true);
                              }}
                              className="p-0.5 sm:p-1 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                              title="View Details"
                            >
                              <Eye size={11} className="sm:w-[13px] sm:h-[13px]" />
                            </button>
                            <button
  onClick={() => {
    setEditingBooking(booking);
    setEditFormData({
      customerName: booking.customerName || '',
      customerEmail: booking.customerEmail || '',
      customerPhone: booking.customerPhone || '',
      customerIdNumber: booking.customerIdNumber || '',
      customerLicenseNumber: booking.customerLicenseNumber || '',
      customerIdImage: booking.customerIdImage || null,
      customerLicenseImage: booking.customerLicenseImage || null,
      vehicleId: booking.vehicleId || '',
      startDate: booking.startDate ? booking.startDate.split('T')[0] : '',
      startTime: booking.startDate ? booking.startDate.split('T')[1]?.slice(0, 5) || '08:00' : '08:00',
      endDate: booking.endDate ? booking.endDate.split('T')[0] : '',
      endTime: booking.endDate ? booking.endDate.split('T')[1]?.slice(0, 5) || '18:00' : '18:00',
      notes: booking.notes || '',
      bookingFee: booking.bookingFeePerDay?.toString() || '',
      days: booking.days || 0,
      discountType: booking.discountType || 'NONE',
      discountValue: booking.discountValue || '',
      discountAmount: booking.discountAmount || 0,
      paymentMethod: booking.paymentMethod || 'CASH',
      paymentStatus: booking.paymentStatus || 'PENDING',
      mpesaCode: booking.mpesaCode || '',
      paidAmount: booking.paidAmount || 0,
      remainingBalance: booking.remainingBalance || 0,
      vehicleConditionImages: booking.vehicleConditionImages || []
    });
    setShowEditModal(true);
  }}
  className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
  title="Edit Booking"
>
  <Edit2 size={11} className="sm:w-[13px] sm:h-[13px]" />
</button>
                            {hasRemainingBalance && (
                              <button
                                onClick={() => {
                                  const customerName = booking.customerName;
                                  localStorage.setItem('selected_crm_customer', customerName);
                                  if (setActiveTab) {
                                    setActiveTab('car-crm');
                                  }
                                  window.dispatchEvent(new CustomEvent('navigateTo', { 
                                    detail: { 
                                      tab: 'car-crm',
                                      customer: customerName 
                                    } 
                                  }));
                                }}
                                className="p-1 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Record Payment"
                              >
                                <CreditCard size={11} className="sm:w-[13px] sm:h-[13px]" />
                              </button>
                            )}

                            <button
      onClick={() => handlePrintBooking(booking)}
      className="p-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
      title="Print Booking"
    >
      <FileText size={11} className="sm:w-[13px] sm:h-[13px]" />
    </button>


                            <button
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowDeleteModal(true);
                              }}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={13} className="sm:w-[15px] sm:h-[15px]" />
                            </button>
                          </div>
                          <p className="text-[8px] text-gray-400 mt-0.5">
                            {new Date(booking.createdAt).toLocaleDateString()}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBookings.length)} of {filteredBookings.length} bookings
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${
                    currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-1 text-gray-400">...</span>
                    <button
                      onClick={() => paginate(totalPages)}
                      className="px-3 py-1.5 rounded-lg text-sm hover:bg-gray-100 text-gray-700 transition-colors"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ${
                    currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

export default CarBookings;