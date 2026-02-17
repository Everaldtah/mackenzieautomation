import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@family-support/database';

@ApiTags('Analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('funnel')
  @ApiOperation({ summary: 'Get conversion funnel data' })
  async getConversionFunnel() {
    return this.analyticsService.getConversionFunnel();
  }

  @Get('timeseries')
  @ApiOperation({ summary: 'Get time series data' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getTimeSeriesData(@Query('days') days?: number) {
    return this.analyticsService.getTimeSeriesData(days);
  }

  @Get('archetypes')
  @ApiOperation({ summary: 'Get archetype distribution' })
  async getArchetypeDistribution() {
    return this.analyticsService.getArchetypeDistribution();
  }

  @Get('services')
  @ApiOperation({ summary: 'Get service performance' })
  async getServicePerformance() {
    return this.analyticsService.getServicePerformance();
  }

  @Get('external-signals')
  @ApiOperation({ summary: 'Get external signals analytics' })
  async getExternalSignalsAnalytics() {
    return this.analyticsService.getExternalSignalsAnalytics();
  }
}
