import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, DollarSign, MapPin, 
  Search, Filter, RefreshCw, Eye, 
  X, AlertCircle, CheckCircle, Clock,
  CreditCard, Wallet, Phone, Mail, User,
  ArrowRight, ChevronDown, ChevronUp,
  Download, Printer, FileText,
  Hotel, Bed, Save, Plus, Edit2, Trash2,
  Building, Star, Wifi, Coffee, Car as CarIcon
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingService, hotelService, roomTypeService } from '../../services/api';

const HotelBookings = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterHotel, setFilterHotel] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantId, setTenantId] = useState(null);

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    mpesaCode: '',
    notes: ''
  });
  const [processing, setProcessing] = useState(false);

  // Form state for creating booking
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerIdNumber: '',
    hotelId: '',
    roomTypeId: '',
    checkIn: '',
    checkOut: '',
    guests: 1,
    rooms: 1,
    notes: '',
    totalPrice: '',
    paymentMethod: 'CASH',
    mpesaCode: '',
    paidAmount: 0,
    remainingBalance: 0,
    paymentStatus: 'PENDING'
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
      let hotelsData = [];
      if (hotelsResponse?.success && hotelsResponse?.data) {
        hotelsData = hotelsResponse.data;
      } else if (Array.isArray(hotelsResponse)) {
        hotelsData = hotelsResponse;
      }
      setHotels(hotelsData);

      // Load room types
      const roomsResponse = await roomTypeService.getAll(tenantToUse);
      let roomsData = [];
      if (roomsResponse?.success && roomsResponse?.data) {
        roomsData = roomsResponse.data;
      } else if (Array.isArray(roomsResponse)) {
        roomsData = roomsResponse;
      }
      setRoomTypes(roomsData);

      // Load hotel bookings
      const bookingsResponse = await bookingService.getAll(tenantToUse);
      let bookingsData = [];
      if (bookingsResponse?.success && bookingsResponse?.data) {
        bookingsData = bookingsResponse.data;
      } else if (Array.isArray(bookingsResponse)) {
        bookingsData = bookingsResponse;
      }

      // Filter hotel bookings
      const hotelBookings = bookingsData.filter(b => 
        b.serviceType === 'hotel' || b.serviceType === 'Hotel'
      );
      setBookings(hotelBookings);
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
      showNotification('Error loading data', 'error');
      loadFromLocalStorage();
    }
    setLoading(false);
  };

  // ✅ FALLBACK TO LOCALSTORAGE
  const loadFromLocalStorage = () => {
    try {
      const storedBookings = JSON.parse(localStorage.getItem('travel_agency_hotel_bookings') || '[]');
      setBookings(storedBookings);
      const storedHotels = JSON.parse(localStorage.getItem('travel_agency_hotels') || '[]');
      setHotels(storedHotels);
      const storedRooms = JSON.parse(localStorage.getItem('travel_agency_room_types') || '[]');
      setRoomTypes(storedRooms);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setBookings([]);
      setHotels([]);
      setRoomTypes([]);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerIdNumber: '',
      hotelId: '',
      roomTypeId: '',
      checkIn: '',
      checkOut: '',
      guests: 1,
      rooms: 1,
      notes: '',
      totalPrice: '',
      paymentMethod: 'CASH',
      mpesaCode: '',
      paidAmount: 0,
      remainingBalance: 0,
      paymentStatus: 'PENDING'
    });
  };

  const getHotelDetails = (hotelId) => {
    return hotels.find(h => h.id === hotelId);
  };

  const getRoomDetails = (roomId) => {
    return roomTypes.find(r => r.id === roomId);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '📌 Confirmed', color: 'bg-blue-100 text-blue-800' },
      checked_in: { label: '🏨 Checked In', color: 'bg-green-100 text-green-800' },
      checked_out: { label: '✅ Checked Out', color: 'bg-purple-100 text-purple-800' },
      cancelled: { label: '❌ Cancelled', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { label: status || 'Pending', color: 'bg-gray-100 text-gray-800' };
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      PAID: { label: '✅ Paid', color: 'bg-green-100 text-green-800' },
      PENDING: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800' },
      PARTIAL: { label: '🔄 Partial', color: 'bg-blue-100 text-blue-800' }
    };
    return statusMap[status] || { label: status || 'Pending', color: 'bg-gray-100 text-gray-800' };
  };

  const formatCurrency = (amount) => {
    return `KSh ${(amount || 0).toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-KE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
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

  const toggleExpand = (bookingId) => {
    setExpandedCards(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const diffTime = Math.abs(outDate - inDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // ✅ CREATE HOTEL BOOKING VIA API
  const handleCreateBooking = async () => {
    if (!formData.customerName || !formData.hotelId || !formData.roomTypeId || !formData.checkIn || !formData.checkOut) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const hotel = getHotelDetails(formData.hotelId);
      const room = getRoomDetails(formData.roomTypeId);
      const nights = calculateNights(formData.checkIn, formData.checkOut);
      const totalPrice = parseFloat(formData.totalPrice) || (room?.price || 0) * nights || 0;

      let paidAmount = 0;
      let remainingBalance = totalPrice;
      let paymentStatus = formData.paymentStatus;

      if (formData.paymentMethod === 'CREDIT') {
        paidAmount = 0;
        remainingBalance = totalPrice;
        paymentStatus = 'PENDING';
      } else if (formData.paymentMethod === 'M_PESA' || formData.paymentMethod === 'CASH') {
        paidAmount = totalPrice;
        remainingBalance = 0;
        paymentStatus = 'PAID';
      }

      const bookingData = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail || '',
        customerPhone: formData.customerPhone || '',
        customerIdNumber: formData.customerIdNumber || '',
        serviceType: 'hotel',
        isGuestBooking: false,
        hotelId: formData.hotelId,
        roomTypeId: formData.roomTypeId,
        hotelName: hotel?.name || '',
        hotelCity: hotel?.city || '',
        hotelStarRating: hotel?.starRating || 0,
        roomName: room?.name || '',
        roomType: room?.type || 'standard',
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        nights: nights,
        guests: parseInt(formData.guests) || 1,
        rooms: parseInt(formData.rooms) || 1,
        totalPrice: totalPrice,
        paymentMethod: formData.paymentMethod,
        paymentStatus: paymentStatus,
        mpesaCode: formData.mpesaCode || '',
        paidAmount: paidAmount,
        remainingBalance: remainingBalance,
        notes: formData.notes || '',
        status: 'pending',
        tenantId: tenantId
      };

      console.log('📤 Creating hotel booking:', bookingData);
      const response = await bookingService.create(bookingData);
      console.log('📥 Create response:', response);

      if (response?.success) {
        showNotification(`✅ Hotel booking created successfully for ${formData.customerName}!`);
        setShowCreateModal(false);
        resetForm();
        loadData(tenantId);
      } else {
        showNotification('Failed to create booking: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('❌ Error creating booking:', error);
      showNotification('Failed to create booking. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  // ✅ RECORD PAYMENT VIA API
  const handleRecordPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      showNotification('Please enter a valid payment amount', 'error');
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (amount > selectedBooking.remainingBalance) {
      showNotification(`Amount exceeds remaining balance of ${formatCurrency(selectedBooking.remainingBalance)}`, 'error');
      return;
    }

    if (paymentForm.paymentMethod === 'M_PESA') {
      if (!paymentForm.mpesaCode || paymentForm.mpesaCode.length < 6) {
        showNotification('Please enter a valid M-Pesa transaction code', 'error');
        return;
      }
    }

    setProcessing(true);

    try {
      const updatedBooking = {
        ...selectedBooking,
        paidAmount: (selectedBooking.paidAmount || 0) + amount,
        remainingBalance: selectedBooking.totalPrice - ((selectedBooking.paidAmount || 0) + amount),
        paymentStatus: (selectedBooking.totalPrice - ((selectedBooking.paidAmount || 0) + amount)) <= 0 ? 'PAID' : 'PARTIAL',
        paymentMethod: paymentForm.paymentMethod,
        mpesaCode: paymentForm.mpesaCode || selectedBooking.mpesaCode,
        updatedAt: new Date().toISOString()
      };

      console.log(`📤 Updating booking ${selectedBooking.id} payment:`, updatedBooking);
      const response = await bookingService.update(selectedBooking.id, updatedBooking);
      console.log('📥 Update response:', response);

      if (response?.success) {
        showNotification(`✅ Payment of ${formatCurrency(amount)} recorded successfully!`);
        setShowPaymentModal(false);
        setSelectedBooking(null);
        setPaymentForm({ amount: '', paymentMethod: 'CASH', mpesaCode: '', notes: '' });
        loadData(tenantId);
      } else {
        showNotification('Failed to record payment: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      showNotification('Failed to record payment. Please try again.', 'error');
    }

    setProcessing(false);
  };

  // ✅ UPDATE BOOKING STATUS VIA API
  const updateBookingStatus = async (bookingId, newStatus) => {
    try {
      console.log(`📤 Updating booking ${bookingId} status to ${newStatus}`);
      const response = await bookingService.updateStatus(bookingId, newStatus);
      console.log('📥 Update response:', response);

      if (response?.success) {
        showNotification(`✅ Booking status updated to ${newStatus}`);
        setShowStatusModal(false);
        loadData(tenantId);
      } else {
        showNotification('Failed to update status: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      showNotification('Failed to update status. Please try again.', 'error');
    }
  };

  // ✅ UPDATE PAYMENT STATUS VIA API
  const updatePaymentStatus = async (bookingId, newPaymentStatus) => {
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      const updatedBooking = {
        ...booking,
        paymentStatus: newPaymentStatus,
        updatedAt: new Date().toISOString()
      };

      console.log(`📤 Updating booking ${bookingId} payment status to ${newPaymentStatus}`);
      const response = await bookingService.update(bookingId, updatedBooking);
      console.log('📥 Update response:', response);

      if (response?.success) {
        showNotification(`✅ Payment status updated to ${newPaymentStatus}`);
        loadData(tenantId);
      } else {
        showNotification('Failed to update payment status: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      showNotification('Failed to update payment status. Please try again.', 'error');
    }
  };

  // ✅ DELETE BOOKING VIA API
  const handleDeleteBooking = async (bookingId) => {
    try {
      console.log(`📤 Deleting booking ${bookingId}`);
      const response = await bookingService.delete(bookingId);
      console.log('📥 Delete response:', response);

      if (response?.success) {
        showNotification('✅ Booking deleted successfully!');
        setShowDeleteModal(false);
        setSelectedBooking(null);
        loadData(tenantId);
      } else {
        showNotification('Failed to delete booking: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting booking:', error);
      showNotification('Failed to delete booking. Please try again.', 'error');
    }
  };

  const filteredBookings = bookings.filter(b => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      b.customerName?.toLowerCase().includes(searchLower) ||
      b.hotelName?.toLowerCase().includes(searchLower) ||
      b.roomName?.toLowerCase().includes(searchLower) ||
      b.customerEmail?.toLowerCase().includes(searchLower) ||
      b.customerPhone?.toLowerCase().includes(searchLower);
    
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchesHotel = filterHotel === 'all' || b.hotelId === filterHotel;
    
    return matchesSearch && matchesStatus && matchesHotel;
  });

  // Stats
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const checkedInBookings = bookings.filter(b => b.status === 'checked_in').length;
  const checkedOutBookings = bookings.filter(b => b.status === 'checked_out').length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const totalDebt = bookings.reduce((sum, b) => sum + (b.remainingBalance || 0), 0);

  const statsCards = [
    { title: 'Total Bookings', value: totalBookings, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Pending', value: pendingBookings, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { title: 'Confirmed', value: confirmedBookings, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Checked In', value: checkedInBookings, icon: Hotel, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Debt', value: formatCurrency(totalDebt), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'checked_in', label: 'Checked In' },
    { value: 'checked_out', label: 'Checked Out' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Render Create Modal
  const renderCreateModal = () => {
    if (!showCreateModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowCreateModal(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <button 
            onClick={() => setShowCreateModal(false)}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-white">Create Hotel Booking</h2>
            <p className="text-blue-100 text-sm">Add a new hotel booking</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({...formData, customerEmail: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({...formData, customerPhone: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="+254 700 000 000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Hotel *</label>
                <select
                  value={formData.hotelId}
                  onChange={(e) => {
                    setFormData({...formData, hotelId: e.target.value, roomTypeId: ''});
                  }}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Select a hotel...</option>
                  {hotels.filter(h => h.status === 'active').map(hotel => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.name} - {hotel.city} ({'⭐'.repeat(hotel.starRating || 3)})
                    </option>
                  ))}
                </select>
              </div>

              {formData.hotelId && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room Type *</label>
                  <select
                    value={formData.roomTypeId}
                    onChange={(e) => {
                      const room = getRoomDetails(e.target.value);
                      setFormData({...formData, roomTypeId: e.target.value});
                    }}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Select a room type...</option>
                    {roomTypes
                      .filter(r => r.hotelId === formData.hotelId && r.status === 'active')
                      .map(room => (
                        <option key={room.id} value={room.id}>
                          {room.name} - {room.type} (KSh {room.price?.toLocaleString()}/night)
                        </option>
                      ))}
                  </select>
                </div>
              )}

              {formData.roomTypeId && (
                <div className="md:col-span-2 bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    🏨 {getRoomDetails(formData.roomTypeId)?.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    💰 Price per night: KSh {(getRoomDetails(formData.roomTypeId)?.price || 0).toLocaleString()}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date *</label>
                <input
                  type="date"
                  value={formData.checkIn}
                  onChange={(e) => setFormData({...formData, checkIn: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date *</label>
                <input
                  type="date"
                  value={formData.checkOut}
                  onChange={(e) => setFormData({...formData, checkOut: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guests</label>
                <input
                  type="number"
                  value={formData.guests}
                  onChange={(e) => setFormData({...formData, guests: parseInt(e.target.value) || 1})}
                  min="1"
                  max="20"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rooms</label>
                <input
                  type="number"
                  value={formData.rooms}
                  onChange={(e) => setFormData({...formData, rooms: parseInt(e.target.value) || 1})}
                  min="1"
                  max="10"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              {formData.checkIn && formData.checkOut && (
                <div className="md:col-span-2 bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">
                    🏨 {calculateNights(formData.checkIn, formData.checkOut)} nights stay
                  </p>
                  <p className="text-sm font-semibold text-green-600 mt-1">
                    Total: KSh {((getRoomDetails(formData.roomTypeId)?.price || 0) * calculateNights(formData.checkIn, formData.checkOut) * (formData.rooms || 1)).toLocaleString()}
                  </p>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => {
                    const method = e.target.value;
                    setFormData({...formData, paymentMethod: method});
                    if (method !== 'M_PESA') {
                      setFormData(prev => ({...prev, mpesaCode: ''}));
                    }
                  }}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="M_PESA">M-Pesa</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CREDIT">Credit (Pay Later)</option>
                </select>
              </div>

              {formData.paymentMethod === 'M_PESA' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Transaction Code *</label>
                  <input
                    type="text"
                    value={formData.mpesaCode}
                    onChange={(e) => setFormData({...formData, mpesaCode: e.target.value.toUpperCase()})}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., ABC123DEF456"
                  />
                </div>
              )}

              {formData.paymentMethod === 'CREDIT' && (
                <div className="md:col-span-2 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertCircle size={16} />
                    <span className="text-sm font-medium">Credit Payment</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    Customer will pay later. You can record payments from the booking list.
                  </p>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  rows="2"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Special requests or notes..."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200 mt-4">
              <button 
                onClick={handleCreateBooking}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} /> Create Booking
              </button>
              <button 
                onClick={() => setShowCreateModal(false)}
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

  // Render Status Modal
  const renderStatusModal = () => {
    if (!showStatusModal || !selectedBooking) return null;

    const statusBadge = getStatusBadge(selectedBooking.status);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/50" onClick={() => setShowStatusModal(false)}></div>
        <div className="relative bg-white rounded-xl w-full max-w-md p-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock size={24} className="text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Update Booking Status</h2>
            <p className="text-sm text-gray-500 mt-1">
              Current status: <span className={`font-medium ${statusBadge.color}`}>{statusBadge.label}</span>
            </p>
            <div className="mt-4 space-y-2">
              {['confirmed', 'checked_in', 'checked_out', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => updateBookingStatus(selectedBooking.id, status)}
                  className="w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
                >
                  <span className="text-sm capitalize">{status.replace('_', ' ')}</span>
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
                    onClick={() => updatePaymentStatus(selectedBooking.id, status)}
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
    );
  };

  // Render Delete Modal
  const renderDeleteModal = () => {
    if (!showDeleteModal || !selectedBooking) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowDeleteModal(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Booking?</h3>
            <p className="text-gray-500 text-sm">
              Are you sure you want to delete booking for "{selectedBooking.customerName}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => handleDeleteBooking(selectedBooking.id)}
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
      {renderCreateModal()}
      {renderStatusModal()}
      {renderDeleteModal()}

      {/* Payment Modal */}
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
                  <span className="text-gray-600">Hotel:</span>
                  <span className="font-medium">{selectedBooking.hotelName}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Room:</span>
                  <span className="font-medium">{selectedBooking.roomName}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium">{formatCurrency(selectedBooking.totalPrice)}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Paid:</span>
                  <span className="font-medium text-green-600">{formatCurrency(selectedBooking.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between mt-1 border-t border-gray-200 pt-1">
                  <span className="text-gray-600 font-semibold">Remaining:</span>
                  <span className="font-bold text-red-600">{formatCurrency(selectedBooking.remainingBalance)}</span>
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
                  <input
                    type="text"
                    value={paymentForm.mpesaCode}
                    onChange={(e) => setPaymentForm({...paymentForm, mpesaCode: e.target.value.toUpperCase()})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., ABC123DEF456"
                  />
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
                disabled={processing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2 disabled:opacity-50"
              >
                {processing ? 'Processing...' : <><Save size={16} /> Record Payment</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Hotel size={24} />
                <div>
                  <h2 className="text-lg font-semibold">Hotel Booking Details</h2>
                  <p className="text-sm text-blue-100">#{selectedBooking.id?.slice(0, 10)}...</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div><span className="text-xs text-gray-500">Name:</span> <span className="text-sm font-medium">{selectedBooking.customerName}</span></div>
                  <div><span className="text-xs text-gray-500">Email:</span> <span className="text-sm font-medium">{selectedBooking.customerEmail || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">Phone:</span> <span className="text-sm font-medium">{selectedBooking.customerPhone || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">ID Number:</span> <span className="text-sm font-medium">{selectedBooking.customerIdNumber || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">Guests:</span> <span className="text-sm font-medium">{selectedBooking.guests || 1}</span></div>
                  <div><span className="text-xs text-gray-500">Rooms:</span> <span className="text-sm font-medium">{selectedBooking.rooms || 1}</span></div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Hotel & Room</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div className="col-span-2"><span className="text-xs text-gray-500">Hotel:</span> <span className="text-sm font-medium">{selectedBooking.hotelName}</span></div>
                  <div className="col-span-2"><span className="text-xs text-gray-500">Room:</span> <span className="text-sm font-medium">{selectedBooking.roomName}</span></div>
                  <div><span className="text-xs text-gray-500">Check-in:</span> <span className="text-sm font-medium">{formatDate(selectedBooking.checkIn)}</span></div>
                  <div><span className="text-xs text-gray-500">Check-out:</span> <span className="text-sm font-medium">{formatDate(selectedBooking.checkOut)}</span></div>
                  <div><span className="text-xs text-gray-500">Nights:</span> <span className="text-sm font-medium">{selectedBooking.nights || 0}</span></div>
                  <div><span className="text-xs text-gray-500">Status:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusBadge(selectedBooking.status).color}`}>{getStatusBadge(selectedBooking.status).label}</span></div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div><span className="text-xs text-gray-500">Total:</span> <span className="text-sm font-medium text-green-600">{formatCurrency(selectedBooking.totalPrice)}</span></div>
                  <div><span className="text-xs text-gray-500">Paid:</span> <span className="text-sm font-medium text-green-600">{formatCurrency(selectedBooking.paidAmount || 0)}</span></div>
                  <div><span className="text-xs text-gray-500">Remaining:</span> <span className={`text-sm font-medium ${selectedBooking.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(selectedBooking.remainingBalance)}</span></div>
                  <div><span className="text-xs text-gray-500">Status:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getPaymentStatusBadge(selectedBooking.paymentStatus).color}`}>{getPaymentStatusBadge(selectedBooking.paymentStatus).label}</span></div>
                  <div><span className="text-xs text-gray-500">Method:</span> <span className="text-sm font-medium">{selectedBooking.paymentMethod || 'N/A'}</span></div>
                  {selectedBooking.mpesaCode && (
                    <div><span className="text-xs text-gray-500">M-Pesa Code:</span> <span className="text-sm font-medium">{selectedBooking.mpesaCode}</span></div>
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
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex flex-wrap justify-end gap-2">
              {selectedBooking.remainingBalance > 0 && (
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    setPaymentForm({ amount: '', paymentMethod: 'CASH', mpesaCode: '', notes: '' });
                    setShowPaymentModal(true);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                >
                  <CreditCard size={16} /> Record Payment
                </button>
              )}
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Hotel size={28} className="text-blue-600" />
            Hotel Bookings
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage hotel reservations and payments</p>
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
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {statsCards.map((stat, index) => (
          <div key={index} className={`${stat.bg} rounded-xl p-4 border border-gray-100`}>
            <div className="flex items-center justify-between">
              <stat.icon size={20} className={stat.color} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-800 mt-2">{stat.value}</p>
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
            placeholder="Search by customer or hotel..."
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
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={16} className="text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
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
        </div>
      </div>

      {/* Bookings List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Hotel size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No hotel bookings found</p>
          <p className="text-sm text-gray-400">
            {searchQuery || filterStatus !== 'all' || filterHotel !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Create your first hotel booking by clicking "New Booking"'}
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus size={16} className="inline mr-1" /> New Booking
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => {
            const statusBadge = getStatusBadge(booking.status);
            const paymentBadge = getPaymentStatusBadge(booking.paymentStatus);
            const hasDebt = (booking.remainingBalance || 0) > 0;
            const isExpanded = expandedCards[booking.id] || false;

            return (
              <div 
                key={booking.id}
                className={`bg-white border rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden ${
                  hasDebt ? 'border-red-200 bg-red-50/20' : 'border-gray-100'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        booking.status === 'confirmed' ? 'bg-blue-500' :
                        booking.status === 'checked_in' ? 'bg-green-500' :
                        booking.status === 'checked_out' ? 'bg-purple-500' :
                        booking.status === 'pending' ? 'bg-yellow-500' :
                        booking.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'
                      }`}></div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{booking.customerName || 'Customer'}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {booking.hotelName || 'Hotel'} • {booking.roomName || 'Room'}
                          {booking.nights && ` • ${booking.nights} nights`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                        {statusBadge.label}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${paymentBadge.color}`}>
                        {paymentBadge.label}
                      </span>
                      <span className="text-sm font-bold text-green-600">
                        {formatCurrency(booking.totalPrice)}
                      </span>
                      {hasDebt && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                          <AlertCircle size={10} /> Debt: {formatCurrency(booking.remainingBalance)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-500">
                    <div><span className="font-medium text-gray-600">Check-in:</span> <span className="font-medium text-gray-700">{formatDate(booking.checkIn)}</span></div>
                    <div><span className="font-medium text-gray-600">Check-out:</span> <span className="font-medium text-gray-700">{formatDate(booking.checkOut)}</span></div>
                    <div><span className="font-medium text-gray-600">Guests:</span> <span className="font-medium text-gray-700">{booking.guests || 1}</span></div>
                    <div><span className="font-medium text-gray-600">Rooms:</span> <span className="font-medium text-gray-700">{booking.rooms || 1}</span></div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => toggleExpand(booking.id)}
                      className="px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {isExpanded ? 'Show Less' : 'Show More'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetailModal(true);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Eye size={14} /> View Details
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowStatusModal(true);
                      }}
                      className="flex-1 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 size={14} /> Status
                    </button>
                    {hasDebt && (
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setPaymentForm({ amount: '', paymentMethod: 'CASH', mpesaCode: '', notes: '' });
                          setShowPaymentModal(true);
                        }}
                        className="px-3 py-1.5 text-xs text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <CreditCard size={14} /> Pay
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDeleteModal(true);
                      }}
                      className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 text-xs">
                      <div><span className="font-medium text-gray-600">Customer Email:</span> {booking.customerEmail || 'N/A'}</div>
                      <div><span className="font-medium text-gray-600">Phone:</span> {booking.customerPhone || 'N/A'}</div>
                      <div><span className="font-medium text-gray-600">ID Number:</span> {booking.customerIdNumber || 'N/A'}</div>
                      <div><span className="font-medium text-gray-600">Room:</span> {booking.roomName}</div>
                      <div><span className="font-medium text-gray-600">Nights:</span> {booking.nights || 0}</div>
                      <div><span className="font-medium text-gray-600">Payment Method:</span> {booking.paymentMethod || 'N/A'}</div>
                      {booking.notes && (
                        <div className="col-span-2 sm:col-span-3">
                          <span className="font-medium text-gray-600">Notes:</span>
                          <p className="text-gray-500 mt-1">{booking.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
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

export default HotelBookings;