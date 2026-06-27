'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getSession, logoutSession, refreshSession, type ApiUser } from '@/lib/api';
import { adminDashboardItem, adminNavGroups } from '@/lib/admin-nav';
import { filterAdminNavGroups } from '@/lib/admin-access';
import { cn } from '@/lib/utils';
import { useI18n } from '@/components/providers/i18n-provider';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { CevLogo, CEV_ADMIN_PORTAL_NAME, CEV_MOBILE_DRAWER_LOGO_HEIGHT, CEV_SIDEBAR_LOGO_HEIGHT } from '@/components/brand/cev-logo';
import { PortalAccountMenu } from '@/components/layout/portal-account-menu';
import {
  PortalHeaderIconButton,
  PortalLogoutButton,
  PortalMobileDrawer,
  PortalSidebarAccountLink,
} from '@/components/layout/portal-shell';

function SidebarNav({
  pathname,
  role,
  onNavigate,
}: {
  pathname: string;
  role?: string | null;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();
  const DashboardIcon = adminDashboardItem.icon;
  const dashboardActive = adminDashboardItem.match(pathname);
  const navGroups = filterAdminNavGroups(role, adminNavGroups);

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

      {navGroups.map((group) => (
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
  const [user, setUser] = useState<ApiUser | null>(() => getSession());
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    refreshSession().then(setUser);
  }, []);

  async function logout() {
    await logoutSession();
    router.push('/login');
  }

  return (
    <div className="admin-portal app-portal flex min-h-screen min-w-0 overflow-x-clip bg-[var(--bg-secondary)]">
      <aside className="admin-sidebar hidden w-[260px] shrink-0 flex-col border-r border-[var(--border)] lg:flex">
        <div className="flex items-center justify-center border-b border-[var(--border)] px-4 py-5">
          <CevLogo href="/admin" height={CEV_SIDEBAR_LOGO_HEIGHT} variant="sidebar" />
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          <SidebarNav pathname={pathname} role={user?.role} />
        </div>
        {user ? (
          <PortalSidebarAccountLink
            href="/admin/account"
            name={user.name}
            subtitle={t('account.settings')}
          />
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="apple-glass sticky top-0 z-40 border-b border-[var(--border)]">
          <div className="flex h-[52px] items-center gap-2.5 px-4 md:px-6">
            <PortalHeaderIconButton
              onClick={() => setMobileOpen(true)}
              ariaLabel={t('nav.menu')}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            </PortalHeaderIconButton>

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
            {user ? (
              <PortalAccountMenu
                user={user}
                accountHref="/admin/account"
                accountLabelKey="account.settings"
                primaryName={user.name}
                secondaryLine={user.email}
                badge={user.role}
                accountIcon="settings"
                triggerClassName="admin-account-trigger"
                menuClassName="admin-account-menu"
                menuItemClassName="admin-account-menu-item"
              />
            ) : null}
          </div>
        </header>

        <main className="min-w-0 flex-1 bg-[var(--bg-secondary)]">{children}</main>

        <footer className="admin-portal-footer bg-[var(--bg-secondary)]">
          <p>{t('footer.copyright')}</p>
        </footer>
      </div>

      <PortalMobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        logo={<CevLogo href="/admin" height={CEV_MOBILE_DRAWER_LOGO_HEIGHT} variant="sidebar" />}
        userSection={
          user ? (
            <div className="border-b border-[var(--border)] p-4">
              <Link
                href="/admin/account"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-xl p-2 hover:bg-[var(--bg-secondary)]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(140,198,63,0.1)] text-[var(--cev-green)]">
                  <User className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <span>
                  <span className="block text-[13px] font-medium">{user.name}</span>
                  <span className="block text-[11px] text-[var(--text-tertiary)]">{user.email}</span>
                </span>
              </Link>
            </div>
          ) : null
        }
        footer={<PortalLogoutButton onClick={logout} />}
      >
        <SidebarNav pathname={pathname} role={user?.role} onNavigate={() => setMobileOpen(false)} />
      </PortalMobileDrawer>
    </div>
  );
}
