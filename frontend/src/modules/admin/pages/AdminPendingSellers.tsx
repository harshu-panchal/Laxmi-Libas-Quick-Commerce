import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface Seller {
    _id: string;
    sellerName: string;
    email: string;
    mobile: string;
    storeName: string;
    category: string | { _id: string; name: string };
    categories: string[];
    address: string;
    city: string;
    idProof?: string;
    businessLicense?: string;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Blocked';
    rejectionReason?: string;
    createdAt: string;
}

export default function AdminPendingSellers() {
    const navigate = useNavigate();
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [filterStatus, setFilterStatus] = useState<'Pending' | 'Approved' | 'Rejected' | 'Blocked' | 'All'>('Pending');

    useEffect(() => {
        fetchSellers();
    }, [filterStatus]);

    const fetchSellers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('authToken');
            const endpoint = filterStatus === 'All'
                ? '/api/v1/admin/sellers'
                : filterStatus === 'Pending'
                    ? '/api/v1/admin/sellers/pending'
                    : `/api/v1/admin/sellers/status/${filterStatus}`;

            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (data.success) {
                setSellers(data.data || []);
            } else {
                setError(data.message || 'Failed to fetch sellers');
            }
        } catch (err: any) {
            setError('Failed to fetch sellers');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (sellerId: string) => {
        try {
            setActionLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/v1/admin/sellers/${sellerId}/approve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();
            if (data.success) {
                alert('Seller approved successfully!');
                setShowModal(false);
                fetchSellers();
            } else {
                alert(data.message || 'Failed to approve seller');
            }
        } catch (err) {
            alert('Failed to approve seller');
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (sellerId: string) => {
        if (!rejectionReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            setActionLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/v1/admin/sellers/${sellerId}/reject`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason: rejectionReason }),
            });

            const data = await response.json();
            if (data.success) {
                alert('Seller rejected successfully');
                setShowModal(false);
                setRejectionReason('');
                fetchSellers();
            } else {
                alert(data.message || 'Failed to reject seller');
            }
        } catch (err) {
            alert('Failed to reject seller');
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleBlock = async (sellerId: string) => {
        const reason = prompt('Enter reason for blocking (optional):');

        try {
            setActionLoading(true);
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/v1/admin/sellers/${sellerId}/block`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reason }),
            });

            const data = await response.json();
            if (data.success) {
                alert('Seller blocked successfully');
                setShowModal(false);
                fetchSellers();
            } else {
                alert(data.message || 'Failed to block seller');
            }
        } catch (err) {
            alert('Failed to block seller');
            console.error(err);
        } finally {
            setActionLoading(false);
        }
    };

    const getCategoryName = (category: any) => {
        if (!category) return 'N/A';
        return typeof category === 'string' ? 'ID: ' + category.slice(-4) : category.name;
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            Pending: 'bg-yellow-100 text-yellow-700',
            Approved: 'bg-yellow-100 text-yellow-700',
            Rejected: 'bg-red-100 text-red-700',
            Blocked: 'bg-gray-100 text-gray-700',
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status as keyof typeof badges]}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-900">Seller Management</h1>
                <p className="text-sm text-neutral-600 mt-1">Review and manage seller applications</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto">
                {['Pending', 'Approved', 'Rejected', 'Blocked', 'All'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === status
                            ? 'bg-teal-600 text-white'
                            : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
                </div>
            ) : sellers.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-neutral-200">
                    <p className="text-neutral-600">No {filterStatus.toLowerCase()} sellers found</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-neutral-50 border-b border-neutral-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Seller</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Store</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Categories</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Location</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Status</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-700 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-200">
                                {sellers.map((seller) => (
                                    <tr key={seller._id} className="hover:bg-neutral-50">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-neutral-900">{seller.sellerName}</div>
                                            <div className="text-xs text-neutral-600">{seller.email}</div>
                                            <div className="text-xs text-neutral-600">{seller.mobile}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm text-neutral-900">{seller.storeName}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-sm font-medium text-teal-700 bg-teal-50 px-2 py-1 rounded-lg">
                                                {getCategoryName(seller.category)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs text-neutral-600">
                                                {seller.categories.join(', ')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs text-neutral-600">{seller.city}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {getStatusBadge(seller.status)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => {
                                                    setSelectedSeller(seller);
                                                    setShowModal(true);
                                                }}
                                                className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                                            >
                                                View Details
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
            {showModal && selectedSeller && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <h2 className="text-xl font-bold text-neutral-900">Seller Details</h2>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="text-neutral-400 hover:text-neutral-600"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600">Seller Name</label>
                                        <p className="text-sm text-neutral-900">{selectedSeller.sellerName}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600">Store Name</label>
                                        <p className="text-sm text-neutral-900">{selectedSeller.storeName}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600">Email</label>
                                        <p className="text-sm text-neutral-900">{selectedSeller.email}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600">Mobile</label>
                                        <p className="text-sm text-neutral-900">{selectedSeller.mobile}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600">Assigned Category</label>
                                        <p className="text-sm font-semibold text-teal-700">{getCategoryName(selectedSeller.category)}</p>
                                    </div>

                                    <div>
                                        <label className="text-xs font-medium text-neutral-600">Status</label>
                                        <div className="mt-1">{getStatusBadge(selectedSeller.status)}</div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-neutral-600">Categories</label>
                                    <p className="text-sm text-neutral-900">{selectedSeller.categories.join(', ')}</p>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-neutral-600">Address</label>
                                    <p className="text-sm text-neutral-900">{selectedSeller.address}, {selectedSeller.city}</p>
                                </div>

                                {selectedSeller.idProof && (
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600">ID Proof</label>
                                        <a
                                            href={selectedSeller.idProof}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-teal-600 hover:underline block"
                                        >
                                            View Document
                                        </a>
                                    </div>
                                )}

                                {selectedSeller.businessLicense && (
                                    <div>
                                        <label className="text-xs font-medium text-neutral-600">Business License</label>
                                        <a
                                            href={selectedSeller.businessLicense}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-teal-600 hover:underline block"
                                        >
                                            View Document
                                        </a>
                                    </div>
                                )}

                                {selectedSeller.status === 'Pending' && (
                                    <>
                                        <div className="border-t pt-4">
                                            <label className="text-xs font-medium text-neutral-600 block mb-2">Rejection Reason (if rejecting)</label>
                                            <textarea
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                placeholder="Enter reason for rejection..."
                                                className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                                                rows={3}
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => handleApprove(selectedSeller._id)}
                                                disabled={actionLoading}
                                                className="flex-1 bg-primary-dark text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-700 disabled:opacity-50"
                                            >
                                                {actionLoading ? 'Processing...' : 'Approve'}
                                            </button>
                                            <button
                                                onClick={() => handleReject(selectedSeller._id)}
                                                disabled={actionLoading || !rejectionReason.trim()}
                                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 disabled:opacity-50"
                                            >
                                                {actionLoading ? 'Processing...' : 'Reject'}
                                            </button>
                                        </div>
                                    </>
                                )}

                                {selectedSeller.status === 'Approved' && (
                                    <button
                                        onClick={() => handleBlock(selectedSeller._id)}
                                        disabled={actionLoading}
                                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50"
                                    >
                                        {actionLoading ? 'Processing...' : 'Block Seller'}
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
