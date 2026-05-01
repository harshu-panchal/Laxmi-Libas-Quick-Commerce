const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const AdminSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    mobile: { type: String, unique: true },
    email: { type: String, unique: true },
    role: { type: String, enum: ['Super Admin', 'Admin'], default: 'Admin' },
    password: { type: String, select: false },
    permissions: [String]
}, { timestamps: true });

AdminSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

const Admin = mongoose.model('Admin', AdminSchema);

async function manageAdmin() {
    try {
        console.log('Connecting to:', process.env.MONGODB_URI);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminMobile = process.env.DEFAULT_ADMIN_MOBILE || '9876543210';
        const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@speeup.com';
        const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@123';

        let admin = await Admin.findOne({ 
            $or: [{ mobile: adminMobile }, { email: adminEmail }] 
        });

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
