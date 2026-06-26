'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LegalDocumentContent } from '@/lib/legal-content';
import { useI18n } from '@/components/providers/i18n-provider';

export function LegalDocument({ content }: { content: LegalDocumentContent }) {
  const { t } = useI18n();

  return (
    <div className="legal-document">
      <div className="legal-document-meta">
        <span className="legal-document-badge">{t('legal.lastUpdated')}: {content.updated}</span>
      </div>

      <div className="legal-document-intro">{content.intro}</div>

      <div className="legal-document-layout">
        <aside className="legal-document-toc">
          <p className="legal-document-toc-label">{t('legal.tableOfContents')}</p>
          <nav aria-label={t('legal.tableOfContents')}>
            <ul>
              {content.sections.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="legal-document-toc-link">
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="legal-document-body">
          {content.sections.map((section, index) => (
            <section
              key={section.id}
              id={section.id}
              className={cn('legal-document-section', index > 0 && 'legal-document-section--bordered')}
            >
              <h2 className="legal-document-section-title">{section.title}</h2>
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="legal-document-paragraph">
                  {paragraph}
                </p>
              ))}
              {section.bullets && section.bullets.length > 0 && (
                <ul className="legal-document-list">
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LegalPageTabs() {
  const { t } = useI18n();
  const pathname = usePathname();

  const tabs = [
    { href: '/terms', label: t('legal.terms') },
    { href: '/privacy', label: t('legal.privacy') },
    { href: '/support', label: t('legal.customerCenter') },
  ];

  return (
    <nav className="legal-page-tabs" aria-label="Legal pages">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn('legal-page-tab', pathname === tab.href && 'legal-page-tab--active')}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
