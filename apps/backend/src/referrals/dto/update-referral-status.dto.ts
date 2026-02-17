import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReferralStatus } from '@family-support/database';

export class UpdateReferralStatusDto {
  @ApiProperty({ enum: ReferralStatus })
  @IsEnum(ReferralStatus)
  status: ReferralStatus;
}
