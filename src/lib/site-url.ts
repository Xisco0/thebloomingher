export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL !== 'http://localhost:3000') {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    const url = process.env.NEXT_PUBLIC_VERCEL_URL.replace(/\/$/, '');
    return url.startsWith('http') ? url : `https://${url}`;
  }
  if (process.env.VERCEL_URL) {
    const url = process.env.VERCEL_URL.replace(/\/$/, '');
    return url.startsWith('http') ? url : `https://${url}`;
  }
  return 'https://thebloomingher.vercel.app';
}
