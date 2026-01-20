import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Utilisateur } from './utilisateur.entity';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import { Role } from '../roles/role.entity';

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
      nbTentatives: dto.nbTentatives ?? 0,
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
}
