import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { BookOpen, Calendar, FileText, ExternalLink, Download, ArrowLeft, User, Building } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Article } from '@/features/articles/types/article.types'

interface ArticleWithAuthor extends Omit<Article, 'author' | 'users'> {
	author?: {
		name: string
		email?: string
		affiliation?: string
	}
	users?: {
		name: string
		email?: string
		affiliation?: string
	}
}

interface PageProps {
	params: Promise<{
		id: string
	}>
}

export async function generateMetadata({ params }: PageProps) {
	const supabase = await createServerSupabaseClient()
	const { id } = await params

	const { data: article } = await supabase
		.from('public_articles')
		.select('title, abstract, keywords')
		.eq('id', id)
		.single()

	if (!article) {
		return {
			title: 'Makale Bulunamadı'
		}
	}

	return {
		title: `${article.title} - Yayınlanmış Makale`,
		description: article.abstract?.substring(0, 160)
	}
}

export default async function PublishedArticlePage({ params }: PageProps) {
	const supabase = await createServerSupabaseClient()
	const { id } = await params

	// Fetch published article from public_articles view
	const { data: articleData, error } = await supabase
		.from('public_articles')
		.select('*')
		.eq('id', id)
		.single()

	if (error || !articleData) {
		notFound()
	}

	// Map view data to ArticleWithAuthor format
	const article: ArticleWithAuthor = {
		id: articleData.id,
		title: articleData.title,
		abstract: articleData.abstract,
		keywords: articleData.keywords,
		doi: articleData.doi,
		volume: articleData.volume,
		issue: articleData.issue,
		start_page: articleData.start_page,
		end_page: articleData.end_page,
		published_date: articleData.published_date,
		article_type: articleData.article_type,
		citation_count: articleData.citation_count,
		file_url: articleData.file_url,
		author_id: articleData.author_id || '',
		status: 'published' as const,
		created_at: articleData.created_at,
		updated_at: articleData.updated_at,
		users: {
			name: articleData.author_name,
			email: articleData.author_email || '',
			affiliation: articleData.author_affiliation
		}
	}

	// Fetch coauthors
	const { data: coauthors } = await supabase
		.from('coauthors')
		.select('*')
		.eq('article_id', id)
		.order('order_index')

	const typedArticle = article

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
		<div className="container mx-auto py-8 px-4 max-w-5xl">
			{/* Back Button */}
			<Link href="/published">
				<Button variant="ghost" className="mb-6">
					<ArrowLeft className="h-4 w-4 mr-2" />
					Tüm Makalelere Dön
				</Button>
			</Link>

			{/* Main Article Card */}
			<Card className="mb-6">
				<CardHeader className="space-y-4">
					{/* Article Type & Citation Badge */}
					<div className="flex items-center gap-2">
						<Badge variant="secondary" className="text-sm">
							{getArticleTypeLabel(typedArticle.article_type)}
						</Badge>
						{typedArticle.citation_count && typedArticle.citation_count > 0 && (
							<Badge variant="outline">{typedArticle.citation_count} Atıf</Badge>
						)}
					</div>

					{/* Title */}
					<CardTitle className="text-3xl leading-tight">{typedArticle.title}</CardTitle>

					{/* Authors */}
					<div className="space-y-2">
						<div className="flex items-start gap-2">
							<User className="h-5 w-5 text-gray-500 mt-0.5" />
							<div>
								<p className="font-semibold text-lg">{typedArticle.author?.name || typedArticle.users?.name}</p>
								{(typedArticle.author?.affiliation || typedArticle.users?.affiliation) && (
									<p className="text-sm text-gray-600 flex items-center gap-1">
										<Building className="h-3 w-3" />
										{typedArticle.author?.affiliation || typedArticle.users?.affiliation}
									</p>
								)}
							</div>
						</div>

						{/* Coauthors */}
						{coauthors && coauthors.length > 0 && (
							<div className="ml-7 space-y-1">
								{coauthors.map((coauthor) => (
									<div key={coauthor.id}>
										<p className="font-medium">{coauthor.name}</p>
										{coauthor.affiliation && (
											<p className="text-sm text-gray-600 flex items-center gap-1">
												<Building className="h-3 w-3" />
												{coauthor.affiliation}
											</p>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</CardHeader>

				<CardContent className="space-y-6">
					{/* Publication Info */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
						<div className="space-y-2">
							{typedArticle.doi && (
								<div className="flex items-center gap-2 text-sm">
									<ExternalLink className="h-4 w-4 text-gray-500" />
									<span className="font-medium">DOI:</span>
									<code className="bg-white px-2 py-1 rounded text-xs">{typedArticle.doi}</code>
								</div>
							)}
							<div className="flex items-center gap-2 text-sm">
								<BookOpen className="h-4 w-4 text-gray-500" />
								<span className="font-medium">
									Cilt {typedArticle.volume}, Sayı {typedArticle.issue}
								</span>
							</div>
							{typedArticle.start_page && typedArticle.end_page && (
								<div className="flex items-center gap-2 text-sm">
									<FileText className="h-4 w-4 text-gray-500" />
									<span>
										Sayfa {typedArticle.start_page}-{typedArticle.end_page}
									</span>
								</div>
							)}
						</div>
						<div className="space-y-2">
							<div className="flex items-center gap-2 text-sm">
								<Calendar className="h-4 w-4 text-gray-500" />
								<span className="font-medium">Yayın Tarihi:</span>
								<span>
									{typedArticle.published_date &&
										new Date(typedArticle.published_date).toLocaleDateString('tr-TR', {
											day: 'numeric',
											month: 'long',
											year: 'numeric'
										})}
								</span>
							</div>
						</div>
					</div>

					<Separator />

					{/* Abstract */}
					<div>
						<h2 className="text-2xl font-bold mb-4">Özet</h2>
						<p className="text-gray-700 leading-relaxed text-justify">{typedArticle.abstract}</p>
					</div>

					{/* Keywords */}
					{typedArticle.keywords && typedArticle.keywords.length > 0 && (
						<div>
							<h3 className="text-lg font-semibold mb-3">Anahtar Kelimeler</h3>
							<div className="flex flex-wrap gap-2">
								{typedArticle.keywords.map((keyword, idx) => (
									<Badge key={idx} variant="outline" className="text-sm px-3 py-1">
										{keyword}
									</Badge>
								))}
							</div>
						</div>
					)}

					<Separator />

					{/* Download Button */}
					<div className="flex justify-center pt-4">
						<a href={typedArticle.file_url} download target="_blank" rel="noopener noreferrer">
							<Button size="lg" className="bg-blue-600 hover:bg-blue-700">
								<Download className="h-5 w-5 mr-2" />
								Makaleyi İndir (PDF)
							</Button>
						</a>
					</div>
				</CardContent>
			</Card>

			{/* Citation Box */}
			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Alıntı Yapma</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
						<p>
							{typedArticle.author?.name || typedArticle.users?.name}
							{coauthors && coauthors.length > 0 && `, ${coauthors.map((c) => c.name).join(', ')}`} (
							{typedArticle.published_date && new Date(typedArticle.published_date).getFullYear()}).{' '}
							{typedArticle.title}. <em>Dergi Adı</em>, {typedArticle.volume}({typedArticle.issue}),{' '}
							{typedArticle.start_page}-{typedArticle.end_page}.{' '}
							{typedArticle.doi && `https://doi.org/${typedArticle.doi}`}
						</p>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
