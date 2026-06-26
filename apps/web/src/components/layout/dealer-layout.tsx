'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Menu,
  X,
  ChevronRight,
  Wrench,
  Package,
  ClipboardList,
  User,
  HelpCircle,
  LogOut,
  Home,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cartApi, logoutSession, refreshSession } from '@/lib/api';
import { useEffect, useMemo, useState } from 'react';
import type { ApiUser } from '@/lib/api';
import { useI18n } from '@/components/providers/i18n-provider';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { CevLogo, CEV_MOBILE_DRAWER_LOGO_HEIGHT, CEV_PORTAL_NAME, CEV_SIDEBAR_LOGO_HEIGHT } from '@/components/brand/cev-logo';
import {
  buildDealerSearchUrl,
  getDealerSearchScope,
  getSearchPlaceholderKey,
} from '@/lib/dealer-search';
import { DealerAccountMenu } from '@/components/dealer/dealer-account-menu';

type NavLinkItem = {
  key: string;
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  child?: boolean;
};

type NavSection = {
  labelKey?: string;
  items: NavLinkItem[];
};

type NavGroup = {
  key: string;
  labelKey: string;
  sections: NavSection[];
};

type HomeNavItem = {
  key: string;
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
};

function matchNavHref(href: string, pathname: string, search: string) {
  const [path, query] = href.split('?');

  if (path === '/repair/job-cards' && pathname.startsWith('/repair/job-cards')) {
    return !query;
  }
  if (path === '/repair/warranty-claims' && pathname.startsWith('/repair/warranty-claims')) {
    return !query;
  }

  if (pathname !== path) return false;
  if (!query) {
    if (path === '/parts') {
      return (
        !search ||
        search.startsWith('search=') ||
        search.startsWith('modelId=') ||
        search.startsWith('categoryId=') ||
        search.startsWith('by=')
      );
    }
    if (path === '/orders') {
      return !search;
    }
    return true;
  }
  return search === query;
}

