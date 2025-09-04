import type { Response } from 'express';
import { AuthService } from './auth.service';
import { Body, Controller, Get, NotFoundException, Post, Req, Res, UnauthorizedException, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';
import { GithubAuthGuard } from './guards/github-auth/github-auth.guard';
import { JwtAuthGuard } from './guards/jwt/jwt.guard';
import type { AuthenticatedUser } from './decorator/jwt.decorator';
import { CurrentUser } from './decorator/jwt.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @UseGuards(GithubAuthGuard)
  @Get('github/login')
  async githubLogin() { }

  @UseGuards(GithubAuthGuard)
  @Get('github/callback')
  async githubCallback(@Req() req, @Res() res: Response) {
    const tokens = await this.authService.login(req.user.id);

    // Set secure cookies instead of URL params
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.redirect(`https://corethink-test.web.app`);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  async googleLogin() { }

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req, @Res() res: Response) {
    const tokens = await this.authService.login(req.user.id);

    // Same cookie setup
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.redirect(`https://corethink-test.web.app`);
  }

  @Post('refresh')
  async refreshToken(@Body() body: { refreshToken: string }) {
    try {
      const newTokens = await this.authService.refreshToken(body.refreshToken);
      return newTokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // @UseGuards(JwtAuthGuard)
  @Get('userInfo')
  async getUserInfo(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    try {
      const userInfo = await this.authService.getUserInfo(user.userId);
      return userInfo;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to get user information');
    }
  }
}