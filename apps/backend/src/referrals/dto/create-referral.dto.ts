import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType } from '@family-support/database';

export class CreateReferralDto {
  @ApiProperty({ example: 'friend@example.com' })
  @IsString()
  referredEmail: string;

  @ApiPropertyOptional({ example: '+447123456789' })
  @IsOptional()
  @IsString()
  referredPhone?: string;

  @ApiPropertyOptional({ example: 'John Smith' })
  @IsOptional()
  @IsString()
  referredName?: string;

  @ApiPropertyOptional({ enum: ServiceType })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

  @ApiPropertyOptional({ example: 'I think this service could help you.' })
  @IsOptional()
  @IsString()
  message?: string;
}
