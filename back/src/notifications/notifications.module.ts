import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationOutbox } from './notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsProcessor } from './notifications.processor';
import { FcmService } from './fcm.service';
import { FirestoreUserTokensService } from './firestore-user-tokens.service';
import { FirestoreEmailUidService } from './firestore-email-uid.service';

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
    FirestoreEmailUidService,
  ],
  exports: [
    NotificationsService,
    FcmService,
    FirestoreUserTokensService,
    FirestoreEmailUidService,
  ],
})
export class NotificationsModule {}
