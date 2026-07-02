import { IsEnum, IsIn, IsInt, IsISO8601, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Role } from '@prisma/client';

/** Ortak sayfalama alanları — tüm admin liste uçları kullanır. */
export class AdminPageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) pageSize?: number = 25;
}

export class AdminUsersQueryDto extends AdminPageDto {
  /** Ad/e-posta içinde arama. */
  @IsOptional() @IsString() q?: string;
  @IsOptional() @IsIn(['active', 'inactive']) status?: 'active' | 'inactive';
  @IsOptional() @IsEnum(Role) role?: Role;
}

export class AdminOfficesQueryDto extends AdminPageDto {
  @IsOptional() @IsString() q?: string;
}

export class AdminRequestLogsQueryDto extends AdminPageDto {
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;
  @IsOptional() @Type(() => Number) @IsInt() statusCode?: number;
  /** >=400 tüm hataları getir kısayolu. */
  @IsOptional() @Transform(({ value }) => value === 'true' || value === true) errorsOnly?: boolean;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() path?: string;
}

export class AdminAuditLogsQueryDto extends AdminPageDto {
  @IsOptional() @IsISO8601() from?: string;
  @IsOptional() @IsISO8601() to?: string;
  @IsOptional() @IsString() action?: string;
  @IsOptional() @IsString() userId?: string;
  @IsOptional() @IsString() officeId?: string;
}

export class AdminAnalyticsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(365) days?: number = 30;
}

export class AdminTimeseriesQueryDto extends AdminAnalyticsQueryDto {
  @IsIn(['logins', 'signups', 'requests'])
  metric!: 'logins' | 'signups' | 'requests';
}
