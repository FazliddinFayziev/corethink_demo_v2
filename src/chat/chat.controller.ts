import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { GenerateTemplateDto, GenerateTemplateResponse, GetAllPagesResponse } from './dto/chat.types';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('generate')
  async generateTemplate(@Body() dto: any): Promise<GenerateTemplateResponse> {
    try {
      const result = await this.chatService.generateTemplate(dto);
      
      return {
        success: true,
        data: {
          response: result.response,
          generatedPages: result.generatedPages,
          conversationHistory: result.conversationHistory,
          allGeneratedPages: this.chatService.getAllGeneratedPages(result.conversationHistory)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to generate template'
      };
    }
  }

  @Post('pages/all')
  getAllPages(@Body() body: any): Promise<GetAllPagesResponse> {
    try {
      const allPages = this.chatService.getAllGeneratedPages(body.conversationHistory);
      
      return Promise.resolve({
        success: true,
        data: {
          allGeneratedPages: allPages
        }
      });
    } catch (error) {
      return Promise.resolve({
        success: false,
        error: error.message || 'Failed to retrieve pages'
      });
    }
  }
}