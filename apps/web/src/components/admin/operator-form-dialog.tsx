'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import {
  getSession,
  usersApi,
  type CreateStaffUserPayload,
  type StaffUser,
  type UpdateStaffUserPayload,
} from '@/lib/api';
import { Button, Input, Select } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';

const ALL_STAFF_ROLES = ['ROOT', 'ADMIN', 'USER'] as const;
const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;

type FormState = {
  name: string;
  email: string;
  loginId: string;
  mobile: string;
  password: string;
  role: string;
  status: string;
};

const emptyForm = (): FormState => ({
  name: '',
  email: '',
  loginId: '',
  mobile: '',
  password: '',
  role: 'ADMIN',
  status: 'ACTIVE',
});

function userToForm(user: StaffUser): FormState {
  return {
    name: user.name,
    email: user.email,
    loginId: user.loginId ?? '',
    mobile: user.mobile ?? '',
    password: '',
    role: user.role,
    status: user.status,
  };
}

export function OperatorFormDialog({
  open,
  user,
  onClose,
  onSaved,
}: {
  open: boolean;
  user: StaffUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useI18n();
  const isEdit = Boolean(user);
  const session = getSession();
  const roleOptions = useMemo(() => {
    if (session?.role === 'ROOT') return ALL_STAFF_ROLES;
    return ['ADMIN', 'USER'] as const;
  }, [session?.role]);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(user ? userToForm(user) : { ...emptyForm(), role: session?.role === 'ROOT' ? 'ADMIN' : 'USER' });
    setError('');
  }, [open, user, session?.role]);

  if (!open) return null;

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isEdit && user) {
        const payload: UpdateStaffUserPayload = {
          name: form.name.trim(),
          email: form.email.trim(),
          loginId: form.loginId.trim() || undefined,
          mobile: form.mobile.trim() || undefined,
          role: form.role as StaffUser['role'],
          status: form.status,
        };
        if (form.password.trim()) {
          payload.password = form.password;
        }
        await usersApi.update(user.id, payload);
      } else {
        if (!form.password || form.password.length < 6) {
          setError(t('admin.operatorPasswordHint'));
          return;
        }

        const payload: CreateStaffUserPayload = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: form.role as StaffUser['role'],
          loginId: form.loginId.trim() || form.email.trim(),
          mobile: form.mobile.trim() || undefined,
          status: form.status,
        };
        await usersApi.create(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  const roleLocked = isEdit && user?.role === 'ROOT' && session?.role !== 'ROOT';

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="operator-form-title"
        className="relative z-10 flex max-h-[min(92vh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 id="operator-form-title" className="text-base font-semibold text-[var(--text-primary)]">
            {isEdit ? t('admin.editOperator') : t('admin.operatorRegister')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/[0.05]"
            aria-label={t('nav.closeMenu')}
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
            <Input
              label={t('admin.userName')}
              required
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
            />
            <Input
              label={t('checkout.email')}
              type="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
            <Input
              label={t('admin.loginId')}
              value={form.loginId}
              onChange={(e) => update('loginId', e.target.value)}
              placeholder={t('checkout.email')}
            />
            <Input
              label={t('checkout.mobile')}
              value={form.mobile}
              onChange={(e) => update('mobile', e.target.value)}
            />
            <Input
              label={isEdit ? t('admin.operatorPasswordOptional') : t('admin.operatorPassword')}
              type="password"
              required={!isEdit}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              placeholder={t('admin.operatorPasswordHint')}
            />
            <Select
              label={t('admin.userRole')}
              value={form.role}
              disabled={roleLocked}
              onChange={(e) => update('role', e.target.value)}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </Select>
            <Select
              label={t('orders.status')}
              value={form.status}
              onChange={(e) => update('status', e.target.value)}
            >
              {USER_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {t(`status.${status}`) !== `status.${status}` ? t(`status.${status}`) : status}
                </option>
              ))}
            </Select>
            {error && <p className="rounded-lg bg-[#fff0ef] px-3 py-2 text-sm text-[#ff3b30]">{error}</p>}
          </div>

          <div className="flex justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? t('common.loading') : t('common.save')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
