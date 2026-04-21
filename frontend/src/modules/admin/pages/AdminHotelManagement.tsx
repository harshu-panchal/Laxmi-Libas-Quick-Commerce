import React, { useState, useEffect } from 'react';
import { getAllHotels, updateHotelStatus, HotelListing } from '../../../services/api/admin/adminHotelService';

const AdminHotelManagement: React.FC = () => {
  const [hotels, setHotels] = useState<HotelListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHotels();
  }, []);

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

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const data = await updateHotelStatus(id, status);
      if (data.success) {
        setHotels(hotels.map(h => h._id === id ? { ...h, status } : h));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-800">Hotel Management</h1>
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
                  <th className="p-4 font-bold text-neutral-600">Hotel Name</th>
                  <th className="p-4 font-bold text-neutral-600">City</th>
                  <th className="p-4 font-bold text-neutral-600">Seller</th>
                  <th className="p-4 font-bold text-neutral-600">Rent</th>
                  <th className="p-4 font-bold text-neutral-600">Status</th>
                  <th className="p-4 font-bold text-neutral-600 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {hotels.map((hotel) => (
                  <tr key={hotel._id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-medium text-neutral-800">{hotel.title}</td>
                    <td className="p-4 text-neutral-600">{hotel.city}</td>
                    <td className="p-4 text-neutral-600">
                        <div className="font-medium">{hotel.seller?.sellerName}</div>
                        <div className="text-xs text-neutral-400">{hotel.seller?.storeName}</div>
                    </td>
                    <td className="p-4 text-neutral-800 font-bold">₹{hotel.rentAmount}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        hotel.status === 'active' ? 'bg-green-100 text-green-700' : 
                        hotel.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {hotel.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <select 
                        className="bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                        value={hotel.status}
                        onChange={(e) => handleStatusChange(hotel._id, e.target.value)}
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

export default AdminHotelManagement;
