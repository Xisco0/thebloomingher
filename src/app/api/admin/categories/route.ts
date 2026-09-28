import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsStore } from '@/lib/cms-store';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Category } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const memoryCategories = cmsStore.getCategories();
    const catMap = new Map<string, Category>();

    // 1. Fetch live categories from Supabase
    try {
      const { data: dbCategories, error } = await supabaseAdmin
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && dbCategories && dbCategories.length > 0) {
        dbCategories.forEach((c: any) => {
          catMap.set(c.id, {
            id: c.id,
            legacy_id: c.legacy_id,
            name: c.name,
            slug: c.slug,
            description: c.description || '',
            image_url: c.image_url || '/images/logo.jpg',
            parent_id: c.parent_id,
            display_order: Number(c.display_order ?? 1),
            is_active: c.is_active !== false,
            seo_title: c.seo_title,
            seo_description: c.seo_description,
          });
        });
      }
    } catch (dbErr) {
      console.warn('[Admin Categories GET] Supabase fetch error:', dbErr);
    }

    // 2. Merge memory categories
    memoryCategories.forEach(c => {
      if (!catMap.has(c.id)) {
        catMap.set(c.id, c);
      }
    });

    const categories = Array.from(catMap.values()).sort(
      (a, b) => (a.display_order || 1) - (b.display_order || 1)
    );

    return NextResponse.json({ success: true, categories });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const category: Category = {
      id: body.id || `cat-${body.slug || Date.now()}`,
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      description: body.description || '',
      image_url: body.image_url || '/images/logo.jpg',
      total_products: body.total_products || 0,
      display_order: Number(body.display_order || 1),
      is_active: body.is_active !== undefined ? Boolean(body.is_active) : true,
    };

    // 1. Save in memory store
    const saved = cmsStore.saveCategory(category);

    // 2. Upsert in Supabase
    try {
      await supabaseAdmin.from('categories').upsert(
        {
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          image_url: category.image_url,
          display_order: category.display_order,
          is_active: category.is_active,
        },
        { onConflict: 'id' }
      );
    } catch (dbErr) {
      console.warn('[Admin Categories POST] Supabase upsert error:', dbErr);
    }

    // 3. Revalidate cache
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/products');
      revalidatePath('/shop');
      revalidatePath(`/categories/${category.slug}`);
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({ success: true, category: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Category ID required' }, { status: 400 });
    }

    // 1. Delete from Supabase
    try {
      await supabaseAdmin.from('categories').delete().eq('id', id);
    } catch (dbErr) {
      console.warn('[Admin Categories DELETE] Supabase delete error:', dbErr);
    }

    // 2. Revalidate cache
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/products');
      revalidatePath('/shop');
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({ success: true, message: 'Category deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
