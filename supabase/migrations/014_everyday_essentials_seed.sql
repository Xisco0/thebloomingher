-- ==============================================================================
-- TheBloomingHer Care & Wellness — Everyday Essentials Schema & Cleanup Migration
-- ==============================================================================

-- 1. Ensure 'Everyday Essentials' category exists in public.categories
INSERT INTO public.categories (id, name, slug, description, image_url, display_order, is_active, seo_title, seo_description)
VALUES (
    'cat-18133',
    'Everyday Essentials',
    'everyday-essentials',
    'Thoughtfully curated lifestyle and everyday essentials for your daily comfort, convenience, and health.',
    'https://res.cloudinary.com/dld8u8zjg/image/upload/v1789430840/ob27rq0ecfcar6epsbqt.jpg',
    3,
    true,
    'Everyday Essentials Products in Lagos & Nigeria | TheBloomingHer',
    'Shop authentic everyday lifestyle essentials in Lagos & across Nigeria. Stainless coffee mugs, water bottles, wristwatches, tote bags, phone accessories & more.'
)
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    image_url = EXCLUDED.image_url,
    seo_title = EXCLUDED.seo_title,
    seo_description = EXCLUDED.seo_description,
    updated_at = NOW();

-- 2. Delete any sample/dummy products under Everyday Essentials category to start empty
DELETE FROM public.inventory 
WHERE product_id IN (
    SELECT id FROM public.products 
    WHERE category_id = 'cat-18133' 
       OR category_id = 'everyday-essentials' 
       OR LOWER(category_name) = 'everyday essentials'
);

DELETE FROM public.product_images 
WHERE product_id IN (
    SELECT id FROM public.products 
    WHERE category_id = 'cat-18133' 
       OR category_id = 'everyday-essentials' 
       OR LOWER(category_name) = 'everyday essentials'
);

DELETE FROM public.products 
WHERE category_id = 'cat-18133' 
   OR category_id = 'everyday-essentials' 
   OR LOWER(category_name) = 'everyday essentials';
