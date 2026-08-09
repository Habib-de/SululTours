import React, { useState, useEffect } from 'react';
import { 
    Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, User, Phone, 
    Shield, Building, CheckCircle, ChevronRight, ChevronLeft, Clock 
} from 'lucide-react';
import api from '../services/api';

const Register = ({ onNavigate }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [tenants, setTenants] = useState([]);
    const [loadingTenants, setLoadingTenants] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        role: 'client',
        tenantId: '',
        subdomain: '',
        companyName: '',
        adminKey: '',
        idNumber: '',
        address: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const ADMIN_SECRET_KEY = 'sulul_admin_2026';

    // Load tenants from API
    useEffect(() => {
        if (formData.role === 'car_owner' || formData.role === 'fleet_manager') {
            loadTenants();
        }
    }, [formData.role]);

    const loadTenants = async () => {
        setLoadingTenants(true);
        try {
            const response = await api.tenant.getAll();
            if (response.success && response.data) {
                let tenantList = response.data;
                if (formData.role === 'car_owner') {
                    tenantList = tenantList.filter(t => t.status === 'active');
                }
                setTenants(tenantList);
            }
        } catch (err) {
            console.error('Error loading tenants:', err);
            // Fallback to localStorage if API fails
            try {
                const storedTenants = JSON.parse(localStorage.getItem('travel_agency_tenants') || '[]');
                let tenantList = storedTenants;
                if (formData.role === 'car_owner') {
                    tenantList = tenantList.filter(t => t.status === 'active');
                }
                setTenants(tenantList);
            } catch (e) {
                setTenants([]);
            }
        }
        setLoadingTenants(false);
    };

    const validateStep = () => {
        if (currentStep === 1) {
            if (!formData.name.trim()) {
                setError('Full name is required');
                return false;
            }
            if (!formData.email.trim()) {
                setError('Email is required');
                return false;
            }
            if (!formData.phone.trim()) {
                setError('Phone number is required');
                return false;
            }
            return true;
        }
        
        if (currentStep === 2) {
            if (!formData.password) {
                setError('Password is required');
                return false;
            }
            if (formData.password.length < 6) {
                setError('Password must be at least 6 characters');
                return false;
            }
            if (formData.password !== formData.confirmPassword) {
                setError('Passwords do not match');
                return false;
            }
            return true;
        }
        
        if (currentStep === 3) {
            if (formData.role === 'fleet_manager') {
                if (!formData.subdomain.trim()) {
                    setError('Subdomain is required for Fleet Manager');
                    return false;
                }
                if (!formData.companyName) {
                    setError('Company name is required for Fleet Manager');
                    return false;
                }
                const existingTenant = tenants.find(t => t.subdomain === formData.subdomain.toLowerCase());
                if (existingTenant) {
                    setError('Subdomain already exists. Please choose a different one.');
                    return false;
                }
            }
            if (formData.role === 'car_owner') {
                if (!formData.tenantId) {
                    setError('Please select a company/fleet manager');
                    return false;
                }
                if (formData.idNumber && formData.idNumber.length < 5) {
                    setError('ID Number must be at least 5 characters');
                    return false;
                }
            }
            if (formData.role === 'super_admin') {
                if (!formData.adminKey || formData.adminKey !== ADMIN_SECRET_KEY) {
                    setError('❌ Invalid admin registration key');
                    return false;
                }
            }
            return true;
        }
        return true;
    };

    const handleNext = () => {
        setError('');
        if (validateStep()) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(currentStep - 1);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            // ✅ For client role, get the default tenant ID
            let defaultTenantId = null;
            
            if (formData.role === 'client') {
                try {
                    // Try to get tenant from API
                    const tenantsResponse = await api.tenant.getAll();
                    if (tenantsResponse.success && tenantsResponse.data) {
                        // Find the default tenant (Sulul Tours)
                        const defaultTenant = tenantsResponse.data.find(t => 
                            t.status === 'active' && t.subdomain === 'sulul'
                        );
                        defaultTenantId = defaultTenant?.id || tenantsResponse.data[0]?.id || null;
                    }
                } catch (err) {
                    console.error('Error fetching default tenant:', err);
                    // Fallback: try localStorage
                    try {
                        const storedTenants = JSON.parse(localStorage.getItem('travel_agency_tenants') || '[]');
                        const defaultTenant = storedTenants.find(t => t.status === 'active' && t.subdomain === 'sulul');
                        defaultTenantId = defaultTenant?.id || storedTenants[0]?.id || null;
                    } catch (e) {
                        console.error('Error loading tenants from localStorage:', e);
                    }
                }
            }

            // Prepare registration data
            const registerData = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                role: formData.role,
                subdomain: formData.role === 'fleet_manager' ? formData.subdomain : null,
                // ✅ For clients, assign the default tenant ID
                tenantId: formData.role === 'car_owner' ? formData.tenantId : 
                           formData.role === 'client' ? defaultTenantId : null,
                companyName: formData.companyName || null,
                adminKey: formData.adminKey || null,
            };

            console.log('📤 Registration data:', registerData);

            // Call registration API
            const response = await api.auth.register(registerData);

            if (response.success) {
                // Show success message based on role
                if (formData.role === 'car_owner') {
                    setSuccess('✅ Registration submitted! Please wait for Fleet Manager approval.');
                } else if (formData.role === 'fleet_manager') {
                    setSuccess('✅ Company registration submitted! Please wait for Super Admin approval before you can login.');
                } else if (formData.role === 'super_admin') {
                    setSuccess('✅ Super Admin account created successfully!');
                } else {
                    setSuccess('✅ Account created successfully! You can now login.');
                }

                // Navigate to login after 3 seconds
                setTimeout(() => {
                    onNavigate('login');
                }, 3000);
            } else {
                setError(response.message || 'Registration failed. Please try again.');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const steps = [
        { id: 1, label: 'Personal Info', icon: User },
        { id: 2, label: 'Security', icon: Lock },
        { id: 3, label: 'Account', icon: Shield },
    ];

    return (
        <div className="h-screen w-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 flex items-center justify-center p-3 overflow-hidden fixed inset-0">
            <div className="w-full max-w-sm h-full max-h-[650px] flex items-center">
                <div className="w-full bg-white rounded-2xl shadow-xl border border-amber-300/50 overflow-hidden">
                    {/* HEADER - WHITE WITH LOGO */}
                    <div className="bg-white px-4 py-3 text-center border-b border-gray-200 relative">
                        <button
                            onClick={() => onNavigate('login')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div className="flex justify-center">
                            <img 
                                src="/lg1.png" 
                                alt="Sulul Tours Logo" 
                                className="w-full max-w-[80px] h-auto object-contain mx-auto"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        </div>
                        <div className="mt-0.5">
                            <p className="text-gray-500 text-[10px] mt-0.5 font-medium tracking-wide">
                                Travel &amp; Tours Management System
                            </p>
                        </div>
                    </div>

                    {/* Guest Booking Notice */}
                    <div className="px-4 pt-2">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-1.5 text-center">
                            <p className="text-[9px] text-green-700">
                                🎉 <span className="font-medium">Book without registering!</span> 
                                {' '}<button 
                                    onClick={() => onNavigate('guest-booking')}
                                    className="text-green-600 underline hover:text-green-800 font-medium"
                                >
                                    Continue as Guest
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Step Progress */}
                    <div className="px-4 pt-2">
                        <div className="flex items-center justify-between">
                            {steps.map((step, index) => (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center">
                                        <div 
                                            className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                                                currentStep === step.id 
                                                    ? 'bg-amber-600 text-white ring-4 ring-amber-100' 
                                                    : currentStep > step.id 
                                                        ? 'bg-green-500 text-white' 
                                                        : 'bg-gray-200 text-gray-500'
                                            }`}
                                        >
                                            {currentStep > step.id ? <CheckCircle size={14} /> : step.id}
                                        </div>
                                        <span className={`text-[7px] mt-0.5 font-medium ${
                                            currentStep === step.id ? 'text-amber-600' : 'text-gray-400'
                                        }`}>
                                            {step.label}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className={`flex-1 h-0.5 mx-0.5 ${
                                            currentStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                                        }`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                    </div>

                    {/* Form Section */}
                    <div className="p-4 overflow-y-auto max-h-[400px]">
                        <div className="text-center mb-2">
                            <h2 className="text-xs font-semibold text-gray-800">
                                Step {currentStep} of 3: {steps[currentStep - 1].label}
                            </h2>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-2.5">
                            {/* STEP 1 */}
                            {currentStep === 1 && (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Full Name *</label>
                                        <div className="relative">
                                            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                className="w-full pl-9 pr-3 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-gray-50/50 hover:bg-white focus:bg-white text-sm"
                                                placeholder="Enter your full name"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Email Address *</label>
                                        <div className="relative">
                                            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                className="w-full pl-9 pr-3 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-gray-50/50 hover:bg-white focus:bg-white text-sm"
                                                placeholder="Enter your email"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Phone Number *</label>
                                        <div className="relative">
                                            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                className="w-full pl-9 pr-3 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-gray-50/50 hover:bg-white focus:bg-white text-sm"
                                                placeholder="Enter your phone number"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 transition-colors flex items-center justify-center gap-2 text-sm"
                                    >
                                        Next Step <ChevronRight size={15} />
                                    </button>
                                </>
                            )}

                            {/* STEP 2 */}
                            {currentStep === 2 && (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Password *</label>
                                        <div className="relative">
                                            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                value={formData.password}
                                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                                className="w-full pl-9 pr-10 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-gray-50/50 hover:bg-white focus:bg-white text-sm"
                                                placeholder="Min 6 characters"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Confirm Password *</label>
                                        <div className="relative">
                                            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                                className="w-full pl-9 pr-10 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-gray-50/50 hover:bg-white focus:bg-white text-sm"
                                                placeholder="Confirm your password"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={handleBack}
                                            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <ChevronLeft size={15} /> Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleNext}
                                            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            Next Step <ChevronRight size={15} />
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* STEP 3 */}
                            {currentStep === 3 && (
                                <>
                                    <div>
                                        <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Account Type *</label>
                                        <div className="relative">
                                            <Shield size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <select
                                                value={formData.role}
                                                onChange={(e) => setFormData({...formData, role: e.target.value})}
                                                className="w-full pl-9 pr-3 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-gray-50/50 hover:bg-white focus:bg-white text-sm"
                                            >
                                                <option value="client">Client (Book Services)</option>
                                                <option value="car_owner">Car Owner</option>
                                                <option value="fleet_manager">Fleet Manager</option>
                                                <option value="super_admin">Super Admin</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Role Description */}
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-200">
                                        <p className="text-[9px] text-gray-600">
                                            {formData.role === 'client' && '📱 Book tours, hotels, flights & car hire services'}
                                            {formData.role === 'car_owner' && '🚗 Own vehicles and earn from bookings — Requires Fleet Manager approval'}
                                            {formData.role === 'fleet_manager' && '🏢 Manage all vehicles, services & fleet operations — Requires Super Admin approval'}
                                            {formData.role === 'super_admin' && '👑 Full system control - manage users, services & analytics'}
                                        </p>
                                    </div>

                                    {/* ✅ CLIENT - Show info about joining Sulul Tours */}
                                    {formData.role === 'client' && (
                                        <div className="space-y-2 p-3 rounded-lg border border-green-100 bg-green-50">
                                            <p className="text-[10px] font-medium text-green-700">📱 Client Registration</p>
                                            <div className="bg-green-100 border border-green-200 rounded-lg p-1.5">
                                                <p className="text-[8px] text-green-700">
                                                    ✅ You will be registered under <strong>Sulul Tours</strong> and can book all available services.
                                                </p>
                                            </div>
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-1.5">
                                                <p className="text-[8px] text-blue-700">
                                                    ℹ️ You will be able to book car hire, tours, hotels, flights and more.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* CAR OWNER - Select Tenant from dropdown */}
                                    {formData.role === 'car_owner' && (
                                        <div className="space-y-2 p-3 rounded-lg border border-blue-100 bg-blue-50">
                                            <p className="text-[10px] font-medium text-blue-700">🚗 Car Owner Registration</p>
                                            
                                            {/* Approval Notice */}
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-1.5">
                                                <p className="text-[8px] text-yellow-700 flex items-center gap-1">
                                                    <Clock size={12} /> ⏳ Registration requires approval from Fleet Manager before you can login.
                                                </p>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                                                    Select Fleet Manager / Company *
                                                </label>
                                                <div className="relative">
                                                    <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <select
                                                        value={formData.tenantId}
                                                        onChange={(e) => {
                                                            const selectedTenantId = e.target.value;
                                                            const selectedTenant = tenants.find(t => t.id === selectedTenantId);
                                                            setFormData({
                                                                ...formData,
                                                                tenantId: selectedTenantId,
                                                                companyName: selectedTenant ? selectedTenant.name : ''
                                                            });
                                                        }}
                                                        className="w-full pl-9 pr-3 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-sm"
                                                        required
                                                    >
                                                        <option value="">Select a company...</option>
                                                        {loadingTenants ? (
                                                            <option disabled>Loading companies...</option>
                                                        ) : tenants.length === 0 ? (
                                                            <option disabled>No companies registered yet</option>
                                                        ) : (
                                                            tenants.map(tenant => (
                                                                <option key={tenant.id} value={tenant.id}>
                                                                    {tenant.name} ({tenant.subdomain})
                                                                </option>
                                                            ))
                                                        )}
                                                    </select>
                                                </div>
                                                {tenants.length === 0 && !loadingTenants && (
                                                    <p className="text-[8px] text-amber-600 mt-0.5">
                                                        ⚠️ No companies registered yet. Please contact a Fleet Manager to register first.
                                                    </p>
                                                )}
                                            </div>

                                            {/* Company Name - Auto-filled from selected tenant */}
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Company Name</label>
                                                <div className="relative">
                                                    <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={formData.companyName}
                                                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                                        className="w-full pl-9 pr-3 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-gray-100 text-sm text-gray-700"
                                                        placeholder="Auto-filled from selected company"
                                                        readOnly
                                                    />
                                                </div>
                                                <p className="text-[8px] text-gray-400 mt-0.5">
                                                    ℹ️ Company name is automatically filled from your selection
                                                </p>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">ID Number (Optional)</label>
                                                <div className="relative">
                                                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={formData.idNumber}
                                                        onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                                                        className="w-full pl-9 pr-3 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-sm"
                                                        placeholder="e.g., 12345678"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Address (Optional)</label>
                                                <div className="relative">
                                                    <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={formData.address}
                                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                                        className="w-full pl-9 pr-3 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-sm"
                                                        placeholder="e.g., Nairobi, Kenya"
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-blue-100 border border-blue-200 rounded-lg p-1.5">
                                                <p className="text-[8px] text-blue-700">
                                                    ℹ️ After approval, you will be able to add vehicles.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* FLEET MANAGER - Create New Tenant */}
                                    {formData.role === 'fleet_manager' && (
                                        <div className="space-y-2 p-3 rounded-lg border border-purple-100 bg-purple-50">
                                            <p className="text-[10px] font-medium text-purple-700">🏢 Create Your Company</p>
                                            
                                            {/* Subdomain input */}
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">
                                                    Subdomain *
                                                </label>
                                                <div className="relative">
                                                    <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={formData.subdomain}
                                                        onChange={(e) => setFormData({
                                                            ...formData, 
                                                            subdomain: e.target.value.toLowerCase().replace(/\s/g, '_')
                                                        })}
                                                        className="w-full pl-9 pr-3 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-sm"
                                                        placeholder="e.g., sulul_001"
                                                        required
                                                    />
                                                </div>
                                                <p className="text-[8px] text-gray-400 mt-0.5">
                                                    Unique subdomain for your company (e.g., sulul_001.sulultours.com)
                                                </p>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Company Name *</label>
                                                <div className="relative">
                                                    <Building size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="text"
                                                        value={formData.companyName}
                                                        onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                                        className="w-full pl-9 pr-3 py-1.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-sm"
                                                        placeholder="e.g., Sulul Tours & Travel"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="bg-purple-100 border border-purple-200 rounded-lg p-1.5">
                                                <p className="text-[8px] text-purple-700">
                                                    ℹ️ Car Owners will be able to register under your company and will need your approval.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Super Admin Registration */}
                                    {formData.role === 'super_admin' && (
                                        <div className="space-y-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                                            <p className="text-[10px] font-medium text-yellow-700 flex items-center gap-1">
                                                <Shield size={12} /> Super Admin Registration
                                            </p>
                                            <div>
                                                <label className="block text-[10px] font-medium text-gray-700 mb-0.5">Admin Registration Key *</label>
                                                <div className="relative">
                                                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                                    <input
                                                        type="password"
                                                        value={formData.adminKey}
                                                        onChange={(e) => setFormData({...formData, adminKey: e.target.value})}
                                                        className="w-full pl-9 pr-3 py-1.5 border-2 border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none bg-white text-sm"
                                                        placeholder="Enter admin registration key"
                                                        required
                                                    />
                                                </div>
                                                <p className="text-[8px] text-gray-400 mt-0.5">
                                                    ⚠️ Contact system administrator for the key
                                                </p>
                                            </div>
                                            <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-1.5">
                                                <p className="text-[8px] text-yellow-800">
                                                    ⚠️ Only ONE Super Admin account is allowed in the system.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {error && (
                                        <div className="flex items-center gap-2 p-1.5 bg-red-50 border border-red-200 rounded-lg">
                                            <AlertCircle size={12} className="text-red-500 flex-shrink-0" />
                                            <p className="text-[10px] text-red-600">{error}</p>
                                        </div>
                                    )}
                                    {success && (
                                        <div className="flex items-center gap-2 p-1.5 bg-green-50 border border-green-200 rounded-lg">
                                            <CheckCircle size={12} className="text-green-500 flex-shrink-0" />
                                            <p className="text-[10px] text-green-600">{success}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-1">
                                        <button
                                            type="button"
                                            onClick={handleBack}
                                            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <ChevronLeft size={15} /> Back
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 text-white py-2 rounded-lg font-semibold hover:from-amber-600 hover:to-orange-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 text-sm"
                                        >
                                            {isLoading ? (
                                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                            ) : (
                                                'Create Account'
                                            )}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>

                        <div className="mt-2 text-center">
                            <p className="text-xs text-gray-500">
                                Already have an account?{' '}
                                <button
                                    type="button"
                                    onClick={() => onNavigate('login')}
                                    className="text-amber-600 hover:text-amber-700 font-medium hover:underline"
                                >
                                    Sign In
                                </button>
                            </p>
                        </div>
                    </div>

                    <div className="text-center pb-2">
                        <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold sm:font-normal">
                            &copy; 2026 Sulul Tours &amp; Travel. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;