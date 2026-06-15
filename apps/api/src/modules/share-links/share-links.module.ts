import { Module } from '@nestjs/common';
import { ShareLinksService } from './share-links.service';

@Module({
  providers: [ShareLinksService],
  exports: [ShareLinksService],
})
export class ShareLinksModule {}
