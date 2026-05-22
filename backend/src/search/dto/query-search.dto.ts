import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export type SearchScope = 'all' | 'portfolio' | 'demand';

export class QuerySearchDto {
  @IsString() @IsNotEmpty() q!: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50) limit?: number = 8;

  @IsOptional() @IsIn(['all', 'portfolio', 'demand']) scope?: SearchScope = 'all';
}
