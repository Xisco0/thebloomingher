export const SITE_URL = 'https://thebloomingher.com';

export function getSiteUrl(): string {
  let url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url.replace(/\/$/, '');
  }
  return SITE_URL;
}
