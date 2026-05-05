/**
 * Skill Matching Utility
 * Provides precise skill and document matching algorithms for job-resume matching using NLP
 */

import natural from 'natural';

// Setup tokenizers and stemmers
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const stopWordsList = Array.isArray(natural.stopwords) ? natural.stopwords : ["i","me","my","myself","we","our","ours","ourselves","you","your","yours","yourself","yourselves","he","him","his","himself","she","her","hers","herself","it","its","itself","they","them","their","theirs","themselves","what","which","who","whom","this","that","these","those","am","is","are","was","were","be","been","being","have","has","had","having","do","does","did","doing","a","an","the","and","but","if","or","because","as","until","while","of","at","by","for","with","about","against","between","into","through","during","before","after","above","below","to","from","up","down","in","out","on","off","over","under","again","further","then","once","here","there","when","where","why","how","all","any","both","each","few","more","most","other","some","such","no","nor","not","only","own","same","so","than","too","very","s","t","can","will","just","don","should","now"];

/**
 * Preprocess text by tokenizing, removing stopwords, and stemming
 */
export const preprocessText = (text) => {
  if (!text) return [];
  const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
  return tokens
    .filter(token => !stopWordsList.includes(token))
    .map(token => stemmer.stem(token));
};

/**
 * Compute similarity between two texts using TF-IDF and Cosine Similarity
 */
export const computeTextSimilarity = (text1, text2) => {
  const tokens1 = preprocessText(text1);
  const tokens2 = preprocessText(text2);
  
  if (tokens1.length === 0 || tokens2.length === 0) return 0;
  
  const TfIdf = natural.TfIdf;
  const tfidf = new TfIdf();
  
  tfidf.addDocument(tokens1.join(' '));
  tfidf.addDocument(tokens2.join(' '));
  
  const vocabulary = Array.from(new Set([...tokens1, ...tokens2]));
  const vector1 = new Array(vocabulary.length).fill(0);
  const vector2 = new Array(vocabulary.length).fill(0);
  
  vocabulary.forEach((term, index) => {
    tfidf.tfidfs(term, function(docIndex, measure) {
      if (docIndex === 0) vector1[index] = measure;
      if (docIndex === 1) vector2[index] = measure;
    });
  });
  
  let dotProduct = 0;
  let mag1 = 0;
  let mag2 = 0;
  
  for (let i = 0; i < vocabulary.length; i++) {
    dotProduct += vector1[i] * vector2[i];
    mag1 += vector1[i] * vector1[i];
    mag2 += vector2[i] * vector2[i];
  }
  
  mag1 = Math.sqrt(mag1);
  mag2 = Math.sqrt(mag2);
  
  if (mag1 === 0 || mag2 === 0) return 0;
  return dotProduct / (mag1 * mag2);
};

/**
 * Calculate similarity score based on Skills and Document Text
 * 
 * @param {Object} job - Full Job object
 * @param {Object} resume - Full Resume object (and optionally User bio within)
 * @returns {Object} { score: 0-100, matchedSkills: [], unmatchedSkills: [] }
 */
const normalizeSkills = (skills) => {
  if (!skills) return [];
  return Array.isArray(skills)
    ? skills
        .filter(Boolean)
        .map((skill) => String(skill).trim())
        .filter(Boolean)
    : [];
};

const normalizeSkillPhrase = (skill) => {
  const normalized = preprocessText(String(skill));
  return normalized.join(" ");
};

const buildSkillMatch = (jobSkills, resumeSkills) => {
  const normalizedResume = normalizeSkills(resumeSkills).map(normalizeSkillPhrase);
  const matchedSkills = [];
  const unmatchedSkills = [];

  normalizeSkills(jobSkills).forEach((skill) => {
    const normalizedJobSkill = normalizeSkillPhrase(skill);
    if (!normalizedJobSkill) {
      unmatchedSkills.push(skill);
      return;
    }

    const isMatched = normalizedResume.some((resumeSkill) =>
      resumeSkill === normalizedJobSkill ||
      resumeSkill.includes(normalizedJobSkill) ||
      normalizedJobSkill.includes(resumeSkill)
    );

    if (isMatched) {
      matchedSkills.push(skill);
    } else {
      unmatchedSkills.push(skill);
    }
  });

  return { matchedSkills, unmatchedSkills };
};

