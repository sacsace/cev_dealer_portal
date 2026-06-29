import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MAIL_SETTING_KEYS,
  MASKED_SECRET,
  type MailSettings,
} from './settings.constants';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  private envDefaults(): MailSettings & { smtpPassword: string } {
    return {
      enabled: process.env.MAIL_ENABLED === 'true',
      from: process.env.MAIL_FROM ?? process.env.COMPANY_EMAIL ?? '',
      fromName: process.env.MAIL_FROM_NAME ?? 'CEV Dealer Portal',
      smtpHost: process.env.SMTP_HOST ?? '',
      smtpPort: Number(process.env.SMTP_PORT ?? 587),
      smtpSecure: process.env.SMTP_SECURE === 'true',
      smtpUser: process.env.SMTP_USER ?? '',
      smtpPassword: process.env.SMTP_PASS ?? '',
      smtpPasswordSet: Boolean(process.env.SMTP_PASS),
    };
  }

  private async readSetting(key: string) {
    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    return row?.value;
  }

  private async upsertSetting(key: string, value: string) {
    await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  async getMailSettings(): Promise<MailSettings> {
    const defaults = this.envDefaults();
    const [
      enabled,
      from,
      fromName,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPassword,
    ] = await Promise.all([
      this.readSetting(MAIL_SETTING_KEYS.enabled),
      this.readSetting(MAIL_SETTING_KEYS.from),
      this.readSetting(MAIL_SETTING_KEYS.fromName),
      this.readSetting(MAIL_SETTING_KEYS.smtpHost),
      this.readSetting(MAIL_SETTING_KEYS.smtpPort),
      this.readSetting(MAIL_SETTING_KEYS.smtpSecure),
      this.readSetting(MAIL_SETTING_KEYS.smtpUser),
      this.readSetting(MAIL_SETTING_KEYS.smtpPassword),
    ]);

    const resolvedPassword = smtpPassword ?? defaults.smtpPassword;

    return {
      enabled: enabled != null ? enabled === 'true' : defaults.enabled,
      from: from ?? defaults.from,
      fromName: fromName ?? defaults.fromName,
      smtpHost: smtpHost ?? defaults.smtpHost,
      smtpPort: smtpPort != null ? Number(smtpPort) : defaults.smtpPort,
      smtpSecure: smtpSecure != null ? smtpSecure === 'true' : defaults.smtpSecure,
      smtpUser: smtpUser ?? defaults.smtpUser,
      smtpPasswordSet: Boolean(resolvedPassword),
    };
  }

  async getMailSettingsWithSecret() {
    const publicSettings = await this.getMailSettings();
    const storedPassword = await this.readSetting(MAIL_SETTING_KEYS.smtpPassword);
    const password = storedPassword ?? this.envDefaults().smtpPassword;
    return { ...publicSettings, smtpPassword: password };
  }

  async updateMailSettings(dto: {
    enabled?: boolean;
    from?: string;
    fromName?: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUser?: string;
    smtpPassword?: string;
  }) {
    if (dto.enabled !== undefined) {
      await this.upsertSetting(MAIL_SETTING_KEYS.enabled, String(dto.enabled));
    }
    if (dto.from !== undefined) await this.upsertSetting(MAIL_SETTING_KEYS.from, dto.from);
    if (dto.fromName !== undefined) await this.upsertSetting(MAIL_SETTING_KEYS.fromName, dto.fromName);
    if (dto.smtpHost !== undefined) await this.upsertSetting(MAIL_SETTING_KEYS.smtpHost, dto.smtpHost);
    if (dto.smtpPort !== undefined) {
      await this.upsertSetting(MAIL_SETTING_KEYS.smtpPort, String(dto.smtpPort));
    }
    if (dto.smtpSecure !== undefined) {
      await this.upsertSetting(MAIL_SETTING_KEYS.smtpSecure, String(dto.smtpSecure));
    }
    if (dto.smtpUser !== undefined) await this.upsertSetting(MAIL_SETTING_KEYS.smtpUser, dto.smtpUser);
    if (
      dto.smtpPassword !== undefined &&
      dto.smtpPassword !== MASKED_SECRET &&
      dto.smtpPassword.trim() !== ''
    ) {
      await this.upsertSetting(MAIL_SETTING_KEYS.smtpPassword, dto.smtpPassword);
    }

    return this.getMailSettings();
  }
}
