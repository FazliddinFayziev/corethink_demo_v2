import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { User } from '@prisma/client';
import { DbService } from 'src/db/db.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private userService: UserService,
    private readonly db: DbService,
  ) {}

  async validateOAuthUser(oauthUser: {
    email: string;
    name?: string;
    provider: string;
    providerId: string;
  }): Promise<User> {
    const existing = await this.userService.findByEmail(oauthUser.email);
    if (existing) return existing;
    return this.userService.create(oauthUser);
  }

  async login(userId: string) {
    const payload = { sub: userId };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '15m',
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify the refresh token
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_SECRET || 'corethink-secret',
      });

      // Generate new tokens
      const newPayload = { sub: payload.sub };
      const newAccessToken = this.jwtService.sign(newPayload, {
        expiresIn: '15m',
      });
      const newRefreshToken = this.jwtService.sign(newPayload, {
        expiresIn: '7d',
      });

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async getUserInfo(userId: string) {
    try {
      const user = await this.db.user.findUnique({
        where: {
          id: userId
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true
        }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      return {
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to get user information');
    }
  }
}