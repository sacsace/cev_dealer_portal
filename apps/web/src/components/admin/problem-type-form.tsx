'use client';

import { problemTypesApi, type ProblemType } from '@/lib/api';
import { LookupTypeForm } from '@/components/admin/lookup-type-form';

export function ProblemTypeForm({
  item,
  onSaved,
  onCancel,
}: {
  item?: ProblemType | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  return (
    <LookupTypeForm
      item={item}
      api={problemTypesApi}
      labels={{
        name: 'admin.problemTypeName',
        nameEn: 'admin.problemTypeNameEn',
        namePlaceholder: 'admin.problemTypeNamePlaceholder',
        nameEnPlaceholder: 'admin.problemTypeNameEnPlaceholder',
      }}
      onSaved={onSaved}
      onCancel={onCancel}
    />
  );
}
