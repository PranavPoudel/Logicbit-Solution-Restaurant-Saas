import { IsString, IsNotEmpty, IsOptional, IsNumber, IsBoolean, IsInt, Min, MaxLength } from 'class-validator';

export class CreateModifierOptionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  extraPrice?: number;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}
