import { Controller, Post, Delete, Param, UseGuards, UseInterceptors, UploadedFile, Req, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MediaService } from './media.service';

@ApiTags('Media (Owner)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@Req() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const restaurantId = req.body?.restaurantId;
    return this.mediaService.upload(req.user.tenantId, restaurantId, file);
  }

  @Delete(':id')
  remove(@Req() req, @Param('id') id: string) {
    return this.mediaService.remove(req.user.tenantId, id);
  }
}
