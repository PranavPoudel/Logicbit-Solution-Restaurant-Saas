// src/modules/order/dto/order-item-input.dto.ts
import { IsUUID, IsInt, Min, IsOptional, IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class SelectedModifierDto {
  @IsUUID()
  modifierGroupId: string;

  @IsUUID()
  modifierOptionId: string;

  @IsOptional()
  name?: string;

  @IsOptional()
  extraPrice?: number;
}

export class OrderItemInputDto {
  @IsUUID() 
  menuItemId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedModifierDto)
  @IsOptional()
  selectedModifiers?: SelectedModifierDto[];


  @IsString()
  @IsOptional()
  notes?: string;
}
