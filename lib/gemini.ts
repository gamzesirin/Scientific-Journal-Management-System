import { GoogleGenAI } from '@google/genai'

// Note: gemini-2.5-flash uses thinking tokens which count against maxOutputTokens
// We've increased maxOutputTokens to 8192 to accommodate thinking tokens
export const GEMINI_MODEL = 'models/gemini-2.5-flash' // Using Gemini 2.5 Flash (advanced reasoning)

// Debug mode - set to false to reduce log output
const DEBUG_MODE = false

// Initialize Gemini client
let _genAI: GoogleGenAI | null = null

function getGeminiClient(): GoogleGenAI {
	if (!_genAI) {
		const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY

		if (!apiKey) {
			console.error('[Gemini] ❌ No API key found')
			throw new Error('GEMINI_API_KEY is not set in environment variables')
		}

		if (DEBUG_MODE) {
			console.log('[Gemini] ✓ Initializing client with model:', GEMINI_MODEL)
		}

		_genAI = new GoogleGenAI({ apiKey })
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
	} catch (error: unknown) {
		const err = error as { message: string }
		console.error('[Gemini] ❌ JSON Parse Error:', err.message)
		if (DEBUG_MODE) {
			console.error('[Gemini] Text preview (first 500):', text.substring(0, 500))
			console.error('[Gemini] Text preview (last 500):', text.substring(Math.max(0, text.length - 500)))
		}
		throw new Error(`Failed to parse JSON response: ${err.message}`)
	}
}

/**
 * Analyzes a CV PDF and extracts structured expertise information
 */
export async function analyzeCVWithAI(cvText: string, cvUrl: string) {
	console.log('[Gemini] Starting CV analysis...')
	console.log('[Gemini] CV text length:', cvText.length, 'characters')

	try {
		// Use more of the CV text for better analysis (15000 chars instead of 8000)
		// Take beginning, middle, and end sections for comprehensive coverage
		const maxLength = 15000
		let processedText = cvText

		if (cvText.length > maxLength) {
			const chunkSize = Math.floor(maxLength / 3)
			const beginning = cvText.substring(0, chunkSize)
			const middle = cvText.substring(Math.floor(cvText.length / 2) - Math.floor(chunkSize / 2), Math.floor(cvText.length / 2) + Math.floor(chunkSize / 2))
			const end = cvText.substring(cvText.length - chunkSize)
			processedText = `${beginning}\n...\n${middle}\n...\n${end}`
			console.log('[Gemini] CV text truncated to', processedText.length, 'chars (beginning + middle + end)')
		}

		const prompt = `Sen akademik CV ve araştırma profillerini analiz etme konusunda uzmansın.
Aşağıdaki CV metnini DETAYLI bir şekilde analiz et ve araştırmacının uzmanlığı hakkında yapılandırılmış bilgi çıkar.

CV Metni:
${processedText}

Aşağıdaki yapıya sahip bir JSON nesnesi döndür (tüm metinler Türkçe olmalı):
{
  "research_areas": [
    {"area": "Makine Öğrenmesi", "weight": 0.9},
    {"area": "Doğal Dil İşleme", "weight": 0.8}
  ],
  "keywords": ["derin öğrenme", "transformers", "sinir ağları", "NLP"],
  "technical_skills": ["Python", "PyTorch", "TensorFlow", "scikit-learn"],
  "methodologies": ["denetimli öğrenme", "transfer öğrenme", "ince ayar"],
  "domains": ["Bilgisayar Bilimleri", "Yapay Zeka"],
  "publications_count": 15,
  "h_index": 8,
  "years_of_experience": 5,
  "expertise_score": 85,
  "summary": "Kısa 2-3 cümlelik özet (Türkçe)"
}

ÖNEMLİ JSON KURALLARI:
- String'ler için çift tırnak kullan
- Özel karakterleri escape et (tırnak, satır sonu, backslash)
- Özet metnini kısa ve basit tut
- String değerlerinin içinde satır sonu olmasın
- SADECE geçerli JSON döndür, markdown formatı veya kod blokları kullanma

Yönergeler:
- Araştırma alanlarına CV'deki önem derecesine göre ağırlık (0-1) ata
- En alakalı 10-20 anahtar kelimeyi çıkar (Türkçe)
- Yayın sayısı açıkça belirtilmemişse yaklaşık değer ver
- H-index belirtilmemişse yayın kalitesi/yeri bazında tahmin et
- Deneyim yılı mezuniyet/ilk yayından hesapla
- Uzmanlık skoru (0-100) genel araştırma olgunluğunun değerlendirmesidir
- Tahminlerde muhafazakar ol
- Araştırma ile ilgili bilgilere odaklan
- TÜM METİNLER TÜRKÇE OLMALI (alanlar, anahtar kelimeler, metodolojiler, özet vb.)`

		const client = getGeminiClient()

		if (DEBUG_MODE) {
			console.log('[Gemini] Model:', GEMINI_MODEL)
			console.log('[Gemini] Prompt length:', prompt.length)
		}

		const result = await client.models.generateContent({
			model: GEMINI_MODEL,
			contents: prompt,
			config: {
				temperature: 0.3,
				topP: 0.8,
				topK: 40,
				maxOutputTokens: 8192 // Increased significantly for gemini-2.x thinking tokens
			}
		})

		// Check for MAX_TOKENS finish reason first
		if (result.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
			console.error('[Gemini] ❌ Response truncated due to MAX_TOKENS')
			throw new Error('Response truncated - increase maxOutputTokens or simplify prompt')
		}

		// Extract text from response
		let text
		if (result.text) {
			text = result.text
		} else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
			text = result.candidates[0].content.parts[0].text
		}

		if (!text) {
			console.error('[Gemini] ❌ No content in response')
			if (DEBUG_MODE) {
				console.error('[Gemini] Response:', JSON.stringify(result, null, 2).substring(0, 1000))
			}
			throw new Error('No content in Gemini response')
		}

		const analysis = safeJSONParse(text)

		console.log('[Gemini] ✓ CV Analysis completed (score:', analysis.expertise_score + ')')

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
		const err = error as { message: string; status?: string; code?: string; response?: unknown; stack?: string }
		console.error('[Gemini] ❌ CV Analysis error:', err.message)
		if (DEBUG_MODE) {
			console.error('[Gemini] Error details:', { status: err.status, code: err.code })
			if (err.response) {
				console.error('[Gemini] API Response:', JSON.stringify(err.response, null, 2))
			}
		}
		throw new Error(`Gemini API error: ${err.message}`)
	}
}

