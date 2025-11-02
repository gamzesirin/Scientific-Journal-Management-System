import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

// Force mock mode when API is not accessible or configured
const FORCE_MOCK = process.env.GEMINI_MOCK_MODE === 'true' || process.env.FORCE_MOCK_MODE === 'true';
const MOCK_MODE = FORCE_MOCK; // Disable auto-mock in development, always try to use real API first

// Lazy initialization to avoid module-level errors
let _genAI: GoogleGenerativeAI | null = null;
let _model: GenerativeModel | null = null;

// Track if API is accessible
let API_ACCESSIBLE = true;
let LAST_API_CHECK = 0;
const API_CHECK_INTERVAL = 60000; // Check every minute

function getGeminiModel(): GenerativeModel | null {
  if (!_model) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    console.log('[Gemini] Initializing Gemini client...');
    console.log('[Gemini] API Key present:', !!apiKey);
    console.log('[Gemini] API Key (first 10 chars):', apiKey ? apiKey.substring(0, 10) + '...' : 'NOT SET');
    console.log('[Gemini] Mock Mode:', MOCK_MODE);
    console.log('[Gemini] API Accessible:', API_ACCESSIBLE);

    if (!apiKey && !MOCK_MODE) {
      console.error('[Gemini] GEMINI_API_KEY is not set in environment variables');
      console.log('[Gemini] Checked: process.env.GEMINI_API_KEY and process.env.NEXT_PUBLIC_GEMINI_API_KEY');
      console.log('[Gemini] Switching to MOCK mode due to missing API key');
      return null;
    }

    if (!MOCK_MODE && API_ACCESSIBLE) {
      try {
        _genAI = new GoogleGenerativeAI(apiKey!);
        _model = _genAI.getGenerativeModel({ model: GEMINI_MODEL });
        console.log('[Gemini] Client initialized successfully');
      } catch (error) {
        console.error('[Gemini] Failed to initialize client:', error);
        API_ACCESSIBLE = false;
        LAST_API_CHECK = Date.now();
        return null;
      }
    }
  }
  return _model;
}

export const GEMINI_MODEL = 'gemini-pro'; // Using the stable Gemini Pro model

/**
 * Generate mock analysis data for testing/development
 */
function generateMockCVAnalysis(cvText: string, cvUrl: string) {
  console.log('==================================================');
  console.log('[Gemini] ⚠️ MOCK MODE ACTIVE - NO REAL API CALL');
  console.log('==================================================');
  console.log('[Gemini] Generating MOCK CV analysis (no API call)');
  console.log('[Gemini] Reason: API not accessible or credentials missing');
  console.log('==================================================');

  // Generate some pseudo-random but consistent data based on input
  const hash = cvText.length + cvUrl.length;
  const score = 60 + (hash % 30); // Score between 60-90

  const mockData = {
    research_areas: [
      { area: "TEST DATA - Computer Science", weight: 0.9 },
      { area: "TEST DATA - Machine Learning", weight: 0.8 },
      { area: "TEST DATA - Artificial Intelligence", weight: 0.7 }
    ],
    keywords: [
      "TEST-machine-learning", "TEST-deep-learning", "TEST-neural-networks",
      "TEST-data-science", "TEST-computer-vision", "TEST-NLP", "TEST-AI",
      "TEST-Python", "TEST-TensorFlow", "TEST-research"
    ],
    technical_skills: ["TEST-Python", "TEST-R", "TEST-MATLAB", "TEST-TensorFlow", "TEST-PyTorch", "TEST-SQL"],
    methodologies: ["TEST-supervised-learning", "TEST-unsupervised-learning", "TEST-experimental-design", "TEST-statistical-analysis"],
    domains: ["TEST-Computer-Science", "TEST-Artificial-Intelligence", "TEST-Data-Science"],
    publications_count: 10 + (hash % 20),
    h_index: 5 + (hash % 10),
    years_of_experience: 3 + (hash % 7),
    expertise_score: score,
    cv_analysis_summary: "⚠️ TEST DATA - Bu gerçek CV analizi DEĞİLDİR. Mock/test verisi kullanılmaktadır. Gerçek analiz için Gemini API bağlantısı gereklidir.",
    gemini_model_version: "mock-model-test",
    last_cv_processed_url: cvUrl,
  };

  console.log('==================================================');
  console.log('[Gemini] MOCK DATA GENERATED:');
  console.log('==================================================');
  console.log(JSON.stringify(mockData, null, 2));
  console.log('==================================================');
  console.log('[Gemini] ⚠️ This is TEST DATA, not real CV analysis!');
  console.log('==================================================');

  return mockData;
}

