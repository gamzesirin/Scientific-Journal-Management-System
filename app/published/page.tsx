import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search, ArrowRight } from 'lucide-react'
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
	title: 'Yayınlanan Makaleler',
	description: 'Yayınlanmış bilimsel makalelere göz atın'
}

export default async function PublishedArticlesPage({
	searchParams
}: {
	searchParams: Promise<{ search?: string; type?: string }>
}) {
	const supabase = await createServerSupabaseClient()
	const params = await searchParams

	let query = supabase.from('public_articles').select('*').order('published_date', { ascending: false })

	if (params.search) {
		query = query.or(`title.ilike.%${params.search}%,abstract.ilike.%${params.search}%`)
	}

	if (params.type && params.type !== 'all') {
		query = query.eq('article_type', params.type)
	}

	const { data: articlesData } = await query

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
			affiliation: item.author_affiliation
		}
	}))

	const groupedArticles = publishedArticles.reduce(
		(acc, article) => {
			const key = `v${article.volume || 0}_i${article.issue || 0}`
			if (!acc[key]) acc[key] = []
			acc[key].push(article)
			return acc
		},
		{} as Record<string, ArticleWithAuthor[]>
	)

	const getArticleTypeLabel = (type: string = 'research') => {
		const labels: Record<string, string> = {
			research: 'Araştırma',
			review: 'Derleme',
			case_study: 'Vaka Çalışması',
			technical_note: 'Teknik Not',
			editorial: 'Editörden',
			letter: 'Mektup'
		}
		return labels[type] || type
	}

	return (
		<div className="min-h-screen bg-white">
			{/* Header */}
			<div className="border-b">
				<div className="container mx-auto px-4 py-12 max-w-4xl">
					<h1 className="text-3xl font-semibold text-gray-900 mb-2">Yayınlanan Makaleler</h1>
					<p className="text-gray-500 mb-8">Hakemli bilimsel makalelere göz atın</p>

					{/* Search */}
					<form action="/published" method="get">
						<div className="relative max-w-xl">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
							<Input
								type="text"
								name="search"
								placeholder="Makale ara..."
								defaultValue={params.search || ''}
								className="pl-10 h-11 border-gray-200"
							/>
						</div>
					</form>
				</div>
			</div>

			{/* Filters */}
			<div className="border-b bg-gray-50/50">
				<div className="container mx-auto px-4 py-3 max-w-4xl">
					<div className="flex flex-wrap gap-2">
						<Link href="/published">
							<Badge
								variant={!params.type || params.type === 'all' ? 'default' : 'secondary'}
								className="cursor-pointer"
							>
								Tümü
							</Badge>
						</Link>
						{['research', 'review', 'case_study'].map((type) => (
							<Link key={type} href={`/published?type=${type}${params.search ? `&search=${params.search}` : ''}`}>
								<Badge variant={params.type === type ? 'default' : 'secondary'} className="cursor-pointer">
									{getArticleTypeLabel(type)}
								</Badge>
							</Link>
						))}
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="container mx-auto px-4 py-8 max-w-4xl">
				{params.search && (
					<p className="text-sm text-gray-500 mb-6">
						&quot;{params.search}&quot; için {publishedArticles.length} sonuç
					</p>
				)}

				{publishedArticles.length > 0 ? (
					<div className="space-y-12">
						{Object.keys(groupedArticles)
							.sort()
							.reverse()
							.map((key) => {
								const issueArticles = groupedArticles[key]
								const firstArticle = issueArticles[0]

								return (
									<section key={key}>
										<div className="flex items-baseline gap-3 mb-6 pb-2 border-b">
											<h2 className="text-lg font-medium text-gray-900">
												Cilt {firstArticle.volume}, Sayı {firstArticle.issue}
											</h2>
											<span className="text-sm text-gray-400">
												{firstArticle.published_date &&
													new Date(firstArticle.published_date).toLocaleDateString('tr-TR', {
														month: 'long',
														year: 'numeric'
													})}
											</span>
										</div>

										<div className="space-y-4">
											{issueArticles.map((article) => (
												<Link key={article.id} href={`/published/${article.id}`} className="block group">
													<Card className="p-5 hover:border-gray-300 transition-colors">
														<div className="flex items-start justify-between gap-4">
															<div className="flex-1 min-w-0">
																<div className="flex items-center gap-2 mb-2">
																	<Badge variant="outline" className="text-xs font-normal">
																		{getArticleTypeLabel(article.article_type)}
																	</Badge>
																	{article.start_page && article.end_page && (
																		<span className="text-xs text-gray-400">
																			s. {article.start_page}-{article.end_page}
																		</span>
																	)}
																</div>

																<h3 className="text-base font-medium text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
																	{article.title}
																</h3>

																<p className="text-sm text-gray-500 mb-2">{article.users?.name}</p>

																<p className="text-sm text-gray-600 line-clamp-2">{article.abstract}</p>

																{article.keywords && article.keywords.length > 0 && (
																	<div className="flex flex-wrap gap-1.5 mt-3">
																		{article.keywords.slice(0, 3).map((keyword, idx) => (
																			<span key={idx} className="text-xs text-gray-400">
																				{keyword}
																				{idx < Math.min(article.keywords!.length, 3) - 1 && ' · '}
																			</span>
																		))}
																	</div>
																)}
															</div>

															<ArrowRight className="h-4 w-4 text-gray-300 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
														</div>
													</Card>
												</Link>
											))}
										</div>
									</section>
								)
							})}
					</div>
				) : (
					<div className="text-center py-16">
						<p className="text-gray-500 mb-4">
							{params.search ? `"${params.search}" için sonuç bulunamadı` : 'Henüz yayınlanmış makale yok'}
						</p>
						{params.search && (
							<Link href="/published">
								<Button variant="outline" size="sm">
									Tümünü göster
								</Button>
							</Link>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
