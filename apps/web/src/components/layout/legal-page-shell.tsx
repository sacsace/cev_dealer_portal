'use client';

import Link from 'next/link';
import { LanguageSwitcher } from '@/components/ui';
import { CevLogo } from '@/components/brand/cev-logo';
import { LoginPageFooter } from '@/components/layout/login-footer';
import { LegalPageTabs } from '@/components/legal/legal-document';
import { useI18n } from '@/components/providers/i18n-provider';

export function LegalPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="login-page legal-page flex min-h-screen flex-col">
      <header className="login-header">
        <div className="flex items-center gap-4">
          <CevLogo href="/login" height={32} />
          <Link href="/login" className="text-[13px] font-medium text-[var(--accent)] hover:underline">
            ← {t('common.login')}
          </Link>
        </div>
        <LanguageSwitcher />
      </header>

      <main className="login-main legal-page-main">
        <div className="legal-page-content">
          <div className="legal-page-hero">
            <h1 className="legal-page-title">{title}</h1>
            {subtitle && <p className="legal-page-subtitle">{subtitle}</p>}
            <LegalPageTabs />
          </div>

          <div className="login-box legal-page-card">{children}</div>
        </div>
      </main>

      <LoginPageFooter />
    </div>
  );
}
