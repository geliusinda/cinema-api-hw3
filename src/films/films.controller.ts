import { FilmResponse } from '../responses.js';
import type { ParsedObjectId } from '../database/object-id.pipe.js';
import { ObjectIdPipe, objectIdSchema } from '../database/object-id.pipe.js';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateFilmDto, UpdateFilmDto } from '../dto.js';
import { FilmsService } from './films.service.js';
@ApiTags('films')
@Controller('films')
export class FilmsController {
  constructor(private readonly service: FilmsService) {}
  @Post()
  @ApiResponse({ status: 201, description: 'Created', type: FilmResponse })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() data: CreateFilmDto) {
    return this.service.create(data);
  }
  @Get()
  @ApiResponse({
    status: 200,
    description: 'All records',
    type: [FilmResponse],
  })
  all() {
    return this.service.all();
  }
  @Get(':id')
  @ApiParam({ name: 'id', schema: objectIdSchema })
  @ApiResponse({ status: 200, description: 'Record', type: FilmResponse })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 400, description: 'Invalid ObjectId' })
  get(@Param('id', ObjectIdPipe) id: ParsedObjectId) {
    return this.service.get(id);
  }
  @Patch(':id')
  @ApiParam({ name: 'id', schema: objectIdSchema })
  @ApiResponse({ status: 200, description: 'Updated film', type: FilmResponse })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'Not found' })
  update(
    @Param('id', ObjectIdPipe) id: ParsedObjectId,
    @Body() data: UpdateFilmDto,
  ) {
    return this.service.update(id, data);
  }
  @Delete(':id')
  @ApiParam({ name: 'id', schema: objectIdSchema })
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 400, description: 'Invalid ObjectId' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 409, description: 'Referenced by showing' })
  remove(@Param('id', ObjectIdPipe) id: ParsedObjectId) {
    return this.service.remove(id);
  }
}
