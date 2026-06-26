'use client';

import { LegalPageShell } from '@/components/layout/legal-page-shell';
import { SupportContactHub } from '@/components/legal/support-contact-hub';
import { supportContent } from '@/lib/legal-content';
import { useI18n } from '@/components/providers/i18n-provider';

export default function SupportPage() {
  const { locale, t } = useI18n();
  const content = supportContent[locale];

  return (
    <LegalPageShell title={t('legal.customerCenter')} subtitle={content.intro}>
      <div className="legal-support">
        <div className="legal-document-meta">
          <span className="legal-document-badge">
            {t('legal.lastUpdated')}: {content.updated}
          </span>
        </div>

        <SupportContactHub />

        <div className="legal-support-sections">
          {content.sections.map((section) => (
            <section key={section.id} id={section.id} className="legal-document-section legal-document-section--bordered">
              <h2 className="legal-document-section-title">{section.title}</h2>
              <p className="legal-document-paragraph">{section.body}</p>
              {section.bullets && (
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
    </LegalPageShell>
  );
}
