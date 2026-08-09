import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Import icons directly, not as default
import { 
  Calendar, Car, Compass, MapPin, Hotel, Plane,
  Clock, CheckCircle, AlertCircle, X, 
  DollarSign, Eye, ArrowRight, CreditCard,
  Search, Filter, RefreshCw, MessageCircle,
  ChevronDown, ChevronUp, Info, Receipt,
  User, Phone, Mail, Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/api';

// Helper: Format currency
const formatCurrency = (amount) => {
  return `KSh ${(amount || 0).toLocaleString()}`;
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

const MyBookings = ({ setActiveTab, user }) => {
  const { currentUser } = useAuth();
  const [allBookings, setAllBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [tenantId, setTenantId] = useState(null);

  // Load user data and bookings
  useEffect(() => {
    const userData = currentUser || user || JSON.parse(localStorage.getItem('user') || '{}');
    const tid = userData?.tenantId || null;
    console.log('🔍 Tenant ID from user:', tid);
    setTenantId(tid);
    
    if (userData) {
      setLoggedInUser(userData);
      console.log('✅ Logged in user set:', userData);
      loadBookings(userData, tid);
    } else {
      console.warn('⚠️ No user found');
      setLoading(false);
    }
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ✅ Load bookings from API
  const loadBookings = async (userToCheck, tid) => {
    setLoading(true);
    
    try {
      const tenantToUse = tid || tenantId;
      console.log('🔍 Loading bookings with tenantId:', tenantToUse);
      
      if (!tenantToUse) {
        console.warn('⚠️ No tenantId available, loading from localStorage');
        loadFromLocalStorage(userToCheck);
        setLoading(false);
        return;
      }
      
      // ✅ Fetch bookings from API
      const response = await bookingService.getAll(tenantToUse);
      console.log('📊 Bookings API response:', response);
      
      let bookingsData = [];
      if (response?.success && response?.data) {
        bookingsData = response.data;
      } else if (Array.isArray(response)) {
        bookingsData = response;
      }
      
      console.log(`📊 Loaded ${bookingsData.length} bookings from API`);
      
      // ✅ Filter bookings for the current user
      let userBookings = [];
      
      if (userToCheck) {
        const userEmail = userToCheck.email?.toLowerCase().trim();
        const userId = userToCheck.id;
        const userPhone = userToCheck.phone;
        
        console.log('🔍 Searching for bookings with:');
        console.log('   Email:', userEmail);
        console.log('   User ID:', userId);
        console.log('   Phone:', userPhone);
        
        userBookings = bookingsData.filter(b => {
          const bookingEmail = (b.customerEmail || b.userEmail || b.email || '').toLowerCase().trim();
          const bookingUserId = b.userId || b.id;
          const bookingPhone = b.customerPhone || b.phone || '';
          
          if (bookingUserId && bookingUserId === userId) return true;
          if (bookingEmail && bookingEmail === userEmail) return true;
          if (bookingPhone && bookingPhone === userPhone) return true;
          
          return false;
        });
        
        console.log(`✅ Found ${userBookings.length} bookings for user`);
      } else {
        userBookings = bookingsData;
        console.log(`📊 Showing all ${userBookings.length} bookings`);
      }
      
      userBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setAllBookings(userBookings);
      setFilteredBookings(userBookings);
      
    } catch (error) {
      console.error('❌ Error loading bookings from API:', error);
      showNotification('Error loading bookings. Using local data.', 'error');
      loadFromLocalStorage(userToCheck);
    }
    
    setLoading(false);
  };

  // ✅ Fallback to localStorage
  const loadFromLocalStorage = (userToCheck) => {
    console.warn('Loading bookings from localStorage (fallback)');
    
    try {
      const storedBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      const guestBookings = JSON.parse(localStorage.getItem('travel_agency_guest_bookings') || '[]');
      
      const bookingMap = new Map();
      storedBookings.forEach(b => bookingMap.set(b.id, b));
      guestBookings.forEach(b => bookingMap.set(b.id, b));
      
      const allCombinedBookings = Array.from(bookingMap.values());
      
      let userBookings = [];
      
      if (userToCheck) {
        const userEmail = userToCheck.email?.toLowerCase().trim();
        const userId = userToCheck.id;
        const userPhone = userToCheck.phone;
        
        userBookings = allCombinedBookings.filter(b => {
          const bookingEmail = (b.customerEmail || b.userEmail || b.email || '').toLowerCase().trim();
          const bookingUserId = b.userId || b.id;
          const bookingPhone = b.customerPhone || b.phone || '';
          
          if (bookingUserId && bookingUserId === userId) return true;
          if (bookingEmail && bookingEmail === userEmail) return true;
          if (bookingPhone && bookingPhone === userPhone) return true;
          
          return false;
        });
      } else {
        userBookings = allCombinedBookings;
      }
      
      userBookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      setAllBookings(userBookings);
      setFilteredBookings(userBookings);
      
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setAllBookings([]);
      setFilteredBookings([]);
    }
  };

  // ✅ Cancel booking via API
  const cancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      console.log(`📤 Cancelling booking ${bookingId}`);
      const response = await bookingService.updateStatus(bookingId, 'cancelled');
      console.log('📥 Cancel booking response:', response);

      if (response?.success) {
        showNotification('✅ Booking cancelled successfully');
        loadBookings(loggedInUser, tenantId);
      } else {
        showNotification('Failed to cancel booking: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      showNotification('Failed to cancel booking. Please try again.', 'error');
    }
  };

  // Get service icon
  const getServiceIcon = (serviceType) => {
    const iconMap = {
      car_hire: Car,
      car: Car,
      tour: Compass,
      tour_package: Compass,
      hajj: MapPin,
      hajj_umra: MapPin,
      hotel: Hotel,
      hotel_booking: Hotel,
      flight: Plane,
      flight_booking: Plane
    };
    
    const IconComponent = iconMap[serviceType] || Calendar;
    return React.createElement(IconComponent, { 
      size: 16, 
      className: "text-blue-600 inline" 
    });
  };

  // Get service label
  const getServiceLabel = (serviceType) => {
    const labels = {
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
    return labels[serviceType] || serviceType || 'Booking';
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

  // Filter bookings
  useEffect(() => {
    let filtered = allBookings;
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(b => b.status === filterStatus);
    }
    
    if (filterService !== 'all') {
      filtered = filtered.filter(b => {
        const serviceType = b.serviceType || b.service_type || '';
        return serviceType === filterService || serviceType === filterService.replace('_booking', '');
      });
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(b => {
        return (b.reference || '').toLowerCase().includes(term) ||
               (b.customerName || '').toLowerCase().includes(term) ||
               (b.itemName || '').toLowerCase().includes(term) ||
               (b.hotelName || '').toLowerCase().includes(term) ||
               (b.airline || '').toLowerCase().includes(term) ||
               (b.packageName || '').toLowerCase().includes(term) ||
               (b.vehicleRegistration || '').toLowerCase().includes(term);
      });
    }
    
    setFilteredBookings(filtered);
  }, [allBookings, searchTerm, filterStatus, filterService]);

  // Stats
  const stats = useMemo(() => {
    const total = allBookings.length;
    const pending = allBookings.filter(b => b.status === 'pending').length;
    const confirmed = allBookings.filter(b => b.status === 'confirmed' || b.status === 'active').length;
    const completed = allBookings.filter(b => b.status === 'completed').length;
    const cancelled = allBookings.filter(b => b.status === 'cancelled').length;
    
    return { total, pending, confirmed, completed, cancelled };
  }, [allBookings]);

  // Get unique services for filter
  const services = useMemo(() => {
    const serviceSet = new Set();
    allBookings.forEach(b => {
      const service = b.serviceType || b.service_type || '';
      if (service) {
        serviceSet.add(service);
      }
    });
    return Array.from(serviceSet);
  }, [allBookings]);

  // Close modal function
  const closeModal = () => {
    setShowDetailModal(false);
    setSelectedBooking(null);
  };

  // ✅ TABULAR VIEW with horizontal scroll
  const BookingTable = () => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px] text-sm">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
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
            {filteredBookings.map((booking) => {
              const statusBadge = getStatusBadge(booking.status);
              const paymentBadge = getPaymentStatusBadge(booking.paymentStatus);
              const serviceIcon = getServiceIcon(booking.serviceType);
              const serviceLabel = getServiceLabel(booking.serviceType);

              return (
                <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
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
                      <p className="text-xs text-gray-400 truncate max-w-[100px]">{booking.customerEmail}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-700 truncate max-w-[150px] block">
                      {booking.itemName || booking.packageName || booking.hotelName || 
                       `${booking.airline} ${booking.flightNumber}` || 'N/A'}
                    </span>
                    {booking.vehicleRegistration && (
                      <span className="text-xs text-gray-400">{booking.vehicleRegistration}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="text-xs">
                      {booking.startDate && (
                        <p>{formatDate(booking.startDate)}</p>
                      )}
                      {booking.checkIn && (
                        <p>In: {formatDate(booking.checkIn)}</p>
                      )}
                      {booking.days && (
                        <p className="text-gray-400">{booking.days} days</p>
                      )}
                      {booking.nights && (
                        <p className="text-gray-400">{booking.nights} nights</p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                      {statusBadge.label}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <div>
                      <p className="text-sm font-semibold text-blue-600">{formatCurrency(booking.totalPrice)}</p>
                      {booking.remainingBalance > 0 && (
                        <p className="text-[10px] text-orange-600">O/S: {formatCurrency(booking.remainingBalance)}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${paymentBadge.color}`}>
                        {paymentBadge.label}
                      </span>
                      {booking.paymentMethod && (
                        <p className="text-[8px] text-gray-400 mt-0.5">{booking.paymentMethod}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetailModal(true);
                        }}
                        className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye size={15} />
                      </button>
                      {(booking.status === 'pending' || booking.status === 'confirmed') && (
                        <button
                          onClick={() => cancelBooking(booking.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Cancel Booking"
                        >
                          <X size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Booking Detail Modal - Rendered conditionally outside the table
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
            {(selectedBooking.status === 'pending' || selectedBooking.status === 'confirmed') && (
              <button
                onClick={() => {
                  cancelBooking(selectedBooking.id);
                  closeModal();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Cancel Booking
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-sm">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {renderBookingDetailModal()}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="text-blue-600" size={28} />
            My Bookings
          </h1>
          <p className="text-gray-500">View and manage all your bookings in one place</p>
        </div>
        <button 
          onClick={() => loadBookings(loggedInUser, tenantId)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Stats */}
      {allBookings.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-xl font-bold text-gray-800">{stats.total}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">⏳ Pending</p>
            <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">📌 Confirmed</p>
            <p className="text-xl font-bold text-blue-600">{stats.confirmed}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">✅ Completed</p>
            <p className="text-xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">❌ Cancelled</p>
            <p className="text-xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
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
                placeholder="Search by reference, customer, or item name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
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
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No bookings found</p>
          <p className="text-sm text-gray-400">
            {searchTerm || filterStatus !== 'all' || filterService !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'You haven\'t made any bookings yet. Start exploring our services!'}
          </p>
          {!searchTerm && filterStatus === 'all' && filterService === 'all' && (
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              <button
                onClick={() => setActiveTab('car-hire')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
              >
                <Car size={16} /> Book a Car
              </button>
              <button
                onClick={() => setActiveTab('tours')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
              >
                <Compass size={16} /> Book a Tour
              </button>
              <button
                onClick={() => setActiveTab('hajj-umra')}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm flex items-center gap-2"
              >
                <MapPin size={16} /> Hajj/Umra
              </button>
              <button
                onClick={() => setActiveTab('hotels')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center gap-2"
              >
                <Hotel size={16} /> Book a Hotel
              </button>
              <button
                onClick={() => setActiveTab('flights')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2"
              >
                <Plane size={16} /> Book a Flight
              </button>
            </div>
          )}
        </div>
      ) : (
        <BookingTable />
      )}

      {/* Footer */}
      <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

export default MyBookings;