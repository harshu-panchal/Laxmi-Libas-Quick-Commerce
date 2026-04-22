import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { InputField } from '../components/InputField';
import { Button } from '../components/Button';
import { addHotel } from '../../../services/api/hotelPartnerService';
import { uploadImage } from '../../../services/api/uploadService';
import { Camera, Loader2, X, Building2 } from 'lucide-react';

const amenitiesList = [
  'Free WiFi', 'Pool', 'Spa', 'Restaurant', 'Gym', 'Parking', 'Room Service', 'Bar', 'AC', 'Heater'
];

const AddHotel: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    propertyType: 'Hotel',
    spaceType: 'Entire Place',
    address: '',
    city: '',
    state: '',
    pincode: '',
    latitude: '0',
    longitude: '0',
    basePrice: '',
    stars: '3',
    mainImage: '',
    amenities: [] as string[],
    policies: {
      checkInTime: '12:00 PM',
      checkOutTime: '11:00 AM',
      coupleFriendly: true,
      petsAllowed: false,
      smokingAllowed: false,
      localIdsAllowed: true,
      alcoholAllowed: true,
      forEvents: false,
      outsideFoodAllowed: false
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadImage(file, 'hotels');
      setFormData(prev => ({ ...prev, mainImage: result.secureUrl }));
    } catch (error) {
      alert("Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const toggleAmenity = (amenity: string) => {
    setFormData(prev => ({
       ...prev,
       amenities: prev.amenities.includes(amenity)
         ? prev.amenities.filter(a => a !== amenity)
         : [...prev.amenities, amenity]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.mainImage) {
      alert("Please upload a property image first");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude) || 0,
        longitude: parseFloat(formData.longitude) || 0
      };
      const res = await addHotel(payload);
      if (res.success) {
        alert('Hotel registered successfully! It is now pending admin approval.');
        navigate('/seller/hotel/dashboard');
      } else {
        alert(res.message || 'Failed to register hotel');
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Error occurred while registering hotel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-neutral-800 tracking-tight">Register Your Property</h2>
        <p className="text-neutral-500 font-medium mt-1">Fill in the details manually to start hosting on Laxmi Libas Travel.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Property Details */}
        <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <h3 className="text-xl font-black text-neutral-800 tracking-tight">Property Details</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Hotel Name" placeholder="e.g. Grand Palace Resort" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
            <div className="space-y-1.5 flex flex-col">
              <label className="text-sm font-semibold text-neutral-700 ml-1">Property Type</label>
              <select 
                value={formData.propertyType}
                onChange={(e) => setFormData({...formData, propertyType: e.target.value})}
                className="bg-neutral-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-teal-500 font-medium"
              >
                <option value="Hotel">Hotel</option>
                <option value="Homestay">Homestay</option>
                <option value="Resort">Resort</option>
                <option value="Guest House">Guest House</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InputField label="City" placeholder="Type city manually" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} required />
            <InputField label="State" placeholder="e.g. Madhya Pradesh" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} required />
            <InputField label="Pincode" placeholder="e.g. 456001" value={formData.pincode} onChange={(e) => setFormData({...formData, pincode: e.target.value})} required />
          </div>
        </div>

        {/* Policies Section */}
        <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
          <h3 className="text-xl font-black text-neutral-800 tracking-tight flex items-center gap-2">
            <span className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">📋</span>
            Policies & Guest Rules
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Check-in Time" placeholder="e.g. 12:00 PM" value={formData.policies.checkInTime} onChange={(e) => setFormData({...formData, policies: {...formData.policies, checkInTime: e.target.value}})} required />
            <InputField label="Check-out Time" placeholder="e.g. 11:00 AM" value={formData.policies.checkOutTime} onChange={(e) => setFormData({...formData, policies: {...formData.policies, checkOutTime: e.target.value}})} required />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Couple Friendly', key: 'coupleFriendly' },
              { label: 'Pets Allowed', key: 'petsAllowed' },
              { label: 'Smoking Allowed', key: 'smokingAllowed' },
              { label: 'Local IDs Allowed', key: 'localIdsAllowed' },
              { label: 'For Events', key: 'forEvents' },
              { label: 'Outside Food Allowed', key: 'outsideFoodAllowed' }
            ].map(policy => (
              <label key={policy.key} className="flex items-center gap-3 p-4 bg-neutral-50 rounded-2xl cursor-pointer hover:bg-neutral-100 transition-colors">
                <input 
                  type="checkbox" 
                  checked={(formData.policies as any)[policy.key]}
                  onChange={(e) => setFormData({...formData, policies: {...formData.policies, [policy.key]: e.target.checked}})}
                  className="w-5 h-5 rounded border-neutral-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-bold text-neutral-700">{policy.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Pricing & Address */}
        <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField 
              label="Base Price (Starting per night)" 
              type="number" 
              placeholder="e.g. 2500" 
              value={formData.basePrice} 
              onChange={(e) => setFormData({...formData, basePrice: e.target.value})} 
              required 
            />
            <InputField 
              label="Star Rating (1-5)" 
              type="number" 
              placeholder="e.g. 4" 
              min="1" 
              max="5"
              value={formData.stars} 
              onChange={(e) => setFormData({...formData, stars: e.target.value})} 
              required 
            />
          </div>

          <InputField label="Street Address" placeholder="Detailed address" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} required />

          <InputField 
            label="Description" 
            as="textarea" 
            rows={4} 
            placeholder="Describe your hotel, what makes it special?" 
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required 
          />

          <div className="space-y-3">
            <label className="text-sm font-semibold text-neutral-700 ml-1">Amenities</label>
            <div className="flex flex-wrap gap-2">
              {amenitiesList.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                    formData.amenities.includes(amenity)
                      ? 'bg-teal-600 text-white shadow-md scale-105'
                      : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Image Upload */}
        <div className="bg-white p-8 rounded-3xl border border-neutral-100 shadow-sm space-y-6">
          <label className="text-sm font-semibold text-neutral-700 ml-1">Main Property Image</label>
          <div className="relative group">
            {formData.mainImage ? (
              <div className="relative rounded-3xl overflow-hidden aspect-video border border-neutral-100 shadow-xl group">
                <img src={formData.mainImage} alt="Hotel Preview" className="w-full h-full object-cover" />
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, mainImage: ''})}
                  className="absolute top-4 right-4 p-3 bg-black/60 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                >
                  <X size={20} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <label className={`block border-2 border-dashed rounded-[32px] p-12 text-center transition-all cursor-pointer ${isUploading ? 'bg-neutral-50 border-neutral-200 cursor-not-allowed' : 'border-neutral-200 hover:border-teal-500 hover:bg-teal-50/20'}`}>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                  disabled={isUploading} 
                />
                <div className="flex flex-col items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${isUploading ? 'bg-neutral-100' : 'bg-teal-50 text-teal-600 shadow-lg shadow-teal-100'}`}>
                    {isUploading ? <Loader2 className="animate-spin" /> : <Camera size={32} />}
                  </div>
                  <div>
                    <p className="text-base font-black text-neutral-800 uppercase tracking-widest">{isUploading ? 'Uploading...' : 'Upload Property Photo'}</p>
                    <p className="text-xs font-bold text-neutral-400 mt-1 uppercase tracking-widest">exterior or interior view</p>
                  </div>
                </div>
              </label>
            )}
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-4 pb-12">
          <Button variant="outline" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" isLoading={isSubmitting} className="px-10">Register Hotel</Button>
        </div>
      </form>
    </div>
  );
};

export default AddHotel;
