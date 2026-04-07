const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const axios = require('axios');
require('dotenv').config();

async function runTest() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect('mongodb://127.0.0.1:27017/resumatch');
    
    const db = mongoose.connection.db;
    const email = 'shresthajaya@gmail.com';
    
    console.log(`Looking for user ${email}...`);
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }
    
    console.log('Found user:', user._id, user.role);
    
    const newPassword = 'password123';
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.collection('users').updateOne(
      { _id: user._id },
      { $set: { password: hashedPassword } }
    );
    console.log('Password reset successfully to "password123".');
    
    console.log('Calling /api/auth/user/login POST endpoint...');
    const loginRes = await axios.post('http://127.0.0.1:5000/api/auth/user/login', {
      email,
      password: newPassword
    });
    
    const token = loginRes.data.token;
    console.log('Token received! Starting with:', token.substring(0, 20));
    
    console.log('Calling /api/user/dashboard GET endpoint...');
    const dashRes = await axios.get('http://127.0.0.1:5000/api/user/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Dashboard fetch SUCCESS! Keys:', Object.keys(dashRes.data));
    console.log('Roles check completed successfully.');
    
  } catch (err) {
    if (err.response) {
      console.error('API Error:', err.response.status, err.response.data);
    } else {
      console.error('Script Error:', err);
    }
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

runTest();
