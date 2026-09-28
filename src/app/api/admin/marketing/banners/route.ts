import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsStore } from '@/lib/cms-store';
import { cmsService } from '@/services/cms.service';
import { BannerFilterOptions, BannerPlacement, BannerStatus, BannerType } from '@/types/marketing-cms.types';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') as BannerStatus | 'all' | undefined;
    const type = searchParams.get('type') as BannerType | 'all' | undefined;
    const placement = searchParams.get('placement') as BannerPlacement | 'all' | undefined;
    const campaign_id = searchParams.get('campaign_id') || undefined;

    const filters: BannerFilterOptions = {
      search,
      status: status || 'all',
      type: type || 'all',
      placement: placement || 'all',
      campaign_id,
    };

    const banners = await cmsService.getBanners(filters);

    return NextResponse.json({ success: true, banners });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title || !body.desktop_image_url) {
      return NextResponse.json(
        { success: false, error: 'Title and desktop image are required' },
        { status: 400 }
      );
    }

    // 1. Save to memory store
    const saved = cmsStore.saveBanner(body);

    // 2. Upsert in Supabase
    try {
      await supabaseAdmin.from('marketing_banners').upsert({
        id: saved.id,
        title: saved.title,
        highlighted_title: saved.highlighted_title || null,
        subtitle: saved.subtitle || null,
        badge_text: saved.badge_text || null,
        banner_type: saved.banner_type || 'custom',
        placement: saved.placement || 'homepage_hero',
        primary_cta: saved.primary_cta || null,
        secondary_cta: saved.secondary_cta || null,
        desktop_image_url: saved.desktop_image_url,
        mobile_image_url: saved.mobile_image_url || null,
        alt_text: saved.alt_text || null,
        priority_order: saved.priority_order || 1,
        status: saved.status || 'active',
        internal_name: saved.internal_name || null,
        created_at: saved.created_at,
        updated_at: saved.updated_at,
      });
    } catch (dbErr) {
      console.warn('[Admin Banners POST] Supabase upsert error:', dbErr);
    }

    // 3. Revalidate cache
    try {
      revalidatePath('/', 'layout');
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({ success: true, banner: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Banner ID required' }, { status: 400 });
    }

    // 1. Save to memory store
    const saved = cmsStore.saveBanner(body);

    // 2. Upsert in Supabase
    try {
      await supabaseAdmin.from('marketing_banners').upsert({
        id: saved.id,
        title: saved.title,
        highlighted_title: saved.highlighted_title || null,
        subtitle: saved.subtitle || null,
        badge_text: saved.badge_text || null,
        banner_type: saved.banner_type || 'custom',
        placement: saved.placement || 'homepage_hero',
        primary_cta: saved.primary_cta || null,
        secondary_cta: saved.secondary_cta || null,
        desktop_image_url: saved.desktop_image_url,
        mobile_image_url: saved.mobile_image_url || null,
        alt_text: saved.alt_text || null,
        priority_order: saved.priority_order || 1,
        status: saved.status || 'active',
        internal_name: saved.internal_name || null,
        created_at: saved.created_at,
        updated_at: saved.updated_at,
      });
    } catch (dbErr) {
      console.warn('[Admin Banners PUT] Supabase upsert error:', dbErr);
    }

    // 3. Revalidate cache
    try {
      revalidatePath('/', 'layout');
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({ success: true, banner: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Banner ID required' }, { status: 400 });
    }

    // 1. Delete from memory store
    const deleted = cmsStore.deleteBanner(id);

    // 2. Delete from Supabase
    try {
      await supabaseAdmin.from('marketing_banners').delete().eq('id', id);
    } catch (dbErr) {
      console.warn('[Admin Banners DELETE] Supabase delete error:', dbErr);
    }

    // 3. Revalidate cache
    try {
      revalidatePath('/', 'layout');
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({ success: deleted, message: 'Banner deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

