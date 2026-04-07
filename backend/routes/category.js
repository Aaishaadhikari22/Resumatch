import express from "express";
import Category from "../models/Category.js";

const router = express.Router();


import Job from "../models/Job.js";

/* GET ALL CATEGORIES */
router.get("/all", async(req,res)=>{
try{
  const categories = await Category.find();
  const formatted = await Promise.all(categories.map(async (cat) => {
    // Count jobs that have this category as sector
    const jobsCount = await Job.countDocuments({ sector: cat.name });
    return { ...cat._doc, jobsCount };
  }));
  res.json(formatted);
}catch(err){
  res.status(500).json({message:err.message});
}
});


/* CREATE CATEGORY */

router.post("/create", async(req,res)=>{

try{

const category = new Category(req.body);

await category.save();

res.json({message:"Category created"});

}catch(err){
res.status(500).json({message:err.message});
}

});


/* UPDATE CATEGORY */

router.put("/update/:id", async(req,res)=>{

try{

await Category.findByIdAndUpdate(
req.params.id,
req.body
);

res.json({message:"Category updated"});

}catch(err){
res.status(500).json({message:err.message});
}

});


/* DELETE CATEGORY */

router.delete("/delete/:id", async(req,res)=>{

try{

await Category.findByIdAndDelete(
req.params.id
);

res.json({message:"Category deleted"});

}catch(err){
res.status(500).json({message:err.message});
}

});


export default router;