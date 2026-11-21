import { ShowingCreatedResponse } from '../responses.js';
import type { ParsedObjectId } from '../database/object-id.pipe.js';
import { ObjectIdPipe, objectIdSchema } from '../database/object-id.pipe.js';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateShowingDto, ShowingQueryDto } from '../dto.js';
import { ShowingItemDto, ShowingPageDto } from './showing-page.dto.js';
import { ShowingsService } from './showings.service.js';
@ApiTags('showings')
@Controller('showings')
export class ShowingsController {
  constructor(private readonly service: ShowingsService) {}
  @Post()
  @ApiResponse({
    status: 201,
    description: 'Created showing',
    type: ShowingCreatedResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid field, missing film/hall or past start',
  })
  create(@Body() d: CreateShowingDto) {
    return this.service.create(d);
  }
  @Get()
  @ApiResponse({
    status: 200,
    description: 'Filtered schedule with filmTitle and hallName',
    type: ShowingPageDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid filmId, date, page, limit or sort',
  })
  all(@Query() q: ShowingQueryDto) {
    return this.service.all(q);
  }
  @Get(':id')
  @ApiParam({ name: 'id', schema: objectIdSchema })
  @ApiResponse({
    status: 200,
    description: 'Showing with filmTitle and hallName',
    type: ShowingItemDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid ObjectId' })
  @ApiResponse({ status: 404, description: 'Showing not found' })
  get(@Param('id', ObjectIdPipe) id: ParsedObjectId) {
    return this.service.get(id);
  }
}
