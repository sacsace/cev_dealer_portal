'use client';

import { Trash2 } from 'lucide-react';
import { Alert, Button, IconButton } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';

export function AdminBulkSelectionBar({
  count,
  deleting,
  onDelete,
}: {
  count: number;
  deleting: boolean;
  onDelete: () => void;
}) {
  const { t } = useI18n();

  if (count <= 0) return null;

  return (
    <div className="portal-bulk-bar">
      <span className="portal-bulk-bar__label">
        {t('admin.selectedCount').replace('{count}', String(count))}
      </span>
      <Button variant="danger" disabled={deleting} onClick={onDelete}>
        {deleting ? t('common.loading') : t('admin.deleteSelected')}
      </Button>
    </div>
  );
}

export function AdminActionAlert({ message }: { message: string }) {
  return <Alert className="mb-4">{message}</Alert>;
}

export function AdminTableDeleteButton({
  onClick,
  disabled,
  stopPropagation = false,
}: {
  onClick: () => void;
  disabled?: boolean;
  stopPropagation?: boolean;
}) {
  const { t } = useI18n();

  return (
    <IconButton
      danger
      onClick={(event) => {
        if (stopPropagation) event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      aria-label={t('common.delete')}
    >
      <Trash2 className="h-4 w-4" strokeWidth={1.75} />
    </IconButton>
  );
}
