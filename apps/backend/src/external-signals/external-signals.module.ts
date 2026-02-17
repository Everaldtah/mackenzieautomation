import { Module } from '@nestjs/common';
import { ExternalSignalsService } from './external-signals.service';
import { ExternalSignalsController } from './external-signals.controller';
import { AutomationModule } from '../automation/automation.module';

@Module({
  imports: [AutomationModule],
  providers: [ExternalSignalsService],
  controllers: [ExternalSignalsController],
  exports: [ExternalSignalsService],
})
export class ExternalSignalsModule {}
