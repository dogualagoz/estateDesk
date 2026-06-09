import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ExportDataset {
  PORTFOLIOS = 'portfolios',
  DEMANDS = 'demands',
}

export enum ExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
}

export class ExportQueryDto {
  @IsEnum(ExportDataset, { message: 'Geçersiz veri kümesi' })
  dataset!: ExportDataset;

  @IsOptional()
  @IsEnum(ExportFormat, { message: 'Geçersiz biçim' })
  format?: ExportFormat = ExportFormat.XLSX;

  /** Belirli bir danışmanın kayıtlarıyla sınırla (boşsa tüm ofis). */
  @IsOptional()
  @IsString()
  memberId?: string;
}
