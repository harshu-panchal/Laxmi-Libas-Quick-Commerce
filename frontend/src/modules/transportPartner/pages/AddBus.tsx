import React, { useState } from 'react';
import { InputField } from '../components/InputField';
import { SelectField } from '../components/SelectField';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { Bus } from '../types';
import { mockBuses } from '../data/mockData';

const AddBus: React.FC = () => {
  const [buses, setBuses] = useState<Bus[]>(mockBuses);
  const [formData, setFormData] = useState({
    name: '',
    type: 'AC' as Bus['type'],
    totalSeats: 36,
    registrationNumber: '',
  });

  const busTypeOptions = [
    { label: 'AC', value: 'AC' },
    { label: 'Non-AC', value: 'Non-AC' },
    { label: 'Sleeper', value: 'Sleeper' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBus: Bus = {
      id: (buses.length + 1).toString(),
      ...formData,
      status: 'Active',
    };
    setBuses([newBus, ...buses]);
    setFormData({
      name: '',
      type: 'AC',
      totalSeats: 36,
      registrationNumber: '',
    });
  };

  const columns = [
    { header: 'Bus Name', accessor: 'name' as keyof Bus },
    { 
      header: 'Type', 
      accessor: (item: Bus) => (
        <span className="px-3 py-1 rounded-lg bg-neutral-100 text-neutral-600 font-bold text-xs uppercase">
          {item.type}
        </span>
      ) 
    },
    { header: 'Seats', accessor: 'totalSeats' as keyof Bus },
    { header: 'Reg. Number', accessor: 'registrationNumber' as keyof Bus },
    { 
      header: 'Status', 
      accessor: (item: Bus) => (
        <span className="text-green-600 font-black text-xs uppercase tracking-widest">{item.status}</span>
      ) 
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Fleet Management</h2>
        <p className="text-neutral-500 font-medium">Add new buses to your fleet and manage existing ones.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Form Section */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-neutral-800 mb-2">Register New Bus</h3>
            
            <InputField
              label="Bus Name"
              placeholder="e.g. Laxmi Express"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            
            <SelectField
              label="Bus Type"
              value={formData.type}
              options={busTypeOptions}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as Bus['type'] })}
              required
            />
            
            <InputField
              label="Total Seats"
              type="number"
              value={formData.totalSeats}
              onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) })}
              required
            />
            
            <InputField
              label="Registration Number"
              placeholder="e.g. RJ-14-PB-1234"
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
              required
            />
            
            <Button type="submit" fullWidth>Add to Fleet</Button>
          </form>
        </div>

        {/* List Section */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xl font-black text-neutral-800">Your Buses</h3>
          <Table columns={columns} data={buses} />
        </div>
      </div>
    </div>
  );
};

export default AddBus;
