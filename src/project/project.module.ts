import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { DbModule } from 'src/db/db.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    ConfigModule,
    DbModule,
    AuthModule,
  ],
  controllers: [ProjectController],
  providers: [ProjectService],
  exports: [ProjectService]
})
export class ProjectModule { }