import React, { useState, useEffect } from 'react';
import { 
    getAllBuses, 
    updateBusStatus, 
    getBusBookings, 
    getBusStats, 
    getBusOperators, 
    updateOperatorStatus, 
    adminGetBusRoutes, 
    adminAddBusRoute, 
    adminUpdateBusRoute, 
    adminDeleteBusRoute, 
    adminGetBusSchedules, 
    adminAddBusSchedule, 
    adminUpdateBusSchedule, 
    adminDeleteBusSchedule, 
    adminCancelTicket,
    BusListing, 
    BusBookingListing 
} from '../../../services/api/admin/adminBusService';
import api from '../../../services/api/config';
import { 
    Bus, 
    Calendar, 
    MapPin, 
    User, 
    ShieldCheck, 
    X, 
    Check, 
    TrendingUp, 
    RefreshCw, 
    Plus, 
    Trash2, 
    Clock, 
    Map, 
    Tag, 
    ChevronRight, 
    DollarSign,
    Users,
    Sliders,
    XCircle
} from 'lucide-react';

interface TransportPartner {
    _id: string;
    sellerName: string;
    email: string;
    mobile: string;
    storeName: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Blocked';
    commission?: number;
    createdAt: string;
}

interface BusRoute {
    _id: string;
    from: string;
    to: string;
    distance: number;
    duration: string;
    stops: string[];
}

interface BusSchedule {
    _id: string;
    busId: {
        _id: string;
        busNumber: string;
    } | string;
    routeId: {
        _id: string;
        from: string;
        to: string;
    } | string;
    departureDate: string;
    departureTime: string;
    arrivalDate: string;
    arrivalTime: string;
    ticketPrice: number;
    status: 'Scheduled' | 'Delayed' | 'Postponed' | 'Cancelled' | 'Completed';
    availableSeats: number;
}

interface TransportStatsData {
    totalOperators: number;
    totalFleets: number;
    activeSchedulesCount: number;
    seatOccupancyRatio: number;
    totalTicketVolume: number;
    platformCommissionRevenue: number;
}

const AdminTransportManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'analytics' | 'operators' | 'fleets' | 'routes' | 'schedules' | 'tickets'>('analytics');
    const [operators, setOperators] = useState<TransportPartner[]>([]);
    const [buses, setBuses] = useState<BusListing[]>([]);
    const [routes, setRoutes] = useState<BusRoute[]>([]);
    const [schedules, setSchedules] = useState<BusSchedule[]>([]);
    const [bookings, setBookings] = useState<BusBookingListing[]>([]);
    const [stats, setStats] = useState<TransportStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Form inputs for Route CRUD
    const [showRouteModal, setShowRouteModal] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<BusRoute | null>(null);
    const [routeFrom, setRouteFrom] = useState('');
    const [routeTo, setRouteTo] = useState('');
    const [routeDistance, setRouteDistance] = useState('');
    const [routeDuration, setRouteDuration] = useState('');
    const [routeStops, setRouteStops] = useState('');

    // Form inputs for Schedule CRUD
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedSchedule, setSelectedSchedule] = useState<BusSchedule | null>(null);
    const [schedBusId, setSchedBusId] = useState('');
    const [schedRouteId, setSchedRouteId] = useState('');
    const [schedDepDate, setSchedDepDate] = useState('');
    const [schedDepTime, setSchedDepTime] = useState('');
    const [schedArrDate, setSchedArrDate] = useState('');
    const [schedArrTime, setSchedArrTime] = useState('');
    const [schedPrice, setSchedPrice] = useState('');
    const [schedStatus, setSchedStatus] = useState<'Scheduled' | 'Delayed' | 'Postponed' | 'Cancelled' | 'Completed'>('Scheduled');

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            if (activeTab === 'analytics') {
                const res = await getBusStats();
                if (res.success) {
                    setStats(res.data);
                }
            } else if (activeTab === 'operators') {
                const res = await getBusOperators();
                if (res.success) {
                    setOperators(res.data);
                }
            } else if (activeTab === 'fleets') {
                const res = await getAllBuses();
                if (res.success) {
                    setBuses(res.data);
                }
            } else if (activeTab === 'routes') {
                const res = await adminGetBusRoutes();
                if (res.success) {
                    setRoutes(res.data);
                }
            } else if (activeTab === 'schedules') {
                const res = await adminGetBusSchedules();
                if (res.success) {
                    setSchedules(res.data);
                }
                const busRes = await getAllBuses();
                if (busRes.success) setBuses(busRes.data);
                const routeRes = await adminGetBusRoutes();
                if (routeRes.success) setRoutes(routeRes.data);
            } else if (activeTab === 'tickets') {
                const res = await getBusBookings();
                if (res.success) {
                    setBookings(res.data);
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to sync transport records');
        } finally {
            setLoading(false);
        }
    };

    // Operator Approval and KYC
    const handleUpdateOperatorKYC = async (id: string, status: 'Pending' | 'Approved' | 'Rejected' | 'Blocked') => {
        try {
            setActionLoading(id);
            const res = await updateOperatorStatus(id, status);
            if (res.success) {
                setOperators(operators.map(o => o._id === id ? { ...o, status } : o));
                alert(`Operator KYC Check updated to ${status} successfully.`);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update operator status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateCommission = async (id: string, currentRate: number) => {
        const newRate = prompt('Override administrative commission rate (%) for operator:', currentRate.toString());
        if (newRate !== null && !isNaN(parseFloat(newRate))) {
            try {
                setActionLoading(id);
                const response = await api.patch(`admin/sellers/${id}/commission`, { commissionRate: parseFloat(newRate) });
                if (response.data.success) {
                    setOperators(operators.map(o => o._id === id ? { ...o, commission: parseFloat(newRate) } : o));
                    alert('Commission overridden successfully');
                }
            } catch (err: any) {
                alert(err.response?.data?.message || 'Failed to update commission');
            } finally {
                setActionLoading(null);
            }
        }
    };

    // Fleet list management
    const handleBusStatusChange = async (id: string, status: string) => {
        try {
            setActionLoading(id);
            const data = await updateBusStatus(id, status);
            if (data.success) {
                setBuses(buses.map(b => b._id === id ? { ...b, status } : b));
                alert(`Fleet approval status changed to ${status}`);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update status');
        } finally {
            setActionLoading(null);
        }
    };

    // Route management handlers
    const handleOpenRouteModal = (route: BusRoute | null = null) => {
        setSelectedRoute(route);
        if (route) {
            setRouteFrom(route.from);
            setRouteTo(route.to);
            setRouteDistance(route.distance.toString());
            setRouteDuration(route.duration);
            setRouteStops(route.stops ? route.stops.join(', ') : '');
        } else {
            setRouteFrom('');
            setRouteTo('');
            setRouteDistance('');
            setRouteDuration('');
            setRouteStops('');
        }
        setShowRouteModal(true);
    };

    const handleSaveRoute = async (e: React.FormEvent) => {
        e.preventDefault();
        const routeData = {
            from: routeFrom,
            to: routeTo,
            distance: parseFloat(routeDistance),
            duration: routeDuration,
            stops: routeStops.split(',').map(s => s.trim()).filter(Boolean)
        };

        try {
            if (selectedRoute) {
                setActionLoading(selectedRoute._id);
                const res = await adminUpdateBusRoute(selectedRoute._id, routeData);
                if (res.success) {
                    setRoutes(routes.map(r => r._id === selectedRoute._id ? res.data : r));
                    alert('Route updated successfully');
                }
            } else {
                setActionLoading('new');
                const res = await adminAddBusRoute(routeData);
                if (res.success) {
                    setRoutes([...routes, res.data]);
                    alert('Route registered successfully');
                }
            }
            setShowRouteModal(false);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to preserve route configuration');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteRoute = async (id: string) => {
        if (!window.confirm("Delete this route configuration? Schedulers using it may be affected.")) return;
        try {
            setActionLoading(id);
            const res = await adminDeleteBusRoute(id);
            if (res.success) {
                setRoutes(routes.filter(r => r._id !== id));
                alert('Route deleted successfully');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to remove route');
        } finally {
            setActionLoading(null);
        }
    };

    // Schedule management handlers
    const handleOpenScheduleModal = (sched: BusSchedule | null = null) => {
        setSelectedSchedule(sched);
        if (sched) {
            setSchedBusId(typeof sched.busId === 'object' ? sched.busId._id : sched.busId);
            setSchedRouteId(typeof sched.routeId === 'object' ? sched.routeId._id : sched.routeId);
            setSchedDepDate(sched.departureDate);
            setSchedDepTime(sched.departureTime);
            setSchedArrDate(sched.arrivalDate);
            setSchedArrTime(sched.arrivalTime);
            setSchedPrice(sched.ticketPrice.toString());
            setSchedStatus(sched.status);
        } else {
            setSchedBusId('');
            setSchedRouteId('');
            setSchedDepDate('');
            setSchedDepTime('');
            setSchedArrDate('');
            setSchedArrTime('');
            setSchedPrice('');
            setSchedStatus('Scheduled');
        }
        setShowScheduleModal(true);
    };

    const handleSaveSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        const schedData = {
            busId: schedBusId,
            routeId: schedRouteId,
            departureDate: schedDepDate,
            departureTime: schedDepTime,
            arrivalDate: schedArrDate,
            arrivalTime: schedArrTime,
            ticketPrice: parseFloat(schedPrice),
            status: schedStatus
        };

        try {
            if (selectedSchedule) {
                setActionLoading(selectedSchedule._id);
                const res = await adminUpdateBusSchedule(selectedSchedule._id, schedData);
                if (res.success) {
                    setSchedules(schedules.map(s => s._id === selectedSchedule._id ? res.data : s));
                    alert('Schedule details overriden successfully.');
                }
            } else {
                setActionLoading('new');
                const res = await adminAddBusSchedule(schedData);
                if (res.success) {
                    setSchedules([...schedules, res.data]);
                    alert('Departure schedule published successfully.');
                }
            }
            setShowScheduleModal(false);
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to apply scheduler details');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteSchedule = async (id: string) => {
        if (!window.confirm("Delete this departure schedule permanently? This is destructive.")) return;
        try {
            setActionLoading(id);
            const res = await adminDeleteBusSchedule(id);
            if (res.success) {
                setSchedules(schedules.filter(s => s._id !== id));
                alert('Schedule deleted from rosters successfully.');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to remove schedule');
        } finally {
            setActionLoading(null);
        }
    };

    // Ticket Overrides & Seat Releases
    const handleCancelTicket = async (id: string) => {
        if (!window.confirm("FORCE ADMINISTRATIVE CANCELLATION for this ticket? This will instantly release seat reservations and process refunds in customer wallets.")) return;
        try {
            setActionLoading(id);
            const res = await adminCancelTicket(id);
            if (res.success) {
                setBookings(bookings.map(b => b._id === id ? { ...b, status: 'cancelled' } : b));
                alert('Booking force-cancelled, seats immediately released back to inventory.');
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to force-cancel tickets');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-neutral-100 pb-5">
                <div>
                    <h1 className="text-3xl font-black text-neutral-950 tracking-tight flex items-center gap-2">
                        <Bus className="w-8 h-8 text-orange-600" />
                        Bus Transport Super Control Center
                    </h1>
                    <p className="text-sm text-neutral-400 font-semibold mt-1">Configure transport operators, edit routes, publish rosters, delay notices, and release ticketed seats.</p>
                </div>
                <button 
                    onClick={loadData}
                    className="px-5 py-3 bg-neutral-900 text-white text-xs font-black uppercase tracking-wider rounded-2xl flex items-center gap-2 shadow-xl shadow-neutral-900/10 hover:bg-neutral-850 active:scale-95 transition-all"
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reload Feed
                </button>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-white rounded-3xl border border-neutral-200/60 shadow-sm overflow-hidden">
                <div className="flex border-b border-neutral-100 bg-neutral-50/50 overflow-x-auto scrollbar-none">
                    {[
                        { id: 'analytics', label: 'Seat Utilization Analytics', icon: TrendingUp },
                        { id: 'operators', label: 'Operator KYC Verifications', icon: ShieldCheck },
                        { id: 'fleets', label: 'Fleet Approvals', icon: Bus },
                        { id: 'routes', label: 'Configure Routes', icon: Map },
                        { id: 'schedules', label: 'Disruption & Rosters', icon: Clock },
                        { id: 'tickets', label: 'Ticket Releases', icon: Calendar }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2.5 px-6 py-4 border-b-2 font-black text-xs uppercase tracking-widest transition-all ${
                                activeTab === tab.id 
                                    ? 'border-orange-600 text-orange-600 bg-orange-500/5' 
                                    : 'border-transparent text-neutral-400 hover:text-neutral-800 hover:bg-neutral-50/50'
                            }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 space-y-4">
                            <div className="w-10 h-10 border-4 border-orange-500/10 border-t-orange-600 rounded-full animate-spin"></div>
                            <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Synchronizing transport repository...</span>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-500 p-5 rounded-2xl border border-red-100 font-semibold text-xs shadow-sm italic flex items-center gap-2">
                            <XCircle size={16} /> {error}
                        </div>
                    ) : (
                        <div>
                            {/* TAB: SEAT UTILIZATION ANALYTICS */}
                            {activeTab === 'analytics' && stats && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <Sliders className="text-orange-500" size={16} /> Real-time Passenger Volume & Ticket margins
                                        </h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {/* Total Operators */}
                                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Registered Operators</p>
                                                <h3 className="text-3xl font-black text-neutral-800 font-mono tracking-tight">{stats.totalOperators}</h3>
                                                <span className="text-[10px] font-semibold text-neutral-400">KYC Verified Partners</span>
                                            </div>
                                            <div className="w-14 h-14 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center">
                                                <Users className="w-6 h-6" />
                                            </div>
                                        </div>

                                        {/* Active Fleets */}
                                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Active Bus Fleets</p>
                                                <h3 className="text-3xl font-black text-neutral-800 font-mono tracking-tight">{stats.totalFleets}</h3>
                                                <span className="text-[10px] font-semibold text-neutral-400">Verified Vehicles</span>
                                            </div>
                                            <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                                                <Bus className="w-6 h-6" />
                                            </div>
                                        </div>

                                        {/* Active Schedules */}
                                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Active Schedules Today</p>
                                                <h3 className="text-3xl font-black text-neutral-800 font-mono tracking-tight">{stats.activeSchedulesCount}</h3>
                                                <span className="text-[10px] font-semibold text-neutral-400">Scheduled Departures</span>
                                            </div>
                                            <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                                                <Clock className="w-6 h-6" />
                                            </div>
                                        </div>

                                        {/* Seat occupancy */}
                                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Average Seat Occupancy Ratio</p>
                                                <h3 className="text-3xl font-black text-teal-600 font-mono tracking-tight">{stats.seatOccupancyRatio}%</h3>
                                                <span className="text-[10px] font-semibold text-neutral-400">Total Booked Ratio</span>
                                            </div>
                                            <div className="w-14 h-14 bg-teal-500/10 text-teal-500 rounded-2xl flex items-center justify-center">
                                                <TrendingUp className="w-6 h-6" />
                                            </div>
                                        </div>

                                        {/* Ticket volumes */}
                                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Gross Passengers Ticketed</p>
                                                <h3 className="text-3xl font-black text-emerald-600 font-mono tracking-tight">₹{stats.totalTicketVolume?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</h3>
                                                <span className="text-[10px] font-semibold text-neutral-400">Processed Bookings</span>
                                            </div>
                                            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center">
                                                <DollarSign className="w-6 h-6" />
                                            </div>
                                        </div>

                                        {/* Platform revenue */}
                                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Transport Commission Margin</p>
                                                <h3 className="text-3xl font-black text-rose-500 font-mono tracking-tight">₹{stats.platformCommissionRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</h3>
                                                <span className="text-[10px] font-semibold text-neutral-400">Consolidated Share</span>
                                            </div>
                                            <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center">
                                                <DollarSign className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: OPERATORS KYC VERIFICATION */}
                            {activeTab === 'operators' && (
                                <div className="overflow-x-auto border border-neutral-100 rounded-3xl bg-white">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-neutral-50/50 border-b border-neutral-100">
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Operator Contact Details</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Bus/Store brand</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center">KYC Check Status</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Commission %</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Regulatory Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs font-semibold text-neutral-600">
                                            {operators.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-12 text-center text-neutral-400 italic font-semibold">No registered operators found.</td>
                                                </tr>
                                            ) : (
                                                operators.map((operator) => (
                                                    <tr key={operator._id} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-all">
                                                        <td className="p-4 text-xs font-semibold">
                                                            <div className="font-black text-neutral-800 text-sm">{operator.sellerName}</div>
                                                            <div className="text-[10px] text-neutral-400 mt-0.5">{operator.email} &bull; {operator.mobile}</div>
                                                        </td>
                                                        <td className="p-4 text-neutral-800 text-sm font-black">{operator.storeName}</td>
                                                        <td className="p-4 text-center">
                                                            <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                                                                operator.status === 'Approved' ? 'bg-green-50 text-green-600 border-green-100' :
                                                                operator.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                                                                'bg-red-50 text-red-500 border-red-100'
                                                            }`}>
                                                                {operator.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 font-mono font-black text-orange-600 text-sm">{operator.commission || 0}%</td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <select
                                                                    disabled={actionLoading === operator._id}
                                                                    value={operator.status}
                                                                    onChange={(e) => handleUpdateOperatorKYC(operator._id, e.target.value as any)}
                                                                    className="bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-700 outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 cursor-pointer transition-all"
                                                                >
                                                                    <option value="Pending">Pending KYC</option>
                                                                    <option value="Approved">Approve Operator</option>
                                                                    <option value="Rejected">Reject Operator</option>
                                                                    <option value="Blocked">Suspend Operator</option>
                                                                </select>

                                                                <button
                                                                    onClick={() => handleUpdateCommission(operator._id, operator.commission || 0)}
                                                                    className="p-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500 hover:text-orange-600 transition-all active:scale-95"
                                                                    title="Adjust Commission"
                                                                >
                                                                    <Clock className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* TAB: FLEET LISTINGS */}
                            {activeTab === 'fleets' && (
                                <div className="overflow-x-auto border border-neutral-100 rounded-3xl bg-white">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-neutral-50/50 border-b border-neutral-100">
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Bus License Plate</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Standard Route</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Operator Brand</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center">Status</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Regulatory Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs font-semibold text-neutral-600">
                                            {buses.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-12 text-center text-neutral-400 italic font-semibold">No registered vehicles found.</td>
                                                </tr>
                                            ) : (
                                                buses.map((bus) => (
                                                    <tr key={bus._id} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-all">
                                                        <td className="p-4 font-black text-neutral-800 text-sm">{bus.busNumber}</td>
                                                        <td className="p-4 text-neutral-700">
                                                            <div className="font-semibold flex items-center gap-1.5 text-xs text-neutral-700">
                                                                <span>{bus.from}</span>
                                                                <ChevronRight className="w-3 h-3 text-neutral-400" />
                                                                <span>{bus.to}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-neutral-700">
                                                            <div className="font-black text-neutral-800">{bus.sellerId?.sellerName || 'N/A'}</div>
                                                            <div className="text-[10px] text-neutral-400 font-mono">{bus.sellerId?.storeName}</div>
                                                        </td>
                                                        <td className="p-4 text-center font-black">
                                                            <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                                                                bus.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' :
                                                                bus.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                                                                'bg-red-50 text-red-500 border-red-100'
                                                            }`}>
                                                                {bus.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <select
                                                                disabled={actionLoading === bus._id}
                                                                value={bus.status}
                                                                onChange={(e) => handleBusStatusChange(bus._id, e.target.value)}
                                                                className="bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-700 outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 cursor-pointer transition-all"
                                                            >
                                                                <option value="pending">Pending Fleet</option>
                                                                <option value="active">Approve Fleet</option>
                                                                <option value="inactive">Suspend Fleet</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* TAB: ROUTES CRUD CONFIG */}
                            {activeTab === 'routes' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <Sliders className="text-orange-500" size={16} /> Active Travel Corridor Network
                                        </h3>
                                        <button
                                            onClick={() => handleOpenRouteModal(null)}
                                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                                        >
                                            <Plus className="w-4 h-4 stroke-[3px]" />
                                            Add Route
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto border border-neutral-100 rounded-3xl bg-white">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-neutral-50/50 border-b border-neutral-100">
                                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Origin Terminal</th>
                                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Destination Terminal</th>
                                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center">Distance (KM)</th>
                                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center">Travel Duration</th>
                                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Route Stopovers</th>
                                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Corridor Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-xs font-semibold text-neutral-600">
                                                {routes.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="p-12 text-center text-neutral-400 italic font-semibold">No routes registered in database.</td>
                                                    </tr>
                                                ) : (
                                                    routes.map((route) => (
                                                        <tr key={route._id} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-all text-xs text-neutral-600">
                                                            <td className="p-4 font-black text-neutral-800 text-sm">{route.from}</td>
                                                            <td className="p-4 font-black text-neutral-800 text-sm">{route.to}</td>
                                                            <td className="p-4 text-center font-black text-orange-600 font-mono text-sm">{route.distance} KM</td>
                                                            <td className="p-4 text-center font-black text-neutral-700 font-mono">{route.duration}</td>
                                                            <td className="p-4">
                                                                <div className="flex flex-wrap gap-1 max-w-xs">
                                                                    {route.stops && route.stops.length > 0 ? (
                                                                        route.stops.map((stop, i) => (
                                                                            <span key={i} className="px-2.5 py-1 bg-neutral-50 border border-neutral-200 text-neutral-500 rounded-lg text-[9px] font-black">{stop}</span>
                                                                        ))
                                                                    ) : (
                                                                        <span className="text-neutral-400 italic">Direct Corridor</span>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    <button
                                                                        onClick={() => handleOpenRouteModal(route)}
                                                                        className="p-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500 hover:text-orange-600 transition-all active:scale-95"
                                                                        title="Edit Route"
                                                                    >
                                                                        <Clock className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteRoute(route._id)}
                                                                        className="p-2 bg-red-50 border border-red-100 text-red-500 hover:bg-red-100 rounded-xl transition-all active:scale-95"
                                                                        title="Delete Route"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TAB: DISRUPTION & ROSTERS SCHEDULER */}
                            {activeTab === 'schedules' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <Sliders className="text-orange-500" size={16} /> Departure Timetable & Delay Control
                                        </h3>
                                        <button
                                            onClick={() => handleOpenScheduleModal(null)}
                                            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                                        >
                                            <Plus className="w-4 h-4 stroke-[3px]" />
                                            Publish Departure
                                        </button>
                                    </div>

                                    <div className="overflow-x-auto border border-neutral-100 rounded-3xl bg-white">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-neutral-50/50 border-b border-neutral-100">
                                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Bus Fleet No.</th>
                                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Assigned Corridor</th>
                                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Departure (Date/Time)</th>
                                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Arrival (Date/Time)</th>
                                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center">Roster Status</th>
                                                    <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Roster Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-xs font-semibold text-neutral-600">
                                                {schedules.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={6} className="p-12 text-center text-neutral-400 italic font-semibold">No roster departures published yet.</td>
                                                    </tr>
                                                ) : (
                                                    schedules.map((sched) => (
                                                        <tr key={sched._id} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-all text-xs text-neutral-600">
                                                            <td className="p-4 font-black text-neutral-800 text-sm">
                                                                {typeof sched.busId === 'object' ? sched.busId.busNumber : 'No Fleet'}
                                                            </td>
                                                            <td className="p-4 text-neutral-700">
                                                                {typeof sched.routeId === 'object' ? (
                                                                    <span className="font-semibold flex items-center gap-1 text-[11px] text-neutral-700">
                                                                        <span>{sched.routeId.from}</span>
                                                                        <ChevronRight className="w-3 h-3 text-neutral-400" />
                                                                        <span>{sched.routeId.to}</span>
                                                                    </span>
                                                                ) : 'No Corridor'}
                                                            </td>
                                                            <td className="p-4 text-neutral-700">
                                                                <div className="font-black text-neutral-800">{sched.departureDate}</div>
                                                                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{sched.departureTime}</div>
                                                            </td>
                                                            <td className="p-4 text-neutral-700">
                                                                <div className="font-black text-neutral-800">{sched.arrivalDate}</div>
                                                                <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{sched.arrivalTime}</div>
                                                            </td>
                                                            <td className="p-4 text-center font-black">
                                                                <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                                                                    sched.status === 'Scheduled' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                    sched.status === 'Delayed' || sched.status === 'Postponed' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                    sched.status === 'Cancelled' ? 'bg-red-50 text-red-500 border-red-100' :
                                                                    'bg-green-50 text-green-600 border-green-100'
                                                                }`}>
                                                                    {sched.status}
                                                                </span>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <div className="flex items-center justify-end gap-1.5">
                                                                    <button
                                                                        onClick={() => handleOpenScheduleModal(sched)}
                                                                        className="px-2.5 py-1.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-600 hover:text-orange-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                                                                    >
                                                                        Delay/Postpone
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteSchedule(sched._id)}
                                                                        className="p-2 bg-red-50 border border-red-100 text-red-500 hover:bg-red-100 rounded-xl transition-all active:scale-95"
                                                                        title="Delete"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* TAB: TICKET RELEASES & OVERRIDES */}
                            {activeTab === 'tickets' && (
                                <div className="overflow-x-auto border border-neutral-100 rounded-3xl bg-white">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-neutral-50/50 border-b border-neutral-100">
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Customer Traveler</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Bus Fleet & Corridor</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Departure Timing</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Booked Seat(s)</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Finances / Total</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center">Ticket Status</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Emergency Releases</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-xs font-semibold text-neutral-600">
                                            {bookings.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="p-12 text-center text-neutral-400 italic font-semibold">No tickets issued in database.</td>
                                                </tr>
                                            ) : (
                                                bookings.map((booking) => (
                                                    <tr key={booking._id} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-all text-xs text-neutral-600">
                                                        <td className="p-4 font-black text-neutral-800">
                                                            <div>{booking.userId?.name || 'N/A'}</div>
                                                            <div className="text-[10px] text-neutral-400 mt-0.5">{booking.userId?.mobile}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="font-black text-neutral-800">Plate: {booking.scheduleId?.busId?.busNumber}</div>
                                                            <div className="text-[10px] text-neutral-400 mt-0.5">{booking.pickupPoint} to {booking.dropoffPoint}</div>
                                                        </td>
                                                        <td className="p-4 text-neutral-700">
                                                            <div className="font-black text-neutral-800">{booking.scheduleId?.departureDate}</div>
                                                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{booking.scheduleId?.departureTime}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="flex flex-wrap gap-1 max-w-xs">
                                                                {booking.seats.map((seat, idx) => (
                                                                    <span key={idx} className="px-2 py-0.5 bg-orange-50 border border-orange-100 text-orange-600 rounded-lg text-[10px] font-black">{seat.seatNumber}</span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-emerald-600 font-black">
                                                            <div>₹{booking.totalAmount?.toLocaleString('en-IN')}</div>
                                                            <div className={`text-[10px] uppercase mt-0.5 font-black ${booking.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                {booking.paymentStatus}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center font-black">
                                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                                                booking.status === 'confirmed' ? 'bg-green-50 text-green-600 border-green-100' :
                                                                'bg-red-50 text-red-500 border-red-100'
                                                            }`}>
                                                                {booking.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            {booking.status !== 'cancelled' ? (
                                                                <button
                                                                    disabled={actionLoading === booking._id}
                                                                    onClick={() => handleCancelTicket(booking._id)}
                                                                    className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl text-[9px] uppercase tracking-wider transition-all shadow-md active:scale-95"
                                                                >
                                                                    Force Cancel & Release
                                                                </button>
                                                            ) : (
                                                                <span className="text-[10px] text-neutral-400 font-black uppercase tracking-widest italic">Seats Liberated</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ROUTE CONFIGURATION MODAL */}
            {showRouteModal && (
                <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSaveRoute} className="bg-white border border-neutral-200 rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                        {/* Header */}
                        <div className="p-6 bg-neutral-50 border-b border-neutral-100 flex justify-between items-center">
                            <h2 className="text-lg font-black text-neutral-800">{selectedRoute ? 'Modify Corridor Route' : 'Create Travel Corridor'}</h2>
                            <button
                                type="button"
                                onClick={() => setShowRouteModal(false)}
                                className="text-neutral-400 hover:text-neutral-800 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">From Terminal</label>
                                    <input
                                        type="text"
                                        required
                                        value={routeFrom}
                                        onChange={(e) => setRouteFrom(e.target.value)}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                        placeholder="e.g. Delhi ISBT"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">To Terminal</label>
                                    <input
                                        type="text"
                                        required
                                        value={routeTo}
                                        onChange={(e) => setRouteTo(e.target.value)}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                        placeholder="e.g. Manali"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Distance (KM)</label>
                                    <input
                                        type="number"
                                        required
                                        value={routeDistance}
                                        onChange={(e) => setRouteDistance(e.target.value)}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                        placeholder="e.g. 540"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Est Duration</label>
                                    <input
                                        type="text"
                                        required
                                        value={routeDuration}
                                        onChange={(e) => setRouteDuration(e.target.value)}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                        placeholder="e.g. 11h 30m"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Route Stops (Comma separated)</label>
                                <textarea
                                    value={routeStops}
                                    onChange={(e) => setRouteStops(e.target.value)}
                                    rows={2}
                                    className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800 resize-none"
                                    placeholder="e.g. Panipat, Chandigarh, Mandi"
                                />
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowRouteModal(false)}
                                className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 text-neutral-500 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-[0.98]"
                            >
                                Close Panel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98]"
                            >
                                Publish Corridor
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ROSTER SCHEDULE CONFIGURATION / DISRUPTION MODAL */}
            {showScheduleModal && (
                <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSaveSchedule} className="bg-white border border-neutral-200 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden animate-fade-in">
                        {/* Header */}
                        <div className="p-6 bg-neutral-50 border-b border-neutral-100 flex justify-between items-center">
                            <h2 className="text-lg font-black text-neutral-800">{selectedSchedule ? 'Disruption Control & Rescheduling' : 'Publish Roster Departure'}</h2>
                            <button
                                type="button"
                                onClick={() => setShowScheduleModal(false)}
                                className="text-neutral-400 hover:text-neutral-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Select Fleet Bus</label>
                                    <select
                                        required
                                        value={schedBusId}
                                        onChange={(e) => setSchedBusId(e.target.value)}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                    >
                                        <option value="">-- Choose Active Bus --</option>
                                        {buses.map(b => (
                                            <option key={b._id} value={b._id}>{b.busNumber} ({b.sellerId?.storeName})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Select Corridor Route</label>
                                    <select
                                        required
                                        value={schedRouteId}
                                        onChange={(e) => setSchedRouteId(e.target.value)}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                    >
                                        <option value="">-- Choose Corridor --</option>
                                        {routes.map(r => (
                                            <option key={r._id} value={r._id}>{r.from} &rarr; {r.to}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Departure Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={schedDepDate}
                                        onChange={(e) => setSchedDepDate(e.target.value)}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Departure Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={schedDepTime}
                                        onChange={(e) => setSchedDepTime(e.target.value)}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Arrival Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={schedArrDate}
                                        onChange={(e) => setSchedArrDate(e.target.value)}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Arrival Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={schedArrTime}
                                        onChange={(e) => setSchedArrTime(e.target.value)}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Ticket Base Price (INR)</label>
                                    <input
                                        type="number"
                                        required
                                        value={schedPrice}
                                        onChange={(e) => setSchedPrice(e.target.value)}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                        placeholder="e.g. 750"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Roster Delay Status</label>
                                    <select
                                        required
                                        value={schedStatus}
                                        onChange={(e) => setSchedStatus(e.target.value as any)}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800 cursor-pointer"
                                    >
                                        <option value="Scheduled">Scheduled</option>
                                        <option value="Delayed">Delayed</option>
                                        <option value="Postponed">Postponed</option>
                                        <option value="Cancelled">Cancelled</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setShowScheduleModal(false)}
                                className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 text-neutral-500 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-[0.98]"
                            >
                                Close Panel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98]"
                            >
                                Publish Departure
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AdminTransportManagement;
