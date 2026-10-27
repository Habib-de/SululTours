import React, { useState, useEffect } from 'react';
import {
  Car, Plus, Search, Edit2, Trash2, X, Save, RefreshCw,
  AlertCircle, CheckCircle, Upload, Image, Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { vehicleService, carOwnerService } from '../../services/api';

const BrokerMyFleet = ({ setActiveTab }) => {
  const { currentUser } = useAuth();

  const [profile, setProfile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    registration: '', vin: '', make: '', model: '', year: '',
    color: '', category: '', status: 'active', mileage: '',
    location: '', custodian: '', insurance: '', permit: '',
    licenseExpiry: '', roadworthy: '', fuelType: '', engineSize: '',
    transmission: '', acquisitionDate: '', acquisitionCost: '',
    pricePerDay: '', seatingCapacity: '4', description: '', images: ''
  });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // ============================================
  // LOAD: get (or auto-create) broker's profile, then vehicles
  // ============================================
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get (or lazily create) the broker's own CarOwner profile
      const profileRes = await carOwnerService.getMyProfile();
      let myProfile = null;
      if (profileRes?.success && profileRes?.data) {
        myProfile = profileRes.data;
      } else if (profileRes?.id) {
        myProfile = profileRes;
      }

      if (!myProfile) {
        showNotification('Could not load your fleet profile', 'error');
        setLoading(false);
        return;
      }
      setProfile(myProfile);

            // 2. Load vehicles owned by this profile
      const vehiclesRes = await vehicleService.getByOwner(myProfile.id);
      let vehiclesData = [];
      if (vehiclesRes?.success && vehiclesRes?.data) {
        vehiclesData = vehiclesRes.data;
      } else if (Array.isArray(vehiclesRes)) {
        vehiclesData = vehiclesRes;
      }
    setVehicles(vehiclesData);
    } catch (err) {
      console.error('Error loading fleet:', err);
      showNotification('Failed to load your fleet', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser?.id) loadData();
  }, [currentUser?.id]);

  // ============================================
  // FORM
  // ============================================
  const resetForm = () => {
    setFormData({
      registration: '', vin: '', make: '', model: '', year: '',
      color: '', category: '', status: 'active', mileage: '',
      location: '', custodian: '', insurance: '', permit: '',
      licenseExpiry: '', roadworthy: '', fuelType: '', engineSize: '',
      transmission: '', acquisitionDate: '', acquisitionCost: '',
      pricePerDay: '', seatingCapacity: '4', description: '', images: ''
    });
    setImagePreview(null);
    setEditingVehicle(null);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setFormData((prev) => ({ ...prev, images: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const openCreateModal = () => {
    resetForm();
    setShowFormModal(true);
  };

  const openEditModal = (v) => {
    setEditingVehicle(v);
    setFormData({
      registration: v.registration || '',
      vin: v.vin || '',
      make: v.make || '',
      model: v.model || '',
      year: v.year || '',
      color: v.color || '',
      category: v.category || '',
      status: v.status || 'active',
      mileage: v.mileage || '',
      location: v.location || '',
      custodian: v.custodian || '',
      insurance: v.insurance || '',
      permit: v.permit || '',
      licenseExpiry: v.licenseExpiry || '',
      roadworthy: v.roadworthy || '',
      fuelType: v.fuelType || '',
      engineSize: v.engineSize || '',
      transmission: v.transmission || '',
      acquisitionDate: v.acquisitionDate || '',
      acquisitionCost: v.acquisitionCost || '',
      pricePerDay: v.pricePerDay || '',
      seatingCapacity: v.seatingCapacity || '4',
      description: v.description || '',
      images: v.images || ''
    });
    setImagePreview(v.images || null);
    setShowFormModal(true);
  };

  // ============================================
  // SUBMIT — do NOT send ownerId (backend auto-attaches)
  // ============================================
  const handleSubmit = async () => {
    if (!formData.registration || !formData.make || !formData.model) {
      showNotification('Registration, Make and Model are required', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        registration: formData.registration.toUpperCase(),
        vin: formData.vin,
        make: formData.make,
        model: formData.model,
        year: parseInt(formData.year) || null,
        color: formData.color,
        category: formData.category,
        status: formData.status || 'active',
        mileage: parseFloat(formData.mileage) || null,
        location: formData.location,
        custodian: formData.custodian,
        insurance: formData.insurance,
        permit: formData.permit,
        licenseExpiry: formData.licenseExpiry || null,
        roadworthy: formData.roadworthy || null,
        fuelType: formData.fuelType,
        engineSize: formData.engineSize,
        transmission: formData.transmission,
        acquisitionDate: formData.acquisitionDate || null,
        acquisitionCost: parseFloat(formData.acquisitionCost) || null,
        pricePerDay: parseFloat(formData.pricePerDay) || 0,
        seatingCapacity: parseInt(formData.seatingCapacity) || 4,
        description: formData.description,
        images: formData.images || null,
        // ✅ ownerId is omitted — backend auto-attaches broker's profile
        tenantId: currentUser?.tenantId
      };

      const response = editingVehicle
        ? await vehicleService.update(editingVehicle.id, payload)
        : await vehicleService.create(payload);

                  if (response?.success) {
        // ✅ Tell the sidebar to re-fetch from backend
        if (typeof window.refreshBrokerFleet === 'function') {
          window.refreshBrokerFleet();
        }
        showNotification(
          editingVehicle
            ? `✅ ${payload.registration} updated!`
            : `✅ ${payload.registration} added to your fleet!`
        );
        setShowFormModal(false);
        resetForm();
        loadData();
      } else {
        showNotification(response?.message || 'Failed to save vehicle', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to save vehicle', 'error');
    }
    setIsSubmitting(false);
  };

  const handleDeleteAttempt = () => {
    // Brokers cannot delete vehicles (backend restricts to FM/admin)
    showNotification(
      'Only a Fleet Manager can delete vehicles. Please contact your Fleet Manager.',
      'error'
    );
    setShowDeleteModal(false);
    setSelectedVehicle(null);
  };

  // ============================================
  // HELPERS
  // ============================================
  const filteredVehicles = vehicles.filter((v) => {
    const q = searchQuery.toLowerCase();
    return (
      !q ||
      v.registration?.toLowerCase().includes(q) ||
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.category?.toLowerCase().includes(q)
    );
  });

  const getStatusBadge = (status) => {
    const map = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      rented: 'bg-blue-100 text-blue-800'
    };
    return map[status] || 'bg-gray-100 text-gray-800';
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {notification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] px-4 py-3 rounded-lg shadow-2xl flex items-center gap-2 ${
          notification.type === 'error'
            ? 'bg-red-50 border border-red-200 text-red-700'
            : 'bg-green-50 border border-green-200 text-green-700'
        }`}>
          {notification.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
          <span className="text-sm font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-70 p-1">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Car size={28} className="text-amber-600" />
            My Fleet
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Vehicles you own as a broker — bookable through your account.
          </p>
          {profile && (
            <p className="text-xs text-amber-700 mt-1">
              👤 {profile.name} {profile.companyName ? `(${profile.companyName})` : ''} • {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Add Vehicle
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2 text-sm text-amber-800">
        <Info size={16} className="flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">How My Fleet works</p>
          <p className="text-xs mt-0.5">
            Vehicles you add here are owned by you <strong>and</strong> bookable via your broker account.
            Vehicle bookings you create for your own vehicles will still be attributed to you.
            Only a Fleet Manager can delete a vehicle.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search my vehicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm"
          />
        </div>
      </div>

      {/* Vehicle grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading your fleet...</div>
      ) : filteredVehicles.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
          <Car size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No vehicles in your fleet yet</p>
          <p className="text-sm text-gray-400">
            Add your first vehicle to start earning as an owner-broker.
          </p>
          <button
            onClick={openCreateModal}
            className="mt-3 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm"
          >
            <Plus size={16} className="inline mr-1" /> Add Vehicle
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((v) => (
            <div
              key={v.id}
              className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {v.images ? (
                      <img src={v.images} alt={v.registration} className="w-10 h-10 object-cover" />
                    ) : (
                      <Car size={20} className="text-amber-600" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{v.registration}</p>
                    <p className="text-xs text-gray-500 truncate">{v.make} {v.model}</p>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${getStatusBadge(v.status)} flex-shrink-0 ml-2`}>
                  {v.status}
                </span>
              </div>

              {v.images && (
                <div className="mt-2">
                  <img
                    src={v.images}
                    alt={v.registration}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-1 mt-3 text-xs text-gray-500">
                <div><span className="font-medium text-gray-600">Category:</span> {v.category || 'N/A'}</div>
                <div><span className="font-medium text-gray-600">Year:</span> {v.year || 'N/A'}</div>
                <div><span className="font-medium text-gray-600">Seats:</span> {v.seatingCapacity || 'N/A'}</div>
                <div><span className="font-medium text-gray-600">Fuel:</span> {v.fuelType || 'N/A'}</div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-600">Price/day:</span>{' '}
                  <span className="text-green-600 font-medium">
                    KSh {v.pricePerDay?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => openEditModal(v)}
                  className="flex-1 px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Edit2 size={14} /> Edit
                </button>
                <button
                  onClick={() => { setSelectedVehicle(v); setShowDeleteModal(true); }}
                  className="flex-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFormModal(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                {editingVehicle ? 'Edit Vehicle' : 'Add Vehicle to My Fleet'}
              </h2>
              <button
                onClick={() => { setShowFormModal(false); resetForm(); }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Image */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Vehicle Image</label>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <Image size={24} className="text-gray-400" />
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm text-gray-600">
                        <Upload size={16} /> Choose Image
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </div>
                    </label>
                    {imagePreview && (
                      <button
                        onClick={() => {
                          setImagePreview(null);
                          setFormData({ ...formData, images: '' });
                        }}
                        className="text-xs text-red-500 mt-1"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Basic fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Registration *</label>
                  <input
                    type="text"
                    value={formData.registration}
                    onChange={(e) => setFormData({ ...formData, registration: e.target.value.toUpperCase() })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="KCA 123A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">VIN</label>
                  <input
                    type="text"
                    value={formData.vin}
                    onChange={(e) => setFormData({ ...formData, vin: e.target.value.toUpperCase() })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Make *</label>
                  <input
                    type="text"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Toyota"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Model *</label>
                  <input
                    type="text"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="Land Cruiser"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                  <input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Color</label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select</option>
                    {['SUV', 'Sedan', 'Minibus', 'Luxury', 'Hatchback', 'Pickup', 'Van', 'Truck'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Seating Capacity</label>
                  <select
                    value={formData.seatingCapacity}
                    onChange={(e) => setFormData({ ...formData, seatingCapacity: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 16].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Transmission</label>
                  <select
                    value={formData.transmission}
                    onChange={(e) => setFormData({ ...formData, transmission: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select</option>
                    {['Automatic', 'Manual', 'CVT'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fuel Type</label>
                  <select
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Select</option>
                    {['Petrol', 'Diesel', 'Electric', 'Hybrid', 'LPG'].map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Mileage (km)</label>
                  <input
                    type="number"
                    value={formData.mileage}
                    onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Price/day (KES)</label>
                  <input
                    type="number"
                    value={formData.pricePerDay}
                    onChange={(e) => setFormData({ ...formData, pricePerDay: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                    placeholder="15000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                  >
                    {['active', 'inactive', 'maintenance', 'rented'].map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
                              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Nairobi"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Engine Size</label>
                <input
                  type="text"
                  value={formData.engineSize}
                  onChange={(e) => setFormData({ ...formData, engineSize: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="2.0L"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Custodian</label>
                <input
                  type="text"
                  value={formData.custodian}
                  onChange={(e) => setFormData({ ...formData, custodian: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Person responsible"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Insurance</label>
                <input
                  type="text"
                  value={formData.insurance}
                  onChange={(e) => setFormData({ ...formData, insurance: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="APA Insurance - Policy #123456"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Permit</label>
                <input
                  type="text"
                  value={formData.permit}
                  onChange={(e) => setFormData({ ...formData, permit: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="Permit number"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">License Expiry</label>
                <input
                  type="date"
                  value={formData.licenseExpiry}
                  onChange={(e) => setFormData({ ...formData, licenseExpiry: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Roadworthy</label>
                <input
                  type="date"
                  value={formData.roadworthy}
                  onChange={(e) => setFormData({ ...formData, roadworthy: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Acquisition Date</label>
                <input
                  type="date"
                  value={formData.acquisitionDate}
                  onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Acquisition Cost (KES)</label>
                <input
                  type="number"
                  value={formData.acquisitionCost}
                  onChange={(e) => setFormData({ ...formData, acquisitionCost: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  placeholder="1000000"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none"
                rows="2"
                placeholder="Vehicle description..."
              />
            </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 py-3 flex items-center justify-end gap-2">
              <button
                onClick={() => { setShowFormModal(false); resetForm(); }}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={16} />
                {isSubmitting ? 'Saving...' : (editingVehicle ? 'Update Vehicle' : 'Add Vehicle')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal (brokers can't delete — shows info) */}
      {showDeleteModal && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)} />
          <div className="relative bg-white rounded-xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-gray-800">Cannot Delete Vehicle</h2>
              <p className="text-sm text-gray-500 mt-1">
                Broker accounts cannot delete vehicles. Please contact your Fleet Manager to remove "{selectedVehicle.registration}".
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrokerMyFleet;