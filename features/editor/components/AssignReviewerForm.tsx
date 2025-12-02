'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format, addDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CalendarIcon, User, Mail, Award, Clock, Sparkles, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Reviewer } from '../types/editor.types'
import { toast } from '@/lib/toast'

// Types
interface ReviewerMatch {
	reviewer_id: string
	reviewer_name: string
	reviewer_email: string
	reviewer_affiliation?: string
	expertise_areas?: string[]
	overall_match_score: number
	topic_similarity_score: number
	keyword_overlap_score: number
	methodology_match_score: number
	domain_expertise_score: number
	matching_keywords: string[]
	matching_topics: string[]
	recommendation_level: 'excellent' | 'good' | 'moderate' | 'low'
	confidence_score: number
}

interface AssignReviewerFormProps {
	paperId: string
	paperTitle: string
	existingAssignments?: any[]
	availableReviewers: Reviewer[]
}

type ReviewerWithMatch = Reviewer & { aiMatch: ReviewerMatch }

// Score Indicator Component
function ScoreIndicator({ label, score }: { label: string; score: number }) {
	const getColor = (value: number) => {
		if (value > 70) return '#10b981'
		if (value > 40) return '#f59e0b'
		return '#ef4444'
	}

	return (
		<div className="flex items-center gap-1">
			<div
				className="h-2 w-2 rounded-full"
				style={{ backgroundColor: getColor(score) }}
			/>
			<span className="text-gray-600">{label}:</span>
			<span className="ml-1 font-medium">{Math.round(score)}%</span>
		</div>
	)
}

// Confidence Bar Component
function ConfidenceBar({ score }: { score: number }) {
	const getColor = (value: number) => {
		if (value > 70) return '#10b981'
		if (value > 40) return '#f59e0b'
		return '#ef4444'
	}

	return (
		<div className="mt-2 flex items-center gap-2">
			<span className="text-xs text-gray-600">Güvenilirlik:</span>
			<div className="flex-1 bg-gray-200 rounded-full h-2">
				<div
					className="h-2 rounded-full transition-all"
					style={{ width: `${score}%`, backgroundColor: getColor(score) }}
				/>
			</div>
			<span className="text-xs font-medium">{Math.round(score)}%</span>
		</div>
	)
}

