import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { JournalAcces } from './journal.entity';
import { CreateJournalDto } from './dto/create-journal.dto';
import { FilterJournalDto } from './dto/filter-journal.dto';
import { Utilisateur } from '../utilisateurs/utilisateur.entity';

@Injectable()
export class JournalService {
  constructor(
    @InjectRepository(JournalAcces) private repo: Repository<JournalAcces>,
    @InjectRepository(Utilisateur) private userRepo: Repository<Utilisateur>,
  ) {}

  async create(dto: CreateJournalDto): Promise<JournalAcces> {
    let utilisateur: Utilisateur | undefined;
    if (dto.utilisateurId) {
      const user = await this.userRepo.findOne({ where: { id: dto.utilisateurId } });
      if (user) utilisateur = user;
    }

    const entry = this.repo.create({
      action: dto.action,
      ressource: dto.ressource,
      ip: dto.ip,
      userAgent: dto.userAgent,
      details: dto.details,
      niveau: dto.niveau || 'info',
      utilisateur,
    });

    return this.repo.save(entry);
  }

  async findAll(filter?: FilterJournalDto): Promise<{ data: JournalAcces[]; total: number }> {
    const qb = this.repo.createQueryBuilder('journal')
      .leftJoinAndSelect('journal.utilisateur', 'utilisateur')
      .orderBy('journal.dateAction', 'DESC');

    if (filter?.action) {
      qb.andWhere('journal.action = :action', { action: filter.action });
    }
    if (filter?.ressource) {
      qb.andWhere('journal.ressource ILIKE :ressource', { ressource: `%${filter.ressource}%` });
    }
    if (filter?.niveau) {
      qb.andWhere('journal.niveau = :niveau', { niveau: filter.niveau });
    }
    if (filter?.utilisateurId) {
      qb.andWhere('journal.utilisateur.id = :userId', { userId: filter.utilisateurId });
    }
    if (filter?.dateDebut) {
      qb.andWhere('journal.dateAction >= :dateDebut', { dateDebut: new Date(filter.dateDebut) });
    }
    if (filter?.dateFin) {
      qb.andWhere('journal.dateAction <= :dateFin', { dateFin: new Date(filter.dateFin) });
    }

    const total = await qb.getCount();

    if (filter?.limit) {
      qb.take(filter.limit);
    } else {
      qb.take(100); // Default limit
    }
    if (filter?.offset) {
      qb.skip(filter.offset);
    }

    const data = await qb.getMany();

    return { data, total };
  }

  async findOne(id: number): Promise<JournalAcces | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['utilisateur'],
    });
  }

  async getStatistiques(): Promise<{
    totalEntries: number;
    parAction: { action: string; count: number }[];
    parNiveau: { niveau: string; count: number }[];
    dernieres24h: number;
  }> {
    const totalEntries = await this.repo.count();

    const parAction = await this.repo
      .createQueryBuilder('journal')
      .select('journal.action', 'action')
      .addSelect('COUNT(*)', 'count')
      .groupBy('journal.action')
      .getRawMany();

    const parNiveau = await this.repo
      .createQueryBuilder('journal')
      .select('journal.niveau', 'niveau')
      .addSelect('COUNT(*)', 'count')
      .groupBy('journal.niveau')
      .getRawMany();

    const hier = new Date();
    hier.setDate(hier.getDate() - 1);
    const dernieres24h = await this.repo.count({
      where: { dateAction: MoreThanOrEqual(hier) },
    });

    return {
      totalEntries,
      parAction: parAction.map(r => ({ action: r.action, count: Number(r.count) })),
      parNiveau: parNiveau.map(r => ({ niveau: r.niveau, count: Number(r.count) })),
      dernieres24h,
    };
  }

  // Méthode utilitaire pour logger facilement depuis d'autres services
  async log(
    action: string,
    options?: {
      ressource?: string;
      utilisateurId?: number;
      ip?: string;
      userAgent?: string;
      details?: string;
      niveau?: 'info' | 'warning' | 'error';
    },
  ): Promise<JournalAcces> {
    return this.create({
      action,
      ressource: options?.ressource,
      utilisateurId: options?.utilisateurId,
      ip: options?.ip,
      userAgent: options?.userAgent,
      details: options?.details,
      niveau: options?.niveau || 'info',
    });
  }
}
