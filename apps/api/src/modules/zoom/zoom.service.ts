import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  ZoomUrlValidationResponse,
  ZoomWebhookEvent,
} from './dto/zoom-webhook-event.dto';
import { RecordingsService } from '../recordings/recordings.service';
import type { ZoomRecordingCompletedEvent } from '../recordings/dto/recording-completed.dto';
import type { AppConfig } from '../../config/configuration';

@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);

  constructor(
    private readonly config: ConfigService<AppConfig, true>,
    private readonly recordings: RecordingsService,
  ) {}

  /**
   * Secret Token from the Zoom app's "Feature" -> "Event Subscriptions" page.
   * Set `ZOOM_WEBHOOK_SECRET_TOKEN` in the environment before going live.
   */
  private get secretToken(): string {
    const token = this.config.get('zoomWebhookSecretToken', { infer: true });
    if (!token) {
      this.logger.warn(
        'ZOOM_WEBHOOK_SECRET_TOKEN is not set; signature verification and CRC will fail.',
      );
    }
    return token ?? '';
  }

  /**
   * Verifies a Zoom webhook signature.
   *
   * Zoom computes the signature as:
   *   v0=HMAC_SHA256("v0:" + timestamp + ":" + rawBody, secretToken)
   * sent in the `x-zm-signature` header alongside `x-zm-request-timestamp`.
   */
  verifySignature(
    rawBody: string,
    signature?: string,
    timestamp?: string,
  ): boolean {
    if (!signature || !timestamp || !this.secretToken) {
      return false;
    }

    const message = `v0:${timestamp}:${rawBody}`;
    const expected = `v0=${createHmac('sha256', this.secretToken)
      .update(message)
      .digest('hex')}`;

    const expectedBuffer = Buffer.from(expected);
    const actualBuffer = Buffer.from(signature);

    // Length check guards timingSafeEqual, which throws on mismatched sizes.
    if (expectedBuffer.length !== actualBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, actualBuffer);
  }

  /**
   * Builds the CRC handshake response Zoom expects when validating the
   * endpoint URL or sending a test event.
   *
   *   encryptedToken = HMAC_SHA256(plainToken, secretToken)
   */
  buildCrcResponse(plainToken: string): ZoomUrlValidationResponse {
    const encryptedToken = createHmac('sha256', this.secretToken)
      .update(plainToken)
      .digest('hex');

    return { plainToken, encryptedToken };
  }

  /**
   * Routes a verified Zoom event to the appropriate handler.
   *
   * Throwing here causes the controller to return a 5xx, which makes Zoom retry
   * the delivery. That's safe because downstream processing is idempotent, so a
   * transient DB/email blip self-heals on the retry.
   */
  async routeEvent(event: ZoomWebhookEvent): Promise<void> {
    switch (event.event) {
      case 'recording.completed':
        this.logger.log(`Received recording.completed at ${event.event_ts}`);
        await this.recordings.processRecordingCompleted(
          event as unknown as ZoomRecordingCompletedEvent,
        );
        break;

      // TODO: handle meeting lifecycle events.
      case 'meeting.started':
      case 'meeting.ended':
        this.logger.log(`Received ${event.event} at ${event.event_ts}`);
        break;

      default:
        this.logger.debug(`Unhandled Zoom event: ${event.event}`);
        break;
    }
  }
}
