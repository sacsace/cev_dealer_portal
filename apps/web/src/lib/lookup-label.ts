import { useEffect, useState } from 'react';
import { lookupApi, type Fitment, type JobCardType, type ProblemType } from '@/lib/api';
import type { Locale } from '@/lib/i18n/types';

export type LocalizedLookupItem = {
  name: string;
  nameEn?: string | null;
};

export function localizedLookupLabel(
  items: LocalizedLookupItem[],
  storedValue: string | null | undefined,
  locale: Locale,
): string | null {
  if (!storedValue?.trim()) return null;

  const trimmed = storedValue.trim();
  const match = items.find(
    (item) =>
      item.name === trimmed ||
      item.name.toLowerCase() === trimmed.toLowerCase() ||
      (item.nameEn && item.nameEn.toLowerCase() === trimmed.toLowerCase()),
  );

  if (!match) return trimmed;
  if (locale === 'en' && match.nameEn) return match.nameEn;
  return match.name;
}

export function useLookupCatalog() {
  const [problemTypes, setProblemTypes] = useState<ProblemType[]>([]);
  const [jobCardTypes, setJobCardTypes] = useState<JobCardType[]>([]);
  const [fitments, setFitments] = useState<Fitment[]>([]);

  useEffect(() => {
    lookupApi.problemTypes().then(setProblemTypes).catch(() => {});
    lookupApi.jobCardTypes().then(setJobCardTypes).catch(() => {});
    lookupApi.fitments().then(setFitments).catch(() => {});
  }, []);

  return { problemTypes, jobCardTypes, fitments };
}
