import React, { useState } from 'react';
import { Bus as BusIcon, Camera, Plus, Zap, Shield, Coffee, Wifi, CheckCircle2 } from 'lucide-react';
import { addBus } from '../../../services/api/transportPartnerService';
import { useNavigate } from 'react-router-dom';

const AMENITIES = [
    { id: 'wifi', label: 'WIFI', icon: <Wifi size={16} /> },
    { id: 'ac', label: 'AC', icon: <Zap size={16} /> },
    { id: 'water', label: 'Water', icon: <Coffee size={16} /> },
    { id: 'charging', label: 'Charging Point', icon: <Zap size={16} /> },
    { id: 'blanket', label: 'Blanket', icon: <Plus size={16} /> },
    { id: 'emergency', label: 'Emergency Exit', icon: <Shield size={16} /> }
];

const AddBus: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    // Form
    const [busName, setBusName] = useState('');
    const [busNumber, setBusNumber] = useState('');
    const [busType, setBusType] = useState('AC Sleeper');
    const [operatorName, setOperatorName] = useState('');
    const [totalSeats, setTotalSeats] = useState('36');
    const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
    const [images, setImages] = useState<string[]>([]);

    const toggleAmenity = (id: string) => {
        setSelectedAmenities(prev => 
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                busName,
                busNumber,
                busType,
                operatorName,
                totalSeats: Number(totalSeats),
                amenities: selectedAmenities,
                images: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800"] // Mock image
            };
            const res = await addBus(payload);
            if (res.success) {
                navigate('/transport/dashboard');
            }
        } catch (e) {
            alert("Failed to register bus");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-20">
            <div className="bg-[#1a1a1a] p-10 rounded-[3rem] text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-4xl font-black tracking-tighter">Register New Coach</h2>
                    <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-1">Strategic Asset Management</p>
                </div>
                <div className="absolute right-[-5%] top-[-10%] opacity-10">
                    <BusIcon size={120} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
                    <h3 className="text-sm font-black text-neutral-800 uppercase tracking-widest flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                        Vehicle Essentials
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-2">Display Name</label>
                            <input 
                                value={busName}
                                onChange={e => setBusName(e.target.value)}
                                className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 text-sm font-bold"
                                placeholder="e.g. Laxmi Deluxe 1"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-2">License Number</label>
                            <input 
                                value={busNumber}
                                onChange={e => setBusNumber(e.target.value)}
                                className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 text-sm font-bold"
                                placeholder="e.g. MP09-AB-1234"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-2">Coach Type</label>
                                <select 
                                    value={busType}
                                    onChange={e => setBusType(e.target.value)}
                                    className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none"
                                >
                                    <option>AC Sleeper</option>
                                    <option>AC Seater</option>
                                    <option>Non-AC Sleeper</option>
                                    <option>Bharat Benz Luxury</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-2">Total Capacity</label>
                                <input 
                                    type="number"
                                    value={totalSeats}
                                    onChange={e => setTotalSeats(e.target.value)}
                                    className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 text-sm font-bold"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-2">Operator / Branding</label>
                            <input 
                                value={operatorName}
                                onChange={e => setOperatorName(e.target.value)}
                                className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 text-sm font-bold"
                                placeholder="Your Company Name"
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-6">
                        <h3 className="text-sm font-black text-neutral-800 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                            Onboard Amenities
                        </h3>
                        <div className="grid grid-cols-2 gap-3">
                            {AMENITIES.map(amenity => (
                                <button
                                    key={amenity.id}
                                    onClick={() => toggleAmenity(amenity.id)}
                                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${selectedAmenities.includes(amenity.id) ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-neutral-50 bg-neutral-50 text-neutral-400 hover:border-neutral-100'}`}
                                >
                                    {amenity.icon}
                                    <span className="text-[10px] font-black uppercase tracking-tight">{amenity.label}</span>
                                    {selectedAmenities.includes(amenity.id) && <CheckCircle2 size={14} className="ml-auto" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-sm space-y-4">
                        <h3 className="text-sm font-black text-neutral-800 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-teal-500 rounded-full"></div>
                            Fleet Identity
                        </h3>
                        <button className="w-full aspect-video bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-neutral-400 hover:bg-neutral-100 transition-all">
                            <Camera size={32} className="mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Upload Coach Photo</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex justify-center pt-6">
                <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="group relative bg-neutral-900 text-white px-20 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-2xl shadow-black/20"
                >
                    {loading ? 'Processing...' : 'Commission Asset'}
                </button>
            </div>
        </div>
    );
};

export default AddBus;
