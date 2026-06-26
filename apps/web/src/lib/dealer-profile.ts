import type { ApiUser } from '@/lib/api';

export function formatDealerAddress(
  dealer?: {
    address?: string | null;
    city?: string | null;
    state?: string | null;
  } | null,
): string {
  if (!dealer) return '';
  return [dealer.address, dealer.city, dealer.state].filter(Boolean).join(', ');
}

export function getDealerJobCardDefaults(user: ApiUser | null) {
  if (!user) {
    return {
      customerName: '',
      mobile: '',
      customerAddress: '',
      place: '',
    };
  }

  const dealer = user.dealer;
  const mobile = (user.mobile ?? dealer?.mobile ?? '').replace(/\D/g, '').slice(0, 10);

  return {
    customerName: dealer?.dealerName?.trim() || user.name.trim(),
    mobile,
    customerAddress: formatDealerAddress(dealer),
    place: dealer?.city?.trim() || dealer?.state?.trim() || '',
  };
}
