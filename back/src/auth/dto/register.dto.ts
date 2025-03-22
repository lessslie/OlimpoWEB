import { IsEmail, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Juan' })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser un texto' })
  first_name: string;

  @ApiProperty({ example: 'Pérez' })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString({ message: 'El apellido debe ser un texto' })
  last_name: string;

  @ApiProperty({ example: '1123456789' })
  @IsNotEmpty({ message: 'El teléfono es requerido' })
  @IsString({ message: 'El teléfono debe ser un texto' })
  phone: string;

  @ApiProperty({ example: 'usuario@ejemplo.com' })
  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'Formato de email inválido' })
  email: string;

  @ApiProperty({ example: 'Contraseña123!' })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, {
    message: 'La contraseña debe contener al menos una letra mayúscula, una minúscula y un número',
  })
  password: string;

  @ApiProperty({ example: 'Contraseña123!' })
  @IsNotEmpty({ message: 'La confirmación de contraseña es requerida' })
  confirmPassword: string;
}