/**
 * Analyzes a CV PDF and extracts structured expertise information
 */
export async function analyzeCVWithAI(cvText: string, cvUrl: string) {
  console.log('[Gemini] Starting CV analysis...');
  console.log('[Gemini] CV text length:', cvText.length);
  console.log('[Gemini] CV URL:', cvUrl);

  // Check if we should retry API access
  if (!API_ACCESSIBLE && Date.now() - LAST_API_CHECK > API_CHECK_INTERVAL) {
    console.log('[Gemini] Retrying API access...');
    API_ACCESSIBLE = true;
    _model = null; // Reset model to force re-initialization
  }

  // Use simple text analysis if API is not accessible
  if (MOCK_MODE || !API_ACCESSIBLE) {
    console.log('[Gemini] API not accessible - using simple text analysis instead of mock data');
    console.log('[Gemini] MOCK_MODE:', MOCK_MODE);
    console.log('[Gemini] API_ACCESSIBLE:', API_ACCESSIBLE);

    // Import and use simple CV analyzer
    const { analyzeSimpleCV } = await import('./simple-cv-analyzer');
    return analyzeSimpleCV(cvText, cvUrl);
  }

  try {
    const prompt = `You are an expert in analyzing academic CVs and research profiles.
Analyze the following CV text and extract structured information about the researcher's expertise.

CV Text:
${cvText}

Extract and return a JSON object with the following structure:
{
  "research_areas": [
    {"area": "Machine Learning", "weight": 0.9},
    {"area": "Natural Language Processing", "weight": 0.8}
  ],
  "keywords": ["deep learning", "transformers", "neural networks", "NLP"],
  "technical_skills": ["Python", "PyTorch", "TensorFlow", "scikit-learn"],
  "methodologies": ["supervised learning", "transfer learning", "fine-tuning"],
  "domains": ["Computer Science", "Artificial Intelligence"],
  "publications_count": 15,
  "h_index": 8,
  "years_of_experience": 5,
  "expertise_score": 85,
  "summary": "Brief 2-3 sentence summary of the researcher's expertise"
}

Guidelines:
- Assign weights (0-1) to research areas based on prominence in CV
- Extract 10-20 most relevant keywords
- Publications count should be approximate if not explicitly stated
- H-index should be estimated based on publication quality/venues if not stated
- Years of experience calculated from graduation/first publication
- Expertise score (0-100) is overall assessment of research maturity
- Be conservative with estimates
- Focus on research-relevant information

Return ONLY valid JSON, no additional text.`;

    const model = getGeminiModel();

    // If model is null, use mock mode
    if (!model) {
      console.log('[Gemini] Model initialization failed, switching to mock mode');
      API_ACCESSIBLE = false;
      LAST_API_CHECK = Date.now();
      return generateMockCVAnalysis(cvText, cvUrl);
    }

    console.log('[Gemini] Calling Gemini API with model:', GEMINI_MODEL);

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      }
    });

    console.log('[Gemini] API response received');

    const response = result.response;
    const text = response.text();

    if (!text) {
      console.error('[Gemini] No content in Gemini response');
      throw new Error('No content in Gemini response');
    }

    console.log('[Gemini] Parsing JSON response...');
    const analysis = JSON.parse(text);
    console.log('[Gemini] Analysis parsed successfully');

    // Log raw AI response
    console.log('==================================================');
    console.log('[Gemini] RAW AI RESPONSE FROM GEMINI:');
    console.log('==================================================');
    console.log(JSON.stringify(analysis, null, 2));
    console.log('==================================================');

    const formattedResult = {
      research_areas: analysis.research_areas || [],
      keywords: analysis.keywords || [],
      technical_skills: analysis.technical_skills || [],
      methodologies: analysis.methodologies || [],
      domains: analysis.domains || [],
      publications_count: analysis.publications_count || 0,
      h_index: analysis.h_index || 0,
      years_of_experience: analysis.years_of_experience || 0,
      expertise_score: analysis.expertise_score || 0,
      cv_analysis_summary: analysis.summary || '',
      gemini_model_version: GEMINI_MODEL,
      last_cv_processed_url: cvUrl,
    };

    console.log('[Gemini] Formatted result for database storage');
    return formattedResult;
  } catch (error: any) {
    console.error('[Gemini] Error analyzing CV:', error);

    // Handle network/fetch failures
    if (error?.message?.includes('fetch failed') || error?.message?.includes('network')) {
      console.error('[Gemini] NETWORK ERROR - Cannot reach Gemini API');
      console.log('[Gemini] This might be due to:');
      console.log('[Gemini] 1. Firewall or proxy blocking the connection');
      console.log('[Gemini] 2. Regional restrictions');
      console.log('[Gemini] 3. Invalid API key');
      console.log('[Gemini] Using simple text analysis instead');

      API_ACCESSIBLE = false;
      LAST_API_CHECK = Date.now();

      const { analyzeSimpleCV } = await import('./simple-cv-analyzer');
      return analyzeSimpleCV(cvText, cvUrl);
    }

    // Check for quota exceeded error
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota')) {
      console.error('[Gemini] QUOTA EXCEEDED - API limit reached');
      console.log('[Gemini] Using simple text analysis instead');

      API_ACCESSIBLE = false;
      LAST_API_CHECK = Date.now();

      const { analyzeSimpleCV } = await import('./simple-cv-analyzer');
      return analyzeSimpleCV(cvText, cvUrl);
    }

    // Check for authentication errors
    if (error?.status === 401 || error?.message?.includes('401') || error?.message?.includes('API key')) {
      console.error('[Gemini] AUTHENTICATION ERROR - Invalid API key');
      console.log('[Gemini] Using simple text analysis instead');

      API_ACCESSIBLE = false;
      LAST_API_CHECK = Date.now();

      const { analyzeSimpleCV } = await import('./simple-cv-analyzer');
      return analyzeSimpleCV(cvText, cvUrl);
    }

    // Check for model not found errors
    if (error?.status === 404 || error?.message?.includes('404') || error?.message?.includes('not found')) {
      console.error('[Gemini] MODEL NOT FOUND - The specified model does not exist');
      console.log('[Gemini] Using simple text analysis instead');

      API_ACCESSIBLE = false;
      LAST_API_CHECK = Date.now();

      const { analyzeSimpleCV } = await import('./simple-cv-analyzer');
      return analyzeSimpleCV(cvText, cvUrl);
    }

    // For any other errors, use simple text analysis
    console.error('[Gemini] Unexpected error, using simple text analysis');
    console.error('[Gemini] Error details:', error.message);
    API_ACCESSIBLE = false;
    LAST_API_CHECK = Date.now();

    const { analyzeSimpleCV } = await import('./simple-cv-analyzer');
    return analyzeSimpleCV(cvText, cvUrl);
  }
}

