import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingType, PortfolioVisibility, PropertyType } from '@prisma/client';

export class UpdatePortfolioDto {
  @IsOptional() @IsEnum(PropertyType) type?: PropertyType;
  @IsOptional() @IsEnum(ListingType) listingType?: ListingType;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() neighborhood?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) areaSqm?: number;
  @IsOptional() @IsString() roomCount?: string;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) price?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
  @IsOptional() @IsEnum(PortfolioVisibility) visibility?: PortfolioVisibility;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() ownerName?: string;
  @IsOptional() @IsString() ownerPhone?: string;
}
