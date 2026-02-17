import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReferralDto {
  @ApiProperty({ example: 'John Smith' })
  @IsString()
  clientName: string;

  @ApiPropertyOptional({ example: 'client@example.com' })
  @IsOptional()
  @IsString()
  clientEmail?: string;

  @ApiPropertyOptional({ example: '+447123456789' })
  @IsOptional()
  @IsString()
  clientPhone?: string;

  @ApiProperty({ example: 'Family counseling' })
  @IsString()
  serviceRequested: string;

  @ApiProperty({ example: 'Local Family Support Centre' })
  @IsString()
  referredTo: string;

  @ApiPropertyOptional({ example: 'Client needs support with housing issues.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
