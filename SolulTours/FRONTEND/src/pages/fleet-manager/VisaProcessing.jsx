import React, { useState, useEffect, useRef } from 'react';
import { 
  Plus, Search, Filter, RefreshCw, Eye, Edit2, Trash2,
  X, Save, Calendar, Users, 
  MapPin, Clock, DollarSign, AlertCircle,
  CheckCircle, Camera, Tag, Download,
  Printer, FileText, Upload, Image,
  User, Phone, Mail, MapPinned,
  Shield, FileCheck, Globe,
  AlertTriangle, CheckSquare, Clock as ClockIcon,
  Plane, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { visaService, bookingService, flightService } from '../../services/api';

const VisaProcessing = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [visaApplications, setVisaApplications] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedVisa, setSelectedVisa] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showFlightBookingModal, setShowFlightBookingModal] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingVisa, setEditingVisa] = useState(null);
  const [tenantId, setTenantId] = useState(null);

  // Image upload refs
  const passportInputRef = useRef(null);
  const [passportPreview, setPassportPreview] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    bookingId: '', // ✅ Optional - can be empty for standalone visa
    applicantName: '',
    passportNumber: '',
    nationality: '',
    dateOfBirth: '',
    passportExpiry: '',
    visaType: 'hajj',
    applicationDate: '',
    submissionDate: '',
    status: 'pending',
    processingOfficer: '',
    cost: '',
    paymentStatus: 'pending',
    notes: '',
    passportImage: null
  });

  // Flight booking form state
  const [flightBookingForm, setFlightBookingForm] = useState({
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
      console.log('🔍 Loading visa data with tenantId:', tenantToUse);
      
      if (!tenantToUse) {
        console.warn('⚠️ No tenantId available, skipping API call');
        setLoading(false);
        return;
      }
      
      // ✅ Fetch visas from API
      const visaResponse = await visaService.getAll(tenantToUse);
      console.log('📊 Visa response:', visaResponse);
      
      let visaData = [];
      if (visaResponse?.success && visaResponse?.data) {
        visaData = visaResponse.data;
      } else if (Array.isArray(visaResponse)) {
        visaData = visaResponse;
      }
      setVisaApplications(visaData);

      // ✅ Fetch bookings from API (filter for hajj bookings - optional reference)
      const bookingResponse = await bookingService.getAll(tenantToUse);
      console.log('📊 Bookings response:', bookingResponse);
      
      let bookingData = [];
      if (bookingResponse?.success && bookingResponse?.data) {
        bookingData = bookingResponse.data;
      } else if (Array.isArray(bookingResponse)) {
        bookingData = bookingResponse;
      }
      
      // Filter to hajj bookings for visa reference
      const hajjBookings = bookingData.filter(b => 
        b.serviceType === 'hajj' || b.serviceType === 'hajj_umra'
      );
      setBookings(hajjBookings);

      // ✅ Fetch flights from API
      const flightResponse = await flightService.getAll(tenantToUse);
      console.log('📊 Flights response:', flightResponse);
      
      let flightData = [];
      if (flightResponse?.success && flightResponse?.data) {
        flightData = flightResponse.data;
      } else if (Array.isArray(flightResponse)) {
        flightData = flightResponse;
      }
      setFlights(flightData);

      // Save to localStorage for fallback
      localStorage.setItem('travel_agency_visa_applications', JSON.stringify(visaData));
      localStorage.setItem('travel_agency_hajj_bookings', JSON.stringify(hajjBookings));
      localStorage.setItem('travel_agency_flights', JSON.stringify(flightData));

    } catch (error) {
      console.error('Error loading data:', error);
      showNotification('Error loading data', 'error');
      loadFromLocalStorage();
    }
    
    setLoading(false);
  };

  // ✅ Fallback to localStorage
  const loadFromLocalStorage = () => {
    console.warn('Loading visa data from localStorage (fallback)');
    try {
      const storedVisas = JSON.parse(localStorage.getItem('travel_agency_visa_applications') || '[]');
      setVisaApplications(storedVisas);
      
      const storedBookings = JSON.parse(localStorage.getItem('travel_agency_hajj_bookings') || '[]');
      setBookings(storedBookings);
      
      const storedFlights = JSON.parse(localStorage.getItem('travel_agency_flights') || '[]');
      setFlights(storedFlights);
    } catch (error) {
      console.error('Error loading from localStorage:', error);
      setVisaApplications([]);
      setBookings([]);
      setFlights([]);
    }
  };

  const resetForm = () => {
    setFormData({
      bookingId: '',
      applicantName: '',
      passportNumber: '',
      nationality: '',
      dateOfBirth: '',
      passportExpiry: '',
      visaType: 'hajj',
      applicationDate: '',
      submissionDate: '',
      status: 'pending',
      processingOfficer: '',
      cost: '',
      paymentStatus: 'pending',
      notes: '',
      passportImage: null
    });
    setPassportPreview(null);
    if (passportInputRef.current) passportInputRef.current.value = '';
  };

  const resetFlightBookingForm = () => {
    setFlightBookingForm({
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

  const handlePassportUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showNotification('Please upload an image file', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showNotification('Image must be less than 5MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({ ...prev, passportImage: event.target.result }));
      setPassportPreview(event.target.result);
      showNotification('Passport image uploaded successfully!');
    };
    reader.readAsDataURL(file);
  };

  const removePassport = () => {
    setFormData(prev => ({ ...prev, passportImage: null }));
    setPassportPreview(null);
    if (passportInputRef.current) passportInputRef.current.value = '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFlightBookingInputChange = (e) => {
    const { name, value } = e.target;
    setFlightBookingForm(prev => ({ ...prev, [name]: value }));
  };

  // ✅ Create visa via API (bookingId is optional)
  const handleCreateVisa = async () => {
    if (!formData.applicantName || !formData.passportNumber || !formData.applicationDate) {
      showNotification('Please fill in all required fields', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const newVisa = {
        bookingId: formData.bookingId || null, // ✅ Can be null for standalone visa
        applicantName: formData.applicantName,
        passportNumber: formData.passportNumber.toUpperCase(),
        nationality: formData.nationality || '',
        dateOfBirth: formData.dateOfBirth || null,
        passportExpiry: formData.passportExpiry || null,
        visaType: formData.visaType || 'hajj',
        applicationDate: formData.applicationDate || null,
        submissionDate: formData.submissionDate || null,
        status: formData.status || 'pending',
        processingOfficer: formData.processingOfficer || '',
        cost: parseFloat(formData.cost) || 0,
        paymentStatus: formData.paymentStatus || 'pending',
        passportImage: formData.passportImage || null,
        notes: formData.notes || '',
        tenantId: tenantId
      };

      console.log('📤 Creating visa application:', newVisa);
      const response = await visaService.create(newVisa);
      console.log('📥 Create response:', response);

      if (response?.success) {
        showNotification(`✅ Visa application for "${formData.applicantName}" created successfully!`);
        setShowAddModal(false);
        resetForm();
        loadData(tenantId);
      } else {
        showNotification('Failed to create visa: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error creating visa:', error);
      showNotification('Failed to create visa. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  // ✅ Edit visa via API
  const handleEditVisa = async () => {
    if (!editingVisa) return;

    setIsSubmitting(true);

    try {
      const updatedVisa = {
        bookingId: formData.bookingId || null,
        applicantName: formData.applicantName,
        passportNumber: formData.passportNumber.toUpperCase(),
        nationality: formData.nationality || '',
        dateOfBirth: formData.dateOfBirth || null,
        passportExpiry: formData.passportExpiry || null,
        visaType: formData.visaType || 'hajj',
        applicationDate: formData.applicationDate || null,
        submissionDate: formData.submissionDate || null,
        status: formData.status || 'pending',
        processingOfficer: formData.processingOfficer || '',
        cost: parseFloat(formData.cost) || 0,
        paymentStatus: formData.paymentStatus || 'pending',
        passportImage: formData.passportImage || null,
        notes: formData.notes || '',
        tenantId: tenantId
      };

      console.log(`📤 Updating visa ${editingVisa.id}:`, updatedVisa);
      const response = await visaService.update(editingVisa.id, updatedVisa);
      console.log('📥 Update response:', response);

      if (response?.success) {
        showNotification(`✅ Visa application updated successfully!`);
        setShowEditModal(false);
        setEditingVisa(null);
        resetForm();
        loadData(tenantId);
      } else {
        showNotification('Failed to update visa: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error updating visa:', error);
      showNotification('Failed to update visa. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  // ✅ Delete visa via API
  const handleDeleteVisa = async () => {
    if (!selectedVisa) return;

    setIsSubmitting(true);

    try {
      console.log(`📤 Deleting visa ${selectedVisa.id}`);
      const response = await visaService.delete(selectedVisa.id);
      console.log('📥 Delete response:', response);

      if (response?.success) {
        showNotification(`✅ Visa application deleted successfully!`);
        setShowDeleteModal(false);
        setSelectedVisa(null);
        loadData(tenantId);
      } else {
        showNotification('Failed to delete visa: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error deleting visa:', error);
      showNotification('Failed to delete visa. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  // ✅ Approve visa via API
  const approveVisa = async (visaId) => {
    setIsSubmitting(true);

    try {
      console.log(`📤 Approving visa ${visaId}`);
      const response = await visaService.approve(visaId);
      console.log('📥 Approve response:', response);

      if (response?.success) {
        showNotification('✅ Visa approved successfully!');
        loadData(tenantId);
      } else {
        showNotification('Failed to approve visa: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error approving visa:', error);
      showNotification('Failed to approve visa. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  // ✅ Reject visa via API
  const rejectVisa = async (visaId) => {
    setIsSubmitting(true);

    try {
      console.log(`📤 Rejecting visa ${visaId}`);
      const response = await visaService.reject(visaId);
      console.log('📥 Reject response:', response);

      if (response?.success) {
        showNotification('❌ Visa rejected');
        loadData(tenantId);
      } else {
        showNotification('Failed to reject visa: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error rejecting visa:', error);
      showNotification('Failed to reject visa. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  const openEditModal = (visa) => {
    setEditingVisa(visa);
    setFormData({
      bookingId: visa.bookingId || '',
      applicantName: visa.applicantName || '',
      passportNumber: visa.passportNumber || '',
      nationality: visa.nationality || '',
      dateOfBirth: visa.dateOfBirth || '',
      passportExpiry: visa.passportExpiry || '',
      visaType: visa.visaType || 'hajj',
      applicationDate: visa.applicationDate || '',
      submissionDate: visa.submissionDate || '',
      status: visa.status || 'pending',
      processingOfficer: visa.processingOfficer || '',
      cost: visa.cost || '',
      paymentStatus: visa.paymentStatus || 'pending',
      notes: visa.notes || '',
      passportImage: visa.passportImage || null
    });
    setPassportPreview(visa.passportImage || null);
    setShowEditModal(true);
  };

  // ✅ Create flight booking from approved visa via API
  const handleCreateFlightBooking = async () => {
    if (!flightBookingForm.flightId) {
      showNotification('Please select a flight', 'error');
      return;
    }

    const flight = flights.find(f => f.id === flightBookingForm.flightId);
    if (!flight) {
      showNotification('Flight not found', 'error');
      return;
    }

    const totalPrice = parseFloat(flightBookingForm.totalPrice) || (flight?.economyPrice || 0) * (flightBookingForm.passengers || 1);

    let paidAmount = 0;
    let remainingBalance = totalPrice;
    let paymentStatus = flightBookingForm.paymentStatus;

    if (flightBookingForm.paymentMethod === 'CREDIT') {
      paidAmount = 0;
      remainingBalance = totalPrice;
      paymentStatus = 'PENDING';
    } else if (flightBookingForm.paymentMethod === 'M_PESA' || flightBookingForm.paymentMethod === 'CASH') {
      paidAmount = totalPrice;
      remainingBalance = 0;
      paymentStatus = 'PAID';
    }

    setIsSubmitting(true);

    try {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

      const newFlightBooking = {
        customerName: selectedVisa.applicantName,
        customerEmail: selectedVisa.bookingId ? bookings.find(b => b.id === selectedVisa.bookingId)?.customerEmail || '' : selectedVisa.applicantEmail || '',
        customerPhone: selectedVisa.bookingId ? bookings.find(b => b.id === selectedVisa.bookingId)?.customerPhone || '' : selectedVisa.applicantPhone || '',
        customerIdNumber: selectedVisa.passportNumber || '',
        flightId: flightBookingForm.flightId,
        airline: flight?.airline || '',
        flightNumber: flight?.flightNumber || '',
        origin: flight?.origin || '',
        destination: flight?.destination || '',
        departureDate: flight?.departureDate || null,
        departureTime: flight?.departureTime || null,
        arrivalDate: flight?.arrivalDate || null,
        arrivalTime: flight?.arrivalTime || null,
        duration: flight?.duration || '',
        passengers: flightBookingForm.passengers || 1,
        seatClass: flightBookingForm.seatClass || 'economy',
        totalPrice: totalPrice,
        paymentMethod: flightBookingForm.paymentMethod,
        paymentStatus: paymentStatus,
        mpesaCode: flightBookingForm.mpesaCode || '',
        paidAmount: paidAmount,
        remainingBalance: remainingBalance,
        notes: `Booked from visa application: ${selectedVisa.id}\n${flightBookingForm.notes || ''}`,
        status: 'pending',
        serviceType: 'flight',
        isGuestBooking: false,
        userId: currentUser?.id || '',
        userEmail: currentUser?.email || '',
        tenantId: tenantId
      };

      console.log('📤 Creating flight booking:', newFlightBooking);
      const response = await bookingService.create(newFlightBooking);
      console.log('📥 Create response:', response);

      if (response?.success) {
        // Update visa to mark flight booked
        const updatedVisa = {
          ...selectedVisa,
          flightBooked: true,
          flightBookingId: response.data?.id || 'booked'
        };
        await visaService.update(selectedVisa.id, updatedVisa);

        showNotification(`✅ Flight booking created successfully for ${selectedVisa.applicantName}!`);
        setShowFlightBookingModal(false);
        resetFlightBookingForm();
        loadData(tenantId);
      } else {
        showNotification('Failed to create flight booking: ' + (response?.message || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error creating flight booking:', error);
      showNotification('Failed to create flight booking. Please try again.', 'error');
    }

    setIsSubmitting(false);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
      processing: { label: 'Processing', color: 'bg-indigo-100 text-indigo-800' },
      approved: { label: 'Approved', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { label: status || 'Pending', color: 'bg-gray-100 text-gray-800' };
  };

  const getPaymentBadge = (status) => {
    const statusMap = {
      paid: { label: 'Paid', color: 'bg-green-100 text-green-800' },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      waived: { label: 'Waived', color: 'bg-gray-100 text-gray-800' }
    };
    return statusMap[status] || { label: status || 'Pending', color: 'bg-gray-100 text-gray-800' };
  };

  const getTypeLabel = (type) => {
    const labels = {
      hajj: '🕋 Hajj',
      umra: '🕌 Umra',
      tourist: '🌍 Tourist',
      business: '💼 Business',
      transit: '✈️ Transit'
    };
    return labels[type] || type || 'Hajj';
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

  const getBookingDetails = (bookingId) => {
    return bookings.find(b => b.id === bookingId);
  };

  const filteredVisas = visaApplications.filter(v => {
    const searchLower = searchQuery.toLowerCase();
    const booking = getBookingDetails(v.bookingId);
    const matchesSearch = 
      v.applicantName?.toLowerCase().includes(searchLower) ||
      v.passportNumber?.toLowerCase().includes(searchLower) ||
      v.nationality?.toLowerCase().includes(searchLower) ||
      booking?.customerName?.toLowerCase().includes(searchLower);
    
    const matchesStatus = filterStatus === 'all' || v.status === filterStatus;
    const matchesType = filterType === 'all' || v.visaType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // Stats
  const totalApplications = visaApplications.length;
  const pendingApplications = visaApplications.filter(v => v.status === 'pending').length;
  const submittedApplications = visaApplications.filter(v => v.status === 'submitted').length;
  const processingApplications = visaApplications.filter(v => v.status === 'processing').length;
  const approvedApplications = visaApplications.filter(v => v.status === 'approved').length;
  const rejectedApplications = visaApplications.filter(v => v.status === 'rejected').length;

  const statsCards = [
    { title: 'Total Applications', value: totalApplications, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Pending', value: pendingApplications, icon: ClockIcon, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { title: 'Submitted', value: submittedApplications, icon: Upload, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { title: 'Processing', value: processingApplications, icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-50' },
    { title: 'Approved', value: approvedApplications, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Rejected', value: rejectedApplications, icon: X, color: 'text-red-600', bg: 'bg-red-50' }
  ];

  const visaTypes = [
    { value: 'hajj', label: '🕋 Hajj' },
    { value: 'umra', label: '🕌 Umra' },
    { value: 'tourist', label: '🌍 Tourist' },
    { value: 'business', label: '💼 Business' },
    { value: 'transit', label: '✈️ Transit' }
  ];

  const statusOptions = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'processing', label: 'Processing' },
    { value: 'approved', label: 'Approved' },
    { value: 'rejected', label: 'Rejected' }
  ];

  // Render Form Modal (Create/Edit)
  const renderFormModal = (isEdit = false) => {
    const isOpen = isEdit ? showEditModal : showAddModal;
    const data = isEdit ? editingVisa : formData;
    const setData = isEdit ? setEditingVisa : setFormData;
    const handleSubmit = isEdit ? handleEditVisa : handleCreateVisa;
    const closeModal = () => {
      if (isEdit) {
        setShowEditModal(false);
        setEditingVisa(null);
      } else {
        setShowAddModal(false);
        resetForm();
      }
    };

    if (!isOpen) return null;

    const currentData = isEdit ? formData : data;
    const setCurrentData = isEdit ? setFormData : setData;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={closeModal}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <button 
            onClick={closeModal}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>

          <div className={`px-6 py-5 rounded-t-2xl ${isEdit ? 'bg-gradient-to-r from-blue-600 to-blue-700' : 'bg-gradient-to-r from-green-600 to-green-700'}`}>
            <h2 className="text-2xl font-bold text-white">
              {isEdit ? 'Edit Visa Application' : 'New Visa Application'}
            </h2>
            <p className={`text-sm ${isEdit ? 'text-blue-100' : 'text-green-100'}`}>
              {isEdit ? 'Update visa application details' : 'Create a new visa application'}
            </p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Booking Reference <span className="text-xs text-gray-400">(Optional - leave blank for standalone visa)</span>
                </label>
                <select
  name="bookingId"
  value={currentData.bookingId || ''}
  onChange={(e) => setCurrentData({ ...currentData, bookingId: e.target.value })}
  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
>
  <option value="">📋 No Booking (Standalone Visa)</option>
  {bookings.map(b => (
    <option key={b.id} value={b.id}>
      {b.customerName} - {b.packageName || 'Hajj Package'}
    </option>
  ))}
</select>
                <p className="text-xs text-gray-400 mt-1">
                  💡 You can process visa without a booking. This is useful for clients who need visa only.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Applicant Name *</label>
                <input
                  type="text"
                  name="applicantName"
                  value={currentData.applicantName || ''}
                  onChange={(e) => setCurrentData({ ...currentData, applicantName: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Full name as on passport"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Number *</label>
                <input
                  type="text"
                  name="passportNumber"
                  value={currentData.passportNumber || ''}
                  onChange={(e) => setCurrentData({ ...currentData, passportNumber: e.target.value.toUpperCase() })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., A1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                <input
                  type="text"
                  name="nationality"
                  value={currentData.nationality || ''}
                  onChange={(e) => setCurrentData({ ...currentData, nationality: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Kenyan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={currentData.dateOfBirth || ''}
                  onChange={(e) => setCurrentData({ ...currentData, dateOfBirth: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Expiry</label>
                <input
                  type="date"
                  name="passportExpiry"
                  value={currentData.passportExpiry || ''}
                  onChange={(e) => setCurrentData({ ...currentData, passportExpiry: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Visa Type</label>
                <select
                  name="visaType"
                  value={currentData.visaType || 'hajj'}
                  onChange={(e) => setCurrentData({ ...currentData, visaType: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  {visaTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Application Date *</label>
                <input
                  type="date"
                  name="applicationDate"
                  value={currentData.applicationDate || ''}
                  onChange={(e) => setCurrentData({ ...currentData, applicationDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Submission Date</label>
                <input
                  type="date"
                  name="submissionDate"
                  value={currentData.submissionDate || ''}
                  onChange={(e) => setCurrentData({ ...currentData, submissionDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={currentData.status || 'pending'}
                  onChange={(e) => setCurrentData({ ...currentData, status: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="submitted">Submitted</option>
                  <option value="processing">Processing</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Processing Officer</label>
                <input
                  type="text"
                  name="processingOfficer"
                  value={currentData.processingOfficer || ''}
                  onChange={(e) => setCurrentData({ ...currentData, processingOfficer: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Officer name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost (KES)</label>
                <input
                  type="number"
                  name="cost"
                  value={currentData.cost || ''}
                  onChange={(e) => setCurrentData({ ...currentData, cost: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  name="paymentStatus"
                  value={currentData.paymentStatus || 'pending'}
                  onChange={(e) => setCurrentData({ ...currentData, paymentStatus: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="waived">Waived</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  name="notes"
                  value={currentData.notes || ''}
                  onChange={(e) => setCurrentData({ ...currentData, notes: e.target.value })}
                  rows="2"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Additional notes..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Passport Image</label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => passportInputRef.current?.click()}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2 text-sm"
                  >
                    <Upload size={16} /> Upload Passport
                  </button>
                  <input
                    ref={passportInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePassportUpload}
                    className="hidden"
                  />
                  <span className="text-xs text-gray-400">JPG, PNG (Max 5MB)</span>
                </div>
                {passportPreview && (
                  <div className="mt-3 flex items-center gap-3">
                    <img src={passportPreview} alt="Passport" className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={removePassport}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200 mt-4">
              <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {isEdit ? 'Update Application' : 'Create Application'}
              </button>
              <button 
                onClick={closeModal}
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

  // ... (rest of the component remains the same - renderDeleteModal, renderDetailModal, renderFlightBookingModal, and the return statement)

  // Render Delete Modal
  const renderDeleteModal = () => {
    if (!showDeleteModal || !selectedVisa) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowDeleteModal(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 mx-auto flex items-center justify-center mb-4">
              <AlertCircle size={32} className="text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Visa Application?</h3>
            <p className="text-gray-500 text-sm">
              Are you sure you want to delete visa application for "{selectedVisa.applicantName}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={handleDeleteVisa}
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

  // Render Detail Modal with Approve/Reject buttons
  const renderDetailModal = () => {
    if (!showDetailModal || !selectedVisa) return null;

    const statusBadge = getStatusBadge(selectedVisa.status);
    const paymentBadge = getPaymentBadge(selectedVisa.paymentStatus);
    const isApproved = selectedVisa.status === 'approved';
    const isPending = selectedVisa.status === 'pending' || selectedVisa.status === 'submitted' || selectedVisa.status === 'processing';
    const flightBooked = selectedVisa.flightBooked;
    const booking = getBookingDetails(selectedVisa.bookingId);

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

          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-white">Visa Application Details</h2>
            <p className="text-indigo-100 text-sm">{selectedVisa.applicantName}</p>
            {isApproved && (
              <span className="inline-block mt-1 px-2 py-0.5 bg-green-500/30 text-white text-xs rounded-full">
                ✅ Approved - Ready for Flight Booking
              </span>
            )}
            {flightBooked && (
              <span className="inline-block mt-1 ml-2 px-2 py-0.5 bg-blue-500/30 text-white text-xs rounded-full">
                ✈️ Flight Booked
              </span>
            )}
            {!selectedVisa.bookingId && (
              <span className="inline-block mt-1 ml-2 px-2 py-0.5 bg-gray-500/30 text-white text-xs rounded-full">
                📋 Standalone Visa
              </span>
            )}
          </div>

          <div className="p-6">
            {selectedVisa.passportImage && (
              <div className="mb-4">
                <img src={selectedVisa.passportImage} alt="Passport" className="w-full h-48 object-cover rounded-lg" />
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <FileText size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{selectedVisa.passportNumber}</p>
                <p className="text-xs text-gray-500">Passport</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <Globe size={16} className="mx-auto text-gray-400 mb-1" />
                <p className="text-sm font-semibold">{selectedVisa.nationality || 'N/A'}</p>
                <p className="text-xs text-gray-500">Nationality</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className={`text-sm font-semibold ${statusBadge.color}`}>{statusBadge.label}</span>
                <p className="text-xs text-gray-500">Status</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <span className={`text-sm font-semibold ${paymentBadge.color}`}>{paymentBadge.label}</span>
                <p className="text-xs text-gray-500">Payment</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {getTypeLabel(selectedVisa.visaType)}
              </span>
              {selectedVisa.cost && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                  {formatCurrency(selectedVisa.cost)}
                </span>
              )}
              {selectedVisa.flightBooked && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                  ✈️ Flight: {selectedVisa.flightBookingId}
                </span>
              )}
              {booking && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">
                  📋 Booking: {booking.customerName}
                </span>
              )}
              {!selectedVisa.bookingId && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                  📋 Standalone Visa
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4 bg-gray-50 rounded-lg p-4">
              <div><span className="text-xs text-gray-500">Application Date:</span> <span className="text-sm font-medium">{formatDate(selectedVisa.applicationDate)}</span></div>
              <div><span className="text-xs text-gray-500">Submission Date:</span> <span className="text-sm font-medium">{formatDate(selectedVisa.submissionDate)}</span></div>
              <div><span className="text-xs text-gray-500">Date of Birth:</span> <span className="text-sm font-medium">{formatDate(selectedVisa.dateOfBirth)}</span></div>
              <div><span className="text-xs text-gray-500">Passport Expiry:</span> <span className="text-sm font-medium">{formatDate(selectedVisa.passportExpiry)}</span></div>
              <div className="col-span-2"><span className="text-xs text-gray-500">Processing Officer:</span> <span className="text-sm font-medium">{selectedVisa.processingOfficer || 'N/A'}</span></div>
              {selectedVisa.bookingId && (
                <div className="col-span-2"><span className="text-xs text-gray-500">Booking Reference:</span> <span className="text-sm font-medium">{selectedVisa.bookingId}</span></div>
              )}
              {selectedVisa.notes && (
                <div className="col-span-2"><span className="text-xs text-gray-500">Notes:</span> <p className="text-sm text-gray-600 mt-1">{selectedVisa.notes}</p></div>
              )}
            </div>
          </div>

          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-3 flex justify-end gap-2 flex-wrap">
            <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
              Close
            </button>
            
            {isPending && (
              <>
                <button 
                  onClick={() => {
                    if (window.confirm('Approve this visa application?')) {
                      approveVisa(selectedVisa.id);
                      setShowDetailModal(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <CheckCircle size={16} /> Approve
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm('Reject this visa application?')) {
                      rejectVisa(selectedVisa.id);
                      setShowDetailModal(false);
                    }
                  }}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-2 disabled:opacity-50"
                >
                  <X size={16} /> Reject
                </button>
              </>
            )}

            {isApproved && !flightBooked && (
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  resetFlightBookingForm();
                  setShowFlightBookingModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
              >
                <Plane size={16} /> Book Flight
              </button>
            )}
            {isApproved && flightBooked && (
              <button 
                onClick={() => setActiveTab('flight-bookings')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
              >
                <Eye size={16} /> View Flight Booking
              </button>
            )}
            <button 
              onClick={() => {
                setShowDetailModal(false);
                openEditModal(selectedVisa);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Edit2 size={16} className="inline mr-1" /> Edit
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render Flight Booking Modal
  const renderFlightBookingModal = () => {
    if (!showFlightBookingModal || !selectedVisa) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowFlightBookingModal(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <button 
            onClick={() => setShowFlightBookingModal(false)}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-white">Book Flight for {selectedVisa.applicantName}</h2>
            <p className="text-blue-100 text-sm">Visa: {selectedVisa.passportNumber} • {getTypeLabel(selectedVisa.visaType)}</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Flight *</label>
                <select
                  name="flightId"
                  value={flightBookingForm.flightId}
                  onChange={handleFlightBookingInputChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Select a flight...</option>
                  {flights.filter(f => f.status === 'scheduled' || f.status === 'active').map(flight => (
                    <option key={flight.id} value={flight.id}>
                      {flight.airline} {flight.flightNumber} - {flight.origin} → {flight.destination} ({formatCurrency(flight.economyPrice)})
                    </option>
                  ))}
                </select>
              </div>

              {flightBookingForm.flightId && (
                <div className="md:col-span-2 bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-700">
                    ✈️ {flights.find(f => f.id === flightBookingForm.flightId)?.airline} {flights.find(f => f.id === flightBookingForm.flightId)?.flightNumber}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {flights.find(f => f.id === flightBookingForm.flightId)?.origin} → {flights.find(f => f.id === flightBookingForm.flightId)?.destination}
                  </p>
                  <p className="text-xs text-blue-600">
                    📅 {formatDate(flights.find(f => f.id === flightBookingForm.flightId)?.departureDate)}
                  </p>
                  <p className="text-sm font-semibold text-blue-800 mt-1">
                    💰 Price: {formatCurrency(flights.find(f => f.id === flightBookingForm.flightId)?.economyPrice || 0)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Passengers</label>
                <input
                  type="number"
                  name="passengers"
                  value={flightBookingForm.passengers}
                  onChange={handleFlightBookingInputChange}
                  min="1"
                  max="20"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seat Class</label>
                <select
                  name="seatClass"
                  value={flightBookingForm.seatClass}
                  onChange={handleFlightBookingInputChange}
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
                  name="totalPrice"
                  value={flightBookingForm.totalPrice}
                  onChange={handleFlightBookingInputChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Auto-filled from flight"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={flightBookingForm.paymentMethod}
                  onChange={handleFlightBookingInputChange}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="M_PESA">M-Pesa</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CREDIT">Credit (Pay Later)</option>
                </select>
              </div>

              {flightBookingForm.paymentMethod === 'M_PESA' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Transaction Code *</label>
                  <input
                    type="text"
                    name="mpesaCode"
                    value={flightBookingForm.mpesaCode}
                    onChange={handleFlightBookingInputChange}
                    className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., ABC123DEF456"
                  />
                </div>
              )}

              {flightBookingForm.paymentMethod === 'CREDIT' && (
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
                  name="notes"
                  value={flightBookingForm.notes}
                  onChange={handleFlightBookingInputChange}
                  rows="2"
                  className="w-full border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Special requests or notes..."
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200 mt-4">
              <button 
                onClick={handleCreateFlightBooking}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Save size={18} /> Book Flight
              </button>
              <button 
                onClick={() => setShowFlightBookingModal(false)}
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
      {renderFormModal(false)}
      {renderFormModal(true)}
      {renderDeleteModal()}
      {renderDetailModal()}
      {renderFlightBookingModal()}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Shield size={28} className="text-indigo-600" />
            Visa Processing
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage visa applications for Hajj, Umra, and other travel</p>
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
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2"
          >
            <Plus size={16} /> New Application
          </button>
        </div>
      </div>

      {/* Stats */}
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 mb-6">
  {statsCards.map((stat, index) => (
    <div key={index} className={`${stat.bg} rounded-xl p-2 sm:p-4 border border-gray-100`}>
      <div className="flex items-center justify-between">
        <stat.icon size={16} className={stat.color} />
      </div>
      <p className="text-base sm:text-2xl font-bold text-gray-800 mt-1 sm:mt-2">{stat.value}</p>
      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-tight">
        {stat.title}
      </p>
    </div>
  ))}
</div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by applicant, passport, or booking..."
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
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
          >
            <option value="all">All Types</option>
            {visaTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Visa Applications List */}
{loading ? (
  <div className="text-center py-12 text-gray-400">Loading...</div>
) : filteredVisas.length === 0 ? (
  <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
    <Shield size={48} className="mx-auto text-gray-300 mb-3" />
    <p className="text-gray-500">No visa applications found</p>
    <p className="text-sm text-gray-400">
      {searchQuery || filterStatus !== 'all' || filterType !== 'all' 
        ? 'Try adjusting your search or filters' 
        : 'Create your first visa application by clicking "New Application"'}
    </p>
    <button
      onClick={() => {
        resetForm();
        setShowAddModal(true);
      }}
      className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
    >
      <Plus size={16} className="inline mr-1" /> New Application
    </button>
  </div>
) : (
  <div className="space-y-3">
    {filteredVisas.map((visa) => {
      const statusBadge = getStatusBadge(visa.status);
      const booking = getBookingDetails(visa.bookingId);
      const hasImage = visa.passportImage !== null && visa.passportImage !== '';
      const isApproved = visa.status === 'approved';
      const flightBooked = visa.flightBooked;
      const isStandalone = !visa.bookingId;

      return (
        <div 
          key={visa.id}
          className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
        >
          <div className="p-3 sm:p-4">
            {/* Header - Name and Badges */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <FileText size={16} className="text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 truncate text-sm sm:text-base">{visa.applicantName}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                    {visa.passportNumber} • {visa.nationality || 'N/A'}
                    {booking && ` • ${booking.customerName}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                <span className={`text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                  {statusBadge.label}
                </span>
              </div>
            </div>

            {/* Badges Row */}
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                {getTypeLabel(visa.visaType)}
              </span>
              {isApproved && !flightBooked && (
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  ✈️ Ready
                </span>
              )}
              {flightBooked && (
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  ✈️ Booked
                </span>
              )}
              {isStandalone && (
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                  📋 Standalone
                </span>
              )}
              {hasImage && (
                <span className="text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                  📷 Photo
                </span>
              )}
            </div>

            {/* Details Grid - Compact */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 mt-2 text-[10px] sm:text-xs text-gray-500">
              <div>
                <span className="font-medium text-gray-600">Applied:</span>
                <span className="text-gray-700 ml-0.5">{formatDate(visa.applicationDate)}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Cost:</span>
                <span className="text-green-600 font-medium ml-0.5">{formatCurrency(visa.cost)}</span>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <span className="font-medium text-gray-600">Payment:</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[8px] sm:text-[10px] ${getPaymentBadge(visa.paymentStatus).color} ml-0.5`}>
                  {getPaymentBadge(visa.paymentStatus).label}
                </span>
              </div>
            </div>

            {visa.notes && (
              <div className="mt-1 text-[10px] sm:text-xs text-gray-500 truncate">
                <span className="font-medium text-gray-600">Notes:</span>
                <span className="text-gray-700 ml-0.5">{visa.notes}</span>
              </div>
            )}

            {/* Action Buttons - Compact */}
            <div className="flex items-center gap-1 sm:gap-1.5 mt-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => {
                  setSelectedVisa(visa);
                  setShowDetailModal(true);
                }}
                className="flex-1 px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-purple-600 hover:bg-purple-50 rounded-lg transition-colors flex items-center justify-center gap-0.5"
              >
                <Eye size={12} /> View
              </button>
              {isApproved && !flightBooked && (
                <button
                  onClick={() => {
                    setSelectedVisa(visa);
                    resetFlightBookingForm();
                    setShowFlightBookingModal(true);
                  }}
                  className="flex-1 px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-0.5"
                >
                  <Plane size={12} /> Flight
                </button>
              )}
              <button
                onClick={() => openEditModal(visa)}
                className="flex-1 px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-0.5"
              >
                <Edit2 size={12} /> Edit
              </button>
              <button
                onClick={() => {
                  setSelectedVisa(visa);
                  setShowDeleteModal(true);
                }}
                className="px-1.5 sm:px-2 py-1 text-[9px] sm:text-[10px] text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-0.5"
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

export default VisaProcessing;