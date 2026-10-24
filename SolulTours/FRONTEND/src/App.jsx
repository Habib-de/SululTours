import React, { useState, useEffect } from 'react';
import { useAuth, roles } from './context/AuthContext';
import { AuthProvider } from './context/AuthContext';
import { TenantConfigProvider } from './context/TenantConfigContext';
// import { TripProvider } from './context/TripContext';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import GuestBooking from './pages/GuestBooking';
import ResetPassword from './pages/ResetPassword';


// ============================================
// SUPER ADMIN PAGES
// ============================================
import AdminDashboard from './pages/admin/AdminDashboard';
import Tenants from './pages/admin/Tenants';
import SystemHealth from './pages/admin/SystemHealth';
import AuditLog from './pages/admin/AuditLog';
import PlatformAnalytics from './pages/admin/PlatformAnalytics';
import UsersManagement from './pages/admin/UsersManagement';
import ServiceManagement from './pages/admin/ServiceManagement';
import AllBookings from './pages/admin/AllBookings';

// ============================================
// FLEET MANAGER PAGES (Manages ALL services)
// ============================================
import FleetManagerDashboard from './pages/fleet-manager/FleetManagerDashboard';

// Car Hire Management
import Vehicles from './pages/fleet-manager/Vehicles';
import CarOwners from './pages/fleet-manager/CarOwners';
import Maintenance from './pages/fleet-manager/Maintenance';
import CarBookings from './pages/fleet-manager/CarBookings';
import CarBookingCRM from './pages/fleet-manager/CarBookingCRM';
import Brokers from './pages/fleet-manager/Brokers';

// Tours Management
import TourPackages from './pages/fleet-manager/TourPackages';
import TourBookings from './pages/fleet-manager/TourBookings';
import TourGuides from './pages/fleet-manager/TourGuides';

// Hajj & Umra Management
import HajjPackages from './pages/fleet-manager/HajjPackages';
import HajjBookings from './pages/fleet-manager/HajjBookings';
import VisaProcessing from './pages/fleet-manager/VisaProcessing';

// Hotel Management (Fleet Manager)
import FleetHotels from './pages/fleet-manager/Hotels';
import FleetHotelBookings from './pages/fleet-manager/HotelBookings';
import FleetRoomTypes from './pages/fleet-manager/RoomTypes';

// Flight Management (Fleet Manager)
import FleetFlights from './pages/fleet-manager/Flights';
import FleetFlightBookings from './pages/fleet-manager/FlightBookings';
import FleetAirlines from './pages/fleet-manager/Airlines';

// Travel Consultancy (Fleet Manager)
// import ConsultancyRequests from './pages/fleet-manager/ConsultancyRequests';

// ============================================
// SHARED PAGES (Fleet Manager & Car Owner)
// ============================================
import Expenses from './pages/shared/Expenses';
import Compliance from './pages/shared/Compliance';
import Reports from './pages/shared/Reports';

// ============================================
// CAR OWNER PAGES
// ============================================
import CarOwnerDashboard from './pages/car-owner/CarOwnerDashboard';
import MyVehicles from './pages/car-owner/MyVehicles';
import VehicleBookings from './pages/car-owner/VehicleBookings';
import Revenue from './pages/car-owner/Revenue';
import VehicleIssues from './pages/car-owner/VehicleIssues';
import MaintenanceStatus from './pages/car-owner/MaintenanceStatus';

// ============================================
// CLIENT PAGES
// ============================================
import ClientDashboard from './pages/client/ClientDashboard';
import ClientCarHire from './pages/client/CarHire';
import ClientTours from './pages/client/Tours';
import ClientHajjUmra from './pages/client/HajjUmra';
import ClientHotels from './pages/client/Hotels';
import ClientFlights from './pages/client/Flights';
// import ClientTravelConsultancy from './pages/client/TravelConsultancy';
import ClientMyBookings from './pages/client/MyBookings';
import ClientProfile from './pages/client/ClientProfile';

// ============================================
// BROKER PAGES
// ============================================
import BrokerDashboard from './pages/broker/BrokerDashboard';
import BrokerCarBookings from './pages/broker/BrokerCarBookings'; 

// ============================================
// NOTIFICATIONS PAGE (ALL ROLES)
// ============================================
import NotificationsPage from './pages/NotificationsPage';


