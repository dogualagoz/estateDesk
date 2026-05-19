import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PortfolioService } from './portfolio.service';
import { CreatePortfolioDto } from './dto/create-portfolio.dto';
import { UpdatePortfolioDto } from './dto/update-portfolio.dto';
import { QueryPortfolioDto } from './dto/query-portfolio.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('portfolios')
export class PortfolioController {
  constructor(private readonly portfolio: PortfolioService) {}

  @Get()
  list(@Query() query: QueryPortfolioDto) {
    return this.portfolio.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.portfolio.get(id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePortfolioDto) {
    return this.portfolio.create(user.id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePortfolioDto) {
    return this.portfolio.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.portfolio.softDelete(id);
  }
}
