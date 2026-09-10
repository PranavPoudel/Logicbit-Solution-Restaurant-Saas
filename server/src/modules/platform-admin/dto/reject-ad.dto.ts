import { IsNotEmpty, IsString } from 'class-validator';

export class RejectAdDto {
  @IsString()
  @IsNotEmpty()
  rejectionReason: string;
}