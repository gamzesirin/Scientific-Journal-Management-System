import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Article } from '@/features/articles/types/article.types'

interface ArticleWithAuthor extends Omit<Article, 'author' | 'users'> {
	users?: {
		name: string
		email?: string
		affiliation?: string
	}
}

interface PageProps {
	params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
	const supabase = await createServerSupabaseClient()
	const { id } = await params

	const { data: article } = await supabase
		.from('public_articles')
		.select('title, abstract')
		.eq('id', id)
		.single()

	if (!article) {
		return { title: 'Makale Bulunamadı' }
	}

	return {
		title: article.title,
		description: article.abstract?.substring(0, 160)
	}
}

export default async function PublishedArticlePage({ params }: PageProps) {
	const supabase = await createServerSupabaseClient()
	const { id } = await params

	const { data: articleData, error } = await supabase.from('public_articles').select('*').eq('id', id).single()

	if (error || !articleData) {
		notFound()
	}

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
			affiliation: articleData.author_affiliation
		}
	}

	const { data: coauthors } = await supabase.from('coauthors').select('*').eq('article_id', id).order('order_index')

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

	const allAuthors = [
		{ name: article.users?.name, affiliation: article.users?.affiliation },
		...(coauthors || [])
	].filter((a) => a.name)

	return (
		<div className="min-h-screen bg-white">
			{/* Navigation */}
			<div className="border-b">
				<div className="container mx-auto px-4 py-4 max-w-3xl">
					<Link href="/published">
						<Button variant="ghost" size="sm" className="gap-2 -ml-2 text-gray-600">
							<ArrowLeft className="h-4 w-4" />
							Geri
						</Button>
					</Link>
				</div>
			</div>

			{/* Article */}
			<article className="container mx-auto px-4 py-10 max-w-3xl">
				<Card className="p-6 md:p-8 mb-6 overflow-hidden">
					{/* Meta */}
					<div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-6">
						<Badge variant="outline" className="font-normal">
							{getArticleTypeLabel(article.article_type)}
						</Badge>
						<span>
							Cilt {article.volume}, Sayı {article.issue}
						</span>
						{article.start_page && article.end_page && (
							<span>
								s. {article.start_page}-{article.end_page}
							</span>
						)}
						<span>
							{article.published_date &&
								new Date(article.published_date).toLocaleDateString('tr-TR', {
									day: 'numeric',
									month: 'long',
									year: 'numeric'
								})}
						</span>
					</div>

					{/* Title */}
					<h1 className="text-2xl md:text-3xl font-semibold text-gray-900 leading-tight mb-6 break-words">
						{article.title}
					</h1>

					{/* Authors */}
					<div className="mb-6">
						{allAuthors.map((author, idx) => (
							<div key={idx} className="mb-1 break-words">
								<span className="font-medium text-gray-900">{author.name}</span>
								{author.affiliation && <span className="text-gray-500 text-sm ml-2">{author.affiliation}</span>}
							</div>
						))}
					</div>

					{/* DOI */}
					{article.doi && (
						<a
							href={`https://doi.org/${article.doi}`}
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline break-all"
						>
							<ExternalLink className="h-3.5 w-3.5 flex-shrink-0" />
							<span className="break-all">doi.org/{article.doi}</span>
						</a>
					)}
				</Card>

				{/* Abstract */}
				<Card className="p-6 md:p-8 mb-6 overflow-hidden">
					<h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Özet</h2>
					<p className="text-gray-700 leading-relaxed text-justify break-words">{article.abstract}</p>

					{/* Keywords */}
					{article.keywords && article.keywords.length > 0 && (
						<div className="mt-6 pt-6 border-t">
							<h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">Anahtar Kelimeler</h2>
							<div className="flex flex-wrap gap-2">
								{article.keywords.map((keyword, idx) => (
									<Badge key={idx} variant="secondary" className="font-normal">
										{keyword}
									</Badge>
								))}
							</div>
						</div>
					)}
				</Card>

				{/* Citation */}
				<Card className="p-6 md:p-8 overflow-hidden">
					<h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">Alıntı</h2>
					<p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-lg font-mono leading-relaxed break-words overflow-x-auto">
						{allAuthors.map((a) => a.name).join(', ')} (
						{article.published_date && new Date(article.published_date).getFullYear()}). {article.title}.{' '}
						<em>Dergi Adı</em>, {article.volume}({article.issue}), {article.start_page}-{article.end_page}.
						{article.doi && ` https://doi.org/${article.doi}`}
					</p>
				</Card>
			</article>
		</div>
	)
}
