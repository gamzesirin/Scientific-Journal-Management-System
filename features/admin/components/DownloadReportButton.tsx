'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'

interface Article {
	status: string
	created_at: string
}

interface User {
	role: string
	created_at: string
}

interface Review {
	status: string
	created_at: string
}

interface DownloadReportButtonProps {
	articles: Article[]
	users: User[]
	reviews: Review[]
}

export default function DownloadReportButton({ articles, users, reviews }: DownloadReportButtonProps) {
	const handleDownload = () => {
		try {
			// Rapor verileri hazırla
			const reportData = {
				generated_at: new Date().toISOString(),
				summary: {
					total_users: users.length,
					total_articles: articles.length,
					total_reviews: reviews.length
				},
				articles_by_status: articles.reduce((acc: any, article) => {
					acc[article.status] = (acc[article.status] || 0) + 1
					return acc
				}, {}),
				users_by_role: users.reduce((acc: any, user) => {
					acc[user.role] = (acc[user.role] || 0) + 1
					return acc
				}, {}),
				reviews_by_status: reviews.reduce((acc: any, review) => {
					acc[review.status] = (acc[review.status] || 0) + 1
					return acc
				}, {})
			}

			// JSON formatında rapor oluştur
			const jsonString = JSON.stringify(reportData, null, 2)
			const blob = new Blob([jsonString], { type: 'application/json' })
			const url = URL.createObjectURL(blob)

			// İndirme linkini oluştur ve tıkla
			const link = document.createElement('a')
			link.href = url
			link.download = `sistem-raporu-${new Date().toISOString().split('T')[0]}.json`
			document.body.appendChild(link)
			link.click()

			// Temizlik
			document.body.removeChild(link)
			URL.revokeObjectURL(url)

			toast.success('Rapor başarıyla indirildi')
		} catch (error) {
			console.error('Rapor indirme hatası:', error)
			toast.error('Rapor indirilirken bir hata oluştu')
		}
	}

	return (
		<Button onClick={handleDownload}>
			<Download className="mr-2 h-4 w-4" />
			Rapor İndir
		</Button>
	)
}
