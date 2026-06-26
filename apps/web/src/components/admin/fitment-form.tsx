'use client';

import { fitmentsApi, type Fitment } from '@/lib/api';
import { LookupTypeForm } from '@/components/admin/lookup-type-form';

export function FitmentForm({
  item,
  onSaved,
  onCancel,
}: {
  item?: Fitment | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  return (
    <LookupTypeForm
      item={item}
      api={fitmentsApi}
      labels={{
        name: 'admin.fitmentName',
        nameEn: 'admin.fitmentNameEn',
        namePlaceholder: 'admin.fitmentNamePlaceholder',
        nameEnPlaceholder: 'admin.fitmentNameEnPlaceholder',
      }}
      onSaved={onSaved}
      onCancel={onCancel}
    />
  );
}
