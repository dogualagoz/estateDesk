import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { QuerySearchDto } from './dto/query-search.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly search: SearchService) {}

  @Get()
  global(@Query() query: QuerySearchDto) {
    return this.search.search(query);
  }
}