// ============================================
// ICONS
// ============================================
import { 
  LayoutDashboard, Truck, Wrench, 
  Users, Server, FileText, BarChart3,
  Calendar, Car, User, DollarSign, 
  Compass, Building, Plane, Map,
  AlertTriangle, CheckCircle, Clock,
  Phone, Mail, Globe, Star, Settings,
  CreditCard, Shield, Award, Headphones,
  Hotel, Ticket, Package, HelpCircle,
  ClipboardCheck, Wallet, Receipt, Bell  
} from 'lucide-react';

// ============================================
// NAVIGATION ITEMS CONFIGURATION
// ============================================
const getNavItems = (role) => {
  const commonItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ];

  const roleSpecificItems = {
    // ========== SUPER ADMIN ==========
    [roles.SUPER_ADMIN]: [
      ...commonItems,
      { id: 'users', label: 'Users', icon: Users },
      { id: 'services', label: 'Services', icon: Server },
      { id: 'all-bookings', label: 'All Bookings', icon: Calendar },
      { id: 'analytics', label: 'Analytics', icon: BarChart3 },
      { id: 'system', label: 'System Health', icon: Server },
      { id: 'audit', label: 'Audit Log', icon: FileText },
      { id: 'tenants', label: 'Tenants', icon: Building },
    ],

    // ========== FLEET MANAGER (Manages ALL services) ==========
    [roles.FLEET_MANAGER]: [
      ...commonItems,
      
      // Car Hire
      { id: 'vehicles', label: 'Vehicles', icon: Car },
      { id: 'car-owners', label: 'Car Owners', icon: User },
      { id: 'brokers', label: 'Brokers', icon: Users },
      { id: 'maintenance', label: 'Maintenance', icon: Wrench },
      { id: 'car-bookings', label: 'Car Bookings', icon: Calendar },
      { id: 'car-crm', label: 'Customer CRM', icon: Users },
      
      // Tours & Travel
      { id: 'tour-packages', label: 'Tour Packages', icon: Compass },
      { id: 'tour-bookings', label: 'Tour Bookings', icon: Calendar },
      { id: 'tour-guides', label: 'Tour Guides', icon: Users },
      
      // Hajj & Umra
      { id: 'hajj-packages', label: 'Hajj Packages', icon: Map },
      { id: 'hajj-bookings', label: 'Hajj Bookings', icon: Calendar },
      { id: 'visa-processing', label: 'Visa Processing', icon: FileText },
      
      // Hotels
      { id: 'fleet-hotels', label: 'Hotels', icon: Building },
      { id: 'fleet-hotel-bookings', label: 'Hotel Bookings', icon: Calendar },
      { id: 'fleet-room-types', label: 'Room Types', icon: LayoutDashboard },
      
      // Flights
      { id: 'fleet-flights', label: 'Flights', icon: Plane },
      { id: 'fleet-flight-bookings', label: 'Flight Bookings', icon: Calendar },
      { id: 'fleet-airlines', label: 'Airlines', icon: Globe },
      
      // Travel Consultancy
      // { id: 'consultancy', label: 'Consultancy Requests', icon: Headphones },
      
      // ✅ SHARED PAGES (Fleet Manager)
      { id: 'expenses', label: 'Expenses', icon: Receipt },
      { id: 'compliance', label: 'Compliance', icon: ClipboardCheck },
      { id: 'reports', label: 'Reports', icon: FileText },
    ],

    // ========== CAR OWNER (Simplified - only their vehicles) ==========
    [roles.CAR_OWNER]: [
      ...commonItems,
      { id: 'my-vehicles', label: 'My Vehicles', icon: Car },
      { id: 'vehicle-bookings', label: 'Vehicle Bookings', icon: Calendar },
      { id: 'revenue', label: 'Revenue', icon: DollarSign },
      // { id: 'issues', label: 'Issues', icon: AlertTriangle },
      { id: 'maintenance-status', label: 'Maintenance Status', icon: Wrench },
      // ✅ SHARED PAGES (Car Owner - limited view)
      { id: 'expenses', label: 'Expenses', icon: Receipt },
      { id: 'compliance', label: 'Compliance', icon: ClipboardCheck },
      // { id: 'reports', label: 'Reports', icon: FileText },
    ],

    // ========== BROKER (Sales Agent) ==========
       [roles.BROKER]: [
      ...commonItems,
      { id: 'car-bookings', label: 'Car Hire Bookings', icon: Car },
      // ⏳ Hidden until broker-specific pages are built:
      // { id: 'tour-bookings', label: 'Tour Bookings', icon: Compass },
      // { id: 'hajj-bookings', label: 'Hajj/Umra Bookings', icon: Map },
      // { id: 'hotel-bookings', label: 'Hotel Bookings', icon: Building },
      // { id: 'flight-bookings', label: 'Flight Bookings', icon: Plane },
    ],


    // ========== CLIENT ==========
    [roles.CLIENT]: [
      ...commonItems,
      // Car Hire
      { id: 'client-car-hire', label: 'Car Hire', icon: Car },
      // Tours & Travel
      { id: 'client-tours', label: 'Tours & Travel', icon: Compass },
      // Hajj & Umra
      { id: 'client-hajj-umra', label: 'Hajj & Umra', icon: Map },
      // Hotels
      { id: 'client-hotels', label: 'Hotels', icon: Building },
      // Flights
      { id: 'client-flights', label: 'Flights', icon: Plane },
      // Air Travel Consultancy
      // { id: 'client-consultancy', label: 'Travel Consultancy', icon: Headphones },
      // My Stuff
      { id: 'client-my-bookings', label: 'My Bookings', icon: Calendar },
      { id: 'client-profile', label: 'My Profile', icon: User },
    ]
  };

  return roleSpecificItems[role] || roleSpecificItems[roles.CLIENT];
};

