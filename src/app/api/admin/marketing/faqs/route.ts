import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { cmsService } from '@/services/cms.service';
import { cmsStore } from '@/lib/cms-store';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'banners.view');
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const faqs = await cmsService.getFaqs({ publicOnly: false, category, search });

    return NextResponse.json({
      success: true,
      count: faqs.length,
      faqs,
    });
  } catch (error: any) {
    console.error('Error fetching admin FAQs:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch FAQs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminAuth(req, 'banners.edit');
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const body = await req.json();
    const { question, answer, category, is_active, is_published, sort_order } = body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json(
        { success: false, error: 'Question is required and must be non-empty string.' },
        { status: 400 }
      );
    }

    if (!answer || typeof answer !== 'string' || !answer.trim()) {
      return NextResponse.json(
        { success: false, error: 'Answer is required and must be non-empty string.' },
        { status: 400 }
      );
    }

    const payload = {
      id: body.id || `faq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      question: question.trim(),
      answer: answer.trim(),
      category: category || 'general',
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      is_published: is_published !== undefined ? Boolean(is_published) : true,
      sort_order: sort_order !== undefined ? Number(sort_order) : 0,
      updated_at: new Date().toISOString(),
    };

    let createdFaq;

    try {
      const { data, error } = await supabaseAdmin
        .from('faqs')
        .upsert(payload, { onConflict: 'id' })
        .select('*')
        .maybeSingle();

      if (!error && data) {
        createdFaq = data;
        cmsStore.saveFaq(data);
      }
    } catch (dbErr) {
      console.warn('Supabase FAQ insert failed, saving to local store:', dbErr);
    }

    if (!createdFaq) {
      createdFaq = cmsStore.saveFaq(payload);
    }

    // Revalidate public FAQ routes for immediate freshness
    try {
      revalidatePath('/faq');
      revalidatePath('/');
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'FAQ created successfully',
      faq: createdFaq,
    });
  } catch (error: any) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create FAQ: ' + error.message },
      { status: 500 }
    );
  }
}
