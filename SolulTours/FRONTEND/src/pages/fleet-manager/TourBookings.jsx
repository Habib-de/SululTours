import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Filter, RefreshCw, 
  Eye, CheckCircle, XCircle, Clock, 
  AlertCircle, User, Compass, DollarSign,
  Phone, Mail, Edit2, Trash2, Plus,
  X, Save, CreditCard, Wallet, Building,
  Users, MapPin, Star, TrendingUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingService, tourPackageService } from '../../services/api';

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

// Helper to format date safely
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

// Helper to generate booking reference
const generateReference = () => {
  return 'BK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
};

const TourBookings = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [packages, setPackages] = useState([]);
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

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    mpesaCode: '',
    notes: ''
  });

  // Form state for creating booking
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerIdNumber: '',
    tourPackageId: '',
    startDate: '',
    endDate: '',
    passengers: 1,
    notes: '',
    totalPrice: '',
    paymentMethod: 'CASH',
    paymentStatus: 'PENDING',
    mpesaCode: '',
    paidAmount: 0,
    remainingBalance: 0
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
      console.log('🔍 Loading tour bookings with tenantId:', tenantToUse);
      
      if (!tenantToUse) {
        console.warn('⚠️ No tenantId available, skipping API call');
        setLoading(false);
        return;
      }
      
      // ✅ 1. Load tour packages
      const packagesResponse = await tourPackageService.getAll(tenantToUse);
      console.log('📊 Tour packages response:', packagesResponse);
      let packagesData = [];
      if (packagesResponse?.success && packagesResponse?.data) {
        packagesData = packagesResponse.data;
      } else if (Array.isArray(packagesResponse)) {
        packagesData = packagesResponse;
      }
      
      // Parse JSON fields
      const parsedPackages = packagesData.map(pkg => ({
        ...pkg,
        inclusions: pkg.inclusions ? (typeof pkg.inclusions === 'string' ? JSON.parse(pkg.inclusions) : pkg.inclusions) : [],
        exclusions: pkg.exclusions ? (typeof pkg.exclusions === 'string' ? JSON.parse(pkg.exclusions) : pkg.exclusions) : [],
        highlights: pkg.highlights ? (typeof pkg.highlights === 'string' ? JSON.parse(pkg.highlights) : pkg.highlights) : [],
        departureDates: pkg.departureDates ? (typeof pkg.departureDates === 'string' ? JSON.parse(pkg.departureDates) : pkg.departureDates) : [],
        images: pkg.images || null
      }));
      setPackages(parsedPackages);

      // ✅ 2. Load ALL bookings and filter for tour bookings
      const bookingsResponse = await bookingService.getAll(tenantToUse);
      console.log('📊 Bookings response:', bookingsResponse);
      
      let allBookings = [];
      if (bookingsResponse?.success && bookingsResponse?.data) {
        allBookings = bookingsResponse.data;
      } else if (Array.isArray(bookingsResponse)) {
        allBookings = bookingsResponse;
      }
      
      // ✅ Filter only tour bookings
      const tourBookings = allBookings.filter(b => 
        b.serviceType === 'tour' || 
        b.serviceType === 'tour_package' ||
        b.serviceType === 'Tour'
      );
      
      console.log(`📊 Loaded ${tourBookings.length} tour bookings`);
      setBookings(tourBookings);
      
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Error loading bookings', 'error');
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  // ✅ Fallback to localStorage
  const loadFromLocalStorage = () => {
    console.warn('Loading tour bookings from localStorage (fallback)');
    try {
      const storedPackages = JSON.parse(localStorage.getItem('travel_agency_tour_packages') || '[]');
      setPackages(storedPackages);
      
      const storedTourBookings = JSON.parse(localStorage.getItem('travel_agency_tour_bookings') || '[]');
      const storedAllBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      const guestTourBookings = storedAllBookings.filter(b => b.serviceType === 'tour' || b.serviceType === 'tour_package');
      
      const bookingMap = new Map();
      storedTourBookings.forEach(b => bookingMap.set(b.id, b));
      guestTourBookings.forEach(b => bookingMap.set(b.id, b));
      
      setBookings(Array.from(bookingMap.values()));
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setBookings([]);
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerIdNumber: '',
      tourPackageId: '',
      startDate: '',
      endDate: '',
      passengers: 1,
      notes: '',
      totalPrice: '',
      paymentMethod: 'CASH',
      paymentStatus: 'PENDING',
      mpesaCode: '',
      paidAmount: 0,
      remainingBalance: 0
    });
  };

  const getPackageDetails = (packageId) => {
    return packages.find(p => p.id === packageId);
  };

  const handlePackageSelect = (packageId) => {
    const pkg = getPackageDetails(packageId);
    if (pkg) {
      let startDate = '';
      let endDate = '';
      let totalPrice = pkg.price || 0;
      
      if (pkg.departureDates && pkg.departureDates.length > 0) {
        const firstDeparture = pkg.departureDates[0];
        startDate = firstDeparture;
        
        const daysMatch = pkg.duration?.match(/(\d+)\s*Days?/i);
        const nightsMatch = pkg.duration?.match(/(\d+)\s*Nights?/i);
        
        let daysToAdd = 0;
        if (daysMatch) {
          daysToAdd = parseInt(daysMatch[1]);
        } else if (nightsMatch) {
          daysToAdd = parseInt(nightsMatch[1]) + 1;
        } else {
          const anyNumber = pkg.duration?.match(/(\d+)/);
          if (anyNumber) {
            daysToAdd = parseInt(anyNumber[1]);
          } else {
            daysToAdd = 3;
          }
        }
        
        const start = new Date(firstDeparture);
        if (!isNaN(start.getTime())) {
          const end = new Date(start);
          end.setDate(end.getDate() + daysToAdd);
          endDate = end.toISOString().split('T')[0];
        }
      }
      
      setFormData(prev => ({ 
        ...prev, 
        tourPackageId: packageId,
        totalPrice: totalPrice,
        startDate: startDate,
        endDate: endDate
      }));
    }
  };

  const handleCreateBooking = async () => {
    if (!formData.customerName || !formData.tourPackageId || !formData.startDate) {
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
      const pkg = getPackageDetails(formData.tourPackageId);
      const totalPrice = parseFloat(formData.totalPrice) || pkg?.price || 0;
      
      const startDateISO = formData.startDate ? new Date(formData.startDate).toISOString() : null;
      const endDateISO = formData.endDate ? new Date(formData.endDate).toISOString() : null;
      
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
        reference: generateReference(),
        customerName: formData.customerName,
        customerEmail: formData.customerEmail || '',
        customerPhone: formData.customerPhone || '',
        customerIdNumber: formData.customerIdNumber || '',
        tourPackageId: formData.tourPackageId,
        packageName: pkg?.name || '',
        packageDestination: pkg?.destination || '',
        packageType: pkg?.category || '',
        packageDuration: pkg?.duration || '',
        packageCategory: pkg?.category || '',
        startDate: startDateISO,
        endDate: endDateISO,
        passengers: parseInt(formData.passengers) || 1,
        totalPrice: totalPrice,
        paymentMethod: formData.paymentMethod,
        paymentStatus: paymentStatus,
        mpesaCode: formData.mpesaCode || '',
        paidAmount: paidAmount,
        remainingBalance: remainingBalance,
        notes: formData.notes || '',
        status: 'pending',
        serviceType: 'tour_package',
        isGuestBooking: false,
        tenantId: tenantId,
        departureDate: startDateISO,
        createdAt: new Date().toISOString()
      };

      console.log('📤 Creating tour booking:', newBooking);
      const response = await bookingService.create(newBooking);
      console.log('📥 Create booking response:', response);

      if (response?.success) {
        showNotification(`✅ Tour booking created successfully for ${newBooking.customerName}!`);
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

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      showNotification('Please enter a valid payment amount', 'error');
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (amount > selectedBooking.remainingBalance) {
      showNotification(`Amount exceeds remaining balance of KES ${selectedBooking.remainingBalance}`, 'error');
      return;
    }

    if (paymentForm.paymentMethod === 'M_PESA') {
      if (!paymentForm.mpesaCode || paymentForm.mpesaCode.length < 6) {
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
        mpesaCode: paymentForm.mpesaCode || selectedBooking.mpesaCode,
        updatedAt: new Date().toISOString()
      };

      console.log(`📤 Updating booking ${selectedBooking.id} with payment:`, updatedBooking);
      const response = await bookingService.update(selectedBooking.id, updatedBooking);
      console.log('📥 Update booking response:', response);

      if (response?.success) {
        showNotification(`✅ Payment of KES ${amount} recorded successfully!`);
        setShowPaymentModal(false);
        setPaymentForm({ amount: '', paymentMethod: 'CASH', mpesaCode: '', notes: '' });
        loadData(tenantId);
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
        loadData(tenantId);
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
        paymentStatus: newPaymentStatus,
        updatedAt: new Date().toISOString()
      };

      console.log(`📤 Updating booking ${bookingId} payment status to ${newPaymentStatus}`);
      const response = await bookingService.update(bookingId, updatedBooking);
      console.log('📥 Update payment status response:', response);

      if (response?.success) {
        showNotification(`✅ Payment status updated to ${newPaymentStatus}!`);
        loadData(tenantId);
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

    setIsSubmitting(false);
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

  const getStatusDot = (status) => {
    const dotMap = {
      pending: 'bg-yellow-500',
      confirmed: 'bg-blue-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-500'
    };
    return dotMap[status] || 'bg-gray-400';
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

  const statusOptions = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

  const filteredBookings = bookings.filter(b => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      b.customerName?.toLowerCase().includes(searchLower) ||
      b.packageName?.toLowerCase().includes(searchLower) ||
      b.packageDestination?.toLowerCase().includes(searchLower) ||
      b.customerEmail?.toLowerCase().includes(searchLower) ||
      b.customerPhone?.toLowerCase().includes(searchLower);
    
    const matchesFilter = filterStatus === 'all' || b.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
  const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const totalCreditOutstanding = bookings
    .filter(b => b.remainingBalance > 0)
    .reduce((sum, b) => sum + (b.remainingBalance || 0), 0);

  // ============================================
  // RENDER CREATE MODAL
  // ============================================
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

          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-white">Create Tour Booking</h2>
            <p className="text-green-100 text-sm">Add a new tour booking</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Tour Package *</label>
                <select
                  value={formData.tourPackageId}
                  onChange={(e) => handlePackageSelect(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Select a tour package...</option>
                  {packages.filter(p => p.status === 'active').map(pkg => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {pkg.destination} (KSh {pkg.price?.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Package Details */}
              {formData.tourPackageId && (
                <div className="md:col-span-2 bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    📦 {getPackageDetails(formData.tourPackageId)?.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    📍 {getPackageDetails(formData.tourPackageId)?.destination} • 
                    🕐 {getPackageDetails(formData.tourPackageId)?.duration} • 
                    👥 Max {getPackageDetails(formData.tourPackageId)?.maxGroupSize || 10} people
                  </p>
                  <p className="text-sm font-semibold text-blue-800 mt-1">
                    💰 Price: KSh {(getPackageDetails(formData.tourPackageId)?.price || 0).toLocaleString()}
                  </p>
                  {getPackageDetails(formData.tourPackageId)?.departureDates?.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-blue-600 font-medium">📅 Available Departure Dates:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {getPackageDetails(formData.tourPackageId)?.departureDates.map((date, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 bg-blue-200 text-blue-800 rounded-full">
                            {formatDateSafe(date)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Show Start/End Dates */}
                  <div className="grid grid-cols-2 gap-4 mt-2 pt-2 border-t border-blue-200">
                    <div>
                      <span className="text-xs text-gray-500">📅 Start Date</span>
                      <p className="text-sm font-medium text-gray-700">{formatDateSafe(formData.startDate) || 'Not set'}</p>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">📅 End Date</span>
                      <p className="text-sm font-medium text-gray-700">{formatDateSafe(formData.endDate) || 'Not set'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Total Price (KES)</label>
                <input
                  type="number"
                  value={formData.totalPrice}
                  onChange={(e) => setFormData({...formData, totalPrice: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Auto-filled from package"
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
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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

  // ============================================
  // RENDER DETAIL MODAL
  // ============================================
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedBooking) return null;

    const statusBadge = getStatusBadge(selectedBooking.status);
    const paymentStatusBadge = getPaymentStatusBadge(selectedBooking.paymentStatus);

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

          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-white">Tour Booking Details</h2>
            <p className="text-purple-100 text-sm">ID: {selectedBooking.id?.slice(0, 10)}...</p>
          </div>

          <div className="p-6">
            {/* Customer Info */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer Information</h3>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                <div><span className="text-xs text-gray-500">Name:</span> <span className="text-sm font-medium">{selectedBooking.customerName}</span></div>
                <div><span className="text-xs text-gray-500">Email:</span> <span className="text-sm font-medium">{selectedBooking.customerEmail || 'N/A'}</span></div>
                <div><span className="text-xs text-gray-500">Phone:</span> <span className="text-sm font-medium">{selectedBooking.customerPhone || 'N/A'}</span></div>
                <div><span className="text-xs text-gray-500">ID Number:</span> <span className="text-sm font-medium">{selectedBooking.customerIdNumber || 'N/A'}</span></div>
                <div><span className="text-xs text-gray-500">Status:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${statusBadge.color}`}>{statusBadge.label}</span></div>
                <div><span className="text-xs text-gray-500">Payment:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${paymentStatusBadge.color}`}>{paymentStatusBadge.label}</span></div>
              </div>
            </div>

            {/* Package Info */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Tour Package</h3>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                <div className="col-span-2"><span className="text-xs text-gray-500">Package:</span> <span className="text-sm font-medium">{selectedBooking.packageName}</span></div>
                <div className="col-span-2"><span className="text-xs text-gray-500">Destination:</span> <span className="text-sm font-medium">{selectedBooking.packageDestination}</span></div>
                <div><span className="text-xs text-gray-500">Category:</span> <span className="text-sm font-medium">{getCategoryIcon(selectedBooking.packageCategory)} {selectedBooking.packageCategory}</span></div>
                <div><span className="text-xs text-gray-500">Passengers:</span> <span className="text-sm font-medium">{selectedBooking.passengers}</span></div>
                <div><span className="text-xs text-gray-500">Start Date:</span> <span className="text-sm font-medium">{formatDateTime(selectedBooking.startDate)}</span></div>
                <div><span className="text-xs text-gray-500">End Date:</span> <span className="text-sm font-medium">{selectedBooking.endDate ? formatDateTime(selectedBooking.endDate) : 'N/A'}</span></div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment Information</h3>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                <div><span className="text-xs text-gray-500">Method:</span> <span className="text-sm font-medium flex items-center gap-1">{getPaymentMethodIcon(selectedBooking.paymentMethod)} {selectedBooking.paymentMethod || 'N/A'}</span></div>
                <div><span className="text-xs text-gray-500">Total Amount:</span> <span className="text-sm font-medium">KES {(selectedBooking.totalPrice || 0).toLocaleString()}</span></div>
                <div><span className="text-xs text-gray-500">Amount Paid:</span> <span className="text-sm font-medium text-green-600">KES {(selectedBooking.paidAmount || 0).toLocaleString()}</span></div>
                {selectedBooking.remainingBalance > 0 && (
                  <div><span className="text-xs text-gray-500">Remaining Balance:</span> <span className="text-sm font-bold text-orange-600">KES {(selectedBooking.remainingBalance || 0).toLocaleString()}</span></div>
                )}
                {selectedBooking.mpesaCode && (
                  <div className="col-span-2"><span className="text-xs text-gray-500">M-Pesa Code:</span> <span className="text-sm font-mono font-medium text-blue-600">{selectedBooking.mpesaCode}</span></div>
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

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2 flex-wrap">
            {selectedBooking.remainingBalance > 0 && (
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setShowPaymentModal(true);
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm flex items-center gap-2"
              >
                <CreditCard size={16} /> Record Payment
              </button>
            )}
            <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
              Close
            </button>
            <button
              onClick={() => {
                setShowDetailModal(false);
                setShowStatusModal(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              Update Status
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER STATUS MODAL
  // ============================================
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
    );
  };

  // ============================================
  // RENDER PAYMENT MODAL
  // ============================================
  const renderPaymentModal = () => {
    if (!showPaymentModal || !selectedBooking) return null;

    return (
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
                <span className="text-gray-600">Total Price:</span>
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
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
            >
              <Save size={16} /> {isSubmitting ? 'Processing...' : 'Record Payment'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER DELETE MODAL
  // ============================================
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
                onClick={handleDeleteBooking}
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
      {renderDetailModal()}
      {renderStatusModal()}
      {renderPaymentModal()}
      {renderDeleteModal()}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Compass size={28} className="text-blue-600" />
            Tour Bookings
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage all tour and travel bookings</p>
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
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      {bookings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
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
            <p className="text-xs text-gray-400">💰 Revenue</p>
            <p className="text-xl font-bold text-purple-600">KSh {totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">💳 Credit O/S</p>
            <p className="text-xl font-bold text-red-600">KSh {totalCreditOutstanding.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by customer or tour package..."
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

      {/* Bookings List */}
{loading ? (
  <div className="text-center py-12 text-gray-400">Loading bookings...</div>
) : filteredBookings.length === 0 ? (
  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
    <Compass size={48} className="mx-auto text-gray-300 mb-3" />
    <p className="text-gray-500">
      {searchQuery || filterStatus !== 'all' ? 'No bookings match your search' : 'No tour bookings found'}
    </p>
    <p className="text-sm text-gray-400">
      {searchQuery || filterStatus !== 'all' ? 'Try adjusting your search or filter' : 'Create your first booking by clicking "New Booking"'}
    </p>
    <button
      onClick={() => setShowCreateModal(true)}
      className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
    >
      <Plus size={16} className="inline mr-1" /> New Booking
    </button>
  </div>
) : (
  <div className="space-y-2 sm:space-y-3">
    {filteredBookings.map((booking) => {
      const statusBadge = getStatusBadge(booking.status);
      const StatusIcon = statusBadge.icon;
      const paymentStatusBadge = getPaymentStatusBadge(booking.paymentStatus);
      const hasRemainingBalance = (booking.remainingBalance || 0) > 0;

      return (
        <div 
          key={booking.id}
          className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
          <div className="p-3 sm:p-4">
            {/* Header - Customer and Status */}
            <div className="flex items-start justify-between gap-1 sm:gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(booking.status)}`}></div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate text-sm sm:text-base">{booking.customerName || 'Customer'}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                    {booking.packageName || 'Tour Package'} • {booking.packageDestination || ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                <span className={`text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full ${statusBadge.color} flex items-center gap-0.5`}>
                  <StatusIcon size={10} /> {statusBadge.label}
                </span>
                <span className={`text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full ${paymentStatusBadge.color} flex items-center gap-0.5`}>
                  {getPaymentMethodIcon(booking.paymentMethod)} {paymentStatusBadge.label}
                </span>
              </div>
            </div>

            {/* Details Row - Compact */}
            <div className="grid grid-cols-2 gap-1 mt-1.5 text-[10px] sm:text-xs text-gray-500">
              <div>
                <span className="font-medium text-gray-600">Start:</span>
                <span className="font-medium text-gray-700 ml-0.5">{formatDateTime(booking.startDate)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Passengers:</span>
                <span className="font-medium text-gray-700 ml-0.5">{booking.passengers || 1}</span>
              </div>
              <div className="col-span-2">
                <span className="font-medium text-gray-600">Package:</span>
                <span className="font-medium text-gray-700 ml-0.5 truncate">{booking.packageName || 'N/A'}</span>
              </div>
            </div>

            {/* Payment/Status Badges Row */}
            <div className="flex flex-wrap items-center gap-1 mt-1">
              <span className="text-[10px] sm:text-xs font-medium text-green-600">
                KSh {(booking.totalPrice || 0).toLocaleString()}
              </span>
              {hasRemainingBalance && (
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 flex items-center gap-0.5">
                  <AlertCircle size={10} /> Balance: KSh {booking.remainingBalance.toLocaleString()}
                </span>
              )}
              {booking.mpesaCode && (
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-mono">
                  {booking.mpesaCode}
                </span>
              )}
            </div>

            {/* Extra details in one row */}
            <div className="flex flex-wrap gap-1 mt-1 text-[9px] sm:text-[10px] text-gray-500">
              {booking.customerEmail && (
                <span><span className="font-medium text-gray-600">Email:</span> {booking.customerEmail}</span>
              )}
              {booking.customerPhone && (
                <span><span className="font-medium text-gray-600">📞</span> {booking.customerPhone}</span>
              )}
              {booking.packageDestination && (
                <span><span className="font-medium text-gray-600">📍</span> {booking.packageDestination}</span>
              )}
            </div>

            {/* Action Buttons - Compact */}
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
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
                onClick={() => {
                  setSelectedBooking(booking);
                  setShowStatusModal(true);
                }}
                className="flex-1 px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-0.5"
              >
                <Edit2 size={12} /> Status
              </button>
              {hasRemainingBalance && (
                <button
                  onClick={() => {
                    setSelectedBooking(booking);
                    setShowPaymentModal(true);
                  }}
                  className="flex-1 px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center justify-center gap-0.5"
                >
                  <CreditCard size={12} /> Pay
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedBooking(booking);
                  setShowDeleteModal(true);
                }}
                className="flex-1 px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-0.5"
              >
                <Trash2 size={12} />
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

export default TourBookings;