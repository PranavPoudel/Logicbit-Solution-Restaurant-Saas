import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(0)
  durationMonths: number;

  @IsNumber()
  @Min(0)
  price: number;
}