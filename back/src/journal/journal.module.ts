import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JournalAcces } from './journal.entity';
import { JournalService } from './journal.service';
import { JournalController } from './journal.controller';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Module({
  imports: [TypeOrmModule.forFeature([JournalAcces, Utilisateur])],
  controllers: [JournalController],
  providers: [JournalService],
  exports: [JournalService],
})
export class JournalModule {}
