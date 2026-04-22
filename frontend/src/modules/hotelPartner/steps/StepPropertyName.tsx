import React from 'react';
import { Building } from 'lucide-react';

interface Props {
    value: string;
    onChange: (val: string) => void;
}

const StepPropertyName: React.FC<Props> = ({ value, onChange }) => {
    return (
        <div className="pt-4">
            <div className="w-20 h-20 bg-hotel-light/10 text-hotel-DEFAULT rounded-[24px] flex items-center justify-center mb-10 shadow-sm border border-hotel-light/5">
                <Building size={32} />
            </div>
            
            <h2 className="text-3xl font-[1000] text-gray-900 tracking-tight leading-tight mb-4">
                What's the name of your <br/> property?
            </h2>
            <p className="text-gray-500 font-bold mb-10 leading-relaxed">
                Give your property a catchy name that guests will remember. You can update this later.
            </p>

            <div className="relative group">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="e.g. Grand Pacific Resort"
                    className="w-full bg-transparent text-2xl font-black border-b-4 border-gray-100 py-4 focus:outline-none focus:border-hotel-DEFAULT transition-all placeholder:text-gray-200"
                />
            </div>
            
            <div className="mt-8 flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="w-2 h-2 rounded-full bg-hotel-DEFAULT animate-pulse" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest leading-none">
                    Verified properties get 2x more visibility
                </p>
            </div>
        </div>
    );
};

export default StepPropertyName;
