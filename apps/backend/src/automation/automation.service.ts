import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Intake, Booking, Referral, ExternalSignal } from '@family-support/database';

const prisma = new PrismaClient();

interface UrgencyResult {
  score: number;
  factors: string[];
}

@Injectable()
export class AutomationService {
  constructor(
    @InjectQueue('automation') private automationQueue: Queue,
    private configService: ConfigService,
  ) {}

  async triggerIntakeAutomation(intake: Intake, urgency: UrgencyResult) {
    // Queue welcome email
    await this.automationQueue.add('send-email', {
      template: 'welcome-after-intake',
      to: intake.userId, // Will be resolved to email
      data: {
        intakeId: intake.id,
        serviceType: intake.serviceType || 'general',
        urgencyScore: urgency.score,
      },
    }, {
      delay: 0,
    });

    // Queue urgent follow-up if needed
    if (urgency.score >= 70) {
      await this.automationQueue.add('send-email', {
        template: 'urgent-intake-followup',
        to: intake.userId,
        data: {
          intakeId: intake.id,
          hearingDate: intake.hearingDate || null,
        },
      }, {
        delay: 60 * 60 * 1000, // 1 hour delay
      });
    }
  }

  async sendUrgentAlert(intake: Intake, urgency: UrgencyResult) {
    const alertEmail = this.configService.get<string>('alerts.email');
    const alertPhone = this.configService.get<string>('alerts.phone');

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: intake.userId },
    });

    if (!user) return;

    // Queue urgent alert email to admin
    await this.automationQueue.add('send-urgent-alert', {
      type: 'urgent-intake',
      to: alertEmail,
      data: {
        intakeId: intake.id,
        clientName: `${user.firstName} ${user.lastName}`,
        clientEmail: user.email,
        clientPhone: user.phone || null,
        serviceType: intake.serviceType || 'general',
        urgencyScore: urgency.score,
        urgencyFactors: urgency.factors,
        hearingDate: intake.hearingDate || null,
        courtName: intake.courtName || null,
      },
    }, {
      priority: 1,
    });

    // Queue SMS alert if phone available
    if (alertPhone && user.phone) {
      await this.automationQueue.add('send-sms', {
        to: alertPhone,
        message: `URGENT: New intake from ${user.firstName} ${user.lastName}. Urgency: ${urgency.score}/100. Hearing: ${intake.hearingDate ? new Date(intake.hearingDate).toLocaleDateString() : 'N/A'}. Check admin dashboard.`,
      }, {
        priority: 1,
      });
    }
  }

  async triggerBookingAutomation(booking: Booking) {
    await this.automationQueue.add('send-email', {
      template: 'booking-confirmation',
      to: booking.userId,
      data: {
        bookingId: booking.id,
        serviceType: booking.serviceType,
        scheduledAt: booking.date,
        duration: booking.duration,
      },
    });

    // Send reminder 24 hours before
    const reminderTime = new Date(booking.date);
    reminderTime.setHours(reminderTime.getHours() - 24);

    if (reminderTime > new Date()) {
      await this.automationQueue.add('send-email', {
        template: 'booking-reminder',
        to: booking.userId,
        data: {
          bookingId: booking.id,
          scheduledAt: booking.date,
        },
      }, {
        delay: reminderTime.getTime() - Date.now(),
      });
    }
  }

  async triggerReferralAutomation(referral: Referral) {
    await this.automationQueue.add('send-email', {
      template: 'referral-thank-you',
      to: referral.userId,
      data: {
        referralId: referral.id,
        clientName: referral.clientName,
      },
    });

    // Send invitation to referred person
    if (referral.clientEmail) {
      await this.automationQueue.add('send-email', {
        template: 'referral-invitation',
        to: referral.clientEmail,
        data: {
          referralId: referral.id,
          referrerUserId: referral.userId, // Will be resolved
          serviceRequested: referral.serviceRequested,
        },
      });
    }
  }

  async triggerExternalSignalAlert(signal: ExternalSignal) {
    const alertEmail = this.configService.get<string>('alerts.email');

    await this.automationQueue.add('send-urgent-alert', {
      type: 'external-signal-detected',
      to: alertEmail,
      data: {
        signalId: signal.id,
        platform: signal.platformSource,
        distressLevel: signal.distressLevel,
        urgencyScore: signal.urgencyScore,
        aiSummary: signal.aiSummary || null,
        platformUrl: signal.platformUrl || null,
      },
    }, {
      priority: 2,
    });
  }

  async scheduleFollowUp(type: string, userId: string, data: any, delayHours: number) {
    await this.automationQueue.add('follow-up', {
      type,
      userId,
      data,
    }, {
      delay: delayHours * 60 * 60 * 1000,
    });
  }

  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.automationQueue.getWaitingCount(),
      this.automationQueue.getActiveCount(),
      this.automationQueue.getCompletedCount(),
      this.automationQueue.getFailedCount(),
    ]);

    return {
      waiting,
      active,
      completed,
      failed,
    };
  }
}
