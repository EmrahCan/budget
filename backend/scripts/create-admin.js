const User = require('../models/User');
require('dotenv').config();

async function createAdmin() {
  try {
    console.log('Creating admin user...');
    
    const adminData = {
      email: 'admin@budgetapp.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User'
    };

    // Check if admin already exists
    const existingAdmin = await User.findByEmail(adminData.email);
    if (existingAdmin) {
      console.log('Admin user already exists!');
      return;
    }

    // Create admin user
    const admin = await User.create(adminData);
    await admin.updateRole('admin');

    console.log('✅ Admin user created successfully!');
    console.log('Email:', adminData.email);
    console.log('Password:', adminData.password);
    console.log('Role:', admin.role);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  }
}

createAdmin();