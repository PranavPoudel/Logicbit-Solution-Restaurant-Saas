import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, InviteStaffDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AccountSecurityService, RequestCtx } from '../account-security/account-security.service';
import { hashPassword } from '../account-security/passwords';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly security: AccountSecurityService,
  ) {}

  /**
   * register()
   * एकैचोटि Tenant + Owner User + Restaurant (default OWNER role सहित) बनाउँछ।
   * यो नै multi-tenant SaaS को "onboarding" entry point हो।
   */
  async register(dto: RegisterDto, ctx: RequestCtx = {}) {
    const email = this.security.normalizeEmail(dto.email);
    const existing = await this.security.findByEmail('OWNER', email);
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const passwordHash = await hashPassword(dto.password);
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
          email,
          phone: dto.phone,
          passwordHash,
          isSuperAdmin: true, // पहिलो user नै आफ्नो tenant भित्र सर्वोच्च हुन्छ
          emailVerified: false, // confirmed with the emailed code
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

    this.security.audit('OWNER', result.user, 'AUTH_REGISTER', 'Owner account created', ctx);
    this.security.sendCodeInBackground('OWNER', result.user, 'EMAIL_VERIFY');

    return {
      success: true,
      message: 'Registration successful',
      data: {
        user: this.sanitizeUser(result.user, ['OWNER']),
        tenant: { id: result.tenant.id, name: result.tenant.name },
        restaurant: { id: result.restaurant.id, name: result.restaurant.name },
        needsVerification: this.security.requireVerification,
      },
    };
  }

  async login(dto: LoginDto, ctx: RequestCtx = {}) {
    const user = await this.security.authenticate('OWNER', dto.email, dto.password, ctx, {
      roles: { include: { role: true } },
      tenant: true,
    });

    const roleNames = user.roles.map((r: { role: { name: string } }) => r.role.name);
    const tokens = await this.generateTokens(user.id, user.email, user.name, roleNames, user.tenantId as string, user.isSuperAdmin, user.tokenVersion);

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
    // A password reset or "log out everywhere" must also end refresh tokens, or a stolen session would survive it.
    if ((payload.tv ?? 0) !== user.tokenVersion) {
      throw new UnauthorizedException('Session is no longer valid. Please log in again.');
    }

    const roleNames = user.roles.map((r) => r.role.name);
    const tokens = await this.generateTokens(user.id, user.email, user.name, roleNames, user.tenantId, user.isSuperAdmin, user.tokenVersion);

    return { success: true, data: { tokens } };
  }

  private async generateTokens(
    userId: string,
    email: string,
    name: string,
    roles: string[],
    tenantId: string,
    isSuperAdmin: boolean,
    tokenVersion: number,
  ) {
    const payload = { sub: userId, email, name, roles, tenantId, isSuperAdmin, tv: tokenVersion };

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
      emailVerified: user.emailVerified,
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
    const email = this.security.normalizeEmail(dto.email);
    const existing = await this.security.findByEmail('OWNER', email);
    if (existing) throw new ConflictException('A user with this email already exists');

    const validRoles = await this.prisma.role.findMany({ where: { id: { in: dto.roleIds }, tenantId } });
    if (validRoles.length !== dto.roleIds.length) {
      throw new ConflictException('One or more roles do not belong to this restaurant');
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        tenantId,
        name: dto.name,
        email, // an owner vouches for invited staff, so emailVerified keeps its default (true)
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
