import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary:
      'Login and get session token (optional credentials). Empty body returns visiteur.',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns token, expiry and user on credential login.',
  })
  login(@Body() body: LoginDto) {
    return this.auth.login(body?.email, body?.motDePasse);
  }

  @Post('visiteur')
  @ApiOperation({ summary: 'Create a visitor session token' })
  @ApiResponse({
    status: 200,
    description: 'Returns token, expiry and visitor user.',
  })
  visiteur() {
    return this.auth.visiteur();
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user (local only, no Firebase)' })
  @ApiResponse({ status: 201, description: 'User registered locally' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('sync-firebase')
  @ApiOperation({ summary: 'Synchronize unsynced users to Firebase' })
  @ApiResponse({ status: 200, description: 'Returns sync results' })
  syncFirebase() {
    return this.auth.syncToFirebase();
  }

  @Get('unsynced-count')
  @ApiOperation({ summary: 'Get count of unsynced users' })
  @ApiResponse({
    status: 200,
    description: 'Returns count of users not yet synced to Firebase',
  })
  getUnsyncedCount() {
    return this.auth.getUnsyncedCount();
  }
}
