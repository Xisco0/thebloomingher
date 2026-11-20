import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAuthCookieOptions } from './cookies';
import { getSiteUrl } from '@/lib/site-url';

const DEFAULT_SUPABASE_URL = 'https://xbhyafrdczdazuueibeu.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_znrQgeyTg5CdTygxT_JPzg_i06ON-jw';

export function createServerSupabaseClient(hostnameOrUrl?: string) {
  const cookieStore = cookies();
  const targetHost = hostnameOrUrl || getSiteUrl();
  const cookieOptions = getAuthCookieOptions(targetHost);

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    DEFAULT_SUPABASE_KEY;

  return createServerClient(supabaseUrl, supabaseKey, {
    cookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              ...(cookieOptions.domain ? { domain: cookieOptions.domain } : {}),
              secure: cookieOptions.secure,
              sameSite: cookieOptions.sameSite,
            });
          });
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
