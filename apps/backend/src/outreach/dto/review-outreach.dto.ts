import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewOutreachDto {
  @ApiProperty({ example: 'draft-uuid' })
  @IsString()
  draftId: string;

  @ApiProperty({ enum: ['approve', 'edit', 'reject'] })
  @IsEnum(['approve', 'edit', 'reject'])
  action: 'approve' | 'edit' | 'reject';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  editedContent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiProperty({ example: 'user-uuid' })
  @IsString()
  reviewedBy: string;
}
