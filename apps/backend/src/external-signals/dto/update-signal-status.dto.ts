import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SignalStatus } from '@family-support/database';

export class UpdateSignalStatusDto {
  @ApiProperty({ enum: SignalStatus })
  @IsEnum(SignalStatus)
  status: SignalStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reviewedBy?: string;
}
