import React, { useRef, useState } from 'react';
import { Plus, Image as ImageIcon, X, Loader2, Camera, LayoutGrid, Award } from 'lucide-react';

interface Props {
    value: any[];
    onChange: (val: any[]) => void;
}

const PHOTO_CATEGORIES = [
    { id: 'facade', label: 'Exterior / Entrance', min: 2, icon: Camera },
    { id: 'common', label: 'Reception / Common', min: 1, icon: LayoutGrid },
];

const StepPropertyImages: React.FC<Props> = ({ value = [], onChange }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState<string | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setUploading(category);
        // Simulation of upload – In real app use FormData and API
        setTimeout(() => {
            const newImages = files.map(file => ({
                id: Math.random().toString(36).substr(2, 9),
                url: URL.createObjectURL(file), // Local preview
                category: category
            }));
            onChange([...value, ...newImages]);
            setUploading(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }, 1500);
    };

    const removeImage = (id: string) => {
        onChange(value.filter(img => img.id !== id));
    };

    return (
        <div className="pt-4">
            <h2 className="text-3xl font-[1000] text-gray-900 tracking-tight leading-tight mb-4">
                Add photos of your <br/> property
            </h2>
            <p className="text-gray-500 font-bold mb-10 leading-relaxed">
                Show guests what your place looks like. High quality photos increase trust by 40%.
            </p>

            <div className="space-y-12 pb-10">
                {PHOTO_CATEGORIES.map((cat) => {
                    const catImages = value.filter(img => img.category === cat.id);
                    return (
                        <div key={cat.id} className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <div className="flex items-center gap-2">
                                    <cat.icon size={20} className="text-hotel-DEFAULT" />
                                    <span className="text-sm font-black text-gray-900 uppercase tracking-widest">{cat.label}</span>
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${catImages.length >= cat.min ? 'bg-green-100 text-green-700' : 'bg-amber-50 text-amber-600'}`}>
                                    {catImages.length} uploaded • Min {cat.min}
                                </span>
                            </div>

                            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                                <button
                                    onClick={() => {
                                        if (fileInputRef.current) {
                                            fileInputRef.current.dataset.category = cat.id;
                                            fileInputRef.current.click();
                                        }
                                    }}
                                    className="shrink-0 w-32 h-32 rounded-[28px] border-2 border-dashed border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-hotel-DEFAULT hover:text-hotel-DEFAULT hover:bg-hotel-light/5 transition-all"
                                >
                                    {uploading === cat.id ? <Loader2 className="animate-spin" /> : <Plus />}
                                    <span className="text-[10px] font-black uppercase tracking-widest">Add Photo</span>
                                </button>

                                {catImages.map((img) => (
                                    <div key={img.id} className="shrink-0 w-32 h-32 rounded-[28px] bg-gray-100 relative overflow-hidden group shadow-sm border border-gray-50">
                                        <img src={img.url} className="w-full h-full object-cover" alt="Property" />
                                        <button 
                                            onClick={() => removeImage(img.id)}
                                            className="absolute top-2 right-2 bg-black/50 backdrop-blur-md text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} strokeWidth={4} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-gray-900 rounded-3xl p-6 text-white flex items-start gap-4 shadow-xl">
                <div className="w-10 h-10 bg-hotel-DEFAULT rounded-xl flex items-center justify-center shrink-0">
                    <Award size={20} />
                </div>
                <div>
                    <h4 className="font-black text-sm uppercase tracking-widest mb-1">Elite Property Status</h4>
                    <p className="text-xs text-white/60 font-bold leading-relaxed">
                        Properties with 5+ photos of each category are eligible for the 'Elite' badge and priority listing.
                    </p>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={(e) => {
                    const category = fileInputRef.current?.dataset.category;
                    if (category) handleUpload(e, category);
                }}
            />
        </div>
    );
};

export default StepPropertyImages;
