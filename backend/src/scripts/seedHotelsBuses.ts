import dotenv from "dotenv";
import mongoose from "mongoose";
import connectDB from "../config/db";
import Category from "../models/Category";
import Seller from "../models/Seller";
import Hotel from "../models/Hotel";
import HotelRoom from "../models/HotelRoom";
import Bus from "../models/Bus";
import BusRoute from "../models/BusRoute";
import BusSchedule from "../models/BusSchedule";
import bcrypt from "bcrypt";

dotenv.config();

async function seedHotelsAndBuses() {
  try {
    console.log("Connecting to Database...");
    await connectDB();
    console.log("Connected to Database.");

    // --- STEP 1: RESOLVE DEFAULT CATEGORY ---
    let defaultCategory = await Category.findOne();
    if (!defaultCategory) {
      defaultCategory = await Category.create({
        name: "General Services",
        description: "General category for services and hotel/bus partners",
        status: "Active",
      });
      console.log(`✓ Created default Category: ${defaultCategory.name}`);
    }

    const hashedPassword = await bcrypt.hash("password123", 10);

    // ==========================================
    // --- STEP 2: SEED HOTEL PARTNER (SELLER) ---
    // ==========================================
    console.log("\n🏨 Seeding Hotel Partner...");
    const hotelMobile = "9876543210";
    let hotelSeller = await Seller.findOne({ mobile: hotelMobile });

    if (hotelSeller) {
      console.log(`Hotel Seller with mobile ${hotelMobile} already exists.`);
    } else {
      hotelSeller = await Seller.create({
        sellerName: "Grand Palace Hotels Group",
        storeName: "Grand Palace & Resorts",
        mobile: hotelMobile,
        email: "hotelpartner@grandpalace.com",
        password: hashedPassword,
        category: defaultCategory._id,
        address: "7, Luxury Boulevard, Chanakyapuri, New Delhi",
        status: "Approved",
        commission: 10,
        balance: 5000,
        businessType: "hotel",
        businessTypes: ["hotel"],
        isShopOpen: true,
        city: "Delhi",
        latitude: "28.5961",
        longitude: "77.1953",
      });
      console.log(`✓ Hotel Seller created successfully (Mobile: ${hotelMobile})`);
    }

    // Clear existing Hotels and Rooms for this partner to ensure clean seed
    console.log("Cleaning old hotels and rooms for this seller...");
    const existingSellerHotels = await Hotel.find({ sellerId: hotelSeller._id });
    const hotelIds = existingSellerHotels.map(h => h._id);
    await HotelRoom.deleteMany({ hotelId: { $in: hotelIds } });
    await Hotel.deleteMany({ sellerId: hotelSeller._id });

    // Seed 3 stunning hotels in different target cities (Delhi, Manali, Goa)
    const hotelData = [
      {
        name: "The Grand Palace Resort & Spa",
        description: "Experience world-class luxury and comfort at our majestic resort. Nestled in a prime location with breathtaking mountain views, featuring spacious rooms, premium dining, an infinity swimming pool, and a state-of-the-art wellness spa.",
        propertyType: "Resort",
        spaceType: "Private Room",
        address: "123, Luxury Way, Near Mall Road",
        city: "Manali",
        state: "Himachal Pradesh",
        pincode: "175131",
        structuredLocation: {
          city: "Manali",
          state: "Himachal Pradesh",
          country: "India",
          pincode: "175131",
          coordinates: { lat: 32.2396, lng: 77.1887 }
        },
        amenities: ["Free Wi-Fi", "Swimming Pool", "Spa & Wellness", "Bar & Lounge", "Fitness Center", "Room Service", "Free Parking", "Restaurant"],
        mainImage: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
        images: [
          { url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", category: "Exterior", caption: "Resort Grand Entrance" },
          { url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=800&q=80", category: "Interior", caption: "Premium Living Room" },
          { url: "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80", category: "Pool", caption: "Infinity Pool View" }
        ],
        policies: {
          checkInTime: "12:00 PM",
          checkOutTime: "11:00 AM",
          coupleFriendly: true,
          petsAllowed: false,
          smokingAllowed: false,
          localIdsAllowed: true,
          alcoholAllowed: true,
          forEvents: false,
          outsideFoodAllowed: false
        },
        details: { totalFloors: 4, totalRooms: 40 },
        kyc: { docType: "Aadhaar Card", idNumber: "123456789012", docFront: "url_front", docBack: "url_back", verified: true },
        status: "Approved",
        stars: 5,
        rating: 4.8,
        reviewsCount: 32
      },
      {
        name: "Taj Mahal View Plaza",
        description: "Elegant premium boutique hotel located just minutes away from the historical monument Taj Mahal. Wake up to majestic heritage views and experience warm Indian hospitality combined with modern premium amenities.",
        propertyType: "Hotel",
        spaceType: "Private Room",
        address: "24/1A, Taj East Gate Road, Tajganj",
        city: "Agra",
        state: "Uttar Pradesh",
        pincode: "282001",
        structuredLocation: {
          city: "Agra",
          state: "Uttar Pradesh",
          country: "India",
          pincode: "282001",
          coordinates: { lat: 27.1706, lng: 78.0423 }
        },
        amenities: ["Free Wi-Fi", "Air Conditioning", "Rooftop Restaurant", "Taj View Lounge", "Valet Parking", "24h Front Desk", "Laundry Service"],
        mainImage: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80",
        images: [
          { url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80", category: "Exterior", caption: "Hotel Front View" },
          { url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80", category: "Interior", caption: "Royal Suite Bed" }
        ],
        policies: {
          checkInTime: "02:00 PM",
          checkOutTime: "12:00 PM",
          coupleFriendly: true,
          petsAllowed: false,
          smokingAllowed: true,
          localIdsAllowed: true,
          alcoholAllowed: true,
          forEvents: true,
          outsideFoodAllowed: true
        },
        details: { totalFloors: 3, totalRooms: 30 },
        kyc: { docType: "GST Registration", idNumber: "09AAACG1234F1Z5", docFront: "url_front", docBack: "url_back", verified: true },
        status: "Approved",
        stars: 4,
        rating: 4.5,
        reviewsCount: 18
      },
      {
        name: "Goa Beachside Paradise Resort",
        description: "Unwind on the sandy shores of North Goa. Enjoy beautiful sea breezes, cozy private cottages, water sports coordination, and delicious beachside seafood in a vibrant, lively atmosphere.",
        propertyType: "Resort",
        spaceType: "Entire Place",
        address: "Calangute Beach Road, Umtav Vado",
        city: "Goa",
        state: "Goa",
        pincode: "403516",
        structuredLocation: {
          city: "Goa",
          state: "Goa",
          country: "India",
          pincode: "403516",
          coordinates: { lat: 15.5494, lng: 73.7535 }
        },
        amenities: ["Free Wi-Fi", "Swimming Pool", "Beach Access", "Barbecue Setup", "Bicycle Rental", "Air Conditioning", "Bar & Grill"],
        mainImage: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80",
        images: [
          { url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80", category: "Exterior", caption: "Oceanfront View Cottages" },
          { url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80", category: "Pool", caption: "Tropical Pool Area" }
        ],
        policies: {
          checkInTime: "01:00 PM",
          checkOutTime: "11:00 AM",
          coupleFriendly: true,
          petsAllowed: true,
          smokingAllowed: true,
          localIdsAllowed: true,
          alcoholAllowed: true,
          forEvents: true,
          outsideFoodAllowed: false
        },
        details: { totalFloors: 2, totalRooms: 20 },
        kyc: { docType: "Aadhaar Card", idNumber: "987654321098", docFront: "url_front", docBack: "url_back", verified: true },
        status: "Approved",
        stars: 4,
        rating: 4.6,
        reviewsCount: 45
      }
    ];

    for (const hData of hotelData) {
      const hotel = await Hotel.create({
        ...hData,
        sellerId: hotelSeller._id
      });
      console.log(`✓ Seeded Hotel: "${hotel.name}" in ${hotel.city}`);

      // Seed Room types for this hotel
      const roomTypes = [
        {
          roomType: "Deluxe King Room",
          description: "Comfortable and elegant room featuring a premium king-sized bed, en-suite modern bathroom, LED TV, high-speed Wi-Fi, and a scenic balcony view.",
          pricePerNight: hotel.stars === 5 ? 4500 : 2500,
          capacity: 2,
          amenities: ["King Bed", "Balcony View", "Air Conditioning", "LED TV", "High-Speed Wi-Fi", "Mini-Bar", "Coffee Maker"],
          images: [{ url: "https://images.unsplash.com/photo-1611891405110-397904a94800?auto=format&fit=crop&w=800&q=80", caption: "Deluxe Room Interior" }],
          totalRooms: 12,
          availableRooms: 12,
          status: "Available"
        },
        {
          roomType: "Premium Luxury Suite",
          description: "Stunning double-size premium suite with a private hot-tub / jacuzzi, spacious living lounge, breathtaking scenic view, separate dining area, and personalized luxury services.",
          pricePerNight: hotel.stars === 5 ? 9500 : 5500,
          capacity: 4,
          amenities: ["King Bed", "Private Jacuzzi", "Living Lounge", "Air Conditioning", "Dining Area", "Personal Butler", "Work Desk", "Espresso Machine"],
          images: [{ url: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80", caption: "Premium Suite Lounge" }],
          totalRooms: 4,
          availableRooms: 4,
          status: "Available"
        },
        {
          roomType: "Standard Queen Room",
          description: "Cozy and standard air-conditioned room with a queen bed, clean bath amenities, writing table, and daily housekeeping service. Excellent value for money.",
          pricePerNight: hotel.stars === 5 ? 3000 : 1800,
          capacity: 2,
          amenities: ["Queen Bed", "Air Conditioning", "Clean Bath Essentials", "Wi-Fi", "Intercom", "Writing Desk"],
          images: [{ url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80", caption: "Standard Room Setup" }],
          totalRooms: 15,
          availableRooms: 15,
          status: "Available"
        }
      ];

      for (const rType of roomTypes) {
        await HotelRoom.create({
          ...rType,
          hotelId: hotel._id
        });
      }
      console.log(`  └─ ✓ Seeded 3 Room Types under "${hotel.name}"`);

      // Update basePrice to the cheapest room's price
      const cheapestRoom = await HotelRoom.findOne({ hotelId: hotel._id }).sort({ pricePerNight: 1 });
      if (cheapestRoom) {
        hotel.basePrice = cheapestRoom.pricePerNight;
        await hotel.save();
      }
    }


    // ==========================================
    // --- STEP 3: SEED BUS PARTNER (SELLER) ---
    // ==========================================
    console.log("\n🚌 Seeding Bus Agency Partner...");
    const busMobile = "9876543211";
    let busSeller = await Seller.findOne({ mobile: busMobile });

    if (busSeller) {
      console.log(`Bus Seller with mobile ${busMobile} already exists.`);
    } else {
      busSeller = await Seller.create({
        sellerName: "Laxmi Travels & Logistics",
        storeName: "Laxmi Travels Agency",
        mobile: busMobile,
        email: "buspartner@laxmitravels.com",
        password: hashedPassword,
        category: defaultCategory._id,
        address: "24, ISBT Kashmere Gate Outer Bus Terminal, New Delhi",
        status: "Approved",
        commission: 10,
        balance: 4000,
        businessType: "bus",
        businessTypes: ["bus"],
        isShopOpen: true,
        city: "Delhi",
        latitude: "28.6675",
        longitude: "77.2285",
      });
      console.log(`✓ Bus Seller created successfully (Mobile: ${busMobile})`);
    }

    // Clean existing buses, routes and schedules for this seller
    console.log("Cleaning old buses, routes and schedules for this seller...");
    const existingBuses = await Bus.find({ sellerId: busSeller._id });
    const existingBusIds = existingBuses.map(b => b._id);
    await BusSchedule.deleteMany({ busId: { $in: existingBusIds } });
    await BusRoute.deleteMany({ sellerId: busSeller._id });
    await Bus.deleteMany({ sellerId: busSeller._id });

    // Seed 3 robust Bus listings
    const busData = [
      {
        busName: "Laxmi Air-Express Multi-Axle",
        busNumber: "DL-01-A-7777",
        busType: "AC Sleeper",
        operatorName: "Laxmi Travels",
        amenities: ["AC", "Premium Blanket", "Water Bottle", "Charging Point", "Reading Light", "CCTV Security", "Pillow", "WiFi"],
        images: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"],
        totalSeats: 30,
        status: "active"
      },
      {
        busName: "Laxmi Luxury Volvo Coach",
        busNumber: "HR-55-B-8888",
        busType: "AC Seater",
        operatorName: "Laxmi Travels",
        amenities: ["AC", "Blanket", "Water Bottle", "Charging Point", "Pushback Seats", "CCTV", "Snacks"],
        images: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"],
        totalSeats: 40,
        status: "active"
      },
      {
        busName: "Laxmi Standard Express",
        busNumber: "UP-16-C-9999",
        busType: "Non-AC Sleeper",
        operatorName: "Laxmi Travels",
        amenities: ["Blanket", "Water Bottle", "Charging Point", "Reading Light", "Emergency Exit"],
        images: ["https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80"],
        totalSeats: 30,
        status: "active"
      }
    ];

    const seededBuses = [];
    for (const bData of busData) {
      const bus = await Bus.create({
        ...bData,
        sellerId: busSeller._id
      });
      seededBuses.push(bus);
      console.log(`✓ Seeded Bus: "${bus.busName}" (Number: ${bus.busNumber})`);
    }

    // Seed 3 central Routes
    const routeData = [
      {
        from: "Delhi",
        to: "Manali",
        fromLocation: {
          city: "Delhi",
          state: "Delhi",
          country: "India",
          pincode: "110006",
          coordinates: { lat: 28.6675, lng: 77.2285 }
        },
        toLocation: {
          city: "Manali",
          state: "Himachal Pradesh",
          country: "India",
          pincode: "175131",
          coordinates: { lat: 32.2396, lng: 77.1887 }
        },
        distance: "530 km",
        duration: "12h 30m",
        pickupPoints: [
          { name: "Kashmere Gate ISBT Metro Gate No.1", time: "06:30 PM", location: "Kashmere Gate Terminal" },
          { name: "Majnu Ka Tilla HP Petrol Pump", time: "07:00 PM", location: "Majnu Ka Tilla Bypass" }
        ],
        dropoffPoints: [
          { name: "Private Bus Stand Manali", time: "07:00 AM", location: "Private Bus Stand Bypass" },
          { name: "Mall Road Clock Tower Bus Stop", time: "07:30 AM", location: "Mall Road" }
        ],
        isActive: true
      },
      {
        from: "Delhi",
        to: "Jaipur",
        fromLocation: {
          city: "Delhi",
          state: "Delhi",
          country: "India",
          pincode: "110005",
          coordinates: { lat: 28.6448, lng: 77.1906 }
        },
        toLocation: {
          city: "Jaipur",
          state: "Rajasthan",
          country: "India",
          pincode: "302001",
          coordinates: { lat: 26.9124, lng: 75.7873 }
        },
        distance: "270 km",
        duration: "5h 30m",
        pickupPoints: [
          { name: "Karol Bagh Metro Pillar No.110", time: "08:00 AM", location: "Karol Bagh" },
          { name: "Dhaula Kuan Metro Bus Stop", time: "08:45 AM", location: "Dhaula Kuan Crossing" }
        ],
        dropoffPoints: [
          { name: "Transport Nagar Flyover End", time: "01:15 PM", location: "Transport Nagar Road" },
          { name: "Sindhi Camp Central Bus Stand", time: "01:30 PM", location: "Sindhi Camp" }
        ],
        isActive: true
      },
      {
        from: "Delhi",
        to: "Agra",
        fromLocation: {
          city: "Delhi",
          state: "Delhi",
          country: "India",
          pincode: "110092",
          coordinates: { lat: 28.6437, lng: 77.3023 }
        },
        toLocation: {
          city: "Agra",
          state: "Uttar Pradesh",
          country: "India",
          pincode: "282001",
          coordinates: { lat: 27.1767, lng: 78.0081 }
        },
        distance: "230 km",
        duration: "4h 00m",
        pickupPoints: [
          { name: "Anand Vihar ISBT Metro Gate No.3", time: "07:00 AM", location: "Anand Vihar" },
          { name: "Sarai Kale Khan Ring Road Terminal", time: "07:30 AM", location: "Sarai Kale Khan" }
        ],
        dropoffPoints: [
          { name: "Agra ISBT Transport Nagar Crossing", time: "11:00 AM", location: "ISBT Agra" },
          { name: "Taj Mahal East Gate Parking", time: "11:30 AM", location: "Tajganj Plaza" }
        ],
        isActive: true
      }
    ];

    const seededRoutes = [];
    for (const rData of routeData) {
      const route = await BusRoute.create({
        ...rData,
        sellerId: busSeller._id
      });
      seededRoutes.push(route);
      console.log(`✓ Seeded Route: "${route.from}" to "${route.to}"`);
    }

    // --- STEP 4: SEED ACTIVE BUS SCHEDULES (FOR TODAY & FUTURE 7 DAYS) ---
    // This is super important so date search on customer client works!
    console.log("\n📅 Generating Schedules with full Seat-Maps for the next 7 Days...");
    
    // Generate dates starting from today
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push(d);
    }

    // Map routes to appropriate buses & timings
    const scheduleSettings = [
      {
        routeIndex: 0, // Delhi to Manali
        busIndex: 0,   // Laxmi Air-Express AC Sleeper
        departureTime: "07:00 PM",
        arrivalTime: "07:30 AM",
        basePrice: 1200,
        seatPrefix: "SL",
        seatType: "sleeper" as const
      },
      {
        routeIndex: 1, // Delhi to Jaipur
        busIndex: 1,   // Laxmi Luxury Volvo Coach AC Seater
        departureTime: "08:00 AM",
        arrivalTime: "01:30 PM",
        basePrice: 650,
        seatPrefix: "ST",
        seatType: "seater" as const
      },
      {
        routeIndex: 2, // Delhi to Agra
        busIndex: 2,   // Laxmi Standard Express Non-AC Sleeper
        departureTime: "07:00 AM",
        arrivalTime: "11:30 AM",
        basePrice: 450,
        seatPrefix: "NS",
        seatType: "sleeper" as const
      }
    ];

    for (const d of dates) {
      const formattedDateStr = d.toISOString().split('T')[0];
      console.log(`  🕒 Seeding schedules for Date: ${formattedDateStr}...`);

      for (const setting of scheduleSettings) {
        const route = seededRoutes[setting.routeIndex];
        const bus = seededBuses[setting.busIndex];

        // Generate Seat layout
        const seats = [];
        for (let sIdx = 1; sIdx <= bus.totalSeats; sIdx++) {
          seats.push({
            seatNumber: `${setting.seatPrefix}${sIdx}`,
            seatType: setting.seatType,
            isBooked: false,
            price: setting.basePrice
          });
        }

        // Calculate arrival date (overnight vs same day)
        const depDate = new Date(d);
        depDate.setHours(12, 0, 0, 0); // Normalized hours
        
        const arrDate = new Date(d);
        if (setting.routeIndex === 0) {
          // Overnight to Manali
          arrDate.setDate(arrDate.getDate() + 1);
        }
        arrDate.setHours(12, 0, 0, 0);

        await BusSchedule.create({
          busId: bus._id,
          routeId: route._id,
          departureTime: setting.departureTime,
          arrivalTime: setting.arrivalTime,
          departureDate: depDate,
          arrivalDate: arrDate,
          basePrice: setting.basePrice,
          seats,
          isActive: true
        });
      }
    }

    console.log("\n🎉 Seeding Completed Successfully!");
    console.log(`=========================================`);
    console.log(`🏨 Hotel Partner Mobile: ${hotelMobile}`);
    console.log(`🏨 Seeded 3 Hotels & 9 Room Types`);
    console.log(`🚌 Bus Partner Mobile  : ${busMobile}`);
    console.log(`🚌 Seeded 3 Buses, 3 Routes & 21 Active Daily Schedules`);
    console.log(`=========================================\n`);
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding Hotels and Buses:", error);
    process.exit(1);
  }
}

seedHotelsAndBuses();
