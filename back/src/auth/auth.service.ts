import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService, User } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      // Verificar si el usuario ya existe
      const existingUser = await this.usersService.findByEmail(registerDto.email);
      if (existingUser) {
        throw new HttpException(
          'Este email ya está registrado',
          HttpStatus.CONFLICT
        );
      }

      // Hash de la contraseña
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Crear usuario
      const user = await this.usersService.create({
        email: registerDto.email,
        password: hashedPassword,
        first_name: registerDto.first_name,
        last_name: registerDto.last_name,
        phone: registerDto.phone,
        is_admin: false, // Agregamos esta propiedad que faltaba
      });

      // Generar token JWT
      const token = this.generateToken(user);

      return {
        message: 'Usuario registrado correctamente',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          is_admin: user.is_admin,
        },
        token,
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
      // Buscar usuario por email
      const user = await this.usersService.findByEmail(loginDto.email);
      if (!user) {
        throw new HttpException(
          'Credenciales inválidas',
          HttpStatus.UNAUTHORIZED
        );
      }

      // Verificar contraseña
      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
      if (!isPasswordValid) {
        throw new HttpException(
          'Credenciales inválidas',
          HttpStatus.UNAUTHORIZED
        );
      }

      // Generar token JWT
      const token = this.generateToken(user);

      return {
        message: 'Inicio de sesión exitoso',
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          is_admin: user.is_admin,
        },
        token,
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
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findOne(payload.sub);
      
      if (!user) {
        throw new HttpException(
          'Token inválido o expirado',
          HttpStatus.UNAUTHORIZED
        );
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          phone: user.phone,
          is_admin: user.is_admin,
        },
      };
    } catch (error) {
      throw new HttpException(
        'Token inválido o expirado',
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  private generateToken(user: User) {
    const payload = {
      email: user.email,
      sub: user.id,
      is_admin: user.is_admin,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}