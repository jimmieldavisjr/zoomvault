import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { AppConfig } from '../../config/configuration';

export interface RecordingReadyEmail {
  topic: string | null;
  watchUrl: string;
  expiresAt: Date;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private client: Resend | null = null;

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  /** Lazily build the Resend client; returns null when no API key is set. */
  private getClient(): Resend | null {
    if (this.client) return this.client;
    const apiKey = this.config.get('resendApiKey', { infer: true });
    if (!apiKey) {
      return null;
    }
    this.client = new Resend(apiKey);
    return this.client;
  }

  /**
   * Notifies the admin that a recording is ready and a share link exists.
   *
   * Failures are swallowed (logged, not thrown) so a flaky email provider never
   * blocks the webhook from returning 200 to Zoom.
   */
  async sendRecordingReadyToAdmin(input: RecordingReadyEmail): Promise<void> {
    const client = this.getClient();
    const to = this.config.get('adminNotificationEmail', { infer: true });
    const from = this.config.get('emailFrom', { infer: true });

    if (!client || !to) {
      this.logger.warn(
        'Skipping recording-ready email: RESEND_API_KEY or ADMIN_NOTIFICATION_EMAIL not configured.',
      );
      return;
    }

    const title = input.topic?.trim() || 'Your Zoom recording';
    const expires = input.expiresAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    try {
      const { error } = await client.emails.send({
        from,
        to,
        subject: `Recording ready: ${title}`,
        html: this.renderHtml(title, input.watchUrl, expires),
        text: this.renderText(title, input.watchUrl, expires),
      });
      if (error) {
        this.logger.error(`Resend rejected email: ${error.message}`);
        return;
      }
      this.logger.log(`Sent recording-ready email to admin (${to}).`);
    } catch (err) {
      this.logger.error(
        'Failed to send recording-ready email.',
        err instanceof Error ? err.stack : String(err),
      );
    }
  }

  private renderText(title: string, url: string, expires: string): string {
    return [
      `The recording for "${title}" is ready.`,
      '',
      `Temporary access link: ${url}`,
      `This link expires on ${expires}.`,
      '',
      'Share this link with attendees. They will enter their name before viewing.',
    ].join('\n');
  }

  private renderHtml(title: string, url: string, expires: string): string {
    return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; color: #0f172a;">
    <h2 style="margin: 0 0 8px;">Your Zoom recording is ready</h2>
    <p style="margin: 0 0 16px; color: #475569;">The recording for <strong>${this.escape(title)}</strong> is ready to share.</p>
    <p style="margin: 0 0 24px;">
      <a href="${this.escape(url)}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 20px; border-radius: 8px; font-weight: 600;">Open recording</a>
    </p>
    <p style="margin: 0 0 4px; color: #475569; font-size: 14px;">Or copy this link:</p>
    <p style="margin: 0 0 24px; font-size: 14px; word-break: break-all;"><a href="${this.escape(url)}">${this.escape(url)}</a></p>
    <p style="margin: 0; color: #64748b; font-size: 13px;">This link expires on ${this.escape(expires)}. Attendees enter their name before viewing.</p>
  </div>`;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
