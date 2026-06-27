'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { warrantyClaimsApi, type WarrantyClaim } from '@/lib/api';
import { Card, PageTitle } from '@/components/ui';
import { WarrantyClaimForm } from '@/components/dealer/warranty-claim-form';
import { useI18n } from '@/components/providers/i18n-provider';

export default function WarrantyClaimEditPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [claim, setClaim] = useState<WarrantyClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    warrantyClaimsApi
      .get(id)
      .then(setClaim)
      .catch((err) => setError(err instanceof Error ? err.message : t('common.saveFailed')))
      .finally(() => setLoading(false));
  }, [id, t]);

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/repair/warranty-claims"
          className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
        <PageTitle
          title={t('warranty.editTitle')}
          subtitle={claim ? `${claim.warrantyClaimNo} · ${claim.invoiceNo}` : t('common.loading')}
        />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : error ? (
        <p className="portal-alert portal-alert--error">{error}</p>
      ) : claim ? (
        <Card>
          <WarrantyClaimForm
            claim={claim}
            onSaved={() => router.push('/repair/warranty-claims')}
            onCancel={() => router.push('/repair/warranty-claims')}
          />
        </Card>
      ) : null}
    </div>
  );
}
