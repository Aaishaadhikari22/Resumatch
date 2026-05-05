# Quick Start Implementation Guide

## 🚀 5-Step Implementation Plan

### Step 1: Setup File Upload Middleware (30 min)

**1. Install Dependencies**
```bash
cd backend
npm install multer fs path
```

**2. Create Upload Directory**
```bash
mkdir -p uploads/documents
```

**3. Create File Upload Middleware** (`backend/middleware/fileUpload.js`)
```javascript
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = 'uploads/documents';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }
});

export default upload;
```

### Step 2: Add API Endpoints (60 min)

**1. Add Imports to User Controller**
```javascript
// Add to backend/controllers/userFrontendController.js top
import { validateUserProfile, canUserApply } from "../utils/profileValidator.js";

// Add helper function
function updateProfileCompletion(user) {
  const validation = validateUserProfile(user);
  user.profileCompletion.completionPercentage = validation.completionPercentage;
  user.profileCompletion.isProfilePhotoUploaded = !!user.profilePhoto;
  user.profileCompletion.isPhoneVerified = !!user.phone;
  user.profileCompletion.isAddressCompleted = !!user.address && !!user.city;
  user.profileCompletion.isDocumentsUploaded = user.documents && user.documents.length > 0;
}
```

**2. Add User Document Upload Endpoint**
```javascript
export const uploadUserDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file provided" });
    }

    const { documentType } = req.body;
    const validTypes = ["id", "passport", "license", "certificate", "other"];
    
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({ msg: "Invalid document type" });
    }

    const user = await User.findById(req.user._id);
    
    user.documents.push({
      documentType,
      fileName: req.file.originalname,
      filePath: req.file.path,
      uploadedAt: new Date(),
      isVerified: false
    });

    user.profileCompletion.isDocumentsUploaded = true;
    updateProfileCompletion(user);
    
    await user.save();
    
    res.json({ 
      msg: "Document uploaded successfully",
      document: user.documents[user.documents.length - 1]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

**3. Add Get/Update Profile Endpoints**
```javascript
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ msg: "User not found" });

    const validation = validateUserProfile(user);
    
    res.json({
      ...user.toObject(),
      profileCompletion: validation.snapshot,
      completionPercentage: validation.completionPercentage,
      canApply: canUserApply(user).allowed
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { name, phone, address, city, bio, dateOfBirth, profilePhoto } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (phone) {
      user.phone = phone;
      user.profileCompletion.isPhoneVerified = true;
    }
    if (address) user.address = address;
    if (city) user.city = city;
    if (bio) user.bio = bio;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (profilePhoto) {
      user.profilePhoto = profilePhoto;
      user.profileCompletion.isProfilePhotoUploaded = true;
    }

    if (address && city) {
      user.profileCompletion.isAddressCompleted = true;
    }

    updateProfileCompletion(user);
    await user.save();
    
    const validation = validateUserProfile(user);
    
    res.json({
      msg: "Profile updated successfully",
      user,
      completionPercentage: validation.completionPercentage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
```

**4. Do Same for Employer Controller** (See `BACKEND_ENDPOINT_IMPLEMENTATION.md`)

### Step 3: Add Routes (30 min)

**1. Update User Routes** (`backend/routes/userFrontendRoutes.js`)
```javascript
import upload from "../middleware/fileUpload.js";
import { uploadUserDocument, getUserProfile, updateUserProfile } from "../controllers/userFrontendController.js";

// Add these routes
router.post("/upload-document", upload.single("document"), uploadUserDocument);
router.get("/profile", getUserProfile);
router.patch("/profile", updateUserProfile);
```

**2. Update Employer Routes** (Same pattern for employer endpoints)

### Step 4: Integrate Frontend Components (90 min)

**1. Add Profile Completion to User Settings Page**
```jsx
// frontend/src/pages/user/UserSettings.jsx
import ProfileCompletion from "../../components/ProfileCompletion";

export default function UserSettings() {
  return (
    <UserLayout>
      <div className="settings-container">
        <Tab1: Basic Settings... />
        <ProfileCompletion 
          userId={userId}
          showWarnings={true}
          onComplete={(isComplete) => {
            console.log("Profile complete:", isComplete);
          }}
        />
      </div>
    </UserLayout>
  );
}
```

**2. Add Validation to Job Apply Flow**
```jsx
// In JobRecommendations.jsx or SavedJobs.jsx
import ApplicationValidationModal from "../../components/ApplicationValidationModal";

const [showValidation, setShowValidation] = useState(false);
const [validation, setValidation] = useState(null);

const handleApply = async (jobId, employerId) => {
  try {
    await API.post("/user/apply", { jobId, employerId });
    showToast("✓ Applied successfully!", "success");
    // Refresh list
  } catch (error) {
    if (error.response?.data?.type === "INCOMPLETE_PROFILE") {
      setValidation(error.response.data);
      setShowValidation(true);
    } else {
      showToast(error.response?.data?.msg || "Failed to apply", "error");
    }
  }
};

// In JSX:
{showValidation && (
  <ApplicationValidationModal
    validation={validation}
    onConfirm={() => handleApply(jobId, employerId)}
    onCancel={() => setShowValidation(false)}
  />
)}
```

**3. Add Validation to Employer Accept Flow**
```jsx
// In EmployerApplicants.jsx
import AcceptanceValidationModal from "../../components/AcceptanceValidationModal";

const [showValidation, setShowValidation] = useState(false);
const [validation, setValidation] = useState(null);

const handleStatusChange = async (appId, newStatus) => {
  if (newStatus === "accepted") {
    try {
      await API.patch(`/employer/applications/${appId}/status`, { status: "accepted" });
      // Success
    } catch (error) {
      if (error.response?.data?.type === "INCOMPLETE_EMPLOYER_PROFILE") {
        setValidation(error.response.data);
        setShowValidation(true);
      }
    }
  }
};

// In JSX:
{showValidation && (
  <AcceptanceValidationModal
    validation={validation}
    applicantName={applicantName}
    onConfirm={() => handleStatusChange(appId, "accepted")}
    onCancel={() => setShowValidation(false)}
  />
)}
```

### Step 5: Testing (60 min)

**1. Test User Profile Upload**
```bash
# Upload a document
curl -X POST http://localhost:5000/api/user/upload-document \
  -H "Authorization: Bearer USER_TOKEN" \
  -F "document=@path/to/file.pdf" \
  -F "documentType=id"
```

**2. Test Profile Fetch**
```bash
curl -X GET http://localhost:5000/api/user/profile \
  -H "Authorization: Bearer USER_TOKEN"
```

**3. Test Application Validation**
```bash
# Try applying with incomplete profile
curl -X POST http://localhost:5000/api/user/apply \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "JOB_ID",
    "employerId": "EMPLOYER_ID"
  }'
```

**4. Manual Testing Checklist**
- [ ] User can upload document
- [ ] Profile % updates after upload
- [ ] User can update profile fields
- [ ] Profile % updates after field completion
- [ ] Application blocked with missing documents
- [ ] Modal shows blocker details
- [ ] Modal shows warnings
- [ ] Employer can upload documents
- [ ] Employer cannot accept without documents
- [ ] Profile snapshots save correctly

## 📝 Important Notes

1. **File Storage**: Currently uses local disk. For production, use AWS S3 or Cloudinary
2. **Security**: Add virus scanning for uploaded files
3. **Backup**: Setup regular backups for uploads directory
4. **Admin Panel**: Create admin interface to verify documents
5. **Email Notifications**: Send emails when documents are verified

## 🔍 Troubleshooting

### Documents Not Uploading
- Check uploads directory permissions
- Verify multer middleware is added to routes
- Check file size doesn't exceed 5MB
- Check file type is allowed (PDF, JPG, PNG, DOC)

### Profile % Not Updating
- Ensure updateProfileCompletion() is called after changes
- Check that profileCompletion object exists in model
- Verify validateUserProfile() is calculating correctly

### Modal Not Showing
- Check error response has `type: "INCOMPLETE_PROFILE"`
- Verify validation state is set from error
- Check modal component is rendered in JSX

## ✅ Completion Checklist

After completing all 5 steps:

- [ ] Step 1: File upload middleware created
- [ ] Step 2: All API endpoints created
- [ ] Step 3: Routes configured
- [ ] Step 4: Components integrated
- [ ] Step 5: Testing completed
- [ ] Documents uploaded and verified
- [ ] User profile validation working
- [ ] Employer profile validation working
- [ ] Application flow shows modals
- [ ] Acceptance flow shows modals
- [ ] Error handling working
- [ ] Success messages displaying

**Total Estimated Time: 4-5 hours**

---

**Next: Deploy and Monitor** 🚀
