import React, { useState, useEffect, useRef } from 'react';
import { 
  Car, Calendar, User, Phone, Mail, 
  ArrowRight, Clock, CheckCircle, DollarSign,
  AlertCircle, X, CreditCard, Wallet, Building,
  Receipt, Percent, Tag, Upload, Camera,
  Search, Filter, Compass, Map, Hotel, Plane, Headphones,
  Construction, MapPin, Bed, Users as UsersIcon,
  PlaneTakeoff, PlaneLanding, Ticket, Crown, Briefcase, Info  
} from 'lucide-react';

// ✅ IMPORT ONLY guestBookingService (NO publicDataService)
import { guestBookingService, publicDataService } from '../services/api';

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

// Helper: Format date for input (YYYY-MM-DD)
const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

// Helper: Format currency
const formatCurrency = (amount) => {
  return `KSh ${(amount || 0).toLocaleString()}`;
};

// Helper: Compress image
const compressImage = (base64String, maxWidth = 800, maxHeight = 800, quality = 0.85) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
      
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

const GuestBooking = ({ onNavigate }) => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [tours, setTours] = useState([]);
  const [hajjPackages, setHajjPackages] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [flights, setFlights] = useState([]);
  const [carOwners, setCarOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [bookingReference, setBookingReference] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isPreview, setIsPreview] = useState(false);  // ✅ ADD THIS
  const [isSubmitting, setIsSubmitting] = useState(false);  // ✅ ADD THIS
  
  // Image upload refs
  const idImageRef = useRef(null);
  const licenseImageRef = useRef(null);
  const vehicleImageRef = useRef(null);
  
  // Form state
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerIdNumber: '',
    customerLicenseNumber: '',
    customerIdImage: null,
    customerLicenseImage: null,
    serviceType: '',
    itemId: '',
    startDate: '',
    startTime: '08:00',
    endDate: '',
    endTime: '18:00',
    passengers: 1,
    notes: '',
    days: 0,
    paymentMethod: 'CASH',
    mpesaCode: '',
    totalAmount: 0,
    vehicleConditionImages: [],
    // Hajj specific fields
    packageType: 'hajj',
    accommodation: '',
    meals: '',
    transport: '',
    guides: '',
    visa: '',
    insurance: '',
    // Hotel specific fields
    hotelId: '',
    roomTypeId: '',
    checkIn: '',
    checkOut: '',
    guests: 0,
    rooms: 1,
    nights: 0,
    // Flight specific fields
    seatClass: 'economy',
    flightId: '',
    // ✅ Flight prices by class
    economyPrice: 0,
    businessPrice: 0,
    firstClassPrice: 0
  });

  // Preview images
  const [idImagePreview, setIdImagePreview] = useState(null);
  const [licenseImagePreview, setLicenseImagePreview] = useState(null);
  const [vehicleImagePreviews, setVehicleImagePreviews] = useState([]);

  // Calculated values
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [days, setDays] = useState(0);

  // Services configuration
  const services = [
    { 
      id: 'car_hire', 
      label: 'Car Hire', 
      icon: Car, 
      color: 'blue', 
      description: 'Rent a vehicle for your journey',
      isAvailable: true
    },
    { 
      id: 'tour', 
      label: 'Tours & Travel', 
      icon: Compass, 
      color: 'green', 
      description: 'Explore adventure and wildlife tours',
      isAvailable: true
    },
    { 
      id: 'hajj', 
      label: 'Hajj & Umra', 
      icon: MapPin, 
      color: 'red', 
      description: 'Book pilgrimage packages',
      isAvailable: true
    },
    { 
      id: 'hotel', 
      label: 'Hotels', 
      icon: Hotel, 
      color: 'orange', 
      description: 'Find the perfect accommodation',
      isAvailable: true
    },
    { 
      id: 'flight', 
      label: 'Flights', 
      icon: Plane, 
      color: 'purple', 
      description: 'Book local and international flights',
      isAvailable: true
    }
  ];

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadData = async () => {
  setLoading(true);
  
  try {
    // ✅ Fetch ALL data including bookings from API
    const [vehiclesData, toursData, hajjData, hotelsData, roomTypesData, flightsData, ownersData, bookingsData] = await Promise.all([
      publicDataService.getVehicles(),
      publicDataService.getTourPackages(),
      publicDataService.getHajjPackages(),
      publicDataService.getHotels(),
      publicDataService.getRoomTypes(),
      publicDataService.getFlights(),
      publicDataService.getCarOwners(),
      publicDataService.getBookings(),  // ✅ ADD THIS
    ]);

    setVehicles(vehiclesData.filter(v => v.status === 'active'));
    setTours(toursData.filter(t => t.status === 'active' || t.status === 'published'));
    setHajjPackages(hajjData.filter(h => h.status === 'active'));
    setHotels(hotelsData.filter(h => h.status === 'active'));
    setRoomTypes(roomTypesData.filter(r => r.status === 'active'));
    setFlights(flightsData.filter(f => f.status === 'active' || f.status === 'scheduled'));
    setCarOwners(ownersData);
    
    // ✅ SET BOOKINGS FROM API (NOT localStorage!)
    setAllBookings(bookingsData);
    
    console.log('✅ All data loaded from API (including bookings)');
  } catch (error) {
    console.warn('⚠️ API failed, using localStorage:', error.message);
    
    // Fallback to localStorage
    const storedVehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
    setVehicles(storedVehicles.filter(v => v.status === 'active'));
    
    const storedBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
    setAllBookings(storedBookings);
    
    const storedTours = JSON.parse(localStorage.getItem('travel_agency_tour_packages') || '[]');
    setTours(storedTours.filter(t => t.status === 'active' || t.status === 'published'));
    
    const storedHajj = JSON.parse(localStorage.getItem('travel_agency_hajj_packages') || '[]');
    setHajjPackages(storedHajj.filter(h => h.status === 'active'));
    
    const storedHotels = JSON.parse(localStorage.getItem('travel_agency_hotels') || '[]');
    setHotels(storedHotels.filter(h => h.status === 'active'));
    
    const storedRoomTypes = JSON.parse(localStorage.getItem('travel_agency_room_types') || '[]');
    setRoomTypes(storedRoomTypes.filter(r => r.status === 'active'));
    
    const storedFlights = JSON.parse(localStorage.getItem('travel_agency_flights') || '[]');
    setFlights(storedFlights.filter(f => f.status === 'active' || f.status === 'scheduled'));
    
    const storedOwners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
    setCarOwners(storedOwners);
  }
  
  setLoading(false);
};

  // ✅ REPLACE with date-aware version
const isVehicleAvailableForDates = (vehicleId, startDate, endDate) => {
  if (!startDate || !endDate) return true;
  
  // Parse the dates safely
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Check if dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return true;
  
  // Check if start date is in the past
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (start < today) return false;
  
  // Check if end date is after start date
  if (end <= start) return false;
  
  // Check for overlapping bookings with SAFE date parsing
  return !allBookings.some(b => {
    // Skip if not the same vehicle
    if (b.vehicleId !== vehicleId) return false;
    
    // Only check pending and confirmed bookings
    if (b.status !== 'pending' && b.status !== 'confirmed') return false;
    
    // Parse booking dates safely
    const bStart = new Date(b.startDate);
    const bEnd = new Date(b.endDate);
    
    // Check for date overlap
    return bStart < end && bEnd > start;
  });
};

