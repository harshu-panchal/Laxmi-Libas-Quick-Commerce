import React from 'react';
import { categoryFieldsRegistry, CategorySpec } from '../data/categoryFieldsRegistry';

interface DynamicCategoryFieldsProps {
    categoryName: string;
    subcategoryName?: string;
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export const findMatchingCategorySpec = (categoryName: string, subcategoryName: string = ""): { key: string; spec: CategorySpec } | null => {
    const combinedName = `${categoryName} ${subcategoryName}`.toLowerCase();
    
    // Find first spec where a keyword matches the category or subcategory name
    for (const [key, spec] of Object.entries(categoryFieldsRegistry)) {
        if (spec.keywords.some(keyword => combinedName.includes(keyword.toLowerCase()))) {
            return { key, spec };
        }
    }
    return null;
};

export default function DynamicCategoryFields({ categoryName, subcategoryName, formData, handleChange }: DynamicCategoryFieldsProps) {
    const match = findMatchingCategorySpec(categoryName, subcategoryName);

    if (!match) {
        return null;
    }

    const { spec } = match;

    return (
        <div className="bg-neutral-50/50 p-6 rounded-xl border border-neutral-200/60 space-y-4">
            <div className="flex items-center gap-2 mb-2 border-b border-neutral-100 pb-3">
                <div className="w-1 h-5 bg-teal-500 rounded-full" />
                <h4 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">
                    {categoryName} Specifications
                </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {spec.fields.map(field => {
                    // Normalize date value for input fields
                    let value = formData[field.name] || '';
                    if (field.type === 'date' && value) {
                        try {
                            const dateObj = new Date(value);
                            if (!isNaN(dateObj.getTime())) {
                                value = dateObj.toISOString().split('T')[0];
                            }
                        } catch (e) {
                            value = '';
                        }
                    }

                    if (field.type === 'select') {
                        return (
                            <div key={field.name} className="space-y-1.5">
                                <label className="block text-xs font-bold text-neutral-700 ml-0.5 uppercase tracking-wide">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                <div className="relative">
                                    <select
                                        name={field.name}
                                        value={value}
                                        onChange={handleChange}
                                        required={field.required}
                                        className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none bg-white text-neutral-800 text-sm font-medium transition-all appearance-none"
                                    >
                                        <option value="">Select {field.label}</option>
                                        {field.options?.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    if (field.type === 'textarea') {
                        return (
                            <div key={field.name} className="md:col-span-2 space-y-1.5">
                                <label className="block text-xs font-bold text-neutral-700 ml-0.5 uppercase tracking-wide">
                                    {field.label} {field.required && <span className="text-red-500">*</span>}
                                </label>
                                <textarea
                                    name={field.name}
                                    value={value}
                                    onChange={handleChange}
                                    required={field.required}
                                    placeholder={field.placeholder}
                                    rows={3}
                                    className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-neutral-800 text-sm font-medium transition-all"
                                />
                            </div>
                        );
                    }

                    return (
                        <div key={field.name} className="space-y-1.5">
                            <label className="block text-xs font-bold text-neutral-700 ml-0.5 uppercase tracking-wide">
                                {field.label} {field.required && <span className="text-red-500">*</span>}
                            </label>
                            <input
                                type={field.type}
                                name={field.name}
                                value={value}
                                onChange={handleChange}
                                required={field.required}
                                placeholder={field.placeholder}
                                className="w-full px-4 py-2.5 rounded-lg border border-neutral-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none text-neutral-800 text-sm font-medium transition-all"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
