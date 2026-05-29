import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  // Ofis üye listesi ve üye yönetimi yalnızca yöneticiye (ADMIN) açıktır.
  @Roles(Role.ADMIN)
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.users.list(user);
  }

  // Üye profili aynı ofisteki tüm danışmanlara açıktır.
  @Get(':id')
  getProfile(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.users.getProfile(user, id);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateUserDto) {
    return this.users.create(user, dto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(user, id, dto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  deactivate(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.users.deactivate(user, id);
  }
}
