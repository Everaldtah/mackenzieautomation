import { Injectable } from '@nestjs/common';
import { PrismaClient, DistressLevel, SignalStatus, OutreachStatus } from '@family-support/database';
import { AutomationService } from '../automation/automation.service';
import { CreateExternalSignalDto } from './dto/create-external-signal.dto';
import { ClassifySignalDto } from './dto/classify-signal.dto';

const prisma = new PrismaClient();

interface NLPClassification {
  distressLevel: DistressLevel;
  hearingMentioned: boolean;
  timeframeDetected: string | null;
  selfRepSignal: boolean;
  safeguardingKeywords: string[];
  urgencyScore: number;
  aiSummary: string;
}

@Injectable()
export class ExternalSignalsService {
  constructor(private automationService: AutomationService) {}

  async classifyContent(content: string): Promise<NLPClassification> {
    // This would integrate with OpenAI or HuggingFace for NLP classification
    // For now, implementing rule-based classification

    const lowerContent = content.toLowerCase();
    
    // Keywords for classification
    const urgentKeywords = ['urgent', 'emergency', 'tomorrow', 'today', 'desperate', 'suicidal', 'no hope', 'can\'t cope'];
    const hearingKeywords = ['hearing', 'court date', 'trial', 'final hearing', 'directions hearing', 'FHDRA'];
    const timeframeKeywords = ['tomorrow', 'today', 'next week', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'in 2 days', 'in 3 days'];
    const selfRepKeywords = ['self representing', 'litigant in person', 'no solicitor', 'can\'t afford lawyer', 'representing myself', 'on my own'];
    const safeguardingKeywords = ['abuse', 'domestic violence', 'DV', 'assault', 'unsafe', 'afraid', 'threatened', 'social services', 'section 47'];

    // Calculate distress level
    let distressScore = 0;
    const foundUrgent = urgentKeywords.filter(k => lowerContent.includes(k));
    distressScore += foundUrgent.length * 2;

    const foundSafeguarding = safeguardingKeywords.filter(k => lowerContent.includes(k));
    distressScore += foundSafeguarding.length * 3;

    // Determine distress level
    let distressLevel: DistressLevel = DistressLevel.LOW;
    if (distressScore >= 6) {
      distressLevel = DistressLevel.URGENT;
    } else if (distressScore >= 3) {
      distressLevel = DistressLevel.MEDIUM;
    }

    // Check for hearing mention
    const hearingMentioned = hearingKeywords.some(k => lowerContent.includes(k));

    // Detect timeframe
    let timeframeDetected: string | null = null;
    for (const keyword of timeframeKeywords) {
      if (lowerContent.includes(keyword)) {
        timeframeDetected = keyword;
        break;
      }
    }

    // Check for self-representation signals
    const selfRepSignal = selfRepKeywords.some(k => lowerContent.includes(k));

    // Calculate urgency score
    let urgencyScore = distressScore * 5;
    if (hearingMentioned) urgencyScore += 20;
    if (selfRepSignal) urgencyScore += 15;
    if (timeframeDetected) urgencyScore += 10;
    urgencyScore = Math.min(urgencyScore, 100);

    // Generate AI summary
    const aiSummary = this.generateSummary(content, {
      distressLevel,
      hearingMentioned,
      selfRepSignal,
      safeguardingKeywords: foundSafeguarding,
    });

    return {
      distressLevel,
      hearingMentioned,
      timeframeDetected,
      selfRepSignal,
      safeguardingKeywords: foundSafeguarding,
      urgencyScore,
      aiSummary,
    };
  }

  private generateSummary(content: string, classification: any): string {
    const summaries: string[] = [];
    
    if (classification.distressLevel === DistressLevel.URGENT) {
      summaries.push('High distress detected');
    } else if (classification.distressLevel === DistressLevel.MEDIUM) {
      summaries.push('Moderate distress detected');
    }

    if (classification.hearingMentioned) {
      summaries.push('Court hearing mentioned');
    }

    if (classification.selfRepSignal) {
      summaries.push('Self-representing litigant');
    }

    if (classification.safeguardingKeywords.length > 0) {
      summaries.push(`Safeguarding concerns: ${classification.safeguardingKeywords.join(', ')}`);
    }

    // Extract key concern from first sentence
    const firstSentence = content.split(/[.!?]/)[0].substring(0, 100);
    summaries.push(`Context: "${firstSentence}..."`);

    return summaries.join('. ');
  }

