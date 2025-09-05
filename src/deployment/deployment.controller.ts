import { Controller, Post, Body, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';

@Controller('api/deployment')
export class DeploymentController {
    constructor(private readonly deploymentService: DeploymentService) { }

    @UseGuards(JwtAuthGuard)
    @Post('deploy')
    async deployToVercel(@Body() createDeploymentDto: CreateDeploymentDto) {
        try {
            const deploymentUrl = await this.deploymentService.deployHtmlToVercel(
                createDeploymentDto.htmlCode,
                createDeploymentDto.projectId
            );

            return {
                success: true,
                message: 'Deployment successful',
                url: deploymentUrl,
                deployedAt: new Date().toISOString()
            };
        } catch (error) {
            throw new HttpException(
                {
                    success: false,
                    message: 'Deployment failed',
                    error: error.message
                },
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}