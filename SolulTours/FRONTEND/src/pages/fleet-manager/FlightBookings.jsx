import React, { useState, useEffect } from 'react';
import { 
  Calendar, Users, DollarSign, MapPin, 
  Search, Filter, RefreshCw, Eye, 
  X, AlertCircle, CheckCircle, Clock,
  CreditCard, Wallet, Phone, Mail, User,
  ArrowRight, ChevronDown, ChevronUp,
  Download, Printer, FileText,
  Plane, PlaneTakeoff, PlaneLanding, 
  Ticket, Save, Plus, Edit2, Trash2,
  Building, Award, Globe
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingService, flightService } from '../../services/api';

const FlightBookings = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAirline, setFilterAirline] = useState('all');
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
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);

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
    flightId: '',
    passengers: 1,
    seatClass: 'economy',
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
    console.log('🔍 Loading flight bookings with tenantId:', tenantToUse);
    
    if (!tenantToUse) {
      console.warn('⚠️ No tenantId available, skipping API call');
      setLoading(false);
      return;
    }
    
    // ✅ Fetch all bookings and filter for flight bookings
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
    console.log(`📊 Loaded ${flightBookings.length} flight bookings`);
    
    // ✅ LOG FIRST FLIGHT BOOKING TO SEE FIELDS
    if (flightBookings.length > 0) {
      console.log('🛫 FIRST FLIGHT BOOKING FROM BACKEND:');
      console.log('  - All keys:', Object.keys(flightBookings[0]));
      console.log('  - departure_date_flight:', flightBookings[0].departure_date_flight);
      console.log('  - departure_time_flight:', flightBookings[0].departure_time_flight);
      console.log('  - arrival_date_flight:', flightBookings[0].arrival_date_flight);
      console.log('  - arrival_time_flight:', flightBookings[0].arrival_time_flight);
      console.log('  - duration_flight:', flightBookings[0].duration_flight);
      console.log('  - seat_class:', flightBookings[0].seat_class);
      console.log('  - Full object:', flightBookings[0]);
    }
    
    setBookings(flightBookings);
    
    // ✅ Fetch flights for reference
    const flightsResponse = await flightService.getAll(tenantToUse);
    console.log('📊 Flights response:', flightsResponse);
    
    let flightsData = [];
    if (flightsResponse?.success && flightsResponse?.data) {
      flightsData = flightsResponse.data;
    } else if (Array.isArray(flightsResponse)) {
      flightsData = flightsResponse;
    }
    
    // ✅ LOG THE FIRST FLIGHT TO SEE WHAT FIELDS ARE AVAILABLE
    if (flightsData.length > 0) {
      console.log('🛫 ========================================');
      console.log('🛫 FIRST FLIGHT FROM BACKEND:');
      console.log('🛫 ========================================');
      console.log('  - All keys:', Object.keys(flightsData[0]));
      console.log('  - id:', flightsData[0].id);
      console.log('  - airline:', flightsData[0].airline);
      console.log('  - flightNumber:', flightsData[0].flightNumber);
      console.log('  - origin:', flightsData[0].origin);
      console.log('  - destination:', flightsData[0].destination);
      console.log('  - departureDate:', flightsData[0].departureDate);
      console.log('  - departureTime:', flightsData[0].departureTime);
      console.log('  - arrivalDate:', flightsData[0].arrivalDate);
      console.log('  - arrivalTime:', flightsData[0].arrivalTime);
      console.log('  - duration:', flightsData[0].duration);
      console.log('  - economyPrice:', flightsData[0].economyPrice);
      console.log('  - businessPrice:', flightsData[0].businessPrice);
      console.log('  - firstClassPrice:', flightsData[0].firstClassPrice);
      console.log('🛫 ========================================');
      
      // ✅ Check if any of the critical fields are missing
      const criticalFields = ['departureDate', 'departureTime', 'arrivalDate', 'arrivalTime', 'duration'];
      criticalFields.forEach(field => {
        if (flightsData[0][field] === null || flightsData[0][field] === undefined) {
          console.warn(`⚠️ Flight field "${field}" is NULL or UNDEFINED!`);
        } else {
          console.log(`✅ Flight field "${field}" has value:`, flightsData[0][field]);
        }
      });
    } else {
      console.warn('⚠️ No flights found in the system!');
    }
    
    // Parse amenities
    const parsedFlights = flightsData.map(flight => ({
      ...flight,
      amenities: flight.amenities ? 
        (typeof flight.amenities === 'string' ? JSON.parse(flight.amenities) : flight.amenities) 
        : []
    }));
    setFlights(parsedFlights);
    
    // Save to localStorage for fallback
    localStorage.setItem('travel_agency_flight_bookings', JSON.stringify(flightBookings));
    localStorage.setItem('travel_agency_flights', JSON.stringify(parsedFlights));
    
  } catch (error) {
    console.error('❌ Error loading data:', error);
    showNotification('Error loading data', 'error');
    loadFromLocalStorage();
  }
  
  setLoading(false);
};

  // ✅ Fallback to localStorage
  const loadFromLocalStorage = () => {
    console.warn('Loading flight bookings from localStorage (fallback)');
    try {
      const storedBookings = JSON.parse(localStorage.getItem('travel_agency_flight_bookings') || '[]');
      setBookings(storedBookings);
      const storedFlights = JSON.parse(localStorage.getItem('travel_agency_flights') || '[]');
      setFlights(storedFlights);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setBookings([]);
      setFlights([]);
    }
  };

  const generateId = () => {
    return `flight_book_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerIdNumber: '',
      flightId: '',
      passengers: 1,
      seatClass: 'economy',
      notes: '',
      totalPrice: '',
      paymentMethod: 'CASH',
      mpesaCode: '',
      paidAmount: 0,
      remainingBalance: 0,
      paymentStatus: 'PENDING'
    });
  };

  const getFlightDetails = (flightId) => {
  const flight = flights.find(f => f.id === flightId);
  if (flight) {
    console.log(`🔍 Found flight ${flightId}:`, flight.airline, flight.flightNumber);
    console.log(`   departureDate: ${flight.departureDate}, departureTime: ${flight.departureTime}`);
  } else {
    console.warn(`⚠️ Flight not found with ID: ${flightId}`);
  }
  return flight;
};

  const handleSeatClassChange = (e) => {
  const seatClass = e.target.value;
  const flight = getFlightDetails(formData.flightId);
  
  let pricePerPassenger = 0;
  switch (seatClass) {
    case 'economy':
      pricePerPassenger = flight?.economyPrice || 0;
      break;
    case 'business':
      pricePerPassenger = flight?.businessPrice || 0;
      break;
    case 'first_class':
      pricePerPassenger = flight?.firstClassPrice || 0;
      break;
    default:
      pricePerPassenger = flight?.economyPrice || 0;
  }
  
  setFormData(prev => ({ 
    ...prev, 
    seatClass: seatClass,
    totalPrice: pricePerPassenger * (prev.passengers || 1)
  }));
};

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '📌 Confirmed', color: 'bg-blue-100 text-blue-800' },
      checked_in: { label: '✅ Checked In', color: 'bg-green-100 text-green-800' },
      completed: { label: '✅ Completed', color: 'bg-purple-100 text-purple-800' },
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

  const getSeatClassLabel = (seatClass) => {
  const labels = {
    economy: '💺 Economy',
    business: '💼 Business',
    first_class: '👑 First Class'
  };
  return labels[seatClass] || seatClass || 'Economy';
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

  const toggleExpand = (bookingId) => {
    setExpandedCards(prev => ({
      ...prev,
      [bookingId]: !prev[bookingId]
    }));
  };

  const openEditModal = (booking) => {
  setEditingBooking(booking);
  setFormData({
    customerName: booking.customerName || '',
    customerEmail: booking.customerEmail || '',
    customerPhone: booking.customerPhone || '',
    customerIdNumber: booking.customerIdNumber || '',
    flightId: booking.flightId || '',
    passengers: booking.passengers || 1,
    seatClass: booking.seatClass || 'economy',
    notes: booking.notes || '',
    totalPrice: booking.totalPrice || 0,
    paymentMethod: booking.paymentMethod || 'CASH',
    mpesaCode: booking.mpesaCode || '',
    paidAmount: booking.paidAmount || 0,
    remainingBalance: booking.remainingBalance || 0,
    paymentStatus: booking.paymentStatus || 'PENDING'
  });
  setShowEditModal(true);
};

  // ✅ Create booking via API
const handleCreateBooking = async () => {
  if (!formData.customerName || !formData.flightId || !formData.passengers) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }

  if (formData.paymentMethod === 'M_PESA') {
    if (!formData.mpesaCode || formData.mpesaCode.length < 6) {
      showNotification('Please enter a valid M-Pesa transaction code', 'error');
      return;
    }
  }

  setIsSubmitting(true);

  try {
    const flight = getFlightDetails(formData.flightId);
    
    // ✅ LOG THE FLIGHT OBJECT
    console.log('🛫 Flight object from state:', flight);
    console.log('🛫 All flight keys:', flight ? Object.keys(flight) : 'No flight found');
    console.log('🛫 Flight departureDate:', flight?.departureDate);
    console.log('🛫 Flight departureTime:', flight?.departureTime);
    console.log('🛫 Flight arrivalDate:', flight?.arrivalDate);
    console.log('🛫 Flight arrivalTime:', flight?.arrivalTime);
    console.log('🛫 Flight duration:', flight?.duration);
    console.log('🛫 Flight economyPrice:', flight?.economyPrice);
    console.log('🛫 Flight businessPrice:', flight?.businessPrice);
    console.log('🛫 Flight firstClassPrice:', flight?.firstClassPrice);
    
    // Calculate price based on selected seat class
    let pricePerPassenger = 0;
    switch (formData.seatClass) {
      case 'economy':
        pricePerPassenger = flight?.economyPrice || 0;
        break;
      case 'business':
        pricePerPassenger = flight?.businessPrice || 0;
        break;
      case 'first_class':
        pricePerPassenger = flight?.firstClassPrice || 0;
        break;
      default:
        pricePerPassenger = flight?.economyPrice || 0;
    }
    
    const totalPrice = parseFloat(formData.totalPrice) || (pricePerPassenger * (formData.passengers || 1));
    
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

    const newBooking = {
  customerName: formData.customerName,
  customerEmail: formData.customerEmail || '',
  customerPhone: formData.customerPhone || '',
  customerIdNumber: formData.customerIdNumber || '',
  serviceType: 'flight',
  isGuestBooking: false,
  flightId: formData.flightId,
  airline: flight?.airline || '',
  flightNumber: flight?.flightNumber || '',
  origin: flight?.origin || '',
  destination: flight?.destination || '',
  // ✅ CORRECT - camelCase
  departureDateFlight: flight?.departureDate || null,
  departureTimeFlight: flight?.departureTime || null,
  arrivalDateFlight: flight?.arrivalDate || null,
  arrivalTimeFlight: flight?.arrivalTime || null,
  durationFlight: flight?.duration || '',
  passengers: formData.passengers || 1,
  seatClass: formData.seatClass || 'economy',  // ✅ camelCase
  economy_price: flight?.economyPrice || 0,  // This one can stay as is
  business_price: flight?.businessPrice || 0,
  first_class_price: flight?.firstClassPrice || 0,
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

    // ✅ UPDATE THESE LOGS TO USE CAMELCASE
console.log('📤 ========================================');
console.log('📤 SENDING BOOKING DATA TO BACKEND:');
console.log('📤 ========================================');
console.log('  - customerName:', newBooking.customerName);
console.log('  - flightId:', newBooking.flightId);
console.log('  - airline:', newBooking.airline);
console.log('  - flightNumber:', newBooking.flightNumber);
console.log('  - origin:', newBooking.origin);
console.log('  - destination:', newBooking.destination);
console.log('  - departureDateFlight:', newBooking.departureDateFlight);  // ✅ CAMELCASE
console.log('  - departureTimeFlight:', newBooking.departureTimeFlight);  // ✅ CAMELCASE
console.log('  - arrivalDateFlight:', newBooking.arrivalDateFlight);      // ✅ CAMELCASE
console.log('  - arrivalTimeFlight:', newBooking.arrivalTimeFlight);      // ✅ CAMELCASE
console.log('  - durationFlight:', newBooking.durationFlight);            // ✅ CAMELCASE
console.log('  - passengers:', newBooking.passengers);
console.log('  - seatClass:', newBooking.seatClass);                      // ✅ CAMELCASE
console.log('  - totalPrice:', newBooking.totalPrice);
console.log('  - paymentMethod:', newBooking.paymentMethod);
console.log('  - paymentStatus:', newBooking.paymentStatus);
console.log('  - tenantId:', newBooking.tenantId);
console.log('📤 FULL REQUEST BODY:', JSON.stringify(newBooking, null, 2));
console.log('📤 ========================================');
    
    const response = await bookingService.create(newBooking);
    console.log('📥 CREATE RESPONSE:', response);
    
    // ✅ LOG WHAT CAME BACK FROM BACKEND
    if (response?.success && response?.data) {
      console.log('✅ ========================================');
      console.log('✅ BOOKING CREATED SUCCESSFULLY!');
      console.log('✅ CHECK THESE FIELDS FROM BACKEND:');
      console.log('✅ ========================================');
      console.log('  - id:', response.data.id);
      console.log('  - customerName:', response.data.customerName);
      console.log('  - airline:', response.data.airline);
      console.log('  - flightNumber:', response.data.flightNumber);
      console.log('  - departure_date_flight:', response.data.departure_date_flight);
      console.log('  - departure_time_flight:', response.data.departure_time_flight);
      console.log('  - arrival_date_flight:', response.data.arrival_date_flight);
      console.log('  - arrival_time_flight:', response.data.arrival_time_flight);
      console.log('  - duration_flight:', response.data.duration_flight);
      console.log('  - seat_class:', response.data.seat_class);
      console.log('  - totalPrice:', response.data.totalPrice);
      console.log('✅ ========================================');
      
      // ✅ Also log if fields are null or undefined
      const dateFields = ['departure_date_flight', 'departure_time_flight', 'arrival_date_flight', 'arrival_time_flight', 'duration_flight'];
      dateFields.forEach(field => {
        if (response.data[field] === null || response.data[field] === undefined) {
          console.warn(`⚠️ Field "${field}" is NULL or UNDEFINED in response!`);
        } else {
          console.log(`✅ Field "${field}" has value:`, response.data[field]);
        }
      });
    }

    if (response?.success) {
      showNotification(`✅ Flight booking created successfully for ${newBooking.customerName}!`);
      setShowCreateModal(false);
      resetForm();
      loadData(tenantId);
    } else {
      showNotification('Failed to create booking: ' + (response?.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    console.error('❌ Error details:', error.message);
    if (error.response) {
      console.error('❌ Error response:', error.response);
    }
    showNotification('Failed to create booking. Please try again.', 'error');
  }

  setIsSubmitting(false);
};

const handleEditFlight = async () => {
  if (!editingBooking) return;

  if (!formData.customerName || !formData.flightId || !formData.passengers) {
    showNotification('Please fill in all required fields', 'error');
    return;
  }

  setIsSubmitting(true);

  try {
    const flight = getFlightDetails(formData.flightId);
    
    console.log('✈️ EDIT - Flight object:', flight);
    console.log('✈️ EDIT - departureDate:', flight?.departureDate);
    console.log('✈️ EDIT - departureTime:', flight?.departureTime);
    console.log('✈️ EDIT - arrivalDate:', flight?.arrivalDate);
    console.log('✈️ EDIT - arrivalTime:', flight?.arrivalTime);
    
    let pricePerPassenger = 0;
    switch (formData.seatClass) {
      case 'economy': pricePerPassenger = flight?.economyPrice || 0; break;
      case 'business': pricePerPassenger = flight?.businessPrice || 0; break;
      case 'first_class': pricePerPassenger = flight?.firstClassPrice || 0; break;
      default: pricePerPassenger = flight?.economyPrice || 0;
    }
    
    const totalPrice = parseFloat(formData.totalPrice) || (pricePerPassenger * (formData.passengers || 1));
    
    const updatedBooking = {
      customerName: formData.customerName,
      customerEmail: formData.customerEmail || '',
      customerPhone: formData.customerPhone || '',
      customerIdNumber: formData.customerIdNumber || '',
      serviceType: 'flight',
      isGuestBooking: false,
      flightId: formData.flightId,
      airline: flight?.airline || '',
      flightNumber: flight?.flightNumber || '',
      origin: flight?.origin || '',
      destination: flight?.destination || '',
      departureDateFlight: flight?.departureDate || null,   
      departureTimeFlight: flight?.departureTime || null,   
      arrivalDateFlight: flight?.arrivalDate || null,       
      arrivalTimeFlight: flight?.arrivalTime || null,       
      durationFlight: flight?.duration || '',               
      seatClass: formData.seatClass || 'economy',  
      economy_price: flight?.economyPrice || 0,
      business_price: flight?.businessPrice || 0,
      first_class_price: flight?.firstClassPrice || 0,
      totalPrice: totalPrice,
      paymentMethod: formData.paymentMethod,
      paymentStatus: formData.paymentStatus || 'PENDING',
      mpesaCode: formData.mpesaCode || '',
      paidAmount: parseFloat(formData.paidAmount) || 0,
      remainingBalance: totalPrice - (parseFloat(formData.paidAmount) || 0),
      notes: formData.notes || '',
      status: editingBooking.status || 'pending',
      tenantId: tenantId
    };

    console.log('✈️ EDIT - Sending update:', updatedBooking);
    const response = await bookingService.update(editingBooking.id, updatedBooking);
    console.log('✈️ EDIT - Response:', response);

    if (response?.success) {
      showNotification(`✅ Flight booking updated successfully!`);
      setShowEditModal(false);
      setEditingBooking(null);
      resetForm();
      loadData(tenantId);
    } else {
      showNotification('Failed to update booking: ' + (response?.message || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('❌ Error updating booking:', error);
    showNotification('Failed to update booking. Please try again.', 'error');
  }

  setIsSubmitting(false);
};

  // ✅ Record payment via API
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

  // ✅ Update booking status via API
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

  // ✅ Update payment status via API
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

  // ✅ Delete booking via API
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
      b.airline?.toLowerCase().includes(searchLower) ||
      b.flightNumber?.toLowerCase().includes(searchLower) ||
      b.origin?.toLowerCase().includes(searchLower) ||
      b.destination?.toLowerCase().includes(searchLower) ||
      b.customerEmail?.toLowerCase().includes(searchLower);
    
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    const matchesAirline = filterAirline === 'all' || b.airline === filterAirline;
    
    return matchesSearch && matchesStatus && matchesAirline;
  });

  // Stats
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = bookings.filter(b => b.status === 'completed' || b.status === 'checked_in').length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const totalDebt = bookings.reduce((sum, b) => sum + (b.remainingBalance || 0), 0);

  const statsCards = [
    { title: 'Total Bookings', value: totalBookings, icon: Plane, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Pending', value: pendingBookings, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { title: 'Confirmed', value: confirmedBookings, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Completed', value: completedBookings, icon: CheckCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Debt', value: formatCurrency(totalDebt), icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'checked_in', label: 'Checked In' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  // Get unique airlines for filter
  const airlines = [...new Set(bookings.map(b => b.airline).filter(Boolean))];

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
            <h2 className="text-2xl font-bold text-white">Create Flight Booking</h2>
            <p className="text-blue-100 text-sm">Add a new flight booking</p>
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
  <label className="block text-sm font-medium text-gray-700 mb-1">Flight *</label>
  <select
  value={formData.flightId}
  onChange={(e) => {
    const flight = getFlightDetails(e.target.value);
    setFormData({...formData, flightId: e.target.value});
    if (flight) {
      let pricePerPassenger = 0;
      switch (formData.seatClass) {
        case 'economy':
          pricePerPassenger = flight.economyPrice || 0;
          break;
        case 'business':
          pricePerPassenger = flight.businessPrice || 0;
          break;
        case 'first_class':
          pricePerPassenger = flight.firstClassPrice || 0;
          break;
        default:
          pricePerPassenger = flight.economyPrice || 0;
      }
      setFormData(prev => ({ 
        ...prev, 
        flightId: e.target.value,
        totalPrice: pricePerPassenger * (prev.passengers || 1)
      }));
    }
  }}
  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
>
  <option value="">Select a flight...</option>
  {flights.filter(f => f.status === 'active' || f.status === 'scheduled').map(flight => (
    <option key={flight.id} value={flight.id}>
      {flight.airline} {flight.flightNumber} - {flight.origin} → {flight.destination} 
      (💺 {formatCurrency(flight.economyPrice)} | 💼 {formatCurrency(flight.businessPrice)} | 👑 {formatCurrency(flight.firstClassPrice)})
    </option>
  ))}
</select>
</div>

              {formData.flightId && (() => {
  const flight = getFlightDetails(formData.flightId);
  if (!flight) return null;
  
  // Get price based on selected seat class
  let pricePerPassenger = 0;
  let seatLabel = 'Economy';
  switch (formData.seatClass) {
    case 'economy':
      pricePerPassenger = flight.economyPrice || 0;
      seatLabel = '💺 Economy';
      break;
    case 'business':
      pricePerPassenger = flight.businessPrice || 0;
      seatLabel = '💼 Business';
      break;
    case 'first_class':
      pricePerPassenger = flight.firstClassPrice || 0;
      seatLabel = '👑 First Class';
      break;
    default:
      pricePerPassenger = flight.economyPrice || 0;
      seatLabel = '💺 Economy';
  }
  
  const total = pricePerPassenger * (formData.passengers || 1);
  
  return (
    <div className="md:col-span-2 bg-blue-50 rounded-lg p-3">
      <p className="text-sm text-blue-700 font-semibold">
        ✈️ {flight.airline} {flight.flightNumber}
      </p>
      <p className="text-xs text-blue-600 mt-1">
        {flight.origin} → {flight.destination}
      </p>
      <p className="text-xs text-blue-600">
        📅 {formatDate(flight.departureDate)}
      </p>
      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-blue-200">
        <div>
          <span className="text-xs text-gray-500">Seat Class:</span>
          <p className="text-sm font-medium text-blue-800">{seatLabel}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Price per person:</span>
          <p className="text-sm font-medium text-blue-800">{formatCurrency(pricePerPassenger)}</p>
        </div>
        <div className="col-span-2">
          <span className="text-xs text-gray-500">Total ({formData.passengers || 1} passenger{formData.passengers > 1 ? 's' : ''}):</span>
          <p className="text-sm font-bold text-blue-800">{formatCurrency(total)}</p>
        </div>
      </div>
    </div>
  );
})()}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passengers *</label>
                <input
                  type="number"
                  value={formData.passengers}
                  onChange={(e) => setFormData({...formData, passengers: parseInt(e.target.value) || 1})}
                  min="1"
                  max="20"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seat Class</label>
                <select
  value={formData.seatClass}
  onChange={handleSeatClassChange}  // ✅ Use the new handler
  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
>
  <option value="economy">💺 Economy</option>
  <option value="business">💼 Business</option>
  <option value="first_class">👑 First Class</option>
</select>
              </div>

              <div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Total Price (KES)</label>
  <input
    type="number"
    value={formData.totalPrice}
    onChange={(e) => setFormData({...formData, totalPrice: e.target.value})}
    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
    placeholder="Auto-filled from flight"
    readOnly  // ✅ Make it read-only since it's auto-calculated
  />
</div>

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

  // Render Edit Modal
const renderEditModal = () => {
  if (!showEditModal || !editingBooking) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={() => setShowEditModal(false)}></div>
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <button 
          onClick={() => setShowEditModal(false)}
          className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
        >
          <X size={24} className="text-gray-500 hover:text-gray-700" />
        </button>

        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white">Edit Flight Booking</h2>
          <p className="text-blue-100 text-sm">Update flight booking details</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Flight *</label>
              <select
                value={formData.flightId}
                onChange={(e) => {
                  const flight = getFlightDetails(e.target.value);
                  setFormData({...formData, flightId: e.target.value});
                  if (flight) {
                    let pricePerPassenger = 0;
                    switch (formData.seatClass) {
                      case 'economy':
                        pricePerPassenger = flight.economyPrice || 0;
                        break;
                      case 'business':
                        pricePerPassenger = flight.businessPrice || 0;
                        break;
                      case 'first_class':
                        pricePerPassenger = flight.firstClassPrice || 0;
                        break;
                      default:
                        pricePerPassenger = flight.economyPrice || 0;
                    }
                    setFormData(prev => ({ 
                      ...prev, 
                      totalPrice: pricePerPassenger * (prev.passengers || 1)
                    }));
                  }
                }}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="">Select a flight...</option>
                {flights.filter(f => f.status === 'active' || f.status === 'scheduled').map(flight => (
                  <option key={flight.id} value={flight.id}>
                    {flight.airline} {flight.flightNumber} - {flight.origin} → {flight.destination} 
                    (💺 {formatCurrency(flight.economyPrice)} | 💼 {formatCurrency(flight.businessPrice)} | 👑 {formatCurrency(flight.firstClassPrice)})
                  </option>
                ))}
              </select>
            </div>

            {formData.flightId && (() => {
              const flight = getFlightDetails(formData.flightId);
              if (!flight) return null;
              
              let pricePerPassenger = 0;
              let seatLabel = 'Economy';
              switch (formData.seatClass) {
                case 'economy':
                  pricePerPassenger = flight.economyPrice || 0;
                  seatLabel = '💺 Economy';
                  break;
                case 'business':
                  pricePerPassenger = flight.businessPrice || 0;
                  seatLabel = '💼 Business';
                  break;
                case 'first_class':
                  pricePerPassenger = flight.firstClassPrice || 0;
                  seatLabel = '👑 First Class';
                  break;
                default:
                  pricePerPassenger = flight.economyPrice || 0;
                  seatLabel = '💺 Economy';
              }
              
              const total = pricePerPassenger * (formData.passengers || 1);
              
              return (
                <div className="md:col-span-2 bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-700 font-semibold">
                    ✈️ {flight.airline} {flight.flightNumber}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {flight.origin} → {flight.destination}
                  </p>
                  <p className="text-xs text-blue-600">
                    📅 {formatDate(flight.departureDate)}
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-blue-200">
                    <div>
                      <span className="text-xs text-gray-500">Seat Class:</span>
                      <p className="text-sm font-medium text-blue-800">{seatLabel}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Price per person:</span>
                      <p className="text-sm font-medium text-blue-800">{formatCurrency(pricePerPassenger)}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500">Total ({formData.passengers || 1} passenger{formData.passengers > 1 ? 's' : ''}):</span>
                      <p className="text-sm font-bold text-blue-800">{formatCurrency(total)}</p>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Passengers *</label>
              <input
                type="number"
                value={formData.passengers}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setFormData({...formData, passengers: val});
                  const flight = getFlightDetails(formData.flightId);
                  if (flight) {
                    let pricePerPassenger = 0;
                    switch (formData.seatClass) {
                      case 'economy': pricePerPassenger = flight.economyPrice || 0; break;
                      case 'business': pricePerPassenger = flight.businessPrice || 0; break;
                      case 'first_class': pricePerPassenger = flight.firstClassPrice || 0; break;
                      default: pricePerPassenger = flight.economyPrice || 0;
                    }
                    setFormData(prev => ({...prev, totalPrice: pricePerPassenger * val}));
                  }
                }}
                min="1"
                max="20"
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seat Class</label>
              <select
                value={formData.seatClass}
                onChange={(e) => {
                  const seatClass = e.target.value;
                  const flight = getFlightDetails(formData.flightId);
                  let pricePerPassenger = 0;
                  switch (seatClass) {
                    case 'economy': pricePerPassenger = flight?.economyPrice || 0; break;
                    case 'business': pricePerPassenger = flight?.businessPrice || 0; break;
                    case 'first_class': pricePerPassenger = flight?.firstClassPrice || 0; break;
                    default: pricePerPassenger = flight?.economyPrice || 0;
                  }
                  setFormData(prev => ({ 
                    ...prev, 
                    seatClass: seatClass,
                    totalPrice: pricePerPassenger * (prev.passengers || 1)
                  }));
                }}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                <option value="economy">💺 Economy</option>
                <option value="business">💼 Business</option>
                <option value="first_class">👑 First Class</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Price (KES)</label>
              <input
                type="number"
                value={formData.totalPrice}
                onChange={(e) => setFormData({...formData, totalPrice: e.target.value})}
                className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50"
                readOnly
              />
            </div>

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
              onClick={handleEditFlight}
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Save size={18} /> Update Booking
            </button>
            <button 
              onClick={() => setShowEditModal(false)}
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
              {['confirmed', 'checked_in', 'completed', 'cancelled'].map(status => (
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

  // Render Detail Modal
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedBooking) return null;

    const statusBadge = getStatusBadge(selectedBooking.status);
    const paymentBadge = getPaymentStatusBadge(selectedBooking.paymentStatus);

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

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-white">Flight Booking Details</h2>
            <p className="text-blue-100 text-sm">#{selectedBooking.id?.slice(0, 10)}...</p>
          </div>

          <div className="p-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer</h3>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                <div><span className="text-xs text-gray-500">Name:</span> <span className="text-sm font-medium">{selectedBooking.customerName}</span></div>
                <div><span className="text-xs text-gray-500">Email:</span> <span className="text-sm font-medium">{selectedBooking.customerEmail || 'N/A'}</span></div>
                <div><span className="text-xs text-gray-500">Phone:</span> <span className="text-sm font-medium">{selectedBooking.customerPhone || 'N/A'}</span></div>
                <div><span className="text-xs text-gray-500">ID Number:</span> <span className="text-sm font-medium">{selectedBooking.customerIdNumber || 'N/A'}</span></div>
                <div><span className="text-xs text-gray-500">Passengers:</span> <span className="text-sm font-medium">{selectedBooking.passengers || 1}</span></div>
                <div><span className="text-xs text-gray-500">Seat Class:</span> <span className="text-sm font-medium">{getSeatClassLabel(selectedBooking.seatClass)}</span></div>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Flight Details</h3>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
  <div className="col-span-2"><span className="text-xs text-gray-500">Airline:</span> <span className="text-sm font-medium">{selectedBooking.airline} {selectedBooking.flightNumber}</span></div>
  <div><span className="text-xs text-gray-500">Origin:</span> <span className="text-sm font-medium">{selectedBooking.origin}</span></div>
  <div><span className="text-xs text-gray-500">Destination:</span> <span className="text-sm font-medium">{selectedBooking.destination}</span></div>
  <div><span className="text-xs text-gray-500">Departure:</span> <span className="text-sm font-medium">{formatDate(selectedBooking.departureDateFlight)} {selectedBooking.departureTimeFlight || ''}</span></div>
  <div><span className="text-xs text-gray-500">Arrival:</span> <span className="text-sm font-medium">{formatDate(selectedBooking.arrivalDateFlight)} {selectedBooking.arrivalTimeFlight || ''}</span></div>
  <div><span className="text-xs text-gray-500">Duration:</span> <span className="text-sm font-medium">{selectedBooking.durationFlight || 'N/A'}</span></div>
</div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment</h3>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                <div><span className="text-xs text-gray-500">Total:</span> <span className="text-sm font-medium text-green-600">{formatCurrency(selectedBooking.totalPrice)}</span></div>
                <div><span className="text-xs text-gray-500">Paid:</span> <span className="text-sm font-medium text-green-600">{formatCurrency(selectedBooking.paidAmount || 0)}</span></div>
                <div><span className="text-xs text-gray-500">Remaining:</span> <span className={`text-sm font-medium ${selectedBooking.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(selectedBooking.remainingBalance)}</span></div>
                <div><span className="text-xs text-gray-500">Status:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${paymentBadge.color}`}>{paymentBadge.label}</span></div>
                <div><span className="text-xs text-gray-500">Method:</span> <span className="text-sm font-medium">{selectedBooking.paymentMethod || 'N/A'}</span></div>
                {selectedBooking.mpesaCode && (
                  <div><span className="text-xs text-gray-500">M-Pesa Code:</span> <span className="text-sm font-medium">{selectedBooking.mpesaCode}</span></div>
                )}
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="mt-4">
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
      {renderEditModal()}
      {renderStatusModal()}
      {renderDeleteModal()}
      {renderDetailModal()}

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
                  <span className="text-gray-600">Flight:</span>
                  <span className="font-medium">{selectedBooking.airline} {selectedBooking.flightNumber}</span>
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Plane size={28} className="text-blue-600" />
            Flight Bookings
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage flight reservations and payments</p>
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
            placeholder="Search by customer, airline, or destination..."
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
          {airlines.length > 0 && (
            <select
              value={filterAirline}
              onChange={(e) => setFilterAirline(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Airlines</option>
              {airlines.map(airline => (
                <option key={airline} value={airline}>{airline}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Bookings List */}
{loading ? (
  <div className="text-center py-12 text-gray-400">Loading...</div>
) : filteredBookings.length === 0 ? (
  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
    <Plane size={48} className="mx-auto text-gray-300 mb-3" />
    <p className="text-gray-500">No flight bookings found</p>
    <p className="text-sm text-gray-400">
      {searchQuery || filterStatus !== 'all' || filterAirline !== 'all' 
        ? 'Try adjusting your search or filters' 
        : 'Create your first flight booking by clicking "New Booking"'}
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
  <div className="space-y-2 sm:space-y-3">
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
          <div className="p-3 sm:p-4">
            {/* Header - Customer Name and Flight */}
            <div className="flex items-start justify-between gap-1 sm:gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  booking.status === 'confirmed' ? 'bg-blue-500' :
                  booking.status === 'checked_in' ? 'bg-green-500' :
                  booking.status === 'completed' ? 'bg-purple-500' :
                  booking.status === 'pending' ? 'bg-yellow-500' :
                  booking.status === 'cancelled' ? 'bg-red-500' : 'bg-gray-400'
                }`}></div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate text-sm sm:text-base">{booking.customerName || 'Customer'}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                    {booking.airline || 'Flight'} {booking.flightNumber || ''}
                    {booking.destination && ` • ${booking.destination}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                <span className={`text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
                <span className={`text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full ${paymentBadge.color}`}>
                  {paymentBadge.label}
                </span>
              </div>
            </div>

            {/* Flight Details Row - Compact */}
<div className="grid grid-cols-2 gap-1 mt-1.5 text-[10px] sm:text-xs text-gray-500">
  <div>
    <span className="font-medium text-gray-600">Origin:</span>
    <span className="font-medium text-gray-700 ml-0.5">{booking.origin || 'N/A'}</span>
  </div>
  <div>
    <span className="font-medium text-gray-600">Destination:</span>
    <span className="font-medium text-gray-700 ml-0.5">{booking.destination || 'N/A'}</span>
  </div>
  <div>
    <span className="font-medium text-gray-600">Departure:</span>
    <span className="font-medium text-gray-700 ml-0.5">{formatDate(booking.departureDateFlight)}</span>
  </div>
  <div>
    <span className="font-medium text-gray-600">Passengers:</span>
    <span className="font-medium text-gray-700 ml-0.5">{booking.passengers || 1}</span>
  </div>
  <div>
    <span className="font-medium text-gray-600">Seat:</span>
    <span className="font-medium text-gray-700 ml-0.5">{getSeatClassLabel(booking.seatClass)}</span>
  </div>
  <div>
    <span className="font-medium text-gray-600">Flight:</span>
    <span className="font-medium text-gray-700 ml-0.5">{booking.flightNumber || 'N/A'}</span>
  </div>
</div>

            {/* Payment & Debt Badges */}
            <div className="flex flex-wrap items-center gap-1 mt-1">
              <span className="text-[10px] sm:text-xs font-bold text-green-600">
                {formatCurrency(booking.totalPrice)}
              </span>
              {hasDebt && (
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
                  <AlertCircle size={10} /> Debt: {formatCurrency(booking.remainingBalance)}
                </span>
              )}
              {booking.mpesaCode && (
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-mono">
                  {booking.mpesaCode}
                </span>
              )}
            </div>

            {/* Action Buttons - Compact */}
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => toggleExpand(booking.id)}
                className="px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-0.5"
              >
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {isExpanded ? 'Less' : 'More'}
              </button>
              <button
                onClick={() => {
                  setSelectedBooking(booking);
                  setShowDetailModal(true);
                }}
                className="flex-1 px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-0.5"
              >
                <Eye size={12} /> View
              </button>
