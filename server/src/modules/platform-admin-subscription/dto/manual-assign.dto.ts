import { IsEnum, IsUUID } from 'class-validator';

export class ManualAssignDto {
  @IsUUID()
  restaurantId: string;

  @IsUUID()
  planId: string;

  @IsEnum(['MANUAL', 'AUTO'])
  mode: 'MANUAL' | 'AUTO';
}
