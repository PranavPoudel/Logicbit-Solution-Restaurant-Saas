import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsInt, Matches, Max, Min, ValidateNested } from 'class-validator';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export class ShiftDto {
  @Matches(TIME)
  open!: string;

  @Matches(TIME)
  close!: string;
}

export class DayHoursDto {
  @IsInt()
  @Min(0)
  @Max(6)
  day!: number;

  @IsBoolean()
  closed!: boolean;

  @IsArray()
  @ArrayMaxSize(3)
  @ValidateNested({ each: true })
  @Type(() => ShiftDto)
  shifts!: ShiftDto[];
}
