import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { BCRYPT_ROUNDS } from '../common/security.constants';
import { AuditService } from '../audit/audit.service';
import { AUDIT_ACTIONS } from '../audit/audit-actions';
import { AdminUsersQueryDto } from './dto/admin-query.dto';
import { AdminCreateUserDto, AdminUpdateUserDto } from './dto/admin-user.dto';

const USER_FIELDS = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  isActive: true,
  isDemo: true,
  officeId: true,
  office: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

/**
 * Süper admin kullanıcı yönetimi — TÜM ofislerdeki kullanıcılar.
 * Bilinçli olarak requireOfficeId KULLANILMAZ: cross-office görünürlük
 * bu modülün doğasıdır; erişim RolesGuard(SUPERADMIN) ile sınırlıdır.
 */
@Injectable()
export class AdminUsersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async list(query: AdminUsersQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;

    const where: Prisma.UserWhereInput = {};
    if (query.status) where.isActive = query.status === 'active';
    if (query.role) where.role = query.role;
    if (query.q?.trim()) {
      const q = query.q.trim();
      where.OR = [
        { fullName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [total, items] = await this.prisma.$transaction([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: USER_FIELDS,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items, total, page, pageSize };
  }

  async create(admin: AuthUser, dto: AdminCreateUserDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Bu e-posta zaten kayıtlı');

    if (dto.officeId) {
      const office = await this.prisma.office.findUnique({ where: { id: dto.officeId } });
      if (!office) throw new NotFoundException('Ofis bulunamadı');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const created = await this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        role: dto.role ?? Role.AGENT,
        officeId: dto.officeId,
      },
      select: USER_FIELDS,
    });

    this.audit.log({
      action: AUDIT_ACTIONS.ADMIN_USER_CREATED,
      userId: admin.id,
      targetType: 'user',
      targetId: created.id,
      metadata: { email: created.email, role: created.role },
    });

    return created;
  }

  async update(admin: AuthUser, id: string, dto: AdminUpdateUserDto) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Kullanıcı bulunamadı');

    // Süper admin kendi hesabını kilitleyemesin
    if (id === admin.id && dto.isActive === false) {
      throw new BadRequestException('Kendi hesabınızı deaktive edemezsiniz');
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const updated = await this.prisma.user.update({ where: { id }, data, select: USER_FIELDS });

    this.audit.log({
      action: AUDIT_ACTIONS.ADMIN_USER_UPDATED,
      userId: admin.id,
      targetType: 'user',
      targetId: id,
      metadata: {
        changed: Object.keys(dto).filter((k) => k !== 'password'),
        passwordChanged: !!dto.password,
      },
    });

    return updated;
  }

  /**
   * "Silme" = deaktive etme. Hard delete YAPILMAZ: kullanıcının portföy,
   * talep ve pin kayıtları FK ile bağlıdır; veri bütünlüğü ve denetim izi
   * korunur. Gerçek silme/anonimleştirme (KVKK) ROADMAP'tedir.
   */
  async deactivate(admin: AuthUser, id: string) {
    if (id === admin.id) {
      throw new BadRequestException('Kendi hesabınızı deaktive edemezsiniz');
    }
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Kullanıcı bulunamadı');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: USER_FIELDS,
    });

    this.audit.log({
      action: AUDIT_ACTIONS.ADMIN_USER_DEACTIVATED,
      userId: admin.id,
      targetType: 'user',
      targetId: id,
    });

    return updated;
  }
}
