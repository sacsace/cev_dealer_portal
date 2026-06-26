'use client';

import { useEffect, useState } from 'react';
import { authApi, refreshSession, type ApiUser } from '@/lib/api';
import { Button, Card, Input, PageTitle } from '@/components/ui';
import { AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminAccountPage() {
  const { t } = useI18n();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    refreshSession().then(setUser);
  }, []);

  const profileRows = [
    [t('account.name'), user?.name],
    [t('account.email'), user?.email],
    [t('account.role'), user?.role],
  ];

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError(t('account.passwordMismatch'));
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.changePassword(currentPassword, newPassword);
      setMessage(res.message || t('account.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.loginFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AdminPageBody>
      <PageTitle title={t('account.settings')} subtitle={t('account.settingsSubtitle')} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="!p-6">
          <h2 className="admin-section-label !mb-5 !mt-0 normal-case tracking-normal text-[var(--text-primary)]">
            {t('account.profile')}
          </h2>
          <dl className="space-y-4">
            {profileRows.map(([label, value]) => (
              <div
                key={String(label)}
                className="flex items-center justify-between gap-4 border-b border-[var(--border)] pb-4 last:border-0 last:pb-0"
              >
                <dt className="text-[13px] text-[var(--text-secondary)]">{label}</dt>
                <dd className="text-[13px] font-medium text-[var(--text-primary)]">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="!p-6">
          <h2 className="admin-section-label !mb-5 !mt-0 normal-case tracking-normal text-[var(--text-primary)]">
            {t('account.security')}
          </h2>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label={t('account.currentPassword')}
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              label={t('account.newPassword')}
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Input
              label={t('account.confirmPassword')}
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {error && <p className="text-[13px] text-[#ff3b30]">{error}</p>}
            {message && <p className="text-[13px] text-[#248a3d]">{message}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? t('common.loading') : t('account.savePassword')}
            </Button>
          </form>
        </Card>
      </div>
    </AdminPageBody>
  );
}
