import { Injectable, Logger } from '@nestjs/common';
import type { Prisma, Recording } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ShareLinksService } from '../share-links/share-links.service';
import { EmailService } from '../email/email.service';
import type {
  ZoomRecordingCompletedEvent,
  ZoomRecordingFile,
} from './dto/recording-completed.dto';

export interface IngestResult {
  recording: Recording;
  /** True when this delivery created a new row (vs. a Zoom retry/update). */
  created: boolean;
}

@Injectable()
export class RecordingsService {
  private readonly logger = new Logger(RecordingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly shareLinks: ShareLinksService,
    private readonly email: EmailService,
  ) {}

  /**
   * End-to-end handler for a verified `recording.completed` event:
   *   persist metadata (idempotent) -> ensure one active share link ->
   *   email the admin (only for genuinely new recordings).
   *
   * Designed to be safe to call repeatedly: Zoom retries won't create duplicate
   * recordings, duplicate links, or duplicate emails.
   */
  async processRecordingCompleted(
    event: ZoomRecordingCompletedEvent,
  ): Promise<void> {
    const { recording, created } = await this.ingestRecordingCompleted(event);

    // One link per recording (per product decision). Reuse an existing active
    // link so retries don't mint new tokens.
    const existingLink = await this.shareLinks.findActiveForRecording(
      recording.id,
    );
    const link =
      existingLink ?? (await this.shareLinks.createForRecording(recording.id));

    // Only notify on first creation to avoid spamming the admin on retries.
    if (created && 'url' in link) {
      await this.email.sendRecordingReadyToAdmin({
        topic: recording.topic,
        watchUrl: link.url,
        expiresAt: link.shareLink.expiresAt,
      });
    }
  }

  /**
   * Persists a `recording.completed` event.
   *
   * Idempotent: keyed on the meeting UUID (and per-file Zoom file id) so Zoom's
   * automatic webhook retries never create duplicate rows.
   */
  async ingestRecordingCompleted(
    event: ZoomRecordingCompletedEvent,
  ): Promise<IngestResult> {
    const object = event.payload?.object;
    if (!object?.uuid) {
      throw new Error('recording.completed payload missing object.uuid');
    }

    const startTime = object.start_time ? new Date(object.start_time) : null;
    const endTime =
      startTime && typeof object.duration === 'number'
        ? new Date(startTime.getTime() + object.duration * 60_000)
        : null;

    const existing = await this.prisma.recording.findUnique({
      where: { zoomMeetingUuid: object.uuid },
      select: { id: true },
    });

    const data: Prisma.RecordingUncheckedCreateInput = {
      zoomMeetingId: String(object.id),
      zoomMeetingUuid: object.uuid,
      zoomAccountId: object.account_id ?? event.payload?.account_id ?? null,
      hostId: object.host_id ?? null,
      topic: object.topic ?? null,
      startTime,
      endTime,
      durationMinutes:
        typeof object.duration === 'number' ? object.duration : null,
      recordingCount:
        typeof object.recording_count === 'number'
          ? object.recording_count
          : (object.recording_files?.length ?? null),
      // Stored for debugging/replay. Contains Zoom download URLs — backend only.
      rawPayloadJson: event as unknown as Prisma.InputJsonValue,
    };

    const recording = await this.prisma.recording.upsert({
      where: { zoomMeetingUuid: object.uuid },
      create: data,
      update: data,
    });

    await this.upsertFiles(recording.id, object.recording_files ?? []);

    const created = !existing;
    this.logger.log(
      `${created ? 'Stored new' : 'Updated existing'} recording ${recording.id} (uuid=${object.uuid}, files=${object.recording_files?.length ?? 0}).`,
    );

    return { recording, created };
  }

  private async upsertFiles(
    recordingId: string,
    files: ZoomRecordingFile[],
  ): Promise<void> {
    for (const file of files) {
      if (!file.id) continue;
      const fileData: Prisma.RecordingFileUncheckedCreateInput = {
        recordingId,
        zoomFileId: file.id,
        fileType: file.file_type ?? null,
        fileExtension: file.file_extension ?? null,
        fileSize:
          typeof file.file_size === 'number' ? BigInt(file.file_size) : null,
        recordingType: file.recording_type ?? null,
        playUrl: file.play_url ?? null,
        downloadUrl: file.download_url ?? null,
        status: file.status ?? null,
        recordingStart: file.recording_start
          ? new Date(file.recording_start)
          : null,
        recordingEnd: file.recording_end
          ? new Date(file.recording_end)
          : null,
      };

      await this.prisma.recordingFile.upsert({
        where: { zoomFileId: file.id },
        create: fileData,
        update: fileData,
      });
    }
  }

  /** Admin list view — newest first, with lightweight counts. */
  findAll() {
    return this.prisma.recording.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { files: true, shareLinks: true, accessLogs: true } },
      },
    });
  }

  /** Admin detail view — includes files, share links and recent access logs. */
  findById(id: string) {
    return this.prisma.recording.findUnique({
      where: { id },
      include: {
        files: true,
        shareLinks: { orderBy: { createdAt: 'desc' } },
        accessLogs: { orderBy: { accessedAt: 'desc' }, take: 100 },
      },
    });
  }
}
