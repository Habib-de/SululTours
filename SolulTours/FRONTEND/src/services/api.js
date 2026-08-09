// src/services/api.js

// ============================================
// DYNAMIC API BASE URL - WORKS ON PHONE & COMPUTER
// ============================================
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:8080/api`;
  }
  
  return 'http://localhost:8080/api';
};

const API_BASE_URL = getApiBaseUrl();

// Helper: get token from localStorage
const getToken = () => localStorage.getItem('token');

// Helper function for API calls — token auto-attached
const apiCall = async (endpoint, method = 'GET', data = null, customToken = null) => {
  const token = customToken || getToken();
  
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (data) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    const text = await response.text();
    
    if (!text || text.trim() === '') {
      throw new Error('Server returned empty response');
    }
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('Invalid JSON response:', text);
      throw new Error(`Server returned invalid response: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
  let errorMessage = result?.message || result?.error || `Request failed with status ${response.status}`;
  throw new Error(errorMessage);
}

    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ============================================
// MULTIPART API CALL (for file uploads)
// ============================================
const apiCallMultipart = async (endpoint, method = 'POST', formData, customToken = null) => {
  const token = customToken || getToken();
  
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
    body: formData
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    const text = await response.text();
    
    if (!text || text.trim() === '') {
      throw new Error('Server returned empty response');
    }
    
    let result;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('Invalid JSON response:', text);
      throw new Error(`Server returned invalid response: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
  let errorMessage = result?.message || result?.error || `Request failed with status ${response.status}`;
  throw new Error(errorMessage);
}

    return result;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ============================================
// AUTH SERVICES
// ============================================

export const authService = {
  login: async (email, password) => {
    const response = await apiCall('/auth/login', 'POST', { email, password });
    return response;
  },

  register: async (userData) => {
    const response = await apiCall('/auth/register', 'POST', userData);
    return response;
  },

  forgotPassword: async (email) => {
    const response = await apiCall('/auth/forgot-password', 'POST', { email });
    return response;
  },

  resetPassword: async (token, newPassword) => {
    const response = await apiCall('/auth/reset-password', 'POST', { token, newPassword });
    return response;
  },

  validateToken: async (token) => {
    const response = await apiCall('/auth/validate', 'GET', null, token);
    return response;
  },

  getCurrentUser: async () => {
    const response = await apiCall('/auth/me', 'GET');
    return response;
  },

  logout: async () => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      await apiCall('/auth/logout', 'POST');
      console.log('✅ Logout API called from authService');
    }
  } catch (error) {
    console.error('❌ Logout API error:', error);
  }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
},
};

// ============================================
// TENANT SERVICES
// ============================================

export const tenantService = {
  create: async (tenantData) => {
    const response = await apiCall('/tenants', 'POST', tenantData);
    return response;
  },

  getAll: async () => {
    const response = await apiCall('/tenants', 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/tenants/${id}`, 'GET');
    return response;
  },

  getBySubdomain: async (subdomain) => {
    const response = await apiCall(`/tenants/subdomain/${subdomain}`, 'GET');
    return response;
  },

  update: async (id, tenantData) => {
    const response = await apiCall(`/tenants/${id}`, 'PUT', tenantData);
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/tenants/${id}`, 'DELETE');
    return response;
  },

  getLocation: async (id) => {
    const response = await apiCall(`/tenants/${id}/location`, 'GET');
    return response;
  },
  
  updateLocation: async (id, locationData) => {
    const response = await apiCall(`/tenants/${id}/location`, 'PUT', locationData);
    return response;
  },

  getLocations: async (tenantId) => {
    const response = await apiCall(`/tenants/${tenantId}/locations`, 'GET');
    return response;
  },

  addLocation: async (tenantId, locationData) => {
    const response = await apiCall(`/tenants/${tenantId}/locations`, 'POST', locationData);
    return response;
  },

  updateLocationById: async (tenantId, locationId, locationData) => {
    const response = await apiCall(`/tenants/${tenantId}/locations/${locationId}`, 'PUT', locationData);
    return response;
  },

  deleteLocation: async (tenantId, locationId) => {
    const response = await apiCall(`/tenants/${tenantId}/locations/${locationId}`, 'DELETE');
    return response;
  },
};

// ============================================
// USER SERVICES
// ============================================

export const userService = {
  getAll: async () => {
    const response = await apiCall('/users', 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/users/${id}`, 'GET');
    return response;
  },

  getByTenant: async (tenantId) => {
    const response = await apiCall(`/users/tenant/${tenantId}`, 'GET');
    return response;
  },

  getByEmail: async (email) => {
    const response = await apiCall(`/users/email/${email}`, 'GET');
    return response;
  },

  create: async (userData) => {
    const response = await apiCall('/users', 'POST', userData);
    return response;
  },

  update: async (id, userData) => {
    const response = await apiCall(`/users/${id}`, 'PUT', userData);
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/users/${id}`, 'DELETE');
    return response;
  },

  changePassword: async (id, newPassword) => {
    const response = await apiCall(`/users/${id}/change-password?newPassword=${newPassword}`, 'PUT');
    return response;
  },

  uploadAvatar: async (userId, formData) => {
    const response = await apiCallMultipart(`/users/${userId}/avatar`, 'POST', formData);
    return response;
  },
};

// ============================================
// VEHICLE SERVICES
// ============================================

export const vehicleService = {
  getAll: async (tenantId) => {
    const response = await apiCall(`/vehicles/tenant/${tenantId}`, 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/vehicles/${id}`, 'GET');
    return response;
  },

  getByRegistration: async (registration) => {
    const response = await apiCall(`/vehicles/registration/${registration}`, 'GET');
    return response;
  },

  getByTenantAndStatus: async (tenantId, status) => {
    const response = await apiCall(`/vehicles/tenant/${tenantId}/status/${status}`, 'GET');
    return response;
  },

  getByOwner: async (ownerId) => {
    const response = await apiCall(`/vehicles/owner/${ownerId}`, 'GET');
    return response;
  },

  create: async (vehicleData) => {
    const response = await apiCall('/vehicles', 'POST', vehicleData);
    return response;
  },

  update: async (id, vehicleData) => {
    const response = await apiCall(`/vehicles/${id}`, 'PUT', vehicleData);
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/vehicles/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// CAR OWNER SERVICES
// ============================================

export const carOwnerService = {
  getAll: async (tenantId) => {
    const response = await apiCall(`/car-owners/tenant/${tenantId}`, 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/car-owners/${id}`, 'GET');
    return response;
  },

  getByUser: async (userId) => {
    const response = await apiCall(`/car-owners/user/${userId}`, 'GET');
    return response;
  },

  getByStatus: async (status) => {
    const response = await apiCall(`/car-owners/status/${status}`, 'GET');
    return response;
  },

  create: async (ownerData) => {
    const response = await apiCall('/car-owners', 'POST', ownerData);
    return response;
  },

  update: async (id, ownerData) => {
    const response = await apiCall(`/car-owners/${id}`, 'PUT', ownerData);
    return response;
  },

  approve: async (id) => {
    const response = await apiCall(`/car-owners/${id}/approve`, 'PATCH');
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/car-owners/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// BOOKING SERVICES
// ============================================

export const bookingService = {
   getAllPublic: async () => {
    const response = await apiCall('/bookings', 'GET');
    return response;
  },
  
  getAll: async (tenantId) => {
    const response = await apiCall(`/bookings/tenant/${tenantId}`, 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/bookings/${id}`, 'GET');
    return response;
  },

  getByReference: async (reference) => {
    const response = await apiCall(`/bookings/reference/${reference}`, 'GET');
    return response;
  },

  getByUser: async (userId) => {
    const response = await apiCall(`/bookings/user/${userId}`, 'GET');
    return response;
  },

  getByServiceType: async (serviceType) => {
    const response = await apiCall(`/bookings/service/${serviceType}`, 'GET');
    return response;
  },

  getByStatus: async (status) => {
    const response = await apiCall(`/bookings/status/${status}`, 'GET');
    return response;
  },

  create: async (bookingData) => {
    const response = await apiCall('/bookings', 'POST', bookingData);
    return response;
  },

  update: async (id, bookingData) => {
    const response = await apiCall(`/bookings/${id}`, 'PUT', bookingData);
    return response;
  },

  updateStatus: async (id, status) => {
    const response = await apiCall(`/bookings/${id}/status?status=${status}`, 'PATCH');
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/bookings/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// GUEST BOOKING SERVICES (PUBLIC - No auth required)
// ============================================

export const guestBookingService = {
  // ✅ Create a guest booking (PUBLIC endpoint)
  create: async (bookingData) => {
    const response = await apiCall('/bookings/public', 'POST', bookingData);
    return response;
  },

  // ✅ Get booking by reference (PUBLIC - for tracking)
  getByReference: async (reference) => {
    const response = await apiCall(`/bookings/reference/${reference}`, 'GET');
    return response;
  },
};

// ============================================
// PUBLIC DATA FETCHING SERVICES (For Guest Booking)
// ============================================

export const publicDataService = {
  // ✅ Get all active vehicles (PUBLIC)
  getVehicles: async () => {
    try {
      const response = await apiCall('/vehicles', 'GET');
      return response.data || [];
    } catch (error) {
      console.warn('⚠️ Failed to fetch vehicles:', error.message);
      // Fallback to localStorage
      return JSON.parse(localStorage.getItem('travel_agency_vehicles') || '[]');
    }
  },

  // ✅ Get all active tour packages (PUBLIC)
  getTourPackages: async () => {
    try {
      const response = await apiCall('/tour-packages', 'GET');
      return response.data || [];
    } catch (error) {
      console.warn('⚠️ Failed to fetch tour packages:', error.message);
      return JSON.parse(localStorage.getItem('travel_agency_tour_packages') || '[]');
    }
  },

  // ✅ Get all active hajj packages (PUBLIC)
  getHajjPackages: async () => {
    try {
      const response = await apiCall('/hajj-packages', 'GET');
      return response.data || [];
    } catch (error) {
      console.warn('⚠️ Failed to fetch hajj packages:', error.message);
      return JSON.parse(localStorage.getItem('travel_agency_hajj_packages') || '[]');
    }
  },

  // ✅ Get all active hotels (PUBLIC)
  getHotels: async () => {
    try {
      const response = await apiCall('/hotels', 'GET');
      return response.data || [];
    } catch (error) {
      console.warn('⚠️ Failed to fetch hotels:', error.message);
      return JSON.parse(localStorage.getItem('travel_agency_hotels') || '[]');
    }
  },

  // ✅ Get all active room types (PUBLIC)
  getRoomTypes: async () => {
    try {
      const response = await apiCall('/room-types', 'GET');
      return response.data || [];
    } catch (error) {
      console.warn('⚠️ Failed to fetch room types:', error.message);
      return JSON.parse(localStorage.getItem('travel_agency_room_types') || '[]');
    }
  },

  // ✅ Get all active flights (PUBLIC)
  getFlights: async () => {
    try {
      const response = await apiCall('/flights', 'GET');
      return response.data || [];
    } catch (error) {
      console.warn('⚠️ Failed to fetch flights:', error.message);
      return JSON.parse(localStorage.getItem('travel_agency_flights') || '[]');
    }
  },

  // ✅ Get all car owners (PUBLIC)
  getCarOwners: async () => {
    try {
      const response = await apiCall('/car-owners', 'GET');
      return response.data || [];
    } catch (error) {
      console.warn('⚠️ Failed to fetch car owners:', error.message);
      return JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
    }
  },

  // ✅ Get all bookings (for availability check - PUBLIC)
  getBookings: async () => {
    try {
      const response = await apiCall('/bookings', 'GET');
      return response.data || [];
    } catch (error) {
      console.warn('⚠️ Failed to fetch bookings:', error.message);
      return JSON.parse(localStorage.getItem('travel_agency_bookings') || '[]');
    }
  },
};

// ============================================
// TOUR PACKAGE SERVICES
// ============================================

export const tourPackageService = {
  getAll: async (tenantId) => {
    const response = await apiCall(`/tour-packages/tenant/${tenantId}`, 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/tour-packages/${id}`, 'GET');
    return response;
  },

  getByTenantAndStatus: async (tenantId, status) => {
    const response = await apiCall(`/tour-packages/tenant/${tenantId}/status/${status}`, 'GET');
    return response;
  },

  getByCategory: async (category) => {
    const response = await apiCall(`/tour-packages/category/${category}`, 'GET');
    return response;
  },

  create: async (packageData) => {
    const response = await apiCall('/tour-packages', 'POST', packageData);
    return response;
  },

  update: async (id, packageData) => {
    const response = await apiCall(`/tour-packages/${id}`, 'PUT', packageData);
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/tour-packages/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// TOUR GUIDE SERVICES
// ============================================

export const tourGuideService = {
  getAll: async (tenantId) => {
    const response = await apiCall(`/tour-guides/tenant/${tenantId}`, 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/tour-guides/${id}`, 'GET');
    return response;
  },

  getByTenantAndStatus: async (tenantId, status) => {
    const response = await apiCall(`/tour-guides/tenant/${tenantId}/status/${status}`, 'GET');
    return response;
  },

  getByAvailability: async (availability) => {
    const response = await apiCall(`/tour-guides/availability/${availability}`, 'GET');
    return response;
  },

  create: async (guideData) => {
    const response = await apiCall('/tour-guides', 'POST', guideData);
    return response;
  },

  update: async (id, guideData) => {
    const response = await apiCall(`/tour-guides/${id}`, 'PUT', guideData);
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/tour-guides/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// HAJJ PACKAGE SERVICES
// ============================================

export const hajjPackageService = {
  getAll: async (tenantId) => {
    const response = await apiCall(`/hajj-packages/tenant/${tenantId}`, 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/hajj-packages/${id}`, 'GET');
    return response;
  },

  getByTenantAndStatus: async (tenantId, status) => {
    const response = await apiCall(`/hajj-packages/tenant/${tenantId}/status/${status}`, 'GET');
    return response;
  },

  getByType: async (type) => {
    const response = await apiCall(`/hajj-packages/type/${type}`, 'GET');
    return response;
  },

  create: async (packageData) => {
    const response = await apiCall('/hajj-packages', 'POST', packageData);
    return response;
  },

  update: async (id, packageData) => {
    const response = await apiCall(`/hajj-packages/${id}`, 'PUT', packageData);
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/hajj-packages/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// HOTEL SERVICES
// ============================================

export const hotelService = {
  getAll: async (tenantId) => {
    const response = await apiCall(`/hotels/tenant/${tenantId}`, 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/hotels/${id}`, 'GET');
    return response;
  },

  getByTenantAndStatus: async (tenantId, status) => {
    const response = await apiCall(`/hotels/tenant/${tenantId}/status/${status}`, 'GET');
    return response;
  },

  getByCity: async (city) => {
    const response = await apiCall(`/hotels/city/${city}`, 'GET');
    return response;
  },

  create: async (hotelData) => {
    const response = await apiCall('/hotels', 'POST', hotelData);
    return response;
  },

  update: async (id, hotelData) => {
    const response = await apiCall(`/hotels/${id}`, 'PUT', hotelData);
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/hotels/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// ROOM TYPE SERVICES
// ============================================

export const roomTypeService = {

  getAll: async (tenantId) => {
    const response = await apiCall(`/room-types/tenant/${tenantId}`, 'GET');
    return response;
  },
  
  getByHotel: async (hotelId) => {
    const response = await apiCall(`/room-types/hotel/${hotelId}`, 'GET');
    return response;
  },

  getByHotelAndStatus: async (hotelId, status) => {
    const response = await apiCall(`/room-types/hotel/${hotelId}/status/${status}`, 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/room-types/${id}`, 'GET');
    return response;
  },

  create: async (roomTypeData) => {
    const response = await apiCall('/room-types', 'POST', roomTypeData);
    return response;
  },

  update: async (id, roomTypeData) => {
    const response = await apiCall(`/room-types/${id}`, 'PUT', roomTypeData);
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/room-types/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// FLIGHT SERVICES
// ============================================

export const flightService = {
  getAll: async (tenantId) => {
    const response = await apiCall(`/flights/tenant/${tenantId}`, 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/flights/${id}`, 'GET');
    return response;
  },

  getByTenantAndStatus: async (tenantId, status) => {
    const response = await apiCall(`/flights/tenant/${tenantId}/status/${status}`, 'GET');
    return response;
  },

  getByAirline: async (airline) => {
    const response = await apiCall(`/flights/airline/${airline}`, 'GET');
    return response;
  },

  create: async (flightData) => {
    const response = await apiCall('/flights', 'POST', flightData);
    return response;
  },

  update: async (id, flightData) => {
    const response = await apiCall(`/flights/${id}`, 'PUT', flightData);
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/flights/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// AIRLINE SERVICES
// ============================================

export const airlineService = {
  getAll: async (tenantId) => {
    const response = await apiCall(`/airlines/tenant/${tenantId}`, 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/airlines/${id}`, 'GET');
    return response;
  },

  getByCode: async (code) => {
    const response = await apiCall(`/airlines/code/${code}`, 'GET');
    return response;
  },

  create: async (airlineData) => {
    const response = await apiCall('/airlines', 'POST', airlineData);
    return response;
  },

  update: async (id, airlineData) => {
    const response = await apiCall(`/airlines/${id}`, 'PUT', airlineData);
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/airlines/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// VISA SERVICES
// ============================================

export const visaService = {
  getAll: async (tenantId) => {
    const response = await apiCall(`/visa/tenant/${tenantId}`, 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/visa/${id}`, 'GET');
    return response;
  },

  getByStatus: async (status) => {
    const response = await apiCall(`/visa/status/${status}`, 'GET');
    return response;
  },

  getByBooking: async (bookingId) => {
    const response = await apiCall(`/visa/booking/${bookingId}`, 'GET');
    return response;
  },

  create: async (visaData) => {
    const response = await apiCall('/visa', 'POST', visaData);
    return response;
  },

  update: async (id, visaData) => {
    const response = await apiCall(`/visa/${id}`, 'PUT', visaData);
    return response;
  },

  approve: async (id) => {
    const response = await apiCall(`/visa/${id}/approve`, 'PATCH');
    return response;
  },

  reject: async (id) => {
    const response = await apiCall(`/visa/${id}/reject`, 'PATCH');
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/visa/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// MAINTENANCE SERVICES
// ============================================

export const maintenanceService = {
  getAll: async (tenantId) => {
    const response = await apiCall(`/maintenance/tenant/${tenantId}`, 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/maintenance/${id}`, 'GET');
    return response;
  },

  getByVehicle: async (vehicleId) => {
    const response = await apiCall(`/maintenance/vehicle/${vehicleId}`, 'GET');
    return response;
  },

  getByStatus: async (status) => {
    const response = await apiCall(`/maintenance/status/${status}`, 'GET');
    return response;
  },

  create: async (maintenanceData) => {
    const response = await apiCall('/maintenance', 'POST', maintenanceData);
    return response;
  },

  update: async (id, maintenanceData) => {
    const response = await apiCall(`/maintenance/${id}`, 'PUT', maintenanceData);
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/maintenance/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// EXPENSE SERVICES
// ============================================

export const expenseService = {
  getAll: async (tenantId) => {
    const response = await apiCall(`/expenses/tenant/${tenantId}`, 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/expenses/${id}`, 'GET');
    return response;
  },

  getByVehicle: async (vehicleId) => {
    const response = await apiCall(`/expenses/vehicle/${vehicleId}`, 'GET');
    return response;
  },

  getByCategory: async (category) => {
    const response = await apiCall(`/expenses/category/${category}`, 'GET');
    return response;
  },

  create: async (expenseData) => {
    const response = await apiCall('/expenses', 'POST', expenseData);
    return response;
  },

  update: async (id, expenseData) => {
    const response = await apiCall(`/expenses/${id}`, 'PUT', expenseData);
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/expenses/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// COMPLIANCE SERVICES
// ============================================

export const complianceService = {
  getAll: async (tenantId) => {
    const response = await apiCall(`/compliance/tenant/${tenantId}`, 'GET');
    return response;
  },

  getById: async (id) => {
    const response = await apiCall(`/compliance/${id}`, 'GET');
    return response;
  },

  getByVehicle: async (vehicleId) => {
    const response = await apiCall(`/compliance/vehicle/${vehicleId}`, 'GET');
    return response;
  },

  getByStatus: async (status) => {
    const response = await apiCall(`/compliance/status/${status}`, 'GET');
    return response;
  },

  create: async (complianceData) => {
    const response = await apiCall('/compliance', 'POST', complianceData);
    return response;
  },

  update: async (id, complianceData) => {
    const response = await apiCall(`/compliance/${id}`, 'PUT', complianceData);
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/compliance/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// NOTIFICATION SERVICES
// ============================================

export const notificationService = {
  getByUser: async (userId) => {
    const response = await apiCall(`/notifications/user/${userId}`, 'GET');
    return response;
  },

  getUnread: async (userId) => {
    const response = await apiCall(`/notifications/user/${userId}/unread`, 'GET');
    return response;
  },

  getUnreadCount: async (userId) => {
    const response = await apiCall(`/notifications/user/${userId}/unread/count`, 'GET');
    return response;
  },

  create: async (notificationData) => {
    const response = await apiCall('/notifications', 'POST', notificationData);
    return response;
  },

  markAsRead: async (id) => {
    const response = await apiCall(`/notifications/${id}/read`, 'PUT');
    return response;
  },

  markAllAsRead: async (userId) => {
    const response = await apiCall(`/notifications/user/${userId}/read-all`, 'PUT');
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/notifications/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// ✅ PUSH SUBSCRIPTION SERVICES
// ============================================

export const pushService = {
  subscribe: async (subscriptionData) => {
    const response = await apiCall('/push/subscribe', 'POST', subscriptionData);
    return response;
  },

  unsubscribe: async (endpoint) => {
    const response = await apiCall('/push/unsubscribe', 'POST', { endpoint });
    return response;
  },

  getVapidKey: async () => {
    const response = await apiCall('/push/vapid-key', 'GET');
    return response;
  },
};

// ============================================
// AUDIT LOG SERVICES
// ============================================

export const auditLogService = {
  getAll: async () => {
    const response = await apiCall('/audit', 'GET');
    return response;
  },

  getByTenant: async (tenantId) => {
    const response = await apiCall(`/audit/tenant/${tenantId}`, 'GET');
    return response;
  },

  getByUser: async (userId) => {
    const response = await apiCall(`/audit/user/${userId}`, 'GET');
    return response;
  },

  getByEntity: async (entity) => {
    const response = await apiCall(`/audit/entity/${entity}`, 'GET');
    return response;
  },

  create: async (logData) => {
    const response = await apiCall('/audit', 'POST', logData);
    return response;
  },
};

// ============================================
// DASHBOARD & REPORT SERVICES
// ============================================

export const dashboardService = {
  getStats: async (tenantId) => {
    const response = await apiCall(`/dashboard/stats/${tenantId}`, 'GET');
    return response;
  },

  getBookingStats: async (tenantId) => {
    const response = await apiCall(`/dashboard/bookings/${tenantId}`, 'GET');
    return response;
  },
};

export const reportService = {
  getDashboardSummary: async (tenantId) => {
    const response = await apiCall(`/reports/dashboard/${tenantId}`, 'GET');
    return response;
  },

  getRevenueReport: async (tenantId) => {
    const response = await apiCall(`/reports/revenue/${tenantId}`, 'GET');
    return response;
  },
};

// ============================================
// SERVICE CONFIG SERVICES
// ============================================

export const serviceConfigService = {
  getAll: async (tenantId) => {
    const response = await apiCall(`/service-configs/tenant/${tenantId}`, 'GET');
    return response;
  },

  getByService: async (tenantId, serviceId) => {
    const response = await apiCall(`/service-configs/tenant/${tenantId}/service/${serviceId}`, 'GET');
    return response;
  },

  create: async (configData) => {
    const response = await apiCall('/service-configs', 'POST', configData);
    return response;
  },

  update: async (id, configData) => {
    const response = await apiCall(`/service-configs/${id}`, 'PUT', configData);
    return response;
  },

  delete: async (id) => {
    const response = await apiCall(`/service-configs/${id}`, 'DELETE');
    return response;
  },
};

// ============================================
// EXPORT ALL SERVICES
// ============================================

export default {
  auth: authService,
  tenant: tenantService,
  user: userService,
  vehicle: vehicleService,
  carOwner: carOwnerService,
  booking: bookingService,
  tourPackage: tourPackageService,
  tourGuide: tourGuideService,
  hajjPackage: hajjPackageService,
  hotel: hotelService,
  roomType: roomTypeService,
  flight: flightService,
  airline: airlineService,
  visa: visaService,
  maintenance: maintenanceService,
  expense: expenseService,
  compliance: complianceService,
  notification: notificationService,
   push: pushService,
  auditLog: auditLogService,
  dashboard: dashboardService,
  report: reportService,
  serviceConfig: serviceConfigService,
};