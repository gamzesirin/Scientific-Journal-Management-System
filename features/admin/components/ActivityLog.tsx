'use client'

import { Badge } from '@/components/ui/badge'
import { FileText, UserPlus, MessageSquare, CheckCircle, XCircle, Edit } from 'lucide-react'

interface Activity {
	id: string
	type: 'article' | 'user' | 'review' | 'decision'
	action: string
	description: string
	user: string
	created_at: string
	status?: 'success' | 'error' | 'info'
}

interface ActivityLogProps {
	activities: Activity[]
}

export default function ActivityLog({ activities }: ActivityLogProps) {
	const getIcon = (type: string) => {
		switch (type) {
			case 'article':
				return <FileText className="h-4 w-4" />
			case 'user':
				return <UserPlus className="h-4 w-4" />
			case 'review':
				return <MessageSquare className="h-4 w-4" />
			case 'decision':
				return <CheckCircle className="h-4 w-4" />
			default:
				return <Edit className="h-4 w-4" />
		}
	}

	const getStatusColor = (status?: string) => {
		switch (status) {
			case 'success':
				return 'bg-green-100 text-green-800 border-green-200'
			case 'error':
				return 'bg-red-100 text-red-800 border-red-200'
			default:
				return 'bg-blue-100 text-blue-800 border-blue-200'
		}
	}

	if (!activities || activities.length === 0) {
		return (
			<p className="text-sm text-gray-500 text-center py-8">
				Henüz aktivite kaydı bulunmuyor.
			</p>
		)
	}

	return (
		<div className="space-y-4">
			{activities.map(activity => (
				<div
					key={activity.id}
					className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
				>
					<div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(activity.status)}`}>
						{getIcon(activity.type)}
					</div>
					<div className="flex-1 min-w-0">
						<div className="flex items-start justify-between gap-2">
							<div className="flex-1">
								<p className="text-sm font-medium text-gray-900">
									{activity.action}
								</p>
								<p className="text-sm text-gray-600 mt-1">
									{activity.description}
								</p>
								<div className="flex items-center gap-2 mt-2">
									<span className="text-xs text-gray-500">
										{activity.user}
									</span>
									<span className="text-xs text-gray-400">•</span>
									<span className="text-xs text-gray-500">
										{new Date(activity.created_at).toLocaleString('tr-TR')}
									</span>
								</div>
							</div>
							{activity.status && (
								<Badge
									variant={activity.status === 'error' ? 'destructive' : 'default'}
									className="flex-shrink-0"
								>
									{activity.status === 'success' ? 'Başarılı' : activity.status === 'error' ? 'Hata' : 'Bilgi'}
								</Badge>
							)}
						</div>
					</div>
				</div>
			))}
		</div>
	)
}
