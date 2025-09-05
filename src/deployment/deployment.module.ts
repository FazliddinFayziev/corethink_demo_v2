import { Module } from '@nestjs/common';
import { DeploymentController } from './deployment.controller';
import { DeploymentService } from './deployment.service';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from 'src/db/db.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
    imports: [
        ConfigModule,
        DbModule,
        AuthModule,
    ],
    controllers: [DeploymentController],
    providers: [DeploymentService],
})
export class DeploymentModule { }