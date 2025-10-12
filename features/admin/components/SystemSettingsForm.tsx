'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'

export default function SystemSettingsForm() {
	const [settings, setSettings] = useState({
		platformName: 'Bilimsel Dergi Yönetim Sistemi',
		platformDescription: 'Akademik makale gönderim ve değerlendirme platformu',
		contactEmail: 'info@dergi.com',
		maxFileSize: '10',
		allowRegistration: true,
		requireEmailVerification: true
	})

	const handleSave = () => {
		// TODO: API çağrısı ile ayarları kaydet
		toast.success('Ayarlar başarıyla kaydedildi')
	}

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="platformName">Platform Adı</Label>
				<Input
					id="platformName"
					value={settings.platformName}
					onChange={e => setSettings({ ...settings, platformName: e.target.value })}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="platformDescription">Platform Açıklaması</Label>
				<Textarea
					id="platformDescription"
					value={settings.platformDescription}
					onChange={e => setSettings({ ...settings, platformDescription: e.target.value })}
					rows={3}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="contactEmail">İletişim E-postası</Label>
				<Input
					id="contactEmail"
					type="email"
					value={settings.contactEmail}
					onChange={e => setSettings({ ...settings, contactEmail: e.target.value })}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="maxFileSize">Maksimum Dosya Boyutu (MB)</Label>
				<Input
					id="maxFileSize"
					type="number"
					value={settings.maxFileSize}
					onChange={e => setSettings({ ...settings, maxFileSize: e.target.value })}
				/>
			</div>

			<div className="flex items-center justify-between py-4 border-t border-b">
				<div className="space-y-0.5">
					<Label>Kullanıcı Kaydına İzin Ver</Label>
					<p className="text-sm text-gray-500">Yeni kullanıcıların kayıt olmasına izin ver</p>
				</div>
				<Switch
					checked={settings.allowRegistration}
					onCheckedChange={checked => setSettings({ ...settings, allowRegistration: checked })}
				/>
			</div>

			<div className="flex items-center justify-between py-4 border-b">
				<div className="space-y-0.5">
					<Label>E-posta Doğrulaması Gerekli</Label>
					<p className="text-sm text-gray-500">
						Yeni kullanıcılar e-posta adreslerini doğrulamalı
					</p>
				</div>
				<Switch
					checked={settings.requireEmailVerification}
					onCheckedChange={checked =>
						setSettings({ ...settings, requireEmailVerification: checked })
					}
				/>
			</div>

			<div className="flex justify-end gap-2 pt-4">
				<Button variant="outline">İptal</Button>
				<Button onClick={handleSave}>Kaydet</Button>
			</div>
		</div>
	)
}
