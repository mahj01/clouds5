import { Controller, Get, Post, Body, Param, Put, Delete, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { SynchronisationsService } from './synchronisations.service';
import { CreateSynchronisationDto } from './dto/create-synchronisation.dto';
import { UpdateSynchronisationDto } from './dto/update-synchronisation.dto';

@ApiTags('synchronisations')
@Controller('synchronisations')
export class SynchronisationsController {
  constructor(private readonly svc: SynchronisationsService) {}

  @Get()
  @ApiOperation({ summary: 'List synchronisations' })
  @ApiResponse({ status: 200, description: 'List returned.' })
  findAll() {
    return this.svc.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }
  @Post()
  create(@Body() dto: CreateSynchronisationDto) {
    return this.svc.create(dto);
  }
  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSynchronisationDto) {
    return this.svc.update(id, dto);
  }
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
