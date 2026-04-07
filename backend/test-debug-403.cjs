const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function runTest() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect('mongodb://127.0.0.1:27017/resumatch');
    
    const db = mongoose.connection.db;
    const email = 'aaishadk@gmail.com';
    
    console.log(`Looking for user ${email}...`);
    const user = await db.collection('users').findOne({ email });
    
    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }
    
    console.log('Found user:', user._id, 'Role:', user.role);
    
    // Manual token generation to match userAuthController.js
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    
    console.log('Token generated! Starting with:', token.substring(0, 20));
    
    console.log('Calling /api/user/dashboard GET endpoint...');
    try {
      const dashRes = await axios.get('http://127.0.0.1:5000/api/user/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Dashboard fetch SUCCESS! Status:', dashRes.status);
      console.log('Data:', JSON.stringify(dashRes.data, null, 2));
    } catch (err) {
      if (err.response) {
        console.error('API Error:', err.response.status, err.response.data);
      } else {
        console.error('Request Error:', err.message);
      }
    }
    
  } catch (err) {
    console.error('Script Error:', err);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

runTest();
