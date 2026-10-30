import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProcessRefundDto } from './dto/process-refund.dto';
import { RefundStatus } from '@prisma/client';

@Injectable()
export class RefundService {
  constructor(private readonly prisma: PrismaService) {}

  async getPendingRefunds() {
    return this.prisma.refund.findMany({
      where: { status: RefundStatus.PENDING },
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            orderNumber: true,
            total: true,
            paymentMethod: true,
            customer: { select: { name: true, email: true } },
            restaurant: { select: { name: true } }
          }
        }
      }
    });
  }

  async processRefund(id: string, dto: ProcessRefundDto) {
    const refund = await this.prisma.refund.findUnique({ where: { id } });
    
    if (!refund) {
      throw new NotFoundException(`Refund with ID ${id} not found`);
    }

    const isProcessing = dto.status === RefundStatus.PROCESSED;

    return this.prisma.refund.update({
      where: { id },
      data: {
        status: dto.status,
        reason: dto.reason !== undefined ? dto.reason : refund.reason,
        processedAt: isProcessing ? new Date() : refund.processedAt,
      },
    });
  }
}