import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sendOTP, verifyOTP } from '../../services/api/auth/customerAuthService';
import { useAuth } from '../../context/AuthContext';
import OTPInput from '../../components/OTPInput';
import Lottie from 'lottie-react';
import groceryAnimation from '../../../assets/animation/Grocery-animation.json';

// High-quality assets (using emojis with advanced styling for now)
const GROCERY_ITEMS = [
  '🥬', '🍅', '🧀', '🥕', '🥔', '🍞', '🍎',
  '🥦', '🧅', '🍌', '🥛', '🍇', '🍊', '🍓', '🥥'
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
  <motion.div
    initial={{ opacity: 0, y: 100, rotate: 0 }}
    animate={{
      opacity: [0, 0.8, 0],
      y: [100, -100],
      rotate: [0, 45, -45, 0],
      x: [0, 20, -20, 0]
    }}
    transition={{
      duration: duration,
      repeat: Infinity,
      delay: delay,
      ease: "linear",
    }}
    className="absolute select-none pointer-events-none will-change-transform"
    style={{
      left: x,
      top: y,
      fontSize: `${3 * scale}rem`,
      filter: `blur(${blur}px)`,
      zIndex: Math.floor(scale * 10)
    }}
  >
    {children}
  </motion.div>
);

const SuccessAnimation = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-green-600 overflow-hidden"
      initial={{
        clipPath: "circle(0% at 50% 90%)",
        opacity: 1
      }}
      animate={{
        clipPath: "circle(150% at 50% 50%)",
        transition: { duration: 0.8, ease: "easeOut" }
      }}
      exit={{ opacity: 0 }}
    >
      {/* Dynamic Background Lines for Speed Effect */}
      <div className="absolute inset-0 w-full h-full opacity-30">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
            style={{
              top: `${Math.random() * 100}%`,
              left: '-20%',
              width: `${Math.random() * 50 + 20}%`
            }}
            animate={{ x: window.innerWidth * 1.5 }}
            transition={{
              duration: 0.2 + Math.random() * 0.3,
              repeat: Infinity,
              ease: "linear",
              delay: Math.random() * 0.5
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ scale: 0, rotate: -20, x: -200 }}
        animate={{ scale: 1.5, rotate: 0, x: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 12, delay: 0.1 }}
        className="text-9xl relative z-20 drop-shadow-2xl filter brightness-110"
      >
        🛒
        {/* Items flying into cart */}
        {GROCERY_ITEMS.slice(0, 6).map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: 400, y: -400 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: [1.5, 0.5] }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.5, type: "spring" }}
            className="absolute top-0 left-0 text-6xl"
          >
            {item}
          </motion.div>
        ))}
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="text-4xl font-black text-white mt-12 tracking-tighter uppercase italic drop-shadow-lg"
      >
        On the way!
      </motion.h2>

      {/* Cart zooms away */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: 1500, opacity: 0 }}
        transition={{ delay: 2.2, duration: 0.4, ease: "easeIn" }}
        onAnimationComplete={onComplete}
        className="absolute inset-0"
      />
    </motion.div>
  );
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bgItems, setBgItems] = useState<FloatingItemProps[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Generate layered background items
    const items: FloatingItemProps[] = [];
    for (let i = 0; i < 20; i++) {
      const item = GROCERY_ITEMS[i % GROCERY_ITEMS.length];
      const scale = 0.5 + Math.random() * 1; // 0.5 to 1.5
      const blur = scale < 0.8 ? 4 : (scale > 1.2 ? 2 : 0); // Blur distant or very close items
      items.push({
        delay: Math.random() * 5,
        x: `${Math.random() * 100}%`,
        y: `${Math.random() * 100}%`,
        scale,
        blur,
        duration: 10 + Math.random() * 10,
        children: item
      });
    }
    setBgItems(items);
  }, []);

  const handleContinue = async () => {
    if (mobileNumber.length !== 10) return;
    setLoading(true);
    setError('');

    try {
      const response = await sendOTP(mobileNumber);
      if (response.sessionId) {
        setSessionId(response.sessionId);
      }
      setShowOTP(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to initiate call. Please try again.');
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
        // Stagger visual success
        setLoading(false);
        setShowSuccess(true);
        (window as any).tempUserData = userData;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setLoading(false);
    }
  };

  const onAnimationComplete = () => {
    const userData = (window as any).tempUserData;
    if (userData) {
      login(userData.token, userData.user);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center font-sans tracking-wide bg-neutral-900">

      {/* Scene 1: Cinematic Living Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900 via-emerald-800 to-black z-0">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1),_transparent_70%)]"></div>
        {/* Floating Parallax Items */}
        {bgItems.map((props, i) => (
          <FloatingItem key={i} {...props} />
        ))}
      </div>

      {/* Overlay Gradient for focus */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 z-0 pointer-events-none" />

      <AnimatePresence>
        {showSuccess && <SuccessAnimation onComplete={onAnimationComplete} />}
      </AnimatePresence>

      {/* Scene 2: Glassmorphism Card Slide Up */}
      <motion.div
        className="w-full max-w-sm px-4 relative z-10"
        initial={{ y: "120%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 70,
          damping: 15,
          delay: 0.5, // 0.5s initial delay for user to see background
          duration: 1.5
        }}
      >
        <div className="backdrop-blur-md bg-white/10 border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-3xl overflow-hidden relative">

          {/* Top Gloss */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-50"></div>

          <div className="pt-8 pb-6 px-6 flex flex-col items-center text-center">
            {/* Logo Pulse */}
            <motion.div
              className="mb-4 relative"
              animate={{
                filter: ["drop-shadow(0 0 0px rgba(74, 222, 128, 0))", "drop-shadow(0 0 15px rgba(74, 222, 128, 0.5))", "drop-shadow(0 0 0px rgba(74, 222, 128, 0))"]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <img
                src="/assets/ChatGPT Image Feb 11, 2026, 01_01_14 PM.png"
                alt="LaxMart"
                className="h-14 w-auto drop-shadow-lg"
              />
            </motion.div>

            <motion.h2
              className="text-2xl font-bold text-white mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              {showOTP ? 'Verification Code' : 'Groceries in Minutes'}
            </motion.h2>

            <motion.p
              className="text-green-100/70 text-sm mb-6 max-w-[250px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
            >
              {showOTP ? `Sent to +91 ${mobileNumber}` : 'Fresh produce delivered to your doorstep lightning fast.'}
            </motion.p>

            {/* Lottie Container */}
            <div className="w-40 h-40 absolute top-2 right-2 opacity-10 pointer-events-none rotate-12">
              <Lottie animationData={groceryAnimation} loop={true} />
            </div>
          </div>

          <div className="px-6 pb-8">
            <AnimatePresence mode="wait">
              {!showOTP ? (
                <motion.div
                  key="phone"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-medium text-lg pr-3 border-r border-white/20">
                      +91
                    </div>
                    <motion.input
                      type="tel"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full bg-white/5 pl-[4.5rem] pr-4 py-4 rounded-xl border border-white/10 text-lg text-white placeholder-white/30 outline-none transition-all"
                      placeholder="Phone Number"
                      maxLength={10}
                      whileFocus={{
                        backgroundColor: "rgba(255, 255, 255, 0.1)",
                        borderColor: "rgba(74, 222, 128, 0.5)",
                        boxShadow: "0 0 20px rgba(74, 222, 128, 0.1)"
                      }}
                    />
                  </div>

                  {error && <div className="text-red-300 text-xs text-center">{error}</div>}

                  <motion.button
                    onClick={handleContinue}
                    disabled={mobileNumber.length !== 10 || loading}
                    whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(74, 222, 128, 0.4)" }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-full py-4 rounded-xl font-bold text-lg relative overflow-hidden ${mobileNumber.length === 10 && !loading
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-900/20'
                      : 'bg-white/10 text-white/30 cursor-not-allowed'
                      }`}
                  >
                    {loading ? (
                      <div className="flex justify-center"><div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /></div>
                    ) : 'Continue'}
                    {/* Shine effect on button */}
                    <motion.div
                      className="absolute top-0 -left-full w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
                      animate={{ left: "200%" }}
                      transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
                    />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-6"
                >
                  {/* Custom styling for OTP Input would be needed here to match dark theme, 
                        assuming OTPInput accepts classNames or styles. If not, wrapping it. 
                        For now, assuming it inherits roughly or we style the wrapper. */}
                  <div className="flex justify-center [&_input]:bg-white/10 [&_input]:text-white [&_input]:border-white/20">
                    <OTPInput onComplete={handleOTPComplete} disabled={loading} />
                  </div>

                  {error && <div className="text-red-300 text-xs text-center">{error}</div>}

                  <div className="flex gap-4 text-xs font-medium text-white/60">
                    <button onClick={() => setShowOTP(false)} className="flex-1 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">Wrong Number?</button>
                    <button onClick={handleContinue} className="flex-1 py-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">Resend Code</button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-8 text-center">
              <p className="text-[10px] text-white/30 uppercase tracking-widest hover:text-white/50 transition-colors cursor-pointer">
                Secure Login • Terms Apply
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
