export const SITE_URL = 'https://thebloomingher.vercel.app';

export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim() !== '' && process.env.NEXT_PUBLIC_SITE_URL !== 'http://localhost:3000') {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  return SITE_URL;
}
