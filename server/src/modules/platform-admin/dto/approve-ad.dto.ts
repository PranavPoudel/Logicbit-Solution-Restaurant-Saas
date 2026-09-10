import { IsInt, IsOptional, Min } from 'class-validator';

export class ApproveAdDto {
  @IsInt()
  @Min(0)
  @IsOptional()
  priority?: number;
}