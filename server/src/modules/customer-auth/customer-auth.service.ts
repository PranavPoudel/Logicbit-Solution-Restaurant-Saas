import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { LoginCustomerDto } from './dto/login-customer.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterCustomerDto) {
    const existing = await this.prisma.customer.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Customer with this email already exists');

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const customer = await this.prisma.customer.create({
      data: { name: dto.name, email: dto.email, phone: dto.phone, passwordHash, isGuest: false },
    });

    const tokens = await this.generateTokens(customer.id, customer.email, customer.name);
    return { success: true, message: 'Registration successful', data: { customer: this.sanitize(customer), tokens } };
  }

  async login(dto: LoginCustomerDto) {
    const customer = await this.prisma.customer.findUnique({ where: { email: dto.email } });
    if (!customer || !customer.isActive || !customer.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const matches = await bcrypt.compare(dto.password, customer.passwordHash);
    if (!matches) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(customer.id, customer.email, customer.name);
    return { success: true, message: 'Login successful', data: { customer: this.sanitize(customer), tokens } };
  }

  /**
   * createGuestSession()
   * ----------------------
   * Login/Register नगरी order गर्न चाहने customer को लागि — नाम/फोन मात्र
   * लिएर एउटा "guest" Customer record बनाइदिन्छ, त्यही ID ले order track हुन्छ।
   */
  async createGuestSession(name: string, phone: string) {
    const guestEmail = `guest-${Date.now()}@logicbit.local`;
    const customer = await this.prisma.customer.create({
      data: { name, phone, email: guestEmail, isGuest: true },
    });
    const tokens = await this.generateTokens(customer.id, customer.email, customer.name);
    return { success: true, data: { customer: this.sanitize(customer), tokens } };
  }

  private async generateTokens(customerId: string, email: string, name: string) {
    const payload = { sub: customerId, email, name, type: 'customer' };
    const accessToken = await this.jwt.signAsync(payload, {
      secret: this.config.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN'),
    });
    return { accessToken };
  }

  /** GAP FIX: Customer ले आफ्नो नाम/फोन/password बदल्ने ठाउँ नै थिएन */
  async updateProfile(customerId: string, data: { name?: string; phone?: string }) {
    const customer = await this.prisma.customer.update({ where: { id: customerId }, data });
    return { success: true, data: this.sanitize(customer) };
  }

  async changePassword(customerId: string, currentPassword: string, newPassword: string) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || !customer.passwordHash) throw new UnauthorizedException('Password change not available for guest accounts');

    const matches = await bcrypt.compare(currentPassword, customer.passwordHash);
    if (!matches) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.prisma.customer.update({ where: { id: customerId }, data: { passwordHash } });
    return { success: true, message: 'Password changed successfully' };
  }

  private sanitize(customer: any) {
    return { id: customer.id, name: customer.name, email: customer.email, phone: customer.phone, isGuest: customer.isGuest };
  }
}
