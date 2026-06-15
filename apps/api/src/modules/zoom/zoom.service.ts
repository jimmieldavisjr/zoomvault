import { Injectable, Logger } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
import {
  ZoomUrlValidationResponse,
  ZoomWebhookEvent,
} from './dto/zoom-webhook-event.dto';

@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);

  /**
   * Secret Token from the Zoom app's "Feature" -> "Event Subscriptions" page.
   * Set `ZOOM_WEBHOOK_SECRET_TOKEN` in the environment before going live.
   */
  private get secretToken(): string {
    const token = process.env.ZOOM_WEBHOOK_SECRET_TOKEN;
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
   * This is intentionally a stub: add real handling per event type as the
   * integration grows.
   */
  routeEvent(event: ZoomWebhookEvent): void {
    switch (event.event) {
      // TODO: handle cloud recording completion (download, store, index).
      case 'recording.completed':
        this.logger.log(`Received recording.completed at ${event.event_ts}`);
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
