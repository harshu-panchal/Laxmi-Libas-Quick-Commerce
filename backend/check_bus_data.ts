import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import Bus from './src/models/Bus';
import BusRoute from './src/models/BusRoute';
import BusSchedule from './src/models/BusSchedule';

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkData() {
    await mongoose.connect(process.env.MONGODB_URI!);
    
    const buses = await Bus.find();
    const routes = await BusRoute.find();
    const schedules = await BusSchedule.find();
    
    console.log('Total Buses:', buses.length);
    console.log('Total Routes:', routes.length);
    console.log('Total Schedules:', schedules.length);
    
    if (buses.length > 0) {
        console.log('Sample Bus:', buses[0].busName, 'by', buses[0].operatorName);
    }
    if (routes.length > 0) {
        console.log('Sample Route:', routes[0].from, 'to', routes[0].to);
    }
    if (schedules.length > 0) {
        console.log('Sample Schedule Date:', schedules[0].departureDate);
    }
    
    await mongoose.disconnect();
}

checkData();
