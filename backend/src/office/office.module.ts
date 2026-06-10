import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { OfficeService } from './office.service';
import { OfficeController } from './office.controller';
import { InviteController } from './invite.controller';

@Module({
  imports: [AuthModule],
  controllers: [OfficeController, InviteController],
  providers: [OfficeService],
  exports: [OfficeService],
})
export class OfficeModule {}
