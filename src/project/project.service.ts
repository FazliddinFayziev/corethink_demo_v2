import { Injectable } from '@nestjs/common';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { Prisma } from '@prisma/client';
import { DbService } from 'src/db/db.service';
import { ConfigService } from '@nestjs/config';
import system_prompt from './dto/systemPrompt';

// Define proper interfaces for messages
interface ProjectMessage {
    id: string;
    content: string;
    sender: 'user' | 'ai';
    timestamp: string;
    [key: string]: any;
}

interface AnthropicMessage {
    role: 'user' | 'assistant';
    content: string;
}

@Injectable()
export class ProjectService {
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.anthropic.com/v1/messages';

    constructor(
        private readonly db: DbService,
        private readonly configService: ConfigService
    ) {
        const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
        if (!apiKey) {
            throw new Error('ANTHROPIC_API_KEY is required');
        }
        this.apiKey = apiKey;
    }

    async createProject(createProjectDto: CreateProjectDto, userId: string) {
        try {
            return await this.db.project.create({
                data: {
                    name: createProjectDto.name,
                    domainName: createProjectDto.domainName,
                    category: createProjectDto.category,
                    url: createProjectDto.url,
                    messages: createProjectDto.messages || [],
                    userId: userId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new Error('Domain name already exists');
                }
                if (error.code === 'P2003') {
                    throw new Error('User not found');
                }
            }
            throw error;
        }
    }

    async getAllProjects(userId: string) {
        return await this.db.project.findMany({
            where: {
                userId: userId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async getProjectById(id: string) {
        return await this.db.project.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });
    }

    async getProjectByDomain(domainName: string) {
        return await this.db.project.findUnique({
            where: { domainName },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });
    }

    async getProjectsByUser(userId: string) {
        return await this.db.project.findMany({
            where: { userId },
            include: {
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    async updateProject(id: string, updateProjectDto: UpdateProjectDto) {
        try {
            return await this.db.project.update({
                where: { id },
                data: {
                    ...(updateProjectDto.name && { name: updateProjectDto.name }),
                    ...(updateProjectDto.domainName && { domainName: updateProjectDto.domainName }),
                    ...(updateProjectDto.category !== undefined && { category: updateProjectDto.category }),
                    ...(updateProjectDto.url !== undefined && { url: updateProjectDto.url }),
                    ...(updateProjectDto.messages && { messages: updateProjectDto.messages }),
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') {
                    throw new Error('Domain name already exists');
                }
                if (error.code === 'P2025') {
                    return null;
                }
            }
            throw error;
        }
    }

    async deleteProject(id: string) {
        try {
            await this.db.project.delete({
                where: { id },
            });
            return true;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    return false;
                }
            }
            throw error;
        }
    }

    async addMessage(projectId: string, message: string) {
        try {
            // Get current project first
            const project = await this.db.project.findUnique({
                where: { id: projectId },
            });

            if (!project) {
                return null;
            }

            const messageObj: ProjectMessage = {
                id: `msg_${Date.now()}`,
                content: message,
                sender: 'user',
                timestamp: new Date().toISOString(),
            };

            // Get existing messages and add new one
            const existingMessages = this.parseMessages(project.messages);
            const updatedMessages = [...existingMessages, messageObj];

            return await this.db.project.update({
                where: { id: projectId },
                data: {
                    messages: JSON.parse(JSON.stringify(updatedMessages)), // Ensure proper JSON format
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                },
            });
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2025') {
                    return null;
                }
            }
            throw error;
        }
    }

    async sendMessageToProject(projectId: string, message: string, userId: string) {
        try {
            // Get current project
            const project = await this.db.project.findUnique({
                where: { id: projectId },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            if (!project) {
                throw new Error('Project not found');
            }

            // Verify user ownership
            if (project.userId !== userId) {
                throw new Error('Access denied');
            }

            // Create user message
            const userMessage: ProjectMessage = {
                id: `msg_${Date.now()}`,
                content: message,
                sender: 'user',
                timestamp: new Date().toISOString(),
            };

            // Get and format conversation history
            const conversationHistory = this.parseMessages(project.messages);
            const anthropicMessages = this.formatMessagesForAnthropic(conversationHistory);

            // Add current user message to conversation for Anthropic
            anthropicMessages.push({
                role: 'user',
                content: message,
            });

            // Call Anthropic API
            const aiResponseContent = await this.callAnthropicAPI(anthropicMessages, project.name);

            // Create AI message
            const aiMessage: ProjectMessage = {
                id: `msg_${Date.now() + 1}`,
                content: aiResponseContent,
                sender: 'ai',
                timestamp: new Date().toISOString(),
            };

            // Update project with new messages
            const updatedMessages = [...conversationHistory, userMessage, aiMessage];

            const updatedProject = await this.db.project.update({
                where: { id: projectId },
                data: {
                    messages: JSON.parse(JSON.stringify(updatedMessages)), // Convert to proper JSON
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            });

            return {
                success: true,
                project: updatedProject,
                userMessage,
                aiMessage,
                conversationHistory: updatedMessages,
            };

        } catch (error) {
            console.error('Error in sendMessageToProject:', error);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    }

    private parseMessages(messages: any): ProjectMessage[] {
        if (!messages) {
            return [];
        }

        if (!Array.isArray(messages)) {
            return [];
        }

        return messages
            .filter((msg): msg is ProjectMessage => {
                return msg &&
                    typeof msg === 'object' &&
                    typeof msg.id === 'string' &&
                    typeof msg.content === 'string' &&
                    (msg.sender === 'user' || msg.sender === 'ai') &&
                    typeof msg.timestamp === 'string';
            })
            .map(msg => ({
                ...msg,
                id: msg.id,
                content: msg.content,
                sender: msg.sender as 'user' | 'ai',
                timestamp: msg.timestamp,
            }));
    }

    private formatMessagesForAnthropic(messages: ProjectMessage[]): AnthropicMessage[] {
        return messages.map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.content,
        }));
    }

    private async callAnthropicAPI(messages: AnthropicMessage[], projectName: string): Promise<string> {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20241022',
                    max_tokens: 4000,
                    temperature: 0.7,
                    system: `${system_prompt}. The project is called "${projectName}". 
                    Be helpful, concise, and provide practical advice for building web applications. 
                    Focus on code suggestions, best practices, and problem-solving.`,
                    messages: messages,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Anthropic API error:', response.status, errorText);
                throw new Error(`Anthropic API error: ${response.status}`);
            }

            const data = await response.json();

            if (!data.content || !Array.isArray(data.content)) {
                throw new Error('Invalid response format from Anthropic API');
            }

            const content = data.content
                .filter((block: any) => block.type === 'text')
                .map((block: any) => block.text)
                .join('\n');

            return content || 'I apologize, but I couldn\'t generate a proper response. Please try again.';

        } catch (error) {
            console.error('Anthropic API call failed:', error);

            // Return a fallback message instead of throwing
            return `I'm sorry, I'm having trouble connecting to the AI service right now. Please try again in a moment. 
      
In the meantime, I'd be happy to help with your project "${projectName}" once the connection is restored.`;
        }
    }
}