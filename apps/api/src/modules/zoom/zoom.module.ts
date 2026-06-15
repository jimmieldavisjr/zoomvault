import { Module } from '@nestjs/common';
import { ZoomController } from './zoom.controller';
import { ZoomService } from './zoom.service';
import { RecordingsModule } from '../recordings/recordings.module';

@Module({
  imports: [RecordingsModule],
  controllers: [ZoomController],
  providers: [ZoomService],
  exports: [ZoomService],
})
export class ZoomModule {}
