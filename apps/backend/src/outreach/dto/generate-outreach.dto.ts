import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateOutreachDto {
  @ApiProperty({ example: 'signal-uuid' })
  @IsString()
  signalId: string;
}
