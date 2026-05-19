import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  IsNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PortfolioVisibility, PropertyType } from '@prisma/client';

export class CreatePortfolioDto {
  @IsEnum(PropertyType)
  type!: PropertyType;

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

  @IsString()
  ownerPhone!: string;
}
