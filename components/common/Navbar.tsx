'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/features/auth/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
	BookOpen,
	LayoutDashboard,
	LogOut,
	User,
	FileText,
	Menu,
	X,
	Shield,
	UserCog,
	Users
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface UserData {
	name: string
	role: string
}

export default function Navbar() {
	const { user, loading, signOut } = useAuth()
	const router = useRouter()
	const pathname = usePathname()
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [userData, setUserData] = useState<UserData | null>(null)

	useEffect(() => {
		if (user) {
			const supabase = createClient()
			supabase
				.from('users')
				.select('name, role')
				.eq('id', user.id)
				.single()
				.then(({ data }) => setUserData(data))
		}
	}, [user])

	async function handleSignOut() {
		await signOut()
		router.push('/auth/login')
		router.refresh()
	}

	// Auth sayfalarında navbar'ı gösterme
	if (pathname?.startsWith('/auth/')) return null
	if (loading) return null

	const getRoleBadgeColor = (role: string) => {
		switch (role) {
			case 'admin':
				return 'bg-red-100 text-red-700 border-red-200'
			case 'editor':
				return 'bg-blue-100 text-blue-700 border-blue-200'
			case 'reviewer':
				return 'bg-green-100 text-green-700 border-green-200'
			case 'author':
				return 'bg-purple-100 text-purple-700 border-purple-200'
			default:
				return 'bg-gray-100 text-gray-700 border-gray-200'
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

	const getInitials = (name?: string, email?: string) => {
		if (name) {
			return name
				.split(' ')
				.map((n) => n[0])
				.join('')
				.toUpperCase()
				.slice(0, 2)
		}
		if (email) {
			return email.slice(0, 2).toUpperCase()
		}
		return 'U'
	}

	const getRoleIcon = (role: string) => {
		switch (role) {
			case 'admin':
				return <Shield className="h-4 w-4" />
			case 'editor':
				return <UserCog className="h-4 w-4" />
			case 'reviewer':
				return <Users className="h-4 w-4" />
			case 'author':
				return <User className="h-4 w-4" />
			default:
				return <User className="h-4 w-4" />
		}
	}

	return (
		<nav className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="flex h-16 items-center justify-between">
					{/* Logo */}
					<div className="flex items-center gap-2">
						<Link href="/" className="flex items-center gap-2 transition-transform hover:scale-105">
							<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
								<BookOpen className="h-6 w-6 text-white" />
							</div>
							<div className="hidden sm:block">
								<h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
									JMS
								</h1>
								<p className="text-xs text-gray-500">Journal Management</p>
							</div>
						</Link>
					</div>

					{/* Desktop Menu */}
					<div className="hidden md:flex md:items-center md:gap-4">
						{/* Published Articles - Herkes için görünür */}
						<Link href="/published">
							<Button variant="ghost" size="sm" className="gap-2">
								<BookOpen className="h-4 w-4" />
								Yayınlar
							</Button>
						</Link>

						{user ? (
							<>
								{/* Dashboard Link */}
								<Link href="/dashboard">
									<Button variant="ghost" size="sm" className="gap-2">
										<LayoutDashboard className="h-4 w-4" />
										Dashboard
									</Button>
								</Link>

								{/* Articles Link - Hakem için gizle */}
								{userData?.role !== 'reviewer' && (
									<Link href="/articles">
										<Button variant="ghost" size="sm" className="gap-2">
											<FileText className="h-4 w-4" />
											Makaleler
										</Button>
									</Link>
								)}

								{/* User Menu */}
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" className="gap-2 px-2">
											<Avatar className="h-8 w-8">
												<AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs font-semibold">
													{getInitials(userData?.name, user.email)}
												</AvatarFallback>
											</Avatar>
											<div className="hidden lg:block text-left">
												<p className="text-sm font-medium">{userData?.name || 'Kullanıcı'}</p>
												<p className="text-xs text-gray-500">{user.email}</p>
											</div>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-64">
										<DropdownMenuLabel className="font-normal">
											<div className="flex flex-col space-y-2">
												<p className="text-sm font-medium leading-none">{userData?.name || 'Kullanıcı'}</p>
												<p className="text-xs leading-none text-muted-foreground">{user.email}</p>
												{userData?.role && (
													<Badge variant="outline" className={`w-fit gap-1 ${getRoleBadgeColor(userData.role)}`}>
														{getRoleIcon(userData.role)}
														{getRoleLabel(userData.role)}
													</Badge>
												)}
											</div>
										</DropdownMenuLabel>
										<DropdownMenuSeparator />
										<DropdownMenuItem asChild>
											<Link href="/dashboard" className="cursor-pointer">
												<LayoutDashboard className="mr-2 h-4 w-4" />
												<span>Dashboard</span>
											</Link>
										</DropdownMenuItem>
										{/* Makalelerim - Hakem için gizle */}
										{userData?.role !== 'reviewer' && (
											<DropdownMenuItem asChild>
												<Link href="/articles" className="cursor-pointer">
													<FileText className="mr-2 h-4 w-4" />
													<span>Makalelerim</span>
												</Link>
											</DropdownMenuItem>
										)}
										{userData?.role === 'admin' && (
											<DropdownMenuItem asChild>
												<Link href="/admin/users" className="cursor-pointer">
													<UserCog className="mr-2 h-4 w-4" />
													<span>Kullanıcı Yönetimi</span>
												</Link>
											</DropdownMenuItem>
										)}
										<DropdownMenuSeparator />
										<DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
											<LogOut className="mr-2 h-4 w-4" />
											<span>Çıkış Yap</span>
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</>
						) : (
							<>
								<div className="flex items-center gap-2">
									<Link href="/auth/login">
										<Button variant="ghost" size="sm">
											Giriş Yap
										</Button>
									</Link>
									<Link href="/auth/register">
										<Button
											size="sm"
											className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
										>
											Kayıt Ol
										</Button>
									</Link>
								</div>
							</>
						)}
					</div>

					{/* Mobile Menu Button */}
					<div className="flex md:hidden">
						<Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
							{mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
						</Button>
					</div>
				</div>

				{/* Mobile Menu */}
				{mobileMenuOpen && (
					<div className="border-t py-4 md:hidden">
						{/* Published Articles - Herkes için görünür */}
						<Link href="/published" onClick={() => setMobileMenuOpen(false)}>
							<Button variant="ghost" className="w-full justify-start gap-2 mb-2">
								<BookOpen className="h-4 w-4" />
								Yayınlanan Makaleler
							</Button>
						</Link>

						{user ? (
							<div className="space-y-3">
								<div className="flex items-center gap-3 px-2 py-2 border-b">
									<Avatar className="h-10 w-10">
										<AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
											{getInitials(userData?.name, user.email)}
										</AvatarFallback>
									</Avatar>
									<div className="flex-1">
										<p className="text-sm font-medium">{userData?.name || 'Kullanıcı'}</p>
										<p className="text-xs text-gray-500">{user.email}</p>
										{userData?.role && (
											<Badge variant="outline" className={`mt-1 gap-1 ${getRoleBadgeColor(userData.role)}`}>
												{getRoleIcon(userData.role)}
												{getRoleLabel(userData.role)}
											</Badge>
										)}
									</div>
								</div>
								<Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
									<Button variant="ghost" className="w-full justify-start gap-2">
										<LayoutDashboard className="h-4 w-4" />
										Dashboard
									</Button>
								</Link>
								{/* Makaleler - Hakem için gizle */}
								{userData?.role !== 'reviewer' && (
									<Link href="/articles" onClick={() => setMobileMenuOpen(false)}>
										<Button variant="ghost" className="w-full justify-start gap-2">
											<FileText className="h-4 w-4" />
											Makaleler
										</Button>
									</Link>
								)}
								{userData?.role === 'admin' && (
									<Link href="/admin/users" onClick={() => setMobileMenuOpen(false)}>
										<Button variant="ghost" className="w-full justify-start gap-2">
											<UserCog className="h-4 w-4" />
											Kullanıcı Yönetimi
										</Button>
									</Link>
								)}
								<Button variant="ghost" className="w-full justify-start gap-2 text-red-600" onClick={handleSignOut}>
									<LogOut className="h-4 w-4" />
									Çıkış Yap
								</Button>
							</div>
						) : (
							<div className="space-y-2">
								<Link href="/auth/login" onClick={() => setMobileMenuOpen(false)}>
									<Button variant="ghost" className="w-full">
										Giriş Yap
									</Button>
								</Link>
								<Link href="/auth/register" onClick={() => setMobileMenuOpen(false)}>
									<Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600">Kayıt Ol</Button>
								</Link>
							</div>
						)}
					</div>
				)}
			</div>
		</nav>
	)
}
