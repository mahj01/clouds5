
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Role } from '../roles/role.entity';
import { RegisterDto } from './dto/register.dto';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { FirebaseRegisterDto } from './dto/firebase-register.dto';
import { firebaseConfig } from '../firebase';
import * as bcrypt from 'bcryptjs';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Utilisateur) private users: Repository<Utilisateur>,
    @InjectRepository(Role) private role: Repository<Role>,
  ) {}

  async login(email?: string, motDePasse?: string) {
    // If credentials provided, try to find matching user
    if (email && motDePasse) {
      const user = await this.users.findOne({ where: { email }, relations: ['role'] });
      if (user) {
        // support both plaintext and bcrypt-hashed passwords
        const matchesHash = await bcrypt.compare(motDePasse, user.motDePasse).catch(() => false);
        if (user.motDePasse === motDePasse || matchesHash) return user;
        // otherwise fallthrough to try Firebase authentication
      }

      // Attempt Firebase email/password sign-in as fallback
      try {
        const apiKey = firebaseConfig?.apiKey;
        if (apiKey) {
          const res = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password: motDePasse, returnSecureToken: true }),
            },
          );
          if (res.ok) {
            const data = await res.json();
            // Use firebase token flow to find/create local user
            return this.firebaseLogin({ idToken: data.idToken });
          }
        }
      } catch (e) {
        // ignore and fallthrough to error
      }

      throw new NotFoundException('Invalid credentials');
    }

    // No credentials -> return default visiteur account if exists
    const visiteurRole = await this.role.findOne({ where: { nom: 'visiteur' } });
    if (!visiteurRole) throw new NotFoundException('Visiteur role not found');
    const visiteur = await this.users.findOne({ where: { role: { id: visiteurRole.id } }, relations: ['role'] });
    if (!visiteur) throw new NotFoundException('Visiteur account not found');
    return visiteur;
  }

  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');

    // Attempt to create the user in Firebase first (best-effort).
    try {
      const apiKey = firebaseConfig?.apiKey;
      if (apiKey) {
        const res = await fetch(
          `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: dto.email, password: dto.motDePasse, returnSecureToken: true }),
          },
        );
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          const msg = err?.error?.message;
          // If the Firebase account already exists, continue and still create local account.
          if (msg !== 'EMAIL_EXISTS') {
            throw new BadRequestException('Firebase registration failed');
          }
        }
      }
    } catch (e) {
      throw new BadRequestException('Firebase registration failed');
    }

    const hash = await bcrypt.hash(dto.motDePasse, 10);
    const user = this.users.create({
      email: dto.email,
      motDePasse: hash,
      nom: dto.nom,
      prenom: dto.prenom,
    });
    return this.users.save(user);
  }

  private async verifyIdToken(idToken: string) {
    if (!idToken) throw new BadRequestException('idToken required');
    try {
      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
      if (!res.ok) throw new BadRequestException('Invalid Firebase token');
      const data = await res.json();
      // tokeninfo returns email when valid
      if (!data.email) throw new BadRequestException('Token does not contain email');
      return data as { email: string; sub?: string };
    } catch (e) {
      throw new BadRequestException('Failed to verify Firebase token');
    }
  }

  async firebaseLogin(dto: FirebaseLoginDto) {
    const info = await this.verifyIdToken(dto.idToken);
    const email = info.email;
    let user = await this.users.findOne({ where: { email }, relations: ['role'] });
    if (!user) {
      // create a visiteur account for Firebase users that don't exist yet
      const visiteurRole = await this.role.findOne({ where: { nom: 'visiteur' } });
      user = this.users.create({ email, motDePasse: '', role: visiteurRole ?? undefined });
      user = await this.users.save(user);
    }
    return user;
  }

  async firebaseRegister(dto: FirebaseRegisterDto) {
    const info = await this.verifyIdToken(dto.idToken);
    const email = info.email;
    const existing = await this.users.findOne({ where: { email } });
    if (existing) throw new ConflictException('Email already registered');

    // Prefer creating as 'client' if that role exists, otherwise no role
    const clientRole = await this.role.findOne({ where: { nom: 'client' } });
    const user = this.users.create({
      email,
      motDePasse: '',
      nom: dto.nom,
      prenom: dto.prenom,
      role: clientRole ?? undefined,
    });
    return this.users.save(user);
  }

}
