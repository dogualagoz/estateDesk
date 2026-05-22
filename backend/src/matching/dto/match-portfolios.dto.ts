import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingType, PropertyType } from '@prisma/client';

/** Alıcı kriterleri — sol panelden gelen, uyan portföyleri bulmak için. */
export class MatchPortfoliosDto {
  @IsOptional()
  @IsArray()
  @IsEnum(PropertyType, { each: true })
  types?: PropertyType[];

  @IsOptional() @IsEnum(ListingType) listingType?: ListingType;

  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() neighborhood?: string;

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
  mustHaveFeatures?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  bonusFeatures?: string[];
}
