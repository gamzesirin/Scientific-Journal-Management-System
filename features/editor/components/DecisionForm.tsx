'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, XCircle, RotateCcw, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/lib/toast'

interface DecisionFormProps {
	paperId: string
	paperTitle: string
	suggestedDecision: string | null
	reviews: any[]
}

export default function DecisionForm({ paperId, paperTitle, suggestedDecision, reviews }: DecisionFormProps) {
	const router = useRouter()
	const [loading, setLoading] = useState(false)

	const [decisionType, setDecisionType] = useState<'accept' | 'reject' | 'revision'>(
		(suggestedDecision as any) || 'revision'
	)
	const [decisionReason, setDecisionReason] = useState('')
	const [isDraft, setIsDraft] = useState(true)

	const validateForm = () => {
		if (!decisionReason || decisionReason.length < 50) {
			toast.error('Eksik bilgi', 'Karar gerekçesi en az 50 karakter olmalıdır')
			return false
		}
		return true
	}

	const handleSaveDraft = async () => {
		if (!validateForm()) return

		setLoading(true)

		try {
			const supabase = createClient()
			const {
				data: { user }
			} = await supabase.auth.getUser()

			if (!user) throw new Error('Not authenticated')

			const decisionData = {
				article_id: paperId,
				editor_id: user.id,
				decision_type: decisionType,
				decision_reason: decisionReason,
				status: 'draft' as const,
				created_at: new Date().toISOString()
			}

			const { error } = await supabase.from('decisions').insert([decisionData])

			if (error) throw error

			toast.success('Taslak kaydedildi', 'Karar taslağınız başarıyla kaydedildi.')
			setIsDraft(true)
		} catch (err: any) {
			toast.error('Hata', err.message || 'Taslak kaydedilirken bir hata oluştu')
		} finally {
			setLoading(false)
		}
	}

	const handleFinalize = async () => {
		if (!validateForm()) return

		const confirmMessage =
			decisionType === 'accept'
				? 'Makaleyi kabul etmek istediğinizden emin misiniz?'
				: decisionType === 'reject'
				? 'Makaleyi reddetmek istediğinizden emin misiniz?'
				: 'Makale için revizyon talep etmek istediğinizden emin misiniz?'

		if (!window.confirm(confirmMessage)) return

		setLoading(true)

		try {
			const supabase = createClient()
			const {
				data: { user }
			} = await supabase.auth.getUser()

			if (!user) throw new Error('Not authenticated')

			// Create or update decision
			const decisionData = {
				article_id: paperId,
				editor_id: user.id,
				decision_type: decisionType,
				decision_reason: decisionReason,
				status: 'final' as const,
				finalized_at: new Date().toISOString()
			}

			// Check if decision already exists
			const { data: existingDecision } = await supabase
				.from('decisions')
				.select('id')
				.eq('article_id', paperId)
				.single()

			if (existingDecision) {
				// Update existing decision
				const { error } = await supabase.from('decisions').update(decisionData).eq('id', existingDecision.id)

				if (error) throw error
			} else {
				// Create new decision
				const { error } = await supabase
					.from('decisions')
					.insert([{ ...decisionData, created_at: new Date().toISOString() }])

				if (error) throw error
			}

			// Update paper status based on decision using API
			const newStatus =
				decisionType === 'accept' ? 'accepted' :
				decisionType === 'reject' ? 'rejected' :
				'revision_requested'

			const statusResponse = await fetch(`/api/articles/${paperId}/status`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status: newStatus })
			})

			if (!statusResponse.ok) {
				const errorData = await statusResponse.json()
				console.error('Status update failed:', errorData)

				// Check constraint hatası için özel mesaj
				if (errorData.error === 'Database constraint error') {
					throw new Error(
						errorData.message ||
							'Veritabanı hatası: revision_requested durumu desteklenmiyor. Lütfen fix-article-status-constraint.sql dosyasını çalıştırın.'
					)
				}

				throw new Error(errorData.message || errorData.error || 'Makale durumu güncellenirken bir hata oluştu')
			}

			// TODO: Send notification email to author

			const successMessage =
				decisionType === 'accept'
					? 'Makale kabul edildi'
					: decisionType === 'reject'
					? 'Makale reddedildi'
					: 'Revizyon talep edildi'

			toast.success('Karar kaydedildi!', successMessage)

			setTimeout(() => {
				router.push(`/editor/articles/${paperId}`)
				router.refresh()
			}, 1500)
		} catch (err: any) {
			toast.error('Hata', err.message || 'Karar kaydedilirken bir hata oluştu')
		} finally {
			setLoading(false)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Editör Kararı</CardTitle>
				<CardDescription>Hakem değerlendirmelerine dayanarak kararınızı belirtin</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Decision Type */}
				<div>
					<Label>Karar Türü</Label>
					<RadioGroup
						value={decisionType}
						onValueChange={(value: any) => setDecisionType(value)}
						className="mt-2 space-y-2"
					>
						<div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
							<RadioGroupItem value="accept" id="accept" />
							<Label htmlFor="accept" className="flex items-center gap-2 cursor-pointer">
								<CheckCircle className="h-4 w-4 text-green-600" />
								<span className="font-medium">Kabul</span>
								<span className="text-sm text-gray-500">- Makale yayın için uygun</span>
							</Label>
						</div>

						<div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
							<RadioGroupItem value="revision" id="revision" />
							<Label htmlFor="revision" className="flex items-center gap-2 cursor-pointer">
								<RotateCcw className="h-4 w-4 text-yellow-600" />
								<span className="font-medium">Revizyon</span>
								<span className="text-sm text-gray-500">- Düzeltmeler gerekli</span>
							</Label>
						</div>

						<div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
							<RadioGroupItem value="reject" id="reject" />
							<Label htmlFor="reject" className="flex items-center gap-2 cursor-pointer">
								<XCircle className="h-4 w-4 text-red-600" />
								<span className="font-medium">Red</span>
								<span className="text-sm text-gray-500">- Makale uygun değil</span>
							</Label>
						</div>
					</RadioGroup>
				</div>

				{/* Decision Reason */}
				<div>
					<Label htmlFor="reason">Karar Gerekçesi *</Label>
					<Textarea
						id="reason"
						value={decisionReason}
						onChange={(e) => setDecisionReason(e.target.value)}
						placeholder={
							decisionType === 'accept'
								? 'Makalenin kabul edilme nedenlerini, güçlü yönlerini ve bilimsel katkısını açıklayın...'
								: decisionType === 'reject'
								? 'Makalenin reddedilme nedenlerini, eksikliklerini ve yetersizliklerini açıklayın...'
								: 'Gerekli revizyonları, düzeltilmesi gereken noktaları ve önerileri detaylı olarak açıklayın...'
						}
						className="mt-2 min-h-[150px]"
					/>
					<p className="text-sm text-gray-500 mt-1">En az 50 karakter ({decisionReason.length}/50)</p>
				</div>

				{/* Review Summary Info */}
				{reviews.length > 0 && (
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>
							<strong>{reviews.length} hakem</strong> değerlendirmesi mevcut. Ortalama puan:{' '}
							<strong>{(reviews.reduce((sum, r) => sum + r.overall_score, 0) / reviews.length).toFixed(1)}/5</strong>
						</AlertDescription>
					</Alert>
				)}

				{/* Action Buttons */}
				<div className="flex justify-end gap-4">
					<Button variant="outline" onClick={handleSaveDraft} disabled={loading}>
						Taslak Olarak Kaydet
					</Button>
					<Button
						onClick={handleFinalize}
						disabled={loading || decisionReason.length < 50}
						variant={decisionType === 'accept' ? 'default' : decisionType === 'reject' ? 'destructive' : 'default'}
					>
						<Send className="h-4 w-4 mr-2" />
						Kararı Kesinleştir
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
