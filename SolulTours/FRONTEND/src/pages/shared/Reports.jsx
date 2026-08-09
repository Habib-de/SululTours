import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, FileDown, BarChart3, 
  Clock, Download, Eye, Filter, X,
  AlertTriangle, Activity, Users, Fuel,
  CheckCircle, AlertCircle,
  Calendar, Search, ChevronDown, ChevronUp,
  Wrench, DollarSign, MapPinned,
  AlertOctagon, Upload, File, Truck, Image, FilePlus,
  FolderOpen, RefreshCw, Printer, Share2,
  PieChart, LineChart, TrendingUp, TrendingDown,
  Zap, Shield, Award, Settings, Link, Bookmark, Save,
  Car, Compass, MapPin, Hotel, Plane, Headphones,
  Wallet, Receipt, User, Gauge, MoreVertical,
  Plus, Grid, List, Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { 
  reportService, bookingService, vehicleService, tourPackageService, 
  hajjPackageService, hotelService, flightService, 
  expenseService, maintenanceService, carOwnerService, userService 
} from '../../services/api';

// ============================================
// REPORT TEMPLATES - TRAVEL AGENCY
// ============================================
const REPORT_TEMPLATES = {
  'executive_summary': {
    id: 'executive_summary',
    label: 'Executive Summary',
    icon: BarChart3,
    color: 'purple',
    description: 'Complete business overview with key metrics',
    categories: ['Overview']
  },
  'revenue_report': {
    id: 'revenue_report',
    label: 'Revenue Report',
    icon: DollarSign,
    color: 'green',
    description: 'Revenue breakdown by service and time period',
    categories: ['Finance']
  },
  'booking_report': {
    id: 'booking_report',
    label: 'Bookings Report',
    icon: Calendar,
    color: 'blue',
    description: 'Booking trends, status, and customer analysis',
    categories: ['Operations']
  },
  'fleet_report': {
    id: 'fleet_report',
    label: 'Fleet Report',
    icon: Truck,
    color: 'orange',
    description: 'Vehicle status, maintenance, and utilization',
    categories: ['Fleet']
  },
  'tour_report': {
    id: 'tour_report',
    label: 'Tour Packages Report',
    icon: Compass,
    color: 'green',
    description: 'Tour performance and popularity analysis',
    categories: ['Tours']
  },
  'hajj_report': {
    id: 'hajj_report',
    label: 'Hajj & Umra Report',
    icon: MapPin,
    color: 'red',
    description: 'Hajj/Umra package bookings and status',
    categories: ['Hajj']
  },
  'hotel_report': {
    id: 'hotel_report',
    label: 'Hotel Report',
    icon: Hotel,
    color: 'orange',
    description: 'Hotel bookings and occupancy analysis',
    categories: ['Hotels']
  },
  'flight_report': {
    id: 'flight_report',
    label: 'Flight Report',
    icon: Plane,
    color: 'purple',
    description: 'Flight bookings and route analysis',
    categories: ['Flights']
  },
  'consultancy_report': {
    id: 'consultancy_report',
    label: 'Consultancy Report',
    icon: Headphones,
    color: 'pink',
    description: 'Consultancy services and revenue',
    categories: ['Consultancy']
  },
  'expense_report': {
    id: 'expense_report',
    label: 'Expense Report',
    icon: Wallet,
    color: 'red',
    description: 'All expenses and cost analysis',
    categories: ['Finance']
  },
  'debt_report': {
    id: 'debt_report',
    label: 'Debt Report',
    icon: AlertCircle,
    color: 'red',
    description: 'Outstanding balances and debt tracking',
    categories: ['Finance']
  },
  'driver_report': {
    id: 'driver_report',
    label: 'Driver Report',
    icon: Users,
    color: 'blue',
    description: 'Driver performance and assignments',
    categories: ['Fleet']
  }
};

