import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ExternalSignalsService } from './external-signals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateExternalSignalDto } from './dto/create-external-signal.dto';
import { UpdateSignalStatusDto } from './dto/update-signal-status.dto';
import { ClassifySignalDto } from './dto/classify-signal.dto';
import { DistressLevel, SignalStatus, UserRole } from '@family-support/database';

@ApiTags('External Signals')
@Controller('external-signals')
export class ExternalSignalsController {
  constructor(private externalSignalsService: ExternalSignalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new external signal (webhook from worker)' })
  async createSignal(@Body() createDto: CreateExternalSignalDto) {
    return this.externalSignalsService.createSignal(createDto);
  }

  @Post('classify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Classify content without creating signal' })
  async classifyContent(@Body() classifyDto: ClassifySignalDto) {
    return this.externalSignalsService.classifyContent(classifyDto.content);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all external signals' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: SignalStatus })
  @ApiQuery({ name: 'distressLevel', required: false, enum: DistressLevel })
  @ApiQuery({ name: 'platformSource', required: false, type: String })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: SignalStatus,
    @Query('distressLevel') distressLevel?: DistressLevel,
    @Query('platformSource') platformSource?: string,
  ) {
    return this.externalSignalsService.findAll({ page, limit, status, distressLevel, platformSource });
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get external signals statistics' })
  async getStats() {
    return this.externalSignalsService.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get signal by ID' })
  async findById(@Param('id') id: string) {
    return this.externalSignalsService.findById(id);
  }

  @Put(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update signal status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateSignalStatusDto,
  ) {
    return this.externalSignalsService.updateStatus(id, updateDto.status, updateDto.reviewedBy);
  }
}
