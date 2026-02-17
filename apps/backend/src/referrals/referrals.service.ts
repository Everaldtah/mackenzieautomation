import { Injectable } from '@nestjs/common';
import { PrismaClient, ReferralStatus } from '@family-support/database';
import { CreateReferralDto } from './dto/create-referral.dto';
import { AutomationService } from '../automation/automation.service';

const prisma = new PrismaClient();

@Injectable()
export class ReferralsService {
  constructor(private automationService: AutomationService) {}

  async create(userId: string, data: CreateReferralDto) {
    const referral = await prisma.referral.create({
      data: {
        userId,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        clientName: data.clientName,
        serviceRequested: data.serviceRequested,
        referredTo: data.referredTo,
        notes: data.notes,
        status: ReferralStatus.SENT,
      },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        eventType: 'referral_shared',
        referralId: referral.id,
        payload: {
          clientEmail: data.clientEmail,
          serviceRequested: data.serviceRequested,
        },
      },
    });

    // Trigger automation
    await this.automationService.triggerReferralAutomation(referral);

    return referral;
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    status?: ReferralStatus;
    userId?: string;
  }) {
    const { page = 1, limit = 20, status, userId } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
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
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.referral.count({ where }),
    ]);

    return {
      data: referrals,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.referral.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: ReferralStatus) {
    const updateData: any = { status };
    
    if (status === ReferralStatus.CONVERTED) {
      updateData.convertedAt = new Date();
    }

    return prisma.referral.update({
      where: { id },
      data: updateData,
    });
  }

  async getStats() {
    const [
      totalReferrals,
      byStatus,
      convertedCount,
    ] = await Promise.all([
      prisma.referral.count(),
      prisma.referral.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.referral.count({
        where: { status: ReferralStatus.CONVERTED },
      }),
    ]);

    return {
      total: totalReferrals,
      byStatus,
      converted: convertedCount,
      conversionRate: totalReferrals > 0 ? (convertedCount / totalReferrals) * 100 : 0,
    };
  }
}
