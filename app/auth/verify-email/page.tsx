export default function VerifyEmailPage() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50">
			<div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow text-center">
				<div>
					<h2 className="text-3xl font-bold">Email Onayı</h2>
					<p className="mt-2 text-gray-600">
						Email adresinize bir onay bağlantısı gönderdik. Lütfen email&apos;inizi kontrol edin ve hesabınızı onaylayın.
					</p>
				</div>

				<div className="mt-4">
					<p className="text-sm text-gray-500">
						Email almadınız mı?{' '}
						<a href="/auth/login" className="text-blue-600 hover:text-blue-700">
							Giriş yapmayı deneyin
						</a>
					</p>
				</div>
			</div>
		</div>
	)
}
