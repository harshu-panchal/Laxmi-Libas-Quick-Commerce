import React from 'react';
import { Wifi, Tv, Car, Utensils, Wine, Waves, Dumbbell, Sparkles, ConciergeBell, Zap, ArrowUpFromLine, Coffee, Check, ShieldCheck, ThermometerSun, Building2, MonitorDot, Shirt, Stethoscope, Eye, Flame, PlusSquare } from 'lucide-react';

interface Props {
    value: string[];
    onChange: (val: string[]) => void;
}

const MUST_HAVES = [
    { id: 'wifi', label: 'Free Wifi', icon: Wifi },
    { id: 'ac', label: 'AC', icon: Zap },
    { id: 'tv', label: 'TV', icon: Tv },
    { id: 'room_service', label: 'Service', icon: ConciergeBell },
    { id: 'power_backup', label: 'Backup', icon: Zap },
    { id: 'housekeeping', label: 'Cleaning', icon: Sparkles },
    { id: 'hot_water', label: 'Hot Water', icon: ThermometerSun },
    { id: 'reception', label: '24h Front', icon: ShieldCheck },
];

const EXTRAS = [
    { id: 'parking', label: 'Parking', icon: Car },
    { id: 'restaurant', label: 'Dine-in', icon: Utensils },
    { id: 'bar', label: 'Bar', icon: Wine },
    { id: 'pool', label: 'Pool', icon: Waves },
    { id: 'gym', label: 'Gym', icon: Dumbbell },
    { id: 'elevator', label: 'Lift', icon: ArrowUpFromLine },
    { id: 'breakfast', label: 'Breakfast', icon: Coffee },
    { id: 'spa', label: 'Spa', icon: Sparkles },
    { id: 'banquet', label: 'Banquet', icon: Building2 },
    { id: 'conference', label: 'Meeting', icon: MonitorDot },
    { id: 'laundry', label: 'Laundry', icon: Shirt },
    { id: 'doctor', label: 'Doctor', icon: Stethoscope },
];

const StepAmenities: React.FC<Props> = ({ value = [], onChange }) => {
    const toggleAmenity = (id: string) => {
        const newValue = value.includes(id)
            ? value.filter(f => f !== id)
            : [...value, id];
        onChange(newValue);
    };

    const renderGrid = (items: any[]) => (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {items.map((item) => {
                const isSelected = value.includes(item.id);
                return (
                    <button
                        key={item.id}
                        onClick={() => toggleAmenity(item.id)}
                        className={`flex flex-col items-center justify-center p-3 rounded-[20px] border-2 transition-all aspect-square relative
                            ${isSelected
                                ? 'border-hotel-DEFAULT bg-hotel-DEFAULT text-white shadow-lg'
                                : 'border-gray-100 bg-white text-gray-500 hover:border-gray-200'
                            }`}
                    >
                        <item.icon size={24} className={`mb-2 ${isSelected ? 'stroke-white' : 'stroke-gray-400'}`} />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-center leading-none">
                            {item.label}
                        </span>
                        {isSelected && (
                            <div className="absolute top-2 right-2">
                                <Check size={12} strokeWidth={4} />
                            </div>
                        )}
                    </button>
                );
            })}
        </div>
    );

    return (
        <div className="pt-4">
            <h2 className="text-3xl font-[1000] text-gray-900 tracking-tight leading-tight mb-4">
                What amenities do <br/> you offer?
            </h2>
            <p className="text-gray-500 font-bold mb-10 leading-relaxed">
                Select everything available for your guests. These help properties rank higher.
            </p>

            <div className="space-y-10 pb-10">
                <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Core Essentials</h3>
                    {renderGrid(MUST_HAVES)}
                </div>
                <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Additional Perks</h3>
                    {renderGrid(EXTRAS)}
                </div>
            </div>
        </div>
    );
};

export default StepAmenities;
