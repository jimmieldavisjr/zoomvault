import {
  ForbiddenException,
  GoneException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, createHash } from 'node:crypto';
import type { ShareLink } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AppConfig } from '../../config/configuration';

export interface CreatedShareLink {
  shareLink: ShareLink;
  /** Raw token — returned exactly once, shown to the admin, never persisted. */
  token: string;
  /** Full public watch URL the admin can copy and share. */
  url: string;
}

/** Recording shape exposed to the public viewer — no download URLs. */
export interface PublicRecording {
  topic: string | null;
  startTime: Date | null;
  durationMinutes: number | null;
  expiresAt: Date;
  files: Array<{
    id: string;
    recordingType: string | null;
    fileType: string | null;
    playUrl: string | null;
  }>;
}

@Injectable()
export class ShareLinksService {
  private readonly logger = new Logger(ShareLinksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /**
   * Hashes a raw token for storage/lookup. We persist only the hash so a DB
   * leak can't be turned into working share links.
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildWatchUrl(token: string): string {
    const base = this.config.get('appPublicUrl', { infer: true });
    return `${base.replace(/\/$/, '')}/watch/${token}`;
  }

  /**
   * Creates a new active share link for a recording.
   *
   * @param expirationDays overrides DEFAULT_LINK_EXPIRATION_DAYS when provided.
   */
  async createForRecording(
    recordingId: string,
    expirationDays?: number,
  ): Promise<CreatedShareLink> {
    const recording = await this.prisma.recording.findUnique({
      where: { id: recordingId },
      select: { id: true },
    });
    if (!recording) {
      throw new NotFoundException('Recording not found.');
    }

    const days =
      expirationDays && expirationDays > 0
        ? expirationDays
        : this.config.get('defaultLinkExpirationDays', { infer: true });

    // 24 random bytes -> 32-char URL-safe token. Plenty of entropy, not stored.
    const token = randomBytes(24).toString('base64url');
    const tokenHash = this.hashToken(token);
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    const shareLink = await this.prisma.shareLink.create({
      data: { recordingId, tokenHash, expiresAt, isActive: true },
    });

    this.logger.log(
      `Created share link ${shareLink.id} for recording ${recordingId} (expires ${expiresAt.toISOString()}).`,
    );

    return { shareLink, token, url: this.buildWatchUrl(token) };
  }

  /**
   * Returns the active, non-expired share link for a recording, or null.
   * Used to avoid creating duplicate links on the automated webhook path.
   */
  async findActiveForRecording(recordingId: string): Promise<ShareLink | null> {
    return this.prisma.shareLink.findFirst({
      where: { recordingId, isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Resolves a raw token to its share link, enforcing active + not expired. */
  private async resolveActiveLink(token: string) {
    const tokenHash = this.hashToken(token);
    const link = await this.prisma.shareLink.findUnique({
      where: { tokenHash },
    });

    if (!link) {
      throw new NotFoundException('Share link not found.');
    }
    if (!link.isActive) {
      throw new ForbiddenException('This share link has been disabled.');
    }
    if (link.expiresAt.getTime() <= Date.now()) {
      throw new GoneException('This share link has expired.');
    }
    return link;
  }

  /**
   * Loads the sanitized recording for a valid public token. Throws 404/403/410
   * for unknown/disabled/expired links so the frontend can route accordingly.
   */
  async getPublicRecordingByToken(token: string): Promise<PublicRecording> {
    const link = await this.resolveActiveLink(token);
    const recording = await this.prisma.recording.findUnique({
      where: { id: link.recordingId },
      include: { files: true },
    });
    if (!recording) {
      throw new NotFoundException('Recording not found.');
    }

    return {
      topic: recording.topic,
      startTime: recording.startTime,
      durationMinutes: recording.durationMinutes,
      expiresAt: link.expiresAt,
      // Only expose playable files and never the download URL.
      files: recording.files
        .filter((file) => file.playUrl)
        .map((file) => ({
          id: file.id,
          recordingType: file.recordingType,
          fileType: file.fileType,
          playUrl: file.playUrl,
        })),
    };
  }

  /**
   * Records a viewer access against a valid token and returns the share link.
   * Validation happens first so logs only capture genuine, allowed access.
   */
  async logAccess(
    token: string,
    details: { attendeeName?: string; ipAddress?: string; userAgent?: string },
  ): Promise<{ ok: true }> {
    const link = await this.resolveActiveLink(token);

    await this.prisma.accessLog.create({
      data: {
        shareLinkId: link.id,
        recordingId: link.recordingId,
        attendeeName: details.attendeeName?.slice(0, 200) ?? null,
        ipAddress: details.ipAddress ?? null,
        userAgent: details.userAgent?.slice(0, 500) ?? null,
      },
    });

    return { ok: true };
  }
}
