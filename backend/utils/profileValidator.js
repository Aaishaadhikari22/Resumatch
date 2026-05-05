/**
 * Profile Validator - Validates and calculates profile completion
 */

// User Profile Validation
export const validateUserProfile = (user) => {
  const requiredFields = {
    name: { completed: !!user.name, weight: 20 },
    email: { completed: !!user.email, weight: 20 },
    phone: { completed: !!user.phone, weight: 20 },
    address: { completed: !!user.address && !!user.city, weight: 20 },
    documents: { completed: user.documents && user.documents.length > 0, weight: 20 }
  };

  const missingFields = [];
  let completedWeight = 0;
  let totalWeight = 0;

  for (const [field, requirement] of Object.entries(requiredFields)) {
    totalWeight += requirement.weight;
    if (requirement.completed) {
      completedWeight += requirement.weight;
    } else {
      missingFields.push(field);
    }
  }

  const completionPercentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

  return {
    isComplete: completionPercentage === 100,
    completionPercentage,
    missingFields,
    requiredFields,
    warnings: generateUserWarnings(user, missingFields),
    snapshot: {
      profileCompletionPercentage: completionPercentage,
      hasProfilePhoto: !!user.profilePhoto,
      hasDocuments: user.documents && user.documents.length > 0,
      isPhoneVerified: !!user.phone,
      isAddressCompleted: !!user.address && !!user.city,
      missingFields
    }
  };
};

// Employer Profile Validation
export const validateEmployerProfile = (employer) => {
  const requiredFields = {
    companyName: { completed: !!employer.companyName, weight: 15 },
    companyDescription: { completed: !!employer.companyDescription && employer.companyDescription.length > 50, weight: 15 },
    phone: { completed: !!employer.phone, weight: 10 },
    website: { completed: !!employer.website, weight: 10 },
    logo: { completed: !!employer.logo, weight: 15 },
    registrationNumber: { completed: !!employer.registrationNumber, weight: 15 },
    documents: { completed: employer.documents && employer.documents.length > 0, weight: 20 }
  };

  const missingFields = [];
  let completedWeight = 0;
  let totalWeight = 0;

  for (const [field, requirement] of Object.entries(requiredFields)) {
    totalWeight += requirement.weight;
    if (requirement.completed) {
      completedWeight += requirement.weight;
    } else {
      missingFields.push(field);
    }
  }

  const completionPercentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

  return {
    isComplete: completionPercentage === 100,
    completionPercentage,
    missingFields,
    requiredFields,
    warnings: generateEmployerWarnings(employer, missingFields),
    snapshot: {
      profileCompletionPercentage: completionPercentage,
      hasDocuments: employer.documents && employer.documents.length > 0,
      isBusinessVerified: employer.documents && employer.documents.some(d => d.isVerified),
      missingFields
    }
  };
};

// Generate user warnings
const generateUserWarnings = (user, missingFields) => {
  const warnings = [];


  if (!user.phone) {
    warnings.push({
      level: "error",
      field: "phone",
      message: "❌ Phone number is required for employers to contact you",
      suggestion: "Add your phone number"
    });
  }

  if (!user.address || !user.city) {
    warnings.push({
      level: "warning",
      field: "address",
      message: "⚠️ Complete address information helps employers understand your location",
      suggestion: "Add your address and city"
    });
  }

  if (!user.documents || user.documents.length === 0) {
    warnings.push({
      level: "error",
      field: "documents",
      message: "❌ Official documents are required for applications",
      suggestion: "Upload at least one official document (ID, Passport, or Certificate)"
    });
  } else if (user.documents.length < 2) {
    warnings.push({
      level: "warning",
      field: "documents",
      message: "⚠️ Multiple documents recommended for better verification",
      suggestion: "Upload additional official documents"
    });
  }

  return warnings;
};

// Generate employer warnings
const generateEmployerWarnings = (employer, missingFields) => {
  const warnings = [];

  if (!employer.companyDescription || employer.companyDescription.length < 50) {
    warnings.push({
      level: "warning",
      field: "companyDescription",
      message: "⚠️ Detailed company description helps attract better candidates",
      suggestion: "Write a detailed company description (at least 50 characters)"
    });
  }

  if (!employer.phone) {
    warnings.push({
      level: "error",
      field: "phone",
      message: "❌ Contact phone number is required",
      suggestion: "Add your company's contact number"
    });
  }

  if (!employer.logo) {
    warnings.push({
      level: "warning",
      field: "logo",
      message: "⚠️ Company logo improves brand visibility",
      suggestion: "Upload your company logo"
    });
  }

  if (!employer.registrationNumber) {
    warnings.push({
      level: "error",
      field: "registrationNumber",
      message: "❌ Business registration number is required",
      suggestion: "Add your business registration number"
    });
  }

  if (!employer.documents || employer.documents.length === 0) {
    warnings.push({
      level: "error",
      field: "documents",
      message: "❌ Official business documents are required to accept applications",
      suggestion: "Upload business registration, tax ID, or business license"
    });
  }

  // Check if any documents are verified
  const hasVerifiedDocs = employer.documents && employer.documents.some(d => d.isVerified);
  if (!hasVerifiedDocs) {
    warnings.push({
      level: "warning",
      field: "documents",
      message: "⏳ Documents are pending verification",
      suggestion: "Admin team is reviewing your documents"
    });
  }

  return warnings;
};

// Check if user can apply for jobs
export const canUserApply = (user) => {
  const validation = validateUserProfile(user);
  const blockers = validation.warnings.filter(w => w.level === "error");
  
  return {
    allowed: blockers.length === 0,
    blockers,
    warnings: validation.warnings.filter(w => w.level === "warning"),
    completionPercentage: validation.completionPercentage
  };
};

// Check if employer can accept applications
export const canEmployerAccept = (employer) => {
  const validation = validateEmployerProfile(employer);
  const blockers = validation.warnings.filter(w => w.level === "error");
  
  return {
    allowed: blockers.length === 0,
    blockers,
    warnings: validation.warnings.filter(w => w.level === "warning"),
    completionPercentage: validation.completionPercentage
  };
};

export default {
  validateUserProfile,
  validateEmployerProfile,
  canUserApply,
  canEmployerAccept,
  generateUserWarnings,
  generateEmployerWarnings
};
