import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyzeArticleWithAI } from '@/lib/gemini';
import { extractTextFromPDF, cleanPdfText, extractExcerpt, isPdfUrl } from '@/lib/pdf-utils';

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

    // Optionally extract excerpt from article PDF
    let fullTextExcerpt: string | undefined;
    if (article.file_url && isPdfUrl(article.file_url)) {
      try {
        console.log(`Extracting text from article PDF: ${article.file_url}`);
        const pdfText = await extractTextFromPDF(article.file_url);
        const cleanedText = cleanPdfText(pdfText);
        fullTextExcerpt = extractExcerpt(cleanedText, 3000);
      } catch (error) {
        console.warn('Failed to extract PDF text, using title and abstract only:', error);
        // Continue without full text - title and abstract are sufficient
      }
    }

    // Analyze article with Gemini AI
    console.log(`Analyzing article: ${article.title}`);
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