/**
 * Analyzes an article's title and abstract to extract topics and keywords
 */
export async function analyzeArticleWithAI(title: string, abstract: string, fullTextExcerpt?: string) {
	console.log('[Gemini] Starting article analysis...')

	try {
		const text = `Title: ${title}\n\nAbstract: ${abstract}${fullTextExcerpt ? `\n\nFull Text Excerpt: ${fullTextExcerpt}` : ''}`
		console.log('[Gemini] Article text length:', text.length, 'characters')

		// Use more text for better analysis (12000 chars instead of 6000)
		// Take beginning, middle, and end for comprehensive coverage
		const maxLength = 12000
		let processedText = text

		if (text.length > maxLength) {
			const chunkSize = Math.floor(maxLength / 3)
			const beginning = text.substring(0, chunkSize)
			const middle = text.substring(Math.floor(text.length / 2) - Math.floor(chunkSize / 2), Math.floor(text.length / 2) + Math.floor(chunkSize / 2))
			const end = text.substring(text.length - chunkSize)
			processedText = `${beginning}\n...\n${middle}\n...\n${end}`
			console.log('[Gemini] Article text truncated to', processedText.length, 'chars (beginning + middle + end)')
		}

		const prompt = `Sen akademik araştırma makalelerini analiz etme konusunda uzmansın.
Aşağıdaki makaleyi DETAYLI bir şekilde analiz et ve yapılandırılmış bilgi çıkar.

${processedText}

Aşağıdaki yapıya sahip bir JSON nesnesi döndür (tüm metinler Türkçe olmalı):
{
  "main_topics": [
    {"topic": "Makine Öğrenmesi", "relevance": 0.95},
    {"topic": "Bilgisayarlı Görü", "relevance": 0.8}
  ],
  "keywords": ["derin öğrenme", "görüntü sınıflandırma", "CNN"],
  "methodology": "Deneysel",
  "research_domain": "Bilgisayar Bilimleri",
  "complexity_level": "orta",
  "summary": "Kısa 2-3 cümlelik özet (Türkçe)"
}

ÖNEMLİ JSON KURALLARI:
- String'ler için çift tırnak kullan
- Özel karakterleri escape et
- Özeti kısa ve tek satırda tut
- String değerlerinin içinde satır sonu olmasın
- SADECE geçerli JSON döndür, markdown formatı kullanma

Yönergeler:
- İlişki skorları (0-1) ile 3-5 ana konu belirle (Türkçe)
- En önemli 10-15 anahtar kelimeyi çıkar (Türkçe)
- Metodoloji: Deneysel/Teorik/Tarama/Örnek Olay
- Karmaşıklık seviyesi: temel/orta/ileri
- Özet ana katkıyı yakalamalı (Türkçe)
- TÜM METİNLER TÜRKÇE OLMALI`

		const client = getGeminiClient()

		const result = await client.models.generateContent({
			model: GEMINI_MODEL,
			contents: prompt,
			config: {
				temperature: 0.3,
				topP: 0.8,
				topK: 40,
				maxOutputTokens: 8192 // Increased significantly for gemini-2.x thinking tokens
			}
		})

		// Check for MAX_TOKENS finish reason first
		if (result.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
			console.error('[Gemini] ❌ ERROR: Response truncated due to MAX_TOKENS')
			throw new Error('Response truncated - increase maxOutputTokens or simplify prompt')
		}

		// Extract text from response
		let responseText
		if (result.text) {
			responseText = result.text
		} else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
			responseText = result.candidates[0].content.parts[0].text
		}

		if (!responseText) {
			console.error('[Gemini] ❌ No content in article response')
			if (DEBUG_MODE) {
				console.error('[Gemini] Response:', JSON.stringify(result, null, 2).substring(0, 1000))
			}
			throw new Error('No content in Gemini response')
		}

		const analysis = safeJSONParse(responseText)

		console.log('[Gemini] ✓ Article analysis completed')

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
		console.error('[Gemini] ❌ Article analysis error:', err.message)
		throw new Error(`Gemini API error: ${err.message}`)
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
	console.log('[Gemini] Starting profile analysis...')

	try {
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
  "recommendations": [
    "Öneri 1 (Türkçe)",
    "Öneri 2 (Türkçe)"
  ],
  "suggested_improvements": [
    "İyileştirme önerisi 1 (Türkçe)",
    "İyileştirme önerisi 2 (Türkçe)"
  ]
}

ÖNEMLİ JSON KURALLARI:
- String'ler için çift tırnak kullan
- Tüm metinleri kısa ve tek satırda tut
- Özel karakterleri escape et
- String değerlerinin içinde satır sonu olmasın
- SADECE geçerli JSON döndür, markdown kullanma

Yönergeler:
- Skorlamada gerçekçi ve adil ol
- Kariyer aşamasını göz önünde bulundur (yeni başlayan vs. yerleşik)
- H-endeksini deneyim yılına göre değerlendir
- Ağırlığı yüksek araştırma alanları daha fazla katkıda bulunur
- 2-3 uygulanabilir öneri ver (Türkçe)
- Cesaretlendirici ama dürüst ol
- TÜM METİNLER TÜRKÇE OLMALI`

		const client = getGeminiClient()

		const result = await client.models.generateContent({
			model: GEMINI_MODEL,
			contents: prompt,
			config: {
				temperature: 0.4,
				topP: 0.8,
				topK: 40,
				maxOutputTokens: 8192 // Increased significantly for gemini-2.x thinking tokens
			}
		})

		// Check for MAX_TOKENS finish reason first
		if (result.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
			console.error('[Gemini] ❌ Response truncated due to MAX_TOKENS')
			throw new Error('Response truncated - increase maxOutputTokens or simplify prompt')
		}

		// Extract text from new @google/genai v1.28.0 response format
		let responseText: string | undefined
		const resultAny = result as any

		// Method 1: Try result.text property (most common in new SDK)
		if (result.text) {
			responseText = result.text
		}
		// Method 2: Try result.candidates[0].content.parts[0].text (legacy format)
		else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
			responseText = result.candidates[0].content.parts[0].text
		}
		// Method 3: Check all possible properties
		else if (resultAny.response?.text) {
			responseText = resultAny.response.text
		} else if (resultAny.response?.candidates?.[0]?.content?.parts?.[0]?.text) {
			responseText = resultAny.response.candidates[0].content.parts[0].text
		}

		if (!responseText) {
			console.error('[Gemini] ❌ No content in response')
			if (DEBUG_MODE) {
				console.error('[Gemini] Response:', JSON.stringify(result, null, 2).substring(0, 1500))
			}
			throw new Error('No content in Gemini response - tried all extraction methods')
		}

		const analysis = safeJSONParse(responseText)

		console.log('[Gemini] ✓ Profile analysis completed (score:', analysis.expertise_score + ')')

		return {
			expertise_score: analysis.expertise_score || 0,
			score_breakdown: analysis.score_breakdown || {},
			analysis_summary: analysis.analysis_summary || '',
			recommendations: analysis.recommendations || [],
			suggested_improvements: analysis.suggested_improvements || [],
			gemini_model_version: GEMINI_MODEL
		}
	} catch (error: unknown) {
		const err = error as { message: string; status?: string; code?: string; response?: unknown }
		console.error('[Gemini] ❌ Profile analysis error:', err.message)
		if (DEBUG_MODE) {
			console.error('[Gemini] Error details:', { status: err.status, code: err.code })
			if (err.response) {
				console.error('[Gemini] API Response:', JSON.stringify(err.response, null, 2))
			}
		}
		throw new Error(`Gemini API error: ${err.message}`)
	}
}

/**
 * Calculates matching score between a reviewer profile and article
 */
export async function calculateMatchingScore(reviewerProfile: any, articleAnalysis: any) {
	console.log('[Gemini] Calculating matching score...')
	console.log('[Gemini] Reviewer areas:', reviewerProfile.research_areas?.length || 0)
	console.log('[Gemini] Article topics:', articleAnalysis.main_topics?.length || 0)

	try {
		const prompt = `Sen akademik hakemleri araştırma makalelerine eşleştirme konusunda UZMAN bir AI sistemsin.
PDF'lerden çıkarılan tam text'ler analiz edilerek elde edilen aşağıdaki profilleri DETAYLI şekilde karşılaştır.

=== HAKEM PROFİLİ (PDF CV'den Çıkarıldı) ===
İsim: ${reviewerProfile.users?.name || 'Bilinmiyor'}
Kurum: ${reviewerProfile.users?.affiliation || 'Belirtilmemiş'}

Araştırma Alanları ve Ağırlıkları:
${JSON.stringify(reviewerProfile.research_areas, null, 2)}

Uzmanlık Anahtar Kelimeleri:
${JSON.stringify(reviewerProfile.keywords, null, 2)}

Teknik Beceriler: ${JSON.stringify(reviewerProfile.technical_skills)}
Metodolojiler: ${JSON.stringify(reviewerProfile.methodologies)}
Araştırma Alanları: ${JSON.stringify(reviewerProfile.domains)}

Akademik Başarılar:
- Yayın Sayısı: ${reviewerProfile.publications_count || 0}
- H-Endeksi: ${reviewerProfile.h_index || 0}
- Deneyim: ${reviewerProfile.years_of_experience || 0} yıl
- Uzmanlık Skoru: ${reviewerProfile.expertise_score || 0}/100

CV Özeti: ${reviewerProfile.cv_analysis_summary || 'Yok'}

=== MAKALE ANALİZİ (PDF'den Çıkarıldı) ===
Ana Konular ve İlişki Skorları:
${JSON.stringify(articleAnalysis.main_topics, null, 2)}

Makale Anahtar Kelimeleri:
${JSON.stringify(articleAnalysis.keywords, null, 2)}

Metodoloji: ${articleAnalysis.methodology || 'Belirtilmemiş'}
Araştırma Alanı: ${articleAnalysis.research_domain || 'Genel'}
Karmaşıklık Seviyesi: ${articleAnalysis.complexity_level || 'Orta'}

Makale Özeti: ${articleAnalysis.analysis_summary || 'Yok'}

=== DETAYLI EŞLEŞTİRME ANALİZİ ===
Aşağıdaki JSON formatında KAPSAMLI bir eşleştirme analizi yap:

{
  "overall_match_score": 85,
  "topic_similarity_score": 90,
  "keyword_overlap_score": 80,
  "methodology_match_score": 85,
  "domain_expertise_score": 95,
  "experience_relevance_score": 88,
  "matching_keywords": ["derin öğrenme", "sinir ağları"],
  "matching_topics": ["Yapay Zeka", "Makine Öğrenmesi"],
  "matching_methodologies": ["deneysel çalışma"],
  "mismatch_reasons": ["Makale biyoloji ağırlıklı, hakem bilgisayar bilimleri"],
  "strength_areas": ["Hakem bu konuda 5+ yayına sahip", "H-index yüksek"],
  "recommendation_level": "excellent",
  "confidence_score": 85,
  "detailed_explanation": "Hakem, makalenin ana konuları ile %90 oranında örtüşen uzmanlığa sahip."
}

ÖNEMLİ JSON KURALLARI:
- String'ler için çift tırnak kullan
- Tüm metinleri kısa ve tek satırda tut
- SADECE geçerli JSON döndür

=== DETAYLI SKORLAMA YÖNERGELERİ ===

1. TOPIC SIMILARITY (Konu Benzerliği) - Ağırlık: %35
   - Hakem araştırma alanları ile makale konularını karşılaştır
   - Ağırlıklı skorları kullan (weight ve relevance değerleri)
   - Direkt eşleşme: +20 puan
   - Yakın alan eşleşmesi: +10 puan
   - Alt alan eşleşmesi: +5 puan

2. KEYWORD OVERLAP (Anahtar Kelime Örtüşmesi) - Ağırlık: %25
   - Ortak anahtar kelimeleri say
   - %50+ örtüşme: 90+ puan
   - %30-50 örtüşme: 70-89 puan
   - %10-30 örtüşme: 40-69 puan
   - <%10 örtüşme: <40 puan

3. METHODOLOGY MATCH (Metodoloji Uyumu) - Ağırlık: %15
   - Hakem metodolojileri ile makale metodolojisini karşılaştır
   - Tam eşleşme: 100 puan
   - Benzer metodoloji: 70 puan
   - Farklı ama ilgili: 40 puan

4. DOMAIN EXPERTISE (Alan Uzmanlığı) - Ağırlık: %15
   - Hakem araştırma alanları ile makale alanını karşılaştır
   - Aynı alan: 100 puan
   - İlgili alan: 70 puan
   - Uzak alan: 30 puan

5. EXPERIENCE RELEVANCE (Deneyim Uygunluğu) - Ağırlık: %10
   - H-index, yayın sayısı, deneyim yılı değerlendir
   - Karmaşık makale = yüksek H-index gerekli
   - Basit makale = orta deneyim yeterli

OVERALL SCORE = (topic * 0.35) + (keyword * 0.25) + (methodology * 0.15) + (domain * 0.15) + (experience * 0.10)

recommendation_level belirlemesi:
- "excellent" (mükemmel): 80+ puan, güçlü örtüşme, ideal hakem
- "good" (iyi): 60-79 puan, yeterli uzmanlık, uygun hakem
- "moderate" (orta): 40-59 puan, kısmi uzmanlık, alternatif
- "low" (düşük): <40 puan, zayıf eşleşme, uygun değil

confidence_score (güven skoru):
- Veri kalitesi, profil detayı, eşleşme netliği değerlendir
- Tam veri: 85+ puan
- Kısmi veri: 60-84 puan
- Zayıf veri: <60 puan

TÜM ÇIKTILAR TÜRKÇE OLMALI!`

		const client = getGeminiClient()

		const result = await client.models.generateContent({
			model: GEMINI_MODEL,
			contents: prompt,
			config: {
				temperature: 0.2,
				topP: 0.8,
				topK: 40,
				maxOutputTokens: 8192 // Increased significantly for gemini-2.x thinking tokens
			}
		})

		// Check for MAX_TOKENS finish reason first
		if (result.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
			console.error('[Gemini] ❌ ERROR: Response truncated due to MAX_TOKENS')
			throw new Error('Response truncated - increase maxOutputTokens or simplify prompt')
		}

		// Extract text from response
		let responseText
		if (result.text) {
			responseText = result.text
		} else if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
			responseText = result.candidates[0].content.parts[0].text
		}

		if (!responseText) {
			console.error('[Gemini] ❌ No content in matching score response')
			if (DEBUG_MODE) {
				console.error('[Gemini] Response:', JSON.stringify(result, null, 2).substring(0, 1000))
			}
			throw new Error('No content in Gemini response')
		}

		const scores = safeJSONParse(responseText)

		console.log('[Gemini] ✓ Matching score calculated:', scores.overall_match_score + '%', `(${scores.recommendation_level})`)
		console.log('[Gemini]   - Topic Similarity:', scores.topic_similarity_score + '%')
		console.log('[Gemini]   - Keyword Overlap:', scores.keyword_overlap_score + '%')
		console.log('[Gemini]   - Methodology Match:', scores.methodology_match_score + '%')
		console.log('[Gemini]   - Domain Expertise:', scores.domain_expertise_score + '%')
		console.log('[Gemini]   - Experience Relevance:', scores.experience_relevance_score + '%')
		console.log('[Gemini]   - Matching Keywords:', scores.matching_keywords?.length || 0)
		console.log('[Gemini]   - Matching Topics:', scores.matching_topics?.length || 0)

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
		console.error('[Gemini] ❌ Matching score error:', err.message)
		throw new Error(`Gemini API error: ${err.message}`)
	}
}
