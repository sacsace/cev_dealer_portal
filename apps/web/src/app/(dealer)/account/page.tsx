'use client';

import { useEffect, useState } from 'react';
import { authApi, clearSession, refreshSession, updateSessionUser, type ApiUser } from '@/lib/api';
import { Button, Card, Input, PageTitle } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AccountPage() {
  const { t } = useI18n();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', mobile: '' });
  const [companyForm, setCompanyForm] = useState({
    dealerName: '',
    email: '',
    mobile: '',
    address: '',
    city: '',
    state: '',
    gstNumber: '',
    contactPerson: '',
  });
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [companyMessage, setCompanyMessage] = useState('');
  const [companyError, setCompanyError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    refreshSession().then((sessionUser) => {
      setUser(sessionUser);
      if (!sessionUser) return;
      setProfileForm({
        name: sessionUser.name ?? '',
        email: sessionUser.email ?? '',
        mobile: sessionUser.mobile ?? '',
      });
      if (sessionUser.dealer) {
        setCompanyForm({
          dealerName: sessionUser.dealer.dealerName ?? '',
          email: sessionUser.dealer.email ?? '',
          mobile: sessionUser.dealer.mobile ?? '',
          address: sessionUser.dealer.address ?? '',
          city: sessionUser.dealer.city ?? '',
          state: sessionUser.dealer.state ?? '',
          gstNumber: sessionUser.dealer.gstNumber ?? '',
          contactPerson: sessionUser.dealer.contactPerson ?? '',
        });
      }
    });
  }, []);

  function logout() {
    clearSession();
    router.push('/login');
  }

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileError('');
    setProfileMessage('');
    setProfileLoading(true);
    try {
      const updated = await authApi.updateProfile(profileForm);
      setUser(updated);
      updateSessionUser(updated);
      setProfileMessage(t('account.profileSaved'));
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : t('common.loginFailed'));
    } finally {
      setProfileLoading(false);
    }
  }

  async function handleCompanySubmit(e: React.FormEvent) {
    e.preventDefault();
    setCompanyError('');
    setCompanyMessage('');
    setCompanyLoading(true);
    try {
      const updated = await authApi.updateDealerProfile(companyForm);
      setUser(updated);
      updateSessionUser(updated);
      setProfileForm({
        name: updated.name ?? '',
        email: updated.email ?? '',
        mobile: updated.mobile ?? '',
      });
      if (updated.dealer) {
        setCompanyForm({
          dealerName: updated.dealer.dealerName ?? '',
          email: updated.dealer.email ?? '',
          mobile: updated.dealer.mobile ?? '',
          address: updated.dealer.address ?? '',
          city: updated.dealer.city ?? '',
          state: updated.dealer.state ?? '',
          gstNumber: updated.dealer.gstNumber ?? '',
          contactPerson: updated.dealer.contactPerson ?? '',
        });
      }
      setCompanyMessage(t('account.companySaved'));
    } catch (err) {
      setCompanyError(err instanceof Error ? err.message : t('common.loginFailed'));
    } finally {
      setCompanyLoading(false);
    }
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordError(t('account.passwordMismatch'));
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await authApi.changePassword(currentPassword, newPassword);
      setPasswordMessage(res.message || t('account.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : t('common.loginFailed'));
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div>
      <PageTitle title={t('account.settings')} subtitle={t('account.settingsSubtitle')} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="!p-6">
          <h2 className="mb-5 text-base font-semibold text-[var(--text-primary)]">{t('account.profile')}</h2>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Input
              label={t('account.name')}
              required
              value={profileForm.name}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              label={t('account.email')}
              type="email"
              required
              value={profileForm.email}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <Input
              label={t('account.mobile')}
              value={profileForm.mobile}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, mobile: e.target.value }))}
              placeholder="9876543210"
            />
            {user?.dealer && (
              <p className="text-[13px] text-[var(--text-secondary)]">
                {t('account.dealerCode')}: {user.dealer.dealerCode}
              </p>
            )}
            {profileError && <p className="portal-alert portal-alert--error portal-alert--inline">{profileError}</p>}
            {profileMessage && <p className="text-[13px] text-[#248a3d]">{profileMessage}</p>}
            <Button type="submit" disabled={profileLoading}>
              {profileLoading ? t('common.loading') : t('account.saveProfile')}
            </Button>
          </form>
        </Card>

        {user?.dealer && (
          <Card className="!p-6">
            <h2 className="mb-5 text-base font-semibold text-[var(--text-primary)]">{t('account.company')}</h2>
            <form onSubmit={handleCompanySubmit} className="space-y-4">
              <Input
                label={t('account.companyName')}
                required
                value={companyForm.dealerName}
                onChange={(e) => setCompanyForm((prev) => ({ ...prev, dealerName: e.target.value }))}
              />
              <Input
                label={t('account.email')}
                type="email"
                required
                value={companyForm.email}
                onChange={(e) => setCompanyForm((prev) => ({ ...prev, email: e.target.value }))}
              />
              <Input
                label={t('account.mobile')}
                value={companyForm.mobile}
                onChange={(e) => setCompanyForm((prev) => ({ ...prev, mobile: e.target.value }))}
              />
              <Input
                label={t('account.contactPerson')}
                value={companyForm.contactPerson}
                onChange={(e) => setCompanyForm((prev) => ({ ...prev, contactPerson: e.target.value }))}
              />
              <Input
                label={t('account.address')}
                value={companyForm.address}
                onChange={(e) => setCompanyForm((prev) => ({ ...prev, address: e.target.value }))}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label={t('account.city')}
                  value={companyForm.city}
                  onChange={(e) => setCompanyForm((prev) => ({ ...prev, city: e.target.value }))}
                />
                <Input
                  label={t('account.state')}
                  value={companyForm.state}
                  onChange={(e) => setCompanyForm((prev) => ({ ...prev, state: e.target.value }))}
                />
              </div>
              <Input
                label={t('account.gstNumber')}
                value={companyForm.gstNumber}
                onChange={(e) => setCompanyForm((prev) => ({ ...prev, gstNumber: e.target.value }))}
              />
              {companyError && <p className="portal-alert portal-alert--error portal-alert--inline">{companyError}</p>}
              {companyMessage && <p className="text-[13px] text-[#248a3d]">{companyMessage}</p>}
              <Button type="submit" disabled={companyLoading}>
                {companyLoading ? t('common.loading') : t('account.saveCompany')}
              </Button>
            </form>
          </Card>
        )}

        <Card className="!p-6 lg:col-span-2">
          <h2 className="mb-5 text-base font-semibold text-[var(--text-primary)]">{t('account.security')}</h2>
          <form onSubmit={handlePasswordSubmit} className="grid max-w-xl gap-4">
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
            {passwordError && <p className="portal-alert portal-alert--error portal-alert--inline">{passwordError}</p>}
            {passwordMessage && <p className="text-[13px] text-[#248a3d]">{passwordMessage}</p>}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? t('common.loading') : t('account.savePassword')}
              </Button>
              <Button type="button" variant="danger" onClick={logout}>
                {t('common.logout')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
