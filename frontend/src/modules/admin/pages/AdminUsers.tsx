import { useState, useEffect } from 'react';
import { 
    getUsers, 
    updateUserStatus, 
    resetUserAccount, 
    updateUserWallet, 
    getUserReferrals, 
    getUserUnifiedHistory, 
    getAuditLogs, 
    type User as UserType 
} from '../../../services/api/admin/adminMiscService';
import { useAuth } from '../../../context/AuthContext';

interface User {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    registrationDate: string;
    status: 'Active' | 'Inactive' | 'Suspended';
    refCode?: string;
    walletAmount: number;
    totalOrders: number;
    totalSpent: number;
}

interface TimelineItem {
    id: string;
    type: string;
    date: string;
    amount: number;
    status: string;
    payment: string;
    title: string;
    description: string;
}

interface ReferralData {
    refCode: string;
    referredByCode: string;
    count: number;
    referrals: Array<{
        _id: string;
        name: string;
        email: string;
        phone?: string;
        registrationDate: string;
        status: string;
        totalSpent: number;
    }>;
}

interface AuditLogItem {
    _id: string;
    userId: string;
    userType: string;
    userName: string;
    action: string;
    module: string;
    details: any;
    createdAt: string;
}

export default function AdminUsers() {
    const { isAuthenticated, token } = useAuth();
    
    // Core View Toggles: 'directory' | 'audit'
    const [currentView, setCurrentView] = useState<'directory' | 'audit'>('directory');

    // User Directory States
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    // Selected User Modal / Panel States
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [modalTab, setModalTab] = useState<'timeline' | 'wallet' | 'referrals'>('timeline');
    
    // Sub-data states for Modal
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [timelineLoading, setTimelineLoading] = useState(false);
    const [referralInfo, setReferralInfo] = useState<ReferralData | null>(null);
    const [referralLoading, setReferralLoading] = useState(false);
    
    // Wallet Controls
    const [walletAction, setWalletAction] = useState<'credit' | 'debit'>('credit');
    const [walletAmount, setWalletAmount] = useState<string>('');
    const [walletReason, setWalletReason] = useState<string>('');
    const [walletSubmitLoading, setWalletSubmitLoading] = useState(false);

    // Audit Trails States
    const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
    const [auditLoading, setAuditLoading] = useState(false);
    const [auditSearch, setAuditSearch] = useState('');
    const [auditModuleFilter, setAuditModuleFilter] = useState('All');
    const [auditPage, setAuditPage] = useState(1);
    const [auditTotalPages, setAuditTotalPages] = useState(1);

    // Fetch User Directory
    const fetchUsers = async () => {
        if (!isAuthenticated || !token) return;
        try {
            setLoading(true);
            setError(null);

            const params: any = {
                page: currentPage,
                limit: entriesPerPage,
            };

            if (statusFilter !== 'All') {
                params.status = statusFilter;
            }

            if (searchTerm) {
                params.search = searchTerm;
            }

            if (sortColumn) {
                params.sortBy = sortColumn;
                params.sortOrder = sortDirection;
            }

            const response = await getUsers(params);

            if (response.success) {
                setUsers(response.data as unknown as User[]);
                if (response.pagination) {
                    setTotalPages(response.pagination.pages);
                    setTotalUsers(response.pagination.total);
                }
            } else {
                setError('Failed to load users');
            }
        } catch (err: any) {
            console.error('Error fetching users:', err);
            setError(err.response?.data?.message || 'Failed to load users. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Audit Trails
    const fetchAuditTrails = async () => {
        if (!isAuthenticated || !token) return;
        try {
            setAuditLoading(true);
            const params: any = {
                page: auditPage,
                limit: 15,
            };
            if (auditSearch) params.search = auditSearch;
            if (auditModuleFilter !== 'All') params.module = auditModuleFilter;

            const response = await getAuditLogs(params);
            if (response.success) {
                setAuditLogs(response.data);
                if (response.pagination) {
                    setAuditTotalPages(response.pagination.pages);
                }
            }
        } catch (err) {
            console.error('Failed to retrieve system logs:', err);
        } finally {
            setAuditLoading(false);
        }
    };

    useEffect(() => {
        if (currentView === 'directory') {
            fetchUsers();
        } else {
            fetchAuditTrails();
        }
    }, [isAuthenticated, token, currentPage, entriesPerPage, statusFilter, searchTerm, sortColumn, sortDirection, currentView, auditPage, auditModuleFilter, auditSearch]);

    // Handle Profile Operations
    const handleOpenUserDetail = async (user: User) => {
        setSelectedUser(user);
        setModalTab('timeline');
        
        // Load timeline
        setTimelineLoading(true);
        try {
            const res = await getUserUnifiedHistory(user._id);
            if (res.success) {
                setTimeline(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setTimelineLoading(false);
        }

        // Load Referrals
        setReferralLoading(true);
        try {
            const res = await getUserReferrals(user._id);
            if (res.success) {
                setReferralInfo(res.data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setReferralLoading(false);
        }
    };

    const handleSort = (column: string) => {
        const columnMap: Record<string, string> = {
            'id': '_id',
            'name': 'name',
            '_id': '_id',
            'registrationDate': 'registrationDate',
            'status': 'status',
            'refCode': 'refCode',
            'walletAmount': 'walletAmount',
            'totalOrders': 'totalOrders',
            'totalSpent': 'totalSpent',
        };
        const backendColumn = columnMap[column] || column;

        if (sortColumn === backendColumn) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(backendColumn);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    const handleExport = () => {
        const headers = ['ID', 'Name', 'Email', 'Phone', 'Registration Date', 'Status', 'Wallet Amount', 'Total Orders', 'Total Spent'];
        const csvContent = [
            headers.join(','),
            ...users.map(user => [
                user._id.slice(-6),
                `"${user.name}"`,
                `"${user.email}"`,
                `"${user.phone || ''}"`,
                `"${new Date(user.registrationDate).toLocaleString()}"`,
                user.status,
                user.walletAmount.toFixed(2),
                user.totalOrders,
                user.totalSpent.toFixed(2),
            ].join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `users_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleStatusChange = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
        const confirmChange = window.confirm(`Are you sure you want to set this customer account to ${newStatus}?`);
        if (!confirmChange) return;

        try {
            const response = await updateUserStatus(userId, newStatus as any);
            if (response.success) {
                setUsers(users.map(user =>
                    user._id === userId ? { ...user, status: newStatus as any } : user
                ));
                if (selectedUser && selectedUser._id === userId) {
                    setSelectedUser({ ...selectedUser, status: newStatus as any });
                }
                alert(`User status updated to ${newStatus} successfully!`);
            }
        } catch (err: any) {
            alert('Failed to update status: ' + (err.response?.data?.message || 'Please try again.'));
        }
    };

    const handleWalletAdjustment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        const amountNum = parseFloat(walletAmount);
        if (isNaN(amountNum) || amountNum <= 0) {
            alert("Please input a positive wallet value");
            return;
        }
        if (!walletReason.trim()) {
            alert("A valid audit reason is required for administrative tracking.");
            return;
        }

        const confirmAction = window.confirm(`Confirm wallet adjustment: ${walletAction.toUpperCase()} ₹${amountNum}?`);
        if (!confirmAction) return;

        setWalletSubmitLoading(true);
        try {
            const response = await updateUserWallet(selectedUser._id, walletAction, amountNum, walletReason);
            if (response.success) {
                // Update local instances
                const updatedUser = { 
                    ...selectedUser, 
                    walletAmount: response.data.walletAmount 
                };
                setSelectedUser(updatedUser);
                setUsers(users.map(u => u._id === selectedUser._id ? updatedUser : u));
                setWalletAmount('');
                setWalletReason('');
                alert(`Wallet ${walletAction}ed with ₹${amountNum} successfully!`);
            }
        } catch (err: any) {
            alert('Wallet update failed: ' + (err.response?.data?.message || 'Error processing request.'));
        } finally {
            setWalletSubmitLoading(false);
        }
    };

    const handleResetAccountData = async () => {
        if (!selectedUser) return;
        const doubleCheck = window.confirm("WARNING: This will wipe the customer's wallet balance, total spent stats, total order counts, and delivery addresses. This action is IRREVERSIBLE. Proceed?");
        if (!doubleCheck) return;

        try {
            const response = await resetUserAccount(selectedUser._id);
            if (response.success) {
                const updated = {
                    ...selectedUser,
                    walletAmount: 0,
                    totalOrders: 0,
                    totalSpent: 0
                };
                setSelectedUser(updated);
                setUsers(users.map(u => u._id === selectedUser._id ? updated : u));
                alert("Customer profile reset completed successfully.");
            }
        } catch (err: any) {
            alert("Reset action failed: " + (err.response?.data?.message || 'Request refused.'));
        }
    };

    const SortIcon = ({ column }: { column: string }) => {
        const columnMap: Record<string, string> = {
            'id': '_id',
            'name': 'name',
            '_id': '_id',
            'registrationDate': 'registrationDate',
            'status': 'status',
            'refCode': 'refCode',
            'walletAmount': 'walletAmount',
            'totalOrders': 'totalOrders',
            'totalSpent': 'totalSpent',
        };
        const backendColumn = columnMap[column] || column;
        return (
            <span className="text-neutral-400 text-xs ml-1">
                {sortColumn === backendColumn ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
            </span>
        );
    };

    const startIndex = (currentPage - 1) * entriesPerPage;

    return (
        <div className="flex flex-col h-full bg-slate-900 text-slate-100 min-h-screen">
            {/* Page Header */}
            <div className="p-6 pb-2 bg-slate-800 border-b border-slate-700">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-teal-400 flex items-center gap-2">
                            <svg className="w-7 h-7 text-teal-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            User Control Center & Audit Trails
                        </h1>
                        <p className="text-slate-400 text-xs mt-1">Central Authority for all users, referral trees, wallet adjustments, and administrative audits.</p>
                    </div>
                    
                    {/* View Switcher */}
                    <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-700">
                        <button
                            onClick={() => setCurrentView('directory')}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                currentView === 'directory' 
                                    ? 'bg-teal-500 text-slate-950 shadow-md' 
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            User Directory
                        </button>
                        <button
                            onClick={() => setCurrentView('audit')}
                            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                currentView === 'audit' 
                                    ? 'bg-teal-500 text-slate-950 shadow-md' 
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Platform Audit Trails
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6">
                {currentView === 'directory' ? (
                    /* USER DIRECTORY TAB */
                    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
                        {/* Filter Toolbar */}
                        <div className="p-4 bg-slate-850 border-b border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-80">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search by name, email, phone or referral code..."
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        className="pl-10 pr-4 py-2 w-full bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-150 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                                    />
                                </div>

                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                    className="bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-300 focus:outline-none focus:border-teal-500 cursor-pointer"
                                >
                                    <option value="All">All Statuses</option>
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Suspended">Suspended</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                                <button
                                    onClick={handleExport}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export CSV
                                </button>

                                <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1">
                                    <span className="text-xs text-slate-400 font-semibold">Page Size:</span>
                                    <select
                                        value={entriesPerPage}
                                        onChange={(e) => {
                                            setEntriesPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="bg-transparent text-teal-400 font-bold border-none text-xs focus:outline-none cursor-pointer"
                                    >
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Grid / Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/50 text-slate-300 text-xs font-bold border-b border-slate-750">
                                        <th className="p-4">Sr No</th>
                                        <th className="p-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('name')}>
                                            Name <SortIcon column="name" />
                                        </th>
                                        <th className="p-4">Contact Info</th>
                                        <th className="p-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('registrationDate')}>
                                            Registration Date <SortIcon column="registrationDate" />
                                        </th>
                                        <th className="p-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('status')}>
                                            Status <SortIcon column="status" />
                                        </th>
                                        <th className="p-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('refCode')}>
                                            My Ref Code <SortIcon column="refCode" />
                                        </th>
                                        <th className="p-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('walletAmount')}>
                                            Wallet Balance <SortIcon column="walletAmount" />
                                        </th>
                                        <th className="p-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('totalOrders')}>
                                            Orders Count <SortIcon column="totalOrders" />
                                        </th>
                                        <th className="p-4 cursor-pointer hover:bg-slate-800 transition-colors" onClick={() => handleSort('totalSpent')}>
                                            Total Spent <SortIcon column="totalSpent" />
                                        </th>
                                        <th className="p-4 text-center">A-Z Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={10} className="p-12 text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-400"></div>
                                                    <span className="text-slate-400 text-sm font-semibold">Acquiring profiles directory...</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={10} className="p-12 text-center text-red-400 font-semibold">{error}</td>
                                        </tr>
                                    ) : users.length === 0 ? (
                                        <tr>
                                            <td colSpan={10} className="p-12 text-center text-slate-500">No customers match the current criteria.</td>
                                        </tr>
                                    ) : (
                                        users.map((user, index) => (
                                            <tr key={user._id} className="hover:bg-slate-750/30 transition-colors border-b border-slate-750 text-sm">
                                                <td className="p-4 text-slate-400">{startIndex + index + 1}</td>
                                                <td className="p-4 font-semibold text-slate-100">{user.name}</td>
                                                <td className="p-4">
                                                    <div className="text-xs text-slate-300">
                                                        <div className="font-medium text-slate-200">{user.email}</div>
                                                        {user.phone && <div className="text-slate-400 mt-0.5">{user.phone}</div>}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-slate-350">{new Date(user.registrationDate).toLocaleDateString()}</td>
                                                <td className="p-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                        user.status === 'Active' 
                                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                    }`}>
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-mono font-bold text-teal-400">{user.refCode || '-'}</td>
                                                <td className="p-4 font-semibold text-amber-400">₹{user.walletAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                <td className="p-4 text-slate-300">{user.totalOrders}</td>
                                                <td className="p-4 font-semibold text-slate-200">₹{user.totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleOpenUserDetail(user)}
                                                            className="px-2.5 py-1.5 bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1 shadow-md hover:shadow-teal-500/10 transition-all"
                                                            title="View Profile and Actions"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                            Control
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(user._id, user.status)}
                                                            className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all ${
                                                                user.status === 'Active'
                                                                    ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                                                                    : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                                            }`}
                                                            title={user.status === 'Active' ? 'Suspend Account' : 'Activate Account'}
                                                        >
                                                            {user.status === 'Active' ? 'Suspend' : 'Activate'}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 bg-slate-900/50 border-t border-slate-750 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-xs sm:text-sm text-slate-400">
                                Showing <span className="text-slate-200 font-semibold">{users.length > 0 ? startIndex + 1 : 0}</span> to <span className="text-slate-200 font-semibold">{Math.min(startIndex + users.length, totalUsers)}</span> of <span className="text-slate-200 font-semibold">{totalUsers}</span> accounts
                            </div>
                            
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 border border-slate-700 bg-slate-850 hover:bg-slate-750 text-slate-300 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    &larr; Prev
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                                    <button
                                        key={num}
                                        onClick={() => setCurrentPage(num)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                            currentPage === num 
                                                ? 'bg-teal-500 border-teal-500 text-slate-950' 
                                                : 'border-slate-700 bg-slate-850 hover:bg-slate-750 text-slate-300'
                                        }`}
                                    >
                                        {num}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 border border-slate-700 bg-slate-850 hover:bg-slate-750 text-slate-300 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    Next &rarr;
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* PLATFORM AUDIT TRAILS TAB */
                    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
                        {/* Audit Log Filters */}
                        <div className="p-4 bg-slate-850 border-b border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex flex-1 gap-3 w-full">
                                <div className="relative flex-1 md:w-96">
                                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Search audit trail logs by action or admin user name..."
                                        value={auditSearch}
                                        onChange={(e) => { setAuditSearch(e.target.value); setAuditPage(1); }}
                                        className="pl-10 pr-4 py-2 w-full bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-150 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
                                    />
                                </div>

                                <select
                                    value={auditModuleFilter}
                                    onChange={(e) => { setAuditModuleFilter(e.target.value); setAuditPage(1); }}
                                    className="bg-slate-900 border border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-300 focus:outline-none cursor-pointer"
                                >
                                    <option value="All">All Modules</option>
                                    <option value="Hotel">Hotels</option>
                                    <option value="Bus">Buses / Transport</option>
                                    <option value="User">Users Management</option>
                                    <option value="Settings">Dynamic Configs</option>
                                    <option value="RBAC">Permissions & Roles</option>
                                </select>
                            </div>
                        </div>

                        {/* Audit Log Grid */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900/50 text-slate-300 text-xs font-bold border-b border-slate-750">
                                        <th className="p-4">Timestamp</th>
                                        <th className="p-4">Authority Admin</th>
                                        <th className="p-4">Category Module</th>
                                        <th className="p-4">Action Summary</th>
                                        <th className="p-4">Delta Parameters / Audit Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLoading ? (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center text-slate-400">Loading audit history trails...</td>
                                        </tr>
                                    ) : auditLogs.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="p-12 text-center text-slate-550">No administrative logs match this query.</td>
                                        </tr>
                                    ) : (
                                        auditLogs.map((log) => (
                                            <tr key={log._id} className="hover:bg-slate-750/30 transition-colors border-b border-slate-750 text-xs">
                                                <td className="p-4 text-slate-400 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                                                <td className="p-4">
                                                    <div className="font-semibold text-slate-100">{log.userName}</div>
                                                    <div className="text-[10px] text-slate-400 font-mono">User ID: {log.userId}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                        log.module === 'Hotel' ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20' :
                                                        log.module === 'Bus' ? 'bg-indigo-400/10 text-indigo-400 border border-indigo-400/20' :
                                                        log.module === 'User' ? 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20' :
                                                        'bg-slate-400/10 text-slate-400'
                                                    }`}>
                                                        {log.module}
                                                    </span>
                                                </td>
                                                <td className="p-4 font-semibold text-teal-400">{log.action}</td>
                                                <td className="p-4 font-mono text-[11px] text-slate-350 bg-slate-900/20 rounded max-w-xs break-words">
                                                    {log.details ? JSON.stringify(log.details) : 'N/A'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 bg-slate-900/50 border-t border-slate-750 flex justify-end gap-2">
                            <button
                                onClick={() => setAuditPage(p => Math.max(1, p - 1))}
                                disabled={auditPage === 1}
                                className="px-3 py-1.5 border border-slate-700 bg-slate-850 text-xs font-semibold hover:bg-slate-750 text-slate-350 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Prev
                            </button>
                            <span className="px-3 py-1.5 text-xs text-slate-400 font-semibold flex items-center">
                                Page {auditPage} of {auditTotalPages}
                            </span>
                            <button
                                onClick={() => setAuditPage(p => Math.min(auditTotalPages, p + 1))}
                                disabled={auditPage === auditTotalPages}
                                className="px-3 py-1.5 border border-slate-700 bg-slate-850 text-xs font-semibold hover:bg-slate-750 text-slate-350 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* UNIFIED ADMINISTRATIVE ACTIONS MODAL */}
            {selectedUser && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-slate-850 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                        
                        {/* Modal Header */}
                        <div className="p-6 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-teal-500/10 rounded-xl text-teal-400 border border-teal-500/20">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-100">{selectedUser.name}</h2>
                                    <p className="text-slate-400 text-xs mt-0.5">{selectedUser.email} &bull; My Referral Code: <span className="font-mono font-bold text-teal-400">{selectedUser.refCode || 'N/A'}</span></p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="p-2 border border-slate-700 bg-slate-900 hover:bg-slate-750 rounded-xl text-slate-400 hover:text-white transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Navigation Tabs */}
                        <div className="bg-slate-900 px-6 py-2 border-b border-slate-800 flex gap-1">
                            <button
                                onClick={() => setModalTab('timeline')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    modalTab === 'timeline'
                                        ? 'bg-teal-500 text-slate-950 font-black'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Unified Bookings Chronology ({timeline.length})
                            </button>
                            <button
                                onClick={() => setModalTab('wallet')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    modalTab === 'wallet'
                                        ? 'bg-teal-500 text-slate-950 font-black'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Wallet Adjustments & Overrides
                            </button>
                            <button
                                onClick={() => setModalTab('referrals')}
                                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                                    modalTab === 'referrals'
                                        ? 'bg-teal-500 text-slate-950 font-black'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Referrals Network ({referralInfo?.count || 0})
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 p-6 overflow-y-auto min-h-[400px]">
                            {modalTab === 'timeline' && (
                                /* UNIFIED HISTORY TIMELINE */
                                <div>
                                    <h3 className="text-md font-bold text-teal-400 mb-4 flex items-center gap-1.5">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        Unified chronological transactional activities (Goods, Hotels & Buses)
                                    </h3>

                                    {timelineLoading ? (
                                        <div className="py-12 text-center text-slate-400 font-semibold">Compiling records timeline...</div>
                                    ) : timeline.length === 0 ? (
                                        <div className="py-12 text-center text-slate-550 border border-dashed border-slate-700 rounded-xl">No active purchase, ticket, or check-in records on file.</div>
                                    ) : (
                                        <div className="relative border-l-2 border-slate-700 ml-4 pl-6 space-y-6">
                                            {timeline.map((item, i) => (
                                                <div key={item.id} className="relative">
                                                    {/* Timeline Node Icon */}
                                                    <span className="absolute -left-[35px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 border border-slate-600">
                                                        <span className={`h-2 w-2 rounded-full ${
                                                            item.type.includes('Hotel') ? 'bg-amber-400' :
                                                            item.type.includes('Bus') ? 'bg-indigo-400' : 'bg-teal-400'
                                                        }`} />
                                                    </span>

                                                    {/* Content Card */}
                                                    <div className="bg-slate-900/65 border border-slate-750/70 p-4 rounded-xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                        <div>
                                                            <span className="text-[10px] uppercase font-extrabold text-teal-400 tracking-widest">{item.type}</span>
                                                            <h4 className="text-sm font-black text-slate-100 mt-1">{item.title}</h4>
                                                            <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
                                                            <div className="text-[11px] text-slate-500 font-semibold mt-1.5">{new Date(item.date).toLocaleString()}</div>
                                                        </div>

                                                        <div className="flex flex-col items-start sm:items-end gap-1">
                                                            <div className="text-sm font-extrabold text-emerald-400">₹{item.amount.toLocaleString('en-IN')}</div>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                                                                    ['Confirmed', 'Success', 'Delivered', 'CheckedIn'].includes(item.status) || item.status === 'Completed'
                                                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                                                                        : ['Pending', 'Processing'].includes(item.status)
                                                                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
                                                                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/25'
                                                                }`}>
                                                                    Status: {item.status}
                                                                </span>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                                                    item.payment === 'Success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                                                }`}>
                                                                    Pay: {item.payment}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {modalTab === 'wallet' && (
                                /* WALLET CONTROLS & DESTRUCTIVE OVERRIDES */
                                <div className="space-y-6">
                                    {/* Balance Summary Card */}
                                    <div className="bg-slate-900 border border-slate-750 p-6 rounded-2xl flex justify-between items-center shadow-lg">
                                        <div>
                                            <span className="text-xs font-black uppercase text-slate-400 tracking-wider">Current Account Balance</span>
                                            <div className="text-3xl font-black text-amber-400 mt-1">₹{selectedUser.walletAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                        </div>
                                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl">
                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Action Form */}
                                    <form onSubmit={handleWalletAdjustment} className="bg-slate-900 border border-slate-750 p-6 rounded-2xl space-y-4 shadow-lg">
                                        <h4 className="text-sm font-bold text-teal-400 uppercase tracking-wider">Adjust Balance</h4>
                                        
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setWalletAction('credit')}
                                                className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                                                    walletAction === 'credit'
                                                        ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                                                        : 'bg-slate-850 border-slate-700 text-slate-400'
                                                }`}
                                            >
                                                Credit Wallet (Deposit)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setWalletAction('debit')}
                                                className={`py-2.5 rounded-xl text-xs font-black uppercase tracking-wider border transition-all ${
                                                    walletAction === 'debit'
                                                        ? 'bg-rose-500 text-white border-rose-500'
                                                        : 'bg-slate-850 border-slate-700 text-slate-400'
                                                }`}
                                            >
                                                Debit Wallet (Withdraw / Penalize)
                                            </button>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-400 font-semibold">Adjustment Value (INR)</label>
                                            <input
                                                type="number"
                                                placeholder="Input transaction amount..."
                                                value={walletAmount}
                                                onChange={(e) => setWalletAmount(e.target.value)}
                                                className="w-full bg-slate-850 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500 text-slate-200"
                                            />
                                            {/* Quick shortcuts */}
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {['50', '100', '500', '1000'].map(preset => (
                                                    <button
                                                        type="button"
                                                        key={preset}
                                                        onClick={() => setWalletAmount(preset)}
                                                        className="px-3 py-1 bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 rounded hover:bg-slate-700 transition-all"
                                                    >
                                                        + ₹{preset}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs text-slate-400 font-semibold">Administrative Action Reason</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. Compensation for hotel cancellation / Refund delay..."
                                                value={walletReason}
                                                onChange={(e) => setWalletReason(e.target.value)}
                                                className="w-full bg-slate-850 border border-slate-700 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-teal-500 text-slate-200"
                                            />
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={walletSubmitLoading}
                                            className="w-full py-3 bg-teal-500 hover:bg-teal-600 disabled:opacity-30 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-teal-500/5"
                                        >
                                            {walletSubmitLoading ? 'Processing transaction...' : 'Submit Adjustment'}
                                        </button>
                                    </form>

                                    {/* Dangerous Counter Wipes */}
                                    <div className="bg-rose-500/5 border border-rose-500/20 p-6 rounded-2xl space-y-3">
                                        <h4 className="text-sm font-bold text-rose-400 uppercase tracking-widest">Platform Safety & Hard Overrides</h4>
                                        <p className="text-xs text-slate-400">Wiping a customer profile's transactional history overrides all order aggregations, saved credit balances, and structural preferences without severing database entity keys.</p>
                                        <button
                                            type="button"
                                            onClick={handleResetAccountData}
                                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-lg shadow-rose-600/10"
                                        >
                                            Reset Profile & Flush Wallet
                                        </button>
                                    </div>
                                </div>
                            )}

                            {modalTab === 'referrals' && (
                                /* REFERRALS & USER LINEAGE */
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-slate-900 border border-slate-750 p-4 rounded-xl text-center">
                                            <div className="text-[10px] uppercase font-bold text-slate-400">Total Referrals Signups</div>
                                            <div className="text-2xl font-black text-teal-400 mt-1">{referralInfo?.count || 0}</div>
                                        </div>
                                        <div className="bg-slate-900 border border-slate-750 p-4 rounded-xl text-center">
                                            <div className="text-[10px] uppercase font-bold text-slate-400">Referred By Code</div>
                                            <div className="text-2xl font-black text-slate-200 mt-1 font-mono uppercase">{referralInfo?.referredByCode || 'None'}</div>
                                        </div>
                                    </div>

                                    <h3 className="text-sm font-bold text-teal-400 uppercase tracking-wider mt-6">Referrals Lineage Network</h3>
                                    
                                    {referralLoading ? (
                                        <div className="py-6 text-center text-slate-400 font-semibold">Traversing referral paths...</div>
                                    ) : !referralInfo || referralInfo.referrals.length === 0 ? (
                                        <div className="py-8 text-center text-slate-550 border border-dashed border-slate-700 rounded-xl">No active users signed up with this code.</div>
                                    ) : (
                                        <div className="bg-slate-900 border border-slate-750 rounded-xl overflow-hidden">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-850 text-slate-350 text-[10px] font-black uppercase border-b border-slate-750">
                                                        <th className="p-3">User Name</th>
                                                        <th className="p-3">Email Address</th>
                                                        <th className="p-3">Date Registered</th>
                                                        <th className="p-3 text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {referralInfo.referrals.map(ref => (
                                                        <tr key={ref._id} className="border-b border-slate-750/50 text-xs">
                                                            <td className="p-3 font-semibold text-slate-200">{ref.name}</td>
                                                            <td className="p-3 text-slate-350">{ref.email}</td>
                                                            <td className="p-3 text-slate-400">{new Date(ref.registrationDate).toLocaleDateString()}</td>
                                                            <td className="p-3 text-right">
                                                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                    ref.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                                                                }`}>
                                                                    {ref.status}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="text-center py-4 text-xs text-slate-500 border-t border-slate-800 bg-slate-950 mt-auto">
                Platform Administration Central Authority Controls &copy; 2026 &bull; Developed for LaxMart
            </footer>
        </div>
    );
}
