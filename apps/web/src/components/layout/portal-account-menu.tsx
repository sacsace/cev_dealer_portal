'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { logoutSession, type ApiUser } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

type PortalAccountMenuProps = {
  user: ApiUser;
  accountHref: string;
  accountLabelKey: string;
  primaryName: string;
  secondaryLine: string;
  badge?: string;
  accountIcon?: 'settings' | 'user';
  triggerClassName?: string;
  menuClassName?: string;
  menuItemClassName?: string;
  mobileBreakpoint?: 'md' | 'lg';
};

export function PortalAccountMenu({
  user,
  accountHref,
  accountLabelKey,
  primaryName,
  secondaryLine,
  badge,
  accountIcon = 'user',
  triggerClassName,
  menuClassName,
  menuItemClassName,
  mobileBreakpoint = 'md',
}: PortalAccountMenuProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const AccountIcon = accountIcon === 'settings' ? Settings : User;
  const textHiddenClass = mobileBreakpoint === 'lg' ? 'hidden lg:block' : 'hidden md:block';
  const chevronHiddenClass = mobileBreakpoint === 'lg' ? 'hidden lg:block' : 'hidden md:block';
  const mobilePanelHiddenClass = mobileBreakpoint === 'lg' ? 'lg:hidden' : 'md:hidden';

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  async function logout() {
    await logoutSession();
    router.push('/login');
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={cn('portal-account-trigger', triggerClassName)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t(accountLabelKey)}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(140,198,63,0.1)] text-[var(--cev-green)]">
          <User className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <span className={cn('min-w-0 text-left', textHiddenClass)}>
          <span className="block truncate text-[13px] font-medium leading-tight text-[var(--text-primary)]">
            {primaryName}
          </span>
          <span className="block truncate text-[11px] text-[var(--text-tertiary)]">{secondaryLine}</span>
        </span>
        {badge ? (
          <span className="hidden shrink-0 rounded-full bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] sm:inline">
            {badge}
          </span>
        ) : null}
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)] transition-transform',
            chevronHiddenClass,
            open && 'rotate-180',
          )}
          strokeWidth={2}
        />
      </button>

      {open ? (
        <div className={cn('portal-account-menu', menuClassName)} role="menu">
          <div className={cn('border-b border-[var(--border)] px-3.5 py-2.5', mobilePanelHiddenClass)}>
            <p className="text-[13px] font-medium">{primaryName}</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">{user.email}</p>
          </div>
          <Link
            href={accountHref}
            role="menuitem"
            className={cn('portal-account-menu-item', menuItemClassName)}
            onClick={() => setOpen(false)}
          >
            <AccountIcon className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
            {t(accountLabelKey)}
          </Link>
          <button
            type="button"
            role="menuitem"
            className={cn(
              'portal-account-menu-item w-full border-t border-[var(--border)] text-[var(--danger)]',
              menuItemClassName,
            )}
            onClick={() => {
              setOpen(false);
              void logout();
            }}
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {t('common.logout')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
