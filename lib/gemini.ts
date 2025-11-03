import { GoogleGenAI } from '@google/genai'

export const GEMINI_MODEL = 'models/gemini-2.5-flash' // Using Gemini 2.5 Flash (stable version)

// Initialize Gemini client
let _genAI: GoogleGenAI | null = null

function getGeminiClient(): GoogleGenAI {
	if (!_genAI) {
		console.log('[Gemini] 🔍 Environment check:')
		console.log('[Gemini] - process.env.GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET ✓' : 'NOT SET ✗')
		console.log(
			'[Gemini] - process.env.NEXT_PUBLIC_GEMINI_API_KEY:',
			process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'SET ✓' : 'NOT SET ✗'
		)

		const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

		if (!apiKey) {
			console.error('[Gemini] ❌ CRITICAL: No API key found in environment!')
			console.error('[Gemini] Checked variables: GEMINI_API_KEY, NEXT_PUBLIC_GEMINI_API_KEY')
			throw new Error('GEMINI_API_KEY is not set in environment variables')
		}

		console.log('[Gemini] ✓ API Key found:', apiKey.substring(0, 15) + '...' + apiKey.substring(apiKey.length - 4))
		console.log('[Gemini] ✓ API Key length:', apiKey.length, 'characters')
		console.log('[Gemini] ✓ Initializing client with model:', GEMINI_MODEL)

		_genAI = new GoogleGenAI({ apiKey })
		console.log('[Gemini] ✓ Client initialized successfully')
	}

	return _genAI
}

/**
 * Safely parse JSON from Gemini response
 * Handles common JSON formatting issues
 */
function safeJSONParse(text: string): any {
	try {
		// Remove markdown code blocks if present
		let cleanedText = text.trim()

		// Remove ```json and ``` markers
		if (cleanedText.startsWith('```json')) {
			cleanedText = cleanedText.substring(7)
		}
		if (cleanedText.startsWith('```')) {
			cleanedText = cleanedText.substring(3)
		}
		if (cleanedText.endsWith('```')) {
			cleanedText = cleanedText.substring(0, cleanedText.length - 3)
		}

		cleanedText = cleanedText.trim()

		// Try to parse
		return JSON.parse(cleanedText)
	} catch (error: any) {
		console.error('[Gemini] JSON Parse Error:', error.message)
		console.error('[Gemini] Problematic text (first 500 chars):', text.substring(0, 500))
		console.error('[Gemini] Problematic text (last 500 chars):', text.substring(Math.max(0, text.length - 500)))
		throw new Error(`Failed to parse JSON response: ${error.message}`)
	}
}

/**
 * Analyzes a CV PDF and extracts structured expertise information
 */
