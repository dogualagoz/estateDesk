import { IsEmail, Transform } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  email!: string;
}
