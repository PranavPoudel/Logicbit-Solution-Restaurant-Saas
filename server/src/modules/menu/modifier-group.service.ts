import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateModifierGroupDto } from './dto/create-modifier-group.dto';
import { UpdateModifierGroupDto } from './dto/update-modifier-group.dto';
import { CreateModifierOptionDto } from './dto/create-modifier-option.dto';
import { UpdateModifierOptionDto } from './dto/update-modifier-option.dto';

@Injectable()
export class ModifierGroupService {
  constructor(private readonly prisma: PrismaService) {}

  // ---------- ModifierGroup CRUD ----------

  async create(tenantId: string, restaurantId: string, dto: CreateModifierGroupDto) {
    const existing = await this.prisma.modifierGroup.findFirst({ where: { tenantId, restaurantId, name: dto.name } });
    if (existing) throw new ConflictException(`Modifier group "${dto.name}" already exists`);
    return this.prisma.modifierGroup.create({ data: { ...dto, tenantId, restaurantId } });
  }

  async findAll(tenantId: string, restaurantId: string) {
    return this.prisma.modifierGroup.findMany({
      where: { tenantId, restaurantId },
      orderBy: { displayOrder: 'asc' },
      include: { options: { orderBy: { displayOrder: 'asc' } } },
    });
  }

  async findOne(tenantId: string, restaurantId: string, id: string) {
    const group = await this.prisma.modifierGroup.findFirst({
      where: { id, tenantId, restaurantId },
      include: { options: { orderBy: { displayOrder: 'asc' } } },
    });
    if (!group) throw new NotFoundException('Modifier group not found');
    return group;
  }

  async update(tenantId: string, restaurantId: string, id: string, dto: UpdateModifierGroupDto) {
    await this.findOne(tenantId, restaurantId, id);
    await this.prisma.modifierGroup.updateMany({ where: { id, tenantId, restaurantId }, data: dto });
    return this.findOne(tenantId, restaurantId, id);
  }

  async remove(tenantId: string, restaurantId: string, id: string) {
    await this.findOne(tenantId, restaurantId, id);
    await this.prisma.modifierOption.deleteMany({ where: { modifierGroupId: id } });
    await this.prisma.menuItemModifierGroup.deleteMany({ where: { modifierGroupId: id } });
    await this.prisma.modifierGroup.deleteMany({ where: { id, tenantId, restaurantId } });
    return { message: 'Modifier group deleted successfully' };
  }

  // ---------- ModifierOption CRUD (group भित्रको sub-resource) ----------

  async addOption(tenantId: string, restaurantId: string, groupId: string, dto: CreateModifierOptionDto) {
    await this.findOne(tenantId, restaurantId, groupId);
    return this.prisma.modifierOption.create({ data: { ...dto, tenantId, modifierGroupId: groupId } });
  }

  async updateOption(tenantId: string, restaurantId: string, groupId: string, optionId: string, dto: UpdateModifierOptionDto) {
    await this.findOne(tenantId, restaurantId, groupId);
    const option = await this.prisma.modifierOption.findFirst({ where: { id: optionId, modifierGroupId: groupId, tenantId } });
    if (!option) throw new NotFoundException('Modifier option not found');

    await this.prisma.modifierOption.updateMany({ where: { id: optionId, modifierGroupId: groupId, tenantId }, data: dto });
    return this.prisma.modifierOption.findFirst({ where: { id: optionId } });
  }

  async removeOption(tenantId: string, restaurantId: string, groupId: string, optionId: string) {
    await this.findOne(tenantId, restaurantId, groupId);
    await this.prisma.modifierOption.deleteMany({ where: { id: optionId, modifierGroupId: groupId, tenantId } });
    return { message: 'Modifier option deleted successfully' };
  }

  // ---------- MenuItem <-> ModifierGroup Link (Many-to-Many) ----------

  async linkToMenuItem(tenantId: string, restaurantId: string, groupId: string, menuItemId: string) {
    await this.findOne(tenantId, restaurantId, groupId);

    const menuItem = await this.prisma.menuItem.findFirst({ where: { id: menuItemId, tenantId, restaurantId, deletedAt: null } });
    if (!menuItem) throw new NotFoundException('Menu item not found for this restaurant');

    const existing = await this.prisma.menuItemModifierGroup.findFirst({ where: { menuItemId, modifierGroupId: groupId } });
    if (existing) throw new ConflictException('This modifier group is already linked to this menu item');

    return this.prisma.menuItemModifierGroup.create({ data: { menuItemId, modifierGroupId: groupId } });
  }

  async unlinkFromMenuItem(tenantId: string, restaurantId: string, groupId: string, menuItemId: string) {
    await this.findOne(tenantId, restaurantId, groupId);
    await this.prisma.menuItemModifierGroup.deleteMany({ where: { menuItemId, modifierGroupId: groupId } });
    return { message: 'Modifier group unlinked from menu item' };
  }
}