export async function analyzeCVWithAI(cvText: string, cvUrl: string) {
	console.log('[Gemini] Starting CV analysis...')
	console.log('[Gemini] CV text length:', cvText.length)

	try {
		const prompt = `You are an expert in analyzing academic CVs and research profiles.
Analyze the following CV text and extract structured information about the researcher's expertise.

CV Text:
${cvText.substring(0, 8000)}

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
  "summary": "Brief 2-3 sentence summary"
}

IMPORTANT JSON RULES:
- Use double quotes for strings
- Escape special characters in strings (quotes, newlines, backslashes)
- Keep summary text short and simple
- No line breaks inside string values
- Return ONLY valid JSON, no markdown formatting, no code blocks

Guidelines:
- Assign weights (0-1) to research areas based on prominence in CV
- Extract 10-20 most relevant keywords
- Publications count should be approximate if not explicitly stated
- H-index should be estimated based on publication quality/venues if not stated
- Years of experience calculated from graduation/first publication
- Expertise score (0-100) is overall assessment of research maturity
- Be conservative with estimates
- Focus on research-relevant information`

		const client = getGeminiClient()

		console.log('[Gemini] ══════════════════════════════════════════════')
		console.log('[Gemini] 🚀 API CALL DETAILS (CV Analysis):')
		console.log('[Gemini] ══════════════════════════════════════════════')
		console.log('[Gemini] Model:', GEMINI_MODEL)
		console.log('[Gemini] Prompt length:', prompt.length, 'characters')
		console.log('[Gemini] Config:', {
			temperature: 0.3,
			topP: 0.8,
			topK: 40,
			maxOutputTokens: 2048
		})
		console.log('[Gemini] ──────────────────────────────────────────────')
		console.log('[Gemini] Calling API...')

		const result = await client.models.generateContent({
			model: GEMINI_MODEL,
			contents: prompt,
			config: {
				temperature: 0.3,
				topP: 0.8,
				topK: 40,
				maxOutputTokens: 2048
			}
		})

		console.log('[Gemini] ✓ API response received')
		console.log('[Gemini] ──────────────────────────────────────────────')

		// Extract text from response
		let text
		if (typeof result.text === 'function') {
			text = result.text()
		} else if (typeof result.text === 'string') {
			text = result.text
		} else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
			text = result.candidates[0].content.parts[0].text
		}

		if (!text) {
			console.error('[Gemini] ❌ ERROR: No content in response')
			console.error('[Gemini] Response structure:', JSON.stringify(result, null, 2).substring(0, 1000))
			throw new Error('No content in Gemini response')
		}

		console.log('[Gemini] ✓ Response text length:', text.length, 'characters')
		console.log('[Gemini] ✓ Response preview (first 200 chars):', text.substring(0, 200))
		console.log('[Gemini] ──────────────────────────────────────────────')
		console.log('[Gemini] Parsing JSON...')

		const analysis = safeJSONParse(text)

		console.log('[Gemini] ✓ JSON parsed successfully')

		console.log('[Gemini] ✓ CV Analysis completed successfully')
		console.log('[Gemini] Expertise score:', analysis.expertise_score)

		return {
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
			last_cv_processed_url: cvUrl
		}
	} catch (error: any) {
		console.error('[Gemini] ══════════════════════════════════════════════')
		console.error('[Gemini] ❌ ERROR in CV Analysis:')
		console.error('[Gemini] ══════════════════════════════════════════════')
		console.error('[Gemini] Error type:', error.constructor.name)
		console.error('[Gemini] Error message:', error.message)
		console.error('[Gemini] Error status:', error.status)
		console.error('[Gemini] Error code:', error.code)
		if (error.response) {
			console.error('[Gemini] API Response:', JSON.stringify(error.response, null, 2))
		}
		if (error.stack) {
			console.error('[Gemini] Stack trace:', error.stack)
		}
		console.error('[Gemini] Full error object:', JSON.stringify(error, null, 2))
		console.error('[Gemini] ══════════════════════════════════════════════')
		throw new Error(`Gemini API error: ${error.message}`)
	}
}

/**
 * Analyzes an article's title and abstract to extract topics and keywords
 */
