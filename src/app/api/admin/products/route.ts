import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cmsStore } from '@/lib/cms-store';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Product } from '@/types';
import { generateProfessionalSlug } from '@/lib/utils/slug';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const productMap = new Map<string, Product>();
    let hasDbProducts = false;

    // 1. Try to query Supabase products table as source of truth
    try {
      const { data: dbProducts, error: dbError } = await supabaseAdmin
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!dbError && Array.isArray(dbProducts)) {
        hasDbProducts = true;
        dbProducts.forEach(p => {
          if (cmsStore.isProductDeleted(p.id) || (p.slug && cmsStore.isProductDeleted(p.slug))) {
            return;
          }

          let rawImages = p.images;
          if (typeof rawImages === 'string') {
            try {
              rawImages = JSON.parse(rawImages);
            } catch {
              rawImages = [rawImages];
            }
          }
          if (!Array.isArray(rawImages) || rawImages.length === 0) {
            rawImages = ['/images/logo.jpg'];
          }

          const formattedImages = rawImages.map((img: any, idx: number) => {
            if (typeof img === 'string') {
              return {
                id: `img-${p.id}-${idx}`,
                product_id: p.id,
                url: img,
                alt_text: p.name || 'Product image',
                display_order: idx + 1,
                is_primary: idx === 0,
              };
            }
            return img;
          });

          const dbProductFormatted: Product = {
            id: p.id,
            name: p.name,
            slug: p.slug,
            description: p.description || '',
            short_description: p.short_description || '',
            price: Number(p.price) || 0,
            compare_at_price: p.compare_at_price ? Number(p.compare_at_price) : null,
            currency: p.currency || 'NGN',
            status: p.status || 'active',
            features: p.features || [],
            sku: p.sku || '',
            stock_quantity: Number(p.stock_quantity ?? 50),
            low_stock_threshold: Number(p.low_stock_threshold ?? 5),
            category_id: p.category_id || 'cat-18130',
            category_name: p.category_name || 'Feminine Care',
            subcategory: p.subcategory || null,
            images: formattedImages,
            is_featured: Boolean(p.is_featured),
            is_bestseller: Boolean(p.is_bestseller),
            is_new_arrival: Boolean(p.is_new_arrival),
            rating: Number(p.rating) || 5.0,
            rating_count: Number(p.rating_count) || 1,
            tags: Array.isArray(p.tags) ? p.tags : [],
            variants: p.variants || [],
            created_at: p.created_at || new Date().toISOString(),
            updated_at: p.updated_at || new Date().toISOString(),
          };

          productMap.set(p.id, dbProductFormatted);
        });
      }
    } catch (dbErr) {
      console.warn('Supabase products fetch skipped or schema pending:', dbErr);
    }

    // 2. Fallback to cmsStore / catalog ONLY if database query failed
    if (!hasDbProducts) {
      const storeProducts = cmsStore.getProducts();
      storeProducts.forEach(p => {
        if (!cmsStore.isProductDeleted(p.id) && (!p.slug || !cmsStore.isProductDeleted(p.slug))) {
          productMap.set(p.id, p);
        }
      });
    }

    const uniqueProducts = Array.from(productMap.values());

    return NextResponse.json({
      success: true,
      products: uniqueProducts,
      count: uniqueProducts.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawImages = body.images && body.images.length > 0 ? body.images : ['/images/logo.jpg'];
    const formattedImages = rawImages.map((img: any, idx: number) => {
      if (typeof img === 'string') {
        return {
          id: `img-${Date.now()}-${idx}`,
          product_id: body.id || '',
          url: img,
          alt_text: body.name || 'Product Image',
          display_order: idx + 1,
          is_primary: idx === 0,
        };
      }
      return img;
    });

    const baseSlug = generateProfessionalSlug(body.name || 'product');
    let cleanSlug = baseSlug;
    const existingProducts = cmsStore.getProducts();
    const isConflict = existingProducts.some(p => p.slug === cleanSlug && p.id !== body.id);
    if (isConflict) {
      cleanSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;
    }

    const product: Product = {
      id: body.id || `prod-${Date.now()}`,
      name: body.name,
      slug: cleanSlug,
      description: body.description || '',
      short_description: body.short_description || '',
      price: Number(body.price) || 0,
      compare_at_price: body.compare_at_price ? Number(body.compare_at_price) : null,
      currency: 'NGN',
      status: 'active',
      features: body.features || [],
      sku: body.sku || `TBH-${Math.floor(1000 + Math.random() * 9000)}`,
      stock_quantity: Number(body.stock_quantity) || 0,
      low_stock_threshold: Number(body.low_stock_threshold) || 10,
      category_id: body.category_id || 'cat-18130',
      category_name: body.category_name || 'Feminine Care',
      subcategory: body.subcategory || null,
      images: formattedImages,
      is_featured: Boolean(body.is_featured),
      is_bestseller: Boolean(body.is_bestseller),
      is_new_arrival: Boolean(body.is_new_arrival),
      rating: Number(body.rating) || 5.0,
      rating_count: Number(body.rating_count) || 1,
      tags: Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(',').map((t: string) => t.trim()) : []),
      variants: body.variants || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Attempt database insert/upsert in Supabase
    let supabaseSaved = false;
    try {
      const imageUrls = product.images.map((img: any) => (typeof img === 'string' ? img : img.url));

      const { data: dbProduct, error: dbError } = await supabaseAdmin
        .from('products')
        .upsert(
          {
            id: product.id,
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            price: product.price,
            compare_at_price: product.compare_at_price,
            currency: 'NGN',
            category_id: product.category_id,
            category_name: product.category_name,
            subcategory: product.subcategory,
            short_description: product.short_description,
            description: product.description,
            images: imageUrls,
            is_featured: product.is_featured,
            is_bestseller: product.is_bestseller,
            is_new_arrival: product.is_new_arrival,
            status: 'active',
            tags: product.tags,
            rating: product.rating,
            rating_count: product.rating_count,
            created_at: product.created_at,
            updated_at: product.updated_at,
          },
          { onConflict: 'id' }
        )
        .select()
        .single();

      if (dbError) {
        console.warn('Notice when saving to Supabase products table:', dbError.message);
      } else if (dbProduct) {
        supabaseSaved = true;

        // Upsert inventory record
        await supabaseAdmin.from('inventory').upsert(
          {
            product_id: product.id,
            stock_quantity: product.stock_quantity,
            low_stock_threshold: product.low_stock_threshold,
            sku: product.sku,
          },
          { onConflict: 'product_id' }
        );
      }
    } catch (err: any) {
      console.warn('Supabase write skipped (schema pending):', err?.message);
    }

    // 2. Always persist to store
    const saved = cmsStore.saveProduct(product);

    // 3. Revalidate Next.js cache so changes immediately appear across the storefront
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/products');
      revalidatePath('/shop');
      revalidatePath(`/products/${product.slug}`);
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({
      success: true,
      product: saved,
      savedToSupabase: supabaseSaved,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    const existing = cmsStore.getProductById(body.id);
    const updatedSlug = body.slug
      ? generateProfessionalSlug(body.slug)
      : (body.name ? generateProfessionalSlug(body.name) : existing?.slug || '');

    // Format images properly if provided
    let formattedImages = existing?.images || [];
    if (body.images && Array.isArray(body.images) && body.images.length > 0) {
      formattedImages = body.images.map((img: any, idx: number) => {
        if (typeof img === 'string') {
          return {
            id: `img-${body.id}-${idx}`,
            product_id: body.id,
            url: img,
            alt_text: body.name || existing?.name || 'Product Image',
            display_order: idx + 1,
            is_primary: idx === 0,
          };
        }
        return img;
      });
    }

    const updated: Product = {
      ...(existing || {} as Product),
      ...body,
      slug: updatedSlug || existing?.slug || generateProfessionalSlug(body.name || 'product'),
      price: Number(body.price),
      compare_at_price: body.compare_at_price ? Number(body.compare_at_price) : undefined,
      stock_quantity: Number(body.stock_quantity ?? existing?.stock_quantity ?? 0),
      low_stock_threshold: Number(body.low_stock_threshold ?? existing?.low_stock_threshold ?? 5),
      images: formattedImages,
      is_featured: body.is_featured !== undefined ? Boolean(body.is_featured) : (existing?.is_featured ?? false),
      is_bestseller: body.is_bestseller !== undefined ? Boolean(body.is_bestseller) : (existing?.is_bestseller ?? false),
      is_new_arrival: body.is_new_arrival !== undefined ? Boolean(body.is_new_arrival) : (existing?.is_new_arrival ?? false),
      tags: Array.isArray(body.tags) ? body.tags : (body.tags ? body.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : (existing?.tags || [])),
      updated_at: new Date().toISOString(),
    };

    const imageUrls = updated.images.map((img: any) => (typeof img === 'string' ? img : img.url));

    // Update in Supabase if table exists
    try {
      const { error: updateError } = await supabaseAdmin
        .from('products')
        .update({
          name: updated.name,
          slug: updated.slug,
          sku: updated.sku,
          price: updated.price,
          compare_at_price: updated.compare_at_price || null,
          category_id: updated.category_id,
          category_name: updated.category_name,
          subcategory: updated.subcategory || null,
          short_description: updated.short_description || null,
          description: updated.description || '',
          images: imageUrls,
          is_featured: updated.is_featured,
          is_bestseller: updated.is_bestseller,
          is_new_arrival: updated.is_new_arrival,
          status: updated.status || 'active',
          tags: updated.tags,
          rating: updated.rating,
          rating_count: updated.rating_count,
          features: updated.features || [],
          updated_at: updated.updated_at,
        })
        .eq('id', updated.id);

      if (updateError) {
        console.warn('Supabase update notice:', updateError.message);
      }

      // Also update inventory in Supabase
      await supabaseAdmin
        .from('inventory')
        .upsert({
          product_id: updated.id,
          stock_quantity: updated.stock_quantity,
          low_stock_threshold: updated.low_stock_threshold,
          sku: updated.sku,
        }, { onConflict: 'product_id' });
    } catch (err) {
      console.warn('Supabase update notice:', err);
    }

    const saved = cmsStore.saveProduct(updated);

    // Revalidate Next.js cache so storefront updates immediately
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/products');
      revalidatePath('/shop');
      revalidatePath(`/products/${updated.slug}`);
      if (existing?.slug && existing.slug !== updated.slug) {
        revalidatePath(`/products/${existing.slug}`);
      }
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({ success: true, product: saved });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID required' }, { status: 400 });
    }

    const existing = cmsStore.getProductById(id);
    const slug = existing?.slug;

    // 1. Delete associated child records from Supabase to prevent foreign key violations
    try {
      await supabaseAdmin.from('inventory').delete().eq('product_id', id);
    } catch (e) {
      console.warn('Notice removing inventory:', e);
    }

    try {
      await supabaseAdmin.from('product_images').delete().eq('product_id', id);
    } catch (e) {
      console.warn('Notice removing product_images:', e);
    }

    try {
      await supabaseAdmin.from('product_reviews').delete().eq('product_id', id);
    } catch (e) {
      console.warn('Notice removing product_reviews:', e);
    }

    // 2. Delete product from Supabase products table by primary ID (and slug if exists)
    try {
      const { error: dbError } = await supabaseAdmin
        .from('products')
        .delete()
        .or(`id.eq.${id}${slug ? `,slug.eq.${slug}` : ''}`);

      if (dbError) {
        console.error('Supabase delete product error:', dbError.message);
      }
    } catch (err) {
      console.warn('Supabase delete exception:', err);
    }

    // 3. Mark as deleted and purge from in-memory store
    cmsStore.deleteProduct(id);
    if (slug) {
      cmsStore.deleteProduct(slug);
    }

    // 4. Revalidate Next.js cache
    try {
      revalidatePath('/', 'layout');
      revalidatePath('/products');
      revalidatePath('/shop');
      if (slug) {
        revalidatePath(`/products/${slug}`);
      }
    } catch (revErr) {
      console.warn('Cache revalidation notice:', revErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted from database and store successfully',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
