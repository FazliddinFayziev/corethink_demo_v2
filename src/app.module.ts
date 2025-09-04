import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { ChatModule } from './chat/chat.module';
import googleOauthConfig from './auth/config/google-oath.config';
import githubOauthConfig from './auth/config/github-oauth.config';
import { DeploymentModule } from './deployment/deployment.module';
import { DbModule } from './db/db.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TokenRefreshMiddleware } from './auth/middleware/token-refresh.middleware';
import { ProjectModule } from './project/project.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [googleOauthConfig, githubOauthConfig],
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DbModule,
    ChatModule,
    AuthModule,
    UserModule,
    ProjectModule,
    DeploymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TokenRefreshMiddleware)
      .exclude('auth/google/login', 'auth/github/login') // Exclude login routes
      .forRoutes('*'); // Apply to all other routes
  }
}
