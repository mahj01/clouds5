import { ApiProperty } from '@nestjs/swagger';

export class ParametresSessionsDto {
  @ApiProperty({
    description:
      "Durée de vie (TTL) d'une session en minutes. Valeur effective côté serveur.",
    example: 120,
    minimum: 1,
  })
  sessionTtlMinutes: number;

  @ApiProperty({
    description:
      "Nom de la variable d'environnement utilisée pour configurer le TTL.",
    example: 'AUTH_SESSION_TTL_MINUTES',
  })
  envVarName: string;
}
