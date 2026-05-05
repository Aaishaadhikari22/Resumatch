import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import User from "./models/User.js";
import Employer from "./models/Employer.js";
import Job from "./models/Job.js";
import Resume from "./models/Resume.js";

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/resumatch");
    console.log("Connected to MongoDB for seeding...");

    const passwordHash = await bcrypt.hash("password123", 10);

    // 1. Create Employers
    const employersData = [
      {
        companyName: "TechNova Solutions",
        name: "Alice HR",
        email: "alice@technova.com",
        password: passwordHash,
        status: "approved",
        companyDescription: "Leading provider of cloud infrastructure and computing solutions.",
        industryType: "Technology",
        employeeCount: "500-1000",
        phone: "555-0101",
        city: "San Francisco",
        website: "https://technova.example.com",
        jobPostingPrefs: { defaultSector: "IT", autoPublish: true, requireSkills: true, defaultJobDuration: 30 }
      },
      {
        companyName: "Global FinServe",
        name: "Bob Manager",
        email: "bob@globalfinserve.com",
        password: passwordHash,
        status: "approved",
        companyDescription: "Innovative financial tech company.",
        industryType: "Finance",
        employeeCount: "100-500",
        phone: "555-0202",
        city: "New York",
        website: "https://globalfinserve.example.com",
        jobPostingPrefs: { defaultSector: "Finance", autoPublish: true, requireSkills: true, defaultJobDuration: 30 }
      }
    ];

    await Employer.deleteMany({ email: { $in: employersData.map(e => e.email) } });
    const employers = await Employer.insertMany(employersData);
    console.log("Employers inserted!");

    // 2. Create Jobs
    const jobsData = [
      {
        employer: employers[0]._id, // TechNova
        title: "Senior Full Stack Engineer",
        description: "We are looking for a Senior Full Stack Engineer specializing in React and Node.js to lead our core product team. You will be responsible for architecture and team mentoring.",
        sector: "IT",
        skillsRequired: ["React", "Node.js", "MongoDB", "Express", "TypeScript"],
        experienceLevel: "Senior",
        minExperienceYears: 5,
        educationLevel: "Bachelor's",
        salary: { min: 120000, max: 150000, currency: "USD" },
        location: "Remote",
        city: "San Francisco",
        employmentType: "Full-time",
        jobStatus: "approved",
        isActive: true
      },
      {
        employer: employers[0]._id, // TechNova
        title: "Frontend Web Developer",
        description: "Join our fast-paced frontend team to build beautiful, responsive user interfaces using modern JavaScript frameworks.",
        sector: "IT",
        skillsRequired: ["HTML", "CSS", "JavaScript", "Vue.js", "CSS Tailwind"],
        experienceLevel: "Mid-level",
        minExperienceYears: 2,
        educationLevel: "Associate",
        salary: { min: 80000, max: 110000, currency: "USD" },
        location: "Hybrid",
        city: "San Francisco",
        employmentType: "Full-time",
        jobStatus: "approved",
        isActive: true
      },
      {
        employer: employers[1]._id, // Global FinServe
        title: "Data Scientist",
        description: "Analyze large datasets to extract meaningful financial trends. You will work closely with our quant team to build predictive models and algorithms.",
        sector: "Finance",
        skillsRequired: ["Python", "Pandas", "Machine Learning", "SQL", "Scikit-Learn"],
        experienceLevel: "Senior",
        minExperienceYears: 4,
        educationLevel: "Master's",
        salary: { min: 130000, max: 170000, currency: "USD" },
        location: "On-site",
        city: "New York",
        employmentType: "Full-time",
        jobStatus: "approved",
        isActive: true
      }
    ];

    await Job.deleteMany({ title: { $in: jobsData.map(j => j.title) } });
    const jobs = await Job.insertMany(jobsData);
    console.log("Jobs inserted!");

    // 3. Create Job Seekers (Users)
    const usersData = [
      {
        name: "Sarah Jenkins",
        email: "sarah.j@example.com",
        password: passwordHash,
        role: "user",
        status: "active",
        city: "Seattle",
        phone: "555-1234",
        profileCompletion: {
           isProfilePhotoUploaded: false,
           isPhoneVerified: true,
           isAddressCompleted: true,
           isDocumentsUploaded: false,
           completionPercentage: 80
        }
      },
      {
        name: "Michael Chen",
        email: "m.chen@example.com",
        password: passwordHash,
        role: "user",
        status: "active",
        city: "Chicago",
        phone: "555-5678",
        profileCompletion: {
           isProfilePhotoUploaded: false,
           isPhoneVerified: true,
           isAddressCompleted: true,
           isDocumentsUploaded: false,
           completionPercentage: 80
        }
      }
    ];

    await User.deleteMany({ email: { $in: usersData.map(u => u.email) } });
    const users = await User.insertMany(usersData);
    console.log("Users inserted!");

    // 4. Create Resumes
    const resumesData = [
      {
        user: users[0]._id, // Sarah Jenkins
        title: "Experienced Full Stack Developer",
        skills: ["React", "Node.js", "MongoDB", "Express", "AWS", "TypeScript"],
        experience: 6,
        education: "Bachelor's",
        resumeUrl: "/uploads/documents/dummy_resume1.pdf",
        extractedText: "Sarah Jenkins is an experienced Full Stack Developer primarily focusing on React and Node.js. She has 6 years of experience building scalable applications and RESTful APIs, with a strong background in MongoDB, AWS, and TypeScript."
      },
      {
        user: users[1]._id, // Michael Chen
        title: "Senior Data Scientist",
        skills: ["Python", "R", "SQL", "Machine Learning", "Deep Learning", "TensorFlow", "Pandas"],
        experience: 5,
        education: "Master's",
        resumeUrl: "/uploads/documents/dummy_resume2.pdf",
        extractedText: "Michael Chen is a highly analytical Data Scientist with a Master's degree. He specializes in building robust machine learning models using Python, SQL, Pandas, and TensorFlow. He is passionate about predictive analytics and Big Data."
      }
    ];

    await Resume.deleteMany({ user: { $in: resumesData.map(r => r.user) } });
    const resumes = await Resume.insertMany(resumesData);
    console.log("Resumes inserted!");

    console.log("\\n--- SEEDING COMPLETE ---");
    console.log("Test Login Credentials (Password for all is 'password123'):");
    console.log("Employers:");
    console.log("- alice@technova.com");
    console.log("- bob@globalfinserve.com");
    console.log("Users (Job Seekers):");
    console.log("- sarah.j@example.com");
    console.log("- m.chen@example.com");

    process.exit(0);
  } catch (error) {
    console.error("Seeding Error:", error);
    process.exit(1);
  }
};

seedDB();
