'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Star, AlertCircle, Save, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Review, ReviewFormData } from '../types/review.types'

interface ReviewFormProps {
	paperId: string
	assignmentId: string
	existingReview?: Review
}

export default function ReviewForm({ paperId, assignmentId, existingReview }: ReviewFormProps) {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)

	const [formData, setFormData] = useState<ReviewFormData>({
		overall_score: existingReview?.overall_score || 3,
		recommendation: existingReview?.recommendation || 'minor_revision',
		comments: existingReview?.comments || '',
		originality_score: 3,
		methodology_score: 3,
		clarity_score: 3,
		significance_score: 3,
		strengths: '',
		weaknesses: '',
		suggestions: ''
	})

	const handleScoreChange = (field: keyof ReviewFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: parseInt(value) }))
	}

	const handleTextChange = (field: keyof ReviewFormData, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }))
	}

	const handleSaveDraft = async () => {
		setLoading(true)
		setError(null)

		try {
			const supabase = createClient()
			const {
				data: { user }
			} = await supabase.auth.getUser()

			if (!user) throw new Error('Not authenticated')

			const reviewData = {
				article_id: paperId,
				reviewer_id: user.id,
				assignment_id: assignmentId,
				overall_score: formData.overall_score,
				recommendation: formData.recommendation,
				comments: formData.comments,
				status: 'draft' as const
			}

			if (existingReview) {
				// Update existing review
				const { error } = await supabase.from('reviews').update(reviewData).eq('id', existingReview.id)

				if (error) throw error
			} else {
				// Create new review
				const { error } = await supabase.from('reviews').insert([reviewData])

				if (error) throw error
			}

			setSuccess('Taslak başarıyla kaydedildi!')
			setTimeout(() => setSuccess(null), 3000)
		} catch (err: any) {
			setError(err.message || 'Taslak kaydedilirken bir hata oluştu')
		} finally {
			setLoading(false)
		}
	}

	const handleSubmitReview = async () => {
		if (!formData.comments || formData.comments.length < 100) {
			setError('Değerlendirme yorumu en az 100 karakter olmalıdır')
			return
		}

		setLoading(true)
		setError(null)

		try {
			const supabase = createClient()
			const {
				data: { user }
			} = await supabase.auth.getUser()

			if (!user) throw new Error('Not authenticated')

			const reviewData = {
				article_id: paperId,
				reviewer_id: user.id,
				assignment_id: assignmentId,
				overall_score: formData.overall_score,
				recommendation: formData.recommendation,
				comments: formData.comments,
				status: 'submitted' as const,
				submitted_at: new Date().toISOString()
			}

			if (existingReview) {
				// Update existing review
				const { error } = await supabase.from('reviews').update(reviewData).eq('id', existingReview.id)

				if (error) throw error
			} else {
				// Create new review
				const { error } = await supabase.from('reviews').insert([reviewData])

				if (error) throw error
			}

			// Update assignment status
			await supabase
				.from('assignments')
				.update({
					status: 'completed',
					completed_at: new Date().toISOString()
				})
				.eq('id', assignmentId)

			setSuccess('Değerlendirme başarıyla gönderildi!')
			setTimeout(() => {
				router.push('/dashboard')
			}, 2000)
		} catch (err: any) {
			setError(err.message || 'Değerlendirme gönderilirken bir hata oluştu')
		} finally {
			setLoading(false)
		}
	}

	const isSubmitted = existingReview?.status === 'submitted'

	return (
		<div className="space-y-6">
			{error && (
				<Alert variant="destructive">
					<AlertCircle className="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			)}

			{success && (
				<Alert className="bg-green-50 text-green-800 border-green-200">
					<AlertDescription>{success}</AlertDescription>
				</Alert>
			)}

			{/* Overall Score */}
			<Card>
				<CardHeader>
					<CardTitle>Genel Değerlendirme</CardTitle>
					<CardDescription>Makaleyi genel olarak değerlendirin</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<Label>Genel Puan</Label>
						<RadioGroup
							value={formData.overall_score.toString()}
							onValueChange={(value: string) => handleScoreChange('overall_score', value)}
							disabled={isSubmitted}
							className="flex gap-4 mt-2"
						>
							{[1, 2, 3, 4, 5].map((score) => (
								<div key={score} className="flex items-center space-x-1">
									<RadioGroupItem value={score.toString()} id={`score-${score}`} />
									<Label htmlFor={`score-${score}`} className="cursor-pointer flex items-center">
										{score} <Star className="h-4 w-4 ml-1 fill-yellow-400 text-yellow-400" />
									</Label>
								</div>
							))}
						</RadioGroup>
					</div>

					<div>
						<Label htmlFor="recommendation">Öneri</Label>
						<Select
							value={formData.recommendation}
							onValueChange={(value) =>
								setFormData((prev) => ({ ...prev, recommendation: value as Review['recommendation'] }))
							}
							disabled={isSubmitted}
						>
							<SelectTrigger className="mt-2">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="accept">Kabul</SelectItem>
								<SelectItem value="minor_revision">Küçük Revizyon</SelectItem>
								<SelectItem value="major_revision">Büyük Revizyon</SelectItem>
								<SelectItem value="reject">Red</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			{/* Detailed Scores */}
			<Card>
				<CardHeader>
					<CardTitle>Detaylı Değerlendirme</CardTitle>
					<CardDescription>Her bir kriteri 1-5 arasında puanlayın</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label>Özgünlük</Label>
						<RadioGroup
							value={formData.originality_score?.toString() || '3'}
							onValueChange={(value: string) => handleScoreChange('originality_score', value)}
							disabled={isSubmitted}
							className="flex gap-4 mt-2"
						>
							{[1, 2, 3, 4, 5].map((score) => (
								<div key={score} className="flex items-center space-x-1">
									<RadioGroupItem value={score.toString()} id={`orig-${score}`} />
									<Label htmlFor={`orig-${score}`} className="cursor-pointer">
										{score}
									</Label>
								</div>
							))}
						</RadioGroup>
					</div>

					<div>
						<Label>Metodoloji</Label>
						<RadioGroup
							value={formData.methodology_score?.toString() || '3'}
							onValueChange={(value: string) => handleScoreChange('methodology_score', value)}
							disabled={isSubmitted}
							className="flex gap-4 mt-2"
						>
							{[1, 2, 3, 4, 5].map((score) => (
								<div key={score} className="flex items-center space-x-1">
									<RadioGroupItem value={score.toString()} id={`method-${score}`} />
									<Label htmlFor={`method-${score}`} className="cursor-pointer">
										{score}
									</Label>
								</div>
							))}
						</RadioGroup>
					</div>

					<div>
						<Label>Açıklık ve Anlaşılırlık</Label>
						<RadioGroup
							value={formData.clarity_score?.toString() || '3'}
							onValueChange={(value: string) => handleScoreChange('clarity_score', value)}
							disabled={isSubmitted}
							className="flex gap-4 mt-2"
						>
							{[1, 2, 3, 4, 5].map((score) => (
								<div key={score} className="flex items-center space-x-1">
									<RadioGroupItem value={score.toString()} id={`clarity-${score}`} />
									<Label htmlFor={`clarity-${score}`} className="cursor-pointer">
										{score}
									</Label>
								</div>
							))}
						</RadioGroup>
					</div>

					<div>
						<Label>Bilimsel Katkı</Label>
						<RadioGroup
							value={formData.significance_score?.toString() || '3'}
							onValueChange={(value: string) => handleScoreChange('significance_score', value)}
							disabled={isSubmitted}
							className="flex gap-4 mt-2"
						>
							{[1, 2, 3, 4, 5].map((score) => (
								<div key={score} className="flex items-center space-x-1">
									<RadioGroupItem value={score.toString()} id={`sig-${score}`} />
									<Label htmlFor={`sig-${score}`} className="cursor-pointer">
										{score}
									</Label>
								</div>
							))}
						</RadioGroup>
					</div>
				</CardContent>
			</Card>

			{/* Comments */}
			<Card>
				<CardHeader>
					<CardTitle>Değerlendirme Yorumları</CardTitle>
					<CardDescription>Detaylı değerlendirme ve önerilerinizi yazın</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div>
						<Label htmlFor="comments">Genel Yorum *</Label>
						<Textarea
							id="comments"
							value={formData.comments}
							onChange={(e) => handleTextChange('comments', e.target.value)}
							disabled={isSubmitted}
							placeholder="Makalenin genel değerlendirmesini, güçlü ve zayıf yönlerini, önerilerinizi detaylı olarak yazın..."
							className="mt-2 min-h-[200px]"
						/>
						<p className="text-sm text-gray-500 mt-1">En az 100 karakter ({formData.comments.length}/100)</p>
					</div>

					<div>
						<Label htmlFor="strengths">Güçlü Yönler</Label>
						<Textarea
							id="strengths"
							value={formData.strengths || ''}
							onChange={(e) => handleTextChange('strengths', e.target.value)}
							disabled={isSubmitted}
							placeholder="Makalenin güçlü yönlerini listeleyin..."
							className="mt-2 min-h-[100px]"
						/>
					</div>

					<div>
						<Label htmlFor="weaknesses">Zayıf Yönler</Label>
						<Textarea
							id="weaknesses"
							value={formData.weaknesses || ''}
							onChange={(e) => handleTextChange('weaknesses', e.target.value)}
							disabled={isSubmitted}
							placeholder="Makalenin geliştirilmesi gereken yönlerini listeleyin..."
							className="mt-2 min-h-[100px]"
						/>
					</div>

					<div>
						<Label htmlFor="suggestions">Öneriler</Label>
						<Textarea
							id="suggestions"
							value={formData.suggestions || ''}
							onChange={(e) => handleTextChange('suggestions', e.target.value)}
							disabled={isSubmitted}
							placeholder="Yazarlara önerilerinizi yazın..."
							className="mt-2 min-h-[100px]"
						/>
					</div>
				</CardContent>
			</Card>

			{/* Action Buttons */}
			{!isSubmitted && (
				<div className="flex justify-end gap-4">
					<Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
						<Save className="h-4 w-4 mr-2" />
						Taslak Olarak Kaydet
					</Button>
					<Button onClick={handleSubmitReview} disabled={loading || formData.comments.length < 100}>
						<Send className="h-4 w-4 mr-2" />
						Değerlendirmeyi Gönder
					</Button>
				</div>
			)}

			{isSubmitted && (
				<Alert className="bg-blue-50 text-blue-800 border-blue-200">
					<AlertDescription>
						Bu değerlendirme {new Date(existingReview.submitted_at!).toLocaleDateString('tr-TR')} tarihinde
						gönderilmiştir.
					</AlertDescription>
				</Alert>
			)}
		</div>
	)
}
