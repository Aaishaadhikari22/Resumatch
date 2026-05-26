/**
 * Skill Matching Utility
 * Provides precise skill and document matching algorithms for job-resume matching using NLP
 */

import natural from 'natural';

// Setup tokenizers and stemmers
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;
const stopWordsList = Array.isArray(natural.stopwords) ? natural.stopwords : ["i","me","my","myself","we","our","ours","ourselves","you","your","yours","yourself","yourselves","he","him","his","himself","she","her","hers","herself","it","its","itself","they","them","their","theirs","themselves","what","which","who","whom","this","that","these","those","am","is","are","was","were","be","been","being","have","has","had","having","do","does","did","doing","a","an","the","and","but","if","or","because","as","until","while","of","at","by","for","with","about","against","between","into","through","during","before","after","above","below","to","from","up","down","in","out","on","off","over","under","again","further","then","once","here","there","when","where","why","how","all","any","both","each","few","more","most","other","some","such","no","nor","not","only","own","same","so","than","too","very","s","t","can","will","just","don","should","now"];

// Lightweight synonym map for common skills and abbreviations. Expand as needed.
const synonymMap = {
  javascript: ['js', 'nodejs', 'node'],
  'c#': ['csharp'],
  'c++': ['cpp'],
  'machine learning': ['ml', 'machine-learning'],
  'natural language processing': ['nlp'],
  'react': ['reactjs'],
  'postgresql': ['postgres', 'pg'],
  'mysql': ['mariadb'],
  'docker': ['containerization'],
  'kubernetes': ['k8s']
};

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

const expandSkillVariants = (skill) => {
  if (!skill) return [];
  const base = String(skill).toLowerCase().trim();
  const stemmed = preprocessText(base).join(' ');
  const variants = new Set([base, stemmed]);

  // include synonyms from map
  Object.keys(synonymMap).forEach((key) => {
    const group = [key].concat(synonymMap[key] || []);
    if (group.some(v => v === base || preprocessText(v).join(' ') === stemmed)) {
      group.forEach(v => variants.add(v));
      group.forEach(v => variants.add(preprocessText(v).join(' ')));
    }
  });

  return Array.from(variants).filter(Boolean);
};

/**
 * Compute similarity between two texts using TF-IDF and Cosine Similarity
 */