// Match Details Component
function MatchDetails({ match }: { match: ReviewerMatch }) {
	return (
		<div className="mt-3 p-2 bg-gray-50 rounded border border-gray-200">
			<div className="grid grid-cols-2 gap-2 text-xs">
				<ScoreIndicator label="Konu Benzerliği" score={match.topic_similarity_score} />
				<ScoreIndicator label="Anahtar Kelime" score={match.keyword_overlap_score} />
				<ScoreIndicator label="Metodoloji" score={match.methodology_match_score} />
				<ScoreIndicator label="Alan Uzmanlığı" score={match.domain_expertise_score} />
			</div>

			{match.confidence_score && <ConfidenceBar score={match.confidence_score} />}

			{match.matching_keywords?.length > 0 && (
				<div className="mt-2">
					<span className="text-xs text-gray-600">Eşleşen Terimler:</span>
					<div className="flex flex-wrap gap-1 mt-1">
						{match.matching_keywords.slice(0, 5).map((keyword, idx) => (
							<Badge key={idx} variant="secondary" className="text-xs">{keyword}</Badge>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

// Recommendation Badge Component
function RecommendationBadge({ level }: { level: string }) {
	if (level === 'excellent') {
		return (
			<Badge variant="outline" className="gap-1 border-green-600 text-green-700">
				<CheckCircle2 className="h-3 w-3" />
				Mükemmel Eşleşme
			</Badge>
		)
	}
	if (level === 'good') {
		return (
			<Badge variant="outline" className="gap-1 border-blue-600 text-blue-700">
				<CheckCircle2 className="h-3 w-3" />
				İyi Eşleşme
			</Badge>
		)
	}
	return null
}

// Reviewer Card Component
interface ReviewerCardProps {
	reviewer: ReviewerWithMatch
	isSelected: boolean
	showDetails: boolean
	onToggle: () => void
}

function ReviewerCard({ reviewer, isSelected, showDetails, onToggle }: ReviewerCardProps) {
	const match = reviewer.aiMatch

	const cardClassName = cn(
		'p-3 border rounded-lg cursor-pointer transition-all',
		isSelected
			? 'bg-blue-50 border-blue-300'
			: match.recommendation_level === 'excellent'
				? 'hover:bg-green-50 border-green-200 bg-green-50/30'
				: match.recommendation_level === 'good'
					? 'hover:bg-blue-50 border-blue-200 bg-blue-50/30'
					: 'hover:bg-gray-50'
	)

	return (
		<div className={cardClassName} onClick={onToggle}>
			<div className="flex items-start justify-between gap-4">
				<div className="flex-1 min-w-0">
					{/* Reviewer Name and Score Badge */}
					<div className="flex items-center gap-2 flex-wrap">
						<div className="flex items-center gap-2">
							<User className="h-4 w-4 flex-shrink-0" />
							<span className="font-medium">{reviewer.name}</span>
						</div>

						<Badge
							variant={match.recommendation_level === 'excellent' ? 'default' : match.recommendation_level === 'good' ? 'secondary' : 'outline'}
							className={cn(
								'gap-1',
								match.recommendation_level === 'excellent' && 'bg-green-600',
								match.recommendation_level === 'good' && 'bg-blue-600 text-white'
							)}
						>
							<TrendingUp className="h-3 w-3" />
							{Math.round(match.overall_match_score)}% eşleşme
						</Badge>

						<RecommendationBadge level={match.recommendation_level} />
					</div>

					{/* Email */}
					<div className="flex items-center gap-2 mt-1">
						<Mail className="h-3 w-3" />
						<span className="text-sm text-gray-600 truncate">{reviewer.email}</span>
					</div>

					{/* Expertise Areas */}
					{reviewer.expertise_areas && reviewer.expertise_areas.length > 0 && (
						<div className="flex items-start gap-2 mt-2">
							<Award className="h-3 w-3 mt-1 flex-shrink-0" />
							<div className="flex flex-wrap gap-1">
								{reviewer.expertise_areas.map((area, index) => (
									<Badge key={index} variant="outline" className="text-xs">{area}</Badge>
								))}
							</div>
						</div>
					)}

					{showDetails && <MatchDetails match={match} />}
				</div>

				<Button
					size="sm"
					variant={isSelected ? 'default' : 'outline'}
					onClick={(e) => {
						e.stopPropagation()
						onToggle()
					}}
				>
					{isSelected ? 'Seçildi' : 'Seç'}
				</Button>
			</div>
		</div>
	)
}

// Empty State Component
function EmptyReviewersState({ minimumScore }: { minimumScore: number }) {
	return (
		<div className="flex flex-col items-center justify-center py-8 space-y-3">
			<AlertCircle className="h-12 w-12 text-amber-500" />
			<div className="text-center">
				<p className="font-medium text-gray-700">Yeterli Eşleşme Bulunamadı</p>
				<p className="text-sm text-gray-500 mt-1">
					Bu makale için %{minimumScore} ve üzeri eşleşme skoruna sahip hakem bulunamadı.
				</p>
				<p className="text-xs text-gray-400 mt-2">
					Hakem profillerinin AI analizi yapıldığından emin olun.
				</p>
			</div>
		</div>
	)
}

// Loading State Component
function LoadingState() {
	return (
		<div className="flex flex-col items-center justify-center py-8 space-y-2">
			<div className="flex items-center gap-2 text-gray-600">
				<Sparkles className="h-5 w-5 animate-pulse text-blue-500" />
				<span className="font-medium">Makale analiz ediliyor...</span>
			</div>
			<p className="text-sm text-gray-500">AI hakemlerinizi makale ile eşleştiriyor</p>
		</div>
	)
}

// Main Component
export default function AssignReviewerForm({
	paperId,
	paperTitle,
	existingAssignments = [],
	availableReviewers
}: AssignReviewerFormProps) {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [loadingMatches, setLoadingMatches] = useState(false)
	const [selectedReviewers, setSelectedReviewers] = useState<string[]>([])
	const [deadline, setDeadline] = useState<Date | undefined>(addDays(new Date(), 14))
	const [message, setMessage] = useState('')
	const [aiMatches, setAiMatches] = useState<ReviewerMatch[]>([])
	const [showAiSuggestions, setShowAiSuggestions] = useState(true)
	const [matchStats, setMatchStats] = useState<{ filtered_from: number; minimum_score: number } | null>(null)

	const assignedReviewerIds = existingAssignments.map((a) => a.reviewer_id)
	const filteredReviewers = availableReviewers.filter((r) => !assignedReviewerIds.includes(r.id))

	// Fetch AI matches
	useEffect(() => {
		const fetchMatches = async () => {
			setLoadingMatches(true)
			try {
				const response = await fetch(`/api/editor/reviewer-matches/${paperId}`)
				if (response.ok) {
					const data = await response.json()
					setAiMatches(data.matches || [])
					if (data.filtered_from && data.filter_criteria) {
						setMatchStats({
							filtered_from: data.filtered_from,
							minimum_score: data.filter_criteria.minimum_score
						})
					}
				} else {
					const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
					console.warn('Could not fetch AI matches:', errorData)
					toast.error('AI Eşleştirme Hatası', errorData.details || errorData.error || 'Hakem eşleştirmesi yapılamadı')
				}
			} catch (error) {
				console.error('Error fetching AI matches:', error)
				toast.error('Bağlantı Hatası', 'Hakem eşleştirmesi için AI analizine ulaşılamadı')
			} finally {
				setLoadingMatches(false)
			}
		}

		fetchMatches()
	}, [paperId])

	// Build reviewers with scores list
	const reviewersWithScores = aiMatches
		.map((match) => {
			const reviewer = filteredReviewers.find((r) => r.id === match.reviewer_id)
			return reviewer ? { ...reviewer, aiMatch: match } : null
		})
		.filter((r): r is ReviewerWithMatch => r !== null)
		.sort((a, b) => (b.aiMatch.overall_match_score || 0) - (a.aiMatch.overall_match_score || 0))

	const toggleReviewer = useCallback((reviewerId: string) => {
		setSelectedReviewers(prev =>
			prev.includes(reviewerId)
				? prev.filter(id => id !== reviewerId)
				: [...prev, reviewerId]
		)
	}, [])

	const handleSubmit = async () => {
		if (selectedReviewers.length === 0) {
			toast.error('Eksik bilgi', 'Lütfen en az bir hakem seçin')
			return
		}

		if (!deadline) {
			toast.error('Eksik bilgi', 'Lütfen bir son tarih belirleyin')
			return
		}

		setLoading(true)

		try {
			const supabase = createClient()
			const { data: { user } } = await supabase.auth.getUser()

			if (!user) throw new Error('Not authenticated')

			const assignments = selectedReviewers.map((reviewerId) => ({
				article_id: paperId,
				reviewer_id: reviewerId,
				assigned_by_editor_id: user.id,
				status: 'pending',
				deadline: deadline.toISOString(),
				assigned_at: new Date().toISOString()
			}))

			const { error: assignmentError } = await supabase
				.from('assignments')
				.insert(assignments)
				.select()

			if (assignmentError) throw assignmentError

			await supabase
				.from('articles')
				.update({ status: 'under_review', assigned_editor_id: user.id })
				.eq('id', paperId)
				.eq('status', 'submitted')

			toast.success('Başarılı!', `${selectedReviewers.length} hakem başarıyla atandı!`)
			setTimeout(() => router.push(`/editor/articles/${paperId}`), 1500)
		} catch (err: any) {
			toast.error('Hata', err.message || 'Hakem atanırken bir hata oluştu')
		} finally {
			setLoading(false)
		}
	}

	const minimumScore = matchStats?.minimum_score || 60

	return (
		<div className="space-y-6">
			{/* Paper Info */}
			<Card>
				<CardHeader>
					<CardTitle>Makale Bilgisi</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="font-medium">{paperTitle}</p>
					{existingAssignments.length > 0 && (
						<div className="mt-3">
							<p className="text-sm text-gray-600 mb-2">Mevcut Atamalar:</p>
							<div className="flex flex-wrap gap-2">
								{existingAssignments.map((assignment) => (
									<Badge key={assignment.id} variant="secondary">
										{assignment.reviewer?.name || 'Hakem'}
										{assignment.status === 'completed' && ' ✓'}
									</Badge>
								))}
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Reviewer Selection */}
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<div>
							<CardTitle className="flex items-center gap-2">
								Hakem Seçimi
								{aiMatches.length > 0 && (
									<Badge variant="secondary" className="gap-1">
										<Sparkles className="h-3 w-3" />
										{aiMatches.length} Uygun Hakem
									</Badge>
								)}
							</CardTitle>
							<CardDescription>
								{aiMatches.length > 0
									? `AI tarafından %${minimumScore}+ eşleşme skoruna sahip hakemler öneriliyor`
									: loadingMatches
										? 'Makale analiz ediliyor...'
										: 'Bu makale için yeterli eşleşme skoru olan hakem bulunamadı'
								}
							</CardDescription>
							{matchStats && matchStats.filtered_from > aiMatches.length && (
								<p className="text-xs text-gray-500 mt-1">
									{matchStats.filtered_from} hakem arasından {aiMatches.length} yüksek skorlu eşleşme bulundu
								</p>
							)}
						</div>
						{aiMatches.length > 0 && (
							<Button variant="ghost" size="sm" onClick={() => setShowAiSuggestions(!showAiSuggestions)}>
								{showAiSuggestions ? 'Detayları Gizle' : 'Detayları Göster'}
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{loadingMatches && <LoadingState />}

					{!loadingMatches && (
						<div>
							<Label>
								Önerilen Hakemler
								{aiMatches.length > 0 && (
									<span className="text-sm font-normal text-gray-500 ml-2">
										(%{minimumScore}+ eşleşme skoru)
									</span>
								)}
							</Label>
							<div className="mt-2 space-y-2 max-h-96 overflow-y-auto border rounded-lg p-3">
								{reviewersWithScores.length === 0 ? (
									<EmptyReviewersState minimumScore={minimumScore} />
								) : (
									reviewersWithScores.map((reviewer) => (
										<ReviewerCard
											key={reviewer.id}
											reviewer={reviewer}
											isSelected={selectedReviewers.includes(reviewer.id)}
											showDetails={showAiSuggestions}
											onToggle={() => toggleReviewer(reviewer.id)}
										/>
									))
								)}
							</div>
						</div>
					)}

					{/* Selected Reviewers */}
					{selectedReviewers.length > 0 && (
						<div>
							<Label>Seçilen Hakemler ({selectedReviewers.length})</Label>
							<div className="mt-2 flex flex-wrap gap-2">
								{selectedReviewers.map((reviewerId) => {
									const reviewer = availableReviewers.find((r) => r.id === reviewerId)
									return reviewer ? (
										<Badge key={reviewerId} variant="default" className="py-1">
											{reviewer.name}
											<button
												className="ml-2 text-white hover:text-gray-200"
												onClick={() => toggleReviewer(reviewerId)}
											>
												×
											</button>
										</Badge>
									) : null
								})}
							</div>
						</div>
					)}

					{/* Deadline Selection */}
					<div>
						<Label>Son Değerlendirme Tarihi</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className={cn('w-full justify-start text-left font-normal mt-2', !deadline && 'text-muted-foreground')}
								>
									<CalendarIcon className="mr-2 h-4 w-4" />
									{deadline ? format(deadline, 'd MMMM yyyy', { locale: tr }) : <span>Tarih seçin</span>}
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={deadline}
									onSelect={setDeadline}
									disabled={(date) => date < new Date() || date > addDays(new Date(), 60)}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
						<p className="text-sm text-gray-500 mt-1">
							<Clock className="inline h-3 w-3 mr-1" />
							Önerilen süre: 14-30 gün
						</p>
					</div>

					{/* Optional Message */}
					<div>
						<Label htmlFor="message">Hakemlere Mesaj (Opsiyonel)</Label>
						<Textarea
							id="message"
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Hakemlere iletmek istediğiniz özel notlar veya talimatlar..."
							className="mt-2"
							rows={3}
						/>
					</div>
				</CardContent>
			</Card>

			{/* Action Buttons */}
			<div className="flex justify-end gap-4">
				<Button variant="outline" onClick={() => router.back()} disabled={loading}>
					İptal
				</Button>
				<Button onClick={handleSubmit} disabled={loading || selectedReviewers.length === 0}>
					{loading ? 'Atanıyor...' : `${selectedReviewers.length} Hakem Ata`}
				</Button>
			</div>
		</div>
	)
}
