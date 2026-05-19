import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PortfolioVisibility, PropertyType } from '@prisma/client';

export class QueryPortfolioDto {
  @IsOptional() @IsEnum(PropertyType) type?: PropertyType;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() district?: string;
  @IsOptional() @IsString() roomCount?: string;
  @IsOptional() @IsString() feature?: string;
  @IsOptional() @IsEnum(PortfolioVisibility) visibility?: PortfolioVisibility;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minPrice?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxPrice?: number;

  @IsOptional() @IsString() q?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) pageSize?: number = 20;
}
