import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Role } from 'src/roles/role.entity';
import { Session } from '../sessions/session.entity';
import { TentativeConnexion } from '../tentative_connexion/tentative-connexion.entity';
import { SessionAuthGuard } from './session-auth.guard';
import { APP_GUARD } from '@nestjs/core';
import { JournalModule } from '../journal/journal.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Utilisateur, Role, Session, TentativeConnexion]),
    JournalModule,
  ],
  providers: [AuthService, { provide: APP_GUARD, useClass: SessionAuthGuard }],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
