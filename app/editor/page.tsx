import { redirect } from 'next/navigation'

export default function EditorPage() {
	// Editor root sayfası dashboard'a yönlendirir
	redirect('/dashboard')
}