/**
 * Resolves media URLs: returns full Cloudinary / external URLs as-is,
 * and prepends VITE_API_URL for relative backend /media/ paths.
 */
export function getMediaUrl(url, fallback = '') {
  if (!url) return fallback;
  if (
    url.startsWith('http://') ||
    url.startsWith('https://') ||
    url.startsWith('blob:') ||
    url.startsWith('data:')
  ) {
    return url;
  }
  const apiBase = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
  if (url.startsWith('/media/')) {
    return apiBase ? `${apiBase}${url}` : url;
  }
  return url;
}
