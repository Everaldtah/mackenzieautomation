import { Injectable } from '@nestjs/common';
import { PrismaClient, OutreachStatus, SignalStatus } from '@family-support/database';

const prisma = new PrismaClient();

interface GenerateOutreachDto {
  signalId: string;
}

interface ReviewOutreachDto {
  draftId: string;
  action: 'approve' | 'edit' | 'reject';
  editedContent?: string;
  rejectionReason?: string;
  reviewedBy: string;
}

@Injectable()
export class OutreachService {
  private readonly supportiveTemplates = [
    `Hi there, I came across your post and wanted to reach out. Going through family court without a solicitor can feel incredibly overwhelming, and you're not alone in this experience.

Many parents find themselves navigating the system alone, unsure of where to turn. If you're looking for general guidance on the court process or emotional support during this difficult time, this confidential help page may be useful: {{supportLink}}

Wishing you strength and clarity.`,

    `Hello, I read your message and my heart goes out to you. The family court process can be daunting, especially when you're representing yourself.

There are resources available that can help you understand your options and provide support. This page offers confidential guidance for parents in similar situations: {{supportLink}}

Take care of yourself.`,

    `Hi, I noticed your post about your court situation. It takes courage to reach out and share what you're going through.

If you need general information about court processes or would like to connect with support services, this resource might help: {{supportLink}}

You're doing better than you think.`,
  ];

  async generateDraft(data: GenerateOutreachDto) {
    const signal = await prisma.externalSignal.findUnique({
      where: { id: data.signalId },
    });

    if (!signal) {
      throw new Error('Signal not found');
    }

    if (signal.status !== SignalStatus.DETECTED && signal.status !== SignalStatus.UNDER_REVIEW) {
      throw new Error('Signal not eligible for outreach');
    }

    // Select appropriate template based on distress level
    let templateIndex = 0;
    if (signal.distressLevel === 'MEDIUM') {
      templateIndex = 1;
    } else if (signal.distressLevel === 'URGENT') {
      templateIndex = 2;
    }

    const template = this.supportiveTemplates[templateIndex];
    const supportLink = `${process.env.FRONTEND_URL}/support-resources`;
    
    const draftContent = template.replace(/\{\{supportLink\}\}/g, supportLink);

    const draft = await prisma.outreachDraft.create({
      data: {
        signalId: data.signalId,
        draftContent,
        platform: signal.platformSource,
        status: OutreachStatus.PENDING_REVIEW,
      },
    });

    // Update signal status
    await prisma.externalSignal.update({
      where: { id: data.signalId },
      data: { status: SignalStatus.UNDER_REVIEW },
    });

    return draft;
  }

  async reviewDraft(data: ReviewOutreachDto) {
    const draft = await prisma.outreachDraft.findUnique({
      where: { id: data.draftId },
      include: { signal: true },
    });

    if (!draft) {
      throw new Error('Draft not found');
    }

    let status: OutreachStatus;
    let finalContent: string;

    switch (data.action) {
      case 'approve':
        status = OutreachStatus.APPROVED;
        finalContent = draft.draftContent;
        break;
      case 'edit':
        status = OutreachStatus.EDITED;
        finalContent = data.editedContent || draft.draftContent;
        break;
      case 'reject':
        status = OutreachStatus.REJECTED;
        finalContent = '';
        break;
      default:
        throw new Error('Invalid action');
    }

    const updatedDraft = await prisma.outreachDraft.update({
      where: { id: data.draftId },
      data: {
        status,
        reviewedBy: data.reviewedBy,
        reviewedAt: new Date(),
        editedContent: data.action === 'edit' ? data.editedContent : null,
        rejectionReason: data.action === 'reject' ? data.rejectionReason : null,
      },
    });

    // Log compliance
    await prisma.complianceLog.create({
      data: {
        action: `outreach_${data.action}`,
        actionType: `outreach_${data.action}`,
        entityType: 'outreach_draft',
        entityId: data.draftId,
        performedBy: data.reviewedBy,
      },
    });

    return updatedDraft;
  }

  async sendOutreach(draftId: string, sentBy: string) {
    const draft = await prisma.outreachDraft.findUnique({
      where: { id: draftId },
      include: { signal: true },
    });

    if (!draft) {
      throw new Error('Draft not found');
    }

    if (draft.status !== OutreachStatus.APPROVED && draft.status !== OutreachStatus.EDITED) {
      throw new Error('Draft must be approved before sending');
    }

    const contentToSend = draft.editedContent || draft.draftContent;

    // Create outreach action record
    const action = await prisma.outreachAction.create({
      data: {
        signalId: draft.signalId,
        draftId: draft.id,
        action: 'send',
        actionType: 'post_reply',
        outcome: 'sent',
        notes: contentToSend,
        performedBy: sentBy,
      },
    });

    // Update draft status
    await prisma.outreachDraft.update({
      where: { id: draftId },
      data: { status: OutreachStatus.SENT },
    });

    // Update signal status
    await prisma.externalSignal.update({
      where: { id: draft.signalId },
      data: { status: SignalStatus.OUTREACH_SENT },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        eventType: 'outreach_sent',
        signalId: draft.signalId,
        payload: {
          draftId,
          actionId: action.id,
          platform: draft.signal.platformSource,
        },
      },
    });

    return action;
  }

  async findAllDrafts(options: {
    page?: number;
    limit?: number;
    status?: OutreachStatus;
  }) {
    const { page = 1, limit = 20, status } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [drafts, total] = await Promise.all([
      prisma.outreachDraft.findMany({
        where,
        skip,
        take: limit,
        include: {
          signal: {
            select: {
              id: true,
              platformSource: true,
              platformUrl: true,
              authorUsername: true,
              distressLevel: true,
              urgencyScore: true,
              aiSummary: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.outreachDraft.count({ where }),
    ]);

    return {
      data: drafts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getStats() {
    const [
      totalDrafts,
      byStatus,
      sentActions,
      totalClicks,
      conversions,
    ] = await Promise.all([
      prisma.outreachDraft.count(),
      prisma.outreachDraft.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.outreachAction.count(),
      prisma.outreachAction.count({
        where: { clicksDetected: true },
      }),
      prisma.outreachAction.count({
        where: { convertedToIntake: true },
      }),
    ]);

    return {
      totalDrafts,
      byStatus,
      sentActions,
      totalClicks,
      conversions,
      conversionRate: sentActions > 0 ? (conversions / sentActions) * 100 : 0,
    };
  }
}
