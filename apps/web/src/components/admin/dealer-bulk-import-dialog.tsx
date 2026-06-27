'use client';

import { useRef, useState } from 'react';
import { X, Upload, FileSpreadsheet } from 'lucide-react';
import { dealersApi, type DealerBulkImportResult } from '@/lib/api';
import { Button } from '@/components/ui';
import { useI18n } from '@/components/providers/i18n-provider';

export function DealerBulkImportDialog({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DealerBulkImportResult | null>(null);

  if (!open) return null;

  function resetState() {
    setFile(null);
    setError('');
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleClose() {
    resetState();
    onClose();
  }

  async function handleDownloadTemplate() {
    setTemplateLoading(true);
    setError('');
    try {
      await dealersApi.downloadBulkTemplate();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setTemplateLoading(false);
    }
  }

  async function handleUpload() {
    if (!file) {
      setError(t('admin.dealerBulkFileRequired'));
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await dealersApi.bulkImport(file);
      setResult(res);
      onImported();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.saveFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dealer-bulk-title"
        className="relative z-10 flex max-h-[min(92vh,720px)] w-full max-w-xl flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-white shadow-[var(--shadow-lg)]"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <h2 id="dealer-bulk-title" className="text-base font-semibold text-[var(--text-primary)]">
            {t('admin.dealerBulkTitle')}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/[0.05]"
            aria-label={t('nav.closeMenu')}
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
            {t('admin.dealerBulkDescription')}
          </p>

          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-secondary)]/60 p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-[var(--text-tertiary)]" strokeWidth={1.75} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-[var(--text-primary)]">
                  {t('admin.dealerBulkTemplate')}
                </p>
                <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                  {t('admin.dealerBulkTemplateHint')}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3"
                  disabled={templateLoading}
                  onClick={handleDownloadTemplate}
                >
                  {templateLoading ? t('common.loading') : t('admin.dealerBulkDownloadTemplate')}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-medium text-[var(--text-primary)]">
              {t('admin.dealerBulkUpload')}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setError('');
                setResult(null);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-sm)] border border-dashed border-[var(--border-strong)] bg-white px-4 py-3 text-left transition-colors hover:border-[var(--accent)] hover:bg-[var(--bg-secondary)]/40"
            >
              <span className="min-w-0 truncate text-[13px] text-[var(--text-secondary)]">
                {file ? file.name : t('admin.dealerBulkChooseFile')}
              </span>
              <Upload className="h-4 w-4 shrink-0 text-[var(--text-tertiary)]" strokeWidth={1.75} />
            </button>
          </div>

          {error ? <p className="portal-alert portal-alert--error portal-alert--inline">{error}</p> : null}

          {result ? (
            <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--border)] p-4">
              <p className="text-[13px] font-medium text-[var(--text-primary)]">
                {t('admin.dealerBulkResult').replace('{count}', String(result.created))}
              </p>
              {result.failed.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-[12px] font-medium text-[var(--danger)]">
                    {t('admin.dealerBulkFailed').replace('{count}', String(result.failed.length))}
                  </p>
                  <ul className="max-h-40 space-y-1 overflow-y-auto text-[12px] text-[var(--text-secondary)]">
                    {result.failed.map((item) => (
                      <li key={`${item.row}-${item.error}`}>
                        Row {item.row}
                        {item.dealerName ? ` · ${item.dealerName}` : ''}: {item.error}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-[var(--border)] px-5 py-4">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button type="button" onClick={handleUpload} disabled={loading || !file}>
            {loading ? t('common.loading') : t('admin.dealerBulkSubmit')}
          </Button>
        </div>
      </div>
    </div>
  );
}
