import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { PortfolioIntakeService } from './portfolio-intake.service';
import { CreateIntakeLinkDto } from './dto/create-intake-link.dto';
import { ApproveSubmissionDto, RejectSubmissionDto } from './dto/review-submission.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

/** Danışman tarafı: link yönetimi + başvuru inceleme (JWT, ofis izolasyonlu). */
@Controller('portfolio-intake')
export class PortfolioIntakeController {
  constructor(private readonly intake: PortfolioIntakeService) {}

  @Post('links')
  createLink(@CurrentUser() user: AuthUser, @Body() dto: CreateIntakeLinkDto) {
    return this.intake.createLink(user, dto);
  }

  @Get('links')
  listLinks(@CurrentUser() user: AuthUser) {
    return this.intake.listLinks(user);
  }

  @Delete('links/:id')
  revokeLink(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.intake.revokeLink(user, id);
  }

  @Get('submissions')
  listSubmissions(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: 'PENDING' | 'APPROVED' | 'REJECTED',
  ) {
    return this.intake.listSubmissions(user, status);
  }

  @Get('submissions/count')
  pendingCount(@CurrentUser() user: AuthUser) {
    return this.intake.pendingCount(user);
  }

  @Get('submissions/:id')
  getSubmission(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.intake.getSubmission(user, id);
  }

  @Post('submissions/:id/approve')
  @HttpCode(200)
  approve(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: ApproveSubmissionDto,
  ) {
    return this.intake.approveSubmission(user, id, dto);
  }

  @Post('submissions/:id/reject')
  @HttpCode(200)
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: RejectSubmissionDto,
  ) {
    return this.intake.rejectSubmission(user, id, dto.reason);
  }
}
