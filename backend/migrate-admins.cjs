const mongoose = require("mongoose");

const User = require("./models/User.js").default;
const Admin = require("./models/Admin.js").default;

async function migrate() {
  await mongoose.connect("mongodb://127.0.0.1:27017/resumatch");
  
  // Find users who are NOT job seekers
  const badUsers = await mongoose.connection.db.collection('users')
    .find({ role: { $nin: ["user", "job_seeker"] } }).toArray();
    
  console.log(`Found ${badUsers.length} corrupted admin accounts in the Users collection.`);
  
  for (const bad of badUsers) {
    const existingAdmin = await mongoose.connection.db.collection('admins')
      .findOne({ email: bad.email });
      
    if (!existingAdmin) {
      console.log(`Migrating ${bad.email} to Admins...`);
      await mongoose.connection.db.collection('admins').insertOne({
        name: bad.name || "Admin",
        email: bad.email,
        password: bad.password, // Keep the same hashed password!
        role: bad.role === "superadmin" ? "super_admin" : bad.role,
        status: "active",
        createdAt: bad.createdAt || new Date()
      });
    } else {
      console.log(`Admin ${bad.email} already exists in Admins collection.`);
    }
    
    console.log(`Deleting ${bad.email} from Users collection...`);
    await mongoose.connection.db.collection('users').deleteOne({ _id: bad._id });
  }
  
  console.log("Migration complete!");
  mongoose.disconnect();
}

migrate();
