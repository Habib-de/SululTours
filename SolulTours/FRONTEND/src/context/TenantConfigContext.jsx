import React, { createContext, useState, useContext, useEffect } from 'react';

// ============================================
// LOCATION PRESETS - CLEAN (NO PREFILLED DATA)
// ============================================

const LOCATION_PRESETS = {
  // -------- KENYA LOCATIONS --------
  
  nairobi: {
    id: 'nairobi',
    name: 'Nairobi CBD, Kenya',
    country: 'Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    map: { center: { lat: -1.2921, lng: 36.8219 }, zoom: 13 },
    geofences: [],  // ← EMPTY - will be loaded from localStorage
    vehicles: [],   // ← EMPTY - will be loaded from localStorage
  },

  mombasa: {
    id: 'mombasa',
    name: 'Mombasa, Kenya',
    country: 'Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    map: { center: { lat: -4.0435, lng: 39.6682 }, zoom: 13 },
    geofences: [],
    vehicles: [],
  },

  kisumu: {
    id: 'kisumu',
    name: 'Kisumu, Kenya',
    country: 'Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    map: { center: { lat: -0.1022, lng: 34.7617 }, zoom: 13 },
    geofences: [],
    vehicles: [],
  },

  eldoret: {
    id: 'eldoret',
    name: 'Eldoret, Kenya',
    country: 'Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    map: { center: { lat: 0.5143, lng: 35.2698 }, zoom: 13 },
    geofences: [],
    vehicles: [],
  },

  nakuru: {
    id: 'nakuru',
    name: 'Nakuru, Kenya',
    country: 'Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    map: { center: { lat: -0.3031, lng: 36.0800 }, zoom: 13 },
    geofences: [],
    vehicles: [],
  },

  thika: {
    id: 'thika',
    name: 'Thika, Kenya',
    country: 'Kenya',
    currency: 'KES',
    timezone: 'Africa/Nairobi',
    map: { center: { lat: -1.0388, lng: 37.0833 }, zoom: 13 },
    geofences: [],
    vehicles: [],
  },

  // -------- OTHER AFRICAN LOCATIONS --------
  
  lesotho: {
    id: 'lesotho',
    name: 'Maseru, Lesotho',
    country: 'Lesotho',
    currency: 'LSL',
    timezone: 'Africa/Maseru',
    map: { center: { lat: -29.3167, lng: 27.4833 }, zoom: 12 },
    geofences: [],
    vehicles: [],
  },

  cape_town: {
    id: 'cape_town',
    name: 'Cape Town, South Africa',
    country: 'South Africa',
    currency: 'ZAR',
    timezone: 'Africa/Johannesburg',
    map: { center: { lat: -33.9249, lng: 18.4241 }, zoom: 12 },
    geofences: [],
    vehicles: [],
  },

  johannesburg: {
    id: 'johannesburg',
    name: 'Johannesburg, South Africa',
    country: 'South Africa',
    currency: 'ZAR',
    timezone: 'Africa/Johannesburg',
    map: { center: { lat: -26.2041, lng: 28.0473 }, zoom: 12 },
    geofences: [],
    vehicles: [],
  },

  lagos: {
    id: 'lagos',
    name: 'Lagos, Nigeria',
    country: 'Nigeria',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    map: { center: { lat: 6.5244, lng: 3.3792 }, zoom: 12 },
    geofences: [],
    vehicles: [],
  },

  accra: {
    id: 'accra',
    name: 'Accra, Ghana',
    country: 'Ghana',
    currency: 'GHS',
    timezone: 'Africa/Accra',
    map: { center: { lat: 5.6037, lng: -0.1870 }, zoom: 13 },
    geofences: [],
    vehicles: [],
  },

  // Custom - for user-defined locations
  custom: {
    id: 'custom',
    name: 'Custom Location',
    country: 'Custom',
    currency: 'USD',
    timezone: 'UTC',
    map: { center: { lat: 0, lng: 0 }, zoom: 10 },
    geofences: [],
    vehicles: [],
  }
};

// ============================================
// KENYA CITIES REFERENCE
// ============================================

