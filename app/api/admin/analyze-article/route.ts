import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeArticleWithAI } from '@/lib/gemini';

/**
 * POST /api/admin/analyze-article
 * Analyzes an article with AI to extract topics and keywords
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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
        { error: 'Forbidden: Only admins and editors can analyze articles' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await request.json();
    const { articleId } = body;

    if (!articleId) {
      return NextResponse.json(
        { error: 'Missing required field: articleId' },
        { status: 400 }
      );
    }

    // Get article data
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('id, title, abstract, file_url')
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    if (!article.title || !article.abstract) {
      return NextResponse.json(
        { error: 'Article must have title and abstract' },
        { status: 400 }
      );
    }

    // Extract text from PDF if available
    let fullTextExcerpt = '';
    let fullPdfText = '';
    if (article.file_url && article.file_url.toLowerCase().endsWith('.pdf')) {
      try {
        console.log('[Article Analysis] Extracting text from PDF:', article.file_url);
        const { extractAndCleanPDFText } = await import('@/lib/simple-pdf-extract');

        const pdfText = await extractAndCleanPDFText(article.file_url);
        fullPdfText = pdfText;

        // Use much more text for AI analysis (up to 10000 chars instead of 4000)
        // This allows better understanding of the article content
        fullTextExcerpt = pdfText.substring(0, 10000);

        console.log('[Article Analysis] PDF text extracted, length:', pdfText.length);
        console.log('[Article Analysis] Using excerpt length for AI:', fullTextExcerpt.length);

        // Log extracted PDF text to console
        console.log('==================================================');
        console.log('[Article Analysis] EXTRACTED PDF TEXT:');
        console.log('==================================================');
        console.log(pdfText.substring(0, 2000)); // First 2000 characters
        if (pdfText.length > 2000) {
          console.log('...');
          console.log('[MIDDLE SECTION]');
          console.log(pdfText.substring(Math.floor(pdfText.length / 2), Math.floor(pdfText.length / 2) + 1000));
          console.log('...');
          console.log('[END SECTION]');
          console.log(pdfText.substring(pdfText.length - 1000));
          console.log('... (total length:', pdfText.length, 'chars)');
        }
        console.log('==================================================');
      } catch (pdfError) {
        console.warn('[Article Analysis] Failed to extract PDF text:', pdfError);
        console.log('[Article Analysis] Continuing with title and abstract only');
        // Continue without PDF text - not critical
      }
    }

    // Analyze article with Gemini AI using title, abstract, and optionally PDF excerpt
    console.log(`[Article Analysis] Analyzing article: ${article.title}`);
    const analysis = await analyzeArticleWithAI(
      article.title,
      article.abstract,
      fullTextExcerpt
    );

    // Store analysis in database
    const { data: articleAnalysis, error: upsertError } = await supabase
      .from('article_analyses')
      .upsert(
        {
          article_id: articleId,
          main_topics: analysis.main_topics,
          keywords: analysis.keywords,
          methodology: analysis.methodology,
          research_domain: analysis.research_domain,
          complexity_level: analysis.complexity_level,
          analysis_summary: analysis.analysis_summary,
          last_analysis_date: new Date().toISOString(),
          gemini_model_version: analysis.gemini_model_version,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'article_id',
        }
      )
      .select()
      .single();

    if (upsertError) {
      console.error('Error storing article analysis:', upsertError);
      return NextResponse.json(
        { error: 'Failed to store article analysis' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Article analyzed successfully`,
      analysis: {
        article_id: articleAnalysis.article_id,
        main_topics: articleAnalysis.main_topics,
        keywords: articleAnalysis.keywords,
        methodology: articleAnalysis.methodology,
        research_domain: articleAnalysis.research_domain,
        complexity_level: articleAnalysis.complexity_level,
        summary: articleAnalysis.analysis_summary,
        last_analysis_date: articleAnalysis.last_analysis_date,
      },
      extracted_pdf_text: fullPdfText ? {
        full_length: fullPdfText.length,
        excerpt_used_for_analysis: fullTextExcerpt,
        full_text: fullPdfText
      } : null,
    });
  } catch (error) {
    console.error('Error analyzing article:', error);
    return NextResponse.json(
      {
        error: 'Failed to analyze article',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
