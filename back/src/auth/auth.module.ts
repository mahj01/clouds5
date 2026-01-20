import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Role } from 'src/roles/role.entity';
import { Session } from '../sessions/session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Utilisateur, Role, Session])],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
