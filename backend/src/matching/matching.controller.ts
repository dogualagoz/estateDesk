import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchPortfoliosDto } from './dto/match-portfolios.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('matching')
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  /** Alıcı kriterlerinden uyan portföyleri skorlu döner. */
  @Post('portfolios')
  @HttpCode(200)
  matchPortfolios(@CurrentUser() user: AuthUser, @Body() dto: MatchPortfoliosDto) {
    return this.matching.matchPortfolios(user, dto);
  }
}
