import { Module } from '@nestjs/common';
import { PortfolioModule } from '../portfolio/portfolio.module';
import { PortfolioIntakeService } from './portfolio-intake.service';
import { PortfolioIntakeController } from './portfolio-intake.controller';
import { IntakePublicController } from './intake-public.controller';

@Module({
  imports: [PortfolioModule],
  controllers: [PortfolioIntakeController, IntakePublicController],
  providers: [PortfolioIntakeService],
})
export class PortfolioIntakeModule {}
