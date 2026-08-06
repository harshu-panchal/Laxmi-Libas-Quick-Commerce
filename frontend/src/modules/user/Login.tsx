import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sendOTP, verifyOTP } from '../../services/api/auth/customerAuthService';
import { useAuth } from '../../context/AuthContext';
import OTPInput from '../../components/OTPInput';
import Lottie from 'lottie-react';
import groceryAnimation from '../../../assets/animation/Grocery-animation.json';
import { gsap } from 'gsap';
import { Smartphone, ArrowRight, ShieldCheck, ChevronLeft, Sparkles } from 'lucide-react';

// Optimized Category Floating Items (for Laxmart Super-App: E-com, Bus, Hotel)
const FLOATING_ASSETS = [
  { type: 'emoji', content: '🛍️' },
  { type: 'emoji', content: '🚌' },
  { type: 'emoji', content: '🏨' },
  { type: 'emoji', content: '📦' },
  { type: 'emoji', content: '🔑' },
  {
    type: 'svg',
    content: (
      <svg className="w-10 h-10 text-cyan-600/45 filter drop-shadow-[0_0_8px_rgba(8,145,178,0.2)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
      </svg>
    )
  },
  {
    type: 'svg',
    content: (
      <svg className="w-11 h-11 text-violet-600/45 filter drop-shadow-[0_0_8px_rgba(124,58,237,0.2)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 17h.01M16 17h.01M2 12V7a3 3 0 013-3h14a3 3 0 013 3v5M2 12h20M2 12v5a2 2 0 002 2h2m10 0h2a2 2 0 002-2v-5M6 19a2 2 0 100-4 2 2 0 000 4zm12 0a2 2 0 100-4 2 2 0 000 4zM4 8h16M9 12h6" />
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

const SuccessAnimation = ({ onComplete }: { onComplete: () => void }) => {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; size: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    // Generate beautiful pastel success particles
    const arr = [];
    const colors = ['#f59e0b', '#fbbf24', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];
    for (let i = 0; i < 35; i++) { // Optimized particle count for speed
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
        transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } // Shorter transition duration
      }}
      exit={{ opacity: 0 }}
    >
      {/* Cinematic Golden Speed Speedway */}
      <div className="absolute inset-0 w-full h-full opacity-35 pointer-events-none">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-[1.5px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_8px_rgba(99,102,241,0.5)]"
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

      <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full bg-cyan-200/20 filter blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-violet-200/20 filter blur-[80px] pointer-events-none" />

      <div className="relative flex flex-col items-center justify-center z-20">
        <div className="relative w-40 h-40 mb-6 flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-400 via-indigo-400 to-amber-300 blur-xl opacity-40"
            animate={{ rotate: 360, scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          />

          {/* Central Golden Super Shield */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.5, type: "spring", stiffness: 150, damping: 14 }}
            className="w-24 h-24 rounded-3xl bg-white border-2 border-amber-400 flex items-center justify-center shadow-[0_10px_30px_rgba(245,158,11,0.25)] z-10"
          >
            <Sparkles className="w-12 h-12 text-amber-500 filter drop-shadow-[0_0_6px_rgba(245,158,11,0.4)]" />
          </motion.div>

          {/* Particles Burst */}
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
              transition={{ delay: p.delay, duration: 0.8, ease: "easeOut" }} // Shorter particle burst
            />
          ))}
        </div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-amber-600 tracking-wider text-center uppercase font-sans"
        >
          Welcome to LaxMart
        </motion.h2>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.55 }}
          className="text-slate-500 text-xs mt-2.5 font-bold tracking-wide animate-pulse"
        >
          Unlocking India's Ultimate Super-App...
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1.3, duration: 0.2 }} // Accelerated redirection speed
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
          className="logo-char inline-block text-4xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 font-sans select-none drop-shadow-[0_2px_4px_rgba(217,119,6,0.15)]"
        >
          {char}
        </span>
      ))}
    </div>
  );
};

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bgItems, setBgItems] = useState<FloatingItemProps[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shakeCard, setShakeCard] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  // Optimized background elements count to prevent paint lags
  useEffect(() => {
    const items: FloatingItemProps[] = [];
    for (let i = 0; i < 10; i++) { // Halved size for performance
      const asset = FLOATING_ASSETS[i % FLOATING_ASSETS.length];
      const scale = 0.55 + Math.random() * 0.65; // 0.55 to 1.2
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
    // 1. Initial Snappy Timeline Loading Sequence (Under 0.7s total)
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

    gsap.set(".orb-bg", { opacity: 0, scale: 0.5 });
    gsap.set(".login-logo", { scale: 0, rotation: -90, opacity: 0 });
    gsap.set(".logo-char", { opacity: 0, y: -20, scale: 0.7 });
    gsap.set(".login-card-container", { y: "100%", opacity: 0, scale: 0.94, rotateX: 12 });
    gsap.set(".form-element", { opacity: 0, y: 15 });
    gsap.set(".parallax-bg-item", { opacity: 0, scale: 0 });

    tl.to(".orb-bg", { opacity: 1, scale: 1, duration: 1.0 })
      .to(".parallax-bg-item", { opacity: 0.75, scale: 1, duration: 0.5, stagger: 0.02, ease: "back.out(1.2)" }, "-=0.8")
      .to(".login-logo", { scale: 1, rotation: 0, opacity: 1, duration: 0.55, ease: "back.out(1.5)" }, "-=0.5")
      .to(".logo-char", { opacity: 1, y: 0, scale: 1, duration: 0.3, stagger: 0.03, ease: "back.out(1.5)" }, "-=0.45")
      .to(".login-card-container", { y: 0, opacity: 1, scale: 1, rotateX: 0, duration: 0.65, ease: "power3.out" }, "-=0.4")
      .to(".form-element", { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: "power2.out" }, "-=0.5");

    // 2. High-speed lag-free 3D hover tilt logic
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

      // Accelerated interpolation duration (0.2s for instant response)
      gsap.to(card, {
        rotateX: rotateX,
        rotateY: rotateY,
        transformPerspective: 1200,
        ease: "power2.out",
        duration: 0.22
      });

      // Background items drift instantly
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

  const handleContinue = async () => {
    if (mobileNumber.length !== 10) {
      triggerShake();
      return;
    }
    setLoading(true);
    setError('');

    try {
      const response = await sendOTP(mobileNumber);
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }
      setShowOTP(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate verification. Please try again.');
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  const handleOTPComplete = async (otp: string) => {
    setLoading(true);
    setError('');

    try {
      const response = await verifyOTP(mobileNumber, otp, sessionId);
      if (response.success && response.data) {
        const userData = {
          token: response.data.token,
          user: response.data.user
        };
        setLoading(false);
        setShowSuccess(true);
        (window as any).tempUserData = userData;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      triggerShake();
      setLoading(false);
    }
  };

  const onAnimationComplete = () => {
    const userData = (window as any).tempUserData;
    if (userData) {
      login(userData.token, userData.user);
      const redirect = searchParams.get('redirect');
      navigate(redirect || '/');
    }
  };

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden flex items-center justify-center font-sans tracking-wide bg-slate-50 select-none text-slate-800"
    >
      {/* Dynamic CSS Styling Injection optimized for 144Hz performance */}
      <style>{`
        @keyframes orbDrift {
          0% { transform: translate3d(0,0,0) scale(1); }
          50% { transform: translate3d(20px, -20px, 0) scale(1.05); }
          100% { transform: translate3d(0,0,0) scale(1); }
        }
        @keyframes breathing {
          0%, 100% { transform: translate3d(0,0,0) rotate(0deg); }
          50% { transform: translate3d(0,-4px,0) rotate(1.5deg); }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 4px 15px rgba(99, 102, 241, 0.04), inset 0 0 10px rgba(255, 255, 255, 0.5); }
          50% { box-shadow: 0 8px 30px rgba(99, 102, 241, 0.1), inset 0 0 15px rgba(255, 255, 255, 0.7); }
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
          animation: orbDrift 25s ease-in-out infinite;
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
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>

      {/* Cinematic Glowing Pastel Liquid Orbs Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="orb-bg absolute top-[-10%] left-[-10%] w-[55%] h-[55%] rounded-full bg-indigo-200/30 filter blur-[100px] animate-orb-drift" />
        <div className="orb-bg absolute bottom-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full bg-violet-200/35 filter blur-[110px] animate-orb-drift" />
        
        {/* Holographic clean grid blueprint overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_65%_60%_at_50%_50%,#000_65%,transparent_100%)] opacity-35" />
      </div>

      {/* Parallax Floating Category Icons */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {bgItems.map((props, i) => (
          <FloatingItem key={i} {...props} />
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-slate-50/70 via-transparent to-slate-50/40 z-0 pointer-events-none" />

      {/* Success Redirect Wave */}
      <AnimatePresence>
        {showSuccess && <SuccessAnimation onComplete={onAnimationComplete} />}
      </AnimatePresence>

      {/* Glassmorphic 3D Login Card Container */}
      <div className="w-full max-w-md px-6 relative z-10">
        <div
          ref={cardRef}
          className={`login-card-container w-full rounded-3xl backdrop-blur-3xl bg-white/70 border border-slate-200/80 luxury-card-glow shadow-[0_25px_50px_rgba(15,23,42,0.05),inset_0_1px_1px_rgba(255,255,255,0.8)] overflow-hidden relative ${
            shakeCard ? 'shake-active' : ''
          }`}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Subtle top reflection rim */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent opacity-80"></div>

          {/* Back Chevron when on OTP screen */}
          <AnimatePresence>
            {showOTP && (
              <motion.button
                key="back-btn"
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
            {/* Logo Sweep Animation */}
            <div className="login-logo mb-5 relative group cursor-pointer" style={{ transformStyle: "preserve-3d", transform: "translateZ(30px)" }}>
              <div className="absolute inset-0 rounded-full bg-amber-400/15 blur-xl group-hover:scale-125 transition-transform duration-500" />
              <img
                src="/assets/laxmartlogo-removebg-preview.png"
                alt="LaxMart"
                className="h-16 w-auto relative z-10 filter drop-shadow-[0_4px_8px_rgba(217,119,6,0.15)] hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* Dynamic Card Header */}
            <div className="form-element select-none" style={{ transform: "translateZ(25px)" }}>
              {showOTP ? (
                <motion.h2
                  className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 mb-2 font-sans tracking-tight"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  Verify OTP
                </motion.h2>
              ) : (
                <AnimatedLogoText />
              )}
            </div>

            <p
              className="form-element text-slate-500 text-xs md:text-sm mb-6 max-w-[280px] font-medium leading-relaxed"
              style={{ transform: "translateZ(15px)" }}
            >
              {showOTP ? (
                <span className="flex items-center justify-center gap-1.5 text-slate-600">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Sent secure code to <strong className="text-indigo-600 font-bold">+91 {mobileNumber}</strong>
                </span>
              ) : (
                "India's ultimate platform for e-commerce, express logistics, bus tickets & hotel rooms."
              )}
            </p>

            <div className="w-44 h-44 absolute -top-4 -right-4 opacity-[0.03] pointer-events-none rotate-12">
              <Lottie animationData={groceryAnimation} loop={true} />
            </div>
          </div>

          <div className="px-8 pb-10" style={{ transform: "translateZ(20px)" }}>
            <AnimatePresence mode="wait">
              {!showOTP ? (
                <motion.div
                  key="phone-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.22, ease: "easeOut" }} // Snappy form slide
                  className="space-y-6 form-element"
                >
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
                      placeholder="Enter mobile number"
                      maxLength={10}
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
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                      {error}
                    </motion.div>
                  )}

                  <button
                    onClick={handleContinue}
                    disabled={mobileNumber.length !== 10 || loading}
                    className={`w-full py-4 rounded-2xl font-bold text-base tracking-wider relative overflow-hidden transition-all duration-200 group flex items-center justify-center gap-2 ${
                      mobileNumber.length === 10 && !loading
                        ? 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700 hover:from-indigo-500 hover:to-violet-500 text-white cursor-pointer shadow-[0_4px_25px_rgba(99,102,241,0.2)] hover:shadow-[0_4px_35px_rgba(99,102,241,0.3)] active:scale-[0.98]'
                        : 'bg-slate-100 text-slate-400 border border-slate-200/50 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <div className="flex justify-center">
                        <div className="w-6 h-6 border-3 border-indigo-200 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : (
                      <>
                        Get OTP Code
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
                  key="otp-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="space-y-6"
                >
                  <div className="flex justify-center [&_input]:!bg-white [&_input]:!text-indigo-600 [&_input]:!border-slate-200 [&_input]:!w-14 [&_input]:!h-14 [&_input]:!text-2xl [&_input]:!font-extrabold [&_input]:!rounded-2xl [&_input]:focus:!border-indigo-600 [&_input]:focus:!ring-4 [&_input]:focus:!ring-indigo-600/10 [&_input]:!transition-all [&_input]:!duration-200 [&_input]:!shadow-[0_4px_12px_rgba(15,23,42,0.04)] group-focus-within:[&_input]:border-slate-300">
                    <OTPInput length={4} onComplete={handleOTPComplete} disabled={loading} />
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-rose-600 text-xs font-semibold text-center bg-rose-50 border border-rose-100 py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
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
                      Wrong Number
                    </button>
                    <button
                      onClick={handleContinue}
                      disabled={loading}
                      className="flex-1 py-3.5 px-4 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 hover:border-slate-300 rounded-xl text-slate-500 hover:text-slate-800 transition-all duration-200 text-center active:scale-95 cursor-pointer shadow-sm flex items-center justify-center gap-1"
                    >
                      Resend Code
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Premium Branding Footer */}
            <div className="mt-8 text-center form-element" style={{ transform: "translateZ(10px)" }}>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold hover:text-indigo-600 hover:drop-shadow-[0_0_6px_rgba(99,102,241,0.15)] transition-all duration-200 cursor-pointer">
                LaxMart Secure Shield • Privacy & Terms Apply
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
