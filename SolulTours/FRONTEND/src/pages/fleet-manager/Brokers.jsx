import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, Edit2, Trash2, X, Save,
  AlertCircle, CheckCircle, Eye, RefreshCw,
  UserCheck, UserX, Key, Phone, Mail, Calendar,
  DollarSign, TrendingUp, Lock, Unlock, Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { brokerService, bookingService } from '../../services/api';

const Brokers = ({ setActiveTab }) => {
  const { currentUser } = useAuth();
  const [brokers, setBrokers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [notification, setNotification] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDetailDrawer, setShowDetailDrawer] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState(null);
  const [editingBroker, setEditingBroker] = useState(null);

  // Form
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: ''
  });
  const [newPassword, setNewPassword] = useState('');

  // Detail drawer data
  const [brokerBookings, setBrokerBookings] = useState([]);
  const [brokerStats, setBrokerStats] = useState({
    totalBookings: 0, totalRevenue: 0, totalOutstanding: 0
  });

  const tenantId = currentUser?.tenantId;

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadBrokers = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const response = await brokerService.getAll(tenantId);
      if (response?.success && response?.data) {
        setBrokers(response.data);
      }
    } catch (err) {
      console.error('Failed to load brokers:', err);
      showNotification('Failed to load brokers', 'error');
    }
    setLoading(false);
  }, [tenantId]);

  useEffect(() => { loadBrokers(); }, [loadBrokers]);

  const handleAdd = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      showNotification('Name, email and password are required', 'error');
      return;
    }
    try {
      const response = await brokerService.create({
        ...formData,
        tenantId
      });
      if (response?.success) {
        showNotification('✅ Broker added successfully');
        setShowAddModal(false);
        setFormData({ name: '', email: '', phone: '', password: '' });
        loadBrokers();
      } else {
        showNotification(response?.message || 'Failed to add broker', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to add broker', 'error');
    }
  };

  const handleEdit = async () => {
    if (!editingBroker) return;
    try {
      const response = await brokerService.update(editingBroker.id, {
        name: formData.name,
        phone: formData.phone
      });
      if (response?.success) {
        showNotification('✅ Broker updated');
        setShowEditModal(false);
        setEditingBroker(null);
        loadBrokers();
      } else {
        showNotification(response?.message || 'Failed to update', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update', 'error');
    }
  };

  const handleToggleStatus = async (broker) => {
    const newStatus = broker.status === 'active' ? 'suspended' : 'active';
    try {
      const response = await brokerService.updateStatus(broker.id, newStatus);
      if (response?.success) {
        showNotification(`✅ Broker ${newStatus === 'active' ? 'activated' : 'suspended'}`);
        loadBrokers();
      } else {
        showNotification(response?.message || 'Failed to update status', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to update status', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedBroker) return;
    try {
      const response = await brokerService.delete(selectedBroker.id);
      if (response?.success) {
        showNotification('✅ Broker deleted');
        setShowDeleteModal(false);
        setSelectedBroker(null);
        loadBrokers();
      } else {
        showNotification(response?.message || 'Failed to delete', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to delete', 'error');
    }
  };

  const handleResetPassword = async () => {
    if (!selectedBroker || !newPassword || newPassword.length < 6) {
      showNotification('Password must be at least 6 characters', 'error');
      return;
    }
    try {
      const response = await brokerService.resetPassword(selectedBroker.id, newPassword);
      if (response?.success) {
        showNotification('✅ Password reset');
        setShowPasswordModal(false);
        setNewPassword('');
        setSelectedBroker(null);
      } else {
        showNotification(response?.message || 'Failed to reset password', 'error');
      }
    } catch (err) {
      showNotification(err.message || 'Failed to reset password', 'error');
    }
  };

  const openEditModal = (broker) => {
    setEditingBroker(broker);
    setFormData({
      name: broker.name || '',
      email: broker.email || '',
      phone: broker.phone || '',
      password: ''
    });
    setShowEditModal(true);
  };

  const openDetailDrawer = async (broker) => {
    setSelectedBroker(broker);
    setShowDetailDrawer(true);
    setBrokerBookings([]);
    setBrokerStats({ totalBookings: 0, totalRevenue: 0, totalOutstanding: 0 });
    try {
      const response = await bookingService.getByUser(broker.id);
      if (response?.success && response?.data) {
        const bookings = response.data;
        setBrokerBookings(bookings.slice(0, 10));
        setBrokerStats({
          totalBookings: bookings.length,
          totalRevenue: bookings.reduce((s, b) => s + (b.totalPrice || 0), 0),
          totalOutstanding: bookings.reduce((s, b) => s + (b.remainingBalance || 0), 0)
        });
      }
    } catch (err) {
      console.error('Failed to load broker bookings:', err);
    }
  };

  const fmt = (n) => `KSh ${(n || 0).toLocaleString()}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-KE', {
    year: 'numeric', month: 'short', day: 'numeric'
  }) : 'N/A';

  const getStatusBadge = (status) => {
    const map = {
      active: { label: 'Active', color: 'bg-green-100 text-green-800' },
      suspended: { label: 'Suspended', color: 'bg-red-100 text-red-800' },
      inactive: { label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' }
    };
    return map[status] || map.inactive;
  };

  const filtered = brokers.filter(b => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      b.name?.toLowerCase().includes(q) ||
      b.email?.toLowerCase().includes(q) ||
      b.phone?.includes(q);
    const matchStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalBrokers = brokers.length;
  const activeBrokers = brokers.filter(b => b.status === 'active').length;
  const suspendedBrokers = brokers.filter(b => b.status === 'suspended').length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {notification && (
        <div className={`fixed top-4 right-4 z-[60] px-4 py-3 rounded-lg shadow-lg flex items-center gap-2
          ${notification.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'}`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-sm">{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="ml-2">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Brokers</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage sales agents who book on behalf of clients
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadBrokers}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => {
              setFormData({ name: '', email: '', phone: '', password: '' });
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Add Broker
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <p className="text-xs text-gray-400">Total Brokers</p>
          <p className="text-2xl font-bold text-gray-800">{totalBrokers}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <p className="text-xs text-gray-400">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeBrokers}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <p className="text-xs text-gray-400">Suspended</p>
          <p className="text-2xl font-bold text-red-600">{suspendedBrokers}</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search brokers by name, email or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Broker List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading brokers...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Users size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No brokers found</p>
          <p className="text-sm text-gray-400">
            {searchQuery ? 'Try adjusting your search' : 'Add your first broker to get started'}
          </p>
          <button
            onClick={() => {
              setFormData({ name: '', email: '', phone: '', password: '' });
              setShowAddModal(true);
            }}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
          >
            <Plus size={16} className="inline mr-1" /> Add Broker
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Email</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Phone</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Created</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((broker) => {
                  const badge = getStatusBadge(broker.status);
                  return (
                    <tr key={broker.id} className="hover:bg-gray-50">
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                            <Users size={14} className="text-blue-600" />
                          </div>
                          <span className="font-medium text-gray-800">{broker.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-600">{broker.email}</td>
                      <td className="px-3 py-3 text-gray-600">{broker.phone || '—'}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-gray-500">{fmtDate(broker.createdAt)}</td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openDetailDrawer(broker)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                            title="View details"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => openEditModal(broker)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(broker)}
                            className={`p-1.5 rounded ${
                              broker.status === 'active'
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={broker.status === 'active' ? 'Suspend' : 'Activate'}
                          >
                            {broker.status === 'active' ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBroker(broker);
                              setNewPassword('');
                              setShowPasswordModal(true);
                            }}
                            className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="Reset password"
                          >
                            <Key size={14} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedBroker(broker);
                              setShowDeleteModal(true);
                            }}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== ADD MODAL ===== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <Plus size={20} />
                <h2 className="text-lg font-semibold">Add Broker</h2>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/20 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="broker@example.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="+254 700 000 000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t rounded-b-xl flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
              >
                <Save size={16} /> Add Broker
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && editingBroker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowEditModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between text-white rounded-t-xl">
              <div className="flex items-center gap-3">
                <Edit2 size={20} />
                <h2 className="text-lg font-semibold">Edit Broker</h2>
              </div>
              <button onClick={() => setShowEditModal(false)} className="p-1 hover:bg-white/20 rounded">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Email (cannot be changed)</label>
                <input
                  type="email"
                  value={formData.email}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-100 cursor-not-allowed"
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="px-6 py-3 bg-gray-50 border-t rounded-b-xl flex justify-end gap-2">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE MODAL ===== */}
      {showDeleteModal && selectedBroker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Delete Broker?</h2>
              <p className="text-sm text-gray-500 mt-1">
                Are you sure you want to delete <strong>{selectedBroker.name}</strong>? This cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== PASSWORD MODAL ===== */}
      {showPasswordModal && selectedBroker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowPasswordModal(false)}></div>
          <div className="relative bg-white rounded-xl w-full max-w-md p-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Key size={24} className="text-yellow-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Reset Password</h2>
              <p className="text-sm text-gray-500 mt-1">
                Set a new password for <strong>{selectedBroker.name}</strong>
              </p>
            </div>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4"
              placeholder="New password (min 6 characters)"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleResetPassword}
                className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 text-sm"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DETAIL DRAWER ===== */}
      {showDetailDrawer && selectedBroker && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDetailDrawer(false)}></div>
          <div className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between text-white z-10">
              <div>
                <h2 className="text-lg font-semibold">{selectedBroker.name}</h2>
                <p className="text-xs text-blue-100">{selectedBroker.email}</p>
              </div>
              <button
                onClick={() => setShowDetailDrawer(false)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Broker Info */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-4">
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="text-sm font-medium">{selectedBroker.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusBadge(selectedBroker.status).color}`}>
                    {getStatusBadge(selectedBroker.status).label}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm">{selectedBroker.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm">{selectedBroker.phone || '—'}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <Calendar size={16} className="mx-auto text-blue-500 mb-1" />
                  <p className="text-lg font-bold text-gray-800">{brokerStats.totalBookings}</p>
                  <p className="text-[10px] text-gray-500">Bookings</p>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <DollarSign size={16} className="mx-auto text-green-500 mb-1" />
                  <p className="text-lg font-bold text-gray-800">{fmt(brokerStats.totalRevenue)}</p>
                  <p className="text-[10px] text-gray-500">Revenue</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <Wallet size={16} className="mx-auto text-red-500 mb-1" />
                  <p className="text-lg font-bold text-gray-800">{fmt(brokerStats.totalOutstanding)}</p>
                  <p className="text-[10px] text-gray-500">Outstanding</p>
                </div>
              </div>

              {/* Recent bookings */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Recent Bookings (last 10)</h3>
                {brokerBookings.length === 0 ? (
                  <p className="text-xs text-gray-400 py-3 text-center">No bookings yet</p>
                ) : (
                  <div className="space-y-1.5">
                    {brokerBookings.map((b) => (
                      <div key={b.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-700 truncate">{b.customerName}</p>
                          <p className="text-[10px] text-gray-400">{b.reference} · {b.serviceType?.replace('_', ' ')}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="font-semibold text-blue-600">{fmt(b.totalPrice)}</p>
                          <p className={`text-[10px] ${
                            b.status === 'completed' ? 'text-green-600' :
                            b.status === 'cancelled' ? 'text-red-600' :
                            'text-yellow-600'
                          }`}>{b.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Brokers;