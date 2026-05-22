import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchPortfoliosDto } from './dto/match-portfolios.dto';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  /** Alıcı kriterlerinden uyan portföyleri skorlu döner. */
  @Post('portfolios')
  @HttpCode(200)
  matchPortfolios(@Body() dto: MatchPortfoliosDto) {
    return this.matching.matchPortfolios(dto);
  }
}
