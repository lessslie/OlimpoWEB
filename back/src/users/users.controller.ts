import { Controller, Get, Post, Body, Patch, Param, Delete, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado correctamente', type: User })
  @ApiResponse({ status: 400, description: 'Datos de entrada inválidos' })
  @ApiResponse({ status: 409, description: 'El usuario ya existe' })
  @ApiBearerAuth()
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      return await this.usersService.create(createUserDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      if (error.message && error.message.includes('already exists')) {
        throw new HttpException(
          'El usuario ya existe',
          HttpStatus.CONFLICT
        );
      }
      
      throw new HttpException(
        error.message || 'Error al crear usuario',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todos los usuarios' })
  @ApiResponse({ status: 200, description: 'Lista de usuarios', type: [User] })
  @ApiBearerAuth()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiResponse({ status: 200, description: 'Usuario encontrado', type: User })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiBearerAuth()
  async findOne(@Param('id') id: string) {
    try {
      return await this.usersService.findOne(id);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        'Usuario no encontrado',
        HttpStatus.NOT_FOUND
      );
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario actualizado', type: User })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiBearerAuth()
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    try {
      return await this.usersService.update(id, updateUserDto);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      if (error.message && error.message.includes('not found')) {
        throw new HttpException(
          'Usuario no encontrado',
          HttpStatus.NOT_FOUND
        );
      }
      
      throw new HttpException(
        error.message || 'Error al actualizar usuario',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un usuario' })
  @ApiResponse({ status: 200, description: 'Usuario eliminado' })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  @ApiBearerAuth()
  async remove(@Param('id') id: string) {
    try {
      await this.usersService.remove(id);
      return { message: 'Usuario eliminado correctamente' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      if (error.message && error.message.includes('not found')) {
        throw new HttpException(
          'Usuario no encontrado',
          HttpStatus.NOT_FOUND
        );
      }
      
      throw new HttpException(
        error.message || 'Error al eliminar usuario',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
