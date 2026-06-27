'use client';

import { useEffect, useState } from 'react';
import {
  dealersApi,
  usersApi,
  type CreateDealerPayload,
  type Dealer,
  type StaffUser,
  type UpdateDealerPayload,
} from '@/lib/api';
import { Button, Input, Select } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';

const DEALER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;

type FormState = {
  dealerName: string;
  dealerCode: string;
  email: string;
  password: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  gstNumber: string;
  contactUserId: string;
  loginId: string;
  status: string;
};

const emptyForm = (): FormState => ({
  dealerName: '',
  dealerCode: '',
  email: '',
  password: '',
  mobile: '',
  address: '',
  city: '',
  state: '',
  gstNumber: '',
  contactUserId: '',
  loginId: '',
  status: 'ACTIVE',
});

function dealerToForm(dealer: Dealer): FormState {
  return {
    dealerName: dealer.dealerName,
    dealerCode: dealer.dealerCode,
    email: dealer.email,
    password: '',
    mobile: dealer.mobile ?? '',
    address: dealer.address ?? '',
    city: dealer.city ?? '',
    state: dealer.state ?? '',
    gstNumber: dealer.gstNumber ?? '',
    contactUserId: dealer.contactUserId ?? dealer.contactUser?.id ?? '',
    loginId: dealer.loginId ?? dealer.dealerCode,
    status: dealer.status,
  };
}

export function DealerForm({
  dealer,
  onSaved,
  onCancel,
}: {
  dealer?: Dealer | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { t } = useI18n();
  const isEdit = Boolean(dealer);
  const [form, setForm] = useState<FormState>(dealer ? dealerToForm(dealer) : emptyForm());
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    usersApi
      .list({ limit: '100' })
      .then((res) => setStaffUsers(res.data.filter((user) => user.status === 'ACTIVE')))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (dealer) {
      setForm(dealerToForm(dealer));
      setError('');
      return;
    }

    setForm(emptyForm());
    setError('');

    dealersApi
      .nextCode()
      .then(({ dealerCode }) => {
        setForm((prev) => ({
          ...prev,
          dealerCode,
          loginId: dealerCode,
        }));
      })
      .catch(() => {});
  }, [dealer]);

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const loginId = form.loginId.trim();

      if (isEdit && dealer) {
        const payload: UpdateDealerPayload = {
          dealerName: form.dealerName.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim() || undefined,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          gstNumber: form.gstNumber.trim() || undefined,
          contactUserId: form.contactUserId || undefined,
          loginId: loginId || dealer.dealerCode,
          status: form.status,
        };

        if (form.password) {
          if (form.password.length < 6) {
            setError(t('admin.dealerPasswordHint'));
            return;
          }
          payload.password = form.password;
        }

        await dealersApi.update(dealer.id, payload);
      } else {
        if (!form.password || form.password.length < 6) {
          setError(t('admin.dealerPasswordHint'));
          return;
        }

        const payload: CreateDealerPayload = {
          dealerName: form.dealerName.trim(),
          email: form.email.trim(),
          password: form.password,
          mobile: form.mobile.trim() || undefined,
          address: form.address.trim() || undefined,
          city: form.city.trim() || undefined,
          state: form.state.trim() || undefined,
          gstNumber: form.gstNumber.trim() || undefined,
          contactUserId: form.contactUserId || undefined,
          loginId: loginId || undefined,
          status: form.status,
        };
        await dealersApi.create(payload);
      }

      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t('checkout.dealerName')}
        required
        value={form.dealerName}
        onChange={(e) => update('dealerName', e.target.value)}
      />
      <Input
        label={t('checkout.dealerCode')}
        required={!isEdit}
        value={form.dealerCode}
        disabled
        readOnly
        placeholder={isEdit ? undefined : t('common.loading')}
      />
      {!isEdit && (
        <p className="-mt-2 text-[12px] text-[var(--text-tertiary)]">{t('admin.dealerCodeAuto')}</p>
      )}
      <Input
        label={t('checkout.email')}
        type="email"
        required
        value={form.email}
        onChange={(e) => update('email', e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('admin.loginId')}
          required
          value={form.loginId}
          onChange={(e) => update('loginId', e.target.value)}
          placeholder={t('checkout.dealerCode')}
        />
        <Input
          label={isEdit ? t('admin.dealerPasswordOptional') : t('admin.dealerPassword')}
          type="password"
          required={!isEdit}
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          placeholder={t('admin.dealerPasswordHint')}
        />
      </div>
      <Input
        label={t('checkout.mobile')}
        value={form.mobile}
        onChange={(e) => update('mobile', e.target.value)}
      />
      <Select
        label={t('checkout.contactPerson')}
        value={form.contactUserId}
        onChange={(e) => update('contactUserId', e.target.value)}
      >
        <option value="">{t('admin.selectContactUser')}</option>
        {staffUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name} ({user.email})
          </option>
        ))}
      </Select>
      <Input
        label={t('admin.address')}
        value={form.address}
        onChange={(e) => update('address', e.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t('admin.city')} value={form.city} onChange={(e) => update('city', e.target.value)} />
        <Input label={t('admin.state')} value={form.state} onChange={(e) => update('state', e.target.value)} />
      </div>
      <Input
        label={t('parts.gst')}
        value={form.gstNumber}
        onChange={(e) => update('gstNumber', e.target.value)}
      />
      <Select label={t('orders.status')} value={form.status} onChange={(e) => update('status', e.target.value)}>
        {DEALER_STATUSES.map((status) => (
          <option key={status} value={status}>
            {t(`status.${status}`) !== `status.${status}` ? t(`status.${status}`) : status}
          </option>
        ))}
      </Select>

      {error && <p className="portal-alert portal-alert--error">{error}</p>}

      <div className="flex justify-end gap-2 border-t border-[var(--border)] pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? t('common.loading') : t('common.save')}
        </Button>
      </div>
    </form>
  );
}
