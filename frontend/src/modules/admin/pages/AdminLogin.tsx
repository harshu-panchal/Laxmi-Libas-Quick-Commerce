import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sendOTP, verifyOTP } from '../../../services/api/auth/adminAuthService';
import OTPInput from '../../../components/OTPInput';
import { useAuth } from '../../../context/AuthContext';
import { gsap } from 'gsap';
import { Smartphone, ArrowRight, ShieldCheck, ChevronLeft, Sparkles, Server, Cpu, Database, Activity, ShieldAlert, Lock, Globe } from 'lucide-react';

// Highly modern, premium multi-business SVG representing E-Com + Buses + Hotels controlled by Admin
const MultiBusinessSvg = () => {
  return (
    <svg
      viewBox="0 0 900 700"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full filter drop-shadow-[0_20px_50px_rgba(79,70,229,0.15)] select-none pointer-events-none"
    >
      <defs>
        {/* Glow Filters */}
        <filter id="indigoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="12" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="emeraldGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>

        {/* Gradients */}
        <linearGradient id="gradIndigo" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="gradTeal" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id="gradGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#d97706" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="gradLine" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
          <stop offset="50%" stopColor="#6366f1" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Cybernetic Isometric Blueprint Grid Lines */}
      <g opacity="0.35">
        <path d="M50 150 L850 150" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="5,5" />
        <path d="M50 350 L850 350" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="5,5" />
        <path d="M50 550 L850 550" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="5,5" />
        <path d="M250 50 L250 650" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="5,5" />
        <path d="M450 50 L450 650" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="5,5" />
        <path d="M650 50 L650 650" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="5,5" />
      </g>

      {/* Fast Fiber-Optic Connection Speedways (Dasheed paths with active SVG motion path keyframes) */}
      <g strokeWidth="2.5" fill="none">
        {/* Core to Hotel Hub Speedway */}
        <path id="coreToHotel" d="M 450 320 Q 280 200 200 210" stroke="url(#gradLine)" />
        {/* Core to Transport Speedway */}
        <path id="coreToBus" d="M 450 380 Q 320 520 220 510" stroke="url(#gradLine)" strokeDasharray="10 10" />
        {/* Core to E-Com Speedway */}
        <path id="coreToEcom" d="M 450 350 Q 620 480 680 440" stroke="url(#gradLine)" />
      </g>

      {/* Pulsing High-Speed Data Packets (Animators) */}
      <g>
        <circle r="6" fill="#3b82f6" filter="url(#indigoGlow)">
          <animateMotion dur="2.4s" repeatCount="infinity" path="M 450 320 Q 280 200 200 210" />
        </circle>
        <circle r="5.5" fill="#10b981" filter="url(#emeraldGlow)">
          <animateMotion dur="1.8s" repeatCount="infinity" path="M 450 350 Q 620 480 680 440" />
        </circle>
        <circle r="5" fill="#f59e0b">
          <animateMotion dur="2.8s" repeatCount="infinity" path="M 450 380 Q 320 520 220 510" />
        </circle>
      </g>

      {/* SECTION 1: CENTRAL CONTROL SYSTEM NODE (Admin server cluster) */}
      <g transform="translate(450, 350)">
        <circle r="72" fill="url(#gradIndigo)" filter="url(#indigoGlow)" />
        <circle r="48" fill="#1e1b4b" stroke="#6366f1" strokeWidth="3" />
        <circle r="58" stroke="#818cf8" strokeWidth="1.5" strokeDasharray="4, 8">
          <animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="25s" repeatCount="infinity" />
        </circle>

        {/* Central processor emblem */}
        <path
          d="M-15 -15 L15 -15 L15 15 L-15 15 Z"
          stroke="#818cf8"
          strokeWidth="2.5"
          fill="none"
        />
        <path d="M-8 -8 H8 V8 H-8 Z" fill="#6366f1" />
        <line x1="-22" y1="-5" x2="-15" y2="-5" stroke="#818cf8" strokeWidth="2" />
        <line x1="-22" y1="5" x2="-15" y2="5" stroke="#818cf8" strokeWidth="2" />
        <line x1="15" y1="-5" x2="22" y2="-5" stroke="#818cf8" strokeWidth="2" />
        <line x1="15" y1="5" x2="22" y2="5" stroke="#818cf8" strokeWidth="2" />
        <line x1="-5" y1="-22" x2="-5" y2="-15" stroke="#818cf8" strokeWidth="2" />
        <line x1="5" y1="-22" x2="5" y2="-15" stroke="#818cf8" strokeWidth="2" />
        <line x1="-5" y1="15" x2="-5" y2="22" stroke="#818cf8" strokeWidth="2" />
        <line x1="5" y1="15" x2="5" y2="22" stroke="#818cf8" strokeWidth="2" />
        
        {/* Core Labels */}
        <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900" fontFamily="sans-serif">LAX</text>
        <text x="0" y="-85" textAnchor="middle" fill="#4f46e5" fontSize="11" fontWeight="900" letterSpacing="1.5" fontFamily="sans-serif">CENTRAL SYS CORE</text>
      </g>

      {/* SECTION 2: LUXURY HOTELS NODE (Left Top) */}
      <g transform="translate(180, 180)">
        <circle r="55" fill="url(#gradTeal)" />
        <circle r="36" fill="#0f172a" stroke="#0d9488" strokeWidth="2.5" />
        
        {/* Isometric Hotel Resort Drawing */}
        <path d="M-16 14 V-14 L2 -22 V6 Z" fill="#14b8a6" fillOpacity="0.8" stroke="#0f172a" strokeWidth="1" />
        <path d="M2 -22 L18 -14 V14 L2 6 Z" fill="#0f766e" fillOpacity="0.8" stroke="#0f172a" strokeWidth="1" />
        <path d="M-16 -14 L2 -22 L18 -14 L2 -6 Z" fill="#2dd4bf" stroke="#0f172a" strokeWidth="1" />

        {/* Lit Balcony Windows */}
        <rect x="-10" y="-8" width="4" height="4" fill="#fbbf24" rx="1" />
        <rect x="-10" y="0" width="4" height="4" fill="#ffffff" rx="1" />
        <rect x="8" y="-4" width="4" height="4" fill="#fbbf24" rx="1" />
        <rect x="8" y="4" width="4" height="4" fill="#ffffff" rx="1" />
        
        {/* Hotel label */}
        <text x="0" y="78" textAnchor="middle" fill="#0d9488" fontSize="10" fontWeight="900" letterSpacing="1" fontFamily="sans-serif">HOTELS & SUITES</text>
      </g>

      {/* SECTION 3: VOLVO EXPRESS BUS NODE (Left Bottom) */}
      <g transform="translate(200, 500)">
        <circle r="55" fill="url(#gradGold)" />
        <circle r="36" fill="#0f172a" stroke="#d97706" strokeWidth="2.5" />

        {/* Sleek Aerodynamic double decker coach bus */}
        <g transform="translate(-18, -12)">
          <path d="M2 4 h30 a3 3 0 0 1 3 3 v12 a2 2 0 0 1 -2 2 h-31 a2 2 0 0 1 -2 -2 v-11 a4 4 0 0 1 2 -4 z" fill="#d97706" />
          <rect x="5" y="6" width="24" height="4" fill="#1e293b" rx="1" />
          <rect x="5" y="12" width="24" height="4" fill="#1e293b" rx="1" />
          <circle cx="8" cy="22" r="4" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
          <circle cx="28" cy="22" r="4" fill="#0f172a" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M32 9 L34 11 L32 13 Z" fill="#fbbf24" /> {/* headlamp glow */}
        </g>

        {/* Bus Label */}
        <text x="0" y="78" textAnchor="middle" fill="#b45309" fontSize="10" fontWeight="900" letterSpacing="1" fontFamily="sans-serif">BUS TRAVELS</text>
      </g>

      {/* SECTION 4: E-COMMERCE PRODUCTS & COURIER (Right Bottom) */}
      <g transform="translate(700, 420)">
        <circle r="58" fill="url(#gradIndigo)" />
        <circle r="38" fill="#0f172a" stroke="#6366f1" strokeWidth="2.5" />

        {/* Interactive Shopping Bag / Courier Box */}
        <g transform="translate(-15, -15)">
          <path d="M4 10 h22 v18 a2 2 0 0 1 -2 2 h-18 a2 2 0 0 1 -2 -2 z" fill="#6366f1" stroke="#ffffff" strokeWidth="1.5" />
          <path d="M9 10 Q15 2 21 10" stroke="#ffffff" strokeWidth="2" fill="none" />
          <circle cx="15" cy="18" r="4" fill="#f59e0b" />
        </g>

        {/* Delivery Drone floating indicator */}
        <g transform="translate(18, -32)" className="floating-breathing">
          <line x1="-12" y1="0" x2="12" y2="0" stroke="#818cf8" strokeWidth="1.5" />
          <circle cx="-10" cy="0" r="2.5" fill="#334155" />
          <circle cx="10" cy="0" r="2.5" fill="#334155" />
          <rect x="-4" y="-3" width="8" height="6" fill="#818cf8" rx="1" />
          <path d="M-3 3 L0 8 L3 3 Z" fill="#f59e0b" />
        </g>

        {/* Ecom label */}
        <text x="0" y="78" textAnchor="middle" fill="#6366f1" fontSize="10" fontWeight="900" letterSpacing="1" fontFamily="sans-serif">QUICK COMMERCE</text>
      </g>
    </svg>
  );
};

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

const SuccessAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    const arr = [];
    const colors = ['#2563eb', '#3b82f6', '#6366f1', '#4f46e5', '#1e1b4b', '#f59e0b'];
    for (let i = 0; i < 35; i++) {
      arr.push({
        id: i,
        x: Math.random() * 300 - 150,
        y: Math.random() * 300 - 150,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 0.2
      });
    }
    setParticles(arr);
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 overflow-hidden"
      initial={{
        clipPath: "circle(0% at 50% 50%)",
        opacity: 1
      }}
      animate={{
        clipPath: "circle(150% at 50% 50%)",
        transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] }
      }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 w-full h-full opacity-35 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[1.5px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_8px_rgba(59,130,246,0.6)]"
            style={{
              top: `${Math.random() * 100}%`,
              left: '-50%',
              width: `${Math.random() * 60 + 40}%`
            }}
            animate={{ x: window.innerWidth * 2 }}
            transition={{
              duration: 0.35 + Math.random() * 0.25,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 0.3
            }}
          />
        ))}
      </div>

      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-blue-200/20 filter blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-indigo-200/20 filter blur-[80px] pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center z-20">
        <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-500 via-indigo-500 to-amber-300 blur-xl opacity-40"
            animate={{ rotate: 360, scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 150, damping: 14 }}
            className="w-24 h-24 rounded-3xl bg-white border-2 border-indigo-500 flex items-center justify-center shadow-[0_10px_30px_rgba(99,102,241,0.25)] z-10"
          >
            <Lock className="w-12 h-12 text-indigo-600 filter drop-shadow-[0_0_6px_rgba(99,102,241,0.4)] animate-pulse" />
          </motion.div>

          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute rounded-full"
              style={{
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                boxShadow: `0 0 8px ${p.color}`,
                left: '50%',
                top: '50%'
              }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{ x: p.x, y: p.y, opacity: 0, scale: 0 }}
              transition={{ delay: p.delay, duration: 0.8, ease: "easeOut" }}
            />
          ))}
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-indigo-800 tracking-wider text-center uppercase font-sans drop-shadow-sm"
        >
          Access Granted
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.55 }}
          className="text-indigo-900/60 text-xs mt-2.5 font-bold tracking-wide animate-pulse"
        >
          Bootstrapping Sovereign Admin Terminal...
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1.3, duration: 0.2 }}
        onAnimationComplete={onComplete}
        className="absolute inset-0 bg-transparent"
      />
    </motion.div>
  );
};

