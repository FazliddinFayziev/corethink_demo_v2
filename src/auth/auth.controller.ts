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
    
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: true, // Always true for HTTPS
      sameSite: 'none', // CRITICAL: Required for cross-domain
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true, // Always true for HTTPS  
      sameSite: 'none', // CRITICAL: Required for cross-domain
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log('🔥 GitHub cookies set, redirecting...');
    res.redirect(`https://corethink-test.web.app`);
  }

  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  async googleLogin() { }

  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  async googleCallback(@Req() req, @Res() res: Response) {
    const tokens = await this.authService.login(req.user.id);

    // FIXED: Cross-domain cookie settings
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: true, // Always true for HTTPS
      sameSite: 'none', // CRITICAL: Required for cross-domain
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true, // Always true for HTTPS
      sameSite: 'none', // CRITICAL: Required for cross-domain
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    console.log('🔥 Google cookies set, redirecting...');
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

  // FIXED: Uncommented the guard and added proper error handling
  @UseGuards(JwtAuthGuard)
  @Get('userInfo')
  async getUserInfo(
    @CurrentUser() user: AuthenticatedUser,
  ) {
    console.log('🔥 getUserInfo called for user:', user?.userId);
    try {
      const userInfo = await this.authService.getUserInfo(user.userId);
      console.log('🔥 User info retrieved successfully');
      return userInfo;
    } catch (error) {
      console.log('🔥 getUserInfo error:', error.message);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to get user information');
    }
  }

  // BONUS: Add a logout endpoint
  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('accessToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
    
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: true,
      sameSite: 'none'
    });
    
    return res.json({ message: 'Logged out successfully' });
  }
}