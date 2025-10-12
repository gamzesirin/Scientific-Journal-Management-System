'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'

export default function BackupSchedule() {
	const [isEnabled, setIsEnabled] = useState(false)
	const [frequency, setFrequency] = useState('daily')
	const [time, setTime] = useState('02:00')

	const handleSaveSchedule = () => {
		if (!isEnabled) {
			toast.info('Otomatik yedekleme devre dışı')
			return
		}

		const scheduleInfo = {
			enabled: isEnabled,
			frequency,
			time
		}

		// Simüle edilen kaydetme işlemi
		console.log('Yedekleme zamanlaması:', scheduleInfo)

		const frequencyText =
			frequency === 'daily' ? 'günlük' :
			frequency === 'weekly' ? 'haftalık' : 'aylık'

		toast.success(`Otomatik yedekleme ${frequencyText} olarak ${time}'da çalışacak şekilde ayarlandı`)
	}

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="space-y-0.5">
					<Label htmlFor="auto-backup">Otomatik Yedekleme</Label>
					<p className="text-sm text-gray-500">
						Düzenli aralıklarla otomatik yedek alın
					</p>
				</div>
				<Switch
					id="auto-backup"
					checked={isEnabled}
					onCheckedChange={setIsEnabled}
				/>
			</div>

			{isEnabled && (
				<div className="space-y-4 pt-4 border-t">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="frequency">Sıklık</Label>
							<Select value={frequency} onValueChange={setFrequency}>
								<SelectTrigger id="frequency">
									<SelectValue placeholder="Sıklık seçin" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="daily">Günlük</SelectItem>
									<SelectItem value="weekly">Haftalık</SelectItem>
									<SelectItem value="monthly">Aylık</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label htmlFor="time">Saat</Label>
							<Input
								id="time"
								type="time"
								value={time}
								onChange={(e) => setTime(e.target.value)}
							/>
						</div>
					</div>

					<Button onClick={handleSaveSchedule} className="w-full">
						Zamanlamayı Kaydet
					</Button>
				</div>
			)}

			{!isEnabled && (
				<p className="text-sm text-gray-500">
					Otomatik yedekleme şu anda devre dışı. Etkinleştirmek için yukarıdaki anahtarı kullanın.
				</p>
			)}
		</div>
	)
}
