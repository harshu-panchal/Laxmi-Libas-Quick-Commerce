import React, { useState } from 'react';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { BusRoute } from '../types';
import { mockRoutes } from '../data/mockData';

const RouteManagement: React.FC = () => {
  const [routes, setRoutes] = useState<BusRoute[]>(mockRoutes);
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    distance: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRoute: BusRoute = {
      id: `r${routes.length + 1}`,
      from: formData.from,
      to: formData.to,
      distance: formData.distance ? parseInt(formData.distance) : undefined,
    };
    setRoutes([newRoute, ...routes]);
    setFormData({ from: '', to: '', distance: '' });
  };

  const columns = [
    { header: 'From City', accessor: 'from' as keyof BusRoute },
    { header: 'To City', accessor: 'to' as keyof BusRoute },
    { 
      header: 'Distance', 
      accessor: (item: BusRoute) => item.distance ? `${item.distance} km` : '-' 
    },
    { 
      header: 'Actions', 
      accessor: () => (
        <button className="text-red-500 font-bold text-xs uppercase hover:underline">Delete</button>
      ) 
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Route Management</h2>
        <p className="text-neutral-500 font-medium">Define and manage the paths your buses travel.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-neutral-800 mb-2">Create New Route</h3>
            
            <InputField
              label="From City"
              placeholder="e.g. Ahmedabad"
              value={formData.from}
              onChange={(e) => setFormData({ ...formData, from: e.target.value })}
              required
            />
            
            <InputField
              label="To City"
              placeholder="e.g. Mumbai"
              value={formData.to}
              onChange={(e) => setFormData({ ...formData, to: e.target.value })}
              required
            />
            
            <InputField
              label="Distance (km)"
              type="number"
              placeholder="e.g. 530"
              value={formData.distance}
              onChange={(e) => setFormData({ ...formData, distance: e.target.value })}
            />
            
            <Button type="submit" fullWidth>Save Route</Button>
          </form>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-black text-neutral-800">Available Routes</h3>
          <Table columns={columns} data={routes} />
        </div>
      </div>
    </div>
  );
};

export default RouteManagement;
