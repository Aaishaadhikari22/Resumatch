/**
 * Resume Format Templates for Different Countries
 * Supports: US, UK/Europe, India, Canada
 */

export const resumeFormats = {
  US: {
    name: "US Format",
    country: "United States",
    description: "Standard ATS-friendly resume format",
    sections: ["header", "summary", "experience", "education", "skills", "certifications", "languages"],
    spacing: "compact",
    style: "modern"
  },
  
  UK: {
    name: "UK/Europass Format",
    country: "United Kingdom & Europe",
    description: "European CV format with detailed information",
    sections: ["header", "personalStatement", "workExperience", "education", "skills", "languages", "additionalInfo"],
    spacing: "standard",
    style: "formal"
  },
  
  INDIA: {
    name: "Indian Format",
    country: "India",
    description: "Comprehensive resume highlighting experience and achievements",
    sections: ["header", "objectiveStatement", "workExperience", "education", "technicalSkills", "certifications", "languages", "personalDetails"],
    spacing: "detailed",
    style: "formal"
  },
  
  CANADA: {
    name: "Canadian Format",
    country: "Canada",
    description: "Canadian resume format emphasizing accomplishments",
    sections: ["header", "summary", "workExperience", "education", "skills", "volunteerWork", "languages"],
    spacing: "standard",
    style: "modern"
  },

  AUSTRALIA: {
    name: "Australian Format",
    country: "Australia",
    description: "Australian resume emphasizing accomplishments and key metrics",
    sections: ["header", "summary", "workExperience", "education", "skills", "certifications", "languages", "references"],
    spacing: "detailed",
    style: "modern"
  }
};

/**
 * Get all available resume formats
 */
export const getAvailableFormats = () => {
  return Object.entries(resumeFormats).map(([key, format]) => ({
    code: key,
    ...format
  }));
};

/**
 * Get specific format details
 */
export const getFormatDetails = (formatCode) => {
  const format = resumeFormats[formatCode];
  if (!format) {
    throw new Error(`Resume format '${formatCode}' not found`);
  }
  return {
    code: formatCode,
    ...format
  };
};

/**
 * Validate if format is supported
 */
export const isValidFormat = (formatCode) => {
  return formatCode in resumeFormats;
};