  async createSignal(data: CreateExternalSignalDto) {
    // Check for duplicate content
    const contentHash = this.hashContent(data.content);
    const existing = await prisma.externalSignal.findUnique({
      where: { contentHash },
    });

    if (existing) {
      return { signal: existing, isDuplicate: true };
    }

    // Classify the content
    const classification = await this.classifyContent(data.content);

    // Only proceed if distress level is medium or urgent
    if (classification.distressLevel === DistressLevel.LOW) {
      return { signal: null, isDuplicate: false, reason: 'Low distress level - filtered out' };
    }

    const signal = await prisma.externalSignal.create({
      data: {
        platformSource: data.platformSource,
        platformPostId: data.platformPostId,
        platformUrl: data.platformUrl,
        authorUsername: data.authorUsername,
        content: data.content,
        contentHash,
        postedAt: new Date(data.postedAt),
        distressLevel: classification.distressLevel,
        hearingMentioned: classification.hearingMentioned,
        timeframeDetected: classification.timeframeDetected,
        selfRepSignal: classification.selfRepSignal,
        safeguardingKeywords: classification.safeguardingKeywords,
        urgencyScore: classification.urgencyScore,
        aiSummary: classification.aiSummary,
        status: SignalStatus.DETECTED,
      },
    });

    // Log event
    await prisma.eventLog.create({
      data: {
        eventType: 'external_signal_detected',
        signalId: signal.id,
        payload: {
          platform: data.platformSource,
          distressLevel: classification.distressLevel,
          urgencyScore: classification.urgencyScore,
        },
      },
    });

    // Send alert if urgent
    if (classification.distressLevel === DistressLevel.URGENT || classification.urgencyScore >= 70) {
      await this.automationService.triggerExternalSignalAlert(signal);
    }

    return { signal, isDuplicate: false };
  }

  async findAll(options: {
    page?: number;
    limit?: number;
    status?: SignalStatus;
    distressLevel?: DistressLevel;
    platformSource?: string;
  }) {
    const { page = 1, limit = 20, status, distressLevel, platformSource } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (distressLevel) where.distressLevel = distressLevel;
    if (platformSource) where.platformSource = platformSource;

    const [signals, total] = await Promise.all([
      prisma.externalSignal.findMany({
        where,
        skip,
        take: limit,
        include: {
          outreachDrafts: {
            where: { status: { in: [OutreachStatus.PENDING_REVIEW, OutreachStatus.APPROVED, OutreachStatus.EDITED] } },
          },
        },
        orderBy: [
          { urgencyScore: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.externalSignal.count({ where }),
    ]);

    return {
      data: signals,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    return prisma.externalSignal.findUnique({
      where: { id },
      include: {
        outreachDrafts: true,
      },
    });
  }

  async updateStatus(id: string, status: SignalStatus, reviewedBy?: string) {
    return prisma.externalSignal.update({
      where: { id },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
      },
    });
  }

  async getStats() {
    const [
      totalSignals,
      byDistressLevel,
      byStatus,
      byPlatform,
      convertedCount,
    ] = await Promise.all([
      prisma.externalSignal.count(),
      prisma.externalSignal.groupBy({
        by: ['distressLevel'],
        _count: { distressLevel: true },
      }),
      prisma.externalSignal.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      prisma.externalSignal.groupBy({
        by: ['platformSource'],
        _count: { platformSource: true },
      }),
      prisma.externalSignal.count({
        where: { status: SignalStatus.CONVERTED },
      }),
    ]);

    return {
      total: totalSignals,
      byDistressLevel,
      byStatus,
      byPlatform,
      converted: convertedCount,
      conversionRate: totalSignals > 0 ? (convertedCount / totalSignals) * 100 : 0,
    };
  }

  private hashContent(content: string): string {
    // Simple hash for content deduplication
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `hash_${Math.abs(hash)}_${content.length}`;
  }
}
