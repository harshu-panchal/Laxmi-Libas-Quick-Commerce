import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Bus as BusIcon, MapPin, IndianRupee, Plus, Trash2 } from 'lucide-react';
import { getMyBuses, getSellerRoutes, getSellerSchedules, addBusSchedule } from '../../../services/api/transportPartnerService';

const SchedulePage: React.FC = () => {
    const [schedules, setSchedules] = useState<any[]>([]);
    const [buses, setBuses] = useState<any[]>([]);
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // Form
    const [busId, setBusId] = useState('');
    const [routeId, setRouteId] = useState('');
    const [departureTime, setDepartureTime] = useState('');
    const [arrivalTime, setArrivalTime] = useState('');
    const [departureDate, setDepartureDate] = useState('');
    const [arrivalDate, setArrivalDate] = useState('');
    const [basePrice, setBasePrice] = useState('');

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [busRes, routeRes, scheduleRes] = await Promise.all([
                getMyBuses(),
                getSellerRoutes(),
                getSellerSchedules()
            ]);
            if (busRes.success) setBuses(busRes.data);
            if (routeRes.success) setRoutes(routeRes.data);
            if (scheduleRes.success) setSchedules(scheduleRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSchedule = async () => {
        try {
            // Find selected bus to get seat count
            const bus = buses.find(b => b._id === busId);
            if (!bus) return;

            // Generate seats array based on bus.totalSeats
            const seats = [];
            for (let i = 1; i <= bus.totalSeats; i++) {
                seats.push({
                    seatNumber: i.toString(),
                    seatType: bus.busType.toLowerCase().includes('sleeper') ? 'sleeper' : 'seater',
                    isBooked: false,
                    price: Number(basePrice)
                });
            }

            const payload = {
                busId,
                routeId,
                departureTime,
                arrivalTime,
                departureDate,
                arrivalDate,
                basePrice: Number(basePrice),
                seats
            };

            const res = await addBusSchedule(payload);
            if (res.success) {
                setSchedules([...schedules, res.data]);
                setIsAdding(false);
                resetForm();
            }
        } catch (e) {
            alert("Failed to deploy schedule");
        }
    };

    const resetForm = () => {
        setBusId('');
        setRouteId('');
        setDepartureTime('');
        setArrivalTime('');
        setDepartureDate('');
        setArrivalDate('');
        setBasePrice('');
    };

    if (loading) return <div className="p-8 text-xs font-black uppercase text-neutral-400">Loading Deployment Data...</div>;

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center bg-[#1a1a1a] p-8 rounded-[2rem] text-white">
                <div>
                    <h2 className="text-3xl font-black tracking-tighter">Trip Deployment</h2>
                    <p className="text-neutral-400 font-bold uppercase text-[10px] tracking-widest mt-1">Live Fleet Orchestration</p>
                </div>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="bg-teal-500 hover:bg-teal-400 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all"
                >
                    <Plus size={18} />
                    Deploy Trip
                </button>
            </div>

            {isAdding && (
                <div className="bg-white p-8 rounded-[2.5rem] border border-neutral-100 shadow-xl space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-2">Select Bus</label>
                            <select 
                                value={busId}
                                onChange={e => setBusId(e.target.value)}
                                className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none"
                            >
                                <option value="">Choose Coach</option>
                                {buses.map(b => (
                                    <option key={b._id} value={b._id}>{b.busName} ({b.busNumber})</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-2">Select Route</label>
                            <select 
                                value={routeId}
                                onChange={e => setRouteId(e.target.value)}
                                className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 text-sm font-bold appearance-none"
                            >
                                <option value="">Choose Route</option>
                                {routes.map(r => (
                                    <option key={r._id} value={r._id}>{r.from} to {r.to}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-2">Base Fare (₹)</label>
                            <input 
                                type="number"
                                value={basePrice}
                                onChange={e => setBasePrice(e.target.value)}
                                className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 text-sm font-bold"
                                placeholder="800"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-2">Dep. Date</label>
                            <input type="date" value={departureDate} onChange={e => setDepartureDate(e.target.value)} className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 text-sm font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-2">Dep. Time</label>
                            <input type="time" value={departureTime} onChange={e => setDepartureTime(e.target.value)} className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 text-sm font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-2">Arr. Date</label>
                            <input type="date" value={arrivalDate} onChange={e => setArrivalDate(e.target.value)} className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 text-sm font-bold" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest ml-2">Arr. Time</label>
                            <input type="time" value={arrivalTime} onChange={e => setArrivalTime(e.target.value)} className="w-full bg-neutral-50 border-none rounded-2xl px-6 py-4 text-sm font-bold" />
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-neutral-50">
                        <button onClick={handleAddSchedule} className="bg-teal-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all">Start Deployment</button>
                        <button onClick={() => setIsAdding(false)} className="bg-neutral-100 text-neutral-500 px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-100">
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Bus / Coach</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Route</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Departure</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Fare</th>
                            <th className="px-6 py-5 text-[10px] font-black uppercase text-neutral-400 tracking-widest">Availability</th>
                            <th className="px-8 py-5 text-[10px] font-black uppercase text-neutral-400 tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50">
                        {schedules.map(sch => (
                            <tr key={sch._id} className="hover:bg-neutral-50/50 transition-colors group text-sm font-bold text-neutral-600">
                                <td className="px-8 py-5">
                                    <div className="text-neutral-800 font-extrabold">{sch.busId?.busName}</div>
                                    <div className="text-[10px] font-black uppercase text-neutral-400 tracking-tighter">{sch.busId?.busType}</div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="text-teal-500" />
                                        <span>{sch.routeId?.from} to {sch.routeId?.to}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-neutral-400" />
                                        <span>{new Date(sch.departureDate).toLocaleDateString()}</span>
                                        <Clock size={14} className="text-neutral-400 ml-2" />
                                        <span>{sch.departureTime}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 font-black text-neutral-800">₹{sch.basePrice}</td>
                                <td className="px-6 py-5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-24 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-teal-500" 
                                                style={{ width: `${(sch.seats.filter((s:any) => s.isBooked).length / sch.seats.length) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span className="text-[10px] font-black">{sch.seats.filter((s:any) => !s.isBooked).length} Seats Free</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button className="p-2 text-neutral-300 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default SchedulePage;
