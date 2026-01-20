import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilisateursService } from './utilisateurs.service';
import { UtilisateursController } from './utilisateurs.controller';
import { Utilisateur } from './utilisateur.entity';
import { Role } from '../roles/role.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Utilisateur, Role])],
  providers: [UtilisateursService],
  controllers: [UtilisateursController],
})
export class UtilisateursModule {}
