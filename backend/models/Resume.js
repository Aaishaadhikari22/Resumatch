import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({

user:{
type: mongoose.Schema.Types.ObjectId,
ref: "User",
required: true
},

title:{
type: String,
required: true
},

skills:[
String
],

experience:{
type: Number,
default: 0
},

education:{
type: String,
enum: ["High School", "Associate", "Bachelor's", "Master's", "Ph.D.", "Any"],
default: "Any"
},

resumeUrl:{
type: String,
required: true
}

},{
timestamps:true
});

export default mongoose.model("Resume", resumeSchema);