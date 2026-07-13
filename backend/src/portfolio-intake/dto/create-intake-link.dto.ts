import { IsOptional, IsString, Length } from 'class-validator';

export class CreateIntakeLinkDto {
  /** Danışmanın linki ayırt etmesi için not, örn. "Mehmet Bey — eczacı". */
  @IsOptional()
  @IsString()
  @Length(1, 120)
  label?: string;
}
