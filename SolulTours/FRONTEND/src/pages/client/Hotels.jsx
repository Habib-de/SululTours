import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  Hotel, Calendar, User, Phone, Mail, Search, Filter, 
  MapPin, Clock, CheckCircle, AlertCircle, X, 
  DollarSign, Star, ArrowRight, CreditCard, Wallet,
  Upload, Camera, FileText, Plus, Edit, Trash2,
  Eye, Info, Shield, Users, Luggage, Settings,
  Clock as ClockIcon, Calendar as CalendarIcon,
  Check, MessageCircle, Heart, Share2, Bookmark,
  Navigation, Receipt, Lock, Plane, Car, Tag,
  Building, Compass, Crown, Briefcase, Bed, Utensils,
  Wifi, Coffee, Tv, Dumbbell, Waves, Wind
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hotelService, roomTypeService, bookingService } from '../../services/api';

// Helper: Format date for input (YYYY-MM-DD)
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

// Helper: Calculate nights
const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diffTime = Math.abs(outDate - inDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

const HotelsClient = ({ setActiveTab, user }) => {
  const { currentUser } = useAuth();
  const [hotels, setHotels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showBookings, setShowBookings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    starRating: 'all',
    priceRange: 'all',
    city: 'all'
  });
  const [notification, setNotification] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [selectedHotelId, setSelectedHotelId] = useState('');
  const [tenantId, setTenantId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedHotelForDetail, setSelectedHotelForDetail] = useState(null);
  
  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    checkIn: '',
    checkOut: '',
    guests: 1,
    rooms: 1,
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
  const [nights, setNights] = useState(0);

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
      console.log('🔍 Loading hotels data with tenantId:', tenantToUse);
      
      if (!tenantToUse) {
        console.warn('⚠️ No tenantId available');
        loadFromLocalStorage();
        setLoading(false);
        return;
      }

      // ✅ 1. Load hotels from API
      const hotelsResponse = await hotelService.getAll(tenantToUse);
      console.log('📊 Hotels response:', hotelsResponse);
      
      let hotelsData = [];
      if (hotelsResponse?.success && hotelsResponse?.data) {
        hotelsData = hotelsResponse.data;
      } else if (Array.isArray(hotelsResponse)) {
        hotelsData = hotelsResponse;
      }
      
      // Parse hotel amenities and images
      const parsedHotels = hotelsData.map(hotel => ({
        ...hotel,
        amenities: hotel.amenities ? (typeof hotel.amenities === 'string' ? JSON.parse(hotel.amenities) : hotel.amenities) : [],
        images: hotel.images ? (typeof hotel.images === 'string' ? JSON.parse(hotel.images) : hotel.images) : []
      }));
      setHotels(parsedHotels.filter(h => h.status === 'active'));

      // ✅ 2. Load room types from API
      const roomsResponse = await roomTypeService.getAll(tenantToUse);
      console.log('📊 Room types response:', roomsResponse);
      
      let roomsData = [];
      if (roomsResponse?.success && roomsResponse?.data) {
        roomsData = roomsResponse.data;
      } else if (Array.isArray(roomsResponse)) {
        roomsData = roomsResponse;
      }
      
      // Parse room amenities and images
      const parsedRooms = roomsData.map(room => ({
        ...room,
        amenities: room.amenities ? (typeof room.amenities === 'string' ? JSON.parse(room.amenities) : room.amenities) : [],
        images: room.images ? (typeof room.images === 'string' ? JSON.parse(room.images) : room.images) : []
      }));
      setRoomTypes(parsedRooms.filter(r => r.status === 'active'));

      // ✅ 3. Load hotel bookings from API
      const bookingsResponse = await bookingService.getAll(tenantToUse);
      console.log('📊 Bookings response:', bookingsResponse);
      
      let bookingsData = [];
      if (bookingsResponse?.success && bookingsResponse?.data) {
        bookingsData = bookingsResponse.data;
      } else if (Array.isArray(bookingsResponse)) {
        bookingsData = bookingsResponse;
      }
      
      const hotelBookings = bookingsData.filter(b => 
        b.serviceType === 'hotel' || b.serviceType === 'Hotel'
      );
      setAllBookings(hotelBookings);
      console.log(`📊 Loaded ${hotelBookings.length} hotel bookings`);
      
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
      const storedHotels = JSON.parse(localStorage.getItem('travel_agency_hotels') || '[]');
      setHotels(storedHotels.filter(h => h.status === 'active'));
      
      const storedRoomTypes = JSON.parse(localStorage.getItem('travel_agency_room_types') || '[]');
      setRoomTypes(storedRoomTypes.filter(r => r.status === 'active'));
      
      const storedBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      const guestBookings = JSON.parse(localStorage.getItem('travel_agency_guest_bookings') || '[]');
      
      const bookingMap = new Map();
      storedBookings.forEach(b => bookingMap.set(b.id, b));
      guestBookings.forEach(b => bookingMap.set(b.id, b));
      
      const allCombinedBookings = Array.from(bookingMap.values());
      const hotelBookings = allCombinedBookings.filter(b => 
        b.serviceType === 'hotel' || b.serviceType === 'hotel_booking'
      );
      setAllBookings(hotelBookings);
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  // Get room types for a hotel
  const getHotelRooms = useCallback((hotelId) => {
    return roomTypes.filter(r => r.hotelId === hotelId && r.status === 'active');
  }, [roomTypes]);

  // Get star display
  const getStarDisplay = useCallback((rating) => {
    return '⭐'.repeat(rating || 0) + '☆'.repeat(5 - (rating || 0));
  }, []);

  // Get room type label
  const getRoomTypeLabel = useCallback((type) => {
    const labels = {
      standard: 'Standard',
      deluxe: 'Deluxe',
      suite: 'Suite',
      executive: 'Executive',
      presidential: 'Presidential'
    };
    return labels[type] || type || 'Standard';
  }, []);

  // Get amenity icon
  const getAmenityIcon = useCallback((amenity) => {
    const icons = {
      'wifi': <Wifi size={14} />,
      'breakfast': <Utensils size={14} />,
      'coffee': <Coffee size={14} />,
      'tv': <Tv size={14} />,
      'gym': <Dumbbell size={14} />,
      'pool': <Waves size={14} />,
      'ac': <Wind size={14} />,
      'parking': <Car size={14} />
    };
    return icons[amenity] || <Tag size={14} />;
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

  // Handle date change
  const handleDateChange = useCallback(() => {
    const nightsCount = calculateNights(bookingForm.checkIn, bookingForm.checkOut);
    setNights(nightsCount);
    
    if (selectedRoom && nightsCount > 0) {
      const total = (selectedRoom.price || 0) * nightsCount * (bookingForm.rooms || 1);
      setCalculatedTotal(total);
    }
  }, [bookingForm.checkIn, bookingForm.checkOut, selectedRoom, bookingForm.rooms]);

  // ✅ STABLE INPUT HANDLERS
  const handleInputChange = useCallback((field) => (e) => {
    setBookingForm(prev => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleNumberInputChange = useCallback((field) => (e) => {
    const value = parseInt(e.target.value) || 1;
    setBookingForm(prev => ({ ...prev, [field]: value }));
    if (field === 'rooms' && selectedRoom && bookingForm.checkIn && bookingForm.checkOut) {
      const nights = calculateNights(bookingForm.checkIn, bookingForm.checkOut);
      const total = (selectedRoom.price || 0) * nights * value;
      setCalculatedTotal(total);
    }
  }, [selectedRoom, bookingForm.checkIn, bookingForm.checkOut]);

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
    if (!selectedRoom) {
      showNotification('Please select a room type', 'error');
      return;
    }
    if (!bookingForm.checkIn || !bookingForm.checkOut) {
      showNotification('Please select check-in and check-out dates', 'error');
      return;
    }

    const nightsCount = calculateNights(bookingForm.checkIn, bookingForm.checkOut);
    if (nightsCount < 1) {
      showNotification('Check-out must be after check-in', 'error');
      return;
    }

    if (bookingForm.paymentMethod === 'M_PESA') {
      if (!bookingForm.mpesaCode || bookingForm.mpesaCode.length < 6) {
        showNotification('Please enter a valid M-Pesa transaction code', 'error');
        return;
      }
    }

    const totalAmount = (selectedRoom.price || 0) * nightsCount * (bookingForm.rooms || 1);
    const hotel = hotels.find(h => h.id === selectedRoom.hotelId);
    const currentUser = loggedInUser || user || currentUser;

    const bookingData = {
      customerName: bookingForm.customerName,
      customerEmail: bookingForm.customerEmail,
      customerPhone: bookingForm.customerPhone,
      customerIdNumber: bookingForm.customerIdNumber || '',
      customerIdImage: bookingForm.customerIdImage || null,
      customerLicenseImage: bookingForm.customerLicenseImage || null,
      serviceType: 'hotel',
      isGuestBooking: false,
      userId: currentUser?.id || '',
      userEmail: currentUser?.email || '',
      hotelId: selectedRoom.hotelId,
      roomTypeId: selectedRoom.id,
      hotelName: hotel?.name || '',
      hotelCity: hotel?.city || '',
      hotelStarRating: hotel?.starRating || 0,
      roomName: selectedRoom.name || '',
      roomType: selectedRoom.type || 'standard',
      roomPrice: selectedRoom.price || 0,
      checkIn: bookingForm.checkIn,
      checkOut: bookingForm.checkOut,
      nights: nightsCount,
      rooms: bookingForm.rooms || 1,
      guests: bookingForm.guests || 1,
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
      console.log('📤 Creating hotel booking:', bookingData);
      const response = await bookingService.create(bookingData);
      console.log('📥 Create response:', response);

      if (response?.success) {
        showNotification(`✅ Hotel booking confirmed! Reference: ${response.data?.reference || 'BOOKING-123'}`);
        setShowBookingModal(false);
        setSelectedRoom(null);
        setSelectedHotel(null);
        setCalculatedTotal(0);
        setNights(0);
        setIdImagePreview(null);
        setLicenseImagePreview(null);
        
        const userToKeep = loggedInUser || user || currentUser;
        setBookingForm({
          checkIn: '',
          checkOut: '',
          guests: 1,
          rooms: 1,
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
  }, [bookingForm, selectedRoom, loggedInUser, user, currentUser, hotels, tenantId]);

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

  // Filter hotels with useMemo
  const filteredHotels = useMemo(() => {
    return hotels.filter(hotel => {
      const searchMatch = searchTerm === '' || 
        hotel.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        hotel.address?.toLowerCase().includes(searchTerm.toLowerCase());

      const starMatch = filters.starRating === 'all' || hotel.starRating === parseInt(filters.starRating);
      
      const cityMatch = filters.city === 'all' || hotel.city === filters.city;

      return searchMatch && starMatch && cityMatch;
    });
  }, [hotels, searchTerm, filters]);

  // Get unique cities for filter
  const cities = useMemo(() => {
    return [...new Set(hotels.map(h => h.city).filter(Boolean))];
  }, [hotels]);

  // BookingCard component
  const BookingCard = useCallback(({ booking }) => {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-100 hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="font-semibold text-gray-800">{booking.hotelName || booking.itemName}</p>
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
            <p className="text-gray-500">Check-in</p>
            <p className="font-medium">{formatDateTime(booking.checkIn)}</p>
          </div>
          <div>
            <p className="text-gray-500">Check-out</p>
            <p className="font-medium">{formatDateTime(booking.checkOut)}</p>
          </div>
          <div>
            <p className="text-gray-500">Room</p>
            <p className="font-medium">{booking.roomName || 'Standard'}</p>
          </div>
          <div>
            <p className="text-gray-500">Nights</p>
            <p className="font-medium">{booking.nights || 1}</p>
          </div>
          <div>
            <p className="text-gray-500">Rooms</p>
            <p className="font-medium">{booking.rooms || 1}</p>
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

  // HotelCard component
  const HotelCard = useCallback(({ hotel }) => {
    const hotelRooms = getHotelRooms(hotel.id);
    const minPrice = hotelRooms.length > 0 
      ? Math.min(...hotelRooms.map(r => r.price || 0)) 
      : 0;

    const handleBookClick = () => {
      setSelectedHotel(hotel);
      setShowBookingModal(true);
      setSelectedHotelId(hotel.id);
      setSelectedRoom(null);
      const currentUser = loggedInUser || user || currentUser;
      setBookingForm(prev => ({
        ...prev,
        customerName: currentUser?.name || '',
        customerEmail: currentUser?.email || '',
        customerPhone: currentUser?.phone || ''
      }));
    };

    return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100">
        {/* Hotel Image */}
        <div className="relative h-36 bg-gradient-to-r from-gray-200 to-gray-100">
          {hotel.images && hotel.images.length > 0 ? (
            <img 
              src={hotel.images[0]} 
              alt={hotel.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Hotel size={64} className="text-gray-400" />
            </div>
          )}
          
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-semibold">
            {getStarDisplay(hotel.starRating)}
          </div>

          <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-sm font-bold">
            From {formatCurrency(minPrice)}/night
          </div>
        </div>

        {/* Hotel Details */}
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-bold text-gray-800">{hotel.name}</h3>
              {hotel.city && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin size={14} /> {hotel.city}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">{hotelRooms.length} room types</p>
            </div>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-1 mb-3">
            {hotel.amenities && hotel.amenities.slice(0, 4).map((amenity, index) => (
              <span key={index} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1">
                {getAmenityIcon(amenity)} {amenity}
              </span>
            ))}
            {hotel.amenities && hotel.amenities.length > 4 && (
              <span className="text-[10px] text-gray-400">+{hotel.amenities.length - 4} more</span>
            )}
          </div>

          {/* Address */}
          {hotel.address && (
            <p className="text-xs text-gray-400 mb-3 truncate">
              📍 {hotel.address}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleBookClick}
              className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center justify-center gap-2 bg-blue-600 text-white hover:bg-blue-700"
            >
              <Calendar size={16} /> Book Now
            </button>
            <button
  onClick={() => {
    setSelectedHotelForDetail(hotel);
    setShowDetailModal(true);
  }}
  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
>
  <Eye size={16} />
</button>
          </div>
        </div>
      </div>
    );
  }, [loggedInUser, user, currentUser, getHotelRooms, getStarDisplay, getAmenityIcon]);

  // Booking Modal Component
  const BookingModal = useMemo(() => {
    if (!showBookingModal) return null;

    const hotelRooms = selectedHotelId ? getHotelRooms(selectedHotelId) : [];
    const nightsCount = calculateNights(bookingForm.checkIn, bookingForm.checkOut);
    const total = selectedRoom ? (selectedRoom.price || 0) * nightsCount * (bookingForm.rooms || 1) : 0;

    const handleClose = () => {
      setShowBookingModal(false);
      setSelectedHotel(null);
      setSelectedRoom(null);
      setSelectedHotelId('');
      setCalculatedTotal(0);
      setNights(0);
      setIdImagePreview(null);
      setLicenseImagePreview(null);
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
              <h3 className="text-xl font-bold">Book Hotel</h3>
              <p className="text-sm text-gray-500">
                {selectedHotel ? selectedHotel.name : 'Select a hotel'}
              </p>
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-4">
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

              {/* Hotel Selection */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Hotel size={16} className="text-blue-500" /> Select Hotel & Room
                </h4>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Select Hotel *</label>
                  <select
                    value={selectedHotelId}
                    onChange={(e) => {
                      setSelectedHotelId(e.target.value);
                      setSelectedRoom(null);
                      const hotel = hotels.find(h => h.id === e.target.value);
                      setSelectedHotel(hotel || null);
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    required
                  >
                    <option value="">Select a hotel...</option>
                    {hotels.filter(h => h.status === 'active').map(hotel => (
                      <option key={hotel.id} value={hotel.id}>
                        {hotel.name} - {hotel.city} ({getStarDisplay(hotel.starRating)})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedHotelId && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Select Room Type *</label>
                    <select
                      value={selectedRoom?.id || ''}
                      onChange={(e) => {
                        const room = roomTypes.find(r => r.id === e.target.value);
                        setSelectedRoom(room || null);
                        if (room && bookingForm.checkIn && bookingForm.checkOut) {
                          const nights = calculateNights(bookingForm.checkIn, bookingForm.checkOut);
                          const total = (room.price || 0) * nights * (bookingForm.rooms || 1);
                          setCalculatedTotal(total);
                        }
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    >
                      <option value="">Select a room type...</option>
                      {hotelRooms.map(room => (
                        <option key={room.id} value={room.id}>
                          {room.name} - {getRoomTypeLabel(room.type)} ({formatCurrency(room.price)}/night)
                        </option>
                      ))}
                    </select>
                    {hotelRooms.length === 0 && (
                      <p className="text-xs text-yellow-600 mt-1">⚠️ No rooms available for this hotel.</p>
                    )}
                  </div>
                )}

                {selectedRoom && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700 font-medium">Selected Room:</p>
                    <p className="text-sm text-blue-600">{selectedRoom.name}</p>
                    <p className="text-xs text-blue-500">💰 {formatCurrency(selectedRoom.price)}/night</p>
                    <p className="text-xs text-blue-500">👥 Capacity: {selectedRoom.capacity || 2} people</p>
                  </div>
                )}
              </div>

              {/* Stay Details */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-blue-500" /> Stay Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Check-in Date *</label>
                    <input
                      type="date"
                      value={formatDateForInput(bookingForm.checkIn)}
                      onChange={handleDateInputChange('checkIn')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Check-out Date *</label>
                    <input
                      type="date"
                      value={formatDateForInput(bookingForm.checkOut)}
                      onChange={handleDateInputChange('checkOut')}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                      min={bookingForm.checkIn || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Guests</label>
                    <input
                      type="number"
                      value={bookingForm.guests}
                      onChange={handleNumberInputChange('guests')}
                      min="1"
                      max="20"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rooms</label>
                    <input
                      type="number"
                      value={bookingForm.rooms}
                      onChange={handleNumberInputChange('rooms')}
                      min="1"
                      max="10"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {bookingForm.checkIn && bookingForm.checkOut && nightsCount > 0 && selectedRoom && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Nights:</span>
                        <span className="font-semibold ml-1">{nightsCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Rooms:</span>
                        <span className="font-semibold ml-1">{bookingForm.rooms || 1}</span>
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
                    <p className="text-xs text-yellow-700 mt-1">You will pay later. We'll send you a payment reminder.</p>
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
    selectedHotel,
    selectedHotelId,
    selectedRoom,
    bookingForm,
    hotels,
    roomTypes,
    getHotelRooms,
    getStarDisplay,
    getRoomTypeLabel,
    handleBookingSubmit,
    handleIdImageUpload,
    handleLicenseImageUpload,
    removeIdImage,
    removeLicenseImage,
    handleDateChange,
    handleInputChange,
    handleNumberInputChange,
    formatCurrency,
    idImagePreview,
    licenseImagePreview,
    currentUser
  ]);

  const userBookings = getUserBookings();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading hotels...</p>
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
          <Hotel className="text-blue-600" size={28} />
          Hotels
        </h1>
        <p className="text-gray-500 text-sm">Find the perfect accommodation for your stay</p>
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
          <h2 className="text-lg font-semibold text-gray-800">Your Hotel Bookings</h2>
          <button onClick={() => setShowBookings(false)} className="text-sm text-gray-500 hover:text-gray-700">
            <X size={16} />
          </button>
        </div>
        {userBookings.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Hotel size={32} className="text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">You haven't made any hotel bookings yet</p>
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
              placeholder="Search hotels by name, city, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={filters.starRating}
            onChange={(e) => setFilters(prev => ({ ...prev, starRating: e.target.value }))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="all">All Ratings</option>
            <option value="5">⭐⭐⭐⭐⭐ 5 Star</option>
            <option value="4">⭐⭐⭐⭐ 4 Star</option>
            <option value="3">⭐⭐⭐ 3 Star</option>
            <option value="2">⭐⭐ 2 Star</option>
            <option value="1">⭐ 1 Star</option>
          </select>

          {cities.length > 0 && (
            <select
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>

    {/* Hotels Grid */}
    {filteredHotels.length === 0 ? (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <Hotel size={48} className="text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-600">No hotels found</h3>
        <p className="text-gray-400 text-sm">
          {searchTerm ? 'Try adjusting your search criteria' : 'No hotels available at the moment'}
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 max-w-7xl mx-auto">
        {filteredHotels.map(hotel => (
          <HotelCard key={hotel.id} hotel={hotel} />
        ))}
      </div>
    )}

    {/* Booking Modal */}
    {BookingModal}

    {/* Detail Modal - ✅ INSIDE the return, before closing div */}
    {showDetailModal && selectedHotelForDetail && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold">{selectedHotelForDetail.name}</h3>
              {selectedHotelForDetail.city && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <MapPin size={14} /> {selectedHotelForDetail.city}
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
            {/* Images */}
            {selectedHotelForDetail.images && selectedHotelForDetail.images.length > 0 && (
              <div className="mb-4 rounded-lg overflow-hidden">
                <img src={selectedHotelForDetail.images[0]} alt={selectedHotelForDetail.name} className="w-full h-56 object-cover" />
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Star size={16} className="mx-auto text-yellow-400 mb-1" />
                <p className="text-sm font-semibold">{getStarDisplay(selectedHotelForDetail.starRating)}</p>
                <p className="text-xs text-gray-500">Rating</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <MapPin size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{selectedHotelForDetail.city || 'N/A'}</p>
                <p className="text-xs text-gray-500">Location</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Clock size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{selectedHotelForDetail.checkIn || '14:00'} - {selectedHotelForDetail.checkOut || '11:00'}</p>
                <p className="text-xs text-gray-500">Check-in/Out</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Users size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{getHotelRooms(selectedHotelForDetail.id).length}</p>
                <p className="text-xs text-gray-500">Room Types</p>
              </div>
            </div>

            {/* Address */}
            {selectedHotelForDetail.address && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">📍 Address</h4>
                <p className="text-sm text-gray-600">{selectedHotelForDetail.address}</p>
              </div>
            )}

            {/* Description */}
            {selectedHotelForDetail.description && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">Description</h4>
                <p className="text-sm text-gray-600">{selectedHotelForDetail.description}</p>
              </div>
            )}

            {/* Amenities */}
            {selectedHotelForDetail.amenities && selectedHotelForDetail.amenities.length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-1">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedHotelForDetail.amenities.map((amenity, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-1">
                      {getAmenityIcon(amenity)} {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Room Types */}
            {getHotelRooms(selectedHotelForDetail.id).length > 0 && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">🛏️ Room Types</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {getHotelRooms(selectedHotelForDetail.id).map(room => (
                    <div key={room.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="font-medium text-sm">{room.name}</p>
                      <p className="text-xs text-gray-500">{getRoomTypeLabel(room.type)}</p>
                      <p className="text-sm font-bold text-blue-600">{formatCurrency(room.price)}/night</p>
                      <p className="text-xs text-gray-400">👥 {room.capacity || 2} people</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowDetailModal(false);
                setSelectedHotel(selectedHotelForDetail);
                setSelectedHotelId(selectedHotelForDetail.id);
                setSelectedRoom(null);
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
    )}
  </div>
);
  
};

export default HotelsClient;