const AnimatedLogoText = () => {
  const letters = "LAXMART".split("");
  return (
    <div className="flex justify-center items-center gap-1.5 py-1 mb-2">
      {letters.map((char, index) => (
        <span
          key={index}
          className="logo-char inline-block text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-800 font-sans select-none drop-shadow-[0_2px_4px_rgba(79,70,229,0.15)]"
        >
          {char}
        </span>
      ))}
    </div>
  );
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bgItems, setBgItems] = useState<FloatingItemProps[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Background floating administrative elements (10 nodes)
  useEffect(() => {
    const items: FloatingItemProps[] = [];
    const EMOJIS = ['🛡️', '🔑', '📡', '⚙️', '💻', '📈', '🌐'];
    for (let i = 0; i < 10; i++) {
      const scale = 0.55 + Math.random() * 0.65;
      const blur = scale < 0.65 ? 1.5 : 0;
      items.push({
        delay: Math.random() * 2,
        x: `${Math.random() * 85 + 5}%`,
        y: `${Math.random() * 85 + 5}%`,
        scale,
        blur,
        duration: 8 + Math.random() * 6,
        children: EMOJIS[i % EMOJIS.length]
      });
    }
    setBgItems(items);
  }, []);

  // Butter-Smooth fast GSAP Entrance timeline & 3D hover tilt logic
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    gsap.set(".orb-bg", { opacity: 0, scale: 0.5 });
    gsap.set(".login-logo", { scale: 0, rotation: -90, opacity: 0 });
    gsap.set(".logo-char", { opacity: 0, y: -20, scale: 0.7 });
    gsap.set(".login-card-container", { y: "100%", opacity: 0, scale: 0.94, rotateX: 12 });
    gsap.set(".form-element", { opacity: 0, y: 15 });
    gsap.set(".parallax-bg-item", { opacity: 0, scale: 0 });
    gsap.set(".business-svg-overlay", { opacity: 0, scale: 0.95 });

    tl.to(".orb-bg", { opacity: 1, scale: 1, duration: 1.0 })
      .to(".parallax-bg-item", { opacity: 0.75, scale: 1, duration: 0.5, stagger: 0.02, ease: "back.out(1.2)" }, "-=0.8")
      .to(".business-svg-overlay", { opacity: 0.8, scale: 1, duration: 0.75, ease: "power3.out" }, "-=0.6")
      .to(".login-logo", { scale: 1, rotation: 0, opacity: 1, duration: 0.55, ease: "back.out(1.5)" }, "-=0.5")
      .to(".logo-char", { opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.03, ease: "back.out(1.5)" }, "-=0.45")
      .to(".login-card-container", { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 0.65, ease: "power3.out" }, "-=0.4")
      .to(".form-element", { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: "power2.out" }, "-=0.5");

    // 3D Tilt mouse interaction (snappy 0.22s)
    const card = cardRef.current;
    const container = containerRef.current;
    if (!card || !container) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = container.getBoundingClientRect();
      const x = clientX - left - width / 2;
      const y = clientY - top - height / 2;

      const rotateX = -(y / (height / 2)) * 6;
      const rotateY = (x / (width / 2)) * 6;

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

      gsap.to(".business-svg-overlay", {
        x: (x / (width / 2)) * -12,
        y: (y / (height / 2)) * -12,
        ease: "power2.out",
        duration: 0.4
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
      gsap.to(".business-svg-overlay", {
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

  const handleMobileLogin = async () => {
    if (mobileNumber.length !== 10) {
      triggerShake();
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendOTP(mobileNumber);
      setShowOTP(true);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await verifyOTP(mobileNumber, otp);
      if (response.success && response.data) {
        setLoading(false);
        setShowSuccess(true);
        const userData = {
          token: response.data.token,
          user: {
            ...response.data.user,
            userType: "Admin"
          }
        };
        (window as any).tempUserData = userData;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
      triggerShake();
      setLoading(false);
    }
  };

  const onAnimationComplete = () => {
    const userData = (window as any).tempUserData;
    if (userData) {
      login(userData.token, userData.user);
      navigate('/admin');
    }
  };

  const handleSellerLogin = () => {
    navigate('/seller/login');
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden flex items-center justify-center font-sans tracking-wide bg-slate-50 select-none text-slate-800"
    >
      {/* 144Hz Performance Styles */}
      <style>{`
        @keyframes orbDrift {
          0% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(18px, -18px, 0) scale(1.05); }
          100% { transform: translate3d(0,0,0) scale(1); }
        }
        @keyframes breathing {
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); }
          50% { transform: translate3d(0,-4px,0) rotate(1.5deg); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 4px 15px rgba(99, 102, 241, 0.04), inset 0 0 10px rgba(255, 255, 255, 0.5); }
          50% { box-shadow: 0 8px 30px rgba(99, 102, 241, 0.12), inset 0 0 15px rgba(255, 255, 255, 0.7); }
        }
        @keyframes cardShake {
          0%, 100% { transform: translate3d(0,0,0); }
          15%, 45%, 75% { transform: translate3d(-8px,0,0); }
          30%, 60%, 90% { transform: translate3d(8px,0,0); }
        }
        @keyframes shimmerSweep {
          0% { transform: translate3d(-150%, 0, 0) skewX(-25deg); }
          100% { transform: translate3d(150%, 0, 0) skewX(-25deg); }
        }
        .animate-orb-drift {
          animation: orbDrift 24s ease-in-out infinite;
        }
        .floating-breathing {
          animation: breathing 5.5s ease-in-out infinite;
          will-change: transform;
        }
        .luxury-card-glow {
          animation: glowPulse 7s ease-in-out infinite;
          will-change: box-shadow;
        }
        .shake-active {
          animation: cardShake 0.45s cubic-bezier(.36,.07,.19,.97) both;
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Background Liquid Pastel Gradient Orbs (Cobalt, Indigo, Grey) */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="orb-bg absolute top-[-10%] left-[-15%] w-[55%] h-[55%] rounded-full bg-blue-100/35 filter blur-[100px] animate-orb-drift" />
        <div className="orb-bg absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-100/40 filter blur-[110px] animate-orb-drift" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_65%_60%_at_50%_50%,#000_65%,transparent_100%)] opacity-35" />
      </div>

      {/* Parallax Floating Sovereign Symbols */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {bgItems.map((props, i) => (
          <FloatingItem key={i} {...props} />
        ))}
      </div>

      {/* Breathtaking, Premium Multi-Business Svg graphic placed in Left Background Area */}
      <div className="business-svg-overlay absolute top-[10%] left-[2%] w-[45%] h-[80%] hidden xl:flex items-center justify-center pointer-events-none z-0 opacity-80 transition-transform duration-300">
        <MultiBusinessSvg />
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-slate-50/70 via-transparent to-slate-50/40 z-0 pointer-events-none" />

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 z-30 p-2.5 rounded-full bg-white/80 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100/60 shadow-sm transition-all duration-200 flex items-center justify-center group"
        aria-label="Back"
      >
        <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* Success redirects */}
      <AnimatePresence>
        {showSuccess && <SuccessAnimation onComplete={onAnimationComplete} />}
      </AnimatePresence>

      {/* Center Grid containing the pristine Admin gateway card */}
      <div className="w-full max-w-5xl px-6 relative z-10 flex flex-col xl:flex-row items-center justify-end">
        
        {/* Right Side / Centered: Administrative Login Glass Card */}
        <div className="w-full max-w-md mx-auto xl:mr-12">
          <div
            ref={cardRef}
            className={`login-card-container w-full rounded-3xl backdrop-blur-3xl bg-white/75 border border-slate-200/80 luxury-card-glow shadow-[0_25px_50px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] overflow-hidden relative ${
              shakeCard ? 'shake-active' : ''
            }`}
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Top reflection line */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent opacity-80" />

            {/* Back to phone-input selector */}
            <AnimatePresence>
              {showOTP && (
                <motion.button
                  key="admin-back-btn"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => {
                    setError('');
                    setShowOTP(false);
                  }}
                  className="absolute top-6 left-6 z-30 p-2 rounded-xl bg-slate-100/60 border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all duration-300 shadow-sm group"
                >
                  <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
                </motion.button>
              )}
            </AnimatePresence>

            <div className="pt-10 pb-6 px-8 flex flex-col items-center text-center">
              {/* Logo sweep animation */}
              <div className="login-logo mb-5 relative group cursor-pointer" style={{ transformStyle: "preserve-3d", transform: "translateZ(30px)" }}>
                <div className="absolute inset-0 rounded-full bg-indigo-500/15 blur-xl group-hover:scale-125 transition-transform duration-500" />
                <img
                  src="/assets/laxmartlogo-removebg-preview.png"
                  alt="LaxMart"
                  className="h-16 w-auto relative z-10 filter drop-shadow-[0_4px_8px_rgba(79,70,229,0.15)] hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Dynamic Card Header */}
              <div className="form-element select-none" style={{ transform: "translateZ(25px)" }}>
                {showOTP ? (
                  <motion.h2
                    className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-700 to-blue-700 mb-2 font-sans tracking-tight"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    Verify Token
                  </motion.h2>
                ) : (
                  <AnimatedLogoText />
                )}
              </div>

              <p
                className="form-element text-slate-500 text-xs md:text-sm mb-6 max-w-[280px] font-semibold leading-relaxed"
                style={{ transform: "translateZ(15px)" }}
              >
                {showOTP ? (
                  <span className="flex items-center justify-center gap-1.5 text-slate-600 font-bold">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Sent token to <strong className="text-indigo-600 font-bold">+91 {mobileNumber}</strong>
                  </span>
                ) : (
                  "Administrative portal access. Authorized operators with active cryptographic keys only."
                )}
              </p>
            </div>

            <div className="px-8 pb-10" style={{ transform: "translateZ(20px)" }}>
              <AnimatePresence mode="wait">
                {!showOTP ? (
                  <motion.div
                    key="admin-phone-form"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="space-y-6 form-element"
                  >
                    {/* Phone Input with India Dot prefixes */}
                    <div className="relative group/input">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400 font-bold text-base pr-3 border-r border-slate-200 transition-colors group-focus-within/input:text-indigo-600 group-focus-within/input:border-indigo-600/30">
                        <span className="flex flex-col gap-0.5 justify-center mr-0.5">
                          <span className="w-1.5 h-1 rounded-full bg-amber-500" />
                          <span className="w-1.5 h-1 rounded-full bg-white border border-slate-200" />
                          <span className="w-1.5 h-1 rounded-full bg-emerald-500" />
                        </span>
                        +91
                      </div>

                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full bg-white pl-[5.5rem] pr-12 py-4 rounded-2xl border border-slate-200 text-base font-semibold text-slate-800 placeholder-slate-400 outline-none transition-all duration-200 hover:border-slate-300 focus:border-indigo-600 focus:bg-white focus:ring-4 focus:ring-indigo-600/10 focus:shadow-[0_0_15px_rgba(99,102,241,0.08)]"
                        placeholder="Authorized mobile"
                        maxLength={10}
                        disabled={loading}
                      />

                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors duration-200">
                        <Smartphone className="w-5 h-5" />
                      </div>
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-rose-600 text-xs font-semibold text-center bg-rose-50 border border-rose-100 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                        {error}
                      </motion.div>
                    )}

                    <button
                      onClick={handleMobileLogin}
                      disabled={mobileNumber.length !== 10 || loading}
                      className={`w-full py-4 rounded-2xl font-bold text-base tracking-wider relative overflow-hidden transition-all duration-200 group flex items-center justify-center gap-2 ${
                        mobileNumber.length === 10 && !loading
                          ? 'bg-gradient-to-r from-indigo-700 via-blue-600 to-indigo-800 hover:from-indigo-600 hover:to-blue-600 text-white cursor-pointer shadow-[0_4px_25px_rgba(99,102,241,0.2)] hover:shadow-[0_4px_35px_rgba(99,102,241,0.3)] active:scale-[0.98]'
                          : 'bg-slate-100 text-slate-400 border border-slate-200/50 cursor-not-allowed'
                      }`}
                    >
                      {loading ? (
                        <div className="flex justify-center">
                          <div className="w-6 h-6 border-3 border-indigo-200 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : (
                        <>
                          Authorize Entry
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}

                      {mobileNumber.length === 10 && !loading && (
                        <div
                          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                          style={{
                            transform: 'skewX(-25deg)',
                            animation: 'shimmerSweep 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite'
                          }}
                        />
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="admin-otp-form"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="space-y-6"
                  >
                    {/* Custom Admin styled Cobalt Blue OTP field overrides */}
                    <div className="flex justify-center [&_input]:!bg-white [&_input]:!text-indigo-600 [&_input]:!border-slate-200 [&_input]:!w-14 [&_input]:!h-14 [&_input]:!text-2xl [&_input]:!font-extrabold [&_input]:!rounded-2xl [&_input]:focus:!border-indigo-600 [&_input]:focus:!ring-4 [&_input]:focus:!ring-indigo-600/10 [&_input]:!transition-all [&_input]:!duration-200 [&_input]:!shadow-[0_4px_12px_rgba(15,23,42,0.04)] group-focus-within:[&_input]:border-slate-300">
                      <OTPInput length={4} onComplete={handleOTPComplete} disabled={loading} />
                    </div>

                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-rose-600 text-xs font-semibold text-center bg-rose-50 border border-rose-100 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
                        {error}
                      </motion.div>
                    )}

                    <div className="flex gap-4 text-sm font-semibold pt-2">
                      <button
                        onClick={() => {
                          setShowOTP(false);
                          setError('');
                        }}
                        className="flex-1 py-3.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 rounded-xl text-slate-500 hover:text-slate-800 transition-all duration-200 text-center active:scale-95 cursor-pointer shadow-sm"
                      >
                        Change Number
                      </button>
                      <button
                        onClick={handleMobileLogin}
                        disabled={loading}
                        className="flex-1 py-3.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 rounded-xl text-slate-500 hover:text-slate-800 transition-all duration-200 text-center active:scale-95 cursor-pointer shadow-sm flex items-center justify-center gap-1"
                      >
                        Resend OTP
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Back to Client/Seller portals */}
              <div className="mt-8 pt-5 border-t border-slate-100 text-center form-element flex justify-around text-xs font-bold" style={{ transform: "translateZ(10px)" }}>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-indigo-600 hover:text-indigo-700 hover:underline transition-all duration-200"
                >
                  Client Login
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleSellerLogin}
                  className="text-emerald-600 hover:text-emerald-700 hover:underline transition-all duration-200"
                >
                  Seller Portal
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Admin brand footer */}
      <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 text-center w-full font-semibold uppercase tracking-widest leading-loose pointer-events-none">
        LaxMart Infrastructure Grid • Cluster-Mumbai Node-09 SLA Sec-JWT-Enabled
      </p>
    </div>
  );
}