// ============================================
// PAGE RENDERER
// ============================================
const PageRenderer = ({ tab, role, setActiveTab }) => {
  // ========== SUPER ADMIN PAGES ==========
  if (role === roles.SUPER_ADMIN) {
    const adminPages = {
      dashboard: <AdminDashboard setActiveTab={setActiveTab} />,
      tenants: <Tenants setActiveTab={setActiveTab} />,
      system: <SystemHealth setActiveTab={setActiveTab} />,
      audit: <AuditLog setActiveTab={setActiveTab} />,
      analytics: <PlatformAnalytics setActiveTab={setActiveTab} />,
      'users': <UsersManagement setActiveTab={setActiveTab} />,
      services: <ServiceManagement setActiveTab={setActiveTab} />,
      'all-bookings': <AllBookings setActiveTab={setActiveTab} />,
      notifications: <NotificationsPage setActiveTab={setActiveTab} />,
    };
    return adminPages[tab] || <AdminDashboard setActiveTab={setActiveTab} />;
  }

  // ========== FLEET MANAGER PAGES (All Services) ==========
  if (role === roles.FLEET_MANAGER) {
    const fleetPages = {
      // Dashboard
      dashboard: <FleetManagerDashboard setActiveTab={setActiveTab} />,
      
      // Car Hire
      vehicles: <Vehicles setActiveTab={setActiveTab} />,
      'car-owners': <CarOwners setActiveTab={setActiveTab} />,
       brokers: <Brokers setActiveTab={setActiveTab} />,
      maintenance: <Maintenance setActiveTab={setActiveTab} />,
      'car-bookings': <CarBookings setActiveTab={setActiveTab} />,
      'car-crm': <CarBookingCRM setActiveTab={setActiveTab} />,
      
      // Tours
      'tour-packages': <TourPackages setActiveTab={setActiveTab} />,
      'tour-bookings': <TourBookings setActiveTab={setActiveTab} />,
      'tour-guides': <TourGuides setActiveTab={setActiveTab} />,
      
      // Hajj & Umra
      'hajj-packages': <HajjPackages setActiveTab={setActiveTab} />,
      'hajj-bookings': <HajjBookings setActiveTab={setActiveTab} />,
      'visa-processing': <VisaProcessing setActiveTab={setActiveTab} />,
      
      // Hotels (Fleet Manager)
      'fleet-hotels': <FleetHotels setActiveTab={setActiveTab} />,
      'fleet-hotel-bookings': <FleetHotelBookings setActiveTab={setActiveTab} />,
      'fleet-room-types': <FleetRoomTypes setActiveTab={setActiveTab} />,
      
      // Flights (Fleet Manager)
      'fleet-flights': <FleetFlights setActiveTab={setActiveTab} />,
      'fleet-flight-bookings': <FleetFlightBookings setActiveTab={setActiveTab} />,
      'fleet-airlines': <FleetAirlines setActiveTab={setActiveTab} />,
      
      // Consultancy
      // consultancy: <ConsultancyRequests setActiveTab={setActiveTab} />,
      
      // ✅ SHARED PAGES (Fleet Manager)
      expenses: <Expenses setActiveTab={setActiveTab} />,
      compliance: <Compliance setActiveTab={setActiveTab} />,
      reports: <Reports setActiveTab={setActiveTab} />,
      notifications: <NotificationsPage setActiveTab={setActiveTab} />, 
    };
    return fleetPages[tab] || <FleetManagerDashboard setActiveTab={setActiveTab} />;
  }

  // ========== CAR OWNER PAGES ==========
  if (role === roles.CAR_OWNER) {
    const ownerPages = {
      dashboard: <CarOwnerDashboard setActiveTab={setActiveTab} />,
      'my-vehicles': <MyVehicles setActiveTab={setActiveTab} />,
      'vehicle-bookings': <VehicleBookings setActiveTab={setActiveTab} />,
      revenue: <Revenue setActiveTab={setActiveTab} />,
      // issues: <VehicleIssues setActiveTab={setActiveTab} />,
      'maintenance-status': <MaintenanceStatus setActiveTab={setActiveTab} />,
      // ✅ SHARED PAGES (Car Owner)
      expenses: <Expenses setActiveTab={setActiveTab} />,
      compliance: <Compliance setActiveTab={setActiveTab} />,
      notifications: <NotificationsPage setActiveTab={setActiveTab} />, 
      // reports: <Reports setActiveTab={setActiveTab} />,
    };
    return ownerPages[tab] || <CarOwnerDashboard setActiveTab={setActiveTab} />;
  }

  // ========== BROKER PAGES ==========
    if (role === roles.BROKER) {
    const brokerPages = {
      dashboard: <BrokerDashboard setActiveTab={setActiveTab} />,
      'car-bookings': <BrokerCarBookings setActiveTab={setActiveTab} />,   // ✅ broker-specific
      // ⏳ Other service booking pages — hidden for now
      // 'tour-bookings': <BrokerTourBookings setActiveTab={setActiveTab} />,
      // 'hajj-bookings': <BrokerHajjBookings setActiveTab={setActiveTab} />,
      // 'hotel-bookings': <BrokerHotelBookings setActiveTab={setActiveTab} />,
      // 'flight-bookings': <BrokerFlightBookings setActiveTab={setActiveTab} />,
      notifications: <NotificationsPage setActiveTab={setActiveTab} />,
    };
    return brokerPages[tab] || <BrokerDashboard setActiveTab={setActiveTab} />;
  }

  // ========== CLIENT PAGES ==========
  if (role === roles.CLIENT) {
    const clientPages = {
      dashboard: <ClientDashboard setActiveTab={setActiveTab} />,
      'client-car-hire': <ClientCarHire setActiveTab={setActiveTab} />,
      'client-tours': <ClientTours setActiveTab={setActiveTab} />,
      'client-hajj-umra': <ClientHajjUmra setActiveTab={setActiveTab} />,
      'client-hotels': <ClientHotels setActiveTab={setActiveTab} />,
      'client-flights': <ClientFlights setActiveTab={setActiveTab} />,
      // 'client-consultancy': <ClientTravelConsultancy setActiveTab={setActiveTab} />,
      'client-my-bookings': <ClientMyBookings setActiveTab={setActiveTab} />,
      'client-profile': <ClientProfile setActiveTab={setActiveTab} />,
      notifications: <NotificationsPage setActiveTab={setActiveTab} />,
    };
    return clientPages[tab] || <ClientDashboard setActiveTab={setActiveTab} />;
  }

  // Default fallback
  return <ClientDashboard setActiveTab={setActiveTab} />;
};

