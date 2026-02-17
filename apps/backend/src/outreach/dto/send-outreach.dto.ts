import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendOutreachDto {
  @ApiProperty({ example: 'draft-uuid' })
  @IsString()
  draftId: string;

  @ApiProperty({ example: 'user-uuid' })
  @IsString()
  sentBy: string;
}
