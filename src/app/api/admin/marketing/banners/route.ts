import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';
import { BannerFilterOptions, BannerPlacement, BannerStatus, BannerType, MarketingBanner } from '@/types/marketing-cms.types';
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

    const memoryBanners = cmsStore.getBanners(filters);
    const bannersMap = new Map<string, MarketingBanner>();

    // 1. Fetch from Supabase
    try {
      const { data, error } = await supabaseAdmin
        .from('marketing_banners')
        .select('*')
        .order('priority_order', { ascending: true });

      if (!error && data) {
        data.forEach((b: any) => {
          bannersMap.set(b.id, {
            id: b.id,
            internal_name: b.internal_name || b.title || 'Banner',
            title: b.title,
            highlighted_title: b.highlighted_title || undefined,
            subtitle: b.subtitle || undefined,
            badge_text: b.badge_text || undefined,
            banner_type: b.banner_type || 'custom',
            placement: b.placement || 'homepage_hero',
            primary_cta: typeof b.primary_cta === 'string' ? JSON.parse(b.primary_cta) : (b.primary_cta || { text: 'Shop Now', destinationType: 'collection', url: '/shop' }),
            secondary_cta: typeof b.secondary_cta === 'string' ? JSON.parse(b.secondary_cta) : (b.secondary_cta || undefined),
            desktop_image_url: b.desktop_image_url,
            mobile_image_url: b.mobile_image_url || undefined,
            alt_text: b.alt_text || b.title || '',
            priority_order: Number(b.priority_order || 1),
            status: b.status || 'active',
            timezone: b.timezone || 'Africa/Lagos',
            created_at: b.created_at,
            updated_at: b.updated_at,
          });
        });
      }
    } catch (dbErr) {
      console.warn('[Admin Banners GET] Supabase fetch error:', dbErr);
    }

    // 2. Merge memory banners
    memoryBanners.forEach(b => {
      if (!bannersMap.has(b.id)) {
        bannersMap.set(b.id, b);
      }
    });

    const banners = Array.from(bannersMap.values()).sort(
      (a, b) => (a.priority_order || 1) - (b.priority_order || 1)
    );

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

    return NextResponse.json({ success: deleted, message: 'Banner deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

