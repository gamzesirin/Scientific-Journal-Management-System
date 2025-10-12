import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, ArrowLeft } from 'lucide-react'
import ArticleList from '@/features/articles/components/ArticleList'

export default async function ArticlesPage() {
	const supabase = await createServerSupabaseClient()
	const { data: { user } } = await supabase.auth.getUser()

	if (!user) {
		redirect('/auth/login')
	}

	// Get user data with role
	const { data: userData } = await supabase
		.from('users')
		.select('*')
		.eq('id', user.id)
		.single()

	// Get articles based on role
	let articles: any[] = []

	if (userData?.role === 'author') {
		// Authors see only their articles
		const { data } = await supabase
			.from('articles')
			.select('*')
			.eq('author_id', user.id)
			.order('created_at', { ascending: false })
		articles = data || []
	} else if (userData?.role === 'editor' || userData?.role === 'admin') {
		// Editör filtresi: sadece kendilerine atanan makaleler
		// Admin filtresi: tüm makaleler
		const isEditor = userData?.role === 'editor'
		
		let query = supabase
			.from('articles')
			.select(`
				*,
				users!articles_author_id_fkey(name, email)
			`)
		
		if (isEditor) {
			query = query.eq('assigned_editor_id', user.id)
		}
		
		const { data: articlesWithAuthor, error: joinError } = await query.order('created_at', { ascending: false })

		// Eğer join başarılı olduysa
		if (!joinError && articlesWithAuthor) {
			articles = articlesWithAuthor
		} else {
			// Join başarısız olduysa, makaleleri ve yazarları ayrı çek
			console.log('Join failed, trying separate queries...', joinError)

			let simpleQuery = supabase
				.from('articles')
				.select('*')
			
			if (isEditor) {
				simpleQuery = simpleQuery.eq('assigned_editor_id', user.id)
			}
			
			const { data: articlesData } = await simpleQuery.order('created_at', { ascending: false })

			if (articlesData && articlesData.length > 0) {
				// Yazar bilgilerini ayrı çek
				const authorIds = [...new Set(articlesData.map(a => a.author_id).filter(Boolean))]
				const { data: authors } = await supabase
					.from('users')
					.select('id, name, email')
					.in('id', authorIds)

				const authorsMap = new Map(authors?.map(a => [a.id, a]) || [])

				// Yazar bilgilerini makalelere ekle
				articles = articlesData.map(article => ({
					...article,
					users: authorsMap.get(article.author_id)
				}))
			}
		}
	} else {
		// Reviewers and others redirect to dashboard
		redirect('/dashboard')
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* Navigation */}
				<div className="mb-6">
					<Link href="/dashboard">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Dashboard'a Dön
						</Button>
					</Link>
				</div>

				{/* Header */}
				<div className="flex justify-between items-center mb-6">
					<div>
						<h1 className="text-3xl font-bold text-gray-900">
							{userData?.role === 'author' ? 'Makalelerim' : 'Tüm Makaleler'}
						</h1>
						<p className="text-gray-600 mt-2">
							{userData?.role === 'author'
								? 'Gönderdiğiniz makaleleri görüntüleyin ve yönetin'
								: 'Sistemdeki tüm makaleleri görüntüleyin'
							}
						</p>
					</div>
					{userData?.role === 'author' && (
						<Link href="/articles/upload">
							<Button>
								<Plus className="h-4 w-4 mr-2" />
								Yeni Makale Yükle
							</Button>
						</Link>
					)}
				</div>

				{/* Articles List */}
				<Card>
					<CardHeader>
						<CardTitle>Makale Listesi</CardTitle>
						<CardDescription>
							Toplam {articles.length} makale
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ArticleList articles={articles} />
					</CardContent>
				</Card>
			</div>
		</div>
	)
}