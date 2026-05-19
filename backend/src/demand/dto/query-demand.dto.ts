import { IsEnum, IsInt, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DemandStatus, PropertyType } from '@prisma/client';

export class QueryDemandDto {
  @IsOptional() @IsEnum(PropertyType) type?: PropertyType;
  @IsOptional() @IsString() region?: string;
  @IsOptional() @IsString() roomPreference?: string;
  @IsOptional() @IsEnum(DemandStatus) status?: DemandStatus;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) minBudget?: number;
  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) maxBudget?: number;

  @IsOptional() @IsString() q?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) pageSize?: number = 20;
}
