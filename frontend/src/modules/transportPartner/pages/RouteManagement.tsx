import React, { useState, useEffect } from 'react';
import { Plus, MapPin, Trash2, Edit2 } from 'lucide-react';
import { getSellerRoutes, addBusRoute } from '../../../services/api/transportPartnerService';
import GoogleMapsAutocomplete, { AutocompleteResult } from '../../../components/GoogleMapsAutocomplete';

interface Point {
    name: string;
    time: string;
}

const RouteManagement: React.FC = () => {
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form state
    const [from, setFrom] = useState('');
    const [fromLocation, setFromLocation] = useState<any>(null);
    const [to, setTo] = useState('');
    const [toLocation, setToLocation] = useState<any>(null);
    const [duration, setDuration] = useState('');
    const [pickups, setPickups] = useState<Point[]>([{ name: '', time: '' }]);
    const [dropoffs, setDropoffs] = useState<Point[]>([{ name: '', time: '' }]);

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const res = await getSellerRoutes();
            if (res.success) setRoutes(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRoute = async () => {
        if (!from || !to || !fromLocation || !toLocation) {
            alert("Please provide source and destination with locations");
            return;
        }
        try {
            const payload = {
                from,
                to,
                fromLocation: {
                    city: fromLocation.city,
                    state: fromLocation.state,
                    pincode: fromLocation.pincode,
                    address: fromLocation.address,
                    coordinates: {
                        lat: fromLocation.latitude,
                        lng: fromLocation.longitude
                    }
                },
                toLocation: {
                    city: toLocation.city,
                    state: toLocation.state,
                    pincode: toLocation.pincode,
                    address: toLocation.address,
                    coordinates: {
                        lat: toLocation.latitude,
                        lng: toLocation.longitude
                    }
                },
                duration,
                pickupPoints: pickups.filter(p => p.name && p.time),
                dropoffPoints: dropoffs.filter(p => p.name && p.time)
            };
            const res = await addBusRoute(payload);
            if (res.success) {
                // Fetch again to ensure we have the latest data from server
                const freshRoutes = await getSellerRoutes();
                if (freshRoutes.success) setRoutes(freshRoutes.data);
                setIsAdding(false);
                resetForm();
            }
        } catch (e: any) {
            alert(e.response?.data?.message || "Failed to add route");
        }
    };

    const resetForm = () => {
        setFrom('');
        setFromLocation(null);
        setTo('');
        setToLocation(null);
        setDuration('');
        setPickups([{ name: '', time: '' }]);
        setDropoffs([{ name: '', time: '' }]);
    };

    if (loading) return <div className="p-8 font-black uppercase text-xs tracking-widest text-neutral-400">Loading Network...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-[#1a1a1a] p-8 rounded-[2rem] text-white">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter">Route Network</h2>
                    <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest mt-1">Geographic Deployment</p>
                </div>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-teal-500 hover:bg-teal-400 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
                >
                    <Plus size={18} />
                    New Route
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-2">Source (From)</label>
                            <GoogleMapsAutocomplete 
                                value={from}
                                onChange={(result: AutocompleteResult) => {
                                    setFrom(result.address);
                                    setFromLocation({
                                        city: result.city,
                                        state: result.state,
                                        pincode: result.pincode,
                                        address: result.address,
                                        latitude: result.lat,
                                        longitude: result.lng
                                    });
                                }}
                                placeholder="Departure City"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-2">Destination (To)</label>
                            <GoogleMapsAutocomplete 
                                value={to}
                                onChange={(result: AutocompleteResult) => {
                                    setTo(result.address);
                                    setToLocation({
                                        city: result.city,
                                        state: result.state,
                                        pincode: result.pincode,
                                        address: result.address,
                                        latitude: result.lat,
                                        longitude: result.lng
                                    });
                                }}
                                placeholder="Arrival City"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-2">Total Duration</label>
                            <input 
                                value={duration}
                                onChange={e => setDuration(e.target.value)}
                                className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-teal-500/20 transition-all"
                                placeholder="e.g. 10h 30m"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
                        {/* Pickups */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-black text-neutral-800 uppercase tracking-widest mb-4">Pick-up Points</h4>
                            {pickups.map((p, i) => (
                                <div key={i} className="flex gap-2">
                                    <input 
                                        placeholder="Point Name"
                                        value={p.name}
                                        onChange={e => {
                                            const next = [...pickups];
                                            next[i].name = e.target.value;
                                            setPickups(next);
                                        }}
                                        className="flex-1 bg-neutral-50 border-none rounded-xl px-4 py-2 text-xs font-bold"
                                    />
                                    <input 
                                        placeholder="Time"
                                        value={p.time}
                                        onChange={e => {
                                            const next = [...pickups];
                                            next[i].time = e.target.value;
                                            setPickups(next);
                                        }}
                                        className="w-24 bg-neutral-50 border-none rounded-xl px-4 py-2 text-xs font-bold"
                                    />
                                </div>
                            ))}
                            <button 
                                onClick={() => setPickups([...pickups, { name: '', time: '' }])}
                                className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline"
                            >
                                + Add Point
                            </button>
                        </div>

                        {/* Dropoffs */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-black text-neutral-800 uppercase tracking-widest mb-4">Drop-off Points</h4>
                            {dropoffs.map((p, i) => (
                                <div key={i} className="flex gap-2">
                                    <input 
                                        placeholder="Point Name"
                                        value={p.name}
                                        onChange={e => {
                                            const next = [...dropoffs];
                                            next[i].name = e.target.value;
                                            setDropoffs(next);
                                        }}
                                        className="flex-1 bg-neutral-50 border-none rounded-xl px-4 py-2 text-xs font-bold"
                                    />
                                    <input 
                                        placeholder="Time"
                                        value={p.time}
                                        onChange={e => {
                                            const next = [...dropoffs];
                                            next[i].time = e.target.value;
                                            setDropoffs(next);
                                        }}
                                        className="w-24 bg-neutral-50 border-none rounded-xl px-4 py-2 text-xs font-bold"
                                    />
                                </div>
                            ))}
                            <button 
                                onClick={() => setDropoffs([...dropoffs, { name: '', time: '' }])}
                                className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline"
                            >
                                + Add Point
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-neutral-50">
                        <button onClick={handleAddRoute} className="bg-neutral-900 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">Enable Route</button>
                        <button onClick={() => setIsAdding(false)} className="bg-neutral-100 text-neutral-500 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {routes.map(route => (
                    <div key={route._id} className="bg-white p-6 rounded-[2rem] border border-neutral-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-all flex gap-2">
                            <button className="p-2 bg-neutral-50 text-neutral-400 hover:text-teal-500 rounded-full"><Edit2 size={14} /></button>
                            <button className="p-2 bg-neutral-50 text-neutral-400 hover:text-red-500 rounded-full"><Trash2 size={14} /></button>
                        </div>

                        <div className="flex items-center gap-4 mb-6">
                           <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                               <MapPin size={24} />
                           </div>
                           <div>
                               <div className="text-xl font-black text-neutral-800 tracking-tight">{route.from} → {route.to}</div>
                               <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{route.duration || 'Flexible Time'}</div>
                           </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-neutral-50">
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Total Stops</span>
                                <span className="text-sm font-black text-neutral-800">{route.pickupPoints.length + route.dropoffPoints.length}</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-neutral-50">
                                <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Pickups</span>
                                <span className="text-xs font-bold text-neutral-400">{route.pickupPoints[0]?.name || 'N/A'}...</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RouteManagement;
