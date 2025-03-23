import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Delete,
  Put,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../users/enums/role.enum';
import { NotificationType } from './entities/notification.entity';

class SendEmailDto {
  email: string;
  subject: string;
  message: string;
  userId?: string;
  membershipId?: string;
  templateId?: string;
}

class SendWhatsAppDto {
  phone: string;
  message: string;
  userId?: string;
  membershipId?: string;
  templateId?: string;
}

class SendMembershipExpirationDto {
  email: string;
  name: string;
  expirationDate: Date;
  membershipType: string;
  userId?: string;
  membershipId?: string;
  templateId?: string;
}

class SendMembershipRenewalDto {
  email: string;
  name: string;
  newExpirationDate: Date;
  membershipType: string;
  userId?: string;
  membershipId?: string;
  templateId?: string;
}

class SendBulkEmailDto {
  emails: string[];
  subject: string;
  message: string;
  templateId?: string;
}

class CreateTemplateDto {
  name: string;
  description: string;
  type: NotificationType;
  content: string;
  variables: string[];
  subject?: string;
  isDefault?: boolean;
  createdBy?: string;
}

class UpdateTemplateDto {
  name?: string;
  description?: string;
  content?: string;
  variables?: string[];
  subject?: string;
  isDefault?: boolean;
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
      sendEmailDto.userId,
      sendEmailDto.membershipId,
      sendEmailDto.templateId,
    );
    return { success: result };
  }

  @Post('whatsapp')
  @Roles(Role.ADMIN)
  async sendWhatsApp(@Body() sendWhatsAppDto: SendWhatsAppDto) {
    const result = await this.notificationsService.sendWhatsApp(
      sendWhatsAppDto.phone,
      sendWhatsAppDto.message,
      sendWhatsAppDto.userId,
      sendWhatsAppDto.membershipId,
      sendWhatsAppDto.templateId,
    );
    return { success: result };
  }

  @Post('membership-expiration')
  @Roles(Role.ADMIN)
  async sendMembershipExpirationNotification(
    @Body() dto: SendMembershipExpirationDto,
  ) {
    try {
      const result = await this.notificationsService.sendMembershipExpirationNotification(
        dto.email,
        dto.name,
        new Date(dto.expirationDate),
        dto.membershipType,
        dto.userId,
        dto.membershipId,
        dto.templateId,
      );
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('membership-renewal')
  @Roles(Role.ADMIN)
  async sendMembershipRenewalNotification(
    @Body() dto: SendMembershipRenewalDto,
  ) {
    try {
      const result = await this.notificationsService.sendMembershipRenewalNotification(
        dto.email,
        dto.name,
        new Date(dto.newExpirationDate),
        dto.membershipType,
        dto.userId,
        dto.membershipId,
        dto.templateId,
      );
      return { success: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  @Post('bulk-email')
  @Roles(Role.ADMIN)
  async sendBulkEmail(@Body() sendBulkEmailDto: SendBulkEmailDto) {
    const result = await this.notificationsService.sendBulkEmail(
      sendBulkEmailDto.emails,
      sendBulkEmailDto.subject,
      sendBulkEmailDto.message,
      sendBulkEmailDto.templateId,
    );
    return { success: result };
  }

  @Get()
  @Roles(Role.ADMIN)
  async getAllNotifications() {
    const notifications = await this.notificationsService.getAllNotifications();
    return { notifications };
  }

  @Get('user/:userId')
  @Roles(Role.ADMIN)
  async getUserNotifications(@Param('userId') userId: string) {
    const notifications = await this.notificationsService.getUserNotifications(userId);
    return { notifications };
  }

  // Endpoints para gestionar plantillas

  @Post('templates')
  @Roles(Role.ADMIN)
  async createTemplate(@Body() createTemplateDto: CreateTemplateDto) {
    const template = await this.notificationsService.createTemplate(
      createTemplateDto.name,
      createTemplateDto.description,
      createTemplateDto.type,
      createTemplateDto.content,
      createTemplateDto.variables,
      createTemplateDto.subject,
      createTemplateDto.isDefault,
      createTemplateDto.createdBy,
    );
    return { success: !!template, template };
  }

  @Get('templates')
  @Roles(Role.ADMIN)
  async getAllTemplates() {
    const templates = await this.notificationsService.getAllTemplates();
    return { templates };
  }

  @Get('templates/:id')
  @Roles(Role.ADMIN)
  async getTemplateById(@Param('id') id: string) {
    const template = await this.notificationsService.getTemplateById(id);
    return { template };
  }

  @Put('templates/:id')
  @Roles(Role.ADMIN)
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ) {
    const template = await this.notificationsService.updateTemplate(id, updateTemplateDto);
    return { success: !!template, template };
  }

  @Delete('templates/:id')
  @Roles(Role.ADMIN)
  async deleteTemplate(@Param('id') id: string) {
    const success = await this.notificationsService.deleteTemplate(id);
    return { success };
  }
}
