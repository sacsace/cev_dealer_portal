'use client';

import Link from 'next/link';
import { PageTitle, Card, LanguageSwitcher } from '@/components/ui';
import { CevLogo } from '@/components/brand/cev-logo';
import { LoginPageFooter } from '@/components/layout/login-footer';
import { useI18n } from '@/components/providers/i18n-provider';

export function PublicPageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="login-page flex min-h-screen flex-col">
      <header className="login-header">
        <div className="flex items-center gap-4">
          <CevLogo href="/login" height={32} />
          <Link
            href="/login"
            className="shrink-0 whitespace-nowrap text-[13px] font-medium text-[var(--accent)] hover:underline"
          >
            ← {t('common.login')}
          </Link>
        </div>
        <LanguageSwitcher />
      </header>
      <main className="login-main">
        <div className="login-content">
          <PageTitle title={title} />
          <Card className="login-box !p-6">{children}</Card>
        </div>
      </main>
      <LoginPageFooter />
    </div>
  );
}
