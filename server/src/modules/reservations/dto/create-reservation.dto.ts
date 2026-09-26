import { IsString, IsNotEmpty, IsOptional, IsInt, IsEnum, Min, MaxLength, IsDateString } from 'class-validator';
import { ReservationStatus } from '@prisma/client'; // Ensure this matches your Prisma enum name

export class CreateReservationDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  customerName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  customerPhone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  customerEmail?: string;

  @IsInt()
  @Min(1)
  partySize: number;

  @IsDateString()
  reservationDate: string; // ISO string (e.g., "2023-10-25T00:00:00.000Z")

  @IsString()
  @IsNotEmpty()
  @MaxLength(10)
  reservationTime: string; // e.g., "13:00"

  @IsInt()
  @Min(15)
  durationMinutes: number;

  @IsString()
  @IsOptional()
  tableId?: string;

  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}