import React, { useState } from 'react';
import { SelectField } from '../components/SelectField';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { Table } from '../components/Table';
import { Schedule } from '../types';
import { mockSchedules, mockBuses, mockRoutes } from '../data/mockData';

const SchedulePage: React.FC = () => {
  const [schedules, setSchedules] = useState<Schedule[]>(mockSchedules);
  const [formData, setFormData] = useState({
    busId: '',
    routeId: '',
    date: '',
    departureTime: '',
    arrivalTime: '',
  });

  const busOptions = mockBuses.map(b => ({ label: b.name, value: b.id }));
  const routeOptions = mockRoutes.map(r => ({ label: `${r.from} to ${r.to}`, value: r.id }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const bus = mockBuses.find(b => b.id === formData.busId);
    const route = mockRoutes.find(r => r.id === formData.routeId);
    
    const newSchedule: Schedule = {
      id: `s${schedules.length + 1}`,
      ...formData,
      busName: bus?.name,
      from: route?.from,
      to: route?.to,
    };
    
    setSchedules([newSchedule, ...schedules]);
    setFormData({
      busId: '',
      routeId: '',
      date: '',
      departureTime: '',
      arrivalTime: '',
    });
  };

  const columns = [
    { header: 'Bus', accessor: 'busName' as keyof Schedule },
    { 
      header: 'Route', 
      accessor: (item: Schedule) => `${item.from} → ${item.to}` 
    },
    { header: 'Date', accessor: 'date' as keyof Schedule },
    { header: 'Departure', accessor: 'departureTime' as keyof Schedule },
    { header: 'Arrival', accessor: 'arrivalTime' as keyof Schedule },
    { 
      header: 'Status', 
      accessor: () => (
        <span className="text-teal-600 font-black text-xs uppercase tracking-widest">Scheduled</span>
      ) 
    },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Bus Scheduling</h2>
        <p className="text-neutral-500 font-medium">Assign buses to routes and set their departure times.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
            <h3 className="text-xl font-black text-neutral-800 mb-2">Create New Schedule</h3>
            
            <SelectField
              label="Select Bus"
              value={formData.busId}
              options={busOptions}
              onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
              required
            />
            
            <SelectField
              label="Select Route"
              value={formData.routeId}
              options={routeOptions}
              onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
              required
            />
            
            <InputField
              label="Date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <InputField
                label="Departure"
                type="time"
                value={formData.departureTime}
                onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                required
              />
              <InputField
                label="Arrival"
                type="time"
                value={formData.arrivalTime}
                onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                required
              />
            </div>
            
            <Button type="submit" fullWidth>Confirm Schedule</Button>
          </form>
        </div>

        <div className="lg:col-span-3 space-y-6">
          <h3 className="text-xl font-black text-neutral-800">Schedule List</h3>
          <Table columns={columns} data={schedules} />
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
