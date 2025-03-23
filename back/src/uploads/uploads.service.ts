import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';

@Injectable()
export class UploadsService {
  /**
   * Obtiene la ruta completa de un archivo
   * @param filename Nombre del archivo
   * @returns Ruta completa del archivo
   */
  getFilePath(filename: string): string {
    return join(process.cwd(), 'uploads', filename);
  }

  /**
   * Elimina un archivo del sistema de archivos
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
   * Verifica si un archivo existe
   * @param filename Nombre del archivo a verificar
   * @returns Booleano indicando si el archivo existe
   */
  fileExists(filename: string): boolean {
    const filePath = this.getFilePath(filename);
    return existsSync(filePath);
  }
}