// ============================================
// MAIN APP CONTENT
// ============================================
const AppContent = ({ onLogout, userRole }) => {
  const { currentUser, switchRole } = useAuth();
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('travel_agency_active_tab');
    return savedTab || 'dashboard';
  });

  // Save active tab to localStorage
  useEffect(() => {
    localStorage.setItem('travel_agency_active_tab', activeTab);
  }, [activeTab]);

  // Listen for navigation messages
  useEffect(() => {
    const handleMessage = (event) => {
      console.log('📨 Message received in AppContent:', event.data);
      
      if (event.data && event.data.type === 'navigate') {
        console.log('🚗 Navigating to tab:', event.data.tab);
        
        if (event.data.tab) {
          setActiveTab(event.data.tab);
          console.log('✅ Tab changed to:', event.data.tab);
        }
        
        if (event.data.vehicle) {
          localStorage.setItem('selected_vehicle', event.data.vehicle);
          console.log('💾 Stored vehicle in localStorage:', event.data.vehicle);
        }
      }
    };

    const handleCustomEvent = (event) => {
      console.log('📨 Custom event received:', event.detail);
      if (event.detail && event.detail.tab) {
        setActiveTab(event.detail.tab);
        if (event.detail.vehicle) {
          localStorage.setItem('selected_vehicle', event.detail.vehicle);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('navigateTo', handleCustomEvent);
    window.setActiveTab = setActiveTab;
    
    console.log('✅ Message listeners added');
    console.log('✅ window.setActiveTab is available');
    
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('navigateTo', handleCustomEvent);
      delete window.setActiveTab;
    };
  }, []);

  // Update user role when login happens or on refresh
  useEffect(() => {
    if (userRole && currentUser?.role !== userRole) {
      switchRole(userRole);
    }
  }, [userRole]);

  // Get navigation items based on role
  const navItems = getNavItems(currentUser?.role || roles.CLIENT);

  console.log('🔍 AppContent - currentUser:', currentUser);
  console.log('🔍 AppContent - userRole:', userRole);

  return (
    <MainLayout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      navItems={navItems}
      onLogout={onLogout}
      userRole={userRole}
    >
      <PageRenderer 
        tab={activeTab} 
        role={currentUser?.role || roles.CLIENT} 
        setActiveTab={setActiveTab} 
      />
    </MainLayout>
  );
};

// ============================================
// MAIN APP COMPONENT - FIXED VERSION
// ============================================
const App = () => {
  // ✅ Check for reset page
  const urlParams = new URLSearchParams(window.location.search);
  const resetToken = urlParams.get('token');
  const isResetPage = window.location.pathname.includes('reset-password') && resetToken;

  // ✅ ALL useState hooks MUST be called before conditional return
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    // If on reset page, clear auth and return false
    if (isResetPage) {
      localStorage.clear();
      return false;
    }
    
    const saved = localStorage.getItem('travel_agency_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const isValid = typeof parsed === 'object' && parsed !== null && parsed.id;
        console.log('🔍 App init - isAuthenticated:', isValid, parsed);
        return isValid;
      } catch {
        return false;
      }
    }
    return false;
  });

  const [userData, setUserData] = useState(() => {
    if (isResetPage) return null;
    
    const saved = localStorage.getItem('travel_agency_auth');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return parsed;
        }
      } catch {
        return null;
      }
    }
    return null;
  });

  const [userRole, setUserRole] = useState(() => {
    if (isResetPage) return null;
    const saved = localStorage.getItem('travel_agency_role');
    return saved || null;
  });

  const [authScreen, setAuthScreen] = useState(() => {
    if (isResetPage) return 'reset-password';
    return 'login';
  });

  // ✅ Conditional return AFTER all hooks (FIXED: moved here)
  if (isResetPage) {
    return (
      <TenantConfigProvider>
        <AuthProvider>
          <ResetPassword onNavigate={() => window.location.href = '/login'} />
        </AuthProvider>
      </TenantConfigProvider>
    );
  }

  // ✅ Rest of your code (unchanged)
  const handleLogin = (userData) => {
    console.log('✅ App.handleLogin called with:', userData);
    setUserData(userData);
    setUserRole(userData.role);
    setIsAuthenticated(true);
    localStorage.setItem('travel_agency_auth', JSON.stringify(userData));
    localStorage.setItem('travel_agency_role', userData.role);
    setAuthScreen('login');
  };

  const handleLogout = async () => {
    console.log('✅ App.handleLogout called');
    
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('https://sulultours.com/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('✅ Logout API response:', response.status);
      } else {
        console.warn('⚠️ No token found for logout');
      }
    } catch (error) {
      console.error('❌ Logout API error:', error);
    }
    
    setUserData(null);
    setUserRole(null);
    setIsAuthenticated(false);
    localStorage.removeItem('travel_agency_auth');
    localStorage.removeItem('travel_agency_user');
    localStorage.removeItem('travel_agency_role');
    localStorage.removeItem('travel_agency_active_tab');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    setAuthScreen('login');
  };

  const handleNavigate = (screen) => {
    setAuthScreen(screen);
  };

  console.log('🔍 App state:', { isAuthenticated, userData, userRole, authScreen });

  // Show auth screens if not authenticated
  if (!isAuthenticated) {
    switch (authScreen) {
      case 'register':
        return <Register onNavigate={handleNavigate} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={handleNavigate} />;
      case 'reset-password':
        return <ResetPassword onNavigate={handleNavigate} />;
      case 'guest-booking':
        return <GuestBooking onNavigate={handleNavigate} />;
      case 'login':
      default:
        return <Login onLogin={handleLogin} onNavigate={handleNavigate} />;
    }
  }

  return (
    <TenantConfigProvider>
      <AuthProvider>
        <AppContent onLogout={handleLogout} userRole={userRole} />
      </AuthProvider>
    </TenantConfigProvider>
  );
};

export default App;