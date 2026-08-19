import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import multipart from '@fastify/multipart';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    // preflightContinue: false,
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true, // Helps with basic type conversions
        // strategy: 'exposeAll', // Uncomment if you use @Exclude or @Expose extensively and need to control transformation
      },
      // forbidNonWhitelisted: true, // Consider adding this for stricter validation later
    }),
  );

  await app.register(multipart, {
    attachFieldsToBody: true,
    limits: {
      fileSize: 60 * 1024 * 1024, // 60 MB
    },
  });

  // Setup Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Unsrate API')
    .setDescription('The Unsrate API documentation for dating app features')
    .setVersion('1.0')
    .addTag('auth', 'Authentication endpoints')
    .addTag('users', 'User profile management')
    .addTag('matches', 'Match-related operations')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  // Create and configure Swagger document
  const documentFactory = () => {
    const document = SwaggerModule.createDocument(app, config);
    // Add custom security scheme here if needed
    return document;
  };

  // Setup the Swagger UI endpoint
  SwaggerModule.setup('api', app, documentFactory, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'none',
    },
  });

  await app.listen(process.env.PORT);
}
bootstrap();