export async function analyzeArticleWithAI(title: string, abstract: string, fullTextExcerpt?: string) {
	console.log('[Gemini] Starting article analysis...')

	try {
		const text = `Title: ${title}\n\nAbstract: ${abstract}${fullTextExcerpt ? `\n\nExcerpt: ${fullTextExcerpt}` : ''}`

		const prompt = `You are an expert in analyzing academic research papers.
Analyze the following article and extract structured information.

${text.substring(0, 6000)}

Extract and return a JSON object with the following structure:
{
  "main_topics": [
    {"topic": "Machine Learning", "relevance": 0.95},
    {"topic": "Computer Vision", "relevance": 0.8}
  ],
  "keywords": ["deep learning", "image classification", "CNN"],
  "methodology": "Experimental",
  "research_domain": "Computer Science",
  "complexity_level": "intermediate",
  "summary": "Brief 2-3 sentence summary"
}

IMPORTANT JSON RULES:
- Use double quotes for strings
- Escape special characters in strings
- Keep summary short and on a single line
- No line breaks inside string values
- Return ONLY valid JSON, no markdown formatting

Guidelines:
- Identify 3-5 main topics with relevance scores (0-1)
- Extract 10-15 most important keywords
- Methodology: Experimental/Theoretical/Survey/Case Study
- Complexity level: basic/intermediate/advanced
- Summary should capture the core contribution`

		const client = getGeminiClient()

		console.log('[Gemini] Calling Gemini API for article analysis...')

		const result = await client.models.generateContent({
			model: GEMINI_MODEL,
			contents: prompt,
			config: {
				temperature: 0.3,
				topP: 0.8,
				topK: 40,
				maxOutputTokens: 2048
			}
		})

		// Extract text from response
		let responseText
		if (typeof result.text === 'function') {
			responseText = result.text()
		} else if (typeof result.text === 'string') {
			responseText = result.text
		} else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
			responseText = result.candidates[0].content.parts[0].text
		}

		if (!responseText) {
			console.error('[Gemini] ❌ ERROR: No content in article analysis response')
			console.error('[Gemini] Response structure:', JSON.stringify(result, null, 2).substring(0, 1000))
			throw new Error('No content in Gemini response')
		}

		console.log('[Gemini] Article response text length:', responseText.length)

		const analysis = safeJSONParse(responseText)

		console.log('[Gemini] ✓ Article analysis completed')
		console.log('[Gemini] Main topics:', analysis.main_topics?.map((t: any) => t.topic).join(', '))

		return {
			main_topics: analysis.main_topics || [],
			keywords: analysis.keywords || [],
			methodology: analysis.methodology || 'Not specified',
			research_domain: analysis.research_domain || 'General',
			complexity_level: analysis.complexity_level || 'intermediate',
			analysis_summary: analysis.summary || '',
			gemini_model_version: GEMINI_MODEL
		}
	} catch (error: any) {
		console.error('[Gemini] ✗ Error analyzing article:', error)
		throw new Error(`Gemini API error: ${error.message}`)
	}
}

/**
 * Analyzes manually entered profile data with AI to calculate expertise score
 */
