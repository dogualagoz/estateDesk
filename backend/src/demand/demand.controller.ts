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
  list(@Query() query: QueryDemandDto) {
    return this.demand.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.demand.get(id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDemandDto) {
    return this.demand.create(user.id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateDemandDto) {
    return this.demand.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.demand.softDelete(id);
  }
}
