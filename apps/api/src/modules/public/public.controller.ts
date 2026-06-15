import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ShareLinksService } from '../share-links/share-links.service';
import { SubmitAccessDto } from './dto/submit-access.dto';

/**
 * Public, unauthenticated endpoints used by the attendee viewer page.
 * Access is controlled entirely by possession of a valid, unexpired token.
 */
@Controller('public/share-links')
export class PublicController {
  constructor(private readonly shareLinks: ShareLinksService) {}

  /**
   * Returns sanitized recording metadata + playable files for a valid token.
   * Responds 404 (unknown), 403 (disabled) or 410 (expired) otherwise so the
   * frontend can show the right page.
   */
  @Get(':token')
  getByToken(@Param('token') token: string) {
    return this.shareLinks.getPublicRecordingByToken(token);
  }

  /** Logs an attendee opening the recording. Validates the token first. */
  @Post(':token/access')
  @HttpCode(HttpStatus.CREATED)
  submitAccess(
    @Param('token') token: string,
    @Body() body: SubmitAccessDto,
    @Req() request: Request,
  ) {
    return this.shareLinks.logAccess(token, {
      attendeeName: body.attendeeName,
      ipAddress: request.ip,
      userAgent: request.header('user-agent') ?? undefined,
    });
  }
}
