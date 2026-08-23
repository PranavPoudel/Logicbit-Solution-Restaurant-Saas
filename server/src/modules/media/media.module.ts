import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';

@Module({
  imports: [MulterModule.register({ storage: undefined })], // memoryStorage default — service मा buffer बाट सुरक्षित नाम दिएर लेखिन्छ
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
