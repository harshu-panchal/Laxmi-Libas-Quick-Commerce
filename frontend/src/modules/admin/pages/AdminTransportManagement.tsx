import React from 'react';

const AdminTransportManagement: React.FC = () => {
  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-8 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
            <rect x="1" y="3" width="15" height="13" />
            <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
        </div>
        <h1 className="text-3xl font-black text-neutral-800 mb-4">Admin Transport Management</h1>
        <p className="text-neutral-500 max-w-md mx-auto text-lg">
          Welcome to the Transport Partners management section. Here the Admin will manage transport vendors and users.
        </p>
        <div className="mt-8 px-6 py-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl font-bold flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          Work in Progress
        </div>
      </div>
    </div>
  );
};

export default AdminTransportManagement;
