import { BookingResponse, ShowingSeatResponse } from '../responses.js';
import { ShowingsService } from '../showings/showings.service.js';
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
import { CreateBookingDto } from '../dto.js';
import { BookingsService } from './bookings.service.js';
@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(
    private readonly service: BookingsService,
    private readonly showings: ShowingsService,
  ) {}
  @Get('bookings')
  @ApiResponse({
    status: 200,
    description: 'All bookings',
    type: [BookingResponse],
  })
  all() {
    return this.service.all();
  }
  @Get('showings/:id/seats')
  @ApiParam({ name: 'id', schema: objectIdSchema })
  @ApiResponse({
    status: 200,
    description: 'Hall seats with isBooked',
    type: [ShowingSeatResponse],
  })
  @ApiResponse({ status: 400, description: 'Invalid ObjectId' })
  @ApiResponse({ status: 404, description: 'Showing not found' })
  seats(@Param('id', ObjectIdPipe) id: ParsedObjectId) {
    return this.showings.seats(id);
  }
  @Get('showings/:id/bookings')
  @ApiParam({ name: 'id', schema: objectIdSchema })
  @ApiResponse({
    status: 200,
    description: 'Showing bookings',
    type: [BookingResponse],
  })
  @ApiResponse({ status: 400, description: 'Invalid ObjectId' })
  @ApiResponse({ status: 404, description: 'Showing not found' })
  list(@Param('id', ObjectIdPipe) id: ParsedObjectId) {
    return this.service.forShowing(id);
  }
  @Post('showings/:id/bookings')
  @ApiParam({ name: 'id', schema: objectIdSchema })
  @ApiResponse({
    status: 201,
    description: 'Booking created atomically',
    type: BookingResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid, duplicate or out-of-bounds seats',
  })
  @ApiResponse({ status: 404, description: 'Showing not found' })
  @ApiResponse({ status: 409, description: 'Seat already booked' })
  create(
    @Param('id', ObjectIdPipe) id: ParsedObjectId,
    @Body() d: CreateBookingDto,
  ) {
    return this.service.create(id, d.seats);
  }
  @Delete('bookings/:id')
  @ApiParam({ name: 'id', schema: objectIdSchema })
  @HttpCode(204)
  @ApiResponse({ status: 204, description: 'Cancelled; seats released' })
  @ApiResponse({ status: 400, description: 'Invalid ObjectId' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  remove(@Param('id', ObjectIdPipe) id: ParsedObjectId) {
    return this.service.remove(id);
  }
}
