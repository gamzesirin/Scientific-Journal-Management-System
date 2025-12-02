import { GoogleGenAI } from '@google/genai'

// Configuration
export const GEMINI_MODEL = 'models/gemini-2.5-flash'
const DEBUG_MODE = false
const MAX_OUTPUT_TOKENS = 8192

// Types
interface GeminiConfig {
	temperature: number
	topP: number
	topK: number
	maxOutputTokens: number
}

interface ResearchArea {
	area: string
	weight: number
}

interface Topic {
	topic: string
	relevance: number
}

// Singleton client
let _genAI: GoogleGenAI | null = null

function getGeminiClient(): GoogleGenAI {
	if (!_genAI) {
		const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

		if (!apiKey) {
			console.error('[Gemini] No API key found')
			throw new Error('GEMINI_API_KEY is not set in environment variables')
		}

		if (DEBUG_MODE) {
			console.log('[Gemini] Initializing client with model:', GEMINI_MODEL)
		}

		_genAI = new GoogleGenAI({ apiKey })
	}

	return _genAI
}

// JSON parsing utility
function safeJSONParse<T>(text: string): T {
	try {
		let cleanedText = text.trim()
			.replace(/^```json\s*/i, '')
			.replace(/^```\s*/i, '')
			.replace(/\s*```$/i, '')
			.trim()

		return JSON.parse(cleanedText)
	} catch (error: unknown) {
		const err = error as { message: string }
		console.error('[Gemini] JSON Parse Error:', err.message)
		if (DEBUG_MODE) {
			console.error('[Gemini] Text preview:', text.substring(0, 500))
		}
		throw new Error(`Failed to parse JSON response: ${err.message}`)
	}
}

// Text processing utility - extracts beginning, middle, and end for long texts
function truncateText(text: string, maxLength: number): string {
	if (text.length <= maxLength) return text

	const chunkSize = Math.floor(maxLength / 3)
	const beginning = text.substring(0, chunkSize)
	const middleStart = Math.floor(text.length / 2) - Math.floor(chunkSize / 2)
	const middle = text.substring(middleStart, middleStart + chunkSize)
	const end = text.substring(text.length - chunkSize)

	return `${beginning}\n...\n${middle}\n...\n${end}`
}

// Generic Gemini API call
async function callGemini<T>(
	prompt: string,
	config: Partial<GeminiConfig> = {}
): Promise<T> {
	const client = getGeminiClient()

	const result = await client.models.generateContent({
		model: GEMINI_MODEL,
		contents: prompt,
		config: {
			temperature: config.temperature ?? 0.3,
			topP: config.topP ?? 0.8,
			topK: config.topK ?? 40,
			maxOutputTokens: config.maxOutputTokens ?? MAX_OUTPUT_TOKENS
		}
	})

	if (result.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
		throw new Error('Response truncated - increase maxOutputTokens or simplify prompt')
	}

	const responseText = extractResponseText(result)
	if (!responseText) {
		throw new Error('No content in Gemini response')
	}

	return safeJSONParse<T>(responseText)
}

// Extract text from various response formats
function extractResponseText(result: any): string | undefined {
	if (result.text) return result.text
	if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
		return result.candidates[0].content.parts[0].text
	}
	if (result.response?.text) return result.response.text
	if (result.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
		return result.response.candidates[0].content.parts[0].text
	}
	return undefined
}

// Common JSON rules for prompts
const JSON_RULES = `ÖNEMLİ JSON KURALLARI:
- String'ler için çift tırnak kullan
- Özel karakterleri escape et
- Metinleri kısa ve tek satırda tut
- String değerlerinin içinde satır sonu olmasın
- SADECE geçerli JSON döndür, markdown formatı kullanma`

/**
 * Analyzes a CV PDF and extracts structured expertise information
 */
export async function analyzeCVWithAI(cvText: string, cvUrl: string) {
	console.log('[Gemini] Starting CV analysis...')

	const processedText = truncateText(cvText, 15000)

	const prompt = `Sen akademik CV ve araştırma profillerini analiz etme konusunda uzmansın.
Aşağıdaki CV metnini DETAYLI bir şekilde analiz et ve araştırmacının uzmanlığı hakkında yapılandırılmış bilgi çıkar.

CV Metni:
${processedText}

Aşağıdaki yapıya sahip bir JSON nesnesi döndür (tüm metinler Türkçe olmalı):
{
  "research_areas": [{"area": "Makine Öğrenmesi", "weight": 0.9}],
  "keywords": ["derin öğrenme", "sinir ağları"],
  "technical_skills": ["Python", "PyTorch"],
  "methodologies": ["denetimli öğrenme"],
  "domains": ["Bilgisayar Bilimleri"],
  "publications_count": 15,
  "h_index": 8,
  "years_of_experience": 5,
  "expertise_score": 85,
  "summary": "Kısa 2-3 cümlelik özet (Türkçe)"
}

${JSON_RULES}

Yönergeler:
- Araştırma alanlarına CV'deki önem derecesine göre ağırlık (0-1) ata
- En alakalı 10-20 anahtar kelimeyi çıkar (Türkçe)
- Yayın sayısı açıkça belirtilmemişse yaklaşık değer ver
- H-index belirtilmemişse yayın kalitesi/yeri bazında tahmin et
- Uzmanlık skoru (0-100) genel araştırma olgunluğunun değerlendirmesidir
- TÜM METİNLER TÜRKÇE OLMALI`

	try {
		interface CVAnalysisResult {
			research_areas: ResearchArea[]
			keywords: string[]
			technical_skills: string[]
			methodologies: string[]
			domains: string[]
			publications_count: number
			h_index: number
			years_of_experience: number
			expertise_score: number
			summary: string
		}

		const analysis = await callGemini<CVAnalysisResult>(prompt)
		console.log('[Gemini] CV Analysis completed (score:', analysis.expertise_score + ')')

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
	} catch (error: unknown) {
		const err = error as { message: string }
		console.error('[Gemini] CV Analysis error:', err.message)
		throw new Error(`Gemini API error: ${err.message}`)
	}
}

/**
 * Analyzes an article's title and abstract to extract topics and keywords
 */
export async function analyzeArticleWithAI(title: string, abstract: string, fullTextExcerpt?: string) {
	console.log('[Gemini] Starting article analysis...')

	const text = `Title: ${title}\n\nAbstract: ${abstract}${fullTextExcerpt ? `\n\nFull Text Excerpt: ${fullTextExcerpt}` : ''}`
	const processedText = truncateText(text, 12000)

	const prompt = `Sen akademik araştırma makalelerini analiz etme konusunda uzmansın.
Aşağıdaki makaleyi DETAYLI bir şekilde analiz et ve yapılandırılmış bilgi çıkar.

${processedText}

Aşağıdaki yapıya sahip bir JSON nesnesi döndür (tüm metinler Türkçe olmalı):
{
  "main_topics": [{"topic": "Makine Öğrenmesi", "relevance": 0.95}],
  "keywords": ["derin öğrenme", "görüntü sınıflandırma"],
  "methodology": "Deneysel",
  "research_domain": "Bilgisayar Bilimleri",
  "complexity_level": "orta",
  "summary": "Kısa 2-3 cümlelik özet (Türkçe)"
}

${JSON_RULES}

Yönergeler:
- İlişki skorları (0-1) ile 3-5 ana konu belirle (Türkçe)
- En önemli 10-15 anahtar kelimeyi çıkar (Türkçe)
- Metodoloji: Deneysel/Teorik/Tarama/Örnek Olay
- Karmaşıklık seviyesi: temel/orta/ileri
- TÜM METİNLER TÜRKÇE OLMALI`

	try {
		interface ArticleAnalysisResult {
			main_topics: Topic[]
			keywords: string[]
			methodology: string
			research_domain: string
			complexity_level: string
			summary: string
		}

		const analysis = await callGemini<ArticleAnalysisResult>(prompt)
		console.log('[Gemini] Article analysis completed')

		return {
			main_topics: analysis.main_topics || [],
			keywords: analysis.keywords || [],
			methodology: analysis.methodology || 'Not specified',
			research_domain: analysis.research_domain || 'General',
			complexity_level: analysis.complexity_level || 'intermediate',
			analysis_summary: analysis.summary || '',
			gemini_model_version: GEMINI_MODEL
		}
	} catch (error: unknown) {
		const err = error as { message: string }
		console.error('[Gemini] Article analysis error:', err.message)
		throw new Error(`Gemini API error: ${err.message}`)
	}
}

/**
 * Analyzes manually entered profile data with AI to calculate expertise score
 */
export async function analyzeManualProfileWithAI(profileData: {
	research_areas: ResearchArea[]
	keywords: string[]
	technical_skills: string[]
	methodologies: string[]
	domains: string[]
	publications_count: number
	h_index: number
	years_of_experience: number
	cv_analysis_summary?: string
}) {
	console.log('[Gemini] Starting profile analysis...')

	const prompt = `Sen akademik araştırmacı profillerini değerlendirme konusunda uzmansın.

Aşağıdaki araştırmacı profilini analiz et ve kapsamlı bir değerlendirme yap.

Profil Verileri:
- Araştırma Alanları: ${JSON.stringify(profileData.research_areas)}
- Anahtar Kelimeler: ${JSON.stringify(profileData.keywords)}
- Teknik Beceriler: ${JSON.stringify(profileData.technical_skills)}
- Metodolojiler: ${JSON.stringify(profileData.methodologies)}
- Alanlar: ${JSON.stringify(profileData.domains)}
- Yayın Sayısı: ${profileData.publications_count}
- H-Endeksi: ${profileData.h_index}
- Deneyim Yılı: ${profileData.years_of_experience}

Aşağıdaki kriterlere göre uzmanlık skoru (0-100) hesapla:
1. Araştırma alanı çeşitliliği ve ağırlıkları (%30)
2. Yayın kalitesi ve miktarı (%25)
3. Deneyime göre H-endeksi (%20)
4. Deneyim yılı (%15)
5. Teknik beceri genişliği (%10)

Aşağıdaki yapıda JSON döndür (tüm metinler Türkçe olmalı):
{
  "expertise_score": 85,
  "score_breakdown": {
    "research_areas_score": 28,
    "publications_score": 22,
    "h_index_score": 18,
    "experience_score": 12,
    "technical_skills_score": 9
  },
  "analysis_summary": "Kısa tek satırlık özet (Türkçe)",
  "recommendations": ["Öneri 1", "Öneri 2"],
  "suggested_improvements": ["İyileştirme önerisi 1"]
}

${JSON_RULES}

Yönergeler:
- Skorlamada gerçekçi ve adil ol
- Kariyer aşamasını göz önünde bulundur
- 2-3 uygulanabilir öneri ver (Türkçe)
- TÜM METİNLER TÜRKÇE OLMALI`

	try {
		interface ProfileAnalysisResult {
			expertise_score: number
			score_breakdown: Record<string, number>
			analysis_summary: string
			recommendations: string[]
			suggested_improvements: string[]
		}

		const analysis = await callGemini<ProfileAnalysisResult>(prompt, { temperature: 0.4 })
		console.log('[Gemini] Profile analysis completed (score:', analysis.expertise_score + ')')

		return {
			expertise_score: analysis.expertise_score || 0,
			score_breakdown: analysis.score_breakdown || {},
			analysis_summary: analysis.analysis_summary || '',
			recommendations: analysis.recommendations || [],
			suggested_improvements: analysis.suggested_improvements || [],
			gemini_model_version: GEMINI_MODEL
		}
	} catch (error: unknown) {
		const err = error as { message: string }
		console.error('[Gemini] Profile analysis error:', err.message)
		throw new Error(`Gemini API error: ${err.message}`)
	}
}

/**
 * Calculates matching score between a reviewer profile and article
 */
export async function calculateMatchingScore(reviewerProfile: any, articleAnalysis: any) {
	console.log('[Gemini] Calculating matching score...')

	const prompt = `Sen akademik hakemleri araştırma makalelerine eşleştirme konusunda UZMAN bir AI sistemsin.

=== HAKEM PROFİLİ ===
İsim: ${reviewerProfile.users?.name || 'Bilinmiyor'}
Kurum: ${reviewerProfile.users?.affiliation || 'Belirtilmemiş'}

Araştırma Alanları: ${JSON.stringify(reviewerProfile.research_areas)}
Anahtar Kelimeler: ${JSON.stringify(reviewerProfile.keywords)}
Teknik Beceriler: ${JSON.stringify(reviewerProfile.technical_skills)}
Metodolojiler: ${JSON.stringify(reviewerProfile.methodologies)}
Araştırma Alanları: ${JSON.stringify(reviewerProfile.domains)}

Akademik Başarılar:
- Yayın: ${reviewerProfile.publications_count || 0}, H-Index: ${reviewerProfile.h_index || 0}
- Deneyim: ${reviewerProfile.years_of_experience || 0} yıl, Skor: ${reviewerProfile.expertise_score || 0}/100

=== MAKALE ANALİZİ ===
Ana Konular: ${JSON.stringify(articleAnalysis.main_topics)}
Anahtar Kelimeler: ${JSON.stringify(articleAnalysis.keywords)}
Metodoloji: ${articleAnalysis.methodology || 'Belirtilmemiş'}
Alan: ${articleAnalysis.research_domain || 'Genel'}
Karmaşıklık: ${articleAnalysis.complexity_level || 'Orta'}

=== SKORLAMA ===
Aşağıdaki JSON formatında eşleştirme analizi yap:

{
  "overall_match_score": 85,
  "topic_similarity_score": 90,
  "keyword_overlap_score": 80,
  "methodology_match_score": 85,
  "domain_expertise_score": 95,
  "experience_relevance_score": 88,
  "matching_keywords": ["keyword1", "keyword2"],
  "matching_topics": ["topic1"],
  "matching_methodologies": ["method1"],
  "mismatch_reasons": ["reason1"],
  "strength_areas": ["strength1"],
  "recommendation_level": "excellent",
  "confidence_score": 85,
  "detailed_explanation": "Açıklama"
}

${JSON_RULES}

Skorlama Kriterleri:
- TOPIC SIMILARITY (%35): Direkt eşleşme +20, yakın alan +10, alt alan +5
- KEYWORD OVERLAP (%25): %50+ örtüşme = 90+, %30-50 = 70-89, %10-30 = 40-69
- METHODOLOGY (%15): Tam eşleşme = 100, benzer = 70, ilgili = 40
- DOMAIN EXPERTISE (%15): Aynı = 100, ilgili = 70, uzak = 30
- EXPERIENCE (%10): Karmaşık makale = yüksek H-index gerekli

recommendation_level: excellent (80+), good (60-79), moderate (40-59), low (<40)
TÜM ÇIKTILAR TÜRKÇE OLMALI!`

	try {
		interface MatchingResult {
			overall_match_score: number
			topic_similarity_score: number
			keyword_overlap_score: number
			methodology_match_score: number
			domain_expertise_score: number
			experience_relevance_score: number
			matching_keywords: string[]
			matching_topics: string[]
			matching_methodologies: string[]
			mismatch_reasons: string[]
			strength_areas: string[]
			recommendation_level: string
			confidence_score: number
			detailed_explanation?: string
			explanation?: string
		}

		const scores = await callGemini<MatchingResult>(prompt, { temperature: 0.2 })

		console.log('[Gemini] Matching score:', scores.overall_match_score + '%', `(${scores.recommendation_level})`)

		return {
			overall_match_score: scores.overall_match_score || 0,
			topic_similarity_score: scores.topic_similarity_score || 0,
			keyword_overlap_score: scores.keyword_overlap_score || 0,
			methodology_match_score: scores.methodology_match_score || 0,
			domain_expertise_score: scores.domain_expertise_score || 0,
			experience_relevance_score: scores.experience_relevance_score || 0,
			matching_keywords: scores.matching_keywords || [],
			matching_topics: scores.matching_topics || [],
			matching_methodologies: scores.matching_methodologies || [],
			mismatch_reasons: scores.mismatch_reasons || [],
			strength_areas: scores.strength_areas || [],
			recommendation_level: scores.recommendation_level || 'moderate',
			confidence_score: scores.confidence_score || 0,
			explanation: scores.detailed_explanation || scores.explanation || '',
			gemini_model_version: GEMINI_MODEL
		}
	} catch (error: unknown) {
		const err = error as { message: string }
		console.error('[Gemini] Matching score error:', err.message)
		throw new Error(`Gemini API error: ${err.message}`)
	}
}
