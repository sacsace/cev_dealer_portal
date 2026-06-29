import { resolveFileUrl, type Part } from '@/lib/api';

export function getPartImageUrl(part: Pick<Part, 'imageUrl' | 'images'>): string | null {
  const primary = part.images?.find((image) => image.isPrimary)?.url ?? part.images?.[0]?.url;
  const url = primary ?? part.imageUrl;
  return url ? resolveFileUrl(url) : null;
}
