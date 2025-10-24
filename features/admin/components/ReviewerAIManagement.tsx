'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'
import { Sparkles, FileText, CheckCircle2, XCircle, Loader2, User, Award, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface ReviewerWithProfile {
	id: string
	name: string
	email: string
	cv_file_url: string | null
	expertise_areas: string[]
	profile?: {
		id: string
		expertise_score: number
		last_analysis_date: string
		research_areas: Array<{ area: string; weight: number }>
		keywords: string[]
		cv_analysis_summary: string
	}
}

export default function ReviewerAIManagement() {
	const [reviewers, setReviewers] = useState<ReviewerWithProfile[]>([])
	const [loading, setLoading] = useState(true)
	const [processing, setProcessing] = useState<Record<string, boolean>>({})

	useEffect(() => {
		fetchReviewers()
	}, [])

	const fetchReviewers = async () => {
		setLoading(true)
		try {
			const supabase = createClient()

			// Fetch all reviewers
			const { data: reviewersData, error: reviewersError } = await supabase
				.from('users')
				.select('id, name, email, cv_file_url, expertise_areas')
				.eq('role', 'reviewer')
				.eq('is_active', true)
				.order('name')

			if (reviewersError) throw reviewersError

			// Fetch existing profiles
			const { data: profilesData } = await supabase
				.from('reviewer_profiles')
				.select('*')

			// Merge data
			const merged = (reviewersData || []).map((reviewer) => ({
				...reviewer,
				profile: profilesData?.find((p) => p.user_id === reviewer.id)
			}))

			setReviewers(merged)
		} catch (error) {
			console.error('Error fetching reviewers:', error)
			toast.error('Hata', 'Hakemler yüklenirken bir hata oluştu')
		} finally {
			setLoading(false)
		}
	}

	const processCV = async (userId: string, userName: string) => {
		setProcessing((prev) => ({ ...prev, [userId]: true }))

		try {
			// Create abort controller for timeout
			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

			const response = await fetch('/api/admin/process-reviewer-cv', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ userId }),
				signal: controller.signal
			})

			clearTimeout(timeoutId)

			let data
			try {
				data = await response.json()
			} catch (parseError) {
				console.error('Failed to parse response:', parseError)
				throw new Error('Sunucudan geçersiz yanıt alındı. Lütfen konsolu kontrol edin.')
			}

			if (!response.ok) {
				// Log detailed error information
				console.error('API Error Details:', {
					status: response.status,
					statusText: response.statusText,
					error: data?.error,
					details: data?.details,
					hint: data?.hint,
					fullResponse: data
				})

				// Provide user-friendly error messages
				let errorMessage = 'CV işlenemedi'

				// Handle quota errors gracefully
				if (data?.error?.includes('429') || data?.error?.includes('quota')) {
					errorMessage = 'Gemini API limiti aşıldı. Mock veri kullanılıyor.'
					console.warn('[ReviewerAI] Gemini quota exceeded, but mock data should be used');
					// Don't throw error, the backend should handle it with mock data
					toast.warning('API Limiti', `${userName} için: ${errorMessage}`)
					await fetchReviewers()
					return
				}

				if (data?.error?.includes('extract text') || data?.error?.includes('PDF')) {
					errorMessage = 'PDF içeriği okunamadı. PDF metin içeriyor olabilir ancak işlenemedi. Yine de analiz yapıldı.'
					// Don't throw error for PDF extraction issues, just warn
					console.warn(errorMessage)
					toast.warning('Uyarı', `${userName} için: ${errorMessage}`)

					// Still try to refresh in case partial data was saved
					await fetchReviewers()
					return
				} else if (data?.error?.includes('not found')) {
					errorMessage = 'Hakem bulunamadı veya CV yüklenmemiş.'
				} else if (data?.details || data?.error) {
					errorMessage = data.details || data.error
				}

				throw new Error(errorMessage)
			}

			toast.success('Başarılı!', `${userName} için CV analizi tamamlandı`)

			// Refresh reviewers list
			await fetchReviewers()
		} catch (error: any) {
			// Handle timeout specifically
			if (error.name === 'AbortError') {
				console.error('Request timed out')
				toast.error('Zaman Aşımı', 'İstek çok uzun sürdü. Lütfen tekrar deneyin.')
			} else {
				console.error('Error processing CV:', error)
				toast.error('Hata', error.message || 'CV işlenirken bir hata oluştu')
			}
		} finally {
			setProcessing((prev) => ({ ...prev, [userId]: false }))
		}
	}

	const processAllCVs = async () => {
		const reviewersWithCV = reviewers.filter((r) => r.cv_file_url && !r.profile)

		if (reviewersWithCV.length === 0) {
			toast.info('Bilgi', 'İşlenecek CV bulunamadı')
			return
		}

		toast.info('Başlatıldı', `${reviewersWithCV.length} CV işlenecek...`)

		for (const reviewer of reviewersWithCV) {
			await processCV(reviewer.id, reviewer.name)
			// Small delay between requests to avoid rate limiting
			await new Promise((resolve) => setTimeout(resolve, 1000))
		}
	}

	if (loading) {
		return (
			<Card>
				<CardContent className="py-12">
					<div className="flex items-center justify-center gap-2 text-gray-600">
						<Loader2 className="h-5 w-5 animate-spin" />
						<span>Hakemler yükleniyor...</span>
					</div>
				</CardContent>
			</Card>
		)
	}

	const reviewersWithCV = reviewers.filter((r) => r.cv_file_url)
	const reviewersWithProfile = reviewers.filter((r) => r.profile)
	const reviewersNeedingProcessing = reviewers.filter((r) => r.cv_file_url && !r.profile)

	return (
		<div className="space-y-6">
			{/* Gemini API Status Alert */}
			{!process.env.NEXT_PUBLIC_GEMINI_API_KEY && (
				<Alert className="border-yellow-500 bg-yellow-50">
					<AlertCircle className="h-4 w-4 text-yellow-600" />
					<AlertTitle className="text-yellow-800">Mock Mod Aktif</AlertTitle>
					<AlertDescription className="text-yellow-700">
						Gemini API anahtarı bulunamadı veya limit aşıldı. Sistem şu anda mock (test) verisi kullanıyor.
						<br />
						<span className="font-semibold">Gerçek analiz için:</span>
						<ol className="list-decimal list-inside mt-2 space-y-1">
							<li>Google AI Studio'ya giriş yapın: <a href="https://aistudio.google.com" target="_blank" rel="noopener" className="underline">aistudio.google.com</a></li>
							<li>Get API Key butonuna tıklayın</li>
							<li>API key'inizi oluşturun ve kopyalayın</li>
							<li>.env.local dosyasına ekleyin: GEMINI_API_KEY=AIzaSy...</li>
							<li>Sunucuyu yeniden başlatın: npm run dev</li>
						</ol>
					</AlertDescription>
				</Alert>
			)}

			{/* Summary Cards */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">Toplam Hakem</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{reviewers.length}</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">CV ile Hakemler</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{reviewersWithCV.length}</div>
						<p className="text-xs text-gray-500 mt-1">
							{reviewersWithProfile.length} AI profili oluşturuldu
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">İşlenmeyi Bekleyen</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{reviewersNeedingProcessing.length}</div>
						{reviewersNeedingProcessing.length > 0 && (
							<Button
								size="sm"
								onClick={processAllCVs}
								disabled={Object.values(processing).some((p) => p)}
								className="mt-2"
							>
								<Sparkles className="h-3 w-3 mr-1" />
								Tümünü İşle
							</Button>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Reviewers List */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<User className="h-5 w-5" />
						Hakem AI Profilleri
					</CardTitle>
					<CardDescription>
						Hakemler için CV analizi yaparak AI tabanlı makale eşleştirme sistemi oluşturun
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{reviewers.map((reviewer) => (
							<div
								key={reviewer.id}
								className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
							>
								<div className="flex-1">
									<div className="flex items-center gap-2">
										<span className="font-medium">{reviewer.name}</span>
										{reviewer.profile ? (
											<Badge variant="default" className="gap-1 bg-green-600">
												<CheckCircle2 className="h-3 w-3" />
												AI Profili Var
											</Badge>
										) : reviewer.cv_file_url ? (
											<Badge variant="secondary">
												<Sparkles className="h-3 w-3 mr-1" />
												İşlenmeyi Bekliyor
											</Badge>
										) : (
											<Badge variant="outline">
												<XCircle className="h-3 w-3 mr-1" />
												CV Yok
											</Badge>
										)}
									</div>

									<div className="text-sm text-gray-600 mt-1">{reviewer.email}</div>

									{reviewer.profile && (
										<div className="mt-2 space-y-1">
											<div className="flex items-center gap-2 text-sm">
												<Award className="h-3 w-3" />
												<span className="text-gray-600">Uzmanlık Skoru:</span>
												<span className="font-medium">{Math.round(reviewer.profile.expertise_score)}/100</span>
											</div>

											{reviewer.profile.research_areas && reviewer.profile.research_areas.length > 0 && (
												<div className="flex items-start gap-2 mt-2">
													<span className="text-xs text-gray-600">Araştırma Alanları:</span>
													<div className="flex flex-wrap gap-1">
														{reviewer.profile.research_areas.slice(0, 3).map((area: any, idx: number) => (
															<Badge key={idx} variant="outline" className="text-xs">
																{area.area} ({Math.round(area.weight * 100)}%)
															</Badge>
														))}
													</div>
												</div>
											)}

											{reviewer.profile.keywords && reviewer.profile.keywords.length > 0 && (
												<div className="flex items-start gap-2 mt-1">
													<span className="text-xs text-gray-600">Anahtar Kelimeler:</span>
													<div className="flex flex-wrap gap-1">
														{reviewer.profile.keywords.slice(0, 5).map((keyword: string, idx: number) => (
															<Badge key={idx} variant="secondary" className="text-xs">
																{keyword}
															</Badge>
														))}
													</div>
												</div>
											)}

											<div className="text-xs text-gray-500 mt-2">
												Son analiz: {new Date(reviewer.profile.last_analysis_date).toLocaleDateString('tr-TR')}
											</div>
										</div>
									)}
								</div>

								<div className="flex gap-2">
									{reviewer.cv_file_url && (
										<>
											<Button
												size="sm"
												variant="outline"
												onClick={() => window.open(reviewer.cv_file_url!, '_blank')}
											>
												<FileText className="h-3 w-3 mr-1" />
												CV
											</Button>

											<Button
												size="sm"
												onClick={() => processCV(reviewer.id, reviewer.name)}
												disabled={processing[reviewer.id]}
											>
												{processing[reviewer.id] ? (
													<>
														<Loader2 className="h-3 w-3 mr-1 animate-spin" />
														İşleniyor
													</>
												) : (
													<>
														<Sparkles className="h-3 w-3 mr-1" />
														{reviewer.profile ? 'Yeniden İşle' : 'AI İşle'}
													</>
												)}
											</Button>
										</>
									)}
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
