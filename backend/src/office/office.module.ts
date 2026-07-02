import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OfficeService } from './office.service';
import { InviteService } from './invite.service';
import { OfficeController } from './office.controller';
import { InviteController } from './invite.controller';

@Module({
  imports: [AuthModule],
  controllers: [OfficeController, InviteController],
  providers: [OfficeService, InviteService],
  exports: [OfficeService, InviteService],
})
export class OfficeModule {}
