import { Injectable, Logger } from '@nestjs/common';
import admin from '../firebase-admin';

@Injectable()
export class FcmService {
  private readonly logger = new Logger(FcmService.name);

  /** Must match a channel created on Android (Capacitor Push plugin uses "default" by default). */
  private static readonly ANDROID_CHANNEL_ID = 'default';

  async sendToToken(params: {
    token: string;
    title: string;
    body: string;
    data?: Record<string, string>;
  }): Promise<void> {
    const { token, title, body, data } = params;

    // Note: data values must be strings for FCM.
    const message: admin.messaging.Message = {
      token,
      notification: {
        title,
        body,
      },
      data,
      android: {
        priority: 'high',
        notification: {
          channelId: FcmService.ANDROID_CHANNEL_ID,
          sound: 'default',
        },
      },
    };

    try {
      await admin.messaging().send(message);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`FCM send failed: ${msg}`);
      throw e;
    }
  }
}
