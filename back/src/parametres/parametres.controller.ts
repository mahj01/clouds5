import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DEFAULT_AUTH_SESSION_TTL_MINUTES, MAX_LOGIN_ATTEMPTS } from '../auth/auth.constants';
import { ParametresSessionsDto } from './dto/parametres-sessions.dto';
import { ParametresTentativesDto } from './dto/parametres-tentatives.dto';

@ApiTags('parametres')
@ApiBearerAuth()
@Controller('parametres')
export class ParametresController {
  constructor(private readonly config: ConfigService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Paramètres sessions' })
  @ApiOkResponse({ type: ParametresSessionsDto })
  getSessionsParams(): ParametresSessionsDto {
    const ttlMinutes = parseInt(
      this.config.get('AUTH_SESSION_TTL_MINUTES', String(DEFAULT_AUTH_SESSION_TTL_MINUTES)),
      10,
    );

    return {
      sessionTtlMinutes: Number.isFinite(ttlMinutes) && ttlMinutes > 0 ? ttlMinutes : DEFAULT_AUTH_SESSION_TTL_MINUTES,
      envVarName: 'AUTH_SESSION_TTL_MINUTES',
    };
  }

  @Get('tentatives')
  @ApiOperation({ summary: 'Paramètres tentatives de connexion' })
  @ApiOkResponse({ type: ParametresTentativesDto })
  getTentativesParams(): ParametresTentativesDto {
    return {
      maxLoginAttempts: MAX_LOGIN_ATTEMPTS,
      lockAccountWhenExhausted: true,
    };
  }
}
