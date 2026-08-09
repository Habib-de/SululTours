import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Users, User, Shield, UserCheck, UserCog, Car, 
  Search, Filter, RefreshCw, Eye, Edit2, Trash2,
  X, Check, AlertCircle, CheckCircle, Clock,
  Mail, Phone, MapPin, Building, Calendar,
  Award, Star, DollarSign, TrendingUp,
  ChevronDown, ChevronUp, MoreVertical,
  UserPlus, Ban, UserX, UserMinus, Save
} from 'lucide-react';
import { userService, carOwnerService, tenantService } from '../../services/api';

const UsersManagement = ({ setActiveTab }) => {
  const [users, setUsers] = useState([]);
  const [carOwners, setCarOwners] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUserData, setEditUserData] = useState(null);
  const [notification, setNotification] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================
// LOAD DATA FROM API
// ============================================
const loadData = useCallback(async () => {
  setLoading(true);

  try {
    console.log('🔍 Loading users from API...');

    // 1. Get all users
    const usersResponse = await userService.getAll();
    const userData = usersResponse?.data || usersResponse || [];
    console.log(`📋 Found ${userData.length} users from API`);

    // 2. Get all car owners and tenants
    let carOwnerData = [];
    let tenantData = [];
    
    try {
      // Get tenants first
      const tenantsResponse = await tenantService.getAll();
      tenantData = tenantsResponse?.data || tenantsResponse || [];
      setTenants(tenantData);
      console.log(`📋 Found ${tenantData.length} tenants`);
      
      // Try to get all car owners
      try {
        const ownersResponse = await carOwnerService.getAll();
        carOwnerData = ownersResponse?.data || ownersResponse || [];
        console.log(`📋 Found ${carOwnerData.length} car owners from API`);
      } catch (e) {
        console.warn('Could not fetch all car owners, trying tenant-specific...');
        // Fallback: get car owners by tenant
        for (const tenant of tenantData) {
          try {
            const res = await carOwnerService.getAll(tenant.id);
            const data = res?.data || res || [];
            carOwnerData = [...carOwnerData, ...data];
          } catch (err) {
            console.warn(`No car owners for tenant ${tenant.id}`);
          }
        }
        console.log(`📋 Found ${carOwnerData.length} car owners from tenants`);
      }
    } catch (error) {
      console.warn('Could not fetch tenants:', error);
    }

    // 3. Enhance users with car owner data and last login
const enhancedUsers = userData.map(user => {
  const carOwner = carOwnerData.find(owner => 
    owner.userId === user.id || 
    owner.user?.id === user.id ||
    owner.user_id === user.id
  );
  
  const isCarOwner = !!carOwner;
  const carOwnerStatus = carOwner?.status || 'none';
  
  // Find tenant for this user
  const tenant = tenantData.find(t => t.id === user.tenantId || t.id === user.tenant_id);
  
  // ✅ Find last login from audit logs
  let lastLogin = user.lastLogin || null;
  
  // Try to get from localStorage audit logs
  try {
    const auditLogs = JSON.parse(localStorage.getItem('travel_agency_audit_logs') || '[]');
    const userLogins = auditLogs
      .filter(log => 
        log.userEmail === user.email && 
        log.action === 'User Login'
      )
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (userLogins.length > 0) {
      lastLogin = userLogins[0].timestamp;
    }
  } catch (e) {
    // Use existing lastLogin or null
  }
  
  return {
    ...user,
    isCarOwner,
    carOwnerStatus,
    carOwnerData: carOwner || null,
    tenantName: tenant?.name || 'N/A',
    lastLogin: lastLogin  // ✅ Add this
  };
});

    setUsers(enhancedUsers);
    setCarOwners(carOwnerData);
    console.log(`✅ Enhanced ${enhancedUsers.length} users with data`);

  } catch (error) {
    console.error('❌ Error loading users:', error);
    showNotification('Error loading users from API', 'error');
    // Fallback to localStorage
    loadFromLocalStorage();
  }

  setLoading(false);
}, []);

  // ============================================
