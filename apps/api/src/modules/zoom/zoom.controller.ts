import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { ZoomService } from './zoom.service';
import type {
  ZoomUrlValidationPayload,
  ZoomWebhookEvent,
} from './dto/zoom-webhook-event.dto';

/**
 * Public webhook receiver for Zoom events.
 *
 * Production URL: https://api.zoomvault.jdtechpartners.com/zoom/webhook
 *
 * Requires `ZOOM_WEBHOOK_SECRET_TOKEN` to be set in the environment, and the
 * application bootstrapped with `{ rawBody: true }` so the HMAC signature can
 * be computed over the exact bytes Zoom sent.
 */
@Controller('zoom')
export class ZoomController {
  private readonly logger = new Logger(ZoomController.name);

  constructor(private readonly zoomService: ZoomService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: ZoomWebhookEvent,
    @Headers('x-zm-signature') signature?: string,
    @Headers('x-zm-request-timestamp') timestamp?: string,
  ) {
    // CRC handshake: Zoom sends this when you click "Validate" on the endpoint
    // URL or send a test event. It must be echoed back immediately and is not
    // signed, so it is handled before the signature gate.
    if (body?.event === 'endpoint.url_validation') {
      const { plainToken } = body.payload as unknown as ZoomUrlValidationPayload;
      this.logger.log('Responding to Zoom CRC url_validation challenge.');
      return this.zoomService.buildCrcResponse(plainToken);
    }

    // Verify every real event against the raw request body.
    const rawBody = req.rawBody?.toString('utf8') ?? '';
    if (!this.zoomService.verifySignature(rawBody, signature, timestamp)) {
      this.logger.warn('Rejected Zoom webhook with invalid signature.');
      throw new UnauthorizedException('Invalid Zoom webhook signature.');
    }

    // Delegate verified events to the service router. `recording.completed`
    // is persisted (idempotently) and triggers share-link + email side effects.
    await this.zoomService.routeEvent(body);

    return { received: true };
  }
}
