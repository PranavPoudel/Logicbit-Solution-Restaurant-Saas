import { IsString, IsEmail, IsNotEmpty, MinLength, IsBoolean, IsOptional, Equals, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  restaurantName: string;

  @IsString()
  @IsNotEmpty()
  restaurantAddress: string;

  @IsBoolean()
  @Equals(true, { message: 'You must accept the terms and conditions' })
  acceptTerms: boolean;

  @ApiPropertyOptional({ description: 'Restaurant Latitude for Near-Me discovery' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Restaurant Longitude for Near-Me discovery' })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class InviteStaffDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString({ each: true })
  roleIds: string[];
}
