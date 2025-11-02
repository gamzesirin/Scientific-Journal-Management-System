/**
 * Simple CV & Article Analyzer - Fallback when AI is not available
 * Extracts basic information from text without AI
 */

export interface SimpleCVAnalysis {
  research_areas: { area: string; weight: number }[];
  keywords: string[];
  technical_skills: string[];
  methodologies: string[];
  domains: string[];
  publications_count: number;
  h_index: number;
  years_of_experience: number;
  expertise_score: number;
  cv_analysis_summary: string;
  gemini_model_version: string;
  last_cv_processed_url: string;
}

// Common academic keywords and their domains
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  'Computer Science': ['computer science', 'cs', 'software', 'programming', 'algorithm', 'database', 'system', 'computing', 'computer', 'information technology'],
  'Machine Learning': ['machine learning', 'ml', 'deep learning', 'neural network', 'ai', 'artificial intelligence', 'reinforcement learning', 'supervised learning'],
  'Data Science': ['data science', 'data analysis', 'statistics', 'analytics', 'big data', 'data mining', 'business intelligence', 'predictive analytics'],
  'Software Engineering': ['software engineering', 'software development', 'agile', 'devops', 'testing', 'quality assurance', 'software architecture'],
  'Web Development': ['web development', 'frontend', 'backend', 'full stack', 'react', 'angular', 'node.js', 'javascript', 'html', 'css'],
  'Mobile Development': ['mobile development', 'android', 'ios', 'flutter', 'react native', 'mobile app'],
  'Cloud Computing': ['cloud computing', 'aws', 'azure', 'google cloud', 'cloud', 'distributed systems', 'microservices'],
  'Cybersecurity': ['cybersecurity', 'security', 'encryption', 'penetration testing', 'network security', 'information security'],
  'Engineering': ['engineering', 'design', 'development', 'optimization', 'manufacturing'],
  'Mathematics': ['mathematics', 'mathematical', 'algebra', 'calculus', 'geometry', 'statistics', 'probability'],
  'Physics': ['physics', 'quantum', 'mechanics', 'thermodynamics', 'optics', 'particle physics'],
  'Biology': ['biology', 'molecular', 'genetics', 'biotech', 'medical', 'biotechnology', 'genomics'],
  'Chemistry': ['chemistry', 'chemical', 'organic', 'inorganic', 'biochemistry', 'analytical chemistry'],
  'Economics': ['economics', 'finance', 'market', 'trade', 'business', 'econometrics', 'microeconomics'],
  'Psychology': ['psychology', 'cognitive', 'behavior', 'mental', 'behavioral science', 'neuroscience'],
  'Medicine': ['medicine', 'clinical', 'patient', 'healthcare', 'diagnosis', 'medical', 'health'],
  'Education': ['education', 'teaching', 'pedagogy', 'learning', 'curriculum', 'educational'],
  'Management': ['management', 'project management', 'leadership', 'strategy', 'business management'],
  'Marketing': ['marketing', 'digital marketing', 'advertising', 'branding', 'market research'],
  'Design': ['design', 'ui', 'ux', 'user experience', 'user interface', 'graphic design', 'product design'],
};

// Common technical skills - expanded list
const TECH_SKILLS = [
  // Programming Languages
  'Python', 'Java', 'C++', 'C#', 'C', 'JavaScript', 'TypeScript', 'PHP', 'Ruby', 'Go', 'Rust', 'Swift', 'Kotlin', 'Scala',
  'R', 'MATLAB', 'Julia', 'Perl', 'Shell', 'Bash', 'PowerShell',

  // Web Technologies
  'HTML', 'CSS', 'React', 'Angular', 'Vue.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'ASP.NET',
  'jQuery', 'Bootstrap', 'Tailwind', 'Next.js', 'Nuxt.js',

  // Mobile Development
  'Android', 'iOS', 'React Native', 'Flutter', 'Xamarin', 'Ionic',

  // Databases
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Oracle', 'SQL Server', 'Redis', 'Cassandra', 'DynamoDB', 'Firebase',

  // ML/AI Frameworks
  'TensorFlow', 'PyTorch', 'Keras', 'scikit-learn', 'OpenCV', 'NLTK', 'spaCy', 'Transformers', 'YOLO',

  // Data Science Tools
  'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Plotly', 'Jupyter', 'Anaconda',

  // Analytics & BI
  'Excel', 'SPSS', 'SAS', 'Tableau', 'Power BI', 'Looker', 'QlikView',

  // Cloud & DevOps
  'AWS', 'Azure', 'Google Cloud', 'GCP', 'Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Terraform', 'Ansible',

  // Version Control
  'Git', 'GitHub', 'GitLab', 'Bitbucket', 'SVN',

  // Testing
  'Jest', 'Mocha', 'Selenium', 'Cypress', 'JUnit', 'pytest',

  // Other Tools
  'Linux', 'Unix', 'Photoshop', 'Illustrator', 'Figma', 'Sketch', 'JIRA', 'Confluence',
];

