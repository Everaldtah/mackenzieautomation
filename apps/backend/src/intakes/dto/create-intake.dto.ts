import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsDateString, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType, ContactMethod, ClientArchetype } from '@family-support/database';

export class CreateIntakeDto {
  @ApiProperty({ enum: ServiceType })
  @IsEnum(ServiceType)
  serviceType: ServiceType;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDateString()
  hearingDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  courtName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caseNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  childrenInvolved?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  childrenCount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  safeguardingConcerns?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  previousMediation?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  legalAidEligible?: boolean;

  @ApiProperty({ enum: ContactMethod })
  @IsEnum(ContactMethod)
  preferredContact: ContactMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  availabilityNotes?: string;

  @ApiPropertyOptional({ enum: ClientArchetype })
  @IsOptional()
  @IsEnum(ClientArchetype)
  archetype?: ClientArchetype;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  responses?: Record<string, any>;
}
