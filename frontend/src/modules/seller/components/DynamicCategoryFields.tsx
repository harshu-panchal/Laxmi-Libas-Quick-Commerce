import React from 'react';

interface DynamicCategoryFieldsProps {
    categoryName: string;
    subcategoryName?: string;
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

export default function DynamicCategoryFields({ categoryName, subcategoryName, formData, handleChange }: DynamicCategoryFieldsProps) {
    const name = categoryName.toLowerCase();
    const subName = (subcategoryName || '').toLowerCase();

    // Keywords for different categories
    const clothingKeywords = ['clothing', 'fashion', 'jeans', 'shirt', 'top', 'tshirt', 't-shirt', 'pant', 'wear', 'suit', 'kurta', 'kurti', 'saree', 'garment', 'cloth', 'fabric'];
    const footwearKeywords = ['footwear', 'shoe', 'sandal', 'slipper', 'crocs', 'boots', 'heels', 'sneaker', 'jutti', 'kito', 'crokx', 'flip flop'];
    const groceryKeywords = ['grocery', 'food', 'snack', 'drink', 'beverage', 'pulse', 'oil', 'spice', 'household', 'vegetable', 'fruit', 'grains', 'masala'];
    const beautyKeywords = ['beauty', 'cosmetic', 'makeup', 'skin', 'hair', 'care', 'perfume', 'deodorant', 'shampoo', 'soap'];
    const electronicsKeywords = ['electronics', 'mobile', 'laptop', 'computer', 'accessory', 'gadget', 'tv', 'fridge', 'appliance', 'watch'];
    const toysKeywords = ['toy', 'game', 'puzzle', 'doll', 'action figure', 'outdoor', 'indoor', 'kids'];
    const homeKeywords = ['home', 'furniture', 'decor', 'kitchen', 'dining', 'bedroom', 'office', 'living', 'appliance'];
    const eyeglassesKeywords = ['eye', 'glass', 'spectacle', 'sunglass', 'lens', 'frame', 'testing'];
    const automotiveKeywords = ['automotive', 'part', 'engine', 'accessory', 'tyre', 'wheel', 'interior', 'exterior', 'tool', 'equipment'];
    const serviceKeywords = ['service', 'clean', 'electrician', 'plumber', 'pest', 'salon', 'repair', 'maintenance', 'installation'];
    const rentalKeywords = ['rental', 'rent', 'room', 'bike', 'car', 'furniture', 'appliance', 'costume'];

    // Category Matching Logic
    
    // Clothing / Fashion
    if (clothingKeywords.some(kw => name.includes(kw) || subName.includes(kw))) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Brand (Custom)</label>
                    <input type="text" name="brandName" value={formData.brandName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. Zara, Local Brand" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Size</label>
                    <select name="size" value={formData.size || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                        <option value="">Select Size</option>
                        <option value="S">S</option>
                        <option value="M">M</option>
                        <option value="L">L</option>
                        <option value="XL">XL</option>
                        <option value="XXL">XXL</option>
                        <option value="XXXL">XXXL</option>
                        <option value="Free Size">Free Size</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Color</label>
                    <input type="text" name="color" value={formData.color || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. Blue" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Fabric</label>
                    <input type="text" name="fabric" value={formData.fabric || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g. Cotton" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Gender</label>
                    <select name="gender" value={formData.gender || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                        <option value="">Select Gender</option>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Unisex">Unisex</option>
                        <option value="Kids/Boys">Kids/Boys</option>
                        <option value="Kids/Girls">Kids/Girls</option>
                    </select>
                </div>
            </div>
        );
    }

    // Footwear
    if (footwearKeywords.some(kw => name.includes(kw) || subName.includes(kw))) {
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

    // Grocery / Produce
    if (groceryKeywords.some(kw => name.includes(kw) || subName.includes(kw))) {
        const isProduce = name.includes('fruit') || name.includes('vegetable') || subName.includes('fruit') || subName.includes('vegetable');
        
        if (isProduce) {
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

    // Beauty
    if (beautyKeywords.some(kw => name.includes(kw) || subName.includes(kw))) {
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
    if (electronicsKeywords.some(kw => name.includes(kw) || subName.includes(kw))) {
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
    if (toysKeywords.some(kw => name.includes(kw) || subName.includes(kw))) {
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
    if (homeKeywords.some(kw => name.includes(kw) || subName.includes(kw))) {
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
    if (eyeglassesKeywords.some(kw => name.includes(kw) || subName.includes(kw))) {
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

    // Rental
    if (rentalKeywords.some(kw => name.includes(kw) || subName.includes(kw))) {
        const isBike = subName.includes('bike') || subName.includes('vehicle');

        if (isBike) {
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
                </div>
            );
        }

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
                    </select>
                </div>
            </div>
        );
    }

    // Automotive Parts
    if (automotiveKeywords.some(kw => name.includes(kw) || subName.includes(kw))) {
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
            </div>
        );
    }

    // Services
    if (serviceKeywords.some(kw => name.includes(kw) || subName.includes(kw))) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Service Name</label>
                    <input type="text" name="serviceName" value={formData.serviceName || formData.productName || ''} onChange={handleChange} className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-teal-500" />
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
