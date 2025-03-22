import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async register(registerDto: RegisterDto) {
    try {
      // Verificar si el usuario ya existe
      const { data: existingUser, error: checkError } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('email', registerDto.email)
        .single();

      if (existingUser) {
        throw new HttpException(
          'Este email ya está registrado',
          HttpStatus.CONFLICT
        );
      }

      // Registrar usuario en Supabase Auth
      const { data, error } = await this.supabase.auth.signUp({
        email: registerDto.email,
        password: registerDto.password,
        options: {
          data: {
            first_name: registerDto.first_name,
            last_name: registerDto.last_name,
            phone: registerDto.phone,
          },
        },
      });

      if (error) {
        throw new HttpException(
          error.message || 'Error al registrar usuario',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return {
        message: 'Usuario registrado correctamente',
        user: {
          id: data.user?.id,
          email: data.user?.email,
          first_name: registerDto.first_name,
          last_name: registerDto.last_name,
          phone: registerDto.phone,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Error al registrar usuario',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async login(loginDto: LoginDto) {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: loginDto.email,
        password: loginDto.password,
      });

      if (error) {
        throw new HttpException(
          'Credenciales inválidas',
          HttpStatus.UNAUTHORIZED
        );
      }

      // Obtener información del perfil
      const { data: profileData, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error al obtener perfil:', profileError);
      }

      return {
        message: 'Inicio de sesión exitoso',
        user: {
          id: data.user.id,
          email: data.user.email,
          first_name: profileData?.first_name || data.user.user_metadata?.first_name,
          last_name: profileData?.last_name || data.user.user_metadata?.last_name,
          phone: profileData?.phone || data.user.user_metadata?.phone,
          is_admin: profileData?.is_admin || false,
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Error al iniciar sesión',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async validateToken(token: string) {
    try {
      const { data, error } = await this.supabase.auth.getUser(token);

      if (error) {
        throw new HttpException(
          'Token inválido o expirado',
          HttpStatus.UNAUTHORIZED
        );
      }

      // Obtener información del perfil
      const { data: profileData, error: profileError } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error('Error al obtener perfil:', profileError);
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email,
          first_name: profileData?.first_name || data.user.user_metadata?.first_name,
          last_name: profileData?.last_name || data.user.user_metadata?.last_name,
          phone: profileData?.phone || data.user.user_metadata?.phone,
          is_admin: profileData?.is_admin || false,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Token inválido o expirado',
        HttpStatus.UNAUTHORIZED
      );
    }
  }
}
