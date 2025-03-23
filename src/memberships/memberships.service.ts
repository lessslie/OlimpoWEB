import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { CreateMembershipDto } from './dto/create-membership.dto';
import { UpdateMembershipDto } from './dto/update-membership.dto';
import { Membership, MembershipStatus, MembershipType } from './entities/membership.entity';

@Injectable()
export class MembershipsService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables are not defined');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  async create(createMembershipDto: CreateMembershipDto): Promise<Membership> {
    try {
      // Calcular la fecha de finalización basada en el tipo de membresía
      const startDate = new Date(createMembershipDto.start_date);
      let endDate = new Date(startDate);
      
      if (createMembershipDto.type === MembershipType.MONTHLY) {
        // Para membresías mensuales, agregar 30 días
        endDate.setDate(startDate.getDate() + 30);
      } else if (createMembershipDto.type === MembershipType.KICKBOXING) {
        // Para membresías de kickboxing, verificar que se especifiquen los días por semana
        if (!createMembershipDto.days_per_week) {
          throw new HttpException(
            'Los días por semana son requeridos para membresías de kickboxing',
            HttpStatus.BAD_REQUEST,
          );
        }
        // Agregar 30 días para membresías de kickboxing también
        endDate.setDate(startDate.getDate() + 30);
      }

      const { data, error } = await this.supabase
        .from('memberships')
        .insert([
          {
            user_id: createMembershipDto.user_id,
            type: createMembershipDto.type,
            status: MembershipStatus.ACTIVE,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            days_per_week: createMembershipDto.days_per_week,
            price: createMembershipDto.price,
          },
        ])
        .select()
        .single();

      if (error) {
        throw new HttpException(
          `Error al crear la membresía: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error al crear la membresía: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(): Promise<Membership[]> {
    try {
      const { data, error } = await this.supabase
        .from('memberships')
        .select('*');

      if (error) {
        throw new HttpException(
          `Error al obtener las membresías: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return data;
    } catch (error) {
      throw new HttpException(
        `Error al obtener las membresías: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findOne(id: string): Promise<Membership> {
    try {
      const { data, error } = await this.supabase
        .from('memberships')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        throw new HttpException(
          `Error al obtener la membresía: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      if (!data) {
        throw new HttpException(
          'Membresía no encontrada',
          HttpStatus.NOT_FOUND,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error al obtener la membresía: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findByUser(userId: string): Promise<Membership[]> {
    try {
      const { data, error } = await this.supabase
        .from('memberships')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        throw new HttpException(
          `Error al obtener las membresías del usuario: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return data;
    } catch (error) {
      throw new HttpException(
        `Error al obtener las membresías del usuario: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(id: string, updateMembershipDto: UpdateMembershipDto): Promise<Membership> {
    try {
      // Verificar si la membresía existe
      await this.findOne(id);

      const { data, error } = await this.supabase
        .from('memberships')
        .update(updateMembershipDto)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new HttpException(
          `Error al actualizar la membresía: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error al actualizar la membresía: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Verificar si la membresía existe
      await this.findOne(id);

      const { error } = await this.supabase
        .from('memberships')
        .delete()
        .eq('id', id);

      if (error) {
        throw new HttpException(
          `Error al eliminar la membresía: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error al eliminar la membresía: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkExpiredMemberships(): Promise<void> {
    try {
      const today = new Date().toISOString();
      
      // Obtener todas las membresías activas que han expirado
      const { data, error } = await this.supabase
        .from('memberships')
        .select('*')
        .eq('status', MembershipStatus.ACTIVE)
        .lt('end_date', today);

      if (error) {
        throw new HttpException(
          `Error al verificar membresías expiradas: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      // Actualizar el estado de las membresías expiradas
      for (const membership of data) {
        await this.supabase
          .from('memberships')
          .update({ status: MembershipStatus.EXPIRED })
          .eq('id', membership.id);
      }
    } catch (error) {
      throw new HttpException(
        `Error al verificar membresías expiradas: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async renewMembership(id: string): Promise<Membership> {
    try {
      // Obtener la membresía actual
      const membership = await this.findOne(id);
      
      // Calcular las nuevas fechas
      const startDate = new Date();
      let endDate = new Date(startDate);
      
      if (membership.type === MembershipType.MONTHLY) {
        endDate.setDate(startDate.getDate() + 30);
      } else if (membership.type === MembershipType.KICKBOXING) {
        endDate.setDate(startDate.getDate() + 30);
      }

      // Actualizar la membresía
      const { data, error } = await this.supabase
        .from('memberships')
        .update({
          status: MembershipStatus.ACTIVE,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new HttpException(
          `Error al renovar la membresía: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      return data;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Error al renovar la membresía: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
