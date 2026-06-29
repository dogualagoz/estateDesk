import { DemandShareMode } from '@prisma/client';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateShareDto {
  @IsEnum(DemandShareMode)
  mode!: DemandShareMode;

  @IsOptional()
  @IsString()
  @MaxLength(280)
  note?: string;
}
