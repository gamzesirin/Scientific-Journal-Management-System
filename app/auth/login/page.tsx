'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

export default function LoginPage() {
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)
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

			// Form validation
			if (!email || !password) {
				setError('Lütfen email ve şifre alanlarını doldurun')
				return
			}

			const { data, error } = await supabase.auth.signInWithPassword({
				email,
				password
			})

			if (error) {
				console.error('Login error:', error)
				// Daha spesifik hata mesajları
				if (error.message.includes('Invalid login credentials')) {
					setError('Email veya şifre hatalı. Lütfen tekrar deneyin.')
				} else if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
					setError(
						'⚠️ Supabase bağlantı hatası! ' +
						'Projeniz duraklamış olabilir. ' +
						'https://supabase.com/dashboard adresinden projenizi "Resume" edin.'
					)
				} else if (error.message.includes('Email not confirmed')) {
					setError('Email adresiniz henüz doğrulanmamış. Lütfen email kutunuzu kontrol edin.')
				} else if (error.message.includes('timeout')) {
					setError('İstek zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edin.')
				} else {
					setError(error.message || 'Giriş yapılırken bir hata oluştu')
				}
			} else if (data?.user) {
				// Başarılı giriş
				router.push('/dashboard')
				router.refresh()
			}
		} catch (error: any) {
			console.error('Unexpected error:', error)

			// Network hatası kontrolü
			if (error.message?.includes('fetch') || error.message?.includes('network')) {
				setError(
					'Bağlantı hatası! Supabase projeniz duraklamış olabilir. ' +
					'Dashboard\'dan projenizi kontrol edin: https://supabase.com/dashboard'
				)
			} else {
				setError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.')
			}
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-3xl font-bold text-center">Giriş Yap</CardTitle>
					<CardDescription className="text-center">Hesabınıza erişmek için giriş yapın</CardDescription>
				</CardHeader>
				<CardContent>
					{error && (
						<Alert variant="destructive" className="mb-4">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}

					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input id="email" name="email" type="email" placeholder="ornek@gmail.com" required />
						</div>

						<div className="space-y-2">
							<Label htmlFor="password">Şifre</Label>
							<Input id="password" name="password" type="password" placeholder="••••••••" required />
						</div>

						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
						</Button>
					</form>

					<div className="mt-4 text-center text-sm">
						Hesabınız yok mu?{' '}
						<Link href="/auth/register" className="text-primary hover:underline font-medium">
							Kayıt Ol
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
