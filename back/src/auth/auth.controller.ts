
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { FirebaseLoginDto } from './dto/firebase-login.dto';
import { FirebaseRegisterDto } from './dto/firebase-register.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';


@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and get session token (optional credentials). Empty body returns visiteur.' })
  @ApiResponse({ status: 200, description: 'Returns token, expiry and user on credential login.' })
  login(@Body() body: LoginDto) {
    return this.auth.firebaseLogin(body);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('firebase-login')
  @ApiOperation({ summary: 'Login with Firebase ID token or email/password (same as /auth/login)' })
  firebaseLogin(@Body() body: FirebaseLoginDto) {
    return this.auth.firebaseLogin(body);
  }

  @Post('firebase-register')
  @ApiOperation({ summary: 'Register via Firebase ID token or email/password (same as /auth/register)' })
  firebaseRegister(@Body() dto: RegisterDto) {
    return this.auth.firebaseRegister(dto);
  }
}
