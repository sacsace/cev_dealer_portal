'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut, User, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { clearSession, logoutSession, refreshSession, type ApiUser } from '@/lib/api';
import { adminDashboardItem, adminNavGroups } from '@/lib/admin-nav';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { CevLogo, CEV_ADMIN_PORTAL_NAME, CEV_MOBILE_DRAWER_LOGO_HEIGHT, CEV_SIDEBAR_LOGO_HEIGHT } from '@/components/brand/cev-logo';
import { AdminAccountMenu } from '@/components/admin/admin-account-menu';

function SidebarNav({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();
  const DashboardIcon = adminDashboardItem.icon;
  const dashboardActive = adminDashboardItem.match(pathname);

  return (
    <nav className="flex flex-col gap-1 py-3">
      <div className="px-3">
        <Link
          href={adminDashboardItem.href}
          onClick={onNavigate}
          className={cn('admin-nav-link', dashboardActive && 'admin-nav-link--active')}
        >
          <DashboardIcon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span className="admin-nav-link-label">{t(adminDashboardItem.labelKey)}</span>
        </Link>
      </div>

      {adminNavGroups.map((group) => (
        <div key={group.key} className="admin-nav-group">
          <p className="admin-nav-group-label">{t(group.labelKey)}</p>
          <div className="flex flex-col gap-0.5">
            {group.items.map((item, index) => {
              const Icon = item.icon;
              const active = item.match(pathname);
              const isChild = group.key === 'catalog' && index > 0;

              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn(
                    'admin-nav-link',
                    isChild && 'admin-nav-link--child',
                    active && 'admin-nav-link--active',
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span className="admin-nav-link-label">{t(item.labelKey)}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    refreshSession().then(setUser);
  }, []);

  async function logout() {
    await logoutSession();
    router.push('/login');
  }

  const sidebarLogoHeight = CEV_SIDEBAR_LOGO_HEIGHT;

  return (
    <div className="admin-portal app-portal flex min-h-screen min-w-0 overflow-x-clip bg-[var(--bg-secondary)]">
      <aside className="admin-sidebar hidden w-[260px] shrink-0 flex-col border-r border-[var(--border)] lg:flex">
        <div className="flex items-center justify-center border-b border-[var(--border)] px-4 py-5">
          <CevLogo href="/admin" height={sidebarLogoHeight} variant="sidebar" />
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          <SidebarNav pathname={pathname} />
        </div>
        {user && (
          <div className="border-t border-[var(--border)] p-3">
            <Link
              href="/admin/account"
              className="flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-black/[0.04]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(0,174,239,0.1)] text-[var(--cev-blue)]">
                <User className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{user.name}</span>
                <span className="block truncate text-[11px] text-[var(--text-tertiary)]">{t('account.settings')}</span>
              </span>
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)]" />
            </Link>
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="apple-glass sticky top-0 z-40 border-b border-[var(--border)]">
          <div className="flex h-[52px] items-center gap-2.5 px-4 md:px-6">
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.05] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label={t('nav.menu')}
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </button>

            <div className="min-w-0 flex-1 lg:hidden">
              <p className="truncate text-[13px] font-semibold">{CEV_ADMIN_PORTAL_NAME}</p>
            </div>

            <div className="hidden shrink-0 lg:block">
              <p className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
                {CEV_ADMIN_PORTAL_NAME}
              </p>
            </div>

            <div className="flex-1" />

            <LanguageSwitcher />
            {user && <AdminAccountMenu user={user} />}
          </div>
        </header>

        <main className="flex-1 bg-[var(--bg-secondary)]">{children}</main>

        <footer className="admin-portal-footer bg-[var(--bg-secondary)]">
          <p>{t('footer.copyright')}</p>
        </footer>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-[min(100%,300px)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
              <CevLogo href="/admin" height={CEV_MOBILE_DRAWER_LOGO_HEIGHT} variant="sidebar" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.05]"
                aria-label={t('nav.closeMenu')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {user && (
              <div className="border-b border-[var(--border)] p-4">
                <Link
                  href="/admin/account"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--bg-secondary)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(0,174,239,0.1)] text-[var(--cev-blue)]">
                    <User className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span>
                    <span className="block text-[13px] font-medium">{user.name}</span>
                    <span className="block text-[11px] text-[var(--text-tertiary)]">{user.email}</span>
                  </span>
                </Link>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              <SidebarNav pathname={pathname} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-[var(--border)] p-4">
              <button
                type="button"
                onClick={logout}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border-strong)] py-2.5 text-[13px] font-medium text-[#ff3b30]"
              >
                <LogOut className="h-4 w-4" />
                {t('common.logout')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
