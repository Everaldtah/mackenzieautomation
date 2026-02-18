import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaClient, ServiceType, ContactMethod, ClientArchetype, IntakeStatus } from '@family-support/database';
import { CreateIntakeDto } from './dto/create-intake.dto';
import { UpdateIntakeDto } from './dto/update-intake.dto';
import { AutomationService } from '../automation/automation.service';

const prisma = new PrismaClient();

interface UrgencyResult {
  score: number;
  factors: string[];
}

@Injectable()
export class IntakesService {
  constructor(
    @InjectQueue('automation') private automationQueue: Queue,
    private automationService: AutomationService,
  ) {}

  calculateUrgency(data: CreateIntakeDto): UrgencyResult {
    let score = 0;
    const factors: string[] = [];

    // Hearing date urgency
    if (data.hearingDate) {
      const hearingDate = new Date(data.hearingDate);
      const now = new Date();
      const daysUntilHearing = Math.ceil((hearingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilHearing <= 2) {
        score += 40;
        factors.push('Hearing within 48 hours');
      } else if (daysUntilHearing <= 7) {
        score += 30;
        factors.push('Hearing within 7 days');
      } else if (daysUntilHearing <= 14) {
        score += 15;
        factors.push('Hearing within 14 days');
      }
    }

    // Safeguarding concerns
    if (data.safeguardingConcerns) {
      score += 25;
      factors.push('Safeguarding concerns reported');
    }

    // Emergency service type
    if (data.serviceType === ServiceType.EMERGENCY_SUPPORT) {
      score += 20;
      factors.push('Emergency support requested');
    }

    // Children involved
    if (data.childrenInvolved && data.childrenCount && data.childrenCount > 2) {
      score += 10;
      factors.push('Multiple children involved');
    }

    // No previous mediation
    if (data.previousMediation === false) {
      score += 5;
      factors.push('No previous mediation experience');
    }

    // Cap at 100
    score = Math.min(score, 100);

    return { score, factors };
  }

  determineArchetype(data: CreateIntakeDto): ClientArchetype | undefined {
    // Last-minute emergency: hearing within 48 hours
    if (data.hearingDate) {
      const hearingDate = new Date(data.hearingDate);
      const now = new Date();
      const hoursUntilHearing = (hearingDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      if (hoursUntilHearing <= 48) {
        return ClientArchetype.COURT_IMMINENT;
      }
    }

    // Domestic allegation case
    if (data.safeguardingConcerns) {
      return ClientArchetype.COMPLEX_CASE;
    }

    // Sudden court parent: no previous mediation, first time
    if (!data.previousMediation && data.hearingDate) {
      return ClientArchetype.SELF_REP_LITIGANT;
    }

    // Self-representing father (detected from responses or archetype selection)
    if (data.archetype === ClientArchetype.SELF_REP_LITIGANT) {
      return ClientArchetype.SELF_REP_LITIGANT;
    }

    // Ongoing litigant: has previous mediation experience
    if (data.previousMediation) {
      return ClientArchetype.COMPLEX_CASE;
    }

    return data.archetype;
  }

  async create(userId: string, data: CreateIntakeDto) {
    const urgency = this.calculateUrgency(data);
    const archetype = this.determineArchetype(data);

    const intake = await prisma.intake.create({
      data: {
        userId,
        serviceType: data.serviceType,
        urgencyScore: urgency.score,
        hearingDate: data.hearingDate ? new Date(data.hearingDate) : null,
        courtName: data.courtName,
        contactMethod: data.contactMethod,
        archetype,
        responses: data.responses as any,
        status: IntakeStatus.PENDING,
      },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        eventType: 'intake_submitted',
        intakeId: intake.id,
        payload: {
          urgencyScore: urgency.score,
          factors: urgency.factors,
          serviceType: data.serviceType,
        },
      },
    });

    // Trigger automation
    await this.automationService.triggerIntakeAutomation(intake, urgency);

    // Send urgent alert if needed
    if (urgency.score >= 70) {
      await this.automationService.sendUrgentAlert(intake, urgency);
    }

    return {
      intake,
      urgency,
    };
  }

  async findAll(options: { 
    page?: number; 
    limit?: number; 
    status?: IntakeStatus;
    serviceType?: ServiceType;
    minUrgency?: number;
  }) {
    const { page = 1, limit = 20, status, serviceType, minUrgency } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (serviceType) where.serviceType = serviceType;
    if (minUrgency) where.urgencyScore = { gte: minUrgency };

    const [intakes, total] = await Promise.all([
      prisma.intake.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
        orderBy: [
          { urgencyScore: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.intake.count({ where }),
    ]);

    return {
      data: intakes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.intake.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        bookings: true,
      },
    });
  }

  async update(id: string, data: UpdateIntakeDto) {
    return prisma.intake.update({
      where: { id },
      data: {
        ...data,
        hearingDate: data.hearingDate ? new Date(data.hearingDate) : undefined,
      },
    });
  }

  async getUrgentIntakes() {
    return prisma.intake.findMany({
      where: {
        urgencyScore: { gte: 70 },
        status: { in: [IntakeStatus.PENDING, IntakeStatus.QUALIFIED] },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
      orderBy: { urgencyScore: 'desc' },
      take: 20,
    });
  }

  async getStats() {
    const [
      totalIntakes,
      pendingIntakes,
      urgentIntakes,
      intakesByService,
      intakesByArchetype,
    ] = await Promise.all([
      prisma.intake.count(),
      prisma.intake.count({ where: { status: IntakeStatus.PENDING } }),
      prisma.intake.count({ where: { urgencyScore: { gte: 70 } } }),
      prisma.intake.groupBy({
        by: ['serviceType'],
        _count: { serviceType: true },
      }),
      prisma.intake.groupBy({
        by: ['archetype'],
        _count: { archetype: true },
      }),
    ]);

    return {
      total: totalIntakes,
      pending: pendingIntakes,
      urgent: urgentIntakes,
      byService: intakesByService,
      byArchetype: intakesByArchetype,
    };
  }
}
