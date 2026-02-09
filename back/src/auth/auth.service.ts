import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Role } from '../roles/role.entity';
import { Session } from '../sessions/session.entity';
import { TentativeConnexion } from '../tentative_connexion/tentative-connexion.entity';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { firestore } from '../firebase-admin';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { JournalService } from '../journal/journal.service';

import {
  DEFAULT_AUTH_SESSION_TTL_MINUTES,
  MAX_LOGIN_ATTEMPTS,
} from './auth.constants';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Utilisateur) private users: Repository<Utilisateur>,
    @InjectRepository(Role) private role: Repository<Role>,
    @InjectRepository(Session) private sessions: Repository<Session>,
    @InjectRepository(TentativeConnexion)
    private attempts: Repository<TentativeConnexion>,
    private readonly config: ConfigService,
    private readonly journalService: JournalService,
  ) {}

  private async logAction(
    action: string,
    ressource: string,
    utilisateur?: Utilisateur,
    niveau: string = 'info',
    details?: string,
  ) {
    try {
      await this.journalService.create({
        action,
        ressource,
        utilisateurId: utilisateur?.id,
        niveau,
        details,
      });
    } catch (e) {
      // Best effort logging - don't fail the main operation
      console.error('Failed to log action:', e);
    }
  }

  private getRemainingAttempts(user: Utilisateur) {
    const raw = Number(user.nbTentatives);
    // Compat: legacy rows may have 0 => treat as full attempts until first failure.
    if (!Number.isFinite(raw) || raw <= 0) return MAX_LOGIN_ATTEMPTS;
    return raw;
  }

  private async recordAttempt(user: Utilisateur, succes: boolean) {
    try {
      const entity = this.attempts.create({ succes, utilisateur: user });
      await this.attempts.save(entity);
    } catch {
      // best-effort logging
    }
  }

  private throwInvalidCredentials(remainingAttempts: number) {
    throw new NotFoundException({
      statusCode: 404,
      message: 'Invalid credentials',
      error: 'Not Found',
      remainingAttempts,
      isLocked: false,
    });
  }

  private throwLocked() {
    throw new ForbiddenException({
      statusCode: 403,
      message: 'Compte bloqué. Contactez un administrateur.',
      error: 'Forbidden',
      remainingAttempts: 0,
      isLocked: true,
    });
  }

  private async createSessionForUser(user: Utilisateur) {
    const ttlMinutes = parseInt(
      this.config.get(
        'AUTH_SESSION_TTL_MINUTES',
        String(DEFAULT_AUTH_SESSION_TTL_MINUTES),
      ),
      10,
    );
    const expires = new Date(Date.now() + ttlMinutes * 60 * 1000);
    const token = randomBytes(48).toString('hex');
    const session = this.sessions.create({
      token,
      dateExpiration: expires,
      actif: true,
      utilisateur: user,
    });
    await this.sessions.save(session);
    return {
      token,
      expiresAt: expires,
      user: { id: user.id, role: user.role },
    };
  }

  async login(email?: string, motDePasse?: string) {
    // If credentials provided, try to find matching user
    if (email && motDePasse) {
      const user = await this.users.findOne({
        where: { email },
        relations: ['role'],
      });

      if (!user) throw new NotFoundException('Utilisateur not found');

      if (user.dateBlocage) {
        await this.recordAttempt(user, false);
        this.throwLocked();
      }

      const remainingBefore = this.getRemainingAttempts(user);
      let isValid = false;
      try {
        isValid = await bcrypt.compare(motDePasse, user.motDePasse);
      } catch {
        isValid = false;
      }

      if (!isValid) {
        const remainingAfter = Math.max(0, remainingBefore - 1);
        user.nbTentatives = remainingAfter;
        if (remainingAfter <= 0) user.dateBlocage = new Date();
        await this.users.save(user);
        await this.recordAttempt(user, false);

        // Log failed login attempt
        await this.logAction(
          'LOGIN_FAILED',
          'auth',
          user,
          'warning',
          `Tentative de connexion échouée pour ${user.email}. Tentatives restantes: ${remainingAfter}`,
        );

        if (remainingAfter <= 0) {
          await this.logAction(
            'ACCOUNT_LOCKED',
            'auth',
            user,
            'error',
            `Compte bloqué pour ${user.email} après trop de tentatives`,
          );
          this.throwLocked();
        }
        this.throwInvalidCredentials(remainingAfter);
      }

      // reset attempts after successful login
      user.nbTentatives = MAX_LOGIN_ATTEMPTS;
      user.dateBlocage = null;
      await this.users.save(user);
      await this.recordAttempt(user, true);

      // Log successful login
      await this.logAction(
        'LOGIN',
        'auth',
        user,
        'info',
        `Connexion réussie pour ${user.email}`,
      );

      // Authentification locale uniquement - pas de Firebase Auth
      return this.createSessionForUser(user);
    }

    // No credentials -> return default visiteur account if exists
    const visiteurRole = await this.role.findOne({
      where: { nom: 'visiteur' },
    });
    if (!visiteurRole) throw new NotFoundException('Visiteur role not found');
    const visiteur = await this.users.findOne({
      where: { role: { id: visiteurRole.id } },
      relations: ['role'],
    });
    if (!visiteur) throw new NotFoundException('Visiteur account not found');
    return this.createSessionForUser(visiteur);
  }

  async visiteur() {
    const visiteurRole = await this.role.findOne({
      where: { nom: 'visiteur' },
    });
    if (!visiteurRole) throw new NotFoundException('Visiteur role not found');
    const visiteur = await this.users.findOne({
      where: { role: { id: visiteurRole.id } },
      relations: ['role'],
    });
    if (!visiteur) throw new NotFoundException('Visiteur account not found');
    return this.createSessionForUser(visiteur);
  }

  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    // Inscription locale uniquement - pas d'appel Firebase
    // La synchronisation Firebase se fait via l'endpoint /auth/sync-firebase

    const hash = await bcrypt.hash(dto.motDePasse, 10);
    const role = await this.role.findOne({ where: { id: dto.idRole } });
    if (!role) throw new NotFoundException('Role not found');
    const user = this.users.create({
      email: dto.email,
      motDePasse: hash,
      nom: dto.nom,
      prenom: dto.prenom,
      firebaseUid: null, // Non synchronisé au départ
      role,
    });
    const savedUser = await this.users.save(user);

    // Log registration
    await this.logAction(
      'REGISTER',
      'auth',
      savedUser,
      'info',
      `Nouvel utilisateur inscrit: ${dto.email}`,
    );

    return savedUser;
  }

  /**
   * Synchronise les utilisateurs non synchronisés vers Firestore.
   * Seuls les utilisateurs sans firebaseUid sont envoyés.
   * Retourne le nombre d'utilisateurs synchronisés et les erreurs éventuelles.
   */
  async syncToFirebase(): Promise<{
    synced: number;
    errors: string[];
    total: number;
  }> {
    // Récupérer les utilisateurs non synchronisés (firebaseUid est null ou vide)
    const unsyncedUsers = await this.users.find({
      where: { firebaseUid: null as any },
      relations: ['role'],
    });

    // Filtrer pour exclure les visiteurs (pas besoin de les synchroniser)
    const usersToSync = unsyncedUsers.filter(
      (u) => u.email && u.role?.nom !== 'visiteur',
    );

    const errors: string[] = [];
    let synced = 0;

    for (const user of usersToSync) {
      try {
        // Générer le firebaseUid
        const syncedUid = `synced_${Date.now()}`;
        const docId = String(user.id);

        // Écrire dans Firestore collection 'utilisateur' avec le firebaseUid
        const userData = {
          id: user.id,
          email: user.email,
          nom: user.nom || null,
          prenom: user.prenom || null,
          motDePasse: user.motDePasse,
          nbTentatives: user.nbTentatives,
          dateBlocage: user.dateBlocage ? user.dateBlocage.toISOString() : null,
          dateCreation: user.dateCreation
            ? user.dateCreation.toISOString()
            : new Date().toISOString(),
          firebaseUid: syncedUid,
        };

        await firestore
          .collection('utilisateur')
          .doc(docId)
          .set(userData, { merge: true });

        // Marquer comme synchronisé dans PostgreSQL
        user.firebaseUid = syncedUid;
        await this.users.save(user);
        synced++;
      } catch (e) {
        errors.push(
          `${user.email}: ${e instanceof Error ? e.message : 'Firestore error'}`,
        );
      }
    }

    return { synced, errors, total: usersToSync.length };
  }

  /**
   * Récupère le nombre d'utilisateurs non synchronisés
   */
  async getUnsyncedCount(): Promise<{ count: number }> {
    // Compter les utilisateurs non synchronisés (firebaseUid IS NULL)
    // en excluant les visiteurs
    const visiteurRole = await this.role.findOne({
      where: { nom: 'visiteur' },
    });

    const qb = this.users
      .createQueryBuilder('u')
      .where('u.firebase_uid IS NULL');

    if (visiteurRole) {
      qb.andWhere('(u.id_role IS NULL OR u.id_role != :visiteurRoleId)', {
        visiteurRoleId: visiteurRole.id,
      });
    }

    const count = await qb.getCount();
    return { count };
  }
}
