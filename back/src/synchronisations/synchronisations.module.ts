import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Synchronisation } from './synchronisation.entity';
import { SynchronisationsService } from './synchronisations.service';
import { SynchronisationsController } from './synchronisations.controller';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Synchronisation, Utilisateur])],
  providers: [SynchronisationsService],
  controllers: [SynchronisationsController],
})
export class SynchronisationsModule {}
