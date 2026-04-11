import React from 'react';
import AdminLayout from '../components/AdminLayout';

const AdminHotelManagement: React.FC = () => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-600">
            <path d="M3 21h18M3 7h18M5 7v14M19 7v14M9 11h2M9 15h2M13 11h2M13 15h2M5 3l7 4 7-4" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-neutral-800 mb-4">Admin Hotel Management</h1>
        <p className="text-neutral-500 max-w-md mx-auto text-lg">
          Welcome to the Hotel Partners management section. Here the Admin will manage hotel sellers and users. 
        </p>
        <div className="mt-8 px-6 py-3 bg-orange-50 border border-orange-100 text-orange-700 rounded-xl font-bold flex items-center gap-2">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          Work in Progress
        </div>
      </div>
    </div>
  );
};

export default AdminHotelManagement;
