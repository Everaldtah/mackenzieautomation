import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { AutomationService } from './automation.service';
import { AutomationProcessor } from './automation.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'automation',
    }),
  ],
  providers: [AutomationService, AutomationProcessor],
  exports: [AutomationService],
})
export class AutomationModule {}
