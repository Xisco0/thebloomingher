import { NextRequest, NextResponse } from 'next/server';
import { cmsStore } from '@/lib/cms-store';
import { Product } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const products = cmsStore.getProducts();
    return NextResponse.json({ success: true, products });
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

    const product: Product = {
      id: body.id || `prod-${Date.now()}`,
      name: body.name,
      slug: body.slug || body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
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
      category_id: body.category_id || 'cat-menstrual-care',
      category_name: body.category_name || 'Menstrual Care',
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

    const saved = cmsStore.saveProduct(product);
    return NextResponse.json({ success: true, product: saved });
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
    const updated: Product = {
      ...(existing || {} as Product),
      ...body,
      price: Number(body.price),
      compare_at_price: body.compare_at_price ? Number(body.compare_at_price) : undefined,
      stock_quantity: Number(body.stock_quantity),
      updated_at: new Date().toISOString(),
    };

    const saved = cmsStore.saveProduct(updated);
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

    cmsStore.deleteProduct(id);
    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
