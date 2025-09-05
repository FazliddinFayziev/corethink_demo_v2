import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDeploymentDto {
    @IsString()
    @IsNotEmpty()
    htmlCode: string;

    @IsString()
    @IsNotEmpty()
    projectId: string;
}