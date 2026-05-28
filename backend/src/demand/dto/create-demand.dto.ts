import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DemandStatus, ListingType, PropertyType } from '@prisma/client';

export class CreateDemandDto {
  @IsArray()
  @IsEnum(PropertyType, { each: true })
  types!: PropertyType[];

  @IsOptional() @IsEnum(ListingType) listingType?: ListingType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() neighborhood?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  districts?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  neighborhoods?: string[];

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minBudget?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxBudget?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roomPreferences?: string[];

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minArea?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxArea?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featurePrefs?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  mustHaveFeatures?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bonusFeatures?: string[];

  @IsOptional() @IsString() note?: string;

  @IsString() customerName!: string;
  @IsString() customerPhone!: string;

  @IsOptional() @IsEnum(DemandStatus) status?: DemandStatus;
}
