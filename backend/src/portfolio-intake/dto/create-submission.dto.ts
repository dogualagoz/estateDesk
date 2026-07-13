import {
  Equals,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ListingType, PropertyType } from '@prisma/client';

/**
 * Public başvuru formu (multipart/form-data ile gelir — sayısal/boolean
 * alanlar string taşınır, Transform/Type ile çevrilir).
 */
export class CreateSubmissionDto {
  @IsString()
  @Length(2, 120)
  submitterName!: string;

  @IsString()
  @Length(5, 30)
  submitterPhone!: string;

  @IsEnum(PropertyType)
  type!: PropertyType;

  @IsOptional()
  @IsEnum(ListingType)
  listingType?: ListingType;

  @IsOptional()
  @IsString()
  @Length(1, 200)
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
  @Transform(({ value }) => (value == null ? [] : Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsString()
  @Length(1, 2000)
  description?: string;

  @Transform(({ value }) => value === true || value === 'true')
  @Equals(true, { message: 'KVKK aydınlatma metnini onaylamanız gerekir' })
  kvkkAccepted!: boolean;
}
