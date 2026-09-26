import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, Min, MaxLength } from 'class-validator';

export class CreateTableDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsInt()
  @Min(1)
  capacity: number;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  zone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}