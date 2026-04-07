/**
 * Skill Matching Utility
 * Provides precise skill matching algorithms for job-resume matching
 * 
 * CORE FEATURE:
 * The similarity score in the ResuMatch system is calculated using TF-IDF (Term Frequency–Inverse Document Frequency)
 * and cosine similarity techniques. First, TF-IDF is used to convert the text data from job seekers’ skills and job 
 * descriptions into numerical vectors by assigning importance to each word based on how frequently it appears in a 
 * document and how unique it is across all documents. This helps highlight important keywords while reducing the weight 
 * of common words. After that, cosine similarity is applied to measure how similar these two vectors are by calculating 
 * the cosine of the angle between them. The result is a value between 0 and 1, where a higher value indicates a stronger 
 * match between the candidate’s skills and the job requirements. This score is then converted into a percentage and used 
 * to rank candidates or jobs based on their relevance.
 */

import natural from 'natural';

/**
 * Calculate similarity score between job skills and resume skills
 * Uses TF-IDF and Cosine Similarity
 * 
 * @param {Array<string>} jobSkills - Required skills for the job
 * @param {Array<string>} resumeSkills - Skills listed on resume
 * @returns {Object} { score: 0-100, matchedSkills: [], unmatchedSkills: [] }
 */
export const calculateSimilarityScore = (jobSkills = [], resumeSkills = []) => {
  if (jobSkills.length === 0) return { score: 100, matchedSkills: [], unmatchedSkills: [] };
  if (resumeSkills.length === 0) return { score: 0, matchedSkills: [], unmatchedSkills: jobSkills };

  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();

  // Create documents for TF-IDF training
  const jobDoc = jobSkills.join(' ').toLowerCase();
  const resumeDoc = resumeSkills.join(' ').toLowerCase();

  // Add documents to corpus
  tfidf.addDocument(jobDoc);
  tfidf.addDocument(resumeDoc);

  // Extract vocabulary from both documents
  const tokenizer = new natural.WordTokenizer();
  const jobTokens = tokenizer.tokenize(jobDoc) || [];
  const resumeTokens = tokenizer.tokenize(resumeDoc) || [];
  const vocabulary = Array.from(new Set([...jobTokens, ...resumeTokens]));

  // Create vectors for both documents
  const jobVector = new Array(vocabulary.length).fill(0);
  const resumeVector = new Array(vocabulary.length).fill(0);

  vocabulary.forEach((term, index) => {
    tfidf.tfidfs(term, function(docIndex, measure) {
      if (docIndex === 0) jobVector[index] = measure; // Job Document
      if (docIndex === 1) resumeVector[index] = measure; // Resume Document
    });
  });

  // Calculate Cosine Similarity
  let dotProduct = 0;
  let jobMagnitude = 0;
  let resumeMagnitude = 0;

  for (let i = 0; i < vocabulary.length; i++) {
    dotProduct += jobVector[i] * resumeVector[i];
    jobMagnitude += jobVector[i] * jobVector[i];
    resumeMagnitude += resumeVector[i] * resumeVector[i];
  }

  jobMagnitude = Math.sqrt(jobMagnitude);
  resumeMagnitude = Math.sqrt(resumeMagnitude);

  let cosineSimilarity = 0;
  if (jobMagnitude !== 0 && resumeMagnitude !== 0) {
    cosineSimilarity = dotProduct / (jobMagnitude * resumeMagnitude);
  }
  
  // Calculate final percentage score
  const score = Math.round(cosineSimilarity * 100);

  // Fallback direct match system to populate matched/unmatched arrays
  const matchedSkills = [];
  const unmatchedSkills = [];
  
  const resumeStr = resumeDoc.toLowerCase();
  jobSkills.forEach(skill => {
      // Basic direct inclusion or multi part skill matching for tags
      if (resumeStr.includes(skill.toLowerCase())) {
          matchedSkills.push(skill);
      } else {
          unmatchedSkills.push(skill);
      }
  });

  return { score, matchedSkills, unmatchedSkills };
};

/**
 * Calculate comprehensive match score between job requirements and resume
 * Considers skills (40%), experience (30%), and education (30%)
 * 
 * @param {Object} job - Job object with skillsRequired, minExperienceYears, educationLevel
 * @param {Object} resume - Resume object with skills, experience, education
 * @returns {Object} { totalScore: 0-100, breakdown: {skills, experience, education}, details: {} }
 */
