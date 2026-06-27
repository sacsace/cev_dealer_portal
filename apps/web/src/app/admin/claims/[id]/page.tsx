'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { warrantyClaimsApi, type WarrantyClaim } from '@/lib/api';
import { Button, Card, PageTitle } from '@/components/ui';
import { WarrantyClaimForm } from '@/components/dealer/warranty-claim-form';
import { AdminPageBody } from '@/components/admin/admin-page-shell';
import { useI18n } from '@/components/providers/i18n-provider';

export default function AdminClaimDetailPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [claim, setClaim] = useState<WarrantyClaim | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setClaim(await warrantyClaimsApi.get(id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  async function approve() {
    await warrantyClaimsApi.approve(id);
    router.push('/admin/claims');
  }

  async function reject() {
    await warrantyClaimsApi.reject(id);
    router.push('/admin/claims');
  }

  return (
    <AdminPageBody>
      <div className="mb-6">
        <Link
          href="/admin/claims"
          className="mb-3 inline-flex text-[13px] font-medium text-[var(--accent)] hover:underline"
        >
          ← {t('common.back')}
        </Link>
        <PageTitle
          title={t('admin.claimMgmt')}
          subtitle={claim ? `${claim.warrantyClaimNo} · ${claim.dealer?.dealerName ?? ''}` : t('common.loading')}
        />
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-tertiary)]">{t('common.loading')}</p>
      ) : error ? (
        <p className="portal-alert portal-alert--error">{error}</p>
      ) : claim ? (
        <>
          {['SUBMITTED', 'UNDER_REVIEW'].includes(claim.status) && (
            <div className="mb-4 flex flex-wrap gap-2">
              <Button variant="outline" onClick={approve}>
                {t('admin.approve')}
              </Button>
              <Button variant="outline" onClick={reject}>
                {t('admin.reject')}
              </Button>
            </div>
          )}
          <Card>
            <WarrantyClaimForm
              claim={claim}
              onSaved={() => router.push('/admin/claims')}
              onCancel={() => router.push('/admin/claims')}
            />
          </Card>
        </>
      ) : null}
    </AdminPageBody>
  );
}
