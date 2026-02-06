import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Validation } from './validation.entity';
import { ValidationService } from './validation.service';
import { ValidationController } from './validation.controller';
import { Signalement } from '../signalements/signalement.entity';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Validation, Signalement, Utilisateur])],
  controllers: [ValidationController],
  providers: [ValidationService],
  exports: [ValidationService],
})
export class ValidationModule {}
