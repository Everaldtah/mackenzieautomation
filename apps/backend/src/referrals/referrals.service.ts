import { Injectable } from '@nestjs/common';
import { PrismaClient, ReferralStatus, ServiceType } from '@family-support/database';
import { CreateReferralDto } from './dto/create-referral.dto';
import { AutomationService } from '../automation/automation.service';

const prisma = new PrismaClient();

@Injectable()
export class ReferralsService {
  constructor(private automationService: AutomationService) {}

  async create(referrerId: string, data: CreateReferralDto) {
    const referral = await prisma.referral.create({
      data: {
        referrerId,
        referredEmail: data.referredEmail,
        referredPhone: data.referredPhone,
        referredName: data.referredName,
        serviceType: data.serviceType,
        message: data.message,
        status: ReferralStatus.SENT,
      },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        eventType: 'referral_shared',
        referralId: referral.id,
        payload: {
          referredEmail: data.referredEmail,
          serviceType: data.serviceType,
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
    referrerId?: string;
  }) {
    const { page = 1, limit = 20, status, referrerId } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (referrerId) where.referrerId = referrerId;

    const [referrals, total] = await Promise.all([
      prisma.referral.findMany({
        where,
        skip,
        take: limit,
        include: {
          referrer: {
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
        referrer: {
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
