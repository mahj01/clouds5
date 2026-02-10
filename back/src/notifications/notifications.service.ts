import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, IsNull } from 'typeorm';
import { firestore } from '../firebase-admin';
import {
  NotificationOutbox,
  NotificationStatus,
  NotificationType,
} from './notification.entity';
import { HistoriqueSignalement } from '../historique_signalement/historique-signalement.entity';
import { Signalement } from '../signalements/signalement.entity';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { FcmService } from './fcm.service';
import { FirestoreUserTokensService } from './firestore-user-tokens.service';

export type FirestoreUserNotification = {
  pg_notification_id: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  created_at: string; // ISO
  source: 'pg';
};

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  /** Firestore: users/{firebaseUid}/notifications/{docId} */
  static readonly USERS_COLLECTION = 'users';
  static readonly NOTIFS_SUBCOLLECTION = 'notifications';

  constructor(
    @InjectRepository(NotificationOutbox)
    private readonly repo: Repository<NotificationOutbox>,
    private readonly fcm: FcmService,
    private readonly userTokens: FirestoreUserTokensService,
  ) {}

  private computeBackoffNextAttempt(attempts: number): Date {
    const seconds = Math.min(60 * 60, Math.pow(2, Math.max(0, attempts)) * 5); // 5s,10s,20s.. max 1h
    return new Date(Date.now() + seconds * 1000);
  }

  async enqueueSignalementStatusChange(params: {
    historique: HistoriqueSignalement;
    signalement: Signalement;
    utilisateur: Utilisateur;
  }): Promise<NotificationOutbox> {
    const { historique, signalement, utilisateur } = params;

    const title = 'Mise à jour de votre signalement';
    const body = `Votre signalement « ${signalement.titre} » est passé de « ${historique.ancienStatut ?? '-'} » à « ${historique.nouveauStatut ?? '-'} ». `;

    // Idempotency via unique index on historiqueSignalement.
    // In case of race/duplicate insert, we fall back to reading existing.
    const entity = this.repo.create({
      type: NotificationType.SIGNALEMENT_STATUS_CHANGED,
      status: NotificationStatus.PENDING,
      title,
      body,
      data: {
        signalement_pg_id: signalement.id,
        ancien_statut: historique.ancienStatut ?? null,
        nouveau_statut: historique.nouveauStatut ?? null,
        historique_id: historique.id,
      },
      utilisateur,
      signalement,
      historiqueSignalement: historique,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      nextAttemptAt: new Date(),
    });

    try {
      return await this.repo.save(entity);
    } catch (e) {
      // unique violation: find existing
      const existing = await this.repo.findOne({
        where: { historiqueSignalement: { id: historique.id } },
        relations: ['historiqueSignalement'],
      });
      if (existing) return existing;
      throw e;
    }
  }

  private async pushToFirestore(n: NotificationOutbox): Promise<void> {
    const firebaseUid = n.utilisateur?.firebaseUid;
    if (!firebaseUid) {
      throw new Error(`Utilisateur ${n.utilisateur?.id} has no firebaseUid`);
    }

    const docId = `pg_${n.id}`;
    const payload: FirestoreUserNotification = {
      pg_notification_id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data,
      created_at: n.createdAt.toISOString(),
      source: 'pg',
    };

    const ref = firestore
      .collection(NotificationsService.USERS_COLLECTION)
      .doc(firebaseUid)
      .collection(NotificationsService.NOTIFS_SUBCOLLECTION)
      .doc(docId);

    await ref.set(payload, { merge: true });
  }

  /**
   * Immediately try to deliver a single notification.
   * If successful: delete local row (as requested).
   * If failed: keep row, mark FAILED and schedule retry.
   */
  async tryDeliverNow(id: number): Promise<void> {
    const notif = await this.repo.findOne({
      where: { id },
      relations: ['utilisateur', 'signalement', 'historiqueSignalement'],
    });
    if (!notif) return;

    // Expiry
    if (notif.expiresAt && notif.expiresAt.getTime() <= Date.now()) {
      notif.status = NotificationStatus.EXPIRED;
      await this.repo.save(notif);
      await this.repo.delete(notif.id);
      return;
    }

    try {
      // 1) Durable in-app inbox (Firestore)
      await this.pushToFirestore(notif);

      // 2) OS-level push (FCM) for killed/backgrounded app (best-effort)
      // Prefer local PG token, but fallback to Firestore user doc tokens when missing.
      const firebaseUid = notif.utilisateur?.firebaseUid;
      const firestoreTokens = firebaseUid
        ? await this.userTokens.getTokensForFirebaseUid(firebaseUid)
        : [];

      const candidateTokens = [
        notif.utilisateur?.fcmToken,
        ...firestoreTokens,
      ].filter((t): t is string => typeof t === 'string');

      const tokens = Array.from(
        new Set(candidateTokens.map((t) => t.trim()).filter(Boolean)),
      ).filter((t) => !this.tokenLooksInvalid(t));

      if (tokens.length === 0) {
        this.logger.log(
          `notif ${notif.id}: no valid FCM token for user ${notif.utilisateur?.id} (skip push)`,
        );
      } else {
        for (const token of tokens) {
          try {
            await this.fcm.sendToToken({
              token,
              title: notif.title,
              body: notif.body,
              data: {
                type: String(notif.type),
                pg_notification_id: String(notif.id),
                signalement_pg_id: String(notif.signalement?.id ?? ''),
              },
            });
          } catch (pushErr) {
            // Don't block overall delivery; Firestore inbox is already written.
            const msg =
              pushErr instanceof Error ? pushErr.message : String(pushErr);
            this.logger.warn(`FCM push failed for notif ${notif.id}: ${msg}`);

            // If the token is unregistered/invalid, clear it so we don't retry forever.
            // Note: this only clears the PG single-token field. Firestore token cleanup can be added later.
            if (this.isUnregisteredTokenError(pushErr)) {
              try {
                if (notif.utilisateur && notif.utilisateur.fcmToken === token) {
                  notif.utilisateur.fcmToken = null;
                  // best-effort: avoid coupling to user repo here
                  await this.repo.manager.save(notif.utilisateur);
                  this.logger.warn(
                    `Cleared invalid FCM token for utilisateur ${notif.utilisateur.id}`,
                  );
                }
              } catch (clearErr) {
                this.logger.warn(
                  `Failed to clear invalid FCM token for utilisateur ${
                    notif.utilisateur?.id
                  }: ${
                    clearErr instanceof Error
                      ? clearErr.message
                      : String(clearErr)
                  }`,
                );
              }
            }
          }
        }
      }

      notif.status = NotificationStatus.SENT;
      notif.sentAt = new Date();
      notif.attempts = (notif.attempts ?? 0) + 1;
      await this.repo.save(notif);
      // delete row after sent
      await this.repo.delete(notif.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      notif.status = NotificationStatus.FAILED;
      notif.lastError = msg;
      notif.attempts = (notif.attempts ?? 0) + 1;
      notif.nextAttemptAt = this.computeBackoffNextAttempt(notif.attempts);
      await this.repo.save(notif);
      this.logger.warn(`Notification ${notif.id} delivery failed: ${msg}`);
    }
  }

  /** Deliver pending/failed notifications that are due */
  async flushPending(
    limit = 50,
  ): Promise<{ processed: number; sent: number; failed: number }> {
    const now = new Date();

    const due = await this.repo.find({
      where: [
        {
          status: In([NotificationStatus.PENDING, NotificationStatus.FAILED]),
          nextAttemptAt: LessThanOrEqual(now),
        },
        {
          status: In([NotificationStatus.PENDING, NotificationStatus.FAILED]),
          nextAttemptAt: IsNull(),
        },
      ],
      relations: ['utilisateur', 'signalement', 'historiqueSignalement'],
      order: { id: 'ASC' },
      take: limit,
    });

    let sent = 0;
    let failed = 0;

    for (const n of due) {
      const beforeId = n.id;
      await this.tryDeliverNow(beforeId);
      const stillExists = await this.repo.exist({ where: { id: beforeId } });
      if (stillExists) failed++;
      else sent++;
    }

    return { processed: due.length, sent, failed };
  }

  /** Remove expired rows (best-effort). */
  async cleanupExpired(): Promise<number> {
    const now = new Date();
    const res = await this.repo.delete({
      expiresAt: LessThanOrEqual(now),
    });
    return res.affected ?? 0;
  }

  private tokenLooksInvalid(token: string | null | undefined): boolean {
    if (!token) return true;
    const t = String(token).trim();
    if (!t) return true;
    // FCM tokens are typically long; this is just a sanity check to avoid obvious junk.
    return t.length < 50;
  }

  private isUnregisteredTokenError(e: unknown): boolean {
    const msg = e instanceof Error ? e.message : String(e);
    return (
      msg.includes('registration-token-not-registered') ||
      msg.includes('messaging/registration-token-not-registered') ||
      msg.includes('invalid-registration-token') ||
      msg.includes('messaging/invalid-registration-token')
    );
  }
}
