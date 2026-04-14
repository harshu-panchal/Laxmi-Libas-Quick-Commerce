import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api/config';

interface DeliveryPartner {
    _id: string;
    name: string;
    email: string;
    mobile: string;
    city: string;
    address: string;
    drivingLicense?: string;
    nationalIdentityCard?: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Blocked';
    rejectionReason?: string;
    createdAt: string;
}

export default function AdminPendingDeliveries() {
    const navigate = useNavigate();
    const [deliveries, setDeliveries] = useState<DeliveryPartner[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPartner, setSelectedPartner] = useState<DeliveryPartner | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [filterStatus, setFilterStatus] = useState<'Pending' | 'Approved' | 'Rejected' | 'Blocked' | 'All'>('Pending');

    useEffect(() => {
        fetchDeliveries();
    }, [filterStatus]);

    const fetchDeliveries = async () => {
        try {
            setLoading(true);
            const endpoint = filterStatus === 'All'
                ? 'admin/delivery'
                : filterStatus === 'Pending'
                    ? 'admin/delivery-approvals/pending'
                    : `admin/delivery-approvals/status/${filterStatus}`;

            const response = await api.get(endpoint);
            if (response.data.success) {
                setDeliveries(response.data.data || []);
            } else {
                setError(response.data.message || 'Failed to fetch delivery partners');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch delivery partners');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (partnerId: string) => {
        if (!partnerId) {
            alert('Error: Partner ID is missing');
            return;
        }

        try {
            setActionLoading(true);
            const url = `admin/delivery-approvals/${partnerId}/approve`;
            console.log(`[Admin] Sending Approval Request for: ${url}`);
            const response = await api.post(url);

            if (response.data.success) {
                alert('Delivery partner approved successfully!');
                setShowModal(false);
                fetchDeliveries();
            } else {
                alert(response.data.message || 'Failed to approve partner');
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to approve partner';
            alert(`Error: ${errorMsg}`);
            console.error('[Admin Approval Error]', err.response?.data || err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (partnerId: string) => {
        if (!partnerId) {
            alert('Error: Partner ID is missing');
            return;
        }

        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            setActionLoading(true);
            const url = `admin/delivery-approvals/${partnerId}/reject`;
            console.log(`[Admin] Sending Rejection Request for: ${url}`);
            const response = await api.post(url, { reason: rejectionReason });

            if (response.data.success) {
                alert('Delivery partner rejected successfully');
                setShowModal(false);
                setRejectionReason('');
                fetchDeliveries();
            } else {
                alert(response.data.message || 'Failed to reject partner');
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to reject partner';
            alert(`Error: ${errorMsg}`);
            console.error('[Admin Rejection Error]', err.response?.data || err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBlock = async (partnerId: string) => {
        if (!partnerId) {
            alert('Error: Partner ID is missing');
            return;
        }

        const reason = prompt('Enter reason for blocking (optional):');

        try {
            setActionLoading(true);
            const url = `admin/delivery-approvals/${partnerId}/block`;
            console.log(`[Admin] Sending Block Request for: ${url}`);
            const response = await api.post(url, { reason });

            if (response.data.success) {
                alert('Delivery partner blocked successfully');
                setShowModal(false);
                fetchDeliveries();
            } else {
                alert(response.data.message || 'Failed to block partner');
            }
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || 'Failed to block partner';
            alert(`Error: ${errorMsg}`);
            console.error('[Admin Block Error]', err.response?.data || err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            Pending: 'bg-yellow-100 text-yellow-700',
            Approved: 'bg-teal-100 text-teal-700',
            Rejected: 'bg-red-100 text-red-700',
            Blocked: 'bg-neutral-800 text-white',
        } as const;

        const badgeClass = badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-700';

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                {status || 'Unknown'}
            </span>
        );
    };

    return (
        <div className="p-6 font-['Inter']">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">Delivery Approval</h1>
                <p className="text-sm text-neutral-500 mt-1">Manage new delivery partner applications</p>
            </div>



            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-2xl mb-6 text-sm font-bold">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-neutral-200 border-t-neutral-900"></div>
                </div>
            ) : !error && deliveries.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[32px] border border-neutral-200 border-dashed">
                    <p className="text-neutral-400 font-bold">No {filterStatus.toLowerCase()} delivery partners found</p>
                </div>
            ) : (
                <div className="bg-white rounded-[32px] border border-neutral-200 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50/50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Partner</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Location</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Joined</th>
                                    <th className="px-6 py-4 text-left text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {deliveries.map((partner) => (
                                    <tr key={partner._id} className="hover:bg-neutral-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-black text-neutral-900">{partner.name}</div>
                                            <div className="text-xs font-bold text-neutral-400 mt-0.5">{partner.mobile}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-bold text-neutral-600">
                                            {partner.city}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(partner.status)}
                                        </td>
                                        <td className="px-6 py-4 text-xs font-bold text-neutral-400">
                                            {new Date(partner.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => {
                                                    setSelectedPartner(partner);
                                                    setShowModal(true);
                                                }}
                                                className="h-10 px-4 bg-neutral-100 text-neutral-900 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-neutral-200 transition-colors"
                                            >
                                                Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && selectedPartner && (
                <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[40px] max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-2xl font-black text-neutral-900 tracking-tight">Partner Application</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-10 h-10 bg-neutral-100 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-200 transition-colors"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-neutral-50 p-4 rounded-2xl">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Full Name</label>
                                        <p className="text-sm font-black text-neutral-900">{selectedPartner.name}</p>
                                    </div>
                                    <div className="bg-neutral-50 p-4 rounded-2xl">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Mobile Number</label>
                                        <p className="text-sm font-black text-neutral-900">{selectedPartner.mobile}</p>
                                    </div>
                                    <div className="bg-neutral-50 p-4 rounded-2xl">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Email Address</label>
                                        <p className="text-sm font-black text-neutral-900">{selectedPartner.email}</p>
                                    </div>
                                    <div className="bg-neutral-50 p-4 rounded-2xl">
                                        <label className="text-[10px) font-black text-neutral-400 uppercase tracking-widest block mb-1">Location</label>
                                        <p className="text-sm font-black text-neutral-900">{selectedPartner.city}</p>
                                    </div>
                                </div>

                                <div className="bg-neutral-50 p-4 rounded-2xl">
                                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1">Residential Address</label>
                                    <p className="text-sm font-bold text-neutral-600 leading-relaxed">{selectedPartner.address}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {selectedPartner.drivingLicense && (
                                        <div className="border border-neutral-200 p-4 rounded-3xl">
                                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-3">Driving License</label>
                                            <a
                                                href={selectedPartner.drivingLicense}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm font-black text-blue-600 hover:underline"
                                            >
                                                View Document ↗
                                            </a>
                                        </div>
                                    )}
                                    {selectedPartner.nationalIdentityCard && (
                                        <div className="border border-neutral-200 p-4 rounded-3xl">
                                            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-3">National ID (Aadhar)</label>
                                            <a
                                                href={selectedPartner.nationalIdentityCard}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-2 text-sm font-black text-blue-600 hover:underline"
                                            >
                                                View Document ↗
                                            </a>
                                        </div>
                                    )}
                                </div>

                                {selectedPartner.status === 'Pending' && (
                                    <div className="pt-6 border-t border-neutral-200">
                                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-4 text-center">Take Action</label>
                                        
                                        <div className="mb-6">
                                            <textarea
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                placeholder="Enter rejection reason (required for rejection)"
                                                className="w-full px-5 py-4 bg-neutral-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-neutral-200 min-h-[100px]"
                                            />
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleApprove(selectedPartner._id)}
                                                disabled={actionLoading}
                                                className="flex-1 h-16 bg-neutral-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-neutral-800 disabled:opacity-50 transition-all active:scale-[0.98]"
                                            >
                                                {actionLoading ? 'Processing...' : 'Approve Partner'}
                                            </button>
                                            <button
                                                onClick={() => handleReject(selectedPartner._id)}
                                                disabled={actionLoading || !rejectionReason.trim()}
                                                className="flex-1 h-16 bg-red-50 text-red-600 rounded-2xl font-black uppercase tracking-widest hover:bg-red-100 disabled:opacity-50 transition-all active:scale-[0.98]"
                                            >
                                                {actionLoading ? 'Processing...' : 'Reject'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {selectedPartner.status === 'Approved' && (
                                    <button
                                        onClick={() => handleBlock(selectedPartner._id)}
                                        disabled={actionLoading}
                                        className="w-full h-16 bg-neutral-100 text-neutral-900 rounded-2xl font-black uppercase tracking-widest hover:bg-neutral-200 disabled:opacity-50 transition-all"
                                    >
                                        {actionLoading ? 'Processing...' : 'Block Partner'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
