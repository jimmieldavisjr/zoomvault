import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Liveness/readiness probe. Returns `{ status: 'ok' }` and reports whether the
   * database is reachable. Used by Railway health checks and uptime monitors.
   */
  @Get()
  async check() {
    let database = 'ok';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'unavailable';
    }
    return { status: 'ok', database, timestamp: new Date().toISOString() };
  }
}
