import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  
  // Get frontend URL from environment or use defaults
  const frontendUrls = [
    'https://corethink-test.web.app',
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  app.enableCors({
    origin: frontendUrls,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  // Use Railway's PORT environment variable, fallback to 3001 for local development
  const port = process.env.PORT || 3001;
  
  // Listen on 0.0.0.0 to accept connections from any IP
  await app.listen(port, '0.0.0.0');
  
  console.log(`Backend server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Allowed origins: ${frontendUrls.join(', ')}`);
}
bootstrap();