import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Signalement } from './signalement.entity';
import { SignalementsService } from './signalements.service';
import { SignalementsController } from './signalements.controller';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Entreprise } from '../entreprises/entreprise.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Signalement, Utilisateur, Entreprise])],
  providers: [SignalementsService],
  controllers: [SignalementsController],
})
export class SignalementsModule {}
