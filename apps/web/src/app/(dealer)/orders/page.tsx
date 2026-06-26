'use client';

import { Suspense } from 'react';
import OrdersPageContent from './orders-content';

export default function OrdersPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <OrdersPageContent />
    </Suspense>
  );
}
