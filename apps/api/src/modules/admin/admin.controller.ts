import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminAccessGuard } from './admin-access.guard';
import { CreateShareLinkDto } from './dto/create-share-link.dto';
import { RecordingsService } from '../recordings/recordings.service';
import { ShareLinksService } from '../share-links/share-links.service';

/**
 * Admin-only endpoints, all gated by the shared admin access code.
 * @see AdminAccessGuard
 */
@Controller('admin')
@UseGuards(AdminAccessGuard)
export class AdminController {
  constructor(
    private readonly recordings: RecordingsService,
    private readonly shareLinks: ShareLinksService,
  ) {}

  /** Lets the login page verify a code without fetching data. */
  @Get('session')
  verifySession() {
    return { ok: true };
  }

  @Get('recordings')
  listRecordings() {
    return this.recordings.findAll();
  }

  @Get('recordings/:id')
  async getRecording(@Param('id') id: string) {
    const recording = await this.recordings.findById(id);
    if (!recording) {
      throw new NotFoundException('Recording not found.');
    }
    return recording;
  }

  /**
   * Manually create (or regenerate) a share link for a recording. Returns the
   * raw token + watch URL exactly once — it is never retrievable again.
   */
  @Post('recordings/:id/share-links')
  async createShareLink(
    @Param('id') id: string,
    @Body() body: CreateShareLinkDto,
  ) {
    const created = await this.shareLinks.createForRecording(
      id,
      body.expirationDays,
    );
    return {
      id: created.shareLink.id,
      url: created.url,
      token: created.token,
      expiresAt: created.shareLink.expiresAt,
      isActive: created.shareLink.isActive,
    };
  }
}
