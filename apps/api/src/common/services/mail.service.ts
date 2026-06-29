import { BadRequestException, Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { SettingsService } from '../../settings/settings.service';

@Injectable()
export class MailService {
  constructor(private settings: SettingsService) {}

  private async createTransport() {
    const config = await this.settings.getMailSettingsWithSecret();
    if (!config.smtpHost) {
      throw new BadRequestException('SMTP host is not configured');
    }

    return nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure,
      auth: config.smtpUser
        ? {
            user: config.smtpUser,
            pass: config.smtpPassword,
          }
        : undefined,
    });
  }

  async sendMail(options: { to: string; subject: string; text: string; html?: string }) {
    const config = await this.settings.getMailSettingsWithSecret();
    if (!config.enabled) {
      throw new BadRequestException('Outbound mail is disabled');
    }
    if (!config.from) {
      throw new BadRequestException('Sender email is not configured');
    }

    const transport = await this.createTransport();
    await transport.sendMail({
      from: config.fromName ? `"${config.fromName}" <${config.from}>` : config.from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
  }

  async sendTestMail(to: string) {
    await this.sendMail({
      to,
      subject: 'CEV Dealer Portal — test email',
      text: 'This is a test message from CEV Dealer Portal mail settings.',
      html: '<p>This is a <strong>test message</strong> from CEV Dealer Portal mail settings.</p>',
    });
  }
}
