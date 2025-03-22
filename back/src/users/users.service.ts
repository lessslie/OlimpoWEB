import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in environment variables');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      // Verificar si el usuario ya existe
      const { data: existingUser, error: checkError } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('email', createUserDto.email)
        .single();

      if (existingUser) {
        throw new ConflictException('El usuario ya existe');
      }

      // Crear usuario en Auth
      const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
        email: createUserDto.email,
        email_confirm: true,
        user_metadata: {
          first_name: createUserDto.first_name,
          last_name: createUserDto.last_name,
          phone: createUserDto.phone,
        },
      });

      if (authError) {
        throw new InternalServerErrorException(authError.message);
      }

      // Crear perfil en la base de datos
      const { data, error } = await this.supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: createUserDto.email,
            first_name: createUserDto.first_name,
            last_name: createUserDto.last_name,
            phone: createUserDto.phone,
            is_admin: createUserDto.is_admin || false,
          },
        ])
        .select()
        .single();

      if (error) {
        throw new InternalServerErrorException(error.message);
      }

      return data;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear usuario');
    }
  }

  async findAll(): Promise<User[]> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new InternalServerErrorException(error.message);
      }

      return data;
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener usuarios');
    }
  }

  async findOne(id: string): Promise<User> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new NotFoundException('Usuario no encontrado');
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al obtener usuario');
    }
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      // Verificar si el usuario existe
      const { data: existingUser, error: checkError } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError || !existingUser) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Actualizar perfil en la base de datos
      const { data, error } = await this.supabase
        .from('profiles')
        .update({
          ...(updateUserDto.email && { email: updateUserDto.email }),
          ...(updateUserDto.first_name && { first_name: updateUserDto.first_name }),
          ...(updateUserDto.last_name && { last_name: updateUserDto.last_name }),
          ...(updateUserDto.phone && { phone: updateUserDto.phone }),
          ...(updateUserDto.is_admin !== undefined && { is_admin: updateUserDto.is_admin }),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new InternalServerErrorException(error.message);
      }

      // Si se actualizó el email, actualizar también en Auth
      if (updateUserDto.email) {
        const { error: authError } = await this.supabase.auth.admin.updateUserById(
          id,
          { email: updateUserDto.email }
        );

        if (authError) {
          console.error('Error al actualizar email en Auth:', authError);
        }
      }

      return data;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar usuario');
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Verificar si el usuario existe
      const { data: existingUser, error: checkError } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError || !existingUser) {
        throw new NotFoundException('Usuario no encontrado');
      }

      // Eliminar perfil de la base de datos
      const { error } = await this.supabase
        .from('profiles')
        .delete()
        .eq('id', id);

      if (error) {
        throw new InternalServerErrorException(error.message);
      }

      // Eliminar usuario de Auth
      const { error: authError } = await this.supabase.auth.admin.deleteUser(id);

      if (authError) {
        console.error('Error al eliminar usuario de Auth:', authError);
      }
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar usuario');
    }
  }
}
