
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Delivery from './models/Delivery';
import Order from './models/Order';
import OrderItem from './models/OrderItem';
import AppSettings from './models/AppSettings';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function debug() {
  try {
    console.log('Connecting to DB...');
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('Connected to DB');

    // 1. Find the delivery partner
    const mobile = '8770620342';
    const partner = await Delivery.findOne({ mobile });
    if (!partner) {
      console.log(`Partner not found for mobile: ${mobile}`);
    } else {
      console.log('--- Delivery Partner Info ---');
      console.log(`ID: ${partner._id}`);
      console.log(`Name: ${partner.name}`);
      console.log(`Status: ${partner.status}`);
      console.log(`isOnline: ${partner.isOnline}`);
      console.log(`Coordinates: ${JSON.stringify(partner.location?.coordinates)}`);
      
      // Check if partner is busy
      const activeOrder = await Order.findOne({
        deliveryBoy: partner._id,
        deliveryBoyStatus: { $in: ['Assigned', 'Picked Up', 'In Transit'] },
        status: { $nin: ['Delivered', 'Cancelled', 'Rejected', 'Returned'] }
      });
      console.log(`Active Order: ${activeOrder ? activeOrder.orderNumber : 'None'}`);
    }

    // 2. Find the "Lipstick" order
    // We search for orderItems with "Lipstick" in name
    const orderItems = await OrderItem.find({ productName: /Lipstick/i })
      .sort({ createdAt: -1 })
      .limit(3);

    if (orderItems.length === 0) {
      console.log('No Lipstick orders found');
    } else {
      console.log('\n--- Recent Lipstick Order Items ---');
      for (const item of orderItems) {
        const order = await Order.findById(item.order);
        if (!order) continue;
        console.log(`Item: ${item.productName}`);
        console.log(`Order: ${order.orderNumber}`);
        console.log(`Status: ${order.status}`);
        console.log(`CreatedAt: ${item.createdAt}`);
        console.log(`Delivery Address Loc: ${order.deliveryAddress.latitude}, ${order.deliveryAddress.longitude}`);
        
        // Check seller location
        const SellerModel = mongoose.model('Seller');
        const seller = await SellerModel.findById(item.seller);
        if (seller) {
            console.log(`Seller: ${seller.storeName}`);
            console.log(`Seller Loc: ${seller.latitude}, ${seller.longitude}`);
            console.log(`Seller Radius: ${seller.serviceRadiusKm}`);
            
            // If partner exists, calculate distance roughly
            if (partner && partner.location && seller.latitude && seller.longitude) {
                const [pLng, pLat] = partner.location.coordinates;
                const sLat = parseFloat(seller.latitude);
                const sLng = parseFloat(seller.longitude);
                console.log(`Partner Loc: ${pLat}, ${pLng}`);
                
                // Diff
                const dLat = Math.abs(pLat - sLat);
                const dLng = Math.abs(pLng - sLng);
                console.log(`Rough Diff: Lat=${dLat.toFixed(4)}, Lng=${dLng.toFixed(4)}`);
            }
        }
        console.log('---');
      }
    }

    // 3. Check App Settings for delivery
    // @ts-ignore
    const settings = await AppSettings.findOne();
    console.log('\n--- App Settings ---');
    console.log(`Delivery Config: ${JSON.stringify(settings?.deliveryConfig)}`);

    process.exit(0);
  } catch (err) {
    console.error('Debug script error:', err);
    process.exit(1);
  }
}

debug();
