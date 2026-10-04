import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { cmsService } from '@/services/cms.service';
import { cmsStore } from '@/lib/cms-store';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth(req, 'banners.view');
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const faq = await cmsService.getFaqById(params.id);
    if (!faq) {
      return NextResponse.json({ success: false, error: 'FAQ not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, faq });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to fetch FAQ' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth(req, 'banners.edit');
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const body = await req.json();
    const { question, answer, category, is_active, is_published, sort_order } = body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json(
        { success: false, error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!answer || typeof answer !== 'string' || !answer.trim()) {
      return NextResponse.json(
        { success: false, error: 'Answer is required' },
        { status: 400 }
      );
    }

    const payload = {
      id: params.id,
      question: question.trim(),
      answer: answer.trim(),
      category: category || 'general',
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      is_published: is_published !== undefined ? Boolean(is_published) : true,
      sort_order: sort_order !== undefined ? Number(sort_order) : 0,
      updated_at: new Date().toISOString(),
    };

    let updatedFaq;

    try {
      const { data, error } = await supabaseAdmin
        .from('faqs')
        .upsert(payload, { onConflict: 'id' })
        .select('*')
        .maybeSingle();

      if (!error && data) {
        updatedFaq = data;
        cmsStore.saveFaq(data);
      }
    } catch (dbErr) {
      console.warn('Supabase FAQ update error, updating local store:', dbErr);
    }

    if (!updatedFaq) {
      updatedFaq = cmsStore.saveFaq(payload);
    }

    // Revalidate public FAQ paths
    try {
      revalidatePath('/faq');
      revalidatePath('/');
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'FAQ updated successfully',
      faq: updatedFaq,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Failed to update FAQ: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth(req, 'banners.edit');
  if (!auth.authorized) return auth.errorResponse!;

  try {
    const body = await req.json();
    const { action, is_active, is_published, sort_order } = body;

    let updatedFaq;

    if (action === 'toggle_active') {
      const existing = cmsStore.getFaqById(params.id);
      const newActive = is_active !== undefined ? Boolean(is_active) : !existing?.is_active;

      try {
        const { data } = await supabaseAdmin
          .from('faqs')
          .update({ is_active: newActive, updated_at: new Date().toISOString() })
          .eq('id', params.id)
          .select('*')
          .maybeSingle();

        if (data) updatedFaq = data;
      } catch (e) {}

      if (!updatedFaq) {
        updatedFaq = cmsStore.toggleFaqActive(params.id);
      }
    } else if (action === 'toggle_published') {
      const existing = cmsStore.getFaqById(params.id);
      const newPublished = is_published !== undefined ? Boolean(is_published) : !existing?.is_published;

      try {
        const { data } = await supabaseAdmin
          .from('faqs')
          .update({ is_published: newPublished, updated_at: new Date().toISOString() })
          .eq('id', params.id)
          .select('*')
          .maybeSingle();

        if (data) updatedFaq = data;
      } catch (e) {}

      if (!updatedFaq) {
        updatedFaq = cmsStore.toggleFaqPublished(params.id);
      }
    } else if (sort_order !== undefined) {
      try {
        const { data } = await supabaseAdmin
          .from('faqs')
          .update({ sort_order: Number(sort_order), updated_at: new Date().toISOString() })
          .eq('id', params.id)
          .select('*')
          .maybeSingle();

        if (data) updatedFaq = data;
      } catch (e) {}

      const existing = cmsStore.getFaqById(params.id);
      if (existing) {
        updatedFaq = cmsStore.saveFaq({ ...existing, sort_order: Number(sort_order) });
      }
    }

    try {
      revalidatePath('/faq');
      revalidatePath('/');
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'FAQ status updated',
      faq: updatedFaq,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await requireAdminAuth(req, 'banners.delete');
  if (!auth.authorized) return auth.errorResponse!;

  try {
    try {
      await supabaseAdmin.from('faqs').delete().eq('id', params.id);
    } catch (dbErr) {
      console.warn('Supabase FAQ delete error:', dbErr);
    }

    cmsStore.deleteFaq(params.id);

    try {
      revalidatePath('/faq');
      revalidatePath('/');
    } catch (e) {}

    return NextResponse.json({
      success: true,
      message: 'FAQ deleted successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Failed to delete FAQ' }, { status: 500 });
  }
}
