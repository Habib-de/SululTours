import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Compass, Calendar, User, Phone, Mail, Search, Filter, 
  MapPin, Clock, CheckCircle, AlertCircle, X, 
  DollarSign, Star, ArrowRight, CreditCard, Wallet,
  Upload, Camera, FileText, Plus, Edit, Trash2,
  Eye, Info, Shield, Users, Luggage, Settings,
  Clock as ClockIcon, Calendar as CalendarIcon,
  Check, MessageCircle, Heart, Share2, Bookmark,
  Navigation, Receipt, Lock, Plane, Hotel, Car, Tag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tourPackageService, bookingService } from '../../services/api';

// Helper: Format currency
const formatCurrency = (amount) => {
  return `KSh ${(amount || 0).toLocaleString()}`;
};

// Helper: Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

// Helper: Calculate end date from start date + duration
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
// Helper: Calculate days between dates
const calculateDays = (start, end) => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = Math.abs(endDate - startDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
};
// Helper: Generate booking reference
const generateReference = () => {
  return 'BK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
};

const Tours = ({ setActiveTab, user }) => {
  const { currentUser } = useAuth();
  const [tours, setTours] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTour, setSelectedTour] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    category: 'all',
    priceRange: 'all',
    duration: 'all'
  });
  const [notification, setNotification] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [selectedTourForDetail, setSelectedTourForDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    departureDate: '',
    notes: '',
    paymentMethod: 'CASH',
    mpesaCode: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerIdNumber: '',
    passengers: 1,
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
  const [calculatedEndDate, setCalculatedEndDate] = useState(null);

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
      console.log('🔍 Loading tours data with tenantId:', tenantToUse);
      
      if (!tenantToUse) {
        console.warn('⚠️ No tenantId available, using localStorage');
        loadFromLocalStorage();
        setLoading(false);
        return;
      }
      
      let toursData = [];
      let tourBookings = [];
      
      try {
        console.log('📤 Fetching tours from API...');
        const toursResponse = await tourPackageService.getAll(tenantToUse);
        console.log('📊 Tours response:', toursResponse);
        
        if (toursResponse?.success && toursResponse?.data) {
          toursData = toursResponse.data;
        } else if (Array.isArray(toursResponse)) {
          toursData = toursResponse;
        }
        
        const parsedTours = toursData.map(pkg => ({
          ...pkg,
          inclusions: pkg.inclusions ? (typeof pkg.inclusions === 'string' ? JSON.parse(pkg.inclusions) : pkg.inclusions) : [],
          exclusions: pkg.exclusions ? (typeof pkg.exclusions === 'string' ? JSON.parse(pkg.exclusions) : pkg.exclusions) : [],
          highlights: pkg.highlights ? (typeof pkg.highlights === 'string' ? JSON.parse(pkg.highlights) : pkg.highlights) : [],
          departureDates: pkg.departureDates ? (typeof pkg.departureDates === 'string' ? JSON.parse(pkg.departureDates) : pkg.departureDates) : [],
          images: pkg.images || null
        }));
        
        const activeTours = parsedTours.filter(t => t.status === 'active' || t.status === 'published');
        setTours(activeTours);
      } catch (toursError) {
        console.error('❌ Error loading tours:', toursError);
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
        
        tourBookings = allBookingsData.filter(b => 
          b.serviceType === 'tour' || 
          b.serviceType === 'tour_package' ||
          b.serviceType === 'Tour'
        );
        
        console.log(`📊 Loaded ${tourBookings.length} tour bookings`);
        setAllBookings(tourBookings);
      } catch (bookingsError) {
        console.error('❌ Error loading bookings:', bookingsError);
      }
      
      if (toursData.length === 0 && tourBookings.length === 0) {
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
    console.warn('Loading tours data from localStorage (fallback)');
    
    try {
      const storedTours = JSON.parse(localStorage.getItem('travel_agency_tour_packages') || '[]');
      setTours(storedTours.filter(t => t.status === 'active' || t.status === 'published'));
      
      const storedBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      const guestBookings = JSON.parse(localStorage.getItem('travel_agency_guest_bookings') || '[]');
      
      const bookingMap = new Map();
      storedBookings.forEach(b => bookingMap.set(b.id, b));
      guestBookings.forEach(b => bookingMap.set(b.id, b));
      
      const allCombinedBookings = Array.from(bookingMap.values());
      const tourBookings = allCombinedBookings.filter(b => 
        b.serviceType === 'tour' || b.serviceType === 'tour_package'
      );
      
      setAllBookings(tourBookings);
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  // Handle departure date selection
  const handleDepartureDateChange = useCallback((date) => {
    setBookingForm(prev => ({ ...prev, departureDate: date }));
    
    if (selectedTour && date) {
      const endDate = calculateEndDate(date, selectedTour.duration);
      setCalculatedEndDate(endDate);
      const pricePerPerson = parseFloat(selectedTour.price) || 0;
      const passengers = bookingForm.passengers || 1;
      const total = pricePerPerson * passengers;
      setCalculatedTotal(total);
    }
  }, [selectedTour, bookingForm.passengers]);

  // Get user's bookings
  const getUserBookings = useCallback(() => {
    const userToCheck = loggedInUser || user || currentUser;
    if (!userToCheck) return [];
    
    return allBookings.filter(b => {
      if (b.userId && b.userId === userToCheck.id) return true;
      if (b.customerEmail && b.customerEmail.toLowerCase() === userToCheck.email?.toLowerCase()) return true;
      if (b.customerPhone && b.customerPhone === userToCheck.phone) return true;
      if (b.userEmail && b.userEmail.toLowerCase() === userToCheck.email?.toLowerCase()) return true;
      return false;
    });
  }, [allBookings, loggedInUser, user, currentUser]);

  // Get category icon
  const getCategoryIcon = useCallback((category) => {
    const icons = {
      safari: '🦁',
      beach: '🏖️',
      mountain: '🏔️',
      cultural: '🎭',
      adventure: '🧗',
      wildlife: '🐘',
      hiking: '🥾',
      city: '🏙️',
      luxury: '🌟',
      family: '👨‍👩‍👧‍👦'
    };
    return icons[category] || '🌍';
  }, []);

  // Get category color
  const getCategoryColor = useCallback((category) => {
    const colors = {
      safari: 'text-yellow-600 bg-yellow-100',
      beach: 'text-blue-600 bg-blue-100',
      mountain: 'text-green-600 bg-green-100',
      cultural: 'text-purple-600 bg-purple-100',
      adventure: 'text-red-600 bg-red-100',
      wildlife: 'text-orange-600 bg-orange-100',
      hiking: 'text-emerald-600 bg-emerald-100',
      city: 'text-indigo-600 bg-indigo-100',
      luxury: 'text-pink-600 bg-pink-100',
      family: 'text-teal-600 bg-teal-100'
    };
    return colors[category] || 'text-gray-600 bg-gray-100';
  }, []);

  // Image upload handlers
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
    reader.onloadend = () => {
      try {
        setBookingForm(prev => ({ ...prev, customerIdImage: reader.result }));
        setIdImagePreview(reader.result);
        showNotification('ID image uploaded successfully!');
      } catch (error) {
        console.error('Error processing image:', error);
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
    reader.onloadend = () => {
      try {
        setBookingForm(prev => ({ ...prev, customerLicenseImage: reader.result }));
        setLicenseImagePreview(reader.result);
        showNotification('License image uploaded successfully!');
      } catch (error) {
        console.error('Error processing image:', error);
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

  // Handle booking submission via API
  const handleBookingSubmit = useCallback(async (e) => {
    e.preventDefault();
    
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
    if (!selectedTour) {
      showNotification('Please select a tour', 'error');
      return;
    }
    if (!bookingForm.departureDate) {
      showNotification('Please select a departure date', 'error');
      return;
    }

    if (bookingForm.paymentMethod === 'M_PESA') {
      if (!bookingForm.mpesaCode || bookingForm.mpesaCode.length < 6) {
        showNotification('Please enter a valid M-Pesa transaction code (at least 6 characters)', 'error');
        return;
      }
    }

    const endDate = calculateEndDate(bookingForm.departureDate, selectedTour.duration);
    const daysCount = calculateDays(bookingForm.departureDate, endDate);
    const totalAmount = (selectedTour.price || 0) * (bookingForm.passengers || 1);

    const ref = generateReference();
    const currentUser = loggedInUser || user || currentUser;

    const departureDateISO = bookingForm.departureDate ? new Date(bookingForm.departureDate).toISOString() : null;
    const endDateISO = endDate ? new Date(endDate).toISOString() : null;

    const newBooking = {
      reference: ref,
      serviceType: 'tour_package',
      tourPackageId: selectedTour.id,
      customerName: bookingForm.customerName,
      customerEmail: bookingForm.customerEmail,
      customerPhone: bookingForm.customerPhone,
      customerIdNumber: bookingForm.customerIdNumber || '',
      customerIdImage: bookingForm.customerIdImage || null,
      customerLicenseImage: bookingForm.customerLicenseImage || null,
      packageName: selectedTour.name || selectedTour.title,
      packageDestination: selectedTour.destination || '',
      packageType: selectedTour.category || '',
      packageDuration: selectedTour.duration || '',
      packageCategory: selectedTour.category || '',
      startDate: departureDateISO,
      endDate: endDateISO,
      departureDate: departureDateISO,
      passengers: bookingForm.passengers || 1,
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
      packagePrice: selectedTour.price || 0,
      tenantId: tenantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      console.log('📤 Creating tour booking:', newBooking);
      const response = await bookingService.create(newBooking);

      if (response?.success) {
        showNotification(`✅ Tour booking confirmed! Reference: ${ref}`);
        loadData(tenantId);
        setShowBookingModal(false);
        setSelectedTour(null);
        setCalculatedTotal(0);
        setCalculatedEndDate(null);
        setIdImagePreview(null);
        setLicenseImagePreview(null);
        
        const userToKeep = loggedInUser || user || currentUser;
        setBookingForm({
          departureDate: '',
          notes: '',
          paymentMethod: 'CASH',
          mpesaCode: '',
          customerName: userToKeep?.name || '',
          customerEmail: userToKeep?.email || '',
          customerPhone: userToKeep?.phone || '',
          customerIdNumber: '',
          passengers: 1,
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
  }, [bookingForm, selectedTour, loggedInUser, user, currentUser, tenantId]);

  // Cancel booking via API
  const cancelBooking = useCallback(async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      console.log(`📤 Cancelling booking ${bookingId}`);
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

  // Filter tours with useMemo
  const filteredTours = useMemo(() => {
    return tours.filter(tour => {
      const searchMatch = searchTerm === '' || 
        tour.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.destination?.toLowerCase().includes(searchTerm.toLowerCase());

      const categoryMatch = filters.category === 'all' || tour.category === filters.category;
      
      let priceMatch = true;
      if (filters.priceRange === 'low') priceMatch = (tour.price || 0) <= 50000;
      else if (filters.priceRange === 'medium') priceMatch = (tour.price || 0) > 50000 && (tour.price || 0) <= 150000;
      else if (filters.priceRange === 'high') priceMatch = (tour.price || 0) > 150000;

      const durationMatch = filters.duration === 'all' || tour.duration === filters.duration;

      return searchMatch && categoryMatch && priceMatch && durationMatch;
    });
  }, [tours, searchTerm, filters]);

  // Get status label
  const getStatusLabel = useCallback((status) => {
    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rejected: 'Rejected'
    };
    return labels[status] || status;
  }, []);

  // Memoized BookingCard component
  const BookingCard = useCallback(({ booking }) => {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold text-gray-800">{booking.packageName || booking.itemName}</p>
            <p className="text-sm text-gray-500">Ref: {booking.reference}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold 
            ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              booking.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
              booking.status === 'active' ? 'bg-green-100 text-green-700' :
              booking.status === 'completed' ? 'bg-gray-100 text-gray-700' :
              'bg-red-100 text-red-700'}`}
          >
            {getStatusLabel(booking.status)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div>
            <p className="text-gray-500">Departure</p>
            <p className="font-medium">{formatDate(booking.departureDate || booking.startDate)}</p>
          </div>
          <div>
            <p className="text-gray-500">Duration</p>
            <p className="font-medium">{booking.packageDuration || booking.days + ' days'}</p>
          </div>
          <div>
            <p className="text-gray-500">Passengers</p>
            <p className="font-medium">{booking.passengers || 1}</p>
          </div>
          <div>
            <p className="text-gray-500">Total</p>
            <p className="font-medium text-blue-600">{formatCurrency(booking.totalPrice)}</p>
          </div>
        </div>

        <div className="flex gap-2">
          {(booking.status === 'pending' || booking.status === 'confirmed') && (
            <button
              onClick={() => cancelBooking(booking.id)}
              className="flex-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
            >
              <X size={14} /> Cancel
            </button>
          )}
          <button
            className="flex-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"
          >
            <MessageCircle size={14} /> Contact
          </button>
        </div>
      </div>
    );
  }, [cancelBooking, getStatusLabel]);

  // COMPACT TourCard - Only essential info
  const TourCard = useCallback(({ tour }) => {
    const handleBookClick = () => {
      setSelectedTour(tour);
      const currentUser = loggedInUser || user;
      setBookingForm(prev => ({
        ...prev,
        customerName: currentUser?.name || '',
        customerEmail: currentUser?.email || '',
        customerPhone: currentUser?.phone || ''
      }));
      setShowBookingModal(true);
    };

    const handleViewDetails = () => {
      setSelectedTourForDetail(tour);
      setShowDetailModal(true);
    };

    const hasAvailableDates = tour.departureDates && tour.departureDates.length > 0;

    return (
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
        {/* Compact Image */}
        <div className="relative h-36 bg-gray-100">
          {tour.images ? (
            <img 
              src={tour.images} 
              alt={tour.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Compass size={32} className="text-gray-400" />
            </div>
          )}
          
          {/* Category Badge - Compact */}
          <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[8px] font-semibold ${getCategoryColor(tour.category)}`}>
            {getCategoryIcon(tour.category)} {tour.category?.toUpperCase()}
          </div>

          {/* Price Badge - Compact */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold">
            {formatCurrency(tour.price)}
          </div>
        </div>

        {/* Tour Details - Compact */}
        <div className="p-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-gray-800 truncate max-w-[140px]">
                {tour.name || tour.title}
              </h3>
              {tour.destination && (
                <p className="text-[10px] text-gray-500 flex items-center gap-0.5">
                  <MapPin size={10} /> {tour.destination}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-[8px] text-gray-400">per person</p>
            </div>
          </div>

          {/* Features - Compact Row */}
          <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500">
            {tour.duration && (
              <span className="flex items-center gap-0.5">
                <Clock size={10} className="text-blue-500" />
                {tour.duration}
              </span>
            )}
            {tour.maxGroupSize && (
              <span className="flex items-center gap-0.5">
                <Users size={10} className="text-blue-500" />
                {tour.maxGroupSize}
              </span>
            )}
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleBookClick}
              disabled={!hasAvailableDates}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-300 flex items-center justify-center gap-1
                ${!hasAvailableDates 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              <Calendar size={12} />
              {!hasAvailableDates ? 'No Dates' : 'Book Now'}
            </button>
            <button
              onClick={handleViewDetails}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
            >
              <Eye size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }, [loggedInUser, user, getCategoryColor, getCategoryIcon]);

  // Detail Modal - Shows full tour information
  const DetailModal = useMemo(() => {
    if (!showDetailModal || !selectedTourForDetail) return null;

    const tour = selectedTourForDetail;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">{tour.name || tour.title}</h3>
              {tour.destination && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin size={14} /> {tour.destination}
                </p>
              )}
            </div>
            <button
              onClick={() => setShowDetailModal(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6">
            {/* Image */}
            {tour.images && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img src={tour.images} alt={tour.name} className="w-full h-56 object-cover" />
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Clock size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{tour.duration || 'N/A'}</p>
                <p className="text-xs text-gray-500">Duration</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <DollarSign size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{formatCurrency(tour.price)}</p>
                <p className="text-xs text-gray-500">Price</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Users size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{tour.maxGroupSize || 10}</p>
                <p className="text-xs text-gray-500">Max Group</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(tour.category)}`}>
                  {getCategoryIcon(tour.category)} {tour.category?.toUpperCase()}
                </span>
                <p className="text-xs text-gray-500 mt-1">Category</p>
              </div>
            </div>

            {/* Description */}
            {tour.description && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-600">{tour.description}</p>
              </div>
            )}

            {/* Departure Dates */}
            {tour.departureDates && tour.departureDates.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">📅 Departure Dates</h4>
                <div className="flex flex-wrap gap-2">
                  {tour.departureDates.map((date, index) => {
                    const endDate = calculateEndDate(date, tour.duration);
                    return (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                        {formatDate(date)}
                        {endDate && tour.duration && (
                          <span className="text-[10px] text-blue-500 ml-1">→ {formatDate(endDate)}</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Highlights */}
            {tour.highlights && tour.highlights.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">⭐ Highlights</h4>
                <div className="flex flex-wrap gap-2">
                  {tour.highlights.map((item, index) => (
                    <span key={index} className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      ⭐ {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Inclusions */}
            {tour.inclusions && tour.inclusions.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">✅ Inclusions</h4>
                <div className="flex flex-wrap gap-2">
                  {tour.inclusions.map((item, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      ✅ {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Exclusions */}
            {tour.exclusions && tour.exclusions.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">❌ Exclusions</h4>
                <div className="flex flex-wrap gap-2">
                  {tour.exclusions.map((item, index) => (
                    <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      ❌ {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowDetailModal(false);
                setSelectedTour(tour);
                setShowBookingModal(true);
              }}
              disabled={!tour.departureDates || tour.departureDates.length === 0}
              className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2
                ${!tour.departureDates || tour.departureDates.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'}`}
            >
              <Calendar size={16} /> Book Now
            </button>
            <button
              onClick={() => setShowDetailModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }, [showDetailModal, selectedTourForDetail, getCategoryColor, getCategoryIcon]);

  // Memoized Booking Modal Component
  const BookingModal = useMemo(() => {
    if (!showBookingModal || !selectedTour) return null;

    const passengers = bookingForm.passengers || 1;
    const total = (selectedTour.price || 0) * passengers;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const availableDates = (selectedTour.departureDates || [])
      .filter(dateStr => {
        const date = new Date(dateStr);
        return date >= today;
      })
      .sort((a, b) => new Date(a) - new Date(b));

    const handleClose = () => {
      setShowBookingModal(false);
      setSelectedTour(null);
      setCalculatedTotal(0);
      setCalculatedEndDate(null);
      setIdImagePreview(null);
      setLicenseImagePreview(null);
    };

    const handleInputChange = (field) => (e) => {
      setBookingForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Book Tour</h3>
              <p className="text-sm text-gray-500">
                {selectedTour.name || selectedTour.title}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-4">
            {/* Tour Summary - Compact */}
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-sm">{selectedTour.name}</p>
                  {selectedTour.destination && (
                    <p className="text-xs text-gray-600 flex items-center gap-1">
                      <MapPin size={12} /> {selectedTour.destination}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">Price per person</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(selectedTour.price)}</p>
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
                        <button
                          type="button"
                          onClick={removeIdImage}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-sm"
                          style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
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
                    <input
                      ref={licenseImageRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLicenseImageUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => licenseImageRef.current?.click()}
                      className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs flex items-center gap-1"
                    >
                      <Upload size={14} /> Upload License
                    </button>
                    {licenseImagePreview && (
                      <div className="relative inline-block">
                        <img src={licenseImagePreview} alt="License" className="h-12 w-12 object-cover rounded-lg border border-gray-200" />
                        <button
                          type="button"
                          onClick={removeLicenseImage}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-sm"
                          style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                          <X size={10} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Booking Details - Departure Date Selection */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" /> Select Departure Date
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Departure Date *</label>
                    {availableDates.length > 0 ? (
                      <select
                        value={bookingForm.departureDate}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleDepartureDateChange(value);
                          handleInputChange('departureDate')(e);
                        }}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        required
                      >
                        <option value="">Select a departure date...</option>
                        {availableDates.map((date, index) => {
                          const endDate = calculateEndDate(date, selectedTour.duration);
                          return (
                            <option key={index} value={date}>
                              {formatDate(date)}
                              {endDate && ` → ${formatDate(endDate)}`}
                            </option>
                          );
                        })}
                      </select>
                    ) : (
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-700">
                        ⚠️ No available departure dates.
                      </div>
                    )}
                    {selectedTour.duration && bookingForm.departureDate && (
                      <p className="text-xs text-gray-400 mt-1">
                        📅 Duration: {selectedTour.duration}
                        {calculatedEndDate && ` (Ends: ${formatDate(calculatedEndDate)})`}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Number of Passengers</label>
                    <input
                      type="number"
                      value={bookingForm.passengers}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setBookingForm(prev => ({ ...prev, passengers: value }));
                        if (selectedTour) {
                          const newTotal = (selectedTour.price || 0) * value;
                          setCalculatedTotal(newTotal);
                        }
                      }}
                      min="1"
                      max="20"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Cost Summary */}
                {bookingForm.departureDate && selectedTour && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Package Price:</span>
                        <span className="font-semibold ml-1">{formatCurrency(selectedTour.price)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Passengers:</span>
                        <span className="font-semibold ml-1">{bookingForm.passengers || 1}</span>
                      </div>
                      {calculatedEndDate && (
                        <div>
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-semibold ml-1">{selectedTour.duration}</span>
                        </div>
                      )}
                      <div className="col-span-2 border-t border-blue-200 pt-1">
                        <span className="text-gray-600 font-medium">Total Amount:</span>
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
                      <option value="CREDIT">Credit (Pay Later)</option>
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

                {bookingForm.paymentMethod === 'CREDIT' && (
                  <div className="mt-3 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                    <div className="flex items-center gap-2 text-yellow-800">
                      <AlertCircle size={16} />
                      <span className="text-sm font-medium">Credit Payment</span>
                    </div>
                    <p className="text-xs text-yellow-700 mt-1">
                      You will pay later. We'll send you a payment reminder.
                    </p>
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
                ℹ️ You will receive a booking reference number via email.
              </div>

              <button
                type="submit"
                disabled={!bookingForm.departureDate || availableDates.length === 0}
                className={`w-full py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2
                  ${!bookingForm.departureDate || availableDates.length === 0
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'}`}
              >
                Submit Booking <ArrowRight size={18} />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }, [
    showBookingModal,
    selectedTour,
    bookingForm,
    handleBookingSubmit,
    handleIdImageUpload,
    handleLicenseImageUpload,
    removeIdImage,
    removeLicenseImage,
    handleDepartureDateChange,
    formatCurrency,
    formatDate,
    calculatedEndDate,
    idImagePreview,
    licenseImagePreview
  ]);

  const userBookings = getUserBookings();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading tours...</p>
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Compass className="text-blue-600" size={22} />
            Tours & Travel
          </h1>
          <p className="text-xs text-gray-500">Explore our adventure and wildlife tours</p>
        </div>
        <button
          onClick={() => setShowBookings(!showBookings)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 text-xs"
        >
          <Calendar size={14} />
          My Bookings ({userBookings.length})
        </button>
      </div>

      {/* Bookings Section */}
      {showBookings && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-sm font-semibold text-gray-800">Your Tour Bookings</h2>
            <button onClick={() => setShowBookings(false)} className="text-xs text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
          {userBookings.length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-lg">
              <Compass size={24} className="text-gray-300 mx-auto mb-1" />
              <p className="text-xs text-gray-500">No tour bookings yet</p>
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

      {/* Search & Filters */}
      <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All</option>
              <option value="safari">🦁 Safari</option>
              <option value="beach">🏖️ Beach</option>
              <option value="adventure">🧗 Adventure</option>
            </select>

            <select
              value={filters.priceRange}
              onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Prices</option>
              <option value="low">Under KSh 50K</option>
              <option value="medium">KSh 50K - 150K</option>
              <option value="high">Over KSh 150K</option>
            </select>

            <select
              value={filters.duration}
              onChange={(e) => setFilters(prev => ({ ...prev, duration: e.target.value }))}
              className="px-2 py-1.5 border border-gray-200 rounded-lg text-[10px] focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All</option>
              <option value="1 day">1 Day</option>
              <option value="3 days">3 Days</option>
              <option value="7 days">7 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tour Grid */}
      {/* Tour Grid - Wider Cards */}
{filteredTours.length === 0 ? (
  <div className="text-center py-8 bg-gray-50 rounded-lg">
    <Compass size={32} className="text-gray-300 mx-auto mb-2" />
    <h3 className="text-sm font-semibold text-gray-600">No tours found</h3>
    <p className="text-xs text-gray-400">
      {searchTerm ? 'Try adjusting your search' : 'No tours available'}
    </p>
  </div>
) : (
  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-w-7xl mx-auto">
    {filteredTours.map(tour => (
      <TourCard key={tour.id} tour={tour} />
    ))}
  </div>
)}

      {/* Detail Modal */}
      {DetailModal}

      {/* Booking Modal */}
      {BookingModal}
    </div>
  );
};

export default Tours;