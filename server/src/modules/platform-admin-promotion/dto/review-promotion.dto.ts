import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApprovalStatus } from '@prisma/client';

export class ReviewPromotionDto {
  @IsNotEmpty()
  @IsEnum(ApprovalStatus)
  status: ApprovalStatus;
}