export const calculateSimilarityScore = (jobOrSkills, resumeOrSkills) => {
  const jobSkills = Array.isArray(jobOrSkills)
    ? normalizeSkills(jobOrSkills)
    : normalizeSkills(jobOrSkills?.skillsRequired || jobOrSkills?.skills);

  const resumeSkills = Array.isArray(resumeOrSkills)
    ? normalizeSkills(resumeOrSkills)
    : normalizeSkills(resumeOrSkills?.skills);

  const jobTitle = !Array.isArray(jobOrSkills) ? String(jobOrSkills?.title || "") : "";
  const jobDescription = !Array.isArray(jobOrSkills) ? String(jobOrSkills?.description || "") : "";
  const resumeTitle = !Array.isArray(resumeOrSkills) ? String(resumeOrSkills?.title || "") : "";
  const resumeEducation = !Array.isArray(resumeOrSkills) ? String(resumeOrSkills?.education || "") : "";
  const resumeBio = !Array.isArray(resumeOrSkills) ? String(resumeOrSkills?.bio || "") : "";
  const resumeExtractedText = !Array.isArray(resumeOrSkills) ? String(resumeOrSkills?.extractedText || "") : "";

  const { matchedSkills, unmatchedSkills } = buildSkillMatch(jobSkills, resumeSkills);

  let skillScore = 0;
  if (jobSkills.length === 0) {
    skillScore = 1;
  } else {
    skillScore = matchedSkills.length / jobSkills.length;
  }

  const jobText = [jobTitle, jobDescription, jobSkills.join(" ")].filter(Boolean).join(" ");
  const resumeText = [resumeTitle, resumeEducation, resumeSkills.join(" "), resumeBio, resumeExtractedText]
    .filter(Boolean)
    .join(" ");

  const textScore = computeTextSimilarity(jobText, resumeText);
  const combinedScore = (skillScore * 0.5) + (textScore * 0.5);
  const score = Math.round(Math.min(100, Math.max(0, combinedScore * 100)));

  return { score, matchedSkills, unmatchedSkills };
};

/**
 * Calculate comprehensive match score between job requirements and resume
 * Considers skills+text (40%), experience (30%), and education (30%)
 */
export const calculateComprehensiveMatch = (job, resume) => {
  // Skills+Text matching (40% weight)
  const skillMatch = calculateSimilarityScore(job, resume);
  const skillScore = skillMatch.score * 0.4;

  // Experience matching (30% weight)
  let experienceScore = 0;
  const requiredExp = job.minExperienceYears || 0;
  const userExp = resume.experience || 0;
  
  if (requiredExp === 0) {
    experienceScore = 100;
  } else if (userExp >= requiredExp) {
    experienceScore = 100;
  } else if (userExp >= requiredExp * 0.7) {
    experienceScore = 70;
  } else if (userExp >= requiredExp * 0.5) {
    experienceScore = 50;
  } else {
    experienceScore = Math.max(0, (userExp / requiredExp) * 100);
  }
  experienceScore *= 0.3;

  // Education matching (30% weight)
  let educationScore = 0;
  const educationLevels = ["Any", "High School", "Associate", "Bachelor's", "Master's", "Ph.D."];
  const requiredLevel = educationLevels.indexOf(job.educationLevel || "Any");
  const userLevel = educationLevels.indexOf(resume.education || "Any");
  
  if (requiredLevel === 0) {
    educationScore = 100;
  } else if (userLevel >= requiredLevel) {
    educationScore = 100;
  } else if (userLevel === requiredLevel - 1) {
    educationScore = 70;
  } else {
    educationScore = 30;
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
 */
export const matchResumesToJob = (job, resumes) => {
  return resumes
    .map(resume => {
      const { score, matchedSkills } = calculateSimilarityScore(job, resume);
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
 */
export const findMatchingResumes = (job, resumes, threshold = 50) => {
  return resumes
    .map(resume => {
      const { score, matchedSkills } = calculateSimilarityScore(job, resume);
      return { resume, score, matchedSkills };
    })
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score);
};

/**
 * Get color coding for similarity scores
 */
export const getScoreColor = (score) => {
  if (score >= 70) return "green";
  if (score >= 40) return "orange";
  return "red";
};

/**
 * Format skill list for display
 */
export const formatSkillList = (skills) => {
  return (skills || []).join(", ");
};