// Common methodologies
const METHODOLOGIES = [
  'supervised learning', 'unsupervised learning', 'reinforcement learning',
  'experimental design', 'statistical analysis', 'regression',
  'classification', 'clustering', 'time series',
  'qualitative research', 'quantitative research', 'mixed methods',
];

export function analyzeSimpleCV(cvText: string, cvUrl: string): SimpleCVAnalysis {
  console.log('[Simple CV Analyzer] Starting basic CV analysis without AI...');
  console.log('[Simple CV Analyzer] CV text length:', cvText.length);

  const lowerText = cvText.toLowerCase();

  // Try to extract skills section specifically
  let skillsSection = '';
  const skillsMatch = cvText.match(/(?:skills?|yetkinlik|competenc|expertise)[\s\S]{0,50}?[:;\-]?([\s\S]{0,500}?)(?:\n\n|education|experience|work|projects?|publications?)/i);
  if (skillsMatch) {
    skillsSection = skillsMatch[1].toLowerCase();
    console.log('[Simple CV Analyzer] Found skills section:', skillsSection.substring(0, 200));
  }

  // PDF metadata blacklist - filter out PDF structural terms
  const pdfMetadataTerms = new Set([
    // PDF structure
    'endobj', 'obj', 'stream', 'endstream', 'xref', 'trailer', 'startxref',
    'structelem', 'feff', 'actualtext', 'fontdescriptor', 'fontfile',
    'structtreeroot', 'structparent', 'mcid', 'markinfo', 'marked',
    'catalog', 'page', 'pages', 'procset', 'font', 'resources',
    'contents', 'mediabox', 'cropbox', 'rotate', 'count', 'type',
    'subtype', 'filter', 'length', 'flatedecode', 'encoding',
    'widths', 'firstchar', 'lastchar', 'basefont', 'tounicode',
    'cidtogidmap', 'cidsysteminfo', 'descendantfonts', 'identity',
    'pdf', 'null', 'true', 'false', 'dict', 'array', 'name',

    // Font properties
    'ascent', 'descent', 'capheight', 'xheight', 'italicangle',
    'stemv', 'stemh', 'avgwidth', 'maxwidth', 'missingwidth',
    'fontbbox', 'fontname', 'fontfamily', 'fontweight', 'fontstretch',

    // Font types and names
    'cidfonttype', 'cidfont', 'truetype', 'type1', 'type3',
    'timesnewroman', 'timesnrmtpro', 'arial', 'helvetica', 'courier',

    // Color spaces
    'devicergb', 'devicegray', 'devicecmyk', 'iccbased', 'calrgb',

    // PDF specific
    'registry', 'ordering', 'supplement', 'adobe', 'creator', 'producer',
    'creationdate', 'moddate', 'keywords', 'author', 'title', 'subject',

    // Protocols and URLs
    'http', 'https', 'ftp', 'www', 'com', 'org', 'net',

    // Font styles
    'bold', 'italic', 'regular', 'semibold', 'medium', 'light', 'black',
    'roman', 'oblique', 'condensed', 'extended',

    // Misc PDF terms
    'viewerpreferences', 'displaydoctitle', 'group', 'extgstate',
  ]);

  // Extract keywords - prioritize skills section if available
  const textToAnalyze = skillsSection || lowerText;
  const words = textToAnalyze
    .replace(/[^a-z\s\+\#\.]/g, ' ') // Keep +, #, . for things like C++, C#, .NET
    .split(/\s+/)
    .filter(w => w.length > 2); // Only words longer than 2 chars

  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Get most frequent words (excluding common words and PDF metadata)
  const commonWords = new Set(['about', 'which', 'their', 'there', 'would', 'could', 'should', 'these', 'those', 'where', 'while', 'after', 'before', 'during', 'under', 'between', 'using', 'including', 'through', 'experience', 'work', 'years', 'skills', 'expertise', 'knowledge', 'university', 'education', 'research', 'project', 'team', 'responsible', 'developed', 'worked']);

  // Helper function to check if word looks like PDF metadata
  const isPDFMetadata = (word: string): boolean => {
    // Check blacklist
    if (pdfMetadataTerms.has(word)) return true;

    // Pattern-based checks for PDF metadata
    // Font names often end with 'pro', 'mt', 'std', or contain 'font'
    if (/^(times|arial|helv|courier|calibri|verdana|tahoma).*/i.test(word)) return true;
    if (/(font|glyph|bbox|cid|rgb|cmyk|gray)/.test(word)) return true;

    // PDF technical terms often have specific patterns
    if (/(descriptor|encoding|decode|unicode|parent|struct)/i.test(word)) return true;

    // Words with very few vowels are likely PDF metadata (e.g., 'feff', 'mcid')
    const vowels = word.match(/[aeiou]/g);
    const consonants = word.match(/[bcdfghjklmnpqrstvwxyz]/g);
    if (vowels && consonants && consonants.length > vowels.length * 3) return true;

    return false;
  };

  let keywords = Object.entries(wordFreq)
    .filter(([word, freq]) => {
      // Filter out:
      // 1. PDF metadata terms (blacklist + patterns)
      // 2. Common words
      // 3. Very short words
      // 4. Numbers-only words
      return freq >= (skillsSection ? 1 : 3)
        && !commonWords.has(word)
        && !isPDFMetadata(word)
        && word.length > 3
        && !/^\d+$/.test(word); // Exclude numbers-only
    })
    .sort((a, b) => b[1] - a[1])
    .slice(0, 30) // Get more initially
    .map(([word]) => word);

  // PRIORITIZE technical skills as keywords
  // Add detected technical skills to keywords (they are from actual CV content)
  const technicalSkillsLower = TECH_SKILLS.filter(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(cvText);
  }).map(s => s.toLowerCase());

  // Merge technical skills with extracted keywords, prioritizing technical skills
  keywords = [
    ...new Set([
      ...technicalSkillsLower, // Technical skills first
      ...keywords.filter(k => !technicalSkillsLower.includes(k)) // Then other keywords
    ])
  ].slice(0, 20); // Limit to 20 total

  console.log('[Simple CV Analyzer] Extracted keywords (filtered from CV content):', keywords);

  // Detect research domains with better scoring
  const detectedDomains: { area: string; weight: number; matches: number }[] = [];
  Object.entries(DOMAIN_KEYWORDS).forEach(([domain, domainKeywords]) => {
    let matchCount = 0;
    let matchedKeywords: string[] = [];

    domainKeywords.forEach(keyword => {
      // Use word boundary matching for better accuracy
      const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = cvText.match(regex);
      if (matches) {
        matchCount += matches.length;
        matchedKeywords.push(keyword);
      }
    });

    if (matchCount > 0) {
      // Give higher weight to domains with more keyword matches
      const weight = Math.min(0.3 + (matchCount / domainKeywords.length) * 0.7, 1);
      detectedDomains.push({ area: domain, weight, matches: matchCount });
    }
  });

  // Sort by both weight and match count
  const research_areas = detectedDomains
    .sort((a, b) => {
      if (Math.abs(b.weight - a.weight) > 0.1) return b.weight - a.weight;
      return b.matches - a.matches;
    })
    .slice(0, 5)
    .map(({ area, weight }) => ({ area, weight }));

  console.log('[Simple CV Analyzer] Detected research areas:', research_areas);

  // Detect technical skills with case-insensitive matching
  const technical_skills = TECH_SKILLS.filter(skill => {
    const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(cvText);
  });

  console.log('[Simple CV Analyzer] Detected technical skills:', technical_skills);

  // Detect methodologies
  const methodologies = METHODOLOGIES.filter(method =>
    lowerText.includes(method)
  );

  // Try to extract publication count (look for numbers near "publication", "paper", "article")
  let publications_count = 0;
  const pubMatches = cvText.match(/(\d+)\+?\s*(publications?|papers?|articles?|yayın)/i);
  if (pubMatches) {
    publications_count = parseInt(pubMatches[1]);
  } else {
    // Try to find publications section
    const pubSection = cvText.match(/(?:publications?|yayınlar)[\s\S]{0,50}?[:;\-]?([\s\S]{0,1000}?)(?:\n\n|education|experience|skills?|projects?)/i);
    if (pubSection) {
      // Count bullet points or numbered items in publications section
      const bullets = pubSection[1].match(/[\n•\-\*\d+\.]/g);
      publications_count = bullets ? Math.min(bullets.length, 50) : 0;
    } else {
      // Count occurrences of publication-related words as rough estimate
      const pubWords = ['published', 'publication', 'paper', 'article', 'journal', 'conference'];
      publications_count = pubWords.reduce((count, word) => {
        const matches = lowerText.match(new RegExp(`\\b${word}\\b`, 'g'));
        return count + (matches ? matches.length : 0);
      }, 0);
      publications_count = Math.min(Math.floor(publications_count / 2), 30); // Cap at 30
    }
  }

  // Try to extract h-index
  let h_index = 0;
  const hIndexMatch = cvText.match(/h[-\s]?index[:\s]+(\d+)/i);
  if (hIndexMatch) {
    h_index = parseInt(hIndexMatch[1]);
  } else {
    // Estimate based on publications
    h_index = Math.max(1, Math.floor(publications_count / 4));
  }

  // Estimate years of experience (look for years, PhD date, etc.)
  let years_of_experience = 0;
  const yearMatches = cvText.match(/(\d{4})\s*[-–—]\s*(\d{4}|present|current|halen)/gi);
  if (yearMatches && yearMatches.length > 0) {
    const currentYear = new Date().getFullYear();
    const years = yearMatches.map(m => {
      const match = m.match(/(\d{4})\s*[-–—]\s*(\d{4}|present|current|halen)/i);
      if (match) {
        const startYear = parseInt(match[1]);
        const endYear = match[2].match(/\d{4}/) ? parseInt(match[2]) : currentYear;
        return endYear - startYear;
      }
      return 0;
    });
    years_of_experience = Math.max(...years, 0);
  }

  // If no date ranges found, try to find first year mentioned
  if (years_of_experience === 0) {
    const allYears = cvText.match(/\b(19\d{2}|20[0-2]\d)\b/g);
    if (allYears && allYears.length > 0) {
      const firstYear = Math.min(...allYears.map(y => parseInt(y)));
      const currentYear = new Date().getFullYear();
      years_of_experience = Math.min(currentYear - firstYear, 40); // Cap at 40 years
    }
  }

  // Default to 3 years if nothing found
  if (years_of_experience === 0) {
    years_of_experience = 3;
  }

  // Calculate expertise score based on detected features
  let expertise_score = 0;
  expertise_score += research_areas.length * 12; // Up to 60 points for 5 areas
  expertise_score += Math.min(technical_skills.length * 2, 20); // Up to 20 points
  expertise_score += Math.min(publications_count / 2, 10); // Up to 10 points
  expertise_score += Math.min(years_of_experience, 10); // Up to 10 points
  expertise_score = Math.min(Math.round(expertise_score), 100);

  // Create a meaningful summary
  const topAreas = research_areas.slice(0, 3).map(r => r.area).join(', ');
  const topSkills = technical_skills.slice(0, 5).join(', ');

  let summary = `CV'den ${research_areas.length} araştırma alanı ve ${technical_skills.length} teknik yetkinlik tespit edildi.`;

  if (topAreas) {
    summary += ` Başlıca araştırma alanları: ${topAreas}.`;
  }

  if (topSkills) {
    summary += ` Teknik yetkinlikler: ${topSkills}.`;
  }

  if (publications_count > 0) {
    summary += ` Yaklaşık ${publications_count} yayın.`;
  }

  if (years_of_experience > 0) {
    summary += ` ${years_of_experience} yıl deneyim.`;
  }

  const result = {
    research_areas,
    keywords,
    technical_skills,
    methodologies,
    domains: research_areas.map(r => r.area),
    publications_count,
    h_index,
    years_of_experience,
    expertise_score,
    cv_analysis_summary: summary,
    gemini_model_version: 'simple-text-analysis-v1',
    last_cv_processed_url: cvUrl,
  };

  console.log('[Simple CV Analyzer] Analysis complete:');
  console.log('- Research Areas:', research_areas.length);
  console.log('- Keywords:', keywords.length);
  console.log('- Technical Skills:', technical_skills.length);
  console.log('- Publications:', publications_count);
  console.log('- Expertise Score:', expertise_score);

  return result;
}

/**
 * Simple Article Analyzer - Fallback when AI is not available
 */
export interface SimpleArticleAnalysis {
  main_topics: { topic: string; relevance: number }[];
  keywords: string[];
  methodology: string;
  research_domain: string;
  complexity_level: string;
  analysis_summary: string;
  gemini_model_version: string;
}

export function analyzeSimpleArticle(
  title: string,
  abstract: string,
  fullTextExcerpt?: string
): SimpleArticleAnalysis {
  console.log('[Simple Article Analyzer] Starting basic article analysis without AI...');

  const combinedText = `${title} ${abstract} ${fullTextExcerpt || ''}`;
  const lowerText = combinedText.toLowerCase();

  // Extract keywords from title and abstract
  const words = combinedText
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4)
    .map(w => w.toLowerCase());

  const wordFreq: Record<string, number> = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  const commonWords = new Set(['about', 'which', 'their', 'there', 'would', 'could', 'should', 'these', 'those', 'where', 'while', 'after', 'before', 'during', 'under', 'between', 'using', 'based', 'study', 'research', 'paper', 'article', 'results', 'analysis']);

  const keywords = Object.entries(wordFreq)
    .filter(([word, freq]) => freq > 1 && !commonWords.has(word) && word.length > 4)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  console.log('[Simple Article Analyzer] Extracted keywords:', keywords);

  // Detect research domains (same as CV)
  const detectedDomains: { topic: string; relevance: number }[] = [];
  Object.entries(DOMAIN_KEYWORDS).forEach(([domain, domainKeywords]) => {
    let matchCount = 0;
    domainKeywords.forEach(keyword => {
      if (lowerText.includes(keyword)) {
        matchCount++;
      }
    });

    if (matchCount > 0) {
      const relevance = Math.min(0.5 + (matchCount / domainKeywords.length) * 0.5, 1);
      detectedDomains.push({ topic: domain, relevance });
    }
  });

  const main_topics = detectedDomains
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 3);

  console.log('[Simple Article Analyzer] Detected topics:', main_topics);

  // Detect methodology
  let methodology = 'Not specified';
  if (lowerText.includes('experiment') || lowerText.includes('experimental')) {
    methodology = 'Experimental';
  } else if (lowerText.includes('survey') || lowerText.includes('questionnaire')) {
    methodology = 'Survey';
  } else if (lowerText.includes('theoretical') || lowerText.includes('theory')) {
    methodology = 'Theoretical';
  } else if (lowerText.includes('review') || lowerText.includes('systematic')) {
    methodology = 'Literature Review';
  } else if (lowerText.includes('case study')) {
    methodology = 'Case Study';
  } else if (lowerText.includes('simulation') || lowerText.includes('model')) {
    methodology = 'Simulation/Modeling';
  }

  // Determine research domain
  const research_domain = main_topics.length > 0 ? main_topics[0].topic : 'General';

  // Estimate complexity
  let complexity_level = 'intermediate';
  const technicalWords = ['algorithm', 'optimization', 'neural', 'quantum', 'advanced', 'novel', 'complex'];
  const techCount = technicalWords.filter(word => lowerText.includes(word)).length;

  if (techCount > 3) {
    complexity_level = 'advanced';
  } else if (techCount < 2) {
    complexity_level = 'basic';
  }

  const summary = `Makale "${title}" başlıklı bir ${research_domain} çalışması. ${methodology} metodolojisi kullanılmış. ${keywords.length} anahtar kelime tespit edildi.`;

  const result: SimpleArticleAnalysis = {
    main_topics,
    keywords,
    methodology,
    research_domain,
    complexity_level,
    analysis_summary: summary,
    gemini_model_version: 'simple-text-analysis-v1',
  };

  console.log('[Simple Article Analyzer] Analysis complete:');
  console.log('- Main Topics:', main_topics.length);
  console.log('- Keywords:', keywords.length);
  console.log('- Methodology:', methodology);
  console.log('- Research Domain:', research_domain);

  return result;
}

