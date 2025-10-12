import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

import { AuthProvider } from '@/features/auth/components/AuthProvider'
import Navbar from '@/components/common/Navbar'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
	title: 'Bilimsel Dergi Yönetim Sistemi',
	description: 'Akademik yayın sürecinizi kolayca yönetin'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="tr" suppressHydrationWarning>
			<body className={inter.className}>
				<AuthProvider>
					<Navbar />
					<main>{children}</main>
					<Toaster
						position="top-right"
						richColors
						closeButton
						expand={false}
						duration={4000}
					/>
				</AuthProvider>
			</body>
		</html>
	)
}
