import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DemandStatus, PropertyType } from '@prisma/client';

export class CreateDemandDto {
  @IsArray()
  @IsEnum(PropertyType, { each: true })
  types!: PropertyType[];

  @IsArray()
  @IsString({ each: true })
  regions!: string[];

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minBudget?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxBudget?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roomPreferences?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featurePrefs?: string[];

  @IsOptional() @IsString() note?: string;

  @IsString() customerName!: string;
  @IsString() customerPhone!: string;

  @IsOptional() @IsEnum(DemandStatus) status?: DemandStatus;
}
