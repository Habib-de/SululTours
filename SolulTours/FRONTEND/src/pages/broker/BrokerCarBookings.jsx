import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, Search, Filter, RefreshCw, 
  Eye, CheckCircle, XCircle, Clock, 
  AlertCircle, User, Car, DollarSign,
  MapPin, Phone, Mail, Edit2, Trash2, Plus,
  X, Save, Percent, Tag, CreditCard,
  Wallet, Building, Upload, Camera,
  Calendar as CalendarIcon, Clock as ClockIcon,
  Receipt, ChevronLeft, ChevronRight, FileText  
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingService, vehicleService, carOwnerService } from '../../services/api';
import TermsAndConditions from '../../components/common/TermsAndConditions';

const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-KE', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  } catch (e) { return dateString; }
};

const generateReference = () => {
  return 'BK-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
};

const compressImage = (base64String, maxWidth = 800, maxHeight = 800, quality = 0.85) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth; }
      if (height > maxHeight) { width = (width * maxHeight) / height; height = maxHeight; }
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

const BrokerCarBookings = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [carOwners, setCarOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterStartDateFocused, setFilterStartDateFocused] = useState(false);  
const [filterEndDateFocused, setFilterEndDateFocused] = useState(false);      
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tenantId, setTenantId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingBookingAction, setPendingBookingAction] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Image upload refs
  const idImageRef = useRef(null);
  const licenseImageRef = useRef(null);
  const vehicleImageRef = useRef(null);
  const editIdImageRef = useRef(null);
  const editLicenseImageRef = useRef(null);
  const editVehicleImageRef = useRef(null);

  const [paymentForm, setPaymentForm] = useState({
    amount: '', paymentMethod: 'CASH', mpesaCode: '', notes: ''
  });

  const [formData, setFormData] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    customerIdNumber: '', customerLicenseNumber: '',
    customerIdImage: null, customerLicenseImage: null,
    vehicleId: '', startDate: '', startTime: '08:00',
    endDate: '', endTime: '18:00', notes: '',
    bookingFee: '', days: 0,
    discountType: 'NONE', discountValue: '', discountAmount: 0,
    paymentMethod: 'CASH', paymentStatus: 'PENDING', mpesaCode: '',
    paidAmount: 0, remainingBalance: 0, vehicleConditionImages: []
  });

  const [editFormData, setEditFormData] = useState({
    customerName: '', customerEmail: '', customerPhone: '',
    customerIdNumber: '', customerLicenseNumber: '',
    customerIdImage: null, customerLicenseImage: null,
    vehicleId: '', startDate: '', startTime: '08:00',
    endDate: '', endTime: '18:00', notes: '',
    bookingFee: '', days: 0,
    discountType: 'NONE', discountValue: '', discountAmount: 0,
    paymentMethod: 'CASH', paymentStatus: 'PENDING', mpesaCode: '',
    paidAmount: 0, remainingBalance: 0, vehicleConditionImages: []
  });

  const [idImagePreview, setIdImagePreview] = useState(null);
  const [licenseImagePreview, setLicenseImagePreview] = useState(null);
  const [vehicleImagePreviews, setVehicleImagePreviews] = useState([]);

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

  const loadData = async (tid) => {
    setLoading(true);
    try {
      const tenantToUse = tid || tenantId;
      if (!tenantToUse) { setLoading(false); return; }

      const vehiclesResponse = await vehicleService.getAll(tenantToUse);
      let vehiclesData = vehiclesResponse?.success && vehiclesResponse?.data ? vehiclesResponse.data : (Array.isArray(vehiclesResponse) ? vehiclesResponse : []);
      setVehicles(vehiclesData);

      const ownersResponse = await carOwnerService.getAll(tenantToUse);
      let ownersData = ownersResponse?.success && ownersResponse?.data ? ownersResponse.data : (Array.isArray(ownersResponse) ? ownersResponse : []);
      setCarOwners(ownersData);

      const bookingsResponse = await bookingService.getAll(tenantToUse);
      let bookingsData = bookingsResponse?.success && bookingsResponse?.data ? bookingsResponse.data : (Array.isArray(bookingsResponse) ? bookingsResponse : []);

      const carBookings = bookingsData.filter(b => {
        const serviceType = b.serviceType || b.service_type || 'car_hire';
        return serviceType === 'car_hire' || serviceType === 'car';
      });

      setAllBookings(carBookings);

      const brokerUserId = currentUser?.id;
      setBookings(carBookings.filter(b => b.userId === brokerUserId));
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Error loading bookings', 'error');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      customerName: '', customerEmail: '', customerPhone: '',
      customerIdNumber: '', customerLicenseNumber: '',
      customerIdImage: null, customerLicenseImage: null,
      vehicleId: '', startDate: '', startTime: '08:00',
      endDate: '', endTime: '18:00', notes: '',
      bookingFee: '', days: 0,
      discountType: 'NONE', discountValue: '', discountAmount: 0,
      paymentMethod: 'CASH', paymentStatus: 'PENDING', mpesaCode: '',
      paidAmount: 0, remainingBalance: 0, vehicleConditionImages: []
    });
    setIdImagePreview(null);
    setLicenseImagePreview(null);
    setVehicleImagePreviews([]);
    setPaymentForm({ amount: '', paymentMethod: 'CASH', mpesaCode: '', notes: '' });
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const s = start.split('-'); const e = end.split('-');
    if (s.length !== 3 || e.length !== 3) return 0;
    const sd = new Date(+s[0], +s[1] - 1, +s[2]);
    const ed = new Date(+e[0], +e[1] - 1, +e[2]);
    if (isNaN(sd) || isNaN(ed)) return 0;
    return Math.max(Math.ceil((ed - sd) / (1000 * 60 * 60 * 24)), 1);
  };

  const isVehicleAvailableForDates = (vehicleId, startDate, endDate, excludeBookingId = null) => {
    if (!startDate || !endDate) return true;
    const start = new Date(startDate); const end = new Date(endDate);
    if (end < start) return false;
    return !allBookings.some(b => {
      if (excludeBookingId && b.id === excludeBookingId) return false;
      return b.vehicleId === vehicleId &&
        (b.status === 'pending' || b.status === 'confirmed') &&
        new Date(b.startDate) < end &&
        new Date(b.endDate) > start;
    });
  };

  const getOverlappingBookings = (vehicleId, startDate, endDate, excludeBookingId = null) => {
    if (!startDate || !endDate) return [];
    const start = new Date(startDate); const end = new Date(endDate);
    return allBookings.filter(b => {
      if (excludeBookingId && b.id === excludeBookingId) return false;
      return b.vehicleId === vehicleId &&
        (b.status === 'pending' || b.status === 'confirmed') &&
        new Date(b.startDate) < end &&
        new Date(b.endDate) > start;
    });
  };

  const getVehicleDetails = (vehicleId) => vehicles.find(v => v.id === vehicleId);

  const getStatusBadge = (status) => {
    const map = {
      pending: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { label: '📌 Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      completed: { label: '✅ Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      cancelled: { label: '❌ Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    return map[status] || { label: status || 'Pending', color: 'bg-gray-100 text-gray-800', icon: Clock };
  };

  const getPaymentStatusBadge = (status) => {
    const map = {
      PAID: { label: '✅ Paid', color: 'bg-green-100 text-green-800' },
      PENDING: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800' },
      PARTIAL: { label: '🔄 Partial', color: 'bg-blue-100 text-blue-800' }
    };
    return map[status] || { label: status || 'Pending', color: 'bg-gray-100 text-gray-800' };
  };

  const getPaymentMethodIcon = (method) => {
    const map = {
      CASH: <DollarSign size={14} className="text-green-600" />,
      M_PESA: <CreditCard size={14} className="text-blue-600" />,
      BANK_TRANSFER: <Building size={14} className="text-purple-600" />,
      CREDIT: <Wallet size={14} className="text-orange-600" />
    };
    return map[method] || <DollarSign size={14} className="text-gray-400" />;
  };

  const getStatusDot = (status) => {
    const map = { pending: 'bg-yellow-500', confirmed: 'bg-blue-500', completed: 'bg-green-500', cancelled: 'bg-red-500' };
    return map[status] || 'bg-gray-400';
  };

  // ✅ IMAGE HANDLERS
  const handleIdImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result);
        setFormData(prev => ({ ...prev, customerIdImage: compressed }));
        setIdImagePreview(compressed);
      } catch { showNotification('Failed to process image', 'error'); }
    };
    reader.readAsDataURL(file);
  };

  const handleLicenseImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result);
        setFormData(prev => ({ ...prev, customerLicenseImage: compressed }));
        setLicenseImagePreview(compressed);
      } catch { showNotification('Failed to process image', 'error'); }
    };
    reader.readAsDataURL(file);
  };

  const handleVehicleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = []; const newPreviews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newImages.push(event.target.result);
        newPreviews.push(event.target.result);
        if (newImages.length === files.length) {
          setFormData(prev => ({ ...prev, vehicleConditionImages: [...prev.vehicleConditionImages, ...newImages] }));
          setVehicleImagePreviews(prev => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeIdImage = () => {
    setIdImagePreview(null);
    setFormData(prev => ({ ...prev, customerIdImage: null }));
    if (idImageRef.current) idImageRef.current.value = '';
  };

  const removeLicenseImage = () => {
    setLicenseImagePreview(null);
    setFormData(prev => ({ ...prev, customerLicenseImage: null }));
    if (licenseImageRef.current) licenseImageRef.current.value = '';
  };

  const removeVehicleImage = (index) => {
    setFormData(prev => ({ ...prev, vehicleConditionImages: prev.vehicleConditionImages.filter((_, i) => i !== index) }));
    setVehicleImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleEditIdImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setEditFormData(prev => ({ ...prev, customerIdImage: event.target.result }));
    reader.readAsDataURL(file);
  };

  const handleEditLicenseImageUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setEditFormData(prev => ({ ...prev, customerLicenseImage: event.target.result }));
    reader.readAsDataURL(file);
  };

  const handleEditVehicleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        newImages.push(event.target.result);
        if (newImages.length === files.length) {
          setEditFormData(prev => ({ ...prev, vehicleConditionImages: [...prev.vehicleConditionImages, ...newImages] }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeEditVehicleImage = (index) => {
    setEditFormData(prev => {
      let images = prev.vehicleConditionImages;
      if (typeof images === 'string') { try { images = JSON.parse(images); } catch { images = []; } }
      if (!Array.isArray(images)) images = [];
      return { ...prev, vehicleConditionImages: images.filter((_, i) => i !== index) };
    });
  };

  const handleCreateBooking = () => {
    if (!formData.customerName) return showNotification('Please enter customer name', 'error');
    if (!formData.vehicleId) return showNotification('Please select a vehicle', 'error');
    if (!formData.startDate || !formData.endDate) return showNotification('Please select start and end dates', 'error');
    const start = new Date(formData.startDate); const end = new Date(formData.endDate);
    if (end < start) return showNotification('⚠️ End date must be on or after start date', 'error');
    const startDateTime = `${formData.startDate}T${formData.startTime || '08:00'}`;
    const endDateTime = `${formData.endDate}T${formData.endTime || '18:00'}`;
    if (!isVehicleAvailableForDates(formData.vehicleId, startDateTime, endDateTime)) {
      const conflicts = getOverlappingBookings(formData.vehicleId, startDateTime, endDateTime);
      let msg = '❌ Vehicle not available';
      if (conflicts.length > 0) msg = `❌ Booked from ${formatDateTime(conflicts[0].startDate)} to ${formatDateTime(conflicts[0].endDate)}`;
      return showNotification(msg, 'error');
    }
    if (formData.paymentMethod === 'M_PESA' && (!formData.mpesaCode || formData.mpesaCode.length < 6)) {
      return showNotification('Please enter valid M-Pesa code', 'error');
    }
    setShowTermsModal(true);
    setPendingBookingAction('create');
  };

  const performCreateBooking = async (signatureData = null) => {
    setIsSubmitting(true);
    try {
      const startDateTime = `${formData.startDate}T${formData.startTime || '08:00'}`;
      const endDateTime = `${formData.endDate}T${formData.endTime || '18:00'}`;
      const vehicle = vehicles.find(v => v.id === formData.vehicleId);
      const pricePerDay = parseFloat(vehicle?.pricePerDay) || 0;
      const days = formData.days || calculateDays(formData.startDate, formData.endDate);
      const expectedPrice = pricePerDay * days;
      const discountAmount = formData.discountAmount || 0;
      const expected = expectedPrice - discountAmount;
      let finalTotal = formData.bookingFee ? parseFloat(formData.bookingFee) * days : expected;

            // ✅ RESPECT broker's payment status selection
      let paidAmount = 0;
      let remainingBalance = finalTotal;
      let paymentStatus = formData.paymentStatus || 'PENDING';

      if (paymentStatus === 'PAID') {
        paidAmount = finalTotal;
        remainingBalance = 0;
      } else if (paymentStatus === 'PARTIAL') {
        // Use the paidAmount the broker entered (from formData.paidAmount)
        paidAmount = parseFloat(formData.paidAmount) || 0;
        remainingBalance = Math.max(0, finalTotal - paidAmount);
        // Safety: if partial selected but paid = 0, treat as pending
        if (paidAmount === 0) { paymentStatus = 'PENDING'; remainingBalance = finalTotal; }
        // Safety: if partial selected but paid >= total, treat as paid
        else if (paidAmount >= finalTotal) { paymentStatus = 'PAID'; paidAmount = finalTotal; remainingBalance = 0; }
      } else {
        // PENDING
        paidAmount = 0;
        remainingBalance = finalTotal;
      }

      const newBooking = {
        reference: generateReference(),
        customerName: formData.customerName,
        customerEmail: formData.customerEmail || '',
        customerPhone: formData.customerPhone || '',
        customerIdNumber: formData.customerIdNumber || '',
        customerLicenseNumber: formData.customerLicenseNumber || '',
        customerIdImage: formData.customerIdImage || null,
        customerLicenseImage: formData.customerLicenseImage || null,
        vehicleId: formData.vehicleId,
        vehicleRegistration: vehicle?.registration || '',
        vehicleMake: vehicle?.make || '',
        vehicleModel: vehicle?.model || '',
        vehiclePricePerDay: pricePerDay || 0,
        ownerId: vehicle?.ownerId || '',
        startDate: startDateTime, endDate: endDateTime,
        days: days || 1,
        subtotal: expectedPrice || 0,
        discountType: formData.discountType || 'NONE',
        discountValue: formData.discountValue || '',
        discountAmount: discountAmount || 0,
        totalPrice: finalTotal || 0,
        bookingFeePerDay: formData.bookingFee ? parseFloat(formData.bookingFee) : null,
        commission: 0,
        paymentMethod: formData.paymentMethod || 'CASH',
        paymentStatus: paymentStatus || 'PENDING',
        mpesaCode: formData.mpesaCode || '',
        paidAmount: paidAmount || 0,
        remainingBalance: remainingBalance || 0,
        vehicleConditionImages: formData.vehicleConditionImages.length > 0 ? JSON.stringify(formData.vehicleConditionImages) : null,
        notes: formData.notes || '',
        status: 'pending',
        serviceType: 'car_hire',
        isGuestBooking: false,
        tenantId: tenantId,
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: "1.0",
        customerSignature: signatureData
      };

      const response = await bookingService.create(newBooking);
      if (response?.success) {
        showNotification('✅ Booking created successfully!');
        setShowCreateModal(false);
        resetForm();
        loadData(tenantId);
      } else {
        showNotification('Failed: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      showNotification('Failed to create booking', 'error');
    }
    setIsSubmitting(false);
  };

  const handleEditBooking = () => {
    if (!editingBooking) return;
    if (!editFormData.customerName) return showNotification('Please enter customer name', 'error');
    if (!editFormData.vehicleId) return showNotification('Please select a vehicle', 'error');
    if (!editFormData.startDate || !editFormData.endDate) return showNotification('Please select dates', 'error');
    const start = new Date(editFormData.startDate); const end = new Date(editFormData.endDate);
    if (end < start) return showNotification('⚠️ End date must be on or after start date', 'error');

    const startDT = `${editFormData.startDate}T${editFormData.startTime || '08:00'}`;
    const endDT = `${editFormData.endDate}T${editFormData.endTime || '18:00'}`;
    const conflicts = getOverlappingBookings(editFormData.vehicleId, startDT, endDT, editingBooking.id);
    if (conflicts.length > 0) {
      const c = conflicts[0];
      return showNotification(`❌ Vehicle booked from ${formatDateTime(c.startDate)} to ${formatDateTime(c.endDate)}. Pick different dates.`, 'error');
    }

    setShowTermsModal(true);
    setPendingBookingAction('edit');
  };

  const performEditBooking = async (signatureData = null) => {
    setIsSubmitting(true);
    try {
      const startDateTime = `${editFormData.startDate}T${editFormData.startTime || '08:00'}`;
      const endDateTime = `${editFormData.endDate}T${editFormData.endTime || '18:00'}`;
      const vehicle = vehicles.find(v => v.id === editFormData.vehicleId);
      const pricePerDay = parseFloat(vehicle?.pricePerDay) || 0;
      const days = editFormData.days || calculateDays(editFormData.startDate, editFormData.endDate);
      const expectedPrice = pricePerDay * days;
      let discountAmount = 0;
      if (editFormData.discountType === 'PERCENTAGE') discountAmount = (expectedPrice * parseFloat(editFormData.discountValue || 0)) / 100;
      else if (editFormData.discountType === 'FIXED') discountAmount = parseFloat(editFormData.discountValue || 0) * days;
      else discountAmount = editFormData.discountAmount || 0;
      const expected = expectedPrice - discountAmount;
      let finalTotal = editFormData.bookingFee ? parseFloat(editFormData.bookingFee) * days : expected;
            // ✅ RESPECT broker's payment status selection
      let paymentStatus = editFormData.paymentStatus || 'PENDING';
      let paidAmount = 0;
      let remainingBalance = finalTotal;

      if (paymentStatus === 'PAID') {
        paidAmount = finalTotal;
        remainingBalance = 0;
      } else if (paymentStatus === 'PARTIAL') {
        paidAmount = parseFloat(editFormData.paidAmount) || 0;
        remainingBalance = Math.max(0, finalTotal - paidAmount);
        if (paidAmount === 0) { paymentStatus = 'PENDING'; remainingBalance = finalTotal; }
        else if (paidAmount >= finalTotal) { paymentStatus = 'PAID'; paidAmount = finalTotal; remainingBalance = 0; }
      } else {
        paidAmount = 0;
        remainingBalance = finalTotal;
      }

      const updatedBooking = {
        ...editingBooking,
        customerName: editFormData.customerName,
        customerEmail: editFormData.customerEmail || '',
        customerPhone: editFormData.customerPhone || '',
        customerIdNumber: editFormData.customerIdNumber || '',
        customerLicenseNumber: editFormData.customerLicenseNumber || '',
        customerIdImage: editFormData.customerIdImage || null,
        customerLicenseImage: editFormData.customerLicenseImage || null,
        vehicleId: editFormData.vehicleId,
        vehicleRegistration: vehicle?.registration || '',
        vehicleMake: vehicle?.make || '',
        vehicleModel: vehicle?.model || '',
        vehiclePricePerDay: pricePerDay || 0,
        ownerId: vehicle?.ownerId || '',
        startDate: startDateTime, endDate: endDateTime,
        days: days || 1,
        subtotal: expectedPrice || 0,
        discountType: editFormData.discountType || 'NONE',
        discountValue: editFormData.discountValue || '',
        discountAmount: discountAmount || 0,
        totalPrice: finalTotal || 0,
        bookingFeePerDay: editFormData.bookingFee ? parseFloat(editFormData.bookingFee) : null,
        paymentMethod: editFormData.paymentMethod || 'CASH',
        paymentStatus: paymentStatus || 'PENDING',
        mpesaCode: editFormData.mpesaCode || '',
        paidAmount: paidAmount || 0,
        remainingBalance: remainingBalance || 0,
        vehicleConditionImages: editFormData.vehicleConditionImages.length > 0 ? JSON.stringify(editFormData.vehicleConditionImages) : null,
        notes: editFormData.notes || '',
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
        termsVersion: "1.0",
        customerSignature: signatureData
      };

      const response = await bookingService.update(editingBooking.id, updatedBooking);
      if (response?.success) {
        showNotification('✅ Booking updated!');
        setShowEditModal(false);
        setEditingBooking(null);
        loadData(tenantId);
      } else {
        showNotification('Failed: ' + (response?.message || 'Unknown'), 'error');
      }
    } catch (err) {
      console.error('Error updating:', err);
      showNotification('Failed to update', 'error');
    }
    setIsSubmitting(false);
  };

  const handleTermsAccept = (signatureData) => {
    setShowTermsModal(false);
    if (pendingBookingAction === 'create') performCreateBooking(signatureData);
    else if (pendingBookingAction === 'edit') performEditBooking(signatureData);
    setPendingBookingAction(null);
  };

  const handleTermsDecline = () => {
    setShowTermsModal(false);
    setPendingBookingAction(null);
    showNotification('You must accept terms to proceed', 'error');
  };

  const handleRecordPayment = async () => {
    if (!paymentForm.amount || parseFloat(paymentForm.amount) <= 0) return showNotification('Please enter valid amount', 'error');
    const amount = parseFloat(paymentForm.amount);
    if (amount > selectedBooking.remainingBalance) return showNotification('Amount exceeds balance', 'error');
    if (paymentForm.paymentMethod === 'M_PESA' && (!paymentForm.mpesaCode || paymentForm.mpesaCode.length < 6)) return showNotification('Please enter valid M-Pesa code', 'error');
    setIsSubmitting(true);
    try {
      const baseTotal =
  (selectedBooking.vehiclePricePerDay || 0) * (selectedBooking.days || 0) -
  (selectedBooking.discountAmount || 0);

const newPaid = (selectedBooking.paidAmount || 0) + amount;
const newRemaining = baseTotal - newPaid;

const updatedBooking = {
  ...selectedBooking,
  paidAmount: newPaid,
  remainingBalance: newRemaining,
  paymentStatus: newRemaining <= 0 ? 'PAID' : 'PARTIAL',
  paymentMethod: paymentForm.paymentMethod,
  mpesaCode: paymentForm.mpesaCode || selectedBooking.mpesaCode
};
      const response = await bookingService.update(selectedBooking.id, updatedBooking);
      if (response?.success) {
        showNotification(`✅ Payment of KES ${amount} recorded`);
        setShowPaymentModal(false);
        setPaymentForm({ amount: '', paymentMethod: 'CASH', mpesaCode: '', notes: '' });
        loadData(tenantId);
      } else {
        showNotification('Failed: ' + (response?.message || 'Unknown'), 'error');
      }
    } catch (err) {
      console.error('Payment error:', err);
      showNotification('Failed to record payment', 'error');
    }
    setIsSubmitting(false);
  };

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setIsSubmitting(true);
    try {
      const response = await bookingService.updateStatus(bookingId, newStatus);
      if (response?.success) {
        showNotification(`✅ Status updated to ${newStatus}`);
        setShowStatusModal(false);
        loadData(tenantId);
      } else {
        showNotification('Failed: ' + (response?.message || 'Unknown'), 'error');
      }
    } catch (err) {
      showNotification('Failed to update', 'error');
    }
    setIsSubmitting(false);
  };

  const handlePaymentStatusUpdate = async (bookingId, newPaymentStatus) => {
    setIsSubmitting(true);
    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;
      const updatedBooking = { ...booking, paymentStatus: newPaymentStatus };
      const response = await bookingService.update(bookingId, updatedBooking);
      if (response?.success) {
        showNotification('✅ Payment status updated');
        loadData(tenantId);
      } else {
        showNotification('Failed: ' + (response?.message || 'Unknown'), 'error');
      }
    } catch (err) {
      showNotification('Failed', 'error');
    }
    setIsSubmitting(false);
  };

  const handlePrintBooking = (booking) => {
    const vehicle = getVehicleDetails(booking.vehicleId);
    const currentDate = new Date().toLocaleString('en-KE', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });
    const w = window.open('', '_blank', 'width=800,height=600');
    w.document.write(`
      <html><head><title>Booking - ${booking.reference}</title>
      <style>body{font-family:Arial;padding:40px;color:#333}.header{text-align:center;border-bottom:2px solid #000;padding-bottom:20px;margin-bottom:20px}.header h1{color:#1a56db;margin:0}.section{margin-bottom:20px}.section h2{font-size:16px;border-bottom:1px solid #ddd;padding-bottom:8px;color:#1a56db}.row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0}.footer{text-align:center;margin-top:40px;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#999}</style></head><body>
      <div class="header"><h1>🚗 Car Booking Receipt</h1><p><strong>Reference:</strong> ${booking.reference}</p><p><strong>Generated:</strong> ${currentDate}</p></div>
      <div class="section"><h2>👤 Customer</h2><div class="row"><span>Name:</span><span>${booking.customerName || 'N/A'}</span></div><div class="row"><span>Phone:</span><span>${booking.customerPhone || 'N/A'}</span></div><div class="row"><span>Email:</span><span>${booking.customerEmail || 'N/A'}</span></div><div class="row"><span>ID:</span><span>${booking.customerIdNumber || 'N/A'}</span></div></div>
      <div class="section"><h2>🚗 Vehicle</h2><div class="row"><span>Vehicle:</span><span>${vehicle ? vehicle.make + ' ' + vehicle.model : 'N/A'}</span></div><div class="row"><span>Reg:</span><span>${vehicle?.registration || 'N/A'}</span></div><div class="row"><span>Rate/Day:</span><span>KSh ${(booking.vehiclePricePerDay || 0).toLocaleString()}</span></div></div>
      <div class="section"><h2>📅 Booking</h2><div class="row"><span>Start:</span><span>${formatDateTime(booking.startDate)}</span></div><div class="row"><span>End:</span><span>${formatDateTime(booking.endDate)}</span></div><div class="row"><span>Days:</span><span>${booking.days || 0}</span></div></div>
      <div class="section"><h2>💰 Payment</h2><div class="row"><span>Total:</span><span>KSh ${((booking.vehiclePricePerDay || 0) * (booking.days || 0) - (booking.discountAmount || 0)).toLocaleString()}</span></div><div class="row"><span>Paid:</span><span>KSh ${(booking.paidAmount || 0).toLocaleString()}</span></div>${booking.remainingBalance > 0 ? `<div class="row"><span>Outstanding:</span><span>KSh ${booking.remainingBalance.toLocaleString()}</span></div>` : ''}</div>
      <div class="footer"><p>© 2026 Sulul Tours & Travel</p></div>
      <script>window.onload=()=>window.print()</script>
      </body></html>`);
    w.document.close();
  };

  const statusOptions = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

  // ✅ DATE RANGE FILTER + SEARCH + STATUS
  const filteredBookings = bookings.filter(b => {
    const vehicle = getVehicleDetails(b.vehicleId);
    const s = searchQuery.toLowerCase();
    const matchesSearch =
      !s ||
      b.customerName?.toLowerCase().includes(s) ||
      b.customerEmail?.toLowerCase().includes(s) ||
      b.customerPhone?.toLowerCase().includes(s) ||
      vehicle?.registration?.toLowerCase().includes(s) ||
      vehicle?.make?.toLowerCase().includes(s) ||
      vehicle?.model?.toLowerCase().includes(s);
    const matchesFilter = filterStatus === 'all' || b.status === filterStatus;

    // ✅ DATE RANGE FILTER — matches bookings whose startDate falls within range
    let matchesDateRange = true;
    if (filterStartDate || filterEndDate) {
      const bStart = new Date(b.startDate);
      if (filterStartDate) {
        const filterStart = new Date(filterStartDate);
        filterStart.setHours(0, 0, 0, 0);
        if (bStart < filterStart) matchesDateRange = false;
      }
      if (filterEndDate) {
        const filterEnd = new Date(filterEndDate);
        filterEnd.setHours(23, 59, 59, 999);
        if (bStart > filterEnd) matchesDateRange = false;
      }
    }
    return matchesSearch && matchesFilter && matchesDateRange;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const totalBookings = bookings.length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const completedBookings = bookings.filter(b => b.status === 'completed').length;
  const totalRevenue = bookings.reduce((sum, b) => {
  const base = (b.vehiclePricePerDay || 0) * (b.days || 0);
  const discount = b.discountAmount || 0;
  return sum + (base - discount);
}, 0);
  const totalCreditOutstanding = bookings.reduce((sum, b) => {
  const base =
    (b.vehiclePricePerDay || 0) * (b.days || 0) -
    (b.discountAmount || 0);
  const outstanding = base - (b.paidAmount || 0);
  return sum + (outstanding > 0 ? outstanding : 0);
}, 0);
  const availableVehicles = vehicles.filter(v => v.status === 'active');

  return (
    <div className="p-4 sm:p-6 max-w-full mx-auto">
      {notification && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[9999] px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 ${
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2"><X size={16} /></button>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPaymentModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3"><CreditCard size={20} /><h2 className="text-lg font-semibold">Record Payment</h2></div>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 hover:bg-white/20 rounded"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Customer:</span><span className="font-medium">{selectedBooking.customerName}</span></div>
                <div className="flex justify-between mt-1"><span className="text-gray-600">Total:</span><span className="font-medium">KES {((selectedBooking.vehiclePricePerDay || 0) * (selectedBooking.days || 0) - (selectedBooking.discountAmount || 0)).toLocaleString()}</span></div>
                <div className="flex justify-between mt-1"><span className="text-gray-600">Paid:</span><span className="font-medium text-green-600">KES {(selectedBooking.paidAmount || 0).toLocaleString()}</span></div>
                <div className="flex justify-between mt-1 border-t border-gray-200 pt-1">
  <span className="text-gray-600 font-semibold">Remaining:</span>
  <span className="font-bold text-orange-600">
    KES {Math.max(0,
      ((selectedBooking.vehiclePricePerDay || 0) * (selectedBooking.days || 0) -
       (selectedBooking.discountAmount || 0)) -
      (selectedBooking.paidAmount || 0)
    ).toLocaleString()}
  </span>
</div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES) *</label>
                <input type="number" value={paymentForm.amount}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="0" min="0" step="50" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Method *</label>
                <select value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="CASH">Cash</option><option value="M_PESA">M-Pesa</option><option value="BANK_TRANSFER">Bank Transfer</option>
                </select></div>
              {paymentForm.paymentMethod === 'M_PESA' && (
                <div><label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Code *</label>
                  <input type="text" value={paymentForm.mpesaCode}
                    onChange={(e) => setPaymentForm({ ...paymentForm, mpesaCode: e.target.value.toUpperCase() })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="ABC123" /></div>
              )}
            </div>
            <div className="bg-gray-50 border-t px-6 py-3 flex justify-end gap-2">
              <button onClick={() => setShowPaymentModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
              <button onClick={handleRecordPayment} disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2">
                <Save size={16} /> {isSubmitting ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================ */}
      {/* CREATE MODAL — with ID, License, Vehicle images */}
      {/* ============================================ */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCreateModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 flex items-center justify-between text-white z-10">
              <div className="flex items-center gap-3"><Plus size={24} />
                <div><h2 className="text-lg font-semibold">New Booking</h2><p className="text-sm text-green-100">Your booking, attributed to you</p></div></div>
              <button onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-white/20 rounded"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Customer */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                    <input type="text" value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Client name" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input type="email" value={formData.customerEmail}
                      onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input type="tel" value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">ID Number</label>
                    <input type="text" value={formData.customerIdNumber}
                      onChange={(e) => setFormData({ ...formData, customerIdNumber: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                  <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Driver's License Number</label>
                    <input type="text" value={formData.customerLicenseNumber}
                      onChange={(e) => setFormData({ ...formData, customerLicenseNumber: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="DL-123456789" /></div>
                </div>

                {/* ✅ ID & License Image Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ID Image</label>
                    <div className="flex items-center gap-2">
                      <input ref={idImageRef} type="file" accept="image/*" onChange={handleIdImageUpload} className="hidden" />
                      <button type="button" onClick={() => idImageRef.current?.click()}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs flex items-center gap-1">
                        <Upload size={14} /> Upload
                      </button>
                      {idImagePreview && (
                        <div className="relative inline-block">
                          <img src={idImagePreview} alt="ID" className="h-10 w-10 object-cover rounded border" />
                          <button type="button" onClick={removeIdImage}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                            style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">License Image</label>
                    <div className="flex items-center gap-2">
                      <input ref={licenseImageRef} type="file" accept="image/*" onChange={handleLicenseImageUpload} className="hidden" />
                      <button type="button" onClick={() => licenseImageRef.current?.click()}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs flex items-center gap-1">
                        <Upload size={14} /> Upload
                      </button>
                      {licenseImagePreview && (
                        <div className="relative inline-block">
                          <img src={licenseImagePreview} alt="License" className="h-10 w-10 object-cover rounded border" />
                          <button type="button" onClick={removeLicenseImage}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                            style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vehicle & Dates */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Vehicle & Dates</h3>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Select Vehicle *</label>
                  <select value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                    <option value="">Select a vehicle...</option>
                    {availableVehicles.map(v => {
                      const startDT = formData.startDate ? `${formData.startDate}T${formData.startTime || '08:00'}` : null;
                      const endDT = formData.endDate ? `${formData.endDate}T${formData.endTime || '18:00'}` : null;
                      const isAvail = isVehicleAvailableForDates(v.id, startDT, endDT);
                      return <option key={v.id} value={v.id} disabled={!isAvail}>
                        {v.registration} - {v.make} {v.model} (KSh {v.pricePerDay}/day) {isAvail ? '✅' : '❌'}
                      </option>;
                    })}
                  </select>
                </div>

                {/* Availability banner */}
                {formData.vehicleId && formData.startDate && formData.endDate && (() => {
                  const startDT = `${formData.startDate}T${formData.startTime || '08:00'}`;
                  const endDT = `${formData.endDate}T${formData.endTime || '18:00'}`;
                  const isAvail = isVehicleAvailableForDates(formData.vehicleId, startDT, endDT);
                  const conflicts = getOverlappingBookings(formData.vehicleId, startDT, endDT);
                  if (!isAvail) {
                    const c = conflicts[0];
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-2 mt-2 text-sm text-red-700 flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>❌ Vehicle is booked {c ? `from ${formatDateTime(c.startDate)} to ${formatDateTime(c.endDate)}` : 'for these dates'}.</span>
                      </div>
                    );
                  }
                  return (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2 text-sm text-green-700 flex items-center gap-2">
                      <CheckCircle size={16} />
                      <span>✅ Vehicle is available</span>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Start *</label>
                    <input type="date" value={formData.startDate}
                      onChange={(e) => {
                        const startDate = e.target.value;
                        const days = calculateDays(startDate, formData.endDate);
                        setFormData(prev => ({ ...prev, startDate, days }));
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Start Time</label>
                    <input type="time" value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">End *</label>
                    <input type="date" value={formData.endDate}
                      onChange={(e) => {
                        const endDate = e.target.value;
                        const days = calculateDays(formData.startDate, endDate);
                        setFormData(prev => ({ ...prev, endDate, days }));
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">End Time</label>
                    <input type="time" value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                </div>
                {formData.vehicleId && formData.days > 0 && (
                  <div className="bg-blue-50 rounded-lg p-3 mt-3">
                    <p className="text-sm"><strong>KSh {(getVehicleDetails(formData.vehicleId)?.pricePerDay || 0).toLocaleString()}</strong>/day × <strong>{formData.days}</strong> = <strong className="text-green-600">KSh {((getVehicleDetails(formData.vehicleId)?.pricePerDay || 0) * formData.days).toLocaleString()}</strong></p>
                  </div>
                )}
              </div>

              {/* ✅ Vehicle Condition Images */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Vehicle Condition Images</h3>
                <div onClick={() => vehicleImageRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-500 transition-colors">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Camera size={20} />
                    <span className="text-xs">Upload damage, scratches, etc.</span>
                  </div>
                  <input ref={vehicleImageRef} type="file" accept="image/*" multiple onChange={handleVehicleImageUpload} className="hidden" />
                </div>
                {vehicleImagePreviews.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {vehicleImagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img src={preview} alt={`Vehicle ${index + 1}`} className="h-16 w-full object-cover rounded" />
                        <button type="button" onClick={() => removeVehicleImage(index)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payment */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Method</label>
                    <select value={formData.paymentMethod}
                      onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                      <option value="CASH">Cash</option><option value="M_PESA">M-Pesa</option>
                      <option value="BANK_TRANSFER">Bank Transfer</option><option value="CREDIT">Credit</option>
                    </select></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                    <select value={formData.paymentStatus}
                      onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                      <option value="PENDING">Pending</option><option value="PAID">Paid</option><option value="PARTIAL">Partial</option>
                    </select></div>
                </div>
                                {/* ✅ Paid amount input — shown only for PARTIAL */}
                {formData.paymentStatus === 'PARTIAL' && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Amount Paid (KES) *</label>
                    <input type="number" value={formData.paidAmount}
                      onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                      placeholder="Amount paid so far"
                      min="0"
                      max={formData.vehicleId ? (getVehicleDetails(formData.vehicleId)?.pricePerDay || 0) * (formData.days || 1) : undefined}
                      step="50" />
                    {formData.vehicleId && (
                      <p className="text-[10px] text-gray-500 mt-1">
                        Total: KSh {((getVehicleDetails(formData.vehicleId)?.pricePerDay || 0) * (formData.days || 1)).toLocaleString()}
                        {' '}| Outstanding: KSh {Math.max(0, ((getVehicleDetails(formData.vehicleId)?.pricePerDay || 0) * (formData.days || 1)) - (formData.paidAmount || 0)).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows="2" /></div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-3 flex justify-end gap-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
              <button onClick={handleCreateBooking} disabled={isSubmitting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2">
                <Save size={16} /> {isSubmitting ? 'Creating...' : 'Create Booking'}
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
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-3"><Calendar size={24} />
                <div><h2 className="text-lg font-semibold">Booking Details</h2><p className="text-sm text-blue-100">Ref: {selectedBooking.reference}</p></div></div>
              <button onClick={() => setShowDetailModal(false)} className="p-1 hover:bg-white/20 rounded"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div><span className="text-xs text-gray-500">Name:</span> <span className="text-sm font-medium">{selectedBooking.customerName}</span></div>
                  <div><span className="text-xs text-gray-500">Email:</span> <span className="text-sm font-medium">{selectedBooking.customerEmail || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">Phone:</span> <span className="text-sm font-medium">{selectedBooking.customerPhone || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">ID:</span> <span className="text-sm font-medium">{selectedBooking.customerIdNumber || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">License:</span> <span className="text-sm font-medium">{selectedBooking.customerLicenseNumber || 'N/A'}</span></div>
                  <div className="col-span-2"><span className="text-xs text-gray-500">Status:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getStatusBadge(selectedBooking.status).color}`}>{getStatusBadge(selectedBooking.status).label}</span></div>
                </div>
                {/* Show ID & License images if present */}
                {(selectedBooking.customerIdImage || selectedBooking.customerLicenseImage) && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {selectedBooking.customerIdImage && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">ID Image:</p>
                        <img src={selectedBooking.customerIdImage} alt="ID" className="max-h-32 rounded border" />
                      </div>
                    )}
                    {selectedBooking.customerLicenseImage && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">License Image:</p>
                        <img src={selectedBooking.customerLicenseImage} alt="License" className="max-h-32 rounded border" />
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Vehicle</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div><span className="text-xs text-gray-500">Vehicle:</span> <span className="text-sm font-medium">{selectedBooking.vehicleRegistration || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">Make/Model:</span> <span className="text-sm font-medium">{selectedBooking.vehicleMake || 'N/A'} {selectedBooking.vehicleModel || ''}</span></div>
                  <div><span className="text-xs text-gray-500">Rate/Day:</span> <span className="text-sm font-medium">KSh {(selectedBooking.vehiclePricePerDay || 0).toLocaleString()}</span></div>
                </div>
                {selectedBooking.vehicleConditionImages && (() => {
                  try {
                    const imgs = typeof selectedBooking.vehicleConditionImages === 'string' ? JSON.parse(selectedBooking.vehicleConditionImages) : selectedBooking.vehicleConditionImages;
                    if (Array.isArray(imgs) && imgs.length > 0) {
                      return (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Condition Images:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {imgs.map((img, i) => (
                              <img key={i} src={img} alt={`Cond ${i+1}`} className="h-16 w-full object-cover rounded border" />
                            ))}
                          </div>
                        </div>
                      );
                    }
                  } catch {}
                  return null;
                })()}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Booking</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div className="col-span-2"><span className="text-xs text-gray-500">Start:</span> <span className="text-sm font-medium ml-1">{formatDateTime(selectedBooking.startDate)}</span></div>
                  <div className="col-span-2"><span className="text-xs text-gray-500">End:</span> <span className="text-sm font-medium ml-1">{formatDateTime(selectedBooking.endDate)}</span></div>
                  <div><span className="text-xs text-gray-500">Days:</span> <span className="text-sm font-medium">{selectedBooking.days || 0}</span></div>
                  <div>
  <span className="text-xs text-gray-500">Total:</span>{' '}
  <span className="text-sm font-bold text-green-600">
    KSh {(
      (selectedBooking.vehiclePricePerDay || 0) * (selectedBooking.days || 0) - (selectedBooking.discountAmount || 0)
    ).toLocaleString()}
  </span>
</div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment</h3>
                <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                  <div><span className="text-xs text-gray-500">Method:</span> <span className="text-sm font-medium flex items-center gap-1">{getPaymentMethodIcon(selectedBooking.paymentMethod)} {selectedBooking.paymentMethod || 'N/A'}</span></div>
                  <div><span className="text-xs text-gray-500">Status:</span> <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getPaymentStatusBadge(selectedBooking.paymentStatus).color}`}>{getPaymentStatusBadge(selectedBooking.paymentStatus).label}</span></div>
                  <div><span className="text-xs text-gray-500">Paid:</span> <span className="text-sm font-medium text-green-600">KSh {(selectedBooking.paidAmount || 0).toLocaleString()}</span></div>
                  {(() => {
  const baseTotal =
    (selectedBooking.vehiclePricePerDay || 0) * (selectedBooking.days || 0) -
    (selectedBooking.discountAmount || 0);
  const baseOutstanding = baseTotal - (selectedBooking.paidAmount || 0);
  if (baseOutstanding <= 0) return null;
  return (
    <div className="col-span-2">
      <span className="text-xs text-gray-500">Outstanding:</span>
      <span className="text-sm font-bold text-orange-600">
        KSh {baseOutstanding.toLocaleString()}
      </span>
    </div>
  );
})()}
                </div>
              </div>
              {selectedBooking.notes && (
                <div><h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4"><p className="text-sm text-gray-600">{selectedBooking.notes}</p></div></div>
              )}
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-3 flex justify-end gap-2 flex-wrap">
              <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">Close</button>
              {selectedBooking.remainingBalance > 0 && (
                <button onClick={() => { setShowDetailModal(false); setPaymentForm({ amount: '', paymentMethod: 'CASH', mpesaCode: '', notes: '' }); setShowPaymentModal(true); }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm flex items-center gap-2">
                  <CreditCard size={16} /> Record Payment
                </button>
              )}
              <button onClick={() => { setShowDetailModal(false); setSelectedBooking(selectedBooking); setShowStatusModal(true); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Modal */}
      {showStatusModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowStatusModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3"><Clock size={24} className="text-blue-500" /></div>
              <h2 className="text-lg font-semibold text-gray-800">Update Status</h2>
              <p className="text-sm text-gray-500 mt-1">Current: <span className={`font-medium ${getStatusBadge(selectedBooking.status).color}`}>{getStatusBadge(selectedBooking.status).label}</span></p>
              <div className="mt-4 space-y-2">
                {['confirmed', 'completed', 'cancelled'].map(status => (
                  <button key={status} onClick={() => handleStatusUpdate(selectedBooking.id, status)}
                    className="w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 flex items-center justify-between">
                    <span className="text-sm">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    {selectedBooking.status === status && <CheckCircle size={16} className="text-blue-600" />}
                  </button>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm font-medium text-gray-700 mb-2">Payment Status</p>
                <div className="space-y-2">
                  {['PAID', 'PARTIAL', 'PENDING'].map(status => (
                    <button key={status} onClick={() => handlePaymentStatusUpdate(selectedBooking.id, status)}
                      className="w-full px-4 py-2 text-left rounded-lg hover:bg-gray-50 flex items-center justify-between">
                      <span className="text-sm">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                      {selectedBooking.paymentStatus === status && <CheckCircle size={16} className="text-blue-600" />}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setShowStatusModal(false)} className="mt-4 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm w-full">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Terms Modal */}
      <TermsAndConditions
        isOpen={showTermsModal}
        onClose={() => { setShowTermsModal(false); setPendingBookingAction(null); }}
        onAccept={handleTermsAccept}
        onDecline={handleTermsDecline}
        title="Hire Agreement Terms & Conditions"
        serviceType="car_hire"
      />

      {/* ============================================ */}
      {/* EDIT MODAL — with ID, License, Vehicle images */}
      {/* ============================================ */}
      {showEditModal && editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white z-10">
              <div className="flex items-center gap-3"><Edit2 size={24} />
                <div><h2 className="text-lg font-semibold">Edit Booking</h2><p className="text-sm text-blue-100">Ref: {editingBooking.reference}</p></div></div>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-white/20 rounded"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Customer</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                    <input type="text" value={editFormData.customerName}
                      onChange={(e) => setEditFormData({ ...editFormData, customerName: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                    <input type="email" value={editFormData.customerEmail}
                      onChange={(e) => setEditFormData({ ...editFormData, customerEmail: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                    <input type="tel" value={editFormData.customerPhone}
                      onChange={(e) => setEditFormData({ ...editFormData, customerPhone: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                  <div><label className="block text-xs font-medium text-gray-600 mb-1">ID Number</label>
                    <input type="text" value={editFormData.customerIdNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, customerIdNumber: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                  <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Driver's License Number</label>
                    <input type="text" value={editFormData.customerLicenseNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, customerLicenseNumber: e.target.value })}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                </div>

                {/* ✅ ID & License Image Uploads (Edit) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">ID Image</label>
                    <div className="flex items-center gap-2">
                      <input ref={editIdImageRef} type="file" accept="image/*" onChange={handleEditIdImageUpload} className="hidden" />
                      <button type="button" onClick={() => editIdImageRef.current?.click()}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs flex items-center gap-1">
                        <Upload size={14} /> Upload
                      </button>
                      {editFormData.customerIdImage && (
                        <div className="relative inline-block">
                          <img src={editFormData.customerIdImage} alt="ID" className="h-10 w-10 object-cover rounded border" />
                          <button type="button" onClick={() => setEditFormData(prev => ({ ...prev, customerIdImage: null }))}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                            style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">License Image</label>
                    <div className="flex items-center gap-2">
                      <input ref={editLicenseImageRef} type="file" accept="image/*" onChange={handleEditLicenseImageUpload} className="hidden" />
                      <button type="button" onClick={() => editLicenseImageRef.current?.click()}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs flex items-center gap-1">
                        <Upload size={14} /> Upload
                      </button>
                      {editFormData.customerLicenseImage && (
                        <div className="relative inline-block">
                          <img src={editFormData.customerLicenseImage} alt="License" className="h-10 w-10 object-cover rounded border" />
                          <button type="button" onClick={() => setEditFormData(prev => ({ ...prev, customerLicenseImage: null }))}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"
                            style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={10} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle *</label>
                <select value={editFormData.vehicleId}
                  onChange={(e) => {
                    const vehicleId = e.target.value;
                    if (!vehicleId) { setEditFormData(prev => ({ ...prev, vehicleId: '' })); return; }
                    const startDT = editFormData.startDate ? `${editFormData.startDate}T${editFormData.startTime || '08:00'}` : null;
                    const endDT = editFormData.endDate ? `${editFormData.endDate}T${editFormData.endTime || '18:00'}` : null;
                    if (startDT && endDT) {
                      const conflicts = getOverlappingBookings(vehicleId, startDT, endDT, editingBooking?.id);
                      if (conflicts.length > 0) {
                        const c = conflicts[0];
                        showNotification(`❌ Booked from ${formatDateTime(c.startDate)} to ${formatDateTime(c.endDate)}`, 'error');
                        setEditFormData(prev => ({ ...prev, vehicleId: '' }));
                        return;
                      }
                    }
                    const vehicle = vehicles.find(v => v.id === vehicleId);
                    const days = editFormData.days || 1;
                    const pricePerDay = parseFloat(vehicle?.pricePerDay) || 0;
                    const subtotal = pricePerDay * days;
                    const discountAmount = editFormData.discountAmount || 0;
                    const finalTotal = subtotal - discountAmount;
                    setEditFormData(prev => ({ ...prev, vehicleId, bookingFee: pricePerDay.toString(), subtotal, totalPrice: finalTotal, remainingBalance: finalTotal - (prev.paidAmount || 0) }));
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white">
                  <option value="">Select...</option>
                  {vehicles.filter(v => v.status === 'active').map(v => {
                    const startDT = editFormData.startDate ? `${editFormData.startDate}T${editFormData.startTime || '08:00'}` : null;
                    const endDT = editFormData.endDate ? `${editFormData.endDate}T${editFormData.endTime || '18:00'}` : null;
                    const isAvail = (startDT && endDT)
                      ? getOverlappingBookings(v.id, startDT, endDT, editingBooking?.id).length === 0
                      : true;
                    const isCurrent = v.id === editFormData.vehicleId;
                    return (
                      <option key={v.id} value={v.id} disabled={!isAvail && !isCurrent}>
                        {v.registration} - {v.make} {v.model} (KSh {v.pricePerDay}/day) {isAvail || isCurrent ? '✅' : '❌'}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Start *</label>
                  <input type="date" value={editFormData.startDate}
                    onChange={(e) => {
                      const startDate = e.target.value;
                      const days = calculateDays(startDate, editFormData.endDate);
                      setEditFormData(prev => ({ ...prev, startDate, days }));
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">End *</label>
                  <input type="date" value={editFormData.endDate}
                    onChange={(e) => {
                      const endDate = e.target.value;
                      const days = calculateDays(editFormData.startDate, endDate);
                      setEditFormData(prev => ({ ...prev, endDate, days }));
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" /></div>
              </div>

              {/* ✅ Vehicle Condition Images (Edit) */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Condition Images</label>
                <div onClick={() => editVehicleImageRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-500 transition-colors">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Camera size={20} />
                    <span className="text-xs">Upload damage, scratches, etc.</span>
                  </div>
                  <input ref={editVehicleImageRef} type="file" accept="image/*" multiple onChange={handleEditVehicleImageUpload} className="hidden" />
                </div>
                {(() => {
                  let images = editFormData.vehicleConditionImages;
                  if (typeof images === 'string') { try { images = JSON.parse(images); } catch { images = []; } }
                  if (!Array.isArray(images)) images = [];
                  if (images.length === 0) return null;
                  return (
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {images.map((preview, index) => (
                        <div key={index} className="relative">
                          <img src={preview} alt={`Vehicle ${index + 1}`} className="h-16 w-full object-cover rounded" />
                          <button type="button" onClick={() => removeEditVehicleImage(index)}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-0.5">
                            <X size={10} />
                          </button>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Amount Paid (KES)</label>
                <input type="number" value={editFormData.paidAmount}
                  onChange={(e) => {
                    const paid = parseFloat(e.target.value) || 0;
                    const total = editFormData.bookingFee ? parseFloat(editFormData.bookingFee) * (editFormData.days || 1) : 0;
                    setEditFormData(prev => ({ ...prev, paidAmount: paid, remainingBalance: total - paid }));
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="0" min="0" step="50" />
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none" rows="2" /></div>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-3 flex justify-end gap-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm">Cancel</button>
              <button onClick={handleEditBooking} disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2">
                <Save size={16} /> {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Car Hire Bookings</h1>
          <p className="text-gray-500 text-sm mt-1">Bookings you created for clients</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => loadData(tenantId)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
            <RefreshCw size={18} />
          </button>
          <button onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2">
            <Plus size={16} /> New Booking
          </button>
        </div>
      </div>

      {/* Stats */}
{bookings.length > 0 && (
  <div className="flex flex-wrap gap-2 sm:grid sm:grid-cols-6 sm:gap-3 mb-6">
    <div className="grow basis-[calc(33.333%-0.5rem)] sm:basis-auto bg-white border border-gray-100 rounded-lg p-3">
      <p className="text-xs text-gray-400">Total</p>
      <p className="text-xl font-bold text-gray-800">{totalBookings}</p>
    </div>
    <div className="grow basis-[calc(33.333%-0.5rem)] sm:basis-auto bg-white border border-gray-100 rounded-lg p-3">
      <p className="text-xs text-gray-400">⏳ Pending</p>
      <p className="text-xl font-bold text-yellow-600">{pendingBookings}</p>
    </div>
    <div className="grow basis-[calc(33.333%-0.5rem)] sm:basis-auto bg-white border border-gray-100 rounded-lg p-3">
      <p className="text-xs text-gray-400">📌 Confirmed</p>
      <p className="text-xl font-bold text-blue-600">{confirmedBookings}</p>
    </div>
    <div className="grow basis-[calc(33.333%-0.5rem)] sm:basis-auto bg-white border border-gray-100 rounded-lg p-3">
      <p className="text-xs text-gray-400">✅ Completed</p>
      <p className="text-xl font-bold text-green-600">{completedBookings}</p>
    </div>
    <div className="grow basis-[calc(33.333%-0.5rem)] sm:basis-auto bg-white border border-gray-100 rounded-lg p-3">
      <p className="text-xs text-gray-400">💰 Revenue</p>
      <p className="text-xl font-bold text-purple-600">KSh {(totalRevenue || 0).toLocaleString()}</p>
    </div>
    <div className="grow basis-[calc(33.333%-0.5rem)] sm:basis-auto bg-white border border-gray-100 rounded-lg p-3">
      <p className="text-xs text-gray-400">💳 Credit O/S</p>
      <p className="text-xl font-bold text-red-600">KSh {(totalCreditOutstanding || 0).toLocaleString()}</p>
    </div>
  </div>
)}

      {/* ✅ FILTER BAR — search + status + date range */}
<div className="bg-white rounded-lg shadow-sm p-3 mb-6">
  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
    {/* Search - 1 column on mobile */}
    <div className="relative col-span-1">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        placeholder="Search my bookings..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
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

    {/* Status - 1 column on mobile */}
    <select
      value={filterStatus}
      onChange={(e) => setFilterStatus(e.target.value)}
      className="col-span-1 border border-gray-200 rounded-lg px-2 sm:px-3 py-2 text-sm bg-white"
    >
      {statusOptions.map(s => (
        <option key={s} value={s}>
          {s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}
        </option>
      ))}
    </select>

    {/* From Date - shares row with To Date on mobile */}
    <div className="col-span-1">
      <input
        type={filterStartDateFocused ? 'date' : 'text'}
        placeholder="From: dd/mm/yyyy"
        value={filterStartDate}
        onChange={(e) => setFilterStartDate(e.target.value)}
        onFocus={(e) => {
          setFilterStartDateFocused(true);
          e.target.type = 'date';
          e.target.showPicker?.();
        }}
        onBlur={() => setFilterStartDateFocused(false)}
        className="w-full border border-gray-200 rounded-lg px-2 sm:px-3 py-2 text-sm"
      />
    </div>

    {/* To Date - shares row with From Date on mobile */}
    <div className="col-span-1">
      <input
        type={filterEndDateFocused ? 'date' : 'text'}
        placeholder="To: dd/mm/yyyy"
        value={filterEndDate}
        onChange={(e) => setFilterEndDate(e.target.value)}
        onFocus={(e) => {
          setFilterEndDateFocused(true);
          e.target.type = 'date';
          e.target.showPicker?.();
        }}
        onBlur={() => setFilterEndDateFocused(false)}
        className="w-full border border-gray-200 rounded-lg px-2 sm:px-3 py-2 text-sm"
      />
    </div>
  </div>

  {(filterStartDate || filterEndDate) && (
    <div className="mt-2 flex items-center gap-2 text-xs text-gray-500 flex-wrap">
      <span>📅 Filtering by start date:</span>
      {filterStartDate && <span className="font-medium">{filterStartDate}</span>}
      {filterStartDate && filterEndDate && <span>→</span>}
      {filterEndDate && <span className="font-medium">{filterEndDate}</span>}
      <button
        onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }}
        className="text-red-500 hover:text-red-700 flex items-center gap-0.5 ml-1"
      >
        <X size={12} /> Clear
      </button>
    </div>
  )}
</div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading my bookings...</div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No bookings match your filters</p>
          <p className="text-sm text-gray-400">
            {(filterStartDate || filterEndDate || searchQuery || filterStatus !== 'all')
              ? 'Try adjusting your filters'
              : 'Click "New Booking" to create your first booking'}
          </p>
          <button onClick={() => { resetForm(); setShowCreateModal(true); }}
            className="mt-3 px-4 py-2 bg-green-600 text-white rounded-lg text-sm">
            <Plus size={16} className="inline mr-1" /> New Booking
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
  <tr>
    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Customer</th>
    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Vehicle</th>
    <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Dates</th>
    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Days</th>
    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Subtotal</th>
    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Discount</th>
    <th className="px-3 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Base Fee</th>
    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Payment</th>
    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Status</th>
    <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">Actions</th>
  </tr>
</thead>
                <tbody className="divide-y">
                  {currentItems.map((booking) => {
                    const vehicle = getVehicleDetails(booking.vehicleId);
                    const statusBadge = getStatusBadge(booking.status);
                    const StatusIcon = statusBadge.icon;
                    const hasRemainingBalance = (booking.remainingBalance || 0) > 0;
                    return (
                      <tr key={booking.id} className="hover:bg-gray-50 transition-colors">
  {/* Customer */}
  <td className="px-3 py-3 whitespace-nowrap">
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(booking.status)}`}></div>
      <div>
        <p className="font-medium text-gray-800 text-sm">{booking.customerName || 'Customer'}</p>
        <p className="text-xs text-gray-400 truncate max-w-[120px]">{booking.customerPhone || ''}</p>
        <span className="text-[10px] font-bold mt-0.5 inline-block text-orange-600">👤 Broker</span>
      </div>
    </div>
  </td>

  {/* Vehicle */}
  <td className="px-3 py-3 whitespace-nowrap">
    <div className="text-xs">
      <p className="font-medium text-gray-700">{vehicle ? `${vehicle.make} ${vehicle.model}` : 'N/A'}</p>
      <p className="text-gray-400">{vehicle?.registration || 'N/A'}</p>
      <p className="text-green-600 text-[10px]">KSh {booking.vehiclePricePerDay?.toLocaleString()}/day</p>
    </div>
  </td>

  {/* Dates */}
  <td className="px-3 py-3 whitespace-nowrap">
    <div className="text-xs">
      <p className="text-gray-600">{formatDateTime(booking.startDate)}</p>
      <p className="text-gray-400">→ {formatDateTime(booking.endDate)}</p>
    </div>
  </td>

  {/* Days */}
  <td className="px-3 py-3 text-center whitespace-nowrap">
    <span className="font-semibold text-blue-600 text-sm">{booking.days || 0}</span>
  </td>

  {/* Subtotal */}
  <td className="px-3 py-3 text-right whitespace-nowrap">
    <span className="text-sm text-gray-700">KSh {(booking.subtotal || 0).toLocaleString()}</span>
  </td>

  {/* Discount */}
  <td className="px-3 py-3 text-right whitespace-nowrap">
    {(booking.discountAmount || 0) > 0 ? (
      <div>
        <span className="text-sm text-green-600 font-medium">-KSh {(booking.discountAmount || 0).toLocaleString()}</span>
        <p className="text-[10px] text-gray-400">
          {booking.discountType === 'PERCENTAGE' ? `${booking.discountValue}%` :
           booking.discountType === 'FIXED' ? 'Fixed' : 'None'}
        </p>
      </div>
    ) : (
      <span className="text-sm text-gray-400">None</span>
    )}
  </td>

    {/* Final Fee — base only (no commission) */}
  <td className="px-3 py-3 text-right whitespace-nowrap">
    <span className="text-sm font-bold text-green-600">
      KSh {(
        (booking.vehiclePricePerDay || 0) * (booking.days || 0) - (booking.discountAmount || 0)
      ).toLocaleString()}
    </span>
    <p className="text-[10px] text-gray-400">
      @{booking.vehiclePricePerDay?.toLocaleString() || 0}/day
    </p>
  </td>

  

  {/* Payment */}
  <td className="px-3 py-3 text-center whitespace-nowrap">
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-xs">{getPaymentMethodIcon(booking.paymentMethod)}</span>
      <span className={`text-[10px] px-2 py-0.5 rounded-full ${
        booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
        booking.paymentStatus === 'PARTIAL' ? 'bg-blue-100 text-blue-800' :
        'bg-yellow-100 text-yellow-800'
      }`}>{booking.paymentStatus || 'PENDING'}</span>
      {(() => {
  const baseTotal =
    (booking.vehiclePricePerDay || 0) * (booking.days || 0) -
    (booking.discountAmount || 0);
  const baseOutstanding = baseTotal - (booking.paidAmount || 0);
  if (baseOutstanding <= 0) return null;
  return (
    <span className="text-[10px] text-orange-600 font-medium">
      O/S: KSh {baseOutstanding.toLocaleString()}
    </span>
  );
})()}
      {booking.mpesaCode && (
        <span className="text-[8px] font-mono text-blue-500 truncate max-w-[80px]">{booking.mpesaCode}</span>
      )}
    </div>
  </td>

  {/* Status */}
  <td className="px-3 py-3 text-center whitespace-nowrap">
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color} flex items-center gap-1 justify-center`}>
      <StatusIcon size={12} /> {statusBadge.label}
    </span>
  </td>

  {/* Actions */}
  <td className="px-1.5 py-1.5 text-center whitespace-nowrap">
    <div className="flex items-center justify-center gap-0.5 sm:gap-1">
      <button
        onClick={() => { setSelectedBooking(booking); setShowDetailModal(true); }}
        className="p-1 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
        title="View Details"
      >
        <Eye size={11} className="sm:w-[13px] sm:h-[13px]" />
      </button>
      <button
        onClick={() => {
          setEditingBooking(booking);
          setEditFormData({
            customerName: booking.customerName || '',
            customerEmail: booking.customerEmail || '',
            customerPhone: booking.customerPhone || '',
            customerIdNumber: booking.customerIdNumber || '',
            customerLicenseNumber: booking.customerLicenseNumber || '',
            customerIdImage: booking.customerIdImage || null,
            customerLicenseImage: booking.customerLicenseImage || null,
            vehicleId: booking.vehicleId || '',
            startDate: booking.startDate ? booking.startDate.split('T')[0] : '',
            startTime: booking.startTime || '08:00',
            endDate: booking.endDate ? booking.endDate.split('T')[0] : '',
            endTime: booking.endTime || '18:00',
            notes: booking.notes || '',
            bookingFee: booking.bookingFeePerDay?.toString() || '',
            days: booking.days || 0,
            discountType: booking.discountType || 'NONE',
            discountValue: booking.discountValue || '',
            discountAmount: booking.discountAmount || 0,
            paymentMethod: booking.paymentMethod || 'CASH',
            paymentStatus: booking.paymentStatus || 'PENDING',
            mpesaCode: booking.mpesaCode || '',
            paidAmount: booking.paidAmount || 0,
            remainingBalance: booking.remainingBalance || 0,
            vehicleConditionImages: booking.vehicleConditionImages || []
          });
          setShowEditModal(true);
        }}
        className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Edit Booking"
      >
        <Edit2 size={11} className="sm:w-[13px] sm:h-[13px]" />
      </button>
      {hasRemainingBalance && (
        <button
          onClick={() => {
            setSelectedBooking(booking);
            setPaymentForm({ amount: '', paymentMethod: 'CASH', mpesaCode: '', notes: '' });
            setShowPaymentModal(true);
          }}
          className="p-1 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
          title="Record Payment"
        >
          <CreditCard size={11} className="sm:w-[13px] sm:h-[13px]" />
        </button>
      )}
      <button
        onClick={() => handlePrintBooking(booking)}
        className="p-1 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        title="Print Booking"
      >
        <FileText size={11} className="sm:w-[13px] sm:h-[13px]" />
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 px-2">
              <div className="text-sm text-gray-500">Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBookings.length)} of {filteredBookings.length}</div>
              <div className="flex items-center gap-1">
                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}
                  className={`p-2 rounded-lg border ${currentPage === 1 ? 'opacity-50' : 'hover:bg-gray-50'}`}><ChevronLeft size={16} /></button>
                <span className="px-3 text-sm">Page {currentPage} of {totalPages}</span>
                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border ${currentPage === totalPages ? 'opacity-50' : 'hover:bg-gray-50'}`}><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-gray-200 pt-4">
        © 2026 Sulul Tours &amp; Travel. All rights reserved.
      </div>
    </div>
  );
};

export default BrokerCarBookings;