/**
 * Simple Matching Score Calculator - Fallback when AI is not available
 */
export interface SimpleMatchingScore {
  overall_match_score: number;
  topic_similarity_score: number;
  keyword_overlap_score: number;
  methodology_match_score: number;
  domain_expertise_score: number;
  matching_keywords: string[];
  matching_topics: string[];
  mismatch_reasons: string[];
  recommendation_level: string;
  confidence_score: number;
  explanation: string;
  gemini_model_version: string;
}

export function calculateSimpleMatchingScore(
  reviewerProfile: any,
  articleAnalysis: any
): SimpleMatchingScore {
  console.log('[Simple Matching] Calculating matching score without AI...');

  const reviewerKeywords = (reviewerProfile.keywords || []).map((k: string) => k.toLowerCase());
  const articleKeywords = (articleAnalysis.keywords || []).map((k: string) => k.toLowerCase());

  const reviewerDomains = (reviewerProfile.domains || []).map((d: string) => d.toLowerCase());
  const articleDomain = (articleAnalysis.research_domain || '').toLowerCase();

  // Calculate keyword overlap
  const matchingKeywords = reviewerKeywords.filter((k: string) =>
    articleKeywords.some(ak => ak.includes(k) || k.includes(ak))
  );

  const keyword_overlap_score = reviewerKeywords.length > 0
    ? (matchingKeywords.length / reviewerKeywords.length) * 100
    : 0;

  console.log('[Simple Matching] Keyword overlap:', matchingKeywords.length, '/', reviewerKeywords.length);

  // Calculate topic similarity
  const reviewerTopics = (reviewerProfile.research_areas || []).map((r: any) => r.area.toLowerCase());
  const articleTopics = (articleAnalysis.main_topics || []).map((t: any) => t.topic.toLowerCase());

  const matchingTopics = reviewerTopics.filter((rt: string) =>
    articleTopics.some(at => at.includes(rt) || rt.includes(at))
  );

  const topic_similarity_score = reviewerTopics.length > 0
    ? (matchingTopics.length / reviewerTopics.length) * 100
    : 0;

  console.log('[Simple Matching] Topic similarity:', matchingTopics.length, '/', reviewerTopics.length);

  // Calculate domain expertise
  const domainMatch = reviewerDomains.some((d: string) => articleDomain.includes(d) || d.includes(articleDomain));
  const domain_expertise_score = domainMatch ? 85 : 30;

  // Calculate methodology match (if available)
  const reviewerMethodologies = (reviewerProfile.methodologies || []).map((m: string) => m.toLowerCase());
  const articleMethodology = (articleAnalysis.methodology || '').toLowerCase();

  const methodologyMatch = reviewerMethodologies.some((m: string) =>
    articleMethodology.includes(m) || m.includes(articleMethodology)
  );

  const methodology_match_score = methodologyMatch ? 75 : 40;

  // Calculate overall score (weighted average)
  const overall_match_score = Math.round(
    (topic_similarity_score * 0.3) +
    (keyword_overlap_score * 0.3) +
    (domain_expertise_score * 0.25) +
    (methodology_match_score * 0.15)
  );

  // Determine recommendation level
  let recommendation_level = 'low';
  if (overall_match_score >= 80) {
    recommendation_level = 'excellent';
  } else if (overall_match_score >= 60) {
    recommendation_level = 'good';
  } else if (overall_match_score >= 40) {
    recommendation_level = 'moderate';
  }

  // Calculate confidence score
  const dataQuality = (reviewerKeywords.length + reviewerTopics.length) / 10;
  const confidence_score = Math.min(Math.round(overall_match_score * 0.7 + dataQuality * 30), 100);

  const explanation = `Basit metin analizi: ${matchingKeywords.length} anahtar kelime ve ${matchingTopics.length} konu eşleşmesi bulundu. ${domainMatch ? 'Alan uzmanlığı uyumlu.' : 'Alan uzmanlığı kısmen uyumlu.'}`;

  const result: SimpleMatchingScore = {
    overall_match_score,
    topic_similarity_score: Math.round(topic_similarity_score),
    keyword_overlap_score: Math.round(keyword_overlap_score),
    methodology_match_score,
    domain_expertise_score,
    matching_keywords,
    matching_topics: reviewerTopics.filter((rt: string) =>
      articleTopics.some(at => at.includes(rt) || rt.includes(at))
    ),
    mismatch_reasons: overall_match_score < 60 ? ['Limited keyword/topic overlap'] : [],
    recommendation_level,
    confidence_score,
    explanation,
    gemini_model_version: 'simple-text-analysis-v1',
  };

  console.log('[Simple Matching] Overall match score:', overall_match_score, '%');
  console.log('[Simple Matching] Recommendation:', recommendation_level);

  return result;
}
