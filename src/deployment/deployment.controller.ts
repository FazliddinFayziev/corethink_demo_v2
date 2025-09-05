import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { DeploymentService } from './deployment.service';
import { CreateDeploymentDto } from './dto/create-deployment.dto';

@Controller('api/deployment')
export class DeploymentController {
    constructor(private readonly deploymentService: DeploymentService) { }

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