import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OutreachService } from './outreach.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { GenerateOutreachDto } from './dto/generate-outreach.dto';
import { ReviewOutreachDto } from './dto/review-outreach.dto';
import { SendOutreachDto } from './dto/send-outreach.dto';
import { DraftStatus, UserRole } from '@family-support/database';

@ApiTags('Outreach')
@Controller('outreach')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
@ApiBearerAuth()
export class OutreachController {
  constructor(private outreachService: OutreachService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate outreach draft for a signal' })
  async generateDraft(@Body() generateDto: GenerateOutreachDto) {
    return this.outreachService.generateDraft(generateDto);
  }

  @Post('review')
  @ApiOperation({ summary: 'Review an outreach draft' })
  async reviewDraft(@Body() reviewDto: ReviewOutreachDto) {
    return this.outreachService.reviewDraft(reviewDto);
  }

  @Post('send')
  @ApiOperation({ summary: 'Send approved outreach' })
  async sendOutreach(@Body() sendDto: SendOutreachDto) {
    return this.outreachService.sendOutreach(sendDto.draftId, sendDto.sentBy);
  }

  @Get('drafts')
  @ApiOperation({ summary: 'List all outreach drafts' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: DraftStatus })
  async findAllDrafts(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: DraftStatus,
  ) {
    return this.outreachService.findAllDrafts({ page, limit, status });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get outreach statistics' })
  async getStats() {
    return this.outreachService.getStats();
  }
}
