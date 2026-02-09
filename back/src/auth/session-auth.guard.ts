import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../sessions/session.entity';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    @InjectRepository(Session) private readonly sessions: Repository<Session>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const path: string = req.path || req.url || '';

    // Skip auth endpoints
    if (path.startsWith('/auth') || path.startsWith('/roles')) {
      return true;
    }

    const authHeader: string | undefined =
      req.headers['authorization'] || req.headers['Authorization'];
    if (
      !authHeader ||
      typeof authHeader !== 'string' ||
      !authHeader.startsWith('Bearer ')
    ) {
      throw new UnauthorizedException('Missing Authorization Bearer token');
    }

    const token = authHeader.substring('Bearer '.length).trim();
    const session = await this.sessions.findOne({
      where: { token, actif: true },
      relations: ['utilisateur'],
    });
    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    const now = Date.now();
    const exp = new Date(session.dateExpiration).getTime();
    if (isNaN(exp) || exp <= now) {
      throw new UnauthorizedException('Session expired');
    }

    // Attach user to request for controllers to consume
    req.user = session.utilisateur;
    return true;
  }
}
