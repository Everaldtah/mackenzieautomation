export default () => ({
  // Server
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database
  database: {
    url: process.env.DATABASE_URL,
  },
  
  // Redis
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  
  // Email (Postmark)
  postmark: {
    apiKey: process.env.POSTMARK_API_KEY,
    fromEmail: process.env.FROM_EMAIL || 'support@familysupport.example.com',
  },
  
  // SMS (Twilio)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_FROM_NUMBER,
  },
  
  // Alert notifications
  alerts: {
    email: process.env.ALERT_EMAIL || 'akehbt2022@gmail.com',
    phone: process.env.ALERT_PHONE || '+447950494656',
  },
  
  // AI/ML Services
  ai: {
    openaiApiKey: process.env.OPENAI_API_KEY,
    huggingFaceApiKey: process.env.HUGGINGFACE_API_KEY,
  },
  
  // External APIs
  external: {
    redditClientId: process.env.REDDIT_CLIENT_ID,
    redditClientSecret: process.env.REDDIT_CLIENT_SECRET,
    redditUserAgent: process.env.REDDIT_USER_AGENT,
    xBearerToken: process.env.X_BEARER_TOKEN,
  },
  
  // CORS
  cors: {
    origins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  },
  
  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
});
