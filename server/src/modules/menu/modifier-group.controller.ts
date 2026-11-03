import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AllowWithoutPlan, SubscriptionActiveGuard } from '../subscription/guards/subscription-active.guard';
import { ModifierGroupService } from './modifier-group.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto';
import { UpdateModifierOptionDto } from './dto/update-modifier-option.dto';

@ApiTags('Menu - ModifierGroup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SubscriptionActiveGuard)
@AllowWithoutPlan()
@Controller('api/v1/restaurants/:restaurantId/modifier-groups')
export class ModifierGroupController {
  constructor(private readonly modifierGroupService: ModifierGroupService) {}

  @Post()
  create(@Req() req, @Param('restaurantId') restaurantId: string, @Body() dto: CreateModifierGroupDto) {
    return this.modifierGroupService.create(req.user.tenantId, restaurantId, dto);
  }

  @Get()
  findAll(@Req() req, @Param('restaurantId') restaurantId: string) {
    return this.modifierGroupService.findAll(req.user.tenantId, restaurantId);
  }

  @Get(':id')
  findOne(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.modifierGroupService.findOne(req.user.tenantId, restaurantId, id);
  }

  @Patch(':id')
  update(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string, @Body() dto: UpdateModifierGroupDto) {
    return this.modifierGroupService.update(req.user.tenantId, restaurantId, id, dto);
  }

  @Delete(':id')
  remove(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string) {
    return this.modifierGroupService.remove(req.user.tenantId, restaurantId, id);
  }

  // ---- Options ----
  @Post(':id/options')
  addOption(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string, @Body() dto: CreateModifierOptionDto) {
    return this.modifierGroupService.addOption(req.user.tenantId, restaurantId, id, dto);
  }

  @Patch(':id/options/:optionId')
  updateOption(
    @Req() req,
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Param('optionId') optionId: string,
    @Body() dto: UpdateModifierOptionDto,
  ) {
    return this.modifierGroupService.updateOption(req.user.tenantId, restaurantId, id, optionId, dto);
  }

  @Delete(':id/options/:optionId')
  removeOption(@Req() req, @Param('restaurantId') restaurantId: string, @Param('id') id: string, @Param('optionId') optionId: string) {
    return this.modifierGroupService.removeOption(req.user.tenantId, restaurantId, id, optionId);
  }

  // ---- MenuItem Link (Many-to-Many) ----
  @Post(':id/menu-items/:menuItemId')
  linkToMenuItem(
    @Req() req,
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Param('menuItemId') menuItemId: string,
  ) {
    return this.modifierGroupService.linkToMenuItem(req.user.tenantId, restaurantId, id, menuItemId);
  }

  @Delete(':id/menu-items/:menuItemId')
  unlinkFromMenuItem(
    @Req() req,
    @Param('restaurantId') restaurantId: string,
    @Param('id') id: string,
    @Param('menuItemId') menuItemId: string,
  ) {
    return this.modifierGroupService.unlinkFromMenuItem(req.user.tenantId, restaurantId, id, menuItemId);
  }
}
