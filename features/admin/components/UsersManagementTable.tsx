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
import { Edit, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface User {
	id: string
	email: string
	name: string
	role: string
	affiliation?: string
	created_at: string
}

interface UsersManagementTableProps {
	users: User[]
}

export default function UsersManagementTable({ users }: UsersManagementTableProps) {
	const router = useRouter()
	const [searchTerm, setSearchTerm] = useState('')
	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
	const [selectedUser, setSelectedUser] = useState<User | null>(null)
	const [editForm, setEditForm] = useState({
		name: '',
		role: '',
		affiliation: ''
	})
	const [isSubmitting, setIsSubmitting] = useState(false)

	const filteredUsers = users.filter(
		user =>
			user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
			user.role.toLowerCase().includes(searchTerm.toLowerCase())
	)

	const handleEditClick = (user: User) => {
		setSelectedUser(user)
		setEditForm({
			name: user.name,
			role: user.role,
			affiliation: user.affiliation || ''
		})
		setEditDialogOpen(true)
	}

	const handleDeleteClick = (user: User) => {
		setSelectedUser(user)
		setDeleteDialogOpen(true)
	}

	const handleEditSubmit = async () => {
		if (!selectedUser) return

		setIsSubmitting(true)
		try {
			const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(editForm)
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Güncelleme başarısız')
			}

			toast.success('Kullanıcı başarıyla güncellendi')
			setEditDialogOpen(false)
			router.refresh()
		} catch (error) {
			console.error('Error updating user:', error)
			toast.error(error instanceof Error ? error.message : 'Kullanıcı güncellenirken bir hata oluştu')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleDeleteConfirm = async () => {
		if (!selectedUser) return

		setIsSubmitting(true)
		try {
			const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
				method: 'DELETE'
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || 'Silme başarısız')
			}

			toast.success('Kullanıcı başarıyla silindi')
			setDeleteDialogOpen(false)
			router.refresh()
		} catch (error) {
			console.error('Error deleting user:', error)
			toast.error(error instanceof Error ? error.message : 'Kullanıcı silinirken bir hata oluştu')
		} finally {
			setIsSubmitting(false)
		}
	}

	const getRoleBadgeVariant = (role: string) => {
		switch (role) {
			case 'admin':
				return 'destructive'
			case 'editor':
				return 'default'
			case 'reviewer':
				return 'secondary'
			case 'author':
				return 'outline'
			default:
				return 'outline'
		}
	}

	const getRoleLabel = (role: string) => {
		switch (role) {
			case 'admin':
				return 'Admin'
			case 'editor':
				return 'Editör'
			case 'reviewer':
				return 'Hakem'
			case 'author':
				return 'Yazar'
			default:
				return role
		}
	}

	return (
		<div className="space-y-4">
			{/* Search */}
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
				<Input
					placeholder="İsim, email veya rol ile ara..."
					value={searchTerm}
					onChange={e => setSearchTerm(e.target.value)}
					className="pl-10"
				/>
			</div>

			{/* Table */}
			<div className="border rounded-lg overflow-hidden">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>İsim</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Rol</TableHead>
							<TableHead>Kurum</TableHead>
							<TableHead>Kayıt Tarihi</TableHead>
							<TableHead className="text-right">İşlemler</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{filteredUsers.map(user => (
							<TableRow key={user.id}>
								<TableCell className="font-medium">{user.name}</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>
									<Badge variant={getRoleBadgeVariant(user.role)}>
										{getRoleLabel(user.role)}
									</Badge>
								</TableCell>
								<TableCell>{user.affiliation || '-'}</TableCell>
								<TableCell>
									{new Date(user.created_at).toLocaleDateString('tr-TR')}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-2">
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleEditClick(user)}
										>
											<Edit className="h-4 w-4" />
										</Button>
										<Button
											variant="destructive"
											size="sm"
											onClick={() => handleDeleteClick(user)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{filteredUsers.length === 0 && (
				<p className="text-center text-gray-500 py-8">
					Arama kriterine uygun kullanıcı bulunamadı.
				</p>
			)}

			{/* Edit Dialog */}
			<Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
						<DialogDescription>
							Kullanıcı bilgilerini güncelleyin. Değişiklikleri kaydetmek için "Kaydet" butonuna tıklayın.
						</DialogDescription>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						<div className="grid gap-2">
							<Label htmlFor="name">İsim</Label>
							<Input
								id="name"
								value={editForm.name}
								onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
								placeholder="Kullanıcı adı"
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="role">Rol</Label>
							<Select
								value={editForm.role}
								onValueChange={(value) => setEditForm({ ...editForm, role: value })}
							>
								<SelectTrigger id="role">
									<SelectValue placeholder="Rol seçin" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="author">Yazar</SelectItem>
									<SelectItem value="reviewer">Hakem</SelectItem>
									<SelectItem value="editor">Editör</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="affiliation">Kurum (Opsiyonel)</Label>
							<Input
								id="affiliation"
								value={editForm.affiliation}
								onChange={(e) => setEditForm({ ...editForm, affiliation: e.target.value })}
								placeholder="Kurum adı"
							/>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setEditDialogOpen(false)}
							disabled={isSubmitting}
						>
							İptal
						</Button>
						<Button onClick={handleEditSubmit} disabled={isSubmitting}>
							{isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Kullanıcıyı Sil</AlertDialogTitle>
						<AlertDialogDescription>
							Bu kullanıcıyı silmek istediğinizden emin misiniz?
							<br />
							<strong className="text-foreground">{selectedUser?.name} ({selectedUser?.email})</strong>
							<br />
							Bu işlem geri alınamaz.
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
		</div>
	)
}
