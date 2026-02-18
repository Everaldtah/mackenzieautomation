import { IsString, IsEnum, IsOptional, IsBoolean, IsNumber, IsDateString, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceType, ContactMethod, IntakeStatus, ClientArchetype } from '@family-support/database';

export class UpdateIntakeDto {
  @ApiPropertyOptional({ enum: ServiceType })
  @IsOptional()
  @IsEnum(ServiceType)
  serviceType?: ServiceType;

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

  @ApiPropertyOptional({ enum: ContactMethod })
  @IsOptional()
  @IsEnum(ContactMethod)
  contactMethod?: ContactMethod;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  availabilityNotes?: string;

  @ApiPropertyOptional({ enum: IntakeStatus })
  @IsOptional()
  @IsEnum(IntakeStatus)
  status?: IntakeStatus;

  @ApiPropertyOptional({ enum: ClientArchetype })
  @IsOptional()
  @IsEnum(ClientArchetype)
  archetype?: ClientArchetype;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  responses?: Record<string, any>;
}
