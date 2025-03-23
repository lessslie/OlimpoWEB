import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';

// DTOs para las notificaciones
class SendEmailDto {
  email: string;
  subject: string;
  message: string;
}

class SendWhatsAppDto {
  phone: string;
  message: string;
}

class SendMembershipExpirationDto {
  email: string;
  name: string;
  expirationDate: Date;
  membershipType: string;
}

class SendMembershipRenewalDto {
  email: string;
  name: string;
  newExpirationDate: Date;
  membershipType: string;
}

class SendBulkEmailDto {
  emails: string[];
  subject: string;
  message: string;
}

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post('email')
  @Roles(Role.ADMIN)
  async sendEmail(@Body() sendEmailDto: SendEmailDto) {
    const result = await this.notificationsService.sendEmail(
      sendEmailDto.email,
      sendEmailDto.subject,
      sendEmailDto.message,
    );
    return {
      success: result,
      message: result
        ? 'Email enviado correctamente'
        : 'Error al enviar el email',
    };
  }

  @Post('whatsapp')
  @Roles(Role.ADMIN)
  async sendWhatsApp(@Body() sendWhatsAppDto: SendWhatsAppDto) {
    const result = await this.notificationsService.sendWhatsApp(
      sendWhatsAppDto.phone,
      sendWhatsAppDto.message,
    );
    return {
      success: result,
      message: result
        ? 'WhatsApp enviado correctamente'
        : 'Error al enviar el WhatsApp',
    };
  }

  @Post('membership-expiration')
  @Roles(Role.ADMIN)
  async sendMembershipExpiration(
    @Body() sendMembershipExpirationDto: SendMembershipExpirationDto,
  ) {
    const result =
      await this.notificationsService.sendMembershipExpirationNotification(
        sendMembershipExpirationDto.email,
        sendMembershipExpirationDto.name,
        new Date(sendMembershipExpirationDto.expirationDate),
        sendMembershipExpirationDto.membershipType,
      );
    return {
      success: result,
      message: result
        ? 'Notificación de expiración enviada correctamente'
        : 'Error al enviar la notificación de expiración',
    };
  }

  @Post('membership-renewal')
  @Roles(Role.ADMIN)
  async sendMembershipRenewal(
    @Body() sendMembershipRenewalDto: SendMembershipRenewalDto,
  ) {
    const result =
      await this.notificationsService.sendMembershipRenewalNotification(
        sendMembershipRenewalDto.email,
        sendMembershipRenewalDto.name,
        new Date(sendMembershipRenewalDto.newExpirationDate),
        sendMembershipRenewalDto.membershipType,
      );
    return {
      success: result,
      message: result
        ? 'Notificación de renovación enviada correctamente'
        : 'Error al enviar la notificación de renovación',
    };
  }

  @Post('bulk-email')
  @Roles(Role.ADMIN)
  async sendBulkEmail(@Body() sendBulkEmailDto: SendBulkEmailDto) {
    const result = await this.notificationsService.sendBulkEmail(
      sendBulkEmailDto.emails,
      sendBulkEmailDto.subject,
      sendBulkEmailDto.message,
    );
    return {
      success: result,
      message: result
        ? 'Emails masivos enviados correctamente'
        : 'Error al enviar los emails masivos',
    };
  }
}
