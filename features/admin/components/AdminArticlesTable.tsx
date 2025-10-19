'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle
} from '@/components/ui/dialog'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Eye, Trash2, Search, Edit, XCircle, UserCog, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import PublishArticleDialog from './PublishArticleDialog'
import { Article } from '@/features/articles/types/article.types'

interface AdminArticle extends Article {
	author?: {
		name: string
		email: string
	}
}

interface AdminArticlesTableProps {
	articles: AdminArticle[]
}

interface Editor {
	id: string
	name: string
	email: string
}

export default function AdminArticlesTable({ articles }: AdminArticlesTableProps) {
	const router = useRouter()
	const [searchTerm, setSearchTerm] = useState('')
	const [statusDialogOpen, setStatusDialogOpen] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [editorDialogOpen, setEditorDialogOpen] = useState(false)
	const [publishDialogOpen, setPublishDialogOpen] = useState(false)
	const [selectedArticle, setSelectedArticle] = useState<AdminArticle | null>(null)
	const [newStatus, setNewStatus] = useState('')
	const [selectedEditorId, setSelectedEditorId] = useState('unassign')
	const [editors, setEditors] = useState<Editor[]>([])
	const [editorNames, setEditorNames] = useState<Map<string, string>>(new Map())
	const [isSubmitting, setIsSubmitting] = useState(false)

	// Editörleri ve atanmış editör isimlerini yükle
	useEffect(() => {
		const loadEditors = async () => {
			const supabase = createClient()
			const { data: editorsData } = await supabase
				.from('users')
				.select('id, name, email')
				.eq('role', 'editor')
				.eq('is_active', true)
				.order('name')

			if (editorsData) {
				setEditors(editorsData)

				// Atanmış editör isimlerini map'e ekle
				const namesMap = new Map<string, string>()
				editorsData.forEach((editor) => {
					namesMap.set(editor.id, editor.name)
				})
				setEditorNames(namesMap)
			}
		}

		loadEditors()
	}, [])

	const filteredArticles = articles.filter(
		(article) =>
			article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
			article.author?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			article.status.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const handleStatusClick = (article: AdminArticle) => {
		setSelectedArticle(article)
		setNewStatus(article.status)
		setStatusDialogOpen(true)
	}

	const handleDeleteClick = (article: AdminArticle) => {
		setSelectedArticle(article)
		setDeleteDialogOpen(true)
	}

	const handleEditorClick = (article: AdminArticle) => {
		setSelectedArticle(article)
		setSelectedEditorId(article.assigned_editor_id || 'unassign')
		setEditorDialogOpen(true)
	}

	const handlePublishClick = (article: AdminArticle) => {
		setSelectedArticle(article)
		setPublishDialogOpen(true)
	}

	const handleRejectClick = async (article: AdminArticle) => {
		setIsSubmitting(true)
		try {
			const response = await fetch(`/api/admin/articles/${article.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status: 'rejected' })
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Güncelleme başarısız')
			}

			toast.success('Makale reddedildi')
			router.refresh()
		} catch (error) {
			console.error('Error rejecting article:', error)
			toast.error(error instanceof Error ? error.message : 'Makale reddedilirken bir hata oluştu')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleStatusSubmit = async () => {
		if (!selectedArticle) return

		setIsSubmitting(true)
		try {
			const response = await fetch(`/api/admin/articles/${selectedArticle.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ status: newStatus })
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Güncelleme başarısız')
			}

			toast.success('Makale durumu başarıyla güncellendi')
			setStatusDialogOpen(false)
			router.refresh()
		} catch (error) {
			console.error('Error updating article status:', error)
			toast.error(error instanceof Error ? error.message : 'Durum güncellenirken bir hata oluştu')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleEditorSubmit = async () => {
		if (!selectedArticle) return

		setIsSubmitting(true)
		try {
			// "unassign" değerini null'a çevir
			const editorIdToAssign = selectedEditorId === 'unassign' ? null : selectedEditorId

			const response = await fetch(`/api/admin/articles/${selectedArticle.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					assigned_editor_id: editorIdToAssign
				})
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Güncelleme başarısız')
			}

			toast.success(editorIdToAssign ? 'Editör başarıyla atandı' : 'Editör ataması kaldırıldı')
			setEditorDialogOpen(false)
			router.refresh()
		} catch (error) {
			console.error('Error updating article editor:', error)
			toast.error(error instanceof Error ? error.message : 'Editör atanırken bir hata oluştu')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleDeleteConfirm = async () => {
		if (!selectedArticle) return

		setIsSubmitting(true)
		try {
			const response = await fetch(`/api/admin/articles/${selectedArticle.id}`, {
				method: 'DELETE'
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Silme başarısız')
			}

			toast.success('Makale başarıyla silindi')
			setDeleteDialogOpen(false)
			router.refresh()
		} catch (error) {
			console.error('Error deleting article:', error)
			toast.error(error instanceof Error ? error.message : 'Makale silinirken bir hata oluştu')
		} finally {
			setIsSubmitting(false)
		}
	}

	const getStatusBadgeVariant = (status: string) => {
		switch (status) {
			case 'submitted':
				return 'secondary'
			case 'under_review':
				return 'default'
			case 'revision_requested':
				return 'outline'
			case 'accepted':
				return 'default'
			case 'rejected':
				return 'destructive'
			case 'published':
				return 'default'
			default:
				return 'outline'
		}
	}

	const getStatusLabel = (status: string) => {
		switch (status) {
			case 'submitted':
				return 'Gönderildi'
			case 'under_review':
				return 'İncelemede'
			case 'revision_requested':
				return 'Revizyon İstendi'
			case 'accepted':
				return 'Kabul Edildi'
			case 'rejected':
				return 'Reddedildi'
			case 'published':
				return 'Yayınlandı'
			default:
				return status
		}
	}

	return (
		<div className="space-y-4">
			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
				<Input
					placeholder="Makale başlığı, yazar veya durum ile ara..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="pl-10"
				/>
			</div>

			{/* Table */}
			<div className="border rounded-lg overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Başlık</TableHead>
							<TableHead>Yazar</TableHead>
							<TableHead>Atanan Editör</TableHead>
							<TableHead>Durum</TableHead>
							<TableHead>Gönderim Tarihi</TableHead>
							<TableHead className="text-right">İşlemler</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredArticles.map((article) => (
							<TableRow key={article.id}>
								<TableCell className="font-medium max-w-md truncate">{article.title}</TableCell>
								<TableCell>{article.author?.name || 'Bilinmiyor'}</TableCell>
								<TableCell>
									{article.assigned_editor_id ? (
										<div className="flex items-center gap-2">
											<span className="text-sm">{editorNames.get(article.assigned_editor_id) || 'Yükleniyor...'}</span>
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleEditorClick(article)}
												title="Editörü Değiştir"
											>
												<Edit className="h-3 w-3" />
											</Button>
										</div>
									) : (
										<Button variant="outline" size="sm" onClick={() => handleEditorClick(article)} title="Editör Ata">
											<UserCog className="h-4 w-4 mr-1" />
											Editör Ata
										</Button>
									)}
								</TableCell>
								<TableCell>
									<Badge variant={getStatusBadgeVariant(article.status)}>{getStatusLabel(article.status)}</Badge>
								</TableCell>
								<TableCell>{new Date(article.created_at).toLocaleDateString('tr-TR')}</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-2">
										<Link href={`/articles/${article.id}`}>
											<Button variant="outline" size="sm" title="Görüntüle">
												<Eye className="h-4 w-4" />
											</Button>
										</Link>
										{article.status === 'accepted' && (
											<Button
												variant="default"
												size="sm"
												onClick={() => handlePublishClick(article)}
												className="bg-green-600 hover:bg-green-700"
												title="Yayınla"
											>
												<Sparkles className="h-4 w-4 mr-1" />
												Yayınla
											</Button>
										)}
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleStatusClick(article)}
											title="Durumu Güncelle"
										>
											<Edit className="h-4 w-4" />
										</Button>
										{article.status !== 'rejected' && article.status !== 'published' && (
											<Button
												variant="destructive"
												size="sm"
												onClick={() => handleRejectClick(article)}
												disabled={isSubmitting}
												title="Reddet"
											>
												<XCircle className="h-4 w-4" />
											</Button>
										)}
										<Button variant="destructive" size="sm" onClick={() => handleDeleteClick(article)} title="Sil">
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{filteredArticles.length === 0 && (
				<p className="text-center text-gray-500 py-8">Arama kriterine uygun makale bulunamadı.</p>
			)}

			{/* Editor Assignment Dialog */}
			<Dialog open={editorDialogOpen} onOpenChange={setEditorDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Editör Ata</DialogTitle>
						<DialogDescription>"{selectedArticle?.title}" makalesine editör atayın.</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="editor">Editör</Label>
							<Select value={selectedEditorId || 'unassign'} onValueChange={setSelectedEditorId}>
								<SelectTrigger id="editor">
									<SelectValue placeholder="Editör seçin" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="unassign">Editör Atamasını Kaldır</SelectItem>
									{editors.map((editor) => (
										<SelectItem key={editor.id} value={editor.id}>
											{editor.name} ({editor.email})
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							{editors.length === 0 && <p className="text-sm text-gray-500">Aktif editör bulunamadı.</p>}
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setEditorDialogOpen(false)} disabled={isSubmitting}>
							İptal
						</Button>
						<Button onClick={handleEditorSubmit} disabled={isSubmitting}>
							{isSubmitting ? 'Atanıyor...' : 'Ata'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Status Update Dialog */}
			<Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Makale Durumunu Güncelle</DialogTitle>
						<DialogDescription>"{selectedArticle?.title}" makalesinin durumunu değiştirin.</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="status">Yeni Durum</Label>
							<Select value={newStatus} onValueChange={setNewStatus}>
								<SelectTrigger id="status">
									<SelectValue placeholder="Durum seçin" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="submitted">Gönderildi</SelectItem>
									<SelectItem value="under_review">İncelemede</SelectItem>
									<SelectItem value="revision_requested">Revizyon İstendi</SelectItem>
									<SelectItem value="accepted">Kabul Edildi</SelectItem>
									<SelectItem value="rejected">Reddedildi</SelectItem>
									<SelectItem value="published">Yayınlandı</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					<DialogFooter>
						<Button variant="outline" onClick={() => setStatusDialogOpen(false)} disabled={isSubmitting}>
							İptal
						</Button>
						<Button onClick={handleStatusSubmit} disabled={isSubmitting}>
							{isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Makaleyi Sil</AlertDialogTitle>
						<AlertDialogDescription>
							Bu makaleyi silmek istediğinizden emin misiniz?
							<br />
							<strong className="text-foreground">"{selectedArticle?.title}"</strong>
							<br />
							Bu işlem geri alınamaz ve tüm ilgili kayıtlar (atamalar, değerlendirmeler, kararlar) da silinecektir.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSubmitting}>İptal</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteConfirm}
							disabled={isSubmitting}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isSubmitting ? 'Siliniyor...' : 'Sil'}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Publish Article Dialog */}
			{selectedArticle && (
				<PublishArticleDialog
					article={selectedArticle}
					open={publishDialogOpen}
					onOpenChange={setPublishDialogOpen}
					onSuccess={() => router.refresh()}
				/>
			)}
		</div>
	)
}
