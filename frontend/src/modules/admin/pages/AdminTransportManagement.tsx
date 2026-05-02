import React, { useState, useEffect } from 'react';
import { getAllBuses, updateBusStatus, getBusBookings, BusListing, BusBookingListing } from '../../../services/api/admin/adminBusService';
import { updateSellerCommission } from '../../../services/api/adminCommissionService';
import api from '../../../services/api/config';
import { motion, AnimatePresence } from 'framer-motion';
import { Bus, Calendar, MapPin, User, ShieldCheck, Search, Filter, ChevronRight, Eye, X, Check, AlertCircle, Users, Store, Edit2 } from 'lucide-react';

interface TransportPartner {
  _id: string;
  sellerName: string;
  email: string;
  mobile: string;
  storeName: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Blocked';
  businessDetails?: any;
  commission?: number;
  createdAt: string;
}

const AdminTransportManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'partners' | 'buses' | 'bookings'>('partners');
  const [partners, setPartners] = useState<TransportPartner[]>([]);
  const [buses, setBuses] = useState<BusListing[]>([]);
  const [bookings, setBookings] = useState<BusBookingListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<BusBookingListing | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    if (activeTab === 'partners') {
      fetchPartners();
    } else if (activeTab === 'buses') {
      fetchBuses();
    } else {
      fetchBookings();
    }
  }, [activeTab]);

  const fetchPartners = async () => {
    try {
      const response = await api.get('admin/sellers?type=bus');
      if (response.data.success) {
        setPartners(response.data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch transport partners');
    } finally {
      setLoading(false);
    }
  };

  const fetchBuses = async () => {
    try {
      const data = await getAllBuses();
      if (data.success) {
        setBuses(data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch buses');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await getBusBookings();
      if (data.success) {
        setBookings(data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(id);
      const response = await api.post(`admin/sellers/${id}/${action}`, action === 'reject' ? { reason: 'Partner application rejected' } : {});
      if (response.data.success) {
        setPartners(partners.map(p => p._id === id ? { ...p, status: action === 'approve' ? 'Approved' : 'Rejected' } : p));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} partner`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this partner? This will also remove all their associated listings and schedules.')) {
      try {
        setActionLoading(id);
        const response = await api.delete(`admin/sellers/${id}`);
        if (response.data.success) {
          setPartners(partners.filter(p => p._id !== id));
        }
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to delete partner');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleUpdatePartnerStatus = async (id: string, status: string) => {
    try {
      setActionLoading(id);
      const response = await api.patch(`admin/sellers/${id}/status`, { status });
      if (response.data.success) {
        setPartners(partners.map(p => p._id === id ? { ...p, status: status as any } : p));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update partner status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateCommission = async (id: string) => {
    const currentCommission = partners.find(p => p._id === id)?.commission || 0;
    const newRate = prompt('Enter new commission rate (%):', currentCommission.toString());
    
    if (newRate !== null && !isNaN(parseFloat(newRate))) {
      try {
        setActionLoading(id);
        const response = await updateSellerCommission(id, parseFloat(newRate));
        if (response.success) {
          setPartners(partners.map(p => p._id === id ? { ...p, commission: parseFloat(newRate) } : p));
        }
      } catch (err: any) {
        alert(err.response?.data?.message || 'Failed to update commission');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleBusStatusChange = async (id: string, status: string) => {
    try {
      const data = await updateBusStatus(id, status);
      if (data.success) {
        setBuses(buses.map(b => b._id === id ? { ...b, status } : b));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const filteredPartners = partners.filter(p => 
    p.sellerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.storeName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBuses = buses.filter(bus => 
    bus.busNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.sellerId?.sellerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookings = bookings.filter(booking => 
    booking.userId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.scheduleId?.busId?.busNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-[1000] text-neutral-900 tracking-tight">Transport (Bus) Management</h1>
          <p className="text-neutral-500 font-medium text-sm mt-1">Approve partners, manage bus listings, and monitor bookings.</p>
        </div>
        <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-neutral-100">
          <button
            onClick={() => setActiveTab('partners')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'partners' ? 'bg-teal-600 text-white shadow-lg shadow-teal-100' : 'text-neutral-500 hover:bg-neutral-50'}`}
          >
            Partners
          </button>
          <button
            onClick={() => setActiveTab('buses')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'buses' ? 'bg-teal-600 text-white shadow-lg shadow-teal-100' : 'text-neutral-500 hover:bg-neutral-50'}`}
          >
            Listings
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'bookings' ? 'bg-teal-600 text-white shadow-lg shadow-teal-100' : 'text-neutral-500 hover:bg-neutral-50'}`}
          >
            Bookings
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Partners', value: partners.length, icon: Users, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Pending Partners', value: partners.filter(p => p.status === 'Pending').length, icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Active Listings', value: buses.filter(b => b.status === 'active').length, icon: Bus, color: 'text-teal-600', bg: 'bg-teal-50' },
          { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[32px] border border-neutral-100 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
              <h4 className="text-xl font-[1000] text-neutral-900">{stat.value}</h4>
            </div>
          </div>
        ))}
      </div>

      {/* Main Control Panel */}
      <div className="bg-white rounded-[40px] shadow-sm border border-neutral-100 overflow-hidden">
        <div className="p-6 border-b border-neutral-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
            <input 
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-50 border-none rounded-2xl pl-12 pr-6 py-3.5 text-sm font-bold text-neutral-900 focus:ring-2 focus:ring-teal-500 transition-all"
            />
          </div>
          <button className="flex items-center gap-2 bg-neutral-50 text-neutral-600 px-4 py-3 rounded-2xl text-sm font-bold hover:bg-neutral-100 transition-colors">
            <Filter size={18} />
            Filter
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
            <p className="text-neutral-400 font-black text-xs uppercase tracking-widest italic animate-pulse">Syncing dynamic records...</p>
          </div>
        ) : error ? (
          <div className="p-20 text-center">
            <div className="bg-red-50 text-red-600 p-8 rounded-[40px] inline-flex flex-col items-center gap-2">
              <AlertCircle size={48} />
              <h3 className="text-xl font-black italic tracking-tight">Failed to Load Control Panel</h3>
              <p className="text-sm font-bold text-red-400">{error}</p>
              <button onClick={activeTab === 'partners' ? fetchPartners : activeTab === 'buses' ? fetchBuses : fetchBookings} className="mt-4 bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold">Try Again</button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  {activeTab === 'partners' ? (
                    <>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest">Partner Info</th>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest">Bus/Store Name</th>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest">Contact</th>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest">Status</th>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest text-right">Approval</th>
                    </>
                  ) : activeTab === 'buses' ? (
                    <>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest">Bus Details</th>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest">Route Info</th>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest">Partner Seller</th>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest">Status</th>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest text-right">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest">Booking ID</th>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest">User Details</th>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest">Bus & Timing</th>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest">Tickets</th>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest">Amount</th>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest">Status</th>
                      <th className="p-6 font-black text-[10px] text-neutral-400 uppercase tracking-widest text-right">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {activeTab === 'partners' ? (
                  filteredPartners.map((partner) => (
                    <tr key={partner._id} className="hover:bg-neutral-50/50 transition-all group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center font-black">
                            {partner.sellerName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-[1000] text-neutral-900 leading-none">{partner.sellerName}</p>
                            <p className="text-[10px] font-black text-neutral-400 uppercase mt-1">Join: {new Date(partner.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <Store size={14} className="text-neutral-300" />
                          <span className="text-sm font-bold text-neutral-700">{partner.storeName}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-neutral-900">{partner.mobile}</span>
                          <span className="text-[10px] font-bold text-neutral-400">{partner.email}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          partner.status === 'Approved' ? 'bg-green-50 text-green-600' : 
                          partner.status === 'Pending' ? 'bg-orange-50 text-orange-600' : 
                          'bg-red-50 text-red-600'
                        }`}>
                          {partner.status}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {partner.status === 'Pending' ? (
                            <>
                              <button 
                                disabled={actionLoading === partner._id}
                                onClick={() => handlePartnerAction(partner._id, 'approve')}
                                className="bg-teal-600 text-white p-2 rounded-xl hover:bg-teal-700 transition-all disabled:opacity-50"
                                title="Approve"
                              >
                                <Check size={18} />
                              </button>
                              <button 
                                disabled={actionLoading === partner._id}
                                onClick={() => handlePartnerAction(partner._id, 'reject')}
                                className="bg-red-50 text-red-600 p-2 rounded-xl hover:bg-red-100 transition-all disabled:opacity-50"
                                title="Reject"
                              >
                                <X size={18} />
                              </button>
                            </>
                          ) : (
                            <>
                              <select 
                                disabled={actionLoading === partner._id}
                                value={partner.status}
                                onChange={(e) => handleUpdatePartnerStatus(partner._id, e.target.value)}
                                className="bg-neutral-50 border border-neutral-100 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                              >
                                <option value="Approved">Approved</option>
                                <option value="Blocked">Blocked</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                              <button 
                                disabled={actionLoading === partner._id}
                                onClick={() => handleUpdateCommission(partner._id)}
                                className="p-2.5 text-teal-600 hover:bg-teal-50 rounded-xl transition-all disabled:opacity-50"
                                title="Update Commission"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                disabled={actionLoading === partner._id}
                                onClick={() => handleDeletePartner(partner._id)}
                                className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                                title="Delete Partner"
                              >
                                <X size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : activeTab === 'buses' ? (
                  filteredBuses.map((bus) => (
                    <tr key={bus._id} className="hover:bg-neutral-50/50 transition-all group">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className="bg-teal-50 text-teal-600 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                            <Bus size={20} />
                          </div>
                          <div>
                            <p className="text-sm font-[1000] text-neutral-900 leading-none">{bus.busNumber}</p>
                            <p className="text-[10px] font-black text-neutral-400 uppercase mt-1">BUS ID: ...{bus._id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-neutral-700">{bus.from}</span>
                          <ChevronRight size={14} className="text-neutral-300" />
                          <span className="text-sm font-bold text-neutral-700">{bus.to}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-neutral-900">{bus.sellerId?.storeName}</span>
                          <span className="text-[10px] font-bold text-neutral-400">{bus.sellerId?.sellerName}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          bus.status === 'active' ? 'bg-green-50 text-green-600' : 
                          bus.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 
                          'bg-red-50 text-red-600'
                        }`}>
                          {bus.status}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select 
                            className="bg-neutral-50 border border-neutral-100 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider focus:ring-2 focus:ring-teal-500 outline-none transition-all"
                            value={bus.status}
                            onChange={(e) => handleBusStatusChange(bus._id, e.target.value)}
                          >
                            <option value="pending">Pending</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredBookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-neutral-50/50 transition-all group">
                      <td className="p-6">
                        <p className="text-sm font-black text-neutral-900">#{booking._id.slice(-8).toUpperCase()}</p>
                        <p className="text-[10px] font-bold text-neutral-400 mt-1">{new Date(booking.createdAt).toLocaleDateString()}</p>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col px-0">
                          <span className="text-sm font-black text-neutral-900">{booking.userId?.name}</span>
                          <span className="text-[10px] font-bold text-neutral-400">{booking.userId?.mobile}</span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-neutral-900">{booking.scheduleId?.busId?.busNumber}</span>
                          <span className="text-[10px] font-bold text-neutral-400 italic">
                            {booking.scheduleId?.departureDate} | {booking.scheduleId?.departureTime}
                          </span>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex -space-x-2">
                          {booking.seats.map((s, idx) => (
                            <div key={idx} className="w-8 h-8 rounded-full bg-teal-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-teal-600 z-10 hover:z-20 transition-all">
                              {s.seatNumber}
                            </div>
                          ))}
                          {booking.seats.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-neutral-100 border-2 border-white flex items-center justify-center text-[10px] font-black text-neutral-400 z-0">
                              +{booking.seats.length - 3}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="text-sm font-[1000] text-neutral-900 italic">₹{booking.totalAmount}</span>
                      </td>
                      <td className="p-6">
                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                          booking.status === 'confirmed' ? 'bg-green-50 text-green-600' : 
                          booking.status === 'cancelled' ? 'bg-red-50 text-red-600' : 
                          'bg-yellow-50 text-neutral-600'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="p-6 text-right">
                        <button 
                          onClick={() => setSelectedBooking(booking)}
                          className="p-3 bg-neutral-50 text-neutral-600 rounded-2xl hover:bg-teal-50 hover:text-teal-600 transition-all"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
                {(activeTab === 'partners' ? filteredPartners : activeTab === 'buses' ? filteredBuses : filteredBookings).length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-20 text-center">
                      <div className="inline-flex flex-col items-center gap-4 opacity-30">
                        <Search size={64} />
                        <h3 className="text-xl font-black italic uppercase tracking-tighter">No dynamic records found</h3>
                        <p className="text-sm font-bold italic">Check if the partner joined today or adjust your search.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Details Modal (Existing Modal Code kept for bookings tab) */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-2xl rounded-[48px] shadow-2xl relative overflow-hidden z-20"
            >
              {/* Modal Header */}
              <div className="bg-teal-600 p-8 text-white relative">
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="absolute top-8 right-8 p-2 bg-white/20 hover:bg-white/40 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="flex items-center gap-4 mb-4">
                  <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
                    <ShieldCheck size={32} />
                  </div>
                  <div>
                    <h3 className="text-3xl font-[1000] tracking-tight">Booking Summary</h3>
                    <p className="text-teal-100 font-bold tracking-widest text-[10px] uppercase">Transaction ID: {selectedBooking._id}</p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-8 space-y-8">
                {/* Travel Path */}
                <div className="flex items-center justify-between p-6 bg-neutral-50 rounded-[32px] border border-neutral-100 italic">
                  <div className="text-center">
                    <p className="text-[10px] font-black text-neutral-400 uppercase mb-1">Pick-up</p>
                    <p className="text-lg font-[1000] text-neutral-900">{selectedBooking.pickupPoint}</p>
                  </div>
                  <div className="flex-1 flex flex-col items-center px-4">
                    <div className="w-full h-px border-t-2 border-dashed border-neutral-200 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 py-1 rounded-full border border-neutral-100 shadow-sm">
                        <Bus size={14} className="text-teal-600" />
                      </div>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-neutral-400 uppercase mb-1">Drop-off</p>
                    <p className="text-lg font-[1000] text-neutral-900">{selectedBooking.dropoffPoint}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-neutral-400 uppercase tracking-widest leading-none mb-2">Customer Profile</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 font-black">
                          {selectedBooking.userId?.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-neutral-900">{selectedBooking.userId?.name}</p>
                          <p className="text-xs font-bold text-neutral-400">{selectedBooking.userId?.email}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="bg-teal-50 p-6 rounded-[32px] border border-teal-100">
                      <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1 leading-none">Grand Total Paid</p>
                      <p className="text-3xl font-[1000] text-teal-700 italic leading-none">₹{selectedBooking.totalAmount}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button onClick={() => setSelectedBooking(null)} className="flex-1 bg-neutral-900 text-white font-black py-4 rounded-3xl text-sm uppercase tracking-[0.2em] shadow-xl shadow-neutral-200 transition-all hover:scale-[1.02] active:scale-95">
                    Close Details
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminTransportManagement;
