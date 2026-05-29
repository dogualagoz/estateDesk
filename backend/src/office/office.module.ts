import { Module } from '@nestjs/common';
import { OfficeService } from './office.service';
import { OfficeController } from './office.controller';
import { InviteController } from './invite.controller';

@Module({
  controllers: [OfficeController, InviteController],
  providers: [OfficeService],
  exports: [OfficeService],
})
export class OfficeModule {}
