import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { PrismaModule } from './prisma/prisma.module';
import { ZoomModule } from './modules/zoom/zoom.module';
import { RecordingsModule } from './modules/recordings/recordings.module';
import { ShareLinksModule } from './modules/share-links/share-links.module';
import { EmailModule } from './modules/email/email.module';
import { AdminModule } from './modules/admin/admin.module';
import { PublicModule } from './modules/public/public.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    PrismaModule,
    ZoomModule,
    RecordingsModule,
    ShareLinksModule,
    EmailModule,
    AdminModule,
    PublicModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
