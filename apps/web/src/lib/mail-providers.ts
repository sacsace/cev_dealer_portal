export type MailProvider = 'custom' | 'gmail';

export const GMAIL_SMTP = {
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpSecure: false,
} as const;

export function detectMailProvider(smtpHost?: string): MailProvider {
  return smtpHost?.trim().toLowerCase() === GMAIL_SMTP.smtpHost ? 'gmail' : 'custom';
}

export function mailProviderPreset(provider: MailProvider) {
  if (provider === 'gmail') return { ...GMAIL_SMTP };
  return null;
}
