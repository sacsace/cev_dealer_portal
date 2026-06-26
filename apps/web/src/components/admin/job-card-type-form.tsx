'use client';

import { jobCardTypesApi, type JobCardType } from '@/lib/api';
import { LookupTypeForm } from '@/components/admin/lookup-type-form';

export function JobCardTypeForm({
  item,
  onSaved,
  onCancel,
}: {
  item?: JobCardType | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  return (
    <LookupTypeForm
      item={item}
      api={jobCardTypesApi}
      labels={{
        name: 'admin.jobCardTypeName',
        nameEn: 'admin.jobCardTypeNameEn',
        namePlaceholder: 'admin.jobCardTypeNamePlaceholder',
        nameEnPlaceholder: 'admin.jobCardTypeNameEnPlaceholder',
      }}
      onSaved={onSaved}
      onCancel={onCancel}
    />
  );
}