function DealerSidebarNav({
  pathname,
  search,
  onNavigate,
}: {
  pathname: string;
  search: string;
  onNavigate?: () => void;
}) {
  const { t } = useI18n();

  const homeItem: HomeNavItem = {
    key: 'home',
    href: '/dealer',
    labelKey: 'nav.home',
    icon: Home,
  };

  const groups: NavGroup[] = useMemo(
    () => [
      {
        key: 'parts',
        labelKey: 'nav.groupParts',
        sections: [
          {
            items: [
              { key: 'parts', href: '/parts', labelKey: 'nav.partOrder', icon: Package },
            ],
          },
        ],
      },
      {
        key: 'orders',
        labelKey: 'nav.groupOrders',
        sections: [
          {
            items: [
              { key: 'cart', href: '/cart', labelKey: 'nav.cart', icon: ShoppingBag },
              { key: 'orders-all', href: '/orders', labelKey: 'nav.orderHistory', icon: ClipboardList },
              { key: 'orders-pending', href: '/orders?status=SUBMITTED', labelKey: 'nav.pendingOrders', icon: ClipboardList, child: true },
              { key: 'orders-approved', href: '/orders?status=APPROVED', labelKey: 'nav.approvedOrders', icon: ClipboardList, child: true },
              { key: 'orders-shipped', href: '/orders?status=ORDER_SHIPPED', labelKey: 'nav.shippedOrders', icon: ClipboardList, child: true },
            ],
          },
        ],
      },
      {
        key: 'job-card',
        labelKey: 'nav.groupJobCard',
        sections: [
          {
            items: [
              { key: 'job-list', href: '/repair/job-cards', labelKey: 'nav.jobCardList', icon: Wrench },
            ],
          },
        ],
      },
      {
        key: 'warranty',
        labelKey: 'nav.groupWarranty',
        sections: [
          {
            items: [
              { key: 'claim-list', href: '/repair/warranty-claims', labelKey: 'nav.warrantyClaimList', icon: ShieldCheck },
            ],
          },
        ],
      },
    ],
    [],
  );

  const homeActive = pathname === homeItem.href;

  return (
    <nav className="flex flex-col gap-1 py-3">
      <div className="px-3 pb-2">
        <Link
          href={homeItem.href}
          onClick={onNavigate}
          className={cn('admin-nav-link', homeActive && 'admin-nav-link--active')}
        >
          <Home className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span className="admin-nav-link-label">{t(homeItem.labelKey)}</span>
        </Link>
      </div>

      {groups.map((group) => (
        <div key={group.key} className="admin-nav-group">
          <p className="admin-nav-group-label">{t(group.labelKey)}</p>
          {group.sections.map((section, sectionIndex) => (
            <div
              key={`${group.key}-${sectionIndex}`}
              className={cn(sectionIndex > 0 && 'dealer-nav-section-divider mt-3 pt-3')}
            >
              {section.labelKey && (
                <p className="dealer-nav-subgroup-label">{t(section.labelKey)}</p>
              )}
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = matchNavHref(item.href, pathname, search);

                  return (
                    <Link
                      key={item.key}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        'admin-nav-link',
                        item.child && 'admin-nav-link--child',
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
        </div>
      ))}
    </nav>
  );
}

export function DealerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const { t } = useI18n();
  const [user, setUser] = useState<ApiUser | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    refreshSession().then(setUser);
    cartApi.get().then((c) => setCartCount(c.itemCount)).catch(() => {});
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, search]);

  const searchScope = getDealerSearchScope(pathname);
  const headerPlaceholderKey = getSearchPlaceholderKey(searchScope);

  useEffect(() => {
    setQuery(searchParams.get('search') ?? '');
  }, [pathname, searchParams]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(buildDealerSearchUrl(searchScope, trimmed, searchParams));
  }

  async function logout() {
    await logoutSession();
    router.push('/login');
  }

  const dealerName = user?.dealer?.dealerName ?? user?.name ?? CEV_PORTAL_NAME;
  const sidebarLogoHeight = CEV_SIDEBAR_LOGO_HEIGHT;

  return (
    <div className="app-portal flex min-h-screen min-w-0 overflow-x-clip bg-[var(--bg-secondary)]">
      <aside className="dealer-sidebar admin-sidebar hidden w-[260px] shrink-0 flex-col border-r border-[var(--border)] lg:flex">
        <div className="flex items-center justify-center border-b border-[var(--border)] px-4 py-5">
          <CevLogo href="/dealer" height={sidebarLogoHeight} variant="sidebar" />
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          <DealerSidebarNav pathname={pathname} search={search} />
        </div>

        {user && (
          <div className="border-t border-[var(--border)] p-3">
            <Link
              href="/account"
              className="flex items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-black/[0.04]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[rgba(0,174,239,0.1)] text-[var(--cev-blue)]">
                <User className="h-3.5 w-3.5" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium">{dealerName}</span>
                <span className="block truncate text-[11px] text-[var(--text-tertiary)]">{t('nav.myAccount')}</span>
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
              <p className="truncate text-[13px] font-semibold">{CEV_PORTAL_NAME}</p>
            </div>

            <div className="hidden shrink-0 lg:block">
              <p className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
                {CEV_PORTAL_NAME}
              </p>
            </div>

            <form onSubmit={handleSearch} className="portal-search-input-wrap hidden min-w-0 flex-1 lg:mx-6 lg:block lg:max-w-xl xl:max-w-2xl">
              <Search className="portal-search-input-icon h-4 w-4" strokeWidth={1.75} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(headerPlaceholderKey)}
                className="apple-input w-full"
              />
            </form>

            <div className="flex-1" />

            <LanguageSwitcher />

            {user && <DealerAccountMenu user={user} />}

            <Link
              href="/cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.05]"
              aria-label={t('nav.cart')}
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={1.75} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <div className="hidden items-center gap-1 sm:flex">
              <Link
                href="/help"
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.05]"
                aria-label={t('nav.help')}
              >
                <HelpCircle className="h-4 w-4" strokeWidth={1.75} />
              </Link>
            </div>
          </div>
        </header>

        <div className="dealer-mobile-search lg:hidden">
          <form onSubmit={handleSearch} className="portal-search-input-wrap">
            <Search className="portal-search-input-icon h-4 w-4" strokeWidth={1.75} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t(headerPlaceholderKey)}
              className="apple-input w-full"
            />
          </form>
        </div>

        <main className="dealer-page-body portal-page-body w-full min-w-0 flex-1">{children}</main>

        <footer className="dealer-portal-footer bg-[var(--bg-secondary)]">
          <div className="flex w-full flex-wrap justify-between gap-4">
            <span>{t('footer.contact')}: support@cev-dealer.com</span>
            <Link href="/help" className="apple-link">
              {t('footer.faq')}
            </Link>
            <span>{t('footer.companyName')}</span>
          </div>
        </footer>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="dealer-sidebar absolute left-0 top-0 flex h-full w-[min(100%,300px)] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-4">
              <CevLogo href="/dealer" height={CEV_MOBILE_DRAWER_LOGO_HEIGHT} variant="sidebar" />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/[0.05]"
                aria-label={t('nav.closeMenu')}
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>

            {user && (
              <div className="border-b border-[var(--border)] p-4">
                <div className="flex items-center gap-3 rounded-xl p-2">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(0,174,239,0.1)] text-[var(--cev-blue)]">
                    <User className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium">{dealerName}</span>
                    <span className="block truncate text-[11px] text-[var(--text-tertiary)]">
                      {user.dealer?.email ?? user.email}
                    </span>
                  </span>
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              <DealerSidebarNav pathname={pathname} search={search} onNavigate={() => setMobileOpen(false)} />
            </div>

            <div className="space-y-2 border-t border-[var(--border)] p-4">
              <form onSubmit={handleSearch} className="portal-search-input-wrap">
                <Search className="portal-search-input-icon h-4 w-4" strokeWidth={1.75} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t(headerPlaceholderKey)}
                  className="apple-input w-full"
                />
              </form>
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
