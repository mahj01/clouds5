import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SignalementsService } from './signalements.service';
import { CreateSignalementDto } from './dto/create-signalement.dto';
import { UpdateSignalementDto } from './dto/update-signalement.dto';

@ApiTags('signalements')
@ApiBearerAuth()
@Controller('signalements')
export class SignalementsController {
  constructor(private readonly svc: SignalementsService) {}

  @Get()
  @ApiOperation({ summary: 'List signalements' })
  @ApiResponse({ status: 200, description: 'List returned.' })
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }
  @Post()
  create(@Body() dto: CreateSignalementDto) {
    return this.svc.create(dto);
  }
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSignalementDto) {
    return this.svc.update(id, dto);
  }
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
