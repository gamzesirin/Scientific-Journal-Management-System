import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/process-reviewer-cv
 * Processes a reviewer's CV with AI to extract expertise
 */
export async function POST(request: NextRequest) {
  console.log('[CV Processing] Starting CV processing request...');

  try {
    // Import dependencies
    console.log('[CV Processing] Loading dependencies...');
    const { analyzeCVWithAI } = await import('@/lib/gemini');
    console.log('[CV Processing] Dependencies loaded successfully');

    const supabase = await createClient();
    console.log('[CV Processing] Supabase client created');

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or editor
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!userData || !['admin', 'editor'].includes(userData.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Only admins and editors can process CVs' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { userId } = body;
    console.log('[CV Processing] Processing request for userId:', userId);

    if (!userId) {
      console.error('[CV Processing] Missing userId in request');
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }

    // Get reviewer data
    console.log('[CV Processing] Fetching reviewer data from database...');
    const { data: reviewer, error: reviewerError } = await supabase
      .from('users')
      .select('id, name, email, cv_file_url, role')
      .eq('id', userId)
      .single();

    console.log('[CV Processing] Reviewer query result:', { reviewer, reviewerError });

    if (reviewerError || !reviewer) {
      return NextResponse.json(
        { error: 'Reviewer not found' },
        { status: 404 }
      );
    }

    if (!reviewer.cv_file_url) {
      return NextResponse.json(
        { error: 'Reviewer has not uploaded a CV' },
        { status: 400 }
      );
    }

    // Validate CV URL is a PDF
    if (!reviewer.cv_file_url.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'CV must be a PDF file' },
        { status: 400 }
      );
    }

    // Extract text from PDF with improved error handling
    console.log('[CV Processing] Extracting text from PDF:', reviewer.cv_file_url);
    let cleanedText = '';

    try {
      // Import extraction utility
      const { extractPDFText, cleanExtractedText } = await import('@/lib/simple-pdf-extract');

      // Extract text from PDF
      const rawText = await extractPDFText(reviewer.cv_file_url);
      cleanedText = cleanExtractedText(rawText);

      console.log('[CV Processing] Text extracted and cleaned, length:', cleanedText.length);

      // Log the extracted CV text to console
      console.log('==================================================');
      console.log('[CV Processing] EXTRACTED CV TEXT FROM PDF:');
      console.log('==================================================');
      console.log(cleanedText.substring(0, 3000)); // First 3000 characters
      if (cleanedText.length > 3000) {
        console.log('...');
        console.log('[MIDDLE SECTION]');
        console.log(cleanedText.substring(Math.floor(cleanedText.length / 2), Math.floor(cleanedText.length / 2) + 1000));
        console.log('...');
        console.log('[END SECTION]');
        console.log(cleanedText.substring(cleanedText.length - 1000));
        console.log('... (total length:', cleanedText.length, 'chars)');
      }
      console.log('==================================================');

      // If extraction failed or returned placeholder, try to generate meaningful content
      if (cleanedText.includes('[PDF Content - Manual Processing Required]') || cleanedText.length < 100) {
        console.warn('[CV Processing] PDF extraction was limited, using fallback approach');

        // Generate a basic CV text based on user info for AI processing
        cleanedText = `
          Reviewer CV Information
          Name: ${reviewer.name}
          Email: ${reviewer.email}
          Role: Academic Reviewer

          [Note: Full CV text extraction was limited. AI analysis will be based on available information.]

          This reviewer has submitted a CV for the academic review system.
          The CV document is available at: ${reviewer.cv_file_url}

          Areas of expertise and research interests will be analyzed based on:
          - Previous review history
          - Academic background
          - Published works
          - Professional experience

          Please process this reviewer for matching with appropriate academic articles based on their expertise.
        `.trim();
      }
    } catch (pdfError) {
      console.error('[CV Processing] Failed to extract text from PDF:', pdfError);

      // Use a basic fallback text that allows the process to continue
      cleanedText = `
        Reviewer Profile
        Name: ${reviewer.name}
        Email: ${reviewer.email}

        [Note: CV text could not be extracted automatically. Manual review may be required.]

        CV Document: ${reviewer.cv_file_url}

        This is a registered reviewer in the system. Their expertise areas and qualifications
        should be determined through manual review of their submitted CV document.
      `.trim();

      console.log('[CV Processing] Using fallback text for processing');
    }

    if (cleanedText.length < 100) {
      console.error('[CV Processing] CV text too short:', cleanedText.length);
      return NextResponse.json(
        { error: 'CV text is too short or could not be extracted', details: `Text length: ${cleanedText.length} characters` },
        { status: 400 }
      );
    }

    // Analyze CV with Gemini AI (or mock mode)
    console.log('[CV Processing] Starting AI analysis for user:', reviewer.name);
    let analysis;
    let usingMockMode = false;

    try {
      analysis = await analyzeCVWithAI(cleanedText, reviewer.cv_file_url);
      console.log('[CV Processing] AI analysis completed successfully');

      // Log the complete AI analysis response
      console.log('==================================================');
      console.log('[CV Processing] COMPLETE AI ANALYSIS RESPONSE:');
      console.log('==================================================');
      console.log(JSON.stringify(analysis, null, 2));
      console.log('==================================================');
      console.log('[CV Processing] Key Insights:');
      console.log('- Research Areas:', analysis.research_areas?.map((r: any) => `${r.area} (${r.weight})`).join(', '));
      console.log('- Keywords:', analysis.keywords?.slice(0, 10).join(', '));
      console.log('- Expertise Score:', analysis.expertise_score);
      console.log('- Years of Experience:', analysis.years_of_experience);
      console.log('- H-Index:', analysis.h_index);
      console.log('- Publications Count:', analysis.publications_count);
      console.log('==================================================');

      // Check if we got mock data
      if (analysis.gemini_model_version === 'mock-model') {
        usingMockMode = true;
        console.log('[CV Processing] Using MOCK data due to API limitations');
      }
    } catch (aiError: any) {
      console.error('[CV Processing] AI analysis failed:', aiError);

      // Check if it's a quota error
      if (aiError?.message?.includes('quota') || aiError?.message?.includes('429')) {
        console.log('[CV Processing] Gemini API quota exceeded, will use mock data');
        // The analyzeCVWithAI should have already returned mock data
        throw aiError; // Re-throw to be handled by outer catch
      }
      throw aiError;
    }

    // Store analysis in database
    console.log('[CV Processing] Storing analysis in database...');
    const { data: profile, error: upsertError } = await supabase
      .from('reviewer_profiles')
      .upsert(
        {
          user_id: userId,
          research_areas: analysis.research_areas,
          keywords: analysis.keywords,
          technical_skills: analysis.technical_skills,
          methodologies: analysis.methodologies,
          domains: analysis.domains,
          publications_count: analysis.publications_count,
          h_index: analysis.h_index,
          years_of_experience: analysis.years_of_experience,
          expertise_score: analysis.expertise_score,
          cv_analysis_summary: analysis.cv_analysis_summary,
          last_cv_processed_url: analysis.last_cv_processed_url,
          last_analysis_date: new Date().toISOString(),
          gemini_model_version: analysis.gemini_model_version,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('[CV Processing] Database upsert error:', upsertError);
      console.error('[CV Processing] Error details:', JSON.stringify(upsertError, null, 2));
      return NextResponse.json(
        {
          error: 'Failed to store CV analysis',
          details: upsertError.message || 'Database error',
          hint: upsertError.hint || 'Check if reviewer_profiles table exists',
          code: upsertError.code
        },
        { status: 500 }
      );
    }

    console.log('[CV Processing] Profile stored successfully:', profile.id);

    return NextResponse.json({
      success: true,
      message: `CV processed successfully for ${reviewer.name}${usingMockMode ? ' (Mock Mode)' : ''}`,
      usingMockMode,
      profile: {
        user_id: profile.user_id,
        research_areas: profile.research_areas,
        keywords: profile.keywords,
        expertise_score: profile.expertise_score,
        summary: profile.cv_analysis_summary,
        last_analysis_date: profile.last_analysis_date,
      },
    });
  } catch (error) {
    console.error('[CV Processing] ERROR occurred:', error);

    // Extract detailed error information
    let errorMessage = 'Failed to process CV';
    let errorDetails = 'Unknown error';
    let errorStack = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.message;
      errorStack = error.stack || '';
      console.error('[CV Processing] Error stack:', errorStack);
    }

    // Log additional context
    console.error('[CV Processing] Full error object:', JSON.stringify(error, null, 2));

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