export const KENYA_CITIES = {
  nairobi: { name: 'Nairobi', lat: -1.2921, lng: 36.8219 },
  mombasa: { name: 'Mombasa', lat: -4.0435, lng: 39.6682 },
  kisumu: { name: 'Kisumu', lat: -0.1022, lng: 34.7617 },
  eldoret: { name: 'Eldoret', lat: 0.5143, lng: 35.2698 },
  nakuru: { name: 'Nakuru', lat: -0.3031, lng: 36.0800 },
  thika: { name: 'Thika', lat: -1.0388, lng: 37.0833 },
  malindi: { name: 'Malindi', lat: -3.2192, lng: 40.1200 },
  kitale: { name: 'Kitale', lat: 1.0200, lng: 35.0000 },
  garissa: { name: 'Garissa', lat: -0.4542, lng: 39.6583 },
  meru: { name: 'Meru', lat: 0.0500, lng: 37.6500 },
};

// ============================================
// TENANT CONFIG CONTEXT
// ============================================

const TenantConfigContext = createContext();

export const TenantConfigProvider = ({ children }) => {
  const [currentTenant, setCurrentTenant] = useState('nairobi');
  const [tenantConfig, setTenantConfig] = useState(null);
  const [availableLocations, setAvailableLocations] = useState(Object.keys(LOCATION_PRESETS));
  const [isLoading, setIsLoading] = useState(false);

  // Load tenant config from localStorage on mount
  useEffect(() => {
    const savedTenant = localStorage.getItem('fleetmaster_tenant');
    if (savedTenant && LOCATION_PRESETS[savedTenant]) {
      setCurrentTenant(savedTenant);
      setTenantConfig(LOCATION_PRESETS[savedTenant]);
    } else {
      setTenantConfig(LOCATION_PRESETS['nairobi']);
    }
  }, []);

  // Save tenant to localStorage when changed
  const switchTenant = (tenantId) => {
    if (LOCATION_PRESETS[tenantId]) {
      setCurrentTenant(tenantId);
      setTenantConfig(LOCATION_PRESETS[tenantId]);
      localStorage.setItem('fleetmaster_tenant', tenantId);
      
      // Dispatch event for components to react
      window.dispatchEvent(new CustomEvent('tenantChanged', { 
        detail: { tenantId, config: LOCATION_PRESETS[tenantId] } 
      }));
    }
  };

  // Get all Kenya locations
  const getKenyaLocations = () => {
    return Object.keys(KENYA_CITIES).map(key => ({
      id: key,
      name: KENYA_CITIES[key].name,
      lat: KENYA_CITIES[key].lat,
      lng: KENYA_CITIES[key].lng
    }));
  };

  // Get all available presets
  const getAvailablePresets = () => {
    return Object.keys(LOCATION_PRESETS).map(key => ({
      id: key,
      name: LOCATION_PRESETS[key].name,
      country: LOCATION_PRESETS[key].country,
      isKenya: ['nairobi', 'mombasa', 'kisumu', 'eldoret', 'nakuru', 'thika'].includes(key)
    }));
  };

  // Add custom location (for future DB integration)
  const addCustomLocation = (locationData) => {
    const newId = `custom_${Date.now()}`;
    LOCATION_PRESETS[newId] = {
      id: newId,
      name: locationData.name,
      country: locationData.country || 'Custom',
      currency: locationData.currency || 'USD',
      timezone: locationData.timezone || 'UTC',
      map: { center: { lat: locationData.lat, lng: locationData.lng }, zoom: locationData.zoom || 12 },
      geofences: locationData.geofences || [],
      vehicles: locationData.vehicles || [],
    };
    setAvailableLocations([...Object.keys(LOCATION_PRESETS)]);
    return newId;
  };

  const value = {
    currentTenant,
    tenantConfig,
    isLoading,
    switchTenant,
    getKenyaLocations,
    getAvailablePresets,
    addCustomLocation,
    LOCATION_PRESETS,
    KENYA_CITIES,
  };

  return (
    <TenantConfigContext.Provider value={value}>
      {children}
    </TenantConfigContext.Provider>
  );
};

export const useTenantConfig = () => {
  const context = useContext(TenantConfigContext);
  if (!context) {
    throw new Error('useTenantConfig must be used within a TenantConfigProvider');
  }
  return context;
};

export default TenantConfigContext;