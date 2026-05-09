import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { register, sendOTP, verifyOTP } from '../../../services/api/auth/sellerAuthService';
import OTPInput from '../../../components/OTPInput';
import { useAuth } from '../../../context/AuthContext';
import { getCategories, Category } from '../../../services/api/categoryService';
import GoogleMapPicker from '../../../components/common/GoogleMapPicker';
import GoogleMapsAutocomplete, { AutocompleteResult } from '../../../components/GoogleMapsAutocomplete';
import { gsap } from 'gsap';
import { Smartphone, ArrowRight, ShieldCheck, ChevronLeft, Sparkles, MapPin, Upload, HelpCircle, FileText, Check, Briefcase, Mail, User, ShieldAlert } from 'lucide-react';

// Optimized Business Category Floating Assets
const BUSINESS_ASSETS = [
  { type: 'emoji', content: '📈' }, // growth
  { type: 'emoji', content: '📊' }, // statistics
  { type: 'emoji', content: '🏨' }, // hotel
  { type: 'emoji', content: '🚌' }, // bus
  { type: 'emoji', content: '📦' }, // parcel
  { type: 'emoji', content: '💼' }, // portfolio
  { type: 'emoji', content: '🛎️' }, // lobby bell
  { type: 'emoji', content: '🚚' }, // delivery fleet
  {
    type: 'svg',
    content: (
      <svg className="w-10 h-10 text-emerald-600/45 filter drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    )
  },
  {
    type: 'svg',
    content: (
      <svg className="w-11 h-11 text-teal-600/45 filter drop-shadow-[0_0_8px_rgba(13,148,136,0.2)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1" />
      </svg>
    )
  }
];

interface FloatingItemProps {
  delay: number;
  x: string;
  y: string;
  scale: number;
  blur: number;
  duration: number;
  children: React.ReactNode;
}

const FloatingItem = ({ delay, x, y, scale, blur, duration, children }: FloatingItemProps) => (
  <div
    className="parallax-bg-item absolute select-none pointer-events-none will-change-transform"
    style={{
      left: x,
      top: y,
      transform: `scale(${scale}) translate3d(0,0,0)`,
      zIndex: Math.floor(scale * 10),
      filter: blur > 0 ? `blur(${blur}px)` : 'none',
      opacity: 0,
    }}
  >
    <div className="floating-breathing">
      {children}
    </div>
  </div>
);

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
    pincode: '',
    structuredLocation: null as any,
    businessType: 'product' as 'product' | 'hotel' | 'bus',
    businessDetails: {} as any,
  });
  const [showMap, setShowMap] = useState(false);
  const [idProofFile, setIdProofFile] = useState<File | null>(null);
  const [businessLicenseFile, setBusinessLicenseFile] = useState<File | null>(null);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [bgItems, setBgItems] = useState<FloatingItemProps[]>([]);
  const [shakeCard, setShakeCard] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Fetch db categories
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

  // Initialize performance optimized background floating assets (10 nodes)
  useEffect(() => {
    const items: FloatingItemProps[] = [];
    for (let i = 0; i < 10; i++) {
      const asset = BUSINESS_ASSETS[i % BUSINESS_ASSETS.length];
      const scale = 0.55 + Math.random() * 0.65;
      const blur = scale < 0.65 ? 1.5 : 0;
      items.push({
        delay: Math.random() * 2,
        x: `${Math.random() * 85 + 5}%`,
        y: `${Math.random() * 85 + 5}%`,
        scale,
        blur,
        duration: 8 + Math.random() * 6,
        children: asset.type === 'emoji' ? asset.content : asset.content
      });
    }
    setBgItems(items);
  }, []);

  // Butter-Smooth fast GSAP Entrance timeline & 3D hover tilt logic
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    gsap.set(".orb-bg", { opacity: 0, scale: 0.5 });
    gsap.set(".login-logo", { scale: 0, rotation: -90, opacity: 0 });
    gsap.set(".signup-title-grp", { opacity: 0, y: -20 });
    gsap.set(".login-card-container", { y: "50%", opacity: 0, scale: 0.95, rotateX: 10 });
    gsap.set(".form-element", { opacity: 0, y: 15 });
    gsap.set(".parallax-bg-item", { opacity: 0, scale: 0 });

    tl.to(".orb-bg", { opacity: 1, scale: 1, duration: 1.0 })
      .to(".parallax-bg-item", { opacity: 0.75, scale: 1, duration: 0.5, stagger: 0.02, ease: "back.out(1.2)" }, "-=0.8")
      .to(".login-logo", { scale: 1, rotation: 0, opacity: 1, duration: 0.55, ease: "back.out(1.5)" }, "-=0.5")
      .to(".signup-title-grp", { opacity: 1, y: 0, duration: 0.35, ease: "back.out(1.5)" }, "-=0.45")
      .to(".login-card-container", { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 0.65, ease: "power3.out" }, "-=0.4")
      .to(".form-element", { opacity: 1, y: 0, duration: 0.45, stagger: 0.04, ease: "power2.out" }, "-=0.5");

    // High-speed lag-free 3D hover tilt logic
    const card = cardRef.current;
    const container = containerRef.current;
    if (!card || !container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = container.getBoundingClientRect();
      const x = clientX - left - width / 2;
      const y = clientY - top - height / 2;

      const rotateX = -(y / (height / 2)) * 4; // reduced tilt for larger signup card
      const rotateY = (x / (width / 2)) * 4;

      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        transformPerspective: 1200,
        ease: "power2.out",
        duration: 0.22
      });

      gsap.to(".parallax-bg-item", {
        x: (x / (width / 2)) * -18,
        y: (y / (height / 2)) * -18,
        ease: "power2.out",
        duration: 0.32
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        rotateX: 0,
        rotateY: 0,
        ease: "power2.out",
        duration: 0.45
      });
      gsap.to(".parallax-bg-item", {
        x: 0,
        y: 0,
        ease: "power2.out",
        duration: 0.45
      });
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const triggerShake = () => {
    setShakeCard(true);
    setTimeout(() => setShakeCard(false), 550);
  };

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

  const handleBusinessDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      businessDetails: {
        ...prev.businessDetails,
        [name]: value
      }
    }));
  };

  const handleCategorySelect = (catId: string) => {
    setFormData(prev => {
      const isSelected = prev.categories.includes(catId);
      const newCategories = isSelected
        ? prev.categories.filter(id => id !== catId)
        : [...prev.categories, catId];

      return {
        ...prev,
        category: newCategories[0] || '',
        categories: newCategories
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sellerName) {
      setError('Please enter your name');
      triggerShake();
      return;
    }
    if (!formData.mobile) {
      setError('Please enter your mobile number');
      triggerShake();
      return;
    }
    if (formData.mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      triggerShake();
      return;
    }
    if (!formData.email) {
      setError('Please enter your email address');
      triggerShake();
      return;
    }

    if (formData.businessType === 'product') {
      if (!formData.storeName) {
        setError('Please enter your store name');
        triggerShake();
        return;
      }
      if (formData.categories.length === 0) {
        setError('Please select at least one Product Category');
        triggerShake();
        return;
      }
    } else if (formData.businessType === 'hotel') {
      if (!formData.businessDetails.hotelName) {
        setError('Please enter your hotel name');
        triggerShake();
        return;
      }
      if (!formData.businessDetails.roomsCount) {
        setError('Please enter the total number of rooms');
        triggerShake();
        return;
      }
    } else if (formData.businessType === 'bus') {
      if (!formData.businessDetails.companyName) {
        setError('Please enter your company name');
        triggerShake();
        return;
      }
      if (!formData.businessDetails.licenseNumber) {
        setError('Please enter your license number');
        triggerShake();
        return;
      }
    }
    if (!formData.address) {
      setError('Please enter your store address');
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      let idProofUrl = '';
      let businessLicenseUrl = '';

      if (idProofFile || businessLicenseFile) {
        setUploadingDocs(true);
        try {
          if (idProofFile) {
            const upFormData = new FormData();
            upFormData.append('file', idProofFile);
            const uploadRes = await fetch('/api/v1/upload/single', {
              method: 'POST',
              body: upFormData,
            });
            const uploadData = await uploadRes.json();
            if (uploadData.success) {
              idProofUrl = uploadData.data.url;
            }
          }

          if (businessLicenseFile) {
            const upFormData = new FormData();
            upFormData.append('file', businessLicenseFile);
            const uploadRes = await fetch('/api/v1/upload/single', {
              method: 'POST',
              body: upFormData,
            });
            const uploadData = await uploadRes.json();
            if (uploadData.success) {
              businessLicenseUrl = uploadData.data.url;
            }
          }
        } catch (uploadErr) {
          console.error('Document upload error:', uploadErr);
          setError('Failed to upload documents. Please try again.');
          triggerShake();
          return;
        } finally {
          setUploadingDocs(false);
        }
      }

      const response = await register({
        sellerName: formData.sellerName,
        mobile: formData.mobile,
        email: formData.email,
        category: formData.categories[0],
        categories: formData.categories,
        address: formData.address,
        city: formData.city,
        idProof: idProofUrl,
        businessLicense: businessLicenseUrl,
        latitude: formData.latitude.toString(),
        longitude: formData.longitude.toString(),
        pincode: formData.pincode,
        structuredLocation: formData.structuredLocation,
        businessType: formData.businessType,
        businessDetails: formData.businessDetails,
        storeName: formData.businessType === 'product' ? formData.storeName : (formData.businessDetails.hotelName || formData.businessDetails.companyName || 'Service Provider'),
      });

      if (response.success) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        setRegistrationSuccess(true);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center font-sans tracking-wide bg-slate-50 select-none text-slate-800 py-12 px-4"
    >
      {/* Performance Optimized CSS Injection */}
      <style>{`
        @keyframes orbDrift {
          0% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(15px, -15px, 0) scale(1.04); }
          100% { transform: translate3d(0,0,0) scale(1); }
        }
        @keyframes breathing {
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); }
          50% { transform: translate3d(0,-4px,0) rotate(1.5deg); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 4px 15px rgba(16, 185, 129, 0.04), inset 0 0 10px rgba(255, 255, 255, 0.5); }
          50% { box-shadow: 0 8px 30px rgba(16, 185, 129, 0.1), inset 0 0 15px rgba(255, 255, 255, 0.7); }
        }
        @keyframes cardShake {
          0%, 100% { transform: translate3d(0,0,0); }
          15%, 45%, 75% { transform: translate3d(-6px,0,0); }
          30%, 60%, 90% { transform: translate3d(6px,0,0); }
        }
        .animate-orb-drift {
          animation: orbDrift 22s ease-in-out infinite;
        }
        .floating-breathing {
          animation: breathing 5s ease-in-out infinite;
          will-change: transform;
        }
        .luxury-card-glow {
          animation: glowPulse 7s ease-in-out infinite;
          will-change: box-shadow;
        }
        .shake-active {
          animation: cardShake 0.45s cubic-bezier(.36,.07,.19,.97) both;
        }
        /* Custom scrollbar rules */
        .seller-signup-form::-webkit-scrollbar {
          width: 6px;
        }
        .seller-signup-form::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.5);
          border-radius: 20px;
        }
        .seller-signup-form::-webkit-scrollbar-thumb {
          background: rgba(203, 213, 225, 0.8);
          border-radius: 20px;
        }
        .seller-signup-form::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.8);
        }
      `}</style>

      {/* Background Liquid Pastel Gradient Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="orb-bg absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-emerald-100/35 filter blur-[100px] animate-orb-drift" />
        <div className="orb-bg absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-100/40 filter blur-[110px] animate-orb-drift" />
        <div className="orb-bg absolute top-[30%] right-[10%] w-[45%] h-[45%] rounded-full bg-amber-100/30 filter blur-[90px] animate-orb-drift" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_65%_60%_at_50%_50%,#000_65%,transparent_100%)] opacity-35" />
      </div>

      {/* Floating category items */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {bgItems.map((props, i) => (
          <FloatingItem key={i} {...props} />
        ))}
      </div>

      {/* macOS-style back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 z-30 p-2.5 rounded-full bg-white/80 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 shadow-sm transition-all duration-200 flex items-center justify-center group"
        aria-label="Back"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* Glassmorphic Dual-Column Card Container */}
      <div className="w-full max-w-2xl relative z-10 my-4">
        <div
          ref={cardRef}
          className={`login-card-container w-full rounded-3xl backdrop-blur-3xl bg-white/75 border border-slate-200/80 luxury-card-glow shadow-[0_25px_50px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] overflow-hidden relative ${
            shakeCard ? 'shake-active' : ''
          }`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Subtle reflection rim */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent opacity-80" />

          {/* Header section */}
          <div className="pt-8 pb-4 px-8 text-center flex flex-col items-center">
            <div className="login-logo mb-4 relative group cursor-pointer" style={{ transformStyle: "preserve-3d", transform: "translateZ(30px)" }}>
              <div className="absolute inset-0 rounded-full bg-emerald-400/15 blur-xl group-hover:scale-125 transition-transform duration-500" />
              <img
                src="/assets/laxmartlogo-removebg-preview.png"
                alt="LaxMart"
                className="h-16 w-auto relative z-10 filter drop-shadow-[0_4px_8px_rgba(16,185,129,0.15)] hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="signup-title-grp select-none" style={{ transform: "translateZ(20px)" }}>
              <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600 font-sans tracking-tight mb-1">
                {formData.businessType === 'product' ? 'Partner Signup' : formData.businessType === 'hotel' ? 'Hotel Partner' : 'Transport Operator'}
              </h1>
              <p className="text-emerald-700 text-[10px] font-black uppercase tracking-widest mt-1">Merchant Application Portal</p>
            </div>
          </div>

          {/* Form scroll viewport */}
          <div className="seller-signup-form p-8 pt-2 space-y-6 overflow-y-auto max-h-[62vh]" style={{ transform: "translateZ(10px)" }}>
            {!registrationSuccess ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Category Switch Buttons */}
                <div className="space-y-3 form-element">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                    Business Sector <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'product', label: 'E-Commerce', icon: '🛒' },
                      { id: 'hotel', label: 'Hotel Partner', icon: '🏨' },
                      { id: 'bus', label: 'Bus Operator', icon: '🚌' }
                    ].map((type) => {
                      const isSelected = formData.businessType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ 
                                ...prev, 
                                businessType: type.id as any,
                                businessDetails: {} 
                            }));
                          }}
                          className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl border-2 transition-all duration-300 scale-100 active:scale-95 cursor-pointer relative ${
                            isSelected 
                              ? 'border-emerald-500 bg-emerald-50/40 text-emerald-800 shadow-sm font-bold' 
                              : 'border-slate-200/80 bg-white/60 text-slate-500 hover:border-emerald-300 hover:text-emerald-700'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[8px] font-bold shadow-sm animate-pulse">✓</span>
                          )}
                          <span className="text-xl mb-1.5">{type.icon}</span>
                          <span className="text-[10px] font-bold tracking-wide uppercase">{type.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. Primary Information */}
                <div className="space-y-4 form-element">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Business Identification</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div className="relative group/input">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Authorized Signatory <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input
                          type="text"
                          name="sellerName"
                          value={formData.sellerName}
                          onChange={handleInputChange}
                          placeholder="Your Full Name"
                          required
                          className="w-full bg-white px-4 py-3.5 pl-10 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                          disabled={loading}
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-600 transition-colors">
                          <User className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="relative group/input">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Email Address <span className="text-rose-500">*</span></label>
                      <div className="relative">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="partner@company.com"
                          required
                          className="w-full bg-white px-4 py-3.5 pl-10 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                          disabled={loading}
                        />
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-600 transition-colors">
                          <Mail className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Mobile */}
                    <div className="relative group/input">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Registered Mobile <span className="text-rose-500">*</span></label>
                      <div className="relative flex items-center bg-white border border-slate-200 rounded-2xl overflow-hidden focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-600/10 transition-all duration-200">
                        <div className="px-3.5 py-3.5 text-sm font-bold text-slate-400 border-r border-slate-200 bg-slate-50/50 flex items-center gap-1">
                          <span className="flex flex-col gap-0.5">
                            <span className="w-1.5 h-0.5 bg-amber-500" />
                            <span className="w-1.5 h-0.5 bg-white border border-slate-200" />
                            <span className="w-1.5 h-0.5 bg-emerald-500" />
                          </span>
                          +91
                        </div>
                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          placeholder="10-digit number"
                          required
                          maxLength={10}
                          className="flex-1 px-4 py-3.5 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none bg-transparent"
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Dynamic Sector specific identifier */}
                    {formData.businessType === 'product' && (
                      <div className="relative group/input">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Store Name <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <input
                            type="text"
                            name="storeName"
                            value={formData.storeName}
                            onChange={handleInputChange}
                            placeholder="e.g. Laxmi Super Store"
                            required
                            className="w-full bg-white px-4 py-3.5 pl-10 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                          />
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-600 transition-colors">
                            <Briefcase className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.businessType === 'hotel' && (
                      <div className="relative group/input">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Hotel / Property Name <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <input
                            type="text"
                            name="hotelName"
                            value={formData.businessDetails.hotelName || ''}
                            onChange={handleBusinessDetailsChange}
                            placeholder="e.g. Grand Laxmi Palace"
                            required
                            className="w-full bg-white px-4 py-3.5 pl-10 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                          />
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-600 transition-colors">
                            <Briefcase className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    )}

                    {formData.businessType === 'bus' && (
                      <div className="relative group/input">
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Agency / Company Name <span className="text-rose-500">*</span></label>
                        <div className="relative">
                          <input
                            type="text"
                            name="companyName"
                            value={formData.businessDetails.companyName || ''}
                            onChange={handleBusinessDetailsChange}
                            placeholder="e.g. Laxmi Travels Express"
                            required
                            className="w-full bg-white px-4 py-3.5 pl-10 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                          />
                          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-emerald-600 transition-colors">
                            <Briefcase className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Dynamic Business Details (Secondary Inputs) */}
                {formData.businessType === 'hotel' && (
                  <div className="space-y-4 pt-2 form-element animate-in fade-in slide-in-from-right duration-300">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Hotel Configuration</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Total Rooms <span className="text-rose-500">*</span></label>
                        <input
                          type="number"
                          name="roomsCount"
                          value={formData.businessDetails.roomsCount || ''}
                          onChange={handleBusinessDetailsChange}
                          placeholder="25"
                          required
                          className="w-full bg-white px-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Rating</label>
                        <select
                          name="rating"
                          value={formData.businessDetails.rating || ''}
                          onChange={handleBusinessDetailsChange}
                          className="w-full bg-white px-4 py-[1.125rem] rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 outline-none transition-all focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                        >
                          <option value="">Select Star</option>
                          <option value="3">3 Star</option>
                          <option value="4">4 Star</option>
                          <option value="5">5 Star</option>
                          <option value="Boutique">Boutique</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">WiFi / Ac</label>
                        <input
                          type="text"
                          name="amenities"
                          value={formData.businessDetails.amenities || ''}
                          onChange={handleBusinessDetailsChange}
                          placeholder="Free WiFi, Pool"
                          className="w-full bg-white px-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.businessType === 'bus' && (
                  <div className="space-y-4 pt-2 form-element animate-in fade-in slide-in-from-right duration-300">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Fleet Details</h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">RTO Permit <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          name="licenseNumber"
                          value={formData.businessDetails.licenseNumber || ''}
                          onChange={handleBusinessDetailsChange}
                          placeholder="RTO-12345"
                          required
                          className="w-full bg-white px-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Fleet Size</label>
                        <input
                          type="number"
                          name="fleetSize"
                          value={formData.businessDetails.fleetSize || ''}
                          onChange={handleBusinessDetailsChange}
                          placeholder="12"
                          className="w-full bg-white px-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5">Base Hub</label>
                        <input
                          type="text"
                          name="baseCity"
                          value={formData.businessDetails.baseCity || ''}
                          onChange={handleBusinessDetailsChange}
                          placeholder="Jaipur Hub"
                          className="w-full bg-white px-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 outline-none transition-all focus:border-emerald-600"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Product Categories (Only for E-Com Product Business) */}
                {formData.businessType === 'product' && (
                  <div className="space-y-3 form-element animate-in fade-in duration-300">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Product Categories <span className="text-rose-500">*</span></h3>
                    {dbCategories.length === 0 ? (
                      <div className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-4 rounded-2xl italic">
                        No active store categories available. Please contact LaxMart Admin.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 max-h-56 overflow-y-auto p-4 border border-slate-200/80 rounded-2xl bg-slate-50/50 shadow-inner">
                        {dbCategories.map((cat) => {
                          const isSelected = formData.categories.includes(cat._id);
                          return (
                            <button
                              key={cat._id}
                              type="button"
                              onClick={() => handleCategorySelect(cat._id)}
                              disabled={loading}
                              className={`flex flex-col items-center justify-center p-3 border-2 rounded-2xl transition-all duration-300 text-center relative scale-100 hover:scale-[1.01] active:scale-[0.98] cursor-pointer ${
                                isSelected
                                  ? 'border-emerald-500 bg-white shadow-[0_4px_15px_rgba(16,185,129,0.06)]'
                                  : 'border-slate-200/80 bg-white/75 hover:border-emerald-200'
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-sm">
                                  <Check className="w-2.5 h-2.5 text-white stroke-[3.5]" />
                                </div>
                              )}
                              {cat.image && (
                                <img src={cat.image} alt={cat.name} className="w-8 h-8 object-contain mb-1.5 filter drop-shadow-sm" />
                              )}
                              <span className={`text-[11px] font-bold ${isSelected ? 'text-emerald-800' : 'text-slate-600'}`}>
                                {cat.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Documents Upload (ID & License) */}
                <div className="space-y-4 form-element">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Verification Documents (Optional)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* ID Proof */}
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Government ID Proof</label>
                      <label className={`w-full flex flex-col items-center justify-center px-4 py-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
                        idProofFile ? 'border-emerald-400 bg-emerald-50/10' : 'border-slate-200 hover:border-emerald-300 bg-white'
                      }`}>
                        <Upload className={`w-5 h-5 mb-1.5 ${idProofFile ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="text-[10px] font-bold text-slate-500 text-center max-w-[150px] truncate">
                          {idProofFile ? idProofFile.name : 'Upload Aadhaar / PAN'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                setError('Document size must be less than 5MB');
                                e.target.value = '';
                                return;
                              }
                              setIdProofFile(file);
                            }
                          }}
                          className="hidden"
                          disabled={loading || uploadingDocs}
                        />
                      </label>
                    </div>

                    {/* Business License */}
                    <div className="relative">
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Commercial License</label>
                      <label className={`w-full flex flex-col items-center justify-center px-4 py-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
                        businessLicenseFile ? 'border-emerald-400 bg-emerald-50/10' : 'border-slate-200 hover:border-emerald-300 bg-white'
                      }`}>
                        <Upload className={`w-5 h-5 mb-1.5 ${businessLicenseFile ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="text-[10px] font-bold text-slate-500 text-center max-w-[150px] truncate">
                          {businessLicenseFile ? businessLicenseFile.name : 'Upload GSTIN / License'}
                        </span>
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              if (file.size > 5 * 1024 * 1024) {
                                setError('License size must be less than 5MB');
                                e.target.value = '';
                                return;
                              }
                              setBusinessLicenseFile(file);
                            }
                          }}
                          className="hidden"
                          disabled={loading || uploadingDocs}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* 6. Geolocation Location Pinning */}
                <div className="space-y-4 form-element">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Business Address & Map Geolocation</h3>
                  
                  {/* Google AutoComplete Address Search */}
                  <div className="relative group/input">
                    <label className="block text-xs font-bold text-slate-500 mb-1.5">Search Address / Landmark <span className="text-rose-500">*</span></label>
                    <div className="relative rounded-2xl border border-slate-200 focus-within:border-emerald-600 transition-colors bg-white">
                      <GoogleMapsAutocomplete
                        value={formData.address}
                        placeholder={`Search for your business coordinates...`}
                        onChange={(result: AutocompleteResult) => {
                          setFormData(prev => ({
                            ...prev,
                            address: result.address,
                            city: result.city,
                            pincode: result.pincode,
                            latitude: result.lat,
                            longitude: result.lng,
                            structuredLocation: result.structuredLocation
                          }));
                          setShowMap(true);
                        }}
                        required
                      />
                    </div>
                  </div>

                  {/* Auto-filled metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">City (Auto)</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        readOnly
                        placeholder="Search above..."
                        className="w-full px-4 py-3.5 text-xs font-bold border border-slate-100 bg-slate-100/50 rounded-2xl text-slate-500 outline-none select-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1">Pincode (Auto)</label>
                      <input
                        type="text"
                        name="pincode"
                        value={formData.pincode}
                        readOnly
                        placeholder="Search above..."
                        className="w-full px-4 py-3.5 text-xs font-bold border border-slate-100 bg-slate-100/50 rounded-2xl text-slate-500 outline-none select-none"
                      />
                    </div>
                  </div>

                  {/* Auto detect Location Button */}
                  <div className="flex justify-between items-center bg-slate-50 border border-slate-200/50 p-3 rounded-2xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Precise Geolocation</span>
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
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 px-3.5 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-200 hover:bg-slate-50"
                    >
                      {formData.latitude ? '📍 Location Pinned' : '📍 Auto-Detect Location'}
                    </button>
                  </div>

                  {/* Google Map Picker Container */}
                  {!showMap && !formData.latitude ? (
                    <button
                      type="button"
                      onClick={() => setShowMap(true)}
                      className="w-full py-8 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl text-slate-400 hover:text-emerald-600 transition-all duration-300 flex flex-col items-center justify-center gap-2 bg-white"
                    >
                      <MapPin className="w-6 h-6 stroke-[1.5]" />
                      <span className="text-xs font-bold uppercase tracking-wider">Tap to pinpoint exact location on map</span>
                    </button>
                  ) : (
                    showMap && (
                      <div className="space-y-3">
                        <div className="h-60 rounded-2xl overflow-hidden border border-slate-200 ring-4 ring-slate-100">
                          <GoogleMapPicker
                            initialLat={formData.latitude || 26.9124}
                            initialLng={formData.longitude || 75.7873}
                            initialRadius={10}
                            onLocationChange={(lat, lng, address) => {
                              setFormData(prev => ({
                                ...prev,
                                latitude: lat,
                                longitude: lng,
                                address: address || prev.address
                              }));
                            }}
                            onRadiusChange={(radius) => {
                              console.log('Delivery Radius set to:', radius);
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-400 italic text-center font-semibold">
                          * Drag the marker to pinpoint your commercial office, resort, or terminal hub.
                        </p>
                      </div>
                    )
                  )}

                  {formData.latitude > 0 && (
                    <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50/50 rounded-2xl border border-slate-200/80 shadow-inner">
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-slate-400">LATITUDE COORD</span>
                        <span className="text-xs font-bold text-slate-700 font-mono">{formData.latitude.toFixed(6)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] uppercase font-bold text-slate-400">LONGITUDE COORD</span>
                        <span className="text-xs font-bold text-slate-700 font-mono">{formData.longitude.toFixed(6)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 7. Taxes & Bank (Optional) */}
                <div className="space-y-4 form-element">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2">Fiscal & Account Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">PAN Card Number</label>
                      <input
                        type="text"
                        name="panCard"
                        value={formData.panCard}
                        onChange={handleInputChange}
                        placeholder="ABCDE1234F"
                        className="w-full bg-white px-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Tax Name</label>
                      <input
                        type="text"
                        name="taxName"
                        value={formData.taxName}
                        onChange={handleInputChange}
                        placeholder="GST / VAT Registered Name"
                        className="w-full bg-white px-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-emerald-600"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">Tax Number</label>
                      <input
                        type="text"
                        name="taxNumber"
                        value={formData.taxNumber}
                        onChange={handleInputChange}
                        placeholder="08AAAAA1111A1Z1"
                        className="w-full bg-white px-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-emerald-600"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 mb-1.5">IFSC Routing Code</label>
                      <input
                        type="text"
                        name="ifsc"
                        value={formData.ifsc}
                        onChange={handleInputChange}
                        placeholder="SBIN0001234"
                        className="w-full bg-white px-4 py-3.5 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all focus:border-emerald-600"
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-rose-600 text-xs font-semibold text-center bg-rose-50 border border-rose-100 py-3 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                    {error}
                  </motion.div>
                )}

                {/* High-speed glowing Action button with correct py-4 padding */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-2xl font-bold text-base tracking-wider relative overflow-hidden transition-all duration-300 group flex items-center justify-center gap-2 ${
                    !loading
                      ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer shadow-[0_4px_25px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_35px_rgba(16,185,129,0.4)] active:scale-[0.98]'
                      : 'bg-slate-100 text-slate-400 border border-slate-200/50 cursor-not-allowed'
                  }`}
                >
                  {loading ? (
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-3 border-emerald-200 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}

                  {!loading && (
                    <div
                      className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                      style={{
                        transform: 'skewX(-25deg)',
                        animation: 'shimmerSweep 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite'
                      }}
                    />
                  )}
                </button>

                {/* Login Direct Link */}
                <div className="text-center pt-5 border-t border-slate-100 form-element">
                  <p className="text-sm text-slate-500 font-medium">
                    Already registered partner?{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/seller/login')}
                      className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline transition-all duration-200"
                    >
                      Sign In here
                    </button>
                  </p>
                </div>
              </form>
            ) : (
              /* Success Application View Screen */
              <div className="py-8 px-4 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="flex justify-center">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-30" />
                    <div className="w-20 h-20 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center text-emerald-600 shadow-md relative">
                      <Check className="w-10 h-10 stroke-[3.5]" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Application Submitted!</h2>
                  <p className="text-slate-500 text-sm font-semibold">Your LaxMart Commercial Seller profile has been safely saved.</p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 text-left max-w-md mx-auto space-y-2 shadow-inner">
                  <h3 className="text-emerald-800 font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 mb-2.5">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    What Happens Next?
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">
                    Our compliance desk will audit your trade coordinates and license logs within <strong>24-48 hours</strong>. Once approved, you will obtain active access to list inventory, book rooms, and schedule routes on the Super-App.
                  </p>
                </div>

                <div className="pt-4 max-w-md mx-auto">
                  <button
                    onClick={() => navigate('/seller/login')}
                    className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white py-4 rounded-2xl font-bold shadow-[0_4px_25px_rgba(16,185,129,0.25)] hover:shadow-[0_4px_35px_rgba(16,185,129,0.4)] hover:scale-[1.01] transition-all transform active:scale-98"
                  >
                    Go to Partner Login
                  </button>
                  <p className="mt-4 text-[10px] text-slate-400 font-semibold tracking-wide italic">
                    * You can sign in anytime to monitor your application status.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brand Footer */}
      <p className="mt-6 text-[10px] text-slate-400 text-center max-w-md font-semibold uppercase tracking-widest leading-loose">
        LaxMart Partner Network • © 2026 LaxMart Logistics Ltd. All rights reserved.
      </p>
    </div>
  );
}
