import { NotificationType } from './notification.entity';

export class NotificationTemplate {
  id: string;
  name: string;
  description: string;
  type: NotificationType;
  subject: string; // Solo para plantillas de email
  content: string;
  variables: string[]; // Lista de variables que se pueden reemplazar en la plantilla
  is_default: boolean; // Indica si es la plantilla predeterminada para este tipo
  created_at: Date;
  updated_at: Date;
  created_by: string; // ID del administrador que creó la plantilla
}
