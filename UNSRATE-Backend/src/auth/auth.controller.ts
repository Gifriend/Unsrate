import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { User } from '../decorators/user.decorator';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiRegisterUser,
  ApiLoginUser,
  ApiRefreshToken,
  ApiLogoutUser,
} from '../decorators/auth/auth-swagger.decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiRegisterUser()
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiLoginUser()
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  @ApiRefreshToken()
  refreshTokens(
    @User() user: { userId: string; nim: string; refreshToken: string },
  ) {
    return this.authService.refreshToken(user.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiLogoutUser()
  logout(@User() user: { userId: string; nim: string }) {
    return this.authService.logout(user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  getProfile(@User() user: { userId: string; nim: string }) {
    return {
      userId: user.userId,
      nim: user.nim,
    };
  }
}
