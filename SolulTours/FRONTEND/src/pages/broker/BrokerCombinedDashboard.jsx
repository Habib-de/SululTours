import React, { useState, useEffect } from 'react';
import {
  Car, Calendar, DollarSign, Clock, CheckCircle, XCircle,
  AlertCircle, Shield, Wrench, TrendingUp, TrendingDown,
  Wallet, Tag, ArrowRight, RefreshCw, X, Eye, BarChart3,
  Users, Package, Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  vehicleService,
  carOwnerService,
  bookingService,
  complianceService,
  maintenanceService,
  expenseService
} from '../../services/api';

const BrokerCombinedDashboard = ({ setActiveTab }) => {
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [ownerBookings, setOwnerBookings] = useState([]);
  const [brokerBookings, setBrokerBookings] = useState([]);
  const [complianceItems, setComplianceItems] = useState([]);
  const [maintenanceRecords, setMaintenanceRecords] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [activeTab, setActiveTabLocal] = useState('overview');

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================
  // LOAD
  // ============================================
  const loadData = async () => {
    setLoading(true);
    try {
      const tenantId = currentUser?.tenantId;

      const profileRes = await carOwnerService.getMyProfile();
      let myProfile = null;
      if (profileRes?.success && profileRes?.data) myProfile = profileRes.data;
      else if (profileRes?.id) myProfile = profileRes;

      if (!myProfile) {
        showNotification('Could not load your fleet profile', 'error');
        setLoading(false);
        return;
      }
      setProfile(myProfile);

      const vehiclesRes = await vehicleService.getByOwner(myProfile.id);
      let vehiclesData = [];
      if (vehiclesRes?.success && vehiclesRes?.data) vehiclesData = vehiclesRes.data;
      else if (Array.isArray(vehiclesRes)) vehiclesData = vehiclesRes;
      setVehicles(vehiclesData);

      const vehicleIds = vehiclesData.map(v => v.id);

      const bookingsRes = await bookingService.getAll(tenantId);
      let allBookings = [];
      if (bookingsRes?.success && bookingsRes?.data) allBookings = bookingsRes.data;
      else if (Array.isArray(bookingsRes)) allBookings = bookingsRes;

      const incoming = allBookings.filter(b => vehicleIds.includes(b.vehicleId));
      setOwnerBookings(incoming);

      const mine = allBookings.filter(b => b.userId === currentUser?.id);
      setBrokerBookings(mine);

      const complianceRes = await complianceService.getAll(tenantId);
      let allCompliance = [];
      if (complianceRes?.success && complianceRes?.data) allCompliance = complianceRes.data;
      else if (Array.isArray(complianceRes)) allCompliance = complianceRes;

      const myCompliance = allCompliance
        .filter(c => vehicleIds.includes(c.vehicleId))
        .map(item => {
          const validUntil = item.validUntil;
          const daysUntilExpiry = validUntil
            ? Math.ceil((new Date(validUntil) - new Date()) / (1000 * 60 * 60 * 24))
            : null;
          let status = 'valid';
          if (daysUntilExpiry !== null) {
            if (daysUntilExpiry < 0) status = 'expired';
            else if (daysUntilExpiry <= 30) status = 'expiring_soon';
          }
          return { ...item, status, daysUntilExpiry };
        });
      setComplianceItems(myCompliance);

      const maintRes = await maintenanceService.getAll(tenantId);
      let allMaint = [];
      if (maintRes?.success && maintRes?.data) allMaint = maintRes.data;
      else if (Array.isArray(maintRes)) allMaint = maintRes;
      setMaintenanceRecords(allMaint.filter(m => vehicleIds.includes(m.vehicleId)));

      const expRes = await expenseService.getAll(tenantId);
      let allExp = [];
      if (expRes?.success && expRes?.data) allExp = expRes.data;
      else if (Array.isArray(expRes)) allExp = expRes;
      setExpenses(allExp.filter(e => vehicleIds.includes(e.vehicleId)));

      if (vehiclesData.length > 0) {
        localStorage.setItem('broker_has_fleet', 'true');
      } else {
        localStorage.removeItem('broker_has_fleet');
      }

    } catch (err) {
      console.error('Error loading combined dashboard:', err);
      showNotification('Failed to load dashboard', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser?.id) loadData();
  }, [currentUser?.id]);

  // ============================================
  // HELPERS — base money only (no commission)
  // ============================================

  // ✅ Base total: (rate × days) − discount
  const baseTotal = (b) => {
    const base = (b.vehiclePricePerDay || 0) * (b.days || 0);
    let discount = 0;
    if (b.discountType === 'PERCENTAGE') {
      discount = base * (parseFloat(b.discountValue) || 0) / 100;
    } else if (b.discountType === 'FIXED') {
      discount = b.discountAmount || 0;
    } else {
      discount = b.discountAmount || 0;
    }
    return base - discount;
  };

  // ✅ Base outstanding: base − paid (min 0)
  const baseOutstanding = (b) => {
    const base = baseTotal(b);
    const outstanding = base - (b.paidAmount || 0);
    return outstanding > 0 ? outstanding : 0;
  };

  // ✅ Base revenue over a set of bookings (skip cancelled)
  const calcRevenue = (bookings) => {
    return bookings
      .filter(b => b.status !== 'cancelled')
      .reduce((sum, b) => sum + baseTotal(b), 0);
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

  const getVehicleStatusBadge = (status) => {
    const map = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      rented: 'bg-blue-100 text-blue-800'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  const fmt = (n) => `KSh ${(n || 0).toLocaleString()}`;

  const fmtCompact = (n) => {
    const v = Number(n) || 0;
    if (v === 0) return '0';
    const abs = Math.abs(v);
    if (abs >= 1000000) return `${(v / 1000000).toFixed(v % 1000000 === 0 ? 0 : 1)}M`;
    if (abs >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`;
    return `${v}`;
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric'
  }) : 'N/A';

  // ============================================
  // STATS — all base money
  // ============================================
  const stats = {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(v => v.status === 'active').length,
    maintenanceVehicles: vehicles.filter(v => v.status === 'maintenance').length,

    // ✅ Base-only owner revenue
    ownerRevenue: calcRevenue(ownerBookings),
    ownerBookings: ownerBookings.length,
    ownerPending: ownerBookings.filter(b => b.status === 'pending').length,
    // ✅ Base-only owner debt
    ownerDebt: ownerBookings.reduce((s, b) => s + baseOutstanding(b), 0),

    // ✅ Base-only broker revenue
    brokerRevenue: calcRevenue(brokerBookings),
    brokerBookings: brokerBookings.length,
    brokerPending: brokerBookings.filter(b => b.status === 'pending').length,

    complianceTotal: complianceItems.length,
    complianceExpired: complianceItems.filter(c => c.status === 'expired').length,
    complianceExpiring: complianceItems.filter(c => c.status === 'expiring_soon').length,
    complianceScore: complianceItems.length > 0
      ? Math.round((complianceItems.filter(c => c.status === 'valid').length / complianceItems.length) * 100)
      : 0,

    maintenanceCost: maintenanceRecords.reduce((s, m) => s + (m.cost || 0), 0),
    maintenanceActive: maintenanceRecords.filter(m => m.status === 'scheduled' || m.status === 'in_progress').length,

    totalExpenses: expenses.reduce((s, e) => s + (e.amount || 0), 0)
  };

  // ============================================
  // RENDER — Overview
  // ============================================
  const renderOverview = () => (
    <div className="space-y-3 sm:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-2 sm:gap-4">
        {/* OWNER card */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-3">
            <Car size={14} className="sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-sm font-bold sm:font-semibold uppercase sm:normal-case tracking-wide sm:tracking-normal">
              <span className="hidden sm:inline">As a </span>Owner
            </span>
          </div>
          <p className="text-base sm:text-3xl font-extrabold sm:font-bold leading-tight break-words">
            <span className="hidden sm:inline">{fmt(stats.ownerRevenue)}</span>
            <span className="sm:hidden">KSh {fmtCompact(stats.ownerRevenue)}</span>
          </p>
          <p className="text-[9px] sm:text-xs text-amber-100 mt-0.5 sm:mt-1 hidden sm:block">
            Total earnings from my vehicles
          </p>
          <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-amber-400/30">
            <div>
              <p className="text-[9px] sm:text-[10px] text-amber-100">
                <span className="hidden sm:inline">Bookings</span>
                <span className="sm:hidden">Bkgs</span>
              </p>
              <p className="text-xs sm:text-lg font-bold">{stats.ownerBookings}</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] text-amber-100">
                <span className="hidden sm:inline">Pending</span>
                <span className="sm:hidden">Pend</span>
              </p>
              <p className="text-xs sm:text-lg font-bold">{stats.ownerPending}</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] text-amber-100">
                <span className="hidden sm:inline">Debt O/S</span>
                <span className="sm:hidden">Debt</span>
              </p>
              <p className="text-xs sm:text-lg font-bold truncate">
                <span className="hidden sm:inline">{fmt(stats.ownerDebt)}</span>
                <span className="sm:hidden">{fmtCompact(stats.ownerDebt)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* BROKER card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl p-3 sm:p-5 text-white shadow-lg">
          <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-3">
            <Users size={14} className="sm:w-5 sm:h-5" />
            <span className="text-[10px] sm:text-sm font-bold sm:font-semibold uppercase sm:normal-case tracking-wide sm:tracking-normal">
              <span className="hidden sm:inline">As a </span>Broker
            </span>
          </div>
          <p className="text-base sm:text-3xl font-extrabold sm:font-bold leading-tight break-words">
            <span className="hidden sm:inline">{fmt(stats.brokerRevenue)}</span>
            <span className="sm:hidden">KSh {fmtCompact(stats.brokerRevenue)}</span>
          </p>
          <p className="text-[9px] sm:text-xs text-blue-100 mt-0.5 sm:mt-1 hidden sm:block">
            Total sales I created
          </p>
          <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-2 sm:mt-4 pt-2 sm:pt-4 border-t border-blue-400/30">
            <div>
              <p className="text-[9px] sm:text-[10px] text-blue-100">
                <span className="hidden sm:inline">Bookings</span>
                <span className="sm:hidden">Bkgs</span>
              </p>
              <p className="text-xs sm:text-lg font-bold">{stats.brokerBookings}</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] text-blue-100">
                <span className="hidden sm:inline">Pending</span>
                <span className="sm:hidden">Pend</span>
              </p>
              <p className="text-xs sm:text-lg font-bold">{stats.brokerPending}</p>
            </div>
            <div>
              <p className="text-[9px] sm:text-[10px] text-blue-100">
                <span className="hidden sm:inline">Vehicles</span>
                <span className="sm:hidden">Cars</span>
              </p>
              <p className="text-xs sm:text-lg font-bold">{stats.totalVehicles}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet overview */}
      <div>
        <h2 className="text-xs sm:text-sm font-bold sm:font-semibold text-gray-700 mb-2 sm:mb-3 uppercase sm:normal-case tracking-wide sm:tracking-normal">
          My Fleet
        </h2>
        {vehicles.length === 0 ? (
          <div className="text-center py-6 sm:py-8 bg-white rounded-xl border border-gray-100">
            <Car size={32} className="sm:w-10 sm:h-10 mx-auto text-gray-300 mb-1 sm:mb-2" />
            <p className="text-xs sm:text-base font-medium sm:font-normal text-gray-500">No vehicles in your fleet yet</p>
            <button
              onClick={() => setActiveTab('my-fleet')}
              className="mt-1 sm:mt-2 text-[10px] sm:text-xs font-bold sm:font-normal text-amber-600 hover:underline"
            >
              Add your first vehicle →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {vehicles.slice(0, 4).map(v => {
              const bookingsForVehicle = ownerBookings.filter(b => b.vehicleId === v.id);
              const hasActive = bookingsForVehicle.some(b => b.status === 'pending' || b.status === 'confirmed');
              return (
                <div key={v.id} className={`p-2.5 sm:p-3 rounded-xl border flex items-center justify-between ${
                  hasActive ? 'bg-red-50 border-red-200' :
                  v.status === 'active' ? 'bg-green-50 border-green-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      hasActive ? 'bg-red-100 text-red-600' :
                      v.status === 'active' ? 'bg-green-100 text-green-600' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      <Car size={14} className="sm:w-[18px] sm:h-[18px]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold sm:font-semibold text-gray-800 truncate">{v.registration}</p>
                      <p className="text-[10px] sm:text-xs text-gray-500 truncate">{v.make} {v.model}</p>
                      <span className="text-[9px] sm:text-[10px] font-bold sm:font-normal text-gray-400">
                        {hasActive ? '🔴 Booked' : v.status === 'active' ? '✅ Available' : `⏳ ${v.status}`}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-1 sm:ml-2">
                    <span className={`text-[9px] sm:text-[10px] font-bold sm:font-normal px-1.5 sm:px-2 py-0.5 rounded-full ${getVehicleStatusBadge(v.status)}`}>
                      {v.status}
                    </span>
                  </div>
                </div>
              );
            })}
            {vehicles.length > 4 && (
              <button
                onClick={() => setActiveTab('my-fleet')}
                className="text-[10px] sm:text-xs font-bold sm:font-normal text-amber-600 text-center py-2 border border-dashed border-gray-300 rounded-xl hover:border-amber-400 transition-colors"
              >
                + {vehicles.length - 4} more vehicles →
              </button>
            )}
          </div>
        )}
      </div>

      {/* Compliance alerts */}
      {(stats.complianceExpired > 0 || stats.complianceExpiring > 0) && (
        <div className={`rounded-xl p-2.5 sm:p-4 border flex items-center sm:items-start gap-2 sm:gap-3 ${
          stats.complianceExpired > 0 ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'
        }`}>
          <Shield size={16} className="sm:w-5 sm:h-5 flex-shrink-0 sm:mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] sm:text-sm font-bold sm:font-semibold">
              {stats.complianceExpired > 0 ? '⚠️ Expired docs' : '⚠️ Expiring soon'}
            </p>
            <p className="text-[9px] sm:text-xs mt-0.5 hidden sm:block">
              {stats.complianceExpired > 0
                ? `${stats.complianceExpired} compliance item(s) are expired.`
                : `${stats.complianceExpiring} compliance item(s) will expire within 30 days.`}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('my-fleet')}
            className="text-[10px] sm:text-xs font-bold sm:font-normal text-blue-600 hover:underline flex-shrink-0"
          >
            View →
          </button>
        </div>
      )}

      {/* Quick navigation */}
      <div>
        <h2 className="text-xs sm:text-sm font-bold sm:font-semibold text-gray-700 mb-2 sm:mb-3 uppercase sm:normal-case tracking-wide sm:tracking-normal">
          Quick Actions
        </h2>
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          <button onClick={() => setActiveTab('my-fleet')} className="bg-white border border-gray-200 rounded-xl py-2 sm:p-3 text-center hover:shadow-md active:scale-95 sm:active:scale-100 transition-all">
            <Car size={16} className="sm:w-5 sm:h-5 mx-auto text-amber-500" />
            <p className="text-[10px] sm:text-xs font-bold sm:font-medium text-gray-700 mt-0.5 sm:mt-1 leading-tight">
              <span className="hidden sm:inline">My Fleet</span>
              <span className="sm:hidden">Fleet</span>
            </p>
          </button>
          <button onClick={() => setActiveTab('car-bookings')} className="bg-white border border-gray-200 rounded-xl py-2 sm:p-3 text-center hover:shadow-md active:scale-95 sm:active:scale-100 transition-all">
            <Calendar size={16} className="sm:w-5 sm:h-5 mx-auto text-blue-500" />
            <p className="text-[10px] sm:text-xs font-bold sm:font-medium text-gray-700 mt-0.5 sm:mt-1 leading-tight">
              <span className="hidden sm:inline">My Bookings</span>
              <span className="sm:hidden">Bkgs</span>
            </p>
          </button>
          <button onClick={() => setActiveTab('notifications')} className="bg-white border border-gray-200 rounded-xl py-2 sm:p-3 text-center hover:shadow-md active:scale-95 sm:active:scale-100 transition-all">
            <Clock size={16} className="sm:w-5 sm:h-5 mx-auto text-purple-500" />
            <p className="text-[10px] sm:text-xs font-bold sm:font-medium text-gray-700 mt-0.5 sm:mt-1 leading-tight">
              <span className="hidden sm:inline">Notifications</span>
              <span className="sm:hidden">Alerts</span>
            </p>
          </button>
          <button onClick={() => setActiveTab('car-bookings')} className="bg-white border border-gray-200 rounded-xl py-2 sm:p-3 text-center hover:shadow-md active:scale-95 sm:active:scale-100 transition-all">
            <PlusIcon />
            <p className="text-[10px] sm:text-xs font-bold sm:font-medium text-gray-700 mt-0.5 sm:mt-1 leading-tight">
              <span className="hidden sm:inline">New Booking</span>
              <span className="sm:hidden">New</span>
            </p>
          </button>
        </div>
      </div>
    </div>
  );

  // ============================================
  // RENDER — Vehicles
  // ============================================
  const renderVehicles = () => (
    <div className="space-y-2 sm:space-y-3">
      {vehicles.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-white rounded-xl border border-gray-100">
          <Car size={36} className="sm:w-12 sm:h-12 mx-auto text-gray-300 mb-2 sm:mb-3" />
          <p className="text-xs sm:text-base font-medium sm:font-normal text-gray-500">No vehicles</p>
          <button onClick={() => setActiveTab('my-fleet')} className="mt-1 sm:mt-2 text-[10px] sm:text-xs font-bold sm:font-normal text-amber-600 hover:underline">
            Add a vehicle →
          </button>
        </div>
      ) : (
        vehicles.map(v => {
          const vBookings = ownerBookings.filter(b => b.vehicleId === v.id);
          // ✅ Base-only per-vehicle revenue
          const vRevenue = calcRevenue(vBookings);
          // ✅ Base-only per-vehicle debt
          const vDebt = vBookings.reduce((s, b) => s + baseOutstanding(b), 0);
          return (
            <div key={v.id} className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <Car size={16} className="sm:w-[22px] sm:h-[22px] text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold sm:font-semibold text-gray-800 truncate">{v.registration}</p>
                    <p className="text-[10px] sm:text-xs text-gray-500 truncate">{v.make} {v.model} • {v.year || 'N/A'}</p>
                    <p className="text-[9px] sm:text-[10px] font-bold sm:font-normal text-gray-400">KSh {(v.pricePerDay || 0).toLocaleString()}/day</p>
                  </div>
                </div>
                <span className={`text-[9px] sm:text-[10px] font-bold sm:font-normal px-1.5 sm:px-2 py-0.5 rounded-full ${getVehicleStatusBadge(v.status)} flex-shrink-0`}>
                  {v.status}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-100 text-center">
                <div>
                  <p className="text-[9px] sm:text-[10px] text-gray-500">
                    <span className="hidden sm:inline">Bookings</span>
                    <span className="sm:hidden">Bkgs</span>
                  </p>
                  <p className="text-xs sm:text-sm font-bold text-blue-600">{vBookings.length}</p>
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] text-gray-500">Revenue</p>
                  <p className="text-xs sm:text-sm font-bold text-green-600 truncate">
                    <span className="hidden sm:inline">{fmt(vRevenue)}</span>
                    <span className="sm:hidden">{fmtCompact(vRevenue)}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[9px] sm:text-[10px] text-gray-500">Debt</p>
                  <p className={`text-xs sm:text-sm font-bold truncate ${vDebt > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    <span className="hidden sm:inline">{fmt(vDebt)}</span>
                    <span className="sm:hidden">{fmtCompact(vDebt)}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ============================================
  // RENDER — Incoming bookings
  // ============================================
  const renderIncomingBookings = () => (
    <div className="space-y-2">
      <p className="text-[10px] sm:text-xs text-gray-500 mb-1 sm:mb-2">
        ℹ️ Bookings made on <strong>your vehicles</strong>
      </p>
      {ownerBookings.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-white rounded-xl border border-gray-100">
          <Calendar size={36} className="sm:w-10 sm:h-10 mx-auto text-gray-300 mb-2 sm:mb-3" />
          <p className="text-xs sm:text-base font-medium sm:font-normal text-gray-500">No bookings yet</p>
        </div>
      ) : (
        ownerBookings.map(b => {
          const statusBadge = getStatusBadge(b.status);
          // ✅ Base-only booking amount
          const bBase = baseTotal(b);
          return (
            <div key={b.id} className="bg-white border border-gray-100 rounded-xl p-2.5 sm:p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold sm:font-medium text-gray-800 truncate">{b.customerName || 'Customer'}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                    {b.vehicleRegistration || 'Vehicle'} • {b.days || 0}d
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-gray-400">
                    {formatDate(b.startDate)} → {formatDate(b.endDate)}
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-1 sm:ml-2">
                  <span className={`text-[9px] sm:text-[10px] font-bold sm:font-normal px-1.5 sm:px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-green-600 mt-1">
                    <span className="hidden sm:inline">{fmt(bBase)}</span>
                    <span className="sm:hidden">{fmtCompact(bBase)}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  // ============================================
  // RENDER — Compliance
  // ============================================
  const renderCompliance = () => (
    <div className="space-y-2 sm:space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-2 sm:p-3 text-center">
          <p className="text-[9px] sm:text-[10px] text-gray-500">Valid</p>
          <p className="text-sm sm:text-lg font-bold text-green-600">
            {complianceItems.filter(c => c.status === 'valid').length}
          </p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-2 sm:p-3 text-center">
          <p className="text-[9px] sm:text-[10px] text-gray-500">Expiring</p>
          <p className="text-sm sm:text-lg font-bold text-orange-600">{stats.complianceExpiring}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-2 sm:p-3 text-center">
          <p className="text-[9px] sm:text-[10px] text-gray-500">Expired</p>
          <p className="text-sm sm:text-lg font-bold text-red-600">{stats.complianceExpired}</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 sm:p-3 flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-blue-800">
        <Info size={12} className="sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
        <p>Compliance is managed by your Fleet Manager. View-only here.</p>
      </div>

      {complianceItems.length === 0 ? (
        <div className="text-center py-6 sm:py-8 bg-white rounded-xl border border-gray-100">
          <Shield size={32} className="sm:w-10 sm:h-10 mx-auto text-gray-300 mb-1 sm:mb-2" />
          <p className="text-xs sm:text-base font-medium sm:font-normal text-gray-500">No documents yet</p>
        </div>
      ) : (
        complianceItems.map(c => (
          <div key={c.id} className="bg-white border border-gray-100 rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold sm:font-medium text-gray-800 truncate">{c.type}</p>
              <p className="text-[10px] sm:text-xs text-gray-500 truncate">{c.vehicleLabel || c.vehicleId}</p>
              <p className="text-[9px] sm:text-[10px] text-gray-400">Expires: {formatDate(c.validUntil)}</p>
            </div>
            <span className={`text-[9px] sm:text-[10px] font-bold sm:font-normal px-1.5 sm:px-2 py-0.5 rounded-full flex-shrink-0 ${
              c.status === 'expired' ? 'bg-red-100 text-red-800' :
              c.status === 'expiring_soon' ? 'bg-orange-100 text-orange-800' :
              'bg-green-100 text-green-800'
            }`}>
              {c.status === 'expired' ? '❌' :
               c.status === 'expiring_soon' ? `⚠️ ${c.daysUntilExpiry}d` :
               '✅'}
            </span>
          </div>
        ))
      )}
    </div>
  );

  // ============================================
  // RENDER — Maintenance
  // ============================================
  const renderMaintenance = () => (
    <div className="space-y-2 sm:space-y-4">
      <div className="bg-white border border-gray-100 rounded-xl p-3 sm:p-4">
        <p className="text-[10px] sm:text-sm text-gray-600">Total maintenance cost</p>
        <p className="text-lg sm:text-2xl font-bold text-purple-600">
          <span className="hidden sm:inline">{fmt(stats.maintenanceCost)}</span>
          <span className="sm:hidden">KSh {fmtCompact(stats.maintenanceCost)}</span>
        </p>
        <p className="text-[10px] sm:text-xs text-gray-500">{stats.maintenanceActive} active record(s)</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-2 sm:p-3 flex items-start gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-blue-800">
        <Info size={12} className="sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" />
        <p>Maintenance records are managed by your Fleet Manager.</p>
      </div>

      {maintenanceRecords.length === 0 ? (
        <div className="text-center py-6 sm:py-8 bg-white rounded-xl border border-gray-100">
          <Wrench size={32} className="sm:w-10 sm:h-10 mx-auto text-gray-300 mb-1 sm:mb-2" />
          <p className="text-xs sm:text-base font-medium sm:font-normal text-gray-500">No records yet</p>
        </div>
      ) : (
        maintenanceRecords.map(m => (
          <div key={m.id} className="bg-white border border-gray-100 rounded-xl p-2.5 sm:p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold sm:font-medium text-gray-800 truncate">{m.maintenanceType || 'Service'}</p>
                <p className="text-[10px] sm:text-xs text-gray-500 truncate">{m.description || 'No description'}</p>
                <p className="text-[9px] sm:text-[10px] text-gray-400">{formatDate(m.date)}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs sm:text-sm font-bold text-purple-600">
                  <span className="hidden sm:inline">{fmt(m.cost)}</span>
                  <span className="sm:hidden">{fmtCompact(m.cost)}</span>
                </p>
                <span className="text-[9px] sm:text-[10px] text-gray-500">{m.status}</span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw size={28} className="sm:w-8 sm:h-8 mx-auto text-amber-500 animate-spin" />
          <p className="mt-2 text-xs sm:text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-3 sm:px-4 py-2 sm:py-3 rounded-lg shadow-2xl flex items-center gap-2 max-w-[90vw] sm:max-w-none ${
          notification.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={16} className="sm:w-[18px] sm:h-[18px]" /> : <CheckCircle size={16} className="sm:w-[18px] sm:h-[18px]" />}
          <span className="text-xs sm:text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-1 sm:ml-2">
            <X size={14} className="sm:w-4 sm:h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-6 gap-2 sm:gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">My Business Dashboard</h1>
          <p className="text-[11px] sm:text-sm text-gray-500 mt-0.5 sm:mt-1 truncate">
            <span className="font-bold sm:font-semibold text-blue-600">Broker</span>
            {' + '}
            <span className="font-bold sm:font-semibold text-amber-600">Car Owner</span>
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg flex-shrink-0"
          title="Refresh"
        >
          <RefreshCw size={16} className={`sm:w-[18px] sm:h-[18px] ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-3 sm:mb-6 flex gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
        {[
          { id: 'overview', label: 'Overview', labelMobile: 'Overview', icon: BarChart3 },
          { id: 'vehicles', label: 'My Fleet', labelMobile: 'Fleet', icon: Car },
          { id: 'incoming', label: 'Bookings on My Vehicles', labelMobile: 'Bkgs', icon: Calendar },
          { id: 'compliance', label: 'Compliance', labelMobile: 'Compl.', icon: Shield },
          { id: 'maintenance', label: 'Maintenance', labelMobile: 'Repairs', icon: Wrench }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTabLocal(tab.id)}
            className={`px-2.5 sm:px-4 py-1.5 sm:py-2 text-[11px] sm:text-sm font-bold sm:font-medium rounded-t-lg whitespace-nowrap flex items-center gap-1 sm:gap-1.5 transition-colors ${
              activeTab === tab.id
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-600'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <tab.icon size={12} className="sm:w-[14px] sm:h-[14px]" />
            <span className="hidden sm:inline">{tab.label}</span>
            <span className="sm:hidden">{tab.labelMobile}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'vehicles' && renderVehicles()}
        {activeTab === 'incoming' && renderIncomingBookings()}
        {activeTab === 'compliance' && renderCompliance()}
        {activeTab === 'maintenance' && renderMaintenance()}
      </div>

      <div className="mt-4 sm:mt-6 text-center text-[9px] sm:text-[10px] text-gray-400 border-t border-gray-200 pt-3 sm:pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

// Small inline helper icon
const PlusIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="sm:w-5 sm:h-5 mx-auto text-green-500"
  >
    <line x1="12" y1="5" x2="12" y2="19"></line>
    <line x1="5" y1="12" x2="19" y2="12"></line>
  </svg>
);

export default BrokerCombinedDashboard;