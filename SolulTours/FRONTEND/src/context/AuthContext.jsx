// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';

export const roles = {
  SUPER_ADMIN: 'super_admin',
  FLEET_MANAGER: 'fleet_manager',    // Manages all fleet operations
  CAR_OWNER: 'car_owner',             // Owns vehicles, sees bookings & revenue
  CLIENT: 'client'                    // Books services (self-drive)
};

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const saved = localStorage.getItem('travel_agency_auth');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (typeof parsed === 'object' && parsed !== null && parsed.id) {
            setCurrentUser(parsed);
          } else {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      } catch (e) {
        console.error('❌ AuthProvider: Error loading user:', e);
        setCurrentUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Save user to localStorage whenever it changes
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('travel_agency_auth', JSON.stringify(currentUser));
      localStorage.setItem('travel_agency_user', JSON.stringify(currentUser));
      localStorage.setItem('travel_agency_role', currentUser.role);
    }
  }, [currentUser]);

  // Switch user role
  const switchRole = useCallback((role) => {
    setCurrentUser(prev => {
      if (prev) {
        return { ...prev, role };
      }
      return prev;
    });
  }, []);

  // Memoize value object
  const value = useMemo(() => ({
    currentUser,
    setCurrentUser,
    switchRole,
    roles,
    loading
  }), [currentUser, switchRole, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};