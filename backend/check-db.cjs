const mongoose = require("mongoose");

async function checkDB() {
  await mongoose.connect("mongodb://127.0.0.1:27017/resumatch");
  
  const users = await mongoose.connection.db.collection('users').find({}).toArray();
  const admins = await mongoose.connection.db.collection('admins').find({}).toArray();
  
  console.log("=== USERS COLLECTION ===");
  users.forEach(u => console.log(`[User] ${u.email} : role=${u.role}`));
  
  console.log("\n=== ADMINS COLLECTION ===");
  if (admins.length === 0) console.log("NO ADMINS FOUND!");
  admins.forEach(a => console.log(`[Admin] ${a.email} : role=${a.role}`));

  mongoose.disconnect();
}

checkDB();
