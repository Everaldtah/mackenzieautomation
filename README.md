# Family Support Referral Automation Platform

A comprehensive UK Family Support Referral Automation Platform with AI External Lead Discovery System. Built for family mediation services, social work assessments, therapeutic support, and McKenzie Friend services.

## Features

### Core Services
- **Family Mediation** - Professional mediation for separated parents
- **Social Work Assessments** - Independent assessments including Section 7 reports
- **Therapeutic Support** - Counselling for families in transition
- **McKenzie Friend Services** - Court support for self-representing litigants
- **Emergency Support** - Same-day assistance for urgent hearings
- **Training & Workshops** - Educational sessions for parents and professionals

### AI External Lead Discovery System
- Ethically discovers distressed parents from public social media
- NLP-based distress classification (low/medium/urgent)
- Human-in-the-loop approval for all outreach
- GDPR-compliant public data monitoring
- Rate-limited to respect platform ToS

### Automation Engine
- Urgency scoring based on hearing dates and risk factors
- Automated email sequences via Postmark
- SMS alerts for urgent cases via Twilio
- Booking confirmations and reminders
- Referral tracking and conversion

### Admin Dashboard
- Real-time statistics and analytics
- Intake management with urgency prioritization
- Booking calendar and scheduling
- External signals review and outreach approval
- Compliance logging and audit trails

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite build tool
- Tailwind CSS + shadcn/ui components
- React Router for navigation
- React Hook Form + Zod validation

### Backend
- NestJS (TypeScript)
- PostgreSQL database (Prisma ORM)
- Redis for caching and queues
- BullMQ for background jobs
- JWT authentication
- Swagger API documentation

### AI Worker
- Node.js + TypeScript
- Reddit API integration
- NLP classification engine
- Scheduled job processing

### Infrastructure
- Docker containerization
- Railway deployment ready
- Environment-based configuration

## Quick Start

### Prerequisites
- Node.js 20+
- Docker and Docker Compose
- PostgreSQL 16
- Redis 7

### Local Development

1. **Clone the repository**
```bash
git clone <repository-url>
cd family-support-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start with Docker Compose**
```bash
docker-compose up -d
```

5. **Run database migrations**
```bash
cd packages/database
npx prisma migrate dev
npx prisma db seed
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/v1
- API Docs: http://localhost:3001/api/docs

### Manual Setup (without Docker)

1. **Install dependencies**
```bash
# Root
npm install

# Backend
cd apps/backend
npm install

# Frontend
cd apps/frontend
npm install

# Worker
cd apps/worker
npm install

# Database
cd packages/database
npm install
```

2. **Set up PostgreSQL and Redis**
```bash
# Start PostgreSQL
createdb family_support

# Start Redis
redis-server
```

3. **Configure environment**
```bash
# Copy and edit .env files in each app directory
```

4. **Run migrations**
```bash
cd packages/database
npx prisma migrate dev
npx prisma db seed
```

5. **Start services**
```bash
# Terminal 1 - Backend
cd apps/backend
npm run start:dev

# Terminal 2 - Frontend
cd apps/frontend
npm run dev

# Terminal 3 - Worker
cd apps/worker
npm run dev
```

## Deployment to Railway

### Step 1: Create Railway Account
1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Create a new project

### Step 2: Add Services

#### PostgreSQL Database
1. Click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically create the database
3. Note the connection string in Variables

#### Redis
1. Click "New" → "Database" → "Add Redis"
2. Railway will create the Redis instance

#### Backend Service
1. Click "New" → "GitHub Repo"
2. Select your repository
3. Configure:
   - Build Command: `cd apps/backend && npm install && npm run build`
   - Start Command: `node apps/backend/dist/main.js`
4. Add environment variables from `.env.example`
5. Connect to PostgreSQL and Redis

#### Frontend Service
1. Click "New" → "GitHub Repo"
2. Select the same repository
3. Configure:
   - Build Command: `cd apps/frontend && npm install && npm run build`
   - Publish Directory: `apps/frontend/dist`
