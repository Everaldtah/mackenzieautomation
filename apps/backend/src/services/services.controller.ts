import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ServicesService } from './services.service';

@ApiTags('Services')
@Controller('services')
export class ServicesController {
  constructor(private servicesService: ServicesService) {}

  @Get()
  @ApiOperation({ summary: 'List all active services' })
  async findAll() {
    return this.servicesService.findAll();
  }

  @Get('urgent')
  @ApiOperation({ summary: 'Get urgent services' })
  async getUrgentServices() {
    return this.servicesService.getUrgentServices();
  }

  @Get('by-archetype')
  @ApiOperation({ summary: 'Get services by archetype' })
  @ApiQuery({ name: 'archetype', required: true, type: String })
  async findByArchetype(@Query('archetype') archetype: string) {
    return this.servicesService.findByArchetype(archetype);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get service by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.servicesService.findBySlug(slug);
  }
}
