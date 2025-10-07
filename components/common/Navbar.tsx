'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { useUserRole } from '@/hooks/useUserRole'

export default function Navbar() {
	const { user, loading, signOut } = useAuth()
	const { getDashboardPath } = useUserRole()
	const router = useRouter()
	const pathname = usePathname()

	async function handleSignOut() {
		await signOut()
		router.push('/auth/login')
		router.refresh()
	}

	// Auth sayfalarında navbar'ı gösterme
	if (pathname?.startsWith('/auth/')) return null
	if (loading) return null

	return (
		<nav className="bg-white shadow">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 justify-between">
					<div className="flex">
						<div className="flex flex-shrink-0 items-center">
							<Link href="/" className="text-xl font-bold text-gray-800">
								JMS
							</Link>
						</div>
					</div>
					<div className="flex items-center">
						{user ? (
							<div className="flex items-center space-x-4">
								<Link href={getDashboardPath()} className="text-gray-700 hover:text-gray-900">
									Dashboard
								</Link>
								<span className="text-gray-700">{user.email}</span>
								<button
									onClick={handleSignOut}
									className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
								>
									Çıkış Yap
								</button>
							</div>
						) : (
							<div className="flex items-center space-x-4">
								<Link
									href="/auth/login"
									className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
								>
									Giriş Yap
								</Link>
								<Link
									href="/auth/register"
									className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
								>
									Kayıt Ol
								</Link>
							</div>
						)}
					</div>
				</div>
			</div>
		</nav>
	)
}
