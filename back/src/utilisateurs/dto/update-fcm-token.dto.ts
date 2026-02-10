import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateFcmTokenDto {
  @ApiProperty({
    description: 'Firebase Cloud Messaging token for the device',
    example:
      'dV8w...:APA91bHn... (FCM registration token)',
  })
  @IsString()
  @IsNotEmpty()
  fcmToken: string;
}

