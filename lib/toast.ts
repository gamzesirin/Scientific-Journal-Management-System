import { toast as sonnerToast } from 'sonner'

/**
 * Toast bildirim fonksiyonları
 * Sonner kütüphanesini kullanarak tutarlı bildirimler sağlar
 */

export const toast = {
	/**
	 * Başarılı işlem bildirimi
	 * @param message - Gösterilecek mesaj
	 * @param description - Opsiyonel açıklama
	 */
	success: (message: string, description?: string) => {
		sonnerToast.success(message, {
			description,
			duration: 4000
		})
	},

	/**
	 * Hata bildirimi
	 * @param message - Gösterilecek hata mesajı
	 * @param description - Opsiyonel açıklama
	 */
	error: (message: string, description?: string) => {
		sonnerToast.error(message, {
			description,
			duration: 5000
		})
	},

	/**
	 * Bilgilendirme bildirimi
	 * @param message - Gösterilecek mesaj
	 * @param description - Opsiyonel açıklama
	 */
	info: (message: string, description?: string) => {
		sonnerToast.info(message, {
			description,
			duration: 4000
		})
	},

	/**
	 * Uyarı bildirimi
	 * @param message - Gösterilecek uyarı mesajı
	 * @param description - Opsiyonel açıklama
	 */
	warning: (message: string, description?: string) => {
		sonnerToast.warning(message, {
			description,
			duration: 4000
		})
	},

	/**
	 * Yükleniyor bildirimi
	 * @param message - Gösterilecek mesaj
	 * @returns Toast ID (daha sonra güncelleme için kullanılabilir)
	 */
	loading: (message: string) => {
		return sonnerToast.loading(message)
	},

	/**
	 * Promise tabanlı bildirim
	 * @param promise - İzlenecek promise
	 * @param messages - Durumlara göre mesajlar
	 */
	promise: <T,>(
		promise: Promise<T>,
		messages: {
			loading: string
			success: string | ((data: T) => string)
			error: string | ((error: any) => string)
		}
	) => {
		return sonnerToast.promise(promise, messages)
	},

	/**
	 * Mevcut bir toast'ı güncelle
	 * @param id - Toast ID
	 * @param message - Yeni mesaj
	 * @param type - Toast tipi
	 */
	update: (id: string | number, message: string, type: 'success' | 'error' | 'info' | 'warning') => {
		if (type === 'success') {
			sonnerToast.success(message, { id })
		} else if (type === 'error') {
			sonnerToast.error(message, { id })
		} else if (type === 'info') {
			sonnerToast.info(message, { id })
		} else if (type === 'warning') {
			sonnerToast.warning(message, { id })
		}
	},

	/**
	 * Bir toast'ı kapat
	 * @param id - Toast ID
	 */
	dismiss: (id?: string | number) => {
		sonnerToast.dismiss(id)
	}
}
