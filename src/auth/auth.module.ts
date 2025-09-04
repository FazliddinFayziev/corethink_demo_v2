import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { UserModule } from 'src/user/user.module';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import googleOauthConfig from './config/google-oath.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GoogleStrategy } from './strategies/google.strategy';
import { GithubStrategy } from './strategies/github.strategy';
import { JwtAuthGuard } from './guards/jwt/jwt.guard';
import { DbModule } from 'src/db/db.module';

@Module({
  imports: [
    DbModule,
    ConfigModule.forFeature(googleOauthConfig),
    ConfigModule,
    UserModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'corethink-secret',
        signOptions: { 
          expiresIn: '15m', 
          issuer: 'corethink-api',
          audience: 'corethink-users'
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
    GithubStrategy,
    JwtAuthGuard, 
  ],
  exports: [
    AuthService,
    JwtAuthGuard, 
    JwtModule, 
  ],
})
export class AuthModule {}