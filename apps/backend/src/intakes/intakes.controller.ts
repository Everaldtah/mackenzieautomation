import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IntakesService } from './intakes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateIntakeDto } from './dto/create-intake.dto';
import { UpdateIntakeDto } from './dto/update-intake.dto';
import { ServiceType, IntakeStatus, UserRole } from '@family-support/database';

@ApiTags('Intakes')
@Controller('intakes')
export class IntakesController {
  constructor(private intakesService: IntakesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit a new intake' })
  async create(@Body() createIntakeDto: CreateIntakeDto, @Request() req) {
    return this.intakesService.create(req.user.sub, createIntakeDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all intakes' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: IntakeStatus })
  @ApiQuery({ name: 'serviceType', required: false, enum: ServiceType })
  @ApiQuery({ name: 'minUrgency', required: false, type: Number })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: IntakeStatus,
    @Query('serviceType') serviceType?: ServiceType,
    @Query('minUrgency') minUrgency?: number,
  ) {
    return this.intakesService.findAll({ page, limit, status, serviceType, minUrgency });
  }

  @Get('urgent')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get urgent intakes (urgency >= 70)' })
  async getUrgentIntakes() {
    return this.intakesService.getUrgentIntakes();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get intake statistics' })
  async getStats() {
    return this.intakesService.getStats();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get intake by ID' })
  async findById(@Param('id') id: string) {
    return this.intakesService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.STAFF)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update intake' })
  async update(@Param('id') id: string, @Body() updateIntakeDto: UpdateIntakeDto) {
    return this.intakesService.update(id, updateIntakeDto);
  }
}