<button
  onClick={() => openEditModal(booking)}  // ✅ Change this
  className="flex-1 px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-0.5"
>
  <Edit2 size={12} /> Edit
</button>
              {hasDebt && (
                <button
                  onClick={() => {
                    setSelectedBooking(booking);
                    setPaymentForm({ amount: '', paymentMethod: 'CASH', mpesaCode: '', notes: '' });
                    setShowPaymentModal(true);
                  }}
                  className="px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-0.5"
                >
                  <CreditCard size={12} /> Pay
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedBooking(booking);
                  setShowDeleteModal(true);
                }}
                className="px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-0.5"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="px-3 sm:px-4 pb-3 sm:pb-4 pt-0 border-t border-gray-100 bg-gray-50">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 sm:gap-2 pt-2 text-[10px] sm:text-xs">
                <div><span className="font-medium text-gray-600">Email:</span> {booking.customerEmail || 'N/A'}</div>
                <div><span className="font-medium text-gray-600">Phone:</span> {booking.customerPhone || 'N/A'}</div>
                <div><span className="font-medium text-gray-600">ID:</span> {booking.customerIdNumber || 'N/A'}</div>
                <div><span className="font-medium text-gray-600">Origin:</span> {booking.origin || 'N/A'}</div>
                <div><span className="font-medium text-gray-600">Destination:</span> {booking.destination || 'N/A'}</div>
                <div><span className="font-medium text-gray-600">Arrival:</span> {formatDate(booking.arrivalDate)}</div>
                <div><span className="font-medium text-gray-600">Duration:</span> {booking.duration || 'N/A'}</div>
                <div><span className="font-medium text-gray-600">Method:</span> {booking.paymentMethod || 'N/A'}</div>
                <div><span className="font-medium text-gray-600">Paid:</span> <span className="text-green-600">{formatCurrency(booking.paidAmount || 0)}</span></div>
                {booking.notes && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="font-medium text-gray-600">Notes:</span>
                    <p className="text-gray-500 mt-0.5">{booking.notes}</p>
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

export default FlightBookings;