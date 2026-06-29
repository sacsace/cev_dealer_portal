export const MAIL_SETTING_KEYS = {
  enabled: 'mail.enabled',
  from: 'mail.from',
  fromName: 'mail.from_name',
  smtpHost: 'mail.smtp.host',
  smtpPort: 'mail.smtp.port',
  smtpSecure: 'mail.smtp.secure',
  smtpUser: 'mail.smtp.user',
  smtpPassword: 'mail.smtp.password',
} as const;

export type MailSettings = {
  enabled: boolean;
  from: string;
  fromName: string;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPasswordSet: boolean;
};

export const MASKED_SECRET = '********';
