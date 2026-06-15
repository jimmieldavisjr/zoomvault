import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminAccessGuard } from './admin-access.guard';
import { RecordingsModule } from '../recordings/recordings.module';
import { ShareLinksModule } from '../share-links/share-links.module';

@Module({
  imports: [RecordingsModule, ShareLinksModule],
  controllers: [AdminController],
  providers: [AdminAccessGuard],
})
export class AdminModule {}
