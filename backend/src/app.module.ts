import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OfficeModule } from './office/office.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { DemandModule } from './demand/demand.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SearchModule } from './search/search.module';
import { MatchingModule } from './matching/matching.module';
import { DemandMatchModule } from './demand-match/demand-match.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { DemoReadOnlyGuard } from './common/demo-read-only.guard';
import { uploadsDir } from './common/uploads.util';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Genel istek limiti; auth endpoint'lerinde daha sıkı limit var (@Throttle)
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ServeStaticModule.forRoot({
      rootPath: uploadsDir(),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    OfficeModule,
    PortfolioModule,
    DemandModule,
    DashboardModule,
    SearchModule,
    MatchingModule,
    DemandMatchModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: DemoReadOnlyGuard },
  ],
})
export class AppModule {}
