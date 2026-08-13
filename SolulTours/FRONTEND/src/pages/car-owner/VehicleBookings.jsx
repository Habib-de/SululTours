import React, { useState, useEffect } from 'react';
import { 
  Calendar, Search, Filter, RefreshCw, 
  Eye, CheckCircle, XCircle, Clock, 
  AlertCircle, Car, DollarSign,
  X, CreditCard, Building, Wallet,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingService, vehicleService, carOwnerService } from '../../services/api';

const VehicleBookings = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [carOwner, setCarOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [tenantId, setTenantId] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
      console.log('🔍 Loading vehicle bookings data with tenantId:', tenantToUse);
      
      if (!tenantToUse) {
        console.warn('⚠️ No tenantId available, skipping API call');
        setLoading(false);
        return;
      }
      
      // ✅ 1. Get car owner profile for the current user
      const ownerResponse = await carOwnerService.getByUser(currentUser.id);
      console.log('📊 Car owner response:', ownerResponse);
      
      let owner = null;
      if (ownerResponse?.success && ownerResponse?.data) {
        owner = ownerResponse.data;
      } else if (ownerResponse?.id) {
        owner = ownerResponse;
      }
      setCarOwner(owner);

      if (!owner) {
        console.warn('⚠️ No car owner profile found');
        setBookings([]);
        setLoading(false);
        return;
      }

      // ✅ 2. Get all vehicles for this owner
      const vehiclesResponse = await vehicleService.getByOwner(owner.id);
      console.log('📊 Vehicles response:', vehiclesResponse);
      let vehiclesData = [];
      if (vehiclesResponse?.success && vehiclesResponse?.data) {
        vehiclesData = vehiclesResponse.data;
      } else if (Array.isArray(vehiclesResponse)) {
        vehiclesData = vehiclesResponse;
      }
      setVehicles(vehiclesData);

      // ✅ 3. Get all bookings for the tenant
      const bookingsResponse = await bookingService.getAll(tenantToUse);
      console.log('📊 Bookings response:', bookingsResponse);
      let bookingsData = [];
      if (bookingsResponse?.success && bookingsResponse?.data) {
        bookingsData = bookingsResponse.data;
      } else if (Array.isArray(bookingsResponse)) {
        bookingsData = bookingsResponse;
      }

      // ✅ 4. Filter bookings by this owner's vehicles
      const vehicleIds = vehiclesData.map(v => v.id);
      const ownerBookings = bookingsData.filter(b => vehicleIds.includes(b.vehicleId));
      
      console.log(`📊 Found ${ownerBookings.length} bookings for owner's vehicles`);
      setBookings(ownerBookings);
      
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Error loading bookings', 'error');
      // Fallback to localStorage
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  // Fallback to localStorage
  const loadFromLocalStorage = () => {
    try {
      const allOwners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
      const owner = allOwners.find(o => o.userId === currentUser?.id);
      setCarOwner(owner);

      if (owner) {
        const allBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
        const myBookings = allBookings.filter(b => b.ownerId === owner.id);
        setBookings(myBookings);
      } else {
        setBookings([]);
      }

      const storedVehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
      setVehicles(storedVehicles);
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  const getVehicleDetails = (vehicleId) => {
    return vehicles.find(v => v.id === vehicleId);
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

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      PAID: { label: '✅ Paid', color: 'bg-green-100 text-green-800' },
      PENDING: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800' },
      PARTIAL: { label: '🔄 Partial', color: 'bg-blue-100 text-blue-800' }
    };
    return statusMap[status] || { label: status || 'Pending', color: 'bg-gray-100 text-gray-800' };
  };

  const statusOptions = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

  const filteredBookings = bookings.filter(b => {
    const vehicle = getVehicleDetails(b.vehicleId);
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      vehicle?.registration?.toLowerCase().includes(searchLower) ||
      vehicle?.make?.toLowerCase().includes(searchLower) ||
      vehicle?.model?.toLowerCase().includes(searchLower);
    
    const matchesFilter = filterStatus === 'all' || b.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ✅ STATS CALCULATIONS
  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

  // ✅ Calculate total discount correctly (percentage of total, not per day)
  const totalDiscount = bookings.reduce((sum, b) => {
    const dailyRate = b.vehiclePricePerDay || 0;
    const days = b.days || 0;
    const baseEarnings = dailyRate * days;
    
    if (b.discountType === 'PERCENTAGE') {
      const discountPercent = parseFloat(b.discountValue) || 0;
      return sum + (baseEarnings * discountPercent / 100);
    } else if (b.discountType === 'FIXED') {
      return sum + ((b.discountAmount || 0) * days);
    }
    return sum + (b.discountAmount || 0);
  }, 0);

  // ✅ Calculate total revenue correctly
  const totalRevenue = bookings.reduce((sum, b) => {
    const dailyRate = b.vehiclePricePerDay || 0;
    const days = b.days || 0;
    const baseEarnings = dailyRate * days;
    
    let discount = 0;
    if (b.discountType === 'PERCENTAGE') {
      const discountPercent = parseFloat(b.discountValue) || 0;
      discount = baseEarnings * discountPercent / 100;
    } else if (b.discountType === 'FIXED') {
      discount = (b.discountAmount || 0) * days;
    } else {
      discount = b.discountAmount || 0;
    }
    
    return sum + (baseEarnings - discount);
  }, 0);

  const totalDebt = bookings.reduce((sum, b) => {
    const remainingBalance = b.remainingBalance || 0;
    return sum + remainingBalance;
  }, 0);

  const bookingsWithDebt = bookings.filter(b => (b.remainingBalance || 0) > 0);
  const debtCount = bookingsWithDebt.length;

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

      {/* Detail Modal - NO customer info at all */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <Calendar size={24} />
                <div>
                  <h2 className="text-lg font-semibold">Booking Details</h2>
                  <p className="text-sm text-blue-100">ID: {selectedBooking.id?.slice(0, 10)}...</p>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Vehicle Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div><span className="text-xs text-gray-500">Vehicle:</span> <span className="text-sm font-medium">{selectedBooking.vehicleRegistration || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">Make/Model:</span> <span className="text-sm font-medium">{selectedBooking.vehicleMake || 'N/A'} {selectedBooking.vehicleModel || ''}</span></div>
                  <div><span className="text-xs text-gray-500">Daily Rate:</span> <span className="text-sm font-medium text-blue-600">KSh {selectedBooking.vehiclePricePerDay?.toLocaleString() || 0}</span></div>
                  <div><span className="text-xs text-gray-500">Status:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusBadge(selectedBooking.status).color}`}>{getStatusBadge(selectedBooking.status).label}</span></div>
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
                  <div><span className="text-xs text-gray-500">Daily Rate:</span> <span className="text-sm font-medium text-blue-600">KSh {selectedBooking.vehiclePricePerDay?.toLocaleString() || 0}</span></div>
                </div>
              </div>

              {/* ✅ DISCOUNT & EARNINGS SECTION - Fixed calculation */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Earnings & Discounts</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500">Base Earnings (Daily Rate × Days):</span>
                    <span className="text-sm font-medium ml-1">
                      KSh {((selectedBooking.vehiclePricePerDay || 0) * (selectedBooking.days || 0)).toLocaleString()}
                    </span>
                  </div>
                  
                  {selectedBooking.discountAmount > 0 && (
                    <>
                      <div className="col-span-2">
                        <span className="text-xs text-red-500">Discount Applied:</span>
                        <span className="text-sm font-medium text-red-500 ml-1">
                          -KSh {(() => {
                            const base = (selectedBooking.vehiclePricePerDay || 0) * (selectedBooking.days || 0);
                            if (selectedBooking.discountType === 'PERCENTAGE') {
                              return (base * parseFloat(selectedBooking.discountValue || 0) / 100).toLocaleString();
                            } else if (selectedBooking.discountType === 'FIXED') {
                              return ((selectedBooking.discountAmount || 0) * (selectedBooking.days || 1)).toLocaleString();
                            }
                            return (selectedBooking.discountAmount || 0).toLocaleString();
                          })()}
                        </span>
                        <span className="text-xs text-gray-400 ml-2">
                          ({selectedBooking.discountType === 'PERCENTAGE' ? `${selectedBooking.discountValue}% of total` : 
                            selectedBooking.discountType === 'FIXED' ? `KES ${selectedBooking.discountValue}/day` : 'None'})
                        </span>
                      </div>
                      <div className="col-span-2 border-t border-gray-200 pt-1">
                        <span className="text-xs font-bold text-green-600">Your Final Earnings:</span>
                        <span className="text-sm font-bold text-green-600 ml-1">
                          KSh {(() => {
                            const base = (selectedBooking.vehiclePricePerDay || 0) * (selectedBooking.days || 0);
                            let discount = 0;
                            if (selectedBooking.discountType === 'PERCENTAGE') {
                              discount = base * parseFloat(selectedBooking.discountValue || 0) / 100;
                            } else if (selectedBooking.discountType === 'FIXED') {
                              discount = (selectedBooking.discountAmount || 0) * (selectedBooking.days || 1);
                            } else {
                              discount = selectedBooking.discountAmount || 0;
                            }
                            return (base - discount).toLocaleString();
                          })()}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {(selectedBooking.commission || 0) > 0 && (
                    <div className="col-span-2">
                      <span className="text-xs text-orange-500">Fleet Manager Commission:</span>
                      <span className="text-sm font-medium text-orange-500 ml-1">
                        +KSh {selectedBooking.commission.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment Information</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div><span className="text-xs text-gray-500">Method:</span> <span className="text-sm font-medium flex items-center gap-1">{getPaymentMethodIcon(selectedBooking.paymentMethod)} {selectedBooking.paymentMethod || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">Status:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getPaymentStatusBadge(selectedBooking.paymentStatus).color}`}>{getPaymentStatusBadge(selectedBooking.paymentStatus).label}</span></div>
                  {(selectedBooking.remainingBalance || 0) > 0 && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500">Remaining Balance (Debt):</span>
                      <span className="text-sm font-bold text-red-600 ml-1">KES {selectedBooking.remainingBalance?.toLocaleString() || 0}</span>
                    </div>
                  )}
                  {(selectedBooking.paidAmount || 0) > 0 && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500">Amount Paid:</span>
                      <span className="text-sm font-medium text-green-600 ml-1">KES {(selectedBooking.paidAmount || 0).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Vehicle Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">View bookings made on your vehicles</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => loadData(tenantId)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
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
            <p className="text-xl font-bold text-purple-600">KSh {totalRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">🏷️ Discounts</p>
            <p className="text-xl font-bold text-red-500">KSh {totalDiscount.toLocaleString()}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">💳 Debt O/S</p>
            <p className={`text-xl font-bold ${totalDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
              KSh {totalDebt.toLocaleString()}
            </p>
            {debtCount > 0 && (
              <p className="text-xs text-gray-400 mt-1">{debtCount} booking(s) with debt</p>
            )}
          </div>
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by vehicle..."
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

      {/* Bookings Table - NO customer info at all */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">
            {searchQuery || filterStatus !== 'all' ? 'No bookings match your search' : 'No bookings on your vehicles yet'}
          </p>
          <p className="text-sm text-gray-400">
            {searchQuery || filterStatus !== 'all' ? 'Try adjusting your search or filter' : 'Bookings will appear here when customers rent your vehicles'}
          </p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Vehicle</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Dates</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Days</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Base Earnings</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Discount</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Your Earnings</th>
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
                    const paymentStatusBadge = getPaymentStatusBadge(booking.paymentStatus);
                    const hasDebt = (booking.remainingBalance || 0) > 0;
                    
                    // ✅ Calculate discount correctly for this booking
                    const baseEarnings = (booking.vehiclePricePerDay || 0) * (booking.days || 0);
                    
                    let discountAmount = 0;
                    if (booking.discountType === 'PERCENTAGE') {
                      const discountPercent = parseFloat(booking.discountValue) || 0;
                      discountAmount = baseEarnings * discountPercent / 100;
                    } else if (booking.discountType === 'FIXED') {
                      discountAmount = (booking.discountAmount || 0) * (booking.days || 1);
                    } else {
                      discountAmount = booking.discountAmount || 0;
                    }
                    
                    const finalEarnings = baseEarnings - discountAmount;

                    return (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-xs">
                            <p className="font-medium text-gray-700">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'N/A'}</p>
                            <p className="text-gray-400">{vehicle?.registration || 'N/A'}</p>
                            <p className="text-blue-600 text-[10px]">KSh {booking.vehiclePricePerDay?.toLocaleString()}/day</p>
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
                          <span className="text-sm text-gray-700">KSh {baseEarnings.toLocaleString()}</span>
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          {discountAmount > 0 ? (
                            <div>
                              <span className="text-sm text-red-500 font-medium">-KSh {discountAmount.toLocaleString()}</span>
                              <p className="text-[10px] text-gray-400">
                                {booking.discountType === 'PERCENTAGE' ? `${booking.discountValue}% of total` : 
                                 booking.discountType === 'FIXED' ? 'Fixed' : 'None'}
                              </p>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">None</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <span className="text-sm font-bold text-green-600">KSh {finalEarnings.toLocaleString()}</span>
                          {discountAmount > 0 && (
                            <p className="text-[10px] text-gray-400">after discount</p>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-xs">{getPaymentMethodIcon(booking.paymentMethod)}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${paymentStatusBadge.color}`}>
                              {paymentStatusBadge.label}
                            </span>
                            {hasDebt && (
                              <span className="text-[10px] text-red-600 font-medium">
                                Debt: KSh {(booking.remainingBalance || 0).toLocaleString()}
                              </span>
                            )}
                            {booking.mpesaCode && (
                              <span className="text-[8px] font-mono text-blue-500 truncate max-w-[80px]">{booking.mpesaCode}</span>
                            )}
                            {/* {(booking.paidAmount || 0) > 0 && (
                              <span className="text-[9px] text-green-600">Paid: KSh {(booking.paidAmount || 0).toLocaleString()}</span>
                            )} */}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color} flex items-center gap-1 justify-center`}>
                            <StatusIcon size={12} /> {statusBadge.label}
                          </span>
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

export default VehicleBookings;