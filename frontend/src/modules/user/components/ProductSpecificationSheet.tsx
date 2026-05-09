import React from 'react';
import { findMatchingCategorySpec } from '../../seller/components/DynamicCategoryFields';

interface ProductSpecificationSheetProps {
    product: any;
}

// Icon helper to return premium SVGs based on attribute keys
const getAttributeIcon = (key: string) => {
    const k = key.toLowerCase();
    if (k.includes('brand')) {
        return (
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        );
    }
    if (k.includes('size') || k.includes('area') || k.includes('bhk')) {
        return (
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
            </svg>
        );
    }
    if (k.includes('color')) {
        return (
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-3" />
            </svg>
        );
    }
    if (k.includes('fabric') || k.includes('material')) {
        return (
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
        );
    }
    if (k.includes('date') || k.includes('expiry') || k.includes('life') || k.includes('time') || k.includes('duration') || k.includes('prep')) {
        return (
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    }
    if (k.includes('rent') || k.includes('deposit') || k.includes('price') || k.includes('cost')) {
        return (
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <span className="font-semibold text-sm">₹</span>
            </svg>
        );
    }
    if (k.includes('power') || k.includes('watt') || k.includes('energy') || k.includes('battery')) {
        return (
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        );
    }
    if (k.includes('spec') || k.includes('model') || k.includes('processor') || k.includes('ram') || k.includes('gpu') || k.includes('storage')) {
        return (
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
        );
    }
    if (k.includes('contact') || k.includes('phone') || k.includes('number')) {
        return (
            <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
        );
    }
    // Default fallback icon
    return (
        <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
    );
};

export default function ProductSpecificationSheet({ product }: ProductSpecificationSheetProps) {
    if (!product) return null;

    // Get Category and Subcategory names
    const categoryName = typeof product.category === 'object' ? (product.category?.name || '') : '';
    const subcategoryName = typeof product.subcategory === 'object' ? (product.subcategory?.subcategoryName || product.subcategory?.name || '') : '';

    const match = findMatchingCategorySpec(categoryName, subcategoryName);
    
    // Gather all specification items
    const specItems: { key: string; label: string; value: any }[] = [];

    // Helper to extract nested or flat value
    const getValue = (key: string) => {
        if (product[key] !== undefined && product[key] !== null && product[key] !== '') {
            return product[key];
        }
        if (product.attributes && product.attributes[key] !== undefined && product.attributes[key] !== null && product.attributes[key] !== '') {
            return product.attributes[key];
        }
        return null;
    };

    if (match) {
        // First match keys defined in registry
        match.spec.fields.forEach(field => {
            const val = getValue(field.name);
            if (val !== null && val !== undefined) {
                let displayVal = val;
                if (field.type === 'date') {
                    try {
                        const dateObj = new Date(val);
                        if (!isNaN(dateObj.getTime())) {
                            displayVal = dateObj.toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            });
                        }
                    } catch (e) {
                        displayVal = val;
                    }
                }
                specItems.push({
                    key: field.name,
                    label: field.label,
                    value: displayVal
                });
            }
        });
    }

    // Add any other attributes present in attributes Map that were NOT listed in the match
    if (product.attributes) {
        Object.entries(product.attributes).forEach(([k, v]) => {
            if (v !== null && v !== undefined && v !== '') {
                // Ensure we don't duplicate
                const exists = specItems.some(item => item.key === k);
                if (!exists) {
                    // Turn camelCase to Title Case
                    const friendlyLabel = k
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase());
                    
                    specItems.push({
                        key: k,
                        label: friendlyLabel,
                        value: v
                    });
                }
            }
        });
    }

    // Add legacy fields if they exist but were not captured in matches
    const legacyKeys = [
        { key: 'brandName', label: 'Brand' },
        { key: 'size', label: 'Size' },
        { key: 'color', label: 'Color' },
        { key: 'fabric', label: 'Fabric' },
        { key: 'material', label: 'Material' },
        { key: 'gender', label: 'Gender' },
        { key: 'prepTime', label: 'Prep Time' },
        { key: 'ingredients', label: 'Ingredients' },
        { key: 'warranty', label: 'Warranty' },
        { key: 'bhk', label: 'Property Type' },
        { key: 'rentAmount', label: 'Rent Amount' }
    ];

    legacyKeys.forEach(legacy => {
        const val = product[legacy.key];
        if (val && !specItems.some(item => item.key === legacy.key)) {
            specItems.push({
                key: legacy.key,
                label: legacy.label,
                value: val
            });
        }
    });

    // If no specs found, do not render anything
    if (specItems.length === 0) {
        return null;
    }

    return (
        <div className="bg-white/75 backdrop-blur-md rounded-2xl border border-neutral-100 shadow-sm overflow-hidden p-6 mt-8">
            <div className="flex items-center gap-3 mb-6 border-b border-neutral-100 pb-4">
                <div className="p-2 bg-teal-50 rounded-lg">
                    <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-base font-bold text-neutral-800">Product Specifications</h3>
                    <p className="text-xs text-neutral-500">Essential details curated for you</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {specItems.map((item, index) => (
                    <div 
                        key={item.key + index} 
                        className="flex items-start gap-4 p-4 rounded-xl bg-neutral-50/50 hover:bg-neutral-50 hover:shadow-sm hover:border-teal-100 border border-transparent transition-all duration-300"
                    >
                        <div className="p-2 bg-white rounded-lg shadow-sm border border-neutral-100/50">
                            {getAttributeIcon(item.key)}
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-neutral-400 block uppercase tracking-wider">
                                {item.label}
                            </span>
                            <span className="text-sm font-bold text-neutral-800">
                                {typeof item.value === 'boolean' ? (item.value ? 'Yes' : 'No') : String(item.value)}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
