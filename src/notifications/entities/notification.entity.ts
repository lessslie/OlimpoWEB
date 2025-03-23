export enum NotificationType {
  EMAIL = 'EMAIL',
  WHATSAPP = 'WHATSAPP',
  MEMBERSHIP_EXPIRATION = 'MEMBERSHIP_EXPIRATION',
  MEMBERSHIP_RENEWAL = 'MEMBERSHIP_RENEWAL',
  BULK_EMAIL = 'BULK_EMAIL',
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
}

export class Notification {
  id: string;
  type: NotificationType;
  recipient: string; // Email o número de teléfono
  subject?: string; // Solo para emails
  message: string;
  status: NotificationStatus;
  sent_at?: Date;
  created_at: Date;
  updated_at: Date;
  user_id?: string; // ID del usuario relacionado (si aplica)
  membership_id?: string; // ID de la membresía relacionada (si aplica)
  template_id?: string; // ID de la plantilla utilizada (si aplica)
  error_message?: string; // Mensaje de error si falló
}
