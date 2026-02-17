import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IntakesService } from './intakes.service';
import { IntakesController } from './intakes.controller';
import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'automation',
    }),
    AutomationModule,
  ],
  providers: [IntakesService],
  controllers: [IntakesController],
  exports: [IntakesService],
})
export class IntakesModule {}