export const computeTextSimilarity = (text1, text2) => {
  // Improved TF-IDF + cosine similarity with smoothing for small corpora
  const tokens1 = preprocessText(text1);
  const tokens2 = preprocessText(text2);

  if (tokens1.length === 0 || tokens2.length === 0) return 0;

  const vocabulary = Array.from(new Set([...tokens1, ...tokens2]));

  // term frequencies
  const tf = (tokens) => {
    const counts = {};
    tokens.forEach(t => counts[t] = (counts[t] || 0) + 1);
    const total = tokens.length || 1;
    Object.keys(counts).forEach(k => counts[k] = counts[k] / total);
    return counts;
  };

  const tf1 = tf(tokens1);
  const tf2 = tf(tokens2);

  // document frequencies and smoothed idf (N=2)
  const df = {};
  vocabulary.forEach(term => {
    let d = 0;
    if (tokens1.includes(term)) d++;
    if (tokens2.includes(term)) d++;
    df[term] = d;
  });

  const N = 2;
  const idf = {};
  vocabulary.forEach(term => {
    // add-one smoothing + scale to avoid zero-idf with tiny corpora
    idf[term] = Math.log((N + 1) / (df[term] + 1)) + 1;
  });

  const vec = (tfCounts) => vocabulary.map(term => (tfCounts[term] || 0) * (idf[term] || 1));

  const v1 = vec(tf1);
  const v2 = vec(tf2);

  let dot = 0, m1 = 0, m2 = 0;
  for (let i = 0; i < vocabulary.length; i++) {
    dot += v1[i] * v2[i];
    m1 += v1[i] * v1[i];
    m2 += v2[i] * v2[i];
  }

  const cosine = (Math.sqrt(m1) === 0 || Math.sqrt(m2) === 0) ? 0 : dot / (Math.sqrt(m1) * Math.sqrt(m2));

  // token overlap ratio
  const common = tokens1.filter(t => tokens2.includes(t)).length;
  const overlap = common / Math.max(1, (tokens1.length + tokens2.length) / 2);

  // lightweight title/phrase similarity using Jaro-Winkler
  const titleSim = natural.JaroWinklerDistance(text1.slice(0, 120), text2.slice(0, 120));

  // combine signals (weights chosen to reduce over-emphasis on tiny TF-IDF corpora)
  const combined = (0.6 * cosine) + (0.3 * overlap) + (0.1 * titleSim);
  return Math.max(0, Math.min(1, combined));
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

// Fuzzy and token-overlap skill matcher to avoid false positives (eg. sql vs mysql)
const fuzzyMatchSkill = (jobPhrase, resumePhrase) => {
  if (!jobPhrase || !resumePhrase) return false;

  // expand variants (includes synonyms and stemmed forms)
  const jobVariants = expandSkillVariants(jobPhrase);
  const resumeVariants = expandSkillVariants(resumePhrase);

  // exact or variant match
  if (jobVariants.some(v => resumeVariants.includes(v))) return true;

  // token overlap on base phrases
  const jobTokens = jobPhrase.split(' ').filter(Boolean);
  const resumeTokens = resumePhrase.split(' ').filter(Boolean);
  const common = jobTokens.filter(t => resumeTokens.includes(t));
  const overlapRatio = common.length / Math.max(jobTokens.length, resumeTokens.length);
  if (overlapRatio >= 0.6) return true;

  // fuzzy similarity with slightly relaxed threshold to catch abbreviations
  const jw = natural.JaroWinklerDistance(jobPhrase, resumePhrase);
  if (jw >= 0.9) return true;

  // phonetic fallback
  try {
    const jobMeta = natural.Metaphone.process(jobPhrase);
    const resumeMeta = natural.Metaphone.process(resumePhrase);
    if (jobMeta && resumeMeta && jobMeta === resumeMeta) return true;
  } catch (err) {}

  return false;
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
      fuzzyMatchSkill(normalizedJobSkill, resumeSkill)
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
  // Emphasize explicit skill matches (more reliable) while keeping text similarity as context
  const skillWeight = 0.55;
  const textWeight = 0.45;
  const combinedScore = (skillScore * skillWeight) + (textScore * textWeight);
  const score = Math.round(Math.min(100, Math.max(0, combinedScore * 100)));

  return { score, matchedSkills, unmatchedSkills };
};

/**
 * Calculate comprehensive match score between job requirements and resume
 * Considers skills+text (40%), experience (30%), and education (30%)
 */
export const calculateComprehensiveMatch = (job, resume, settings = {}) => {
  // Settings default values (if not provided)
  const {
    weightSkills = 40,
    weightExperience = 30,
    weightEducation = 30,
    weightKeywords = 0,
    minimumSimilarityThreshold = 50
  } = settings || {};

  // Normalize inputs
  const jobSkills = Array.isArray(job.skillsRequired) ? job.skillsRequired : (job.skills || []);
  const resumeSkills = Array.isArray(resume.skills) ? resume.skills : (resume.skills || []);

  // Skill match (explicit skill matching)
  const { matchedSkills, unmatchedSkills } = buildSkillMatch(jobSkills, resumeSkills);
  const skillScoreRaw = jobSkills.length === 0 ? 1 : (matchedSkills.length / jobSkills.length);

  // Text similarity (keywords / description)
  const jobTitle = !Array.isArray(job) ? String(job?.title || "") : "";
  const jobDescription = !Array.isArray(job) ? String(job?.description || "") : "";
  const resumeTitle = !Array.isArray(resume) ? String(resume?.title || "") : "";
  const resumeEducation = !Array.isArray(resume) ? String(resume?.education || "") : "";
  const resumeBio = !Array.isArray(resume) ? String(resume?.bio || "") : "";
  const resumeExtractedText = !Array.isArray(resume) ? String(resume?.extractedText || "") : "";

  const jobText = [jobTitle, jobDescription, jobSkills.join(" ")].filter(Boolean).join(" ");
  const resumeText = [resumeTitle, resumeEducation, resumeSkills.join(" "), resumeBio, resumeExtractedText]
    .filter(Boolean)
    .join(" ");

  const textScoreRaw = computeTextSimilarity(jobText, resumeText); // 0-1

  // Experience matching (raw 0-1)
  const requiredExp = job.minExperienceYears || 0;
  const userExp = resume.experience || 0;
  let experienceScoreRaw = 0;
  if (requiredExp === 0) experienceScoreRaw = 1;
  else {
    const ratio = Math.max(0, userExp / requiredExp);
    experienceScoreRaw = ratio >= 1 ? 1 : Math.pow(ratio, 0.75);
  }

  // Education matching (raw 0-1)
  const parseEducationLevel = (text) => {
    if (!text) return 0; // Any
    const t = String(text).toLowerCase();
    if (/phd|doctor|ph\.d/.test(t)) return 5;
    if (/master|msc|m\.sc|m\.s|mba/.test(t)) return 4;
    if (/bachelor|bsc|b\.sc|ba|b\.a/.test(t)) return 3;
    if (/associate|associate's|associates/.test(t)) return 2;
    if (/high school|secondary|ged/.test(t)) return 1;
    return 0; // Any / unknown
  };

  const requiredLevel = parseEducationLevel(job.educationLevel || 'Any');
  const userLevel = parseEducationLevel(resume.education || 'Any');

  let educationScoreRaw = 0;
  if (requiredLevel === 0) educationScoreRaw = 1;
  else if (userLevel >= requiredLevel) educationScoreRaw = 1;
  else if (userLevel === requiredLevel - 1) educationScoreRaw = 0.7;
  else educationScoreRaw = 0.3;

  // Compose final weighted score using configured weights (weights expected to sum to 100)
  const totalWeight = (weightSkills || 0) + (weightKeywords || 0) + (weightExperience || 0) + (weightEducation || 0) || 100;

  const weightedSkills = (skillScoreRaw * (weightSkills || 0));
  const weightedKeywords = (textScoreRaw * (weightKeywords || 0));
  const weightedExperience = (experienceScoreRaw * (weightExperience || 0));
  const weightedEducation = (educationScoreRaw * (weightEducation || 0));

  const weightedSum = weightedSkills + weightedKeywords + weightedExperience + weightedEducation;
  const totalScore = Math.round(Math.min(100, Math.max(0, (weightedSum / totalWeight) * 100)));

  return {
    totalScore,
    breakdown: {
      skills: Math.round((skillScoreRaw * 100)),
      keywords: Math.round((textScoreRaw * 100)),
      experience: Math.round((experienceScoreRaw * 100)),
      education: Math.round((educationScoreRaw * 100))
    },
    details: {
      matchedSkills,
      unmatchedSkills,
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