export const calculateComprehensiveMatch = (job, resume) => {
  // Skills matching (40% weight)
  const skillMatch = calculateSimilarityScore(job.skillsRequired || [], resume.skills || []);
  const skillScore = skillMatch.score * 0.4;

  // Experience matching (30% weight)
  let experienceScore = 0;
  const requiredExp = job.minExperienceYears || 0;
  const userExp = resume.experience || 0;
  
  if (requiredExp === 0) {
    experienceScore = 100; // No experience required
  } else if (userExp >= requiredExp) {
    experienceScore = 100; // Meets or exceeds requirement
  } else if (userExp >= requiredExp * 0.7) {
    experienceScore = 70; // Close to requirement
  } else if (userExp >= requiredExp * 0.5) {
    experienceScore = 50; // Halfway there
  } else {
    experienceScore = Math.max(0, (userExp / requiredExp) * 100); // Proportional
  }
  experienceScore *= 0.3;

  // Education matching (30% weight)
  let educationScore = 0;
  const educationLevels = ["Any", "High School", "Associate", "Bachelor's", "Master's", "Ph.D."];
  const requiredLevel = educationLevels.indexOf(job.educationLevel || "Any");
  const userLevel = educationLevels.indexOf(resume.education || "Any");
  
  if (requiredLevel === 0) {
    educationScore = 100; // Any education accepted
  } else if (userLevel >= requiredLevel) {
    educationScore = 100; // Meets or exceeds requirement
  } else if (userLevel === requiredLevel - 1) {
    educationScore = 70; // One level below
  } else {
    educationScore = 30; // Significantly below
  }
  educationScore *= 0.3;

  const totalScore = Math.round(skillScore + experienceScore + educationScore);

  return {
    totalScore,
    breakdown: {
      skills: Math.round(skillScore / 0.4),
      experience: Math.round(experienceScore / 0.3),
      education: Math.round(educationScore / 0.3)
    },
    details: {
      matchedSkills: skillMatch.matchedSkills,
      unmatchedSkills: skillMatch.unmatchedSkills,
      requiredExperience: requiredExp,
      userExperience: userExp,
      requiredEducation: job.educationLevel,
      userEducation: resume.education
    }
  };
};

/**
 * Match job skills against multiple resumes and return sorted results
 * Optimized for batch processing
 * 
 * @param {Array<string>} jobSkills - Job requirements
 * @param {Array<Object>} resumes - Array of resume objects with skills array
 * @returns {Array<Object>} Resumes sorted by similarity score (highest first)
 */
export const matchResumesToJob = (jobSkills, resumes) => {
  return resumes
    .map(resume => {
      const { score, matchedSkills } = calculateSimilarityScore(
        jobSkills,
        resume.skills || []
      );
      return {
        ...resume,
        similarityScore: score,
        matchedSkills
      };
    })
    .sort((a, b) => b.similarityScore - a.similarityScore);
};

/**
 * Find all resumes that match job skills (threshold-based)
 * Used for job posting notifications
 * 
 * @param {Array<string>} jobSkills - Job requirements
 * @param {Array<Object>} resumes - Array of resume objects
 * @param {number} threshold - Minimum score (0-100) to be considered matching
 * @returns {Array<Object>} Matching resumes with scores
 */
export const findMatchingResumes = (jobSkills, resumes, threshold = 50) => {
  return resumes
    .map(resume => {
      const { score, matchedSkills } = calculateSimilarityScore(
        jobSkills,
        resume.skills || []
      );
      return { resume, score, matchedSkills };
    })
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score);
};

/**
 * Get color coding for similarity scores
 * @param {number} score - Similarity score (0-100)
 * @returns {string} Color code: "green" | "orange" | "red"
 */
export const getScoreColor = (score) => {
  if (score >= 70) return "green";
  if (score >= 40) return "orange";
  return "red";
};

/**
 * Format skill list for display
 * @param {Array<string>} skills - List of skills
 * @returns {string} Comma-separated string
 */
export const formatSkillList = (skills) => {
  return (skills || []).join(", ");
};
