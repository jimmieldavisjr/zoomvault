import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { ShareLinksModule } from '../share-links/share-links.module';

@Module({
  imports: [ShareLinksModule],
  controllers: [PublicController],
})
export class PublicModule {}
