'use client';

import { LegalPageShell } from '@/components/layout/legal-page-shell';
import { LegalDocument } from '@/components/legal/legal-document';
import { termsContent } from '@/lib/legal-content';
import { useI18n } from '@/components/providers/i18n-provider';

export default function TermsPage() {
  const { locale, t } = useI18n();

  return (
    <LegalPageShell title={t('legal.terms')}>
      <LegalDocument content={termsContent[locale]} />
    </LegalPageShell>
  );
}
