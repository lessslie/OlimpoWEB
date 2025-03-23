import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { MembershipsService } from './memberships/memberships.service';
import { CronJob } from 'cron';
import { NotificationsService } from './notifications/notifications.service';
import { UsersService } from './users/users.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configuración de prefijo global para la API
  app.setGlobalPrefix('api');

  // Configuración de CORS
  app.enableCors({
    origin: [
      'http://localhost:5173', // URL del frontend local (Vite)
      'http://localhost:5177', // URL del frontend local (puerto alternativo)
      'http://localhost:3000', // URL del frontend local (Next.js)
      'https://olimpo-gym.onrender.com', // URL del frontend en producción (ajusta según tu dominio)
      'https://olimpo-web-xpf8.vercel.app', // URL del frontend en Vercel
      'https://olimpoweb.vercel.app', // Variante del dominio en Vercel
      'https://olimpo-frontend.vercel.app', // Nueva URL principal en Vercel
      'https://olimpo-next.vercel.app', // URL de la aplicación Next.js en Vercel
      'https://olimpo-frontend-git-main-agatas-projects-96c6f9ee.vercel.app', // URL de despliegue específico
      'https://olimpo-frontend-64ilfiwlv-agatas-projects-96c6f9ee.vercel.app', // URL de despliegue específico
      /\.olimpo-gym\.com$/, // Dominios personalizados futuros
      /\.vercel\.app$/, // Cualquier subdominio en vercel.app
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Configuración de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en los DTOs
      transform: true, // Transforma los datos recibidos según los tipos definidos
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no definidas
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Olimpo Gym API')
    .setDescription('API para la gestión del gimnasio Olimpo')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('App', 'Endpoints generales de la aplicación')
    .addTag('auth', 'Endpoints de autenticación')
    .addTag('users', 'Gestión de usuarios')
    .addTag('memberships', 'Gestión de membresías')
    .addTag('products', 'Gestión de productos')
    .addTag('attendance', 'Gestión de asistencias')
    .addTag('blog', 'Gestión del blog')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Olimpo Gym API Docs',
  });

  // Intentar iniciar el servidor en diferentes puertos si el primero está ocupado
  const attemptToListen = async (ports: number[]) => {
    for (const port of ports) {
      try {
        await app.listen(port);
        console.log(`Aplicación corriendo en: http://localhost:${port}`);
        console.log(
          `Documentación de la API disponible en: http://localhost:${port}/api/docs`,
        );
        return true;
      } catch (error) {
        if (error.code === 'EADDRINUSE') {
          console.log(`Puerto ${port} en uso, intentando con el siguiente...`);
          continue;
        }
        throw error;
      }
    }
    throw new Error(
      'No se pudo iniciar el servidor en ninguno de los puertos disponibles',
    );
  };

  // Puerto de la aplicación (desde variables de entorno o alternativas)
  const preferredPort = parseInt(process.env.PORT || '3000', 10);
  const alternativePorts = [preferredPort, 3001, 3002, 3003, 3004, 3005];

  await attemptToListen(alternativePorts);

  // Configurar tareas programadas
  const membershipsService = app.get(MembershipsService);
  const notificationsService = app.get(NotificationsService);
  const usersService = app.get(UsersService);

  // Programar la verificación de membresías expiradas (diariamente a las 8:00 AM)
  const checkExpiredMembershipsJob = new CronJob('0 8 * * *', async () => {
    try {
      console.log('Ejecutando verificación de membresías expiradas...');
      await membershipsService.checkExpiredMemberships();
      console.log('Verificación de membresías expiradas completada');
    } catch (error) {
      console.error('Error al verificar membresías expiradas:', error);
    }
  });

  // Programar la renovación automática de membresías (diariamente a las 0:00 AM)
  const autoRenewMembershipsJob = new CronJob('0 0 * * *', async () => {
    try {
      console.log('Ejecutando renovación automática de membresías...');
      await membershipsService.autoRenewMemberships();
      console.log('Renovación automática de membresías completada');
    } catch (error) {
      console.error('Error al renovar membresías automáticamente:', error);
    }
  });

  // Programar el envío de notificaciones para membresías próximas a expirar (cada lunes a las 10:00 AM)
  const notifyExpiringMembershipsJob = new CronJob('0 10 * * 1', async () => {
    try {
      console.log(
        'Enviando notificaciones de membresías próximas a expirar...',
      );

      // Obtener fecha actual
      const today = new Date();

      // Calcular fecha de 7 días después
      const oneWeekLater = new Date(today);
      oneWeekLater.setDate(today.getDate() + 7);

      // Buscar membresías que expirarán en los próximos 7 días y enviar notificaciones
      await membershipsService.findExpiringMemberships(
        today,
        oneWeekLater,
        true,
      );

      console.log('Notificaciones de membresías próximas a expirar enviadas');
    } catch (error) {
      console.error(
        'Error al enviar notificaciones de membresías próximas a expirar:',
        error,
      );
    }
  });

  // Iniciar los trabajos programados
  checkExpiredMembershipsJob.start();
  autoRenewMembershipsJob.start();
  notifyExpiringMembershipsJob.start();

  console.log('Tareas programadas iniciadas:');
  console.log(
    '- Verificación de membresías expiradas: diariamente a las 8:00 AM',
  );
  console.log(
    '- Renovación automática de membresías: diariamente a las 0:00 AM',
  );
  console.log(
    '- Notificación de membresías próximas a expirar: cada lunes a las 10:00 AM',
  );

  console.log(`Aplicación iniciada en http://localhost:${preferredPort}`);
}
bootstrap();
