import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { Role } from './roles/role.entity';
import { Utilisateur } from './utilisateurs/utilisateur.entity';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://127.0.0.1:3000',
    ],
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('JS Project API')
      .setDescription('API REST documentation')
      .setVersion('1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document); // accessible à /api
  }

  // Seed default roles and accounts
  try {
    const ds = app.get(DataSource);
    const roleRepo = ds.getRepository(Role);
    const userRepo = ds.getRepository(Utilisateur);

    const roleNames = ['manager', 'visiteur', 'client'];
    const roles = {} as Record<string, Role>;
    for (const name of roleNames) {
      let r = await roleRepo.findOne({ where: { nom: name } });
      if (!r) r = await roleRepo.save(roleRepo.create({ nom: name }));
      roles[name] = r;
    }

    // default manager
    const adminEmail = 'admin';
    let admin = await userRepo.findOne({ where: { email: adminEmail }, relations: ['role'] });
    if (!admin) {
      admin = userRepo.create({ email: adminEmail, motDePasse: 'admin', role: roles['manager'] });
      await userRepo.save(admin);
    }

    // default visiteur (no credentials required to use public login)
    const visiteurEmail = 'visiteur@default';
    let visiteur = await userRepo.findOne({ where: { email: visiteurEmail }, relations: ['role'] });
    if (!visiteur) {
      visiteur = userRepo.create({ email: visiteurEmail, motDePasse: '', role: roles['visiteur'] });
      await userRepo.save(visiteur);
    }
  } catch (e) {
    // seeding best-effort; do not crash app if DB not ready
    // console.warn('Seeding skipped:', e?.message ?? e);
  }

  await app.listen(3001);
}
bootstrap();
