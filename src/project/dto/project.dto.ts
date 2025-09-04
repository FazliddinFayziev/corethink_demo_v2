import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsUrl
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  domainName: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  url?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  messages?: string[];

  @IsString()
  @IsOptional()
  userId?: string;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  domainName?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  @IsUrl()
  url?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  messages?: string[];
}