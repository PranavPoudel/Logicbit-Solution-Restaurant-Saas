import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCityDto, UpdateCityDto } from './dto/city.dto';

const ORDER = [{ displayOrder: 'asc' as const }, { name: 'asc' as const }];

@Injectable()
export class CityService {
  constructor(private readonly prisma: PrismaService) {}

  findAllActive() {
    return this.prisma.city.findMany({ where: { isActive: true }, orderBy: ORDER });
  }

  findAll() {
    return this.prisma.city.findMany({ orderBy: ORDER });
  }

  async create(dto: CreateCityDto) {
    const country = dto.country.toUpperCase();
    const existing = await this.prisma.city.findUnique({ where: { name_country: { name: dto.name, country } } });
    if (existing) throw new ConflictException(`City "${dto.name}" already exists for ${country}`);
    return this.prisma.city.create({ data: { ...dto, country } });
  }

  async update(id: string, dto: UpdateCityDto) {
    const city = await this.prisma.city.findUnique({ where: { id } });
    if (!city) throw new NotFoundException('City not found');
    return this.prisma.city.update({ where: { id }, data: { ...dto, country: dto.country?.toUpperCase() } });
  }

  async remove(id: string) {
    const city = await this.prisma.city.findUnique({ where: { id } });
    if (!city) throw new NotFoundException('City not found');
    await this.prisma.city.delete({ where: { id } });
    return { message: 'City deleted' };
  }
}
