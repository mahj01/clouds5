import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly notifications: NotificationsService) {}

  /**
   * Retry delivery of pending/failed notifications.
   * Runs frequently; individual notifications have their own backoff (nextAttemptAt).
   */
  @Cron(CronExpression.EVERY_30_SECONDS)
  async flushDue() {
    try {
      const res = await this.notifications.flushPending(50);
      if (res.processed > 0) {
        this.logger.log(
          `flushDue: processed=${res.processed} sent=${res.sent} failed=${res.failed}`,
        );
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`flushDue failed: ${msg}`);
    }
  }

  /**
   * Cleanup expired rows (extra safety; sent rows are deleted immediately).
   */
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanup() {
    try {
      const removed = await this.notifications.cleanupExpired();
      if (removed > 0) {
        this.logger.log(`cleanupExpired: removed=${removed}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`cleanupExpired failed: ${msg}`);
    }
  }
}
