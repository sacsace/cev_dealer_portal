import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const LOGO_SOURCES = {
  default: {
    src: '/cev-logo.png',
    width: 560,
    height: 200,
  },
  sidebar: {
    src: '/cev-logo-sidebar.png',
    width: 1145,
    height: 558,
  },
} as const;

/** Always English — not localized */
export const CEV_PORTAL_NAME = 'CEV Dealer Portal';
export const CEV_ADMIN_PORTAL_NAME = 'CEV Dealer Portal';
export const CEV_SIDEBAR_LOGO_HEIGHT = 53;
export const CEV_MOBILE_DRAWER_LOGO_HEIGHT = 42;

type CevLogoProps = {
  href?: string | null;
  className?: string;
  height?: number;
  priority?: boolean;
  variant?: keyof typeof LOGO_SOURCES;
};

export function CevLogo({
  href = '/login',
  className,
  height = 44,
  priority = false,
  variant = 'default',
}: CevLogoProps) {
  const logo = LOGO_SOURCES[variant];
  const image = (
    <Image
      src={logo.src}
      alt="CEV Engineering Private Limited"
      width={logo.width}
      height={logo.height}
      priority={priority}
      className="h-auto w-auto max-w-full object-contain"
      style={{ height: `${height}px`, width: 'auto', maxWidth: '100%' }}
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          'inline-flex w-full max-w-full shrink-0 items-center',
          variant === 'sidebar' && 'justify-center',
          className,
        )}
      >
        {image}
      </Link>
    );
  }

  return (
    <span className={cn('inline-flex max-w-full items-center', variant === 'sidebar' && 'justify-center', className)}>
      {image}
    </span>
  );
}
