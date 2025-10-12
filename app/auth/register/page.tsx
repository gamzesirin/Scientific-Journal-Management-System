'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'

export default function RegisterPage() {
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
	const [success, setSuccess] = useState(false)
	const [selectedRole, setSelectedRole] = useState<string>('author')
	const router = useRouter()
	const supabase = createClient()

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		try {
			setError(null)
			setLoading(true)

			const formData = new FormData(e.currentTarget)
			const email = formData.get('email') as string
			const password = formData.get('password') as string
			const name = formData.get('name') as string

			const { data, error } = await supabase.auth.signUp({
				email,
				password,
				options: {
					data: {
						name,
						role: selectedRole
					},
					emailRedirectTo: `${window.location.origin}/auth/login`
				}
			})

			// Kayıt sonrası otomatik giriş yapılmasını önle
			if (data.session) {
				await supabase.auth.signOut()
			}

			if (error) {
				// Türkçe hata mesajları
				if (error.message.includes('invalid')) {
					setError('Geçersiz email adresi. Lütfen geçerli bir email girin.')
				} else if (error.message.includes('weak')) {
					setError('Şifre çok zayıf. En az 6 karakter olmalı.')
				} else if (error.message.includes('already')) {
					setError('Bu email adresi zaten kayıtlı.')
				} else {
					setError(error.message)
				}
			} else {
				setSuccess(true)
				setTimeout(() => {
					router.push('/auth/login')
				}, 2000)
			}
		} catch (error) {
			setError('Beklenmeyen bir hata oluştu')
			console.error('Register error:', error)
		} finally {
			setLoading(false)
		}
	}

	if (success) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
				<Card className="w-full max-w-md">
					<CardHeader className="text-center">
						<CardTitle className="text-3xl font-bold text-green-600">Başarılı!</CardTitle>
						<CardDescription>Hesabınız oluşturuldu. Giriş sayfasına yönlendiriliyorsunuz...</CardDescription>
					</CardHeader>
				</Card>
			</div>
		)
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-3xl font-bold text-center">Hesap Oluştur</CardTitle>
					<CardDescription className="text-center">Yeni hesap oluşturmak için bilgilerinizi girin</CardDescription>
				</CardHeader>
				<CardContent>
					{error && (
						<Alert variant="destructive" className="mb-4">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Ad Soyad</Label>
							<Input id="name" name="name" type="text" placeholder="Adınız Soyadınız" required />
						</div>

						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" name="email" type="email" placeholder="ornek@gmail.com" required />
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Şifre (En az 6 karakter)</Label>
							<Input id="password" name="password" type="password" placeholder="••••••••" required minLength={6} />
						</div>

						<div className="space-y-2">
							<Label htmlFor="role">Rol Seçimi</Label>
							<Select value={selectedRole} onValueChange={setSelectedRole}>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Rol seçin" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="author">Yazar (Author)</SelectItem>
									<SelectItem value="reviewer">Hakem (Reviewer)</SelectItem>
									<SelectItem value="editor">Editör (Editor)</SelectItem>
									<SelectItem value="admin">Admin</SelectItem>
								</SelectContent>
							</Select>
							<p className="text-xs text-gray-500">Sisteme hangi rol ile kayıt olmak istediğinizi seçin.</p>
						</div>

						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
						</Button>
					</form>

					<div className="mt-4 text-center text-sm">
						Zaten hesabınız var mı?{' '}
						<Link href="/auth/login" className="text-primary hover:underline font-medium">
							Giriş Yap
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
