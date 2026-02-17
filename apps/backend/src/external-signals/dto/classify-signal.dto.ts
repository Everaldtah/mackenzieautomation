import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClassifySignalDto {
  @ApiProperty({ example: 'I have a hearing next week and I\'m so stressed...' })
  @IsString()
  content: string;
}
