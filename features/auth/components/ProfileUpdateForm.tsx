'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { User, Mail, Shield, Save } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ProfileUpdateFormProps {
	userData: {
		id: string
		email: string
		name: string
		role: string
		affiliation?: string
	}
}

export default function ProfileUpdateForm({ userData }: ProfileUpdateFormProps) {
	const router = useRouter()
	const [isLoading, setIsLoading] = useState(false)
	const [formData, setFormData] = useState({
		name: userData.name || '',
		email: userData.email || '',
		affiliation: userData.affiliation || ''
	})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsLoading(true)

		try {
			const supabase = createClient()

			// Update user profile in users table
			const { error: updateError } = await supabase
				.from('users')
				.update({
					name: formData.name,
					email: formData.email,
					affiliation: formData.affiliation,
					updated_at: new Date().toISOString()
				})
				.eq('id', userData.id)

			if (updateError) throw updateError

			// If email changed, update auth email too
			if (formData.email !== userData.email) {
				const { error: authError } = await supabase.auth.updateUser({
					email: formData.email
				})

				if (authError) {
					// Rollback if auth update fails
					await supabase
						.from('users')
						.update({
							email: userData.email
						})
						.eq('id', userData.id)

					throw new Error('Email güncellenemedi. Lütfen geçerli bir email adresi kullanın.')
				}

				toast.success('Profil güncellendi!', {
					description: 'Yeni email adresinize bir doğrulama linki gönderildi.'
				})
			} else {
				toast.success('Profil başarıyla güncellendi!')
			}

			router.refresh()
		} catch (error) {
			console.error('Profile update error:', error)
			toast.error('Hata', {
				description: error instanceof Error ? error.message : 'Profil güncellenirken bir hata oluştu'
			})
		} finally {
			setIsLoading(false)
		}
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value
		})
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<User className="h-5 w-5" />
					Profil Bilgileri
				</CardTitle>
				<CardDescription>Adınızı, email adresinizi ve kurum bilgilerinizi güncelleyin</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						{/* Name */}
						<div className="space-y-2">
							<Label htmlFor="name">
								<User className="inline h-4 w-4 mr-1" />
								Ad Soyad
							</Label>
							<Input
								id="name"
								name="name"
								type="text"
								value={formData.name}
								onChange={handleChange}
								placeholder="Adınız Soyadınız"
								required
								disabled={isLoading}
							/>
						</div>

						{/* Email */}
						<div className="space-y-2">
							<Label htmlFor="email">
								<Mail className="inline h-4 w-4 mr-1" />
								Email
							</Label>
							<Input
								id="email"
								name="email"
								type="email"
								value={formData.email}
								onChange={handleChange}
								placeholder="email@example.com"
								required
								disabled={isLoading}
							/>
							{formData.email !== userData.email && (
								<p className="text-xs text-amber-600">
									⚠️ Email değiştirirseniz yeni adresinizi doğrulamanız gerekecek
								</p>
							)}
						</div>

						{/* Affiliation */}
						<div className="space-y-2">
							<Label htmlFor="affiliation">Kurum/Üniversite</Label>
							<Input
								id="affiliation"
								name="affiliation"
								type="text"
								value={formData.affiliation}
								onChange={handleChange}
								placeholder="Kurumunuz veya Üniversiteniz"
								disabled={isLoading}
							/>
						</div>

						{/* Role (Disabled) */}
						<div className="space-y-2">
							<Label htmlFor="role" className="flex items-center gap-1">
								<Shield className="inline h-4 w-4" />
								Rol
								<Badge variant="secondary" className="ml-2">
									Değiştirilemez
								</Badge>
							</Label>
							<Input
								id="role"
								type="text"
								value={
									userData.role === 'author'
										? 'Yazar'
										: userData.role === 'editor'
										? 'Editör'
										: userData.role === 'reviewer'
										? 'Hakem'
										: userData.role === 'admin'
										? 'Admin'
										: userData.role
								}
								disabled
								className="bg-gray-100 cursor-not-allowed"
							/>
							<p className="text-xs text-gray-500">Rolünüz sadece admin tarafından değiştirilebilir</p>
						</div>
					</div>

					{/* Submit Button */}
					<div className="flex justify-end pt-4">
						<Button type="submit" disabled={isLoading} size="lg">
							<Save className="h-4 w-4 mr-2" />
							{isLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	)
}
