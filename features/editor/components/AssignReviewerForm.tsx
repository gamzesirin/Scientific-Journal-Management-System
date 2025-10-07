'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { format, addDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import { CalendarIcon, AlertCircle, User, Mail, Award, Clock, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Reviewer, AssignmentFormData } from '../types/editor.types'

interface AssignReviewerFormProps {
	paperId: string
	paperTitle: string
	existingAssignments?: any[]
	availableReviewers: Reviewer[]
}

export default function AssignReviewerForm({
	paperId,
	paperTitle,
	existingAssignments = [],
	availableReviewers
}: AssignReviewerFormProps) {
	const router = useRouter()
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const [selectedReviewers, setSelectedReviewers] = useState<string[]>([])
	const [deadline, setDeadline] = useState<Date | undefined>(addDays(new Date(), 14))
	const [message, setMessage] = useState('')

	// Filter out already assigned reviewers
	const assignedReviewerIds = existingAssignments.map((a) => a.reviewer_id)
	const filteredReviewers = availableReviewers.filter((r) => !assignedReviewerIds.includes(r.id))

	const handleAddReviewer = (reviewerId: string) => {
		if (!selectedReviewers.includes(reviewerId)) {
			setSelectedReviewers([...selectedReviewers, reviewerId])
		}
	}

	const handleRemoveReviewer = (reviewerId: string) => {
		setSelectedReviewers(selectedReviewers.filter((id) => id !== reviewerId))
	}

	const handleSubmit = async () => {
		if (selectedReviewers.length === 0) {
			setError('Lütfen en az bir hakem seçin')
			return
		}

		if (!deadline) {
			setError('Lütfen bir son tarih belirleyin')
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

			// Create assignments for each selected reviewer
			const assignments = selectedReviewers.map((reviewerId) => ({
				article_id: paperId,
				reviewer_id: reviewerId,
				assigned_by_editor_id: user.id, // Added back - required field!
				status: 'pending',
				deadline: deadline.toISOString(),
				assigned_at: new Date().toISOString()
			}))

			console.log('Inserting assignments:', assignments)
			console.log('Current user (editor):', user.id)

			const { data: insertedData, error: assignmentError } = await supabase
				.from('assignments')
				.insert(assignments)
				.select() // Return inserted data for verification

			console.log('Inserted assignments result:', insertedData)
			console.log('Assignment error:', assignmentError)

			if (assignmentError) throw assignmentError

			// Update paper status to under_review if it's still submitted
			const { error: updateError } = await supabase
				.from('articles')
				.update({
					status: 'under_review',
					assigned_editor_id: user.id
				})
				.eq('id', paperId)
				.eq('status', 'submitted')

			if (updateError) throw updateError

			// TODO: Send notification emails to reviewers
			// This would typically be done through a backend service

			setSuccess(`${selectedReviewers.length} hakem başarıyla atandı!`)
			setTimeout(() => {
				router.push(`/editor/articles/${paperId}`)
			}, 2000)
		} catch (err: any) {
			setError(err.message || 'Hakem atanırken bir hata oluştu')
		} finally {
			setLoading(false)
		}
	}

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
					<CheckCircle className="h-4 w-4" />
					<AlertDescription>{success}</AlertDescription>
				</Alert>
			)}

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
					<CardTitle>Hakem Seçimi</CardTitle>
					<CardDescription>Makaleyi değerlendirecek hakemleri seçin</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{/* Available Reviewers */}
					<div>
						<Label>Uygun Hakemler</Label>
						<div className="mt-2 space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
							{filteredReviewers.length === 0 ? (
								<p className="text-gray-500 text-center py-4">Uygun hakem bulunmamaktadır</p>
							) : (
								filteredReviewers.map((reviewer) => (
									<div
										key={reviewer.id}
										className={cn(
											'flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50',
											selectedReviewers.includes(reviewer.id) && 'bg-blue-50 border-blue-300'
										)}
										onClick={() => {
											if (selectedReviewers.includes(reviewer.id)) {
												handleRemoveReviewer(reviewer.id)
											} else {
												handleAddReviewer(reviewer.id)
											}
										}}
									>
										<div className="flex-1">
											<div className="flex items-center gap-2">
												<User className="h-4 w-4" />
												<span className="font-medium">{reviewer.name}</span>
											</div>
											<div className="flex items-center gap-2 mt-1">
												<Mail className="h-3 w-3" />
												<span className="text-sm text-gray-600">{reviewer.email}</span>
											</div>
											{reviewer.expertise_areas && reviewer.expertise_areas.length > 0 && (
												<div className="flex items-center gap-2 mt-2">
													<Award className="h-3 w-3" />
													<div className="flex flex-wrap gap-1">
														{reviewer.expertise_areas.map((area, index) => (
															<Badge key={index} variant="outline" className="text-xs">
																{area}
															</Badge>
														))}
													</div>
												</div>
											)}
										</div>
										<Button
											size="sm"
											variant={selectedReviewers.includes(reviewer.id) ? 'default' : 'outline'}
											onClick={(e) => {
												e.stopPropagation()
												if (selectedReviewers.includes(reviewer.id)) {
													handleRemoveReviewer(reviewer.id)
												} else {
													handleAddReviewer(reviewer.id)
												}
											}}
										>
											{selectedReviewers.includes(reviewer.id) ? 'Seçildi' : 'Seç'}
										</Button>
									</div>
								))
							)}
						</div>
					</div>

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
												onClick={() => handleRemoveReviewer(reviewerId)}
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
									className={cn(
										'w-full justify-start text-left font-normal mt-2',
										!deadline && 'text-muted-foreground'
									)}
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