/**
 * Analyzes an article's title and abstract to extract topics and keywords
 */
export async function analyzeArticleWithAI(
  title: string,
  abstract: string,
  fullTextExcerpt?: string
) {
  console.log('[Gemini] Starting article analysis...');

  // Check if we should retry API access
  if (!API_ACCESSIBLE && Date.now() - LAST_API_CHECK > API_CHECK_INTERVAL) {
    console.log('[Gemini] Retrying API access...');
    API_ACCESSIBLE = true;
    _model = null; // Reset model to force re-initialization
  }

  // Use simple text analysis if API is not accessible
  if (MOCK_MODE || !API_ACCESSIBLE) {
    console.log('[Gemini] API not accessible - using simple text analysis for article');

    // Import and use simple article analyzer
    const { analyzeSimpleArticle } = await import('./simple-cv-analyzer');
    return analyzeSimpleArticle(title, abstract, fullTextExcerpt);
  }

  try {
    const text = `Title: ${title}\n\nAbstract: ${abstract}${
      fullTextExcerpt ? `\n\nExcerpt: ${fullTextExcerpt}` : ''
    }`;

    const prompt = `You are an expert in analyzing academic research papers.
Analyze the following article and extract structured information.

${text}

Extract and return a JSON object with the following structure:
{
  "main_topics": [
    {"topic": "Machine Learning", "relevance": 0.95},
    {"topic": "Computer Vision", "relevance": 0.8}
  ],
  "keywords": ["deep learning", "image classification", "CNN"],
  "methodology": "Experimental/Theoretical/Survey/Case Study",
  "research_domain": "Computer Science",
  "complexity_level": "basic/intermediate/advanced",
  "summary": "Brief 2-3 sentence summary"
}

Guidelines:
- Identify 3-5 main topics with relevance scores (0-1)
- Extract 10-15 most important keywords
- Methodology should describe the research approach
- Research domain should be the primary field
- Complexity level based on technical depth
- Summary should capture the core contribution

Return ONLY valid JSON, no additional text.`;

    const model = getGeminiModel();

    // If model is null, use mock mode
    if (!model) {
      console.log('[Gemini] Model initialization failed for article analysis, using mock mode');
      API_ACCESSIBLE = false;
      LAST_API_CHECK = Date.now();
      return {
        main_topics: [
          { topic: "Computer Science", relevance: 0.9 },
          { topic: "Machine Learning", relevance: 0.8 }
        ],
        keywords: ["artificial intelligence", "machine learning", "deep learning"],
        methodology: "Experimental",
        research_domain: "Computer Science",
        complexity_level: "intermediate",
        analysis_summary: "Mock analysis: Article analysis unavailable due to API issues.",
        gemini_model_version: "mock-model"
      };
    }

    console.log('[Gemini] Calling Gemini API for article analysis');

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      }
    });

    const response = result.response;
    const responseText = response.text();

    if (!responseText) {
      throw new Error('No content in Gemini response');
    }

    const analysis = JSON.parse(responseText);

    // Log article analysis details
    console.log('==================================================');
    console.log('[Gemini] ARTICLE ANALYSIS RESULT:');
    console.log('==================================================');
    console.log('Title:', title.substring(0, 100));
    console.log('Main Topics:', analysis.main_topics?.map((t: any) => `${t.topic} (${t.relevance})`).join(', '));
    console.log('Keywords:', analysis.keywords?.join(', '));
    console.log('Methodology:', analysis.methodology);
    console.log('Research Domain:', analysis.research_domain);
    console.log('Complexity Level:', analysis.complexity_level);
    console.log('Summary:', analysis.summary);
    if (fullTextExcerpt) {
      console.log('Full Text Analyzed: YES (', fullTextExcerpt.length, 'chars used)');
    } else {
      console.log('Full Text Analyzed: NO (only title and abstract)');
    }
    console.log('==================================================');

    return {
      main_topics: analysis.main_topics || [],
      keywords: analysis.keywords || [],
      methodology: analysis.methodology || 'Not specified',
      research_domain: analysis.research_domain || 'General',
      complexity_level: analysis.complexity_level || 'intermediate',
      analysis_summary: analysis.summary || '',
      gemini_model_version: GEMINI_MODEL,
    };
  } catch (error: any) {
    console.error('[Gemini] Error analyzing article:', error);

    // Handle all errors by falling back to simple text analysis
    console.log('[Gemini] Error in article analysis, using simple text analysis');
    API_ACCESSIBLE = false;
    LAST_API_CHECK = Date.now();

    const { analyzeSimpleArticle } = await import('./simple-cv-analyzer');
    return analyzeSimpleArticle(title, abstract, fullTextExcerpt);
  }
}

