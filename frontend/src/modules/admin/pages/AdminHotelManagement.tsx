import React, { useState, useEffect } from 'react';
import { getAllHotels, updateHotelStatus, HotelListing } from '../../../services/api/admin/adminHotelService';
import api from '../../../services/api/config';

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
    createdAt: string;
}

const AdminHotelManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'partners' | 'listings'>('partners');
    const [hotelPartners, setHotelPartners] = useState<HotelPartner[]>([]);
    const [hotels, setHotels] = useState<HotelListing[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab === 'partners') {
            fetchHotelPartners();
        } else {
            fetchHotels();
        }
    }, [activeTab]);

    const fetchHotelPartners = async () => {
        try {
            setLoading(true);
            const response = await api.get('admin/sellers?type=hotel');
            if (response.data.success) {
                setHotelPartners(response.data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch hotel partners');
        } finally {
            setLoading(false);
        }
    };

    const fetchHotels = async () => {
        try {
            setLoading(true);
            const data = await getAllHotels();
            if (data.success) {
                setHotels(data.data);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch hotels');
        } finally {
            setLoading(false);
        }
    };

    const handleSellerAction = async (id: string, action: 'approve' | 'reject') => {
        try {
            setActionLoading(id);
            const response = await api.post(`admin/sellers/${id}/${action}`, action === 'reject' ? { reason: 'Application rejected by admin' } : {});
            if (response.data.success) {
                setHotelPartners(hotelPartners.map(p => p._id === id ? { ...p, status: action === 'approve' ? 'Approved' : 'Rejected' } : p));
            }
        } catch (err: any) {
            alert(err.response?.data?.message || `Failed to ${action} seller`);
        } finally {
            setActionLoading(null);
        }
    };

    const handleHotelStatusChange = async (id: string, status: string) => {
        try {
            setActionLoading(id);
            const data = await updateHotelStatus(id, status);
            if (data.success) {
                setHotels(hotels.map(h => h._id === id ? { ...h, status } : h));
            }
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update hotel status');
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-800">Hotel Administration</h1>
                    <p className="text-sm text-neutral-500 mt-1">Manage hotel partners and their property listings</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-neutral-200">
                <button
                    onClick={() => setActiveTab('partners')}
                    className={`pb-3 px-2 text-sm font-bold transition-all ${activeTab === 'partners' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-neutral-500 hover:text-neutral-800'}`}
                >
                    Hotel Partners
                </button>
                <button
                    onClick={() => setActiveTab('listings')}
                    className={`pb-3 px-2 text-sm font-bold transition-all ${activeTab === 'listings' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-neutral-500 hover:text-neutral-800'}`}
                >
                    Hotel Listings
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                </div>
            ) : error ? (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 italic">
                    {error}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
                    {activeTab === 'partners' ? (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 border-b border-neutral-100">
                                <tr>
                                    <th className="p-4 font-bold text-neutral-600">Partner Details</th>
                                    <th className="p-4 font-bold text-neutral-600">Hotel Name</th>
                                    <th className="p-4 font-bold text-neutral-600">Status</th>
                                    <th className="p-4 font-bold text-neutral-600 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {hotelPartners.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="p-8 text-center text-neutral-400 italic">No hotel partners found</td>
                                    </tr>
                                ) : (
                                    hotelPartners.map((partner) => (
                                        <tr key={partner._id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="p-4">
                                                <div className="font-bold text-neutral-800">{partner.sellerName}</div>
                                                <div className="text-xs text-neutral-500">{partner.email}</div>
                                                <div className="text-xs text-neutral-500">{partner.mobile}</div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-medium text-neutral-700">{partner.businessDetails?.hotelName || partner.storeName}</div>
                                                <div className="text-[10px] uppercase text-neutral-400">License: {partner.businessDetails?.licenseNumber || 'N/A'}</div>
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                    partner.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                                                    partner.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {partner.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {partner.status === 'Pending' ? (
                                                    <div className="flex gap-2 justify-end">
                                                        <button 
                                                            disabled={actionLoading === partner._id}
                                                            onClick={() => handleSellerAction(partner._id, 'approve')}
                                                            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50"
                                                        >
                                                            {actionLoading === partner._id ? '...' : 'Approve'}
                                                        </button>
                                                        <button 
                                                            disabled={actionLoading === partner._id}
                                                            onClick={() => handleSellerAction(partner._id, 'reject')}
                                                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                                                        >
                                                            {actionLoading === partner._id ? '...' : 'Reject'}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-neutral-400 text-xs italic">No actions available</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-neutral-50 border-b border-neutral-100">
                                <tr>
                                    <th className="p-4 font-bold text-neutral-600">Hotel Name</th>
                                    <th className="p-4 font-bold text-neutral-600">City</th>
                                    <th className="p-4 font-bold text-neutral-600">Seller</th>
                                    <th className="p-4 font-bold text-neutral-600">Property Type</th>
                                    <th className="p-4 font-bold text-neutral-600">Status</th>
                                    <th className="p-4 font-bold text-neutral-600 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-50">
                                {hotels.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-neutral-400 italic">No hotel listings found</td>
                                    </tr>
                                ) : (
                                    hotels.map((hotel) => (
                                        <tr key={hotel._id} className="hover:bg-neutral-50/50 transition-colors">
                                            <td className="p-4 font-medium text-neutral-800">{hotel.name}</td>
                                            <td className="p-4 text-neutral-600">{hotel.city}</td>
                                            <td className="p-4 text-neutral-600">
                                                <div className="font-medium">{hotel.sellerId?.sellerName || 'N/A'}</div>
                                                <div className="text-xs text-neutral-400">{hotel.sellerId?.storeName}</div>
                                            </td>
                                            <td className="p-4 text-neutral-800 font-bold">{hotel.propertyType || 'Hotel'}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                                                    hotel.status === 'Approved' ? 'bg-green-100 text-green-700' : 
                                                    hotel.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 
                                                    'bg-red-100 text-red-700'
                                                }`}>
                                                    {hotel.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <select 
                                                    disabled={actionLoading === hotel._id}
                                                    className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                                    value={hotel.status}
                                                    onChange={(e) => handleHotelStatusChange(hotel._id, e.target.value)}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Approved">Approved</option>
                                                    <option value="Rejected">Rejected</option>
                                                    <option value="Blocked">Blocked</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default AdminHotelManagement;
