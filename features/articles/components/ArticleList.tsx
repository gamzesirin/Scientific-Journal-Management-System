import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Article } from '@/features/articles/types/article.types'

type ArticleListProps = {
	articles?: Article[]
	userRole?: 'author' | 'editor' | 'reviewer' | 'admin'
	userId?: string
}

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

export default function ArticleList({ articles = [], userRole = 'author', userId }: ArticleListProps) {
	// Role göre detay linkini belirle
	const getDetailLink = (articleId: string) => {
		if (userRole === 'editor') {
			return `/editor/articles/${articleId}`
		} else if (userRole === 'admin') {
			return `/admin/articles` // veya admin için özel bir sayfa
		}
		return `/articles/${articleId}`
	}

	if (articles.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Makaleler</CardTitle>
					<CardDescription>Henüz makale bulunmamaktadır</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-center text-muted-foreground py-8">
						{userRole === 'author'
							? 'Henüz makale yüklemediniz. Yeni bir makale yüklemek için yukarıdaki formu kullanın.'
							: 'Henüz sistemde makale bulunmamaktadır.'}
					</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Makaleler</CardTitle>
				<CardDescription>Toplam {articles.length} makale</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="rounded-md border">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Başlık</TableHead>
								{userRole !== 'author' && <TableHead>Yazar</TableHead>}
								<TableHead>Kategori</TableHead>
								<TableHead>Durum</TableHead>
								<TableHead>Tarih</TableHead>
								<TableHead className="text-right">İşlemler</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{articles.map((article) => (
								<TableRow key={article.id}>
									<TableCell className="font-medium">
										<div className="max-w-md">
											<p className="font-semibold">{article.title}</p>
											<p className="text-sm text-muted-foreground line-clamp-2">{article.abstract}</p>
										</div>
									</TableCell>
									{userRole !== 'author' && (
										<TableCell>
											<p className="text-sm">{article.users?.name || 'Bilinmiyor'}</p>
										</TableCell>
									)}
									<TableCell>
										<Badge variant="outline">{article.category || 'Genel'}</Badge>
									</TableCell>
									<TableCell>
										<Badge className={statusColors[article.status] || 'bg-gray-500'}>
											{statusLabels[article.status] || article.status}
										</Badge>
									</TableCell>
									<TableCell>{new Date(article.created_at).toLocaleDateString('tr-TR')}</TableCell>
									<TableCell className="text-right">
										<Button asChild variant="outline" size="sm">
											<Link href={getDetailLink(article.id)}>
												{userRole === 'editor' || userRole === 'admin' ? 'Detay' : 'Görüntüle'}
											</Link>
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</CardContent>
		</Card>
	)
}
