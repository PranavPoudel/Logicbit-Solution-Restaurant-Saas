import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginPlatformStaffDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
