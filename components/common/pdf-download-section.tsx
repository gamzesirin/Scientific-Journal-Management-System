'use client'

import { PDFDownloadButtonSimple, PDFViewButtonSimple } from './pdf-actions-simple'

interface PDFDownloadSectionProps {
	fileUrl: string
	fileName?: string
}

export function PDFDownloadSection({ fileUrl, fileName = 'makale.pdf' }: PDFDownloadSectionProps) {
	return (
		<div className="flex gap-2">
			<PDFViewButtonSimple fileUrl={fileUrl} fileName={fileName} />
			<PDFDownloadButtonSimple fileUrl={fileUrl} fileName={fileName} />
		</div>
	)
}
