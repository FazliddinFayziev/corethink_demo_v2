import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({
    origin: true, 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });

  // Use Railway's PORT environment variable, fallback to 3001 for local development
  const port = process.env.PORT || 3001;
  
  // Listen on 0.0.0.0 to accept connections from any IP (important for containers)
  await app.listen(port, '0.0.0.0');
  
  console.log(`Backend server is running on port ${port}`);
}
bootstrap();