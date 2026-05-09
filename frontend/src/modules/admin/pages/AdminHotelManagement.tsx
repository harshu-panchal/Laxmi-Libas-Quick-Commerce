import React, { useState, useEffect } from 'react';
import { 
    getAllHotels, 
    updateHotelStatus, 
    getHotelBookings, 
    getHotelStats, 
    adminGetHotelRooms, 
    adminUpdateHotelRoom, 
    getHotelPartners, 
    updatePartnerVerification, 
    adminProcessBookingAction,
    HotelListing,
    adminUpdateHotelPolicies
} from '../../../services/api/admin/adminHotelService';
import api from '../../../services/api/config';
import { 
    Check, 
    X, 
    Edit2, 
    TrendingUp, 
    Home, 
    Users, 
    Calendar, 
    Lock, 
    Unlock, 
    ShieldCheck, 
    Settings, 
    DollarSign,
    RefreshCw,
    Building,
    CheckCircle2,
    XCircle,
    Sliders,
    ClipboardList,
    Percent
} from 'lucide-react';

interface HotelPartner {
    _id: string;
    sellerName: string;
    email: string;
    mobile: string;
    storeName: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Blocked';
    businessDetails?: {
        hotelName?: string;
        licenseNumber?: string;
        amenities?: string[];
    };
    verificationStatus?: 'Verified' | 'Pending' | 'Rejected' | 'Suspended';
    commission?: number;
    createdAt: string;
}

interface RoomType {
    _id: string;
    hotelId: {
        _id: string;
        name: string;
    } | string;
    name: string;
    basePrice: number;
    priceOverride?: number;
    totalRooms: number;
    isForcedClosed?: boolean;
    baseCapacity: number;
}

interface HotelStatsData {
    totalProperties: number;
    totalActiveRooms: number;
    occupancyRatio: number;
    adr: number;
    totalRevenue: number;
    adminCommission: number;
}

const AdminHotelManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'analytics' | 'partners' | 'listings' | 'rooms' | 'bookings'>('analytics');
    const [hotelPartners, setHotelPartners] = useState<HotelPartner[]>([]);
    const [hotels, setHotels] = useState<HotelListing[]>([]);
    const [rooms, setRooms] = useState<RoomType[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [stats, setStats] = useState<HotelStatsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Selected items for modal controls
    const [selectedRoom, setSelectedRoom] = useState<RoomType | null>(null);
    const [overridePriceVal, setOverridePriceVal] = useState<string>('');
    const [overrideCapacityVal, setOverrideCapacityVal] = useState<string>('');
    const [overrideRoomsCountVal, setOverrideRoomsCountVal] = useState<string>('');

    // Selected hotel for policy overrides
    const [selectedHotelForPolicies, setSelectedHotelForPolicies] = useState<HotelListing | null>(null);
    const [policiesForm, setPoliciesForm] = useState({
        checkInTime: '12:00 PM',
        checkOutTime: '11:00 AM',
        coupleFriendly: true,
        petsAllowed: false,
        smokingAllowed: false,
        localIdsAllowed: true,
        alcoholAllowed: true,
        forEvents: false,
        outsideFoodAllowed: false,
    });

    useEffect(() => {
        loadData();
    }, [activeTab]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            if (activeTab === 'analytics') {
                const res = await getHotelStats();
                if (res.success) {
                    setStats(res.data);
                }
            } else if (activeTab === 'partners') {
                const res = await getHotelPartners();
                if (res.success) {
                    setHotelPartners(res.data);
                }
            } else if (activeTab === 'listings') {
                const res = await getAllHotels();
                if (res.success) {
                    setHotels(res.data);
                }
            } else if (activeTab === 'rooms') {
                const res = await adminGetHotelRooms();
                if (res.success) {
                    setRooms(res.data);
                }
            } else if (activeTab === 'bookings') {
                const res = await getHotelBookings();
                if (res.success) {
                    setBookings(res.data);
                }
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to sync hotel records');
        } finally {
            setLoading(false);
        }
    };

    // KYC check triggers
    const handleUpdateKYC = async (id: string, status: 'Verified' | 'Pending' | 'Rejected' | 'Suspended') => {
        try {
            setActionLoading(id);
            const res = await updatePartnerVerification(id, status);
            if (res.success) {
                setHotelPartners(hotelPartners.map(p => p._id === id ? { ...p, verificationStatus: status } : p));
                alert(`Hotel Partner KYC checked to ${status} successfully.`);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update partner verification status');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateCommission = async (id: string, currentRate: number) => {
        const newRate = prompt('Override administrative commission rate (%) for partner:', currentRate.toString());
        if (newRate !== null && !isNaN(parseFloat(newRate))) {
            try {
                setActionLoading(id);
                const response = await api.patch(`admin/sellers/${id}/commission`, { commissionRate: parseFloat(newRate) });
                if (response.data.success) {
                    setHotelPartners(hotelPartners.map(p => p._id === id ? { ...p, commission: parseFloat(newRate) } : p));
                    alert('Commission updated successfully');
                }
            } catch (err: any) {
                alert(err.response?.data?.message || 'Failed to update commission');
            } finally {
                setActionLoading(null);
            }
        }
    };

    // Property list trigger overrides
    const handleHotelStatusChange = async (id: string, status: string) => {
        try {
            setActionLoading(id);
            const data = await updateHotelStatus(id, status);
            if (data.success) {
                setHotels(hotels.map(h => h._id === id ? { ...h, status } : h));
                alert(`Property status changed to ${status}`);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update status');
        } finally {
            setActionLoading(null);
        }
    };

    // Rooms override triggered
    const handleOpenRoomModal = (room: RoomType) => {
        setSelectedRoom(room);
        setOverridePriceVal(room.priceOverride ? room.priceOverride.toString() : '');
        setOverrideCapacityVal(room.baseCapacity.toString());
        setOverrideRoomsCountVal(room.totalRooms.toString());
    };

    const handleSaveRoomOverrides = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRoom) return;

        const updatedData = {
            priceOverride: overridePriceVal ? parseFloat(overridePriceVal) : undefined,
            baseCapacity: parseInt(overrideCapacityVal),
            totalRooms: parseInt(overrideRoomsCountVal),
        };

        try {
            setActionLoading(selectedRoom._id);
            const res = await adminUpdateHotelRoom(selectedRoom._id, updatedData);
            if (res.success) {
                setRooms(rooms.map(r => r._id === selectedRoom._id ? { ...r, ...updatedData } : r));
                setSelectedRoom(null);
                alert("Room configurations updated successfully.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save room details');
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleForcedClose = async (room: RoomType) => {
        const nextState = !room.isForcedClosed;
        try {
            setActionLoading(room._id);
            const res = await adminUpdateHotelRoom(room._id, { isForcedClosed: nextState });
            if (res.success) {
                setRooms(rooms.map(r => r._id === room._id ? { ...r, isForcedClosed: nextState } : r));
                alert(`Room forced closure set to: ${nextState}`);
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to toggle closed state');
        } finally {
            setActionLoading(null);
        }
    };

    // Booking actions process
    const handleProcessBooking = async (id: string, action: 'confirm' | 'cancel' | 'refund') => {
        try {
            setActionLoading(id);
            const res = await adminProcessBookingAction(id, action);
            if (res.success) {
                setBookings(bookings.map(b => b._id === id ? res.data : b));
                alert(`Booking transaction overriden with state: [${action}]`);
                loadData();
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to process booking override');
        } finally {
            setActionLoading(null);
        }
    };

    // Hotel Policies trigger handlers
    const handleOpenPoliciesModal = (hotel: HotelListing) => {
        setSelectedHotelForPolicies(hotel);
        setPoliciesForm({
            checkInTime: hotel.policies?.checkInTime || '12:00 PM',
            checkOutTime: hotel.policies?.checkOutTime || '11:00 AM',
            coupleFriendly: hotel.policies?.coupleFriendly !== false,
            petsAllowed: !!hotel.policies?.petsAllowed,
            smokingAllowed: !!hotel.policies?.smokingAllowed,
            localIdsAllowed: hotel.policies?.localIdsAllowed !== false,
            alcoholAllowed: hotel.policies?.alcoholAllowed !== false,
            forEvents: !!hotel.policies?.forEvents,
            outsideFoodAllowed: !!hotel.policies?.outsideFoodAllowed,
        });
    };

    const handleSavePolicies = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedHotelForPolicies) return;

        try {
            setActionLoading(selectedHotelForPolicies._id);
            const res = await adminUpdateHotelPolicies(selectedHotelForPolicies._id, policiesForm);
            if (res.success) {
                setHotels(hotels.map(h => h._id === selectedHotelForPolicies._id ? { ...h, policies: policiesForm } : h));
                setSelectedHotelForPolicies(null);
                alert("Hotel policies updated successfully.");
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to save policies');
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
                        <Home className="w-8 h-8 text-orange-600" />
                        Hotel Admin Command Center
                    </h1>
                    <p className="text-sm text-neutral-400 font-semibold mt-1">Directly regulate hotel properties, room pricing overrides, KYC verification and platform bookings.</p>
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
                        { id: 'analytics', label: 'Occupancy & Revenue Metrics', icon: TrendingUp },
                        { id: 'partners', label: 'Verification & KYC', icon: ShieldCheck },
                        { id: 'listings', label: 'Properties Listings', icon: Home },
                        { id: 'rooms', label: 'Price & Capacity Overrides', icon: Settings },
                        { id: 'bookings', label: 'Reservations Control', icon: Calendar }
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
                            <span className="text-xs font-black uppercase tracking-widest text-neutral-400">Synchronizing records repository...</span>
                        </div>
                    ) : error ? (
                        <div className="bg-red-50 text-red-500 p-5 rounded-2xl border border-red-100 font-semibold text-xs shadow-sm italic flex items-center gap-2">
                            <XCircle size={16} /> {error}
                        </div>
                    ) : (
                        <div>
                            {/* TAB: OCCUPANCY & REVENUE ANALYTICS */}
                            {activeTab === 'analytics' && stats && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-black text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                                            <Sliders className="text-orange-500" size={16} /> Real-Time Platform Occupancy & Financials
                                        </h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {/* Total properties */}
                                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Total Active Properties</p>
                                                <h3 className="text-3xl font-black text-neutral-800 font-mono tracking-tight">{stats.totalProperties}</h3>
                                                <span className="text-[10px] font-semibold text-neutral-400">Aggregated Outlets</span>
                                            </div>
                                            <div className="w-14 h-14 bg-blue-500/10 text-blue-500 rounded-2xl flex items-center justify-center">
                                                <Home className="w-6 h-6" />
                                            </div>
                                        </div>

                                        {/* Active Rooms */}
                                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Active Inventory Rooms</p>
                                                <h3 className="text-3xl font-black text-neutral-800 font-mono tracking-tight">{stats.totalActiveRooms}</h3>
                                                <span className="text-[10px] font-semibold text-neutral-400">Available Suites</span>
                                            </div>
                                            <div className="w-14 h-14 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center">
                                                <Settings className="w-6 h-6" />
                                            </div>
                                        </div>

                                        {/* Occupancy ratio */}
                                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Average Occupancy Ratio</p>
                                                <h3 className="text-3xl font-black text-teal-600 font-mono tracking-tight">{stats.occupancyRatio}%</h3>
                                                <span className="text-[10px] font-semibold text-neutral-400">Total Check-ins</span>
                                            </div>
                                            <div className="w-14 h-14 bg-teal-500/10 text-teal-500 rounded-2xl flex items-center justify-center">
                                                <TrendingUp className="w-6 h-6" />
                                            </div>
                                        </div>

                                        {/* ADR */}
                                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Average Daily Room Rate (ADR)</p>
                                                <h3 className="text-3xl font-black text-amber-500 font-mono tracking-tight">₹{stats.adr?.toLocaleString('en-IN', { maximumFractionDigits: 0 }) || 0}</h3>
                                                <span className="text-[10px] font-semibold text-neutral-400">Daily Average Rate</span>
                                            </div>
                                            <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center">
                                                <DollarSign className="w-6 h-6" />
                                            </div>
                                        </div>

                                        {/* Revenue */}
                                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Total Booking Revenue Sales</p>
                                                <h3 className="text-3xl font-black text-emerald-600 font-mono tracking-tight">₹{stats.totalRevenue?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</h3>
                                                <span className="text-[10px] font-semibold text-neutral-400">Processed Gross</span>
                                            </div>
                                            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center">
                                                <DollarSign className="w-6 h-6" />
                                            </div>
                                        </div>

                                        {/* Commission */}
                                        <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all">
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Platform Commission Margin</p>
                                                <h3 className="text-3xl font-black text-rose-500 font-mono tracking-tight">₹{stats.adminCommission?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || '0.00'}</h3>
                                                <span className="text-[10px] font-semibold text-neutral-400">Consolidated Share</span>
                                            </div>
                                            <div className="w-14 h-14 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center">
                                                <DollarSign className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB: PARTNER VERIFICATION & KYC */}
                            {activeTab === 'partners' && (
                                <div className="overflow-x-auto border border-neutral-100 rounded-3xl">
                                    <table className="w-full text-left border-collapse bg-white">
                                        <thead>
                                            <tr className="bg-neutral-50/50 border-b border-neutral-100">
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Partner Operator Details</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Establishment Name</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center">KYC Check Status</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Commission %</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Regulatory Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hotelPartners.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="p-12 text-center text-neutral-400 font-semibold text-xs italic">No registered hotel partners found.</td>
                                                </tr>
                                            ) : (
                                                hotelPartners.map((partner) => (
                                                    <tr key={partner._id} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-all text-xs font-semibold text-neutral-600">
                                                        <td className="p-4">
                                                            <div className="font-black text-neutral-800 text-sm">{partner.sellerName}</div>
                                                            <div className="text-[10px] text-neutral-400 mt-0.5">{partner.email} &bull; {partner.mobile}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="font-black text-neutral-800 text-sm">{partner.businessDetails?.hotelName || partner.storeName}</div>
                                                            <div className="text-[10px] uppercase font-black text-neutral-400 font-mono mt-0.5">License: {partner.businessDetails?.licenseNumber || 'NOT SUPPLIED'}</div>
                                                        </td>
                                                        <td className="p-4 text-center font-black">
                                                            <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                                                                partner.verificationStatus === 'Verified' ? 'bg-green-50 text-green-600 border-green-100 shadow-sm shadow-green-500/5' :
                                                                partner.verificationStatus === 'Suspended' ? 'bg-neutral-50 text-neutral-500 border-neutral-100' :
                                                                partner.verificationStatus === 'Rejected' ? 'bg-red-50 text-red-500 border-red-100' :
                                                                'bg-amber-50 text-amber-600 border-amber-100 animate-pulse'
                                                            }`}>
                                                                {partner.verificationStatus || 'Pending'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 font-mono font-black text-orange-600 text-sm">{partner.commission || 0}%</td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <select
                                                                    disabled={actionLoading === partner._id}
                                                                    value={partner.verificationStatus || 'Pending'}
                                                                    onChange={(e) => handleUpdateKYC(partner._id, e.target.value as any)}
                                                                    className="bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-700 outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 cursor-pointer transition-all"
                                                                >
                                                                    <option value="Pending">Pending KYC</option>
                                                                    <option value="Verified">Verify License</option>
                                                                    <option value="Rejected">Reject KYC</option>
                                                                    <option value="Suspended">Suspend Account</option>
                                                                </select>

                                                                <button
                                                                    onClick={() => handleUpdateCommission(partner._id, partner.commission || 0)}
                                                                    className="p-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-xl text-neutral-500 hover:text-orange-600 transition-all active:scale-95"
                                                                    title="Adjust Commission"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
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

                            {/* TAB: PROPERTIES LISTINGS */}
                            {activeTab === 'listings' && (
                                <div className="overflow-x-auto border border-neutral-100 rounded-3xl">
                                    <table className="w-full text-left border-collapse bg-white">
                                        <thead>
                                            <tr className="bg-neutral-50/50 border-b border-neutral-100">
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Property Name</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Location / City</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Partner Seller</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Category</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center">Status</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Regulatory Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {hotels.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="p-12 text-center text-neutral-400 font-semibold text-xs italic">No listed properties found.</td>
                                                </tr>
                                            ) : (
                                                hotels.map((hotel) => (
                                                    <tr key={hotel._id} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-all text-xs font-semibold text-neutral-600">
                                                        <td className="p-4 font-black text-neutral-800 text-sm">{hotel.name}</td>
                                                        <td className="p-4 text-neutral-700">{hotel.city}</td>
                                                        <td className="p-4">
                                                            <div className="font-black text-neutral-800">{hotel.sellerId?.sellerName || 'N/A'}</div>
                                                            <div className="text-[10px] text-neutral-400 font-mono mt-0.5">{hotel.sellerId?.storeName}</div>
                                                        </td>
                                                        <td className="p-4 text-neutral-700 font-black">{hotel.propertyType || 'Hotel'}</td>
                                                        <td className="p-4 text-center font-black">
                                                            <span className={`inline-flex px-3 py-1 rounded-full text-[9px] font-black uppercase border ${
                                                                hotel.status === 'Approved' ? 'bg-green-50 text-green-600 border-green-100' :
                                                                hotel.status === 'Pending' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                                                                'bg-red-50 text-red-500 border-red-100'
                                                            }`}>
                                                                {hotel.status}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleOpenPoliciesModal(hotel)}
                                                                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
                                                                >
                                                                    Edit Policies
                                                                </button>
                                                                <select
                                                                    disabled={actionLoading === hotel._id}
                                                                    value={hotel.status}
                                                                    onChange={(e) => handleHotelStatusChange(hotel._id, e.target.value)}
                                                                    className="bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200 rounded-xl px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-neutral-700 outline-none focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 cursor-pointer transition-all"
                                                                >
                                                                    <option value="Pending">Pending Approval</option>
                                                                    <option value="Approved">Approve Property</option>
                                                                    <option value="Rejected">Reject Property</option>
                                                                    <option value="Blocked">Suspend Listing</option>
                                                                </select>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* TAB: ROOM OVERRIDES */}
                            {activeTab === 'rooms' && (
                                <div className="overflow-x-auto border border-neutral-100 rounded-3xl">
                                    <table className="w-full text-left border-collapse bg-white">
                                        <thead>
                                            <tr className="bg-neutral-50/50 border-b border-neutral-100">
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Hotel Property</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Room Category</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Capacity</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Inventory</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Pricing overrides</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center">Forced Closure</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Admin Overrides</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {rooms.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="p-12 text-center text-neutral-400 font-semibold text-xs italic">No room structures registered in database.</td>
                                                </tr>
                                            ) : (
                                                rooms.map((room) => (
                                                    <tr key={room._id} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-all text-xs font-semibold text-neutral-600">
                                                        <td className="p-4 font-black text-neutral-800 text-sm">
                                                            {typeof room.hotelId === 'object' ? room.hotelId.name : 'Unknown Hotel'}
                                                        </td>
                                                        <td className="p-4 text-neutral-700 font-black">{room.name}</td>
                                                        <td className="p-4 font-black text-neutral-600">{room.baseCapacity} Guest(s)</td>
                                                        <td className="p-4 text-neutral-600">{room.totalRooms} Unit(s)</td>
                                                        <td className="p-4">
                                                            <div className="space-y-0.5">
                                                                <div className="text-neutral-400">Standard Price: ₹{room.basePrice}</div>
                                                                {room.priceOverride ? (
                                                                    <div className="text-orange-600 font-black">Admin Rate Override: ₹{room.priceOverride}</div>
                                                                ) : (
                                                                    <div className="text-neutral-400 italic">No override active</div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center font-black">
                                                            <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                                                                room.isForcedClosed 
                                                                    ? 'bg-red-50 text-red-500 border-red-100' 
                                                                    : 'bg-green-50 text-green-600 border-green-100'
                                                            }`}>
                                                                {room.isForcedClosed ? 'Forced Closed' : 'Active'}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleToggleForcedClose(room)}
                                                                    className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all active:scale-95 ${
                                                                        room.isForcedClosed 
                                                                            ? 'bg-green-50 text-green-600 border-green-200 hover:bg-green-100' 
                                                                            : 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100'
                                                                    }`}
                                                                >
                                                                    {room.isForcedClosed ? 'Open Room' : 'Force Close'}
                                                                </button>

                                                                <button
                                                                    onClick={() => handleOpenRoomModal(room)}
                                                                    className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95"
                                                                >
                                                                    Override Rate
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

                            {/* TAB: RESERVATIONS CONTROL */}
                            {activeTab === 'bookings' && (
                                <div className="overflow-x-auto border border-neutral-100 rounded-3xl">
                                    <table className="w-full text-left border-collapse bg-white">
                                        <thead>
                                            <tr className="bg-neutral-50/50 border-b border-neutral-100">
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Customer Traveler</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Hotel Property</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Check In/Out Period</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400">Finances / Total</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-center">Status</th>
                                                <th className="p-4 text-[10px] font-black uppercase tracking-widest text-neutral-400 text-right">Regulatory Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {bookings.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="p-12 text-center text-neutral-400 font-semibold text-xs italic">No bookings recorded in history logs.</td>
                                                </tr>
                                            ) : (
                                                bookings.map((booking) => (
                                                    <tr key={booking._id} className="border-b border-neutral-50 hover:bg-neutral-50/30 transition-all text-xs font-semibold text-neutral-600">
                                                        <td className="p-4 font-black text-neutral-800">
                                                            <div>{booking.userId?.name || 'N/A'}</div>
                                                            <div className="text-[10px] text-neutral-400 mt-0.5">{booking.userId?.email}</div>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="font-black text-neutral-800">{booking.hotelId?.name}</div>
                                                            <div className="text-[10px] text-neutral-400 mt-0.5">{booking.hotelId?.city}</div>
                                                        </td>
                                                        <td className="p-4 text-neutral-700">
                                                            <div>{new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}</div>
                                                            <div className="text-[10px] text-neutral-400 mt-0.5">{booking.rooms} Room(s) &bull; {booking.guests} Guest(s)</div>
                                                        </td>
                                                        <td className="p-4 text-emerald-600 font-black">
                                                            <div>₹{booking.totalAmount?.toLocaleString('en-IN')}</div>
                                                            <div className={`text-[10px] uppercase mt-0.5 font-black ${booking.paymentStatus === 'paid' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                {booking.paymentStatus}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center font-black">
                                                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                                                booking.bookingStatus === 'confirmed' ? 'bg-green-50 text-green-600 border-green-100' :
                                                                booking.bookingStatus === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                'bg-red-50 text-red-500 border-red-100'
                                                            }`}>
                                                                {booking.bookingStatus}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <div className="flex justify-end gap-1.5">
                                                                {booking.bookingStatus === 'pending' && (
                                                                    <button
                                                                        disabled={actionLoading === booking._id}
                                                                        onClick={() => handleProcessBooking(booking._id, 'confirm')}
                                                                        className="px-2.5 py-1.5 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl text-[9px] uppercase tracking-wider transition-all shadow-md active:scale-95"
                                                                    >
                                                                        Confirm
                                                                    </button>
                                                                )}
                                                                
                                                                {booking.bookingStatus !== 'cancelled' && (
                                                                    <button
                                                                        disabled={actionLoading === booking._id}
                                                                        onClick={() => handleProcessBooking(booking._id, 'cancel')}
                                                                        className="px-2.5 py-1.5 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl text-[9px] uppercase tracking-wider transition-all shadow-md active:scale-95"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                )}

                                                                {booking.paymentStatus === 'paid' && !booking.refundProcessed && (
                                                                    <button
                                                                        disabled={actionLoading === booking._id}
                                                                        onClick={() => handleProcessBooking(booking._id, 'refund')}
                                                                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-xl text-[9px] uppercase tracking-wider transition-all shadow-md active:scale-95"
                                                                    >
                                                                        Refund
                                                                    </button>
                                                                )}
                                                                
                                                                {booking.refundProcessed && (
                                                                    <span className="text-[10px] uppercase text-amber-500 font-black tracking-wider">Refund Processed</span>
                                                                )}
                                                            </div>
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

            {/* ROOM PRICE & CAPACITY OVERRIDE MODAL */}
            {selectedRoom && (
                <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <form onSubmit={handleSaveRoomOverrides} className="bg-white border border-neutral-200 rounded-3xl w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
                        
                        {/* Header */}
                        <div className="p-6 bg-neutral-50 border-b border-neutral-100 flex justify-between items-center">
                            <h2 className="text-lg font-black text-neutral-800">Override Room Parameters: {selectedRoom.name}</h2>
                            <button
                                type="button"
                                onClick={() => setSelectedRoom(null)}
                                className="text-neutral-400 hover:text-neutral-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4">
                            <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl text-xs text-neutral-500 space-y-1">
                                <span className="font-black text-orange-600 block mb-1">Standard Specifications:</span>
                                <div>Standard Base Rate: ₹{selectedRoom.basePrice}</div>
                                <div>Default Max Capacity: {selectedRoom.baseCapacity} Guest(s)</div>
                                <div>Physical Inventory Rooms: {selectedRoom.totalRooms} Units</div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Price Override Rate (INR)</label>
                                <input
                                    type="number"
                                    placeholder="Leave blank to clear override..."
                                    value={overridePriceVal}
                                    onChange={(e) => setOverridePriceVal(e.target.value)}
                                    className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Max Capacity</label>
                                    <input
                                        type="number"
                                        value={overrideCapacityVal}
                                        onChange={(e) => setOverrideCapacityVal(e.target.value)}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Total Rooms</label>
                                    <input
                                        type="number"
                                        value={overrideRoomsCountVal}
                                        onChange={(e) => setOverrideRoomsCountVal(e.target.value)}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedRoom(null)}
                                className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 text-neutral-500 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-[0.98]"
                            >
                                Close Panel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98]"
                            >
                                Apply Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ADMIN HOTEL POLICIES EDIT MODAL */}
            {selectedHotelForPolicies && (
                <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <form onSubmit={handleSavePolicies} className="bg-white border border-neutral-200 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden my-8">
                        
                        {/* Header */}
                        <div className="p-6 bg-neutral-50 border-b border-neutral-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-black text-neutral-800">Configure Policies</h2>
                                <p className="text-xs text-neutral-400 font-semibold mt-1">{selectedHotelForPolicies.name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedHotelForPolicies(null)}
                                className="text-neutral-400 hover:text-neutral-800 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-5 max-h-[60vh] overflow-y-auto">
                            {/* Check-In / Check-Out Times */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Check-In Time</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 12:00 PM"
                                        value={policiesForm.checkInTime}
                                        onChange={(e) => setPoliciesForm({ ...policiesForm, checkInTime: e.target.value })}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest">Check-Out Time</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 11:00 AM"
                                        value={policiesForm.checkOutTime}
                                        onChange={(e) => setPoliciesForm({ ...policiesForm, checkOutTime: e.target.value })}
                                        className="w-full bg-neutral-50 hover:bg-neutral-100/30 border border-neutral-200 rounded-xl py-2 px-3 text-xs font-semibold focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all text-neutral-800"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Boolean Policies */}
                            <div className="border-t border-neutral-100 pt-4 space-y-3.5">
                                <h3 className="text-xs font-black text-orange-600 uppercase tracking-widest mb-2">Rules & Restrictions</h3>
                                
                                {[
                                    { label: 'Couple Friendly', key: 'coupleFriendly', desc: 'Allows unmarried couples to check in.' },
                                    { label: 'Pets Allowed', key: 'petsAllowed', desc: 'Guests can bring pets to the hotel.' },
                                    { label: 'Smoking Allowed', key: 'smokingAllowed', desc: 'Smoking is permitted on the premises.' },
                                    { label: 'Local IDs Allowed', key: 'localIdsAllowed', desc: 'Accepts local resident identification documents.' },
                                    { label: 'Alcohol Allowed', key: 'alcoholAllowed', desc: 'Guests are permitted to consume alcohol.' },
                                    { label: 'Suitable for Events', key: 'forEvents', desc: 'Allows booking rooms/halls for events.' },
                                    { label: 'Outside Food Allowed', key: 'outsideFoodAllowed', desc: 'Allows ordering outside food to rooms.' },
                                ].map((item) => (
                                    <label key={item.key} className="flex items-start gap-3 cursor-pointer group p-2.5 rounded-xl hover:bg-neutral-50/50 transition-all">
                                        <input
                                            type="checkbox"
                                            checked={(policiesForm as any)[item.key]}
                                            onChange={(e) => setPoliciesForm({ ...policiesForm, [item.key]: e.target.checked })}
                                            className="mt-1 accent-orange-600 w-4 h-4 rounded text-orange-600 focus:ring-orange-500 bg-neutral-50 border-neutral-300"
                                        />
                                        <div>
                                            <span className="text-sm font-black text-neutral-800 group-hover:text-orange-600 transition-all">{item.label}</span>
                                            <p className="text-[11px] text-neutral-400 font-semibold">{item.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 bg-neutral-50 border-t border-neutral-100 flex gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedHotelForPolicies(null)}
                                className="flex-1 py-3 border border-neutral-200 hover:bg-neutral-100 text-neutral-500 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-[0.98]"
                            >
                                Save Policies
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default AdminHotelManagement;
