import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const PUBLIC_FIELDS = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  officeId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /** Aynı ofisteki üyeleri, portföy/talep sayılarıyla birlikte döner. */
  async list(user: AuthUser) {
    const officeId = requireOfficeId(user);
    const members = await this.prisma.user.findMany({
      where: { officeId },
      select: PUBLIC_FIELDS,
      orderBy: { createdAt: 'asc' },
    });
    return Promise.all(members.map((m) => this.withCounts(m, officeId)));
  }

  /** Aynı ofisteki bir üyenin profili (portföy/talep sayılarıyla). */
  async getProfile(user: AuthUser, id: string) {
    const officeId = requireOfficeId(user);
    const member = await this.prisma.user.findFirst({
      where: { id, officeId },
      select: PUBLIC_FIELDS,
    });
    if (!member) throw new NotFoundException('User not found');
    return this.withCounts(member, officeId);
  }

  private async withCounts<T extends { id: string }>(member: T, officeId: string) {
    const [portfolioCount, demandCount] = await this.prisma.$transaction([
      this.prisma.portfolio.count({
        where: { createdById: member.id, officeId, deletedAt: null },
      }),
      this.prisma.demand.count({
        where: { createdById: member.id, officeId, deletedAt: null },
      }),
    ]);
    return { ...member, portfolioCount, demandCount };
  }

  async create(user: AuthUser, dto: CreateUserDto) {
    const officeId = requireOfficeId(user);
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email already in use');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        role: dto.role ?? 'AGENT',
        isActive: dto.isActive ?? true,
        officeId,
      },
      select: PUBLIC_FIELDS,
    });
  }

  async update(user: AuthUser, id: string, dto: UpdateUserDto) {
    const officeId = requireOfficeId(user);
    const target = await this.prisma.user.findFirst({ where: { id, officeId } });
    if (!target) throw new NotFoundException('User not found');

    // office.service.changeMemberRole ile aynı korumalar — bu uç onları bypass edememeli
    if (dto.role !== undefined && dto.role !== target.role) {
      if (target.id === user.id) {
        throw new BadRequestException('Kendi rolünüzü değiştiremezsiniz');
      }
      if (dto.role !== Role.ADMIN && (await this.isOfficeOwner(officeId, target.id))) {
        throw new BadRequestException('Ofis kurucusunun yöneticiliği kaldırılamaz');
      }
    }
    if (dto.isActive === false) {
      await this.assertCanDeactivate(user, officeId, target.id);
    }

    const data: any = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.update({
      where: { id },
      data,
      select: PUBLIC_FIELDS,
    });
  }

  async deactivate(user: AuthUser, id: string) {
    const officeId = requireOfficeId(user);
    const target = await this.prisma.user.findFirst({ where: { id, officeId } });
    if (!target) throw new NotFoundException('User not found');
    await this.assertCanDeactivate(user, officeId, target.id);
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: PUBLIC_FIELDS,
    });
  }

  private async isOfficeOwner(officeId: string, userId: string) {
    const office = await this.prisma.office.findUnique({
      where: { id: officeId },
      select: { ownerId: true },
    });
    return office?.ownerId === userId;
  }

  private async assertCanDeactivate(user: AuthUser, officeId: string, targetId: string) {
    if (targetId === user.id) {
      throw new BadRequestException('Kendi hesabınızı deaktive edemezsiniz');
    }
    if (await this.isOfficeOwner(officeId, targetId)) {
      throw new BadRequestException('Ofis kurucusu deaktive edilemez');
    }
  }
}
