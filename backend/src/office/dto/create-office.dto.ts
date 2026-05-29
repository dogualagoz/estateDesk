import { IsString, MinLength } from 'class-validator';

export class CreateOfficeDto {
  @IsString()
  @MinLength(2)
  name!: string;
}