export async function analyzeManualProfileWithAI(profileData: {
	research_areas: Array<{ area: string; weight: number }>
	keywords: string[]
	technical_skills: string[]
	methodologies: string[]
	domains: string[]
	publications_count: number
	h_index: number
	years_of_experience: number
	cv_analysis_summary?: string
}) {
	console.log('[Gemini] Starting manual profile analysis with AI...')
	console.log('[Gemini] Profile:', {
		research_areas: profileData.research_areas?.length,
		keywords: profileData.keywords?.length,
		publications: profileData.publications_count,
		h_index: profileData.h_index
	})

	try {
		const prompt = `You are an expert in evaluating academic researcher profiles.

Analyze the following researcher profile and provide a comprehensive evaluation.

Profile Data:
- Research Areas: ${JSON.stringify(profileData.research_areas)}
- Keywords: ${JSON.stringify(profileData.keywords)}
- Technical Skills: ${JSON.stringify(profileData.technical_skills)}
- Methodologies: ${JSON.stringify(profileData.methodologies)}
- Domains: ${JSON.stringify(profileData.domains)}
- Publications Count: ${profileData.publications_count}
- H-Index: ${profileData.h_index}
- Years of Experience: ${profileData.years_of_experience}

Calculate an expertise score (0-100) based on:
1. Research area diversity and weights (30%)
2. Publication quality and quantity (25%)
3. H-index relative to experience (20%)
4. Years of experience (15%)
5. Technical skills breadth (10%)

Return a JSON object with:
{
  "expertise_score": 85,
  "score_breakdown": {
    "research_areas_score": 28,
    "publications_score": 22,
    "h_index_score": 18,
    "experience_score": 12,
    "technical_skills_score": 9
  },
  "analysis_summary": "Brief one-line summary",
  "recommendations": [
    "Recommendation 1",
    "Recommendation 2"
  ],
  "suggested_improvements": [
    "Improvement 1",
    "Improvement 2"
  ]
}

IMPORTANT JSON RULES:
- Use double quotes for strings
- Keep all text short and on single lines
- Escape special characters
- No line breaks inside string values
- Return ONLY valid JSON, no markdown

Guidelines:
- Be realistic and fair in scoring
- Consider career stage (early vs established)
- H-index relative to years of experience
- Research areas with higher weights contribute more
- Provide 2-3 actionable recommendations
- Be encouraging but honest`

		const client = getGeminiClient()

		console.log('[Gemini] ══════════════════════════════════════════════')
		console.log('[Gemini] 🚀 API CALL DETAILS (Profile Analysis):')
		console.log('[Gemini] ══════════════════════════════════════════════')
		console.log('[Gemini] Model:', GEMINI_MODEL)
		console.log('[Gemini] Prompt length:', prompt.length, 'characters')
		console.log('[Gemini] Profile data:', {
			research_areas: profileData.research_areas.length,
			keywords: profileData.keywords.length,
			publications: profileData.publications_count,
			h_index: profileData.h_index
		})
		console.log('[Gemini] Config:', {
			temperature: 0.4,
			topP: 0.8,
			topK: 40,
			maxOutputTokens: 2048
		})
		console.log('[Gemini] ──────────────────────────────────────────────')
		console.log('[Gemini] Calling API...')

		const result = await client.models.generateContent({
			model: GEMINI_MODEL,
			contents: prompt,
			config: {
				temperature: 0.4,
				topP: 0.8,
				topK: 40,
				maxOutputTokens: 2048
			}
		})

		console.log('[Gemini] ✓ API response received')
		console.log('[Gemini] ──────────────────────────────────────────────')
		console.log('[Gemini] Response object type:', typeof result)
		console.log('[Gemini] Response object keys:', Object.keys(result))

		// Check if text is a method or property
		let responseText
		if (typeof result.text === 'function') {
			console.log('[Gemini] result.text is a function, calling it...')
			responseText = result.text()
		} else if (typeof result.text === 'string') {
			console.log('[Gemini] result.text is a string property')
			responseText = result.text
		} else {
			console.log('[Gemini] result.text type:', typeof result.text)
			console.log('[Gemini] Checking for candidates...')

			// Try alternative response structure
			if (result.candidates && result.candidates.length > 0) {
				console.log('[Gemini] Found candidates in response')
				const candidate = result.candidates[0]
				console.log('[Gemini] Candidate:', JSON.stringify(candidate, null, 2).substring(0, 500))

				if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
					responseText = candidate.content.parts[0].text
					console.log('[Gemini] Extracted text from candidate.content.parts[0].text')
				}
			}
		}

		console.log('[Gemini] Response text type:', typeof responseText)
		console.log('[Gemini] Response text length:', responseText?.length)
		console.log('[Gemini] Response text preview:', responseText?.substring(0, 200))

		if (!responseText) {
			console.error('[Gemini] ❌ ERROR: No content in response')
			console.error('[Gemini] Result object:', JSON.stringify(result, null, 2).substring(0, 2000))
			throw new Error('No content in Gemini response')
		}

		console.log('[Gemini] ✓ Response text length:', responseText.length, 'characters')
		console.log('[Gemini] ✓ Response preview (first 300 chars):', responseText.substring(0, 300))
		console.log('[Gemini] ──────────────────────────────────────────────')
		console.log('[Gemini] Parsing JSON...')

		const analysis = safeJSONParse(responseText)

		console.log('[Gemini] ✓ JSON parsed successfully')

		console.log('[Gemini] ✓ Profile analysis completed')
		console.log('[Gemini] Expertise Score:', analysis.expertise_score)

		return {
			expertise_score: analysis.expertise_score || 0,
			score_breakdown: analysis.score_breakdown || {},
			analysis_summary: analysis.analysis_summary || '',
			recommendations: analysis.recommendations || [],
			suggested_improvements: analysis.suggested_improvements || [],
			gemini_model_version: GEMINI_MODEL
		}
	} catch (error: any) {
		console.error('[Gemini] ══════════════════════════════════════════════')
		console.error('[Gemini] ❌ ERROR in Profile Analysis:')
		console.error('[Gemini] ══════════════════════════════════════════════')
		console.error('[Gemini] Error type:', error.constructor.name)
		console.error('[Gemini] Error message:', error.message)
		console.error('[Gemini] Error status:', error.status)
		console.error('[Gemini] Error code:', error.code)
		if (error.response) {
			console.error('[Gemini] API Response:', JSON.stringify(error.response, null, 2))
		}
		if (error.stack) {
			console.error('[Gemini] Stack trace:', error.stack)
		}
		console.error('[Gemini] Full error object:', JSON.stringify(error, null, 2))
		console.error('[Gemini] ══════════════════════════════════════════════')
		throw new Error(`Gemini API error: ${error.message}`)
	}
}

