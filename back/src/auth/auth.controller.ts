import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly svc: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login (optional credentials). Empty body returns visiteur.' })
  login(@Body() body: LoginDto) {
    return this.svc.login(body?.email, body?.motDePasse);
  }
}
