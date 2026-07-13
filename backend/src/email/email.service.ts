import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(@Inject(ConfigService) private config: ConfigService) {
    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpPort = this.config.get<string>('SMTP_PORT');
    const smtpUser = this.config.get<string>('SMTP_USER');
    const smtpPassword = this.config.get<string>('SMTP_PASSWORD');

    if (smtpHost && smtpPort && smtpUser && smtpPassword) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: +smtpPort,
        secure: smtpPort === '465',
        auth: {
          user: smtpUser,
          pass: smtpPassword,
        },
      });
    }
  }

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email gönderimi yapılandırılmamış (SMTP env değişkenleri eksik)');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM') || 'noreply@emlakdefter.com',
        to: email,
        subject: 'EstateDesk — Şifrenizi Sıfırlayın',
        html: this.renderPasswordResetTemplate(resetUrl),
      });
    } catch (error) {
      this.logger.error(`E-posta gönderimi başarısız (${email}):`, error);
      // Fire-and-forget: hata işlemi engellemiyor
    }
  }

  async sendFeedbackNotificationEmail(
    to: string,
    officeName: string,
    senderName: string,
    body: string,
  ): Promise<void> {
    if (!this.transporter) {
      this.logger.warn('Email gönderimi yapılandırılmamış (SMTP env değişkenleri eksik)');
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('SMTP_FROM') || 'noreply@emlakdefter.com',
        to,
        subject: `EstateDesk — Yeni geri bildirim: ${officeName}`,
        html: this.renderFeedbackNotificationTemplate(officeName, senderName, body),
      });
    } catch (error) {
      this.logger.error(`E-posta gönderimi başarısız (${to}):`, error);
      // Fire-and-forget: hata işlemi engellemiyor
    }
  }

  private renderFeedbackNotificationTemplate(
    officeName: string,
    senderName: string,
    body: string,
  ): string {
    const panelUrl = `${(this.config.get<string>('FRONTEND_URL') || 'http://localhost:5173').replace(/\/+$/, '')}/yonetim/mesajlar`;
    const esc = (s: string) =>
      s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const safeOffice = esc(officeName);
    const safeSender = esc(senderName);
    const safeBody = esc(body).replace(/\n/g, '<br>');
    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Yeni Geri Bildirim</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4e604f;">Yeni Geri Bildirim</h2>
          <p><strong>${safeOffice}</strong> ofisinden <strong>${safeSender}</strong> yeni bir mesaj gönderdi:</p>
          <p style="background-color: #f5f5f5; padding: 14px; border-radius: 8px; white-space: pre-wrap;">${safeBody}</p>
          <div style="margin: 30px 0;">
            <a href="${panelUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4e604f; color: white; text-decoration: none; border-radius: 8px;">Yönetim Panelinde Cevapla</a>
          </div>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            EstateDesk
          </p>
        </div>
      </body>
      </html>
    `;
  }

  private renderPasswordResetTemplate(resetUrl: string): string {
    return `
      <!DOCTYPE html>
      <html lang="tr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Şifre Sıfırlama</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4e604f;">Şifrenizi Sıfırlayın</h2>
          <p>Merhaba,</p>
          <p>EstateDesk hesabınız için bir şifre sıfırlama isteği aldık. Aşağıdaki linki tıklayarak yeni bir şifre belirleyebilirsiniz:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4e604f; color: white; text-decoration: none; border-radius: 8px;">Şifre Sıfırla</a>
          </div>
          <p>Veya bu linki tarayıcınıza yapıştırın:</p>
          <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 4px; font-size: 12px;">
            ${resetUrl}
          </p>
          <p style="color: #666; font-size: 14px;">
            Bu link 1 saat boyunca geçerlidir. Eğer bu isteği siz yapmadıysanız bu e-postayı görmezden gelebilirsiniz.
          </p>
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            EstateDesk
          </p>
        </div>
      </body>
      </html>
    `;
  }
}
