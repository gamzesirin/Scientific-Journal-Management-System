'use client'

import { useState, useEffect, useCallback } from 'react'
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
import { Eye, Trash2, Search, Edit, XCircle, UserCog, Sparkles, FileText, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import PublishArticleDialog from './PublishArticleDialog'
import { Article } from '@/features/articles/types/article.types'

// Types
interface AdminArticle extends Article {
	author?: { name: string; email: string }
}

interface Editor {
	id: string
	name: string
	email: string
}

interface AdminArticlesTableProps {
	articles: AdminArticle[]
}

// Status configuration
const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
	submitted: { label: 'Gönderildi', variant: 'secondary' },
	under_review: { label: 'İncelemede', variant: 'default' },
	revision_requested: { label: 'Revizyon İstendi', variant: 'outline' },
	accepted: { label: 'Kabul Edildi', variant: 'default' },
	rejected: { label: 'Reddedildi', variant: 'destructive' },
	published: { label: 'Yayınlandı', variant: 'default' }
}

const getStatusInfo = (status: string) => STATUS_CONFIG[status] || { label: status, variant: 'outline' as const }

// API helper
async function apiRequest<T>(
	url: string,
	options?: RequestInit
): Promise<{ data?: T; error?: string }> {
	try {
		const response = await fetch(url, {
			headers: { 'Content-Type': 'application/json' },
			...options
		})

		if (!response.ok) {
			const error = await response.json()
			throw new Error(error.error || 'İşlem başarısız')
		}

		const data = await response.json()
		return { data }
	} catch (error) {
		return { error: error instanceof Error ? error.message : 'Bir hata oluştu' }
	}
}

// Editor Assignment Dialog Component
interface EditorDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	article: AdminArticle | null
	editors: Editor[]
	selectedEditorId: string
	setSelectedEditorId: (id: string) => void
	onSubmit: () => void
	isSubmitting: boolean
}

