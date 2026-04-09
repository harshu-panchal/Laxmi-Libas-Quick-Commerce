import React, { useState } from 'react';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';

const amenitiesList = [
  'Free WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Parking', 'Room Service', 'Bar', 'AC', 'Heater'
];

const AddHotel: React.FC = () => {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity) 
        : [...prev, amenity]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      alert('Hotel added successfully! (Mock Action)');
    }, 1000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Add New Hotel</h2>
        <p className="text-neutral-500 font-medium">List your property on Laxmi Libas Travel.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-neutral-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InputField label="Hotel Name" placeholder="e.g. Grand Palace Resort" required />
          <InputField label="Location" placeholder="e.g. Jaipur, Rajasthan" required />
        </div>

        <InputField label="Description" as="textarea" rows={4} placeholder="Describe your hotel..." required />

        <div className="space-y-3">
          <label className="text-sm font-semibold text-neutral-700 ml-1">Amenities</label>
          <div className="flex flex-wrap gap-2">
            {amenitiesList.map(amenity => (
              <button
                key={amenity}
                type="button"
                onClick={() => toggleAmenity(amenity)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedAmenities.includes(amenity)
                    ? 'bg-teal-600 text-white shadow-md'
                    : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {amenity}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-semibold text-neutral-700 ml-1">Upload Images</label>
          <div className="border-2 border-dashed border-neutral-200 rounded-2xl p-8 text-center hover:border-teal-500 hover:bg-teal-50/10 transition-all cursor-pointer group">
            <div className="w-12 h-12 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-teal-50 group-hover:text-teal-600 transition-all">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
            <p className="text-sm font-bold text-neutral-700">Click to upload or drag and drop</p>
            <p className="text-xs text-neutral-400 mt-1">PNG, JPG or WEBP (Max 5MB)</p>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-4">
          <Button variant="outline" type="button">Cancel</Button>
          <Button type="submit" isLoading={isSubmitting}>Register Hotel</Button>
        </div>
      </form>
    </div>
  );
};

export default AddHotel;
