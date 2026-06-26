'use client';

import { Suspense } from 'react';
import PartsPageContent from './parts-content';

export default function PartsPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <PartsPageContent />
    </Suspense>
  );
}
