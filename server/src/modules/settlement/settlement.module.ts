import { Module } from '@nestjs/common';
import { SettlementService } from './settlement.service';
import { SettlementController, PlatformSettlementController } from './settlement.controller';

@Module({
  controllers: [SettlementController, PlatformSettlementController],
  providers: [SettlementService],
})
export class SettlementModule {}
