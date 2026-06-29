import { Module } from '@nestjs/common';
import { DemandShareController } from './demand-share.controller';
import { DemandShareService } from './demand-share.service';
import { PrismaModule } from '../prisma/prisma.module';
import { MatchingModule } from '../matching/matching.module';
import { DemandMatchModule } from '../demand-match/demand-match.module';

@Module({
  imports: [PrismaModule, MatchingModule, DemandMatchModule],
  controllers: [DemandShareController],
  providers: [DemandShareService],
})
export class DemandShareModule {}
