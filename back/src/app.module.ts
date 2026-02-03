import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RolesModule } from './roles/roles.module';
import { StatutCompteModule } from './statut_compte/statut-compte.module';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';
import { SessionsModule } from './sessions/sessions.module';
import { TentativeConnexionModule } from './tentative_connexion/tentative-connexion.module';
import { EntreprisesModule } from './entreprises/entreprises.module';
import { SignalementsModule } from './signalements/signalements.module';
import { HistoriqueSignalementModule } from './historique_signalement/historique-signalement.module';
import { SynchronisationsModule } from './synchronisations/synchronisations.module';
import { HistoriqueStatusUtilisateurModule } from './historique_status_utilisateur/historique-status-utilisateur.module';
import { AuthModule } from './auth/auth.module';
import { FirestoreModule } from './firestore/firestore.module';
import { ParametresModule } from './parametres/parametres.module';
import { ProblemesModule } from './problemes/problemes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: parseInt(config.get('DB_PORT', '5432'), 10),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASS', ''),
        database: config.get('DB_NAME', 'cloud'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // désactiver en production
      }),
    }),
    RolesModule,
    StatutCompteModule,
    UtilisateursModule,
    SessionsModule,
    TentativeConnexionModule,
    EntreprisesModule,
    SignalementsModule,
    HistoriqueSignalementModule,
    SynchronisationsModule,
    HistoriqueStatusUtilisateurModule,
    AuthModule,
    ParametresModule,
    ProblemesModule,
    // Firestore sync module (syncs selected entities to Firestore at startup)
    FirestoreModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
