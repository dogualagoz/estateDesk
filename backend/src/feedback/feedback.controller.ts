import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FeedbackService } from './feedback.service';
import { SendFeedbackDto } from './dto/send-feedback.dto';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('feedback')
export class FeedbackController {
  constructor(private readonly feedback: FeedbackService) {}

  @Get('status')
  status(@CurrentUser() user: AuthUser) {
    return this.feedback.status(user);
  }

  @Get('messages')
  messages(@CurrentUser() user: AuthUser) {
    return this.feedback.listMessages(user);
  }

  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('messages')
  @HttpCode(201)
  send(@CurrentUser() user: AuthUser, @Body() dto: SendFeedbackDto) {
    return this.feedback.sendMessage(user, dto.body);
  }

  @Post('read')
  @HttpCode(200)
  markRead(@CurrentUser() user: AuthUser) {
    return this.feedback.markRead(user);
  }
}
