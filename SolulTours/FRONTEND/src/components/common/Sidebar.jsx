import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Users, Car, Calendar, Compass, Map, Building, 
  Plane, Headphones, FileText, User, LogOut,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = ({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, navItems, onLogout }) => {
  const { currentUser } = useAuth();
  const userRole = currentUser?.role || 'user';
  
  // Only Fleet Manager has expandable groups
  const isFleetManager = userRole === 'fleet_manager';
  
  const [expandedGroups, setExpandedGroups] = useState({
    carHire: true,
    tours: false,
    hajj: false,
    hotels: false,
    flights: false,
    consultancy: false,
    bookings: false,
    admin: false,
    reports: false
  });

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (window.innerWidth < 768 && sidebarOpen) {
        const sidebar = document.querySelector('.sidebar-container');
        if (sidebar && !sidebar.contains(e.target)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, setSidebarOpen]);

  // Close sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && sidebarOpen) {
        setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen, setSidebarOpen]);

  // Toggle group expansion (only for Fleet Manager)
  const toggleGroup = (groupId) => {
    if (!isFleetManager) return;
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Get user display data
  const userName = currentUser?.name || 'User';
  const userAvatar = currentUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=1e293b&color=fff&size=40`;

  // Format role for display
  const getDisplayRole = (role) => {
    switch(role) {
      case 'super_admin': return 'Super Admin';
      case 'fleet_manager': return 'Fleet Manager';
      case 'car_owner': return 'Car Owner';
      case 'broker': return 'Booking Agent';
      case 'client': return 'Client';
      default: return 'User';
    }
  };

  // Group navigation items - only for Fleet Manager
  const groupedNavItems = () => {
    // For non-Fleet Manager roles, return items as a flat list
    if (!isFleetManager) {
      return { flat: { label: '', icon: LayoutDashboard, items: navItems } };
    }

    const groups = {
      main: { label: 'MAIN', icon: LayoutDashboard, items: [] },
      carHire: { label: 'CAR HIRE', icon: Car, items: [] },
      tours: { label: 'TOURS & TRAVEL', icon: Compass, items: [] },
      hajj: { label: 'HAJJ & UMRA', icon: Map, items: [] },
      hotels: { label: 'HOTELS', icon: Building, items: [] },
      flights: { label: 'FLIGHTS', icon: Plane, items: [] },
      consultancy: { label: 'CONSULTANCY', icon: Headphones, items: [] },
      bookings: { label: 'BOOKINGS', icon: Calendar, items: [] },
      admin: { label: 'ADMINISTRATION', icon: Users, items: [] },
      other: { label: 'OTHERS', icon: LayoutDashboard, items: [] },
      reports: { label: 'REPORTS', icon: FileText, items: [] }
    };

    navItems.forEach(item => {
      const id = item.id;
      
      if (id === 'dashboard') {
        groups.main.items.push(item);
      }
      // Car Hire
      else if (id === 'vehicles' || id === 'car-owners' || id === 'brokers' || id === 'maintenance' || 
               id === 'car-bookings' || id === 'client-car-hire' || id === 'my-vehicles' ||
               id === 'vehicle-bookings' || id === 'revenue' || id === 'issues' || 
               id === 'maintenance-status' || id === 'car-crm') {
        groups.carHire.items.push(item);
      }
      // Tours
      else if (id === 'tour-packages' || id === 'tour-bookings' || id === 'tour-guides' || 
               id === 'client-tours') {
        groups.tours.items.push(item);
      }
      // Hajj & Umra
      else if (id === 'hajj-packages' || id === 'hajj-bookings' || id === 'visa-processing' || 
               id === 'client-hajj-umra') {
        groups.hajj.items.push(item);
      }
      // Hotels
      else if (id === 'fleet-hotels' || id === 'fleet-hotel-bookings' || id === 'fleet-room-types' || 
               id === 'client-hotels') {
        groups.hotels.items.push(item);
      }
      // Flights
      else if (id === 'fleet-flights' || id === 'fleet-flight-bookings' || id === 'fleet-airlines' || 
               id === 'client-flights') {
        groups.flights.items.push(item);
      }
      // Consultancy
      else if (id === 'consultancy' || id === 'client-consultancy') {
        groups.consultancy.items.push(item);
      }
      // Bookings
      else if (id === 'all-bookings' || id === 'client-my-bookings') {
        groups.bookings.items.push(item);
      }
      // Admin
      else if (id === 'fleet-managers' || id === 'car-owners' || id === 'clients' || 
               id === 'services' || id === 'system' || id === 'audit' || id === 'tenants' ||
               id === 'analytics' || id === 'client-profile' || id === 'users' ||
               id === 'pending-approvals') {
        groups.admin.items.push(item);
      }
      // Reports
      else if (id === 'reports' || id === 'fleet-reports') {
  groups.other.items.push(item);  // ✅ Moved from 'reports' to 'other'
}
else {
  groups.other.items.push(item);
}
    });

    return Object.fromEntries(
      Object.entries(groups).filter(([key, group]) => group.items.length > 0)
    );
  };

  const groups = groupedNavItems();
  const isFlatList = !isFleetManager && groups.flat;

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth < 768 && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside 
        className={`sidebar-container fixed md:relative bg-white border-r border-gray-200 transition-all duration-300 flex flex-col z-50 h-full shadow-lg
          ${sidebarOpen ? 'w-64 left-0' : 'w-16 -left-16 md:left-0'}
          ${sidebarOpen && window.innerWidth < 768 ? 'left-0 shadow-2xl' : ''}
        `}
      >
        {/* TOP: Empty spacer */}
        <div className="h-2"></div>

        {/* Navigation - Starts directly with Dashboard */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 scrollbar-thin scrollbar-thumb-gray-300">
          {isFlatList ? (
            // FLAT LIST - For Car Owner, Client, Super Admin (No dropdowns)
            groups.flat.items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (window.innerWidth < 768) setSidebarOpen(false);
                }}
                className={`w-full flex items-center ${sidebarOpen ? 'px-3 py-2.5' : 'justify-center py-2.5'} rounded-lg transition-colors mb-0.5 ${
                  activeTab === item.id 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                title={!sidebarOpen ? item.label : ''}
              >
                <item.icon size={20} className="flex-shrink-0" />
                {sidebarOpen && (
  <span className={`ml-3 text-sm font-medium ${activeTab === item.id ? 'text-blue-600' : 'text-black'}`}>
    {item.label}
  </span>
)}
              </button>
            ))
          ) : (
            // GROUPED LIST - Only for Fleet Manager
            Object.entries(groups).map(([groupId, group]) => {
              const isExpanded = expandedGroups[groupId] || false;
              const hasItems = group.items.length > 0;
              
              // Show MAIN group items without collapsible header
              if (groupId === 'main') {
                return group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center ${sidebarOpen ? 'px-3 py-2.5' : 'justify-center py-2.5'} rounded-lg transition-colors mb-0.5 ${
                      activeTab === item.id 
                        ? 'bg-blue-50 text-blue-600' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={!sidebarOpen ? item.label : ''}
                  >
                    <item.icon size={20} className="flex-shrink-0" />
                    {sidebarOpen && (
  <span className={`ml-3 text-sm font-medium ${activeTab === item.id ? 'text-blue-600' : 'text-black'}`}>
    {item.label}
  </span>
)}
                  </button>
                ));
              }

              return (
                <div key={groupId} className="mb-1">
                  {/* Group Header - WITH ICON */}
                  {sidebarOpen && hasItems && (
                    <button
                      onClick={() => toggleGroup(groupId)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600 transition-colors"
                    >
                      <span className="flex items-center gap-2 text-black">
                        <group.icon size={14} className="flex-shrink-0" />
                        {group.label}
                      </span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  )}
                  
                  {/* Group Items */}
                  <div className={`${isExpanded || !sidebarOpen ? 'block' : 'hidden'}`}>
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          if (window.innerWidth < 768) setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center ${sidebarOpen ? 'px-3 py-2 ml-2' : 'justify-center py-2.5'} rounded-lg transition-colors ${
                          activeTab === item.id 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        title={!sidebarOpen ? item.label : ''}
                      >
                        <item.icon size={18} className="flex-shrink-0" />
                        {sidebarOpen && (
                          <span className={`ml-3 text-sm ${activeTab === item.id ? 'text-blue-600 font-medium' : 'text-black'}`}>
  {item.label}
</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </nav>

        {/* BOTTOM: User Profile & Logout */}
        <div className="border-t border-gray-200 bg-gray-50">
          <div className={`${sidebarOpen ? 'p-4' : 'p-2'}`}>
            <div className={`flex items-center ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
              <img 
                src={userAvatar}
                alt={userName} 
                className={`${sidebarOpen ? 'w-9 h-9' : 'w-8 h-8'} rounded-full flex-shrink-0 ring-2 ring-white shadow-md`} 
              />
              <div className={`flex-1 min-w-0 ${!sidebarOpen && 'hidden'}`}>
                <p className="text-sm font-semibold text-black truncate">{userName}</p>
                <p className="text-xs text-black">{getDisplayRole(userRole)}</p>
              </div>
              {sidebarOpen && (
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              )}
            </div>
            {!sidebarOpen && (
              <button
                onClick={onLogout}
                className="w-full flex justify-center mt-2 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;