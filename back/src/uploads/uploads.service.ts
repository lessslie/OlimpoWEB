import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { ConfigService } from '@nestjs/config';
import * as cloudinary from 'cloudinary';

// Definir la interfaz para la respuesta de Cloudinary
interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  resource_type: string;
}

@Injectable()
export class UploadsService {
  constructor(private configService: ConfigService) {
    // Configurar Cloudinary
    cloudinary.v2.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Sube un archivo a Cloudinary
   * @param file Archivo a subir
   * @returns Información del archivo subido
   */
  async uploadToCloudinary(file: any) {
    try {
      // Convertir el buffer del archivo a base64
      const base64File = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      
      // Subir a Cloudinary
      const result = await new Promise<CloudinaryResponse>((resolve, reject) => {
        cloudinary.v2.uploader.upload(
          base64File,
          {
            folder: 'olimpo',
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result as CloudinaryResponse);
          }
        );
      });

      return {
        url: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      throw new Error(`Error al subir archivo a Cloudinary: ${error.message}`);
    }
  }

  /**
   * Elimina un archivo de Cloudinary
   * @param publicId ID público del archivo en Cloudinary
   * @returns Mensaje de confirmación
   */
  async deleteFromCloudinary(publicId: string): Promise<{ message: string }> {
    try {
      const result = await new Promise<string>((resolve, reject) => {
        cloudinary.v2.uploader.destroy(
          publicId,
          (error, result) => {
            if (error) return reject(error);
            resolve(result?.result || '');
          }
        );
      });

      if (result === 'ok') {
        return { message: `Archivo con ID ${publicId} eliminado correctamente de Cloudinary` };
      } else {
        throw new Error(`No se pudo eliminar el archivo con ID ${publicId}`);
      }
    } catch (error) {
      throw new Error(`Error al eliminar archivo de Cloudinary: ${error.message}`);
    }
  }

  /**
   * Obtiene la ruta completa de un archivo local
   * @param filename Nombre del archivo
   * @returns Ruta completa del archivo
   */
  getFilePath(filename: string): string {
    return join(process.cwd(), 'uploads', filename);
  }

  /**
   * Elimina un archivo del sistema de archivos local
   * @param filename Nombre del archivo a eliminar
   * @returns Mensaje de confirmación
   */
  async deleteFile(filename: string): Promise<{ message: string }> {
    const filePath = this.getFilePath(filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException(`El archivo ${filename} no existe`);
    }

    try {
      unlinkSync(filePath);
      return { message: `Archivo ${filename} eliminado correctamente` };
    } catch (error) {
      throw new Error(`Error al eliminar el archivo: ${error.message}`);
    }
  }

  /**
   * Verifica si un archivo existe localmente
   * @param filename Nombre del archivo a verificar
   * @returns Booleano indicando si el archivo existe
   */
  fileExists(filename: string): boolean {
    const filePath = this.getFilePath(filename);
    return existsSync(filePath);
  }
}
