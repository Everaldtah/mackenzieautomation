import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateExternalSignalDto {
  @ApiProperty({ example: 'reddit' })
  @IsString()
  platformSource: string;

  @ApiProperty({ example: 'abc123' })
  @IsString()
  platformPostId: string;

  @ApiProperty({ example: 'https://reddit.com/r/UKFamilyCourt/comments/abc123' })
  @IsString()
  platformUrl: string;

  @ApiProperty({ example: 'worried_parent_2024' })
  @IsString()
  authorUsername: string;

  @ApiProperty({ example: 'I have a hearing next week and I\'m so stressed...' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  postedAt?: string;
}
