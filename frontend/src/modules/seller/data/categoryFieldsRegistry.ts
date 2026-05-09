export interface FieldConfig {
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'date' | 'textarea' | 'boolean';
    placeholder?: string;
    options?: string[];
    required?: boolean;
}

export interface CategorySpec {
    keywords: string[];
    fields: FieldConfig[];
}

export const categoryFieldsRegistry: Record<string, CategorySpec> = {
    apparelFashion: {
        keywords: ['clothing', 'fashion', 'wear', 'garment', 'shirt', 'top', 'jeans', 'kurta', 'saree', 'suit', 'dress'],
        fields: [
            { name: 'brandName', label: 'Brand (Custom)', type: 'text', placeholder: 'e.g. Zara, Local Brand' },
            { name: 'size', label: 'Size', type: 'text', placeholder: 'e.g. S, M, L, XL, 32, 36' },
            { name: 'color', label: 'Color', type: 'text', placeholder: 'e.g. Navy Blue, Crimson Red' },
            { name: 'fabric', label: 'Fabric/Material', type: 'text', placeholder: 'e.g. 100% Pure Cotton, Linen' },
            { name: 'gender', label: 'Target Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Kids/Boys', 'Kids/Girls'] }
        ]
    },
    footwear: {
        keywords: ['footwear', 'shoe', 'sandal', 'slipper', 'crocs', 'boots', 'sneaker', 'jutti', 'flip flop'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Nike, Adidas' },
            { name: 'size', label: 'Size (UK/US)', type: 'text', placeholder: 'e.g. 8, 9, 10, UK-7' },
            { name: 'color', label: 'Color', type: 'text', placeholder: 'e.g. Charcoal Black' },
            { name: 'material', label: 'Material', type: 'text', placeholder: 'e.g. Genuine Leather, Mesh' },
            { name: 'gender', label: 'Target Gender', type: 'select', options: ['Men', 'Women', 'Unisex', 'Kids'] }
        ]
    },
    groceryStaples: {
        keywords: ['grocery', 'staples', 'pulse', 'grain', 'oil', 'spice', 'flour', 'sugar', 'salt', 'rice', 'dal', 'masala'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Tata, Fortune' },
            { name: 'quantityInsidePack', label: 'Quantity Inside Pack', type: 'text', placeholder: 'e.g. 1kg, 500g, 5 Litres' },
            { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
            { name: 'vegNonVeg', label: 'Dietary Type', type: 'select', options: ['Veg', 'Non-Veg', 'Eggitarian'] }
        ]
    },
    freshFruitsVeg: {
        keywords: ['fruit', 'vegetable', 'produce', 'greens', 'organic', 'onion', 'potato', 'apple'],
        fields: [
            { name: 'weight', label: 'Pack Weight/Unit', type: 'text', placeholder: 'e.g. 1kg, 500g, 1 Bunch' },
            { name: 'origin', label: 'Origin/Source', type: 'text', placeholder: 'e.g. Local Organic Farm, Shimla' },
            { name: 'shelfLife', label: 'Estimated Shelf Life', type: 'text', placeholder: 'e.g. 3-4 Days (Refrigerated)' },
            { name: 'organicStatus', label: 'Organic Status', type: 'select', options: ['Standard', 'Certified Organic'] }
        ]
    },
    bakeryDairy: {
        keywords: ['dairy', 'bakery', 'milk', 'cheese', 'butter', 'bread', 'cake', 'pastry', 'paneer', 'yogurt'],
        fields: [
            { name: 'quantityInsidePack', label: 'Net Content', type: 'text', placeholder: 'e.g. 500ml, 200g, Pack of 4' },
            { name: 'expiryDate', label: 'Best Before Date', type: 'date' },
            { name: 'shelfLife', label: 'Shelf Life', type: 'text', placeholder: 'e.g. 2 Days' },
            { name: 'allergenInfo', label: 'Allergen Information', type: 'text', placeholder: 'e.g. Contains Milk, Soy, Wheat' }
        ]
    },
    beveragesDrinks: {
        keywords: ['beverage', 'drink', 'juice', 'soda', 'soft drink', 'tea', 'coffee', 'shake', 'cola'],
        fields: [
            { name: 'quantityInsidePack', label: 'Volume', type: 'text', placeholder: 'e.g. 250ml, 1 Litre' },
            { name: 'expiryDate', label: 'Best Before Date', type: 'date' },
            { name: 'packagingType', label: 'Packaging Type', type: 'select', options: ['Bottle', 'Can', 'TetraPack', 'Glass Bottle'] }
        ]
    },
    snacksSweets: {
        keywords: ['snack', 'chocolate', 'chips', 'namkeen', 'sweets', 'mithai', 'biscuit', 'cookies', 'candy'],
        fields: [
            { name: 'quantityInsidePack', label: 'Net Weight', type: 'text', placeholder: 'e.g. 150g, 400g' },
            { name: 'expiryDate', label: 'Best Before Date', type: 'date' },
            { name: 'vegNonVeg', label: 'Dietary Type', type: 'select', options: ['Veg', 'Non-Veg', 'Eggitarian'] },
            { name: 'allergenInfo', label: 'Allergens', type: 'text', placeholder: 'e.g. Contains Peanuts, Gluten' }
        ]
    },
    restaurantFood: {
        keywords: ['restaurant', 'food', 'biryani', 'pizza', 'burger', 'fast food', 'cuisine', 'pasta', 'thali'],
        fields: [
            { name: 'dishName', label: 'Dish Name', type: 'text', placeholder: 'e.g. Paneer Tikka Masala' },
            { name: 'prepTime', label: 'Estimated Prep Time', type: 'text', placeholder: 'e.g. 20 Mins' },
            { name: 'ingredients', label: 'Main Ingredients', type: 'text', placeholder: 'e.g. Fresh Paneer, Spices, Tomato Gravy' },
            { name: 'spicyLevel', label: 'Spice Level', type: 'select', options: ['Mild', 'Medium', 'Spicy', 'Extra Hot'] }
        ]
    },
    beautyMakeup: {
        keywords: ['makeup', 'cosmetics', 'lipstick', 'eyeliner', 'foundation', 'nail polish', 'blush', 'kajal'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Lakme, Nykaa' },
            { name: 'shadeName', label: 'Shade / Color Name', type: 'text', placeholder: 'e.g. Ruby Red, Ivory 10' },
            { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
            { name: 'finishType', label: 'Finish', type: 'select', options: ['Matte', 'Glossy', 'Satin', 'Dewy'] }
        ]
    },
    skinHairCare: {
        keywords: ['skin', 'hair', 'care', 'moisturizer', 'shampoo', 'hair oil', 'serum', 'body wash', 'conditioner', 'lotion'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Nivea, L’Oreal' },
            { name: 'skinType', label: 'Suitable Skin Type', type: 'text', placeholder: 'e.g. Oily, All Skin Types, Sensitive' },
            { name: 'hairType', label: 'Suitable Hair Type', type: 'text', placeholder: 'e.g. Dry, Frizzy, Dandruff-prone' },
            { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
            { name: 'parabenFree', label: 'Paraben Free?', type: 'select', options: ['Yes', 'No'] }
        ]
    },
    personalCareHygiene: {
        keywords: ['hygiene', 'soap', 'toothpaste', 'deodorant', 'shaving', 'perfume', 'sanitary', 'handwash'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Dettol, Colgate' },
            { name: 'quantityInsidePack', label: 'Size/Volume', type: 'text', placeholder: 'e.g. 125g, 150ml' },
            { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
            { name: 'fragrance', label: 'Fragrance/Scent', type: 'text', placeholder: 'e.g. Menthol, Fresh Aloe' }
        ]
    },
    mobilesTablets: {
        keywords: ['mobile', 'phone', 'tablet', 'ipad', 'iphone', 'smartphone', 'oneplus', 'samsung'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Apple, Samsung' },
            { name: 'modelName', label: 'Model Name', type: 'text', placeholder: 'e.g. iPhone 15 Pro' },
            { name: 'specifications', label: 'Key Specifications', type: 'text', placeholder: 'e.g. 8GB RAM, 256GB Storage' },
            { name: 'warranty', label: 'Warranty Period', type: 'text', placeholder: 'e.g. 1 Year Brand Warranty' },
            { name: 'color', label: 'Color', type: 'text', placeholder: 'e.g. Titanium Gray' }
        ]
    },
    laptopsComputers: {
        keywords: ['laptop', 'computer', 'desktop', 'monitor', 'macbook', 'cpu'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Dell, HP, ASUS' },
            { name: 'modelName', label: 'Model Name', type: 'text', placeholder: 'e.g. Inspiron 15' },
            { name: 'processorType', label: 'Processor Info', type: 'text', placeholder: 'e.g. Intel Core i5 13th Gen' },
            { name: 'ramSize', label: 'RAM Size', type: 'text', placeholder: 'e.g. 16GB DDR5' },
            { name: 'storageCapacity', label: 'Storage', type: 'text', placeholder: 'e.g. 512GB NVMe SSD' },
            { name: 'graphicsCard', label: 'Graphics Card (GPU)', type: 'text', placeholder: 'e.g. NVIDIA RTX 4050 6GB' }
        ]
    },
    mobileAccessories: {
        keywords: ['accessory', 'accessories', 'charger', 'power bank', 'cable', 'phone case', 'screen guard', 'adapter'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Spigen, Anker' },
            { name: 'compatibleDevice', label: 'Compatible With', type: 'text', placeholder: 'e.g. iPhone 15, Type-C Devices' },
            { name: 'material', label: 'Material', type: 'text', placeholder: 'e.g. TPU, Tempered Glass' },
            { name: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g. 6 Months Brand Warranty' }
        ]
    },
    smartWearables: {
        keywords: ['smartwatch', 'wearable', 'fitness band', 'smart watch', 'tracker'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Noise, boAt' },
            { name: 'modelName', label: 'Model Name', type: 'text', placeholder: 'e.g. ColorFit Pro 4' },
            { name: 'batteryLife', label: 'Battery Backup', type: 'text', placeholder: 'e.g. Up to 7 Days' },
            { name: 'waterResistance', label: 'Water Resistance', type: 'text', placeholder: 'e.g. IP68 Certified' }
        ]
    },
    audioHeadphones: {
        keywords: ['headphone', 'earbud', 'earphone', 'speaker', 'bluetooth speaker', 'soundbar', 'buds'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. boAt, Sony, JBL' },
            { name: 'modelName', label: 'Model Name', type: 'text', placeholder: 'e.g. Rockerz 255' },
            { name: 'batteryBackup', label: 'Battery/Playback Time', type: 'text', placeholder: 'e.g. 30 Hours Playtime' },
            { name: 'noiseCancellation', label: 'ANC Support?', type: 'select', options: ['Yes', 'No'] }
        ]
    },
    largeAppliances: {
        keywords: ['television', 'tv', 'fridge', 'refrigerator', 'washing machine', 'ac', 'air conditioner', 'dryer'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. LG, Samsung' },
            { name: 'modelName', label: 'Model Name', type: 'text', placeholder: 'e.g. Smart LED 4K' },
            { name: 'energyRating', label: 'Energy Efficiency Star Rating', type: 'select', options: ['1 Star', '2 Star', '3 Star', '4 Star', '5 Star'] },
            { name: 'screenSize', label: 'Size/Capacity', type: 'text', placeholder: 'e.g. 55 Inches, 240 Liters' }
        ]
    },
    kitchenAppliances: {
        keywords: ['microwave', 'mixer', 'grinder', 'kettle', 'toaster', 'air fryer', 'chimney', 'juicer'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Philips, Prestige' },
            { name: 'capacity', label: 'Capacity', type: 'text', placeholder: 'e.g. 1.2 Litres, 20L' },
            { name: 'powerConsumption', label: 'Power Consumption (Watts)', type: 'text', placeholder: 'e.g. 750W, 1200W' },
            { name: 'warranty', label: 'Warranty', type: 'text', placeholder: 'e.g. 2 Years Brand Warranty' }
        ]
    },
    pharmacyMedicines: {
        keywords: ['pharmacy', 'medicine', 'tablet', 'syrup', 'prescription', 'capsule', 'pill', 'ointment'],
        fields: [
            { name: 'brandName', label: 'Manufacturer/Brand', type: 'text', placeholder: 'e.g. Cipla, Sun Pharma' },
            { name: 'fssaiLicNo', label: 'FSSAI/Drug License No.', type: 'text', placeholder: 'e.g. DL-12345678' },
            { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
            { name: 'prescriptionRequired', label: 'Prescription Required?', type: 'select', options: ['No', 'Yes'] }
        ]
    },
    wellnessSupplements: {
        keywords: ['supplement', 'wellness', 'multivitamin', 'protein', 'ayurvedic', 'vitamin', 'whey'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. MuscleBlaze, Himalayan Organics' },
            { name: 'quantityInsidePack', label: 'Packaging/Count', type: 'text', placeholder: 'e.g. 60 Tablets, 1kg Powder' },
            { name: 'expiryDate', label: 'Expiry Date', type: 'date' },
            { name: 'vegNonVeg', label: 'Dietary Type', type: 'select', options: ['Veg', 'Non-Veg'] },
            { name: 'usageInstructions', label: 'Dosage/Usage Instructions', type: 'text', placeholder: 'e.g. Take 1 tablet daily after dinner' }
        ]
    },
    babyCare: {
        keywords: ['baby', 'diaper', 'baby wipe', 'baby lotion', 'baby food', 'baby wash', 'mamy poko'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Pampers, Himalaya Baby' },
            { name: 'ageGroup', label: 'Recommended Age', type: 'text', placeholder: 'e.g. 0-6 Months, 1-3 Years' },
            { name: 'material', label: 'Material/Key Ingredients', type: 'text', placeholder: 'e.g. Soft Organic Cotton, Aloe Vera' },
            { name: 'expiryDate', label: 'Expiry Date (if applicable)', type: 'date' }
        ]
    },
    toysGames: {
        keywords: ['toy', 'game', 'puzzle', 'doll', 'board game', 'soft toy', 'action figure'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Hasbro, Lego' },
            { name: 'ageGroup', label: 'Ideal Age Group', type: 'text', placeholder: 'e.g. 3+ Years, 8-12 Years' },
            { name: 'material', label: 'Material', type: 'text', placeholder: 'e.g. Non-toxic ABS Plastic, Wood' },
            { name: 'powerRequired', label: 'Requires Batteries?', type: 'select', options: ['No', 'Yes'] }
        ]
    },
    stationeryOffice: {
        keywords: ['stationery', 'notebook', 'pen', 'office supply', 'planner', 'diary', 'stapler'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Classmate, Parker' },
            { name: 'quantityInsidePack', label: 'Pack Count', type: 'text', placeholder: 'e.g. Pack of 10, Single Pc' },
            { name: 'paperWeight', label: 'Paper Density (GSM)', type: 'text', placeholder: 'e.g. 80 GSM, 120 GSM' },
            { name: 'material', label: 'Material', type: 'text', placeholder: 'e.g. Recycled Paper, Metal' }
        ]
    },
    booksNovels: {
        keywords: ['book', 'novel', 'study material', 'biography', 'textbook', 'fiction', 'comics'],
        fields: [
            { name: 'author', label: 'Author Name', type: 'text', placeholder: 'e.g. Chetan Bhagat, J.K. Rowling' },
            { name: 'publisher', label: 'Publisher', type: 'text', placeholder: 'e.g. Penguin Books' },
            { name: 'bindingType', label: 'Binding Type', type: 'select', options: ['Paperback', 'Hardcover', 'Spiral Bound'] },
            { name: 'language', label: 'Language', type: 'text', placeholder: 'e.g. English, Hindi' },
            { name: 'isbn', label: 'ISBN Number', type: 'text', placeholder: 'e.g. 978-3-16-148410-0' }
        ]
    },
    sportsFitness: {
        keywords: ['sports', 'gym', 'dumbbell', 'yoga mat', 'bat', 'football', 'racket', 'cricket', 'badminton'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Cosco, Decathlon' },
            { name: 'material', label: 'Material', type: 'text', placeholder: 'e.g. Carbon Fiber, Cast Iron' },
            { name: 'weight', label: 'Weight/Size', type: 'text', placeholder: 'e.g. 10kg, 250g' },
            { name: 'skillLevel', label: 'Skill Level', type: 'select', options: ['Beginner', 'Intermediate', 'Professional'] }
        ]
    },
    bicyclesGear: {
        keywords: ['bicycle', 'cycle', 'riding gear', 'helmet', 'bike accessories', 'kneepad'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Hero, Firefox' },
            { name: 'size', label: 'Frame/Wheel Size', type: 'text', placeholder: 'e.g. 26 Inches' },
            { name: 'gearType', label: 'Gears Configuration', type: 'select', options: ['Single Speed', 'Multi Speed (Geared)'] },
            { name: 'frameMaterial', label: 'Frame Material', type: 'text', placeholder: 'e.g. Aluminium Alloy, Carbon Steel' }
        ]
    },
    homeDecor: {
        keywords: ['decor', 'sheet', 'curtain', 'furnishing', 'cushion', 'carpet', 'vase', 'wall art'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Welspun, Bombay Dyeing' },
            { name: 'material', label: 'Fabric/Material', type: 'text', placeholder: 'e.g. Velvet, Cotton, Ceramic' },
            { name: 'size', label: 'Dimensions (LxWxH)', type: 'text', placeholder: 'e.g. 9ft x 4ft, 12x12 Inches' },
            { name: 'color', label: 'Color', type: 'text', placeholder: 'e.g. Floral Pastel Blue' }
        ]
    },
    furnitureStorage: {
        keywords: ['furniture', 'sofa', 'bed', 'wardrobe', 'chair', 'table', 'cabinet', 'bookshelf'],
        fields: [
            { name: 'material', label: 'Material Wood/Metal Type', type: 'text', placeholder: 'e.g. Solid Sheesham Wood, Engineered Wood' },
            { name: 'size', label: 'Dimensions (H x W x D)', type: 'text', placeholder: 'e.g. 72" x 36" x 18"' },
            { name: 'assemblyRequired', label: 'Assembly Required?', type: 'select', options: ['Yes', 'No'] },
            { name: 'warranty', label: 'Warranty Period', type: 'text', placeholder: 'e.g. 3 Years Manufacturer Warranty' }
        ]
    },
    kitchenwareDining: {
        keywords: ['kitchenware', 'dining', 'cookware', 'plate', 'bowl', 'cutlery', 'bottle', 'tiffin'],
        fields: [
            { name: 'material', label: 'Material', type: 'text', placeholder: 'e.g. Stainless Steel, Borosilicate Glass' },
            { name: 'capacity', label: 'Capacity Volume', type: 'text', placeholder: 'e.g. 1.5 Litres, 300ml' },
            { name: 'isMicrowaveSafe', label: 'Microwave Safe?', type: 'select', options: ['No', 'Yes'] },
            { name: 'isDishwasherSafe', label: 'Dishwasher Safe?', type: 'select', options: ['No', 'Yes'] }
        ]
    },
    hardwareTools: {
        keywords: ['hardware', 'drill', 'tool', 'screwdriver', 'hammer', 'pliers', 'drill machine'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Bosch, Stanley' },
            { name: 'toolType', label: 'Tool Category', type: 'text', placeholder: 'e.g. Power Tool, Hand Tool' },
            { name: 'powerSource', label: 'Power Source', type: 'text', placeholder: 'e.g. Battery Powered, Corded Electric, Manual' },
            { name: 'material', label: 'Tool Material', type: 'text', placeholder: 'e.g. High Carbon Chrome Vanadium' }
        ]
    },
    petSupplies: {
        keywords: ['pet', 'dog', 'cat', 'fish', 'bird', 'pet food', 'aquarium', 'leash'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Royal Canin, Pedigree' },
            { name: 'petType', label: 'Target Pet Species', type: 'select', options: ['Dog', 'Cat', 'Bird', 'Fish', 'Others'] },
            { name: 'lifeStage', label: 'Ideal Life Stage', type: 'text', placeholder: 'e.g. Puppy, Kitten, Adult, All Life Stages' },
            { name: 'expiryDate', label: 'Best Before Date', type: 'date' }
        ]
    },
    luggageBackpacks: {
        keywords: ['luggage', 'bag', 'backpack', 'purses', 'wallet', 'trolley', 'suitcase', 'handbag'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. American Tourister, Skybags' },
            { name: 'capacity', label: 'Capacity (Liters)', type: 'text', placeholder: 'e.g. 55 Litres, 15 Litres' },
            { name: 'isWaterproof', label: 'Water Resistant?', type: 'select', options: ['No', 'Yes'] },
            { name: 'warranty', label: 'Warranty Period', type: 'text', placeholder: 'e.g. 5 Years Brand Warranty' }
        ]
    },
    eyewearSunglasses: {
        keywords: ['eyewear', 'eye', 'sunglass', 'reading glass', 'spectacle', 'lenses'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Ray-Ban, Lenskart' },
            { name: 'frameType', label: 'Frame Design', type: 'select', options: ['Full-Rim', 'Half-Rim', 'Rimless'] },
            { name: 'lensType', label: 'Lens Material/Feature', type: 'text', placeholder: 'e.g. Polarized UV400, Anti-Glare Blue Cut' },
            { name: 'power', label: 'Lens Power (if applicable)', type: 'text', placeholder: 'e.g. -1.50 Sphere' }
        ]
    },
    watchesClocks: {
        keywords: ['watch', 'clock', 'strap', 'dial', 'analog watch'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Casio, Fastrack' },
            { name: 'dialColor', label: 'Dial Color', type: 'text', placeholder: 'e.g. Emerald Blue' },
            { name: 'strapMaterial', label: 'Strap Material', type: 'text', placeholder: 'e.g. Genuine Leather, Stainless Steel' },
            { name: 'movementType', label: 'Movement Engine', type: 'select', options: ['Quartz', 'Automatic', 'Digital'] }
        ]
    },
    jewelleryOrnaments: {
        keywords: ['jewellery', 'jewelry', 'ring', 'necklace', 'earring', 'pendant', 'gold', 'silver'],
        fields: [
            { name: 'material', label: 'Metal/Gem Material', type: 'text', placeholder: 'e.g. 22K Gold, Sterling Silver' },
            { name: 'purity', label: 'Purity Standard', type: 'text', placeholder: 'e.g. 916 Hallmarked, 92.5 Fine' },
            { name: 'certification', label: 'Certification Authority', type: 'text', placeholder: 'e.g. BIS Hallmarked, GIA Certified' },
            { name: 'weight', label: 'Weight (Grams)', type: 'text', placeholder: 'e.g. 4.5g, 10g' }
        ]
    },
    automotiveParts: {
        keywords: ['part', 'spark plug', 'brake pad', 'engine oil', 'air filter', 'tyre', 'wiper'],
        fields: [
            { name: 'partNumber', label: 'Manufacturer Part No.', type: 'text', placeholder: 'e.g. Spark-Plg-B7' },
            { name: 'vehicleModel', label: 'Compatible Vehicle Models', type: 'text', placeholder: 'e.g. Maruti Swift, Activa 6G' },
            { name: 'manufacturer', label: 'Manufacturer Name', type: 'text', placeholder: 'e.g. Bosch, Lumax' },
            { name: 'material', label: 'Component Material', type: 'text', placeholder: 'e.g. High-density Sintered Metal' }
        ]
    },
    carBikeCare: {
        keywords: ['car care', 'bike care', 'perfume', 'seat cover', 'shampoo', 'dashboard polish'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. 3M, Wavex' },
            { name: 'vehicleModel', label: 'Compatibility (if specific)', type: 'text', placeholder: 'e.g. Universal Fit, Creta 2024' },
            { name: 'warranty', label: 'Warranty (if any)', type: 'text', placeholder: 'e.g. 1 Year Warranty' },
            { name: 'material', label: 'Composition/Material', type: 'text', placeholder: 'e.g. Premium Leatherette, Microfiber' }
        ]
    },
    handicraftsCollectibles: {
        keywords: ['handicraft', 'sculpture', 'art', 'painting', 'canvas', 'pottery', 'clay'],
        fields: [
            { name: 'artistName', label: 'Artisan / Local Studio Name', type: 'text', placeholder: 'e.g. Jaipur Crafts Studio' },
            { name: 'material', label: 'Material', type: 'text', placeholder: 'e.g. Clay, Brass, Rosewood' },
            { name: 'dimensions', label: 'Dimensions (H x W x L)', type: 'text', placeholder: 'e.g. 12 x 8 x 6 Inches' },
            { name: 'careInstructions', label: 'Care Instructions', type: 'text', placeholder: 'e.g. Wipe with soft dry cloth only, do not wash' }
        ]
    },
    religiousPooja: {
        keywords: ['pooja', 'puja', 'religious', 'agarbatti', 'diya', 'idol', 'camphor', 'dhoop'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Cycle Brand, Mangaldeep' },
            { name: 'quantityInsidePack', label: 'Net Weight/Count', type: 'text', placeholder: 'e.g. 100g, Pack of 50 sticks' },
            { name: 'fragrance', label: 'Fragrance', type: 'text', placeholder: 'e.g. Mysore Sandalwood' },
            { name: 'material', label: 'Material', type: 'text', placeholder: 'e.g. Brass, Natural Herbs' }
        ]
    },
    gardeningPlants: {
        keywords: ['gardening', 'plant', 'seed', 'fertilizer', 'pot', 'indoor plant', 'watering can'],
        fields: [
            { name: 'plantType', label: 'Plant/Seed Variety', type: 'text', placeholder: 'e.g. Snake Plant, Tomato Seeds' },
            { name: 'wateringFrequency', label: 'Watering Frequency Required', type: 'text', placeholder: 'e.g. Twice a week when soil is dry' },
            { name: 'sunlightRequirement', label: 'Sunlight Needed', type: 'text', placeholder: 'e.g. Semi-Shade, Direct Bright Sunlight' }
        ]
    },
    electricalFittings: {
        keywords: ['fittings', 'led bulb', 'bulb', 'switch', 'extension board', 'smart light', 'wire'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Philips, Havells' },
            { name: 'powerConsumption', label: 'Power Consumption (Watts)', type: 'text', placeholder: 'e.g. 9 Watts, 12W' },
            { name: 'baseType', label: 'Fitting Cap Base', type: 'text', placeholder: 'e.g. B22 Standard Pin, E27 Screw' },
            { name: 'colorTemperature', label: 'Color Output', type: 'text', placeholder: 'e.g. Cool Day Light (6500K)' }
        ]
    },
    plumbingSanitary: {
        keywords: ['plumbing', 'tap', 'shower', 'sink', 'basin', 'pipe', 'fitting'],
        fields: [
            { name: 'material', label: 'Material CPVC/Metal', type: 'text', placeholder: 'e.g. Solid Brass with Chrome Finish' },
            { name: 'partType', label: 'Fitting Type', type: 'text', placeholder: 'e.g. Basin Tap, Pillar Cock' },
            { name: 'warranty', label: 'Warranty Period', type: 'text', placeholder: 'e.g. 7 Years Brand Warranty' }
        ]
    },
    elearningCourses: {
        keywords: ['course', 'tutorial', 'elearning', 'e-learning', 'bootcamp', 'classes'],
        fields: [
            { name: 'experience', label: 'Instructor Experience', type: 'text', placeholder: 'e.g. 10+ Years in Software Engineering' },
            { name: 'language', label: 'Language of Instruction', type: 'text', placeholder: 'e.g. English, Bilingual (Hindi/English)' },
            { name: 'duration', label: 'Total Course Duration', type: 'text', placeholder: 'e.g. 15 Hours of On-Demand HD Video' }
        ]
    },
    musicalInstruments: {
        keywords: ['musical', 'guitar', 'piano', 'violin', 'flute', 'ukulele', 'harmonium'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Yamaha, Fender, Kadence' },
            { name: 'instrumentType', label: 'Instrument Type', type: 'text', placeholder: 'e.g. Acoustic Guitar, Bamboo Flute' },
            { name: 'material', label: 'Build Material Wood', type: 'text', placeholder: 'e.g. Spruce Wood Face, Rosewood Back' },
            { name: 'skillLevel', label: 'Suitable Skill Level', type: 'text', placeholder: 'e.g. Beginner to Intermediate' }
        ]
    },
    realEstate: {
        keywords: ['real estate', 'apartment', 'flat', 'bhk', 'villa', 'property', 'plot', 'shop rental'],
        fields: [
            { name: 'bhk', label: 'Configuration/Type', type: 'select', options: ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Plot/Land', 'Commercial Space'] },
            { name: 'furnishingStatus', label: 'Furnishing Status', type: 'select', options: ['Unfurnished', 'Semi-Furnished', 'Fully Furnished'] },
            { name: 'areaSize', label: 'Super Built-up Area (Sq.Ft.)', type: 'text', placeholder: 'e.g. 1250 Sq.Ft.' },
            { name: 'contactNumber', label: 'Owner/Broker Contact Info', type: 'text', placeholder: 'e.g. +91 9876543210' }
        ]
    },
    vehicleRentals: {
        keywords: ['vehicle rental', 'rent car', 'rent bike', 'rental scooty'],
        fields: [
            { name: 'rentAmount', label: 'Rent Price (Daily/Monthly)', type: 'number', placeholder: 'e.g. 1500 (per Day)' },
            { name: 'securityDeposit', label: 'Refundable Security Deposit', type: 'number', placeholder: 'e.g. 5000' },
            { name: 'vehicleModel', label: 'Vehicle Model & Year', type: 'text', placeholder: 'e.g. Honda Activa 6G (2023 Model)' },
            { name: 'brandName', label: 'Manufacturer Brand', type: 'text', placeholder: 'e.g. Honda, Suzuki' }
        ]
    },
    professionalServices: {
        keywords: ['service', 'electrician', 'plumber', 'pest control', 'cleaner', 'beautician', 'laundry'],
        fields: [
            { name: 'serviceName', label: 'Service Offered Name', type: 'text', placeholder: 'e.g. Deep Sofa Cleaning Service' },
            { name: 'experience', label: 'Provider Experience', type: 'text', placeholder: 'e.g. 5+ Years Experience' },
            { name: 'availability', label: 'Operating Timings', type: 'text', placeholder: 'e.g. 9 AM to 8 PM (Everyday)' },
            { name: 'contactNumber', label: 'Provider Contact Number', type: 'text', placeholder: 'e.g. 9876543210' }
        ]
    },
    eventsCatering: {
        keywords: ['event', 'catering', 'decorations', 'sound system', 'dj', 'wedding decor', 'party organizer'],
        fields: [
            { name: 'experience', label: 'Years in Business', type: 'text', placeholder: 'e.g. 15 Years in Wedding Catering' },
            { name: 'packageCost', label: 'Base/Starting Package Cost', type: 'number', placeholder: 'e.g. 15000' },
            { name: 'serviceArea', label: 'Serviceable Locations/Cities', type: 'text', placeholder: 'e.g. Indore and nearby areas' },
            { name: 'contactNumber', label: 'Caterer/Organizer Contact No.', type: 'text', placeholder: 'e.g. 9111966732' }
        ]
    },
    giftsParty: {
        keywords: ['gift', 'party supply', 'balloon', 'card', 'greeting', 'gift wrap', 'confetti'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Archies, Party Hunterz' },
            { name: 'material', label: 'Material Composition', type: 'text', placeholder: 'e.g. Metallic Foil, Latex, Glossy Paper' },
            { name: 'customizable', label: 'Supports Custom Message/Text?', type: 'select', options: ['No', 'Yes'] },
            { name: 'quantityInsidePack', label: 'Pack Contents/Quantity', type: 'text', placeholder: 'e.g. Pack of 25 balloons' }
        ]
    },
    utilitiesCleaners: {
        keywords: ['cleaning', 'detergent', 'floor cleaner', 'garbage bag', 'mop', 'liquid detergent', 'vessel washing'],
        fields: [
            { name: 'brandName', label: 'Brand', type: 'text', placeholder: 'e.g. Surf Excel, Lizol, Pril' },
            { name: 'quantityInsidePack', label: 'Size/Volume', type: 'text', placeholder: 'e.g. 1 Litre, 2kg pack' },
            { name: 'expiryDate', label: 'Best Before Date', type: 'date' },
            { name: 'formType', label: 'Product Formulation', type: 'select', options: ['Liquid', 'Powder', 'Bar/Solid Soap', 'Spray'] }
        ]
    }
};
