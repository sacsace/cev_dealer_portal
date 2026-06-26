'use client';

import { useEffect, useState } from 'react';
import { clearSession, refreshSession, type ApiUser } from '@/lib/api';
import { Button, Card, PageTitle } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AccountPage() {
  const { t } = useI18n();
  const [user, setUser] = useState<ApiUser | null>(null);
  const router = useRouter();

  useEffect(() => {
    refreshSession().then(setUser);
  }, []);

  function logout() {
    clearSession();
    router.push('/login');
  }

  const rows = [
    [t('account.name'), user?.name],
    [t('account.email'), user?.email],
    [t('account.role'), user?.role],
    ...(user?.dealer
      ? [
          [t('account.dealer'), user.dealer.dealerName],
          [t('account.dealerCode'), user.dealer.dealerCode],
        ]
      : []),
  ];

  return (
    <div>
      <PageTitle title={t('account.title')} />
      <Card className="max-w-lg">
        <div className="space-y-4">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between border-b border-[var(--border)] pb-3 last:border-0">
              <span className="text-[var(--text-secondary)]">{label}</span>
              <span className="font-medium">{value}</span>
            </div>
          ))}
        </div>
        <Button variant="danger" className="mt-6" onClick={logout}>{t('common.logout')}</Button>
      </Card>
    </div>
  );
}
