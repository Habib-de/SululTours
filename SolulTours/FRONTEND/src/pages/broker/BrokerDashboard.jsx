import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, DollarSign, Clock, CheckCircle, XCircle,
  AlertCircle, X, RefreshCw, Plus, Eye, Car,
  Compass, MapPin, Hotel, Plane, Receipt, ArrowRight, Truck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/api';

const BrokerDashboard = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [todayStats, setTodayStats] = useState({
    totalBookings: 0, totalSales: 0, totalCollected: 0, totalDebt: 0,
    pendingCount: 0, confirmedCount: 0, completedCount: 0, cancelledCount: 0
  });
  const [todayBookings, setTodayBookings] = useState([]);
  const [allMyBookings, setAllMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [notification, setNotification] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, todayRes, allRes] = await Promise.all([
        bookingService.getBrokerTodayStats().catch(() => null),
        bookingService.getBrokerTodayBookings().catch(() => null),
        bookingService.getBrokerMyBookings().catch(() => null)
      ]);

      if (statsRes?.success && statsRes.data) {
        setTodayStats({
          totalBookings: statsRes.data.totalBookings || 0,
          totalSales: statsRes.data.totalSales || 0,
          totalCollected: statsRes.data.totalCollected || 0,
          totalDebt: statsRes.data.totalDebt || 0,
          pendingCount: statsRes.data.pendingCount || 0,
          confirmedCount: statsRes.data.confirmedCount || 0,
          completedCount: statsRes.data.completedCount || 0,
          cancelledCount: statsRes.data.cancelledCount || 0
        });
      }

      if (todayRes?.success) setTodayBookings(todayRes.data || []);
      if (allRes?.success) setAllMyBookings(allRes.data || []);
    } catch (err) {
      console.error('Broker dashboard load error:', err);
      showNotification('Failed to load dashboard', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const fmt = (n) => `KSh ${(n || 0).toLocaleString()}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  }) : 'N/A';

  // ✅ Base money only (no commission) — rate × days − discount
  const baseTotal = (b) =>
    (b.vehiclePricePerDay || 0) * (b.days || 0) - (b.discountAmount || 0);

  const baseOutstanding = (b) =>
    Math.max(0, baseTotal(b) - (b.paidAmount || 0));

  const getServiceIcon = (type) => {
    const map = {
      car_hire: Car, car: Car, tour: Compass, tour_package: Compass,
      hajj: MapPin, hajj_umra: MapPin, hotel: Hotel, hotel_booking: Hotel,
      flight: Plane, flight_booking: Plane
    };
    const Icon = map[type] || Calendar;
    return <Icon size={14} className="text-blue-500" />;
  };

  const getServiceLabel = (type) => {
    const map = {
      car_hire: 'Car Hire', car: 'Car Hire', tour: 'Tour',
      tour_package: 'Tour', hajj: 'Hajj/Umra', hajj_umra: 'Hajj/Umra',
      hotel: 'Hotel', hotel_booking: 'Hotel', flight: 'Flight', flight_booking: 'Flight'
    };
    return map[type] || 'Booking';
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: '📌 Confirmed', color: 'bg-blue-100 text-blue-800' },
      completed: { label: '✅ Completed', color: 'bg-green-100 text-green-800' },
      cancelled: { label: '❌ Cancelled', color: 'bg-red-100 text-red-800' }
    };
    return map[status] || { label: status || 'N/A', color: 'bg-gray-100 text-gray-800' };
  };

  const services = [
    { key: 'car-bookings', label: 'Car Hire', icon: Car, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { key: 'my-fleet', label: 'My Fleet', icon: Truck, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { key: 'tour-bookings', label: 'Tours', icon: Compass, color: 'bg-green-50 text-green-600 border-green-200' },
    { key: 'hajj-bookings', label: 'Hajj / Umra', icon: MapPin, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { key: 'hotel-bookings', label: 'Hotels', icon: Hotel, color: 'bg-orange-50 text-orange-600 border-orange-200' },
    { key: 'flight-bookings', label: 'Flights', icon: Plane, color: 'bg-indigo-50 text-indigo-600 border-indigo-200' }
  ];

  const handleSelectService = (key) => {
    setShowNewBookingModal(false);
    if (setActiveTab) setActiveTab(key);
  };

  const displayBookings = showAllHistory ? allMyBookings : todayBookings;

  // ✅ Frontend-computed base totals (overrides backend's totalSales/totalDebt which include commission)
  const todaySalesBase = todayBookings.reduce((sum, b) => sum + baseTotal(b), 0);
  const todayCollectedBase = todayBookings.reduce((sum, b) => sum + (b.paidAmount || 0), 0);
  const todayDebtBase = todayBookings.reduce((sum, b) => sum + baseOutstanding(b), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2
          ${notification.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'}`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-sm">{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="ml-2">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sales Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Welcome, {currentUser?.name || 'Broker'} — your bookings and sales
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowNewBookingModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
          >
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      {/* Today's Sales Cards — all base money */}
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-gray-600 mb-3">Today's Sales</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-600">
              <Calendar size={18} />
              <span className="text-xs">Today's Bookings</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{todayStats.totalBookings}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-green-600">
              <DollarSign size={18} />
              <span className="text-xs">Today's Sales</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{fmt(todaySalesBase)}</p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-purple-600">
              <Receipt size={18} />
              <span className="text-xs">Collected</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{fmt(todayCollectedBase)}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle size={18} />
              <span className="text-xs">Outstanding</span>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-1">{fmt(todayDebtBase)}</p>
          </div>
        </div>
      </div>

      {/* Status Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-lg p-3">
          <p className="text-xs text-gray-400">⏳ Pending</p>
          <p className="text-lg font-bold text-yellow-600">{todayStats.pendingCount}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-3">
          <p className="text-xs text-gray-400">📌 Confirmed</p>
          <p className="text-lg font-bold text-blue-600">{todayStats.confirmedCount}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-3">
          <p className="text-xs text-gray-400">✅ Completed</p>
          <p className="text-lg font-bold text-green-600">{todayStats.completedCount}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-3">
          <p className="text-xs text-gray-400">❌ Cancelled</p>
          <p className="text-lg font-bold text-red-600">{todayStats.cancelledCount}</p>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">
            {showAllHistory ? 'All My Bookings' : "Today's Bookings"}
            <span className="text-xs text-gray-400 ml-2">({displayBookings.length})</span>
          </h2>
          <button
            onClick={() => setShowAllHistory(!showAllHistory)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            {showAllHistory ? 'Show Today Only' : 'View Full History'}
            <ArrowRight size={12} />
          </button>
        </div>

        {displayBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              {showAllHistory ? 'You have no bookings yet' : 'No bookings made today'}
            </p>
            <button
              onClick={() => setShowNewBookingModal(true)}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
            >
              Create Your First Booking
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Ref</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Customer</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Service</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Total</th>
                  <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase">O/S</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {displayBookings.map((b) => {
                  const badge = getStatusBadge(b.status);
                  const bOutstanding = baseOutstanding(b);
                  return (
                    <tr key={b.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-xs font-mono text-gray-600">{b.reference}</td>
                      <td className="px-3 py-3">
                        <p className="text-sm font-medium text-gray-800">{b.customerName}</p>
                        <p className="text-xs text-gray-400">{b.customerPhone || ''}</p>
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          {getServiceIcon(b.serviceType)}
                          {getServiceLabel(b.serviceType)}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">{fmtDate(b.createdAt)}</td>
                      <td className="px-3 py-3 text-right text-sm font-semibold text-blue-600">
                        {fmt(baseTotal(b))}
                      </td>
                      <td className="px-3 py-3 text-right text-xs">
                        {bOutstanding > 0 ? (
                          <span className="text-red-600 font-medium">{fmt(bOutstanding)}</span>
                        ) : (
                          <span className="text-green-600">Paid</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button
                          onClick={() => {
                            setSelectedBooking(b);
                            setShowDetailModal(true);
                          }}
                          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Booking — Service Chooser Modal */}
      {showNewBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="absolute inset-0" onClick={() => setShowNewBookingModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">New Booking</h2>
                <p className="text-xs text-gray-500">Choose a service to book for your client</p>
              </div>
              <button
                onClick={() => setShowNewBookingModal(false)}
                className="p-1.5 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-3">
              {services.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.key}
                    onClick={() => handleSelectService(s.key)}
                    className={`flex flex-col items-center justify-center gap-2 p-5 border-2 rounded-xl hover:shadow-md transition ${s.color}`}
                  >
                    <Icon size={28} />
                    <span className="text-sm font-semibold">{s.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="px-6 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <p className="text-[11px] text-gray-500 text-center">
                ℹ️ Your booking will be attributed to you and visible to the Fleet Manager for confirmation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="absolute inset-0" onClick={() => setShowDetailModal(false)}></div>
          <div className="relative bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between text-white">
              <div>
                <h2 className="text-lg font-semibold">Booking Details</h2>
                <p className="text-sm text-blue-100">{selectedBooking.reference}</p>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                <div>
                  <span className="text-xs text-gray-500">Customer:</span>
                  <span className="text-sm font-medium"> {selectedBooking.customerName}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Phone:</span>
                  <span className="text-sm font-medium"> {selectedBooking.customerPhone || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Email:</span>
                  <span className="text-sm font-medium"> {selectedBooking.customerEmail || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Service:</span>
                  <span className="text-sm font-medium"> {getServiceLabel(selectedBooking.serviceType)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                <div>
                  <span className="text-xs text-gray-500">Total:</span>
                  <span className="text-sm font-bold text-blue-600"> {fmt(baseTotal(selectedBooking))}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Paid:</span>
                  <span className="text-sm font-medium text-green-600"> {fmt(selectedBooking.paidAmount)}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-500">Outstanding:</span>
                  <span className={`text-sm font-bold ${baseOutstanding(selectedBooking) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {' '}{fmt(baseOutstanding(selectedBooking))}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Payment Method:</span>
                  <span className="text-sm font-medium"> {selectedBooking.paymentMethod || 'CASH'}</span>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Status:</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusBadge(selectedBooking.status).color}`}>
                    {getStatusBadge(selectedBooking.status).label}
                  </span>
                </div>
              </div>
              {selectedBooking.notes && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500">Notes</p>
                  <p className="text-sm text-gray-700 mt-1">{selectedBooking.notes}</p>
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-3 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
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

export default BrokerDashboard;