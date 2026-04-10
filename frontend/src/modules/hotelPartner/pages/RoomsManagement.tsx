import React, { useState } from 'react';
import { Table } from '../components/Table';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { InputField } from '../components/InputField';
import { mockRooms } from '../data/mockData';
import { Room } from '../types';

const RoomsManagement: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>(mockRooms);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleAvailability = (id: string) => {
    setRooms(prev => prev.map(room => 
      room.id === id ? { ...room, availability: !room.availability } : room
    ));
  };

  const columns = [
    { header: 'Room type', accessor: 'type' as keyof Room },
    { header: 'Price / Night', accessor: (item: Room) => `₹${item.pricePerNight.toLocaleString()}` },
    { header: 'Capacity', accessor: (item: Room) => `${item.capacity} Persons` },
    { 
      header: 'Availability', 
      accessor: (item: Room) => (
        <button 
          onClick={() => toggleAvailability(item.id)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ring-2 ring-transparent ring-offset-2 ${
            item.availability ? 'bg-teal-600 font-bold' : 'bg-neutral-200 font-bold'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            item.availability ? 'translate-x-6' : 'translate-x-1'
          }`} />
        </button>
      )
    },
    {
      header: 'Actions',
      accessor: () => (
        <div className="flex gap-2">
          <button className="p-2 text-neutral-400 hover:text-teal-600 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Rooms Management</h2>
          <p className="text-neutral-500 font-medium">Manage your inventory and pricing.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Add Room</Button>
      </div>

      <Table columns={columns} data={rooms} />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Add New Room"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setIsModalOpen(false)}>Create Room</Button>
          </>
        }
      >
        <div className="space-y-4">
          <InputField label="Room Type" placeholder="e.g. Luxury Suite" />
          <div className="grid grid-cols-2 gap-4">
            <InputField label="Price per Night" type="number" placeholder="0.00" />
            <InputField label="Capacity" type="number" placeholder="2" />
          </div>
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl">
            <span className="text-sm font-semibold text-neutral-700">Initial Availability</span>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-teal-600">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default RoomsManagement;
