'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { getSession, usersApi, type StaffUser } from '@/lib/api';
import { Button, DataTable, PageTitle, StatusBadge, useConfirmDialog } from '@/components/ui';
import { OperatorFormDialog } from '@/components/admin/operator-form-dialog';
import { AdminActionAlert, AdminTableDeleteButton } from '@/components/admin/admin-list-tools';
import { AdminPageBody, AdminSearchBar } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminUsersPage() {
  const { t } = useI18n();
  const { confirm, confirmDialog } = useConfirmDialog();
  const session = getSession();
  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<StaffUser | null>(null);
  const [actionError, setActionError] = useState('');

  const load = useCallback(async (q = search) => {
    setLoading(true);
    setActionError('');
    try {
      const params: Record<string, string> = { limit: '50' };
      if (q) params.search = q;
      const res = await usersApi.list(params);
      setStaff(res.data);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }, [search, t]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingUser(null);
    setDialogOpen(true);
  }

  function openEdit(user: StaffUser) {
    setEditingUser(user);
    setDialogOpen(true);
  }

  function canManageUser(user: StaffUser) {
    if (session?.role === 'ROOT') return true;
    return user.role !== 'ROOT';
  }

  async function handleDelete(user: StaffUser) {
    if (!canManageUser(user)) return;
    const ok = await confirm({ message: t('admin.deleteOperatorConfirm') });
    if (!ok) return;

    setActionError('');
    try {
      await usersApi.remove(user.id);
      await load();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('admin.operatorDeleteFailed'));
    }
  }

  return (
    <AdminPageBody>
      <div className="portal-page-header">
        <PageTitle title={t('admin.userMgmt')} subtitle={t('admin.userSubtitle')} />
        <Button onClick={openCreate}>{t('admin.operatorRegister')}</Button>
      </div>

      <AdminSearchBar
        onSearch={(q) => {
          setSearch(q);
          load(q);
        }}
      />

      {actionError ? <AdminActionAlert message={actionError} /> : null}

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : (
        <DataTable
          columns={[
            '#',
            t('admin.userName'),
            t('checkout.email'),
            t('admin.loginId'),
            t('admin.userRole'),
            t('orders.status'),
          ]}
          onRowClick={(index) => {
            const user = staff[index];
            if (user && canManageUser(user)) openEdit(user);
          }}
          rows={staff.map((user, i) => [
            i + 1,
            user.name,
            user.email,
            user.loginId ?? '—',
            user.role,
            <StatusBadge key={`${user.id}-status`} status={user.status} />,
          ])}
          actions={(index) => {
            const user = staff[index];
            if (!user || !canManageUser(user)) return null;

            return (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEdit(user)}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-secondary)] hover:bg-black/[0.05] hover:text-[var(--accent)]"
                  aria-label={t('common.edit')}
                >
                  <Pencil className="h-4 w-4" strokeWidth={1.75} />
                </button>
                <AdminTableDeleteButton
                  onClick={() => handleDelete(user)}
                  disabled={session?.id === user.id}
                />
              </div>
            );
          }}
        />
      )}

      <OperatorFormDialog
        open={dialogOpen}
        user={editingUser}
        onClose={() => setDialogOpen(false)}
        onSaved={() => load()}
      />
      {confirmDialog}
    </AdminPageBody>
  );
}
