'use client';

import { LegalPageShell } from '@/components/layout/legal-page-shell';
import { LegalDocument } from '@/components/legal/legal-document';
import { privacyContent } from '@/lib/legal-content';
import { useI18n } from '@/components/providers/i18n-provider';

export default function PrivacyPage() {
  const { locale, t } = useI18n();

  return (
    <LegalPageShell title={t('legal.privacy')}>
      <LegalDocument content={privacyContent[locale]} />
    </LegalPageShell>
  );
}
