import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Plane, Calendar, User, Phone, Mail, Search, Filter, 
  MapPin, Clock, CheckCircle, AlertCircle, X, 
  DollarSign, Star, ArrowRight, CreditCard, Wallet,
  Upload, Camera, FileText, Plus, Edit, Trash2,
  Eye, Info, Shield, Users, Luggage, Settings,
  Clock as ClockIcon, Calendar as CalendarIcon,
  Check, MessageCircle, Heart, Share2, Bookmark,
  Navigation, Receipt, Lock, PlaneTakeoff, PlaneLanding,
  Ticket, Crown, Briefcase, Building, Wifi, Coffee,
  Tv, Headphones, Globe, MapPinned
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { flightService, bookingService } from '../../services/api';

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

// Helper: Format date with time
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

// Helper: Format date for input
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

// Helper: Compress image
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

// Helper: Get seat class label
const getSeatClassLabel = (seatClass) => {
  const labels = {
    economy: '💺 Economy',
    business: '💼 Business',
    first_class: '👑 First Class'
  };
  return labels[seatClass] || seatClass || 'Economy';
};

// Helper: Get seat class color
const getSeatClassColor = (seatClass) => {
  const colors = {
    economy: 'text-green-600 bg-green-100',
    business: 'text-blue-600 bg-blue-100',
    first_class: 'text-yellow-600 bg-yellow-100'
  };
  return colors[seatClass] || 'text-gray-600 bg-gray-100';
};

// Helper: Generate booking reference
const generateReference = () => {
  return 'FL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
};