function EditorAssignmentDialog({
	open,
	onOpenChange,
	article,
	editors,
	selectedEditorId,
	setSelectedEditorId,
	onSubmit,
	isSubmitting
}: EditorDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Editör Ata</DialogTitle>
					<DialogDescription>"{article?.title}" makalesine editör atayın.</DialogDescription>
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
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
						İptal
					</Button>
					<Button onClick={onSubmit} disabled={isSubmitting}>
						{isSubmitting ? 'Atanıyor...' : 'Ata'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

// Status Update Dialog Component
interface StatusDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	article: AdminArticle | null
	newStatus: string
	setNewStatus: (status: string) => void
	onSubmit: () => void
	isSubmitting: boolean
}

function StatusUpdateDialog({
	open,
	onOpenChange,
	article,
	newStatus,
	setNewStatus,
	onSubmit,
	isSubmitting
}: StatusDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Makale Durumunu Güncelle</DialogTitle>
					<DialogDescription>"{article?.title}" makalesinin durumunu değiştirin.</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label htmlFor="status">Yeni Durum</Label>
						<Select value={newStatus} onValueChange={setNewStatus}>
							<SelectTrigger id="status">
								<SelectValue placeholder="Durum seçin" />
							</SelectTrigger>
							<SelectContent>
								{Object.entries(STATUS_CONFIG).map(([value, { label }]) => (
									<SelectItem key={value} value={value}>{label}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
						İptal
					</Button>
					<Button onClick={onSubmit} disabled={isSubmitting}>
						{isSubmitting ? 'Güncelleniyor...' : 'Güncelle'}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

// Delete Confirmation Dialog Component
interface DeleteDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	article: AdminArticle | null
	onConfirm: () => void
	isSubmitting: boolean
}

function DeleteConfirmationDialog({
	open,
	onOpenChange,
	article,
	onConfirm,
	isSubmitting
}: DeleteDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Makaleyi Sil</AlertDialogTitle>
					<AlertDialogDescription>
						Bu makaleyi silmek istediğinizden emin misiniz?
						<br />
						<strong className="text-foreground">"{article?.title}"</strong>
						<br />
						Bu işlem geri alınamaz ve tüm ilgili kayıtlar da silinecektir.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel disabled={isSubmitting}>İptal</AlertDialogCancel>
					<AlertDialogAction
						onClick={onConfirm}
						disabled={isSubmitting}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isSubmitting ? 'Siliniyor...' : 'Sil'}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}

// Article Row Component
interface ArticleRowProps {
	article: AdminArticle
	editorName?: string
	isAnalyzing: boolean
	isSubmitting: boolean
	onEditorClick: () => void
	onStatusClick: () => void
	onDeleteClick: () => void
	onPublishClick: () => void
	onRejectClick: () => void
	onAnalyzeClick: () => void
}

function ArticleRow({
	article,
	editorName,
	isAnalyzing,
	isSubmitting,
	onEditorClick,
	onStatusClick,
	onDeleteClick,
	onPublishClick,
	onRejectClick,
	onAnalyzeClick
}: ArticleRowProps) {
	const statusInfo = getStatusInfo(article.status)

	return (
		<TableRow>
			<TableCell className="font-medium max-w-md truncate">{article.title}</TableCell>
			<TableCell>{article.author?.name || 'Bilinmiyor'}</TableCell>
			<TableCell>
				{article.assigned_editor_id ? (
					<div className="flex items-center gap-2">
						<span className="text-sm">{editorName || 'Yükleniyor...'}</span>
						<Button variant="ghost" size="sm" onClick={onEditorClick} title="Editörü Değiştir">
							<Edit className="h-3 w-3" />
						</Button>
					</div>
				) : (
					<Button variant="outline" size="sm" onClick={onEditorClick} title="Editör Ata">
						<UserCog className="h-4 w-4 mr-1" />
						Editör Ata
					</Button>
				)}
			</TableCell>
			<TableCell>
				<Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
			</TableCell>
			<TableCell>{new Date(article.created_at).toLocaleDateString('tr-TR')}</TableCell>
			<TableCell className="text-right">
				<div className="flex justify-end gap-2">
					<Link href={`/articles/${article.id}`}>
						<Button variant="outline" size="sm" title="Görüntüle">
							<Eye className="h-4 w-4" />
						</Button>
					</Link>

					{article.file_url && (
						<Button
							variant="outline"
							size="sm"
							onClick={onAnalyzeClick}
							disabled={isAnalyzing}
							title="PDF Analiz Et"
							className="bg-blue-50 hover:bg-blue-100 border-blue-300"
						>
							{isAnalyzing ? (
								<><Loader2 className="h-4 w-4 mr-1 animate-spin" />Analiz</>
							) : (
								<><FileText className="h-4 w-4 mr-1" />PDF Analiz</>
							)}
						</Button>
					)}

					{article.status === 'accepted' && (
						<Button
							variant="default"
							size="sm"
							onClick={onPublishClick}
							className="bg-green-600 hover:bg-green-700"
							title="Yayınla"
						>
							<Sparkles className="h-4 w-4 mr-1" />
							Yayınla
						</Button>
					)}

					<Button variant="outline" size="sm" onClick={onStatusClick} title="Durumu Güncelle">
						<Edit className="h-4 w-4" />
					</Button>

					{article.status !== 'rejected' && article.status !== 'published' && (
						<Button
							variant="destructive"
							size="sm"
							onClick={onRejectClick}
							disabled={isSubmitting}
							title="Reddet"
						>
							<XCircle className="h-4 w-4" />
						</Button>
					)}

					<Button variant="destructive" size="sm" onClick={onDeleteClick} title="Sil">
						<Trash2 className="h-4 w-4" />
					</Button>
				</div>
			</TableCell>
		</TableRow>
	)
}

// Main Component
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
	const [analyzingArticles, setAnalyzingArticles] = useState<Record<string, boolean>>({})

	// Load editors
	useEffect(() => {
		const loadEditors = async () => {
			const supabase = createClient()
			const { data } = await supabase
				.from('users')
				.select('id, name, email')
				.eq('role', 'editor')
				.eq('is_active', true)
				.order('name')

			if (data) {
				setEditors(data)
				const namesMap = new Map<string, string>()
				data.forEach((editor) => namesMap.set(editor.id, editor.name))
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

	// Handlers
	const handleStatusClick = useCallback((article: AdminArticle) => {
		setSelectedArticle(article)
		setNewStatus(article.status)
		setStatusDialogOpen(true)
	}, [])

	const handleDeleteClick = useCallback((article: AdminArticle) => {
		setSelectedArticle(article)
		setDeleteDialogOpen(true)
	}, [])

	const handleEditorClick = useCallback((article: AdminArticle) => {
		setSelectedArticle(article)
		setSelectedEditorId(article.assigned_editor_id || 'unassign')
		setEditorDialogOpen(true)
	}, [])

	const handlePublishClick = useCallback((article: AdminArticle) => {
		setSelectedArticle(article)
		setPublishDialogOpen(true)
	}, [])

	const handleRejectClick = useCallback(async (article: AdminArticle) => {
		setIsSubmitting(true)
		const { error } = await apiRequest(`/api/admin/articles/${article.id}`, {
			method: 'PUT',
			body: JSON.stringify({ status: 'rejected' })
		})

		if (error) {
			toast.error(error)
		} else {
			toast.success('Makale reddedildi')
			router.refresh()
		}
		setIsSubmitting(false)
	}, [router])

	const handleStatusSubmit = useCallback(async () => {
		if (!selectedArticle) return

		setIsSubmitting(true)
		const { error } = await apiRequest(`/api/admin/articles/${selectedArticle.id}`, {
			method: 'PUT',
			body: JSON.stringify({ status: newStatus })
		})

		if (error) {
			toast.error(error)
		} else {
			toast.success('Makale durumu başarıyla güncellendi')
			setStatusDialogOpen(false)
			router.refresh()
		}
		setIsSubmitting(false)
	}, [selectedArticle, newStatus, router])

	const handleEditorSubmit = useCallback(async () => {
		if (!selectedArticle) return

		setIsSubmitting(true)
		const editorIdToAssign = selectedEditorId === 'unassign' ? null : selectedEditorId

		const { error } = await apiRequest(`/api/admin/articles/${selectedArticle.id}`, {
			method: 'PUT',
			body: JSON.stringify({ assigned_editor_id: editorIdToAssign })
		})

		if (error) {
			toast.error(error)
		} else {
			toast.success(editorIdToAssign ? 'Editör başarıyla atandı' : 'Editör ataması kaldırıldı')
			setEditorDialogOpen(false)
			router.refresh()
		}
		setIsSubmitting(false)
	}, [selectedArticle, selectedEditorId, router])

	const handleDeleteConfirm = useCallback(async () => {
		if (!selectedArticle) return

		setIsSubmitting(true)
		const { error } = await apiRequest(`/api/admin/articles/${selectedArticle.id}`, {
			method: 'DELETE'
		})

		if (error) {
			toast.error(error)
		} else {
			toast.success('Makale başarıyla silindi')
			setDeleteDialogOpen(false)
			router.refresh()
		}
		setIsSubmitting(false)
	}, [selectedArticle, router])

	const handleAnalyzeArticle = useCallback(async (article: AdminArticle) => {
		setAnalyzingArticles((prev) => ({ ...prev, [article.id]: true }))

		const { data, error } = await apiRequest<{ extracted_pdf_text?: { full_length: number; full_text: string } }>(
			'/api/admin/analyze-article',
			{
				method: 'POST',
				body: JSON.stringify({ articleId: article.id })
			}
		)

		if (error) {
			toast.error(error)
		} else if (data?.extracted_pdf_text) {
			console.log('PDF Text çıkarıldı:', article.title, data.extracted_pdf_text.full_length, 'karakter')
			toast.success(`PDF'den ${data.extracted_pdf_text.full_length} karakter çıkarıldı`)
			router.refresh()
		} else {
			toast.success('Analiz tamamlandı (PDF yok)')
		}

		setAnalyzingArticles((prev) => ({ ...prev, [article.id]: false }))
	}, [router])

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
							<ArticleRow
								key={article.id}
								article={article}
								editorName={editorNames.get(article.assigned_editor_id || '')}
								isAnalyzing={analyzingArticles[article.id] || false}
								isSubmitting={isSubmitting}
								onEditorClick={() => handleEditorClick(article)}
								onStatusClick={() => handleStatusClick(article)}
								onDeleteClick={() => handleDeleteClick(article)}
								onPublishClick={() => handlePublishClick(article)}
								onRejectClick={() => handleRejectClick(article)}
								onAnalyzeClick={() => handleAnalyzeArticle(article)}
							/>
						))}
					</TableBody>
				</Table>
			</div>

			{filteredArticles.length === 0 && (
				<p className="text-center text-gray-500 py-8">Arama kriterine uygun makale bulunamadı.</p>
			)}

			{/* Dialogs */}
			<EditorAssignmentDialog
				open={editorDialogOpen}
				onOpenChange={setEditorDialogOpen}
				article={selectedArticle}
				editors={editors}
				selectedEditorId={selectedEditorId}
				setSelectedEditorId={setSelectedEditorId}
				onSubmit={handleEditorSubmit}
				isSubmitting={isSubmitting}
			/>

			<StatusUpdateDialog
				open={statusDialogOpen}
				onOpenChange={setStatusDialogOpen}
				article={selectedArticle}
				newStatus={newStatus}
				setNewStatus={setNewStatus}
				onSubmit={handleStatusSubmit}
				isSubmitting={isSubmitting}
			/>

			<DeleteConfirmationDialog
				open={deleteDialogOpen}
				onOpenChange={setDeleteDialogOpen}
				article={selectedArticle}
				onConfirm={handleDeleteConfirm}
				isSubmitting={isSubmitting}
			/>

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
