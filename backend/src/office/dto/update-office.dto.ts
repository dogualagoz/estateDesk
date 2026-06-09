import { IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateOfficeDto {
  @IsString()
  @MinLength(2, { message: 'Ofis adı en az 2 karakter olmalı' })
  @MaxLength(80, { message: 'Ofis adı en fazla 80 karakter olabilir' })
  name!: string;
}