const FlightsClient = ({ setActiveTab, user }) => {
  const { currentUser } = useAuth();
  const [flights, setFlights] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    airline: 'all',
    priceRange: 'all'
  });
  const [notification, setNotification] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  const [selectedFlightForDetail, setSelectedFlightForDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    seatClass: 'economy',
    passengers: 1,
    notes: '',
    paymentMethod: 'CASH',
    mpesaCode: '',
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerIdNumber: '',
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

  // ✅ LOAD DATA FROM API
  const loadData = async (tid) => {
    setLoading(true);
    
    try {
      const tenantToUse = tid || tenantId;
      console.log('🔍 Loading flights data with tenantId:', tenantToUse);
      
      if (!tenantToUse) {
        console.warn('⚠️ No tenantId available');
        loadFromLocalStorage();
        setLoading(false);
        return;
      }

      // ✅ 1. Load flights from API
      const flightsResponse = await flightService.getAll(tenantToUse);
      console.log('📊 Flights response:', flightsResponse);
      
      let flightsData = [];
      if (flightsResponse?.success && flightsResponse?.data) {
        flightsData = flightsResponse.data;
      } else if (Array.isArray(flightsResponse)) {
        flightsData = flightsResponse;
      }
      
      // ✅ 2. Parse flight data
      const parsedFlights = flightsData.map(flight => ({
        ...flight,
        amenities: flight.amenities ? (typeof flight.amenities === 'string' ? JSON.parse(flight.amenities) : flight.amenities) : []
      }));
      setFlights(parsedFlights.filter(f => f.status === 'active' || f.status === 'scheduled'));

      // ✅ 3. Load flight bookings from API
      const bookingsResponse = await bookingService.getAll(tenantToUse);
      console.log('📊 Bookings response:', bookingsResponse);
      
      let bookingsData = [];
      if (bookingsResponse?.success && bookingsResponse?.data) {
        bookingsData = bookingsResponse.data;
      } else if (Array.isArray(bookingsResponse)) {
        bookingsData = bookingsResponse;
      }
      
      const flightBookings = bookingsData.filter(b => 
        b.serviceType === 'flight' || b.serviceType === 'Flight'
      );
      setAllBookings(flightBookings);
      console.log(`📊 Loaded ${flightBookings.length} flight bookings`);
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
      showNotification('Error loading data. Using local data.', 'error');
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  // ✅ FALLBACK TO LOCALSTORAGE
  const loadFromLocalStorage = () => {
    try {
      const storedFlights = JSON.parse(localStorage.getItem('travel_agency_flights') || '[]');
      setFlights(storedFlights.filter(f => f.status === 'active' || f.status === 'scheduled'));
      
      const storedBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      const guestBookings = JSON.parse(localStorage.getItem('travel_agency_guest_bookings') || '[]');
      
      const bookingMap = new Map();
      storedBookings.forEach(b => bookingMap.set(b.id, b));
      guestBookings.forEach(b => bookingMap.set(b.id, b));
      
      const allCombinedBookings = Array.from(bookingMap.values());
      const flightBookings = allCombinedBookings.filter(b => 
        b.serviceType === 'flight' || b.serviceType === 'flight_booking'
      );
      setAllBookings(flightBookings);
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  // Get flight price based on seat class
  const getFlightPrice = useCallback((flight, seatClass) => {
    if (!flight) return 0;
    switch(seatClass) {
      case 'business':
        return flight.businessPrice || flight.economyPrice * 1.5 || 0;
      case 'first_class':
        return flight.firstClassPrice || flight.economyPrice * 2 || 0;
      default:
        return flight.economyPrice || flight.price || 0;
    }
  }, []);

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

  // ✅ CREATE BOOKING VIA API
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
    if (!selectedFlight) {
      showNotification('Please select a flight', 'error');
      return;
    }

    if (bookingForm.paymentMethod === 'M_PESA') {
      if (!bookingForm.mpesaCode || bookingForm.mpesaCode.length < 6) {
        showNotification('Please enter a valid M-Pesa transaction code', 'error');
        return;
      }
    }

    const pricePerPerson = getFlightPrice(selectedFlight, bookingForm.seatClass);
    const totalAmount = pricePerPerson * (bookingForm.passengers || 1);
    const currentUser = loggedInUser || user || currentUser;

    const bookingData = {
      customerName: bookingForm.customerName,
      customerEmail: bookingForm.customerEmail,
      customerPhone: bookingForm.customerPhone,
      customerIdNumber: bookingForm.customerIdNumber || '',
      customerIdImage: bookingForm.customerIdImage || null,
      customerLicenseImage: bookingForm.customerLicenseImage || null,
      serviceType: 'flight',
      isGuestBooking: false,
      userId: currentUser?.id || '',
      userEmail: currentUser?.email || '',
      flightId: selectedFlight.id,
      airline: selectedFlight.airline || '',
      flightNumber: selectedFlight.flightNumber || '',
      origin: selectedFlight.origin || '',
      destination: selectedFlight.destination || '',
      departureDateFlight: selectedFlight.departureDate || null,
      departureTimeFlight: selectedFlight.departureTime || null,
      arrivalDateFlight: selectedFlight.arrivalDate || null,
      arrivalTimeFlight: selectedFlight.arrivalTime || null,
      durationFlight: selectedFlight.duration || '',
      passengers: bookingForm.passengers || 1,
      seatClass: bookingForm.seatClass || 'economy',
      economyPrice: selectedFlight.economyPrice || 0,
      businessPrice: selectedFlight.businessPrice || 0,
      firstClassPrice: selectedFlight.firstClassPrice || 0,
      totalPrice: totalAmount,
      paymentMethod: bookingForm.paymentMethod,
      paymentStatus: bookingForm.paymentMethod === 'CREDIT' ? 'PENDING' : 'PAID',
      mpesaCode: bookingForm.mpesaCode || '',
      paidAmount: bookingForm.paymentMethod === 'CREDIT' ? 0 : totalAmount,
      remainingBalance: bookingForm.paymentMethod === 'CREDIT' ? totalAmount : 0,
      notes: bookingForm.notes || '',
      status: 'pending',
      tenantId: tenantId
    };

    try {
      console.log('📤 Creating flight booking:', bookingData);
      const response = await bookingService.create(bookingData);
      console.log('📥 Create response:', response);

      if (response?.success) {
        showNotification(`✅ Flight booking confirmed! Reference: ${response.data?.reference || 'FL-123'}`);
        setShowBookingModal(false);
        setSelectedFlight(null);
        setCalculatedTotal(0);
        setIdImagePreview(null);
        setLicenseImagePreview(null);
        
        const userToKeep = loggedInUser || user || currentUser;
        setBookingForm({
          seatClass: 'economy',
          passengers: 1,
          notes: '',
          paymentMethod: 'CASH',
          mpesaCode: '',
          customerName: userToKeep?.name || '',
          customerEmail: userToKeep?.email || '',
          customerPhone: userToKeep?.phone || '',
          customerIdNumber: '',
          customerIdImage: null,
          customerLicenseImage: null
        });
        
        loadData(tenantId);
      } else {
        showNotification('Failed to create booking: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      showNotification('Failed to create booking. Please try again.', 'error');
    }
  }, [bookingForm, selectedFlight, loggedInUser, user, currentUser, tenantId, getFlightPrice]);

  // ✅ CANCEL BOOKING VIA API
  const cancelBooking = useCallback(async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      console.log(`📤 Cancelling booking ${bookingId}`);
      const response = await bookingService.updateStatus(bookingId, 'cancelled');
      console.log('📥 Cancel response:', response);

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

  // Filter flights with useMemo
  const filteredFlights = useMemo(() => {
    return flights.filter(flight => {
      const searchMatch = searchTerm === '' || 
        flight.airline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.flightNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.origin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        flight.destination?.toLowerCase().includes(searchTerm.toLowerCase());

      const typeMatch = filters.type === 'all' || flight.flightType === filters.type;
      
      const airlineMatch = filters.airline === 'all' || flight.airline === filters.airline;
      
      let priceMatch = true;
      const minPrice = Math.min(
        flight.economyPrice || flight.price || 0,
        flight.businessPrice || flight.price * 1.5 || 0,
        flight.firstClassPrice || flight.price * 2 || 0
      );
      if (filters.priceRange === 'low') priceMatch = minPrice <= 50000;
      else if (filters.priceRange === 'medium') priceMatch = minPrice > 50000 && minPrice <= 150000;
      else if (filters.priceRange === 'high') priceMatch = minPrice > 150000;

      return searchMatch && typeMatch && airlineMatch && priceMatch;
    });
  }, [flights, searchTerm, filters]);

  // Get unique airlines for filter
  const airlines = useMemo(() => {
    return [...new Set(flights.map(f => f.airline).filter(Boolean))];
  }, [flights]);

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

  // Get type label
  const getTypeLabel = useCallback((type) => {
    const labels = {
      domestic: '🏠 Domestic',
      international: '🌍 International',
      regional: '🌍 Regional',
      charter: '✈️ Charter'
    };
    return labels[type] || type || 'International';
  }, []);

  // BookingCard component
  const BookingCard = useCallback(({ booking }) => {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold text-gray-800">{booking.airline} {booking.flightNumber}</p>
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
            <p className="text-gray-500">From</p>
            <p className="font-medium">{booking.origin}</p>
          </div>
          <div>
            <p className="text-gray-500">To</p>
            <p className="font-medium">{booking.destination}</p>
          </div>
          <div>
            <p className="text-gray-500">Departure</p>
            <p className="font-medium">{formatDateTime(booking.departureDate)}</p>
          </div>
          <div>
            <p className="text-gray-500">Seat Class</p>
            <p className="font-medium">{getSeatClassLabel(booking.seatClass)}</p>
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
          <button className="flex-1 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm hover:bg-gray-100 transition-colors flex items-center justify-center gap-1">
            <MessageCircle size={14} /> Contact
          </button>
        </div>
      </div>
    );
  }, [cancelBooking, getStatusLabel]);

  // FlightCard component
  const FlightCard = useCallback(({ flight }) => {
    const minPrice = Math.min(
      flight.economyPrice || flight.price || 0,
      flight.businessPrice || flight.price * 1.5 || 0,
      flight.firstClassPrice || flight.price * 2 || 0
    );

    const handleBookClick = () => {
      setSelectedFlight(flight);
      const currentUser = loggedInUser || user || currentUser;
      setBookingForm(prev => ({
        ...prev,
        customerName: currentUser?.name || '',
        customerEmail: currentUser?.email || '',
        customerPhone: currentUser?.phone || ''
      }));
      setShowBookingModal(true);
    };

    const handleViewDetails = () => {
      setSelectedFlightForDetail(flight);
      setShowDetailModal(true);
    };

    const flightStatus = flight.status === 'active' ? '✅ Active' : 
                         flight.status === 'scheduled' ? '📅 Scheduled' : 
                         flight.status === 'completed' ? '✅ Completed' :
                         flight.status === 'cancelled' ? '❌ Cancelled' : 
                         flight.status === 'delayed' ? '⏳ Delayed' : '✅ Active';

    return (
      <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
        {/* Compact Image */}
        <div className="relative h-36 bg-gradient-to-r from-blue-100 to-indigo-100">
          {flight.image ? (
            <img 
              src={flight.image} 
              alt={flight.airline}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Plane size={32} className="text-blue-400" />
            </div>
          )}
          
          {/* Status Badge - Compact */}
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[8px] font-semibold bg-black/50 backdrop-blur-sm text-white">
            {flightStatus}
          </div>

          {/* Price Badge - Compact */}
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold">
            {formatCurrency(minPrice)}
          </div>

          {/* Type Badge - Compact */}
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-white text-[8px] font-semibold">
            {getTypeLabel(flight.flightType)}
          </div>
        </div>

        {/* Flight Details - Compact */}
        <div className="p-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-bold text-gray-800 truncate max-w-[140px]">
                {flight.airline}
              </h3>
              <p className="text-[10px] text-blue-600 font-medium">{flight.flightNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] text-gray-400">Flight</p>
            </div>
          </div>

          {/* Route - Compact */}
          <div className="flex items-center justify-between mt-1">
            <div className="text-center">
              <p className="text-[10px] font-semibold text-gray-800 truncate max-w-[50px]">{flight.origin}</p>
              {flight.departureTime && (
                <p className="text-[8px] text-gray-400">{flight.departureTime}</p>
              )}
            </div>
            <div className="flex-1 mx-1">
              <div className="relative">
                <div className="border-t border-dashed border-blue-300"></div>
                <Plane className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-400" size={12} />
              </div>
              {flight.duration && (
                <p className="text-[8px] text-gray-400 text-center">{flight.duration}</p>
              )}
            </div>
            <div className="text-center">
              <p className="text-[10px] font-semibold text-gray-800 truncate max-w-[50px]">{flight.destination}</p>
              {flight.arrivalTime && (
                <p className="text-[8px] text-gray-400">{flight.arrivalTime}</p>
              )}
            </div>
          </div>

          {/* Prices - Compact */}
          <div className="grid grid-cols-3 gap-0.5 mt-1">
            <div className="bg-green-50 rounded p-0.5 text-center">
              <p className="text-[6px] text-gray-500">Eco</p>
              <p className="text-[8px] font-bold text-green-600">{formatCurrency(flight.economyPrice)}</p>
            </div>
            <div className="bg-blue-50 rounded p-0.5 text-center">
              <p className="text-[6px] text-gray-500">Biz</p>
              <p className="text-[8px] font-bold text-blue-600">{formatCurrency(flight.businessPrice)}</p>
            </div>
            <div className="bg-yellow-50 rounded p-0.5 text-center">
              <p className="text-[6px] text-gray-500">First</p>
              <p className="text-[8px] font-bold text-yellow-600">{formatCurrency(flight.firstClassPrice)}</p>
            </div>
          </div>

          {/* Action Buttons - Compact */}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleBookClick}
              className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-300 flex items-center justify-center gap-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Calendar size={12} /> Book Now
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
  }, [loggedInUser, user, currentUser]);

  // Detail Modal
  const DetailModal = useMemo(() => {
    if (!showDetailModal || !selectedFlightForDetail) return null;

    const flight = selectedFlightForDetail;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">{flight.airline}</h3>
              <p className="text-sm text-gray-500 flex items-center gap-1">
                {flight.flightNumber} • {flight.origin} → {flight.destination}
              </p>
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
            {flight.image && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img src={flight.image} alt={flight.airline} className="w-full h-56 object-cover" />
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <PlaneTakeoff size={16} className="mx-auto text-blue-400 mb-1" />
                <p className="text-sm font-semibold">{flight.origin}</p>
                <p className="text-xs text-gray-500">Origin</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <PlaneLanding size={16} className="mx-auto text-blue-400 mb-1" />
                <p className="text-sm font-semibold">{flight.destination}</p>
                <p className="text-xs text-gray-500">Destination</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Clock size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{flight.duration || 'N/A'}</p>
                <p className="text-xs text-gray-500">Duration</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Users size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{flight.passengers || 'N/A'}</p>
                <p className="text-xs text-gray-500">Passengers</p>
              </div>
            </div>

            {/* Flight Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">📅 Departure</p>
                <p className="text-sm font-semibold">{formatDate(flight.departureDate)}</p>
                {flight.departureTime && (
                  <p className="text-xs text-gray-600">{flight.departureTime}</p>
                )}
                <p className="text-xs text-gray-400">{flight.terminal || 'Terminal N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">📅 Arrival</p>
                <p className="text-sm font-semibold">{formatDate(flight.arrivalDate)}</p>
                {flight.arrivalTime && (
                  <p className="text-xs text-gray-600">{flight.arrivalTime}</p>
                )}
                <p className="text-xs text-gray-400">{flight.gate ? `Gate ${flight.gate}` : 'Gate N/A'}</p>
              </div>
            </div>

            {/* Prices */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
                <p className="text-xs text-gray-500">💺 Economy</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(flight.economyPrice)}</p>
                <p className="text-xs text-gray-400">{flight.economySeats || 0} seats</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
                <p className="text-xs text-gray-500">💼 Business</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(flight.businessPrice)}</p>
                <p className="text-xs text-gray-400">{flight.businessSeats || 0} seats</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
                <p className="text-xs text-gray-500">👑 First Class</p>
                <p className="text-lg font-bold text-yellow-600">{formatCurrency(flight.firstClassPrice)}</p>
                <p className="text-xs text-gray-400">{flight.firstClassSeats || 0} seats</p>
              </div>
            </div>

            {/* Amenities */}
            {flight.amenities && flight.amenities.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {flight.amenities.map((amenity, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {flight.description && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
                <p className="text-sm text-gray-600">{flight.description}</p>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowDetailModal(false);
                setSelectedFlight(flight);
                setShowBookingModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2"
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
  }, [showDetailModal, selectedFlightForDetail]);

  // Booking Modal Component
  const BookingModal = useMemo(() => {
    if (!showBookingModal || !selectedFlight) return null;

    const pricePerPerson = getFlightPrice(selectedFlight, bookingForm.seatClass);
    const total = pricePerPerson * (bookingForm.passengers || 1);

    const handleClose = () => {
      setShowBookingModal(false);
      setSelectedFlight(null);
      setCalculatedTotal(0);
      setIdImagePreview(null);
      setLicenseImagePreview(null);
    };

    const handleInputChange = (field) => (e) => {
      setBookingForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSeatClassChange = (e) => {
      const value = e.target.value;
      setBookingForm(prev => ({ ...prev, seatClass: value }));
      if (selectedFlight) {
        const newPrice = getFlightPrice(selectedFlight, value);
        const newTotal = newPrice * (bookingForm.passengers || 1);
        setCalculatedTotal(newTotal);
      }
    };

    const handlePassengerChange = (e) => {
      const value = parseInt(e.target.value) || 1;
      setBookingForm(prev => ({ ...prev, passengers: value }));
      if (selectedFlight) {
        const newPrice = getFlightPrice(selectedFlight, bookingForm.seatClass);
        const newTotal = newPrice * value;
        setCalculatedTotal(newTotal);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">Book Flight</h3>
              <p className="text-sm text-gray-500">
                {selectedFlight.airline} {selectedFlight.flightNumber}
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
            {/* Flight Summary */}
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{selectedFlight.airline}</p>
                  <p className="text-sm text-gray-600">{selectedFlight.flightNumber}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{selectedFlight.origin}</span>
                    <ArrowRight size={14} className="text-blue-500" />
                    <span>{selectedFlight.destination}</span>
                  </div>
                  {selectedFlight.departureDate && (
                    <p className="text-xs text-gray-500">
                      📅 {formatDateTime(selectedFlight.departureDate)}
                    </p>
                  )}
                  {selectedFlight.duration && (
                    <p className="text-xs text-gray-500">
                      ⏱️ {selectedFlight.duration}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Starting from</p>
                  <p className="text-lg font-bold text-blue-600">{formatCurrency(getFlightPrice(selectedFlight, bookingForm.seatClass))}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              {/* Personal Information - Editable phone */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <User size={16} className="text-blue-500" /> Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={bookingForm.customerName}
                      onChange={handleInputChange('customerName')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      placeholder="Enter your full name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                    <input
                      type="email"
                      value={bookingForm.customerEmail}
                      onChange={handleInputChange('customerEmail')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      placeholder="Enter your email"
                      required
                    />
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

              {/* Flight Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Ticket size={16} className="text-blue-500" /> Flight Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Seat Class *</label>
                    <select
                      value={bookingForm.seatClass}
                      onChange={handleSeatClassChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    >
                      <option value="economy">💺 Economy - {formatCurrency(getFlightPrice(selectedFlight, 'economy'))}</option>
                      <option value="business">💼 Business - {formatCurrency(getFlightPrice(selectedFlight, 'business'))}</option>
                      <option value="first_class">👑 First Class - {formatCurrency(getFlightPrice(selectedFlight, 'first_class'))}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Number of Passengers</label>
                    <input
                      type="number"
                      value={bookingForm.passengers}
                      onChange={handlePassengerChange}
                      min="1"
                      max="20"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {/* Cost Summary */}
                {selectedFlight && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Price per person:</span>
                        <span className="font-semibold ml-1">{formatCurrency(getFlightPrice(selectedFlight, bookingForm.seatClass))}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Passengers:</span>
                        <span className="font-semibold ml-1">{bookingForm.passengers || 1}</span>
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
                ℹ️ You will receive a booking reference number via email. Use it to track your booking.
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2"
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
    selectedFlight,
    bookingForm,
    handleBookingSubmit,
    handleIdImageUpload,
    handleLicenseImageUpload,
    removeIdImage,
    removeLicenseImage,
    getFlightPrice,
    formatCurrency,
    formatDateTime,
    idImagePreview,
    licenseImagePreview,
    calculatedTotal,
    currentUser
  ]);

  const userBookings = getUserBookings();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading flights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] p-4 rounded-lg shadow-lg flex items-center gap-2 max-w-md
          ${notification.type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' :
            'bg-blue-50 border border-blue-200 text-blue-700'}`}
        >
          {notification.type === 'success' ? <CheckCircle size={20} /> :
           notification.type === 'error' ? <AlertCircle size={20} /> :
           <Info size={20} />}
          <span className="flex-1 text-sm">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Plane className="text-blue-600" size={28} />
            Flights
          </h1>
          <p className="text-gray-500">Search and book local and international flights</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBookings(!showBookings)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
          >
            <Calendar size={16} />
            My Bookings ({userBookings.length})
          </button>
        </div>
      </div>

      {/* Bookings Section */}
      {showBookings && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Your Flight Bookings</h2>
            <button onClick={() => setShowBookings(false)} className="text-sm text-gray-500 hover:text-gray-700">
              <X size={16} />
            </button>
          </div>
          {userBookings.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <Plane size={32} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">You haven't made any flight bookings yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userBookings.map(booking => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Search & Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search flights by airline, flight number, or destination..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Types</option>
              <option value="domestic">🏠 Domestic</option>
              <option value="international">🌍 International</option>
              <option value="regional">🌍 Regional</option>
              <option value="charter">✈️ Charter</option>
            </select>

            {airlines.length > 0 && (
              <select
                value={filters.airline}
                onChange={(e) => setFilters(prev => ({ ...prev, airline: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="all">All Airlines</option>
                {airlines.map(airline => (
                  <option key={airline} value={airline}>{airline}</option>
                ))}
              </select>
            )}

            <select
              value={filters.priceRange}
              onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Prices</option>
              <option value="low">Under KSh 50,000</option>
              <option value="medium">KSh 50,000 - 150,000</option>
              <option value="high">Over KSh 150,000</option>
            </select>
          </div>
        </div>
      </div>

      {/* Flights Grid */}
      {filteredFlights.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <Plane size={48} className="text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600">No flights found</h3>
          <p className="text-gray-400 text-sm">
            {searchTerm ? 'Try adjusting your search criteria' : 'No flights available at the moment'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-w-7xl mx-auto">
          {filteredFlights.map(flight => (
            <FlightCard key={flight.id} flight={flight} />
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

export default FlightsClient;