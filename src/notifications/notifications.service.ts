import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Notification, NotificationStatus, NotificationType } from './entities/notification.entity';
import { NotificationTemplate } from './entities/template.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationsService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase environment variables are not defined');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Envía una notificación por correo electrónico
   * @param email Correo electrónico del destinatario
   * @param subject Asunto del correo
   * @param message Contenido del correo
   * @param userId ID del usuario relacionado (opcional)
   * @param membershipId ID de la membresía relacionada (opcional)
   * @param templateId ID de la plantilla utilizada (opcional)
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
      const notificationId = await this.createNotificationRecord(
        NotificationType.EMAIL,
        email,
        message,
        subject,
        userId,
        membershipId,
        templateId,
      );

      // Aquí iría la integración con SendGrid
      // Este es un ejemplo de cómo se implementaría con SendGrid
      /*
      const sgMail = require('@sendgrid/mail');
      sgMail.setApiKey(this.configService.get<string>('SENDGRID_API_KEY'));
      
      const msg = {
        to: email,
        from: this.configService.get<string>('SENDGRID_FROM_EMAIL'),
        subject: subject,
        text: message,
        html: message.replace(/\n/g, '<br>'),
      };
      
      await sgMail.send(msg);
      */

      // Por ahora, simulamos el envío
      console.log(`Enviando email a ${email} con asunto: ${subject}`);
      console.log(`Mensaje: ${message}`);

      // Actualizar el registro de notificación como enviado
      await this.updateNotificationStatus(notificationId, NotificationStatus.SENT);

      return true;
    } catch (error) {
      console.error('Error al enviar email:', error);
      
      // Si tenemos un ID de notificación, actualizar su estado a fallido
      if (arguments[6]) {
        await this.updateNotificationStatus(
          arguments[6], 
          NotificationStatus.FAILED, 
          error.message
        );
      }
      
      return false;
    }
  }

  /**
   * Envía una notificación por WhatsApp
   * @param phone Número de teléfono del destinatario
   * @param message Mensaje a enviar
   * @param userId ID del usuario relacionado (opcional)
   * @param membershipId ID de la membresía relacionada (opcional)
   * @param templateId ID de la plantilla utilizada (opcional)
   */
  async sendWhatsApp(
    phone: string,
    message: string,
    userId?: string,
    membershipId?: string,
    templateId?: string,
  ): Promise<boolean> {
    try {
      // Crear registro de notificación con estado pendiente
      const notificationId = await this.createNotificationRecord(
        NotificationType.WHATSAPP,
        phone,
        message,
        undefined,
        userId,
        membershipId,
        templateId,
      );

      // Formatear el número de teléfono (eliminar espacios, guiones, etc.)
      const formattedPhone = phone.replace(/\D/g, '');
      
      // Construir la URL para la API de WhatsApp
      const whatsappUrl = `https://api.whatsapp.com/send/?phone=${formattedPhone}&text=${encodeURIComponent(message)}&type=phone_number&app_absent=0`;
      
      // En un entorno real, aquí se podría usar la API oficial de WhatsApp Business
      // Por ejemplo, con Twilio:
      /*
      const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
      const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
      const client = require('twilio')(accountSid, authToken);
      
      await client.messages.create({
        body: message,
        from: `whatsapp:${this.configService.get<string>('TWILIO_WHATSAPP_NUMBER')}`,
        to: `whatsapp:${formattedPhone}`
      });
      */
      
      // Para esta implementación, registramos la URL que se generaría
      console.log(`URL de WhatsApp generada: ${whatsappUrl}`);
      console.log(`Mensaje: ${message}`);
      
      // Actualizar el registro de notificación como enviado
      await this.updateNotificationStatus(notificationId, NotificationStatus.SENT);

      // Simulamos un envío exitoso
      return true;
    } catch (error) {
      console.error('Error al enviar WhatsApp:', error);
      
      // Si tenemos un ID de notificación, actualizar su estado a fallido
      if (arguments[5]) {
        await this.updateNotificationStatus(
          arguments[5], 
          NotificationStatus.FAILED, 
          error.message
        );
      }
      
      return false;
    }
  }

  /**
   * Envía una notificación de expiración de membresía
   * @param email Correo electrónico del usuario
   * @param name Nombre del usuario
   * @param expirationDate Fecha de expiración de la membresía
   * @param membershipType Tipo de membresía
   * @param userId ID del usuario
   * @param membershipId ID de la membresía
   * @param templateId ID de la plantilla (opcional)
   */
  async sendMembershipExpirationNotification(
    email: string,
    name: string,
    expirationDate: Date,
    membershipType: string,
    userId?: string,
    membershipId?: string,
    templateId?: string,
  ): Promise<boolean> {
    try {
      // Buscar plantilla personalizada o usar mensaje predeterminado
      let subject = 'Tu membresía está por expirar - Olimpo Gym';
      let message = `
        Hola ${name},
        
        Te informamos que tu membresía ${membershipType} en Olimpo Gym expirará el ${expirationDate.toLocaleDateString()}.
        
        Para renovar tu membresía, puedes acercarte a nuestras instalaciones o hacerlo directamente desde nuestra plataforma web.
        
        ¡Gracias por ser parte de Olimpo Gym!
        
        Saludos,
        El equipo de Olimpo Gym
      `;

      // Si se proporciona un ID de plantilla, buscar y usar esa plantilla
      if (templateId) {
        const template = await this.getTemplateById(templateId);
        if (template) {
          subject = template.subject;
          message = this.replaceTemplateVariables(template.content, {
            name,
            membershipType,
            expirationDate: expirationDate.toLocaleDateString(),
          });
        }
      } else {
        // Buscar plantilla predeterminada para este tipo de notificación
        const defaultTemplate = await this.getDefaultTemplate(NotificationType.MEMBERSHIP_EXPIRATION);
        if (defaultTemplate) {
          subject = defaultTemplate.subject;
          message = this.replaceTemplateVariables(defaultTemplate.content, {
            name,
            membershipType,
            expirationDate: expirationDate.toLocaleDateString(),
          });
        }
      }

      // Crear registro de notificación
      const notificationId = await this.createNotificationRecord(
        NotificationType.MEMBERSHIP_EXPIRATION,
        email,
        message,
        subject,
        userId,
        membershipId,
        templateId,
      );

      // Enviar el email
      const result = await this.sendEmail(
        email, 
        subject, 
        message, 
        userId, 
        membershipId, 
        templateId
      );
      
      return result;
    } catch (error) {
      console.error('Error al enviar notificación de expiración:', error);
      return false;
    }
  }

  /**
   * Envía una notificación de renovación de membresía
   * @param email Correo electrónico del usuario
   * @param name Nombre del usuario
   * @param newExpirationDate Nueva fecha de expiración de la membresía
   * @param membershipType Tipo de membresía
   * @param userId ID del usuario
   * @param membershipId ID de la membresía
   * @param templateId ID de la plantilla (opcional)
   */
  async sendMembershipRenewalNotification(
    email: string,
    name: string,
    newExpirationDate: Date,
    membershipType: string,
    userId?: string,
    membershipId?: string,
    templateId?: string,
  ): Promise<boolean> {
    try {
      // Buscar plantilla personalizada o usar mensaje predeterminado
      let subject = 'Tu membresía ha sido renovada - Olimpo Gym';
      let message = `
        Hola ${name},
        
        Te informamos que tu membresía ${membershipType} en Olimpo Gym ha sido renovada exitosamente.
        
        Tu nueva fecha de expiración es el ${newExpirationDate.toLocaleDateString()}.
        
        ¡Gracias por seguir confiando en Olimpo Gym!
        
        Saludos,
        El equipo de Olimpo Gym
      `;

      // Si se proporciona un ID de plantilla, buscar y usar esa plantilla
      if (templateId) {
        const template = await this.getTemplateById(templateId);
        if (template) {
          subject = template.subject;
          message = this.replaceTemplateVariables(template.content, {
            name,
            membershipType,
            newExpirationDate: newExpirationDate.toLocaleDateString(),
          });
        }
      } else {
        // Buscar plantilla predeterminada para este tipo de notificación
        const defaultTemplate = await this.getDefaultTemplate(NotificationType.MEMBERSHIP_RENEWAL);
        if (defaultTemplate) {
          subject = defaultTemplate.subject;
          message = this.replaceTemplateVariables(defaultTemplate.content, {
            name,
            membershipType,
            newExpirationDate: newExpirationDate.toLocaleDateString(),
          });
        }
      }

      // Crear registro de notificación
      const notificationId = await this.createNotificationRecord(
        NotificationType.MEMBERSHIP_RENEWAL,
        email,
        message,
        subject,
        userId,
        membershipId,
        templateId,
      );

      // Enviar el email
      const result = await this.sendEmail(
        email, 
        subject, 
        message, 
        userId, 
        membershipId, 
        templateId
      );
      
      return result;
    } catch (error) {
      console.error('Error al enviar notificación de renovación:', error);
      return false;
    }
  }

  /**
   * Envía un correo electrónico masivo a múltiples destinatarios
   * @param emails Lista de correos electrónicos
   * @param subject Asunto del correo
   * @param message Contenido del correo
   * @param templateId ID de la plantilla (opcional)
   */
  async sendBulkEmail(
    emails: string[],
    subject: string,
    message: string,
    templateId?: string,
  ): Promise<boolean> {
    try {
      // Crear un registro de notificación masiva
      const bulkNotificationId = await this.createNotificationRecord(
        NotificationType.BULK_EMAIL,
        emails.join(','),
        message,
        subject,
        undefined,
        undefined,
        templateId,
      );

      // Aquí podríamos implementar un envío en lotes o utilizar un servicio especializado
      console.log(`Enviando email masivo a ${emails.length} destinatarios`);
      console.log(`Asunto: ${subject}`);
      console.log(`Mensaje: ${message}`);

      // Para una implementación simple, enviamos a cada destinatario individualmente
      const results = await Promise.all(
        emails.map((email) => this.sendEmail(email, subject, message, undefined, undefined, templateId)),
      );

      // Actualizar el estado de la notificación masiva
      const successRate = results.filter((result) => result).length / results.length;
      await this.updateNotificationStatus(
        bulkNotificationId, 
        successRate >= 0.9 ? NotificationStatus.SENT : NotificationStatus.FAILED,
        successRate < 0.9 ? `Tasa de éxito: ${successRate * 100}%` : undefined
      );

      // Consideramos exitoso si al menos el 90% de los envíos fueron exitosos
      return successRate >= 0.9;
    } catch (error) {
      console.error('Error al enviar email masivo:', error);
      return false;
    }
  }

  /**
   * Crea un registro de notificación en la base de datos
   */
  private async createNotificationRecord(
    type: NotificationType,
    recipient: string,
    message: string,
    subject?: string,
    userId?: string,
    membershipId?: string,
    templateId?: string,
  ): Promise<string> {
    try {
      const notificationId = uuidv4();
      const now = new Date().toISOString();

      const notification: Notification = {
        id: notificationId,
        type,
        recipient,
        subject,
        message,
        status: NotificationStatus.PENDING,
        created_at: new Date(now),
        updated_at: new Date(now),
        user_id: userId,
        membership_id: membershipId,
        template_id: templateId,
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

      const updateData: Partial<Notification> = {
        status,
        updated_at: new Date(),
      };

      if (status === NotificationStatus.SENT) {
        updateData.sent_at = new Date();
      }

      if (errorMessage) {
        updateData.error_message = errorMessage;
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
   * Obtiene todas las notificaciones enviadas
   */
  async getAllNotifications(): Promise<Notification[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener notificaciones:', error);
        return [];
      }

      return data.map(notification => ({
        ...notification,
        created_at: new Date(notification.created_at),
        updated_at: new Date(notification.updated_at),
        sent_at: notification.sent_at ? new Date(notification.sent_at) : undefined,
      }));
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      return [];
    }
  }

  /**
   * Obtiene las notificaciones de un usuario específico
   */
  async getUserNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`Error al obtener notificaciones del usuario ${userId}:`, error);
        return [];
      }

      return data.map(notification => ({
        ...notification,
        created_at: new Date(notification.created_at),
        updated_at: new Date(notification.updated_at),
        sent_at: notification.sent_at ? new Date(notification.sent_at) : undefined,
      }));
    } catch (error) {
      console.error(`Error al obtener notificaciones del usuario ${userId}:`, error);
      return [];
    }
  }

  /**
   * Crea una nueva plantilla de notificación
   */
  async createTemplate(
    name: string,
    description: string,
    type: NotificationType,
    content: string,
    variables: string[],
    subject?: string,
    isDefault?: boolean,
    createdBy?: string,
  ): Promise<NotificationTemplate | null> {
    try {
      const templateId = uuidv4();
      const now = new Date().toISOString();

      const template: NotificationTemplate = {
        id: templateId,
        name,
        description,
        type,
        subject: subject || '',
        content,
        variables,
        is_default: isDefault || false,
        created_at: new Date(now),
        updated_at: new Date(now),
        created_by: createdBy || '',
      };

      // Si esta plantilla es la predeterminada, actualizar las demás plantillas del mismo tipo
      if (isDefault) {
        const { error: updateError } = await this.supabase
          .from('notification_templates')
          .update({ is_default: false })
          .eq('type', type)
          .eq('is_default', true);

        if (updateError) {
          console.error('Error al actualizar plantillas existentes:', updateError);
        }
      }

      const { error } = await this.supabase
        .from('notification_templates')
        .insert(template);

      if (error) {
        console.error('Error al crear plantilla:', error);
        return null;
      }

      return template;
    } catch (error) {
      console.error('Error al crear plantilla:', error);
      return null;
    }
  }

  /**
   * Obtiene todas las plantillas de notificación
   */
  async getAllTemplates(): Promise<NotificationTemplate[]> {
    try {
      const { data, error } = await this.supabase
        .from('notification_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error al obtener plantillas:', error);
        return [];
      }

      return data.map(template => ({
        ...template,
        created_at: new Date(template.created_at),
        updated_at: new Date(template.updated_at),
      }));
    } catch (error) {
      console.error('Error al obtener plantillas:', error);
      return [];
    }
  }

  /**
   * Obtiene una plantilla por su ID
   */
  async getTemplateById(templateId: string): Promise<NotificationTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('notification_templates')
        .select('*')
        .eq('id', templateId)
        .single();

      if (error) {
        console.error(`Error al obtener plantilla ${templateId}:`, error);
        return null;
      }

      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };
    } catch (error) {
      console.error(`Error al obtener plantilla ${templateId}:`, error);
      return null;
    }
  }

  /**
   * Obtiene la plantilla predeterminada para un tipo de notificación
   */
  async getDefaultTemplate(type: NotificationType): Promise<NotificationTemplate | null> {
    try {
      const { data, error } = await this.supabase
        .from('notification_templates')
        .select('*')
        .eq('type', type)
        .eq('is_default', true)
        .single();

      if (error) {
        console.error(`Error al obtener plantilla predeterminada para ${type}:`, error);
        return null;
      }

      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };
    } catch (error) {
      console.error(`Error al obtener plantilla predeterminada para ${type}:`, error);
      return null;
    }
  }

  /**
   * Actualiza una plantilla existente
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<NotificationTemplate>,
  ): Promise<NotificationTemplate | null> {
    try {
      // Si esta plantilla se está estableciendo como predeterminada, actualizar las demás
      if (updates.is_default) {
        const template = await this.getTemplateById(templateId);
        if (template) {
          const { error: updateError } = await this.supabase
            .from('notification_templates')
            .update({ is_default: false })
            .eq('type', template.type)
            .eq('is_default', true);

          if (updateError) {
            console.error('Error al actualizar plantillas existentes:', updateError);
          }
        }
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await this.supabase
        .from('notification_templates')
        .update(updateData)
        .eq('id', templateId)
        .select()
        .single();

      if (error) {
        console.error(`Error al actualizar plantilla ${templateId}:`, error);
        return null;
      }

      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
      };
    } catch (error) {
      console.error(`Error al actualizar plantilla ${templateId}:`, error);
      return null;
    }
  }

  /**
   * Elimina una plantilla
   */
  async deleteTemplate(templateId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notification_templates')
        .delete()
        .eq('id', templateId);

      if (error) {
        console.error(`Error al eliminar plantilla ${templateId}:`, error);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Error al eliminar plantilla ${templateId}:`, error);
      return false;
    }
  }

  /**
   * Reemplaza las variables en una plantilla con sus valores correspondientes
   */
  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, value);
    }
    
    return result;
  }
}
