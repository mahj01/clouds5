import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Signalement } from '../signalements/signalement.entity';
import { messaging } from '../firebase-admin';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
    @InjectRepository(Utilisateur) private readonly utilisateurRepo: Repository<Utilisateur>,
    @InjectRepository(Signalement) private readonly signalementRepo: Repository<Signalement>,
  ) {}

  /**
   * Crée une notification en base et tente de l'envoyer via FCM
   */
  async create(dto: CreateNotificationDto): Promise<Notification> {
    const utilisateur = await this.utilisateurRepo.findOne({ where: { id: dto.utilisateurId } });
    if (!utilisateur) {
      throw new Error(`Utilisateur ${dto.utilisateurId} non trouvé`);
    }

    const notification = this.repo.create({
      utilisateur,
      titre: dto.titre,
      message: dto.message,
      lu: false,
      envoye: false,
    });

    if (dto.signalementId) {
      const signalement = await this.signalementRepo.findOne({ where: { id: dto.signalementId } });
      if (signalement) {
        notification.signalement = signalement;
      }
    }

    const saved = await this.repo.save(notification);

    // Envoyer la notification push si l'utilisateur a un FCM token
    if (utilisateur.fcmToken) {
      await this.sendPushNotification(utilisateur.fcmToken, dto.titre, dto.message, {
        notificationId: String(saved.id),
        signalementId: dto.signalementId ? String(dto.signalementId) : '',
      });
      saved.envoye = true;
      await this.repo.save(saved);
    }

    return saved;
  }

  /**
   * Envoie une notification push via Firebase Cloud Messaging
   */
  async sendPushNotification(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    try {
      const message = {
        token: fcmToken,
        notification: {
          title,
          body,
        },
        data: data || {},
        android: {
          priority: 'high' as const,
          notification: {
            sound: 'default',
            channelId: 'signalements',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await messaging.send(message);
      this.logger.log(`Notification push envoyée: ${response}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Erreur envoi notification push: ${error.message}`);
      return false;
    }
  }

  /**
   * Notifie un utilisateur d'un changement de statut sur son signalement
   */
  async notifyStatusChange(
    utilisateurId: number,
    signalementId: number,
    ancienStatut: string,
    nouveauStatut: string,
    signalementTitre?: string,
  ): Promise<Notification> {
    const titre = '🔔 Statut mis à jour';
    const message = `Votre signalement "${signalementTitre || `#${signalementId}`}" est passé de "${ancienStatut}" à "${nouveauStatut}"`;

    return this.create({
      utilisateurId,
      signalementId,
      titre,
      message,
    });
  }

  /**
   * Récupère les notifications d'un utilisateur
   */
  async findByUtilisateur(utilisateurId: number): Promise<Notification[]> {
    return this.repo.find({
      where: { utilisateur: { id: utilisateurId } },
      relations: ['signalement'],
      order: { dateCreation: 'DESC' },
    });
  }

  /**
   * Compte les notifications non lues d'un utilisateur
   */
  async countUnread(utilisateurId: number): Promise<number> {
    return this.repo.count({
      where: { utilisateur: { id: utilisateurId }, lu: false },
    });
  }

  /**
   * Marque une notification comme lue
   */
  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.repo.findOne({ where: { id } });
    if (!notification) {
      throw new Error(`Notification ${id} non trouvée`);
    }
    notification.lu = true;
    return this.repo.save(notification);
  }

  /**
   * Marque toutes les notifications d'un utilisateur comme lues
   */
  async markAllAsRead(utilisateurId: number): Promise<void> {
    await this.repo.update(
      { utilisateur: { id: utilisateurId }, lu: false },
      { lu: true },
    );
  }

  /**
   * Récupère les notifications via Firebase UID
   */
  async findByFirebaseUid(firebaseUid: string): Promise<Notification[]> {
    const utilisateur = await this.utilisateurRepo.findOne({ where: { firebaseUid } });
    if (!utilisateur) {
      return [];
    }
    return this.findByUtilisateur(utilisateur.id);
  }

  /**
   * Compte les notifications non lues via Firebase UID
   */
  async countUnreadByFirebaseUid(firebaseUid: string): Promise<number> {
    const utilisateur = await this.utilisateurRepo.findOne({ where: { firebaseUid } });
    if (!utilisateur) {
      return 0;
    }
    return this.countUnread(utilisateur.id);
  }

  /**
   * Marque toutes les notifications comme lues via Firebase UID
   */
  async markAllAsReadByFirebaseUid(firebaseUid: string): Promise<void> {
    const utilisateur = await this.utilisateurRepo.findOne({ where: { firebaseUid } });
    if (!utilisateur) {
      return;
    }
    await this.markAllAsRead(utilisateur.id);
  }
}
