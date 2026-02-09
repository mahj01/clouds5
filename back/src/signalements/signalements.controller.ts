import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  ParseIntPipe,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { SignalementsService } from './signalements.service';
import { CreateSignalementDto } from './dto/create-signalement.dto';
import { UpdateSignalementDto } from './dto/update-signalement.dto';

@ApiTags('signalements')
@ApiBearerAuth()
@Controller('signalements')
export class SignalementsController {
  constructor(private readonly svc: SignalementsService) {}

  @Get()
  @ApiOperation({ summary: 'List all signalements' })
  @ApiResponse({ status: 200, description: 'List returned.' })
  findAll() {
    return this.svc.findAll();
  }

  @Get('actifs')
  @ApiOperation({ summary: 'List active signalements' })
  findAllActifs() {
    return this.svc.findAllActifs();
  }

  @Get('statut/:statut')
  @ApiOperation({ summary: 'List signalements by status' })
  findByStatut(@Param('statut') statut: string) {
    return this.svc.findByStatut(statut);
  }

  @Get('type/:typeId')
  @ApiOperation({ summary: 'List signalements by type' })
  findByType(@Param('typeId', ParseIntPipe) typeId: number) {
    return this.svc.findByType(typeId);
  }

  @Get('geojson')
  @ApiOperation({ summary: 'Get signalements as GeoJSON' })
  @ApiQuery({ name: 'statut', required: false })
  getGeoJSON(@Query('statut') statut?: string) {
    return this.svc.getGeoJSON(statut);
  }

  @Get('statistiques')
  @ApiOperation({ summary: 'Get signalements statistics' })
  getStatistiques() {
    return this.svc.getStatistiques();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get signalement by ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create signalement' })
  create(@Body() dto: CreateSignalementDto) {
    return this.svc.create(dto);
  }

  @Post(':id/resoudre')
  @ApiOperation({ summary: 'Resolve a signalement' })
  resoudre(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { utilisateurResolutionId: number; commentaire?: string },
  ) {
    return this.svc.resoudre(
      id,
      body.utilisateurResolutionId,
      body.commentaire,
    );
  }

  @Post(':id/photo')
  @ApiOperation({ summary: 'Upload photo for a signalement' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `signalement-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpeg|png|gif|webp)$/)) {
          return cb(
            new BadRequestException(
              'Seuls les fichiers image (JPEG, PNG, GIF, WebP) sont autorisés.',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadPhoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('Aucun fichier fourni.');
    const photoUrl = `/uploads/${file.filename}`;
    await this.svc.updatePhoto(id, photoUrl);
    return { photoUrl };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update signalement' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSignalementDto,
  ) {
    return this.svc.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete signalement' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
