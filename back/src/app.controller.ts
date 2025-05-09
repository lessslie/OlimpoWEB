import { Controller, Get, Redirect, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService
  ) {}

  @Get()
  @Redirect('api/docs', 302)
  @ApiOperation({ summary: 'Redirige a la documentación de Swagger' })
  @ApiResponse({ status: 302, description: 'Redirige a la documentación de Swagger' })
  redirectToSwagger() {
    return;
  }

  @Get('api')
  @ApiOperation({ summary: 'Obtiene un mensaje de bienvenida' })
  @ApiResponse({ status: 200, description: 'Mensaje de bienvenida' })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/diagnostico')
  @ApiOperation({ summary: 'Verifica la conexión con Supabase y otras configuraciones' })
  @ApiResponse({ status: 200, description: 'Resultado del diagnóstico' })
  async diagnostico() {
    try {
      // Verificar variables de entorno
      const supabaseUrl = this.configService.get('SUPABASE_URL');
      const supabaseAnonKey = this.configService.get('SUPABASE_ANON_KEY');
      const supabaseServiceKey = this.configService.get('SUPABASE_SERVICE_KEY');
      const jwtSecret = this.configService.get('JWT_SECRET');

      // Crear cliente de Supabase
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Probar conexión con Supabase
      const { data, error } = await supabase.auth.getSession();
      
      // Verificar Cloudinary
      let cloudinaryStatus = 'No configurado';
      try {
        const cloudinary = require('cloudinary');
        cloudinaryStatus = cloudinary ? 'Módulo encontrado' : 'Módulo no encontrado';
      } catch (err) {
        cloudinaryStatus = `Error: ${err.message}`;
      }

      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: this.configService.get('NODE_ENV'),
        supabase: {
          url: supabaseUrl ? '✓ Configurado' : '✗ No configurado',
          anonKey: supabaseAnonKey ? '✓ Configurado' : '✗ No configurado',
          serviceKey: supabaseServiceKey ? '✓ Configurado' : '✗ No configurado',
          connection: error ? `✗ Error: ${error.message}` : '✓ Conectado',
          session: data
        },
        jwt: {
          secret: jwtSecret ? '✓ Configurado' : '✗ No configurado'
        },
        cloudinary: cloudinaryStatus
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }

  @Post('api/test-user')
  @ApiOperation({ summary: 'Crea un usuario de prueba y verifica la autenticación' })
  @ApiResponse({ status: 200, description: 'Resultado de la creación del usuario de prueba' })
  async createTestUser(@Body() body: { email?: string, password?: string }) {
    try {
      // Usar valores predeterminados si no se proporcionan
      const email = body.email || 'test@olimpogym.com';
      const password = body.password || 'Test123!';
      
      // Verificar variables de entorno
      const supabaseUrl = this.configService.get('SUPABASE_URL');
      const supabaseServiceKey = this.configService.get('SUPABASE_SERVICE_KEY');
      
      if (!supabaseUrl || !supabaseServiceKey) {
        return {
          status: 'error',
          message: 'Faltan variables de entorno de Supabase'
        };
      }

      // Crear cliente de Supabase con la clave de servicio
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Verificar si el usuario ya existe
      const { data: existingUsers, error: queryError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .limit(1);
      
      if (queryError) {
        return {
          status: 'error',
          message: `Error al verificar usuario existente: ${queryError.message}`
        };
      }
      
      // Si el usuario ya existe, intentar iniciar sesión
      if (existingUsers && existingUsers.length > 0) {
        const user = existingUsers[0];
        
        // Verificar contraseña
        const isPasswordValid = await bcrypt.compare(password, user.password);
        
        if (isPasswordValid) {
          return {
            status: 'success',
            message: 'Usuario de prueba ya existe, inicio de sesión exitoso',
            user: {
              id: user.id,
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name
            }
          };
        } else {
          // Actualizar contraseña
          const hashedPassword = await bcrypt.hash(password, 10);
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ password: hashedPassword })
            .eq('id', user.id);
          
          if (updateError) {
            return {
              status: 'error',
              message: `Error al actualizar contraseña: ${updateError.message}`
            };
          }
          
          return {
            status: 'success',
            message: 'Contraseña de usuario de prueba actualizada',
            user: {
              id: user.id,
              email: user.email,
              first_name: user.first_name,
              last_name: user.last_name
            }
          };
        }
      }
      
      // Crear usuario de prueba
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([
          {
            email: email,
            password: hashedPassword,
            first_name: 'Usuario',
            last_name: 'Prueba',
            phone: '1234567890',
            is_admin: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ])
        .select();
      
      if (insertError) {
        return {
          status: 'error',
          message: `Error al crear usuario de prueba: ${insertError.message}`
        };
      }
      
      return {
        status: 'success',
        message: 'Usuario de prueba creado correctamente',
        user: newUser[0],
        credentials: {
          email: email,
          password: password
        }
      };
    } catch (error) {
      return {
        status: 'error',
        message: `Error inesperado: ${error.message}`,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      };
    }
  }
}
