
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    
    const Delivery = mongoose.model('Delivery', new mongoose.Schema({}, { strict: false }));
    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    const OrderItem = mongoose.model('OrderItem', new mongoose.Schema({}, { strict: false }));
    const Seller = mongoose.model('Seller', new mongoose.Schema({}, { strict: false }));

    const partner = await Delivery.findOne({ mobile: '8770620342' }) as any;
    const order = await Order.findOne({ orderNumber: 'ORD1775743438925795' }) as any;

    if (partner && order) {
        const [pLng, pLat] = partner.location.coordinates;
        console.log(`Partner: Lat=${pLat}, Lng=${pLng}`);

        const item = await OrderItem.findOne({ order: order._id }) as any;
        if (item) {
            const seller = await Seller.findById(item.seller) as any;
            
            if (seller) {
                const sLat = parseFloat(seller.latitude || "0");
                const sLng = parseFloat(seller.longitude || "0");
                const radius = seller.serviceRadiusKm || 40;
                console.log(`Seller: ${seller.storeName}, Lat=${sLat}, Lng=${sLng}, Radius=${radius}`);

                const dist = calculateDistance(pLat, pLng, sLat, sLng);
                console.log(`Distance: ${dist.toFixed(2)} km`);
                console.log(`Is Within Radius: ${dist <= radius}`);
            }
        }
    } else {
        console.log('Partner or Order not found');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

debug();
