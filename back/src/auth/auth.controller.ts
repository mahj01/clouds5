
import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation,ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
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
    return this.auth.login(body?.email, body?.motDePasse);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered' })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }
}
