import { Processor, OnQueueEvent, OnQueueActive } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@family-support/database';
import * as Postmark from 'postmark';

const prisma = new PrismaClient();

@Processor('automation')
export class AutomationProcessor {
  private postmarkClient: Postmark.ServerClient;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('postmark.apiKey');
    if (apiKey) {
      this.postmarkClient = new Postmark.ServerClient(apiKey);
    }
  }

  @OnQueueActive('send-email')
  async handleSendEmail(job: Job) {
    const { template, to, data } = job.data;

    try {
      // Get user email if to is userId
      let recipientEmail = to;
      if (!to.includes('@')) {
        const user = await prisma.user.findUnique({
          where: { id: to },
        });
        if (user) {
          recipientEmail = user.email;
        }
      }

      // Get template from database
      const templateData = await prisma.automationTemplate.findFirst({
        where: { name: template, isActive: true },
      });

      if (!templateData) {
        console.log(`Template ${template} not found or inactive`);
        return;
      }

      // Process template variables
      const subject = this.processTemplate(templateData.subject || '', data);
      const content = this.processTemplate(templateData.content, data);

      // Send email via Postmark
      if (this.postmarkClient) {
        await this.postmarkClient.sendEmail({
          From: this.configService.get<string>('postmark.fromEmail'),
          To: recipientEmail,
          Subject: subject,
          TextBody: content,
          MessageStream: 'outbound',
        });
      } else {
        console.log('Email would be sent:', {
          to: recipientEmail,
          subject,
          content: content.substring(0, 200) + '...',
        });
      }

      // Log event
      await prisma.eventLog.create({
        data: {
          eventType: 'email_sent',
          payload: {
            template,
            to: recipientEmail,
            subject,
          },
        },
      });

      console.log(`Email sent: ${template} to ${recipientEmail}`);
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  @Process('send-sms')
  async handleSendSms(job: Job) {
    const { to, message } = job.data;

    try {
      // SMS sending would be implemented with Twilio
      console.log('SMS would be sent:', { to, message: message.substring(0, 100) });

      await prisma.eventLog.create({
        data: {
          eventType: 'sms_sent',
          payload: { to, message: message.substring(0, 100) },
        },
      });
    } catch (error) {
      console.error('Failed to send SMS:', error);
      throw error;
    }
  }

  @Process('send-urgent-alert')
  async handleUrgentAlert(job: Job) {
    const { type, to, data } = job.data;

    try {
      // Get template
      let subject = 'URGENT ALERT';
      let content = '';

      if (type === 'urgent-intake') {
        subject = `URGENT: New Intake - ${data.clientName} - Score: ${data.urgencyScore}`;
        content = `
URGENT INTAKE ALERT

Client: ${data.clientName}
Email: ${data.clientEmail}
Phone: ${data.clientPhone || 'N/A'}
Service: ${data.serviceType}
Urgency Score: ${data.urgencyScore}/100
Factors: ${data.urgencyFactors.join(', ')}
Hearing Date: ${data.hearingDate ? new Date(data.hearingDate).toLocaleString() : 'N/A'}
Court: ${data.courtName || 'N/A'}

Please respond urgently.
        `;
      } else if (type === 'external-signal-detected') {
        subject = `External Signal Detected - ${data.platform} - ${data.distressLevel}`;
        content = `
EXTERNAL SIGNAL ALERT

Platform: ${data.platform}
Distress Level: ${data.distressLevel}
Urgency Score: ${data.urgencyScore}/100
AI Summary: ${data.aiSummary}
URL: ${data.platformUrl}

Review in admin dashboard for potential outreach.
        `;
      }

      if (this.postmarkClient) {
        await this.postmarkClient.sendEmail({
          From: this.configService.get<string>('postmark.fromEmail'),
          To: to,
          Subject: subject,
          TextBody: content,
          MessageStream: 'outbound',
        });
      } else {
        console.log('Urgent alert would be sent:', { to, subject, content });
      }

      console.log(`Urgent alert sent: ${type} to ${to}`);
    } catch (error) {
      console.error('Failed to send urgent alert:', error);
      throw error;
    }
  }

  @Process('follow-up')
  async handleFollowUp(job: Job) {
    const { type, userId, data } = job.data;
    console.log(`Follow-up: ${type} for user ${userId}`, data);
  }

  private processTemplate(template: string, data: any): string {
    if (!template) return '';
    
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] !== undefined ? String(data[key]) : match;
    });
  }
}
