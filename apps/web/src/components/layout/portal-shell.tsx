'use client';

import Link from 'next/link';
import { ChevronRight, LogOut, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export function PortalHeaderIconButton({
  onClick,
  ariaLabel,
  children,
  className,
}: {
  onClick: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.05]',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PortalSidebarAccountLink({
  href,
  name,
  subtitle,
  onNavigate,
}: {
  href: string;
  name: string;
  subtitle: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="border-t border-[var(--border)] p-3">
      <Link
        href={href}
        onClick={onNavigate}
        className="flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-black/[0.04]"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(140,198,63,0.1)] text-[var(--cev-green)]">
          <User className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium">{name}</span>
          <span className="block truncate text-[11px] text-[var(--text-tertiary)]">{subtitle}</span>
        </span>
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]" />
      </Link>
    </div>
  );
}

export function PortalMobileUserCard({
  name,
  subtitle,
}: {
  name: string;
  subtitle: string;
}) {
  return (
    <div className="border-b border-[var(--border)] p-4">
      <div className="flex items-center gap-3 rounded-xl p-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(140,198,63,0.1)] text-[var(--cev-green)]">
          <User className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13px] font-medium">{name}</span>
          <span className="block truncate text-[11px] text-[var(--text-tertiary)]">{subtitle}</span>
        </span>
      </div>
    </div>
  );
}

export function PortalLogoutButton({ onClick }: { onClick: () => void | Promise<void> }) {
  const { t } = useI18n();

  return (
    <button type="button" onClick={() => void onClick()} className="portal-logout-btn">
      <LogOut className="h-4 w-4" />
      {t('common.logout')}
    </button>
  );
}

export function PortalMobileDrawer({
  open,
  onClose,
  logo,
  userSection,
  children,
  footer,
  drawerClassName,
  footerClassName,
}: {
  open: boolean;
  onClose: () => void;
  logo: React.ReactNode;
  userSection?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  drawerClassName?: string;
  footerClassName?: string;
}) {
  const { t } = useI18n();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] lg:hidden">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'absolute left-0 top-0 flex h-full w-[min(100%,300px)] flex-col bg-white shadow-xl',
          drawerClassName,
        )}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
          {logo}
          <PortalHeaderIconButton onClick={onClose} ariaLabel={t('nav.closeMenu')}>
            <X className="h-5 w-5" strokeWidth={1.75} />
          </PortalHeaderIconButton>
        </div>
        {userSection}
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer ? (
          <div className={cn('border-t border-[var(--border)] p-4', footerClassName)}>{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
