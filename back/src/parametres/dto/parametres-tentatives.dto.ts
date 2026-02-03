import { ApiProperty } from '@nestjs/swagger';

export class ParametresTentativesDto {
  @ApiProperty({
    description: "Nombre maximum de tentatives de connexion avant blocage d'un compte.",
    example: 3,
    minimum: 1,
  })
  maxLoginAttempts: number;

  @ApiProperty({
    description: 'Quand le compteur atteint 0, le compte est marqué comme bloqué (dateBlocage non nulle).',
    example: true,
  })
  lockAccountWhenExhausted: boolean;
}
