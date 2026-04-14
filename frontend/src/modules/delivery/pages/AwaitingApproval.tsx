import React from 'react';
import { motion } from 'framer-motion';
import { Clock, LogOut, CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';

const AwaitingApproval: React.FC = () => {
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/delivery/login');
    };

    return (
        <div className="min-h-screen bg-neutral-50 font-['Inter'] flex flex-col">
            <main className="flex-1 p-6 flex flex-col items-center justify-center">
                <div className="w-full max-w-lg space-y-6">
                    {/* Header Card */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="bg-white p-8 rounded-[32px] shadow-sm border border-neutral-100 text-center"
                    >
                        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center text-teal-600 mx-auto mb-6">
                            <Clock size={40} />
                        </div>
                        <h1 className="text-2xl font-black text-neutral-800 mb-2 tracking-tight">Registration Received!</h1>
                        <p className="text-sm font-bold text-neutral-500 max-w-sm mx-auto mb-8 leading-relaxed">
                            Welcome to LaxMart Delivery! Your application is currently being reviewed by our administrative team.
                        </p>

                        <div className="grid grid-cols-1 gap-4 text-left">
                            {/* Step 1 */}
                            <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-teal-600 font-black text-xs uppercase tracking-widest">Step 1</div>
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-black uppercase tracking-wider">Completed</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-teal-600 shadow-sm border border-neutral-100">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-neutral-800">Profile Review</div>
                                        <p className="text-[10px] font-bold text-neutral-400">Your documents were uploaded successfully.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 2 */}
                            <div className="p-5 bg-white rounded-2xl border-2 border-teal-500 shadow-xl shadow-teal-50 transform scale-[1.02]">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-teal-600 font-black text-xs uppercase tracking-widest">Step 2</div>
                                    <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded text-[10px] font-black uppercase tracking-wider animate-pulse">In Progress</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 border border-teal-100">
                                        <UserCheck size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-neutral-800">Final Verification</div>
                                        <p className="text-[10px] font-bold text-neutral-400">Our team is performing final background checks.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Step 3 */}
                            <div className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 opacity-60">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="text-neutral-400 font-black text-xs uppercase tracking-widest">Step 3</div>
                                    <span className="px-2 py-0.5 bg-neutral-100 text-neutral-400 rounded text-[10px] font-black uppercase tracking-wider">Pending</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-neutral-100 rounded-xl flex items-center justify-center text-neutral-300">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-neutral-400">Account Activation</div>
                                        <p className="text-[10px] font-bold text-neutral-400">Once approved, you can start earning.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Support Card */}
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-teal-600 rounded-[32px] p-6 text-white relative overflow-hidden shadow-lg"
                    >
                        <div className="relative z-10">
                            <h2 className="text-lg font-black mb-1">Need Help?</h2>
                            <p className="text-teal-100 text-xs mb-4 max-w-[200px] leading-relaxed font-bold">
                                Have questions about your application? Reach out to us.
                            </p>
                            <a 
                                href="mailto:support@laxmart.com"
                                className="inline-flex h-10 px-6 bg-white text-teal-700 rounded-xl items-center justify-center font-black text-xs uppercase tracking-widest hover:bg-teal-50 transition-colors shadow-md"
                            >
                                Contact Support
                            </a>
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/10 -skew-x-12 transform translate-x-1/4"></div>
                        <Clock className="absolute right-4 bottom-4 w-12 h-12 text-white/10" />
                    </motion.div>
                </div>
            </main>

            <footer className="p-6">
                <button
                    onClick={handleLogout}
                    className="w-full h-14 border border-neutral-200 text-neutral-500 rounded-2xl flex items-center justify-center gap-2 font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:border-neutral-300 transition-all active:scale-[0.98]"
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </footer>
        </div>
    );
};

export default AwaitingApproval;
