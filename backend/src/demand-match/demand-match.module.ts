import { Module } from '@nestjs/common';
import { DemandMatchController } from './demand-match.controller';
import { DemandMatchService } from './demand-match.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DemandMatchController],
  providers: [DemandMatchService],
})
export class DemandMatchModule {}
