import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ZoomModule } from './modules/zoom/zoom.module';

@Module({
  imports: [ZoomModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
