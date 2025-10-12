'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User } from '@supabase/supabase-js'
import { Article } from '@/features/articles/types/article.types'
import PapersList from '@/features/editor/components/PapersList'
import EditorStatistics from '@/features/editor/components/EditorStatistics'
import { Paper } from '@/features/editor/types/editor.types'

interface UserData {
	id: string
	email: string
	name: string
	role: string
}

interface EditorDashboardProps {
	user: User
	userData: UserData
	allPapers: Article[]
}

export default function EditorDashboard({ userData, allPapers }: EditorDashboardProps) {
	const [activeTab, setActiveTab] = useState('overview')

	// Transform Article[] to Paper[] for editor components
	const papers: Paper[] = allPapers?.map(article => ({
		id: article.id,
		title: article.title,
		abstract: article.abstract,
		keywords: article.keywords,
		file_url: article.file_url,
		author_id: article.author_id,
		status: article.status as Paper['status'],
		assigned_editor_id: article.assigned_editor_id,
		submitted_at: article.created_at,
		created_at: article.created_at,
		updated_at: article.updated_at,
		author: article.author ? {
			id: article.author_id,
			name: article.author.name,
			email: article.author.email,
			affiliation: article.author.affiliation
		} : undefined,
		assignments: (article as any).assignments || []
	})) || []

	// Filter papers by status
	const newSubmissions = papers.filter(p => p.status === 'submitted')
	const underReview = papers.filter(p => p.status === 'under_review')
	const revisionRequested = papers.filter(p => p.status === 'revision_requested')
	const completed = papers.filter(p =>
		p.status === 'accepted' || p.status === 'rejected' || p.status === 'published'
	)

	// Quick stats
	const stats = {
		submitted: newSubmissions.length,
		under_review: underReview.length,
		revision_requested: revisionRequested.length,
		accepted: papers.filter(p => p.status === 'accepted').length,
		rejected: papers.filter(p => p.status === 'rejected').length,
		published: papers.filter(p => p.status === 'published').length,
		total: papers.length
	}

	return (
		<>
			<h1 className="text-3xl font-bold text-gray-900 mb-6">Editör Paneli</h1>

			{/* User Info */}
			<Card className="mb-6">
				<CardHeader>
					<CardTitle>Hoş geldiniz, {userData?.name}!</CardTitle>
				</CardHeader>
			</Card>

			{/* Quick Stats */}
			<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 mb-6">
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Toplam</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold">{stats.total}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Yeni</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">İnceleniyor</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-yellow-600">{stats.under_review}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Revizyon</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-orange-600">{stats.revision_requested}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Kabul</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Red</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium text-gray-600">Yayınlandı</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-2xl font-bold text-purple-600">{stats.published}</p>
					</CardContent>
				</Card>
			</div>

			{/* Tabs for different views */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
				<TabsList className="grid w-full max-w-lg grid-cols-4">
					<TabsTrigger value="overview">Genel Bakış</TabsTrigger>
					<TabsTrigger value="new">Yeni Gönderimler</TabsTrigger>
					<TabsTrigger value="in-review">İncelemede</TabsTrigger>
					<TabsTrigger value="statistics">İstatistikler</TabsTrigger>
				</TabsList>

				<TabsContent value="overview">
					<PapersList
						papers={papers}
						title="Tüm Makaleler"
						description="Sistemdeki tüm makalelerin listesi"
					/>
				</TabsContent>

				<TabsContent value="new">
					<PapersList
						papers={newSubmissions}
						title="Yeni Gönderimler"
						description="Hakem ataması bekleyen makaleler"
					/>
				</TabsContent>

				<TabsContent value="in-review">
					<PapersList
						papers={underReview}
						title="İnceleme Altındaki Makaleler"
						description="Hakem değerlendirmesi devam eden makaleler"
					/>
				</TabsContent>

				<TabsContent value="statistics">
					<EditorStatistics papers={papers} />
				</TabsContent>
			</Tabs>
		</>
	)
}