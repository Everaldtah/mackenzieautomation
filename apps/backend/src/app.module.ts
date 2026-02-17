import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { IntakesModule } from './intakes/intakes.module';
import { BookingsModule } from './bookings/bookings.module';
import { ReferralsModule } from './referrals/referrals.module';
import { ExternalSignalsModule } from './external-signals/external-signals.module';
import { OutreachModule } from './outreach/outreach.module';
import { AutomationModule } from './automation/automation.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ServicesModule } from './services/services.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ['.env', '.env.local'],
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),
    
    // BullMQ for background jobs
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST') || 'localhost',
          port: configService.get<number>('REDIS_PORT') || 6379,
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    
    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    IntakesModule,
    BookingsModule,
    ReferralsModule,
    ExternalSignalsModule,
    OutreachModule,
    AutomationModule,
    AnalyticsModule,
    ServicesModule,
    AdminModule,
  ],
})
export class AppModule {}
