import { IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean, Min, MaxLength } from 'class-validator';

export class CreateModifierGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  minSelect?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  maxSelect?: number;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;
}
