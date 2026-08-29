import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, InviteStaffDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * register()
   * एकैचोटि Tenant + Owner User + Restaurant (default OWNER role सहित) बनाउँछ।
   * यो नै multi-tenant SaaS को "onboarding" entry point हो।
   */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const slug = this.slugify(dto.restaurantName);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: `${dto.restaurantName} Tenant` },
      });

      const ownerRole = await tx.role.create({
        data: { tenantId: tenant.id, name: 'OWNER' },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          passwordHash,
          isSuperAdmin: true, // पहिलो user नै आफ्नो tenant भित्र सर्वोच्च हुन्छ
        },
      });

      await tx.userRole.create({
        data: { userId: user.id, roleId: ownerRole.id },
      });

      const restaurant = await tx.restaurant.create({
        data: {
          tenantId: tenant.id,
          name: dto.restaurantName,
          slug: `${slug}-${tenant.id.slice(0, 8)}`,
          address: dto.restaurantAddress,
          latitude: dto.latitude, 
          longitude: dto.longitude,
        },
      });

      return { tenant, user, restaurant };
    });

    return {
      success: true,
      message: 'Registration successful',
      data: {
        user: this.sanitizeUser(result.user, ['OWNER']),
        tenant: { id: result.tenant.id, name: result.tenant.name },
        restaurant: { id: result.restaurant.id, name: result.restaurant.name },
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
      include: { roles: { include: { role: true } }, tenant: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roleNames = user.roles.map((r) => r.role.name);
    const tokens = await this.generateTokens(user.id, user.email, user.name, roleNames, user.tenantId, user.isSuperAdmin);

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: this.sanitizeUser(user, roleNames),
        tenant: { id: user.tenant.id, name: user.tenant.name },
        tokens,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { roles: { include: { role: true } } },
    });
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User no longer active');
    }

    const roleNames = user.roles.map((r) => r.role.name);
    const tokens = await this.generateTokens(user.id, user.email, user.name, roleNames, user.tenantId, user.isSuperAdmin);

    return { success: true, data: { tokens } };
  }

  private async generateTokens(
    userId: string,
    email: string,
    name: string,
    roles: string[],
    tenantId: string,
    isSuperAdmin: boolean,
  ) {
    const payload = { sub: userId, email, name, roles, tenantId, isSuperAdmin };

    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN'),
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN'),
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN'),
    };
  }

  private sanitizeUser(user: any, roles: string[]) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roles,
      tenantId: user.tenantId,
    };
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  // ---------- Staff Management (GAP FIX — पहिले owner एक्लै थियो, team member थप्ने बाटो थिएन) ----------

  async inviteStaff(tenantId: string, dto: InviteStaffDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('A user with this email already exists');

    const validRoles = await this.prisma.role.findMany({ where: { id: { in: dto.roleIds }, tenantId } });
    if (validRoles.length !== dto.roleIds.length) {
      throw new ConflictException('One or more roles do not belong to this restaurant');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        isSuperAdmin: false, // Staff — Owner होइनन्
        roles: { create: dto.roleIds.map((roleId) => ({ roleId })) },
      },
    });

    return { success: true, message: 'Staff member added successfully', data: this.sanitizeUser(user, validRoles.map((r) => r.name)) };
  }

  async findAllStaff(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      include: { roles: { include: { role: true } } },
    });
    return users.map((u) => this.sanitizeUser(u, u.roles.map((r) => r.role.name)));
  }

  async deactivateStaff(tenantId: string, userId: string) {
    await this.prisma.user.updateMany({ where: { id: userId, tenantId }, data: { isActive: false } });
    return { message: 'Staff member deactivated' };
  }
}
