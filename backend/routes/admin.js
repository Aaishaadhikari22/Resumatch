import express from "express";
import Admin from "../models/Admin.js";
import User from "../models/User.js";
import Employer from "../models/Employer.js";

const router = express.Router();

/* ================= CREATE ADMIN ================= */

router.post("/create", async (req, res) => {

try {

const {
name,
email,
password,
gender,
qualification,
phone,
role
} = req.body;

if(!name || !email || !password || !gender || !qualification || !phone || !role){
return res.status(400).json({
message:"All fields are required"
});
}

const newAdmin = new Admin({
name,
email,
password,
gender,
qualification,
phone,
role,
status:"active"
});

await newAdmin.save();

res.json({
message:"Admin created successfully"
});

}
catch(error){

console.log(error);

res.status(500).json({
message:"Error creating admin"
});

}

});


/* ================= GET ALL ADMINS ================= */

router.get("/all", async (req,res)=>{

const admins = await Admin.find();

res.json(admins);

});


/* ================= UPDATE STATUS ================= */

router.put("/update/:id", async (req,res)=>{

await Admin.findByIdAndUpdate(
req.params.id,
req.body
);

res.json({message:"Admin updated"});

});


/* ================= DELETE ADMIN ================= */

router.delete("/delete/:id", async (req,res)=>{

await Admin.findByIdAndDelete(req.params.id);

res.json({message:"Admin deleted"});

});


/* CREATE USER (JOB SEEKER) */

router.post("/create-user", async (req,res)=>{

try{

const {
name,
email,
password,
phone
} = req.body;

const user = new User({
name,
email,
password,
phone,
role:"user"
});

await user.save();

res.json({
message:"User created successfully"
});

}catch(error){

res.status(500).json({
message:error.message
});

}

});

/* CREATE EMPLOYER */

router.post("/create-employer", async (req,res)=>{

try{

const {
companyName,
email,
password,
phone
} = req.body;

const employer = new Employer({
companyName,
email,
password,
phone,
status:"approved"
});

await employer.save();

res.json({
message:"Employer created successfully"
});

}catch(error){

res.status(500).json({
message:error.message
});

}

});

export default router;