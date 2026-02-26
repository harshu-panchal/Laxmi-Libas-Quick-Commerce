import React from 'react';

interface DynamicCategoryFieldsProps {
    categoryName: string;
    subcategoryName?: string;
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function DynamicCategoryFields({ categoryName, subcategoryName, formData, handleChange }: DynamicCategoryFieldsProps) {
    const name = categoryName.toLowerCase();

    // Clothing / Fashion
    if (name.includes('clothing') || name.includes('fashion')) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Brand</label>
                    <input type="text" name="brandName" value={formData.brandName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. Zara" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Size</label>
                    <input type="text" name="size" value={formData.size || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. S, M, L, XL" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Color</label>
                    <input type="text" name="color" value={formData.color || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. Blue" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Fabric</label>
                    <input type="text" name="fabric" value={formData.fabric || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. Cotton" />
                </div>
            </div>
        );
    }

    // Footwear
    if (name.includes('footwear')) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Brand</label>
                    <input type="text" name="brandName" value={formData.brandName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. Nike" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Size (UK/US)</label>
                    <input type="text" name="size" value={formData.size || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. 8, 9, 10" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Material</label>
                    <input type="text" name="material" value={formData.material || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. Leather" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Gender</label>
                    <select name="gender" value={formData.gender || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                        <option value="">Select Gender</option>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Unisex">Unisex</option>
                        <option value="Kids">Kids</option>
                    </select>
                </div>
            </div>
        );
    }

    // Grocery
    if (name.includes('grocery')) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Brand</label>
                    <input type="text" name="brandName" value={formData.brandName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Quantity (e.g. 1kg, 500ml)</label>
                    <input type="text" name="quantityInsidePack" value={formData.quantityInsidePack || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Expiry Date</label>
                    <input type="date" name="expiryDate" value={formData.expiryDate && !isNaN(new Date(formData.expiryDate).getTime()) ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
            </div>
        );
    }

    // Fruits & Vegetables
    if (name.includes('fruits') || name.includes('vegetables') || name.includes('fruit') || name.includes('vegetable')) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Shelf Life (e.g. 3 days, 1 week)</label>
                    <input type="text" name="shelfLife" value={formData.shelfLife || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. 3 days" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Storage Instructions</label>
                    <input type="text" name="specifications" value={formData.specifications || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. Keep refrigerated" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Unit/Weight (e.g. 500g, 1kg, 1 pc)</label>
                    <input type="text" name="weight" value={formData.weight || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. 1kg" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Origin (Optional)</label>
                    <input type="text" name="madeIn" value={formData.madeIn || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. Local Farm" />
                </div>
            </div>
        );
    }

    // Food
    if (name.includes('food')) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Dish Name</label>
                    <input type="text" name="dishName" value={formData.dishName || formData.productName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Type (Veg/Non-Veg)</label>
                    <select name="type" value={formData.type || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                        <option value="">Select Type</option>
                        <option value="Veg">Veg</option>
                        <option value="Non-Veg">Non-Veg</option>
                        <option value="Egg">Egg</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Preparation Time (mins)</label>
                    <input type="text" name="prepTime" value={formData.prepTime || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. 20" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Ingredients</label>
                    <textarea name="ingredients" value={formData.ingredients || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" rows={2}></textarea>
                </div>
            </div>
        );
    }

    // Beauty
    if (name.includes('beauty')) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Brand</label>
                    <input type="text" name="brandName" value={formData.brandName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Skin Type</label>
                    <input type="text" name="skinType" value={formData.skinType || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. All, Oily, Dry" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Expiry Date</label>
                    <input type="date" name="expiryDate" value={formData.expiryDate ? new Date(formData.expiryDate).toISOString().split('T')[0] : ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
            </div>
        );
    }

    // Electronics
    if (name.includes('electronics')) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Brand</label>
                    <input type="text" name="brandName" value={formData.brandName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Model Name</label>
                    <input type="text" name="modelName" value={formData.modelName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Warranty</label>
                    <input type="text" name="warranty" value={formData.warranty || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. 1 Year" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Specifications</label>
                    <textarea name="specifications" value={formData.specifications || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" rows={3}></textarea>
                </div>
            </div>
        );
    }

    // Toys
    if (name.includes('toys')) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Brand</label>
                    <input type="text" name="brandName" value={formData.brandName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Age Group</label>
                    <input type="text" name="ageGroup" value={formData.ageGroup || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. 3-5 years" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Material</label>
                    <input type="text" name="material" value={formData.material || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
            </div>
        );
    }

    // Home & Furniture
    if (name.includes('home') || name.includes('furniture')) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Material</label>
                    <input type="text" name="material" value={formData.material || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Size/Dimensions</label>
                    <input type="text" name="size" value={formData.size || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Weight</label>
                    <input type="text" name="weight" value={formData.weight || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
            </div>
        );
    }

    // Eyeglasses
    if (name.includes('eyeglasses')) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Frame Type</label>
                    <input type="text" name="frameType" value={formData.frameType || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Lens Type</label>
                    <input type="text" name="lensType" value={formData.lensType || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Power (if applicable)</label>
                    <input type="text" name="power" value={formData.power || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Brand</label>
                    <input type="text" name="brandName" value={formData.brandName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
            </div>
        );
    }

    // Rental (Room, Bike, etc.)
    if (name.includes('room') || name.includes('rental') || name.includes('rent')) {
        const subName = (subcategoryName || '').toLowerCase();

        // Bike Rent
        if (subName.includes('bike') || subName.includes('vehicle')) {
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Rent Amount (Daily/Monthly)</label>
                        <input type="number" name="rentAmount" value={formData.rentAmount || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Security Deposit</label>
                        <input type="number" name="securityDeposit" value={formData.securityDeposit || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Vehicle Model</label>
                        <input type="text" name="vehicleModel" value={formData.vehicleModel || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. Splendor Plus" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Brand</label>
                        <input type="text" name="brandName" value={formData.brandName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Year</label>
                        <input type="text" name="specifications" value={formData.specifications || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="Manufacturing Year" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Mileage (kmpl)</label>
                        <input type="text" name="experience" value={formData.experience || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                    </div>
                </div>
            );
        }

        // Room Rent (Default if subcategory not specified yet or matches room)
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Rent Amount (Monthly)</label>
                    <input type="number" name="rentAmount" value={formData.rentAmount || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Security Deposit</label>
                    <input type="number" name="securityDeposit" value={formData.securityDeposit || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">BHK</label>
                    <select name="bhk" value={formData.bhk || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                        <option value="">Select BHK</option>
                        <option value="1 BHK">1 BHK</option>
                        <option value="2 BHK">2 BHK</option>
                        <option value="3 BHK">3 BHK</option>
                        <option value="1 RK">1 RK</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Furnishing</label>
                    <select name="furnishingStatus" value={formData.furnishingStatus || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                        <option value="">Select Status</option>
                        <option value="Furnished">Furnished</option>
                        <option value="Semi-Furnished">Semi-Furnished</option>
                        <option value="Unfurnished">Unfurnished</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Area (sq ft)</label>
                    <input type="text" name="areaSize" value={formData.areaSize || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Contact Number</label>
                    <input type="text" name="contactNumber" value={formData.contactNumber || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
            </div>
        );
    }

    // Automotive Parts
    if (name.includes('automotive') || name.includes('parts')) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Part Number</label>
                    <input type="text" name="partNumber" value={formData.partNumber || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Vehicle Model</label>
                    <input type="text" name="vehicleModel" value={formData.vehicleModel || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Brand</label>
                    <input type="text" name="brandName" value={formData.brandName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Warranty</label>
                    <input type="text" name="warranty" value={formData.warranty || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
            </div>
        );
    }

    // Services
    if (name.includes('services')) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Service Name</label>
                    <input type="text" name="serviceName" value={formData.serviceName || formData.productName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Experience (Years)</label>
                    <input type="text" name="experience" value={formData.experience || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Availability</label>
                    <input type="text" name="availability" value={formData.availability || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. 9AM - 6PM, Mon-Sat" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Contact Number</label>
                    <input type="text" name="contactNumber" value={formData.contactNumber || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
                </div>
            </div>
        );
    }

    return null;
}
