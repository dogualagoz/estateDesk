import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { OfficeService } from './office.service';
import { OfficeController } from './office.controller';
import { InviteController } from './invite.controller';

@Module({
  imports: [JwtModule],
  controllers: [OfficeController, InviteController],
  providers: [OfficeService],
  exports: [OfficeService],
})
export class OfficeModule {}
