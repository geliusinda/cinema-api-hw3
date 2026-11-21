import { ApiProperty } from '@nestjs/swagger';
import type { Types } from 'mongoose';
import { objectIdSchema } from './database/object-id.pipe.js';
import { SeatDto } from './dto.js';
import type { Film } from './films/film.schema.js';
import type { Hall } from './halls/hall.schema.js';
import type {
  EmbeddedBooking,
  Showing,
  ShowingSeat,
} from './showings/showing.schema.js';

export class FilmResponse {
  @ApiProperty(objectIdSchema) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() durationMinutes!: number;
  @ApiProperty() releaseYear!: number;

  static from(
    this: void,
    { _id, title, durationMinutes, releaseYear }: Film,
  ): FilmResponse {
    return { id: _id.toHexString(), title, durationMinutes, releaseYear };
  }
}

export class HallResponse {
  @ApiProperty(objectIdSchema) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() rows!: number;
  @ApiProperty() seatsPerRow!: number;

  static from(
    this: void,
    { _id, name, rows, seatsPerRow }: Hall,
  ): HallResponse {
    return { id: _id.toHexString(), name, rows, seatsPerRow };
  }
}

export class HallWithSeatsResponse extends HallResponse {
  @ApiProperty({ type: [SeatDto] }) seats!: SeatDto[];
}

export class ShowingCreatedResponse {
  @ApiProperty(objectIdSchema) id!: string;
  @ApiProperty(objectIdSchema) filmId!: string;
  @ApiProperty(objectIdSchema) hallId!: string;
  @ApiProperty({ format: 'date-time' }) startsAt!: string;
  @ApiProperty() price!: number;

  static from(
    this: void,
    { _id, film, hall, startsAt, price }: Showing,
  ): ShowingCreatedResponse {
    return {
      id: _id.toHexString(),
      filmId: film.toHexString(),
      hallId: hall.toHexString(),
      startsAt: startsAt.toISOString(),
      price,
    };
  }
}

export class ShowingSeatResponse extends SeatDto {
  @ApiProperty() isBooked!: boolean;

  static from(
    this: void,
    { row, seat, bookingId }: ShowingSeat,
  ): ShowingSeatResponse {
    return { row, seat, isBooked: bookingId !== null };
  }
}

export class BookingResponse {
  @ApiProperty(objectIdSchema) id!: string;
  @ApiProperty(objectIdSchema) showingId!: string;
  @ApiProperty({ type: [SeatDto] }) seats!: SeatDto[];
  @ApiProperty() totalPrice!: number;

  static from(
    this: void,
    showingId: Types.ObjectId,
    { _id, seats, totalPrice }: EmbeddedBooking,
  ): BookingResponse {
    return {
      id: _id.toHexString(),
      showingId: showingId.toHexString(),
      seats: seats.map(({ row, seat }) => ({ row, seat })),
      totalPrice,
    };
  }
}
