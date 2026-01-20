import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';
import { Role } from '../roles/role.entity';

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
      if (!user) throw new NotFoundException('Utilisateur not found');
      if (user.motDePasse !== motDePasse) throw new NotFoundException('Invalid credentials');
      return user;
    }

    // No credentials -> return default visiteur account if exists
    const visiteurRole = await this.role.findOne({ where: { nom: 'visiteur' } });
    if (!visiteurRole) throw new NotFoundException('Visiteur role not found');
    const visiteur = await this.users.findOne({ where: { role: { id: visiteurRole.id } }, relations: ['role'] });
    if (!visiteur) throw new NotFoundException('Visiteur account not found');
    return visiteur;
  }
}
