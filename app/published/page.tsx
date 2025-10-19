import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BookOpen, Calendar, FileText, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Article } from '@/features/articles/types/article.types'

interface ArticleWithAuthor extends Omit<Article, 'author' | 'users'> {
	users?: {
		name: string
		email?: string
		affiliation?: string
	}
}

export const metadata = {
	title: 'Yayınlanan Makaleler - Dergi Arşivi',
	description: 'Yayınlanmış bilimsel makalelere göz atın'
}

export default async function PublishedArticlesPage() {
	const supabase = await createServerSupabaseClient()

	// Fetch published articles with author info using public_articles view
	const { data: articlesData, error } = await supabase
		.from('public_articles')
		.select('*')
		.order('published_date', { ascending: false })

	if (error) {
		console.error('Error fetching published articles:', error)
	}

	// Map view data to ArticleWithAuthor format
	const publishedArticles: ArticleWithAuthor[] = (articlesData || []).map((item: any) => ({
		id: item.id,
		title: item.title,
		abstract: item.abstract,
		keywords: item.keywords,
		doi: item.doi,
		volume: item.volume,
		issue: item.issue,
		start_page: item.start_page,
		end_page: item.end_page,
		published_date: item.published_date,
		article_type: item.article_type,
		citation_count: item.citation_count,
		file_url: item.file_url,
		author_id: '',
		status: 'published' as const,
		created_at: item.created_at,
		updated_at: item.updated_at,
		users: {
			name: item.author_name,
			email: '',
			affiliation: item.author_affiliation
		}
	}))

	// Group by volume and issue
	const groupedArticles = publishedArticles.reduce((acc, article) => {
		const key = `v${article.volume || 0}_i${article.issue || 0}`
		if (!acc[key]) {
			acc[key] = []
		}
		acc[key].push(article)
		return acc
	}, {} as Record<string, ArticleWithAuthor[]>)

	const getArticleTypeLabel = (type: string = 'research') => {
		const labels: Record<string, string> = {
			research: 'Araştırma Makalesi',
			review: 'Derleme',
			case_study: 'Vaka Çalışması',
			technical_note: 'Teknik Not',
			editorial: 'Editörden',
			letter: 'Mektup'
		}
		return labels[type] || type
	}

	return (
		<div className="container mx-auto py-8 px-4 max-w-7xl">
			{/* Header */}
			<div className="mb-8">
				<div className="flex items-center gap-3 mb-2">
					<BookOpen className="h-8 w-8 text-blue-600" />
					<h1 className="text-4xl font-bold text-gray-900">Yayınlanan Makaleler</h1>
				</div>
				<p className="text-gray-600 text-lg">Dergimizde yayınlanmış bilimsel makalelere göz atın</p>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-gray-600">Toplam Makale</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-blue-600">{publishedArticles.length}</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-gray-600">Cilt Sayısı</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-green-600">
							{new Set(publishedArticles.map((a) => a.volume)).size}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-gray-600">Toplam Atıf</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-purple-600">
							{publishedArticles.reduce((sum, a) => sum + (a.citation_count || 0), 0)}
						</div>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-gray-600">Son Yayın</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-lg font-semibold text-gray-900">
							{publishedArticles[0]?.published_date
								? new Date(publishedArticles[0].published_date).toLocaleDateString('tr-TR', {
										month: 'short',
										year: 'numeric'
								  })
								: '-'}
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Articles by Issue */}
			<div className="space-y-8">
				{Object.keys(groupedArticles)
					.sort()
					.reverse()
					.map((key) => {
						const issueArticles = groupedArticles[key]
						const firstArticle = issueArticles[0]

						return (
							<div key={key} className="space-y-4">
								{/* Issue Header */}
								<div className="border-l-4 border-blue-600 pl-4 py-2 bg-blue-50 rounded-r-lg">
									<h2 className="text-2xl font-bold text-gray-900">
										Cilt {firstArticle.volume}, Sayı {firstArticle.issue}
									</h2>
									<p className="text-gray-600">
										{firstArticle.published_date &&
											new Date(firstArticle.published_date).toLocaleDateString('tr-TR', {
												month: 'long',
												year: 'numeric'
											})}
									</p>
								</div>

								{/* Articles in this issue */}
								<div className="grid gap-4">
									{issueArticles.map((article) => (
										<Card key={article.id} className="hover:shadow-lg transition-shadow">
											<CardHeader>
												<div className="flex items-start justify-between gap-4">
													<div className="flex-1">
														<div className="flex items-center gap-2 mb-2">
															<Badge variant="secondary">{getArticleTypeLabel(article.article_type)}</Badge>
															{article.citation_count && article.citation_count > 0 && (
																<Badge variant="outline" className="text-xs">
																	{article.citation_count} Atıf
																</Badge>
															)}
														</div>
														<CardTitle className="text-xl mb-2">
															<Link href={`/published/${article.id}`} className="hover:text-blue-600 transition-colors">
																{article.title}
															</Link>
														</CardTitle>
														<CardDescription className="text-base">
															{article.users?.name}
															{article.users?.affiliation && ` • ${article.users?.affiliation}`}
														</CardDescription>
													</div>
													<Link href={`/published/${article.id}`}>
														<Button variant="outline" size="sm">
															<FileText className="h-4 w-4 mr-2" />
															Görüntüle
														</Button>
													</Link>
												</div>
											</CardHeader>
											<CardContent>
												<p className="text-gray-700 line-clamp-3 mb-4">{article.abstract}</p>
												<div className="flex flex-wrap gap-4 text-sm text-gray-600">
													{article.doi && (
														<div className="flex items-center gap-1">
															<ExternalLink className="h-4 w-4" />
															<span className="font-mono">DOI: {article.doi}</span>
														</div>
													)}
													{article.start_page && article.end_page && (
														<div className="flex items-center gap-1">
															<FileText className="h-4 w-4" />
															<span>
																Sayfa {article.start_page}-{article.end_page}
															</span>
														</div>
													)}
													<div className="flex items-center gap-1">
														<Calendar className="h-4 w-4" />
														<span>
															{article.published_date && new Date(article.published_date).toLocaleDateString('tr-TR')}
														</span>
													</div>
												</div>
												{article.keywords && article.keywords.length > 0 && (
													<div className="flex flex-wrap gap-2 mt-4">
														{article.keywords.map((keyword, idx) => (
															<Badge key={idx} variant="outline" className="text-xs">
																{keyword}
															</Badge>
														))}
													</div>
												)}
											</CardContent>
										</Card>
									))}
								</div>
							</div>
						)
					})}
			</div>

			{publishedArticles.length === 0 && (
				<Card className="text-center py-12">
					<CardContent>
						<BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
						<h3 className="text-xl font-semibold text-gray-700 mb-2">Henüz Yayınlanmış Makale Yok</h3>
						<p className="text-gray-500">İlk makaleler yayınlandığında burada görünecektir.</p>
					</CardContent>
				</Card>
			)}
		</div>
	)
}
