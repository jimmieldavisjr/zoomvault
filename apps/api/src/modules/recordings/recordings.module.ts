import { Module } from '@nestjs/common';
import { RecordingsService } from './recordings.service';
import { ShareLinksModule } from '../share-links/share-links.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [ShareLinksModule, EmailModule],
  providers: [RecordingsService],
  exports: [RecordingsService],
})
export class RecordingsModule {}