const Reports = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [selectedReport, setSelectedReport] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [activeView, setActiveView] = useState('reports');
  const [dateRange, setDateRange] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedService, setSelectedService] = useState('all');
  const [exportFormat, setExportFormat] = useState('pdf');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [tenantId, setTenantId] = useState(null);
  
  // Data states
  const [bookings, setBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [tours, setTours] = useState([]);
  const [hajjPackages, setHajjPackages] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [flights, setFlights] = useState([]);
  const [consultancy, setConsultancy] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [carOwners, setCarOwners] = useState([]);
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);
  
  const [reportData, setReportData] = useState(null);
  const [reportCategories, setReportCategories] = useState([]);
  const [savedReports, setSavedReports] = useState([]);

  // Summary stats
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    totalTours: 0,
    totalHajj: 0,
    totalHotels: 0,
    totalFlights: 0,
    totalConsultancy: 0,
    totalCustomers: 0,
    revenueByService: {},
    bookingsByService: {},
    pendingBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalDebt: 0,
    carOwnersCount: 0,
    clientsCount: 0,
    totalTrips: 0,
    totalDrivers: 0,
    maintenanceCost: 0
  });

  // ============================================
  // LOAD DATA FROM API
  // ============================================
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const userData = currentUser || JSON.parse(localStorage.getItem('user') || '{}');
      const tenantToUse = userData?.tenantId;

      if (!tenantToUse) {
        console.warn('⚠️ No tenantId available');
        setIsLoading(false);
        return;
      }

      setTenantId(tenantToUse);
      console.log('🔍 Loading report data for tenant:', tenantToUse);

      // ✅ Load all data from API in parallel
      const [
        bookingsRes,
        vehiclesRes,
        toursRes,
        hajjRes,
        hotelsRes,
        flightsRes,
        expensesRes,
        maintenanceRes,
        ownersRes,
        usersRes
      ] = await Promise.all([
        bookingService.getAll(tenantToUse).catch(() => ({ success: true, data: [] })),
        vehicleService.getAll(tenantToUse).catch(() => ({ success: true, data: [] })),
        tourPackageService.getAll(tenantToUse).catch(() => ({ success: true, data: [] })),
        hajjPackageService.getAll(tenantToUse).catch(() => ({ success: true, data: [] })),
        hotelService.getAll(tenantToUse).catch(() => ({ success: true, data: [] })),
        flightService.getAll(tenantToUse).catch(() => ({ success: true, data: [] })),
        expenseService.getAll(tenantToUse).catch(() => ({ success: true, data: [] })),
        maintenanceService.getAll(tenantToUse).catch(() => ({ success: true, data: [] })),
        carOwnerService.getAll(tenantToUse).catch(() => ({ success: true, data: [] })),
        userService.getAll(tenantToUse).catch(() => ({ success: true, data: [] }))
      ]);

      const extractData = (response) => {
        if (response?.success && response?.data) return response.data;
        if (Array.isArray(response)) return response;
        return [];
      };

      const bookingsData = extractData(bookingsRes);
      const vehiclesData = extractData(vehiclesRes);
      const toursData = extractData(toursRes);
      const hajjData = extractData(hajjRes);
      const hotelsData = extractData(hotelsRes);
      const flightsData = extractData(flightsRes);
      const expensesData = extractData(expensesRes);
      const maintenanceData = extractData(maintenanceRes);
      const ownersData = extractData(ownersRes);
      const usersData = extractData(usersRes);

      // ✅ Set state
      setBookings(bookingsData);
      setVehicles(vehiclesData);
      setTours(toursData);
      setHajjPackages(hajjData);
      setHotels(hotelsData);
      setFlights(flightsData);
      setExpenses(expensesData);
      setMaintenance(maintenanceData);
      setCarOwners(ownersData);
      setUsers(usersData);
      setDrivers([]);
      setTrips([]);
      setConsultancy([]);

      // ✅ Calculate summary with ALL data
      calculateSummary(
        bookingsData, vehiclesData, toursData, hajjData,
        hotelsData, flightsData, [], expensesData,
        maintenanceData, ownersData, usersData, [], []
      );

      // ✅ Generate categories
      generateCategories(
        bookingsData, vehiclesData, toursData, hajjData,
        hotelsData, flightsData, [], expensesData,
        maintenanceData, ownersData, usersData, [], []
      );

      loadSavedReports();
      loadUploadedFiles();

    } catch (error) {
      console.error('❌ Error loading data:', error);
      setErrorMessage('Failed to load report data. Please try again.');
      loadFromLocalStorage();
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // ============================================
  // LOAD SAVED REPORTS
  // ============================================
  const loadSavedReports = () => {
    const saved = localStorage.getItem('travel_agency_saved_reports');
    if (saved) {
      try {
        setSavedReports(JSON.parse(saved));
      } catch (e) {
        setSavedReports([]);
      }
    }
  };

  // ============================================
  // LOAD UPLOADED FILES
  // ============================================
  const loadUploadedFiles = () => {
    const savedFiles = localStorage.getItem('travel_agency_report_uploads');
    if (savedFiles) {
      try {
        setUploadedFiles(JSON.parse(savedFiles));
      } catch (e) {
        setUploadedFiles([]);
      }
    }
  };

  // ============================================
  // FALLBACK TO LOCALSTORAGE
  // ============================================
  const loadFromLocalStorage = () => {
    try {
      const storedBookings = JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
      const storedVehicles = JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
      const storedTours = JSON.parse(localStorage.getItem('travel_agency_tour_packages') || '[]');
      const storedHajj = JSON.parse(localStorage.getItem('travel_agency_hajj_packages') || '[]');
      const storedHotels = JSON.parse(localStorage.getItem('travel_agency_hotels') || '[]');
      const storedFlights = JSON.parse(localStorage.getItem('travel_agency_flights') || '[]');
      const storedExpenses = JSON.parse(localStorage.getItem('travel_agency_expenses') || '[]');
      const storedMaintenance = JSON.parse(localStorage.getItem('travel_agency_maintenance') || '[]');
      const storedOwners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
      const storedUsers = JSON.parse(localStorage.getItem('travel_agency_users') || '[]');

      setBookings(storedBookings);
      setVehicles(storedVehicles);
      setTours(storedTours);
      setHajjPackages(storedHajj);
      setHotels(storedHotels);
      setFlights(storedFlights);
      setExpenses(storedExpenses);
      setMaintenance(storedMaintenance);
      setCarOwners(storedOwners);
      setUsers(storedUsers);

      calculateSummary(
        storedBookings, storedVehicles, storedTours, storedHajj,
        storedHotels, storedFlights, [], storedExpenses,
        storedMaintenance, storedOwners, storedUsers, [], []
      );

      generateCategories(
        storedBookings, storedVehicles, storedTours, storedHajj,
        storedHotels, storedFlights, [], storedExpenses,
        storedMaintenance, storedOwners, storedUsers, [], []
      );
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  };

  // ============================================
  // CALCULATE SUMMARY
  // ============================================
  const calculateSummary = (
  bookingsData, vehiclesData, toursData, hajjData, 
  hotelsData, flightsData, consultancyData, 
  expensesData, maintenanceData, ownersData, usersData,
  driversData, tripsData
) => {
  let totalRevenue = 0;
  let revenueByService = {
    carHire: 0,
    tours: 0,
    hajj: 0,
    hotels: 0,
    flights: 0,
    consultancy: 0,
    visa: 0  // ✅ ADD VISA
  };
  let bookingsByService = {
    carHire: 0,
    tours: 0,
    hajj: 0,
    hotels: 0,
    flights: 0,
    consultancy: 0,
    visa: 0  // ✅ ADD VISA
  };

  // ✅ Calculate revenue from bookings
  bookingsData.forEach(b => {
    const serviceType = b.serviceType || b.service_type || 'car_hire';
    const amount = b.totalPrice || b.total_price || 0;
    
    totalRevenue += amount;
    
    if (serviceType === 'car_hire' || serviceType === 'car') {
      revenueByService.carHire += amount;
      bookingsByService.carHire++;
    } else if (serviceType === 'tour' || serviceType === 'tours') {
      revenueByService.tours += amount;
      bookingsByService.tours++;
    } else if (serviceType === 'hajj' || serviceType === 'hajj_umra') {
      revenueByService.hajj += amount;
      bookingsByService.hajj++;
    } else if (serviceType === 'hotel' || serviceType === 'hotels') {
      revenueByService.hotels += amount;
      bookingsByService.hotels++;
    } else if (serviceType === 'flight' || serviceType === 'flights') {
      revenueByService.flights += amount;
      bookingsByService.flights++;
    } else if (serviceType === 'consultancy') {
      revenueByService.consultancy += amount;
      bookingsByService.consultancy++;
    } else if (serviceType === 'visa' || serviceType === 'visa_processing') {
      revenueByService.visa += amount;
      bookingsByService.visa++;
    }
  });

  // ✅ Calculate expenses from both expenses and maintenance
  const totalExpenses = expensesData.reduce((sum, e) => sum + (e.amount || e.cost || 0), 0) + 
                        maintenanceData.reduce((sum, m) => sum + (m.cost || m.amount || 0), 0);

  const pending = bookingsData.filter(b => b.status === 'pending').length;
  const completed = bookingsData.filter(b => b.status === 'completed' || b.status === 'confirmed').length;
  const cancelled = bookingsData.filter(b => b.status === 'cancelled').length;
  const totalDebt = bookingsData.reduce((sum, b) => sum + (b.remainingBalance || 0), 0);
  const activeVehicles = vehiclesData.filter(v => v.status === 'active').length;

  setSummary({
    totalRevenue,
    totalBookings: bookingsData.length,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    totalVehicles: vehiclesData.length,
    activeVehicles,
    totalTours: toursData.filter(t => t.status === 'active' || t.status === 'published').length,
    totalHajj: hajjData.length,
    totalHotels: hotelsData.length,
    totalFlights: flightsData.length,
    totalConsultancy: consultancyData.length,
    totalCustomers: usersData.filter(u => u.role === 'client').length,
    revenueByService,
    bookingsByService,
    pendingBookings: pending,
    completedBookings: completed,
    cancelledBookings: cancelled,
    totalDebt,
    carOwnersCount: ownersData.filter(o => o.status === 'active').length,
    clientsCount: usersData.filter(u => u.role === 'client').length,
    totalTrips: tripsData.length,
    totalDrivers: driversData.length,
    maintenanceCost: maintenanceData.reduce((sum, m) => sum + (m.cost || m.amount || 0), 0)
  });
};

  // ============================================
  // GENERATE CATEGORIES
  // ============================================
  const generateCategories = (
    bookingsData, vehiclesData, toursData, hajjData,
    hotelsData, flightsData, consultancyData,
    expensesData, maintenanceData, ownersData, usersData,
    driversData, tripsData
  ) => {
    const categories = [];
    const pendingCount = bookingsData.filter(b => b.status === 'pending').length;
    const activeVehiclesCount = vehiclesData.filter(v => v.status === 'active').length;

    // Overview
    categories.push({
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
      color: 'purple',
      reports: [
        { 
          id: 'executive_summary', 
          label: 'Executive Summary', 
          icon: BarChart3, 
          color: 'purple',
          description: `Complete overview with ${bookingsData.length} bookings, ${vehiclesData.length} vehicles`,
          dataSource: 'all'
        }
      ]
    });

    // Finance
    categories.push({
      id: 'finance',
      label: 'Finance',
      icon: DollarSign,
      color: 'green',
      reports: [
        { 
          id: 'revenue_report', 
          label: 'Revenue Report', 
          icon: DollarSign, 
          color: 'green',
          description: `Total revenue: ${formatCurrency(summary.totalRevenue)}`,
          dataSource: 'bookings'
        },
        { 
          id: 'expense_report', 
          label: 'Expense Report', 
          icon: Wallet, 
          color: 'red',
          description: `Total expenses: ${formatCurrency(summary.totalExpenses)}`,
          dataSource: 'expenses'
        },
        { 
          id: 'debt_report', 
          label: 'Debt Report', 
          icon: AlertCircle, 
          color: 'red',
          description: `Total debt: ${formatCurrency(summary.totalDebt)}`,
          dataSource: 'bookings'
        }
      ]
    });

    // Operations
    categories.push({
      id: 'operations',
      label: 'Operations',
      icon: Calendar,
      color: 'blue',
      reports: [
        { 
          id: 'booking_report', 
          label: 'Bookings Report', 
          icon: Calendar, 
          color: 'blue',
          description: `${bookingsData.length} total bookings, ${pendingCount} pending`,
          dataSource: 'bookings'
        }
      ]
    });

    // Fleet
    categories.push({
      id: 'fleet',
      label: 'Fleet',
      icon: Truck,
      color: 'orange',
      reports: [
        { 
          id: 'fleet_report', 
          label: 'Fleet Report', 
          icon: Truck, 
          color: 'orange',
          description: `${vehiclesData.length} vehicles, ${activeVehiclesCount} active`,
          dataSource: 'vehicles'
        },
        { 
          id: 'driver_report', 
          label: 'Driver Report', 
          icon: Users, 
          color: 'blue',
          description: `${driversData.length} drivers registered`,
          dataSource: 'drivers'
        }
      ]
    });

    // Tours
    if (toursData.length > 0) {
      categories.push({
        id: 'tours',
        label: 'Tours',
        icon: Compass,
        color: 'green',
        reports: [
          { 
            id: 'tour_report', 
            label: 'Tour Packages Report', 
            icon: Compass, 
            color: 'green',
            description: `${toursData.length} tour packages available`,
            dataSource: 'tours'
          }
        ]
      });
    }

    // Hajj
    if (hajjData.length > 0) {
      categories.push({
        id: 'hajj',
        label: 'Hajj & Umra',
        icon: MapPin,
        color: 'red',
        reports: [
          { 
            id: 'hajj_report', 
            label: 'Hajj & Umra Report', 
            icon: MapPin, 
            color: 'red',
            description: `${hajjData.length} packages available`,
            dataSource: 'hajj'
          }
        ]
      });
    }

    // Hotels
    if (hotelsData.length > 0) {
      categories.push({
        id: 'hotels',
        label: 'Hotels',
        icon: Hotel,
        color: 'orange',
        reports: [
          { 
            id: 'hotel_report', 
            label: 'Hotel Report', 
            icon: Hotel, 
            color: 'orange',
            description: `${hotelsData.length} hotels listed`,
            dataSource: 'hotels'
          }
        ]
      });
    }

    // Flights
    if (flightsData.length > 0) {
      categories.push({
        id: 'flights',
        label: 'Flights',
        icon: Plane,
        color: 'purple',
        reports: [
          { 
            id: 'flight_report', 
            label: 'Flight Report', 
            icon: Plane, 
            color: 'purple',
            description: `${flightsData.length} flights available`,
            dataSource: 'flights'
          }
        ]
      });
    }

    setReportCategories(categories);
  };

  // ============================================
  // HELPERS
  // ============================================
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

  const getServiceLabel = (serviceType) => {
    const labels = {
      car_hire: 'Car Hire',
      car: 'Car Hire',
      tour: 'Tour',
      tours: 'Tour',
      hajj: 'Hajj & Umra',
      hajj_umra: 'Hajj & Umra',
      hotel: 'Hotel',
      hotels: 'Hotel',
      flight: 'Flight',
      flights: 'Flight',
      consultancy: 'Consultancy'
    };
    return labels[serviceType] || serviceType || 'Unknown';
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { label: status || 'Pending', color: 'bg-gray-100 text-gray-800' };
  };

  const getCategoryColor = (category) => {
    const colors = {
      'Overview': 'bg-purple-100 text-purple-700',
      'Finance': 'bg-green-100 text-green-700',
      'Operations': 'bg-blue-100 text-blue-700',
      'Fleet': 'bg-orange-100 text-orange-700',
      'Tours': 'bg-green-100 text-green-700',
      'Hajj & Umra': 'bg-red-100 text-red-700',
      'Hotels': 'bg-orange-100 text-orange-700',
      'Flights': 'bg-purple-100 text-purple-700',
      'Consultancy': 'bg-pink-100 text-pink-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
  };

  const getIconColor = (color) => {
    const colors = {
      'red': 'text-red-600',
      'orange': 'text-orange-600',
      'yellow': 'text-yellow-600',
      'green': 'text-green-600',
      'blue': 'text-blue-600',
      'purple': 'text-purple-600',
      'pink': 'text-pink-600',
      'indigo': 'text-indigo-600',
    };
    return colors[color] || 'text-blue-600';
  };

  const filteredCategories = reportCategories
    .map(category => ({
      ...category,
      reports: category.reports.filter(report => 
        report.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }))
    .filter(category => category.reports.length > 0);

  // ============================================
  // GENERATE REPORT DATA
  // ============================================
  const generateReportData = (reportId) => {
    let data = [];
    let summaryData = {};

    switch(reportId) {
      case 'executive_summary':
        data = { bookings, vehicles, tours, hajjPackages, hotels, flights, consultancy, expenses, maintenance, drivers, trips };
        summaryData = {
          totalRevenue: summary.totalRevenue,
          totalBookings: summary.totalBookings,
          totalExpenses: summary.totalExpenses,
          netProfit: summary.netProfit,
          totalVehicles: summary.totalVehicles,
          activeVehicles: summary.activeVehicles,
          totalTours: summary.totalTours,
          totalHajj: summary.totalHajj,
          totalHotels: summary.totalHotels,
          totalFlights: summary.totalFlights,
          totalConsultancy: summary.totalConsultancy,
          totalCustomers: summary.totalCustomers,
          totalDebt: summary.totalDebt
        };
        break;

      case 'revenue_report':
        data = bookings;
        summaryData = {
          totalRevenue: summary.totalRevenue,
          carHire: summary.revenueByService.carHire,
          tours: summary.revenueByService.tours,
          hajj: summary.revenueByService.hajj,
          hotels: summary.revenueByService.hotels,
          flights: summary.revenueByService.flights,
          consultancy: summary.revenueByService.consultancy,
          visa: summary.revenueByService.visa || 0 
        };
        break;

      case 'booking_report':
        data = bookings;
        summaryData = {
          total: bookings.length,
          pending: summary.pendingBookings,
          completed: summary.completedBookings,
          cancelled: summary.cancelledBookings
        };
        break;

      case 'fleet_report':
        data = vehicles;
        summaryData = {
          total: vehicles.length,
          active: summary.activeVehicles,
          maintenance: vehicles.filter(v => v.status === 'maintenance').length,
          totalDrivers: summary.totalDrivers
        };
        break;

      case 'expense_report':
        data = expenses;
        summaryData = {
          total: expenses.length,
          totalAmount: expenses.reduce((sum, e) => sum + (e.amount || e.cost || 0), 0),
          categories: [...new Set(expenses.map(e => e.category || 'General'))]
        };
        break;

      case 'debt_report':
        data = bookings.filter(b => (b.remainingBalance || 0) > 0);
        summaryData = {
          total: data.length,
          totalDebt: data.reduce((sum, b) => sum + (b.remainingBalance || 0), 0)
        };
        break;

      case 'tour_report':
        data = tours;
        summaryData = {
          total: tours.length,
          active: tours.filter(t => t.status === 'active' || t.status === 'published').length
        };
        break;

      case 'hajj_report':
        data = hajjPackages;
        summaryData = {
          total: hajjPackages.length,
          available: hajjPackages.filter(h => h.status === 'available').length
        };
        break;

      case 'hotel_report':
        data = hotels;
        summaryData = {
          total: hotels.length,
          available: hotels.filter(h => h.status === 'available').length
        };
        break;

      case 'flight_report':
        data = flights;
        summaryData = {
          total: flights.length,
          available: flights.filter(f => f.status === 'available').length
        };
        break;

      case 'consultancy_report':
        data = consultancy;
        summaryData = {
          total: consultancy.length
        };
        break;

      case 'driver_report':
        data = drivers;
        summaryData = {
          total: drivers.length,
          active: drivers.filter(d => d.status === 'active').length
        };
        break;

      default:
        data = [];
        summaryData = { total: 0 };
    }

    return { data, summary: summaryData };
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handleGenerateReport = (report) => {
    setSelectedReport(report);
    setShowPreview(true);
    setIsGenerating(true);
    
    setTimeout(() => {
      const reportResult = generateReportData(report.id);
      setReportData(reportResult);
      setIsGenerating(false);
    }, 800);
  };

  const handleExport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      showNotification(`✅ Report "${selectedReport?.label}" exported as ${exportFormat.toUpperCase()}`);
    }, 1500);
  };

  const handleSaveReport = () => {
    if (!selectedReport || !reportData) return;
    
    const savedReport = {
      id: `saved_${Date.now()}`,
      reportId: selectedReport.id,
      label: selectedReport.label,
      date: new Date().toISOString(),
      summary: reportData.summary
    };
    
    const updated = [...savedReports, savedReport];
    setSavedReports(updated);
    localStorage.setItem('travel_agency_saved_reports', JSON.stringify(updated));
    setSuccessMessage('✅ Report saved successfully!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const showNotification = (message, type = 'success') => {
    alert(message);
  };

  // ============================================
  // FILE UPLOAD HANDLERS (keep as is)
  // ============================================
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setUploadMessage('');
    setUploadError('');

    if (files.length === 0) {
      setUploadError('No files selected');
      return;
    }

    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploadError(`File "${file.name}" is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newFiles = validFiles.map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: file.name,
      size: (file.size / 1024).toFixed(1) + ' KB',
      type: file.type,
      uploadDate: new Date().toISOString(),
      status: 'uploaded'
    }));

    const updatedFiles = [...uploadedFiles, ...newFiles];
    setUploadedFiles(updatedFiles);
    
    try {
      localStorage.setItem('travel_agency_report_uploads', JSON.stringify(updatedFiles));
      setUploadMessage(`✅ ${newFiles.length} file(s) uploaded successfully!`);
      setTimeout(() => setUploadMessage(''), 3000);
    } catch (error) {
      console.error('Error saving files:', error);
      setUploadError('Failed to save files. Please try again.');
    }

    e.target.value = '';
  };

  const deleteFile = (fileId) => {
    const updatedFiles = uploadedFiles.filter(f => f.id !== fileId);
    setUploadedFiles(updatedFiles);
    localStorage.setItem('travel_agency_report_uploads', JSON.stringify(updatedFiles));
    setUploadMessage('🗑️ File deleted successfully');
    setTimeout(() => setUploadMessage(''), 3000);
  };

  // ============================================
  // RENDER DOCUMENTS VIEW
  // ============================================
  const renderDocumentsView = () => {
    const files = uploadedFiles;

    if (files.length === 0) {
      return (
        <div className="text-center py-12">
          <FolderOpen size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Documents Uploaded</h3>
          <p className="text-gray-500 text-sm">Upload your first document using the "Upload Docs" button</p>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-700 flex items-center gap-2 mx-auto"
          >
            <Upload size={16} /> Upload Documents
          </button>
        </div>
      );
    }

    const groupedFiles = files.reduce((acc, file) => {
      const date = new Date(file.uploadDate).toLocaleDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(file);
      return acc;
    }, {});

    const sortedDates = Object.keys(groupedFiles).sort((a, b) => new Date(b) - new Date(a));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">Total Documents</p>
            <p className="text-2xl font-bold">{files.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">Total Size</p>
            <p className="text-2xl font-bold">
              {files.reduce((sum, f) => sum + (parseFloat(f.size) || 0), 0).toFixed(0)} KB
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-xs text-gray-500">File Types</p>
            <p className="text-2xl font-bold">
              {new Set(files.map(f => {
                if (f.type?.includes('pdf')) return 'PDF';
                if (f.type?.includes('excel') || f.type?.includes('sheet')) return 'Excel';
                if (f.type?.includes('word') || f.type?.includes('document')) return 'Word';
                if (f.type?.startsWith('image/')) return 'Image';
                return 'Other';
              })).size}
            </p>
          </div>
        </div>

        {sortedDates.map((date) => (
          <div key={date} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Calendar size={16} className="text-gray-400" />
                {date}
                <span className="text-xs text-gray-400 ml-2">({groupedFiles[date].length} files)</span>
              </h4>
            </div>
            <div className="divide-y divide-gray-100">
              {groupedFiles[date].map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-gray-100 flex-shrink-0">
                      <FileText size={18} className="text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                        <span>{file.size}</span>
                        <span>•</span>
                        <span>{new Date(file.uploadDate).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => alert(`📥 Downloading: ${file.name}`)}
                      className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                    >
                      <Download size={16} />
                    </button>
                    <button 
                      onClick={() => deleteFile(file.id)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ============================================
  // RENDER UPLOAD MODAL
  // ============================================
  const renderUploadModal = () => {
    if (!showUploadModal) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowUploadModal(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <button 
            onClick={() => setShowUploadModal(false)}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>

          <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-5 rounded-t-2xl">
            <h2 className="text-2xl font-bold text-white">Upload Report Documents</h2>
            <p className="text-purple-100 text-sm">Upload reports, invoices, and other documents</p>
            <p className="text-purple-200 text-xs mt-1">{uploadedFiles.length} files uploaded</p>
          </div>

          <div className="p-6">
            {uploadMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                <CheckCircle size={16} /> {uploadMessage}
              </div>
            )}
            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {uploadError}
              </div>
            )}

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors relative">
              <Upload size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 font-medium">Drag & drop files here</p>
              <p className="text-xs text-gray-400 mt-1">or click to browse</p>
              <input 
                type="file" 
                multiple 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
              />
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">PDF</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">Excel</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">Word</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">CSV</span>
                <span className="text-xs bg-gray-100 px-2 py-1 rounded">Images</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Max file size: 10MB per file</p>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                <span>Uploaded Files ({uploadedFiles.length})</span>
                {uploadedFiles.length > 0 && (
                  <span className="text-xs text-gray-400">
                    Total: {uploadedFiles.reduce((sum, f) => sum + (parseFloat(f.size) || 0), 0).toFixed(0)} KB
                  </span>
                )}
              </h4>
              
              {uploadedFiles.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <FileText size={18} className="text-blue-500" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-400">{file.size} · {new Date(file.uploadDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => alert(`📥 Downloading: ${file.name}`)}
                          className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                        >
                          <Download size={16} />
                        </button>
                        <button onClick={() => deleteFile(file.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm border rounded-lg">
                  <FilePlus size={32} className="mx-auto text-gray-300 mb-2" />
                  <p>No files uploaded yet</p>
                  <p className="text-xs">Click the upload area above to add files</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200 mt-4">
              <button 
                onClick={() => setShowUploadModal(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER PREVIEW MODAL (keep as is - long)
  // ============================================
  const renderPreviewModal = () => {
    if (!showPreview || !selectedReport) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={() => setShowPreview(false)}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{selectedReport.label}</h2>
              <p className="text-blue-100 text-sm">{selectedReport.description}</p>
            </div>
            <button 
              onClick={() => setShowPreview(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} className="text-white" />
            </button>
          </div>

          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-gray-500" />
                <select 
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="this_week">This Week</option>
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="this_quarter">This Quarter</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              {dateRange === 'custom' && (
                <>
                  <input 
                    type="date" 
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <span className="text-gray-500">to</span>
                  <input 
                    type="date" 
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </>
              )}
              <select 
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
                <option value="word">Word</option>
              </select>
              <button 
                onClick={handleSaveReport}
                disabled={!reportData}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 flex items-center gap-1 disabled:opacity-50"
              >
                <Save size={14} /> Save
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-500">Generating report from your data...</p>
              </div>
            ) : reportData ? (
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Report Summary</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(reportData.summary).slice(0, 8).map(([key, value]) => (
                      <div key={key} className="bg-white p-3 rounded-lg">
                        <p className="text-xs text-gray-500 capitalize">{key.replace(/_/g, ' ')}</p>
                        <p className="text-lg font-bold">
                          {typeof value === 'number' ? 
                            (key.includes('revenue') || key.includes('cost') || key.includes('debt') || key.includes('profit') || key.includes('expense')) 
                              ? formatCurrency(value) 
                              : value.toLocaleString() 
                            : 'N/A'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {Array.isArray(reportData.data) && reportData.data.length > 0 ? (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-sm">Data Preview</h4>
                      <span className="text-xs text-gray-400">Showing {Math.min(10, reportData.data.length)} of {reportData.data.length} records</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {Object.keys(reportData.data[0]).slice(0, 5).map((key) => (
                              <th key={key} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {reportData.data.slice(0, 10).map((row, i) => (
                            <tr key={i} className="hover:bg-gray-50">
                              {Object.entries(row).slice(0, 5).map(([key, value]) => (
                                <td key={key} className="px-3 py-2 text-xs">
                                  {typeof value === 'object' ? JSON.stringify(value).slice(0, 30) : String(value || 'N/A').slice(0, 30)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                    <p>No data available for this report</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-gray-500">No report data available</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Export as:</span>
              <select 
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white"
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value)}
              >
                <option value="pdf">PDF</option>
                <option value="excel">Excel</option>
                <option value="csv">CSV</option>
                <option value="word">Word</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Close
              </button>
              <button 
                onClick={() => window.print()}
                className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              >
                <Printer size={16} /> Print
              </button>
              <button 
                onClick={handleExport}
                disabled={isGenerating || !reportData}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Download size={16} />
                {isGenerating ? 'Exporting...' : 'Export'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================
  // RENDER REPORTS VIEW
  // ============================================
  const renderReportsView = () => (
    <div>
      {savedReports.length > 0 && (
        <div className="mb-6">
          <h4 className="font-medium text-sm text-gray-700 mb-3 flex items-center gap-2">
            <Bookmark size={16} className="text-purple-500" />
            Saved Reports
            <span className="text-xs text-gray-400">({savedReports.length})</span>
          </h4>
          <div className="flex flex-wrap gap-2">
            {savedReports.slice(0, 5).map((report) => (
              <button
                key={report.id}
                onClick={() => {
                  const category = reportCategories.find(c => 
                    c.reports.some(r => r.id === report.reportId)
                  );
                  const reportDef = category?.reports.find(r => r.id === report.reportId);
                  if (reportDef) handleGenerateReport(reportDef);
                }}
                className="px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg text-sm hover:bg-purple-100 flex items-center gap-1"
              >
                <FileText size={12} />
                {report.label}
                <span className="text-xs text-purple-400 ml-1">
                  {new Date(report.date).toLocaleDateString()}
                </span>
              </button>
            ))}
            {savedReports.length > 5 && (
              <button className="px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100 rounded-lg">
                +{savedReports.length - 5} more
              </button>
            )}
          </div>
        </div>
      )}

      {filteredCategories.length > 0 ? (
        <div className="space-y-4">
          {filteredCategories.map((category) => (
            <div key={category.id}>
              <button 
                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => toggleSection(category.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg bg-${category.color}-50 ${getIconColor(category.color)}`}>
                    <category.icon size={16} />
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(category.label)}`}>
                    {category.label}
                  </span>
                  <span className="text-sm font-medium">{category.label}</span>
                  <span className="text-xs text-gray-400">({category.reports.length} reports)</span>
                </div>
                {expandedSection === category.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              
              {expandedSection === category.id && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2 pl-4">
                  {category.reports.map((report) => (
                    <button 
                      key={report.id}
                      onClick={() => handleGenerateReport(report)}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors text-left group border border-transparent hover:border-blue-200"
                    >
                      <div className={`p-2 rounded-lg bg-${report.color}-50 ${getIconColor(report.color)} group-hover:scale-110 transition-transform`}>
                        <report.icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{report.label}</p>
                        <p className="text-xs text-gray-500 truncate">{report.description}</p>
                      </div>
                      <Eye size={14} className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <p>No reports available</p>
          <p className="text-sm">Add data to see reports here</p>
        </div>
      )}
    </div>
  );

  // ============================================
  // MAIN RENDER
  // ============================================
  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith('travel_agency_')) {
        loadData();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-green-700 text-sm flex items-center gap-2">
          <CheckCircle size={16} /> {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle size={16} /> {errorMessage}
        </div>
      )}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold flex items-center gap-2">
              <BarChart3 size={24} className="text-blue-600" />
              Reports & Analytics
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {reportCategories.length} report categories · {reportCategories.reduce((sum, cat) => sum + cat.reports.length, 0)} available reports
              {uploadedFiles.length > 0 && ` · 📁 ${uploadedFiles.length} uploaded files`}
              {savedReports.length > 0 && ` · 💾 ${savedReports.length} saved reports`}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button 
              onClick={() => loadData()}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-600 transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px] hover:rotate-180 transition-transform duration-500" />
            </button>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="bg-purple-600 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm hover:bg-purple-700 flex items-center gap-1 sm:gap-2 whitespace-nowrap"
            >
              <Upload size={12} className="sm:w-4 sm:h-4" /> 
              <span className="text-[10px] sm:text-sm">Upload Docs</span>
              {uploadedFiles.length > 0 && <span className="text-[10px] sm:text-sm">({uploadedFiles.length})</span>}
            </button>
            <div className="relative">
              <Search size={14} className="sm:hidden absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <Search size={16} className="hidden sm:block absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-7 sm:pl-9 pr-2 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-24 sm:w-48 transition-all duration-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-4 border-b border-gray-200">
          <button
            onClick={() => setActiveView('reports')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeView === 'reports' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 size={16} className="inline mr-1" />
            Reports
          </button>
          <button
            onClick={() => setActiveView('documents')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeView === 'documents' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <FolderOpen size={16} className="inline mr-1" />
            Documents {uploadedFiles.length > 0 && `(${uploadedFiles.length})`}
          </button>
          <button
            onClick={() => setActiveView('saved')}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeView === 'saved' 
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Bookmark size={16} className="inline mr-1" />
            Saved {savedReports.length > 0 && `(${savedReports.length})`}
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6">
        {activeView === 'reports' && renderReportsView()}
        {activeView === 'documents' && renderDocumentsView()}
        {activeView === 'saved' && (
          <div>
            {savedReports.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {savedReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                    <div>
                      <p className="font-medium text-sm">{report.label}</p>
                      <p className="text-xs text-gray-500">
                        Saved: {new Date(report.date).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const category = reportCategories.find(c => 
                            c.reports.some(r => r.id === report.reportId)
                          );
                          const reportDef = category?.reports.find(r => r.id === report.reportId);
                          if (reportDef) handleGenerateReport(reportDef);
                        }}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => {
                          const updated = savedReports.filter(r => r.id !== report.id);
                          setSavedReports(updated);
                          localStorage.setItem('travel_agency_saved_reports', JSON.stringify(updated));
                          setSuccessMessage('🗑️ Report deleted');
                          setTimeout(() => setSuccessMessage(''), 3000);
                        }}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bookmark size={48} className="mx-auto text-gray-300 mb-3" />
                <p>No saved reports</p>
                <p className="text-sm">Generate and save reports to see them here</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {activeView === 'reports' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalRevenue)}</p>
            <p className="text-xs text-gray-400">{summary.totalBookings} bookings</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500">Total Expenses</p>
            <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalExpenses)}</p>
            <p className="text-xs text-gray-400">All service costs</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500">Net Profit</p>
            <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netProfit)}
            </p>
            <p className="text-xs text-gray-400">{summary.netProfit >= 0 ? 'Profit' : 'Loss'}</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <p className="text-xs text-gray-500">Active Vehicles</p>
            <p className="text-2xl font-bold text-blue-600">{summary.activeVehicles}</p>
            <p className="text-xs text-gray-400">{summary.totalVehicles} total</p>
          </div>
        </div>
      )}

      {renderUploadModal()}
      {renderPreviewModal()}
    </div>
  );
};

export default Reports;