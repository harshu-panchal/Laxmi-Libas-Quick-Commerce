import React, { useState } from 'react';
import { MapPin, Navigation, RefreshCw, Loader2 } from 'lucide-react';

interface Props {
    value: any;
    onChange: (val: any) => void;
}

const StepAddress: React.FC<Props> = ({ value, onChange }) => {
    const [fetching, setFetching] = useState(false);
    const [showForm, setShowForm] = useState(!!(value?.city));

    const handleGPS = async () => {
        setFetching(true);
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    // In a real app, you'd reverse geocode here. 
                    // For now, let's just show the form.
                    setFetching(false);
                    setShowForm(true);
                    onChange({ ...value, latitude, longitude });
                },
                (error) => {
                    setFetching(false);
                    setShowForm(true);
                }
            );
        } else {
            setFetching(false);
            setShowForm(true);
        }
    };

    const handleChange = (field: string, val: string) => {
        onChange({ ...value, [field]: val });
    };

    return (
        <div className="pt-4">
            <h2 className="text-3xl font-[1000] text-gray-900 tracking-tight leading-tight mb-4">
                Where is your <br/> property located?
            </h2>
            <p className="text-gray-500 font-bold mb-10 leading-relaxed">
                Enter your full address or use GPS to pinpoint your exact location.
            </p>

            {!showForm && !fetching ? (
                <div className="space-y-4">
                    <button
                        onClick={handleGPS}
                        className="w-full p-8 rounded-[32px] bg-hotel-DEFAULT text-white shadow-2xl shadow-hotel-light/20 flex flex-col items-center gap-4 active:scale-[0.98] transition-all"
                    >
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                            <Navigation size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black">Use Current Location</h3>
                            <p className="text-white/70 font-bold text-sm mt-1 uppercase tracking-widest">Recommended</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setShowForm(true)}
                        className="w-full p-8 rounded-[32px] bg-gray-50 border-2 border-gray-100 text-gray-900 flex flex-col items-center gap-4 active:scale-[0.98] transition-all hover:border-gray-200"
                    >
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-100 text-gray-400">
                            <MapPin size={32} />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black text-gray-800">Enter Manually</h3>
                            <p className="text-gray-400 font-bold text-sm mt-1 uppercase tracking-widest">Type Address</p>
                        </div>
                    </button>
                </div>
            ) : fetching ? (
                <div className="flex flex-col items-center justify-center py-20 gap-6">
                    <Loader2 className="animate-spin text-hotel-DEFAULT" size={48} />
                    <div className="text-center">
                        <p className="text-xl font-black text-gray-900">Locating you...</p>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">Connecting to satellites</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Address Details</h4>
                        <button onClick={() => setShowForm(false)} className="text-[10px] font-black text-hotel-DEFAULT uppercase tracking-widest flex items-center gap-1">
                            <RefreshCw size={10} /> Change
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Building / Street</label>
                            <input
                                type="text"
                                value={value?.street || ''}
                                onChange={(e) => handleChange('street', e.target.value)}
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-hotel-DEFAULT focus:bg-white rounded-2xl py-4 px-6 text-lg font-black text-gray-900 outline-none transition-all"
                                placeholder="e.g. 123 Luxury Villa, Beach Road"
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">City</label>
                                <input
                                    type="text"
                                    value={value?.city || ''}
                                    onChange={(e) => handleChange('city', e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-hotel-DEFAULT focus:bg-white rounded-2xl py-4 px-6 text-lg font-black text-gray-900 outline-none transition-all"
                                    placeholder="City"
                                />
                            </div>
                             <div className="space-y-1.5">
                                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Pincode</label>
                                <input
                                    type="text"
                                    value={value?.zipCode || ''}
                                    onChange={(e) => handleChange('zipCode', e.target.value)}
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-hotel-DEFAULT focus:bg-white rounded-2xl py-4 px-6 text-lg font-black text-gray-900 outline-none transition-all"
                                    placeholder="000 000"
                                />
                            </div>
                        </div>

                         <div className="space-y-1.5">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">State</label>
                            <input
                                type="text"
                                value={value?.state || ''}
                                onChange={(e) => handleChange('state', e.target.value)}
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-hotel-DEFAULT focus:bg-white rounded-2xl py-4 px-6 text-lg font-black text-gray-900 outline-none transition-all"
                                placeholder="State Name"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StepAddress;
