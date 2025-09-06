import {
    Get,
    Post,
    Put,
    Body,
    Param,
    Query,
    Delete,
    UseGuards,
    Controller,
    HttpStatus,
    HttpException,
} from '@nestjs/common';
import { ProjectService } from './project.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt/jwt.guard';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { SendMessageDto } from './dto/chat.dto';
import { CurrentUser } from 'src/auth/decorator/jwt.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/jwt.decorator';

@Controller('projects')
export class ProjectController {
    constructor(private readonly projectService: ProjectService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createProject(
        @Body() createProjectDto: CreateProjectDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        try {
            return await this.projectService.createProject(createProjectDto, user.userId);
        } catch (error) {
            throw new HttpException(
                error.message || 'Failed to create project',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getAllProjects(
        @CurrentUser() user: AuthenticatedUser
    ) {
        try {
            const projects = await this.projectService.getAllProjects(user.userId);

            return {
                success: true,
                data: projects,
                count: projects.length,
                message: 'Projects fetched successfully'
            };
        } catch (error) {
            console.error('Error fetching projects:', error);
            throw new HttpException(
                'Failed to fetch projects',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get(':id')
    async getProjectById(@Param('id') id: string) {
        try {
            const project = await this.projectService.getProjectById(id);
            if (!project) {
                throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
            }
            return project;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to fetch project',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('domain/:domainName')
    async getProjectByDomain(@Param('domainName') domainName: string) {
        try {
            const project = await this.projectService.getProjectByDomain(domainName);
            if (!project) {
                throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
            }
            return project;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to fetch project',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('user/:userId')
    async getProjectsByUser(@Param('userId') userId: string) {
        try {
            return await this.projectService.getProjectsByUser(userId);
        } catch (error) {
            throw new HttpException(
                'Failed to fetch user projects',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @UseGuards(JwtAuthGuard)
    @Put(':id')
    async updateProject(
        @Param('id') id: string,
        @Body() updateProjectDto: UpdateProjectDto,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        try {
            // First check if project exists and user owns it
            const existingProject = await this.projectService.getProjectById(id);
            if (!existingProject) {
                throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
            }

            if (existingProject.userId !== user.userId) {
                throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
            }

            const project = await this.projectService.updateProject(id, updateProjectDto);
            return project;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                error.message || 'Failed to update project',
                HttpStatus.BAD_REQUEST
            );
        }
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    async deleteProject(
        @Param('id') id: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        try {
            // First check if project exists and user owns it
            const existingProject = await this.projectService.getProjectById(id);
            if (!existingProject) {
                throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
            }

            if (existingProject.userId !== user.userId) {
                throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
            }

            const deleted = await this.projectService.deleteProject(id);
            if (!deleted) {
                throw new HttpException('Failed to delete project', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            return {
                success: true,
                message: 'Project deleted successfully'
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to delete project',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/messages')
    async addMessage(
        @Param('id') id: string,
        @Body('message') message: string,
        @CurrentUser() user: AuthenticatedUser,
    ) {
        try {
            if (!message || typeof message !== 'string' || !message.trim()) {
                throw new HttpException('Valid message is required', HttpStatus.BAD_REQUEST);
            }

            // Check if project exists and user owns it
            const existingProject = await this.projectService.getProjectById(id);
            if (!existingProject) {
                throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
            }

            if (existingProject.userId !== user.userId) {
                throw new HttpException('Access denied', HttpStatus.FORBIDDEN);
            }

            const project = await this.projectService.addMessage(id, message.trim());
            if (!project) {
                throw new HttpException('Failed to add message', HttpStatus.INTERNAL_SERVER_ERROR);
            }

            return project;
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'Failed to add message',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/chat')
    async sendMessage(
        @Param('id') projectId: string,
        @Body() sendMessageDto: SendMessageDto,
        @CurrentUser() user: AuthenticatedUser,
    ): Promise<any> {
        try {
            // Validate request body
            if (!sendMessageDto.message || typeof sendMessageDto.message !== 'string' || !sendMessageDto.message.trim()) {
                throw new HttpException('Valid message is required', HttpStatus.BAD_REQUEST);
            }

            const userId = user.userId;

            // Verify user owns the project
            const project = await this.projectService.getProjectById(projectId);
            if (!project) {
                throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
            }

            if (project.userId !== userId) {
                throw new HttpException('Access denied to this project', HttpStatus.FORBIDDEN);
            }

            const result = await this.projectService.sendMessageToProject(
                projectId,
                sendMessageDto.message.trim(),
                userId
            );

            return result;
        } catch (error) {
            console.error('Chat endpoint error:', error);

            if (error instanceof HttpException) {
                throw error;
            }

            throw new HttpException(
                error.message || 'Failed to send message',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}