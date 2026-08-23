import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { MenuItemService } from './menu-item.service';
import { MenuItemController } from './menu-item.controller';
import { ModifierGroupService } from './modifier-group.service';
import { ModifierGroupController } from './modifier-group.controller';

@Module({
  controllers: [CategoryController, MenuItemController, ModifierGroupController],
  providers: [CategoryService, MenuItemService, ModifierGroupService],
  exports: [CategoryService, MenuItemService, ModifierGroupService],
})
export class MenuModule {}
