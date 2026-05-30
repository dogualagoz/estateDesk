import { Body, Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { DemandMatchService } from './demand-match.service';
import { PinPortfolioDto } from './dto/pin-portfolio.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('demand/:demandId/matches')
export class DemandMatchController {
  constructor(private readonly service: DemandMatchService) {}

  @Get()
  listPinned(@CurrentUser() user: AuthUser, @Param('demandId') demandId: string) {
    return this.service.listPinned(user, demandId);
  }

  @Post()
  @HttpCode(201)
  pin(
    @CurrentUser() user: AuthUser,
    @Param('demandId') demandId: string,
    @Body() dto: PinPortfolioDto,
  ) {
    return this.service.pin(user, demandId, dto.portfolioId);
  }

  @Delete(':portfolioId')
  @HttpCode(200)
  unpin(
    @CurrentUser() user: AuthUser,
    @Param('demandId') demandId: string,
    @Param('portfolioId') portfolioId: string,
  ) {
    return this.service.unpin(user, demandId, portfolioId);
  }
}
