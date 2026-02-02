import { Injectable, NotFoundException, UnauthorizedException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Utilisateur } from './utilisateur.entity';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import { Role } from '../roles/role.entity';

const MAX_LOGIN_ATTEMPTS = 3;

function toSafeUser(u: Utilisateur) {
  return {
    id: u.id,
    email: u.email,
    nom: u.nom,
    prenom: u.prenom,
    role: u.role,
    nbTentatives: u.dateBlocage ? 0 : u.nbTentatives,
    dateBlocage: u.dateBlocage,
    dateCreation: u.dateCreation,
  };
}

@Injectable()
export class UtilisateursService {
  constructor(
    @InjectRepository(Utilisateur) private repo: Repository<Utilisateur>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
  ) {}

  async create(dto: CreateUtilisateurDto, managerEmail?: string, managerPassword?: string) {
    // If requesting creation of a client, require manager credentials
    if (dto.roleId) {
      const roleCheck = await this.roleRepo.findOne({ where: { id: dto.roleId } });
      if (roleCheck && roleCheck.nom === 'client') {
        if (!managerEmail || !managerPassword) throw new UnauthorizedException('Manager credentials required to create client');
        const managerRole = await this.roleRepo.findOne({ where: { nom: 'manager' } });
        if (!managerRole) throw new UnauthorizedException('Manager role not configured');
        const manager = await this.repo.findOne({ where: { email: managerEmail }, relations: ['role'] });
        if (!manager || manager.motDePasse !== managerPassword || !manager.role || manager.role.id !== managerRole.id) {
          throw new UnauthorizedException('Invalid manager credentials');
        }
      }
    }

    const entity = this.repo.create({
      email: dto.email,
      motDePasse: dto.motDePasse,
      nom: dto.nom,
      prenom: dto.prenom,
      nbTentatives: dto.nbTentatives ?? MAX_LOGIN_ATTEMPTS,
      dateBlocage: dto.dateBlocage,
    });
    if (dto.roleId) {
      const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
      if (!role) throw new NotFoundException('Role not found');
      entity.role = role;
    }
    return this.repo.save(entity);
  }

  findAll() {
    return this.repo.find({ relations: ['role'] });
  }

  async findOne(id: number) {
    const item = await this.repo.findOne({ where: { id }, relations: ['role'] });
    if (!item) throw new NotFoundException('Utilisateur not found');
    return item;
  }

  async findOneByEmail(email: string) {
    const user = await this.repo.findOne({ where: { email }, relations: ['role'] });
    if (!user) throw new NotFoundException('Utilisateur not found');
    return user;
  }

  async update(id: number, dto: UpdateUtilisateurDto) {
    const user = await this.findOne(id);
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.motDePasse !== undefined) user.motDePasse = dto.motDePasse;
    if (dto.nom !== undefined) user.nom = dto.nom;
    if (dto.prenom !== undefined) user.prenom = dto.prenom;
    if (dto.nbTentatives !== undefined) user.nbTentatives = dto.nbTentatives;
    if (dto.dateBlocage !== undefined) user.dateBlocage = dto.dateBlocage;
    if (dto.roleId !== undefined) {
      const role = await this.roleRepo.findOne({ where: { id: dto.roleId } });
      if (!role) throw new NotFoundException('Role not found');
      user.role = role;
    }
    return this.repo.save(user);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }

  async unlockUser(targetUserId: number, actorUserId?: number) {
    if (!actorUserId) throw new UnauthorizedException('Missing session user');
    const actor = await this.repo.findOne({ where: { id: actorUserId }, relations: ['role'] });
    if (!actor) throw new UnauthorizedException('Invalid session user');
    if (!actor.role || actor.role.nom !== 'manager') {
      throw new ForbiddenException('Only manager can unlock accounts');
    }

    const target = await this.findOne(targetUserId);
    target.dateBlocage = null;
    target.nbTentatives = MAX_LOGIN_ATTEMPTS;
    const saved = await this.repo.save(target);
    return toSafeUser(saved);
  }

  async listLockedUsers(actorUserId?: number) {
    if (!actorUserId) throw new UnauthorizedException('Missing session user');
    const actor = await this.repo.findOne({ where: { id: actorUserId }, relations: ['role'] });
    if (!actor) throw new UnauthorizedException('Invalid session user');
    if (!actor.role || actor.role.nom !== 'manager') {
      throw new ForbiddenException('Only manager can list locked accounts');
    }

    const users = await this.repo.find({
      where: { dateBlocage: Not(IsNull()) },
      relations: ['role'],
      order: { dateBlocage: 'DESC' },
    });
    return users.map(toSafeUser);
  }

  // --- Nouvelle méthode d'inscription
  async register(dto: CreateUtilisateurDto) {
    // Vérifier si l'email existe déjà
    try {
      await this.findOneByEmail(dto.email);
      throw new ConflictException('Email déjà utilisé');
    } catch (err) {
      if (!(err instanceof NotFoundException)) throw err;
      // si NotFoundException => email libre, on continue
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(dto.motDePasse, 10);

    // Créer DTO pour créer l'utilisateur
    const newUserDto: CreateUtilisateurDto = {
      ...dto,
      motDePasse: hashedPassword,
      nbTentatives: MAX_LOGIN_ATTEMPTS,
      dateBlocage: undefined, // corrigé ici
    };

    return this.create(newUserDto);
  }
}