/**
 * Calculates matching score between a reviewer profile and article
 */
export async function calculateMatchingScore(
  reviewerProfile: any,
  articleAnalysis: any
) {
  console.log('[Gemini] Calculating matching score...');
  console.log('[Gemini] Reviewer:', reviewerProfile.users?.name || 'Unknown');
  console.log('[Gemini] Article Topics:', articleAnalysis.main_topics?.map((t: any) => t.topic).join(', '));

  // Check if we should retry API access
  if (!API_ACCESSIBLE && Date.now() - LAST_API_CHECK > API_CHECK_INTERVAL) {
    console.log('[Gemini] Retrying API access...');
    API_ACCESSIBLE = true;
    _model = null; // Reset model to force re-initialization
  }

  // Use simple matching if API is not accessible
  if (MOCK_MODE || !API_ACCESSIBLE) {
    console.log('[Gemini] API not accessible - using simple matching calculation');

    // Import and use simple matching calculator
    const { calculateSimpleMatchingScore } = await import('./simple-cv-analyzer');
    return calculateSimpleMatchingScore(reviewerProfile, articleAnalysis);
  }

  try {
    const prompt = `You are an expert in matching academic reviewers to research papers.

Reviewer Profile:
- Research Areas: ${JSON.stringify(reviewerProfile.research_areas)}
- Keywords: ${JSON.stringify(reviewerProfile.keywords)}
- Technical Skills: ${JSON.stringify(reviewerProfile.technical_skills)}
- Methodologies: ${JSON.stringify(reviewerProfile.methodologies)}
- Domains: ${JSON.stringify(reviewerProfile.domains)}
- Publications: ${reviewerProfile.publications_count}
- H-Index: ${reviewerProfile.h_index}
- Experience: ${reviewerProfile.years_of_experience} years

Article Analysis:
- Main Topics: ${JSON.stringify(articleAnalysis.main_topics)}
- Keywords: ${JSON.stringify(articleAnalysis.keywords)}
- Methodology: ${articleAnalysis.methodology}
- Domain: ${articleAnalysis.research_domain}
- Complexity: ${articleAnalysis.complexity_level}

Calculate matching scores and return JSON:
{
  "overall_match_score": 85,
  "topic_similarity_score": 90,
  "keyword_overlap_score": 80,
  "methodology_match_score": 85,
  "domain_expertise_score": 95,
  "matching_keywords": ["machine learning", "deep learning"],
  "matching_topics": ["Artificial Intelligence", "Neural Networks"],
  "mismatch_reasons": ["Article requires more biology expertise"],
  "recommendation_level": "excellent/good/moderate/low",
  "confidence_score": 85,
  "explanation": "Brief explanation of the match quality"
}

Scoring Guidelines:
- All scores 0-100
- overall_match_score is weighted average of other scores
- Consider topic overlap, keyword matches, methodology alignment
- Higher experience/h-index reviewers better for complex papers
- recommendation_level: excellent (80+), good (60-79), moderate (40-59), low (<40)
- confidence_score based on data quality and clarity of match

Return ONLY valid JSON.`;

    const model = getGeminiModel();

    // If model is null, use mock mode
    if (!model) {
      console.log('[Gemini] Model initialization failed for matching score, using mock mode');
      API_ACCESSIBLE = false;
      LAST_API_CHECK = Date.now();
      return {
        overall_match_score: 75,
        topic_similarity_score: 80,
        keyword_overlap_score: 70,
        methodology_match_score: 75,
        domain_expertise_score: 85,
        matching_keywords: ["machine learning", "AI", "research"],
        matching_topics: ["Computer Science", "Artificial Intelligence"],
        mismatch_reasons: [],
        recommendation_level: "good",
        confidence_score: 80,
        explanation: "Mock analysis: Using simulated matching score.",
        gemini_model_version: "mock-model"
      };
    }

    console.log('[Gemini] Calling Gemini API for matching score');

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      }
    });

    const response = result.response;
    const responseText = response.text();

    if (!responseText) {
      throw new Error('No content in Gemini response');
    }

    const scores = JSON.parse(responseText);

    // Log matching score details
    console.log('==================================================');
    console.log('[Gemini] MATCHING SCORE CALCULATION RESULT:');
    console.log('==================================================');
    console.log('Reviewer:', reviewerProfile.users?.name);
    console.log('Overall Match Score:', scores.overall_match_score, '%');
    console.log('Topic Similarity:', scores.topic_similarity_score, '%');
    console.log('Keyword Overlap:', scores.keyword_overlap_score, '%');
    console.log('Methodology Match:', scores.methodology_match_score, '%');
    console.log('Domain Expertise:', scores.domain_expertise_score, '%');
    console.log('Recommendation Level:', scores.recommendation_level);
    console.log('Confidence Score:', scores.confidence_score, '%');
    console.log('Matching Keywords:', scores.matching_keywords?.join(', '));
    console.log('Matching Topics:', scores.matching_topics?.join(', '));
    if (scores.mismatch_reasons && scores.mismatch_reasons.length > 0) {
      console.log('Mismatch Reasons:', scores.mismatch_reasons.join(', '));
    }
    console.log('Explanation:', scores.explanation);
    console.log('==================================================');

    return {
      overall_match_score: scores.overall_match_score || 0,
      topic_similarity_score: scores.topic_similarity_score || 0,
      keyword_overlap_score: scores.keyword_overlap_score || 0,
      methodology_match_score: scores.methodology_match_score || 0,
      domain_expertise_score: scores.domain_expertise_score || 0,
      matching_keywords: scores.matching_keywords || [],
      matching_topics: scores.matching_topics || [],
      mismatch_reasons: scores.mismatch_reasons || [],
      recommendation_level: scores.recommendation_level || 'moderate',
      confidence_score: scores.confidence_score || 0,
      explanation: scores.explanation || '',
      gemini_model_version: GEMINI_MODEL,
    };
  } catch (error: any) {
    console.error('[Gemini] Error calculating matching score:', error);

    // Always fallback to simple matching calculation for any error
    console.log('[Gemini] Error in matching score calculation, using simple text matching');
    API_ACCESSIBLE = false;
    LAST_API_CHECK = Date.now();

    const { calculateSimpleMatchingScore } = await import('./simple-cv-analyzer');
    return calculateSimpleMatchingScore(reviewerProfile, articleAnalysis);
  }
}