import { Injectable } from '@nestjs/common';
import { PrismaClient, BookingStatus, PaymentStatus } from '@family-support/database';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { AutomationService } from '../automation/automation.service';

const prisma = new PrismaClient();

@Injectable()
export class BookingsService {
  constructor(private automationService: AutomationService) {}

  async create(userId: string, data: CreateBookingDto) {
    const booking = await prisma.booking.create({
      data: {
        userId,
        intakeId: data.intakeId,
        serviceType: data.serviceType,
        scheduledAt: new Date(data.scheduledAt),
        duration: data.durationMinutes,
        notes: data.notes,
        price: data.price,
        status: BookingStatus.CONFIRMED,
        paymentStatus: PaymentStatus.PENDING,
      },
    });

    // Update intake status
    await prisma.intake.update({
      where: { id: data.intakeId },
      data: { status: 'BOOKED' as any },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        eventType: 'booking_created',
        bookingId: booking.id,
        payload: {
          serviceType: data.serviceType,
          scheduledAt: data.scheduledAt,
        },
      },
    });

    // Trigger automation
    await this.automationService.triggerBookingAutomation(booking);

    return booking;
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    status?: BookingStatus;
    userId?: string;
  }) {
    const { page = 1, limit = 20, status, userId } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
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
          intake: true,
        },
        orderBy: { scheduledAt: 'asc' },
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      data: bookings,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.booking.findUnique({
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
        intake: true,
      },
    });
  }

  async update(id: string, data: UpdateBookingDto) {
    const updateData: any = {
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
      status: data.status,
      notes: data.notes,
    };

    if (data.durationMinutes !== undefined) {
      updateData.duration = data.durationMinutes;
    }

    if (data.price !== undefined) {
      updateData.price = data.price;
    }

    if (data.paymentStatus !== undefined) {
      updateData.paymentStatus = data.paymentStatus;
    }

    return prisma.booking.update({
      where: { id },
      data: updateData,
    });
  }

  async getUpcomingBookings(days: number = 7) {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    return prisma.booking.findMany({
      where: {
        scheduledAt: {
          gte: startDate,
          lte: endDate,
        },
        status: BookingStatus.CONFIRMED,
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
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getStats() {
    const [
      totalBookings,
      byStatus,
      upcomingCount,
      revenue,
    ] = await Promise.all([
      prisma.booking.count(),
      prisma.booking.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.booking.count({
        where: {
          scheduledAt: { gte: new Date() },
          status: BookingStatus.CONFIRMED,
        },
      }),
      prisma.booking.aggregate({
        where: { paymentStatus: PaymentStatus.PAID },
        _sum: { price: true },
      }),
    ]);

    return {
      total: totalBookings,
      byStatus,
      upcoming: upcomingCount,
      totalRevenue: revenue._sum.price || 0,
    };
  }
}
