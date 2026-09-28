import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import catalogData from '@/lib/data/catalog.json';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    let syncedCategories = 0;
    let syncedProducts = 0;
    let syncedInventory = 0;
    const errors: string[] = [];

    // 1. Sync Categories
    for (const cat of catalogData.categories) {
      const { error } = await supabaseAdmin.from('categories').upsert(
        {
          id: cat.id,
          legacy_id: cat.legacy_id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          image_url: cat.image_url,
          display_order: cat.display_order || 0,
          is_active: cat.is_active !== false,
          seo_title: cat.seo_title,
          seo_description: cat.seo_description,
        },
        { onConflict: 'id' }
      );

      if (error) {
        errors.push(`Category ${cat.name}: ${error.message}`);
      } else {
        syncedCategories++;
      }
    }

    // 2. Sync Products
    for (const p of catalogData.products) {
      const imageUrls = (p.images || []).map(img => (typeof img === 'string' ? img : img.url));

      const { error: prodErr } = await supabaseAdmin.from('products').upsert(
        {
          id: p.id,
          legacy_id: p.legacy_id,
          name: p.name,
          slug: p.slug,
          sku: p.sku,
          price: Number(p.price) || 0,
          compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
          currency: p.currency || 'NGN',
          category_id: p.category_id,
          category_name: p.category_name,
          subcategory: p.subcategory || null,
          short_description: p.short_description || null,
          description: p.description || '',
          features: p.features || [],
          how_to_use: p.how_to_use || null,
          ingredients: p.ingredients || null,
          is_featured: Boolean(p.is_featured),
          is_bestseller: Boolean(p.is_bestseller),
          is_new_arrival: Boolean(p.is_new_arrival),
          status: 'active',
          seo_title: p.seo_title || null,
          seo_description: p.seo_description || null,
          tags: p.tags || [],
          rating: Number(p.rating) || 5.0,
          rating_count: Number(p.rating_count) || 1,
          images: imageUrls,
        },
        { onConflict: 'id' }
      );

      if (prodErr) {
        errors.push(`Product ${p.name}: ${prodErr.message}`);
      } else {
        syncedProducts++;

        // 3. Upsert inventory
        const { error: invErr } = await supabaseAdmin.from('inventory').upsert(
          {
            product_id: p.id,
            stock_quantity: p.stock_quantity ?? 50,
            low_stock_threshold: p.low_stock_threshold ?? 5,
            sku: p.sku,
          },
          { onConflict: 'product_id' }
        );

        if (!invErr) syncedInventory++;
      }
    }

    if (syncedProducts === 0 && errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Database sync could not complete: ${errors[0]}. Please run the updated 'supabase/schema_and_seed.sql' in your Supabase SQL Editor to refresh table schemas.`,
          errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${syncedProducts} of ${catalogData.products.length} products to Supabase.`,
      stats: {
        totalProducts: catalogData.products.length,
        syncedProducts,
        syncedCategories,
        syncedInventory,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch (error: any) {
    console.error('[Supabase Catalog Sync Error]:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
