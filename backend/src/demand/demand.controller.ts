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
import { DemandService } from './demand.service';
import { CreateDemandDto } from './dto/create-demand.dto';
import { UpdateDemandDto } from './dto/update-demand.dto';
import { QueryDemandDto } from './dto/query-demand.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('demands')
export class DemandController {
  constructor(private readonly demand: DemandService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: QueryDemandDto) {
    return this.demand.list(user, query);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.demand.get(user, id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDemandDto) {
    return this.demand.create(user, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateDemandDto) {
    return this.demand.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.demand.softDelete(user, id);
  }
}
