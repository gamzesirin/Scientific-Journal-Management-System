import { createServerSupabaseClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Download } from 'lucide-react'
import Link from 'next/link'
import ArticleTimeline from '@/features/articles/components/ArticleTimeline'
import RevisionUploadForm from '@/features/articles/components/RevisionUploadForm'
import RevisionHistory from '@/features/articles/components/RevisionHistory'
import CoauthorsManager from '@/features/articles/components/CoauthorsManager'

const statusColors: Record<string, string> = {
	submitted: 'bg-blue-500',
	under_review: 'bg-yellow-500',
	revision_requested: 'bg-orange-500',
	accepted: 'bg-green-500',
	rejected: 'bg-red-500',
	published: 'bg-purple-500'
}

const statusLabels: Record<string, string> = {
	submitted: 'Gönderildi',
	under_review: 'İnceleme Altında',
	revision_requested: 'Revizyon İstendi',
	accepted: 'Kabul Edildi',
	rejected: 'Reddedildi',
	published: 'Yayınlandı'
}

export default async function ArticleDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const supabase = await createServerSupabaseClient()
	const resolvedParams = await params

	// Auth check
	const {
		data: { user }
	} = await supabase.auth.getUser()

	if (!user) {
		redirect('/login')
	}

	// Get user data
	const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()

	// Get article
	const { data: article, error: articleError } = await supabase
		.from('articles')
		.select('*')
		.eq('id', resolvedParams.id)
		.single()

	if (articleError || !article) {
		notFound()
	}

	// Get author separately
	const { data: authorData } = await supabase
		.from('users')
		.select('name, email, affiliation')
		.eq('id', article.author_id)
		.single()

	// Add author to article
	const articleWithAuthor = {
		...article,
		author: authorData || { name: 'Unknown', email: '', affiliation: '' }
	}

	// Check if user is the author
	const isAuthor = user.id === articleWithAuthor.author_id
	const isAdmin = userData?.role === 'admin'
	const isEditor = userData?.role === 'editor'

	// Check if user is a co-author
	const { data: coauthorData } = await supabase
		.from('article_coauthors')
		.select('id')
		.eq('article_id', resolvedParams.id)
		.eq('user_id', user.id)
		.single()

	const isCoauthor = !!coauthorData

	// Authors, co-authors, editors, and admins can view articles
	if (!isAuthor && !isCoauthor && !isAdmin && !isEditor) {
		redirect('/dashboard')
	}

	// Co-authors should see details like authors
	const canViewFullDetails = isAuthor || isCoauthor || isAdmin || isEditor

	return (
		<div className="container mx-auto py-8 space-y-6">
			{/* Header */}
			<div className="flex items-center gap-4">
				<Button asChild variant="outline" size="sm">
					<Link href="/dashboard">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Geri Dön
					</Link>
				</Button>
				<h1 className="text-3xl font-bold">Makale Detayları</h1>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main Content */}
				<div className="lg:col-span-2 space-y-6">
					{/* Article Info */}
					<Card>
						<CardHeader>
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1">
									<CardTitle className="text-2xl mb-2">{articleWithAuthor.title}</CardTitle>
									<div className="flex flex-wrap items-center gap-2">
										<Badge className={statusColors[articleWithAuthor.status] || 'bg-gray-500'}>
											{statusLabels[articleWithAuthor.status] || articleWithAuthor.status}
										</Badge>
										{articleWithAuthor.category && <Badge variant="outline">{articleWithAuthor.category}</Badge>}
									</div>
								</div>
								{articleWithAuthor.file_url && (
									<Button asChild variant="outline">
										<a href={articleWithAuthor.file_url} target="_blank" rel="noopener noreferrer">
											<Download className="h-4 w-4 mr-2" />
											PDF İndir
										</a>
									</Button>
								)}
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							<div>
								<h3 className="font-semibold mb-2">Özet</h3>
								<p className="text-gray-700 whitespace-pre-wrap">{articleWithAuthor.abstract}</p>
							</div>

							{articleWithAuthor.keywords && articleWithAuthor.keywords.length > 0 && (
								<div>
									<h3 className="font-semibold mb-2">Anahtar Kelimeler</h3>
									<div className="flex flex-wrap gap-2">
										{articleWithAuthor.keywords.map((keyword: string, index: number) => (
											<Badge key={index} variant="secondary">
												{keyword}
											</Badge>
										))}
									</div>
								</div>
							)}

							<Separator />

							<div className="grid grid-cols-2 gap-4 text-sm">
								<div>
									<p className="text-gray-600">Yazar</p>
									<p className="font-medium">{articleWithAuthor.author.name}</p>
									{articleWithAuthor.author.affiliation && (
										<p className="text-gray-500">{articleWithAuthor.author.affiliation}</p>
									)}
								</div>
								<div>
									<p className="text-gray-600">Gönderim Tarihi</p>
									<p className="font-medium">{new Date(articleWithAuthor.created_at).toLocaleDateString('tr-TR')}</p>
								</div>
								<div>
									<p className="text-gray-600">Son Güncelleme</p>
									<p className="font-medium">{new Date(articleWithAuthor.updated_at).toLocaleDateString('tr-TR')}</p>
								</div>
								{articleWithAuthor.assigned_at && (
									<div>
										<p className="text-gray-600">Atama Tarihi</p>
										<p className="font-medium">{new Date(articleWithAuthor.assigned_at).toLocaleDateString('tr-TR')}</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Timeline */}
					<ArticleTimeline articleId={articleWithAuthor.id} showFullDetails={canViewFullDetails} />

					{/* Coauthors Manager */}
					<CoauthorsManager articleId={articleWithAuthor.id} isAuthor={isAuthor} />

					{/* Revision Upload Form - Only for authors when revision is requested or under review */}
					{isAuthor &&
						(articleWithAuthor.status === 'revision_requested' || articleWithAuthor.status === 'under_review') && (
							<RevisionUploadForm
								articleId={articleWithAuthor.id}
								userId={user.id}
								currentStatus={articleWithAuthor.status}
							/>
						)}

					{/* Revision History - Show to everyone */}
					<RevisionHistory articleId={articleWithAuthor.id} />
				</div>

				{/* Sidebar */}
				<div className="space-y-6">
					{/* Status Info */}
					<Card>
						<CardHeader>
							<CardTitle>Makale Durumu</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="space-y-2">
								<Badge className={`${statusColors[articleWithAuthor.status]} w-full justify-center py-2 text-base`}>
									{statusLabels[articleWithAuthor.status]}
								</Badge>

								{articleWithAuthor.status === 'submitted' && (
									<p className="text-sm text-gray-600 text-center">Makaleniz editör incelemesi bekliyor</p>
								)}
								{articleWithAuthor.status === 'under_review' && (
									<p className="text-sm text-gray-600 text-center">Makaleniz hakemler tarafından inceleniyor</p>
								)}
								{articleWithAuthor.status === 'revision_requested' && (
									<p className="text-sm text-orange-600 text-center font-medium">
										Lütfen makalenizde gerekli düzeltmeleri yapın ve revizyon yükleyin
									</p>
								)}
								{articleWithAuthor.status === 'accepted' && (
									<p className="text-sm text-green-600 text-center font-medium">
										Tebrikler! Makaleniz yayın için onaylandı
									</p>
								)}
								{articleWithAuthor.status === 'published' && (
									<p className="text-sm text-green-700 text-center font-medium">Makaleniz başarıyla yayınlandı</p>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Quick Stats */}
					<Card>
						<CardHeader>
							<CardTitle>Hızlı Bilgiler</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3 text-sm">
								<div className="flex items-center justify-between">
									<span className="text-gray-600">Makale ID</span>
									<span className="font-mono text-xs">{articleWithAuthor.id.slice(0, 8)}...</span>
								</div>
								<Separator />
								<div className="flex items-center justify-between">
									<span className="text-gray-600">Anahtar Kelime</span>
									<span className="font-medium">{articleWithAuthor.keywords?.length || 0}</span>
								</div>
								<Separator />
								<div className="flex items-center justify-between">
									<span className="text-gray-600">Kategori</span>
									<span className="font-medium">{articleWithAuthor.category || 'Genel'}</span>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Help Card */}
					{(isAuthor || isCoauthor) && (
						<Card className="bg-blue-50 border-blue-200">
							<CardHeader>
								<CardTitle className="text-blue-900">
									{isCoauthor && !isAuthor ? 'Ortak Yazar Bilgisi' : 'Yardım'}
								</CardTitle>
							</CardHeader>
							<CardContent className="text-sm text-blue-800 space-y-2">
								{isCoauthor && !isAuthor && (
									<p className="font-semibold text-blue-900 mb-2">
										Bu makalede ortak yazar olarak yer alıyorsunuz.
									</p>
								)}
								<p>
									<strong>Makale Takibi:</strong> Soldaki zaman çizelgesinden makalenin tüm süreçlerini takip
									edebilirsiniz.
								</p>
								{isAuthor && (
									<p>
										<strong>Revizyon İstendi mi?</strong> Editör veya hakemlerden gelen önerilere göre makalenizi
										güncelleyin.
									</p>
								)}
								{isCoauthor && !isAuthor && (
									<p>
										<strong>Not:</strong> Ortak yazar olarak makale durumunu görüntüleyebilirsiniz. Dosya yükleme ve değişiklik yapma yetkiniz bulunmamaktadır.
									</p>
								)}
							</CardContent>
						</Card>
					)}
				</div>
			</div>
		</div>
	)
}
