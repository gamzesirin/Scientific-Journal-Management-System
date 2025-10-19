'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, CheckCircle2, XCircle, ClipboardCheck } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'
import { EditorDeskEvaluation, EditorDeskEvaluationFormData } from '../types/editor.types'

interface EditorDeskEvaluationFormProps {
	articleId: string
	articleTitle: string
	editorId: string
}

export default function EditorDeskEvaluationForm({ articleId, articleTitle, editorId }: EditorDeskEvaluationFormProps) {
	const router = useRouter()
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [existingEvaluation, setExistingEvaluation] = useState<EditorDeskEvaluation | null>(null)

	// Form states
	const [decision, setDecision] = useState<EditorDeskEvaluation['decision']>('pending')
	const [rejectionReason, setRejectionReason] = useState('')
	const [notes, setNotes] = useState('')
	const [scopeFitScore, setScopeFitScore] = useState<number | undefined>(undefined)
	const [originalityScore, setOriginalityScore] = useState<number | undefined>(undefined)
	const [methodologyScore, setMethodologyScore] = useState<number | undefined>(undefined)

	useEffect(() => {
		fetchDeskEvaluation()
	}, [articleId])

	const fetchDeskEvaluation = async () => {
		try {
			const response = await fetch(`/api/editor-desk-evaluations/${articleId}`)
			const data = await response.json()

			if (response.ok && data.deskEvaluation) {
				const eval_ = data.deskEvaluation
				setExistingEvaluation(eval_)
				setDecision(eval_.decision)
				setRejectionReason(eval_.rejection_reason || '')
				setNotes(eval_.notes || '')
				setScopeFitScore(eval_.scope_fit_score)
				setOriginalityScore(eval_.originality_score)
				setMethodologyScore(eval_.methodology_quality_score)
			}
		} catch (error) {
			console.error('Error fetching desk evaluation:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		if (decision === 'reject' && !rejectionReason.trim()) {
			setError('Ret kararı için gerekçe zorunludur')
			toast.error('Ret kararı için gerekçe zorunludur')
			return
		}

		setSubmitting(true)

		try {
			const response = await fetch(`/api/editor-desk-evaluations/${articleId}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					decision,
					rejection_reason: rejectionReason.trim() || null,
					notes: notes.trim() || null,
					scope_fit_score: scopeFitScore,
					originality_score: originalityScore,
					methodology_quality_score: methodologyScore
				})
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Desk evaluation kaydedilemedi')
			}

			// Success toast
			if (decision === 'approve_for_review') {
				toast.success('Makale hakem atamasına uygun bulundu!')
			} else if (decision === 'reject') {
				toast.success('Makale reddedildi ve yazar bilgilendirilecek')
			} else {
				toast.success('Desk evaluation taslak olarak kaydedildi')
			}

			// Refresh page
			router.refresh()
			fetchDeskEvaluation()
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Bir hata oluştu'
			setError(errorMsg)
			toast.error(errorMsg)
		} finally {
			setSubmitting(false)
		}
	}

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Ön Değerlendirme (Desk Evaluation)</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-gray-500">Yükleniyor...</p>
				</CardContent>
			</Card>
		)
	}

	// If already submitted and decided
	const isSubmitted = existingEvaluation?.submitted_at && decision !== 'pending'

	return (
		<Card className={isSubmitted ? 'border-green-500' : ''}>
			<CardHeader>
				<div className="flex items-start justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<ClipboardCheck className="h-5 w-5" />
							Editör Ön Değerlendirme (Desk Evaluation)
						</CardTitle>
						<CardDescription className="mt-2">
							Makaleyi hızlı bir şekilde değerlendirerek hakem atamasına uygun olup olmadığına karar verin
						</CardDescription>
					</div>
					{isSubmitted && (
						<Badge className="bg-green-500">
							<CheckCircle2 className="h-3 w-3 mr-1" />
							Tamamlandı
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6">
					{/* Article Info */}
					<div className="p-4 bg-gray-50 rounded-lg">
						<h4 className="font-semibold text-sm mb-1">Değerlendirilen Makale</h4>
						<p className="text-sm text-gray-700">{articleTitle}</p>
					</div>

					{/* Decision */}
					<div className="space-y-3">
						<Label className="text-base font-semibold">Karar *</Label>
						<RadioGroup value={decision} onValueChange={(value) => setDecision(value as any)} disabled={isSubmitted}>
							<div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
								<RadioGroupItem value="approve_for_review" id="approve" className="mt-1" />
								<div className="flex-1">
									<Label htmlFor="approve" className="cursor-pointer font-medium text-green-700">
										<CheckCircle2 className="inline h-4 w-4 mr-1" />
										Hakem Atamasına Uygun
									</Label>
									<p className="text-sm text-gray-600 mt-1">
										Makale journal kapsamına uygun ve hakem değerlendirmesi için uygundur.
									</p>
								</div>
							</div>

							<div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
								<RadioGroupItem value="reject" id="reject" className="mt-1" />
								<div className="flex-1">
									<Label htmlFor="reject" className="cursor-pointer font-medium text-red-700">
										<XCircle className="inline h-4 w-4 mr-1" />
										Reddet (Desk Reject)
									</Label>
									<p className="text-sm text-gray-600 mt-1">
										Makale journal kapsamına uygun değil veya temel kalite kriterlerini karşılamıyor.
									</p>
								</div>
							</div>
						</RadioGroup>
					</div>

					<Separator />

					{/* Rejection Reason (required if reject) */}
					{decision === 'reject' && (
						<div className="space-y-2">
							<Label htmlFor="rejection-reason" className="text-base font-semibold">
								Ret Gerekçesi <span className="text-red-500">*</span>
							</Label>
							<Textarea
								id="rejection-reason"
								placeholder="Ret kararınızın gerekçesini açıklayın (zorunlu)..."
								value={rejectionReason}
								onChange={(e) => setRejectionReason(e.target.value)}
								disabled={isSubmitted}
								rows={4}
								className="border-orange-300"
							/>
							<p className="text-xs text-gray-500">Yazar için açık ve yapıcı bir gerekçe belirtin.</p>
						</div>
					)}

					{/* General Notes */}
					<div className="space-y-2">
						<Label htmlFor="notes" className="text-base font-semibold">
							Genel Notlar (Opsiyonel)
						</Label>
						<Textarea
							id="notes"
							placeholder="Karar ile ilgili genel notlarınız, gelecekteki referans için..."
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							disabled={isSubmitted}
							rows={3}
						/>
					</div>

					<Separator />

					{/* Quick Scoring */}
					<div className="space-y-4">
						<h4 className="text-base font-semibold">Hızlı Puanlama (Opsiyonel)</h4>
						<p className="text-sm text-gray-600">1 = Çok Düşük, 5 = Çok Yüksek</p>

						<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
							{/* Scope Fit */}
							<div className="space-y-2">
								<Label>Journal Kapsamına Uygunluk</Label>
								<RadioGroup
									value={scopeFitScore?.toString() || ''}
									onValueChange={(val) => setScopeFitScore(val ? parseInt(val) : undefined)}
									disabled={isSubmitted}
								>
									<div className="flex gap-2">
										{[1, 2, 3, 4, 5].map((score) => (
											<div key={score} className="flex items-center">
												<RadioGroupItem value={score.toString()} id={`scope-${score}`} />
												<Label htmlFor={`scope-${score}`} className="ml-1 cursor-pointer">
													{score}
												</Label>
											</div>
										))}
									</div>
								</RadioGroup>
							</div>

							{/* Originality */}
							<div className="space-y-2">
								<Label>Özgünlük</Label>
								<RadioGroup
									value={originalityScore?.toString() || ''}
									onValueChange={(val) => setOriginalityScore(val ? parseInt(val) : undefined)}
									disabled={isSubmitted}
								>
									<div className="flex gap-2">
										{[1, 2, 3, 4, 5].map((score) => (
											<div key={score} className="flex items-center">
												<RadioGroupItem value={score.toString()} id={`orig-${score}`} />
												<Label htmlFor={`orig-${score}`} className="ml-1 cursor-pointer">
													{score}
												</Label>
											</div>
										))}
									</div>
								</RadioGroup>
							</div>

							{/* Methodology */}
							<div className="space-y-2">
								<Label>Yöntem Kalitesi</Label>
								<RadioGroup
									value={methodologyScore?.toString() || ''}
									onValueChange={(val) => setMethodologyScore(val ? parseInt(val) : undefined)}
									disabled={isSubmitted}
								>
									<div className="flex gap-2">
										{[1, 2, 3, 4, 5].map((score) => (
											<div key={score} className="flex items-center">
												<RadioGroupItem value={score.toString()} id={`method-${score}`} />
												<Label htmlFor={`method-${score}`} className="ml-1 cursor-pointer">
													{score}
												</Label>
											</div>
										))}
									</div>
								</RadioGroup>
							</div>
						</div>
					</div>

					{/* Error Alert */}
					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					{/* Submit Buttons */}
					{!isSubmitted && (
						<div className="flex gap-3">
							<Button
								type="submit"
								disabled={submitting || decision === 'pending'}
								className={
									decision === 'approve_for_review' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
								}
							>
								{submitting
									? 'Kaydediliyor...'
									: decision === 'approve_for_review'
									? 'Onayla ve Hakem Atamaya Geç'
									: decision === 'reject'
									? 'Reddet ve Bildir'
									: 'Kararınızı Seçin'}
							</Button>
						</div>
					)}

					{isSubmitted && (
						<Alert className="border-green-500 bg-green-50">
							<CheckCircle2 className="h-4 w-4 text-green-600" />
							<AlertDescription className="text-green-600">
								Desk evaluation tamamlandı.{' '}
								{decision === 'approve_for_review'
									? 'Şimdi hakem atayabilirsiniz.'
									: 'Makale reddedildi, yazar bilgilendirilecek.'}
							</AlertDescription>
						</Alert>
					)}
				</form>
			</CardContent>
		</Card>
	)
}
