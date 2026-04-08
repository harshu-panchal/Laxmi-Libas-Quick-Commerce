import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, sendOTP, verifyOTP } from '../../../services/api/auth/sellerAuthService';
import OTPInput from '../../../components/OTPInput';
import { useAuth } from '../../../context/AuthContext';
import { getCategories, Category } from '../../../services/api/categoryService';
import { useEffect } from 'react';
import GoogleMapsLocationPicker from '../../../components/GoogleMapsLocationPicker';

export default function SellerSignUp() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    sellerName: '',
    mobile: '',
    email: '',
    storeName: '',
    category: '',
    categories: [] as string[],
    address: '',
    city: '',
    panCard: '',
    taxName: '',
    taxNumber: '',
    accountName: '',
    bankName: '',
    branch: '',
    accountNumber: '',
    ifsc: '',
    latitude: 0,
    longitude: 0,
  });
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dbCategories, setDbCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const res = await getCategories();
        if (res.success && Array.isArray(res.data)) {
          setDbCategories(res.data.filter(cat => cat.status === 'Active'));
        }
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCats();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'mobile') {
      setFormData(prev => ({
        ...prev,
        [name]: value.replace(/\D/g, '').slice(0, 10),
      }));
    } else if (name === 'serviceRadiusKm') {
      const cleanedValue = value.replace(/[^0-9.]/g, '');
      const parts = cleanedValue.split('.');
      const finalValue = parts.length > 2 ? `${parts[0]}.${parts[1]}` : cleanedValue;
      setFormData(prev => ({
        ...prev,
        [name]: finalValue,
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCategorySelect = (catId: string) => {
    setFormData(prev => ({
      ...prev,
      category: catId,
      categories: [catId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields (password removed - not needed during signup)
    if (!formData.sellerName) {
      setError('Please enter your name');
      return;
    }
    if (!formData.mobile) {
      setError('Please enter your mobile number');
      return;
    }
    if (!formData.email) {
      setError('Please enter your email address');
      return;
    }
    if (!formData.storeName) {
      setError('Please enter your store name');
      return;
    }
    if (!formData.category) {
      setError('Please select a category');
      return;
    }
    if (!formData.address) {
      setError('Please enter your store address');
      return;
    }
    if (formData.mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload documents first if provided
      let idProofUrl = '';
      let businessLicenseUrl = '';

      if (idProofFile || businessLicenseFile) {
        setUploadingDocs(true);
        try {
          if (idProofFile) {
            const formData = new FormData();
            formData.append('file', idProofFile);
            const uploadRes = await fetch('/api/v1/upload/single', {
              method: 'POST',
              body: formData,
            });
            const uploadData = await uploadRes.json();
            if (uploadData.success) {
              idProofUrl = uploadData.data.url;
            }
          }

          if (businessLicenseFile) {
            const formData = new FormData();
            formData.append('file', businessLicenseFile);
            const uploadRes = await fetch('/api/v1/upload/single', {
              method: 'POST',
              body: formData,
            });
            const uploadData = await uploadRes.json();
            if (uploadData.success) {
              businessLicenseUrl = uploadData.data.url;
            }
          }
        } catch (uploadErr) {
          console.error('Document upload error:', uploadErr);
          setError('Failed to upload documents. Please try again.');
          return;
        } finally {
          setUploadingDocs(false);
        }
      }

      const response = await register({
        sellerName: formData.sellerName,
        mobile: formData.mobile,
        email: formData.email,
        storeName: formData.storeName,
        category: formData.category,
        categories: [formData.category],
        address: formData.address,
        city: formData.city,
        idProof: idProofUrl,
        businessLicense: businessLicenseUrl,
        latitude: formData.latitude.toString(),
        longitude: formData.longitude.toString(),
      });

      if (response.success) {
        // Clear any stale auth data
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        // Show registration success screen — do NOT auto-login
        setRegistrationSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-yellow-50 flex flex-col items-center justify-center px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-10 w-10 h-10 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-neutral-50 transition-colors"
        aria-label="Back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Sign Up Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header Section */}
        <div className="px-6 py-4 text-center border-b border-yellow-700" style={{ backgroundColor: 'rgb(21 178 74 / var(--tw-bg-opacity, 1))' }}>
          <div className="mb-0 -mt-4">
            <img
              src="/assets/ChatGPT Image Feb 11, 2026, 01_01_14 PM.png"
              alt="LaxMart"
              className="h-44 w-full max-w-xs mx-auto object-fill object-bottom"
            />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1 -mt-12">Seller Sign Up</h1>
          <p className="text-yellow-50 text-sm -mt-2">Create your seller account</p>
        </div>

        {/* Sign Up Form */}
        <div className="p-6 space-y-4 seller-signup-form" style={{ maxHeight: '70vh', overflowY: 'auto', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style>{`
            .seller-signup-form::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {!registrationSuccess ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Required Fields Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-neutral-700 border-b pb-2">Required Information</h3>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Seller Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="sellerName"
                    value={formData.sellerName}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    required
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center bg-white border border-neutral-300 rounded-lg overflow-hidden focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-200">
                    <div className="px-3 py-2.5 text-sm font-medium text-neutral-600 border-r border-neutral-300 bg-neutral-50">
                      +91
                    </div>
                    <input
                      type="tel"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      placeholder="Enter mobile number"
                      required
                      maxLength={10}
                      className="flex-1 px-3 py-2.5 text-sm placeholder:text-neutral-400 focus:outline-none"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    required
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Store Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="storeName"
                    value={formData.storeName}
                    onChange={handleInputChange}
                    placeholder="Enter store name"
                    required
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Store Category <span className="text-red-500">*</span>
                  </label>
                  {dbCategories.length === 0 ? (
                    <div className="text-sm text-red-500 bg-red-50 p-3 rounded-lg border border-red-100 italic">
                      No categories available at the moment. Please contact admin.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-3 border border-neutral-200 rounded-lg bg-neutral-50 shadow-inner">
                      {dbCategories.map((cat) => {
                        const isSelected = formData.category === cat._id;
                        return (
                          <button
                            key={cat._id}
                            type="button"
                            onClick={() => handleCategorySelect(cat._id)}
                            disabled={loading}
                            className={`flex flex-col items-center justify-center p-3 border-2 rounded-xl transition-all duration-200 text-center ${isSelected
                              ? 'border-teal-500 bg-white shadow-md scale-[1.02]'
                              : 'border-neutral-200 bg-white hover:border-teal-200 hover:scale-[1.01]'
                              }`}
                          >
                            {cat.image && (
                              <img src={cat.image} alt={cat.name} className="w-10 h-10 object-contain mb-2" />
                            )}
                            <span className={`text-xs font-semibold ${isSelected ? 'text-teal-700' : 'text-neutral-700'}`}>
                              {cat.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {!formData.category && dbCategories.length > 0 && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      Category selection is required to proceed
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      ID Proof (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setError('File size must be less than 5MB');
                            e.target.value = '';
                            return;
                          }
                          setIdProofFile(file);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                      disabled={loading || uploadingDocs}
                    />
                    {idProofFile && (
                      <p className="text-xs text-primary-dark mt-1">✓ {idProofFile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">
                      Business License (Optional)
                    </label>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          if (file.size > 5 * 1024 * 1024) {
                            setError('File size must be less than 5MB');
                            e.target.value = '';
                            return;
                          }
                          setBusinessLicenseFile(file);
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                      disabled={loading || uploadingDocs}
                    />
                    {businessLicenseFile && (
                      <p className="text-xs text-primary-dark mt-1">✓ {businessLicenseFile.name}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    Store Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter store address"
                    required
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    required
                    className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    disabled={loading}
                  />
                </div>

                {/* Location Picker Section */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-neutral-700">
                      Pin Store Location <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition((pos) => {
                            setFormData(prev => ({
                              ...prev,
                              latitude: pos.coords.latitude,
                              longitude: pos.coords.longitude
                            }));
                            setShowMap(true);
                          });
                        } else {
                          setShowMap(true);
                        }
                      }}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700 px-3 py-1 bg-teal-50 rounded-full border border-teal-100"
                    >
                      {formData.latitude ? '📍 Location Pinned' : '📍 Auto-Detect Location'}
                    </button>
                  </div>
                  
                  {!showMap && !formData.latitude && (
                     <button
                        type="button"
                        onClick={() => setShowMap(true)}
                        className="w-full py-6 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-500 text-sm hover:border-teal-500 hover:text-teal-600 transition-all flex flex-col items-center justify-center gap-2"
                     >
                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                         <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                         <circle cx="12" cy="10" r="3" />
                       </svg>
                       <span>Tap to select location on Map</span>
                     </button>
                  )}

                  {showMap && (
                    <div className="space-y-4">
                      <div className="h-64 rounded-xl overflow-hidden ring-1 ring-neutral-200">
                        <GoogleMapsLocationPicker
                          initialLat={formData.latitude || 26.9124}
                          initialLng={formData.longitude || 75.7873}
                          height="256px"
                          onLocationSelect={(lat, lng, address) => {
                            setFormData(prev => ({
                              ...prev,
                              latitude: lat,
                              longitude: lng,
                              address: address?.street ? `${address.street}, ${address.landmark || ''}` : prev.address,
                              city: address?.city || prev.city
                            }));
                          }}
                        />
                      </div>
                      <p className="text-[10px] text-neutral-500 italic text-center">
                        Drag the map to pinpoint your exact store location
                      </p>
                    </div>
                  )}

                  {formData.latitude > 0 && (
                    <div className="grid grid-cols-2 gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-200 shadow-inner">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-neutral-400">Latitude</span>
                        <span className="text-xs font-medium text-neutral-700">{formData.latitude.toFixed(6)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-neutral-400">Longitude</span>
                        <span className="text-xs font-medium text-neutral-700">{formData.longitude.toFixed(6)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Fields Section */}
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold text-neutral-700 border-b pb-2">Optional Information</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">PAN Card</label>
                    <input
                      type="text"
                      name="panCard"
                      value={formData.panCard}
                      onChange={handleInputChange}
                      placeholder="PAN Card Number"
                      className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Tax Name</label>
                    <input
                      type="text"
                      name="taxName"
                      value={formData.taxName}
                      onChange={handleInputChange}
                      placeholder="Tax Name"
                      className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Tax Number</label>
                    <input
                      type="text"
                      name="taxNumber"
                      value={formData.taxNumber}
                      onChange={handleInputChange}
                      placeholder="Tax Number"
                      className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">IFSC Code</label>
                    <input
                      type="text"
                      name="ifsc"
                      value={formData.ifsc}
                      onChange={handleInputChange}
                      placeholder="IFSC Code"
                      className="w-full px-3 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${!loading
                  ? 'bg-teal-600 text-white hover:bg-teal-700 shadow-md'
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                  }`}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>

              {/* Login Link */}
              <div className="text-center pt-2 border-t border-neutral-200">
                <p className="text-sm text-neutral-600">
                  Already have a seller account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/seller/login')}
                    className="text-teal-600 hover:text-teal-700 font-semibold"
                  >
                    Login
                  </button>
                </p>
              </div>
            </form>
          ) : (
            /* Registration Success Screen */
            <div className="py-8 px-4 text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 animate-bounce">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-neutral-800">Registration Successful!</h2>
                <p className="text-neutral-600">Your seller account application has been submitted successfully.</p>
              </div>

              <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-left">
                <h3 className="text-teal-800 font-semibold text-sm mb-1 flex items-center gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  What Happens Next?
                </h3>
                <p className="text-teal-700 text-xs leading-relaxed">
                  Our admin team will review your application within 24-48 hours. Once approved, you'll receive a notification and you can start listing your products.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => navigate('/seller/login')}
                  className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-teal-700 transition-all transform hover:scale-[1.02]"
                >
                  Go to Login
                </button>
                <p className="mt-4 text-xs text-neutral-500 italic">
                  * You can login now to see your application status dashboard.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Text */}
      <p className="mt-6 text-xs text-neutral-500 text-center max-w-md">
        By continuing, you agree to LaxMart's Terms of Service and Privacy Policy
      </p>
    </div>
  );
}


