import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterCustomerDto } from './dto/register-customer.dto';
import { LoginCustomerDto } from './dto/login-customer.dto';
import { AccountSecurityService, RequestCtx } from '../account-security/account-security.service';
import { checkPassword, hashPassword } from '../account-security/passwords';

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly security: AccountSecurityService,
  ) {}

  async register(dto: RegisterCustomerDto, ctx: RequestCtx = {}) {
    const email = this.security.normalizeEmail(dto.email);
    const existing = await this.security.findByEmail('CUSTOMER', email);
    if (existing) throw new ConflictException('Customer with this email already exists');

    const passwordHash = await hashPassword(dto.password);
    const customer = await this.prisma.customer.create({
      data: { name: dto.name, email, phone: dto.phone, passwordHash, isGuest: false, emailVerified: false },
    });
    this.security.audit('CUSTOMER', customer, 'AUTH_REGISTER', 'Customer account created', ctx);
    this.security.sendCodeInBackground('CUSTOMER', customer, 'EMAIL_VERIFY');

    // When verification is required the customer gets no session until they confirm the emailed code.
    const needsVerification = this.security.requireVerification;
    const tokens = needsVerification ? undefined : await this.generateTokens(customer);
    return {
      success: true,
      message: 'Registration successful',
      data: { customer: this.sanitize(customer), tokens, needsVerification },
    };
  }

  async login(dto: LoginCustomerDto, ctx: RequestCtx = {}) {
    const customer = await this.security.authenticate('CUSTOMER', dto.email, dto.password, ctx);
    return this.startSession(customer);
  }

  /** The login response for a customer who has already been checked (password login or Google). */
  async startSession(customer: { id: string; name: string; email: string; tokenVersion: number }) {
    const tokens = await this.generateTokens(customer);
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
    const tokens = await this.generateTokens(customer);
    return { success: true, data: { customer: this.sanitize(customer), tokens } };
  }

  /** Also used by the Google login to start a session for a customer it has just found or created. */
  async generateTokens(customer: { id: string; email: string; name: string; tokenVersion: number }) {
    // `tv` lets "log out everywhere" and password resets cancel tokens that were already issued.
    const payload = { sub: customer.id, email: customer.email, name: customer.name, type: 'customer', tv: customer.tokenVersion };
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

  async changePassword(customerId: string, currentPassword: string, newPassword: string, ctx: RequestCtx = {}) {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer || !customer.passwordHash) throw new UnauthorizedException('Password change not available for guest accounts');

    const matches = await checkPassword(customer.passwordHash, currentPassword);
    if (!matches) throw new UnauthorizedException('Current password is incorrect');

    // Other devices are signed out (a stolen session must not survive a password change); this one gets a fresh token.
    const updated = await this.prisma.customer.update({
      where: { id: customerId },
      data: { passwordHash: await hashPassword(newPassword), tokenVersion: { increment: 1 } },
    });
    this.security.audit('CUSTOMER', customer, 'AUTH_PASSWORD_CHANGED', 'Password changed; other sessions ended', ctx);
    return { success: true, message: 'Password changed successfully', data: { tokens: await this.generateTokens(updated) } };
  }

  private sanitize(customer: any) {
    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      isGuest: customer.isGuest,
      emailVerified: customer.emailVerified,
    };
  }
}
