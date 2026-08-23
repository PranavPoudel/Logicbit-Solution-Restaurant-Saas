import { IsString, IsNotEmpty, IsOptional, IsEmail, MinLength, IsUUID, IsBoolean } from 'class-validator';

export class CreatePlatformRoleDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class CreatePlatformStaffDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsUUID()
  roleId: string;
}

export class UpdatePlatformStaffDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsUUID()
  @IsOptional()
  roleId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
