import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RefundService } from './refund.service';
import { ProcessRefundDto } from './dto/process-refund.dto';
import { PlatformStaffJwtAuthGuard } from '../platform-auth/guards/platform-staff-jwt-auth.guard';
import { PlatformPermissionGuard } from '../platform-auth/guards/platform-permission.guard';
import { RequirePlatformPermission } from '../platform-auth/decorators/require-permission.decorator';

@ApiTags('Refunds - Platform Admin')
@ApiBearerAuth()
@UseGuards(PlatformStaffJwtAuthGuard, PlatformPermissionGuard)
@Controller('api/v1/refunds')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Get('pending')
  @RequirePlatformPermission('PROCESS_REFUNDS')
  getPendingRefunds() {
    return this.refundService.getPendingRefunds();
  }

  @Patch(':id/process')
  @RequirePlatformPermission('PROCESS_REFUNDS')
  processRefund(@Param('id') id: string, @Body() dto: ProcessRefundDto) {
    return this.refundService.processRefund(id, dto);
  }
}
