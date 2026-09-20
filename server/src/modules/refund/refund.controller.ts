import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { RefundService } from './refund.service';
import { ProcessRefundDto } from './dto/process-refund.dto';

@Controller('api/v1/refunds')
export class RefundController {
  constructor(private readonly refundService: RefundService) {}

  @Get('pending')
  getPendingRefunds() {
    return this.refundService.getPendingRefunds();
  }

  @Patch(':id/process')
  processRefund(@Param('id') id: string, @Body() dto: ProcessRefundDto) {
    return this.refundService.processRefund(id, dto);
  }
}