// LOAD FROM LOCALSTORAGE (Fallback)
// ============================================
const loadFromLocalStorage = useCallback(() => {
  try {
    console.warn('⚠️ Loading users from localStorage (fallback)');
    
    const storedUsers = JSON.parse(localStorage.getItem('travel_agency_users') || '[]');
    const storedCarOwners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
    const storedTenants = JSON.parse(localStorage.getItem('travel_agency_tenants') || '[]');
    
    const enhancedUsers = storedUsers.map(user => {
      const carOwner = storedCarOwners.find(owner => owner.userId === user.id);
      const tenant = storedTenants.find(t => t.id === user.tenantId || t.id === user.tenant_id);
      
      return {
        ...user,
        isCarOwner: !!carOwner,
        carOwnerStatus: carOwner?.status || 'none',
        carOwnerData: carOwner || null,
        tenantName: tenant?.name || 'N/A'
      };
    });
    
    setUsers(enhancedUsers);
    setCarOwners(storedCarOwners);
  } catch (e) {
    console.error('Error loading from localStorage:', e);
  }
}, []);

  // ============================================
  // CLOSE MODALS
  // ============================================
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedUser(null);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditUserData(null);
  };

  // ============================================
  // OPEN EDIT MODAL
  // ============================================
  const openEditModal = (user) => {
    setEditUserData({ ...user });
    setShowEditModal(true);
    closeDetailModal();
  };

  // ============================================
  // HANDLE EDIT FORM CHANGES
  // ============================================
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // ============================================
  // SAVE USER EDIT - API
  // ============================================
  const saveUserEdit = async () => {
    if (!editUserData) return;

    try {
      const updateData = {
        name: editUserData.name,
        email: editUserData.email,
        phone: editUserData.phone,
        role: editUserData.role,
        status: editUserData.status
      };

      const response = await userService.update(editUserData.id, updateData);
      
      if (response?.success) {
        showNotification('User updated successfully');
        loadData();
        closeEditModal();
      } else {
        showNotification('Failed to update user', 'error');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      showNotification('Error updating user', 'error');
      // Fallback: update localStorage
      saveUserEditLocal();
    }
  };

  // ============================================
  // SAVE USER EDIT - LOCALSTORAGE (Fallback)
  // ============================================
  const saveUserEditLocal = () => {
    if (!editUserData) return;

    const allUsers = JSON.parse(localStorage.getItem('travel_agency_users') || '[]');
    const updated = allUsers.map(u => {
      if (u.id === editUserData.id) {
        return { 
          ...u, 
          name: editUserData.name,
          email: editUserData.email,
          phone: editUserData.phone,
          role: editUserData.role,
          status: editUserData.status,
          updatedAt: new Date().toISOString()
        };
      }
      return u;
    });
    localStorage.setItem('travel_agency_users', JSON.stringify(updated));
    
    loadData();
    closeEditModal();
    showNotification('User updated successfully');
  };

  // ============================================
  // UPDATE USER STATUS - API
  // ============================================
  const updateUserStatus = async (userId, newStatus) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const updateData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: newStatus
      };

      const response = await userService.update(userId, updateData);
      
      if (response?.success) {
        showNotification(`User status updated to ${newStatus}`);
        loadData();
      } else {
        showNotification('Failed to update status', 'error');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      // Fallback: update localStorage
      updateUserStatusLocal(userId, newStatus);
    }
  };

  // ============================================
  // UPDATE USER STATUS - LOCALSTORAGE (Fallback)
  // ============================================
  const updateUserStatusLocal = (userId, newStatus) => {
    const allUsers = JSON.parse(localStorage.getItem('travel_agency_users') || '[]');
    const updated = allUsers.map(u => {
      if (u.id === userId) {
        return { ...u, status: newStatus, updatedAt: new Date().toISOString() };
      }
      return u;
    });
    localStorage.setItem('travel_agency_users', JSON.stringify(updated));
    loadData();
    showNotification(`User status updated to ${newStatus}`);
  };

  // ============================================
  // UPDATE USER ROLE - API
  // ============================================
  const updateUserRole = async (userId, newRole) => {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const updateData = {
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: newRole,
        status: user.status
      };

      const response = await userService.update(userId, updateData);
      
      if (response?.success) {
        showNotification(`User role updated to ${newRole}`);
        loadData();
      } else {
        showNotification('Failed to update role', 'error');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      // Fallback: update localStorage
      updateUserRoleLocal(userId, newRole);
    }
  };

  // ============================================
  // UPDATE USER ROLE - LOCALSTORAGE (Fallback)
  // ============================================
  const updateUserRoleLocal = (userId, newRole) => {
    const allUsers = JSON.parse(localStorage.getItem('travel_agency_users') || '[]');
    const updated = allUsers.map(u => {
      if (u.id === userId) {
        return { ...u, role: newRole, updatedAt: new Date().toISOString() };
      }
      return u;
    });
    localStorage.setItem('travel_agency_users', JSON.stringify(updated));
    loadData();
    showNotification(`User role updated to ${newRole}`);
  };

  // ============================================
  // DELETE USER - API
  // ============================================
  const deleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await userService.delete(userId);
      
      if (response?.success) {
        showNotification('User deleted successfully');
        loadData();
      } else {
        showNotification('Failed to delete user', 'error');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      // Fallback: delete from localStorage
      deleteUserLocal(userId);
    }
  };

  // ============================================
  // DELETE USER - LOCALSTORAGE (Fallback)
  // ============================================
  const deleteUserLocal = (userId) => {
    const allUsers = JSON.parse(localStorage.getItem('travel_agency_users') || '[]');
    const updated = allUsers.filter(u => u.id !== userId);
    localStorage.setItem('travel_agency_users', JSON.stringify(updated));
    
    const allCarOwners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
    const updatedCarOwners = allCarOwners.filter(o => o.userId !== userId);
    localStorage.setItem('travel_agency_car_owners', JSON.stringify(updatedCarOwners));
    
    loadData();
    showNotification('User deleted successfully');
  };

  // ============================================
  // APPROVE CAR OWNER - API
  // ============================================
  const approveCarOwner = async (userId) => {
    try {
      const carOwner = carOwners.find(o => o.userId === userId || o.user_id === userId);
      if (!carOwner) {
        showNotification('Car owner not found', 'error');
        return;
      }

      const response = await carOwnerService.approve(carOwner.id);
      
      if (response?.success) {
        showNotification('Car owner approved successfully');
        // Also update user status to active
        await updateUserStatus(userId, 'active');
        loadData();
      } else {
        showNotification('Failed to approve car owner', 'error');
      }
    } catch (error) {
      console.error('Error approving car owner:', error);
      // Fallback: approve from localStorage
      approveCarOwnerLocal(userId);
    }
  };

  // ============================================
  // APPROVE CAR OWNER - LOCALSTORAGE (Fallback)
  // ============================================
  const approveCarOwnerLocal = (userId) => {
    const allCarOwners = JSON.parse(localStorage.getItem('travel_agency_car_owners') || '[]');
    const updated = allCarOwners.map(o => {
      if (o.userId === userId) {
        return { ...o, status: 'active', approvedAt: new Date().toISOString() };
      }
      return o;
    });
    localStorage.setItem('travel_agency_car_owners', JSON.stringify(updated));
    
    const allUsers = JSON.parse(localStorage.getItem('travel_agency_users') || '[]');
    const updatedUsers = allUsers.map(u => {
      if (u.id === userId) {
        return { ...u, status: 'active', updatedAt: new Date().toISOString() };
      }
      return u;
    });
    localStorage.setItem('travel_agency_users', JSON.stringify(updatedUsers));
    
    loadData();
    showNotification('Car owner approved successfully');
  };

  // ============================================
  // GET ROLE BADGE
  // ============================================
  const getRoleBadge = (role) => {
    const roleMap = {
      super_admin: { label: '👑 Super Admin', color: 'bg-purple-100 text-purple-800', icon: Shield },
      admin: { label: '🛡️ Admin', color: 'bg-blue-100 text-blue-800', icon: UserCheck },
      fleet_manager: { label: '📋 Fleet Manager', color: 'bg-indigo-100 text-indigo-800', icon: UserCog },
      client: { label: '👤 Client', color: 'bg-green-100 text-green-800', icon: User },
      car_owner: { label: '🚗 Car Owner', color: 'bg-amber-100 text-amber-800', icon: Car }
    };
    return roleMap[role] || { label: role || 'User', color: 'bg-gray-100 text-gray-800', icon: User };
  };

  // ============================================
  // GET STATUS BADGE
  // ============================================
  const getStatusBadge = (status) => {
    const statusMap = {
      active: { label: '✅ Active', color: 'bg-green-100 text-green-800' },
      inactive: { label: '❌ Inactive', color: 'bg-gray-100 text-gray-800' },
      pending: { label: '⏳ Pending', color: 'bg-yellow-100 text-yellow-800' },
      suspended: { label: '⛔ Suspended', color: 'bg-red-100 text-red-800' }
    };
    return statusMap[status] || { label: status || 'Unknown', color: 'bg-gray-100 text-gray-800' };
  };

  // ============================================
  // GET CAR OWNER STATUS BADGE
  // ============================================
  const getCarOwnerStatusBadge = (status) => {
    const statusMap = {
      active: { label: '✅ Active', color: 'bg-green-100 text-green-800' },
      pending_approval: { label: '⏳ Pending Approval', color: 'bg-yellow-100 text-yellow-800' },
      rejected: { label: '❌ Rejected', color: 'bg-red-100 text-red-800' },
      suspended: { label: '⛔ Suspended', color: 'bg-red-100 text-red-800' },
      none: { label: 'Not a Car Owner', color: 'bg-gray-100 text-gray-800' }
    };
    return statusMap[status] || { label: status || 'Unknown', color: 'bg-gray-100 text-gray-800' };
  };

  // ============================================
  // GET ROLE ICON
  // ============================================
  const getRoleIcon = (role) => {
    const icons = {
      super_admin: Shield,
      admin: UserCheck,
      fleet_manager: UserCog,
      client: User,
      car_owner: Car
    };
    return icons[role] || User;
  };

  // ============================================
  // FILTER USERS
  // ============================================
  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(term) ||
        u.email?.toLowerCase().includes(term) ||
        u.phone?.toLowerCase().includes(term) ||
        u.id?.toLowerCase().includes(term)
      );
    }
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(u => u.status === filterStatus);
    }
    
    return filtered;
  }, [users, searchTerm, filterRole, filterStatus]);

  // ============================================
  // STATS
  // ============================================
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(u => u.role === 'admin' || u.role === 'super_admin').length;
    const fleetManagers = users.filter(u => u.role === 'fleet_manager').length;
    const clients = users.filter(u => u.role === 'client').length;
    const carOwners = users.filter(u => u.role === 'car_owner').length;
    const active = users.filter(u => u.status === 'active').length;
    const pending = users.filter(u => u.status === 'pending').length;
    
    return { total, admins, fleetManagers, clients, carOwners, active, pending };
  }, [users]);

  // ============================================
  // GET UNIQUE ROLES FOR FILTER
  // ============================================
  const roles = useMemo(() => {
    const roleSet = new Set();
    users.forEach(u => {
      if (u.role) roleSet.add(u.role);
    });
    return Array.from(roleSet);
  }, [users]);

  // ============================================
  // RENDER FUNCTIONS
  // ============================================

  // Render user detail modal
  const renderUserDetailModal = () => {
    if (!selectedUser || !showDetailModal) return null;
    
    const roleBadge = getRoleBadge(selectedUser.role);
    const statusBadge = getStatusBadge(selectedUser.status);
    const carOwnerStatus = getCarOwnerStatusBadge(selectedUser.carOwnerStatus);
    const RoleIcon = roleBadge.icon;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={closeDetailModal}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <button 
            onClick={closeDetailModal}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-white text-2xl font-bold">
                {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedUser.name}</h2>
                <p className="text-blue-100 text-sm">{selectedUser.email}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                  {selectedUser.tenantName && selectedUser.tenantName !== 'N/A' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/20 text-white">
                      🏢 {selectedUser.tenantName}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">📧 Email</p>
                <p className="text-sm font-medium break-all">{selectedUser.email}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">📱 Phone</p>
                <p className="text-sm font-medium">{selectedUser.phone || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">🏢 Tenant</p>
                <p className="text-sm font-medium">{selectedUser.tenantName || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">📅 Joined</p>
                <p className="text-sm font-medium">{selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                <p className="text-xs text-gray-500">🆔 User ID</p>
                <p className="text-sm font-mono text-xs break-all">{selectedUser.id}</p>
              </div>
            </div>

            {selectedUser.isCarOwner && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">🚗 Car Owner Status</h4>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${carOwnerStatus.color}`}>
                        {carOwnerStatus.label}
                      </span>
                      {selectedUser.carOwnerData?.businessName && (
                        <p className="text-sm text-gray-600 mt-1">Business: {selectedUser.carOwnerData.businessName}</p>
                      )}
                    </div>
                    {selectedUser.carOwnerStatus === 'pending_approval' && (
                      <button
                        onClick={() => {
                          approveCarOwner(selectedUser.id);
                          closeDetailModal();
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-2"
                      >
                        <Check size={16} /> Approve Owner
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-gray-200 flex-wrap">
              <button onClick={closeDetailModal} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm">
                Close
              </button>
              <button
                onClick={() => openEditModal(selectedUser)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
              >
                <Edit2 size={14} /> Edit
              </button>
              {selectedUser.status === 'active' && (
                <button
                  onClick={() => {
                    updateUserStatus(selectedUser.id, 'inactive');
                    closeDetailModal();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm flex items-center gap-1"
                >
                  <Ban size={14} /> Suspend
                </button>
              )}
              {selectedUser.status === 'inactive' && (
                <button
                  onClick={() => {
                    updateUserStatus(selectedUser.id, 'active');
                    closeDetailModal();
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm flex items-center gap-1"
                >
                  <Check size={14} /> Activate
                </button>
              )}
              <button
                onClick={() => {
                  deleteUser(selectedUser.id);
                  closeDetailModal();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm flex items-center gap-1"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render edit modal
  const renderEditModal = () => {
    if (!editUserData || !showEditModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="absolute inset-0" onClick={closeEditModal}></div>
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
          <button 
            onClick={closeEditModal}
            className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-lg transition-colors z-10"
          >
            <X size={24} className="text-gray-500 hover:text-gray-700" />
          </button>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
                {editUserData.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Edit User</h2>
                <p className="text-blue-100 text-sm">Update user information</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <form onSubmit={(e) => { e.preventDefault(); saveUserEdit(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={editUserData.name || ''}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={editUserData.email || ''}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={editUserData.phone || ''}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                  <select
                    name="role"
                    value={editUserData.role || ''}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                    required
                  >
                    <option value="client">👤 Client</option>
                    <option value="admin">🛡️ Admin</option>
                    <option value="super_admin">👑 Super Admin</option>
                    <option value="fleet_manager">📋 Fleet Manager</option>
                    <option value="car_owner">🚗 Car Owner</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    name="status"
                    value={editUserData.status || 'active'}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                  >
                    <option value="active">✅ Active</option>
                    <option value="inactive">❌ Inactive</option>
                    <option value="pending">⏳ Pending</option>
                    <option value="suspended">⛔ Suspended</option>
                  </select>
                </div>

                {editUserData.isCarOwner && (
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
                    <p className="text-xs text-amber-700 flex items-center gap-1">
                      <Car size={14} /> This user is a Car Owner
                    </p>
                    {editUserData.carOwnerData?.businessName && (
                      <p className="text-xs text-gray-600 mt-1">
                        Business: {editUserData.carOwnerData.businessName}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // User Table Row Component
  const UserRow = ({ user }) => {
    const roleBadge = getRoleBadge(user.role);
    const statusBadge = getStatusBadge(user.status);
    const RoleIcon = roleBadge.icon;
    const isExpanded = expandedUserId === user.id;

    const handleRowClick = (e) => {
      if (e.target.closest('button')) return;
      setExpandedUserId(isExpanded ? null : user.id);
    };

    const handleViewDetails = (e) => {
      e.stopPropagation();
      setSelectedUser(user);
      setShowDetailModal(true);
    };

    const handleEdit = (e) => {
      e.stopPropagation();
      openEditModal(user);
    };

    const handleUpdateStatus = (e, userId, status) => {
      e.stopPropagation();
      updateUserStatus(userId, status);
    };

    const handleDelete = (e, userId) => {
      e.stopPropagation();
      deleteUser(userId);
    };

    const handleApprove = (e, userId) => {
      e.stopPropagation();
      approveCarOwner(userId);
    };

    return (
      <>
        <tr className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={handleRowClick}>
          <td className="px-3 py-3 whitespace-nowrap">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-800">{user.name}</p>
                <p className="text-xs text-gray-400 truncate max-w-[150px]">{user.email}</p>
              </div>
            </div>
          </td>
          <td className="px-3 py-3 whitespace-nowrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${roleBadge.color} flex items-center gap-1 w-fit`}>
              <RoleIcon size={12} /> {roleBadge.label}
            </span>
          </td>
          <td className="px-3 py-3 whitespace-nowrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          </td>
          <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">
            {user.phone || 'N/A'}
          </td>
          <td className="px-3 py-3 text-center text-xs text-gray-600">
  {user.lastLogin ? (
    new Date(user.lastLogin).toLocaleString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  ) : (
    <span className="text-gray-400">Never</span>
  )}
</td>
          <td className="px-3 py-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <button
                onClick={handleViewDetails}
                className="p-1 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                title="View Details"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={handleEdit}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit User"
              >
                <Edit2 size={16} />
              </button>
            </div>
          </td>
        </tr>
        {isExpanded && (
          <tr>
            <td colSpan="6" className="px-4 py-3 bg-gray-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400">User ID</p>
                  <p className="font-mono text-xs break-all">{user.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <p className="font-medium break-all">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <p className="font-medium">{user.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Tenant</p>
                  <p className="font-medium">{user.tenantName || 'N/A'}</p>
                </div>
                {user.isCarOwner && user.carOwnerData?.businessName && (
                  <div>
                    <p className="text-xs text-gray-400">Business Name</p>
                    <p className="font-medium">{user.carOwnerData.businessName}</p>
                  </div>
                )}
                <div className="flex gap-2 col-span-2 flex-wrap">
                  <button
                    onClick={handleViewDetails}
                    className="px-3 py-1 text-xs text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  >
                    <Eye size={14} className="inline mr-1" /> View Details
                  </button>
                  <button
                    onClick={handleEdit}
                    className="px-3 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit2 size={14} className="inline mr-1" /> Edit
                  </button>
                  {user.status === 'active' && (
                    <button
                      onClick={(e) => handleUpdateStatus(e, user.id, 'inactive')}
                      className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Ban size={14} className="inline mr-1" /> Suspend
                    </button>
                  )}
                  {user.status === 'inactive' && (
                    <button
                      onClick={(e) => handleUpdateStatus(e, user.id, 'active')}
                      className="px-3 py-1 text-xs text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Check size={14} className="inline mr-1" /> Activate
                    </button>
                  )}
                  {user.carOwnerStatus === 'pending_approval' && (
                    <button
                      onClick={(e) => handleApprove(e, user.id)}
                      className="px-3 py-1 text-xs text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <Check size={14} className="inline mr-1" /> Approve Owner
                    </button>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, user.id)}
                    className="px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={14} className="inline mr-1" /> Delete
                  </button>
                </div>
              </div>
            </td>
          </tr>
        )}
      </>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-sm">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {renderUserDetailModal()}

      {/* Edit Modal */}
      {renderEditModal()}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users size={28} className="text-blue-600" />
            Users Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage all users across the platform
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={loadData}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={() => setActiveTab('register')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
          >
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-7 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">👑 Admins</p>
          <p className="text-xl font-bold text-purple-600">{stats.admins}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">📋 Fleet Mgrs</p>
          <p className="text-xl font-bold text-indigo-600">{stats.fleetManagers}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">👤 Clients</p>
          <p className="text-xl font-bold text-green-600">{stats.clients}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">🚗 Car Owners</p>
          <p className="text-xl font-bold text-amber-600">{stats.carOwners}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">✅ Active</p>
          <p className="text-xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-3 text-center">
          <p className="text-xs text-gray-400">⏳ Pending</p>
          <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Roles</option>
              <option value="super_admin">👑 Super Admin</option>
              <option value="admin">🛡️ Admin</option>
              <option value="fleet_manager">📋 Fleet Manager</option>
              <option value="client">👤 Client</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="active">✅ Active</option>
              <option value="inactive">❌ Inactive</option>
              <option value="pending">⏳ Pending</option>
              <option value="suspended">⛔ Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No users found</p>
          <p className="text-sm text-gray-400">
            {searchTerm || filterRole !== 'all' || filterStatus !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'No users registered yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Role</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Phone</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Last Login</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => (
                  <UserRow key={user.id} user={user} />
                ))}
              </tbody>
            </table>
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

export default UsersManagement;