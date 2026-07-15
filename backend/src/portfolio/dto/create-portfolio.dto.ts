import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ListingType, PortfolioVisibility, PropertyType } from '@prisma/client';

export class CreatePortfolioDto {
  @IsEnum(PropertyType)
  type!: PropertyType;

  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  city!: string;

  @IsString()
  district!: string;

  @IsOptional()
  @IsString()
  neighborhood?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  areaSqm!: number;

  @IsString()
  roomCount!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsEnum(PortfolioVisibility)
  visibility?: PortfolioVisibility;

  @IsOptional()
  @IsString()
  note?: string;

  @IsString()
  ownerName!: string;

  @IsOptional()
  @IsBoolean()
  ownerNameVisible?: boolean;

  @IsString()
  ownerPhone!: string;

  @IsOptional()
  @IsBoolean()
  isShareable?: boolean;
}
