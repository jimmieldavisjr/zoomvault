-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "recordings" (
    "id" TEXT NOT NULL,
    "zoom_meeting_id" TEXT NOT NULL,
    "zoom_meeting_uuid" TEXT NOT NULL,
    "zoom_account_id" TEXT,
    "host_id" TEXT,
    "topic" TEXT,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "duration_minutes" INTEGER,
    "recording_count" INTEGER,
    "raw_payload_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recordings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recording_files" (
    "id" TEXT NOT NULL,
    "recording_id" TEXT NOT NULL,
    "zoom_file_id" TEXT NOT NULL,
    "file_type" TEXT,
    "file_extension" TEXT,
    "file_size" BIGINT,
    "recording_type" TEXT,
    "play_url" TEXT,
    "download_url" TEXT,
    "status" TEXT,
    "recording_start" TIMESTAMP(3),
    "recording_end" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recording_files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL,
    "recording_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" TEXT NOT NULL,
    "share_link_id" TEXT NOT NULL,
    "recording_id" TEXT NOT NULL,
    "attendee_name" TEXT,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "accessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recordings_zoom_meeting_uuid_key" ON "recordings"("zoom_meeting_uuid");

-- CreateIndex
CREATE INDEX "recordings_zoom_meeting_id_idx" ON "recordings"("zoom_meeting_id");

-- CreateIndex
CREATE UNIQUE INDEX "recording_files_zoom_file_id_key" ON "recording_files"("zoom_file_id");

-- CreateIndex
CREATE INDEX "recording_files_recording_id_idx" ON "recording_files"("recording_id");

-- CreateIndex
CREATE UNIQUE INDEX "share_links_token_hash_key" ON "share_links"("token_hash");

-- CreateIndex
CREATE INDEX "share_links_recording_id_idx" ON "share_links"("recording_id");

-- CreateIndex
CREATE INDEX "access_logs_share_link_id_idx" ON "access_logs"("share_link_id");

-- CreateIndex
CREATE INDEX "access_logs_recording_id_idx" ON "access_logs"("recording_id");

-- AddForeignKey
ALTER TABLE "recording_files" ADD CONSTRAINT "recording_files_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "recordings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "recordings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_share_link_id_fkey" FOREIGN KEY ("share_link_id") REFERENCES "share_links"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_recording_id_fkey" FOREIGN KEY ("recording_id") REFERENCES "recordings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
