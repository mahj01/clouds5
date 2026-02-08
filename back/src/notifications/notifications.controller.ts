import { Controller, Get, Post, Param, ParseIntPipe, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @Get('user/:id')
  @ApiOperation({ summary: 'Récupérer les notifications d\'un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur', type: Number })
  @ApiOkResponse({ description: 'Liste des notifications.' })
  findByUser(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findByUtilisateur(id);
  }

  @Get('user/:id/unread-count')
  @ApiOperation({ summary: 'Compter les notifications non lues d\'un utilisateur' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur', type: Number })
  @ApiOkResponse({ description: 'Nombre de notifications non lues.' })
  async countUnread(@Param('id', ParseIntPipe) id: number) {
    const count = await this.svc.countUnread(id);
    return { count };
  }

  @Get('firebase/:firebaseUid')
  @ApiOperation({ summary: 'Récupérer les notifications via Firebase UID' })
  @ApiParam({ name: 'firebaseUid', description: 'Firebase UID de l\'utilisateur', type: String })
  @ApiOkResponse({ description: 'Liste des notifications.' })
  findByFirebaseUid(@Param('firebaseUid') firebaseUid: string) {
    return this.svc.findByFirebaseUid(firebaseUid);
  }

  @Get('firebase/:firebaseUid/unread-count')
  @ApiOperation({ summary: 'Compter les notifications non lues via Firebase UID' })
  @ApiParam({ name: 'firebaseUid', description: 'Firebase UID de l\'utilisateur', type: String })
  @ApiOkResponse({ description: 'Nombre de notifications non lues.' })
  async countUnreadByFirebaseUid(@Param('firebaseUid') firebaseUid: string) {
    const count = await this.svc.countUnreadByFirebaseUid(firebaseUid);
    return { count };
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  @ApiParam({ name: 'id', description: 'ID de la notification', type: Number })
  @ApiOkResponse({ description: 'Notification marquée comme lue.' })
  markAsRead(@Param('id', ParseIntPipe) id: number) {
    return this.svc.markAsRead(id);
  }

  @Post('user/:id/read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications d\'un utilisateur comme lues' })
  @ApiParam({ name: 'id', description: 'ID de l\'utilisateur', type: Number })
  @ApiOkResponse({ description: 'Toutes les notifications marquées comme lues.' })
  async markAllAsRead(@Param('id', ParseIntPipe) id: number) {
    await this.svc.markAllAsRead(id);
    return { success: true };
  }

  @Post('firebase/:firebaseUid/read-all')
  @ApiOperation({ summary: 'Marquer toutes les notifications comme lues via Firebase UID' })
  @ApiParam({ name: 'firebaseUid', description: 'Firebase UID de l\'utilisateur', type: String })
  @ApiOkResponse({ description: 'Toutes les notifications marquées comme lues.' })
  async markAllAsReadByFirebaseUid(@Param('firebaseUid') firebaseUid: string) {
    await this.svc.markAllAsReadByFirebaseUid(firebaseUid);
    return { success: true };
  }
}
