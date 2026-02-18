import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@family-support/database';

const prisma = new PrismaClient();

@Injectable()
export class AdminService {
  async getDashboardStats() {
    const [
      totalUsers,
      totalIntakes,
      urgentIntakes,
      totalBookings,
      upcomingBookings,
      totalReferrals,
      convertedReferrals,
      totalSignals,
      pendingSignals,
      pendingOutreach,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.intake.count(),
      prisma.intake.count({ where: { urgencyScore: { gte: 70 } } }),
      prisma.booking.count(),
      prisma.booking.count({
        where: {
          scheduledAt: { gte: new Date() },
          status: 'CONFIRMED',
        },
      }),
      prisma.referral.count(),
      prisma.referral.count({ where: { status: 'CONVERTED' } }),
      prisma.externalSignal.count(),
      prisma.externalSignal.count({
        where: { status: { in: ['DETECTED', 'UNDER_REVIEW'] } },
      }),
      prisma.outreachDraft.count({
        where: { status: 'PENDING_REVIEW' },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
      },
      intakes: {
        total: totalIntakes,
        urgent: urgentIntakes,
      },
      bookings: {
        total: totalBookings,
        upcoming: upcomingBookings,
      },
      referrals: {
        total: totalReferrals,
        converted: convertedReferrals,
        conversionRate: totalReferrals > 0 ? (convertedReferrals / totalReferrals) * 100 : 0,
      },
      externalSignals: {
        total: totalSignals,
        pending: pendingSignals,
      },
      outreach: {
        pendingReview: pendingOutreach,
      },
    };
  }

  async getRecentActivity(limit: number = 10) {
    return prisma.eventLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        intake: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        signal: true,
      },
    });
  }

  async getComplianceLogs(options: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.complianceLog.findMany({
        skip,
        take: limit,
        include: {
          performedByUser: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.complianceLog.count(),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getSystemHealth() {
    // This would check various system components
    // For now, returning basic status
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        database: 'connected',
        redis: 'connected',
        queue: 'operational',
      },
    };
  }
}
