import React from 'react';
import { Home, Grip, Building2, Palmtree } from 'lucide-react';

interface Props {
    value: string;
    onChange: (val: string) => void;
}

const options = [
    { id: 'hotel', label: 'Hotel', icon: Building2, desc: 'Professional hospitality service' },
    { id: 'resort', label: 'Resort', icon: Palmtree, desc: 'Luxury vacation experience' },
    { id: 'homestay', label: 'Homestay', icon: Home, desc: 'Shared home environment' },
    { id: 'lodge', label: 'Lodge', icon: Grip, desc: 'Budget-friendly travel stay' },
];

const StepPropertyType: React.FC<Props> = ({ value, onChange }) => {
    return (
        <div className="pt-4">
            <h2 className="text-3xl font-[1000] text-gray-900 tracking-tight leading-tight mb-4">
                What type of place is it?
            </h2>
            <p className="text-gray-500 font-bold mb-10 leading-relaxed">
                Choose the category that best describes your property.
            </p>

            <div className="grid grid-cols-1 gap-4">
                {options.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => onChange(opt.id)}
                        className={`p-5 rounded-[24px] border-2 transition-all flex items-center gap-5 text-left
                            ${value === opt.id
                                ? 'border-hotel-DEFAULT bg-hotel-light/5 shadow-lg shadow-hotel-light/10'
                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                            }`}
                    >
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0
                            ${value === opt.id ? 'bg-hotel-DEFAULT text-white shadow-lg' : 'bg-gray-100 text-gray-400'}`}>
                            <opt.icon size={28} />
                        </div>
                        <div>
                            <span className={`text-lg font-[1000] block ${value === opt.id ? 'text-hotel-DEFAULT' : 'text-gray-900'}`}>
                                {opt.label}
                            </span>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tight">{opt.desc}</span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default StepPropertyType;