// ✅ NEW: Get overlapping bookings for a vehicle
const getOverlappingBookings = (vehicleId, startDate, endDate) => {
  if (!startDate || !endDate) return [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return [];
  
  return allBookings.filter(b => {
    if (b.vehicleId !== vehicleId) return false;
    if (b.status !== 'pending' && b.status !== 'confirmed') return false;
    
    const bStart = new Date(b.startDate);
    const bEnd = new Date(b.endDate);
    
    return bStart < end && bEnd > start;
  });
};

// ✅ UPDATE: Get active bookings count (now date-aware)
const getActiveBookingsCount = (vehicleId, startDate, endDate) => {
  // If no dates selected, return total active bookings
  if (!startDate || !endDate) {
    return allBookings.filter(b => 
      b.vehicleId === vehicleId && 
      (b.status === 'pending' || b.status === 'confirmed')
    ).length;
  }
  
  // If dates selected, check for overlapping bookings
  return getOverlappingBookings(vehicleId, startDate, endDate).length;
};

// ✅ Alias for backward compatibility
const isVehicleAvailable = isVehicleAvailableForDates;

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
  };

  // Calculate nights for hotel
  const calculateNights = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0;
    const inDate = new Date(checkIn);
    const outDate = new Date(checkOut);
    const diffTime = Math.abs(outDate - inDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleDateChange = () => {
    const calculatedDays = calculateDays(formData.startDate, formData.endDate);
    setDays(calculatedDays);
    setFormData(prev => ({ ...prev, days: calculatedDays }));
    
    if (selectedService === 'car_hire' && formData.itemId && calculatedDays > 0) {
      const vehicle = vehicles.find(v => v.id === formData.itemId);
      if (vehicle) {
        const pricePerDay = parseFloat(vehicle.pricePerDay) || 0;
        const total = pricePerDay * calculatedDays;
        setCalculatedTotal(total);
        setFormData(prev => ({ ...prev, totalAmount: total }));
      }
    }
  };

  // Handle hotel date changes
  const handleHotelDateChange = () => {
    const nights = calculateNights(formData.checkIn, formData.checkOut);
    console.log('🔍 Calculating nights:', formData.checkIn, formData.checkOut, '→', nights);
    
    setFormData(prev => {
      const updated = { ...prev, nights: nights };
      
      if (updated.roomTypeId && nights > 0) {
        const room = roomTypes.find(r => r.id === updated.roomTypeId);
        if (room) {
          const pricePerNight = parseFloat(room.price) || 0;
          const rooms = updated.rooms || 1;
          const total = pricePerNight * nights * rooms;
          setCalculatedTotal(total);
          updated.totalAmount = total;
        }
      }
      return updated;
    });
  };

  // ✅ Get flight price based on seat class
  const getFlightPrice = (flight, seatClass) => {
    if (!flight) return 0;
    switch(seatClass) {
      case 'business':
        return flight.businessPrice || flight.price * 1.5 || 0;
      case 'first_class':
        return flight.firstClassPrice || flight.price * 2 || 0;
      default:
        return flight.economyPrice || flight.price || 0;
    }
  };

  const handleServiceSelect = (serviceId) => {
    const service = services.find(s => s.id === serviceId);
    
    if (!service?.isAvailable) {
      showNotification(`🚧 ${service?.label} is coming soon! We'll notify you when it's available.`, 'info');
      return;
    }
    
    setSelectedService(serviceId);
    setFormData(prev => ({ ...prev, serviceType: serviceId, itemId: '' }));
    setSelectedItem(null);
    setStep(2);
  };

  const handleItemSelect = (itemId) => {
    setFormData(prev => ({ ...prev, itemId }));
    
    if (selectedService === 'car_hire') {
      const vehicle = vehicles.find(v => v.id === itemId);
      setSelectedItem(vehicle);
      if (days > 0) {
        const pricePerDay = parseFloat(vehicle?.pricePerDay) || 0;
        const total = pricePerDay * days;
        setCalculatedTotal(total);
        setFormData(prev => ({ ...prev, totalAmount: total }));
      }
    } else if (selectedService === 'tour') {
      const tour = tours.find(t => t.id === itemId);
      if (tour) {
        setSelectedItem(tour);
        const passengers = formData.passengers || 1;
        const total = (tour?.price || 0) * passengers;
        setCalculatedTotal(total);
        setFormData(prev => ({ ...prev, totalAmount: total }));
      }
    } else if (selectedService === 'hajj') {
      const hajjPkg = hajjPackages.find(h => h.id === itemId);
      if (hajjPkg) {
        setSelectedItem(hajjPkg);
        const passengers = formData.passengers || 1;
        const total = (hajjPkg?.price || 0) * passengers;
        setCalculatedTotal(total);
        setFormData(prev => ({ 
          ...prev, 
          totalAmount: total,
          packageType: hajjPkg.type || 'hajj',
          accommodation: hajjPkg.accommodation || '',
          meals: hajjPkg.meals || '',
          transport: hajjPkg.transport || '',
          guides: hajjPkg.guides || '',
          visa: hajjPkg.visa || '',
          insurance: hajjPkg.insurance || ''
        }));
      }
    } else if (selectedService === 'hotel') {
      const room = roomTypes.find(r => r.id === itemId);
      if (room) {
        setSelectedItem(room);
        const nights = formData.nights || calculateNights(formData.checkIn, formData.checkOut) || 1;
        const total = (room?.price || 0) * nights * (formData.rooms || 1);
        setCalculatedTotal(total);
        setFormData(prev => ({ 
          ...prev, 
          totalAmount: total,
          roomTypeId: room.id,
          hotelId: room.hotelId,
          itemId: itemId
        }));
      }
    } else if (selectedService === 'flight') {
      // ✅ Handle flight selection with class prices
      const flight = flights.find(f => f.id === itemId);
      if (flight) {
        const pricePerPerson = getFlightPrice(flight, formData.seatClass);
        const passengers = formData.passengers || 1;
        const total = pricePerPerson * passengers;
        
        setSelectedItem(flight);
        setCalculatedTotal(total);
        setFormData(prev => ({ 
          ...prev, 
          totalAmount: total,
          flightId: flight.id,
          itemId: itemId,
          economyPrice: flight.economyPrice || flight.price || 0,
          businessPrice: flight.businessPrice || flight.price * 1.5 || 0,
          firstClassPrice: flight.firstClassPrice || flight.price * 2 || 0
        }));
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Recalculate total for tours, hajj, or flights
    if (name === 'passengers' && (selectedService === 'tour' || selectedService === 'hajj' || selectedService === 'flight') && formData.itemId) {
      let item;
      if (selectedService === 'tour') {
        item = tours.find(t => t.id === formData.itemId);
      } else if (selectedService === 'hajj') {
        item = hajjPackages.find(h => h.id === formData.itemId);
      } else if (selectedService === 'flight') {
        item = flights.find(f => f.id === formData.itemId);
        if (item) {
          const pricePerPerson = getFlightPrice(item, formData.seatClass);
          const passengers = parseInt(value) || 1;
          const total = pricePerPerson * passengers;
          setCalculatedTotal(total);
          setFormData(prev => ({ ...prev, totalAmount: total }));
          return;
        }
      }
      if (item) {
        const passengers = parseInt(value) || 1;
        const total = (item?.price || 0) * passengers;
        setCalculatedTotal(total);
        setFormData(prev => ({ ...prev, totalAmount: total }));
      }
    }
    
    // ✅ Recalculate for flight seat class change
    if (name === 'seatClass' && selectedService === 'flight' && formData.itemId) {
      const flight = flights.find(f => f.id === formData.itemId);
      if (flight) {
        const pricePerPerson = getFlightPrice(flight, value);
        const passengers = formData.passengers || 1;
        const total = pricePerPerson * passengers;
        setCalculatedTotal(total);
        setFormData(prev => ({ ...prev, totalAmount: total }));
      }
    }
    
    if ((name === 'checkIn' || name === 'checkOut' || name === 'rooms') && selectedService === 'hotel') {
      setTimeout(() => {
        handleHotelDateChange();
      }, 50);
    }
  };

  const handleIdImageUpload = async (e) => {
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
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result);
        setFormData(prev => ({ ...prev, customerIdImage: compressed }));
        setIdImagePreview(compressed);
        showNotification('ID image uploaded successfully!');
      } catch (error) {
        console.error('Error compressing image:', error);
        showNotification('Failed to process image', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLicenseImageUpload = async (e) => {
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
    reader.onloadend = async () => {
      try {
        const compressed = await compressImage(reader.result);
        setFormData(prev => ({ ...prev, customerLicenseImage: compressed }));
        setLicenseImagePreview(compressed);
        showNotification('License image uploaded successfully!');
      } catch (error) {
        console.error('Error compressing image:', error);
        showNotification('Failed to process image', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleVehicleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newPreviews = [];

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target.result;
        newPreviews.push(imageData);
        
        if (newPreviews.length === files.length) {
          setVehicleImagePreviews(prev => [...prev, ...newPreviews]);
          setFormData(prev => ({
            ...prev,
            vehicleConditionImages: [...prev.vehicleConditionImages, ...newPreviews]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeVehicleImage = (index) => {
    setVehicleImagePreviews(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      vehicleConditionImages: prev.vehicleConditionImages.filter((_, i) => i !== index)
    }));
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

  // ✅ Calculate preview without submitting
const calculatePreview = () => {
  const startDateTime = formData.startDate ? `${formData.startDate}T${formData.startTime || '08:00'}` : null;
  const endDateTime = formData.endDate ? `${formData.endDate}T${formData.endTime || '18:00'}` : null;

  let calculatedDays = 0;
  if (formData.startDate && formData.endDate) {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }
  
  const daysToUse = calculatedDays || formData.days || days || 1;

  let total = 0;

  if (selectedService === 'car_hire') {
    const vehicle = vehicles.find(v => v.id === formData.itemId);
    const pricePerDay = vehicle?.pricePerDay || 0;
    total = pricePerDay * daysToUse;
  } else if (selectedService === 'tour') {
    const tour = tours.find(t => t.id === formData.itemId);
    total = (tour?.price || 0) * (formData.passengers || 1);
  } else if (selectedService === 'hajj') {
    const hajjPkg = hajjPackages.find(h => h.id === formData.itemId);
    total = (hajjPkg?.price || 0) * (formData.passengers || 1);
  } else if (selectedService === 'hotel') {
    const room = roomTypes.find(r => r.id === formData.itemId);
    const nights = calculateNights(formData.checkIn, formData.checkOut) || 1;
    total = (room?.price || 0) * nights * (formData.rooms || 1);
  } else if (selectedService === 'flight') {
    const flight = flights.find(f => f.id === formData.itemId);
    const pricePerPerson = getFlightPrice(flight, formData.seatClass);
    total = pricePerPerson * (formData.passengers || 1);
  }

  setCalculatedTotal(total);
  setFormData(prev => ({ ...prev, totalAmount: total }));
};

  // ✅ UPDATED: Submit booking via API
  // ✅ UPDATED: Submit booking via API with loading state
const handleSubmit = async (e) => {
  e.preventDefault();
  
  // ✅ Prevent double submission
  if (isSubmitting) {
    console.log('⚠️ Already submitting, please wait...');
    return;
  }

  // ✅ ADD THIS AVAILABILITY CHECK FIRST
  if (selectedService === 'car_hire') {
    const startDateTime = `${formData.startDate}T${formData.startTime || '08:00'}`;
    const endDateTime = `${formData.endDate}T${formData.endTime || '18:00'}`;
    
    if (!formData.startDate || !formData.endDate) {
      showNotification('Please select start and end dates for car hire', 'error');
      return;
    }
    
    // ✅ CHECK IF START DATE IS IN THE PAST
    const startDateObj = new Date(formData.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (startDateObj < today) {
      showNotification('⚠️ Start date cannot be in the past', 'error');
      return;
    }

    // ✅ CHECK IF END DATE IS AFTER START DATE
    const endDateObj = new Date(formData.endDate);
    if (endDateObj <= startDateObj) {
      showNotification('⚠️ End date must be after start date', 'error');
      return;
    }
    
    // ✅ CHECK AVAILABILITY WITH CONFLICT DETAILS
    const isAvailable = isVehicleAvailableForDates(formData.itemId, startDateTime, endDateTime);
    
    if (!isAvailable) {
      const conflicts = getOverlappingBookings(formData.itemId, startDateTime, endDateTime);
      
      // Get vehicle details for better message
      const vehicle = vehicles.find(v => v.id === formData.itemId);
      const vehicleName = vehicle ? `${vehicle.make} ${vehicle.model} (${vehicle.registration})` : 'This vehicle';
      
      let conflictMessage = '';
      
      if (conflicts.length > 0) {
        const conflict = conflicts[0];
        const conflictStart = formatDateTime(conflict.startDate);
        const conflictEnd = formatDateTime(conflict.endDate);
        const customerName = conflict.customerName || 'Another customer';
        
        conflictMessage = `
❌ ${vehicleName} is already booked!

📅 Booked from: ${conflictStart}
📅 Booked to: ${conflictEnd}

Please choose different dates or another vehicle.
        `;
      } else {
        conflictMessage = `
❌ ${vehicleName} is not available for the selected dates.

Please choose different dates or another vehicle.
        `;
      }
      
      // ✅ SHOW THE CONFLICT MESSAGE
      showNotification(conflictMessage, 'error');
      
      // ✅ ALSO SHOW AS ALERT FOR BETTER VISIBILITY
      alert(conflictMessage);
      
      return;
    }
  }
  
  if (!formData.customerName) {
    showNotification('Please enter your name', 'error');
    return;
  }
  if (!formData.customerEmail) {
    showNotification('Please enter your email', 'error');
    return;
  }
  if (!formData.customerPhone) {
    showNotification('Please enter your phone number', 'error');
    return;
  }
  if (!formData.serviceType) {
    showNotification('Please select a service', 'error');
    return;
  }
  if (!formData.itemId) {
    showNotification('Please select an item', 'error');
    return;
  }

  if (selectedService === 'car_hire') {
  const startDateTime = `${formData.startDate}T${formData.startTime || '08:00'}`;
  const endDateTime = `${formData.endDate}T${formData.endTime || '18:00'}`;
  
  if (!formData.startDate || !formData.endDate) {
    showNotification('Please select start and end dates for car hire', 'error');
    return;
  }
  
  // ✅ CHECK IF START DATE IS IN THE PAST
  const startDateObj = new Date(formData.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (startDateObj < today) {
    showNotification('⚠️ Start date cannot be in the past', 'error');
    return;
  }

  // ✅ CHECK IF END DATE IS AFTER START DATE
  const endDateObj = new Date(formData.endDate);
  if (endDateObj <= startDateObj) {
    showNotification('⚠️ End date must be after start date', 'error');
    return;
  }
  
  // ✅ Use date-aware availability check
  if (!isVehicleAvailableForDates(formData.itemId, startDateTime, endDateTime)) {
    const conflicts = getOverlappingBookings(formData.itemId, startDateTime, endDateTime);
    let conflictMessage = '❌ This vehicle is not available for the selected dates.';
    if (conflicts.length > 0) {
      const conflict = conflicts[0];
      conflictMessage = `❌ This vehicle is booked from ${formatDateTime(conflict.startDate)} to ${formatDateTime(conflict.endDate)}. Please choose different dates or another vehicle.`;
    }
    showNotification(conflictMessage, 'error');
    return;
  }
}

  // Hotel validation
  if (selectedService === 'hotel') {
    if (!formData.checkIn || !formData.checkOut) {
      showNotification('Please select check-in and check-out dates', 'error');
      return;
    }
    const nights = calculateNights(formData.checkIn, formData.checkOut);
    if (nights < 1) {
      showNotification('Check-out must be after check-in', 'error');
      return;
    }
  }

  if (formData.paymentMethod === 'M_PESA') {
    if (!formData.mpesaCode || formData.mpesaCode.length < 6) {
      showNotification('Please enter a valid M-Pesa transaction code (at least 6 characters)', 'error');
      return;
    }
  }

  const ref = `BOOK-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
  setBookingReference(ref);

  const startDateTime = formData.startDate ? `${formData.startDate}T${formData.startTime || '08:00'}` : null;
  const endDateTime = formData.endDate ? `${formData.endDate}T${formData.endTime || '18:00'}` : null;

  let calculatedDays = 0;
  if (formData.startDate && formData.endDate) {
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  }
  
  const daysToUse = calculatedDays || formData.days || days || 1;

  let total = 0;
  let itemDetails = {};

  if (selectedService === 'car_hire') {
    const vehicle = vehicles.find(v => v.id === formData.itemId);
    const owner = carOwners.find(o => o.id === vehicle?.ownerId);
    const pricePerDay = vehicle?.pricePerDay || 0;
    const totalWithDays = pricePerDay * daysToUse;
    
    itemDetails = {
      itemName: `${vehicle?.registration} - ${vehicle?.make} ${vehicle?.model}`,
      itemPrice: vehicle?.pricePerDay || 0,
      ownerId: vehicle?.ownerId || '',
      ownerName: owner?.name || '',
      vehicleRegistration: vehicle?.registration || '',
      vehicleMake: vehicle?.make || '',
      vehicleModel: vehicle?.model || '',
      vehiclePricePerDay: vehicle?.pricePerDay || 0
    };
    
    total = totalWithDays;
    setCalculatedTotal(totalWithDays);
    setFormData(prev => ({ ...prev, totalAmount: totalWithDays }));
    
  } else if (selectedService === 'tour') {
    const tour = tours.find(t => t.id === formData.itemId);
    const passengers = formData.passengers || 1;
    itemDetails = {
      itemName: tour?.name || tour?.title || 'Tour',
      itemPrice: tour?.price || 0
    };
    total = (tour?.price || 0) * passengers;
    
  } else if (selectedService === 'hajj') {
    const hajjPkg = hajjPackages.find(h => h.id === formData.itemId);
    const passengers = formData.passengers || 1;
    itemDetails = {
      itemName: hajjPkg?.name || 'Hajj Package',
      itemPrice: hajjPkg?.price || 0,
      packageType: hajjPkg?.type || 'hajj',
      accommodation: hajjPkg?.accommodation || '',
      meals: hajjPkg?.meals || '',
      transport: hajjPkg?.transport || '',
      guides: hajjPkg?.guides || '',
      visa: hajjPkg?.visa || '',
      insurance: hajjPkg?.insurance || ''
    };
    total = (hajjPkg?.price || 0) * passengers;
    
  } else if (selectedService === 'hotel') {
    const room = roomTypes.find(r => r.id === formData.itemId);
    const hotel = hotels.find(h => h.id === room?.hotelId);
    const nights = calculateNights(formData.checkIn, formData.checkOut) || 1;
    const rooms = formData.rooms || 1;
    
    itemDetails = {
      itemName: room?.name || 'Hotel Room',
      itemPrice: room?.price || 0,
      hotelId: room?.hotelId || '',
      hotelName: hotel?.name || '',
      hotelCity: hotel?.city || '',
      hotelStarRating: hotel?.starRating || 0,
      roomType: room?.type || 'standard',
      roomName: room?.name || '',
      nights: nights,
      rooms: rooms,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      guests: formData.guests || 1
    };
    total = (room?.price || 0) * nights * rooms;
    
  } else if (selectedService === 'flight') {
    const flight = flights.find(f => f.id === formData.itemId);
    const passengers = formData.passengers || 1;
    const seatClass = formData.seatClass || 'economy';
    const pricePerPerson = getFlightPrice(flight, seatClass);
    
    itemDetails = {
      itemName: `${flight?.airline} - ${flight?.flightNumber}`,
      itemPrice: pricePerPerson,
      airline: flight?.airline || '',
      flightNumber: flight?.flightNumber || '',
      origin: flight?.origin || '',
      destination: flight?.destination || '',
      departureDate: flight?.departureDate || '',
      departureTime: flight?.departureTime || '',
      arrivalDate: flight?.arrivalDate || '',
      arrivalTime: flight?.arrivalTime || '',
      duration: flight?.duration || '',
      seatClass: seatClass,
      economyPrice: flight?.economyPrice || flight?.price || 0,
      businessPrice: flight?.businessPrice || flight?.price * 1.5 || 0,
      firstClassPrice: flight?.firstClassPrice || flight?.price * 2 || 0
    };
    total = pricePerPerson * passengers;
  }

  // ✅ Prepare booking data for API
  const bookingData = {
    // Personal Info
    customerName: formData.customerName,
    customerEmail: formData.customerEmail,
    customerPhone: formData.customerPhone,
    customerIdNumber: formData.customerIdNumber || '',
    customerLicenseNumber: formData.customerLicenseNumber || '',
    customerIdImage: formData.customerIdImage || null,
    customerLicenseImage: formData.customerLicenseImage || null,
    
    // Service
    serviceType: selectedService,
    itemName: itemDetails.itemName,
    itemPrice: itemDetails.itemPrice,
    
    // Service specific IDs
    vehicleId: selectedService === 'car_hire' ? formData.itemId : null,
    tourPackageId: selectedService === 'tour' ? formData.itemId : null,
    hajjPackageId: selectedService === 'hajj' ? formData.itemId : null,
    hotelId: selectedService === 'hotel' ? formData.hotelId : null,
    roomTypeId: selectedService === 'hotel' ? formData.itemId : null,
    flightId: selectedService === 'flight' ? formData.itemId : null,
    ownerId: selectedService === 'car_hire' ? itemDetails.ownerId : null,
    
    // Dates
    startDate: startDateTime,
    endDate: endDateTime,
    startTime: formData.startTime || '08:00',
    endTime: formData.endTime || '18:00',
    days: daysToUse,
    
    // Passengers
    passengers: formData.passengers || 1,
    
    // Payment
    totalPrice: total,
    paidAmount: formData.paymentMethod === 'CREDIT' ? 0 : total,
    remainingBalance: formData.paymentMethod === 'CREDIT' ? total : 0,
    paymentMethod: formData.paymentMethod,
    paymentStatus: formData.paymentMethod === 'CREDIT' ? 'PENDING' : 'PAID',
    mpesaCode: formData.mpesaCode || '',
    
    // Vehicle condition images (for car hire)
    vehicleConditionImages: JSON.stringify(formData.vehicleConditionImages || []),
    
    // Notes
    notes: formData.notes || '',
    status: 'pending',
    isGuestBooking: true,
    
    // Hajj specific fields
    packageType: itemDetails.packageType || formData.packageType || 'hajj',
    accommodation: itemDetails.accommodation || formData.accommodation || '',
    meals: itemDetails.meals || formData.meals || '',
    transport: itemDetails.transport || formData.transport || '',
    guides: itemDetails.guides || formData.guides || '',
    insurance: itemDetails.insurance || formData.insurance || '',
    
    // Hotel specific fields
    hotelName: itemDetails.hotelName || '',
    hotelCity: itemDetails.hotelCity || '',
    hotelStarRating: itemDetails.hotelStarRating || 0,
    roomName: itemDetails.roomName || '',
    roomType: itemDetails.roomType || '',
    checkIn: itemDetails.checkIn || '',
    checkOut: itemDetails.checkOut || '',
    nights: itemDetails.nights || 0,
    rooms: itemDetails.rooms || 1,
    guests: itemDetails.guests || 1,
    
    // Flight specific fields
    airline: itemDetails.airline || '',
    flightNumber: itemDetails.flightNumber || '',
    origin: itemDetails.origin || '',
    destination: itemDetails.destination || '',
    departureDateFlight: itemDetails.departureDate || '',
    departureTimeFlight: itemDetails.departureTime || '',
    arrivalDateFlight: itemDetails.arrivalDate || '',
    arrivalTimeFlight: itemDetails.arrivalTime || '',
    durationFlight: itemDetails.duration || '',
    seatClass: itemDetails.seatClass || 'economy',
    economyPrice: itemDetails.economyPrice || 0,
    businessPrice: itemDetails.businessPrice || 0,
    firstClassPrice: itemDetails.firstClassPrice || 0,
  };

  try {
    // ✅ SET SUBMITTING STATE
    setIsSubmitting(true);
    
    // ✅ CALL THE API
    const response = await guestBookingService.create(bookingData);
    
    if (response.success) {
      const createdBooking = response.data;
      setBookingReference(createdBooking.reference || ref);
      
      // ✅ Also save to localStorage as backup
      const guestBookings = JSON.parse(localStorage.getItem('travel_agency_guest_bookings') || '[]');
      guestBookings.push({ ...bookingData, reference: createdBooking.reference, id: createdBooking.id });
      localStorage.setItem('travel_agency_guest_bookings', JSON.stringify(guestBookings));
      
      const allBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      allBookings.push({ ...bookingData, reference: createdBooking.reference, id: createdBooking.id });
      localStorage.setItem('travel_agency_bookings', JSON.stringify(allBookings));
      
      setBookingComplete(true);
      setStep(3);
      showNotification('✅ Booking submitted successfully!');
    } else {
      showNotification(response.message || 'Failed to create booking', 'error');
    }
  } catch (error) {
    console.error('❌ Booking submission failed:', error);
    showNotification(`❌ Failed to create booking: ${error.message}`, 'error');
  } finally {
    // ✅ RESET SUBMITTING STATE
    setIsSubmitting(false);
  }
};

  const resetBooking = () => {
    setStep(1);
    setBookingComplete(false);
    setSelectedService(null);
    setSelectedItem(null);
    setCalculatedTotal(0);
    setDays(0);
    setIdImagePreview(null);
    setLicenseImagePreview(null);
    setVehicleImagePreviews([]);
    setFormData({
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      customerIdNumber: '',
      customerLicenseNumber: '',
      customerIdImage: null,
      customerLicenseImage: null,
      serviceType: '',
      itemId: '',
      startDate: '',
      startTime: '08:00',
      endDate: '',
      endTime: '18:00',
      passengers: 1,
      notes: '',
      days: 0,
      paymentMethod: 'CASH',
      mpesaCode: '',
      totalAmount: 0,
      vehicleConditionImages: [],
      packageType: 'hajj',
      accommodation: '',
      meals: '',
      transport: '',
      guides: '',
      visa: '',
      insurance: '',
      hotelId: '',
      roomTypeId: '',
      checkIn: '',
      checkOut: '',
      guests: 0,
      rooms: 1,
      nights: 0,
      seatClass: 'economy',
      flightId: '',
      economyPrice: 0,
      businessPrice: 0,
      firstClassPrice: 0
    });
    setBookingReference('');
  };

  const getAvailableItems = () => {
    switch(selectedService) {
      case 'car_hire': return vehicles;
      case 'tour': {
        const availableTours = tours || [];
        return availableTours;
      }
      case 'hajj': {
        const availableHajj = hajjPackages || [];
        return availableHajj;
      }
      case 'hotel': {
        if (formData.hotelId) {
          return roomTypes.filter(r => r.hotelId === formData.hotelId && r.status === 'active') || [];
        }
        return roomTypes || [];
      }
      case 'flight': {
        // ✅ Return available flights
        return flights || [];
      }
      default: return [];
    }
  };

  const getItemDisplayName = (item) => {
    if (selectedService === 'car_hire') {
      return `${item.registration} - ${item.make} ${item.model}`;
    } else if (selectedService === 'tour') {
      return item.name || item.title || 'Tour';
    } else if (selectedService === 'hajj') {
      const typeLabel = item.type === 'umra' ? '🕌 Umra' : '🕋 Hajj';
      return `${typeLabel} - ${item.name || 'Package'}`;
    } else if (selectedService === 'hotel') {
      const hotel = hotels.find(h => h.id === item.hotelId);
      return `${item.name} - ${hotel?.name || 'Hotel'} (${item.type})`;
    } else if (selectedService === 'flight') {
      // ✅ Flight display with class prices
      const econ = formatCurrency(item.economyPrice || item.price);
      const biz = formatCurrency(item.businessPrice || item.price * 1.5);
      const first = formatCurrency(item.firstClassPrice || item.price * 2);
      return `${item.airline} ${item.flightNumber} - ${item.origin} → ${item.destination} (💺${econ} | 💼${biz} | 👑${first})`;
    }
    return item.name || 'Item';
  };

  const getItemPrice = (item) => {
    if (selectedService === 'car_hire') {
      return `${item.pricePerDay || 0}/day`;
    } else if (selectedService === 'hajj') {
      return `${item.price || 0} per person`;
    } else if (selectedService === 'hotel') {
      return `${item.price || 0}/night`;
    } else if (selectedService === 'flight') {
      // ✅ Return price based on selected seat class
      const price = getFlightPrice(item, formData.seatClass);
      return `${price || 0} per person (${formData.seatClass})`;
    } else {
      return item.price || 0;
    }
  };

  // Hajj Type labels
  const getHajjTypeLabel = (type) => {
    const labels = {
      hajj: '🕋 Hajj',
      umra: '🕌 Umra',
      ramadan_umra: '🌙 Ramadan Umra'
    };
    return labels[type] || type || 'Hajj';
  };

  // Get hotel star display
  const getStarDisplay = (rating) => {
    return '⭐'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  // ✅ Get seat class label with emoji
  const getSeatClassLabel = (seatClass) => {
    const labels = {
      economy: '💺 Economy',
      business: '💼 Business',
      first_class: '👑 First Class'
    };
    return labels[seatClass] || seatClass || 'Economy';
  };

  // Coming Soon Modal - No longer needed since consultancy removed
  const renderComingSoonModal = () => {
    return null;
  };

  const renderStep1 = () => (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-2">What would you like to book?</h2>
      <p className="text-sm text-gray-500 mb-4">Select a service below to get started. No registration required!</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {services.map((service) => (
          <button
            key={service.id}
            onClick={() => handleServiceSelect(service.id)}
            className={`border-2 rounded-xl p-4 text-center hover:shadow-md transition-all bg-white relative ${
              selectedService === service.id 
                ? `border-${service.color}-500 bg-${service.color}-50` 
                : service.isAvailable 
                  ? 'border-gray-200 hover:border-gray-300' 
                  : 'border-gray-200 opacity-60 cursor-not-allowed'
            }`}
            disabled={!service.isAvailable}
          >
            <div className={`w-12 h-12 rounded-full bg-${service.color}-100 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
              <service.icon size={24} className={`text-${service.color}-600`} />
            </div>
            <p className="text-sm font-medium text-gray-700">{service.label}</p>
            <p className="text-[10px] text-gray-400 hidden sm:block">{service.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => {
    const items = getAvailableItems();
    const service = services.find(s => s.id === selectedService);
    const isHotel = selectedService === 'hotel';
    const isFlight = selectedService === 'flight';

    return (
      <div>
        <button 
          onClick={() => { setStep(1); setSelectedService(null); }}
          className="text-sm text-blue-600 hover:text-blue-700 mb-4 flex items-center gap-1"
        >
          ← Back to services
        </button>
        
        <h2 className="text-xl font-bold text-gray-800 mb-2">Book {service?.label}</h2>
        <p className="text-sm text-gray-500 mb-4">
          Fill in your details to complete the booking
        </p>

        {notification && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
            notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {notification.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
            {notification.message}
            <button onClick={() => setNotification(null)} className="ml-auto">
              <X size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <User size={16} className="text-blue-500" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="John Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  name="customerPhone"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="+254 700 000 000"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">ID/Passport No</label>
                <input
                  type="text"
                  name="customerIdNumber"
                  value={formData.customerIdNumber}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="12345678"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Driver's License Number</label>
                <input
                  type="text"
                  name="customerLicenseNumber"
                  value={formData.customerLicenseNumber}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="DL-123456789"
                />
              </div>
            </div>

            {/* ID Image Upload */}
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-600 mb-1">ID Image</label>
              <div className="flex items-center gap-3">
                <input
                  ref={idImageRef}
                  type="file"
                  accept="image/*"
                  onChange={handleIdImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => idImageRef.current?.click()}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs flex items-center gap-1"
                >
                  <Upload size={14} /> Upload ID
                </button>
                {idImagePreview && (
                  <div className="relative inline-block">
                    <img src={idImagePreview} alt="ID" className="h-12 w-12 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={removeIdImage}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-sm"
                      style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* License Image Upload */}
            <div className="mt-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">License Image</label>
              <div className="flex items-center gap-3">
                <input
                  ref={licenseImageRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLicenseImageUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => licenseImageRef.current?.click()}
                  className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs flex items-center gap-1"
                >
                  <Upload size={14} /> Upload License
                </button>
                {licenseImagePreview && (
                  <div className="relative inline-block">
                    <img src={licenseImagePreview} alt="License" className="h-12 w-12 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={removeLicenseImage}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors shadow-sm"
                      style={{ width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Service Selection - Skip for Hotels and Flights */}
          {!isHotel && !isFlight && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <service.icon size={16} className={`text-${service?.color}-500`} /> Select {service?.label}
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Select {service?.label} *</label>
                <select
  value={formData.itemId}
  onChange={(e) => handleItemSelect(e.target.value)}
  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
>
  <option value="">Select...</option>
  {items.length === 0 ? (
    <option disabled>No items available</option>
  ) : (
    (() => {
      // ✅ Define dates ONCE outside the map
      const startDateTime = formData.startDate ? `${formData.startDate}T${formData.startTime || '08:00'}` : null;
      const endDateTime = formData.endDate ? `${formData.endDate}T${formData.endTime || '18:00'}` : null;
      
      return items.map(item => {
        let isAvailable = true;
        let conflictInfo = '';
        let availabilityText = '';
        
        if (selectedService === 'car_hire') {
          // ✅ Only check if BOTH dates are selected
          if (startDateTime && endDateTime) {
            isAvailable = isVehicleAvailableForDates(item.id, startDateTime, endDateTime);
            if (!isAvailable) {
              const conflicts = getOverlappingBookings(item.id, startDateTime, endDateTime);
              if (conflicts.length > 0) {
                const conflict = conflicts[0];
                conflictInfo = ` ❌ Booked ${formatDateTime(conflict.startDate)} - ${formatDateTime(conflict.endDate)}`;
              }
            } else {
              availabilityText = ' ✅ Available for dates';
            }
          } else {
            // ✅ NO DATES SELECTED - Always show as available
            isAvailable = true;
            conflictInfo = '';
            availabilityText = '';
          }
        }
        
        return (
          <option 
            key={item.id} 
            value={item.id}
            disabled={!isAvailable}
            className={!isAvailable ? 'text-gray-400' : ''}
          >
            {getItemDisplayName(item)}
            {!isAvailable && conflictInfo}
            {isAvailable && availabilityText}
          </option>
        );
      });
    })()
  )}
</select>
                
                {selectedService === 'car_hire' && formData.itemId && (
  <div className="mt-2">
    {(() => {
      const startDateTime = formData.startDate ? `${formData.startDate}T${formData.startTime || '08:00'}` : null;
      const endDateTime = formData.endDate ? `${formData.endDate}T${formData.endTime || '18:00'}` : null;
      
      // ✅ If BOTH dates are selected - Check availability
      if (startDateTime && endDateTime) {
        const isAvailable = isVehicleAvailableForDates(formData.itemId, startDateTime, endDateTime);
        const conflicts = getOverlappingBookings(formData.itemId, startDateTime, endDateTime);
        
        if (!isAvailable && conflicts.length > 0) {
          const conflict = conflicts[0];
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-sm text-red-700 flex items-center gap-2">
              <AlertCircle size={16} />
              <span>❌ Booked from {formatDateTime(conflict.startDate)} to {formatDateTime(conflict.endDate)}</span>
            </div>
          );
        } else if (isAvailable) {
          return (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-sm text-green-700 flex items-center gap-2">
              <CheckCircle size={16} />
              <span>✅ Vehicle is available for the selected dates!</span>
            </div>
          );
        }
      }
      
      // ✅ If ONLY ONE date is selected - Show info message
      if ((formData.startDate && !formData.endDate) || (!formData.startDate && formData.endDate)) {
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-sm text-blue-700 flex items-center gap-2">
            <Info size={16} />
            <span>ℹ️ Please select both start and end dates to check availability.</span>
          </div>
        );
      }
      
      // ✅ If NO DATES SELECTED - Always show available
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-sm text-green-700 flex items-center gap-2">
          <CheckCircle size={16} />
          <span>✅ Vehicle is available</span>
        </div>
      );
    })()}
  </div>
)}
              </div>
            </div>
          )}

          {/* Dates - Car Hire */}
          {selectedService === 'car_hire' && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Calendar size={16} className="text-blue-500" /> Booking Dates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Start Date *</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formatDateForInput(formData.startDate)}
                    onChange={(e) => {
                      handleInputChange(e);
                      setTimeout(handleDateChange, 100);
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formatDateForInput(formData.endDate)}
                    onChange={(e) => {
                      handleInputChange(e);
                      setTimeout(handleDateChange, 100);
                    }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  />
                </div>
              </div>

              {selectedService === 'car_hire' && formData.itemId && days > 0 && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Days:</span>
                      <span className="font-semibold ml-1">{days}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-blue-600 ml-1">KSh {calculatedTotal.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Hotel Specific */}
          {isHotel && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Hotel size={16} className="text-orange-500" /> Select Hotel & Room
              </h3>
              
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Select Hotel *</label>
                <select
                  value={formData.hotelId}
                  onChange={(e) => {
                    const hotelId = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      hotelId: hotelId,
                      itemId: '',
                      totalAmount: 0 
                    }));
                    setSelectedItem(null);
                    setCalculatedTotal(0);
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Select a hotel...</option>
                  {hotels.filter(h => h.status === 'active').map(hotel => (
                    <option key={hotel.id} value={hotel.id}>
                      {hotel.name} - {hotel.city} ({'⭐'.repeat(hotel.starRating || 0)})
                    </option>
                  ))}
                </select>
              </div>
              
              {formData.hotelId && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Select Room Type *</label>
                  <select
                    value={formData.itemId}
                    onChange={(e) => handleItemSelect(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Select a room type...</option>
                    {roomTypes
                      .filter(r => r.hotelId === formData.hotelId && r.status === 'active')
                      .map(room => (
                        <option key={room.id} value={room.id}>
                          {room.name} - {room.type} (KSh {room.price?.toLocaleString()}/night)
                        </option>
                      ))}
                  </select>
                  {roomTypes.filter(r => r.hotelId === formData.hotelId && r.status === 'active').length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ No active room types found for this hotel. Please select another hotel.
                    </p>
                  )}
                </div>
              )}
              
              {formData.hotelId && formData.itemId && selectedItem && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700 font-medium">Selected Room:</p>
                  <p className="text-sm text-blue-600">{selectedItem.name}</p>
                  <p className="text-xs text-blue-500">💰 KSh {selectedItem.price?.toLocaleString()}/night</p>
                  <p className="text-xs text-blue-500">👥 Capacity: {selectedItem.capacity || 2} people</p>
                </div>
              )}
              
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Stay Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Check-in Date *</label>
                    <input
                      type="date"
                      name="checkIn"
                      value={formData.checkIn}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Check-out Date *</label>
                    <input
                      type="date"
                      name="checkOut"
                      value={formData.checkOut}
                      onChange={handleInputChange}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Guests</label>
                    <input
                      type="number"
                      name="guests"
                      value={formData.guests || 0}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        setFormData(prev => ({ ...prev, guests: Math.max(0, value) }));
                      }}
                      min="0"
                      max="20"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Rooms</label>
                    <input
                      type="number"
                      name="rooms"
                      value={formData.rooms || 1}
                      onChange={handleInputChange}
                      min="1"
                      max="10"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>

                {formData.checkIn && formData.checkOut && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-600">Nights:</span>
                        <span className="font-semibold ml-1">{formData.nights || calculateNights(formData.checkIn, formData.checkOut)}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Rooms:</span>
                        <span className="font-semibold ml-1">{formData.rooms || 1}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-bold text-blue-600 ml-1">
                          KSh {((selectedItem?.price || 0) * (formData.nights || calculateNights(formData.checkIn, formData.checkOut) || 1) * (formData.rooms || 1)).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ✅ Flight Specific with Class Prices */}
          {isFlight && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Plane size={16} className="text-purple-500" /> Select Flight
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Select Flight *</label>
                <select
                  value={formData.itemId}
                  onChange={(e) => handleItemSelect(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="">Select a flight...</option>
                  {items.map(flight => {
                    const econ = formatCurrency(flight.economyPrice || flight.price);
                    const biz = formatCurrency(flight.businessPrice || flight.price * 1.5);
                    const first = formatCurrency(flight.firstClassPrice || flight.price * 2);
                    return (
                      <option key={flight.id} value={flight.id}>
                        {flight.airline} {flight.flightNumber} - {flight.origin} → {flight.destination} 
                        (💺{econ} | 💼{biz} | 👑{first})
                      </option>
                    );
                  })}
                </select>
              </div>

              {formData.itemId && selectedItem && (
                <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-700 font-medium">✈️ Flight Details</p>
                  <p className="text-sm text-purple-600">{selectedItem.airline} {selectedItem.flightNumber}</p>
                  <p className="text-xs text-purple-500">{selectedItem.origin} → {selectedItem.destination}</p>
                  {selectedItem.departureDate && (
                    <p className="text-xs text-purple-500">📅 {formatDateForInput(selectedItem.departureDate)}</p>
                  )}
                  
                  {/* ✅ Class Prices Display */}
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div className="bg-green-100 p-2 rounded text-center">
                      <p className="text-green-700 font-medium">💺 Economy</p>
                      <p className="text-green-800 font-bold">{formatCurrency(selectedItem.economyPrice || selectedItem.price)}</p>
                    </div>
                    <div className="bg-blue-100 p-2 rounded text-center">
                      <p className="text-blue-700 font-medium">💼 Business</p>
                      <p className="text-blue-800 font-bold">{formatCurrency(selectedItem.businessPrice || selectedItem.price * 1.5)}</p>
                    </div>
                    <div className="bg-yellow-100 p-2 rounded text-center">
                      <p className="text-yellow-700 font-medium">👑 First Class</p>
                      <p className="text-yellow-800 font-bold">{formatCurrency(selectedItem.firstClassPrice || selectedItem.price * 2)}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">Seat Class</label>
                <select
                  name="seatClass"
                  value={formData.seatClass || 'economy'}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({ ...prev, seatClass: value }));
                    // Recalculate total based on seat class
                    if (formData.itemId && formData.passengers) {
                      const flight = flights.find(f => f.id === formData.itemId);
                      if (flight) {
                        const price = getFlightPrice(flight, value);
                        const total = price * formData.passengers;
                        setCalculatedTotal(total);
                        setFormData(prev => ({ ...prev, totalAmount: total }));
                      }
                    }
                  }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="economy">💺 Economy</option>
                  <option value="business">💼 Business</option>
                  <option value="first_class">👑 First Class</option>
                </select>
              </div>
            </div>
          )}

          {/* Passengers - Tours, Hajj & Flights */}
          {(selectedService === 'tour' || selectedService === 'hajj' || selectedService === 'flight') && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User size={16} className="text-blue-500" /> Passengers & Pricing
              </h3>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Number of Passengers</label>
                <input
                  type="number"
                  name="passengers"
                  value={formData.passengers}
                  onChange={handleInputChange}
                  min="1"
                  max="20"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              {formData.itemId && selectedItem && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Price per person:</span>
                      <span className="font-semibold ml-1">
                        {selectedService === 'flight' 
                          ? formatCurrency(getFlightPrice(selectedItem, formData.seatClass))
                          : formatCurrency(selectedItem?.price || 0)
                        }
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Passengers:</span>
                      <span className="font-semibold ml-1">{formData.passengers || 1}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-blue-600 ml-1">
                        {selectedService === 'flight'
                          ? formatCurrency((getFlightPrice(selectedItem, formData.seatClass) || 0) * (formData.passengers || 1))
                          : formatCurrency((selectedItem?.price || 0) * (formData.passengers || 1))
                        }
                      </span>
                    </div>
                  </div>
                  {selectedService === 'hajj' && (
                    <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-gray-600">
                      <p className="font-medium text-gray-700">Package Details:</p>
                      <p>Type: {getHajjTypeLabel(selectedItem?.type)}</p>
                      {selectedItem?.accommodation && <p>🏨 {selectedItem.accommodation}</p>}
                      {selectedItem?.meals && <p>🍽️ {selectedItem.meals}</p>}
                    </div>
                  )}
                  {selectedService === 'flight' && (
                    <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-gray-600">
                      <p className="font-medium text-gray-700">Seat Class:</p>
                      <p>{getSeatClassLabel(formData.seatClass || 'economy')}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payment */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <CreditCard size={16} className="text-blue-500" /> Payment
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Payment Method *</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                >
                  <option value="CASH">Cash</option>
                  <option value="M_PESA">M-Pesa</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CREDIT">Credit (Pay Later)</option>
                </select>
              </div>
              {formData.totalAmount > 0 && (
                <div className="flex items-end">
                  <div className="w-full p-2 bg-blue-50 rounded-lg text-center">
                    <span className="text-xs text-gray-500">Total Amount</span>
                    <p className="text-lg font-bold text-blue-600">KSh {formData.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              )}
            </div>

            {formData.paymentMethod === 'M_PESA' && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-600 mb-1">M-Pesa Transaction Code *</label>
                <div className="relative">
                  <Receipt size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="mpesaCode"
                    value={formData.mpesaCode}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="e.g., ABC123DEF456"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Enter the M-Pesa confirmation code received</p>
              </div>
            )}

            {formData.paymentMethod === 'CREDIT' && (
              <div className="mt-3 bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-800">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">Credit Payment</span>
                </div>
                <p className="text-xs text-yellow-700 mt-1">
                  You will pay later. We'll send you a payment reminder.
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Additional Notes</h3>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="2"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              placeholder="Any special requests or requirements..."
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
            ℹ️ You will receive a booking reference number via email. Use it to track your booking.
          </div>

          {!isPreview ? (
  // ✅ STEP 1: PREVIEW BUTTON
  <button
    type="button"
    onClick={() => {
      // Validate first
      if (!formData.customerName) {
        showNotification('Please enter your name', 'error');
        return;
      }
      if (!formData.customerEmail) {
        showNotification('Please enter your email', 'error');
        return;
      }
      if (!formData.customerPhone) {
        showNotification('Please enter your phone number', 'error');
        return;
      }
      if (!formData.serviceType) {
        showNotification('Please select a service', 'error');
        return;
      }
      if (!formData.itemId) {
        showNotification('Please select an item', 'error');
        return;
      }
      
      // Calculate total and show preview
      calculatePreview();
      setIsPreview(true);
    }}
    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-2"
  >
    Preview Booking <ArrowRight size={18} />
  </button>
) : (
  // ✅ STEP 2: CONFIRM BOOKING BUTTON
  <div className="space-y-4">
    {/* Show Preview Details */}
    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
      <h4 className="font-bold text-blue-800 mb-2">📋 Booking Preview</h4>
      <div className="space-y-1 text-sm">
        <p><span className="text-gray-600">Service:</span> <span className="font-medium">{service?.label}</span></p>
        <p><span className="text-gray-600">Customer:</span> <span className="font-medium">{formData.customerName}</span></p>
        <p><span className="text-gray-600">Email:</span> <span className="font-medium">{formData.customerEmail}</span></p>
        <p><span className="text-gray-600">Phone:</span> <span className="font-medium">{formData.customerPhone}</span></p>
        {formData.startDate && (
  <p><span className="text-gray-600">Start:</span> <span className="font-medium">{formatDateForInput(formData.startDate)}</span></p>
)}
{formData.endDate && (
  <p><span className="text-gray-600">End:</span> <span className="font-medium">{formatDateForInput(formData.endDate)}</span></p>
)}
        {formData.passengers > 1 && (
          <p><span className="text-gray-600">Passengers:</span> <span className="font-medium">{formData.passengers}</span></p>
        )}
        <div className="pt-2 mt-2 border-t border-blue-200">
          <p className="text-lg font-bold text-blue-600">
            Total Amount: KSh {formData.totalAmount.toLocaleString()}
          </p>
        </div>
      </div>
    </div>

    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => setIsPreview(false)}
        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
      >
        ← Edit Booking
      </button>
      <button
  type="submit"
  disabled={isSubmitting}
  className={`flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center gap-2 ${
    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  {isSubmitting ? (
    <>
      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      Processing...
    </>
  ) : (
    <>
      ✅ Confirm Booking <ArrowRight size={18} />
    </>
  )}
</button>
    </div>
  </div>
)}
        </form>
      </div>
    );
  };

  const renderStep3 = () => {
    const service = services.find(s => s.id === formData.serviceType);
    
    return (
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Booking Submitted! 🎉</h2>
        <p className="text-gray-600 mb-2">Your booking has been received successfully.</p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-4 inline-block">
          <p className="text-sm text-gray-500">Your Booking Reference</p>
          <p className="text-2xl font-bold text-blue-600">{bookingReference}</p>
        </div>

        <div className="text-sm text-gray-500 space-y-1 mb-6">
          <p>📧 A confirmation email has been sent to <strong>{formData.customerEmail}</strong></p>
          <p>📱 We'll contact you at <strong>{formData.customerPhone}</strong></p>
          <p>📋 Service: <strong>{service?.label}</strong></p>
          {selectedItem && (
            <p>📦 Item: <strong>{getItemDisplayName(selectedItem)}</strong></p>
          )}
          {formData.startDate && (
  <p>📅 Start: <strong>{formatDateForInput(formData.startDate)}</strong></p>
)}
{formData.endDate && (
  <p>📅 End: <strong>{formatDateForInput(formData.endDate)}</strong></p>
)}
          {formData.passengers > 1 && (
            <p>👥 Passengers: <strong>{formData.passengers}</strong></p>
          )}
          {formData.totalAmount > 0 && (
            <p>💰 Total: <strong>KSh {formData.totalAmount.toLocaleString()}</strong></p>
          )}
          {formData.paymentMethod === 'CREDIT' && (
            <p className="text-yellow-600">💳 Payment: Credit (Pay Later)</p>
          )}
          {formData.paymentMethod === 'M_PESA' && (
            <p>💳 Payment: M-Pesa - Code: {formData.mpesaCode}</p>
          )}
          
          {/* Show Hotel details if applicable */}
          {selectedService === 'hotel' && selectedItem && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="font-medium">🏨 Hotel Details:</p>
              <p>{formData.hotelName || 'Hotel'}</p>
              <p>Room: {selectedItem?.name || 'Standard'}</p>
              <p>Check-in: {formatDateForInput(formData.checkIn)}</p>
              <p>Check-out: {formatDateForInput(formData.checkOut)}</p>
              <p>Nights: {formData.nights || 0}</p>
              <p>Rooms: {formData.rooms || 1}</p>
              <p>Guests: {formData.guests || 1}</p>
            </div>
          )}
          
          {/* Show Hajj package details if applicable */}
          {selectedService === 'hajj' && selectedItem && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="font-medium">🕋 Hajj Package Details:</p>
              <p>Type: {getHajjTypeLabel(selectedItem?.type)}</p>
              {selectedItem?.accommodation && <p>🏨 {selectedItem.accommodation}</p>}
              {selectedItem?.meals && <p>🍽️ {selectedItem.meals}</p>}
              {selectedItem?.transport && <p>🚌 {selectedItem.transport}</p>}
              {selectedItem?.visa && <p>🛂 {selectedItem.visa}</p>}
            </div>
          )}

          {/* ✅ Show Flight details with class prices */}
          {selectedService === 'flight' && selectedItem && (
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="font-medium">✈️ Flight Details:</p>
              <p>{selectedItem.airline} {selectedItem.flightNumber}</p>
              <p>{selectedItem.origin} → {selectedItem.destination}</p>
              {selectedItem.departureDate && (
                <p>📅 Departure: {formatDateForInput(selectedItem.departureDate)}</p>
              )}
              <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                <div className="bg-green-100 p-2 rounded text-center">
                  <p className="text-green-700 font-medium">💺 Economy</p>
                  <p className="text-green-800 font-bold">{formatCurrency(selectedItem.economyPrice || selectedItem.price)}</p>
                </div>
                <div className="bg-blue-100 p-2 rounded text-center">
                  <p className="text-blue-700 font-medium">💼 Business</p>
                  <p className="text-blue-800 font-bold">{formatCurrency(selectedItem.businessPrice || selectedItem.price * 1.5)}</p>
                </div>
                <div className="bg-yellow-100 p-2 rounded text-center">
                  <p className="text-yellow-700 font-medium">👑 First Class</p>
                  <p className="text-yellow-800 font-bold">{formatCurrency(selectedItem.firstClassPrice || selectedItem.price * 2)}</p>
                </div>
              </div>
              <p>💺 Seat Class: {getSeatClassLabel(formData.seatClass || 'economy')}</p>
              <p>👥 Passengers: {formData.passengers || 1}</p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetBooking}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Book Another Service
          </button>
          <button
            onClick={() => onNavigate('login')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Create Account (Optional)
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl shadow-amber-500/10 border border-amber-300/70 overflow-hidden max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 text-center relative border-b border-gray-100">
          <button
            onClick={() => onNavigate('login')}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back
          </button>
          <div className="flex justify-center">
            <img 
              src="/lg1.png" 
              alt="Sulul Tours Logo" 
              className="w-full max-w-[80px] h-auto object-contain mx-auto"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
          <div className="mt-1">
            <p className="text-gray-500 text-[10px] mt-0.5 font-medium tracking-wide">
              Book Without Registering
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && bookingComplete && renderStep3()}
        </div>

        {/* Footer */}
        <div className="text-center pb-3">
          <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold sm:font-normal">
            &copy; 2026 Sulul Tours &amp; Travel. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GuestBooking;