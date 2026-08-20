import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Car, Calendar, User, Phone, Mail, Search, Filter, 
  MapPin, Clock, CheckCircle, AlertCircle, X, 
  DollarSign, Star, ArrowRight, CreditCard, Wallet,
  Upload, Camera, FileText, Plus, Edit, Trash2,
  Eye, ChevronDown, ChevronUp, Info, Shield,
  Fuel, Gauge, Users, Luggage, Settings, Wrench,
  Clock as ClockIcon, Calendar as CalendarIcon,
  Check, AlertTriangle, Loader, MessageCircle,
  Heart, Share2, Bookmark, Navigation, Receipt, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { vehicleService, bookingService } from '../../services/api';
import TermsAndConditions from '../../components/common/TermsAndConditions';

const CarHire = ({ setActiveTab, user }) => {
  const { currentUser } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    priceRange: 'all',
    transmission: 'all',
    capacity: 'all'
  });
  const [notification, setNotification] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Terms and conditions state
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    startDate: '',
    endDate: '',
    startTime: '08:00',
    endTime: '18:00',
    notes: '',
    paymentMethod: 'CASH',
    mpesaCode: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerIdNumber: '',
    customerLicenseNumber: '',
    customerIdImage: null,
    customerLicenseImage: null
  });

  // Image previews
  const [idImagePreview, setIdImagePreview] = useState(null);
  const [licenseImagePreview, setLicenseImagePreview] = useState(null);
  
  // Image upload refs
  const idImageRef = useRef(null);
  const licenseImageRef = useRef(null);

  // Calculated values
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [days, setDays] = useState(0);

  // Load user data and tenant ID
  useEffect(() => {
    const userData = currentUser || user || JSON.parse(localStorage.getItem('user') || '{}');
    const tid = userData?.tenantId || null;
    console.log('🔍 Tenant ID from user:', tid);
    setTenantId(tid);
    
    if (userData) {
      setLoggedInUser(userData);
      setBookingForm(prev => ({
        ...prev,
        customerName: userData.name || '',
        customerEmail: userData.email || '',
        customerPhone: userData.phone || ''
      }));
    }
    
    if (tid) {
      loadData(tid);
    } else {
      console.warn('⚠️ No tenantId found, loading from localStorage');
      loadFromLocalStorage();
    }
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Load data from API
  const loadData = async (tid) => {
    setLoading(true);
    
    try {
      const tenantToUse = tid || tenantId;
      console.log('🔍 Loading car hire data with tenantId:', tenantToUse);
      
      if (!tenantToUse) {
        console.warn('⚠️ No tenantId available, using localStorage');
        loadFromLocalStorage();
        setLoading(false);
        return;
      }
      
      let vehiclesData = [];
      let carBookings = [];
      
      try {
        console.log('📤 Fetching vehicles from API...');
        const vehiclesResponse = await vehicleService.getAll(tenantToUse);
        console.log('📊 Vehicles response:', vehiclesResponse);
        
        if (vehiclesResponse?.success && vehiclesResponse?.data) {
          vehiclesData = vehiclesResponse.data;
        } else if (Array.isArray(vehiclesResponse)) {
          vehiclesData = vehiclesResponse;
        }
        
        const activeVehicles = vehiclesData.filter(v => v.status === 'active' || v.status === 'Active');
        setVehicles(activeVehicles);
      } catch (vehiclesError) {
        console.error('❌ Error loading vehicles:', vehiclesError);
      }

      try {
        console.log('📤 Fetching bookings from API...');
        const bookingsResponse = await bookingService.getAll(tenantToUse);
        
        let allBookingsData = [];
        if (bookingsResponse?.success && bookingsResponse?.data) {
          allBookingsData = bookingsResponse.data;
        } else if (Array.isArray(bookingsResponse)) {
          allBookingsData = bookingsResponse;
        }
        
        carBookings = allBookingsData.filter(b => 
          b.serviceType === 'car_hire' || 
          b.serviceType === 'car' ||
          b.serviceType === 'Car Hire'
        );
        setAllBookings(carBookings);
      } catch (bookingsError) {
        console.error('❌ Error loading bookings:', bookingsError);
      }
      
      if (vehiclesData.length === 0 && carBookings.length === 0) {
        console.warn('⚠️ No data from API, using localStorage fallback');
        loadFromLocalStorage();
      }
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
      showNotification('Error loading data. Using local data.', 'error');
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  // Fallback to localStorage
  const loadFromLocalStorage = () => {
    console.warn('Loading car hire data from localStorage (fallback)');
    
    try {
      const storedVehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
      setVehicles(storedVehicles.filter(v => v.status === 'active' || v.status === 'Active'));
      
      const storedBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      const guestBookings = JSON.parse(localStorage.getItem('travel_agency_guest_bookings') || '[]');
      
      const bookingMap = new Map();
      storedBookings.forEach(b => bookingMap.set(b.id, b));
      guestBookings.forEach(b => bookingMap.set(b.id, b));
      
      const allCombinedBookings = Array.from(bookingMap.values());
      const carBookings = allCombinedBookings.filter(b => 
        b.serviceType === 'car_hire' || 
        b.serviceType === 'car' ||
        b.serviceType === 'Car Hire'
      );
      
      setAllBookings(carBookings);
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const formatCurrency = (amount) => {
    return `KSh ${(amount || 0).toLocaleString()}`;
  };

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

  const getUserBookings = () => {
    const userToCheck = loggedInUser || user || currentUser;
    if (!userToCheck) return [];
    
    return allBookings.filter(b => {
      if (b.userId && b.userId === userToCheck.id) return true;
      if (b.customerEmail && b.customerEmail.toLowerCase() === userToCheck.email?.toLowerCase()) return true;
      if (b.customerPhone && b.customerPhone === userToCheck.phone) return true;
      if (b.userEmail && b.userEmail.toLowerCase() === userToCheck.email?.toLowerCase()) return true;
      return false;
    });
  };

  const getActiveBookingsCount = (vehicleId) => {
    return allBookings.filter(b => 
      b.vehicleId === vehicleId && 
      (b.status === 'pending' || b.status === 'confirmed')
    ).length;
  };

  const getVehicleStatus = (vehicle) => {
  // ✅ SAFETY CHECK - If bookingForm doesn't exist or is undefined
  if (!bookingForm || typeof bookingForm !== 'object') {
    return {
      status: 'available',
      label: 'Available',
      color: 'green',
      count: 0
    };
  }

  // ✅ SAFETY CHECK - If startDate or endDate don't exist
  if (!bookingForm.startDate || !bookingForm.endDate) {
    return {
      status: 'available',
      label: 'Available',
      color: 'green',
      count: 0
    };
  }

  // If dates are selected, check availability for those specific dates
  if (bookingForm.startDate && bookingForm.endDate) {
    const isAvailable = isVehicleAvailableForDates(
      vehicle.id, 
      bookingForm.startDate, 
      bookingForm.endDate
    );
    
    if (!isAvailable) {
      const conflicts = getOverlappingBookings(
        vehicle.id, 
        bookingForm.startDate, 
        bookingForm.endDate
      );
      const conflict = conflicts[0];
      if (conflict) {
        return {
          status: 'not_available',
          label: `Booked ${formatDateTime(conflict.startDate).split(',')[0]} - ${formatDateTime(conflict.endDate).split(',')[0]}`,
          color: 'red',
          count: conflicts.length
        };
      }
      return {
        status: 'not_available',
        label: 'Not Available',
        color: 'red',
        count: 0
      };
    }
    
    return {
      status: 'available',
      label: 'Available for selected dates ✅',
      color: 'green',
      count: 0
    };
  }
  
  // ✅ If NO DATES SELECTED, ALWAYS SHOW "Available"
  return {
    status: 'available',
    label: 'Available',
    color: 'green',
    count: 0
  };
};

  // ✅ Check if vehicle is available for specific dates (date-aware with time)
const isVehicleAvailableForDates = (vehicleId, startDate, endDate) => {
  if (!startDate || !endDate) return true; // No dates selected yet
  
  // Parse the dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check if start date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) {
    return false; // Can't book in the past
  }
  
  // Check if end date is after start date
  if (end <= start) {
    return false;
  }
  
  // Check for overlapping bookings (date-aware)
  return !allBookings.some(b => 
    b.vehicleId === vehicleId &&
    (b.status === 'pending' || b.status === 'confirmed') &&
    // Check if dates overlap
    new Date(b.startDate) < end &&
    new Date(b.endDate) > start
  );
};

// ✅ Get overlapping bookings for a vehicle
const getOverlappingBookings = (vehicleId, startDate, endDate) => {
  if (!startDate || !endDate) return [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return allBookings.filter(b => 
    b.vehicleId === vehicleId &&
    (b.status === 'pending' || b.status === 'confirmed') &&
    new Date(b.startDate) < end &&
    new Date(b.endDate) > start
  );
};

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  const handleDateChange = useCallback(() => {
    const calculatedDays = calculateDays(bookingForm.startDate, bookingForm.endDate);
    setDays(calculatedDays);
    
    if (selectedVehicle && calculatedDays > 0) {
      const pricePerDay = parseFloat(selectedVehicle.pricePerDay) || 0;
      const total = pricePerDay * calculatedDays;
      setCalculatedTotal(total);
    }
  }, [bookingForm.startDate, bookingForm.endDate, selectedVehicle]);

  const handleIdImageUpload = useCallback(async (e) => {
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
        setBookingForm(prev => ({ ...prev, customerIdImage: compressed }));
        setIdImagePreview(compressed);
        showNotification('ID image uploaded successfully!');
      } catch (error) {
        console.error('Error compressing image:', error);
        showNotification('Failed to process image', 'error');
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const handleLicenseImageUpload = useCallback(async (e) => {
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
        setBookingForm(prev => ({ ...prev, customerLicenseImage: compressed }));
        setLicenseImagePreview(compressed);
        showNotification('License image uploaded successfully!');
      } catch (error) {
        console.error('Error compressing image:', error);
        showNotification('Failed to process image', 'error');
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const removeIdImage = useCallback(() => {
    setIdImagePreview(null);
    setBookingForm(prev => ({ ...prev, customerIdImage: null }));
    if (idImageRef.current) idImageRef.current.value = '';
  }, []);

  const removeLicenseImage = useCallback(() => {
    setLicenseImagePreview(null);
    setBookingForm(prev => ({ ...prev, customerLicenseImage: null }));
    if (licenseImageRef.current) licenseImageRef.current.value = '';
  }, []);

  const handleBookingSubmit = useCallback(async (e) => {
    e.preventDefault();

     if (isSubmitting) {
    console.log('⚠️ Already submitting, please wait...');
    return;
  }
    
    if (!bookingForm.customerName) {
      showNotification('Please enter your name', 'error');
      return;
    }
    if (!bookingForm.customerEmail) {
      showNotification('Please enter your email', 'error');
      return;
    }
    if (!bookingForm.customerPhone) {
      showNotification('Please enter your phone number', 'error');
      return;
    }
    if (!selectedVehicle) {
      showNotification('Please select a vehicle', 'error');
      return;
    }

    if (!bookingForm.startDate || !bookingForm.endDate) {
  showNotification('Please select start and end dates', 'error');
  return;
}

// ✅ CHECK IF START DATE IS IN THE PAST
const startDateObj = new Date(bookingForm.startDate);
const today = new Date();
today.setHours(0, 0, 0, 0);
if (startDateObj < today) {
  showNotification('⚠️ Start date cannot be in the past', 'error');
  return;
}

// ✅ CHECK IF END DATE IS AFTER START DATE
const endDateObj = new Date(bookingForm.endDate);
if (endDateObj <= startDateObj) {
  showNotification('⚠️ End date must be after start date', 'error');
  return;
}

const startDateTime = `${bookingForm.startDate}T${bookingForm.startTime || '08:00'}`;
const endDateTime = `${bookingForm.endDate}T${bookingForm.endTime || '18:00'}`;

// ✅ CHECK AVAILABILITY
if (!isVehicleAvailableForDates(selectedVehicle.id, startDateTime, endDateTime)) {
  const conflicts = getOverlappingBookings(selectedVehicle.id, startDateTime, endDateTime);
  let conflictMessage = '❌ This vehicle is not available for the selected dates.';
  if (conflicts.length > 0) {
    const conflict = conflicts[0];
    conflictMessage = `❌ This vehicle is booked from ${formatDateTime(conflict.startDate)} to ${formatDateTime(conflict.endDate)}. Please choose different dates or another vehicle.`;
  }
  showNotification(conflictMessage, 'error');
  return;
}

    if (bookingForm.paymentMethod === 'M_PESA') {
      if (!bookingForm.mpesaCode || bookingForm.mpesaCode.length < 6) {
        showNotification('Please enter a valid M-Pesa transaction code', 'error');
        return;
      }
    }

    const daysCount = calculateDays(bookingForm.startDate, bookingForm.endDate);
    const totalAmount = selectedVehicle.pricePerDay * daysCount;
    const ref = `BOOK-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    const currentUser = loggedInUser || user || currentUser;

    const newBooking = {
      reference: ref,
      serviceType: 'car_hire',
      vehicleId: selectedVehicle.id,
      customerName: bookingForm.customerName,
      customerEmail: bookingForm.customerEmail,
      customerPhone: bookingForm.customerPhone,
      customerIdNumber: bookingForm.customerIdNumber || '',
      customerLicenseNumber: bookingForm.customerLicenseNumber || '',
      customerIdImage: bookingForm.customerIdImage || null,
      customerLicenseImage: bookingForm.customerLicenseImage || null,
      startDate: startDateTime,
      endDate: endDateTime,
      days: daysCount,
      totalPrice: totalAmount,
      paymentMethod: bookingForm.paymentMethod,
      paymentStatus: bookingForm.paymentMethod === 'CREDIT' ? 'PENDING' : 'PAID',
      mpesaCode: bookingForm.mpesaCode || '',
      paidAmount: bookingForm.paymentMethod === 'CREDIT' ? 0 : totalAmount,
      remainingBalance: bookingForm.paymentMethod === 'CREDIT' ? totalAmount : 0,
      notes: bookingForm.notes || '',
      status: 'pending',
      isGuestBooking: false,
      userId: currentUser?.id || '',
      userEmail: currentUser?.email || '',
      vehicleRegistration: selectedVehicle.registration || '',
      vehicleMake: selectedVehicle.make || '',
      vehicleModel: selectedVehicle.model || '',
      vehiclePricePerDay: selectedVehicle.pricePerDay || 0,
      tenantId: tenantId
    };

        // ✅ If all validation passes, show terms modal
    setShowTermsModal(true);
  }, [bookingForm, selectedVehicle, loggedInUser, user, currentUser, tenantId]);

  // Perform the actual booking after terms are accepted
const performCarHireBooking = useCallback(async (signatureData = null) => {
  setIsSubmitting(true);

  const daysCount = calculateDays(bookingForm.startDate, bookingForm.endDate);
  const totalAmount = selectedVehicle.pricePerDay * daysCount;
  const ref = `BOOK-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

  const currentUser = loggedInUser || user || currentUser;
  const startDateTime = `${bookingForm.startDate}T${bookingForm.startTime || '08:00'}`;
  const endDateTime = `${bookingForm.endDate}T${bookingForm.endTime || '18:00'}`;

  const newBooking = {
    reference: ref,
    serviceType: 'car_hire',
    vehicleId: selectedVehicle.id,
    customerName: bookingForm.customerName,
    customerEmail: bookingForm.customerEmail,
    customerPhone: bookingForm.customerPhone,
    customerIdNumber: bookingForm.customerIdNumber || '',
    customerLicenseNumber: bookingForm.customerLicenseNumber || '',
    customerIdImage: bookingForm.customerIdImage || null,
    customerLicenseImage: bookingForm.customerLicenseImage || null,
    startDate: startDateTime,
    endDate: endDateTime,
    days: daysCount,
    totalPrice: totalAmount,
    paymentMethod: bookingForm.paymentMethod,
    paymentStatus: bookingForm.paymentMethod === 'CREDIT' ? 'PENDING' : 'PAID',
    mpesaCode: bookingForm.mpesaCode || '',
    paidAmount: bookingForm.paymentMethod === 'CREDIT' ? 0 : totalAmount,
    remainingBalance: bookingForm.paymentMethod === 'CREDIT' ? totalAmount : 0,
    notes: bookingForm.notes || '',
    status: 'pending',
    isGuestBooking: false,
    userId: currentUser?.id || '',
    userEmail: currentUser?.email || '',
    vehicleRegistration: selectedVehicle.registration || '',
    vehicleMake: selectedVehicle.make || '',
    vehicleModel: selectedVehicle.model || '',
    vehiclePricePerDay: selectedVehicle.pricePerDay || 0,
    tenantId: tenantId,
    // ✅ Terms fields
    termsAccepted: true,
    termsAcceptedAt: new Date().toISOString(),
    termsVersion: "1.0",
    customerSignature: signatureData
  };

  try {
    console.log('📤 Creating booking:', newBooking);
    const response = await bookingService.create(newBooking);

    if (response?.success) {
      showNotification(`✅ Booking confirmed! Reference: ${ref}`);
      loadData(tenantId);
      setShowBookingModal(false);
      setSelectedVehicle(null);
      setCalculatedTotal(0);
      setDays(0);
      setIdImagePreview(null);
      setLicenseImagePreview(null);
      
      const userToKeep = loggedInUser || user || currentUser;
      setBookingForm({
        startDate: '',
        endDate: '',
        startTime: '08:00',
        endTime: '18:00',
        notes: '',
        paymentMethod: 'CASH',
        mpesaCode: '',
        customerName: userToKeep?.name || '',
        customerEmail: userToKeep?.email || '',
        customerPhone: userToKeep?.phone || '',
        customerIdNumber: '',
        customerLicenseNumber: '',
        customerIdImage: null,
        customerLicenseImage: null
      });
    } else {
      showNotification('Failed to create booking: ' + (response?.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error creating booking:', error);
    showNotification('Failed to create booking. Please try again.', 'error');
  }
  
  setIsSubmitting(false);
}, [bookingForm, selectedVehicle, loggedInUser, user, currentUser, tenantId]);

// Terms handlers
const handleCarHireTermsAccept = (signatureData) => {
  setShowTermsModal(false);
  performCarHireBooking(signatureData);
};

const handleCarHireTermsDecline = () => {
  setShowTermsModal(false);
  showNotification('You must accept the terms and conditions to proceed.', 'error');
};

  const cancelBooking = useCallback(async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      const response = await bookingService.updateStatus(bookingId, 'cancelled');

      if (response?.success) {
        showNotification('Booking cancelled successfully');
        loadData(tenantId);
      } else {
        showNotification('Failed to cancel booking: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showNotification('Failed to cancel booking. Please try again.', 'error');
    }
  }, [tenantId]);

  // Filter vehicles
  const filteredVehicles = vehicles.filter(vehicle => {
    const searchMatch = searchTerm === '' || 
      vehicle.make?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vehicle.registration?.toLowerCase().includes(searchTerm.toLowerCase());

    const typeMatch = filters.type === 'all' || vehicle.type === filters.type;
    
    let priceMatch = true;
    if (filters.priceRange === 'low') priceMatch = vehicle.pricePerDay <= 5000;
    else if (filters.priceRange === 'medium') priceMatch = vehicle.pricePerDay > 5000 && vehicle.pricePerDay <= 15000;
    else if (filters.priceRange === 'high') priceMatch = vehicle.pricePerDay > 15000;

    const transmissionMatch = filters.transmission === 'all' || vehicle.transmission === filters.transmission;
    const capacityMatch = filters.capacity === 'all' || vehicle.capacity >= parseInt(filters.capacity);

    return searchMatch && typeMatch && priceMatch && transmissionMatch && capacityMatch;
  });

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  };

  const getVehicleTypeIcon = (type) => {
    const icons = {
      sedan: '🚗',
      suv: '🚙',
      truck: '🚛',
      van: '🚐',
      luxury: '🚘',
      convertible: '🏎️'
    };
    return icons[type] || '🚗';
  };

  const getTransmissionLabel = (transmission) => {
    const labels = {
      automatic: 'Automatic',
      manual: 'Manual'
    };
    return labels[transmission] || transmission;
  };

  // COMPACT Vehicle Card
  // COMPACT Vehicle Card
const VehicleCard = ({ vehicle }) => {
  const status = getVehicleStatus(vehicle);
  const activeCount = getActiveBookingsCount(vehicle.id);

  const [showVehicleDetailModal, setShowVehicleDetailModal] = useState(false);

  const handleBookClick = () => {
    setSelectedVehicle(vehicle);
    const userToUse = loggedInUser || user || currentUser;
    setBookingForm(prev => ({
      ...prev,
      customerName: userToUse?.name || '',
      customerEmail: userToUse?.email || '',
      customerPhone: userToUse?.phone || ''
    }));
    setShowBookingModal(true);
  };

  const handleViewClick = () => {
    setSelectedVehicle(vehicle);
    setShowVehicleDetailModal(true);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
        {/* Image */}
        <div className="relative h-40 bg-gray-100">
          {vehicle.images ? (
            <img 
              src={vehicle.images} 
              alt={`${vehicle.make} ${vehicle.model}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Car size={32} className="text-gray-400" />
            </div>
          )}
          
          <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[8px] font-semibold 
            ${status.color === 'green' ? 'bg-green-100 text-green-700' : 
              status.color === 'red' ? 'bg-red-100 text-red-700' : 
              'bg-yellow-100 text-yellow-700'}`}
          >
            {status.label}
          </div>

          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[8px] font-semibold">
            {getVehicleTypeIcon(vehicle.type)} {vehicle.type?.toUpperCase() || 'CAR'}
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-base font-bold text-gray-800">
                {vehicle.make} {vehicle.model}
              </h3>
              <p className="text-xs text-gray-500">{vehicle.registration}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-blue-600">
                {formatCurrency(vehicle.pricePerDay)}
              </p>
              <p className="text-[8px] text-gray-400">/day</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users size={14} className="text-blue-500" />
              {vehicle.seatingCapacity || 5}
            </span>
            <span className="flex items-center gap-1">
              <Settings size={14} className="text-blue-500" />
              {getTransmissionLabel(vehicle.transmission)}
            </span>
            <span className="flex items-center gap-1">
              <Fuel size={14} className="text-blue-500" />
              {vehicle.fuelType || 'Petrol'}
            </span>
          </div>

          {vehicle.location && (
            <div className="flex items-center gap-0.5 text-[9px] text-gray-400 mt-0.5">
              <MapPin size={10} />
              <span className="truncate">{vehicle.location}</span>
            </div>
          )}

          {/* ✅ Status Display */}
          <div className="mt-2">
            {(() => {
              // If dates are selected, check availability for those specific dates
              if (bookingForm.startDate && bookingForm.endDate) {
                const isAvailable = isVehicleAvailableForDates(
                  vehicle.id, 
                  bookingForm.startDate, 
                  bookingForm.endDate
                );
                const conflicts = getOverlappingBookings(
                  vehicle.id, 
                  bookingForm.startDate, 
                  bookingForm.endDate
                );
                
                if (!isAvailable && conflicts.length > 0) {
                  const conflict = conflicts[0];
                  return (
                    <div className="text-[9px] text-red-600 bg-red-50 rounded px-2 py-0.5 text-center">
                      ❌ Booked {formatDateTime(conflict.startDate).split(',')[0]} - {formatDateTime(conflict.endDate).split(',')[0]}
                    </div>
                  );
                } else if (isAvailable) {
                  return (
                    <div className="text-[9px] text-green-600 bg-green-50 rounded px-2 py-0.5 text-center">
                      ✅ Available for selected dates
                    </div>
                  );
                }
              }
              
              // ✅ If NO DATES SELECTED, ALWAYS SHOW "Available"
              return (
                <div className="text-[9px] text-green-600 bg-green-50 rounded px-2 py-0.5 text-center">
                  ✅ Available
                </div>
              );
            })()}
          </div>

          {/* ✅ TWO BUTTONS: View Details + Book Now */}
          <div className="flex gap-2 mt-3">
            {/* View Details Button - ALWAYS enabled */}
            <button
              onClick={handleViewClick}
              className="px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            >
              <Eye size={14} />
              View
            </button>

            {/* Book Now Button - Enabled/Disabled based on availability */}
            {(() => {
              let isAvailable = true;
              let buttonText = 'Book Now';
              
              if (bookingForm.startDate && bookingForm.endDate) {
                isAvailable = isVehicleAvailableForDates(
                  vehicle.id, 
                  bookingForm.startDate, 
                  bookingForm.endDate
                );
                if (!isAvailable) {
                  buttonText = 'Not Available';
                }
              }
              // ✅ No dates selected - always Book Now
              
              return (
                <button
                  onClick={handleBookClick}
                  disabled={!isAvailable}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2
                    ${!isAvailable 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                  <Calendar size={14} />
                  {buttonText}
                </button>
              );
            })()}
          </div>
        </div>
      </div>

      {/* ✅ Vehicle Detail Modal (View-Only) */}
      {showVehicleDetailModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Vehicle Details</h3>
                <p className="text-sm text-gray-500">
                  {selectedVehicle.make} {selectedVehicle.model}
                </p>
              </div>
              <button onClick={() => {
                setShowVehicleDetailModal(false);
                setSelectedVehicle(null);
              }} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Vehicle Image */}
              {selectedVehicle.images ? (
                <img 
                  src={selectedVehicle.images} 
                  alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                  className="w-full h-56 object-cover rounded-lg"
                />
              ) : (
                <div className="w-full h-56 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Car size={48} className="text-gray-400" />
                </div>
              )}

              {/* Vehicle Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Make</p>
                  <p className="font-semibold">{selectedVehicle.make}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Model</p>
                  <p className="font-semibold">{selectedVehicle.model}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Registration</p>
                  <p className="font-semibold">{selectedVehicle.registration}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price per Day</p>
                  <p className="font-semibold text-blue-600">{formatCurrency(selectedVehicle.pricePerDay)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Seating Capacity</p>
                  <p className="font-semibold">{selectedVehicle.seatingCapacity || 5}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Transmission</p>
                  <p className="font-semibold">{getTransmissionLabel(selectedVehicle.transmission)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Fuel Type</p>
                  <p className="font-semibold">{selectedVehicle.fuelType || 'Petrol'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-semibold">{selectedVehicle.location || 'N/A'}</p>
                </div>
              </div>

              {/* Description */}
              {selectedVehicle.description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700">{selectedVehicle.description}</p>
                </div>
              )}

              {/* Availability Status */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-500">Availability</p>
                <p className="font-semibold text-green-600">✅ Available for booking</p>
              </div>

              <button
                onClick={() => {
                  setShowVehicleDetailModal(false);
                  // Open booking modal
                  setShowBookingModal(true);
                }}
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
              >
                <Calendar size={18} />
                Book Now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

  // Booking Card - Compact
  const BookingCard = ({ booking }) => {
    const tenantPhone = currentUser?.tenantPhone || '0700584143';
    return (
      <div className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-1">
          <div>
            <p className="text-sm font-semibold text-gray-800">{booking.itemName || booking.vehicleRegistration}</p>
            <p className="text-[10px] text-gray-400">Ref: {booking.reference}</p>
          </div>
          <span className={`px-2 py-0.5 rounded-full text-[8px] font-semibold 
            ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
              booking.status === 'active' ? 'bg-green-100 text-green-700' :
              booking.status === 'completed' ? 'bg-gray-100 text-gray-700' :
              'bg-red-100 text-red-700'}`}
          >
            {getStatusLabel(booking.status)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 text-[10px] mb-2">
          <div>
            <p className="text-gray-400">Start</p>
            <p className="font-medium text-gray-700 text-[9px]">{formatDateTime(booking.startDate)}</p>
          </div>
          <div>
            <p className="text-gray-400">End</p>
            <p className="font-medium text-gray-700 text-[9px]">{formatDateTime(booking.endDate)}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400">Total</p>
            <p className="font-medium text-blue-600 text-[10px]">{formatCurrency(booking.totalPrice)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <button
              onClick={() => cancelBooking(booking.id)}
              className="flex-1 px-2 py-1 bg-red-50 text-red-600 rounded text-[10px] hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
            >
              <X size={12} /> Cancel
            </button>
          )}
          <a
  href={`tel:${tenantPhone}`}
  className="flex-1 px-2 py-1 bg-green-50 text-green-600 rounded text-[10px] hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
>
  <Phone size={12} /> Contact
</a>
        </div>
      </div>
    );
  };

  // Booking Modal
  const BookingModal = useMemo(() => {
    if (!showBookingModal || !selectedVehicle) return null;

    const daysCount = calculateDays(bookingForm.startDate, bookingForm.endDate);
    const total = selectedVehicle.pricePerDay * daysCount;

    const handleClose = () => {
      setShowBookingModal(false);
      setSelectedVehicle(null);
      setCalculatedTotal(0);
      setDays(0);
      setIdImagePreview(null);
      setLicenseImagePreview(null);
    };

    const handleInputChange = (field) => (e) => {
      setBookingForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleDateInputChange = (field) => (e) => {
      setBookingForm(prev => ({ ...prev, [field]: e.target.value }));
      requestAnimationFrame(() => {
        handleDateChange();
      });
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Book Vehicle</h3>
              <p className="text-sm text-gray-500">
                {selectedVehicle.make} {selectedVehicle.model}
              </p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-4">
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{selectedVehicle.make} {selectedVehicle.model}</p>
                  <p className="text-sm text-gray-600">{selectedVehicle.registration}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Price per day</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedVehicle.pricePerDay)}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {/* Personal Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User size={16} className="text-blue-500" /> Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={bookingForm.customerName}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed pr-8"
                        readOnly
                        required
                      />
                      <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">From your registration</p>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                    <div className="relative">
                      <input
                        type="email"
                        value={bookingForm.customerEmail}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed pr-8"
                        readOnly
                        required
                      />
                      <Lock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">From your registration</p>
                  </div>

                  <div>
  <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number *</label>
  <input
    type="tel"
    value={bookingForm.customerPhone}
    onChange={handleInputChange('customerPhone')}
    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
    placeholder="+254 700 000 000"
    required
  />
  <p className="text-[10px] text-gray-400 mt-0.5">You can update your phone number for this booking</p>
</div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ID/Passport No</label>
                    <input
                      type="text"
                      value={bookingForm.customerIdNumber}
                      onChange={handleInputChange('customerIdNumber')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="12345678"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Driver's License Number</label>
                    <input
                      type="text"
                      value={bookingForm.customerLicenseNumber}
                      onChange={handleInputChange('customerLicenseNumber')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="DL-123456789"
                    />
                  </div>
                </div>

                {/* ID Image Upload */}
                <div className="mt-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">ID Image</label>
                  <div className="flex items-center gap-3">
                    <input
                      ref={idImageRef}
                      type="file"
                      accept="image/*"
                      onChange={handleIdImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => idImageRef.current?.click()}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs flex items-center gap-1"
                    >
                      <Upload size={14} /> Upload ID
                    </button>
                    {idImagePreview && (
                      <div className="relative inline-block">
                        <img src={idImagePreview} alt="ID" className="h-12 w-12 object-cover rounded-lg border border-gray-200" />
                        <button type="button" onClick={removeIdImage} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-sm" style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* License Image Upload */}
                <div className="mt-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">License Image</label>
                  <div className="flex items-center gap-3">
                    <input ref={licenseImageRef} type="file" accept="image/*" onChange={handleLicenseImageUpload} className="hidden" />
                    <button type="button" onClick={() => licenseImageRef.current?.click()} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs flex items-center gap-1">
                      <Upload size={14} /> Upload License
                    </button>
                    {licenseImagePreview && (
                      <div className="relative inline-block">
                        <img src={licenseImagePreview} alt="License" className="h-12 w-12 object-cover rounded-lg border border-gray-200" />
                        <button type="button" onClick={removeLicenseImage} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-sm" style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Booking Dates */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" /> Booking Dates
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
                    <input
                      type="date"
                      value={formatDateForInput(bookingForm.startDate)}
                      onChange={handleDateInputChange('startDate')}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formatDateForInput(bookingForm.endDate)}
                      onChange={handleDateInputChange('endDate')}
                      min={bookingForm.startDate || new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                    <input
                      type="time"
                      value={bookingForm.startTime}
                      onChange={handleInputChange('startTime')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                    <input
                      type="time"
                      value={bookingForm.endTime}
                      onChange={handleInputChange('endTime')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    />
                  </div>
                </div>

                {bookingForm.startDate && bookingForm.endDate && daysCount > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Days:</span>
                        <span className="font-semibold ml-1">{daysCount}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-bold text-blue-600 ml-1">{formatCurrency(total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <CreditCard size={16} className="text-blue-500" /> Payment
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method *</label>
                    <select
                      value={bookingForm.paymentMethod}
                      onChange={handleInputChange('paymentMethod')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="CASH">Cash</option>
                      <option value="M_PESA">M-Pesa</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option>
                    </select>
                  </div>
                  {total > 0 && (
                    <div className="flex items-end">
                      <div className="w-full p-2 bg-blue-50 rounded-lg text-center">
                        <span className="text-xs text-gray-500">Total Amount</span>
                        <p className="text-lg font-bold text-blue-600">{formatCurrency(total)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {bookingForm.paymentMethod === 'M_PESA' && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">M-Pesa Transaction Code *</label>
                    <div className="relative">
                      <Receipt size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={bookingForm.mpesaCode}
                        onChange={(e) => setBookingForm(prev => ({ ...prev, mpesaCode: e.target.value.toUpperCase() }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g., ABC123DEF456"
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">Enter the M-Pesa confirmation code received</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Additional Notes</h4>
                <textarea
                  value={bookingForm.notes}
                  onChange={handleInputChange('notes')}
                  rows="2"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Any special requests or requirements..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                ℹ️ You will receive a booking reference number via email. Use it to track your booking.
              </div>

              <button
  type="submit"
  disabled={isSubmitting}
  className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2
    ${isSubmitting 
      ? 'bg-gray-400 cursor-not-allowed' 
      : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'}`}
>
  {isSubmitting ? (
    <>
      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Processing...
    </>
  ) : (
    <>
      Submit Booking <ArrowRight size={18} />
    </>
  )}
</button>
            </form>
          </div>
        </div>
      </div>
    );
  }, [
    showBookingModal, 
    selectedVehicle, 
    bookingForm, 
    handleBookingSubmit, 
    handleIdImageUpload, 
    handleLicenseImageUpload, 
    removeIdImage, 
    removeLicenseImage, 
    handleDateChange, 
    calculateDays, 
    formatCurrency, 
    formatDateForInput,
    idImagePreview,
    licenseImagePreview,
    setShowBookingModal,
    setSelectedVehicle,
    tenantId,
    isVehicleAvailableForDates, 
    getOverlappingBookings
  ]);

  const userBookings = getUserBookings();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading vehicles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Notification */}
      {notification && (
  <div className={`fixed top-4 right-4 z-[9999] p-3 rounded-lg shadow-lg flex items-center gap-2 max-w-md
    ${notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
      notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
      'bg-blue-50 border border-blue-200 text-blue-700'}`}
  >
    {notification.type === 'success' ? <CheckCircle size={16} /> :
     notification.type === 'error' ? <AlertCircle size={16} /> :
     <Info size={16} />}
    <span className="flex-1 text-xs">{notification.message}</span>
    <button onClick={() => setNotification(null)} className="ml-2">
      <X size={14} />
    </button>
  </div>
)}

      {/* Header - Compact */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Car className="text-blue-600" size={22} />
            Car Hire
          </h1>
          <p className="text-xs text-gray-500">Browse and book available vehicles</p>
        </div>
        <button
          onClick={() => setShowBookings(!showBookings)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-xs"
        >
          <Calendar size={14} />
          My Bookings ({userBookings.length})
        </button>
      </div>

      {/* Bookings Section - Compact */}
      {showBookings && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-gray-800">Your Bookings</h2>
            <button onClick={() => setShowBookings(false)} className="text-xs text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          {userBookings.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <Calendar size={24} className="text-gray-300 mx-auto mb-1" />
              <p className="text-xs text-gray-500">No bookings yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {userBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search & Filters - Compact */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search vehicles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Types</option>
              <option value="sedan">Sedan</option>
              <option value="suv">SUV</option>
              <option value="truck">Truck</option>
            </select>

            <select
              value={filters.priceRange}
              onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Prices</option>
              <option value="low">Under KSh 5K</option>
              <option value="medium">KSh 5K - 15K</option>
              <option value="high">Over KSh 15K</option>
            </select>

            <select
              value={filters.transmission}
              onChange={(e) => setFilters(prev => ({ ...prev, transmission: e.target.value }))}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Trans</option>
              <option value="automatic">Auto</option>
              <option value="manual">Manual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vehicle Grid - Compact */}
      {filteredVehicles.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Car size={32} className="text-gray-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-gray-600">No vehicles found</h3>
          <p className="text-xs text-gray-400">
            {searchTerm ? 'Try adjusting your search' : 'No vehicles available'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredVehicles.map(vehicle => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {BookingModal}
      {/* Terms and Conditions Modal */}
      <TermsAndConditions
        isOpen={showTermsModal}
        onClose={() => setShowTermsModal(false)}
        onAccept={handleCarHireTermsAccept}
        onDecline={handleCarHireTermsDecline}
        title="Hire Agreement Terms & Conditions"
        serviceType="car_hire"
      />
    </div>
  );
};

export default CarHire;