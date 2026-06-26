'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { logoutSession, type ApiUser } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';

export function AdminAccountMenu({ user }: { user: ApiUser }) {
  const { t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

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
        className="portal-account-trigger admin-account-trigger"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(0,174,239,0.1)] text-[var(--cev-blue)]">
          <User className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
        <span className="hidden min-w-0 text-left md:block">
          <span className="block truncate text-[13px] font-medium leading-tight text-[var(--text-primary)]">
            {user.name}
          </span>
          <span className="block truncate text-[11px] text-[var(--text-tertiary)]">{user.email}</span>
        </span>
        <span className="hidden shrink-0 rounded-full bg-[var(--bg-secondary)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-secondary)] sm:inline">
          {user.role}
        </span>
        <ChevronDown
          className={cn('hidden h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)] transition-transform md:block', open && 'rotate-180')}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div className="portal-account-menu admin-account-menu" role="menu">
          <div className="border-b border-[var(--border)] px-3.5 py-2.5 md:hidden">
            <p className="text-[13px] font-medium">{user.name}</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">{user.email}</p>
          </div>
          <Link
            href="/admin/account"
            role="menuitem"
            className="portal-account-menu-item admin-account-menu-item"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-4 w-4 text-[var(--text-secondary)]" strokeWidth={1.75} />
            {t('account.settings')}
          </Link>
          <button
            type="button"
            role="menuitem"
            className="portal-account-menu-item admin-account-menu-item w-full border-t border-[var(--border)] text-[#ff3b30]"
            onClick={() => {
              setOpen(false);
              logout();
            }}
          >
            <LogOut className="h-[18px] w-[18px]" strokeWidth={1.75} />
            {t('common.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
