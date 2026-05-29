import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { QuerySearchDto } from './dto/query-search.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  global(@CurrentUser() user: AuthUser, @Query() query: QuerySearchDto) {
    return this.search.search(user, query);
  }
}
