import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './session.entity';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Session, Utilisateur])],
  providers: [SessionsService],
  controllers: [SessionsController],
})
export class SessionsModule {}
