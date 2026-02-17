import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@family-support/database';
import { addDays, startOfDay, endOfDay, format } from 'date-fns';

const prisma = new PrismaClient();

@Injectable()
export class AnalyticsService {
  async getConversionFunnel() {
    const [
      totalVisitors,
      intakesStarted,
      intakesCompleted,
      bookingsCreated,
      bookingsCompleted,
    ] = await Promise.all([
      // This would come from analytics tracking
      prisma.eventLog.count({ where: { eventType: 'page_view' } }),
      prisma.eventLog.count({ where: { eventType: 'intake_started' } }),
      prisma.intake.count(),
      prisma.booking.count(),
      prisma.booking.count({ where: { status: 'COMPLETED' } }),
    ]);

    return {
      stages: [
        { name: 'Visitors', count: totalVisitors || 1000 },
        { name: 'Intake Started', count: intakesStarted },
        { name: 'Intake Completed', count: intakesCompleted },
        { name: 'Booking Created', count: bookingsCreated },
        { name: 'Service Completed', count: bookingsCompleted },
      ],
      conversionRates: {
        visitorToIntake: totalVisitors > 0 ? (intakesStarted / totalVisitors) * 100 : 0,
        intakeToBooking: intakesCompleted > 0 ? (bookingsCreated / intakesCompleted) * 100 : 0,
      },
    };
  }

  async getTimeSeriesData(days: number = 30) {
    const data = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = addDays(today, -i);
      const start = startOfDay(date);
      const end = endOfDay(date);

      const [intakes, bookings, signals] = await Promise.all([
        prisma.intake.count({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
        prisma.booking.count({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
        prisma.externalSignal.count({
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        }),
      ]);

      data.push({
        date: format(date, 'yyyy-MM-dd'),
        intakes,
        bookings,
        signals,
      });
    }

    return data;
  }

  async getArchetypeDistribution() {
    return prisma.intake.groupBy({
      by: ['archetype'],
      _count: { archetype: true },
    });
  }

  async getServicePerformance() {
    const services = await prisma.service.findMany({
      where: { isActive: true },
    });

    const performance = await Promise.all(
      services.map(async (service) => {
        const [intakeCount, bookingCount] = await Promise.all([
          prisma.intake.count({
            where: { serviceType: service.slug as any },
          }),
          prisma.booking.count({
            where: { serviceType: service.slug as any },
          }),
        ]);

        return {
          service: service.name,
          slug: service.slug,
          intakes: intakeCount,
          bookings: bookingCount,
          conversionRate: intakeCount > 0 ? (bookingCount / intakeCount) * 100 : 0,
        };
      }),
    );

    return performance;
  }

  async getExternalSignalsAnalytics() {
    const [
      byPlatform,
      byDistressLevel,
      conversionStats,
    ] = await Promise.all([
      prisma.externalSignal.groupBy({
        by: ['platformSource'],
        _count: { platformSource: true },
      }),
      prisma.externalSignal.groupBy({
        by: ['distressLevel'],
        _count: { distressLevel: true },
      }),
      prisma.outreachAction.aggregate({
        _sum: { clicksDetected: true },
        _count: { convertedToIntake: true },
      }),
    ]);

    return {
      byPlatform,
      byDistressLevel,
      outreachClicks: conversionStats._sum.clicksDetected || 0,
      outreachConversions: conversionStats._count.convertedToIntake || 0,
    };
  }
}
