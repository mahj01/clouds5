
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Role } from '../roles/role.entity';
import { Session } from '../sessions/session.entity';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Utilisateur) private users: Repository<Utilisateur>,
    @InjectRepository(Role) private role: Repository<Role>,
    @InjectRepository(Session) private sessions: Repository<Session>,
    private readonly config: ConfigService,
  ) {}

  async login(email?: string, motDePasse?: string) {
    // If credentials provided, try to find matching user
    if (email && motDePasse) {
      const user = await this.users.findOne({ where: { email }, relations: ['role'] });
      if (!user) throw new NotFoundException('Utilisateur not found');
      const isValid = await bcrypt.compare(motDePasse, user.motDePasse);
      if (!isValid) throw new NotFoundException('Invalid credentials');
      // create session token
      const ttlMinutes = parseInt(this.config.get('AUTH_SESSION_TTL_MINUTES', '120'), 10);
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
    const hash = await bcrypt.hash(dto.motDePasse, 10);
    const role = await this.role.findOne({ where: { id: dto.idRole } });
    if (!role) throw new NotFoundException('Role not found');
    const user = this.users.create({
      email: dto.email,
      motDePasse: hash,
      nom: dto.nom,
      prenom: dto.prenom,
      role,
    });
    return this.users.save(user);
  }

}
