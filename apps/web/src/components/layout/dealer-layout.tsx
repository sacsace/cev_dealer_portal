'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  ShoppingBag,
  Search,
  Menu,
  Wrench,
  Package,
  ClipboardList,
  HelpCircle,
  Home,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { cartApi, logoutSession, refreshSession } from '@/lib/api';
import { CART_UPDATED_EVENT } from '@/lib/cart-events';
import { loadJobCardCount, JOB_CARDS_UPDATED_EVENT } from '@/lib/job-card-events';
import { loadPendingOrderCount, PENDING_ORDERS_UPDATED_EVENT } from '@/lib/order-events';
import { useEffect, useMemo, useState } from 'react';
import type { ApiUser } from '@/lib/api';
import {
  buildDealerSearchUrl,
  getDealerSearchScope,
  getSearchPlaceholderKey,
} from '@/lib/dealer-search';
import { useI18n } from '@/components/providers/i18n-provider';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { CevLogo, CEV_MOBILE_DRAWER_LOGO_HEIGHT, CEV_PORTAL_NAME, CEV_SIDEBAR_LOGO_HEIGHT } from '@/components/brand/cev-logo';
import { PortalAccountMenu } from '@/components/layout/portal-account-menu';
import {
  PortalHeaderIconButton,
  PortalLogoutButton,
  PortalMobileDrawer,
  PortalMobileUserCard,
  PortalSidebarAccountLink,
} from '@/components/layout/portal-shell';

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
      return true;
    }
    return true;
  }
  return search === query;
}

function DealerSidebarNav({
  pathname,
  search,
  cartCount,
  jobCardCount,
  pendingOrderCount,
  onNavigate,
}: {
  pathname: string;
  search: string;
  cartCount: number;
  jobCardCount: number;
  pendingOrderCount: number;
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
                      {item.key === 'cart' && cartCount > 0 && (
                        <span
                          className={cn(
                            'ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center self-center rounded-full px-1.5 text-[11px] font-semibold leading-none',
                            active
                              ? 'bg-white text-[var(--text-primary)]'
                              : 'bg-[var(--accent)] text-white',
                          )}
                        >
                          {cartCount > 99 ? '99+' : cartCount}
                        </span>
                      )}
                      {item.key === 'job-list' && jobCardCount > 0 && (
                        <span
                          className={cn(
                            'ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center self-center rounded-full px-1.5 text-[11px] font-semibold leading-none',
                            active
                              ? 'bg-white text-[var(--text-primary)]'
                              : 'bg-[var(--accent)] text-white',
                          )}
                        >
                          {jobCardCount > 99 ? '99+' : jobCardCount}
                        </span>
                      )}
                      {item.key === 'orders-all' && pendingOrderCount > 0 && (
                        <span
                          className={cn(
                            'ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center self-center rounded-full px-1.5 text-[11px] font-semibold leading-none',
                            active
                              ? 'bg-white text-[var(--text-primary)]'
                              : 'bg-[var(--accent)] text-white',
                          )}
                        >
                          {pendingOrderCount > 99 ? '99+' : pendingOrderCount}
                        </span>
                      )}
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
  const [jobCardCount, setJobCardCount] = useState(0);
  const [pendingOrderCount, setPendingOrderCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    refreshSession().then(setUser);
    cartApi.get().catch(() => {});
    loadJobCardCount().then(setJobCardCount).catch(() => {});
    loadPendingOrderCount().then(setPendingOrderCount).catch(() => {});
  }, []);

  useEffect(() => {
    function onCartUpdated(event: Event) {
      const detail = (event as CustomEvent<{ itemCount: number }>).detail;
      if (typeof detail?.itemCount === 'number') {
        setCartCount(detail.itemCount);
      }
    }

    function onJobCardsUpdated(event: Event) {
      const detail = (event as CustomEvent<{ total: number }>).detail;
      if (typeof detail?.total === 'number') {
        setJobCardCount(detail.total);
      }
    }

    function onPendingOrdersUpdated(event: Event) {
      const detail = (event as CustomEvent<{ total: number }>).detail;
      if (typeof detail?.total === 'number') {
        setPendingOrderCount(detail.total);
      }
    }

    window.addEventListener(CART_UPDATED_EVENT, onCartUpdated);
    window.addEventListener(JOB_CARDS_UPDATED_EVENT, onJobCardsUpdated);
    window.addEventListener(PENDING_ORDERS_UPDATED_EVENT, onPendingOrdersUpdated);
    return () => {
      window.removeEventListener(CART_UPDATED_EVENT, onCartUpdated);
      window.removeEventListener(JOB_CARDS_UPDATED_EVENT, onJobCardsUpdated);
      window.removeEventListener(PENDING_ORDERS_UPDATED_EVENT, onPendingOrdersUpdated);
    };
  }, []);

  useEffect(() => {
    loadJobCardCount().then(setJobCardCount).catch(() => {});
    loadPendingOrderCount().then(setPendingOrderCount).catch(() => {});
  }, [pathname, search]);

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
          <DealerSidebarNav
            pathname={pathname}
            search={search}
            cartCount={cartCount}
            jobCardCount={jobCardCount}
            pendingOrderCount={pendingOrderCount}
          />
        </div>

        {user && (
          <PortalSidebarAccountLink
            href="/account"
            name={dealerName}
            subtitle={t('nav.myAccount')}
          />
        )}
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

            {user ? (
              <PortalAccountMenu
                user={user}
                accountHref="/account"
                accountLabelKey="nav.myAccount"
                primaryName={dealerName}
                secondaryLine={t('nav.myAccount')}
                accountIcon="user"
                mobileBreakpoint="lg"
              />
            ) : null}

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

      <PortalMobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        drawerClassName="dealer-sidebar"
        logo={<CevLogo href="/dealer" height={CEV_MOBILE_DRAWER_LOGO_HEIGHT} variant="sidebar" />}
        userSection={
          user ? (
            <PortalMobileUserCard
              name={dealerName}
              subtitle={user.dealer?.email ?? user.email}
            />
          ) : null
        }
        footerClassName="space-y-2"
        footer={
          <>
            <form onSubmit={handleSearch} className="portal-search-input-wrap">
              <Search className="portal-search-input-icon h-4 w-4" strokeWidth={1.75} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t(headerPlaceholderKey)}
                className="apple-input w-full"
              />
            </form>
            <PortalLogoutButton onClick={logout} />
          </>
        }
      >
        <DealerSidebarNav
          pathname={pathname}
          search={search}
          cartCount={cartCount}
          jobCardCount={jobCardCount}
          pendingOrderCount={pendingOrderCount}
          onNavigate={() => setMobileOpen(false)}
        />
      </PortalMobileDrawer>
    </div>
  );
}
