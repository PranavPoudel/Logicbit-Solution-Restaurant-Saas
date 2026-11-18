import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SaveUberDirectDto } from './uber-direct-settings.dto';
import { UberDirectAccountService } from './uber-direct-account.service';

@ApiTags('Restaurant (Owner) - Uber Direct')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/v1/restaurants/:id/uber-direct')
export class UberDirectSettingsController {
  constructor(private readonly accounts: UberDirectAccountService) {}

  /** Whether an Uber Direct account is saved, plus the webhook address to give Uber. The secrets are never returned. */
  @Get()
  status(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.accounts.status(req.user.tenantId, id);
  }

  @Put()
  save(@Req() req, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SaveUberDirectDto) {
    return this.accounts.save(req.user.tenantId, id, req.user.id, req.user.isSuperAdmin === true, dto);
  }

  @Delete()
  remove(@Req() req, @Param('id', ParseUUIDPipe) id: string) {
    return this.accounts.remove(req.user.tenantId, id, req.user.id, req.user.isSuperAdmin === true);
  }
}
