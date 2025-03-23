import { Controller, Get, Redirect } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Redirect('api/docs', 302)
  @ApiOperation({ summary: 'Redirige a la documentación de Swagger' })
  @ApiResponse({
    status: 302,
    description: 'Redirige a la documentación de Swagger',
  })
  redirectToSwagger() {
    return;
  }

  @Get('api')
  @ApiOperation({ summary: 'Obtiene un mensaje de bienvenida' })
  @ApiResponse({ status: 200, description: 'Mensaje de bienvenida' })
  getHello(): string {
    return this.appService.getHello();
  }
}
