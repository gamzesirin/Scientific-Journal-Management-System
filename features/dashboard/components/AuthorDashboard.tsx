import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import ArticleUploadForm from '@/features/articles/components/ArticleUploadForm'
import ArticleList from '@/features/articles/components/ArticleList'
import { User } from '@supabase/supabase-js'
import { Article } from '@/features/articles/types/article.types'

interface UserData {
	id: string
	email: string
	name: string
	role: string
}

interface AuthorDashboardProps {
	user: User
	userData: UserData
	articles: Article[]
}

export default function AuthorDashboard({ user, articles }: AuthorDashboardProps) {
	const stats = {
		total: articles?.length || 0,
		submitted: articles?.filter((a) => a.status === 'submitted').length || 0,
		under_review: articles?.filter((a) => a.status === 'under_review').length || 0,
		revision_requested: articles?.filter((a) => a.status === 'revision_requested').length || 0,
		accepted: articles?.filter((a) => a.status === 'accepted').length || 0,
		rejected: articles?.filter((a) => a.status === 'rejected').length || 0,
		published: articles?.filter((a) => a.status === 'published').length || 0
	}

	return (
		<>
			{/* Header */}
			<div className="mb-8">
				<Card>
					<CardHeader>
						<CardTitle className="text-3xl">Yazar Paneli</CardTitle>
						<CardDescription className="text-lg mt-2">
							Makalelerinizi yönetin ve yeni makale gönderin
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 md:grid-cols-6 gap-4">
							<Card>
								<CardHeader className="pb-2">
									<CardDescription>Toplam</CardDescription>
									<CardTitle className="text-3xl">{stats.total}</CardTitle>
								</CardHeader>
							</Card>
							<Card>
								<CardHeader className="pb-2">
									<CardDescription>Gönderildi</CardDescription>
									<CardTitle className="text-3xl text-blue-600">{stats.submitted}</CardTitle>
								</CardHeader>
							</Card>
							<Card>
								<CardHeader className="pb-2">
									<CardDescription>İncelemede</CardDescription>
									<CardTitle className="text-3xl text-yellow-600">{stats.under_review}</CardTitle>
								</CardHeader>
							</Card>
							<Card>
								<CardHeader className="pb-2">
									<CardDescription>Revizyon</CardDescription>
									<CardTitle className="text-3xl text-orange-600">{stats.revision_requested}</CardTitle>
								</CardHeader>
							</Card>
							<Card>
								<CardHeader className="pb-2">
									<CardDescription>Kabul</CardDescription>
									<CardTitle className="text-3xl text-green-600">{stats.accepted}</CardTitle>
								</CardHeader>
							</Card>
							<Card>
								<CardHeader className="pb-2">
									<CardDescription>Yayınlandı</CardDescription>
									<CardTitle className="text-3xl text-purple-600">{stats.published}</CardTitle>
								</CardHeader>
							</Card>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Upload Form */}
			<div className="mb-8">
				<ArticleUploadForm />
			</div>

			<Separator className="my-8" />

			{/* Article List */}
			<ArticleList articles={articles} userRole="author" userId={user.id} />
		</>
	)
}