/**
 * Calculates matching score between a reviewer profile and article
 */
export async function calculateMatchingScore(reviewerProfile: any, articleAnalysis: any) {
	console.log('[Gemini] Calculating matching score...')
	console.log('[Gemini] Reviewer:', reviewerProfile.users?.name || 'Unknown')

	try {
		const prompt = `You are an expert in matching academic reviewers to research papers.

Reviewer Profile:
- Research Areas: ${JSON.stringify(reviewerProfile.research_areas)}
- Keywords: ${JSON.stringify(reviewerProfile.keywords)}
- Publications: ${reviewerProfile.publications_count}
- H-Index: ${reviewerProfile.h_index}
- Experience: ${reviewerProfile.years_of_experience} years

Article Analysis:
- Main Topics: ${JSON.stringify(articleAnalysis.main_topics)}
- Keywords: ${JSON.stringify(articleAnalysis.keywords)}
- Domain: ${articleAnalysis.research_domain}

Calculate matching scores and return JSON:
{
  "overall_match_score": 85,
  "topic_similarity_score": 90,
  "keyword_overlap_score": 80,
  "methodology_match_score": 85,
  "domain_expertise_score": 95,
  "matching_keywords": ["machine learning", "deep learning"],
  "matching_topics": ["AI", "Neural Networks"],
  "mismatch_reasons": ["Requires more biology expertise"],
  "recommendation_level": "excellent",
  "confidence_score": 85,
  "explanation": "Brief one-line explanation"
}

IMPORTANT JSON RULES:
- Use double quotes for strings
- Keep all text short and on single lines
- No line breaks inside string values
- Return ONLY valid JSON, no markdown

Scoring Guidelines:
- All scores 0-100
- overall_match_score is weighted average
- Consider topic overlap, keyword matches
- recommendation_level: excellent (80+), good (60-79), moderate (40-59), low (<40)
- confidence_score based on data quality`

		const client = getGeminiClient()

		console.log('[Gemini] Calling Gemini API for matching score...')

		const result = await client.models.generateContent({
			model: GEMINI_MODEL,
			contents: prompt,
			config: {
				temperature: 0.2,
				topP: 0.8,
				topK: 40,
				maxOutputTokens: 2048
			}
		})

		// Extract text from response
		let responseText
		if (typeof result.text === 'function') {
			responseText = result.text()
		} else if (typeof result.text === 'string') {
			responseText = result.text
		} else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
			responseText = result.candidates[0].content.parts[0].text
		}

		if (!responseText) {
			console.error('[Gemini] ❌ ERROR: No content in matching score response')
			console.error('[Gemini] Response structure:', JSON.stringify(result, null, 2).substring(0, 1000))
			throw new Error('No content in Gemini response')
		}

		console.log('[Gemini] Matching response text length:', responseText.length)

		const scores = safeJSONParse(responseText)

		console.log('[Gemini] ✓ Matching score calculated')
		console.log('[Gemini] Overall Match:', scores.overall_match_score, '%')

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
			gemini_model_version: GEMINI_MODEL
		}
	} catch (error: any) {
		console.error('[Gemini] ✗ Error calculating matching score:', error)
		throw new Error(`Gemini API error: ${error.message}`)
	}
}
