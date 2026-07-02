import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '@prisma/client';
import { IsStrongPassword } from '../../common/validators/strong-password.validator';

export class AdminCreateUserDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  email!: string;

  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsString()
  @IsStrongPassword()
  password!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  /** Opsiyonel ofis ataması — verilmezse kullanıcı ofissiz oluşur (onboarding'e düşer). */
  @IsOptional()
  @IsString()
  officeId?: string;
}

export class AdminUpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  fullName?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  @IsStrongPassword()
  password?: string;
}
