import { IsOptional, IsString, Length } from 'class-validator';
import { CreatePortfolioDto } from '../../portfolio/dto/create-portfolio.dto';

/**
 * Onay: danışmanın gözden geçirip (gerekirse düzenleyip) onayladığı nihai
 * portföy değerleri — CreatePortfolioDto ile aynı şekil, mevcut create
 * yolundan geçer.
 */
export class ApproveSubmissionDto extends CreatePortfolioDto {}

export class RejectSubmissionDto {
  @IsOptional()
  @IsString()
  @Length(1, 500)
  reason?: string;
}
