export const SITE_URL = 'https://www.thebloomingher.com';

export function getSiteUrl(): string {
  let url = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (url) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    url = url.replace(/\/$/, '');
    if (url === 'https://thebloomingher.com') {
      return SITE_URL;
    }
    return url;
  }
  return SITE_URL;
}

