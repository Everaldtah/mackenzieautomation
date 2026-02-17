import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@family-support/database';

const prisma = new PrismaClient();

@Injectable()
export class ServicesService {
  async findAll() {
    return prisma.service.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    return prisma.service.findUnique({
      where: { slug },
    });
  }

  async findByArchetype(archetype: string) {
    return prisma.service.findMany({
      where: {
        isActive: true,
        archetypeTarget: archetype as any,
      },
      orderBy: { order: 'asc' },
    });
  }

  async getUrgentServices() {
    return prisma.service.findMany({
      where: {
        isActive: true,
        urgencyTrigger: true,
      },
      orderBy: { order: 'asc' },
    });
  }
}
