import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Thin wrapper around the generated Prisma client so it participates in the
 * Nest lifecycle (connect on boot, disconnect on shutdown) and can be injected
 * anywhere via DI.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Connected to PostgreSQL.');
    } catch (error) {
      // Don't crash the whole app if the DB is briefly unavailable on boot; the
      // first query will surface a clear error instead.
      this.logger.error(
        'Failed to connect to PostgreSQL on startup. Check DATABASE_URL.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
