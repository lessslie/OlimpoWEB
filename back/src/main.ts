import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuración de prefijo global para la API
  app.setGlobalPrefix('api');
  
  // Configuración de CORS
  app.enableCors({
    origin: [
      'http://localhost:5173', // URL del frontend local (Vite)
      'https://olimpo-gym.onrender.com', // URL del frontend en producción (ajusta según tu dominio)
      'https://olimpo-web.vercel.app', // URL del frontend en Vercel
      'https://olimpoweb.vercel.app', // Variante del dominio en Vercel
      /\.olimpo-gym\.com$/, // Dominios personalizados futuros
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
    .setDescription('API para la aplicación web del gimnasio Olimpo')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  // Intentar iniciar el servidor en diferentes puertos si el primero está ocupado
  const attemptToListen = async (ports: number[]) => {
    for (const port of ports) {
      try {
        await app.listen(port);
        console.log(`Aplicación corriendo en: http://localhost:${port}`);
        console.log(`Documentación de la API disponible en: http://localhost:${port}/api/docs`);
        return true;
      } catch (error) {
        if (error.code === 'EADDRINUSE') {
          console.log(`Puerto ${port} en uso, intentando con el siguiente...`);
          continue;
        }
        throw error;
      }
    }
    throw new Error('No se pudo iniciar el servidor en ninguno de los puertos disponibles');
  };
  
  // Puerto de la aplicación (desde variables de entorno o alternativas)
  const preferredPort = parseInt(process.env.PORT || '3000', 10);
  const alternativePorts = [preferredPort, 3001, 3002, 3003, 3004, 3005];
  
  await attemptToListen(alternativePorts);
}
bootstrap();
