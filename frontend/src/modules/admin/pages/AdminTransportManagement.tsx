import React, { useState, useEffect } from 'react';
import { getAllBuses, updateBusStatus, BusListing } from '../../../services/api/admin/adminBusService';

const AdminTransportManagement: React.FC = () => {
  const [buses, setBuses] = useState<BusListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBuses();
  }, []);

  const fetchBuses = async () => {
    try {
      setLoading(true);
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

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const data = await updateBusStatus(id, status);
      if (data.success) {
        setBuses(buses.map(b => b._id === id ? { ...b, status } : b));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">Transport (Bus) Management</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 italic">
            {error}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-neutral-50 border-b border-neutral-100">
                <tr>
                  <th className="p-4 font-bold text-neutral-600">Bus Number</th>
                  <th className="p-4 font-bold text-neutral-600">Route</th>
                  <th className="p-4 font-bold text-neutral-600">Seller</th>
                  <th className="p-4 font-bold text-neutral-600">Status</th>
                  <th className="p-4 font-bold text-neutral-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {buses.map((bus) => (
                  <tr key={bus._id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-medium text-neutral-800">{bus.busNumber}</td>
                    <td className="p-4 text-neutral-600">
                        <div className="flex items-center gap-2">
                            <span>{bus.from}</span>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7" />
                            </svg>
                            <span>{bus.to}</span>
                        </div>
                    </td>
                    <td className="p-4 text-neutral-600">
                        <div className="font-medium">{bus.sellerId?.sellerName}</div>
                        <div className="text-xs text-neutral-400">{bus.sellerId?.storeName}</div>
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        bus.status === 'active' ? 'bg-green-100 text-green-700' : 
                        bus.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {bus.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <select 
                        className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        value={bus.status}
                        onChange={(e) => handleStatusChange(bus._id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminTransportManagement;
