import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParametresController } from './parametres.controller';
import { PrixForfaitaireController } from './prix-forfaitaire.controller';
import { PrixForfaitaireService } from './prix-forfaitaire.service';
import { PrixForfaitaire } from './entities/prix-forfaitaire.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([PrixForfaitaire])],
  controllers: [ParametresController, PrixForfaitaireController],
  providers: [PrixForfaitaireService],
  exports: [PrixForfaitaireService],
})
export class ParametresModule {}
