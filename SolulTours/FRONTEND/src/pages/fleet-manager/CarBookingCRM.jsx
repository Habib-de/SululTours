import React, { useState, useEffect } from 'react';
import { 
  Users, Search, Filter, RefreshCw, 
  Eye, CheckCircle, XCircle, Clock, 
  AlertCircle, User, Car, DollarSign,
  Phone, Mail, Edit2, Trash2, Plus,
  X, CreditCard, Wallet, Calendar,
  Award, TrendingUp, UserCheck, UserX,
  MessageCircle, Download, FileText, Save, UserPlus,
  Compass, MapPin, Hotel, Plane, Headphones,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingService } from '../../services/api';
import toast from 'react-hot-toast';

const CarBookingCRM = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'ADMIN';
  
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [tenantId, setTenantId] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'CASH',
    mpesaCode: '',
    notes: ''
  });
  const [processing, setProcessing] = useState(false);

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    idNumber: '',
    address: '',
    notes: ''
  });

  // Filter states
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCredit, setFilterCredit] = useState('all');
  const [filterBookings, setFilterBookings] = useState('all');
  const [filterService, setFilterService] = useState('all');

  useEffect(() => {
    const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
    const tid = userData?.tenantId || null;
    console.log('🔍 Tenant ID from localStorage:', tid);
    setTenantId(tid);
    loadData(tid);
  }, []);

  // Auto-select customer when navigating from CarBookings
  useEffect(() => {
    const customerName = localStorage.getItem('selected_crm_customer');
    if (customerName && customers.length > 0) {
      const customer = customers.find(c => c.name === customerName);
      if (customer) {
        setSelectedCustomer(customer);
        setShowCustomerDetailModal(true);
        localStorage.removeItem('selected_crm_customer');
      }
    }
  }, [customers]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async (tid) => {
    setLoading(true);
    
    try {
      const tenantToUse = tid || tenantId;
      console.log('🔍 Loading CRM data with tenantId:', tenantToUse);
      
      if (!tenantToUse) {
        console.warn('⚠️ No tenantId available, skipping API call');
        setLoading(false);
        return;
      }
      
      // ✅ Get all bookings for the tenant
      const response = await bookingService.getAll(tenantToUse);
      console.log('📊 Bookings response:', response);
      
      let bookingsData = [];
      if (response?.success && response?.data) {
        bookingsData = response.data;
      } else if (Array.isArray(response)) {
        bookingsData = response;
      }
      
      setBookings(bookingsData);
      
      // ✅ Build customer map from bookings
      const customerMap = new Map();
      
      bookingsData.forEach(booking => {
        const customerName = booking.customerName || booking.customer_name || 'Unknown';
        
        if (!customerMap.has(customerName)) {
          customerMap.set(customerName, {
            id: customerName.replace(/\s+/g, '_').toLowerCase(),
            name: customerName,
            email: booking.customerEmail || booking.customer_email || '',
            phone: booking.customerPhone || booking.customer_phone || '',
            idNumber: booking.customerIdNumber || booking.customer_id_number || '',
            totalBookings: 0,
            totalSpent: 0,
            creditBalance: 0,
            lastBookingDate: null,
            bookings: [],
            status: 'active',
            serviceBreakdown: {
              carHire: 0,
              tours: 0,
              hajj: 0,
              hotels: 0,
              flights: 0,
              consultancy: 0
            },
            serviceRevenue: {
              carHire: 0,
              tours: 0,
              hajj: 0,
              hotels: 0,
              flights: 0,
              consultancy: 0
            }
          });
        }
        
        const customer = customerMap.get(customerName);
        const serviceType = booking.serviceType || booking.service_type || 'car_hire';
        const amount = booking.totalPrice || booking.total_price || 0;
        
        // Count by service type
        if (serviceType === 'car_hire' || serviceType === 'car') {
          customer.serviceBreakdown.carHire += 1;
          customer.serviceRevenue.carHire += amount;
        } else if (serviceType === 'tour' || serviceType === 'tours' || serviceType === 'Tour') {
          customer.serviceBreakdown.tours += 1;
          customer.serviceRevenue.tours += amount;
        } else if (serviceType === 'hajj' || serviceType === 'hajj_umra' || serviceType === 'Hajj') {
          customer.serviceBreakdown.hajj += 1;
          customer.serviceRevenue.hajj += amount;
        } else if (serviceType === 'hotel' || serviceType === 'hotels' || serviceType === 'Hotel') {
          customer.serviceBreakdown.hotels += 1;
          customer.serviceRevenue.hotels += amount;
        } else if (serviceType === 'flight' || serviceType === 'flights' || serviceType === 'Flight') {
          customer.serviceBreakdown.flights += 1;
          customer.serviceRevenue.flights += amount;
        } else if (serviceType === 'consultancy' || serviceType === 'Consultancy') {
          customer.serviceBreakdown.consultancy += 1;
          customer.serviceRevenue.consultancy += amount;
        }
        
        customer.totalBookings += 1;
        customer.totalSpent += amount;
        customer.creditBalance += (booking.remainingBalance || 0);
        
        customer.bookings.push({
          ...booking,
          serviceType: serviceType
        });
        
        if (!customer.lastBookingDate || new Date(booking.createdAt) > new Date(customer.lastBookingDate)) {
          customer.lastBookingDate = booking.createdAt;
        }
      });
      
      setCustomers(Array.from(customerMap.values()));
      
    } catch (error) {
      console.error('Error loading CRM data:', error);
      showNotification('Error loading data', 'error');
      // Fallback to localStorage
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  // Fallback to localStorage
  const loadFromLocalStorage = () => {
    try {
      const storedBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      setBookings(storedBookings);
      
      const customerMap = new Map();
      
      storedBookings.forEach(booking => {
        const customerName = booking.customerName || booking.customer_name || 'Unknown';
        
        if (!customerMap.has(customerName)) {
          customerMap.set(customerName, {
            id: customerName.replace(/\s+/g, '_').toLowerCase(),
            name: customerName,
            email: booking.customerEmail || booking.customer_email || '',
            phone: booking.customerPhone || booking.customer_phone || '',
            idNumber: booking.customerIdNumber || booking.customer_id_number || '',
            totalBookings: 0,
            totalSpent: 0,
            creditBalance: 0,
            lastBookingDate: null,
            bookings: [],
            status: 'active',
            serviceBreakdown: {
              carHire: 0,
              tours: 0,
              hajj: 0,
              hotels: 0,
              flights: 0,
              consultancy: 0
            },
            serviceRevenue: {
              carHire: 0,
              tours: 0,
              hajj: 0,
              hotels: 0,
              flights: 0,
              consultancy: 0
            }
          });
        }
        
        const customer = customerMap.get(customerName);
        const serviceType = booking.serviceType || booking.service_type || 'car_hire';
        const amount = booking.totalPrice || booking.total_price || 0;
        
        if (serviceType === 'car_hire' || serviceType === 'car') {
          customer.serviceBreakdown.carHire += 1;
          customer.serviceRevenue.carHire += amount;
        } else if (serviceType === 'tour' || serviceType === 'tours') {
          customer.serviceBreakdown.tours += 1;
          customer.serviceRevenue.tours += amount;
        } else if (serviceType === 'hajj' || serviceType === 'hajj_umra') {
          customer.serviceBreakdown.hajj += 1;
          customer.serviceRevenue.hajj += amount;
        } else if (serviceType === 'hotel' || serviceType === 'hotels') {
          customer.serviceBreakdown.hotels += 1;
          customer.serviceRevenue.hotels += amount;
        } else if (serviceType === 'flight' || serviceType === 'flights') {
          customer.serviceBreakdown.flights += 1;
          customer.serviceRevenue.flights += amount;
        } else if (serviceType === 'consultancy') {
          customer.serviceBreakdown.consultancy += 1;
          customer.serviceRevenue.consultancy += amount;
        }
        
        customer.totalBookings += 1;
        customer.totalSpent += amount;
        customer.creditBalance += (booking.remainingBalance || 0);
        
        customer.bookings.push({
          ...booking,
          serviceType: serviceType
        });
        
        if (!customer.lastBookingDate || new Date(booking.createdAt) > new Date(customer.lastBookingDate)) {
          customer.lastBookingDate = booking.createdAt;
        }
      });
      
      setCustomers(Array.from(customerMap.values()));
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  };

  const generateId = () => {
    return `cust_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  };

  const handleAddCustomer = () => {
    if (!newCustomer.name.trim()) {
      showNotification('Please enter customer name', 'error');
      return;
    }

    if (customers.some(c => c.name.toLowerCase() === newCustomer.name.toLowerCase())) {
      showNotification('Customer already exists!', 'error');
      return;
    }

    const customer = {
      id: generateId(),
      name: newCustomer.name,
      email: newCustomer.email || '',
      phone: newCustomer.phone || '',
      idNumber: newCustomer.idNumber || '',
      address: newCustomer.address || '',
      notes: newCustomer.notes || '',
      totalBookings: 0,
      totalSpent: 0,
      creditBalance: 0,
      lastBookingDate: null,
      bookings: [],
      status: 'active',
      serviceBreakdown: {
        carHire: 0,
        tours: 0,
        hajj: 0,
        hotels: 0,
        flights: 0,
        consultancy: 0
      },
      serviceRevenue: {
        carHire: 0,
        tours: 0,
        hajj: 0,
        hotels: 0,
        flights: 0,
        consultancy: 0
      },
      createdAt: new Date().toISOString()
    };

    setCustomers([customer, ...customers]);
    setShowAddCustomerModal(false);
    setNewCustomer({ name: '', phone: '', email: '', idNumber: '', address: '', notes: '' });
    showNotification(`✅ Customer ${customer.name} added successfully!`);
  };

  const handleDeleteCustomer = (customer) => {
    if (customer.totalBookings > 0) {
      showNotification(`❌ Cannot delete "${customer.name}" - they have ${customer.totalBookings} booking(s).`, 'error');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${customer.name}"?`)) {
      return;
    }

    const updated = customers.filter(c => c.id !== customer.id);
    setCustomers(updated);
    setShowDeleteModal(false);
    setSelectedCustomer(null);
    showNotification(`✅ Customer "${customer.name}" deleted successfully!`);
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) {
      showNotification('Please enter a valid payment amount', 'error');
      return;
    }

    const amount = parseFloat(paymentForm.amount);
    if (amount > selectedCustomer.creditBalance) {
      showNotification(`Amount exceeds credit balance of KES ${selectedCustomer.creditBalance}`, 'error');
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
      // Update bookings with payments
      let remainingAmount = amount;
      const updatedBookings = bookings.map(b => {
        if (b.customerName === selectedCustomer.name && b.remainingBalance > 0 && remainingAmount > 0) {
          const paymentAmount = Math.min(remainingAmount, b.remainingBalance);
          const newPaidAmount = (b.paidAmount || 0) + paymentAmount;
          const newRemainingBalance = b.totalPrice - newPaidAmount;
          const newPaymentStatus = newRemainingBalance <= 0 ? 'PAID' : 'PARTIAL';
          
          remainingAmount -= paymentAmount;
          
          const updatedBooking = {
            ...b,
            paidAmount: newPaidAmount,
            remainingBalance: newRemainingBalance,
            paymentStatus: newPaymentStatus,
            paymentMethod: paymentForm.paymentMethod,
            mpesaCode: paymentForm.mpesaCode || b.mpesaCode,
            updatedAt: new Date().toISOString()
          };
          
          // ✅ Update booking in API
          bookingService.update(b.id, updatedBooking).catch(err => {
            console.error('Error updating booking:', err);
          });
          
          return updatedBooking;
        }
        return b;
      });
      
      setBookings(updatedBookings);

      // Update local customer credit balance
      const updatedCustomers = customers.map(c => {
        if (c.id === selectedCustomer.id) {
          const newBalance = c.creditBalance - amount;
          return { 
            ...c, 
            creditBalance: newBalance,
            notes: c.notes + `\nPayment: KES ${amount} via ${paymentForm.paymentMethod} on ${new Date().toLocaleDateString()}`
          };
        }
        return c;
      });
      setCustomers(updatedCustomers);

      setShowPaymentModal(false);
      setSelectedCustomer(updatedCustomers.find(c => c.id === selectedCustomer.id));
      setPaymentForm({ amount: '', paymentMethod: 'CASH', mpesaCode: '', notes: '' });
      showNotification(`✅ Payment of KES ${amount} recorded successfully!`);
    } catch (error) {
      console.error('Error recording payment:', error);
      showNotification('Failed to record payment. Please try again.', 'error');
    }
    
    setProcessing(false);
  };

  const getInactiveDays = (lastDate) => {
    if (!lastDate) return null;
    const last = new Date(lastDate);
    const now = new Date();
    const diffTime = Math.abs(now - last);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
      vip: { label: 'VIP', color: 'bg-purple-100 text-purple-800' }
    };
    return statusMap[status] || statusMap.active;
  };

  const getServiceIcon = (serviceType) => {
    const icons = {
      car_hire: Car,
      car: Car,
      tour: Compass,
      tours: Compass,
      hajj: MapPin,
      hajj_umra: MapPin,
      hotel: Hotel,
      hotels: Hotel,
      flight: Plane,
      flights: Plane,
      consultancy: Headphones
    };
    return icons[serviceType] || Car;
  };

  const getServiceLabel = (serviceType) => {
    const labels = {
      car_hire: 'Car Hire',
      car: 'Car Hire',
      tour: 'Tour',
      tours: 'Tour',
      hajj: 'Hajj',
      hajj_umra: 'Hajj',
      hotel: 'Hotel',
      hotels: 'Hotel',
      flight: 'Flight',
      flights: 'Flight',
      consultancy: 'Consultancy'
    };
    return labels[serviceType] || serviceType;
  };

  const getCustomerStatus = (customer) => {
    const days = getInactiveDays(customer.lastBookingDate);
    if (customer.totalSpent > 50000) return 'vip';
    if (days !== null && days > 30) return 'inactive';
    return 'active';
  };

  const filteredCustomers = customers.filter(c => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      c.name?.toLowerCase().includes(searchLower) ||
      c.phone?.toLowerCase().includes(searchLower) ||
      c.email?.toLowerCase().includes(searchLower);
    
    const status = getCustomerStatus(c);
    const matchesStatus = filterStatus === 'all' || status === filterStatus;
    
    const matchesCredit = filterCredit === 'all' || 
      (filterCredit === 'has_credit' && c.creditBalance > 0) ||
      (filterCredit === 'no_credit' && c.creditBalance === 0);
    
    const days = getInactiveDays(c.lastBookingDate);
    const matchesBookings = filterBookings === 'all' ||
      (filterBookings === 'active' && days !== null && days <= 30) ||
      (filterBookings === 'inactive' && (days === null || days > 30));
    
    let matchesService = true;
    if (filterService !== 'all') {
      const serviceKey = filterService === 'car_hire' ? 'carHire' :
                        filterService === 'tours' ? 'tours' :
                        filterService === 'hajj' ? 'hajj' :
                        filterService === 'hotels' ? 'hotels' :
                        filterService === 'flights' ? 'flights' :
                        'consultancy';
      matchesService = (c.serviceBreakdown?.[serviceKey] || 0) > 0;
    }
    
    return matchesSearch && matchesStatus && matchesCredit && matchesBookings && matchesService;
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter(c => getCustomerStatus(c) === 'active').length;
  const inactiveCustomers = customers.filter(c => getCustomerStatus(c) === 'inactive').length;
  const vipCustomers = customers.filter(c => getCustomerStatus(c) === 'vip').length;
  const customersWithCredit = customers.filter(c => c.creditBalance > 0).length;
  const totalCreditOutstanding = customers.reduce((sum, c) => sum + (c.creditBalance || 0), 0);
  const totalRevenue = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  const exportToCSV = () => {
    const headers = ['Customer Name', 'Phone', 'Email', 'Total Bookings', 'Total Spent', 'Credit Balance', 'Status', 'Last Booking'];
    const rows = filteredCustomers.map(c => [
      c.name,
      c.phone || 'N/A',
      c.email || 'N/A',
      c.totalBookings,
      c.totalSpent.toFixed(2),
      c.creditBalance.toFixed(2),
      getCustomerStatus(c).toUpperCase(),
      c.lastBookingDate ? new Date(c.lastBookingDate).toLocaleDateString() : 'Never'
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    showNotification('✅ Customers exported successfully!');
  };

  const serviceOptions = [
    { value: 'all', label: 'All Services' },
    { value: 'car_hire', label: 'Car Hire' },
    { value: 'tours', label: 'Tours' },
    { value: 'hajj', label: 'Hajj & Umra' },
    { value: 'hotels', label: 'Hotels' },
    { value: 'flights', label: 'Flights' },
    { value: 'consultancy', label: 'Consultancy' }
  ];

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto">
      {/* Notification - Same as before */}
      
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

      {/* Payment Modal - Same as before */}
      {showPaymentModal && selectedCustomer && (
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
                  <span className="font-medium">{selectedCustomer.name}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Total Bookings:</span>
                  <span className="font-medium">{selectedCustomer.totalBookings}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-600">Total Spent:</span>
                  <span className="font-medium">KES {selectedCustomer.totalSpent?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between mt-1 border-t border-gray-200 pt-1">
                  <span className="text-gray-600 font-semibold">Credit Balance:</span>
                  <span className="font-bold text-orange-600">KES {selectedCustomer.creditBalance?.toLocaleString()}</span>
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

      {/* Add Customer Modal - Same as before */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddCustomerModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                <UserPlus size={20} />
                <h2 className="text-lg font-semibold">Add New Customer</h2>
              </div>
              <button onClick={() => setShowAddCustomerModal(false)} className="p-1 hover:bg-white/20 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({...newCustomer, name: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="+254 700 000 000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={newCustomer.email}
                  onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                <input
                  type="text"
                  value={newCustomer.idNumber}
                  onChange={(e) => setNewCustomer({...newCustomer, idNumber: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="12345678"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nairobi, Kenya"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newCustomer.notes}
                  onChange={(e) => setNewCustomer({...newCustomer, notes: e.target.value})}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  rows="2"
                  placeholder="Any notes about this customer..."
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2">
              <button
                onClick={() => setShowAddCustomerModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
              >
                <Save size={16} /> Add Customer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Same as before */}
      {showDeleteModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Delete Customer</h2>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete "{selectedCustomer.name}"?
                {selectedCustomer.totalBookings > 0 && (
                  <span className="block text-red-500 mt-1">
                    ⚠️ This customer has {selectedCustomer.totalBookings} booking(s) and cannot be deleted.
                  </span>
                )}
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteCustomer(selectedCustomer)}
                  disabled={selectedCustomer.totalBookings > 0}
                  className={`px-4 py-2 text-white rounded-lg text-sm ${
                    selectedCustomer.totalBookings > 0 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Delete Customer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Customer CRM</h1>
          <p className="text-gray-500 text-sm mt-1">Manage customers, track bookings, and handle credit</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button 
            onClick={() => setActiveTab('car-bookings')}
            className="px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Calendar size={16} /> Back to Bookings
          </button>
          <button 
            onClick={() => loadData(tenantId)}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button 
            onClick={exportToCSV}
            className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <Download size={16} /> Export
          </button>
          <button 
            onClick={() => setShowAddCustomerModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <UserPlus size={16} /> Add Customer
          </button>
        </div>
      </div>

      {/* Stats Summary - Same as before */}
      {customers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-xl font-bold text-gray-800">{totalCustomers}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Active</p>
            <p className="text-xl font-bold text-green-600">{activeCustomers}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Inactive</p>
            <p className="text-xl font-bold text-gray-600">{inactiveCustomers}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">VIP</p>
            <p className="text-xl font-bold text-purple-600">{vipCustomers}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">With Credit</p>
            <p className="text-xl font-bold text-orange-600">{customersWithCredit}</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-400">Credit O/S</p>
            <p className="text-xl font-bold text-red-600">KES {totalCreditOutstanding.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filters - Same as before */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap overflow-x-auto pb-2">
          <Filter size={16} className="text-gray-400 flex-shrink-0" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="vip">VIP</option>
          </select>
          <select
            value={filterCredit}
            onChange={(e) => setFilterCredit(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="all">All Credit</option>
            <option value="has_credit">Has Credit</option>
            <option value="no_credit">No Credit</option>
          </select>
          <select
            value={filterBookings}
            onChange={(e) => setFilterBookings(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="all">All Bookings</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive (30+ days)</option>
          </select>
          <select
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            {serviceOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Customer Table - Same as before */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading customers...</div>
      ) : filteredCustomers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No customers found</p>
          <p className="text-sm text-gray-400 mt-1">
            {searchTerm ? 'Try adjusting your search' : 'Add your first customer by clicking "Add Customer"'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setShowAddCustomerModal(true)}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <UserPlus size={16} className="inline mr-1" /> Add Customer
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Table with horizontal scroll */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Customer
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Contact
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Bookings
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Total Spent
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Credit
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Last Booking
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Services
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.map((customer) => {
                    const status = getCustomerStatus(customer);
                    const statusBadge = getStatusBadge(status);
                    const hasCredit = customer.creditBalance > 0;
                    const days = getInactiveDays(customer.lastBookingDate);

                    // Get service badges
                    const serviceBadges = [];
                    if (customer.serviceBreakdown?.carHire > 0) serviceBadges.push({ icon: Car, label: 'CH' });
                    if (customer.serviceBreakdown?.tours > 0) serviceBadges.push({ icon: Compass, label: 'TR' });
                    if (customer.serviceBreakdown?.hajj > 0) serviceBadges.push({ icon: MapPin, label: 'HJ' });
                    if (customer.serviceBreakdown?.hotels > 0) serviceBadges.push({ icon: Hotel, label: 'HT' });
                    if (customer.serviceBreakdown?.flights > 0) serviceBadges.push({ icon: Plane, label: 'FL' });

                    return (
                      <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                              status === 'vip' ? 'bg-purple-500' :
                              status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                            <span className="font-medium text-gray-800">{customer.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="text-xs">
                            <div className="text-gray-600">{customer.phone || 'N/A'}</div>
                            <div className="text-gray-400 text-[10px]">{customer.email || 'No email'}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="font-semibold text-blue-600">{customer.totalBookings}</span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className="font-medium text-green-600">KES {customer.totalSpent?.toLocaleString() || 0}</span>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <span className={`font-medium ${hasCredit ? 'text-orange-600' : 'text-gray-400'}`}>
                            KES {customer.creditBalance?.toLocaleString() || 0}
                          </span>
                          {hasCredit && (
                            <span className="ml-1 text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                              due
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap text-xs text-gray-500">
                          {customer.lastBookingDate ? (
                            <>
                              {new Date(customer.lastBookingDate).toLocaleDateString()}
                              {days !== null && days > 30 && (
                                <span className="text-red-500 ml-1">({days}d)</span>
                              )}
                            </>
                          ) : 'Never'}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            {serviceBadges.slice(0, 3).map((s, i) => (
                              <span key={i} className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded" title={s.label}>
                                <s.icon size={10} className="inline" />
                              </span>
                            ))}
                            {serviceBadges.length > 3 && (
                              <span className="text-[10px] text-gray-400">+{serviceBadges.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setShowCustomerDetailModal(true);
                              }}
                              className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <Eye size={15} />
                            </button>
                            {hasCredit && (
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setPaymentForm({ amount: '', paymentMethod: 'CASH', mpesaCode: '', notes: '' });
                                  setShowPaymentModal(true);
                                }}
                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                title="Record Payment"
                              >
                                <CreditCard size={15} />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (customer.phone) window.location.href = `tel:${customer.phone}`;
                              }}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Call"
                            >
                              <Phone size={15} />
                            </button>
                            {isAdmin && customer.totalBookings === 0 && (
                              <button
                                onClick={() => {
                                  setSelectedCustomer(customer);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={15} />
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="text-sm text-gray-500">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} customers
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

      {/* Customer Detail Modal - Keep the same */}
      {showCustomerDetailModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCustomerDetailModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4 flex items-center justify-between text-white z-10">
              <div className="flex items-center gap-3">
                <User size={24} />
                <div>
                  <h2 className="text-lg font-semibold">Customer Details</h2>
                  <p className="text-sm text-purple-100">{selectedCustomer.name}</p>
                </div>
              </div>
              <button onClick={() => setShowCustomerDetailModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                <div><span className="text-xs text-gray-500">Name:</span> <span className="text-sm font-medium">{selectedCustomer.name}</span></div>
                <div><span className="text-xs text-gray-500">Phone:</span> <span className="text-sm font-medium">{selectedCustomer.phone || 'N/A'}</span></div>
                <div><span className="text-xs text-gray-500">Email:</span> <span className="text-sm font-medium">{selectedCustomer.email || 'N/A'}</span></div>
                <div><span className="text-xs text-gray-500">ID Number:</span> <span className="text-sm font-medium">{selectedCustomer.idNumber || 'N/A'}</span></div>
                <div className="col-span-2">
                  <span className="text-xs text-gray-500">Status:</span>
                  <span className={`text-sm font-medium ml-1 ${
                    getCustomerStatus(selectedCustomer) === 'vip' ? 'text-purple-600' :
                    getCustomerStatus(selectedCustomer) === 'active' ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {getCustomerStatus(selectedCustomer).toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total Bookings</p>
                  <p className="text-xl font-bold text-blue-600">{selectedCustomer.totalBookings}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Total Spent</p>
                  <p className="text-xl font-bold text-green-600">KES {selectedCustomer.totalSpent?.toLocaleString()}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500">Credit Balance</p>
                  <p className={`text-xl font-bold ${selectedCustomer.creditBalance > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                    KES {selectedCustomer.creditBalance?.toLocaleString() || 0}
                  </p>
                </div>
              </div>

              {/* Service Breakdown */}
              {selectedCustomer.serviceBreakdown && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Service Breakdown</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedCustomer.serviceBreakdown.carHire > 0 && (
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <Car size={16} className="mx-auto text-blue-600 mb-1" />
                        <p className="text-xs font-medium">{selectedCustomer.serviceBreakdown.carHire} bookings</p>
                        <p className="text-[10px] text-gray-500">KES {selectedCustomer.serviceRevenue?.carHire?.toLocaleString() || 0}</p>
                      </div>
                    )}
                    {selectedCustomer.serviceBreakdown.tours > 0 && (
                      <div className="bg-green-50 rounded-lg p-2 text-center">
                        <Compass size={16} className="mx-auto text-green-600 mb-1" />
                        <p className="text-xs font-medium">{selectedCustomer.serviceBreakdown.tours} bookings</p>
                        <p className="text-[10px] text-gray-500">KES {selectedCustomer.serviceRevenue?.tours?.toLocaleString() || 0}</p>
                      </div>
                    )}
                    {selectedCustomer.serviceBreakdown.hajj > 0 && (
                      <div className="bg-red-50 rounded-lg p-2 text-center">
                        <MapPin size={16} className="mx-auto text-red-600 mb-1" />
                        <p className="text-xs font-medium">{selectedCustomer.serviceBreakdown.hajj} bookings</p>
                        <p className="text-[10px] text-gray-500">KES {selectedCustomer.serviceRevenue?.hajj?.toLocaleString() || 0}</p>
                      </div>
                    )}
                    {selectedCustomer.serviceBreakdown.hotels > 0 && (
                      <div className="bg-orange-50 rounded-lg p-2 text-center">
                        <Hotel size={16} className="mx-auto text-orange-600 mb-1" />
                        <p className="text-xs font-medium">{selectedCustomer.serviceBreakdown.hotels} bookings</p>
                        <p className="text-[10px] text-gray-500">KES {selectedCustomer.serviceRevenue?.hotels?.toLocaleString() || 0}</p>
                      </div>
                    )}
                    {selectedCustomer.serviceBreakdown.flights > 0 && (
                      <div className="bg-purple-50 rounded-lg p-2 text-center">
                        <Plane size={16} className="mx-auto text-purple-600 mb-1" />
                        <p className="text-xs font-medium">{selectedCustomer.serviceBreakdown.flights} bookings</p>
                        <p className="text-[10px] text-gray-500">KES {selectedCustomer.serviceRevenue?.flights?.toLocaleString() || 0}</p>
                      </div>
                    )}
                    {selectedCustomer.serviceBreakdown.consultancy > 0 && (
                      <div className="bg-pink-50 rounded-lg p-2 text-center">
                        <Headphones size={16} className="mx-auto text-pink-600 mb-1" />
                        <p className="text-xs font-medium">{selectedCustomer.serviceBreakdown.consultancy} bookings</p>
                        <p className="text-[10px] text-gray-500">KES {selectedCustomer.serviceRevenue?.consultancy?.toLocaleString() || 0}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Booking History */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Booking History</h3>
                {selectedCustomer.bookings && selectedCustomer.bookings.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedCustomer.bookings.map((booking, index) => {
                      const ServiceIcon = getServiceIcon(booking.serviceType);
                      const serviceLabel = getServiceLabel(booking.serviceType);
                      return (
                        <div key={index} className="bg-gray-50 rounded-lg p-3 text-sm">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <ServiceIcon size={14} className="text-blue-500" />
                              <span className="font-medium">{booking.vehicleRegistration || serviceLabel || 'Booking'}</span>
                            </div>
                            <span className="text-xs text-gray-500">{new Date(booking.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Service: {serviceLabel}</span>
                            <span>KES {booking.totalPrice?.toLocaleString()}</span>
                            <span className={`${
                              booking.paymentStatus === 'PAID' ? 'text-green-600' :
                              booking.paymentStatus === 'PARTIAL' ? 'text-orange-600' : 'text-red-600'
                            }`}>
                              {booking.paymentStatus}
                            </span>
                          </div>
                          {booking.remainingBalance > 0 && (
                            <div className="text-xs text-orange-600 mt-1">
                              Remaining: KES {booking.remainingBalance.toLocaleString()}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No bookings yet</p>
                )}
              </div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex flex-wrap justify-end gap-2">
              {selectedCustomer.creditBalance > 0 && (
                <>
                  <button
                    onClick={() => {
                      setShowCustomerDetailModal(false);
                      setPaymentForm({ 
                        amount: selectedCustomer.creditBalance.toString(), 
                        paymentMethod: 'CASH', 
                        mpesaCode: '', 
                        notes: `Full payment of all outstanding debt for ${selectedCustomer.name}` 
                      });
                      setShowPaymentModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                  >
                    <CheckCircle size={16} /> Pay All (KES {selectedCustomer.creditBalance.toLocaleString()})
                  </button>
                  <button
                    onClick={() => {
                      setShowCustomerDetailModal(false);
                      setPaymentForm({ amount: '', paymentMethod: 'CASH', mpesaCode: '', notes: '' });
                      setShowPaymentModal(true);
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm flex items-center gap-2"
                  >
                    <CreditCard size={16} /> Custom Payment
                  </button>
                </>
              )}
              <button
                onClick={() => setShowCustomerDetailModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
              >
                Close
              </button>
            </div>
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

export default CarBookingCRM;