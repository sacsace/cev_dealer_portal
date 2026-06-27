'use client';

import Link from 'next/link';
import { useI18n } from '@/components/providers/i18n-provider';

export const MSV_SOFTWARE_URL = 'https://www.msventures.in/software';
export const CEV_WEBSITE_URL = 'https://www.cev-india.com/';

export function CompanyCopyright({
  className,
  linkClassName,
}: {
  className?: string;
  linkClassName?: string;
}) {
  const { t } = useI18n();

  return (
    <p className={className}>
      {t('footer.copyrightPrefix')}
      <a
        href={CEV_WEBSITE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName ?? 'login-company-link'}
      >
        {t('footer.companyLegalName')}
      </a>
      {t('footer.copyrightSuffix')}
    </p>
  );
}

export function DeveloperCredit({
  className,
  linkClassName,
}: {
  className?: string;
  linkClassName?: string;
}) {
  const { t } = useI18n();

  return (
    <p className={className}>
      {t('footer.developedByPrefix')}
      <a
        href={MSV_SOFTWARE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={linkClassName ?? 'login-developer-link'}
      >
        {t('footer.developerName')}
      </a>
    </p>
  );
}

export function LoginLegalLinks({
  className,
  variant = 'light',
}: {
  className?: string;
  variant?: 'light' | 'dark';
}) {
  const { t } = useI18n();

  const links = [
    { href: '/terms', label: t('legal.terms') },
    { href: '/privacy', label: t('legal.privacy') },
    { href: '/support', label: t('legal.customerCenter') },
  ];

  const linkClass =
    variant === 'dark'
      ? 'text-white/55 transition-colors hover:text-[var(--cev-green)]'
      : 'text-[var(--text-tertiary)] transition-colors hover:text-[var(--accent)]';

  return (
    <nav className={className} aria-label="Legal">
      <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className={linkClass}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function LoginPageFooter() {
  return (
    <footer className="login-footer">
      <LoginLegalLinks variant="dark" className="login-footer-links" />
      <CompanyCopyright className="login-footer-copy" />
      <DeveloperCredit />
    </footer>
  );
}
