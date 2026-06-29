'use client';

import { useCallback, useEffect, useState } from 'react';
import { settingsApi, type UpdateMailSettingsPayload } from '@/lib/api';
import {
  detectMailProvider,
  mailProviderPreset,
  type MailProvider,
} from '@/lib/mail-providers';
import { Button, Card, Input, Select, useAlertDialog } from '@/components/ui';
import { AdminActionAlert } from '@/components/admin/admin-list-tools';
import { useI18n } from '@/components/providers/i18n-provider';

const MASKED_PASSWORD = '********';

export default function AdminSettingsMailPage() {
  const { t } = useI18n();
  const { alert, alertDialog } = useAlertDialog();

  const [mailProvider, setMailProvider] = useState<MailProvider>('custom');
  const [mailForm, setMailForm] = useState<UpdateMailSettingsPayload>({
    enabled: false,
    from: '',
    fromName: '',
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPassword: '',
  });
  const [passwordSet, setPasswordSet] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [loadingMail, setLoadingMail] = useState(true);
  const [savingMail, setSavingMail] = useState(false);
  const [testingMail, setTestingMail] = useState(false);
  const [actionError, setActionError] = useState('');
  const [message, setMessage] = useState('');

  const loadMail = useCallback(async () => {
    setLoadingMail(true);
    try {
      const data = await settingsApi.getMail();
      setMailProvider(detectMailProvider(data.smtpHost));
      setMailForm({
        enabled: data.enabled,
        from: data.from,
        fromName: data.fromName,
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort,
        smtpSecure: data.smtpSecure,
        smtpUser: data.smtpUser,
        smtpPassword: data.smtpPasswordSet ? MASKED_PASSWORD : '',
      });
      setPasswordSet(data.smtpPasswordSet);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoadingMail(false);
    }
  }, [t]);

  useEffect(() => {
    loadMail();
  }, [loadMail]);

  function updateMailField<K extends keyof UpdateMailSettingsPayload>(
    key: K,
    value: UpdateMailSettingsPayload[K],
  ) {
    setMailForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleProviderChange(provider: MailProvider) {
    setMailProvider(provider);
    const preset = mailProviderPreset(provider);
    if (preset) {
      setMailForm((prev) => ({ ...prev, ...preset }));
    }
  }

  async function handleSaveMail(e: React.FormEvent) {
    e.preventDefault();
    setSavingMail(true);
    setActionError('');
    setMessage('');
    try {
      const payload: UpdateMailSettingsPayload = { ...mailForm };
      if (payload.smtpPassword === MASKED_PASSWORD) {
        delete payload.smtpPassword;
      }
      const updated = await settingsApi.updateMail(payload);
      setMailProvider(detectMailProvider(updated.smtpHost));
      setMailForm((prev) => ({
        ...prev,
        ...updated,
        smtpPassword: updated.smtpPasswordSet ? MASKED_PASSWORD : '',
      }));
      setPasswordSet(updated.smtpPasswordSet);
      setMessage(t('admin.settingsMailSaved'));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setSavingMail(false);
    }
  }

  async function handleTestMail() {
    if (!testEmail.trim()) {
      await alert({ message: t('admin.settingsTestEmailRequired'), variant: 'info' });
      return;
    }
    setTestingMail(true);
    setActionError('');
    try {
      await settingsApi.testMail(testEmail.trim());
      await alert({ message: t('admin.settingsTestMailSent'), variant: 'success' });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setTestingMail(false);
    }
  }

  const isGmail = mailProvider === 'gmail';

  return (
    <>
      {alertDialog}
      {actionError ? <AdminActionAlert message={actionError} /> : null}
      {message ? (
        <p className="portal-alert portal-alert--success portal-alert--inline mb-4">{message}</p>
      ) : null}

      <Card className="!p-6">
        <h2 className="mb-1 text-base font-semibold text-[var(--text-primary)]">
          {t('admin.settingsMailTitle')}
        </h2>
        <p className="mb-5 text-[13px] text-[var(--text-secondary)]">
          {t('admin.settingsMailDescription')}
        </p>

        {loadingMail ? (
          <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
        ) : (
          <form onSubmit={handleSaveMail} className="space-y-4">
            <Select
              label={t('admin.settingsMailProvider')}
              value={mailProvider}
              onChange={(e) => handleProviderChange(e.target.value as MailProvider)}
            >
              <option value="custom">{t('admin.settingsMailProviderCustom')}</option>
              <option value="gmail">{t('admin.settingsMailProviderGmail')}</option>
            </Select>

            {isGmail ? (
              <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-secondary)] px-3 py-2 text-[13px] text-[var(--text-secondary)]">
                {t('admin.settingsGmailHint')}
              </p>
            ) : null}

            <label className="flex items-center gap-2 text-[13px] text-[var(--text-primary)]">
              <input
                type="checkbox"
                checked={Boolean(mailForm.enabled)}
                onChange={(e) => updateMailField('enabled', e.target.checked)}
                className="h-4 w-4 accent-[var(--cev-green)]"
              />
              {t('admin.settingsMailEnabled')}
            </label>

            <Input
              label={t('admin.settingsMailFrom')}
              type="email"
              value={mailForm.from ?? ''}
              onChange={(e) => updateMailField('from', e.target.value)}
            />
            <Input
              label={t('admin.settingsMailFromName')}
              value={mailForm.fromName ?? ''}
              onChange={(e) => updateMailField('fromName', e.target.value)}
            />
            <Input
              label={t('admin.settingsSmtpHost')}
              value={mailForm.smtpHost ?? ''}
              readOnly={isGmail}
              onChange={(e) => updateMailField('smtpHost', e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label={t('admin.settingsSmtpPort')}
                type="number"
                value={String(mailForm.smtpPort ?? 587)}
                readOnly={isGmail}
                onChange={(e) => updateMailField('smtpPort', Number(e.target.value))}
              />
              <label className="flex items-end gap-2 pb-2 text-[13px] text-[var(--text-primary)]">
                <input
                  type="checkbox"
                  checked={Boolean(mailForm.smtpSecure)}
                  disabled={isGmail}
                  onChange={(e) => updateMailField('smtpSecure', e.target.checked)}
                  className="h-4 w-4 accent-[var(--cev-green)]"
                />
                {t('admin.settingsSmtpSecure')}
              </label>
            </div>
            <Input
              label={t('admin.settingsSmtpUser')}
              value={mailForm.smtpUser ?? ''}
              placeholder={isGmail ? t('admin.settingsGmailUserPlaceholder') : undefined}
              onChange={(e) => updateMailField('smtpUser', e.target.value)}
            />
            <Input
              label={t('admin.settingsSmtpPassword')}
              type="password"
              value={mailForm.smtpPassword ?? ''}
              placeholder={passwordSet ? MASKED_PASSWORD : isGmail ? t('admin.settingsGmailPasswordPlaceholder') : ''}
              onChange={(e) => updateMailField('smtpPassword', e.target.value)}
            />

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="submit" disabled={savingMail}>
                {savingMail ? t('common.loading') : t('common.save')}
              </Button>
            </div>

            <div className="border-t border-[var(--border)] pt-4">
              <p className="mb-2 text-[13px] font-medium text-[var(--text-primary)]">
                {t('admin.settingsTestMail')}
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <Input
                  label={t('checkout.email')}
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="min-w-[220px] flex-1"
                />
                <Button type="button" variant="outline" disabled={testingMail} onClick={handleTestMail}>
                  {testingMail ? t('common.loading') : t('admin.settingsSendTest')}
                </Button>
              </div>
            </div>
          </form>
        )}
      </Card>
    </>
  );
}
