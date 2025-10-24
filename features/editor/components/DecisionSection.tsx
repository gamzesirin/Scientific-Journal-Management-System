'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle } from 'lucide-react'
import DecisionForm from './DecisionForm'

interface DecisionSectionProps {
	paperId: string
	paperTitle: string
	suggestedDecision: string | null
	reviews: any[]
	existingDecision: any
	paperStatus?: string
}

export default function DecisionSection({ paperId, paperTitle, suggestedDecision, reviews, existingDecision, paperStatus }: DecisionSectionProps) {
	const [showNewDecisionForm, setShowNewDecisionForm] = useState(false)

	// Check if paper has been resubmitted after revision
	const isResubmittedAfterRevision = paperStatus === 'resubmitted' || paperStatus === 'under_review'

	// If no existing decision, show the form directly
	if (!existingDecision) {
		return (
			<DecisionForm
				paperId={paperId}
				paperTitle={paperTitle}
				suggestedDecision={suggestedDecision}
				reviews={reviews}
			/>
		)
	}

	// If there's an existing decision, show it with option to make new decision
	if (!showNewDecisionForm) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Mevcut Karar</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						<div className="flex items-center gap-2">
							<span className="font-medium">Karar:</span>
							<Badge
								variant={
									existingDecision.decision_type === 'accept'
										? 'success'
										: existingDecision.decision_type === 'reject'
										? 'destructive'
										: 'default'
								}
								className="text-base"
							>
								{existingDecision.decision_type === 'accept' ? (
									<>
										<CheckCircle className="h-4 w-4 mr-1" /> Kabul
									</>
								) : existingDecision.decision_type === 'reject' ? (
									<>
										<XCircle className="h-4 w-4 mr-1" /> Red
									</>
								) : (
									'Revizyon'
								)}
							</Badge>
						</div>
						<div>
							<p className="font-medium mb-1">Gerekçe:</p>
							<p className="text-gray-600">{existingDecision.decision_reason}</p>
						</div>
						{existingDecision.finalized_at && (
							<p className="text-sm text-gray-500">
								Karar Tarihi: {new Date(existingDecision.finalized_at).toLocaleDateString('tr-TR')}
							</p>
						)}
					</div>
					{isResubmittedAfterRevision && reviews && reviews.length > 0 && (
						<div className="mt-4 pt-4 border-t">
							<p className="text-sm text-gray-600 mb-3">
								Makale revize edildi ve yeniden değerlendirildi. Yeni bir karar vermek ister misiniz?
							</p>
							<Button onClick={() => setShowNewDecisionForm(true)}>
								Yeni Karar Ver
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		)
	}

	// Show the new decision form with cancel option
	return (
		<div className="space-y-4">
			{/* Show existing decision as reference */}
			<Card className="bg-gray-50">
				<CardHeader>
					<CardTitle className="text-sm">Önceki Karar</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center gap-2">
						<span className="text-sm">Önceki Karar:</span>
						<Badge
							variant={
								existingDecision.decision_type === 'accept'
									? 'success'
									: existingDecision.decision_type === 'reject'
									? 'destructive'
									: 'default'
							}
							className="text-xs"
						>
							{existingDecision.decision_type === 'accept'
								? 'Kabul'
								: existingDecision.decision_type === 'reject'
								? 'Red'
								: 'Revizyon'}
						</Badge>
						<span className="text-sm text-gray-500">
							({new Date(existingDecision.finalized_at).toLocaleDateString('tr-TR')})
						</span>
					</div>
				</CardContent>
			</Card>

			{/* New Decision Form */}
			<div className="relative">
				<Button
					variant="ghost"
					size="sm"
					onClick={() => setShowNewDecisionForm(false)}
					className="absolute right-2 top-2 z-10"
				>
					İptal
				</Button>
				<DecisionForm
					paperId={paperId}
					paperTitle={paperTitle}
					suggestedDecision={suggestedDecision}
					reviews={reviews}
				/>
			</div>
		</div>
	)
}