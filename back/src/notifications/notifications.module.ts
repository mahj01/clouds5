import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationOutbox } from './notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';
import { FcmService } from './fcm.service';
import { FirestoreUserTokensService } from './firestore-user-tokens.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([NotificationOutbox]),
  ],
  providers: [
    NotificationsService,
    NotificationsProcessor,
    FcmService,
    FirestoreUserTokensService,
  ],
  exports: [NotificationsService, FcmService, FirestoreUserTokensService],
})
export class NotificationsModule {}
