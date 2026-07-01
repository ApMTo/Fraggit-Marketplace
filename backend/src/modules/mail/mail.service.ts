import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class MailService {
  private transporter: Transporter | null = null;
  private readonly smtpConfigured: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MailService.name);

    const host = this.configService.get<string>('smtp.host', '');
    const user = this.configService.get<string>('smtp.user', '');
    const password = this.configService.get<string>('smtp.password', '');

    this.smtpConfigured = Boolean(host && user && password);

    if (this.smtpConfigured) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.configService.get<number>('smtp.port', 587),
        secure: false,
        auth: { user, pass: password },
      });
      this.logger.info(
        { host, user },
        'SMTP configured — emails will be sent via transporter',
      );
    } else {
      this.logger.warn(
        'SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASSWORD in backend/.env and restart the server)',
      );
    }
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    if (!this.smtpConfigured || !this.transporter) {
      const verifyUrl = html.match(/https?:\/\/[^\s<"]+/i)?.[0];
      this.logger.warn(
        { to, subject, verifyUrl },
        'SMTP not configured — email logged instead of sent',
      );
      return;
    }

    const from = this.configService.get<string>(
      'smtp.from',
      'Fraggit <no-reply@fraggit.local>',
    );

    const result = await this.transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    this.logger.info(
      { to, subject, messageId: result.messageId, from },
      'Email sent',
    );
  }
}
