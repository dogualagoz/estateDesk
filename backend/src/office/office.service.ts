import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';
import { requireOfficeId } from '../common/office.util';
import { CreateOfficeDto } from './dto/create-office.dto';
import { CreateInviteDto } from './dto/create-invite.dto';

const INVITE_TTL_DAYS = 7;

@Injectable()
export class OfficeService {
  constructor(private prisma: PrismaService) {}

  /** Yeni ofis kurar; kurucu ofis yöneticisi (ADMIN) ve üyesi olur. */
  async createOffice(user: AuthUser, dto: CreateOfficeDto) {
    if (user.officeId) throw new ConflictException('Zaten bir ofise bağlısınız');
    const owned = await this.prisma.office.findUnique({ where: { ownerId: user.id } });
    if (owned) throw new ConflictException('Zaten bir ofis kurdunuz');

    const office = await this.prisma.$transaction(async (tx) => {
      const created = await tx.office.create({ data: { name: dto.name, ownerId: user.id } });
      await tx.user.update({
        where: { id: user.id },
        data: { officeId: created.id, role: Role.ADMIN },
      });
      return created;
    });

    return this.getOfficeSummary(office.id);
  }

  async getMyOffice(user: AuthUser) {
    const officeId = requireOfficeId(user);
    return this.getOfficeSummary(officeId);
  }

  private async getOfficeSummary(officeId: string) {
    const office = await this.prisma.office.findUnique({
      where: { id: officeId },
      include: {
        owner: { select: { id: true, fullName: true } },
        _count: { select: { members: true, portfolios: true, demands: true } },
      },
    });
    if (!office) throw new NotFoundException('Ofis bulunamadı');
    return office;
  }

  /** Ofis üyeleri — her üye görebilir (profil linkleri için). */
  async listMembers(user: AuthUser) {
    const officeId = requireOfficeId(user);
    const members = await this.prisma.user.findMany({
      where: { officeId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(
      members.map(async (m) => {
        const [portfolioCount, demandCount] = await this.prisma.$transaction([
          this.prisma.portfolio.count({ where: { createdById: m.id, officeId, deletedAt: null } }),
          this.prisma.demand.count({ where: { createdById: m.id, officeId, deletedAt: null } }),
        ]);
        return { ...m, portfolioCount, demandCount };
      }),
    );
  }

  /** Yöneticinin e-posta ile davet linki üretmesi. */
  async createInvite(user: AuthUser, dto: CreateInviteDto) {
    const officeId = requireOfficeId(user);
    const email = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser?.officeId === officeId) {
      throw new ConflictException('Bu kişi zaten ofisinizde');
    }

    const now = new Date();
    let invite = await this.prisma.invite.findFirst({
      where: { officeId, email, status: 'PENDING' },
    });

    if (invite && invite.expiresAt > now) {
      return this.toInviteResponse(invite);
    }

    invite = await this.prisma.invite.create({
      data: {
        email,
        officeId,
        invitedById: user.id,
        expiresAt: new Date(now.getTime() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
      },
    });

    return this.toInviteResponse(invite);
  }

  async listInvites(user: AuthUser) {
    const officeId = requireOfficeId(user);
    const invites = await this.prisma.invite.findMany({
      where: { officeId, status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
    return invites.map((i) => this.toInviteResponse(i));
  }

  async revokeInvite(user: AuthUser, id: string) {
    const officeId = requireOfficeId(user);
    const invite = await this.prisma.invite.findFirst({ where: { id, officeId } });
    if (!invite) throw new NotFoundException('Davet bulunamadı');
    await this.prisma.invite.update({ where: { id }, data: { status: 'REVOKED' } });
    return { success: true };
  }

  /** Davet linki açıldığında gösterilecek önizleme (public). */
  async previewInvite(token: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
      include: {
        office: { select: { name: true } },
        invitedBy: { select: { fullName: true } },
      },
    });
    if (!invite) throw new NotFoundException('Davet bulunamadı');

    const valid = invite.status === 'PENDING' && invite.expiresAt > new Date();
    return {
      email: invite.email,
      officeName: invite.office.name,
      invitedByName: invite.invitedBy.fullName,
      status: invite.status,
      expiresAt: invite.expiresAt,
      valid,
    };
  }

  /** Kimliği doğrulanmış, ofissiz kullanıcının daveti kabul edip ofise katılması. */
  async acceptInvite(user: AuthUser, token: string) {
    if (user.officeId) throw new ConflictException('Zaten bir ofistesiniz');

    const invite = await this.prisma.invite.findUnique({ where: { token } });
    if (!invite) throw new NotFoundException('Davet bulunamadı');
    if (invite.status !== 'PENDING' || invite.expiresAt < new Date()) {
      throw new BadRequestException('Davet artık geçerli değil');
    }
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      throw new ForbiddenException('Bu davet farklı bir e-posta adresine gönderilmiş');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { officeId: invite.officeId, role: Role.AGENT },
      }),
      this.prisma.invite.update({
        where: { id: invite.id },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      }),
    ]);

    return this.getOfficeSummary(invite.officeId);
  }

  private toInviteResponse(invite: {
    id: string;
    email: string;
    token: string;
    status: string;
    expiresAt: Date;
    createdAt: Date;
  }) {
    const base = process.env.FRONTEND_URL || 'http://localhost:5173';
    return {
      id: invite.id,
      email: invite.email,
      token: invite.token,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
      link: `${base}/invite/${invite.token}`,
    };
  }
}
