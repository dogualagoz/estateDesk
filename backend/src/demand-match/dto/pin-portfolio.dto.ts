import { IsString } from 'class-validator';

export class PinPortfolioDto {
  @IsString()
  portfolioId: string;
}
