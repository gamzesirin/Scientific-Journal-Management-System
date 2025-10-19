'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Plus, Trash2, Users, Mail, Building2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from '@/lib/toast'

interface Coauthor {
	id: string
	name: string
	email: string
	affiliation: string | null
	order_index: number
	user_id: string | null
	is_confirmed: boolean
}

interface CoauthorsManagerProps {
	articleId: string
	isAuthor: boolean
}

export default function CoauthorsManager({ articleId, isAuthor }: CoauthorsManagerProps) {
	const router = useRouter()
	const [coauthors, setCoauthors] = useState<Coauthor[]>([])
	const [loading, setLoading] = useState(true)
	const [showAddForm, setShowAddForm] = useState(false)

	// Form states
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [affiliation, setAffiliation] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		fetchCoauthors()
	}, [articleId])

	const fetchCoauthors = async () => {
		try {
			const response = await fetch(`/api/articles/${articleId}/coauthors`)
			const data = await response.json()

			if (response.ok) {
				setCoauthors(data.coauthors || [])
			}
		} catch (error) {
			console.error('Error fetching coauthors:', error)
		} finally {
			setLoading(false)
		}
	}

	const handleAddCoauthor = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)

		if (!name.trim() || !email.trim()) {
			setError('İsim ve email gerekli')
			return
		}

		setSubmitting(true)

		try {
			const response = await fetch(`/api/articles/${articleId}/coauthors`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: name.trim(),
					email: email.trim(),
					affiliation: affiliation.trim() || null
				})
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Ortak yazar eklenemedi')
			}

			// Success toast
			toast.success('Ortak yazar başarıyla eklendi!')

			// Reset form
			setName('')
			setEmail('')
			setAffiliation('')
			setShowAddForm(false)

			// Refresh list
			fetchCoauthors()
			router.refresh()
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Bir hata oluştu'
			setError(errorMsg)
			toast.error(errorMsg)
		} finally {
			setSubmitting(false)
		}
	}

	const handleDeleteCoauthor = async (coauthorId: string) => {
		try {
			const response = await fetch(`/api/articles/${articleId}/coauthors?coauthorId=${coauthorId}`, {
				method: 'DELETE'
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Ortak yazar silinemedi')
			}

			// Success toast
			toast.success('Ortak yazar başarıyla silindi!')

			// Refresh list
			fetchCoauthors()
			router.refresh()
		} catch (err) {
			const errorMsg = err instanceof Error ? err.message : 'Bir hata oluştu'
			setError(errorMsg)
			toast.error(errorMsg)
		}
	}

	if (loading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Ortak Yazarlar</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-gray-500">Yükleniyor...</p>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							Ortak Yazarlar
						</CardTitle>
						<CardDescription>
							{coauthors.length > 0 ? `${coauthors.length} ortak yazar` : 'Bu makaleye henüz ortak yazar eklenmemiş'}
						</CardDescription>
					</div>
					{isAuthor && (
						<Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
							<Plus className="h-4 w-4 mr-2" />
							Ortak Yazar Ekle
						</Button>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* Error Messages */}
				{error && (
					<Alert variant="destructive">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* Add Form */}
				{showAddForm && isAuthor && (
					<form onSubmit={handleAddCoauthor} className="p-4 border rounded-lg bg-gray-50 space-y-4">
						<h4 className="font-semibold text-sm">Yeni Ortak Yazar Ekle</h4>

						<div className="space-y-2">
							<Label htmlFor="coauthor-name">İsim Soyisim *</Label>
							<Input
								id="coauthor-name"
								type="text"
								placeholder="Ahmet Yılmaz"
								value={name}
								onChange={(e) => setName(e.target.value)}
								disabled={submitting}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="coauthor-email">Email *</Label>
							<Input
								id="coauthor-email"
								type="email"
								placeholder="ahmet@university.edu.tr"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								disabled={submitting}
								required
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="coauthor-affiliation">Kurum / Üniversite</Label>
							<Input
								id="coauthor-affiliation"
								type="text"
								placeholder="Örnek Üniversitesi, Bilgisayar Mühendisliği"
								value={affiliation}
								onChange={(e) => setAffiliation(e.target.value)}
								disabled={submitting}
							/>
						</div>

						<div className="flex gap-2">
							<Button type="submit" disabled={submitting} size="sm">
								{submitting ? 'Ekleniyor...' : 'Ekle'}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={() => {
									setShowAddForm(false)
									setName('')
									setEmail('')
									setAffiliation('')
									setError(null)
								}}
								size="sm"
								disabled={submitting}
							>
								İptal
							</Button>
						</div>
					</form>
				)}

				{/* Coauthors List */}
				{coauthors.length > 0 && (
					<div className="space-y-3">
						{coauthors.map((coauthor, index) => (
							<div
								key={coauthor.id}
								className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
							>
								{/* Order Number */}
								<div className="flex-shrink-0">
									<div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
										<span className="text-sm font-semibold text-blue-600">{index + 1}</span>
									</div>
								</div>

								{/* Coauthor Info */}
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-2 mb-1">
										<h4 className="font-semibold">{coauthor.name}</h4>
										{coauthor.user_id && (
											<Badge variant="secondary" className="text-xs">
												Kayıtlı Kullanıcı
											</Badge>
										)}
									</div>

									<div className="space-y-1 text-sm text-gray-600">
										<div className="flex items-center gap-2">
											<Mail className="h-3 w-3" />
											<span>{coauthor.email}</span>
										</div>
										{coauthor.affiliation && (
											<div className="flex items-center gap-2">
												<Building2 className="h-3 w-3" />
												<span>{coauthor.affiliation}</span>
											</div>
										)}
									</div>
								</div>

								{/* Delete Button */}
								{isAuthor && (
									<div className="flex-shrink-0">
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
													<Trash2 className="h-4 w-4" />
												</Button>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>Ortak Yazarı Sil</AlertDialogTitle>
													<AlertDialogDescription>
														<strong>{coauthor.name}</strong> adlı ortak yazarı silmek istediğinize emin misiniz? Bu
														işlem geri alınamaz.
													</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>İptal</AlertDialogCancel>
													<AlertDialogAction
														onClick={() => handleDeleteCoauthor(coauthor.id)}
														className="bg-red-600 hover:bg-red-700"
													>
														Sil
													</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
									</div>
								)}
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
