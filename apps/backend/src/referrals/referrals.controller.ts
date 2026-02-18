import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateReferralDto } from './dto/create-referral.dto';
import { UpdateReferralStatusDto } from './dto/update-referral-status.dto';
import { ReferralStatus, UserRole } from '@family-support/database';

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private referralsService: ReferralsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new referral' })
  async create(@Body() createDto: CreateReferralDto, @Request() req) {
    return this.referralsService.create(req.user.sub, createDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all referrals' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ReferralStatus })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: ReferralStatus,
  ) {
    return this.referralsService.findAll({ page, limit, status });
  }

  @Get('my-referrals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user referrals' })
  async getMyReferrals(@Request() req) {
    return this.referralsService.findAll({ userId: req.user.sub });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral statistics' })
  async getStats() {
    return this.referralsService.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get referral by ID' })
  async findById(@Param('id') id: string) {
    return this.referralsService.findById(id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update referral status' })
  async updateStatus(@Param('id') id: string, @Body() updateDto: UpdateReferralStatusDto) {
    return this.referralsService.updateStatus(id, updateDto.status);
  }
}