4. Add `VITE_API_URL` pointing to your backend service

#### Worker Service
1. Click "New" → "GitHub Repo"
2. Select the same repository
3. Configure:
   - Build Command: `cd apps/worker && npm install && npm run build`
   - Start Command: `node apps/worker/dist/main.js`
4. Add environment variables
5. Connect to PostgreSQL and Redis

### Step 3: Configure Environment Variables

Required environment variables for production:

```env
# Database (from Railway PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Redis (from Railway Redis)
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
REDIS_PASSWORD=${{Redis.REDIS_PASSWORD}}

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d

# Email (Postmark)
POSTMARK_API_KEY=your-postmark-key
FROM_EMAIL=support@yourdomain.com

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_FROM_NUMBER=your-twilio-number

# Alerts
ALERT_EMAIL=akehbt2022@gmail.com
ALERT_PHONE=+447950494656

# Frontend
FRONTEND_URL=https://your-frontend-domain.up.railway.app
CORS_ORIGINS=https://your-frontend-domain.up.railway.app
```

### Step 4: Deploy
1. Railway will automatically deploy on push to main
2. Monitor deployment logs
3. Verify health checks pass

### Step 5: Run Migrations
```bash
# Connect to backend service shell
railway connect

# Run migrations
cd packages/database
npx prisma migrate deploy
npx prisma db seed
```

## Project Structure

```
family-support-platform/
├── apps/
│   ├── backend/           # NestJS API
│   │   ├── src/
│   │   │   ├── auth/      # Authentication
│   │   │   ├── users/     # User management
│   │   │   ├── intakes/   # Client intake system
│   │   │   ├── bookings/  # Booking management
│   │   │   ├── referrals/ # Referral system
│   │   │   ├── external-signals/  # AI lead discovery
│   │   │   ├── outreach/  # Ethical outreach
│   │   │   ├── automation/# Automation engine
│   │   │   ├── admin/     # Admin endpoints
│   │   │   └── analytics/ # Analytics
│   │   └── Dockerfile
│   │
│   ├── frontend/          # React frontend
│   │   ├── src/
│   │   │   ├── pages/     # Page components
│   │   │   ├── components/# Reusable components
│   │   │   ├── contexts/  # React contexts
│   │   │   └── lib/       # Utilities
│   │   └── Dockerfile
│   │
│   └── worker/            # AI lead discovery worker
│       ├── src/
│       │   └── scrapers/  # Platform scrapers
│       └── Dockerfile
│
├── packages/
│   └── database/          # Prisma schema and client
│       ├── prisma/
│       │   └── schema.prisma
│       └── src/
│
├── docker-compose.yml     # Local development
├── railway.yaml          # Railway deployment config
└── README.md
```

## API Documentation

Once the backend is running, API documentation is available at:
- Swagger UI: `http://localhost:3001/api/docs`
- OpenAPI JSON: `http://localhost:3001/api/docs-json`

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /auth/register` | Create new account |
| `POST /auth/login` | Login |
| `POST /intakes` | Submit intake |
| `GET /intakes` | List intakes (admin) |
| `POST /bookings` | Create booking |
| `GET /bookings` | List bookings |
| `GET /external-signals` | List detected signals |
| `POST /outreach/generate` | Generate outreach draft |
| `POST /outreach/review` | Review outreach |
| `GET /admin/dashboard` | Admin dashboard stats |

## Environment Variables

See `.env.example` for full list of environment variables.

## Compliance

See `docs/COMPLIANCE.md` for detailed compliance documentation including:
- GDPR compliance measures
- AI ethical framework
- SRA guidance adherence
- Safeguarding policies
- Data retention

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For support, email akehbt2022@gmail.com or call +44 7950 494656.

## License

This project is proprietary and confidential.

---

Built with care for families going through difficult times.
