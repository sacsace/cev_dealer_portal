'use client';

import { PageTitle, Card } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';

export default function HelpPage() {
  const { t } = useI18n();

  return (
    <div>
      <PageTitle title={t('help.title')} />
      <Card>
        <p className="leading-relaxed text-[var(--text-secondary)]">{t('help.body')}</p>
      </Card>
    </div>
  );
}
