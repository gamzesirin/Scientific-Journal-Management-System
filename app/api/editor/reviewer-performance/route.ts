import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
	try {
		const supabase = await createServerSupabaseClient()

		// Verify authentication
		const {
			data: { user }
		} = await supabase.auth.getUser()

		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}

		// Get user data and verify editor role
		const { data: userData, error: userError } = await supabase.from('users').select('role').eq('id', user.id).single()

		if (userError || !userData || (userData.role !== 'editor' && userData.role !== 'admin')) {
			return NextResponse.json({ error: 'Forbidden - Editor access required' }, { status: 403 })
		}

		// Get all reviewers
		const { data: reviewers, error: reviewersError } = await supabase
			.from('users')
			.select('id, name, email, affiliation, expertise_areas, created_at')
			.eq('role', 'reviewer')
			.order('name', { ascending: true })

		if (reviewersError) {
			console.error('Error fetching reviewers:', reviewersError)
			return NextResponse.json({ error: 'Failed to fetch reviewers' }, { status: 500 })
		}

		// Get all assignments with reviews
		const { data: assignments, error: assignmentsError } = await supabase
			.from('assignments')
			.select(
				`
				id,
				reviewer_id,
				article_id,
				status,
				assigned_at,
				deadline,
				reviews (
					id,
					status,
					submitted_at,
					created_at,
					updated_at
				)
			`
			)
			.order('assigned_at', { ascending: false })

		if (assignmentsError) {
			console.error('Error fetching assignments:', assignmentsError)
			return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 })
		}

		// Calculate performance metrics for each reviewer
		const performanceData = reviewers.map((reviewer) => {
			// Get this reviewer's assignments
			const reviewerAssignments = assignments?.filter((a) => a.reviewer_id === reviewer.id) || []

			// Calculate metrics
			const totalAssignments = reviewerAssignments.length
			const completedAssignments = reviewerAssignments.filter(
				(a) => a.reviews && a.reviews.length > 0 && a.reviews[0].status === 'submitted'
			).length

			const completionRate = totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0

			// Calculate pending and overdue
			const now = new Date()
			const pendingAssignments = reviewerAssignments.filter(
				(a) => !a.reviews || a.reviews.length === 0 || a.reviews[0].status !== 'submitted'
			)
			const overdueAssignments = pendingAssignments.filter((a) => a.deadline && new Date(a.deadline) < now)

			// Calculate average completion time (in days) for completed assignments
			let averageCompletionTime: number | null = null
			const completedWithTime = reviewerAssignments.filter(
				(a) => a.reviews && a.reviews.length > 0 && a.reviews[0].status === 'submitted' && a.reviews[0].submitted_at
			)

			if (completedWithTime.length > 0) {
				const totalDays = completedWithTime.reduce((sum, a) => {
					const assignedDate = new Date(a.assigned_at)
					const submittedDate = new Date(a.reviews[0].submitted_at!)
					const days = Math.ceil((submittedDate.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24))
					return sum + days
				}, 0)
				averageCompletionTime = Math.round(totalDays / completedWithTime.length)
			}

			// Get first assignment date
			const firstAssignmentDate =
				reviewerAssignments.length > 0
					? new Date(
							Math.min(...reviewerAssignments.map((a) => new Date(a.assigned_at).getTime()))
					  ).toISOString()
					: null

			return {
				id: reviewer.id,
				name: reviewer.name,
				email: reviewer.email,
				affiliation: reviewer.affiliation,
				expertise_areas: reviewer.expertise_areas || [],
				totalAssignments,
				completedAssignments,
				pendingAssignments: pendingAssignments.length,
				overdueAssignments: overdueAssignments.length,
				completionRate,
				averageCompletionTime,
				firstAssignmentDate,
				memberSince: reviewer.created_at
			}
		})

		// Sort by completion rate (descending), then by total assignments (descending)
		performanceData.sort((a, b) => {
			if (b.completionRate !== a.completionRate) {
				return b.completionRate - a.completionRate
			}
			return b.totalAssignments - a.totalAssignments
		})

		return NextResponse.json({ data: performanceData }, { status: 200 })
	} catch (error) {
		console.error('Error in reviewer performance API:', error)
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
	}
}
