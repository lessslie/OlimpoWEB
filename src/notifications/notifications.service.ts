import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { NotificationStatus, NotificationType } from './entities/notification.entity';
import { NotificationTemplate } from './entities/template.entity';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

@Injectable()
export class NotificationsService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL') || '';
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY') || '';
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Envía un correo electrónico
   * @param email Correo electrónico del destinatario
   * @param subject Asunto del correo
   * @param message Contenido del correo
   * @param userId ID del usuario (opcional)
   * @param membershipId ID de la membresía (opcional)
   * @param templateId ID de la plantilla (opcional)
   */
  async sendEmail(
    email: string,
    subject: string,
    message: string,
    userId?: string,
    membershipId?: string,
    templateId?: string,
  ): Promise<boolean> {
    try {
      // Crear registro de notificación con estado pendiente
      const notificationId = await this.createNotificationRecord({
        type: NotificationType.EMAIL,
        recipient: email,
        content: message,
        subject,
        status: NotificationStatus.PENDING,
        userId,
        membershipId,
        templateId,
      });

      // Aquí iría la implementación real con SendGrid o similar
      console.log(`Enviando email a ${email}`);
      console.log(`Asunto: ${subject}`);
      console.log(`Mensaje: ${message}`);

      // Simulamos un envío exitoso (en producción, esto sería reemplazado por la llamada real a la API)
      const success = true;

      // Actualizar el registro de notificación según el resultado
      if (success) {
        await this.updateNotificationStatus(notificationId, NotificationStatus.SENT);
      } else {
        await this.updateNotificationStatus(notificationId, NotificationStatus.FAILED, 'Error al enviar email');
      }

      return success;
    } catch (error) {
      console.error('Error al enviar email:', error);
      return false;
    }
  }

  /**
   * Envía un mensaje de WhatsApp
   * @param phone Número de teléfono del destinatario
   * @param message Contenido del mensaje
   * @param userId ID del usuario (opcional)
   * @param membershipId ID de la membresía (opcional)
   * @param templateId ID de la plantilla (opcional)
   */
  async sendWhatsApp(
    phone: string,
    message: string,
    userId?: string,
    membershipId?: string,
    templateId?: string,
  ): Promise<boolean> {
    try {
      // Normalizar el número de teléfono (eliminar espacios, guiones, etc.)
      const normalizedPhone = phone.replace(/\s+/g, '').replace(/-/g, '');
      
      // Verificar si el número tiene el formato correcto
      if (!normalizedPhone.match(/^\+?[0-9]+$/)) {
        throw new Error('Formato de número de teléfono inválido');
      }
      
      // Asegurarse de que el número tenga el código de país
      let formattedPhone = normalizedPhone;
      if (!formattedPhone.startsWith('+')) {
        // Si no tiene el signo +, verificar si tiene el código de país (Argentina: 54)
        if (!formattedPhone.startsWith('54')) {
          formattedPhone = '54' + formattedPhone;
        }
      } else {
        // Si tiene el signo +, quitarlo para el formato que necesita WhatsApp
        formattedPhone = formattedPhone.substring(1);
      }
      
      // Crear el registro de notificación
      const notificationId = await this.createNotificationRecord({
        type: NotificationType.WHATSAPP,
        recipient: formattedPhone,
        content: message,
        status: NotificationStatus.PENDING,
        userId,
        membershipId,
        templateId,
      });
      
      // Intentar enviar usando la API de WhatsApp Business
      const whatsappToken = process.env.WHATSAPP_BUSINESS_API_TOKEN;
      const whatsappPhoneId = process.env.WHATSAPP_BUSINESS_PHONE_ID;
      
      if (whatsappToken && whatsappPhoneId) {
        try {
          // Verificar si se está utilizando una plantilla
          let response;
          
          if (templateId) {
            // Obtener la plantilla
            const template = await this.getTemplateById(templateId);
            
            if (template && template.whatsapp_template_name) {
              // Enviar mensaje usando plantilla de WhatsApp
              response = await axios.post(
                `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`,
                {
                  messaging_product: 'whatsapp',
                  to: formattedPhone,
                  type: 'template',
                  template: {
                    name: template.whatsapp_template_name,
                    language: {
                      code: 'es',
                    },
                    components: [
                      {
                        type: 'body',
                        parameters: this.extractTemplateParameters(message, template.variables)
                      }
                    ]
                  }
                },
                {
                  headers: {
                    'Authorization': `Bearer ${whatsappToken}`,
                    'Content-Type': 'application/json',
                  },
                }
              );
            } else {
              // Si no hay nombre de plantilla de WhatsApp, usar el método de texto
              response = await axios.post(
                `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`,
                {
                  messaging_product: 'whatsapp',
                  to: formattedPhone,
                  type: 'text',
                  text: {
                    body: message
                  }
                },
                {
                  headers: {
                    'Authorization': `Bearer ${whatsappToken}`,
                    'Content-Type': 'application/json',
                  },
                }
              );
            }
          } else {
            // Enviar mensaje de texto normal
            response = await axios.post(
              `https://graph.facebook.com/v18.0/${whatsappPhoneId}/messages`,
              {
                messaging_product: 'whatsapp',
                to: formattedPhone,
                type: 'text',
                text: {
                  body: message
                }
              },
              {
                headers: {
                  'Authorization': `Bearer ${whatsappToken}`,
                  'Content-Type': 'application/json',
                },
              }
            );
          }
          
          if (response.status === 200) {
            // Actualizar el registro de notificación como enviado
            await this.updateNotificationStatus(notificationId, NotificationStatus.SENT);
            return true;
          } else {
            throw new Error(`Error al enviar WhatsApp: ${response.statusText}`);
          }
        } catch (apiError) {
          console.error('Error al enviar WhatsApp usando API:', apiError);
          
          // Si falla la API, intentar con el método de URL
          const whatsappUrl = `https://api.whatsapp.com/send/?phone=${formattedPhone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
          
          // Actualizar el registro con el error de la API
          await this.updateNotificationStatus(
            notificationId, 
            NotificationStatus.FAILED, 
            `Error al enviar por API: ${apiError.message}. URL alternativa: ${whatsappUrl}`
          );
          
          // Devolver false porque no se pudo enviar automáticamente
          return false;
        }
      } else {
        // Si no hay configuración de API, usar el método de URL
        const whatsappUrl = `https://api.whatsapp.com/send/?phone=${formattedPhone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
        
        // Actualizar el registro con la información de la URL
        await this.updateNotificationStatus(
          notificationId, 
          NotificationStatus.PENDING, 
          `No hay configuración de API de WhatsApp. URL alternativa: ${whatsappUrl}`
        );
        
        // Devolver false porque no se pudo enviar automáticamente
        return false;
      }
    } catch (error) {
      console.error('Error al enviar WhatsApp:', error);
      
      // Si se creó un registro de notificación, actualizarlo con el error
      if (error.notificationId) {
        await this.updateNotificationStatus(
          error.notificationId, 
          NotificationStatus.FAILED, 
          `Error: ${error.message}`
        );
      }
      
      return false;
    }
  }

  // Método auxiliar para extraer parámetros de plantilla de WhatsApp
  private extractTemplateParameters(message: string, variables: string[] = []): Array<{type: string, text: string}> {
    const parameters: Array<{type: string, text: string}> = [];
    
    // Si no hay variables definidas, devolver el mensaje completo como un parámetro
    if (!variables || variables.length === 0) {
      return [{ type: 'text', text: message }];
    }
    
    // Crear una copia del mensaje para trabajar con él
    let processedMessage = message;
    
    // Procesar cada variable y extraer su valor real
    variables.forEach((variable) => {
      // Buscar la variable en el mensaje (formato {{variable}})
      const varPattern = new RegExp(`{{\\s*${variable}\\s*}}`, 'g');
      
      // Buscar el valor real que debería reemplazar a la variable
      // Esto depende de cómo se estructura el mensaje
      // Por ejemplo, si el mensaje tiene formato "Nombre: Juan, Fecha: 2023-01-01"
      // y la variable es "nombre", buscaríamos "Nombre: " y extraeríamos "Juan"
      
      // Primero verificamos si la variable está en el mensaje
      if (processedMessage.match(varPattern)) {
        // Intentar extraer el valor basado en patrones comunes
        // Por ejemplo: "variable: valor" o "variable = valor"
        const valuePattern = new RegExp(`${variable}\\s*[:=]\\s*([^,;\\n]+)`, 'i');
        const valueMatch = processedMessage.match(valuePattern);
        
        if (valueMatch && valueMatch[1]) {
          // Extraer el valor y limpiarlo
          const extractedValue = valueMatch[1].trim();
          parameters.push({
            type: 'text',
            text: extractedValue
          });
          
          // Marcar esta parte como procesada para evitar duplicados
          processedMessage = processedMessage.replace(valuePattern, '');
        } else {
          // Si no podemos extraer el valor con el patrón, usar un valor genérico
          parameters.push({
            type: 'text',
            text: `{{${variable}}}`
          });
        }
      } else {
        // Si la variable no está en el mensaje, añadir un valor vacío
        parameters.push({
          type: 'text',
          text: ''
        });
      }
    });
    
    return parameters;
  }

  /**
   * Obtiene una plantilla por su ID
   * @param id ID de la plantilla
   */
  async getTemplateById(id: string): Promise<NotificationTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('notification_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al obtener plantilla por ID:', error);
      return null;
    }
  }

  /**
   * Crea un registro de notificación en la base de datos
   */
  private async createNotificationRecord(params: {
    type: NotificationType;
    recipient: string;
    content: string;
    subject?: string;
    status: NotificationStatus;
    userId?: string;
    membershipId?: string;
    templateId?: string;
  }): Promise<string> {
    try {
      const notificationId = uuidv4();
      const now = new Date().toISOString();

      const notification = {
        id: notificationId,
        type: params.type,
        recipient: params.recipient,
        subject: params.subject,
        content: params.content,
        status: params.status,
        created_at: now,
        updated_at: now,
        user_id: params.userId,
        membership_id: params.membershipId,
        template_id: params.templateId,
      };

      const { error } = await this.supabase
        .from('notifications')
        .insert(notification);

      if (error) {
        console.error('Error al crear registro de notificación:', error);
        return '';
      }

      return notificationId;
    } catch (error) {
      console.error('Error al crear registro de notificación:', error);
      return '';
    }
  }

  /**
   * Actualiza el estado de una notificación en la base de datos
   */
  private async updateNotificationStatus(
    notificationId: string,
    status: NotificationStatus,
    errorMessage?: string,
  ): Promise<boolean> {
    try {
      if (!notificationId) return false;

      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === NotificationStatus.SENT) {
        updateData.sent_at = new Date().toISOString();
      }

      if (errorMessage) {
        updateData.error = errorMessage;
      }

      const { error } = await this.supabase
        .from('notifications')
        .update(updateData)
        .eq('id', notificationId);

      if (error) {
        console.error('Error al actualizar estado de notificación:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error al actualizar estado de notificación:', error);
      return false;
    }
  }

  /**
   * Obtiene el registro de notificaciones con filtros y paginación
   * @param params Parámetros de filtrado y paginación
   */
  async getNotificationLogs(params: {
    page?: number;
    limit?: number;
    type?: NotificationType;
    status?: NotificationStatus;
    startDate?: string;
    endDate?: string;
    userId?: string;
    membershipId?: string;
  }): Promise<{ data: any[]; count: number }> {
    try {
      const {
        page = 1,
        limit = 10,
        type,
        status,
        startDate,
        endDate,
        userId,
        membershipId,
      } = params;

      // Calcular offset para paginación
      const offset = (page - 1) * limit;

      // Iniciar la consulta
      let query = this.supabase
        .from('notifications')
        .select('*, users(id, first_name, last_name, email), memberships(id, start_date, end_date)', { count: 'exact' });

      // Aplicar filtros si existen
      if (type) {
        query = query.eq('type', type);
      }

      if (status) {
        query = query.eq('status', status);
      }

      if (startDate) {
        query = query.gte('created_at', startDate);
      }

      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (membershipId) {
        query = query.eq('membership_id', membershipId);
      }

      // Aplicar paginación y ordenar por fecha de creación (más reciente primero)
      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

      // Ejecutar la consulta
      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
      };
    } catch (error) {
      console.error('Error al obtener registro de notificaciones:', error);
      return {
        data: [],
        count: 0,
      };
    }
  }

  /**
   * Obtiene los detalles de una notificación específica por su ID
   * @param id ID de la notificación
   */
  async getNotificationLogById(id: string): Promise<any | null> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*, users(id, first_name, last_name, email), memberships(id, start_date, end_date), notification_templates(id, name, type)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al obtener detalles de notificación:', error);
      return null;
    }
  }

  /**
   * Envía una notificación de expiración de membresía
   */
  async sendMembershipExpirationNotification(params: {
    email: string;
    name: string;
    expirationDate: Date;
    membershipType: string;
    userId?: string;
    membershipId?: string;
    templateId?: string;
  }): Promise<boolean> {
    try {
      const { email, name, expirationDate, membershipType, userId, membershipId, templateId } = params;
      
      // Formatear la fecha de expiración
      const formattedDate = new Date(expirationDate).toLocaleDateString('es-AR');
      
      // Crear el mensaje
      let message = '';
      
      if (templateId) {
        // Usar plantilla si se proporciona
        const template = await this.getTemplateById(templateId);
        if (template) {
          message = template.content
            .replace(/{{nombre}}/g, name)
            .replace(/{{fecha_expiracion}}/g, formattedDate)
            .replace(/{{tipo_membresia}}/g, membershipType);
        }
      } else {
        // Mensaje predeterminado si no hay plantilla
        message = `Hola ${name}, tu membresía ${membershipType} expirará el ${formattedDate}. ¡No olvides renovarla para seguir disfrutando de nuestros servicios!`;
      }
      
      // Enviar el email
      return await this.sendEmail(
        email,
        'Recordatorio de expiración de membresía',
        message,
        userId,
        membershipId,
        templateId
      );
    } catch (error) {
      console.error('Error al enviar notificación de expiración:', error);
      return false;
    }
  }

  /**
   * Envía una notificación de renovación de membresía
   */
  async sendMembershipRenewalNotification(params: {
    email: string;
    name: string;
    newExpirationDate: Date;
    membershipType: string;
    userId?: string;
    membershipId?: string;
    templateId?: string;
  }): Promise<boolean> {
    try {
      const { email, name, newExpirationDate, membershipType, userId, membershipId, templateId } = params;
      
      // Formatear la fecha de expiración
      const formattedDate = new Date(newExpirationDate).toLocaleDateString('es-AR');
      
      // Crear el mensaje
      let message = '';
      
      if (templateId) {
        // Usar plantilla si se proporciona
        const template = await this.getTemplateById(templateId);
        if (template) {
          message = template.content
            .replace(/{{nombre}}/g, name)
            .replace(/{{nueva_fecha_expiracion}}/g, formattedDate)
            .replace(/{{tipo_membresia}}/g, membershipType);
        }
      } else {
        // Mensaje predeterminado si no hay plantilla
        message = `¡Hola ${name}! Tu membresía ${membershipType} ha sido renovada exitosamente. La nueva fecha de expiración es el ${formattedDate}. ¡Gracias por confiar en nosotros!`;
      }
      
      // Enviar el email
      return await this.sendEmail(
        email,
        'Confirmación de renovación de membresía',
        message,
        userId,
        membershipId,
        templateId
      );
    } catch (error) {
      console.error('Error al enviar notificación de renovación:', error);
      return false;
    }
  }

  /**
   * Envía un email a múltiples destinatarios
   */
  async sendBulkEmail(params: {
    emails: string[];
    subject: string;
    message: string;
    templateId?: string;
  }): Promise<{ success: number; failed: number }> {
    const { emails, subject, message, templateId } = params;
    let success = 0;
    let failed = 0;
    
    // Procesar cada email de forma individual
    for (const email of emails) {
      const result = await this.sendEmail(email, subject, message, undefined, undefined, templateId);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }
    
    return { success, failed };
  }

  /**
   * Obtiene todas las notificaciones
   */
  async getAllNotifications(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error al obtener todas las notificaciones:', error);
      return [];
    }
  }

  /**
   * Obtiene las notificaciones de un usuario específico
   */
  async getUserNotifications(userId: string): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error(`Error al obtener notificaciones del usuario ${userId}:`, error);
      return [];
    }
  }

  /**
   * Crea una nueva plantilla de notificación
   */
  async createTemplate(params: {
    name: string;
    description: string;
    type: NotificationType;
    content: string;
    variables: string[];
    subject?: string;
    isDefault?: boolean;
    createdBy?: string;
    whatsapp_template_name?: string;
  }): Promise<any> {
    try {
      const {
        name,
        description,
        type,
        content,
        variables,
        subject,
        isDefault = false,
        createdBy,
        whatsapp_template_name,
      } = params;
      
      const templateId = uuidv4();
      const now = new Date().toISOString();
      
      // Si esta plantilla será la predeterminada, actualizar las demás del mismo tipo
      if (isDefault) {
        await this.supabase
          .from('notification_templates')
          .update({ is_default: false })
          .eq('type', type)
          .eq('is_default', true);
      }
      
      const template = {
        id: templateId,
        name,
        description,
        type,
        content,
        variables,
        subject,
        is_default: isDefault,
        created_at: now,
        updated_at: now,
        created_by: createdBy,
        whatsapp_template_name,
      };
      
      const { data, error } = await this.supabase
        .from('notification_templates')
        .insert(template)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error al crear plantilla:', error);
      return null;
    }
  }

  /**
   * Obtiene todas las plantillas de notificación
   */
  async getAllTemplates(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error al obtener todas las plantillas:', error);
      return [];
    }
  }

  /**
   * Actualiza una plantilla de notificación existente
   */
  async updateTemplate(id: string, params: {
    name?: string;
    description?: string;
    content?: string;
    variables?: string[];
    subject?: string;
    isDefault?: boolean;
    whatsapp_template_name?: string;
  }): Promise<any> {
    try {
      const {
        name,
        description,
        content,
        variables,
        subject,
        isDefault,
        whatsapp_template_name,
      } = params;
      
      // Obtener la plantilla actual para verificar si cambia el estado predeterminado
      const { data: currentTemplate } = await this.supabase
        .from('notification_templates')
        .select('type, is_default')
        .eq('id', id)
        .single();
      
      if (!currentTemplate) {
        throw new Error('Plantilla no encontrada');
      }
      
      // Si esta plantilla será la predeterminada y no lo era antes, actualizar las demás
      if (isDefault === true && !currentTemplate.is_default) {
        await this.supabase
          .from('notification_templates')
          .update({ is_default: false })
          .eq('type', currentTemplate.type)
          .eq('is_default', true);
      }
      
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };
      
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (content !== undefined) updateData.content = content;
      if (variables !== undefined) updateData.variables = variables;
      if (subject !== undefined) updateData.subject = subject;
      if (isDefault !== undefined) updateData.is_default = isDefault;
      if (whatsapp_template_name !== undefined) updateData.whatsapp_template_name = whatsapp_template_name;
      
      const { data, error } = await this.supabase
        .from('notification_templates')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error al actualizar plantilla ${id}:`, error);
      return null;
    }
  }

  /**
   * Elimina una plantilla de notificación
   */
  async deleteTemplate(id: string): Promise<boolean> {
    try {
      // Verificar si la plantilla es predeterminada
      const { data: template } = await this.supabase
        .from('notification_templates')
        .select('is_default')
        .eq('id', id)
        .single();
      
      if (template && template.is_default) {
        throw new Error('No se puede eliminar una plantilla predeterminada');
      }
      
      const { error } = await this.supabase
        .from('notification_templates')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error(`Error al eliminar plantilla ${id}:`, error);
      return false;
    }
  }
}
