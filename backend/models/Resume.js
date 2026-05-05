import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    title: {
        type: String,
        required: true
    },

    skills: [
        String
    ],

    experience: {
        type: Number,
        default: 0
    },

    education: {
        type: String,
        enum: ["High School", "Associate", "Bachelor's", "Master's", "Ph.D.", "Any"],
        default: "Any"
    },

    resumeUrl: {
        type: String,
        required: true
    },

    extractedText: {
        type: String,
        default: ""
    },

    expectedSalary: {
        type: Number,
        default: 0
    },

    languages: [String],

    workExperiences: [{
        company: { type: String, required: true },
        position: { type: String, required: true },
        startDate: { type: Date },
        endDate: { type: Date },
        description: { type: String, default: "" }
    }],

    educationHistory: [{
        institution: { type: String, required: true },
        degree: { type: String, required: true },
        fieldOfStudy: { type: String, default: "" },
        startDate: { type: Date },
        endDate: { type: Date }
    }]

}, {
    timestamps: true
});

export default mongoose.model("Resume", resumeSchema);