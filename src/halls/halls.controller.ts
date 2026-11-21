import { HallResponse, HallWithSeatsResponse } from '../responses.js';
import type { ParsedObjectId } from '../database/object-id.pipe.js';
import { ObjectIdPipe, objectIdSchema } from '../database/object-id.pipe.js';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
} from '@nestjs/common';
import { ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateHallDto } from '../dto.js';
import { HallsService } from './halls.service.js';
@ApiTags('halls')
@Controller('halls')
export class HallsController {
  constructor(private readonly service: HallsService) {}
  @Post()
  @ApiResponse({ status: 201, description: 'Created', type: HallResponse })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Duplicate hall name' })
  create(@Body() data: CreateHallDto) {
    return this.service.create(data);
  }
  @Get()
  @ApiResponse({
    status: 200,
    description: 'All records',
    type: [HallResponse],
  })
  all() {
    return this.service.all();
  }
  @Get(':id')
  @ApiParam({ name: 'id', schema: objectIdSchema })
  @ApiResponse({
    status: 200,
    description: 'Record with generated seats',
    type: HallWithSeatsResponse,
  })
  @ApiResponse({ status: 404, description: 'Not found' })
  @ApiResponse({ status: 400, description: 'Invalid ObjectId' })
  async get(@Param('id', ObjectIdPipe) id: ParsedObjectId) {
    const hall = await this.service.get(id);
    const { name, rows, seatsPerRow } = hall;
    return {
      id: hall.id,
      name,
      rows,
      seatsPerRow,
      seats: this.service.seats(hall),
    };
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
