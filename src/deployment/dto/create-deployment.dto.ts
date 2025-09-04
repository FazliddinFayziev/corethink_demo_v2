import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class CreateDeploymentDto {
    // @IsString()
    // @IsNotEmpty()
    // htmlCode: string;

    @IsString()
    @IsOptional()
    @MaxLength(50)
    projectName?: string;
}