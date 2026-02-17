# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

UK Family Support Referral Automation Platform - a monorepo containing a NestJS backend API, React frontend, and shared database package. The platform handles client intake, booking management, referrals, and AI-powered external lead discovery for family support services.

## Build and Development Commands

### Prerequisites
- Node.js 20+, PostgreSQL 16, Redis 7
- pnpm workspaces (see `pnpm-workspace.yaml`)

### Root-level commands
```bash
npm install            # Install all workspace dependencies
npm run build          # Build all packages
npm run dev            # Start all services in dev mode
```

### Database (packages/database)
```bash
cd packages/database
npx prisma generate    # Generate Prisma client after schema changes
npx prisma migrate dev # Create and apply migrations
npx prisma db push     # Push schema without migration (dev only)
npx prisma studio      # Open database GUI
npx ts-node prisma/seed.ts  # Seed database
```

### Backend (apps/backend)
```bash
cd apps/backend
npm run start:dev      # Start with hot reload (watch mode)
npm run build          # Build for production
npm run test           # Run unit tests (Jest)
npm run test:watch     # Run tests in watch mode
npm run test:e2e       # Run e2e tests
npm run lint           # ESLint with --fix
```

### Frontend (apps/frontend)
```bash
cd apps/frontend
npm run dev            # Start Vite dev server
npm run build          # Production build
npm run lint           # ESLint
```

## Architecture

### Monorepo Structure
- `apps/backend` - NestJS API server (port 3001)
- `apps/frontend` - React + Vite frontend (port 3000)
- `packages/database` - Shared Prisma schema and client (`@family-support/database`)

### Backend Module Pattern
Each feature module in `apps/backend/src/` follows NestJS conventions:
- `*.module.ts` - Module definition with imports/exports
- `*.controller.ts` - REST endpoints (decorated with `@Controller`)
- `*.service.ts` - Business logic
- `dto/` - Data transfer objects with class-validator decorators
- Guards/decorators in `common/guards/` and `common/decorators/`

### Key Backend Modules
- `auth/` - JWT authentication with Passport, bcryptjs password hashing
- `intakes/` - Client intake with urgency levels (LOW/MEDIUM/HIGH/CRITICAL)
- `bookings/` - Service booking management
- `referrals/` - Referral tracking system
- `external-signals/` - AI lead discovery from social media
- `outreach/` - Ethical outreach with human-in-the-loop approval
- `automation/` - BullMQ background job processing
- `admin/` - Admin dashboard endpoints
- `analytics/` - Event tracking

### Data Layer
- Prisma ORM with PostgreSQL
- Schema at `packages/database/prisma/schema.prisma`
- Database package exports Prisma client for use in backend via `@family-support/database`
- All models use UUIDs as primary keys

### Background Jobs
- BullMQ with Redis for job queues
- Processors in `automation/automation.processor.ts`
- Queue configuration in `app.module.ts`

### External Integrations
- **Postmark** - Transactional email
- **Twilio** - SMS alerts for urgent cases
- **Reddit/Twitter APIs** - External signal discovery
- **OpenAI/HuggingFace** - NLP classification for lead scoring

## API Conventions
- All endpoints prefixed with `/api/v1`
- Swagger docs at `/api/docs`
- Global ValidationPipe with `whitelist: true, forbidNonWhitelisted: true`
- JWT Bearer auth via `@nestjs/jwt` and `@nestjs/passport`
- Rate limiting via `@nestjs/throttler` (100 req/min)

## Configuration
- Environment variables loaded via `@nestjs/config`
- Config structure defined in `apps/backend/src/config/configuration.ts`
- Access via `ConfigService.get<T>('path.to.config')`
- Copy `.env.example` to `.env` for local development

## Deployment
- Railway-ready (`railway.json` and Dockerfiles in each app)
- Production build commands specified per service in Railway config
