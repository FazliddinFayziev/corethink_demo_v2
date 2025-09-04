import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class SendMessageDto {
    @IsString()
    @IsNotEmpty()
    message: string;

    @IsString()
    @IsNotEmpty()
    projectId: string;

    @IsArray()
    @IsOptional()
    conversationHistory?: any[];
}
