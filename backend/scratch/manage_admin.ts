import mongoose from 'mongoose';
import Admin from './src/models/Admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function manageAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI!);
        console.log('Connected to MongoDB');

        const adminMobile = process.env.DEFAULT_ADMIN_MOBILE || '9876543210';
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@speeup.com';
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';

        let admin = await Admin.findOne({ 
            $or: [{ mobile: adminMobile }, { email: adminEmail }] 
        }).select('+password');

        if (admin) {
            console.log('Admin already exists:');
            console.log('Mobile:', admin.mobile);
            console.log('Email:', admin.email);
            console.log('Role:', admin.role);
            console.log('Password (from .env):', adminPassword);
        } else {
            console.log('Creating new Admin...');
            admin = new Admin({
                firstName: 'Super',
                lastName: 'Admin',
                mobile: adminMobile,
                email: adminEmail,
                password: adminPassword,
                role: 'Super Admin',
                permissions: ['commerce', 'orders', 'users', 'sellers', 'hotel', 'bus', 'delivery']
            });
            await admin.save();
            console.log('Admin created successfully:');
            console.log('Mobile:', adminMobile);
            console.log('Email:', adminEmail);
            console.log('Password:', adminPassword);
        }

        await mongoose.connection.close();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

manageAdmin();
