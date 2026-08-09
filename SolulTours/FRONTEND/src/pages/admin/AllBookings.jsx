import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Calendar, Car, Compass, MapPin, Hotel, Plane,
  Search, Filter, RefreshCw, Eye, X,
  CheckCircle, AlertCircle, Clock, DollarSign,
  User, Phone, Mail, Building,
  ChevronDown, ChevronUp, ArrowRight,
  Download, Printer, FileText, CreditCard,
  Shield, Wallet, TrendingUp
} from 'lucide-react';
import { bookingService } from '../../services/api';

const AllBookings = ({ setActiveTab }) => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterService, setFilterService] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [expandedBooking, setExpandedBooking] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================
  // LOAD DATA FROM API PUBLIC ENDPOINT
  // ============================================
  const loadData = useCallback(async () => {
    setLoading(true);
    
    try {
      console.log('🔍 Loading all bookings from public API endpoint...');
      
      // ✅ Use the new public endpoint - no tenant ID required
      const response = await bookingService.getAllPublic();
      console.log('📊 Bookings API Response:', response);
      
      let allBookings = [];
      if (response?.success && response?.data) {
        allBookings = response.data;
      } else if (Array.isArray(response)) {
        allBookings = response;
      } else if (response?.data && Array.isArray(response.data)) {
        allBookings = response.data;
      }
      
      // Sort by date (newest first)
      allBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log(`📊 Loaded ${allBookings.length} bookings from API`);
      setBookings(allBookings);
      setFilteredBookings(allBookings);
      
      if (allBookings.length === 0) {
        showNotification('No bookings found in backend', 'info');
      } else {
        showNotification(`Loaded ${allBookings.length} bookings from server`, 'success');
      }
      
    } catch (error) {
      console.error('❌ Error loading bookings from API:', error);
      showNotification('Error loading bookings from API: ' + error.message, 'error');
      setBookings([]);
      setFilteredBookings([]);
    }
    
    setLoading(false);
  }, []);

  // Close modal function
  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedBooking(null);
  };

  // Get service icon
  const getServiceIcon = (serviceType) => {
    const iconMap = {
      car_hire: <Car size={16} className="text-blue-600" />,
      car: <Car size={16} className="text-blue-600" />,
      tour: <Compass size={16} className="text-green-600" />,
      tour_package: <Compass size={16} className="text-green-600" />,
      hajj: <MapPin size={16} className="text-purple-600" />,
      hajj_umra: <MapPin size={16} className="text-purple-600" />,
      hotel: <Hotel size={16} className="text-orange-600" />,
      hotel_booking: <Hotel size={16} className="text-orange-600" />,
      flight: <Plane size={16} className="text-indigo-600" />,
      flight_booking: <Plane size={16} className="text-indigo-600" />
    };
    return iconMap[serviceType] || <Calendar size={16} className="text-gray-400" />;
  };

  // Get service label
  const getServiceLabel = (serviceType) => {
    const labelMap = {
      car_hire: 'Car Hire',
      car: 'Car Hire',
      tour: 'Tour',
      tour_package: 'Tour',
      hajj: 'Hajj/Umra',
      hajj_umra: 'Hajj/Umra',
      hotel: 'Hotel',
      hotel_booking: 'Hotel',
      flight: 'Flight',
      flight_booking: 'Flight'
    };
    return labelMap[serviceType] || serviceType || 'Booking';
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '📌 Confirmed', color: 'bg-blue-100 text-blue-800' },
      active: { label: '✅ Active', color: 'bg-green-100 text-green-800' },
      completed: { label: '✅ Completed', color: 'bg-gray-100 text-gray-800' },
      cancelled: { label: '❌ Cancelled', color: 'bg-red-100 text-red-800' },
      rejected: { label: '❌ Rejected', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { label: status || 'Pending', color: 'bg-gray-100 text-gray-800' };
  };

  // Get payment status badge
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

  // Get unique services for filter
  const services = useMemo(() => {
    const serviceSet = new Set();
    bookings.forEach(b => {
      const service = b.serviceType || b.service_type || '';
      if (service) {
        serviceSet.add(service);
      }
    });
    return Array.from(serviceSet);
  }, [bookings]);

  // Filter bookings
  useEffect(() => {
    let filtered = bookings;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => 
        (b.reference || '').toLowerCase().includes(term) ||
        (b.customerName || '').toLowerCase().includes(term) ||
        (b.customerEmail || '').toLowerCase().includes(term) ||
        (b.itemName || '').toLowerCase().includes(term) ||
        (b.hotelName || '').toLowerCase().includes(term) ||
        (b.airline || '').toLowerCase().includes(term) ||
        (b.packageName || '').toLowerCase().includes(term) ||
        (b.vehicleRegistration || '').toLowerCase().includes(term)
      );
    }
    
    if (filterService !== 'all') {
      filtered = filtered.filter(b => {
        const serviceType = b.serviceType || b.service_type || '';
        return serviceType === filterService || serviceType === filterService.replace('_booking', '');
      });
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(b => b.status === filterStatus);
    }
    
    setFilteredBookings(filtered);
  }, [bookings, searchTerm, filterService, filterStatus]);

  // Stats
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed' || b.status === 'active').length;
    const completed = bookings.filter(b => b.status === 'completed').length;
    const cancelled = bookings.filter(b => b.status === 'cancelled').length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const totalDebt = bookings.reduce((sum, b) => sum + (b.remainingBalance || 0), 0);
    
    return { total, pending, confirmed, completed, cancelled, totalRevenue, totalDebt };
  }, [bookings]);

  // Render Booking Detail Modal
  const renderBookingDetailModal = () => {
    if (!selectedBooking || !showDetailModal) return null;

    const statusBadge = getStatusBadge(selectedBooking.status);
    const paymentBadge = getPaymentStatusBadge(selectedBooking.paymentStatus);
    const serviceIcon = getServiceIcon(selectedBooking.serviceType);
    const serviceLabel = getServiceLabel(selectedBooking.serviceType);

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={closeModal}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <button 
            onClick={closeModal}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center gap-2 text-white/80 text-sm">
              {serviceIcon}
              <span>{serviceLabel}</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Booking Details</h2>
            <p className="text-blue-100 text-sm">Ref: {selectedBooking.reference}</p>
          </div>

          <div className="p-6">
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge.color}`}>
                {statusBadge.label}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${paymentBadge.color}`}>
                Payment: {paymentBadge.label}
              </span>
              {selectedBooking.isGuestBooking && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  👤 Guest
                </span>
              )}
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Customer Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <span className="font-medium ml-1">{selectedBooking.customerName}</span>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <span className="font-medium ml-1">{selectedBooking.customerEmail || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <span className="font-medium ml-1">{selectedBooking.customerPhone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500">ID Number:</span>
                  <span className="font-medium ml-1">{selectedBooking.customerIdNumber || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-700 mb-2">Booking Information</h4>
              <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-2 text-sm">
                <div className="col-span-2">
                  <span className="text-gray-500">Item:</span>
                  <span className="font-medium ml-1">{selectedBooking.itemName || selectedBooking.packageName || 'N/A'}</span>
                </div>
                {selectedBooking.startDate && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Start:</span>
                    <span className="font-medium ml-1">{formatDateTime(selectedBooking.startDate)}</span>
                  </div>
                )}
                {selectedBooking.endDate && (
                  <div className="col-span-2">
                    <span className="text-gray-500">End:</span>
                    <span className="font-medium ml-1">{formatDateTime(selectedBooking.endDate)}</span>
                  </div>
                )}
                {selectedBooking.checkIn && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Check-in:</span>
                    <span className="font-medium ml-1">{formatDateTime(selectedBooking.checkIn)}</span>
                  </div>
                )}
                {selectedBooking.checkOut && (
                  <div className="col-span-2">
                    <span className="text-gray-500">Check-out:</span>
                    <span className="font-medium ml-1">{formatDateTime(selectedBooking.checkOut)}</span>
                  </div>
                )}
                {selectedBooking.passengers && (
                  <div>
                    <span className="text-gray-500">Passengers:</span>
                    <span className="font-medium ml-1">{selectedBooking.passengers}</span>
                  </div>
                )}
                {selectedBooking.days && (
                  <div>
                    <span className="text-gray-500">Days:</span>
                    <span className="font-medium ml-1">{selectedBooking.days}</span>
                  </div>
                )}
                {selectedBooking.nights && (
                  <div>
                    <span className="text-gray-500">Nights:</span>
                    <span className="font-medium ml-1">{selectedBooking.nights}</span>
                  </div>
                )}
                {selectedBooking.rooms && (
                  <div>
                    <span className="text-gray-500">Rooms:</span>
                    <span className="font-medium ml-1">{selectedBooking.rooms}</span>
                  </div>
                )}
                {selectedBooking.seatClass && (
                  <div>
                    <span className="text-gray-500">Seat Class:</span>
                    <span className="font-medium ml-1">{selectedBooking.seatClass}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Total:</span>
                  <span className="font-medium text-blue-600 ml-1">{formatCurrency(selectedBooking.totalPrice)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Paid:</span>
                  <span className="font-medium text-green-600 ml-1">{formatCurrency(selectedBooking.paidAmount || 0)}</span>
                </div>
                {selectedBooking.remainingBalance > 0 && (
                  <div>
                    <span className="text-gray-500">Remaining:</span>
                    <span className="font-medium text-orange-600 ml-1">{formatCurrency(selectedBooking.remainingBalance)}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Payment Method:</span>
                  <span className="font-medium ml-1">{selectedBooking.paymentMethod || 'N/A'}</span>
                </div>
                {selectedBooking.mpesaCode && (
                  <div>
                    <span className="text-gray-500">M-Pesa Code:</span>
                    <span className="font-medium font-mono ml-1">{selectedBooking.mpesaCode}</span>
                  </div>
                )}
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Notes</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600">{selectedBooking.notes}</p>
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2 flex-wrap">
            <button onClick={closeModal} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Booking Row Component
  const BookingRow = ({ booking }) => {
    const statusBadge = getStatusBadge(booking.status);
    const paymentBadge = getPaymentStatusBadge(booking.paymentStatus);
    const serviceIcon = getServiceIcon(booking.serviceType);
    const serviceLabel = getServiceLabel(booking.serviceType);
    const isExpanded = expandedBooking === booking.id;

    const handleRowClick = () => {
      setExpandedBooking(isExpanded ? null : booking.id);
    };

    const handleViewDetails = (e) => {
      e.stopPropagation();
      setSelectedBooking(booking);
      setShowDetailModal(true);
    };

    return (
      <>
        <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={handleRowClick}>
          <td className="px-3 py-3 whitespace-nowrap">
            <div className="flex items-center gap-2">
              {serviceIcon}
              <span className="text-xs text-gray-600">{serviceLabel}</span>
            </div>
          </td>
          <td className="px-3 py-3 whitespace-nowrap">
            <span className="text-xs font-mono text-gray-600">{booking.reference}</span>
          </td>
          <td className="px-3 py-3 whitespace-nowrap">
            <div>
              <p className="text-sm font-medium text-gray-800">{booking.customerName}</p>
              <p className="text-xs text-gray-400 truncate max-w-[120px]">{booking.customerEmail}</p>
            </div>
          </td>
          <td className="px-3 py-3 whitespace-nowrap">
            <span className="text-sm text-gray-700 truncate max-w-[120px] block">
              {booking.itemName || booking.packageName || booking.hotelName || 
               `${booking.airline} ${booking.flightNumber}` || 'N/A'}
            </span>
          </td>
          <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
            {formatDate(booking.createdAt)}
          </td>
          <td className="px-3 py-3 text-center whitespace-nowrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </td>
          <td className="px-3 py-3 text-right whitespace-nowrap">
            <span className="text-sm font-semibold text-blue-600">{formatCurrency(booking.totalPrice)}</span>
          </td>
          <td className="px-3 py-3 text-center whitespace-nowrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${paymentBadge.color}`}>
              {paymentBadge.label}
            </span>
          </td>
          <td className="px-3 py-3 text-center whitespace-nowrap">
            <button
              onClick={handleViewDetails}
              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="View Details"
            >
              <Eye size={15} />
            </button>
          </td>
        </tr>
        {isExpanded && (
          <tr>
            <td colSpan="9" className="px-4 py-3 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Booking ID</p>
                  <p className="font-mono text-xs">{booking.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Service Type</p>
                  <p className="font-medium">{serviceLabel}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Guest Booking</p>
                  <p className="font-medium">{booking.isGuestBooking ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Created</p>
                  <p className="font-medium">{formatDateTime(booking.createdAt)}</p>
                </div>
                {booking.startDate && (
                  <div>
                    <p className="text-xs text-gray-400">Start Date</p>
                    <p className="font-medium">{formatDateTime(booking.startDate)}</p>
                  </div>
                )}
                {booking.endDate && (
                  <div>
                    <p className="text-xs text-gray-400">End Date</p>
                    <p className="font-medium">{formatDateTime(booking.endDate)}</p>
                  </div>
                )}
                {booking.remainingBalance > 0 && (
                  <div>
                    <p className="text-xs text-gray-400">Outstanding Balance</p>
                    <p className="font-medium text-red-600">{formatCurrency(booking.remainingBalance)}</p>
                  </div>
                )}
                <div className="flex gap-2 col-span-2">
                  <button
                    onClick={handleViewDetails}
                    className="px-3 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <Eye size={14} className="inline mr-1" /> View Details
                  </button>
                </div>
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-sm">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Detail Modal - Rendered conditionally */}
      {renderBookingDetailModal()}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar size={28} className="text-blue-600" />
            All Bookings
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            View and manage all bookings from the backend
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh from API"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => {
              const dataStr = JSON.stringify(bookings, null, 2);
              const blob = new Blob([dataStr], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `all-bookings-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
          >
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Stats */}
      {bookings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-7 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">⏳ Pending</p>
            <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">📌 Confirmed</p>
            <p className="text-xl font-bold text-blue-600">{stats.confirmed}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">✅ Completed</p>
            <p className="text-xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">❌ Cancelled</p>
            <p className="text-xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">💰 Revenue</p>
            <p className="text-xl font-bold text-purple-600">{formatCurrency(stats.totalRevenue)}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-400">💳 Debt</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(stats.totalDebt)}</p>
          </div>
        </div>
      )}

      {bookings.length === 0 && !loading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-center">
          <p className="text-yellow-700 text-sm">No bookings found in the backend</p>
          <p className="text-yellow-600 text-xs mt-1">The API returned 0 bookings</p>
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
                placeholder="Search by reference, customer, or item..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Services</option>
              {services.map(service => (
                <option key={service} value={service}>
                  {getServiceLabel(service)}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="pending">⏳ Pending</option>
              <option value="confirmed">📌 Confirmed</option>
              <option value="active">✅ Active</option>
              <option value="completed">✅ Completed</option>
              <option value="cancelled">❌ Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading bookings from API...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No bookings found</p>
          <p className="text-sm text-gray-400">
            {searchTerm || filterService !== 'all' || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'No bookings available in the system'}
          </p>
          <button 
            onClick={loadData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <RefreshCw size={14} className="inline mr-2" /> Refresh from API
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Service</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reference</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Total</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Payment</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBookings.map(booking => (
                  <BookingRow key={booking.id} booking={booking} />
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-500">
            Showing {filteredBookings.length} of {bookings.length} bookings from API
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

export default AllBookings;