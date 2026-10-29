
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Validate a parent category.
   * Supports two levels:
   * Parent category -> Subcategory.
   */
  private async validateParentCategory(
    tenantId: string,
    restaurantId: string,
    parentId?: string | null,
    currentCategoryId?: string,
  ) {
    // No parent means this is a top-level category.
    if (!parentId) {
      return;
    }

    // A category cannot be its own parent.
    if (parentId === currentCategoryId) {
      throw new ConflictException(
        'A category cannot be its own parent',
      );
    }

    // Parent must belong to the same tenant and restaurant.
    // Deleted categories cannot be selected as parents.
    const parent = await this.prisma.category.findFirst({
      where: {
        id: parentId,
        tenantId,
        restaurantId,
        deletedAt: null,
      },
      select: {
        id: true,
        parentId: true,
      },
    });

    if (!parent) {
      throw new NotFoundException(
        'Parent category not found in this restaurant',
      );
    }

    // Prevent nesting a subcategory inside another subcategory.
    if (parent.parentId) {
      throw new ConflictException(
        'A subcategory cannot contain another subcategory',
      );
    }

    // Prevent moving a parent category under one of its descendants.
    const children = await this.prisma.category.findMany({
      where: {
        tenantId,
        restaurantId,
        deletedAt: null,
        parentId: currentCategoryId ?? '__no_current_category__',
      },
      select: {
        id: true,
      },
    });

    if (currentCategoryId && children.some((child) => child.id === parentId)) {
      throw new ConflictException(
        'A category cannot be moved under its own subcategory',
      );
    }
  }

  async create(
    tenantId: string,
    restaurantId: string,
    dto: CreateCategoryDto,
  ) {
    const restaurant = await this.prisma.restaurant.findFirst({
      where: {
        id: restaurantId,
        tenantId,
      },
    });

    if (!restaurant) {
      throw new NotFoundException(
        'Restaurant not found for this tenant',
      );
    }

    await this.validateParentCategory(
      tenantId,
      restaurantId,
      dto.parentId,
    );

    // Check for duplicate active category names.
    const existing = await this.prisma.category.findFirst({
      where: {
        tenantId,
        restaurantId,
        name: dto.name,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        `Category "${dto.name}" already exists in this restaurant`,
      );
    }

    return this.prisma.category.create({
      data: {
        ...dto,
        tenantId,
        restaurantId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(
    tenantId: string,
    restaurantId: string,
    includeDeleted = false,
  ) {
    return this.prisma.category.findMany({
      where: {
        tenantId,
        restaurantId,
        deletedAt: includeDeleted ? { not: null } : null,
      },
      include: {
        // Active menu items let the frontend display item counts.
        menuItems: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
          },
        },

        // Parent category details.
        parent: {
          select: {
            id: true,
            name: true,
          },
        },

        // Active subcategories.
        children: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            parentId: true,
            displayOrder: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });
  }

  async findOne(
    tenantId: string,
    restaurantId: string,
    id: string,
  ) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        tenantId,
        restaurantId,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            parentId: true,
            displayOrder: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(
    tenantId: string,
    restaurantId: string,
    id: string,
    dto: UpdateCategoryDto,
  ) {
    await this.findOne(tenantId, restaurantId, id);

    await this.validateParentCategory(
      tenantId,
      restaurantId,
      dto.parentId,
      id,
    );

    if (dto.name) {
      const duplicate = await this.prisma.category.findFirst({
        where: {
          tenantId,
          restaurantId,
          name: dto.name,
          NOT: {
            id,
          },
          deletedAt: null,
        },
      });

      if (duplicate) {
        throw new ConflictException(
          `Category "${dto.name}" already exists in this restaurant`,
        );
      }
    }

    return this.prisma.category.update({
      where: {
        id,
        tenantId,
        restaurantId,
      },
      data: dto,
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          },
        },
        children: {
          where: {
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
            parentId: true,
            displayOrder: true,
          },
          orderBy: {
            displayOrder: 'asc',
          },
        },
      },
    });
  }

  async remove(
    tenantId: string,
    restaurantId: string,
    id: string,
  ) {
    await this.findOne(tenantId, restaurantId, id);

    // Soft delete: retain the category and its data in the database.
    return this.prisma.category.update({
      where: {
        id,
        tenantId,
        restaurantId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async restore(
    tenantId: string,
    restaurantId: string,
    id: string,
  ) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        tenantId,
        restaurantId,
        deletedAt: {
          not: null,
        },
      },
    });

    if (!category) {
      throw new NotFoundException(
        'Category not found in trash',
      );
    }

    // Restore the category.
    return this.prisma.category.update({
      where: {
        id,
        tenantId,
        restaurantId,
      },
      data: {
        deletedAt: null,
      },
    });
  }

  async permanentDelete(
    tenantId: string,
    restaurantId: string,
    id: string,
  ) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        tenantId,
        restaurantId,
        deletedAt: {
          not: null,
        },
      },
    });

    if (!category) {
      throw new NotFoundException(
        'Deleted category not found in trash',
      );
    }

    return this.prisma.category.delete({
      where: {
        id,
        tenantId,
        restaurantId,
      },
    });
  }
}
